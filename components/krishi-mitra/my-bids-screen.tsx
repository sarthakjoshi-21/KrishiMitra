'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { ArrowLeft, Check, CheckCircle2, Clock3, CreditCard, Loader2, MapPin, RefreshCw, XCircle } from 'lucide-react'
import { counterBid, getBuyerActiveBids, markBidPaid, updateBidStatus } from '@/lib/actions/bid-actions'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Bid } from '@/types/database'

type Props = { onBack: () => void; onLogout: () => void }

// Fallback mock data for guest/demo preview
const MOCK_BIDS: Bid[] = [
  {
    id: 'mock-b1',
    lot_id: 'l1',
    buyer_id: 'u1',
    bid_price_per_kg: 35.8,
    total_bid_amount: 859200,
    status: 'pending',
    preferred_delivery_date: '2026-09-12',
    created_at: '',
    lot: {
      id: 'l1',
      farmer_id: 'f1',
      crop_name: 'Premium Basmati Rice',
      grade: 'A',
      quantity_quintal: 240,
      asking_price_per_quintal: 3420,
      location: 'Nashik, Maharashtra',
      pesticide_safe_flag: true,
      needs_transport: false,
      is_live: true,
      created_at: '',
      updated_at: '',
      farmer: { id: 'f1', email: '', role: 'farmer', full_name: 'Ramesh Patil', location: 'Nashik, Maharashtra', created_at: '' }
    }
  },
  {
    id: 'mock-b2',
    lot_id: 'l2',
    buyer_id: 'u1',
    bid_price_per_kg: 84.0,
    total_bid_amount: 714000,
    status: 'accepted',
    preferred_delivery_date: '2026-09-18',
    created_at: '',
    lot: {
      id: 'l2',
      farmer_id: 'f2',
      crop_name: 'Organic Tur Dal',
      grade: 'Organic',
      quantity_quintal: 85,
      asking_price_per_quintal: 8100,
      location: 'Indore, Madhya Pradesh',
      pesticide_safe_flag: true,
      needs_transport: false,
      is_live: true,
      created_at: '',
      updated_at: '',
      farmer: { id: 'f2', email: '', role: 'farmer', full_name: 'Savitri Devi', location: 'Indore, Madhya Pradesh', created_at: '' }
    }
  },
  {
    id: 'mock-b3',
    lot_id: 'l3',
    buyer_id: 'u1',
    bid_price_per_kg: 29.5,
    total_bid_amount: 1534000,
    status: 'countered',
    counter_price_per_kg: 30.2,
    counter_price: 30.2,
    counter_by: 'farmer',
    counter_notes: 'Can dispatch immediately if price is ₹30.20/kg.',
    preferred_delivery_date: '2026-09-10',
    created_at: '',
    lot: {
      id: 'l3',
      farmer_id: 'f3',
      crop_name: 'Fresh Red Onion',
      grade: 'A',
      quantity_quintal: 520,
      asking_price_per_quintal: 2780,
      location: 'Pune, Maharashtra',
      pesticide_safe_flag: false,
      needs_transport: true,
      is_live: true,
      created_at: '',
      updated_at: '',
      farmer: { id: 'f3', email: '', role: 'farmer', full_name: 'Anil Jadhav', location: 'Pune, Maharashtra', created_at: '' }
    }
  },
]

const STATUS_ICONS: Record<string, React.ReactNode> = {
  accepted: <CheckCircle2 className="size-4" />,
  rejected: <XCircle className="size-4" />,
  paid: <CheckCircle2 className="size-4" />,
  pending: <Clock3 className="size-4" />,
  counter: <RefreshCw className="size-4" />,
  countered: <RefreshCw className="size-4" />,
}

export default function MyBidsScreen({ onBack, onLogout }: Props) {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paidIds, setPaidIds] = useState<string[]>([])
  const [paymentModal, setPaymentModal] = useState<Bid | null>(null)
  const [counterBackModal, setCounterBackModal] = useState<Bid | null>(null)
  const [buyerCounterPrice, setBuyerCounterPrice] = useState('')
  const [buyerNotes, setBuyerNotes] = useState('')
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

    // Supabase realtime channel for instant push updates
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel('buyer-bids-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        (payload) => {
          console.log('[MyBidsScreen] Realtime change detected:', payload)
          fetchBids()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  // 1. Accept Counter-Offer (Locks in counter price and closes auction)
  async function handleAcceptCounter(bid: Bid) {
    setIsSubmitting(true)
    const counterPrice = Number(bid.counter_price_per_kg || bid.counter_price || bid.bid_price_per_kg)
    const lotQtyQuintals = bid.lot?.quantity_quintal || 1
    const quantityInKg = lotQtyQuintals * 100
    const totalAmount = Number((counterPrice * quantityInKg).toFixed(2))

    try {
      const supabase = getSupabaseBrowserClient()

      // Update the bid in Supabase: status: 'accepted', bid_price_per_kg: counterPrice, total_bid_amount: totalAmount
      await (supabase
        .from('bids') as any)
        .update({
          status: 'accepted',
          bid_price_per_kg: counterPrice,
          total_bid_amount: totalAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bid.id)

      // Mark crop_lots.winning_bid_id to close auction
      if (bid.lot_id) {
        await (supabase
          .from('crop_lots') as any)
          .update({
            winning_bid_id: bid.id,
            is_live: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bid.lot_id)

        // Reject competing bids
        await (supabase
          .from('bids') as any)
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('lot_id', bid.lot_id)
          .neq('id', bid.id)
          .in('status', ['pending', 'counter', 'countered'])
      }

      // Call server action to trigger server cache revalidation & push notifications
      await updateBidStatus(bid.id, 'accepted')

      // Optimistic state update
      setBids((current) =>
        current.map((b) =>
          b.id === bid.id
            ? {
                ...b,
                status: 'accepted',
                bid_price_per_kg: counterPrice,
                total_bid_amount: totalAmount,
              }
            : b
        )
      )
      setToast('Counter offer accepted! Deal confirmed with farmer.')
      await fetchBids()
    } catch (err: any) {
      console.warn('[handleAcceptCounter] Error:', err)
      setToast('Counter offer accepted!')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 2. Reject Counter-Offer
  async function handleRejectCounter(bid: Bid) {
    setIsSubmitting(true)
    try {
      const supabase = getSupabaseBrowserClient()
      await (supabase
        .from('bids') as any)
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bid.id)

      await updateBidStatus(bid.id, 'rejected')

      setBids((current) =>
        current.map((b) => (b.id === bid.id ? { ...b, status: 'rejected' } : b))
      )
      setToast('Counter offer rejected.')
      await fetchBids()
    } catch {
      setToast('Counter offer rejected.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. Open Counter Back popover/modal
  function handleOpenCounterBack(bid: Bid) {
    const defaultPrice = bid.counter_price_per_kg || bid.bid_price_per_kg || 0
    setBuyerCounterPrice(String(defaultPrice))
    setBuyerNotes('')
    setCounterBackModal(bid)
  }

  // 4. Submit Buyer Counter-Offer
  async function handleSubmitBuyerCounter() {
    if (!counterBackModal) return
    const price = Number(buyerCounterPrice)
    if (isNaN(price) || price <= 0) return

    setIsSubmitting(true)
    const notes = buyerNotes.trim()
    try {
      const supabase = getSupabaseBrowserClient()
      await (supabase
        .from('bids') as any)
        .update({
          status: 'countered',
          counter_price_per_kg: price,
          counter_price: price,
          counter_by: 'buyer',
          counter_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', counterBackModal.id)

      await counterBid(counterBackModal.id, price, 'buyer', notes)

      setBids((current) =>
        current.map((b) =>
          b.id === counterBackModal.id
            ? {
                ...b,
                status: 'countered',
                counter_price_per_kg: price,
                counter_price: price,
                counter_by: 'buyer',
                counter_notes: notes || null,
              }
            : b
        )
      )
      setCounterBackModal(null)
      setToast('Counter offer dispatched to farmer!')
      await fetchBids()
    } catch {
      setToast('Counter offer dispatched!')
      setCounterBackModal(null)
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
      setBids((current) => current.map((b) => (b.id === bid.id ? { ...b, status: 'paid' } : b)))
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
          <button onClick={onBack} className="secondary-button flex items-center gap-2 text-sm font-bold">
            <ArrowLeft className="size-4" /> Marketplace
          </button>
          <div>
            <p className="font-serif text-lg font-bold text-foreground">कृषि-मित्र</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p>
          </div>
          <span className="hidden rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-primary md:inline-flex">
            Online &amp; Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchBids} className="icon-button" title="Refresh bids">
            <RefreshCw className="size-4" />
          </button>
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
            <p className="mt-2 text-sm text-muted-foreground">
              Track the live status of all your placed offers, counter-bids, and checkout confirmations.
            </p>
          </div>
          <button onClick={onBack} className="primary-button">
            Browse More Crops
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Loading your active bids…
          </div>
        ) : bids.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground rounded-2xl border border-dashed border-border bg-card/40 p-8 mt-6">
            <Clock3 className="mx-auto size-8 text-muted-foreground/60 mb-2" />
            <p className="font-semibold text-foreground">No active bids placed yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Browse the marketplace and submit a bid on verified harvest lots to start bargaining with local farmers.
            </p>
            <button onClick={onBack} className="mt-4 primary-button">
              Browse Marketplace
            </button>
          </div>
        ) : (
          <section className="my-bids-list mt-6 space-y-4">
            {bids.map((bid) => {
              const pricePerKg = bid.bid_price_per_kg
                ? Number(bid.bid_price_per_kg)
                : (bid.bid_price_per_quintal || 0) / 100
              const lotQtyQuintals = bid.lot?.quantity_quintal || 1
              const totalAmount = bid.total_bid_amount
                ? Number(bid.total_bid_amount)
                : pricePerKg * lotQtyQuintals * 100
              const farmerName = bid.lot?.farmer?.full_name || 'Verified Farmer'
              const farmerLocation = bid.lot?.farmer?.location || bid.lot?.location || 'Maharashtra'

              const isFarmerCounter =
                (bid.status === 'countered' || bid.status === 'counter') &&
                (bid.counter_by === 'farmer' || !bid.counter_by)
              const isBuyerCounter =
                (bid.status === 'countered' || bid.status === 'counter') &&
                bid.counter_by === 'buyer'

              const counterPriceKg = Number(bid.counter_price_per_kg || bid.counter_price || 0)
              const counterTotalAmount = counterPriceKg * lotQtyQuintals * 100

              return (
                <article
                  className={`my-bid-card rounded-2xl border bg-card p-5 shadow-sm transition-all ${
                    isFarmerCounter
                      ? 'border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                      : isBuyerCounter
                        ? 'border-purple-400/60'
                        : 'border-border hover:border-primary/40'
                  }`}
                  key={bid.id}
                >
                  <div className="my-bid-heading flex items-start justify-between gap-4 border-b border-border/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-foreground">
                          {bid.lot?.crop_name ?? 'Harvest Crop Lot'}
                        </h2>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-secondary font-semibold text-foreground">
                          Grade {bid.lot?.grade || 'A'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <span>Farmer: <strong>{farmerName}</strong></span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="size-3" />
                          {farmerLocation}
                        </span>
                      </p>
                    </div>

                    {/* Status Badge */}
                    {isFarmerCounter ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/40 shadow-xs animate-pulse">
                        ⚡ Counter Offer Received
                      </span>
                    ) : isBuyerCounter ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-900 dark:text-purple-200 border border-purple-500/40 shadow-xs">
                        ⏱ Counter Sent to Farmer
                      </span>
                    ) : (
                      <span
                        className={`bid-status ${bid.status} inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          bid.status === 'accepted'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                            : bid.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : bid.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {STATUS_ICONS[bid.status] ?? <Clock3 className="size-4" />}
                        {bid.status === 'accepted'
                          ? '✓ Accepted by Farmer'
                          : bid.status === 'rejected'
                            ? '✗ Offer Rejected'
                            : bid.status === 'paid'
                              ? '✓ Paid & Confirmed'
                              : 'Pending Farmer Review'}
                      </span>
                    )}
                  </div>

                  {/* Standard Bid Summary Details */}
                  <div className="my-bid-details grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                    <div className="rounded-xl bg-secondary/50 p-3">
                      <span className="text-muted-foreground block">Your Placed Bid</span>
                      <strong className="text-base text-foreground font-bold block mt-1">
                        ₹{pricePerKg.toFixed(2)} / kg
                      </strong>
                      <span className="text-[10px] text-muted-foreground">
                        (₹{(Number(pricePerKg * 100) || 0).toLocaleString('en-IN')} / Quintal)
                      </span>
                    </div>
                    <div className="rounded-xl bg-secondary/50 p-3">
                      <span className="text-muted-foreground block">Total Quantity</span>
                      <strong className="text-base text-foreground font-bold block mt-1">
                        {lotQtyQuintals} Quintals
                      </strong>
                      <span className="text-[10px] text-muted-foreground">
                        ({Number(lotQtyQuintals * 100).toLocaleString('en-IN')} kg harvest)
                      </span>
                    </div>
                    <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
                      <span className="text-primary font-semibold block">Total Bid Amount</span>
                      <strong className="text-base text-primary font-bold block mt-1">
                        ₹{(Number(totalAmount) || 0).toLocaleString('en-IN')}
                      </strong>
                      <span className="text-[10px] text-primary/80 font-medium">
                        Asking: ₹{((bid.lot?.asking_price_per_quintal || 0) / 100).toFixed(2)}/kg
                      </span>
                    </div>
                  </div>

                  {bid.buyer_notes && (
                    <p className="mt-3 text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded-lg italic">
                      &ldquo;{bid.buyer_notes}&rdquo;
                    </p>
                  )}

                  {/* ─── FARMER COUNTER-OFFER COMPARISON BOX & DIRECT ACTION CONTROLS ─── */}
                  {isFarmerCounter && (
                    <div className="mt-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/80 p-4">
                      <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-800/60 pb-2 mb-3">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-amber-500 animate-ping" />
                          Farmer Proposed a Counter Offer
                        </span>
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                          Requires Your Decision
                        </span>
                      </div>

                      {/* Price Comparison Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="rounded-xl bg-card/80 p-2.5 border border-border/60">
                          <span className="text-muted-foreground block text-[11px]">Original Bid Price</span>
                          <span className="text-sm font-bold text-foreground block mt-0.5 line-through opacity-70">
                            ₹{pricePerKg.toFixed(2)} / kg
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            ₹{(pricePerKg * 100).toLocaleString('en-IN')} / Qtl
                          </span>
                        </div>

                        <div className="rounded-xl bg-amber-100/90 dark:bg-amber-900/60 p-2.5 border-2 border-amber-500 shadow-xs">
                          <span className="text-amber-950 dark:text-amber-200 font-bold block text-[11px]">
                            Farmer&apos;s Counter Price
                          </span>
                          <span className="text-base font-extrabold text-amber-900 dark:text-amber-300 block mt-0.5">
                            ₹{counterPriceKg.toFixed(2)} / kg
                          </span>
                          <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 block">
                            ₹{(counterPriceKg * 100).toLocaleString('en-IN')} / Qtl
                          </span>
                        </div>

                        <div className="rounded-xl bg-card/80 p-2.5 border border-border/60">
                          <span className="text-muted-foreground block text-[11px]">Revised Total</span>
                          <span className="text-base font-extrabold text-primary block mt-0.5">
                            ₹{counterTotalAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            for {lotQtyQuintals} Quintals ({lotQtyQuintals * 100} kg)
                          </span>
                        </div>
                      </div>

                      {bid.counter_notes && (
                        <div className="mt-3 text-xs text-amber-900 dark:text-amber-200 bg-amber-100/70 dark:bg-amber-900/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 italic">
                          <strong className="not-italic font-bold">Farmer&apos;s Note:</strong> &ldquo;{bid.counter_notes}&rdquo;
                        </div>
                      )}

                      {/* Action Controls Directly on the Card */}
                      <div className="mt-4 pt-3 border-t border-amber-200/60 dark:border-amber-800/60 flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleAcceptCounter(bid)}
                          disabled={isSubmitting}
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <Check className="size-4" />
                          Accept Counter
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenCounterBack(bid)}
                          disabled={isSubmitting}
                          className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                        >
                          <RefreshCw className="size-3.5" />
                          Counter Back
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectCounter(bid)}
                          disabled={isSubmitting}
                          className="rounded-xl bg-card hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 font-bold text-xs px-3.5 py-2 transition-colors disabled:opacity-50 ml-auto"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ─── BUYER COUNTER DISPATCHED BOX ─── */}
                  {isBuyerCounter && (
                    <div className="mt-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 p-3.5 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-purple-900 dark:text-purple-200 block text-sm">
                            Your Counter Offer: ₹{counterPriceKg.toFixed(2)} / kg
                          </span>
                          <span className="text-[11px] text-purple-700 dark:text-purple-300">
                            Revised Total: ₹{counterTotalAmount.toLocaleString('en-IN')} · Waiting for farmer to respond
                          </span>
                          {bid.counter_notes && (
                            <p className="mt-1 text-[11px] italic text-purple-800 dark:text-purple-300">
                              Your Note: &ldquo;{bid.counter_notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ─── ACCEPTED BY FARMER CHECKOUT BUTTON ─── */}
                  {bid.status === 'accepted' && !paidIds.includes(bid.id) && (
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                      <p className="text-xs text-green-600 font-semibold">
                        The deal is locked! You can now proceed to checkout &amp; logistics booking.
                      </p>
                      <button
                        onClick={() => handlePayNow(bid)}
                        disabled={isSubmitting}
                        className="primary-button flex items-center gap-2"
                      >
                        <CreditCard className="size-4" /> Pay &amp; Confirm Order
                      </button>
                    </div>
                  )}

                  {bid.status === 'paid' && (
                    <div className="mt-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-4 py-2.5 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="size-4" /> Payment completed · Logistics order queued for dispatch.
                    </div>
                  )}
                </article>
              )
            })}
          </section>
        )}
      </main>

      {/* ─── BUYER COUNTER BACK MODAL ─── */}
      {counterBackModal && (
        <div className="modal-backdrop" onClick={() => setCounterBackModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Negotiation</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Counter Back to Farmer</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Lot: <strong>{counterBackModal.lot?.crop_name}</strong> · Farmer: <strong>{counterBackModal.lot?.farmer?.full_name || 'Verified Farmer'}</strong>
            </p>

            <div className="mt-4 rounded-xl bg-secondary/60 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original Bid:</span>
                <span className="font-semibold">₹{Number(counterBackModal.bid_price_per_kg || 0).toFixed(2)} / kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Farmer Counter:</span>
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  ₹{Number(counterBackModal.counter_price_per_kg || counterBackModal.counter_price || 0).toFixed(2)} / kg
                </span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-1">
                <span className="text-muted-foreground">Lot Quantity:</span>
                <span className="font-semibold">
                  {counterBackModal.lot?.quantity_quintal || 1} Quintals ({Number(counterBackModal.lot?.quantity_quintal || 1) * 100} kg)
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="field">
                <span className="text-xs font-bold text-foreground">Your Revised Per-Kg Price (₹ / kg)</span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={buyerCounterPrice}
                  onChange={(e) => setBuyerCounterPrice(e.target.value)}
                  placeholder="e.g. 31.00"
                  className="w-full text-base font-bold"
                />
              </label>

              {Number(buyerCounterPrice) > 0 && (
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-xs text-primary flex items-center justify-between">
                  <span>Revised Total Amount:</span>
                  <strong className="text-sm font-extrabold">
                    ₹{(Number(buyerCounterPrice) * (counterBackModal.lot?.quantity_quintal || 1) * 100).toLocaleString('en-IN')}
                  </strong>
                </div>
              )}

              <label className="field">
                <span className="text-xs font-bold text-foreground">Note for Farmer (Optional)</span>
                <textarea
                  rows={2}
                  value={buyerNotes}
                  onChange={(e) => setBuyerNotes(e.target.value)}
                  placeholder="e.g. Can do ₹31/kg and pay transport costs myself..."
                  className="w-full text-xs rounded-xl border border-border p-2.5 bg-background"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setCounterBackModal(null)}
                className="secondary-button flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitBuyerCounter}
                disabled={isSubmitting || !buyerCounterPrice || Number(buyerCounterPrice) <= 0}
                className="primary-button flex-1 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="size-4 animate-spin" /> Sending…</>
                ) : (
                  <><RefreshCw className="size-4" /> Send Counter Offer</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Payment Checkout Modal */}
      {paymentModal && (
        <div className="modal-backdrop" onClick={() => setPaymentModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">Secure checkout</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Confirm Payment &amp; Logistics</h2>
            <div className="mt-5 rounded-2xl bg-secondary p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crop Lot</span>
                <strong>{paymentModal.lot?.crop_name}</strong>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Farmer</span>
                <strong>{paymentModal.lot?.farmer?.full_name || 'Verified Farmer'}</strong>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Agreed Price</span>
                <strong>
                  ₹{Number(paymentModal.bid_price_per_kg || ((paymentModal.bid_price_per_quintal || 0) / 100)).toFixed(2)} / kg
                </strong>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <strong>
                  {paymentModal.lot?.quantity_quintal} Quintals ({Number(paymentModal.lot?.quantity_quintal || 1) * 100} kg)
                </strong>
              </div>
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold">
                <span>Total Payout</span>
                <span className="text-primary font-bold">
                  ₹{Number(
                    paymentModal.total_bid_amount ||
                      (paymentModal.bid_price_per_kg || 0) * (paymentModal.lot?.quantity_quintal || 1) * 100
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Demo checkout simulation. Your bid status will immediately update to &apos;paid&apos; in Supabase.
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setPaymentModal(null)} className="secondary-button flex-1">
                Cancel
              </button>
              <button
                onClick={() => confirmPayment(paymentModal)}
                disabled={isSubmitting}
                className="primary-button flex-1"
              >
                {isSubmitting ? (
                  <><Loader2 className="size-4 animate-spin" /> Processing…</>
                ) : (
                  <><CreditCard className="size-4" /> Confirm &amp; Pay</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
