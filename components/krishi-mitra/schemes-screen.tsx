'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Clock3, FileText, IndianRupee, LandPlot, ShieldCheck, Tractor, Umbrella, Wheat } from 'lucide-react'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'
import type { Language } from '@/lib/translations'
import { FarmerSidebar } from './farmer-sidebar'

type Props = { onBack: () => void; onLogout: () => void; onNavigate: (tab: string) => void }

// ─── Scheme data keyed by translation prefix ──────────────────────────────────

const schemeKeys = [
  { prefix: 'schemes.pmkisan', icon: IndianRupee },
  { prefix: 'schemes.pmfby',   icon: ShieldCheck },
  { prefix: 'schemes.smam',    icon: Tractor },
  { prefix: 'schemes.mif',     icon: Umbrella },
] as const

// ─── Default assistance items (keyed, not hardcoded) ─────────────────────────

const defaultAssistance = [
  { nameKey: 'schemes.assistance.default1.name', descKey: 'schemes.assistance.default1.desc', status: 'progress'  as const },
  { nameKey: 'schemes.assistance.default2.name', descKey: 'schemes.assistance.default2.desc', status: 'pending'   as const },
  { nameKey: 'schemes.assistance.default3.name', descKey: 'schemes.assistance.default3.desc', status: 'complete'  as const },
]

export default function SchemesScreen({ onBack, onLogout, onNavigate }: Props) {
  const { language } = useLanguage()
  const [requested, setRequested] = useState<string[]>([])

  const statusLabel = (idx: number) => {
    if (idx === 0) return t('schemes.status.inProgress', language)
    if (idx === 1) return t('schemes.status.pending', language)
    return t('schemes.status.completed', language)
  }

  const submittedLabel = (idx: number) =>
    `${t('schemes.assistance.submittedDaysAgo', language)} ${idx + 1} ${
      idx === 0 ? t('schemes.assistance.day', language) : t('schemes.assistance.days', language)
    }`

  return (
    <div className="schemes-page min-h-screen bg-background">

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('Overview')} className="secondary-button">
            <ArrowLeft className="size-4" />
            {t('schemes.topbar.dashboard', language)}
          </button>
          <div>
            <p className="font-serif text-lg font-bold text-foreground">
              {t('schemes.topbar.title', language)}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">
              {t('schemes.topbar.eyebrow', language)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLogout} className="secondary-button">
            {t('schemes.topbar.logout', language)}
          </button>
        </div>
      </header>

      <div className="app-layout">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <FarmerSidebar activeTab="Schemes & Insurance" onNavigate={onNavigate} onLogout={onLogout} />

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="dashboard-main">
          <button
            type="button"
            onClick={() => onNavigate('Overview')}
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-4 transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t('nav.backToDashboard', language)}
          </button>

          {/* Hero banner */}
          <div className="schemes-hero">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <Building2 className="size-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {t('schemes.hero.title', language)}
                </h1>
                <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-foreground">
                  {t('schemes.hero.badge', language)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-white/80">
                {t('schemes.hero.description', language)}
              </p>
            </div>
          </div>

          {/* ── Scheme cards ──────────────────────────────────────────────── */}
          <section className="mt-6">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="eyebrow">{t('schemes.list.eyebrow', language)}</p>
                <h2 className="mt-1 text-2xl font-bold text-foreground">
                  {t('schemes.list.title', language)}
                </h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {t('schemes.list.programs', language)}
              </span>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {schemeKeys.map(({ prefix, icon: Icon }) => {
                const titleKey = `${prefix}.title` as Parameters<typeof t>[0]
                const title = t(titleKey, language)
                const isRequested = requested.includes(prefix)

                return (
                  <article key={prefix} className="scheme-card">
                    <div className="flex items-start gap-4">
                      <div className="scheme-icon">
                        <Icon className="size-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-bold text-foreground">{title}</h3>
                          <span className="scheme-tag">
                            {t(`${prefix}.category` as Parameters<typeof t>[0], language)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {t(`${prefix}.ministry` as Parameters<typeof t>[0], language)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-6 text-foreground">
                      {t(`${prefix}.description` as Parameters<typeof t>[0], language)}
                    </p>

                    <div className="scheme-info">
                      <p className="eyebrow">{t('schemes.card.eligibilityLabel', language)}</p>
                      <p className="mt-1 text-sm leading-5 text-foreground">
                        {t(`${prefix}.eligibility` as Parameters<typeof t>[0], language)}
                      </p>
                    </div>

                    <div className="scheme-info benefit">
                      <p className="eyebrow">{t('schemes.card.benefitLabel', language)}</p>
                      <p className="mt-1 text-sm font-semibold leading-5 text-foreground">
                        {t(`${prefix}.benefit` as Parameters<typeof t>[0], language)}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setRequested((curr) =>
                          curr.includes(prefix) ? curr : [...curr, prefix]
                        )
                      }
                      className="primary-button mt-4 w-full"
                    >
                      {isRequested
                        ? t('schemes.card.requested', language)
                        : t('schemes.card.apply', language)}{' '}
                      <ArrowRight className="size-4" />
                    </button>
                  </article>
                )
              })}
            </div>
          </section>

          {/* ── Assistance requests panel ─────────────────────────────────── */}
          <section className="assistance-panel">
            <div className="mb-5 flex items-center gap-4">
              <div className="scheme-icon">
                <FileText className="size-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t('schemes.assistance.title', language)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('schemes.assistance.track', language)}
                </p>
              </div>
            </div>

            {/* Show user-requested schemes, or fall back to the three demo items */}
            {requested.length > 0
              ? requested.map((prefix, index) => (
                  <div key={prefix} className="request-row">
                    <div>
                      <p className="font-bold text-foreground">
                        {t(`${prefix}.title` as Parameters<typeof t>[0], language)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('schemes.assistance.sent', language)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {submittedLabel(index)}
                      </p>
                    </div>
                    <span className="request-status progress">
                      <Clock3 className="size-3" />
                      {t('schemes.status.inProgress', language)}
                    </span>
                  </div>
                ))
              : defaultAssistance.map(({ nameKey, descKey, status }, index) => (
                  <div key={nameKey} className="request-row">
                    <div>
                      <p className="font-bold text-foreground">
                        {t(nameKey, language)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t(descKey, language)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {submittedLabel(index)}
                      </p>
                    </div>
                    <span className={`request-status ${status}`}>
                      {status === 'progress'
                        ? <Clock3 className="size-3" />
                        : <CheckCircle2 className="size-3" />
                      }
                      {statusLabel(index)}
                    </span>
                  </div>
                ))
            }
          </section>

        </main>
      </div>
    </div>
  )
}
