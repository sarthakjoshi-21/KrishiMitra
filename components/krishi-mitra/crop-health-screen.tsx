'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Droplets,
  FlaskConical,
  Languages,
  Leaf,
  Loader2,
  LogOut,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  Upload,
} from 'lucide-react'
import { FarmerSidebar } from './farmer-sidebar'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'
import {
  MOCK_DIAGNOSIS,
  PRESET_DIAGNOSES,
  DiagnosisResult,
} from '@/lib/health-utils'

interface Props {
  onLogout?: () => void
  onNavigate: (tab: string) => void
}

type ScanState = 'idle' | 'scanning' | 'result'

export default function CropHealthScreen({ onLogout, onNavigate }: Props) {
  const { language, setLanguage } = useLanguage()

  const [scanState, setScanState] = useState<ScanState>('idle')
  const [currentDiagnosis, setCurrentDiagnosis] = useState<DiagnosisResult>(MOCK_DIAGNOSIS)
  const [previewImage, setPreviewImage] = useState<string>(MOCK_DIAGNOSIS.sampleImageUrl || '')
  const [scanProgress, setScanProgress] = useState<number>(0)
  const [scanStepText, setScanStepText] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Scanning animation timer and progression
  useEffect(() => {
    let timer1: NodeJS.Timeout
    let timer2: NodeJS.Timeout
    let timer3: NodeJS.Timeout
    let finishTimer: NodeJS.Timeout

    if (scanState === 'scanning') {
      setScanProgress(15)
      setScanStepText(
        t('cropHealth.scanningTitle', language, 'AI Model analyzing leaf patterns...')
      )

      timer1 = setTimeout(() => {
        setScanProgress(52)
        setScanStepText(
          t(
            'cropHealth.scanningSub',
            language,
            'Extracting lesion pigmentation, cellular chlorosis gradients, and fungal sporulation signatures...'
          )
        )
      }, 1000)

      timer2 = setTimeout(() => {
        setScanProgress(86)
        setScanStepText(
          t(
            'cropHealth.matchingVectors',
            language,
            'Matching against 45,000+ certified agricultural pathology vectors...'
          )
        )
      }, 2000)

      timer3 = setTimeout(() => {
        setScanProgress(100)
      }, 2700)

      finishTimer = setTimeout(() => {
        setScanState('result')
      }, 3000)
    }

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(finishTimer)
    }
  }, [scanState, language])

  // Trigger scan with a given diagnosis
  const handleStartScan = (diagnosis: DiagnosisResult = MOCK_DIAGNOSIS) => {
    setCurrentDiagnosis(diagnosis)
    if (diagnosis.sampleImageUrl) {
      setPreviewImage(diagnosis.sampleImageUrl)
    }
    setScanState('scanning')
  }

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const objectUrl = URL.createObjectURL(file)
      setPreviewImage(objectUrl)
      handleStartScan(MOCK_DIAGNOSIS)
    }
  }

  // Reset scanner back to idle
  const handleResetScan = () => {
    setScanState('idle')
    setScanProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Topbar with Language Selector and Navigation */}
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('Overview')}
              className="secondary-button"
            >
              <ArrowLeft className="size-4" /> {t('schemes.topbar.dashboard', language, 'Dashboard')}
            </button>
            <div className="brand-mark">
              <Camera className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-foreground">
                {t('cropHealth.title', language, 'Crop Health & AI Scanner')}
              </p>
              <p className="-mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                {t('cropHealth.aiScanner', language, 'AI Leaf Disease Scanner')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
              <Languages className="size-4 text-primary" />
              <label htmlFor="crop-health-language-select" className="sr-only">
                Choose website language
              </label>
              <select
                id="crop-health-language-select"
                aria-label="Choose website language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'mr')}
                className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
              </select>
            </div>

            {/* Logout Button */}
            {onLogout && (
              <button type="button" onClick={onLogout} className="secondary-button">
                <LogOut className="size-4" /> {t('nav.logout', language, 'Logout')}
              </button>
            )}
          </div>
        </header>

        <div className="app-layout">
          <FarmerSidebar activeTab="Crop Health" onNavigate={onNavigate} onLogout={onLogout} />

          <main className="dashboard-main mx-auto flex max-w-5xl flex-col gap-6">
            {/* Back to Dashboard Navigation Link */}
            <button
              type="button"
              onClick={() => onNavigate('Overview')}
              className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors w-fit"
            >
              <ArrowLeft className="size-4" />
              {t('nav.backToDashboard', language, 'Back to Dashboard')}
            </button>

            {/* Hero Header Card */}
            <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-emerald-600/10 via-card to-amber-500/10 p-6 sm:p-7 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                    <Sparkles className="size-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                        {t('cropHealth.aiScanner', language, 'AI Leaf Disease Scanner')}
                      </h1>
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                        Vision AI 2.0
                      </span>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      {t(
                        'cropHealth.aiSubtitle',
                        language,
                        'Simulated computer-vision diagnosis detecting foliar blights, rusts, and fungal infections with certified treatments.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-3.5 py-2 shadow-sm text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span>Dual Treatment Protocols (Organic & Chemical)</span>
                </div>
              </div>
            </section>

            {/* ─── State 1: IDLE SCANNER DROPZONE ──────────────────────────── */}
            {scanState === 'idle' && (
              <section className="flex flex-col gap-6">
                {/* Large Dashed Dropzone Area */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleStartScan(MOCK_DIAGNOSIS)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleStartScan(MOCK_DIAGNOSIS)
                    }
                  }}
                  className="group relative flex min-h-[340px] cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-primary/40 bg-secondary/25 p-8 text-center shadow-sm transition-all hover:border-primary hover:bg-secondary/45 hover:shadow-md"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Pulsing Camera Icon container */}
                  <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm ring-4 ring-primary/10 transition-transform group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                    <Camera className="size-10" />
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                      {t('cropHealth.dropzoneLabel', language, 'Tap to capture or upload leaf photo')}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
                      {t(
                        'cropHealth.dropzoneSub',
                        language,
                        'Supports camera capture, high-res leaf scans, or pick a sample leaf below'
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    <span className="action-button text-xs py-2 px-4 shadow-md inline-flex items-center gap-2">
                      <Camera className="size-4" />
                      <span>{language === 'hi' ? 'स्कैन शुरू करें' : language === 'mr' ? 'स्कॅन सुरू करा' : 'Start AI Scan'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      className="secondary-button text-xs py-2 px-4 inline-flex items-center gap-2"
                    >
                      <Upload className="size-4" />
                      <span>{language === 'hi' ? 'फोटो अपलोड करें' : language === 'mr' ? 'फोटो अपलोड करा' : 'Browse Gallery'}</span>
                    </button>
                  </div>
                </div>

                {/* Field Presets Selection */}
                <div className="rounded-3xl border border-primary/15 bg-card p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                    {t('cropHealth.choosePreset', language, 'Or choose a field specimen to test:')}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {PRESET_DIAGNOSES.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleStartScan(preset)}
                        className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-secondary/30 p-4 text-left transition-all hover:border-primary hover:bg-secondary/60 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-sm text-foreground">{preset.cropName}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              preset.severity === 'moderate'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {preset.confidence}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{preset.diseaseName}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ─── State 2: ANIMATED SCANNING PHASE ────────────────────────── */}
            {scanState === 'scanning' && (
              <section className="relative flex min-h-[460px] flex-col items-center justify-center gap-6 overflow-hidden rounded-3xl border border-primary/30 bg-slate-950 p-8 text-center text-white shadow-xl">
                {/* Visual Leaf Preview & Laser Scan Beam */}
                <div className="relative size-64 sm:size-72 overflow-hidden rounded-2xl border-2 border-emerald-500/60 shadow-[0_0_35px_rgba(16,185,129,0.3)]">
                  {previewImage ? (
                    <Image
                      src={previewImage}
                      alt="Analyzing leaf"
                      width={288}
                      height={288}
                      className="size-full object-cover brightness-90 filter"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-slate-900">
                      <Leaf className="size-24 text-emerald-500/50" />
                    </div>
                  )}

                  {/* Pulsating Scanning Overlay Grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />

                  {/* Animated Laser Scanning Beam */}
                  <div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981]"
                    style={{
                      top: `${scanProgress}%`,
                      transition: 'top 0.4s ease-out',
                    }}
                  />

                  {/* Corner Target Markers */}
                  <div className="absolute top-2 left-2 size-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-2 right-2 size-4 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-2 left-2 border-b-2 border-l-2 border-emerald-400 size-4" />
                  <div className="absolute bottom-2 right-2 border-b-2 border-r-2 border-emerald-400 size-4" />
                </div>

                {/* Progress Bar & Status Text */}
                <div className="w-full max-w-md space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="size-5 animate-spin text-emerald-400" />
                    <span className="text-base font-bold text-white tracking-wide">
                      {scanStepText}
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300 ease-out"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>

                  <p className="text-xs font-mono text-emerald-300/80">
                    Confidence vector evaluation: {scanProgress}% complete
                  </p>
                </div>
              </section>
            )}

            {/* ─── State 3: DIAGNOSIS RESULTS UI ───────────────────────────── */}
            {scanState === 'result' && (
              <section className="flex flex-col gap-6">
                {/* Result Hero Card */}
                <article className="rounded-3xl border border-primary/25 bg-card p-6 sm:p-8 shadow-sm">
                  {/* Top Badges & Disease Title */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-xs font-bold">
                          <Sparkles className="size-3.5" />
                          {currentDiagnosis.confidence}% {t('cropHealth.confidence', language, 'Confidence')}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            currentDiagnosis.severity === 'high'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : currentDiagnosis.severity === 'moderate'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {t(currentDiagnosis.severityKey, language, 'Moderate Severity')}
                        </span>
                        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                          {t(currentDiagnosis.cropKey, language, currentDiagnosis.cropName)}
                        </span>
                      </div>

                      <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                        {t(currentDiagnosis.diseaseKey, language, currentDiagnosis.diseaseName)}
                      </h2>
                    </div>

                    {/* Reset Button (prominently placed as required) */}
                    <button
                      type="button"
                      onClick={handleResetScan}
                      className="secondary-button inline-flex items-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl shrink-0"
                    >
                      <RotateCcw className="size-4" />
                      <span>{t('cropHealth.resetScan', language, 'Reset / Scan Another Leaf')}</span>
                    </button>
                  </div>

                  {/* Observed Symptoms */}
                  <div className="mt-5 rounded-2xl bg-secondary/50 p-4 border border-border">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      {t('cropHealth.symptomsTitle', language, 'Observed Pathological Symptoms')}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                      {t(currentDiagnosis.symptomsKey, language, currentDiagnosis.symptoms)}
                    </p>
                  </div>

                  {/* Dual Treatment Protocols: Organic (Green) vs Chemical (Orange/Red) */}
                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    {/* Organic Protocol (Green Badge) */}
                    <div className="flex flex-col justify-between rounded-2xl border border-emerald-300 bg-emerald-50/60 p-5 dark:bg-emerald-950/30 dark:border-emerald-900 shadow-sm">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                            <Leaf className="size-5 text-emerald-600" />
                            <span>{t('cropHealth.organicTreatment', language, 'Organic / Bio-Control')}</span>
                          </div>
                          <span className="rounded-full bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                            Zero Residue
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-emerald-950 dark:text-emerald-100 font-medium">
                          {t(currentDiagnosis.organicTreatmentKey, language, currentDiagnosis.organicTreatment)}
                        </p>
                      </div>
                      <p className="mt-4 text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                        ✓ Certified safe for organic exports & continuous harvest
                      </p>
                    </div>

                    {/* Chemical Protocol (Orange/Red Badge) */}
                    <div className="flex flex-col justify-between rounded-2xl border border-amber-300 bg-amber-50/60 p-5 dark:bg-amber-950/30 dark:border-amber-900 shadow-sm">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                            <FlaskConical className="size-5 text-amber-600" />
                            <span>{t('cropHealth.chemicalTreatment', language, 'Chemical Fungicide')}</span>
                          </div>
                          <span className="rounded-full bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                            Targeted Fast-Action
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-amber-950 dark:text-amber-100 font-medium">
                          {t(currentDiagnosis.chemicalTreatmentKey, language, currentDiagnosis.chemicalTreatment)}
                        </p>
                      </div>
                      <p className="mt-4 text-[11px] text-amber-800/80 dark:text-amber-300/80">
                        ⚠ Follow safety dilution & strictly honor Pre-Harvest Interval (PHI)
                      </p>
                    </div>
                  </div>

                  {/* Pre-Harvest Interval (PHI) Safety Warning Banner */}
                  <div className="mt-6 flex items-start gap-4 rounded-2xl border border-red-300 bg-red-50 p-5 dark:bg-red-950/40 dark:border-red-800 shadow-sm">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
                      <AlertTriangle className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-red-900 dark:text-red-200 text-base">
                          {t('cropHealth.phiTitle', language, 'Pre-Harvest Interval (PHI) Safety Warning')}
                        </h3>
                        <span className="rounded-full bg-red-200 text-red-900 px-2.5 py-0.5 text-[11px] font-bold">
                          {currentDiagnosis.phiDays > 0 ? `${currentDiagnosis.phiDays} Days PHI` : '0 Days'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-red-800 dark:text-red-300 leading-relaxed">
                        {t(currentDiagnosis.phiWarningKey, language, currentDiagnosis.phiWarning)}
                      </p>
                      <p className="mt-2 text-xs text-red-700/80 dark:text-red-400 leading-relaxed">
                        {t(currentDiagnosis.safetyNotesKey, language, currentDiagnosis.safetyNotes)}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Reset Call-to-action */}
                  <div className="mt-7 flex justify-center border-t border-border pt-6">
                    <button
                      type="button"
                      onClick={handleResetScan}
                      className="action-button inline-flex items-center gap-2 shadow-lg"
                    >
                      <RotateCcw className="size-4" />
                      <span>{t('cropHealth.resetScan', language, 'Reset / Scan Another Leaf')}</span>
                    </button>
                  </div>
                </article>
              </section>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
