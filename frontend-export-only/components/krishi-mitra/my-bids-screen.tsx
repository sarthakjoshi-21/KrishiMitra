'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Clock3, CreditCard, Loader2, XCircle } from 'lucide-react'
import { getBuyerBids, markBidPaid, updateBidStatus } from '@/lib/actions/bid-actions'
import type { Bid } from '@/types/database'

type Props = { onBack: () => void; onLogout: () => void }

// Fallback mock data for demo mode
const MOCK_BIDS: Bid[] = [
  { id: 'mock-b1', lot_id: 'l1', buyer_id: 'u1', bid_price_per_kg: 35.8, total_bid_amount: 859200, bid_price_per_quintal: 3580, status: 'pending', preferred_delivery_date: '2026-09-12', created_at: '', lot: { id: 'l1', farmer_id: 'f1', crop_name: 'Premium Basmati Rice', grade: 'A', quantity_quintal: 240, asking_price_per_quintal: 3420, location: 'Nashik', pesticide_safe_flag: true, needs_transport: false, is_live: true, created_at: '', updated_at: '', farmer: { id: 'f1', email: '', role: 'farmer', full_name: 'Ramesh Patil', created_at: '' } } },
  { id: 'mock-b2', lot_id: 'l2', buyer_id: 'u1', bid_price_per_kg: 84.0, total_bid_amount: 714000, bid_price_per_quintal: 8400, status: 'accepted', preferred_delivery_date: '2026-09-18', created_at: '', lot: { id: 'l2', farmer_id: 'f2', crop_name: 'Organic Tur Dal', grade: 'Organic', quantity_quintal: 85, asking_price_per_quintal: 8100, location: 'Indore', pesticide_safe_flag: true, needs_transport: false, is_live: true, created_at: '', updated_at: '', farmer: { id: 'f2', email: '', role: 'farmer', full_name: 'Savitri Devi', created_at: '' } } },
  { id: 'mock-b3', lot_id: 'l3', buyer_id: 'u1', bid_price_per_kg: 29.5, total_bid_amount: 1534000, bid_price_per_quintal: 2950, status: 'counter', counter_price: 3020, preferred_delivery_date: '2026-09-10', created_at: '', lot: { id: 'l3', farmer_id: 'f3', crop_name: 'Fresh Red Onion', grade: 'A', quantity_quintal: 520, asking_price_per_quintal: 2780, location: 'Pune', pesticide_safe_flag: false, needs_transport: true, is_live: true, created_at: '', updated_at: '', farmer: { id: 'f3', email: '', role: 'farmer', full_name: 'Anil Jadhav', created_at: '' } } },
]

const STATUS_ICONS: Record<string, React.ReactNode> = {
  accepted: <CheckCircle2 className="size-4" />,
  rejected: <XCircle className="size-4" />,
  paid: <CheckCircle2 className="size-4" />,
}

export default function MyBidsScreen({ onBack, onLogout }: Props) {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paidIds, setPaidIds] = useState<string[]>([])
  const [paymentModal, setPaymentModal] = useState<Bid | null>(null)

  useEffect(() => {
    async function fetchBids() {
      setLoading(true)
      const result = await getBuyerBids()
      if (result.data) {
        setBids(result.data as Bid[])
      } else {
        setBids(MOCK_BIDS)
      }
      setLoading(false)
    }
    fetchBids()
  }, [])

  async function handleAcceptCounter(bid: Bid) {
    setIsSubmitting(true)
    try {
      await updateBidStatus(bid.id, 'accepted')
      setBids((current) => current.map((b) => b.id === bid.id ? { ...b, status: 'accepted' } : b))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeclineCounter(bid: Bid) {
    setIsSubmitting(true)
    try {
      await updateBidStatus(bid.id, 'rejected')
      setBids((current) => current.map((b) => b.id === bid.id ? { ...b, status: 'rejected' } : b))
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
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="topbar">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-primary"><ArrowLeft className="size-4" />Buyer Dashboard</button>
        <button onClick={onLogout} className="secondary-button">Logout</button>
      </header>

      <main className="dashboard-main mx-auto max-w-5xl">
        <p className="eyebrow">Buyer activity</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">My Bids</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track every offer, response, and payment in one place.</p>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> Loading your bids…</div>
        ) : bids.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground rounded-2xl border border-dashed border-border bg-card/40 p-8">
            <Clock3 className="mx-auto size-8 text-muted-foreground/60 mb-2" />
            <p className="font-semibold text-foreground">No active bids placed yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Browse the marketplace and submit a bid on verified harvest lots to start bargaining with farmers.</p>
            <button onClick={onBack} className="mt-4 primary-button">
              Browse Marketplace
            </button>
          </div>
        ) : (
          <section className="my-bids-list">
            {bids.map((bid) => {
              const pricePerKg = bid.bid_price_per_kg ? Number(bid.bid_price_per_kg) : ((bid.bid_price_per_quintal || 0) / 100)
              const totalAmount = bid.total_bid_amount ? Number(bid.total_bid_amount) : (pricePerKg * (bid.lot?.quantity_quintal || 1) * 100)
              return (
              <article className="my-bid-card" key={bid.id}>
                <div className="my-bid-heading">
                  <div>
                    <h2>{bid.lot?.crop_name ?? 'Crop Lot'}</h2>
                    <p>Farmer: {bid.lot?.farmer?.full_name ?? '—'}</p>
                  </div>
                  <span className={`bid-status ${bid.status}`}>
                    {STATUS_ICONS[bid.status] ?? <Clock3 className="size-4" />}
                    {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                  </span>
                </div>

                <div className="my-bid-details">
                  <span>Your offer<strong>₹{pricePerKg.toFixed(2)} / kg (₹{(Number(pricePerKg * 100) || 0).toLocaleString('en-IN')}/Q)</strong></span>
                  <span>Quantity<strong>{bid.lot?.quantity_quintal} Q ({Number(bid.lot?.quantity_quintal || 1) * 100} kg)</strong></span>
                  <span>Total Amount<strong>₹{(Number(totalAmount) || 0).toLocaleString('en-IN')}</strong></span>
                </div>
                {bid.buyer_notes && <p className="mt-3 text-sm text-muted-foreground italic">&ldquo;{bid.buyer_notes}&rdquo;</p>}

                {(bid.status === 'accepted') && !paidIds.includes(bid.id) && (
                  <button onClick={() => handlePayNow(bid)} disabled={isSubmitting} className="pay-now-button">
                    <CreditCard className="size-4" />Pay Now
                  </button>
                )}

                {bid.status === 'paid' && (
                  <div className="rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-primary">✓ Payment initiated</div>
                )}

                {bid.status === 'counter' && (
                  <div className="counter-box">
                    <strong>Farmer counter-offer: ₹{(Number(bid.counter_price) || 0).toLocaleString('en-IN')} / Q</strong>
                    <div>
                      <button onClick={() => handleAcceptCounter(bid)} disabled={isSubmitting}>Accept counter</button>
                      <button onClick={() => handleDeclineCounter(bid)} disabled={isSubmitting}>Decline</button>
                    </div>
                  </div>
                )}
              </article>
            )})}
          </section>
        )}
      </main>

      {/* Mock Payment Checkout Modal */}
      {paymentModal && (
        <div className="modal-backdrop" onClick={() => setPaymentModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Secure checkout</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Confirm Payment</h2>
            <div className="mt-5 rounded-2xl bg-secondary p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Crop</span><strong>{paymentModal.lot?.crop_name}</strong></div>
              <div className="mt-2 flex justify-between"><span className="text-muted-foreground">Bid price</span><strong>₹{Number(paymentModal.bid_price_per_kg || ((paymentModal.bid_price_per_quintal || 0) / 100)).toFixed(2)} / kg</strong></div>
              <div className="mt-2 flex justify-between"><span className="text-muted-foreground">Quantity</span><strong>{paymentModal.lot?.quantity_quintal} Q ({Number(paymentModal.lot?.quantity_quintal || 1) * 100} kg)</strong></div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">₹{Number(paymentModal.total_bid_amount || ((paymentModal.bid_price_per_kg || 0) * (paymentModal.lot?.quantity_quintal || 1) * 100)).toLocaleString('en-IN')}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">This is a demo checkout. Your payment status will be updated in Supabase.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setPaymentModal(null)} className="secondary-button flex-1">Cancel</button>
              <button onClick={() => confirmPayment(paymentModal)} disabled={isSubmitting} className="primary-button flex-1">
                {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Processing…</> : <><CreditCard className="size-4" /> Confirm Payment</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
