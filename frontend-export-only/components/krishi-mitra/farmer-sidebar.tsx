'use client'

import { CircleHelp, CloudSun, Droplets, IndianRupee, Leaf, Package, ShieldCheck, Sprout, Truck, Users } from 'lucide-react'

export const farmerNavItems = [
  { label: 'Overview', tab: 'Overview', icon: Sprout },
  { label: 'My Crop', tab: 'My Crop', icon: Leaf },
  { label: 'Irrigation', tab: 'Irrigation', icon: Droplets },
  { label: 'Weather', tab: 'Weather', icon: CloudSun },
  { label: 'Kisan Sathi', tab: 'Kisan Sathi', icon: CircleHelp },
  { label: 'Resources', tab: 'Resources', icon: Package },
  { label: 'Community', tab: 'Community', icon: Users },
  { label: 'Schemes & Insurance', tab: 'Schemes & Insurance', icon: ShieldCheck },
  { label: 'Market & Bids', tab: 'Market & Bids', icon: IndianRupee },
  { label: 'Logistics', tab: 'P2P Logistics', icon: Truck },
] as const

export function FarmerSidebar({ activeTab, onNavigate, profilePhoto, onLogout }: { activeTab: string; onNavigate: (tab: string) => void; profilePhoto?: string | null; onLogout?: () => void }) {
  return <aside className="sidebar farmer-sidebar-shared"><nav className="farmer-sidebar-nav" aria-label="Farmer navigation"><p className="eyebrow">Farmer Desk</p>{farmerNavItems.map(({ label, tab, icon: Icon }) => <button type="button" key={tab} onClick={() => onNavigate(tab)} className={`side-nav ${activeTab === tab ? 'active' : ''}`}><Icon className="size-5" />{label}</button>)}</nav><div className="farmer-profile"><span className="farmer-avatar">{profilePhoto ? <img src={profilePhoto} alt="Farmer profile" className="size-full rounded-full object-cover" /> : 'R'}</span><div><p className="text-sm font-bold text-foreground">Rajesh Patil</p><p className="text-xs text-muted-foreground">Demo Farmer</p></div>{onLogout && <button type="button" onClick={onLogout} aria-label="Logout" className="ml-auto text-primary">Logout</button>}</div></aside>
}
