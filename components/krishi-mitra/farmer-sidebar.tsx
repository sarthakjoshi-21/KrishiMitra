'use client'

import { CircleHelp, CloudSun, Droplets, IndianRupee, Leaf, Package, ShieldCheck, Sprout, Truck, Users } from 'lucide-react'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'

export const farmerNavItems = [
  { label: 'Overview', tab: 'Overview', icon: Sprout },
  { label: 'My Crop', tab: 'My Crop', icon: Leaf },
  { label: 'Crop Health', tab: 'Crop Health', icon: Sprout },
  { label: 'Irrigation', tab: 'Irrigation', icon: Droplets },
  { label: 'Weather', tab: 'Weather', icon: CloudSun },
  { label: 'Kisan Sathi', tab: 'Kisan Sathi', icon: CircleHelp },
  { label: 'Resources', tab: 'Resources', icon: Package },
  { label: 'Community', tab: 'Community', icon: Users },
  { label: 'Schemes & Insurance', tab: 'Schemes & Insurance', icon: ShieldCheck },
  { label: 'Market & Bids', tab: 'Market & Bids', icon: IndianRupee },
  { label: 'Logistics', tab: 'P2P Logistics', icon: Truck },
] as const

const navTranslationKeys: Record<string, string> = {
  'Overview': 'nav.overview',
  'My Crop': 'nav.myCrop',
  'Crop Health': 'nav.cropHealth',
  'Irrigation': 'nav.irrigation',
  'Weather': 'nav.weather',
  'Kisan Sathi': 'nav.kisanSathi',
  'Resources': 'nav.resources',
  'Community': 'nav.community',
  'Schemes & Insurance': 'nav.schemes',
  'Market & Bids': 'nav.marketBids',
  'P2P Logistics': 'nav.logistics',
}

export function FarmerSidebar({ activeTab, onNavigate, profilePhoto, onLogout }: { activeTab: string; onNavigate: (tab: string) => void; profilePhoto?: string | null; onLogout?: () => void }) {
  const { language } = useLanguage()

  return (
    <aside className="sidebar farmer-sidebar-shared">
      <nav className="farmer-sidebar-nav" aria-label="Farmer navigation">
        <p className="eyebrow">{t('nav.farmerDesk', language)}</p>
        {farmerNavItems.map(({ label, tab, icon: Icon }) => (
          <button
            type="button"
            key={tab}
            onClick={() => onNavigate(tab)}
            className={`side-nav ${activeTab === tab ? 'active' : ''}`}
          >
            <Icon className="size-5" />
            {t(navTranslationKeys[tab] || label, language)}
          </button>
        ))}
      </nav>
      <div className="farmer-profile">
        <span className="farmer-avatar">
          {profilePhoto ? <img src={profilePhoto} alt="Farmer profile" className="size-full rounded-full object-cover" /> : 'R'}
        </span>
        <div>
          <p className="text-sm font-bold text-foreground">Rajesh Patil</p>
          <p className="text-xs text-muted-foreground">{t('common.demoFarmer', language)}</p>
        </div>
        {onLogout && (
          <button type="button" onClick={onLogout} aria-label={t('nav.logout', language)} className="ml-auto text-primary">
            {t('nav.logout', language)}
          </button>
        )}
      </div>
    </aside>
  )
}

