'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Droplets, Languages, Leaf, Package, ShieldCheck, Sprout, TrendingUp, Truck } from 'lucide-react'
import { useLanguage, type Language } from './language-context'
import { t } from '@/lib/translations'

const logoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-28%20010159-SbmrxdxXjUScSHgQ3ehJq2jWqvkG3u.png'

type Role = 'farmer' | 'buyer'
type Props = { onEnter?: (role: Role, fullName: string) => void }

export default function LoginScreen({ onEnter }: Props) {
  const { language, setLanguage } = useLanguage()

  const lifecycleStages = [
    {
      icon: Sprout,
      title: t('login.stage.prePlanting', language),
      helper: t('login.stage.prePlantingHelp', language),
    },
    {
      icon: Leaf,
      title: t('login.stage.inSeason', language),
      helper: t('login.stage.inSeasonHelp', language),
    },
    {
      icon: Droplets,
      title: t('login.stage.resources', language),
      helper: t('login.stage.resourcesHelp', language),
    },
    {
      icon: TrendingUp,
      title: t('login.stage.postHarvest', language),
      helper: t('login.stage.postHarvestHelp', language),
    },
    {
      icon: Truck,
      title: t('login.stage.market', language),
      helper: t('login.stage.marketHelp', language),
    },
  ]

  return (
    <main className="min-h-screen bg-background px-5 py-1">
      <header className="mx-auto flex max-w-6xl items-center justify-end">
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm mt-2">
          <Languages className="size-4 text-primary" />
          <label className="sr-only" htmlFor="login-language">Choose language</label>
          <select
            id="login-language"
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

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 pb-3 pt-3 text-center lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:pt-5 lg:text-left">
        <div className="max-w-xl lg:pl-6">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">
            <span className="size-2 rounded-full bg-primary" /> {t('login.networkBadge', language)}
          </p>
          <h1 className="text-balance font-serif text-5xl font-bold leading-[1.06] tracking-tight text-foreground sm:text-6xl">
            {t('login.heroTitle1', language)} <span className="text-primary">{t('login.heroTitle2', language)}</span>
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-base leading-7 text-muted-foreground">
            {t('login.heroSubtitle', language)}
          </p>
          <div className="mt-6 w-full max-w-md">
            <p className="mb-3 text-center text-sm font-bold text-foreground">
              {t('login.loginAs', language)}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {onEnter ? (
                <button
                  type="button"
                  onClick={() => onEnter('farmer', 'Ramesh Patil')}
                  className="action-button flex items-center justify-center gap-2 hover:shadow-lg transition-all cursor-pointer"
                >
                  <Sprout className="size-5" /> {t('login.farmer', language)} <ArrowRight className="ml-auto size-4" />
                </button>
              ) : (
                <Link
                  href="/farmer-login"
                  className="action-button flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                  <Sprout className="size-5" /> {t('login.farmer', language)} <ArrowRight className="ml-auto size-4" />
                </Link>
              )}

              {onEnter ? (
                <button
                  type="button"
                  onClick={() => onEnter('buyer', 'Priya Sharma')}
                  className="action-button outline flex items-center justify-center gap-2 hover:shadow-lg transition-all cursor-pointer"
                >
                  <Package className="size-5" /> {t('login.buyer', language)} <ArrowRight className="ml-auto size-4" />
                </button>
              ) : (
                <Link
                  href="/buyer-login"
                  className="action-button outline flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                  <Package className="size-5" /> {t('login.buyer', language)} <ArrowRight className="ml-auto size-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="w-full max-w-md justify-self-center text-left lg:max-w-lg lg:justify-self-end">
          <div className="flex flex-col items-center gap-2 py-0 text-center">
            <div className="aspect-square w-full max-w-[29rem] overflow-hidden rounded-full bg-background/70 p-2 shadow-[0_18px_28px_rgba(19,93,43,0.14)] ring-1 ring-primary/15">
              <Image src={logoUrl} alt="कृषि-मित्र logo" width={464} height={464} priority className="size-full rounded-full object-contain mix-blend-multiply dark:mix-blend-normal" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <ShieldCheck className="size-4" /> {t('login.detailsStay', language)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl rounded-[2rem] border border-primary/10 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6" aria-labelledby="lifecycle-title">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p id="lifecycle-title" className="eyebrow text-center">{t('login.lifecycleOrchestrated', language)}</p>
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
                <div aria-hidden="true" className="flex h-8 w-10 shrink-0 items-center justify-center md:h-auto md:w-12">
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
