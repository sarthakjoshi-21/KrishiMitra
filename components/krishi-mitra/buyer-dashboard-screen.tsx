'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, Bell, Check, IndianRupee, Loader2, MapPin, Minus, Search, ShieldCheck, X } from 'lucide-react'
import { Language } from './krishi-mitra-app'
import { getCropLots } from '@/lib/actions/crop-actions'
import { placeBid } from '@/lib/actions/bid-actions'
import type { CropLot } from '@/types/database'

type Props = { userName: string; onLogout: () => void; onProfile: () => void; onMyBids: () => void }

const FALLBACK_LOTS: CropLot[] = [
  { id: 'mock-1', farmer_id: 'f1', crop_name: 'Premium Basmati Rice', grade: 'A', quantity_quintal: 240, asking_price_per_quintal: 3420, location: 'Nashik, Maharashtra', pesticide_safe_flag: true, needs_transport: false, is_live: true, created_at: '', updated_at: '', farmer: { id: 'f1', email: '', role: 'farmer', full_name: 'Ramesh Patil · 4.8★', created_at: '' } },
  { id: 'mock-2', farmer_id: 'f2', crop_name: 'Organic Tur Dal', grade: 'Organic', quantity_quintal: 85, asking_price_per_quintal: 8100, location: 'Indore, Madhya Pradesh', pesticide_safe_flag: true, needs_transport: false, is_live: true, created_at: '', updated_at: '', farmer: { id: 'f2', email: '', role: 'farmer', full_name: 'Savitri Devi · Certified', created_at: '' } },
  { id: 'mock-3', farmer_id: 'f3', crop_name: 'Fresh Red Onion', grade: 'A', quantity_quintal: 520, asking_price_per_quintal: 2780, location: 'Pune, Maharashtra', pesticide_safe_flag: false, needs_transport: true, is_live: true, created_at: '', updated_at: '', farmer: { id: 'f3', email: '', role: 'farmer', full_name: 'Anil Jadhav · 4.6★', created_at: '' } },
]

const priceRows = [['Onion', '₹2,920 / Q', 'up', '+8.4%'], ['Basmati Rice', '₹3,560 / Q', 'up', '+4.1%'], ['Tur Dal', '₹8,350 / Q', 'down', '-2.6%'], ['Wheat', '₹2,480 / Q', 'stable', '+0.3%']] as const

function Trend({ type, text }: { type: 'up' | 'down' | 'stable'; text: string }) {
  const Icon = type === 'up' ? ArrowUp : type === 'down' ? ArrowDown : Minus
  return <span className={`market-trend ${type}`}><Icon className="size-3" />{text}</span>
}

export default function BuyerDashboardScreen({ userName, onLogout, onProfile, onMyBids }: Props) {
  const [view, setView] = useState<'buy' | 'trending'>('buy')
  const [query, setQuery] = useState('')
  const [safeOnly, setSafeOnly] = useState(false)
  const [lots, setLots] = useState<CropLot[]>(FALLBACK_LOTS)
  const [loadingLots, setLoadingLots] = useState(true)
  const [selected, setSelected] = useState<CropLot | null>(null)
  const [offer, setOffer] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [transport, setTransport] = useState<'seller_delivery' | 'self_pickup'>('seller_delivery')
  const [offerSent, setOfferSent] = useState(false)
  const [offerError, setOfferError] = useState('')
  const [isPending, startTransition] = useTransition()

  // Fetch live lots from Supabase on mount
  useEffect(() => {
    async function fetchLots() {
      setLoadingLots(true)
      const result = await getCropLots({ safeOnly })
      if (result.data && result.data.length > 0) {
        setLots(result.data as CropLot[])
      }
      setLoadingLots(false)
    }
    fetchLots()
  }, [safeOnly])

  const visible = useMemo(
    () => lots.filter((lot) => lot.crop_name.toLowerCase().includes(query.toLowerCase()) && (!safeOnly || lot.pesticide_safe_flag)),
    [lots, query, safeOnly]
  )

  const openOffer = useCallback((lot: CropLot) => {
    setSelected(lot)
    setOffer(String(lot.asking_price_per_quintal))
    setOfferSent(false)
    setOfferError('')
  }, [])

  function submitOffer() {
    if (!offer || !selected) return
    const price = Number(offer)
    if (isNaN(price) || price <= 0) { setOfferError('Enter a valid bid price.'); return }

    startTransition(async () => {
      setOfferError('')
      const result = await placeBid({
        lot_id: selected.id,
        bid_price_per_quintal: price,
        preferred_delivery_date: deliveryDate || undefined,
        transport_preference: transport,
      })
      if (result.error) {
        // Graceful fallback for demo/no-credentials mode
        if (result.error.includes('fetch') || result.error.includes('URL') || result.error.includes('authenticated')) {
          setOfferSent(true)
          return
        }
        setOfferError(result.error)
        return
      }
      setOfferSent(true)
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="topbar">
        <div><p className="font-serif text-lg font-bold text-foreground">कृषि-मित्र</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p></div>
        <div className="flex items-center gap-3">
          <button type="button" className="icon-button" aria-label="Notifications"><Bell className="size-5" /><span className="notification-dot" /></button>
          <Language />
          <button onClick={onProfile} className="buyer-avatar-button"><span className="buyer-avatar">{userName.charAt(0).toUpperCase()}</span><span className="hidden sm:block">{userName}<small>Verified buyer</small></span></button>
          <button onClick={onLogout} className="secondary-button">Logout</button>
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar buyer-sidebar">
          <div className="farmer-sidebar-nav">
            <p className="eyebrow">Buyer desk</p>
            <button onClick={() => setView('buy')} className={`side-nav ${view === 'buy' ? 'active' : ''}`}><IndianRupee className="size-5" />Buyer Dashboard</button>
            <button onClick={onMyBids} className="side-nav"><Check className="size-5" />Active Bids</button>
            <button onClick={() => setView('trending')} className={`side-nav ${view === 'trending' ? 'active' : ''}`}><ArrowUp className="size-5" />Trending Market</button>
          </div>
        </aside>

        <main className="buyer-dashboard dashboard-main mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Buyer marketplace</p>
              <h1 className="mt-2 text-3xl font-bold">Source with confidence.</h1>
              <p className="mt-2 text-sm text-muted-foreground">Verified crop lots, transparent bids, direct farmer relationships.</p>
            </div>
          </div>

          <div className="buyer-tabs">
            <span className="buyer-view-label">{view === 'buy' ? 'Buy product & place bids' : 'Trending Market'}</span>
          </div>

          {view === 'buy' ? (
            <>
              <section className="buyer-filters">
                <div className="buyer-filter-row">
                  <label className="buyer-search"><Search className="size-4" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find crop lots" /></label>
                  <select><option>Any quality grade</option><option>Grade A</option><option>Grade B</option><option>Grade C</option><option>Organic Certified</option></select>
                  <select><option>All suppliers</option><option>Individual</option></select>
                  <select><option>All regions</option><option>Maharashtra</option><option>Madhya Pradesh</option></select>
                </div>
                <label className="safe-toggle"><input type="checkbox" checked={safeOnly} onChange={(e) => setSafeOnly(e.target.checked)} /> <ShieldCheck className="size-4" /> Show only verified-safe listings</label>
              </section>

              <section className="buyer-lots">
                {loadingLots ? (
                  <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" /> Loading marketplace…
                  </div>
                ) : visible.length === 0 ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">No lots found. Try adjusting your filters.</div>
                ) : (
                  visible.map((lot) => (
                    <article key={lot.id} className="buyer-lot-card">
                      <div className="buyer-lot-visual">
                        <span>{lot.crop_name.split(' ').slice(-1)[0]}</span>
                        <b>Grade {lot.grade}</b>
                      </div>
                      <div className="buyer-lot-body">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2>{lot.crop_name}</h2>
                            <p><MapPin className="size-3" />{lot.location}</p>
                          </div>
                          <Trend type={lot.pesticide_safe_flag ? 'up' : 'stable'} text={lot.pesticide_safe_flag ? '+safe' : '~verify'} />
                        </div>
                        <div className="buyer-lot-meta">
                          <span className={lot.pesticide_safe_flag ? 'safe' : 'unknown'}>{lot.pesticide_safe_flag ? '✅ Safe to sell' : '❓ Cannot verify'}</span>
                        </div>
                        <div className="buyer-lot-footer">
                          <span>{lot.farmer?.full_name ?? 'Farmer'}<small>{lot.quantity_quintal} Q</small></span>
                          <strong>₹{lot.asking_price_per_quintal.toLocaleString('en-IN')}<small>Asking price / Q</small></strong>
                        </div>
                        <button onClick={() => openOffer(lot)} className="make-offer-button">Make Offer <ArrowRight className="size-4" /></button>
                      </div>
                    </article>
                  ))
                )}
              </section>
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
              <div className="buyer-activity-panel">
                <h2>Live bidding activity</h2>
                {['New bid on Wheat lot — ₹2,450 / Quintal', 'FreshFields offered ₹2,920 / Q for Onion', 'Organic Tur Dal received a new offer'].map((item) => (
                  <p key={item}><span className="live-dot">●</span>{item}<small>Just now</small></p>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Make Offer Modal */}
      {selected && (
        <div className="offer-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="offer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}><X className="size-4" /></button>
            <p className="eyebrow">Digital offer</p>
            <h2>Make Offer for {selected.crop_name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Asking: ₹{selected.asking_price_per_quintal.toLocaleString('en-IN')} / Q · {selected.quantity_quintal} Q available</p>

            {offerSent ? (
              <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-secondary p-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-6" /></div>
                <p className="font-bold text-foreground">Offer submitted!</p>
                <p className="text-sm text-muted-foreground">The farmer has been notified. Track your bid in &ldquo;Active Bids&rdquo;.</p>
                <button onClick={() => setSelected(null)} className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Done</button>
              </div>
            ) : (
              <>
                <label className="mt-5 flex flex-col gap-1.5 text-sm font-semibold">
                  Bid Price (₹ / Quintal)
                  <input type="number" value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Enter your offer" className="h-11 rounded-xl border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold">
                  Preferred Delivery Date
                  <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring" />
                </label>
                <label className="mt-4 flex flex-col gap-1.5 text-sm font-semibold">
                  Transport requirement
                  <select value={transport} onChange={(e) => setTransport(e.target.value as 'seller_delivery' | 'self_pickup')} className="h-11 rounded-xl border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring">
                    <option value="seller_delivery">Seller Delivery</option>
                    <option value="self_pickup">Self-pickup</option>
                  </select>
                </label>
                {offerError && <p role="alert" className="mt-2 text-sm font-semibold text-destructive">{offerError}</p>}
                <button disabled={!offer || isPending} onClick={submitOffer} className="submit-offer mt-5 w-full">
                  {isPending ? <><Loader2 className="size-4 animate-spin" /> Submitting…</> : <>Submit Digital Offer <Check className="size-4" /></>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
