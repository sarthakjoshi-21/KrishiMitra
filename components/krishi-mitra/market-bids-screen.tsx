'use client'

import { useEffect, useState, useTransition } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check, IndianRupee, Loader2, MapPin, Minus, TrendingUp, X } from 'lucide-react'
import { getBidsForFarmer, updateBidStatus } from '@/lib/actions/bid-actions'
import type { Bid } from '@/types/database'

type Props = { onLogout: () => void; onNavigate: (tab: string) => void }

const MOCK_BIDS: Bid[] = [
  { id: 'mock-fb1', lot_id: 'l1', buyer_id: 'b1', bid_price_per_quintal: 2920, status: 'pending', created_at: '', updated_at: '', lot: { id: 'l1', farmer_id: 'f1', crop_name: 'Fresh Red Onion', grade: 'A', quantity_quintal: 520, asking_price_per_quintal: 2780, location: 'Pune, Maharashtra', pesticide_safe_flag: false, needs_transport: true, is_live: true, created_at: '', updated_at: '' }, buyer: { id: 'b1', email: '', role: 'buyer', full_name: 'FreshFields Agro', location: 'Mumbai', created_at: '' } },
  { id: 'mock-fb2', lot_id: 'l1', buyer_id: 'b2', bid_price_per_quintal: 2860, status: 'pending', created_at: '', updated_at: '', lot: { id: 'l1', farmer_id: 'f1', crop_name: 'Fresh Red Onion', grade: 'A', quantity_quintal: 520, asking_price_per_quintal: 2780, location: 'Pune, Maharashtra', pesticide_safe_flag: false, needs_transport: true, is_live: true, created_at: '', updated_at: '' }, buyer: { id: 'b2', email: '', role: 'buyer', full_name: 'Nashik Foods', location: 'Nashik', created_at: '' } },
  { id: 'mock-fb3', lot_id: 'l2', buyer_id: 'b3', bid_price_per_quintal: 3560, status: 'pending', created_at: '', updated_at: '', lot: { id: 'l2', farmer_id: 'f1', crop_name: 'Premium Basmati Rice', grade: 'A', quantity_quintal: 240, asking_price_per_quintal: 3420, location: 'Nashik, Maharashtra', pesticide_safe_flag: true, needs_transport: false, is_live: true, created_at: '', updated_at: '' }, buyer: { id: 'b3', email: '', role: 'buyer', full_name: 'Harvest Basket', location: 'Pune', created_at: '' } },
]

const prices = [
  { crop: 'Onion', price: '₹2,920 / Q', trend: 'up' as const, percent: '+8.4%', updated: '12 min ago' },
  { crop: 'Basmati Rice', price: '₹3,560 / Q', trend: 'up' as const, percent: '+4.1%', updated: '18 min ago' },
  { crop: 'Tur Dal', price: '₹8,350 / Q', trend: 'down' as const, percent: '-2.6%', updated: '25 min ago' },
  { crop: 'Wheat', price: '₹2,480 / Q', trend: 'stable' as const, percent: '+0.3%', updated: '31 min ago' },
]

function Trend({ type, text }: { type: 'up' | 'down' | 'stable'; text: string }) {
  const Icon = type === 'up' ? ArrowUp : type === 'down' ? ArrowDown : Minus
  return <span className={`market-trend ${type}`}><Icon className="size-3" />{text}</span>
}

// Group bids by lot for the "Active Bidding" view
function groupBidsByLot(bids: Bid[]): Map<string, { lot: Bid['lot']; bids: Bid[] }> {
  const map = new Map<string, { lot: Bid['lot']; bids: Bid[] }>()
  for (const bid of bids) {
    if (!bid.lot) continue
    const key = bid.lot_id
    if (!map.has(key)) map.set(key, { lot: bid.lot, bids: [] })
    map.get(key)!.bids.push(bid)
  }
  return map
}

export default function MarketBidsScreen({ onLogout, onNavigate }: Props) {
  const [view, setView] = useState<'bids' | 'market'>('bids')
  const [bids, setBids] = useState<Bid[]>(MOCK_BIDS)
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

  useEffect(() => {
    async function fetchBids() {
      setLoading(true)
      const result = await getBidsForFarmer()
      if (result.data && result.data.length > 0) {
        setBids(result.data as Bid[])
      }
      setLoading(false)
    }
    fetchBids()
  }, [])

  async function accept(bid: Bid) {
    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setBids((curr) => curr.map((b) => b.id === bid.id ? { ...b, status: 'accepted' } : (b.lot_id === bid.lot_id && b.status === 'pending' ? { ...b, status: 'rejected' } : b)))
      setToast('Bid accepted successfully!')
      setPaymentModal(bid) // Trigger mock payment checkout
    } finally {
      setIsSubmitting(false)
    }
  }

  async function reject(bid: Bid) {
    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setBids((curr) => curr.map((b) => b.id === bid.id ? { ...b, status: 'rejected' } : b))
    } finally {
      setIsSubmitting(false)
    }
  }

  function openCounter(bid: Bid) {
    setCounterPrice(String(bid.bid_price_per_quintal))
    setCounterModal(bid)
  }

  async function submitCounter() {
    if (!counterModal) return
    const price = Number(counterPrice)
    if (isNaN(price) || price <= 0) return

    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setBids((curr) => curr.map((b) => b.id === counterModal.id ? { ...b, status: 'counter', counter_price: price } : b))
      setCounterModal(null)
      setToast('Counter-bid sent successfully!')
    } finally {
      setIsSubmitting(false)
    }
  }

  const grouped = groupBidsByLot(bids)

  return (
    <div className="market-page min-h-screen bg-background">
      <header className="topbar">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('Overview')} className="secondary-button"><ArrowLeft className="size-4" /> Dashboard</button>
          <div><p className="font-serif text-lg font-bold text-foreground">कृषि-मित्र</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p></div>
          <span className="hidden rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-primary md:inline-flex">Online &amp; synced</span>
        </div>
        <div className="flex items-center gap-3"><button onClick={onLogout} className="secondary-button">Logout</button></div>
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
          <div>
            <p className="eyebrow">Post-harvest</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Market &amp; Bids</h1>
            <p className="mt-2 text-sm text-muted-foreground">Track your offers and make confident selling decisions.</p>
          </div>

          <div className="market-tabs">
            <button className={view === 'bids' ? 'active' : ''} onClick={() => setView('bids')}>Active Bidding</button>
            <button className={view === 'market' ? 'active' : ''} onClick={() => setView('market')}>Market</button>
          </div>

          {view === 'bids' ? (
            <section className="market-listings">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Loading bids…</div>
              ) : grouped.size === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">No active bids yet. Publish a crop lot to start receiving offers.</div>
              ) : (
                Array.from(grouped.entries()).map(([lotId, { lot, bids: lotBids }]) => (
                  <article className="market-listing-card" key={lotId}>
                    <div className="market-card-head">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2>{lot?.crop_name}</h2>
                          <span className="market-status live-bidding">Live Bidding</span>
                        </div>
                        <p><MapPin className="size-3" />{lot?.location} · {lot?.quantity_quintal} Q</p>
                      </div>
                      <Trend type="up" text={`${lotBids.length} offer${lotBids.length !== 1 ? 's' : ''}`} />
                    </div>

                    <div className="market-offers">
                      <div className="flex items-center justify-between">
                        <p className="eyebrow">Top buyer offers</p>
                        <span className="text-xs text-muted-foreground">{lotBids.length} offer{lotBids.length !== 1 ? 's' : ''}</span>
                      </div>
                      {lotBids
                        .sort((a, b) => b.bid_price_per_quintal - a.bid_price_per_quintal)
                        .map((bid, index) => {
                          const quantity = bid.quantity_requested || lot?.quantity_quintal || 1;
                          const totalPayout = bid.bid_price_per_quintal * quantity;
                          return (
                          <div className="market-offer" key={bid.id}>
                            <div className="flex-1">
                              <strong>{index + 1}. {bid.buyer?.full_name ?? 'Buyer'}</strong>
                              <small className="block mt-0.5">
                                {bid.status === 'accepted' ? '✓ Offer accepted' :
                                  bid.status === 'rejected' ? '✗ Offer rejected' :
                                    bid.status === 'counter' ? `↕ Counter sent: ₹${bid.counter_price?.toLocaleString('en-IN')} / Q` :
                                      'Buyer offer'}
                                {' · '}{quantity} Q requested
                              </small>
                              {bid.buyer_notes && <p className="mt-1 text-xs text-muted-foreground bg-secondary/50 p-1.5 rounded-md italic">&ldquo;{bid.buyer_notes}&rdquo;</p>}
                            </div>
                            <div className="text-right">
                              <b>₹{bid.bid_price_per_quintal.toLocaleString('en-IN')}</b>
                              <small className="block text-xs font-semibold text-primary mt-0.5">Total: ₹{totalPayout.toLocaleString('en-IN')}</small>
                            </div>
                            {bid.status === 'pending' && (
                              <div className="market-offer-actions self-start ml-2">
                                <button onClick={() => accept(bid)} aria-label={`Accept ${bid.buyer?.full_name}`} disabled={isSubmitting}><Check className="size-4" /></button>
                                <button onClick={() => reject(bid)} aria-label={`Reject ${bid.buyer?.full_name}`} disabled={isSubmitting}><X className="size-4" /></button>
                                <button onClick={() => openCounter(bid)} className="counter-button" disabled={isSubmitting}>Counter Bid</button>
                              </div>
                            )}
                          </div>
                        )})}
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
              Responding to {counterModal.buyer?.full_name}&apos;s offer of ₹{counterModal.bid_price_per_quintal.toLocaleString('en-IN')} / Q
            </p>
            <label className="field mt-6">
              <span>Your counter price (₹ / Quintal)</span>
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
            <h2 className="mt-2 text-center font-serif text-2xl font-bold">₹{paymentModal.bid_price_per_quintal.toLocaleString('en-IN')} / Q</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              You accepted {paymentModal.buyer?.full_name}&apos;s offer. The buyer will be notified and prompted to pay.
            </p>
            <button onClick={() => setPaymentModal(null)} className="primary-button mt-6 w-full justify-center">Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
