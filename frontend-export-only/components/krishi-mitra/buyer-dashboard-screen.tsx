'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, Bell, Check, IndianRupee, Loader2, LocateFixed, MapPin, Minus, Search, ShieldCheck, X } from 'lucide-react'
import { Language } from './krishi-mitra-app'
import { getAvailableCrops } from '@/lib/actions/crop-actions'
import { placeBid, getBidsForLot } from '@/lib/actions/bid-actions'
import { getNotificationsForUser, markNotificationRead } from '@/lib/actions/notification-actions'
import type { AppNotification, Bid, CropLot } from '@/types/database'

type Props = { userName: string; onLogout: () => void; onProfile: () => void; onMyBids: () => void }

const priceRows = [['Onion', '₹29.20 / kg', 'up', '+8.4%'], ['Basmati Rice', '₹35.60 / kg', 'up', '+4.1%'], ['Tur Dal', '₹83.50 / kg', 'down', '-2.6%'], ['Wheat', '₹24.80 / kg', 'stable', '+0.3%']] as const

function Trend({ type, text }: { type: 'up' | 'down' | 'stable'; text: string }) {
  const Icon = type === 'up' ? ArrowUp : type === 'down' ? ArrowDown : Minus
  return <span className={`market-trend ${type}`}><Icon className="size-3" />{text}</span>
}

export default function BuyerDashboardScreen({ userName, onLogout, onProfile, onMyBids }: Props) {
  const [view, setView] = useState<'buy' | 'trending'>('buy')
  const [query, setQuery] = useState('')
  const [gradeFilter, setGradeFilter] = useState('Any quality grade')
  const [regionFilter, setRegionFilter] = useState('All regions')
  const [nearMeOnly, setNearMeOnly] = useState(false)
  const [buyerLocation, setBuyerLocation] = useState<string | null>(null)
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

  // Fetch live crop lots from Supabase PostgreSQL database
  const fetchLots = useCallback(async () => {
    setLoadingLots(true)
    const result = await getAvailableCrops({
      safeOnly,
      grade: gradeFilter,
      location: regionFilter !== 'All regions' ? regionFilter : undefined,
      matchBuyerLocation: nearMeOnly,
    })
    if (result.data) {
      setLots(result.data as CropLot[])
    } else {
      setLots([])
    }
    if (result.buyerLocation) {
      setBuyerLocation(result.buyerLocation)
    }
    setLoadingLots(false)
  }, [safeOnly, gradeFilter, regionFilter, nearMeOnly])

  useEffect(() => {
    fetchLots()
  }, [fetchLots])

  useEffect(() => {
    async function loadNotifications() {
      const res = await getNotificationsForUser()
      if (res.data) setNotifications(res.data)
    }
    loadNotifications()
  }, [])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications])

  const visible = useMemo(
    () => lots.filter((lot) => {
      const matchQuery = lot.crop_name.toLowerCase().includes(query.toLowerCase()) || lot.location.toLowerCase().includes(query.toLowerCase())
      const matchSafe = !safeOnly || lot.pesticide_safe_flag
      const matchGrade = gradeFilter === 'Any quality grade' || lot.grade === gradeFilter.replace('Grade ', '').replace(' Certified', '')
      return matchQuery && matchSafe && matchGrade
    }),
    [lots, query, safeOnly, gradeFilter]
  )

  const openOffer = useCallback(async (lot: CropLot) => {
    setSelected(lot)
    const initialPricePerKg = Number((lot.asking_price_per_quintal / 100).toFixed(2))
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
      fetchLots()
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

  return (
    <div className="min-h-screen bg-background">
      <header className="topbar">
        <div><p className="font-serif text-lg font-bold text-foreground">कृषि-मित्र</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p></div>
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
              <p className="mt-2 text-sm text-muted-foreground">Direct from verified farmers · Proximity matched · Live Supabase database</p>
            </div>
            {buyerLocation && (
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                <MapPin className="size-3.5" /> Your location: <strong>{buyerLocation}</strong>
              </div>
            )}
          </div>

          <div className="buyer-tabs">
            <span className="buyer-view-label">{view === 'buy' ? 'Live Marketplace Listings' : 'Trending Mandi Prices'}</span>
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
                  <button
                    type="button"
                    onClick={() => { setNearMeOnly(!nearMeOnly); setRegionFilter('All regions') }}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                      nearMeOnly
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-card text-foreground hover:bg-secondary'
                    }`}
                  >
                    <LocateFixed className="size-3.5" /> Near Me {buyerLocation ? `(${buyerLocation})` : ''}
                  </button>
                </div>
                <label className="safe-toggle"><input type="checkbox" checked={safeOnly} onChange={(e) => setSafeOnly(e.target.checked)} /> <ShieldCheck className="size-4" /> Show only verified-safe listings</label>
              </section>

              <section className="buyer-lots">
                {loadingLots ? (
                  <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" /> Loading live crops from Supabase…
                  </div>
                ) : visible.length === 0 ? (
                  <div className="py-20 text-center text-sm text-muted-foreground rounded-2xl border border-dashed border-border bg-card/40 p-8">
                    <MapPin className="mx-auto size-8 text-muted-foreground/60 mb-2" />
                    <p className="font-semibold text-foreground">No crops found matching your filters</p>
                    <p className="mt-1 text-xs text-muted-foreground">Try clearing your search query or selecting &quot;All regions&quot; to browse all available harvest lots.</p>
                    <button
                      onClick={() => { setQuery(''); setGradeFilter('Any quality grade'); setRegionFilter('All regions'); setNearMeOnly(false); setSafeOnly(false) }}
                      className="mt-4 rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary/80"
                    >
                      Reset All Filters
                    </button>
                  </div>
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
                          {lot.needs_transport && <span className="ml-2 text-[11px] text-muted-foreground">🚛 Transport needed</span>}
                        </div>
                        <div className="buyer-lot-footer">
                          <span>{lot.farmer?.full_name ?? 'Verified Farmer'}<small>{lot.quantity_quintal} Q ({lot.quantity_quintal * 100} kg)</small></span>
                          <strong>₹{(lot.asking_price_per_quintal / 100).toFixed(2)}<small>Asking price / kg (₹{lot.asking_price_per_quintal.toLocaleString('en-IN')}/Q)</small></strong>
                        </div>
                        <button onClick={() => openOffer(lot)} className="make-offer-button">Place Bid / Offer <ArrowRight className="size-4" /></button>
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
                {['New bid on Wheat lot — ₹25.00 / kg', 'FreshFields offered ₹29.50 / kg for Onion', 'Organic Tur Dal received a new offer'].map((item) => (
                  <p key={item}><span className="live-dot">●</span>{item}<small>Just now</small></p>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Place Bid / Make Offer Modal */}
      {selected && (
        <div className="offer-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="offer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}><X className="size-4" /></button>
            <p className="eyebrow">Live Digital Bidding</p>
            <h2>Bid on {selected.crop_name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Asking: ₹{(selected.asking_price_per_quintal / 100).toFixed(2)} / kg (₹{selected.asking_price_per_quintal.toLocaleString('en-IN')} / Q) · {selected.quantity_quintal * 100} kg available</p>

            {offerSent ? (
              <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl bg-secondary p-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-6" /></div>
                <p className="font-bold text-foreground">Bid Submitted Successfully!</p>
                <p className="text-sm text-muted-foreground">
                  Your bid of ₹{Number(offer).toFixed(2)}/kg (Total: ₹{(Number(offer) * selected.quantity_quintal * 100).toLocaleString('en-IN')}) has been recorded and the farmer has been notified.
                </p>
                <button onClick={() => setSelected(null)} className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">Done</button>
              </div>
            ) : (
              <>
                <div className="mt-4 rounded-2xl bg-secondary/70 p-4 border border-border/80 text-sm">
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                    <span>Available Quantity</span>
                    <span className="font-bold text-foreground">{selected.quantity_quintal * 100} kg ({selected.quantity_quintal} Q)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                    <span>Farmer Asking Price</span>
                    <span className="font-bold text-foreground">₹{(selected.asking_price_per_quintal / 100).toFixed(2)} / kg</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold border-t border-border/60 pt-2 mt-2 text-primary">
                    <span>Calculated Total Bid Amount</span>
                    <span>₹{(Number(offer || 0) * selected.quantity_quintal * 100).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-1.5 text-sm font-semibold">
                  <label htmlFor="bid-price-input" className="flex items-center justify-between">
                    <span>Your Bid Price (₹ / kg)</span>
                    <span className="text-xs font-normal text-muted-foreground">min ₹1.00/kg</span>
                  </label>
                  <input
                    id="bid-price-input"
                    type="number"
                    step="0.01"
                    min="1"
                    value={offer}
                    onChange={(e) => setOffer(e.target.value)}
                    placeholder="Enter bid price per kg"
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Live Bids for this Lot Section */}
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                    <span>Current Live Bids</span>
                    <span className="text-primary font-normal">{lotBids.length} placed</span>
                  </p>
                  {loadingLotBids ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><Loader2 className="size-3 animate-spin" /> Loading bids…</div>
                  ) : lotBids.length === 0 ? (
                    <div className="rounded-xl bg-secondary/50 p-2.5 text-xs text-muted-foreground text-center">No bids yet on this lot. Place the first bid!</div>
                  ) : (
                    <div className="max-h-32 overflow-y-auto space-y-1.5 rounded-xl border border-border/60 p-2 bg-secondary/30">
                      {lotBids.map((b, i) => (
                        <div key={b.id || i} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-card/90 border border-border/40">
                          <span className="font-semibold">{b.buyer?.full_name || 'Verified Buyer'} {i === 0 && <span className="ml-1 text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold">Highest</span>}</span>
                          <span className="font-bold text-primary">₹{Number(b.bid_price_per_kg).toFixed(2)}/kg <span className="text-muted-foreground font-normal">(Total: ₹{Number(b.total_bid_amount).toLocaleString('en-IN')})</span></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {offerError && <p role="alert" className="mt-2 text-sm font-semibold text-destructive">{offerError}</p>}
                <button disabled={!offer || Number(offer) <= 0 || isSubmitting} onClick={submitOffer} className="submit-offer mt-5 w-full">
                  {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> Placing Live Bid…</> : <>Place Live Bid <Check className="size-4" /></>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
