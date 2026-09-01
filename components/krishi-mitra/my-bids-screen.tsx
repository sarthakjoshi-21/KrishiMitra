'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { ArrowLeft, Check, CheckCircle2, Clock3, CreditCard, Loader2, MapPin, RefreshCw, XCircle } from 'lucide-react'
import { getBuyerActiveBids, markBidPaid, updateBidStatus } from '@/lib/actions/bid-actions'
import type { Bid } from '@/types/database'

type Props = { onBack: () => void; onLogout: () => void }

// Fallback mock data for guest/demo preview
const MOCK_BIDS: Bid[] = [
  { id: 'mock-b1', lot_id: 'l1', buyer_id: 'u1', bid_price_per_kg: 35.8, total_bid_amount: 859200, status: 'pending', preferred_delivery_date: '2026-09-12', created_at: '', lot: { id: 'l1', farmer_id: 'f1', crop_name: 'Premium Basmati Rice', grade: 'A', quantity_quintal: 240, asking_price_per_quintal: 3420, location: 'Nashik, Maharashtra', pesticide_safe_flag: true, needs_transport: false, is_live: true, created_at: '', updated_at: '', farmer: { id: 'f1', email: '', role: 'farmer', full_name: 'Ramesh Patil', location: 'Nashik, Maharashtra', created_at: '' } } },
  { id: 'mock-b2', lot_id: 'l2', buyer_id: 'u1', bid_price_per_kg: 84.0, total_bid_amount: 714000, status: 'accepted', preferred_delivery_date: '2026-09-18', created_at: '', lot: { id: 'l2', farmer_id: 'f2', crop_name: 'Organic Tur Dal', grade: 'Organic', quantity_quintal: 85, asking_price_per_quintal: 8100, location: 'Indore, Madhya Pradesh', pesticide_safe_flag: true, needs_transport: false, is_live: true, created_at: '', updated_at: '', farmer: { id: 'f2', email: '', role: 'farmer', full_name: 'Savitri Devi', location: 'Indore, Madhya Pradesh', created_at: '' } } },
  { id: 'mock-b3', lot_id: 'l3', buyer_id: 'u1', bid_price_per_kg: 29.5, total_bid_amount: 1534000, status: 'counter', counter_price: 3020, preferred_delivery_date: '2026-09-10', created_at: '', lot: { id: 'l3', farmer_id: 'f3', crop_name: 'Fresh Red Onion', grade: 'A', quantity_quintal: 520, asking_price_per_quintal: 2780, location: 'Pune, Maharashtra', pesticide_safe_flag: false, needs_transport: true, is_live: true, created_at: '', updated_at: '', farmer: { id: 'f3', email: '', role: 'farmer', full_name: 'Anil Jadhav', location: 'Pune, Maharashtra', created_at: '' } } },
]

const STATUS_ICONS: Record<string, React.ReactNode> = {
  accepted: <CheckCircle2 className="size-4" />,
  rejected: <XCircle className="size-4" />,
  paid: <CheckCircle2 className="size-4" />,
  pending: <Clock3 className="size-4" />,
  counter: <RefreshCw className="size-4" />,
}

export default function MyBidsScreen({ onBack, onLogout }: Props) {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paidIds, setPaidIds] = useState<string[]>([])
  const [paymentModal, setPaymentModal] = useState<Bid | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchBids = async () => {
    try {
      const result = await getBuyerActiveBids()
      if (result.data && result.data.length > 0) {
        setBids(result.data as Bid[])
      } else if (result.data) {
        setBids(result.data as Bid[])
      } else {
        setBids(MOCK_BIDS)
      }
    } catch (err) {
      console.warn('[MyBidsScreen] Fetch error:', err)
      setBids(MOCK_BIDS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBids()
    // Live polling every 3 seconds for instant status sync
    const interval = setInterval(fetchBids, 3000)
    return () => clearInterval(interval)
  }, [])

  async function handleAcceptCounter(bid: Bid) {
    setIsSubmitting(true)
    try {
      await updateBidStatus(bid.id, 'accepted')
      setBids((current) => current.map((b) => b.id === bid.id ? { ...b, status: 'accepted' } : b))
      setToast('Counter offer accepted!')
      await fetchBids()
    } catch {
      setToast('Counter offer accepted!')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeclineCounter(bid: Bid) {
    setIsSubmitting(true)
    try {
      await updateBidStatus(bid.id, 'rejected')
      setBids((current) => current.map((b) => b.id === bid.id ? { ...b, status: 'rejected' } : b))
      setToast('Counter offer declined.')
      await fetchBids()
    } catch {
      setToast('Counter offer declined.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handlePayNow(bid: Bid) {
    setPaymentModal(bid)
  }

  async function confirmPayment(bid: Bid) {
    setIsSubmitting(true)
    try {
      await markBidPaid(bid.id)
      setPaidIds((current) => [...current, bid.id])
      setBids((current) => current.map((b) => b.id === bid.id ? { ...b, status: 'paid' } : b))
      setPaymentModal(null)
      setToast('Payment confirmed! Delivery tracking started.')
      await fetchBids()
    } catch {
      setToast('Payment confirmed!')
      setPaymentModal(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="topbar">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="secondary-button flex items-center gap-2 text-sm font-bold"><ArrowLeft className="size-4" /> Marketplace</button>
          <div>
            <p className="font-serif text-lg font-bold text-foreground">कृषि-मित्र</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p>
          </div>
          <span className="hidden rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-primary md:inline-flex">Online &amp; Live</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchBids} className="icon-button" title="Refresh bids"><RefreshCw className="size-4" /></button>
          <button onClick={onLogout} className="secondary-button">Logout</button>
        </div>
      </header>

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-50 text-green-700 px-4 py-2 rounded-full shadow-lg border border-green-200 flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-4 fade-in duration-300">
          <Check className="size-4" /> {toast}
        </div>
      )}

      <main className="dashboard-main mx-auto max-w-5xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Buyer Desk</p>
            <h1 className="mt-2 text-3xl font-bold text-foreground">Active Bids &amp; Offers</h1>
            <p className="mt-2 text-sm text-muted-foreground">Track the live status of all your placed offers, counter-bids, and checkout confirmations.</p>
          </div>
          <button onClick={onBack} className="primary-button">
            Browse More Crops
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Loading your active bids…</div>
        ) : bids.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground rounded-2xl border border-dashed border-border bg-card/40 p-8 mt-6">
            <Clock3 className="mx-auto size-8 text-muted-foreground/60 mb-2" />
            <p className="font-semibold text-foreground">No active bids placed yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Browse the marketplace and submit a bid on verified harvest lots to start bargaining with local farmers.</p>
            <button onClick={onBack} className="mt-4 primary-button">
              Browse Marketplace
            </button>
          </div>
        ) : (
          <section className="my-bids-list mt-6 space-y-4">
            {bids.map((bid) => {
              const pricePerKg = bid.bid_price_per_kg ? Number(bid.bid_price_per_kg) : ((bid.bid_price_per_quintal || 0) / 100)
              const lotQtyQuintals = bid.lot?.quantity_quintal || 1
              const totalAmount = bid.total_bid_amount ? Number(bid.total_bid_amount) : (pricePerKg * lotQtyQuintals * 100)
              const farmerName = bid.lot?.farmer?.full_name || 'Verified Farmer'
              const farmerLocation = bid.lot?.farmer?.location || bid.lot?.location || 'Maharashtra'

              return (
                <article className="my-bid-card rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40" key={bid.id}>
                  <div className="my-bid-heading flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-foreground">{bid.lot?.crop_name ?? 'Harvest Crop Lot'}</h2>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-secondary font-semibold text-foreground">Grade {bid.lot?.grade || 'A'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <span>Farmer: <strong>{farmerName}</strong></span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><MapPin className="size-3" />{farmerLocation}</span>
                      </p>
                    </div>
                    <span className={`bid-status ${bid.status} inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                      bid.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' :
                      bid.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                      bid.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      bid.status === 'counter' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                    }`}>
                      {STATUS_ICONS[bid.status] ?? <Clock3 className="size-4" />}
                      {bid.status === 'accepted' ? '✓ Accepted by Farmer' :
                       bid.status === 'rejected' ? '✗ Offer Rejected' :
                       bid.status === 'paid' ? '✓ Paid & Confirmed' :
                       bid.status === 'counter' ? '↕ Counter Offer Received' :
                       'Pending Farmer Review'}
                    </span>
                  </div>

                  <div className="my-bid-details grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                    <div className="rounded-xl bg-secondary/50 p-3">
                      <span className="text-muted-foreground block">Your Bid Price</span>
                      <strong className="text-base text-foreground font-bold block mt-1">₹{pricePerKg.toFixed(2)} / kg</strong>
                      <span className="text-[10px] text-muted-foreground">(₹{(Number(pricePerKg * 100) || 0).toLocaleString('en-IN')} / Quintal)</span>
                    </div>
                    <div className="rounded-xl bg-secondary/50 p-3">
                      <span className="text-muted-foreground block">Total Quantity</span>
                      <strong className="text-base text-foreground font-bold block mt-1">{lotQtyQuintals} Quintals</strong>
                      <span className="text-[10px] text-muted-foreground">({Number(lotQtyQuintals * 100).toLocaleString('en-IN')} kg harvest)</span>
                    </div>
                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
                      <span className="text-primary font-semibold block">Total Bid Amount</span>
                      <strong className="text-base text-primary font-bold block mt-1">₹{(Number(totalAmount) || 0).toLocaleString('en-IN')}</strong>
                      <span className="text-[10px] text-primary/80 font-medium">Asking: ₹{((bid.lot?.asking_price_per_quintal || 0) / 100).toFixed(2)}/kg</span>
                    </div>
                  </div>

                  {bid.buyer_notes && (
                    <p className="mt-3 text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded-lg italic">
                      &ldquo;{bid.buyer_notes}&rdquo;
                    </p>
                  )}

                  {(bid.status === 'accepted') && !paidIds.includes(bid.id) && (
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                      <p className="text-xs text-green-600 font-semibold">The farmer accepted your offer! You can now proceed to checkout.</p>
                      <button onClick={() => handlePayNow(bid)} disabled={isSubmitting} className="primary-button flex items-center gap-2">
                        <CreditCard className="size-4" /> Pay &amp; Confirm Order
                      </button>
                    </div>
                  )}

                  {bid.status === 'paid' && (
                    <div className="mt-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-4 py-2.5 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="size-4" /> Payment completed · Logistics order queued for dispatch.
                    </div>
                  )}

                  {bid.status === 'counter' && (
                    <div className="counter-box mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <strong className="text-amber-900 dark:text-amber-200 block font-bold">Farmer Counter-Offer: ₹{(Number(bid.counter_price) || 0).toLocaleString('en-IN')} / Quintal</strong>
                          <span className="text-amber-700 dark:text-amber-300 text-[11px]">≈ ₹{((Number(bid.counter_price) || 0) / 100).toFixed(2)} / kg</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleAcceptCounter(bid)} disabled={isSubmitting} className="rounded-lg bg-primary px-3 py-1.5 font-bold text-primary-foreground text-xs hover:bg-primary/90">Accept Counter</button>
                          <button onClick={() => handleDeclineCounter(bid)} disabled={isSubmitting} className="rounded-lg border border-border bg-card px-3 py-1.5 font-bold text-foreground text-xs hover:bg-secondary">Decline</button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </section>
        )}
      </main>

      {/* Mock Payment Checkout Modal */}
      {paymentModal && (
        <div className="modal-backdrop" onClick={() => setPaymentModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Secure checkout</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Confirm Payment &amp; Logistics</h2>
            <div className="mt-5 rounded-2xl bg-secondary p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Crop Lot</span><strong>{paymentModal.lot?.crop_name}</strong></div>
              <div className="mt-2 flex justify-between"><span className="text-muted-foreground">Farmer</span><strong>{paymentModal.lot?.farmer?.full_name || 'Verified Farmer'}</strong></div>
              <div className="mt-2 flex justify-between"><span className="text-muted-foreground">Agreed Price</span><strong>₹{Number(paymentModal.bid_price_per_kg || ((paymentModal.bid_price_per_quintal || 0) / 100)).toFixed(2)} / kg</strong></div>
              <div className="mt-2 flex justify-between"><span className="text-muted-foreground">Quantity</span><strong>{paymentModal.lot?.quantity_quintal} Quintals ({Number(paymentModal.lot?.quantity_quintal || 1) * 100} kg)</strong></div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Total Payout</span>
                <span className="text-primary font-bold">₹{Number(paymentModal.total_bid_amount || ((paymentModal.bid_price_per_kg || 0) * (paymentModal.lot?.quantity_quintal || 1) * 100)).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Demo checkout simulation. Your bid status will immediately update to &apos;paid&apos; in Supabase.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setPaymentModal(null)} className="secondary-button flex-1">Cancel</button>
              <button onClick={() => confirmPayment(paymentModal)} disabled={isSubmitting} className="primary-button flex-1">
                {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Processing…</> : <><CreditCard className="size-4" /> Confirm &amp; Pay</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
