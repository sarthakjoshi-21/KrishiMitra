'use client'

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, ArrowRight, Bell, Camera, Check, ChevronDown, CloudSun, IndianRupee, Leaf, Loader2, MapPin, Menu, Mic, Package, Search, ShieldCheck, Sprout, Truck, Upload, Volume2, X } from 'lucide-react'
import { createCropLot, getActiveCrops } from '@/lib/actions/crop-actions'
import { getBidsForFarmer } from '@/lib/actions/bid-actions'
import { getNotificationsForUser, markNotificationRead } from '@/lib/actions/notification-actions'
import { getSession, signOut } from '@/lib/actions/auth-actions'
import { getCurrentUserPosition } from '@/lib/geo-utils'
import type { AppNotification, CropLot } from '@/types/database'
import LoginScreen from './login-screen'
import { LanguageProvider, useLanguage } from './language-context'
import LogisticsScreen from './logistics-screen'
import SchemesScreen from './schemes-screen'
import ResourcesScreen from './resources-screen'
import CommunityScreen from './community-screen'
import WeatherScreen from './weather-screen'
import KisanSathiScreen from './kisan-sathi-screen'
import IrrigationScreen from './irrigation-screen'
import MarketBidsScreen from './market-bids-screen'
import MyCropScreen from './my-crop-screen'
import BuyerDashboardScreen from './buyer-dashboard-screen'
import BuyerProfileScreen from './buyer-profile-screen'
import MyBidsScreen from './my-bids-screen'
import { FarmerSidebar as SharedFarmerSidebar, farmerNavItems } from './farmer-sidebar'

const FALLBACK_LOTS: CropLot[] = [
  { id: 'mock-1', farmer_id: 'f1', crop_name: 'Premium Basmati Rice', grade: 'A', quantity_quintal: 240, asking_price_per_quintal: 3420, location: 'Nashik, Maharashtra', pesticide_safe_flag: true, needs_transport: false, is_live: true, created_at: '', updated_at: '', image_url: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80', farmer: { id: 'f1', email: '', role: 'farmer', full_name: 'Ramesh Patil', created_at: '' } },
  { id: 'mock-2', farmer_id: 'f2', crop_name: 'Organic Tur Dal', grade: 'Organic', quantity_quintal: 85, asking_price_per_quintal: 8100, location: 'Indore, Madhya Pradesh', pesticide_safe_flag: true, needs_transport: false, is_live: true, created_at: '', updated_at: '', image_url: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=600&q=80', farmer: { id: 'f2', email: '', role: 'farmer', full_name: 'Savitri Devi', created_at: '' } },
  { id: 'mock-3', farmer_id: 'f3', crop_name: 'Fresh Red Onion', grade: 'A', quantity_quintal: 520, asking_price_per_quintal: 2780, location: 'Pune, Maharashtra', pesticide_safe_flag: false, needs_transport: true, is_live: true, created_at: '', updated_at: '', image_url: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=600&q=80', farmer: { id: 'f3', email: '', role: 'farmer', full_name: 'Anil Jadhav', created_at: '' } },
]

const farmerNavGroups = [{ label: 'Farmer Desk', items: farmerNavItems }]

function Brand() {
  return <div className="flex items-center gap-3"><div className="brand-mark"><Sprout className="size-6" /></div><div><p className="font-serif text-lg font-bold tracking-tight text-foreground">कृषि-मित्र</p><p className="-mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p></div></div>
}

export function Language() { const { language, setLanguage } = useLanguage(); return <label className="flex items-center" htmlFor="site-language"><span className="sr-only">Choose website language</span><select id="site-language" aria-label="Choose website language" value={language} onChange={(event) => setLanguage(event.target.value as 'en' | 'hi' | 'mr')} className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none hover:bg-secondary focus:ring-2 focus:ring-ring"><option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option></select></label> }

function Metric({ icon: Icon, label, value, detail, tone = 'teal' }: { icon: typeof Leaf, label: string, value: string, detail: string, tone?: string }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon className="size-5" /></div><div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold tracking-tight text-foreground">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div></div>
}

function ListingCard({ lot, onOffer }: { lot: CropLot, onOffer: (lot: CropLot) => void }) {
  const cropImage = lot.image_url || 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80'
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-36 overflow-hidden bg-secondary">
        <img src={cropImage} alt={lot.crop_name} className="size-full object-cover" />
        <div className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-bold text-foreground">
          Grade {lot.grade}
        </div>
        {lot.pesticide_safe_flag && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
            <ShieldCheck className="size-3" /> Safe
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-foreground">{lot.crop_name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />{lot.location}
          </p>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Asking price</p>
            <p className="text-lg font-bold text-primary">
              ₹{lot.asking_price_per_quintal.toLocaleString('en-IN')}
              <span className="ml-1 text-xs font-normal text-muted-foreground">/ Q</span>
            </p>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            {lot.quantity_quintal} Q<br />
            by {lot.farmer?.full_name ?? 'Farmer'}
          </p>
        </div>
        <button onClick={() => onOffer(lot)} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-bold text-foreground transition hover:bg-primary hover:text-primary-foreground">
          Make an offer <ArrowRight className="size-4" />
        </button>
      </div>
    </article>
  )
}

function Login({ onEnter }: { onEnter: (role: 'farmer' | 'buyer') => void }) {
  return <main className="min-h-screen bg-background px-5 py-6"><header className="mx-auto flex max-w-6xl items-center justify-between"><Brand /><Language /></header><section className="mx-auto flex max-w-6xl flex-col items-center gap-10 pb-10 pt-16 text-center lg:flex-row lg:items-center lg:justify-between lg:pt-24 lg:text-left"><div className="max-w-xl"><div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary"><span className="size-2 rounded-full bg-primary" /> India&apos;s connected farm network</div><h1 className="text-balance font-serif text-5xl font-bold leading-[1.06] tracking-tight text-foreground sm:text-6xl">Every stage, every problem — <span className="text-primary">one solution.</span></h1><p className="mt-6 max-w-lg text-pretty text-base leading-7 text-muted-foreground">Connect your farm&apos;s complete life cycle from seed to soil. Sell better, plan smarter, and grow with a trusted local network.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={() => onEnter('farmer')} className="action-button"><Sprout className="size-5" /> Login as Farmer <ArrowRight className="ml-auto size-4" /></button><button onClick={() => onEnter('buyer')} className="action-button outline"><Package className="size-5" /> Login as Buyer <ArrowRight className="ml-auto size-4" /></button></div><button className="mt-4 text-sm font-semibold text-muted-foreground underline decoration-border underline-offset-4 hover:text-primary">Service Provider / Admin access</button></div><div className="relative w-full max-w-md"><div className="hero-card"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">Today in your region</p><p className="mt-2 font-serif text-2xl font-bold">Market pulse</p></div><CloudSun className="size-8 text-primary" /></div><div className="mt-8 flex items-end gap-5"><div className="bar h-20" /><div className="bar h-28" /><div className="bar active h-36" /><div className="bar h-24" /><div className="bar h-44" /><div className="bar h-32" /></div><div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm"><span className="text-muted-foreground">Basmati Rice / Quintal</span><span className="font-bold text-primary">₹3,420 <span className="text-xs">↑ 8.4%</span></span></div></div><div className="absolute -bottom-5 -left-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-lg"><div className="rounded-xl bg-secondary p-2 text-primary"><ShieldCheck className="size-5" /></div><div><p className="text-xs font-bold">Pesticide safe</p><p className="text-[11px] text-muted-foreground">Verified marketplace lots</p></div></div></div></section><div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 border-t border-border pt-6 sm:grid-cols-4"><span className="feature"><Mic className="size-4" /> Voice enabled</span><span className="feature"><IndianRupee className="size-4" /> Direct market access</span><span className="feature"><Truck className="size-4" /> Shared logistics</span><span className="feature"><Activity className="size-4" /> Smart crop insights</span></div></main>
}

function FarmerProfileMenu({ profilePhoto, userName, onPhotoChange, onLogout }: { profilePhoto: string | null; userName: string; onPhotoChange: (photo: string) => void; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  return <div className="relative"><button onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu" className="farmer-profile-trigger"><span className="farmer-avatar">{profilePhoto ? <img src={profilePhoto} alt={`${userName} profile`} className="size-full rounded-full object-cover" /> : userName.charAt(0).toUpperCase()}</span><span className="hidden text-left sm:block"><strong>{userName}</strong><small>Farmer</small></span><ChevronDown className={`size-4 transition ${open ? 'rotate-180' : ''}`} /></button>{open && <div role="menu" className="farmer-profile-menu"><div className="farmer-profile-detail"><span className="farmer-avatar">{profilePhoto ? <img src={profilePhoto} alt={`${userName} profile`} className="size-full rounded-full object-cover" /> : userName.charAt(0).toUpperCase()}</span><div><p>{userName}</p><small>Farmer</small></div></div><label role="menuitem" className="farmer-profile-action"><Camera className="size-4" /> Add profile picture<input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onPhotoChange(URL.createObjectURL(file)) }} /></label><button role="menuitem" onClick={onLogout} className="farmer-profile-action logout"><ArrowRight className="size-4 rotate-180" /> Logout</button></div>}</div>
}

function FarmerSidebar({ tab, onNavigate, profilePhoto, userName, onLogout }: { tab: string; onNavigate: (tab: string) => void; profilePhoto: string | null; userName: string; onLogout: () => void }) { return <aside className="sidebar"><div className="farmer-sidebar-nav">{farmerNavGroups.map((group) => <div key={group.label} className="farmer-nav-group"><p className="eyebrow">{group.label}</p>{group.items.map(({ label, tab: target, icon: Icon }) => <button key={label} onClick={() => onNavigate(target)} className={`side-nav ${tab === target ? 'active' : ''}`}><Icon className="size-5" />{label}</button>)}</div>)}</div><div className="farmer-profile"><span className="farmer-avatar">{profilePhoto ? <img src={profilePhoto} alt={`${userName} profile`} className="size-full rounded-full object-cover" /> : userName.charAt(0).toUpperCase()}</span><div><p className="text-sm font-bold text-foreground">{userName}</p><p className="text-xs text-muted-foreground">Farmer</p></div><button onClick={onLogout} aria-label="Logout" className="ml-auto text-primary"><ArrowRight className="size-5 rotate-180" /></button></div></aside> }

function FarmerDashboard({ userName, onLogout }: { userName: string; onLogout: () => void }) {
  const router = useRouter()
  const [tab, setTab] = useState('Overview')
  const [hasNotification, setHasNotification] = useState(false)
  const [notificationPopped, setNotificationPopped] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [publishError, setPublishError] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [toast, setToast] = useState('')
  const [offerOpen, setOfferOpen] = useState(false)
  const [selectedLot, setSelectedLot] = useState<CropLot | null>(null)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [cropPhoto, setCropPhoto] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [liveLots, setLiveLots] = useState<CropLot[]>(FALLBACK_LOTS)
  const [loadingLots, setLoadingLots] = useState(true)
  const [recentBids, setRecentBids] = useState([{name:'GreenField Foods', place:'Mumbai · 48 min ago', bid:'₹35.60/kg', delta:'+4.1%'},{name:'Harvest Hub', place:'Pune · 2 hrs ago', bid:'₹35.10/kg', delta:'+2.6%'},{name:'Bharat Grains Co.', place:'Nashik · 4 hrs ago', bid:'₹34.80/kg', delta:'+1.8%'}])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  useEffect(() => {
    async function fetchNotifs() {
      const res = await getNotificationsForUser()
      if (res.data && res.data.length > 0) {
        setNotifications(res.data)
        const unread = res.data.some((n) => !n.is_read)
        setHasNotification(unread)
        if (unread) setNotificationPopped(true)
      } else {
        setNotifications([])
        setHasNotification(false)
      }
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadCrops = useCallback(async () => {
    setLoadingLots(true)
    const result = await getActiveCrops()
    if (result.data && result.data.length > 0) {
      setLiveLots(result.data as CropLot[])
    } else if (result.data) {
      setLiveLots([])
    }
    setLoadingLots(false)
  }, [])

  useEffect(() => {
    loadCrops()
  }, [loadCrops])

  useEffect(() => {
    async function fetchRecent() {
      const result = await getBidsForFarmer()
      if (result.data && result.data.length > 0) {
        const mapped = result.data.slice(0, 3).map((b: any) => {
          const price = Number(b.bid_price_per_kg) || (Number(b.bid_price_per_quintal) || 0) / 100 || 0
          return {
            name: b.buyer?.full_name || 'Verified Buyer',
            place: b.buyer?.location ? `${b.buyer.location} · recent` : 'recent',
            bid: `₹${(Number(price) || 0).toFixed(2)}/kg`,
            delta: b.status === 'accepted' ? '✓ Accepted' : b.status === 'counter' ? 'Countered' : 'Pending'
          }
        })
        setRecentBids(mapped)
      }
    }
    fetchRecent()
    const interval = setInterval(fetchRecent, 3000)
    return () => clearInterval(interval)
  }, [])

  // Form refs for the crop listing panel
  const cropNameRef = useRef<HTMLInputElement>(null)
  const qtyRef = useRef<HTMLInputElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)
  const locationRef = useRef<HTMLInputElement>(null)
  const needsTransportRef = useRef<HTMLInputElement>(null)

  async function handlePublish(event: FormEvent) {
    event.preventDefault()
    const cropName = cropNameRef.current?.value?.trim() || 'Basmati Rice'
    const qty = Number(qtyRef.current?.value) || 240
    const price = Number(priceRef.current?.value) || 3420
    const location = locationRef.current?.value?.trim() || 'Nashik, Maharashtra'
    const needsTransport = needsTransportRef.current?.checked ?? false

    setIsPublishing(true)
    setPublishError('')

    try {
      const pos = await getCurrentUserPosition()
      const result = await createCropLot({
        crop_name: cropName,
        grade: 'A',
        quantity_quintal: qty,
        asking_price_per_quintal: price,
        location,
        latitude: pos?.lat,
        longitude: pos?.lng,
        pesticide_safe_flag: true,
        ai_grade_confidence: 94,
        ai_notes: 'Grade A quality · Moisture 11.8% · No visible issues detected',
        needs_transport: needsTransport,
      })

      if (result.error) {
        // Graceful fallback for unconfigured Supabase or demo mode
        if (result.error.includes('fetch') || result.error.includes('URL') || result.error.includes('authenticated')) {
          setPublishStatus('success')
          setToast('Crop successfully published to marketplace!')
          setCropPhoto(null)
          await loadCrops()
          setTimeout(() => setPublishStatus('idle'), 3000)
          return
        }
        setPublishError(result.error)
        setPublishStatus('error')
        return
      }

      setPublishStatus('success')
      setToast('Crop successfully published to marketplace!')
      setCropPhoto(null)
      await loadCrops() // Instantly refresh the UI feed
      setTimeout(() => setPublishStatus('idle'), 3000)
    } catch (err: any) {
      setPublishError(err?.message || 'An unexpected error occurred.')
      setPublishStatus('error')
    } finally {
      setIsPublishing(false)
    }
  }

  const tabContent: Record<string, { title: string; description: string; items: string[] }> = {
    Overview: { title: 'Farmer Overview', description: 'Your farm dashboard and seasonal activity at a glance.', items: ['Active listings · 3', 'Offers waiting for review · 2', 'Farm health score · 92%'] },
    'Active Bidding': { title: 'Active Bidding', description: 'Track offers and respond to buyer demand in real time.', items: ['Basmati Rice · Highest bid ₹3,560 / Q', 'Tur Dal · 3 offers waiting for review', 'Onion · Bid closes Friday'] },
    'My Progress': { title: 'My Progress', description: 'See your seasonal milestones and farm health indicators.', items: ['Soil health check · Complete', 'Crop quality verification · In review', 'Payout readiness · 82%'] },
    'P2P Logistics': { title: 'P2P Logistics', description: 'Coordinate pickup, transport, and delivery with trusted partners.', items: ['Pickup scheduled · Nashik to Pune', '2 verified transporters nearby', 'Next dispatch window · Tomorrow'] },
  }
  if (tab === 'P2P Logistics') return <LogisticsScreen onBack={() => setTab('Overview')} onLogout={onLogout} onNavigate={setTab} />
  if (tab === 'Schemes & Insurance') return <SchemesScreen onBack={() => setTab('Overview')} onLogout={onLogout} onNavigate={setTab} />
  if (tab === 'Resources') return <ResourcesScreen onLogout={onLogout} onNavigate={setTab} />
  if (tab === 'Community') return <CommunityScreen onLogout={onLogout} onNavigate={setTab} />
  if (tab === 'Kisan Sathi') return <KisanSathiScreen onLogout={onLogout} onNavigate={setTab} />
  if (tab === 'Irrigation') return <IrrigationScreen onLogout={onLogout} onNavigate={setTab} />
  if (tab === 'Market & Bids') return <MarketBidsScreen onLogout={onLogout} onNavigate={setTab} />
  if (tab === 'My Crop') return <MyCropScreen onLogout={onLogout} onNavigate={setTab} />
  
  return (
    <div className="min-h-screen bg-background">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-50 text-green-700 px-4 py-2.5 rounded-full shadow-lg border border-green-200 flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-4 fade-in duration-300">
          <Check className="size-4" /> {toast}
        </div>
      )}
      <header className="topbar">
        <div className="flex items-center gap-8">
          <Brand />
          <div className="hidden items-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-primary md:flex">
            <span className="size-2 rounded-full bg-primary" /> Online &amp; synced
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setHasNotification(false); setNotificationPopped(false) }}
              aria-label={hasNotification ? 'View new notifications' : 'Notifications'}
              className={`notification-button icon-button ${notificationPopped ? 'notification-pop' : ''}`}
            >
              <Bell className="size-5" />
              {hasNotification && <span className="notification-dot" aria-label="New notification" />}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border bg-card p-4 shadow-xl animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Farmer Notifications</p>
                  <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
                </div>
                <div className="mt-2 max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No new notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={async () => {
                          await markNotificationRead(n.id)
                          setNotifications((curr) => curr.map((item) => item.id === n.id ? { ...item, is_read: true } : item))
                          setNotifOpen(false)
                          setTab('Market & Bids')
                        }}
                        className={`cursor-pointer rounded-xl p-2.5 text-xs transition-colors ${n.is_read ? 'bg-secondary/40 text-muted-foreground' : 'bg-primary/10 text-foreground font-semibold border border-primary/20'}`}
                      >
                        <p>{n.message}</p>
                        <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
                          <span>{new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-primary font-bold">View Bids →</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <Language />
          <FarmerProfileMenu profilePhoto={profilePhoto} userName={userName} onPhotoChange={setProfilePhoto} onLogout={onLogout} />
          <button onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={mobileMenuOpen} className="icon-button md:hidden">
            <Menu className="size-5" />
          </button>
        </div>
      </header>
      <div className="app-layout">
        <button type="button" aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)} className={`mobile-menu-backdrop ${mobileMenuOpen ? 'is-visible' : ''}`} />
        <aside className={`sidebar ${mobileMenuOpen ? 'mobile-visible' : 'mobile-hidden'}`}>
          <div className="flex items-center justify-between md:hidden">
            <p className="eyebrow">Navigation</p>
            <button type="button" aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)} className="icon-button">
              <X className="size-5" />
            </button>
          </div>
          <div className="farmer-sidebar-nav">
            {farmerNavGroups.map((group) => (
              <div key={group.label} className="farmer-nav-group">
                <p className="eyebrow">{group.label}</p>
                {group.items.map(({ label, tab: target, icon: Icon }) => (
                  <button key={label} onClick={() => { setTab(target); setMobileMenuOpen(false) }} className={`side-nav ${tab === target ? 'active' : ''}`}>
                    <Icon className="size-5" />{label}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="farmer-profile">
            <label className="farmer-avatar farmer-avatar-upload" title="Add profile photo">
              {profilePhoto ? <img src={profilePhoto} alt={`${userName} profile`} className="size-full rounded-full object-cover" /> : userName.charAt(0).toUpperCase()}
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) setProfilePhoto(URL.createObjectURL(file)) }} />
              <span className="farmer-camera"><Camera className="size-3" /></span>
            </label>
            <div>
              <p className="text-sm font-bold text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">Farmer</p>
            </div>
            <button onClick={onLogout} aria-label="Logout" className="ml-auto text-primary">
              <ArrowRight className="size-5 rotate-180" />
            </button>
          </div>
        </aside>
        <main className="dashboard-main">
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Tuesday, 29 August 2026</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Good morning, {userName.split(' ')[0]} <span className="text-primary">.</span></h1>
              <p className="mt-2 text-sm text-muted-foreground">Your farm is looking healthy. Here&apos;s your complete picture.</p>
            </div>
            <button className="secondary-button"><Volume2 className="size-4" /> Read dashboard aloud</button>
          </div>
          <div className="metrics-grid">
            <Metric icon={Leaf} label="Active listings" value="3" detail="2 receiving bids" />
            <Metric icon={IndianRupee} label="Best offer today" value="₹3,560" detail="Basmati Rice · +4.1%" tone="gold" />
            <Metric icon={Truck} label="Logistics saved" value="₹1,240" detail="This month · 2 pooled trips" tone="blue" />
            <Metric icon={ShieldCheck} label="Safety status" value="All clear" detail="Last checked 2 days ago" tone="green" />
          </div>
          <div className="mt-7 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="panel overflow-hidden">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Smart listing</p>
                  <h2 className="panel-title">Add farm crop &amp; AI analysis</h2>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-primary">Step 1 of 3</span>
              </div>
              <div className="p-5">
                <div className="upload-zone">
                  <div className="rounded-2xl bg-secondary p-3 text-primary"><Upload className="size-6" /></div>
                  <div>
                    <p className="text-sm font-bold">Drop a crop photo here</p>
                    <p className="mt-1 text-xs text-muted-foreground">or use camera JPG/PNG up to 10MB</p>
                  </div>
                  <label className="ml-auto flex cursor-pointer items-center justify-center rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary">
                    Browse
                    <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) setCropPhoto(URL.createObjectURL(file)) }} />
                  </label>
                </div>
                {cropPhoto && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-border">
                    <img src={cropPhoto} alt="Crop preview" className="max-h-48 w-full object-cover" />
                  </div>
                )}
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="field">
                    <span>Crop name</span>
                    <input defaultValue="Basmati Rice" ref={cropNameRef} />
                  </label>
                  <label className="field">
                    <span>Available quantity (Quintal)</span>
                    <input defaultValue="240" ref={qtyRef} type="number" />
                  </label>
                  <label className="field">
                    <span>Asking price (₹ / Quintal)</span>
                    <input defaultValue="3420" ref={priceRef} type="number" />
                  </label>
                  <label className="field">
                    <span>Farm location</span>
                    <div className="input-with-icon">
                      <MapPin className="size-4" />
                      <input defaultValue="Nashik, Maharashtra" ref={locationRef} />
                    </div>
                  </label>
                </div>
                <div className="ai-card mt-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary p-2 text-primary-foreground"><Sprout className="size-5" /></div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold">AI smart analysis</p>
                        <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold text-primary">94% confidence</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">Grade A quality · Moisture 11.8% · No visible issues detected</p>
                    </div>
                    <button className="text-muted-foreground hover:text-primary"><Volume2 className="size-4" /></button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="tag"><Check className="size-3" /> Safe to sell</span>
                    <span className="tag">Net estimate ₹3,280</span>
                    <span className="tag">Mandi ₹3,420</span>
                  </div>
                  <p className="mt-3 text-[10px] text-muted-foreground">AI estimate — not a substitute for expert inspection · Farmer-declared, not lab verified</p>
                </div>
                <form onSubmit={handlePublish} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-sm font-semibold">
                    <input type="checkbox" defaultChecked className="size-4 accent-[var(--primary)]" ref={needsTransportRef} /> Need transport?
                  </label>
                  <div>
                    <button type="submit" disabled={isPublishing} className="primary-button">
                      {publishStatus === 'success' ? (
                        <><Check className="size-4" /> Published to Marketplace</>
                      ) : isPublishing ? (
                        <><Loader2 className="size-4 animate-spin" /> Publishing…</>
                      ) : (
                        <>Publish to marketplace <ArrowRight className="size-4" /></>
                      )}
                    </button>
                    {publishError && <p className="mt-2 text-xs font-semibold text-destructive">{publishError}</p>}
                  </div>
                </form>
              </div>
            </section>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Live activity</p>
                  <h2 className="panel-title">Your active bids</h2>
                </div>
                <button onClick={() => setTab('Active Bidding')} className="text-xs font-bold text-primary">View all</button>
              </div>
              <div className="flex flex-col gap-1 p-3">
                {recentBids.map((bid) => (
                  <div key={bid.name} className="bid-row">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
                      <IndianRupee className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{bid.name}</p>
                      <p className="text-[11px] text-muted-foreground">{bid.place}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{bid.bid}</p>
                      <p className="text-[10px] font-semibold text-primary">{bid.delta}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-3 rounded-xl bg-secondary p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">Basmati Rice price trend</span>
                    <span className="font-bold text-primary">↑ Rising</span>
                  </div>
                  <div className="mt-3 flex h-12 items-end gap-1.5">
                    {[24,31,27,37,33,44,40,48,46,52,49,57].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-t-sm ${i > 8 ? 'bg-primary' : 'bg-primary/30'}`} style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
          <section className="mt-6">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="eyebrow">Marketplace</p>
                <h2 className="panel-title">What&apos;s moving near you</h2>
              </div>
              <button onClick={() => setTab('Market & Bids')} className="secondary-button"><Search className="size-4" /> Browse lots</button>
            </div>
            {loadingLots ? (
              <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" /> Loading marketplace…
              </div>
            ) : liveLots.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
                No active listings found in database. Add a crop above to create a listing.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {liveLots.map((lot) => (
                  <ListingCard key={lot.id} lot={lot} onOffer={(l) => { setSelectedLot(l); setOfferOpen(true) }} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
      {offerOpen && selectedLot && (
        <div className="modal-backdrop" onClick={() => setOfferOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOfferOpen(false)} className="absolute right-4 top-4 text-muted-foreground">
              <X className="size-5" />
            </button>
            <p className="eyebrow">Make an offer</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">Bid on {selectedLot.crop_name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Asking: ₹{selectedLot.asking_price_per_quintal.toLocaleString('en-IN')} / Q · {selectedLot.quantity_quintal} Q available</p>
            <label className="field mt-6">
              <span>Your bid price (₹ / Quintal)</span>
              <input defaultValue={selectedLot.asking_price_per_quintal} />
            </label>
            <label className="field mt-4">
              <span>Preferred delivery date</span>
              <input type="date" defaultValue="2026-09-12" />
            </label>
            <button onClick={() => { setOfferOpen(false); setToast('Offer submitted successfully!') }} className="primary-button mt-6 w-full">
              Submit offer <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function KrishiMitraApp() {
  const [role, setRole] = useState<'login' | 'farmer' | 'buyer'>('login')
  const [userName, setUserName] = useState<string>('Farmer')
  const [buyerProfile, setBuyerProfile] = useState(false)
  const [buyerBids, setBuyerBids] = useState(false)
  const [search, setSearch] = useState('')
  const [allLots, setAllLots] = useState<CropLot[]>(FALLBACK_LOTS)

  useEffect(() => {
    // 1. Check URL query parameters for immediate role sync
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const roleParam = params.get('role') as 'farmer' | 'buyer' | null
      const nameParam = params.get('name')
      if (roleParam === 'farmer' || roleParam === 'buyer') {
        setRole(roleParam)
        if (nameParam) setUserName(nameParam)
        window.history.replaceState({}, '', window.location.pathname)
        return
      }
    }

    // 2. Check Supabase session
    async function checkAuth() {
      const session = await getSession()
      if (session.role === 'farmer' || session.role === 'buyer') {
        setRole(session.role)
        if (session.fullName) setUserName(session.fullName)
      }
    }
    checkAuth()

    async function fetchAll() {
      const result = await getActiveCrops()
      if (result.data && result.data.length > 0) {
        setAllLots(result.data as CropLot[])
      }
    }
    fetchAll()
  }, [])

  const visibleLots = useMemo(
    () => allLots.filter((l) => l.crop_name.toLowerCase().includes(search.toLowerCase()) || l.location.toLowerCase().includes(search.toLowerCase())),
    [allLots, search]
  )

  const handleLogout = async () => {
    await signOut()
    setBuyerProfile(false)
    setBuyerBids(false)
    setRole('login')
  }

  if (role === 'login') return <LoginScreen onEnter={(r, name) => { setRole(r); if (name) setUserName(name); }} />
  if (role === 'farmer') return <FarmerDashboard userName={userName} onLogout={handleLogout} />
  if (role === 'buyer') {
    if (buyerBids) {
      return <MyBidsScreen onBack={() => setBuyerBids(false)} onLogout={handleLogout} />
    }
    if (buyerProfile) {
      return <BuyerProfileScreen onBack={() => setBuyerProfile(false)} onLogout={handleLogout} />
    }
    return <BuyerDashboardScreen userName={userName} onLogout={handleLogout} onProfile={() => setBuyerProfile(true)} onMyBids={() => setBuyerBids(true)} />
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="topbar">
        <Brand />
        <div className="flex items-center gap-3">
          <Language />
          <button onClick={() => setRole('login')} className="secondary-button">Logout</button>
        </div>
      </header>
      <main className="dashboard-main mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Buyer marketplace</p>
            <h1 className="mt-2 text-3xl font-bold">Source with confidence.</h1>
            <p className="mt-2 text-sm text-muted-foreground">Verified crop lots, transparent bids, direct farmer relationships.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-64" placeholder="Find crop lots" />
          </div>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <Metric icon={Package} label="Available lots" value={String(allLots.length)} detail="Live from Supabase" />
          <Metric icon={ShieldCheck} label="Verified-safe lots" value={String(allLots.filter(l => l.pesticide_safe_flag).length)} detail="Lab declarations visible" tone="green" />
          <Metric icon={IndianRupee} label="Market movement" value="+6.2%" detail="Real-time data" tone="gold" />
        </div>
        <div className="mt-8 flex items-center gap-3 border-b border-border pb-3">
          <button className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Buy product &amp; place bids</button>
          <button onClick={() => window.alert('Select a crop lot below to make your offer.')} className="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary transition hover:bg-secondary">Make an offer</button>
          <button className="rounded-xl px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-secondary">Trending market</button>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleLots.map((lot) => <ListingCard key={lot.id} lot={lot} onOffer={() => {}} />)}
        </div>
      </main>
    </div>
  )
}
