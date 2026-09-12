'use client'

import { useMemo, useState } from 'react'
import { Check, CircleHelp, Languages, Mic, Sprout, TriangleAlert } from 'lucide-react'
import { FarmerSidebar } from './farmer-sidebar'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'

const pesticides = ['Neem oil', 'Imidacloprid', 'Mancozeb', 'Chlorpyrifos', 'Other']

type Props = { onLogout: () => void; onNavigate: (tab: string) => void }

export default function CropHealthScreen({ onLogout, onNavigate }: Props) {
  const { language, setLanguage } = useLanguage()
  const [pesticide, setPesticide] = useState('')
  const [sprayDate, setSprayDate] = useState('')
  const [listening, setListening] = useState<string | null>(null)

  const daysSinceSpray = useMemo(
    () => (sprayDate ? Math.max(0, Math.floor((Date.now() - new Date(`${sprayDate}T00:00:00`).getTime()) / 86400000)) : null),
    [sprayDate]
  )

  const safety = !pesticide || !sprayDate ? 'unknown' : daysSinceSpray !== null && daysSinceSpray >= 7 ? 'safe' : 'wait'
  const voice = (field: string) => {
    setListening(field)
    window.setTimeout(() => setListening(null), 1200)
  }

  const waitDaysText = () => {
    const days = Math.max(1, 7 - (daysSinceSpray ?? 0))
    if (language === 'hi') return `${days} और दिन प्रतीक्षा करें`
    if (language === 'mr') return `आणखी ${days} दिवस थांबा`
    return `Wait ${days} more day(s)`
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="topbar">
        <div>
          <p className="eyebrow">{t('nav.farmerDesk', language)}</p>
          <h1 className="text-xl font-bold text-foreground">{t('cropHealth.title', language)}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
            <Languages className="size-4 text-primary" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'mr')}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
            </select>
          </div>
          <button onClick={onLogout} className="secondary-button">{t('nav.logout', language)}</button>
        </div>
      </header>

      <div className="app-layout">
        <FarmerSidebar activeTab="Crop Health" onNavigate={onNavigate} onLogout={onLogout} />

        <main className="dashboard-main mx-auto flex max-w-4xl flex-col gap-5">
          <section className="rounded-3xl border border-primary/15 bg-card p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Sprout className="size-6" />
              </div>
              <div>
                <p className="eyebrow">{t('cropHealth.diseaseDetection', language)}</p>
                <h2 className="text-2xl font-bold text-foreground">{t('cropHealth.title', language)}</h2>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-secondary/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">{t('cropHealth.diseaseDetection', language)}</p>
              <p className="mt-2 text-lg font-bold text-foreground">{t('cropHealth.result', language)}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{t('cropHealth.resultDesc', language)}</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="relative flex flex-col gap-2">
                <span className="text-sm font-bold text-foreground">{t('cropHealth.pesticideUsed', language)}</span>
                <select
                  value={pesticide}
                  onChange={(event) => setPesticide(event.target.value)}
                  className="h-12 rounded-xl border border-input bg-background px-4 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{t('cropHealth.selectPesticide', language)}</option>
                  {pesticides.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => voice('pesticide')}
                  aria-label="Voice input for pesticide used"
                  className={`voice-field-button ${listening === 'pesticide' ? 'listening' : ''}`}
                >
                  <Mic className="size-4" />
                </button>
              </label>

              <label className="relative flex flex-col gap-2">
                <span className="text-sm font-bold text-foreground">{t('cropHealth.lastSprayDate', language)}</span>
                <input
                  type="date"
                  value={sprayDate}
                  onChange={(event) => setSprayDate(event.target.value)}
                  className="h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => voice('date')}
                  aria-label="Voice input for last spray date"
                  className={`voice-field-button ${listening === 'date' ? 'listening' : ''}`}
                >
                  <Mic className="size-4" />
                </button>
              </label>
            </div>

            <div className={`safety-check ${safety}`}>
              <div className="safety-icon">
                {safety === 'safe' ? <Check className="size-5" /> : safety === 'wait' ? <TriangleAlert className="size-5" /> : <CircleHelp className="size-5" />}
              </div>
              <div>
                <p className="font-bold">
                  {safety === 'safe' ? t('cropHealth.safeToSell', language) : safety === 'wait' ? waitDaysText() : t('cropHealth.cannotVerify', language)}
                </p>
                <small>{t('cropHealth.farmerDeclared', language)}</small>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
