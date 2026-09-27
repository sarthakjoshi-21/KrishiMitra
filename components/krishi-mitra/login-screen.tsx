'use client'

import Image from 'next/image'
import { ArrowRight, Droplets, Languages, Leaf, Package, ShieldCheck, Sprout, TrendingUp, Truck } from 'lucide-react'
import { useLanguage, type Language } from './language-context'
import { t } from '@/lib/translations'

const logoUrl =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-28%20010159-SbmrxdxXjUScSHgQ3ehJq2jWqvkG3u.png'

export type Role = 'farmer' | 'buyer'

export interface LoginScreenProps {
  onSelectRole: (role: Role) => void
}

export default function LoginScreen({ onSelectRole }: LoginScreenProps) {
  const { language, setLanguage } = useLanguage()

  const lifecycleStages = [
    {
      icon: Sprout,
      title: t('login.stage.prePlanting', language, 'Pre-Planting'),
      helper: t('login.stage.prePlantingHelp', language, 'What should I grow?'),
    },
    {
      icon: Leaf,
      title: t('login.stage.inSeason', language, 'In-Season'),
      helper: t('login.stage.inSeasonHelp', language, 'How do I manage my crop?'),
    },
    {
      icon: Droplets,
      title: t('login.stage.resources', language, 'Resources'),
      helper: t('login.stage.resourcesHelp', language, 'What do I need?'),
    },
    {
      icon: TrendingUp,
      title: t('login.stage.postHarvest', language, 'Post-Harvest'),
      helper: t('login.stage.postHarvestHelp', language, 'How do I maximise earnings?'),
    },
    {
      icon: Truck,
      title: t('login.stage.market', language, 'Market'),
      helper: t('login.stage.marketHelp', language, 'Net realisation & logistics'),
    },
  ]

  return (
    <main className="min-h-screen bg-background px-5 py-3">
      {/* Top Header with Language Selector */}
      <header className="mx-auto flex max-w-6xl items-center justify-end pt-1 pb-2">
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
          <Languages className="size-4 text-primary" />
          <label className="sr-only" htmlFor="landing-language">
            Choose language
          </label>
          <select
            id="landing-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>
      </header>

      {/* Hero & Team Logo Section (Exact layout restored from reference) */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 pb-4 pt-2 text-center lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12 lg:pt-4 lg:text-left">
        {/* Left Column: Brand Content & Distinct Role Navigation Buttons */}
        <div className="max-w-xl lg:pl-4">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-xs font-bold text-primary">
            <span className="size-2 rounded-full bg-primary" /> {t('login.networkBadge', language, "India's connected farm network")}
          </p>

          <h1 className="text-balance font-serif text-5xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
            {t('login.heroTitle1', language, 'Every stage,')}{' '}
            <span className="block">{language === 'en' ? 'every problem' : ''}</span>
            <span className="text-primary">{t('login.heroTitle2', language, '— one solution.')}</span>
          </h1>

          <p className="mt-5 max-w-lg text-pretty text-base leading-7 text-muted-foreground">
            {t(
              'login.heroSubtitle',
              language,
              "Connect your farm's complete life cycle from seed to soil. Sell better, plan smarter, and grow with a trusted local network."
            )}
          </p>

          {/* Role Navigation Area */}
          <div className="mt-7 w-full max-w-md">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-left sm:text-left">
              {t('login.loginAs', language, 'Login As :')}
            </p>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {/* Primary Button 1: Farmer */}
              <button
                type="button"
                id="login-as-farmer-btn"
                onClick={() => onSelectRole('farmer')}
                className="action-button flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Sprout className="size-5 shrink-0" />
                  <span className="text-sm font-bold tracking-tight">{t('login.loginAsFarmer', language, 'Login as Farmer')}</span>
                </div>
                <ArrowRight className="size-4 shrink-0" />
              </button>

              {/* Primary Button 2: Buyer */}
              <button
                type="button"
                id="login-as-buyer-btn"
                onClick={() => onSelectRole('buyer')}
                className="action-button outline flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl border-2 border-border bg-card hover:border-primary/50 text-foreground font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="size-5 shrink-0 text-primary" />
                  <span className="text-sm font-bold tracking-tight">{t('login.loginAsBuyer', language, 'Login as Buyer')}</span>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Prominent Circular Team Logo Emblem */}
        <div className="w-full max-w-md justify-self-center text-center lg:max-w-xl lg:justify-self-end">
          <div className="flex flex-col items-center gap-3 py-1">
            <div className="aspect-square w-full max-w-[28rem] overflow-hidden rounded-full bg-background/70 p-3 shadow-[0_20px_35px_rgba(19,93,43,0.18)] ring-1 ring-primary/20">
              <Image
                src={logoUrl}
                alt="Krishi Mitra Team Logo"
                width={480}
                height={480}
                priority
                className="size-full rounded-full object-contain mix-blend-multiply dark:mix-blend-normal"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <ShieldCheck className="size-4" />
              <span>{t('login.detailsStay', language, 'Your details stay on this device')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: The Agricultural Lifecycle Strip */}
      <section
        className="mx-auto max-w-6xl rounded-[2rem] border border-primary/15 bg-card/85 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6 mt-4"
        aria-labelledby="lifecycle-title"
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <p id="lifecycle-title" className="eyebrow text-center text-xs tracking-widest uppercase font-bold text-muted-foreground">
            {t('login.lifecycleOrchestrated', language, 'THE AGRICULTURAL LIFECYCLE, ORCHESTRATED')}
          </p>
          <span className="hidden h-px flex-1 bg-primary/10 sm:block" />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-0">
          {lifecycleStages.map(({ icon: Icon, title, helper }, index, stages) => (
            <div key={title} className="flex flex-1 items-center md:flex-row">
              <div className="flex min-h-24 flex-1 flex-col items-center justify-center gap-2 rounded-2xl bg-secondary/55 px-3 py-3 text-center transition hover:-translate-y-0.5 hover:bg-secondary">
                <div className="flex size-9 items-center justify-center rounded-xl bg-card text-primary shadow-sm ring-1 ring-primary/10">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{title}</p>
                  <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{helper}</p>
                </div>
              </div>
              {index < stages.length - 1 && (
                <div
                  aria-hidden="true"
                  className="flex h-8 w-10 shrink-0 items-center justify-center md:h-auto md:w-12"
                >
                  <ArrowRight className="lifecycle-arrow size-7 stroke-[3] text-primary drop-shadow-[0_2px_4px_rgba(20,140,100,0.3)]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
