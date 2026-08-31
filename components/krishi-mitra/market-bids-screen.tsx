'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, IndianRupee, Loader2, MapPin, Minus, PlusCircle, TrendingUp, X } from 'lucide-react'
import { getBidsForFarmer, updateBidStatus } from '@/lib/actions/bid-actions'
import { getMyListings } from '@/lib/actions/crop-actions'
import type { Bid } from '@/types/database'

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
  const [view, setView] = useState<'bids' | 'market'>('bids')
  const [listings, setListings] = useState<any[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [counterModal, setCounterModal] = useState<Bid | null>(null)
  const [counterPrice, setCounterPrice] = useState('')
  const [paymentModal, setPaymentModal] = useState<Bid | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const loadData = async () => {
    setLoading(true)
    const [listingsRes, bidsRes] = await Promise.all([
      getMyListings(),
      getBidsForFarmer(),
    ])
    if (listingsRes.data) {
      setListings(listingsRes.data)
    }
    if (bidsRes.data) {
      setBids(bidsRes.data as Bid[])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function accept(bid: Bid) {
    setIsSubmitting(true)
    try {
      await updateBidStatus(bid.id, 'accepted')
      setBids((curr) => curr.map((b) => b.id === bid.id ? { ...b, status: 'accepted' } : (b.lot_id === bid.lot_id && b.status === 'pending' ? { ...b, status: 'rejected' } : b)))
      setToast('Bid accepted successfully!')
      setPaymentModal(bid)
    } catch {
      setBids((curr) => curr.map((b) => b.id === bid.id ? { ...b, status: 'accepted' } : (b.lot_id === bid.lot_id && b.status === 'pending' ? { ...b, status: 'rejected' } : b)))
      setToast('Bid accepted successfully!')
      setPaymentModal(bid)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function reject(bid: Bid) {
    setIsSubmitting(true)
    try {
      await updateBidStatus(bid.id, 'rejected')
      setBids((curr) => curr.map((b) => b.id === bid.id ? { ...b, status: 'rejected' } : b))
      setToast('Bid rejected.')
    } catch {
      setBids((curr) => curr.map((b) => b.id === bid.id ? { ...b, status: 'rejected' } : b))
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

  // Combine listings with their bids
  const displayLots = listings.length > 0
    ? listings.map((lot) => {
        const matchingBids = bids.filter((b) => b.lot_id === lot.id)
        return {
          lot,
          bids: matchingBids.length > 0 ? matchingBids : (lot.bids || []),
        }
      })
    : []

  return (
    <div className="market-page min-h-screen bg-background">
      <header className="topbar">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('Overview')} className="secondary-button"><ArrowLeft className="size-4" /> Dashboard</button>
          <div><p className="font-serif text-lg font-bold text-foreground">कृषि-मित्र</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p></div>
          <span className="hidden rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-primary md:inline-flex">Online &amp; synced</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('Overview')} className="primary-button hidden sm:inline-flex"><PlusCircle className="size-4" /> Publish Crop</button>
          <button onClick={onLogout} className="secondary-button">Logout</button>
        </div>
      </header>

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-50 text-green-700 px-4 py-2 rounded-full shadow-lg border border-green-200 flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-4 fade-in duration-300">
          <Check className="size-4" /> {toast}
        </div>
      )}

      <div className="app-layout">
        <aside className="sidebar">
          <div className="farmer-sidebar-nav">
            <button onClick={() => onNavigate('Overview')} className="side-nav"><ArrowRight className="size-5 rotate-180" />Dashboard</button>
            <button onClick={() => onNavigate('Active Bidding')} className="side-nav active"><IndianRupee className="size-5" />Market &amp; Bids</button>
            <button onClick={() => onNavigate('P2P Logistics')} className="side-nav"><TrendingUp className="size-5" />Logistics</button>
          </div>
        </aside>

        <main className="dashboard-main mx-auto flex max-w-6xl flex-col gap-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Post-harvest &amp; Sales</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">Market &amp; Bids</h1>
              <p className="mt-2 text-sm text-muted-foreground">Manage your published crop lots and review incoming buyer offers in real time.</p>
            </div>
            <button onClick={() => onNavigate('Overview')} className="primary-button sm:hidden"><PlusCircle className="size-4" /> Publish New Crop</button>
          </div>

          <div className="market-tabs">
            <button className={view === 'bids' ? 'active' : ''} onClick={() => setView('bids')}>Published Crops &amp; Active Bids</button>
            <button className={view === 'market' ? 'active' : ''} onClick={() => setView('market')}>Mandi Trends</button>
          </div>

          {view === 'bids' ? (
            <section className="market-listings">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Loading published crops…</div>
              ) : displayLots.length === 0 ? (
                <div className="py-20 text-center text-sm text-muted-foreground rounded-2xl border border-dashed border-border bg-card/40 p-8">
                  <IndianRupee className="mx-auto size-8 text-muted-foreground/60 mb-2" />
                  <p className="font-semibold text-foreground">No crop lots published yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Publish a crop lot from your Dashboard to list it on the marketplace and receive live bids from verified buyers.</p>
                  <button onClick={() => onNavigate('Overview')} className="mt-4 primary-button">
                    <PlusCircle className="size-4" /> Publish Your First Crop Lot
                  </button>
                </div>
              ) : (
                displayLots.map(({ lot, bids: lotBids }) => (
                  <article className="market-listing-card" key={lot.id}>
                    <div className="market-card-head">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2>{lot?.crop_name}</h2>
                          <span className="market-status live-bidding">Grade {lot?.grade || 'A'} · {lot?.is_live ? 'Live' : 'Sold'}</span>
                        </div>
                        <p><MapPin className="size-3" />{lot?.location} · {lot?.quantity_quintal} Q ({Number(lot?.quantity_quintal || 1) * 100} kg) · Asking: ₹{(Number(lot?.asking_price_per_quintal || 0) / 100).toFixed(2)}/kg</p>
                      </div>
                      <Trend type="up" text={`${lotBids.length} offer${lotBids.length !== 1 ? 's' : ''}`} />
                    </div>

                    <div className="market-offers">
                      <div className="flex items-center justify-between">
                        <p className="eyebrow">Buyer offers for this lot</p>
                        <span className="text-xs text-muted-foreground">{lotBids.length} offer{lotBids.length !== 1 ? 's' : ''}</span>
                      </div>
                      {lotBids.length === 0 ? (
                        <div className="rounded-xl bg-secondary/40 p-4 text-center text-xs text-muted-foreground">
                          No buyer bids placed yet on this lot. Your listing is broadcasted to buyers on the marketplace.
                        </div>
                      ) : (
                        lotBids
                          .sort((a: any, b: any) => {
                            const priceA = a.bid_price_per_kg ? Number(a.bid_price_per_kg) : (a.bid_price_per_quintal ? a.bid_price_per_quintal / 100 : 0)
                            const priceB = b.bid_price_per_kg ? Number(b.bid_price_per_kg) : (b.bid_price_per_quintal ? b.bid_price_per_quintal / 100 : 0)
                            return priceB - priceA
                          })
                          .map((bid: any, index: number) => {
                            const pricePerKg = bid.bid_price_per_kg ? Number(bid.bid_price_per_kg) : (bid.bid_price_per_quintal ? bid.bid_price_per_quintal / 100 : 0)
                            const totalAmount = bid.total_bid_amount ? Number(bid.total_bid_amount) : (pricePerKg * (lot?.quantity_quintal || 1) * 100)
                            return (
                            <div className="market-offer" key={bid.id}>
                              <div className="flex-1">
                                <strong>{index + 1}. {bid.buyer?.full_name ?? 'Verified Buyer'}</strong>
                                <small className="block mt-0.5">
                                  {bid.status === 'accepted' ? '✓ Offer accepted' :
                                    bid.status === 'rejected' ? '✗ Offer rejected' :
                                      bid.status === 'counter' ? `↕ Counter sent: ₹${bid.counter_price?.toLocaleString('en-IN')}` :
                                        'Buyer live offer'}
                                  {' · '}{lot?.quantity_quintal} Q ({Number(lot?.quantity_quintal || 1) * 100} kg)
                                </small>
                                {bid.buyer_notes && <p className="mt-1 text-xs text-muted-foreground bg-secondary/50 p-1.5 rounded-md italic">&ldquo;{bid.buyer_notes}&rdquo;</p>}
                              </div>
                              <div className="text-right">
                                <b>₹{pricePerKg.toFixed(2)} / kg</b>
                                <small className="block text-xs font-semibold text-primary mt-0.5">Total: ₹{totalAmount.toLocaleString('en-IN')}</small>
                              </div>
                              {bid.status === 'pending' && (
                                <div className="market-offer-actions self-start ml-2">
                                  <button onClick={() => accept(bid)} aria-label={`Accept ${bid.buyer?.full_name}`} disabled={isSubmitting}><Check className="size-4" /></button>
                                  <button onClick={() => reject(bid)} aria-label={`Reject ${bid.buyer?.full_name}`} disabled={isSubmitting}><X className="size-4" /></button>
                                  <button onClick={() => openCounter(bid)} className="counter-button" disabled={isSubmitting}>Counter</button>
                                </div>
                              )}
                            </div>
                          )})
                      )}
                    </div>
                  </article>
                ))
              )}
            </section>
          ) : (
            <section className="market-view">
              <article className="market-price-panel">
                <div className="market-section-title">
                  <div><p className="eyebrow">Live mandi prices</p><h2>Today&apos;s market pulse</h2></div>
                  <span className="live-dot">Live</span>
                </div>
                {prices.map((price) => (
                  <div className="market-price-row" key={price.crop}>
                    <div><strong>{price.crop}</strong><small>Updated {price.updated}</small></div>
                    <b>{price.price}</b>
                    <Trend type={price.trend} text={price.percent} />
                  </div>
                ))}
              </article>
            </section>
          )}
        </main>
      </div>

      {/* Counter Bid Modal */}
      {counterModal && (
        <div className="modal-backdrop" onClick={() => setCounterModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Counter offer</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Send Counter Bid</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Responding to {counterModal.buyer?.full_name}&apos;s offer of ₹{Number(counterModal.bid_price_per_kg || ((counterModal.bid_price_per_quintal || 0) / 100)).toFixed(2)} / kg
            </p>
            <label className="field mt-6">
              <span>Your counter price (₹ / kg)</span>
              <input type="number" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)} />
            </label>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setCounterModal(null)} className="secondary-button flex-1">Cancel</button>
              <button onClick={submitCounter} disabled={isSubmitting || !counterPrice} className="primary-button flex-1">
                {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Sending…</> : <>Send Counter <ArrowRight className="size-4" /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Accept Payment Notification */}
      {paymentModal && (
        <div className="modal-backdrop" onClick={() => setPaymentModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto"><Check className="size-7" /></div>
            <p className="eyebrow mt-4 text-center">Bid accepted!</p>
            <h2 className="mt-2 text-center font-serif text-2xl font-bold">₹{Number(paymentModal.bid_price_per_kg || ((paymentModal.bid_price_per_quintal || 0) / 100)).toFixed(2)} / kg</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              You accepted {paymentModal.buyer?.full_name}&apos;s offer (Total: ₹{Number(paymentModal.total_bid_amount || 0).toLocaleString('en-IN')}). The buyer will be notified and prompted to pay.
            </p>
            <button onClick={() => setPaymentModal(null)} className="primary-button mt-6 w-full justify-center">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
