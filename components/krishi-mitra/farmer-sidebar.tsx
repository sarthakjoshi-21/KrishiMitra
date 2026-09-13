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
    <aside className="sidebar farmer-sidebar-shared flex flex-col h-screen lg:h-[calc(100vh-72px)] max-h-screen lg:max-h-[calc(100vh-72px)] overflow-hidden lg:sticky lg:top-0">
      <div className="eyebrow px-3 pt-1 pb-2 shrink-0">{t('nav.farmerDesk', language)}</div>
      
      {/* Scrollable navigation container with overflow-y-auto, flex-1, and hidden scrollbar */}
      <nav
        className="farmer-sidebar-nav flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 pr-1 pb-4 no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        aria-label="Farmer navigation"
      >
        {farmerNavItems.map(({ label, tab, icon: Icon }) => (
          <button
            type="button"
            key={tab}
            onClick={() => onNavigate(tab)}
            className={`side-nav !py-2 !px-3.5 !gap-3 text-sm font-semibold text-left transition rounded-xl ${
              activeTab === tab ? 'active' : ''
            }`}
          >
            <Icon className="size-4 sm:size-5 shrink-0" />
            <span className="leading-snug flex-1 break-words">
              {t(navTranslationKeys[tab] || label, language)}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
