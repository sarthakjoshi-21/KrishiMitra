'use client'

import { FormEvent, useMemo, useState } from 'react'
import { ArrowLeft, CalendarDays, CheckCircle2, Droplets, Leaf, MapPin, Sprout, Sun, Wheat } from 'lucide-react'
import { VoiceField, VoiceInput } from './voice-input'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'

type Props = { onLogout: () => void; onNavigate: (tab: string) => void }
type Crop = { name: string; variety: string; plantedDate: string; quantity: string; unit: string; area: string; soil: string; irrigation: string; notes: string }

const stageKeys = [
  'myCrop.stage.landPrep',
  'myCrop.stage.sowing',
  'myCrop.stage.germination',
  'myCrop.stage.vegetative',
  'myCrop.stage.flowering',
  'myCrop.stage.bulbFormation',
  'myCrop.stage.maturity',
  'myCrop.stage.harvest',
]
const stages = ['Land Preparation', 'Sowing', 'Germination', 'Vegetative Growth', 'Flowering', 'Bulb Formation', 'Maturity', 'Harvest']
const cropOptions = ['Onion', 'Wheat', 'Rice', 'Tomato', 'Cotton', 'Soybean', 'Sugarcane', 'Other']
const defaultCrop: Crop = { name: 'Onion', variety: 'N-53 (Rabi)', plantedDate: '2026-06-12', quantity: '240', unit: 'kg', area: '1.5', soil: 'Black soil', irrigation: 'Drip irrigation', notes: '' }

export default function MyCropScreen({ onNavigate }: Props) {
  const { language } = useLanguage()
  const [crop, setCrop] = useState<Crop | null>(null)
  const [form, setForm] = useState<Crop>(defaultCrop)
  const [editing, setEditing] = useState(false)
  const days = useMemo(() => crop ? Math.max(1, Math.floor((Date.now() - new Date(`${crop.plantedDate}T00:00:00`).getTime()) / 86400000)) : 0, [crop])
  const stageIndex = crop ? Math.min(stages.length - 1, Math.floor(days / 18) + 1) : 0
  function submit(event: FormEvent) { event.preventDefault(); setCrop(form); setEditing(false) }
  function update(key: keyof Crop, value: string) { setForm((current) => ({ ...current, [key]: value })) }

  if (!crop || editing) {
    return (
      <div className="crop-page min-h-screen bg-background">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('Overview')} className="secondary-button">
              <ArrowLeft className="size-4" /> {t('schemes.topbar.dashboard', language)}
            </button>
            <div>
              <p className="font-serif text-lg font-bold">{t('myCrop.title', language)}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">{t('myCrop.farmRecords', language)}</p>
            </div>
          </div>
        </header>
        <main className="dashboard-main mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => onNavigate('Overview')}
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-4 transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t('nav.backToDashboard', language)}
          </button>
          <div className="mb-6">
            <p className="eyebrow">{t('myCrop.startWithCrop', language)}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{t('myCrop.tellUsGrowing', language)}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t('myCrop.addDetailsDesc', language)}</p>
          </div>
          <form onSubmit={submit} className="crop-form panel p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-secondary/60 p-4">
              <div className="metric-icon"><Sprout className="size-5" /></div>
              <div>
                <p className="font-bold">{t('myCrop.cropProfile', language)}</p>
                <p className="text-xs text-muted-foreground">{t('myCrop.profileHint', language)}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                <span>{t('myCrop.cropName', language)}</span>
                <select required value={form.name} onChange={(e) => update('name', e.target.value)}>
                  {cropOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="field">
                <span>{t('myCrop.variety', language)}</span>
                <VoiceField>
                  <input value={form.variety} onChange={(e) => update('variety', e.target.value)} placeholder={t('myCrop.varietyPlaceholder', language)} />
                  <VoiceInput value={form.variety} onChange={(value) => update('variety', value)} label={t('myCrop.dictateVariety', language)} />
                </VoiceField>
              </label>
              <label className="field">
                <span>{t('myCrop.plantingDate', language)}</span>
                <input required type="date" value={form.plantedDate} onChange={(e) => update('plantedDate', e.target.value)} />
              </label>
              <label className="field">
                <span>{t('myCrop.quantityPlanted', language)}</span>
                <div className="flex gap-2">
                  <input required min="0" type="number" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} className="min-w-0 flex-1" />
                  <select value={form.unit} onChange={(e) => update('unit', e.target.value)} className="w-28">
                    <option>kg</option>
                    <option>quintal</option>
                    <option>bags</option>
                    <option>plants</option>
                  </select>
                </div>
              </label>
              <label className="field">
                <span>{t('myCrop.farmArea', language)}</span>
                <input required min="0" step="0.1" type="number" value={form.area} onChange={(e) => update('area', e.target.value)} />
              </label>
              <label className="field">
                <span>{t('myCrop.soilType', language)}</span>
                <select value={form.soil} onChange={(e) => update('soil', e.target.value)}>
                  <option>Black soil</option>
                  <option>Red soil</option>
                  <option>Alluvial soil</option>
                  <option>Sandy soil</option>
                  <option>Other</option>
                </select>
              </label>
              <label className="field">
                <span>{t('myCrop.irrigationMethod', language)}</span>
                <select value={form.irrigation} onChange={(e) => update('irrigation', e.target.value)}>
                  <option>Drip irrigation</option>
                  <option>Sprinkler</option>
                  <option>Flood irrigation</option>
                  <option>Rain-fed</option>
                </select>
              </label>
              <label className="field sm:col-span-2">
                <span>{t('myCrop.notes', language)}</span>
                <textarea
                  value={form.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  className="min-h-24 rounded-xl border border-input bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder={t('myCrop.notesPlaceholder', language)}
                />
              </label>
            </div>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {editing && <button type="button" onClick={() => setEditing(false)} className="secondary-button">{t('common.cancel', language)}</button>}
              <button type="submit" className="primary-button">
                <Sprout className="size-4" /> {editing ? t('myCrop.saveCropDetails', language) : t('myCrop.addMyCrop', language)}
              </button>
            </div>
          </form>
        </main>
      </div>
    )
  }

  return (
    <div className="crop-page min-h-screen bg-background">
      <header className="topbar">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('Overview')} className="secondary-button">
            <ArrowLeft className="size-4" /> {t('schemes.topbar.dashboard', language)}
          </button>
          <div>
            <p className="font-serif text-lg font-bold">{t('myCrop.title', language)}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">{t('myCrop.farmRecords', language)}</p>
          </div>
        </div>
        <button onClick={() => { setForm(crop); setEditing(true) }} className="secondary-button">
          {t('myCrop.editDetails', language)}
        </button>
      </header>
      <main className="dashboard-main mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() => onNavigate('Overview')}
          className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-4 transition-colors"
        >
          <ArrowLeft className="size-4" />
          {t('nav.backToDashboard', language)}
        </button>
        <section className="crop-hero">
          <div className="crop-hero-icon"><Sprout className="size-8" /></div>
          <div className="min-w-0">
            <p className="eyebrow">{t('myCrop.activeCropProfile', language)}</p>
            <h1>{crop.name}</h1>
            <p>{t('myCrop.varietyLabel', language)} {crop.variety || t('myCrop.notSpecified', language)}</p>
            <div className="crop-meta">
              <span><MapPin className="size-4" /> {crop.area} {t('common.acres', language)}</span>
              <span><CalendarDays className="size-4" /> {t('myCrop.planted', language)} {new Date(crop.plantedDate).toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short' })}</span>
              <span><Wheat className="size-4" /> {crop.quantity} {crop.unit}</span>
            </div>
          </div>
        </section>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="metric-card">
            <div className="metric-icon"><CalendarDays className="size-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{t('myCrop.daysGrowing', language)}</p>
              <p className="mt-1 text-xl font-bold">{days}</p>
              <p className="text-[11px] text-muted-foreground">{t('myCrop.sincePlanting', language)}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon blue"><Droplets className="size-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{t('myCrop.waterPlan', language)}</p>
              <p className="mt-1 text-xl font-bold">2–3×</p>
              <p className="text-[11px] text-muted-foreground">{t('myCrop.perWeek', language)}</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon gold"><Sun className="size-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{t('myCrop.nextMilestone', language)}</p>
              <p className="mt-1 text-xl font-bold">{t(stageKeys[Math.min(stageIndex + 1, stages.length - 1)], language)}</p>
              <p className="text-[11px] text-muted-foreground">{t('myCrop.keepMonitoring', language)}</p>
            </div>
          </div>
        </div>
        <section className="crop-panel lifecycle-panel mt-5">
          <div className="section-heading">
            <div className="section-icon"><CheckCircle2 className="size-5" /></div>
            <div>
              <h2>{t('myCrop.lifecycle', language)}</h2>
              <p>{t('myCrop.currentStageAhead', language)}</p>
            </div>
          </div>
          <div className="lifecycle-scroll">
            {stages.map((stage, index) => (
              <div key={stage} className={`lifecycle-stage ${index === stageIndex ? 'current' : index < stageIndex ? 'done' : ''}`}>
                <span>{index < stageIndex ? '✓' : index === stageIndex ? '●' : '○'}</span>
                <strong>{t(stageKeys[index] || stage, language)}</strong>
                <small>{index === stageIndex ? t('myCrop.stageCurrent', language) : index < stageIndex ? t('myCrop.stageComplete', language) : t('myCrop.stageUpcoming', language)}</small>
              </div>
            ))}
          </div>
        </section>
        <div className="crop-content-grid">
          <section className="crop-panel">
            <div className="section-heading">
              <div className="section-icon"><Leaf className="size-5" /></div>
              <div>
                <h2>{t('myCrop.recommendationsFor', language)} {crop.name}</h2>
                <p>{t('myCrop.personalizedGuidance', language)}</p>
              </div>
            </div>
            <ul className="guidance-list">
              <li>{t('myCrop.guide1', language)}</li>
              <li>{t('myCrop.guide2', language)}</li>
              <li>{t('myCrop.guide3', language)}</li>
              <li>{t('myCrop.guide4', language)}</li>
            </ul>
          </section>
          <aside className="crop-panel crop-side-panel">
            <p className="eyebrow">{t('myCrop.yourFarmDetails', language)}</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t('myCrop.soilTypeLabel', language)}</span>
                <strong>{crop.soil}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t('myCrop.irrigationLabel', language)}</span>
                <strong>{crop.irrigation}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{t('myCrop.quantityLabel', language)}</span>
                <strong>{crop.quantity} {crop.unit}</strong>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-secondary/70 p-4">
              <p className="text-sm font-bold">{t('myCrop.nextBestAction', language)}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{t('myCrop.nextActionHint', language)}</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

