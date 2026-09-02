'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, Bell, Check, Compass, Grid, IndianRupee, Layers, Loader2, LocateFixed, Map as MapIcon, MapPin, Minus, Navigation, RefreshCw, Search, ShieldCheck, Trophy, X } from 'lucide-react'
import { Language } from './krishi-mitra-app'
import { getAvailableCrops } from '@/lib/actions/crop-actions'
import { placeBid, getBidsForLot } from '@/lib/actions/bid-actions'
import { getNotificationsForUser, markNotificationRead } from '@/lib/actions/notification-actions'
import type { AppNotification, Bid, CropLot } from '@/types/database'
import InteractiveMap from '@/components/InteractiveMap'
import { formatDistance, getCurrentUserPosition } from '@/lib/geo-utils'

type Props = { userName: string; onLogout: () => void; onProfile: () => void; onMyBids: () => void }

const priceRows = [['Onion', '₹29.20 / kg', 'up', '+8.4%'], ['Basmati Rice', '₹35.60 / kg', 'up', '+4.1%'], ['Tur Dal', '₹83.50 / kg', 'down', '-2.6%'], ['Wheat', '₹24.80 / kg', 'stable', '+0.3%']] as const

function Trend({ type, text }: { type: 'up' | 'down' | 'stable'; text: string }) {
  const Icon = type === 'up' ? ArrowUp : type === 'down' ? ArrowDown : Minus
  return <span className={`market-trend ${type}`}><Icon className="size-3" />{text}</span>
}

export default function BuyerDashboardScreen({ userName, onLogout, onProfile, onMyBids }: Props) {
  const [view, setView] = useState<'buy' | 'trending'>('buy')
  const [layoutMode, setLayoutMode] = useState<'grid' | 'map'>('grid')
  const [sortBy, setSortBy] = useState<'distance' | 'highestBid' | 'priceAsc' | 'priceDesc' | 'newest'>('distance')
  const [query, setQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('Any quality grade')
  const [regionFilter, setRegionFilter] = useState('All regions')
  const [nearMeOnly, setNearMeOnly] = useState(false)
  const [buyerLocation, setBuyerLocation] = useState<string | null>(null)
  const [buyerCoords, setBuyerCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [safeOnly, setSafeOnly] = useState(false)
  const [lots, setLots] = useState<CropLot[]>([])
  const [loadingLots, setLoadingLots] = useState(true)
  const [selected, setSelected] = useState<CropLot | null>(null)
  const [offer, setOffer] = useState('')
  const [lotBids, setLotBids] = useState<Bid[]>([])
  const [loadingLotBids, setLoadingLotBids] = useState(false)
  const [offerSent, setOfferSent] = useState(false)
  const [offerError, setOfferError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [notifOpen, setNotifOpen] = useState(false)

  // Detect GPS position on mount
  useEffect(() => {
    async function detectPosition() {
      setGpsLoading(true)
      const pos = await getCurrentUserPosition()
      if (pos) {
        setBuyerCoords(pos)
      }
      setGpsLoading(false)
    }
    detectPosition()
  }, [])

  // Fetch live crop lots from Supabase PostgreSQL database with coordinates, bids, and distance
  const fetchLots = useCallback(async () => {
    const result = await getAvailableCrops({
      safeOnly,
      grade: gradeFilter,
      location: regionFilter !== 'All regions' ? regionFilter : undefined,
      matchBuyerLocation: nearMeOnly,
      buyerLat: buyerCoords?.lat,
      buyerLng: buyerCoords?.lng,
      sortByDistance: sortBy === 'distance',
    })
    if (result.data) {
      setLots(result.data as CropLot[])
    } else {
      setLots([])
    }
    if (result.buyerLocation) {
      setBuyerLocation(result.buyerLocation)
    }
    if (result.buyerCoords && !buyerCoords) {
      setBuyerCoords(result.buyerCoords)
    }
    setLoadingLots(false)
  }, [safeOnly, gradeFilter, regionFilter, nearMeOnly, buyerCoords, sortBy])

  useEffect(() => {
    fetchLots()
    // Live competitive polling every 3 seconds for instant auction sync
    const interval = setInterval(fetchLots, 3000)
    return () => clearInterval(interval)
  }, [fetchLots])

  useEffect(() => {
    async function loadNotifications() {
      const res = await getNotificationsForUser()
      if (res.data) setNotifications(res.data)
    }
    loadNotifications()
  }, [])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications])

  const visible = useMemo(() => {
    const filtered = lots.filter((lot) => {
      const matchQuery = lot.crop_name.toLowerCase().includes(query.toLowerCase()) || lot.location.toLowerCase().includes(query.toLowerCase())
      const matchSafe = !safeOnly || lot.pesticide_safe_flag
      const matchGrade = gradeFilter === 'Any quality grade' || lot.grade === gradeFilter.replace('Grade ', '').replace(' Certified', '')
      return matchQuery && matchSafe && matchGrade
    })

    if (sortBy === 'distance') {
      return [...filtered].sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999))
    }
    if (sortBy === 'highestBid') {
      return [...filtered].sort((a, b) => (b.highest_bid_per_kg ?? 0) - (a.highest_bid_per_kg ?? 0))
    }
    if (sortBy === 'priceAsc') {
      return [...filtered].sort((a, b) => a.asking_price_per_quintal - b.asking_price_per_quintal)
    }
    if (sortBy === 'priceDesc') {
      return [...filtered].sort((a, b) => b.asking_price_per_quintal - a.asking_price_per_quintal)
    }
    return filtered
  }, [lots, query, safeOnly, gradeFilter, sortBy])

  const openOffer = useCallback(async (lot: CropLot) => {
    setSelected(lot)
    const initialPricePerKg = lot.user_bid_per_kg
      ? Number(lot.user_bid_per_kg)
      : lot.highest_bid_per_kg
        ? Number((lot.highest_bid_per_kg + 0.5).toFixed(2))
        : Number((lot.asking_price_per_quintal / 100).toFixed(2))

    setOffer(String(initialPricePerKg))
    setOfferSent(false)
    setOfferError('')
    
    // Fetch live bids for this lot
    setLoadingLotBids(true)
    const bidsResult = await getBidsForLot(lot.id)
    if (bidsResult.data) {
      setLotBids(bidsResult.data)
    } else {
      setLotBids([])
    }
    setLoadingLotBids(false)
  }, [])

  async function submitOffer() {
    if (!offer || !selected) return
    const pricePerKg = Number(offer)
    if (isNaN(pricePerKg) || pricePerKg <= 0) {
      setOfferError('Enter a valid bid price per kg (> 0).')
      return
    }

    setIsSubmitting(true)
    setOfferError('')
    try {
      const result = await placeBid(selected.id, pricePerKg)

      if (result.error && !result.error.includes('fetch') && !result.error.includes('URL') && !result.error.includes('authenticated')) {
        setOfferError(result.error)
        return
      }

      // Re-fetch bids for this lot to display live update
      const refreshedBids = await getBidsForLot(selected.id)
      if (refreshedBids.data) setLotBids(refreshedBids.data)
      setOfferSent(true)
      await fetchLots()
    } catch (err: any) {
      setOfferError(err?.message || 'Failed to submit bid')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDismissNotification(id: string) {
    await markNotificationRead(id)
    setNotifications((curr) => curr.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
  }

  const triggerGpsLocate = async () => {
    setGpsLoading(true)
    const pos = await getCurrentUserPosition()
    if (pos) {
      setBuyerCoords(pos)
      setNearMeOnly(true)
    }
    setGpsLoading(false)
  }

  const hasExistingBid = selected?.user_bid_per_kg !== undefined && selected.user_bid_per_kg !== null

  return (
    <div className="min-h-screen bg-background">
      <header className="topbar">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-serif text-lg font-bold text-foreground">कृषि-मित्र</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p>
          </div>
          <span className="hidden rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-primary md:inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span> Live Dynamic Auction Synced
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen(!notifOpen)}
              className="icon-button relative"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && <span className="notification-dot" />}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border bg-card p-4 shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notifications</p>
                  <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                </div>
                <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No new notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleDismissNotification(n.id)}
                        className={`cursor-pointer rounded-xl p-2.5 text-xs transition-colors ${n.is_read ? 'bg-secondary/40 text-muted-foreground' : 'bg-primary/10 text-foreground font-semibold border border-primary/20'}`}
                      >
                        <p>{n.message}</p>
                        <span className="text-[10px] text-muted-foreground mt-1 block">{new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <Language />
          <button onClick={onProfile} className="buyer-avatar-button"><span className="buyer-avatar">{userName.charAt(0).toUpperCase()}</span><span className="hidden sm:block">{userName}<small>Verified buyer</small></span></button>
          <button onClick={onLogout} className="secondary-button">Logout</button>
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar buyer-sidebar">
          <div className="farmer-sidebar-nav">
            <p className="eyebrow">Buyer desk</p>
            <button onClick={() => setView('buy')} className={`side-nav ${view === 'buy' ? 'active' : ''}`}><IndianRupee className="size-5" />Buyer Marketplace</button>
            <button onClick={onMyBids} className="side-nav"><Check className="size-5" />Active Bids</button>
            <button onClick={() => setView('trending')} className={`side-nav ${view === 'trending' ? 'active' : ''}`}><ArrowUp className="size-5" />Trending Market</button>
          </div>
        </aside>

        <main className="buyer-dashboard dashboard-main mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Live Auction &amp; Geolocation</p>
              <h1 className="mt-2 text-3xl font-bold">Dynamic Marketplace &amp; Counter-Bidding</h1>
              <p className="mt-2 text-sm text-muted-foreground">Competitive live bidding · Transparent highest price · OpenStreetMap GPS navigation</p>
            </div>
            <div className="flex items-center gap-2">
              {buyerLocation && (
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                  <MapPin className="size-3.5" /> <strong>{buyerLocation}</strong>
                </div>
              )}
              <button
                type="button"
                onClick={triggerGpsLocate}
                disabled={gpsLoading}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-foreground shadow-sm hover:bg-secondary"
                title="Get GPS location"
              >
                <LocateFixed className={`size-3.5 ${gpsLoading ? 'animate-spin text-primary' : ''}`} />
                {gpsLoading ? 'Locating…' : 'GPS Near Me'}
              </button>
            </div>
          </div>

          <div className="buyer-tabs flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="buyer-view-label">{view === 'buy' ? 'Live Marketplace Listings' : 'Trending Mandi Prices'}</span>
              <span className="text-xs text-muted-foreground">({visible.length} harvest lots)</span>
            </div>

            {view === 'buy' && (
              <div className="flex items-center gap-2 bg-secondary/80 p-1 rounded-xl border border-border/80">
                <button
                  type="button"
                  onClick={() => setLayoutMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    layoutMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Grid className="size-3.5" /> Grid View
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('map')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    layoutMode === 'map' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MapIcon className="size-3.5" /> 🗺️ Map View
                </button>
              </div>
            )}
          </div>

          {view === 'buy' ? (
            <>
              <section className="buyer-filters">
                <div className="buyer-filter-row">
                  <label className="buyer-search"><Search className="size-4" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search crops or mandi location" /></label>
                  <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                    <option>Any quality grade</option>
                    <option>Grade A</option>
                    <option>Grade B</option>
                    <option>Grade C</option>
                    <option>Organic Certified</option>
                  </select>
                  <select value={regionFilter} onChange={(e) => { setRegionFilter(e.target.value); setNearMeOnly(false) }}>
                    <option value="All regions">All regions</option>
                    <option value="Pune">Pune</option>
                    <option value="Nashik">Nashik</option>
                    <option value="Indore">Indore</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                  </select>
                  <select value={sortBy} onChange={(e: any) => setSortBy(e.target.value)}>
                    <option value="distance">📍 Sort: Nearest First</option>
                    <option value="highestBid">🏆 Sort: Highest Bid First</option>
                    <option value="newest">🕒 Sort: Newest First</option>
                    <option value="priceAsc">💰 Asking Price: Low to High</option>
                    <option value="priceDesc">💰 Asking Price: High to Low</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="safe-toggle"><input type="checkbox" checked={safeOnly} onChange={(e) => setSafeOnly(e.target.checked)} /> <ShieldCheck className="size-4" /> Show only verified-safe listings</label>
                  <span className="text-xs text-muted-foreground">⚡ Live real-time bids sync automatically every 3 seconds</span>
                </div>
              </section>

              {/* View Mode: Interactive OpenStreetMap vs Grid */}
              {layoutMode === 'map' ? (
                <section className="mt-4 space-y-4">
                  <InteractiveMap
                    userLocation={buyerCoords}
                    userLabel={buyerLocation ? `You (${buyerLocation})` : 'Your Position'}
                    lots={visible}
                    onSelectLot={openOffer}
                    height="580px"
                    zoom={10}
                  />
                  <div className="rounded-2xl border border-border bg-card p-4 text-xs">
                    <p className="font-bold text-foreground mb-2">📌 Click any green crop pin above to view quantity, asking price, current highest bid, and place a counter-offer.</p>
                    <p className="text-muted-foreground">Map tiles powered by 100% free OpenStreetMap &amp; Leaflet. Distances calculated directly from farmgate GPS coordinates.</p>
                  </div>
                </section>
              ) : (
                <section className="buyer-lots">
                  {loadingLots ? (
                    <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
                      <Loader2 className="size-5 animate-spin" /> Loading live crops with GPS coordinates &amp; highest bids…
                    </div>
                  ) : visible.length === 0 ? (
                    <div className="py-20 text-center text-sm text-muted-foreground rounded-2xl border border-dashed border-border bg-card/40 p-8">
                      <MapPin className="mx-auto size-8 text-muted-foreground/60 mb-2" />
                      <p className="font-semibold text-foreground">No crops found matching your filters</p>
                      <p className="mt-1 text-xs text-muted-foreground">Try clearing your search query or selecting &quot;All regions&quot; to browse all available harvest lots.</p>
                      <button
                        onClick={() => { setQuery(''); setGradeFilter('Any quality grade'); setRegionFilter('All regions'); setNearMeOnly(false); setSafeOnly(false); setSortBy('distance') }}
                        className="mt-4 rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary/80"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                      visible.map((lot) => (
                        <article key={lot.id} className="buyer-lot-card relative group">
                          <div className="buyer-lot-visual">
                            <span>{(lot.crop_name || 'Crop').split(' ').slice(-1)[0]}</span>
                            <b>Grade {lot.grade || 'A'}</b>
                          </div>
                          <div className="buyer-lot-body">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h2 className="font-bold text-base text-foreground">{lot.crop_name || 'Harvest Lot'}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="size-3 text-primary" />
                                    {lot.location || 'Location pending'}
                                  </p>
                                  {lot.distance_km !== undefined && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                                      📍 {formatDistance(lot.distance_km)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Trend type={lot.pesticide_safe_flag ? 'up' : 'stable'} text={lot.pesticide_safe_flag ? '+safe' : '~verify'} />
                            </div>

                            <div className="buyer-lot-meta mt-2">
                              <span className={lot.pesticide_safe_flag ? 'safe' : 'unknown'}>{lot.pesticide_safe_flag ? '✅ Safe to sell' : '❓ Cannot verify'}</span>
                              {lot.needs_transport && <span className="ml-2 text-[11px] text-muted-foreground">🚛 Transport needed</span>}
                            </div>

                            {/* Dynamic Competitive Bidding Line */}
                            <div className="mt-3 rounded-xl border border-border/80 bg-secondary/40 p-2.5 text-xs flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-500 font-bold">🏆</span>
                                {lot.highest_bid_per_kg ? (
                                  <span className="font-semibold text-foreground">
                                    Current Highest Bid: <strong className="text-primary font-bold">₹{Number(lot.highest_bid_per_kg).toFixed(2)} / kg</strong>
                                    <span className="text-[10px] text-muted-foreground ml-1">({lot.bids_count || lot.bids?.length || 1} offer{lot.bids_count !== 1 ? 's' : ''})</span>
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic">No bids yet · Be the first to bid</span>
                                )}
                              </div>
                              {lot.user_bid_per_kg ? (
                                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                                  Your Bid: ₹{Number(lot.user_bid_per_kg).toFixed(2)}/kg
                                </span>
                              ) : null}
                            </div>

                            <div className="buyer-lot-footer mt-3">
                              <span>
                                {lot.farmer?.full_name ?? 'Verified Farmer'}
                                <small>{lot.quantity_quintal || 0} Q ({(Number(lot.quantity_quintal) || 0) * 100} kg)</small>
                              </span>
                              <strong>
                                ₹{((Number(lot.asking_price_per_quintal) || 0) / 100).toFixed(2)}
                                <small>Asking price / kg (₹{(Number(lot.asking_price_per_quintal) || 0).toLocaleString('en-IN')}/Q)</small>
                              </strong>
                            </div>

                            <button onClick={() => openOffer(lot)} className="make-offer-button mt-3">
                              {lot.user_bid_per_kg ? 'Submit Counter-Offer' : 'Place Bid / Offer'} <ArrowRight className="size-4" />
                            </button>
                          </div>
                        </article>
                      ))
                  )}
                </section>
              )}
            </>
          ) : (
            <section className="buyer-trending">
              <div className="buyer-price-panel">
                <div className="market-section-title"><h2>Live mandi prices</h2><span className="live-dot">● Live ticker</span></div>
                {priceRows.map(([crop, price, trend, percent]) => (
                  <div className="market-price-row" key={crop}>
                    <div><strong>{crop}</strong><small>Updated 12 min ago</small></div>
                    <b>{price}</b>
                    <Trend type={trend} text={percent} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Place Bid / Counter-Bargain Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <p className="eyebrow">{hasExistingBid ? 'Dynamic Counter-Bidding' : 'Live Bidding / Bargain'}</p>
                <h2 className="mt-1 font-serif text-2xl font-bold">{selected.crop_name}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="size-5" /></button>
            </div>

            <div className="mt-4 rounded-2xl bg-secondary/50 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Farmer &amp; Mandi:</span>
                <strong>{selected.farmer?.full_name || 'Verified Farmer'} · {selected.location}</strong>
              </div>
              {selected.distance_km !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proximity:</span>
                  <strong className="text-primary font-bold">📍 {formatDistance(selected.distance_km)}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Harvest:</span>
                <strong>{selected.quantity_quintal} Quintals ({selected.quantity_quintal * 100} kg)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asking Price:</span>
                <strong className="text-primary font-bold">₹{(selected.asking_price_per_quintal / 100).toFixed(2)} / kg (₹{selected.asking_price_per_quintal.toLocaleString('en-IN')}/Q)</strong>
              </div>
              {selected.highest_bid_per_kg ? (
                <div className="flex justify-between border-t border-border/80 pt-2 text-amber-900 dark:text-amber-200">
                  <span className="font-semibold flex items-center gap-1">🏆 Current Highest Offer:</span>
                  <strong className="text-amber-600 dark:text-amber-400 font-bold">₹{Number(selected.highest_bid_per_kg).toFixed(2)} / kg</strong>
                </div>
              ) : null}
            </div>

            {hasExistingBid && (
              <div className="mt-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-3 text-xs text-blue-900 dark:text-blue-200">
                <p className="font-semibold">Your previous active bid on this lot is <strong>₹{Number(selected.user_bid_per_kg).toFixed(2)} / kg</strong>.</p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">You can submit a counter-offer below to update your offer in real time without creating duplicate bids.</p>
              </div>
            )}

            {offerSent ? (
              <div className="mt-5 rounded-2xl bg-green-50 text-green-800 dark:bg-green-950/60 dark:text-green-300 p-5 text-center">
                <Check className="mx-auto size-8 text-green-600 mb-2" />
                <h3 className="font-bold text-base">{hasExistingBid ? 'Counter-Offer Updated!' : 'Bid Submitted Successfully!'}</h3>
                <p className="text-xs mt-1">Your offer (₹{Number(offer).toFixed(2)}/kg) has been synced to the farmer and marketplace live feed.</p>
                <div className="mt-4 flex gap-2 justify-center">
                  <button onClick={() => { setSelected(null); onMyBids() }} className="primary-button text-xs">
                    View in Active Bids
                  </button>
                  <button onClick={() => setSelected(null)} className="secondary-button text-xs">
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-5 space-y-4">
                  <label className="field">
                    <span className="text-xs font-bold text-foreground">
                      {hasExistingBid ? 'New Counter-Offer Price (₹ per kg)' : 'Your Bid Price (₹ per kg)'}
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={offer}
                      onChange={(e) => setOffer(e.target.value)}
                      placeholder="e.g. 35.50"
                      className="text-base font-bold"
                    />
                  </label>

                  {offer && !isNaN(Number(offer)) && (
                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-primary font-semibold">Total Payout ({selected.quantity_quintal * 100} kg):</span>
                        <strong className="text-base text-primary font-bold">
                          ₹{(Number(offer) * selected.quantity_quintal * 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  )}

                  {offerError && <p className="text-xs font-bold text-destructive">{offerError}</p>}
                </div>

                {/* Active bids on this lot */}
                <div className="mt-4 border-t border-border pt-3">
                  <p className="eyebrow">Live competing offers on this lot ({lotBids.length})</p>
                  {loadingLotBids ? (
                    <p className="text-xs text-muted-foreground py-2 flex items-center gap-1.5"><Loader2 className="size-3.5 animate-spin" /> Checking live bids…</p>
                  ) : lotBids.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 italic">No other bids yet. Be the first to bid!</p>
                  ) : (
                    <div className="mt-2 max-h-28 overflow-y-auto space-y-1.5">
                      {lotBids.map((b) => (
                        <div key={b.id} className="flex justify-between items-center bg-secondary/40 px-2.5 py-1.5 rounded-lg text-xs">
                          <span>{b.buyer?.full_name || 'Buyer'}: <strong>₹{Number(b.bid_price_per_kg || 0).toFixed(2)}/kg</strong></span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${b.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-secondary text-muted-foreground'}`}>{b.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setSelected(null)} className="secondary-button flex-1">Cancel</button>
                  <button
                    type="button"
                    onClick={submitOffer}
                    disabled={isSubmitting || !offer}
                    className="primary-button flex-1"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="size-4 animate-spin" /> Updating…</>
                    ) : hasExistingBid ? (
                      <>Submit Counter-Offer (₹{Number(offer || 0).toFixed(2)}/kg) <ArrowRight className="size-4" /></>
                    ) : (
                      <>Place Bid Offer (₹{Number(offer || 0).toFixed(2)}/kg) <ArrowRight className="size-4" /></>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
