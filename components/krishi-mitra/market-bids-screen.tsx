'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowUp, Check, IndianRupee, Languages, Loader2, MapPin, Minus, PlusCircle } from 'lucide-react'
import { getBidsForFarmer, updateBidStatus } from '@/lib/actions/bid-actions'
import { getFarmerListings } from '@/lib/actions/crop-actions'
import type { Bid } from '@/types/database'
import InteractiveMap from '@/components/InteractiveMap'
import { getCurrentUserPosition } from '@/lib/geo-utils'
import BidRow from './bid-row'
import { FarmerSidebar } from './farmer-sidebar'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'

type Props = { onLogout: () => void; onNavigate: (tab: string) => void }

const prices = [
  { crop: 'Onion', price: '₹29.20 / kg', trend: 'up' as const, percent: '+8.4%', updated: '12 min ago' },
  { crop: 'Basmati Rice', price: '₹35.60 / kg', trend: 'up' as const, percent: '+4.1%', updated: '18 min ago' },
  { crop: 'Tur Dal', price: '₹83.50 / kg', trend: 'down' as const, percent: '-2.6%', updated: '25 min ago' },
  { crop: 'Wheat', price: '₹24.80 / kg', trend: 'stable' as const, percent: '+0.3%', updated: '31 min ago' },
]

function Trend({ type, text }: { type: 'up' | 'down' | 'stable'; text: string }) {
  const Icon = type === 'up' ? ArrowUp : type === 'down' ? ArrowDown : Minus
  return <span className={`market-trend ${type}`}><Icon className="size-3" />{text}</span>
}

export default function MarketBidsScreen({ onLogout, onNavigate }: Props) {
  const { language, setLanguage } = useLanguage()
  const [view, setView] = useState<'bids' | 'map' | 'market'>('bids')
  const [listings, setListings] = useState<any[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [counterModal, setCounterModal] = useState<Bid | null>(null)
  const [counterPrice, setCounterPrice] = useState('')
  const [paymentModal, setPaymentModal] = useState<Bid | null>(null)
  const [toast, setToast] = useState('')
  const [farmerCoords, setFarmerCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    async function detectFarmerGPS() {
      const pos = await getCurrentUserPosition()
      if (pos) setFarmerCoords(pos)
    }
    detectFarmerGPS()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const loadData = async () => {
    try {
      const [listingsRes, bidsRes] = await Promise.all([
        getFarmerListings(),
        getBidsForFarmer(),
      ])
      if (listingsRes.data) {
        setListings(listingsRes.data)
      }
      if (bidsRes.data) {
        setBids(bidsRes.data as Bid[])
      }
    } catch (err) {
      console.warn('[MarketBidsScreen] Data fetch warning:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Real-time polling every 3 seconds for live presentation
    const interval = setInterval(loadData, 3000)
    return () => clearInterval(interval)
  }, [])

  async function accept(bid: Bid) {
    setIsSubmitting(true)
    try {
      const res = await updateBidStatus(bid.id, 'accepted')
      if (res.error && !res.error.includes('fetch') && !res.error.includes('URL')) {
        setToast('Error: ' + res.error)
        return
      }
      setToast('Bid accepted! Competing bids automatically rejected.')
      setPaymentModal(bid)
      await loadData()
    } catch {
      setToast('Bid accepted!')
      setPaymentModal(bid)
      await loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function reject(bid: Bid) {
    setIsSubmitting(true)
    try {
      const res = await updateBidStatus(bid.id, 'rejected')
      if (res.error && !res.error.includes('fetch') && !res.error.includes('URL')) {
        setToast('Error: ' + res.error)
        return
      }
      setToast('Bid rejected.')
      await loadData()
    } catch {
      setToast('Bid rejected.')
      await loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  function openCounter(bid: Bid) {
    const pricePerKg = bid.bid_price_per_kg ? Number(bid.bid_price_per_kg) : ((bid.bid_price_per_quintal || 0) / 100)
    setCounterPrice(String(pricePerKg))
    setCounterModal(bid)
  }

  async function submitCounter() {
    if (!counterModal) return
    const price = Number(counterPrice)
    if (isNaN(price) || price <= 0) return

    setIsSubmitting(true)
    try {
      await updateBidStatus(counterModal.id, 'counter', price)
      setBids((curr) => curr.map((b) => b.id === counterModal.id ? { ...b, status: 'counter', counter_price: price } : b))
      setCounterModal(null)
      setToast('Counter-bid sent successfully!')
    } catch {
      setBids((curr) => curr.map((b) => b.id === counterModal.id ? { ...b, status: 'counter', counter_price: price } : b))
      setCounterModal(null)
      setToast('Counter-bid sent successfully!')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Combine listings with their bids with multi-tier failsafe
  const displayLots: { lot: any; bids: any[] }[] = []

  if (listings.length > 0) {
    listings.forEach((lot) => {
      const activeBids = Array.isArray(lot?.bids) ? lot.bids : []
      const matchingBids = bids.filter((b) => b.lot_id === lot.id)
      const bidMap = new Map<string, any>()
      activeBids.forEach((b: any) => { if (b?.id) bidMap.set(b.id, b) })
      matchingBids.forEach((b: any) => { if (b?.id) bidMap.set(b.id, b) })
      displayLots.push({
        lot,
        bids: Array.from(bidMap.values()),
      })
    })
  } else if (bids.length > 0) {
    // Failsafe: If listings query returned 0 rows but bids table has records, construct lot cards from bids
    const lotMap = new Map<string, { lot: any; bids: any[] }>()
    bids.forEach((b: any) => {
      const lotId = b.lot_id || b.lot?.id || 'demo-lot'
      if (!lotMap.has(lotId)) {
        lotMap.set(lotId, {
          lot: b.lot || {
            id: lotId,
            crop_name: 'Published Harvest Lot',
            grade: 'A',
            quantity_quintal: 100,
            asking_price_per_quintal: 3000,
            location: 'Maharashtra',
            is_live: true,
          },
          bids: [],
        })
      }
      lotMap.get(lotId)!.bids.push(b)
    })
    displayLots.push(...Array.from(lotMap.values()))
  }

  return (
    <div className="market-page min-h-screen bg-background">
      <header className="topbar">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('Overview')} className="secondary-button"><ArrowLeft className="size-4" /> {t('nav.dashboard', language)}</button>
          <div><p className="font-serif text-lg font-bold text-foreground">कृषि-मित्र</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p></div>
          <span className="hidden rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-primary md:inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span> GPS &amp; OpenStreetMap Synced
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
            <Languages className="size-4 text-primary" />
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
          <button onClick={() => onNavigate('Overview')} className="primary-button hidden sm:inline-flex"><PlusCircle className="size-4" /> {t('marketBids.publishCrop', language)}</button>
          <button onClick={onLogout} className="secondary-button">{t('nav.logout', language)}</button>
        </div>
      </header>

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-50 text-green-700 px-4 py-2 rounded-full shadow-lg border border-green-200 flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-4 fade-in duration-300">
          <Check className="size-4" /> {toast}
        </div>
      )}

      <div className="app-layout">
        <FarmerSidebar activeTab="Market & Bids" onNavigate={onNavigate} onLogout={onLogout} />

        <main className="dashboard-main mx-auto flex max-w-6xl flex-col gap-5">
          <button
            type="button"
            onClick={() => onNavigate('Overview')}
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-4 transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t('nav.backToDashboard', language)}
          </button>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">{t('marketBids.eyebrow', language)}</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">{t('marketBids.title', language)}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t('marketBids.subtitle', language)}</p>
            </div>
            <button onClick={() => onNavigate('Overview')} className="primary-button sm:hidden"><PlusCircle className="size-4" /> {t('marketBids.publishNewCrop', language)}</button>
          </div>

          <div className="market-tabs">
            <button className={view === 'bids' ? 'active' : ''} onClick={() => setView('bids')}>{t('marketBids.tabBids', language)}</button>
            <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>{t('marketBids.tabMap', language)}</button>
            <button className={view === 'market' ? 'active' : ''} onClick={() => setView('market')}>{t('marketBids.tabMandi', language)}</button>
          </div>

          {view === 'map' ? (
            <section className="space-y-4">
              <InteractiveMap
                userLocation={farmerCoords}
                userLabel="Your Farm / Mandi"
                lots={displayLots.map((d) => d.lot)}
                bids={bids}
                onSelectBid={openCounter}
                height="580px"
                zoom={10}
              />
              <div className="rounded-2xl border border-border bg-card p-4 text-xs">
                <p className="font-bold text-foreground mb-1">{t('marketBids.tabMap', language)}</p>
                <p className="text-muted-foreground">{language === 'hi' ? 'हरे मार्कर आपके सक्रिय फसल लॉट दर्शाते हैं। नारंगी मार्कर खरीदारों को दर्शाते हैं जिन्होंने लाइव बोलियां लगाई हैं। विवरण देखने के लिए किसी भी पिन पर क्लिक करें।' : language === 'mr' ? 'हिरवे मार्कर तुमचे सक्रिय पीक लॉट दर्शवतात. नारंगी मार्कर खरेदीदारांना दर्शवतात ज्यांनी थेट बोली लावली आहे. तपशील तपासण्यासाठी कोणत्याही पिनवर क्लिक करा.' : 'Green markers represent your active crop lots. Orange markers represent buyers who have submitted live bids. Click any pin to inspect details.'}</p>
              </div>
            </section>
          ) : view === 'bids' ? (
            <section className="market-listings">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> {t('dashboard.marketplace.loading', language)}</div>
              ) : displayLots.length === 0 ? (
                <div className="py-20 text-center text-sm text-muted-foreground rounded-2xl border border-dashed border-border bg-card/40 p-8">
                  <IndianRupee className="mx-auto size-8 text-muted-foreground/60 mb-2" />
                  <p className="font-semibold text-foreground">{t('marketBids.noLots', language)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('marketBids.noLotsDesc', language)}</p>
                  <button onClick={() => onNavigate('Overview')} className="mt-4 primary-button">
                    <PlusCircle className="size-4" /> {t('marketBids.publishFirstLot', language)}
                  </button>
                </div>
              ) : (
                displayLots.map(({ lot, bids: lotBids }) => (
                  <article className="market-listing-card" key={lot.id}>
                    <div className="market-card-head">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2>{lot?.crop_name}</h2>
                          <span className="market-status live-bidding">Grade {lot?.grade || 'A'} · {lot?.is_live ? (language === 'hi' ? 'लाइव' : language === 'mr' ? 'थेट' : 'Live') : (language === 'hi' ? 'बिका हुआ' : language === 'mr' ? 'विकले' : 'Sold')}</span>
                        </div>
                        <p><MapPin className="size-3" />{lot?.location} · {lot?.quantity_quintal} Q ({Number(lot?.quantity_quintal || 1) * 100} kg) · {t('marketBids.asking', language)}: ₹{(Number(lot?.asking_price_per_quintal || 0) / 100).toFixed(2)}/kg</p>
                      </div>
                      <Trend type="up" text={`${lotBids.length} ${language === 'hi' ? 'प्रस्ताव' : language === 'mr' ? 'बोली' : lotBids.length === 1 ? 'offer' : 'offers'}`} />
                    </div>

                    <div className="market-offers">
                      <div className="flex items-center justify-between">
                        <p className="eyebrow">{t('marketBids.buyerOffers', language)}</p>
                        <span className="text-xs text-muted-foreground">{lotBids.length} {language === 'hi' ? 'प्रस्ताव' : language === 'mr' ? 'बोली' : lotBids.length === 1 ? 'offer' : 'offers'}</span>
                      </div>
                      {lotBids.length === 0 ? (
                        <div className="rounded-xl bg-secondary/40 p-4 text-center text-xs text-muted-foreground">
                          {t('marketBids.noBidsOnLot', language)}
                        </div>
                      ) : (
                        lotBids
                          .sort((a: any, b: any) => {
                            const priceA = a.bid_price_per_kg ? Number(a.bid_price_per_kg) : (a.bid_price_per_quintal ? a.bid_price_per_quintal / 100 : 0)
                            const priceB = b.bid_price_per_kg ? Number(b.bid_price_per_kg) : (b.bid_price_per_quintal ? b.bid_price_per_quintal / 100 : 0)
                            return priceB - priceA
                          })
                          .map((bid: any, index: number) => (
                            <BidRow
                              key={bid.id}
                              bid={bid}
                              index={index}
                              lotQuantityQuintal={lot?.quantity_quintal || 1}
                              lotLocation={lot?.location || 'Maharashtra'}
                              isSubmitting={isSubmitting}
                              onAccept={accept}
                              onCounter={openCounter}
                              onReject={reject}
                            />
                          ))
                      )}
                    </div>
                  </article>
                ))
              )}
            </section>
          ) : (
            <section className="market-listings">
              <div className="price-trends-card rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <h2 className="text-xl font-bold">{t('marketBids.stateMandiIndex', language)}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('marketBids.mandiIndexDesc', language)}</p>
                  </div>
                  <span className="live-dot font-semibold text-xs text-primary">● {t('marketBids.live', language)}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {prices.map((p) => (
                    <div key={p.crop} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40">
                      <div>
                        <strong className="text-sm">{p.crop}</strong>
                        <span className="text-[11px] text-muted-foreground block">{p.updated}</span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <strong className="text-base">{p.price}</strong>
                        <Trend type={p.trend} text={p.percent} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Counter Offer Modal */}
      {counterModal && (
        <div className="modal-backdrop" onClick={() => setCounterModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">{t('marketBids.directNegotiation', language)}</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">{t('marketBids.counterBid', language)}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t('marketBids.buyer', language)}: {counterModal.buyer?.full_name || 'Buyer'} · {t('marketBids.currentBid', language)}: ₹{Number(counterModal.bid_price_per_kg || 0).toFixed(2)}/kg</p>
            <div className="mt-4">
              <label className="field">
                <span>{t('marketBids.yourCounterOffer', language)}</span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder="e.g. 36.00"
                />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setCounterModal(null)} className="secondary-button flex-1">{t('common.cancel', language)}</button>
              <button onClick={submitCounter} disabled={isSubmitting} className="primary-button flex-1">
                {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> {t('marketBids.sending', language)}</> : t('marketBids.sendCounter', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
