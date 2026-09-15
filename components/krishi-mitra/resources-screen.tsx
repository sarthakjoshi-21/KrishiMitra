'use client'

import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Clock3, MapPin, Search, ShieldCheck, Sprout, Truck, Users, Warehouse, Wrench } from 'lucide-react'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'
import { FarmerSidebar } from './farmer-sidebar'

type Props = { onLogout: () => void; onNavigate: (tab: string) => void }
type Category = 'All' | 'Seeds' | 'Fertilizer' | 'Machinery' | 'Labour' | 'Logistics' | 'Storage'

const categoryKeyMap: Record<Category, string> = {
  All: 'resources.cat.all',
  Seeds: 'resources.cat.seeds',
  Fertilizer: 'resources.cat.fertilizer',
  Machinery: 'resources.cat.machinery',
  Labour: 'resources.cat.labour',
  Logistics: 'resources.cat.logistics',
  Storage: 'resources.cat.storage',
}

const providers = [
  { name: 'Shri Krushi Kendra', owner: 'Amit Deshmukh', category: 'Seeds', location: 'Chandwad, Nashik', rating: '4.7', distance: '4 km away', response: '2h', items: [['N-53 Onion Seed (Rabi)', '₹480', '250g pack · Certified', 'In stock'], ['AFL-2 Onion Hybrid', '₹620', '100g pack · Certified', 'In stock']] },
  { name: 'GreenGrow Fertilizers', owner: 'Sunita Kale', category: 'Fertilizer', location: 'Niphad, Nashik', rating: '4.5', distance: '11 km away', response: '4h', items: [['NPK 19-19-19', '₹1,750', '50kg bag', 'In stock'], ['Urea (46% N)', '₹267', '45kg bag', 'In stock'], ['Micronutrient Mix', '₹680', '5kg pack', 'Out']] },
  { name: 'Bharat Tractor Service', owner: 'Mahesh Pawar', category: 'Machinery', location: 'Chandwad, Nashik', rating: '4.3', distance: '3 km away', response: '6h', items: [['Tractor with rotavator (per hour)', '₹450', 'hour', 'In stock'], ['Drip irrigation installation', '₹28,000', 'acre', 'In stock']] },
  { name: 'Maa Bhavani Labour Group', owner: 'Lakshmi Yadav', category: 'Labour', location: 'Chandwad, Nashik', rating: '4.6', distance: '2 km away', response: '8h', items: [['Farm labour (per day)', '₹350', 'person/day', 'In stock']] },
  { name: 'Sahyadri Logistics', owner: 'Rahul Joshi', category: 'Logistics', location: 'Nashik, Nashik', rating: '4.4', distance: '18 km away', response: '12h', items: [['Mini truck (Tata 407)', '₹4,200', 'trip', 'In stock'], ['Tractor-trailer', '₹1,800', 'trip', 'In stock']] },
  { name: 'Krishi Cold Storage', owner: 'Deepak Mohite', category: 'Storage', location: 'Nashik, Nashik', rating: '4.8', distance: '22 km away', response: '24h', items: [['Cold storage (onion)', '₹180', 'quintal/month', 'In stock']] },
]

export default function ResourcesScreen({ onLogout, onNavigate }: Props) {
  const { language, setLanguage } = useLanguage()
  const [category, setCategory] = useState<Category>('All')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const filtered = useMemo(() => providers.filter((provider) => (category === 'All' || provider.category === category) && `${provider.name} ${provider.location} ${provider.category}`.toLowerCase().includes(query.toLowerCase())), [category, query])

  return (
    <div className="resources-page min-h-screen bg-background">
      <header className="topbar">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('Overview')} className="secondary-button">
            <ArrowLeft className="size-4" /> {t('schemes.topbar.dashboard', language)}
          </button>
          <div className="brand-mark"><Sprout className="size-5" /></div>
          <p className="font-serif text-lg font-bold text-foreground">कृषी-मित्र</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center" htmlFor="resources-language">
            <span className="sr-only">Choose website language</span>
            <select
              id="resources-language"
              aria-label="Choose website language"
              value={language}
              onChange={(event) => setLanguage(event.target.value as 'en' | 'hi' | 'mr')}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground outline-none hover:bg-secondary focus:ring-2 focus:ring-ring"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
            </select>
          </label>
          <button onClick={onLogout} className="secondary-button">{t('nav.logout', language)}</button>
        </div>
      </header>
      <div className="app-layout">
        <FarmerSidebar activeTab="Resources" onNavigate={onNavigate} onLogout={onLogout} />
        <main className="dashboard-main">
          <button
            type="button"
            onClick={() => onNavigate('Overview')}
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-4 transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t('nav.backToDashboard', language)}
          </button>
          <div className="resources-hero">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
              <Warehouse className="size-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{t('resources.title', language)}</h1>
              <p className="mt-1 text-sm leading-6 text-white/75">{t('resources.subtitle', language)}</p>
            </div>
          </div>
          <div className="resources-trust">
            <ShieldCheck className="size-4 shrink-0" />
            {t('resources.trust', language)}
          </div>
          <div className="input-with-icon mt-6 h-12">
            <Search className="size-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('resources.searchPlaceholder', language)}
              aria-label="Search providers"
            />
          </div>
          <div className="resources-filters mt-5">
            {(['All', 'Seeds', 'Fertilizer', 'Machinery', 'Labour', 'Logistics', 'Storage'] as Category[]).map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={category === item ? 'resource-filter active' : 'resource-filter'}
              >
                {t(categoryKeyMap[item], language)}
              </button>
            ))}
          </div>
          {notice && <div className="mt-4 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-primary">{notice}</div>}
          <div className="resources-grid mt-6">
            {filtered.map((provider) => (
              <article key={provider.name} className="provider-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="scheme-icon">
                      {provider.category === 'Machinery' ? <Wrench className="size-6" /> : provider.category === 'Logistics' ? <Truck className="size-6" /> : provider.category === 'Labour' ? <Users className="size-6" /> : provider.category === 'Storage' ? <Warehouse className="size-6" /> : <Sprout className="size-6" />}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{provider.name}</h2>
                      <p className="text-sm text-muted-foreground">{provider.owner} · {t(categoryKeyMap[provider.category as Category] || provider.category, language)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">★ {provider.rating}</p>
                    <p className="text-xs text-muted-foreground">{provider.distance}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="size-4" />{provider.location}</span>
                  <span className="flex items-center gap-1"><Clock3 className="size-4" />{t('resources.respondsIn', language)}{provider.response}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {provider.items.map(([name, price, detail, stock]) => (
                    <div key={name} className="provider-item">
                      <div>
                        <p className="font-semibold text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">{detail}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{price}</p>
                        <p className={`text-xs ${stock === 'Out' ? 'text-destructive' : 'text-primary'}`}>
                          {stock === 'Out' ? t('resources.outOfStock', language) : t('resources.inStock', language)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setNotice(language === 'hi' ? `${provider.name} को सेवा अनुरोध भेजा गया।` : language === 'mr' ? `${provider.name} ला सेवा विनंती पाठवली.` : `Service request sent to ${provider.name}.`)} className="primary-button flex-1">
                    {t('resources.requestService', language)} <ArrowRight className="size-4" />
                  </button>
                  <button onClick={() => setNotice(language === 'hi' ? `${provider.name} के संपर्क विवरण खोले गए।` : language === 'mr' ? `${provider.name} चा संपर्क तपशील उघडला.` : `Contact details opened for ${provider.name}.`)} className="secondary-button">
                    {t('resources.contact', language)}
                  </button>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-primary/30 p-10 text-center text-sm text-muted-foreground">
              {t('resources.noProviders', language)}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

