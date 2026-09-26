'use client'

import { FormEvent, useCallback, useEffect, useState, useTransition } from 'react'
import {
  ArrowLeft, ArrowRight, Check, Info, Loader2, Lock, MapPin, Navigation,
  Truck, Users, AlertCircle, RefreshCw, WifiOff
} from 'lucide-react'
import { FarmerSidebar } from './farmer-sidebar'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'
import {
  createLogisticsRequirement,
  findPoolMatches,
  getMyLogisticsRequirements,
  joinLogisticsPool,
} from '@/lib/actions/logistics-actions'
import { TRUCK_CAPACITIES, type CostEstimate, type ProposedPool } from '@/lib/logistics-utils'
import { getCurrentUserPosition, getCoordinatesForLocation } from '@/lib/geo-utils'
import type { LogisticsRequirement, PoolStatus } from '@/types/database'
import { getSession } from '@/lib/actions/auth-actions'

type Props = { onBack: () => void; onLogout: () => void; onNavigate: (tab: string) => void }

// ─── Pool status badge ──────────────────────────────────────────────────────
function PoolStatusBadge({ status, lang }: { status: PoolStatus; lang: string }) {
  const configs: Record<PoolStatus, { label: string; cls: string }> = {
    OPEN:       { label: t('logistics.poolStatus.open', lang as any),       cls: 'bg-amber-100 text-amber-800 border-amber-200' },
    CONFIRMED:  { label: t('logistics.poolStatus.confirmed', lang as any),  cls: 'bg-green-100 text-green-800 border-green-200' },
    IN_TRANSIT: { label: t('logistics.poolStatus.inTransit', lang as any),  cls: 'bg-blue-100 text-blue-800 border-blue-200' },
    COMPLETED:  { label: t('logistics.poolStatus.completed', lang as any),  cls: 'bg-gray-100 text-gray-800 border-gray-200' },
  }
  const cfg = configs[status] ?? configs.OPEN
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ─── Cost comparison card ────────────────────────────────────────────────────
function CostPanel({ costs, lang, memberCount }: { costs: CostEstimate; lang: string; memberCount: number }) {
  const fmtRs = (n: number) => `₹${n.toLocaleString('en-IN')}`
  return (
    <>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="logistics-cost">
          <span>{t('logistics.soloCost', lang as any)}</span>
          <strong>{fmtRs(costs.soloCostRs)}</strong>
          <small>{t('logistics.soloCostDesc', lang as any)}</small>
        </div>
        <div className="logistics-cost pooled">
          <span>{t('logistics.pooledCost', lang as any)}</span>
          <strong>{fmtRs(costs.pooledCostRs)}</strong>
          <small>
            {lang === 'hi'
              ? `${memberCount} किसानों के बीच साझा`
              : lang === 'mr'
                ? `${memberCount} शेतकऱ्यांमध्ये विभागलेला`
                : `Shared across ${memberCount} farmer${memberCount !== 1 ? 's' : ''}`}
          </small>
        </div>
      </div>
      <div className="savings-banner">
        <div>
          <p className="text-sm font-semibold text-white/80">{t('logistics.estimatedSavings', lang as any)}</p>
          <strong>{fmtRs(costs.savingsRs)}</strong>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white/80">{t('logistics.totalLoad', lang as any)}</p>
          <strong>
            {costs.totalLoad.toFixed(0)}{' '}
            {lang === 'hi' ? 'कुंतल' : lang === 'mr' ? 'क्विंटल' : 'quintals'}
          </strong>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0 text-primary" />
        {t('logistics.routeKm', lang as any)}: {costs.routeDistanceKm.toFixed(1)} km
        {' · '}
        {t('logistics.remainingCapacity', lang as any)}: {costs.remainingCapacity.toFixed(0)} qt
      </div>
    </>
  )
}

// ─── Pickup route visualizer ─────────────────────────────────────────────────
function PickupRoute({
  myReq,
  matches,
  lang,
  poolStatus,
}: {
  myReq: LogisticsRequirement
  matches: LogisticsRequirement[]
  lang: string
  poolStatus?: PoolStatus | null
}) {
  const isConfirmed = poolStatus === 'CONFIRMED' || poolStatus === 'IN_TRANSIT' || poolStatus === 'COMPLETED'
  const allStops = [myReq, ...matches]
  return (
    <div className="mt-5 rounded-2xl border border-primary/15 bg-card p-5">
      <p className="eyebrow mb-4">{t('logistics.pickupRoute', lang as any)}</p>
      <div className="flex flex-col">
        {allStops.map((stop, index) => {
          const isMe = stop.id === myReq.id
          const label = isMe
            ? (lang === 'hi' ? `${stop.farmer_name} (आप)` : lang === 'mr' ? `${stop.farmer_name} (तुम्ही)` : `${stop.farmer_name} (You)`)
            : stop.farmer_name
          const distKm = isMe ? 0 : (stop.pickup_dist_km ?? 0)
          const distLabel = isMe
            ? (lang === 'hi' ? 'आपका पिकअप' : lang === 'mr' ? 'तुमचा पिकअप' : 'Your pickup')
            : `${stop.pickup_address || stop.crop} · ${distKm.toFixed(1)} km`
          const phone = isConfirmed ? stop.farmer_phone : null
          return (
            <div key={stop.id} className="relative flex items-center gap-4 py-2">
              <div className={`route-marker ${isMe ? 'active' : ''}`}>{index + 1}</div>
              {index < allStops.length - 1 && <span className="route-line" />}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-foreground">{label}</p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3" />{distLabel}
                </p>
                {!isMe && !isConfirmed && (
                  <p className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                    <Lock className="size-3" />
                    {t('logistics.privacyNotice', lang as any)}
                  </p>
                )}
                {phone && (
                  <p className="mt-0.5 text-xs font-semibold text-primary">{phone}</p>
                )}
              </div>
              <span className="tag">{stop.quantity_quintal} qt</span>
            </div>
          )
        })}
        <div className="flex items-center gap-4 py-2">
          <div className="route-marker destination"><ArrowRight className="size-4" /></div>
          <div>
            <p className="font-bold text-foreground">
              {myReq.dest_address || (lang === 'hi' ? 'गंतव्य मंडी' : lang === 'mr' ? 'गंतव्य मंडी' : 'Destination Mandi')}
            </p>
            <p className="text-sm text-muted-foreground">{t('logistics.finalDestination', lang as any)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Requirement creation form ───────────────────────────────────────────────
function CreateRequirementForm({
  lang,
  userName,
  onCreated,
}: {
  lang: string
  userName: string
  onCreated: (reqId: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsDetected, setGpsDetected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [crop, setCrop] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pickupLat, setPickupLat] = useState<number | null>(null)
  const [pickupLng, setPickupLng] = useState<number | null>(null)
  const [pickupAddr, setPickupAddr] = useState('')
  const [destAddr, setDestAddr] = useState('')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [vehicleType, setVehicleType] = useState<'mini_truck' | 'large_truck'>('mini_truck')

  const handleGps = async () => {
    setGpsLoading(true)
    const pos = await getCurrentUserPosition()
    setGpsLoading(false)
    if (pos) {
      setPickupLat(pos.lat)
      setPickupLng(pos.lng)
      setGpsDetected(true)
      if (!pickupAddr) setPickupAddr(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!crop.trim() || !quantity || !destAddr.trim()) {
      setError('Please fill in crop, quantity and destination.')
      return
    }
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) { setError('Enter a valid quantity.'); return }
    setError(null)

    // Resolve pickup coordinates: GPS → city lookup → default
    let pLat = pickupLat, pLng = pickupLng
    if (!pLat || !pLng) {
      const coord = getCoordinatesForLocation(pickupAddr)
      pLat = coord.lat; pLng = coord.lng
    }

    // Resolve destination coordinates via city lookup
    const destCoord = getCoordinatesForLocation(destAddr)

    startTransition(async () => {
      const result = await createLogisticsRequirement({
        farmer_name: userName,
        crop: crop.trim(),
        quantity_quintal: qty,
        pickup_lat: pLat!,
        pickup_lng: pLng!,
        pickup_address: pickupAddr || undefined,
        dest_lat: destCoord.lat,
        dest_lng: destCoord.lng,
        dest_address: destAddr.trim(),
        preferred_date_from: dateFrom,
        preferred_date_to: dateTo,
        vehicle_type: vehicleType,
      })
      if (result.data) onCreated(result.data.id)
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <section className="logistics-panel">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
          <Truck className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{t('logistics.createRequirement', lang as any)}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('logistics.createReqSubtitle', lang as any)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Crop */}
        <label className="field">
          <span>{t('logistics.crop', lang as any)}</span>
          <input
            value={crop}
            onChange={e => setCrop(e.target.value)}
            placeholder={lang === 'hi' ? 'जैसे: प्याज, गेहूं' : lang === 'mr' ? 'उदा: कांदा, गहू' : 'e.g. Onion, Wheat'}
            required
          />
        </label>

        {/* Quantity */}
        <label className="field">
          <span>{t('logistics.quantityQt', lang as any)}</span>
          <input
            type="number" min="1" step="0.5"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="e.g. 40"
            required
          />
        </label>

        {/* Pickup */}
        <div>
          <label className="field">
            <span>{t('logistics.pickupLocation', lang as any)}</span>
            <input
              value={pickupAddr}
              onChange={e => setPickupAddr(e.target.value)}
              placeholder={lang === 'hi' ? 'गाँव/तहसील का नाम' : lang === 'mr' ? 'गाव/तालुका नाव' : 'Village or taluka name'}
            />
          </label>
          <button
            type="button"
            onClick={handleGps}
            disabled={gpsLoading}
            className="mt-2 flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            {gpsLoading
              ? <Loader2 className="size-4 animate-spin" />
              : <Navigation className="size-4" />}
            {gpsDetected
              ? t('logistics.gpsDetected', lang as any)
              : t('logistics.useGps', lang as any)}
          </button>
        </div>

        {/* Destination */}
        <label className="field">
          <span>{t('logistics.destLocation', lang as any)}</span>
          <input
            value={destAddr}
            onChange={e => setDestAddr(e.target.value)}
            placeholder={lang === 'hi' ? 'मंडी/बाज़ार का नाम' : lang === 'mr' ? 'मंडी/बाजार नाव' : 'Mandi or buyer location name'}
            required
          />
        </label>

        {/* Date window */}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="field">
            <span>{t('logistics.dateFrom', lang as any)}</span>
            <input type="date" value={dateFrom} min={today} onChange={e => setDateFrom(e.target.value)} required />
          </label>
          <label className="field">
            <span>{t('logistics.dateTo', lang as any)}</span>
            <input type="date" value={dateTo} min={dateFrom} onChange={e => setDateTo(e.target.value)} required />
          </label>
        </div>

        {/* Vehicle */}
        <label className="field">
          <span>{t('logistics.vehicleType', lang as any)}</span>
          <select
            value={vehicleType}
            onChange={e => setVehicleType(e.target.value as 'mini_truck' | 'large_truck')}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="mini_truck">{t('logistics.miniTruck', lang as any)} — {TRUCK_CAPACITIES.mini_truck} qt</option>
            <option value="large_truck">{t('logistics.largeTruck', lang as any)} — {TRUCK_CAPACITIES.large_truck} qt</option>
          </select>
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <button type="submit" disabled={isPending} className="action-button justify-center">
          {isPending ? <Loader2 className="size-5 animate-spin" /> : <Users className="size-5" />}
          {isPending ? t('logistics.searching', lang as any) : t('logistics.submitReq', lang as any)}
        </button>
      </form>
    </section>
  )
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function LogisticsScreen({ onBack, onLogout, onNavigate }: Props) {
  const { language, setLanguage } = useLanguage()

  const [userName, setUserName] = useState('Farmer')
  const [myReqs, setMyReqs] = useState<LogisticsRequirement[]>([])
  const [activeReqId, setActiveReqId] = useState<string | null>(null)
  const [proposedPool, setProposedPool] = useState<ProposedPool | null>(null)
  const [poolStatus, setPoolStatus] = useState<PoolStatus | null>(null)

  // Loading states
  const [loadingReqs, setLoadingReqs] = useState(true)
  const [loadingPool, setLoadingPool] = useState(false)
  const [joiningPool, setJoiningPool] = useState(false)
  const [hasNetworkError, setHasNetworkError] = useState(false)

  // Toast
  const [toast, setToast] = useState<string | null>(null)

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    getSession().then(s => {
      if (s.fullName) setUserName(s.fullName)
    })
  }, [])

  // ── Load requirements ─────────────────────────────────────────────────────
  const loadMyReqs = useCallback(async () => {
    setLoadingReqs(true)
    setHasNetworkError(false)
    try {
      const result = await getMyLogisticsRequirements()
      const reqs = result.data || []
      setMyReqs(reqs)
      // Auto-select most recent active requirement
      const active = reqs.find(r => r.status === 'searching' || r.status === 'in_pool')
      if (active && !activeReqId) {
        setActiveReqId(active.id)
      }
    } catch {
      setHasNetworkError(true)
    } finally {
      setLoadingReqs(false)
    }
  }, [activeReqId])

  useEffect(() => { loadMyReqs() }, [])

  // ── Load pool matches when activeReqId changes ────────────────────────────
  useEffect(() => {
    if (!activeReqId) { setProposedPool(null); return }
    setLoadingPool(true)
    findPoolMatches(activeReqId).then(result => {
      setLoadingPool(false)
      if (result.data) {
        setProposedPool(result.data)
        setPoolStatus(result.data.myRequirement.pool_id ? 'OPEN' : null)
      }
    })
  }, [activeReqId])

  // ── Handle new requirement created ───────────────────────────────────────
  const handleReqCreated = async (reqId: string) => {
    setActiveReqId(reqId)
    await loadMyReqs()
    showToast(
      language === 'hi'
        ? 'आवश्यकता सफलतापूर्वक बनाई गई! पूल मैच ढूंढे जा रहे हैं…'
        : language === 'mr'
          ? 'आवश्यकता यशस्वीरीत्या तयार केली! वाहतूक गट शोधत आहे…'
          : 'Requirement created! Searching for pool matches…'
    )
  }

  // ── Handle join pool ──────────────────────────────────────────────────────
  const handleJoinPool = async () => {
    if (!proposedPool || !activeReqId) return
    setJoiningPool(true)
    const matchedIds = proposedPool.matches.map(m => m.id)
    const result = await joinLogisticsPool(activeReqId, matchedIds)
    setJoiningPool(false)
    if (result.data) {
      setPoolStatus(result.data.poolStatus)
      if (result.data.poolStatus === 'CONFIRMED') {
        showToast(t('logistics.communityLinked', language))
      } else {
        showToast(
          language === 'hi'
            ? `पूल में शामिल हो गए! स्थिति: ${result.data.poolStatus}`
            : language === 'mr'
              ? `वाहतूक गटात सामील झाले! स्थिती: ${result.data.poolStatus}`
              : `Joined pool! Status: ${result.data.poolStatus}`
        )
      }
      // Reload
      await loadMyReqs()
      if (activeReqId) {
        const updated = await findPoolMatches(activeReqId)
        if (updated.data) setProposedPool(updated.data)
      }
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  const steps = [
    t('logistics.step1', language),
    t('logistics.step2', language),
    t('logistics.step3', language),
    t('logistics.step4', language),
  ]

  const hasActiveReq = myReqs.some(r => r.status === 'searching' || r.status === 'in_pool')
  const isPoolJoined = poolStatus !== null

  return (
    <div className="logistics-page min-h-screen bg-background">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full bg-green-50 text-green-700 px-4 py-2.5 rounded-full shadow-lg border border-green-200 flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-4 fade-in duration-300">
          <Check className="size-4 shrink-0" /> {toast}
        </div>
      )}

      <header className="topbar">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('Overview')} className="secondary-button">
            <ArrowLeft className="size-4" /> {t('nav.dashboard', language)}
          </button>
          <div>
            <p className="font-serif text-lg font-bold text-foreground">कृषि-मित्र</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'mr')}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
            </select>
          </div>
          <button onClick={onLogout} className="secondary-button">{t('nav.logout', language)}</button>
        </div>
      </header>

      <div className="app-layout">
        <FarmerSidebar activeTab="P2P Logistics" onNavigate={onNavigate} onLogout={onLogout} />

        <main className="dashboard-main mx-auto flex max-w-6xl flex-col gap-5">
          <button
            type="button"
            onClick={() => onNavigate('Overview')}
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-4 transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t('nav.backToDashboard', language)}
          </button>

          {/* Hero */}
          <section className="logistics-hero">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Truck className="size-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{t('logistics.heroTitle', language)}</h1>
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                  {language === 'hi' ? 'लाइव डेटा' : language === 'mr' ? 'लाइव डेटा' : 'Live Data'}
                </span>
                {hasNetworkError && (
                  <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700">
                    <WifiOff className="size-3" />
                    {language === 'hi' ? 'नेटवर्क त्रुटि' : language === 'mr' ? 'नेटवर्क त्रुटी' : 'Network Error'}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm leading-6 text-white/80">{t('logistics.heroSubtitle', language)}</p>
            </div>
          </section>

          {/* My requirements list (if any) */}
          {myReqs.length > 0 && (
            <section className="logistics-panel">
              <div className="mb-4 flex items-center gap-2">
                <Check className="size-5 text-primary" />
                <h2 className="text-lg font-bold">{t('logistics.myReq', language)}</h2>
              </div>
              <div className="flex flex-col gap-2">
                {myReqs.map(req => (
                  <button
                    key={req.id}
                    onClick={() => setActiveReqId(req.id)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition hover:bg-secondary/50 ${
                      activeReqId === req.id ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground">{req.crop} · {req.quantity_quintal} qt</p>
                      <p className="text-xs text-muted-foreground">
                        {req.pickup_address || (language === 'hi' ? 'पिकअप' : 'Pickup')} → {req.dest_address || (language === 'hi' ? 'गंतव्य' : 'Dest')}
                      </p>
                      <p className="text-xs text-muted-foreground">{req.preferred_date_from} – {req.preferred_date_to}</p>
                    </div>
                    <PoolStatusBadge status={(req.status.toUpperCase() === 'SEARCHING' ? 'OPEN' : req.status.toUpperCase()) as PoolStatus} lang={language} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Pool match results */}
          {activeReqId && (
            <>
              {loadingPool ? (
                <section className="logistics-panel flex items-center justify-center gap-3 py-12">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-sm font-semibold text-muted-foreground">{t('logistics.loadingReqs', language)}</p>
                </section>
              ) : proposedPool ? (
                <section className="logistics-panel">
                  <div className="mb-5 flex items-center gap-2">
                    <Check className="size-5 text-primary" />
                    <h2 className="text-xl font-bold">{t('logistics.poolMatch', language)}</h2>
                    <span className="tag">
                      {1 + proposedPool.matches.length}{' '}
                      {language === 'hi' ? 'किसान' : language === 'mr' ? 'शेतकरी' : 'farmers'}
                    </span>
                    {poolStatus && <PoolStatusBadge status={poolStatus} lang={language} />}
                  </div>

                  {/* Pool details grid */}
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="logistics-detail">
                      <span>{t('logistics.crop', language)}</span>
                      <strong>{proposedPool.myRequirement.crop}</strong>
                    </div>
                    <div className="logistics-detail">
                      <span>{t('logistics.destination', language)}</span>
                      <strong>{proposedPool.myRequirement.dest_address || '—'}</strong>
                    </div>
                    <div className="logistics-detail">
                      <span>{t('logistics.truckCapacity', language)}</span>
                      <strong>{proposedPool.costs.truckCapacity} {language === 'hi' ? 'कुंतल' : language === 'mr' ? 'क्विंटल' : 'quintals'}</strong>
                    </div>
                  </div>

                  {/* Route visualization */}
                  <PickupRoute
                    myReq={proposedPool.myRequirement}
                    matches={proposedPool.matches}
                    lang={language}
                    poolStatus={poolStatus}
                  />

                  {/* Cost comparison */}
                  {proposedPool.matches.length > 0 ? (
                    <CostPanel
                      costs={proposedPool.costs}
                      lang={language}
                      memberCount={1 + proposedPool.matches.length}
                    />
                  ) : (
                    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">
                          {t('logistics.noMatchesYet', language)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Privacy notice */}
                  {proposedPool.matches.length > 0 && poolStatus !== 'CONFIRMED' && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                      <Lock className="size-3.5 shrink-0" />
                      {t('logistics.privacyNotice', language)}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    {proposedPool.matches.length > 0 && !isPoolJoined && (
                      <button
                        onClick={handleJoinPool}
                        disabled={joiningPool}
                        className="action-button flex-1 justify-center"
                      >
                        {joiningPool
                          ? <Loader2 className="size-5 animate-spin" />
                          : <Users className="size-5" />}
                        {joiningPool
                          ? (language === 'hi' ? 'जोड़ रहे हैं…' : language === 'mr' ? 'सामील होत आहे…' : 'Joining…')
                          : t('logistics.joinPool', language)}
                      </button>
                    )}
                    {isPoolJoined && (
                      <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
                        <Check className="size-5" />
                        {t('logistics.joinedPool', language)}
                        {poolStatus && <PoolStatusBadge status={poolStatus} lang={language} />}
                      </div>
                    )}
                    <button
                      onClick={loadMyReqs}
                      className="secondary-button h-14 justify-center px-6 gap-2"
                    >
                      <RefreshCw className="size-4" />
                      {t('logistics.findOtherPools', language)}
                    </button>
                  </div>

                  {/* Community link when confirmed */}
                  {poolStatus === 'CONFIRMED' && (
                    <button
                      onClick={() => onNavigate('Community')}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700 hover:bg-green-100 transition-colors"
                    >
                      <Users className="size-4" />
                      {language === 'hi' ? 'समुदाय में सह-किसान देखें' : language === 'mr' ? 'समुदायात सह-शेतकरी पाहा' : 'View co-farmers in Community'}
                      <ArrowRight className="size-4" />
                    </button>
                  )}
                </section>
              ) : null}
            </>
          )}

          {/* Requirement creation form (when no active req or user wants a new one) */}
          {(!hasActiveReq || !activeReqId) && !loadingReqs && (
            <CreateRequirementForm
              lang={language}
              userName={userName}
              onCreated={handleReqCreated}
            />
          )}

          {/* Loading skeleton for initial load */}
          {loadingReqs && (
            <section className="logistics-panel flex items-center justify-center gap-3 py-10">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm font-semibold text-muted-foreground">
                {t('logistics.loadingReqs', language)}
              </p>
            </section>
          )}

          {/* How it works */}
          <section className="logistics-panel">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Truck className="size-5" />
              </div>
              <h2 className="text-xl font-bold">{t('logistics.howItWorks', language)}</h2>
            </div>
            <div className="flex flex-col gap-3">
              {steps.map((step, index) => (
                <div key={index} className="logistics-step">
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
