'use client'

import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CloudRain,
  Droplets,
  Languages,
  Loader2,
  LogOut,
  MapPin,
  PlusCircle,
  RefreshCw,
  Sprout,
  Sun,
  Thermometer,
  Timer,
  Zap,
} from 'lucide-react'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'
import { FarmerSidebar } from './farmer-sidebar'
import { FarmerCrop } from '@/lib/crop-utils'
import { getMyCrops } from '@/lib/actions/crop-actions'
import {
  WeatherData,
  DEFAULT_COORDINATES,
  fetchWeatherForecast,
  getFallbackWeatherData,
} from '@/lib/weather-utils'
import {
  calculateIrrigationAdvisory,
  IrrigationAdvisoryResult,
} from '@/lib/irrigation-utils'

interface Props {
  onLogout?: () => void
  onNavigate: (tab: string) => void
}

export default function IrrigationScreen({ onLogout, onNavigate }: Props) {
  const { language, setLanguage } = useLanguage()

  const [crops, setCrops] = useState<FarmerCrop[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeValves, setActiveValves] = useState<Record<string, boolean>>({})
  const [successNotif, setSuccessNotif] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lon: number }>(DEFAULT_COORDINATES)
  const [locationName, setLocationName] = useState<string>(DEFAULT_COORDINATES.name)

  // Empty dependency array [] to prevent infinite loops
  useEffect(() => {
    let isMounted = true

    async function loadData(lat: number, lon: number, locName: string) {
      try {
        // Fetch both crops and live weather in parallel
        const [cropsRes, weatherData] = await Promise.all([
          getMyCrops().catch((err) => {
            console.error('[IrrigationScreen] Error fetching crops:', err)
            return { data: [] as FarmerCrop[], error: String(err) }
          }),
          fetchWeatherForecast(lat, lon, locName).catch((err) => {
            console.warn('[IrrigationScreen] Weather fetch fallback:', err)
            return getFallbackWeatherData(lat, lon, locName)
          }),
        ])

        if (isMounted) {
          const loadedCrops = Array.isArray(cropsRes)
            ? cropsRes
            : Array.isArray(cropsRes?.data)
            ? cropsRes.data
            : []
          setCrops(loadedCrops)
          setWeather(weatherData)
          setCoords({ lat, lon })
          setLocationName(locName)
          setLoading(false)
        }
      } catch (e) {
        console.error('[IrrigationScreen] Load error:', e)
        if (isMounted) {
          setWeather(getFallbackWeatherData(lat, lon, locName))
          setLoading(false)
        }
      }
    }

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4))
          const lon = Number(pos.coords.longitude.toFixed(4))
          loadData(lat, lon, 'Current Farm Location')
        },
        (err) => {
          console.warn('[IrrigationScreen] GPS denied/timeout, using default:', err.message)
          loadData(DEFAULT_COORDINATES.lat, DEFAULT_COORDINATES.lon, DEFAULT_COORDINATES.name)
        },
        { timeout: 5000, enableHighAccuracy: false }
      )
    } else {
      loadData(DEFAULT_COORDINATES.lat, DEFAULT_COORDINATES.lon, DEFAULT_COORDINATES.name)
    }

    return () => {
      isMounted = false
    }
  }, [])

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const [cropsRes, weatherData] = await Promise.all([
        getMyCrops(),
        fetchWeatherForecast(coords.lat, coords.lon, locationName),
      ])
      const loadedCrops = Array.isArray(cropsRes)
        ? cropsRes
        : Array.isArray(cropsRes?.data)
        ? cropsRes.data
        : []
      setCrops(loadedCrops)
      setWeather(weatherData)
    } catch (e) {
      console.error('[IrrigationScreen] Refresh error:', e)
    } finally {
      setRefreshing(false)
    }
  }

  // Toggle simulated IoT drip valve
  const handleToggleValve = (cropId: string, cropName: string) => {
    setActiveValves((prev) => {
      const isCurrentlyActive = !!prev[cropId]
      const nextState = !isCurrentlyActive
      if (nextState) {
        setSuccessNotif(
          `${t('irrigation.valveSuccess', language, 'Drip cycle initiated for this plot!')} (${cropName})`
        )
        setTimeout(() => setSuccessNotif(null), 4000)
      }
      return { ...prev, [cropId]: nextState }
    })
  }

  // Load sample crops for instant demonstration
  const handleLoadDemoCrops = () => {
    const sampleCrops: FarmerCrop[] = [
      {
        id: 'demo-1',
        farmer_id: 'demo-farmer-123',
        crop_name: 'Wheat',
        name: 'Wheat',
        variety: 'Lokwan',
        sowing_date: '2026-01-10',
        area_acres: 2.5,
        area: 2.5,
        soil: 'Black soil',
        irrigation: 'Drip irrigation',
      },
      {
        id: 'demo-2',
        farmer_id: 'demo-farmer-123',
        crop_name: 'Onion',
        name: 'Onion',
        variety: 'Nashik Red',
        sowing_date: '2026-02-01',
        area_acres: 1.5,
        area: 1.5,
        soil: 'Loamy soil',
        irrigation: 'Drip irrigation',
      },
      {
        id: 'demo-3',
        farmer_id: 'demo-farmer-123',
        crop_name: 'Tomato',
        name: 'Tomato',
        variety: 'Abhinav',
        sowing_date: '2026-02-15',
        area_acres: 1.0,
        area: 1.0,
        soil: 'Red soil',
        irrigation: 'Drip irrigation',
      },
    ]
    setCrops(sampleCrops)
  }

  // Compute aggregate metrics
  const todayRain = weather?.daily?.[0]?.precipitation ?? 0
  const tomorrowRain = weather?.daily?.[1]?.precipitation ?? 0
  const maxRain = Math.max(todayRain, tomorrowRain)
  const currentTemp = weather?.daily?.[0]?.maxTemp ?? weather?.current?.temperature ?? 30

  return (
    <>
      <div className="irrigation-page min-h-screen bg-background">
        {/* Topbar with Navigation and Language Selector */}
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
              <Droplets className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-foreground">
                {t('irrigation.smartTitle', language, 'Smart IoT Irrigation')}
              </p>
              <p className="-mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                {t('irrigation.weatherLinked', language, 'Open-Meteo Weather Feed Synced')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="secondary-button"
              title={t('weather.refresh', language, 'Refresh Data')}
            >
              <RefreshCw className={`size-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
              <span className="hidden sm:inline">{t('weather.refresh', language, 'Refresh')}</span>
            </button>

            {/* Language Selector */}
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
              <Languages className="size-4 text-primary" />
              <label htmlFor="irrigation-language-select" className="sr-only">
                Choose website language
              </label>
              <select
                id="irrigation-language-select"
                aria-label="Choose website language"
                value={language}
                onChange={(event) => setLanguage(event.target.value as 'en' | 'hi' | 'mr')}
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
          <FarmerSidebar activeTab="Irrigation" onNavigate={onNavigate} onLogout={onLogout} />

          <main className="dashboard-main">
            <div className="irrigation-stack">
              {/* Back to Dashboard Link */}
              <button
                type="button"
                onClick={() => onNavigate('Overview')}
                className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-2 transition-colors w-fit"
              >
                <ArrowLeft className="size-4" />
                {t('nav.backToDashboard', language, 'Back to Dashboard')}
              </button>

              {/* Notification Banner when valve is toggled */}
              {successNotif && (
                <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                  <span>{successNotif}</span>
                </div>
              )}

              {/* Hero Banner: IoT Smart Irrigation System */}
              <section className="irrigation-hero">
                <div className="irrigation-hero-icon">
                  <Droplets className="size-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1>{t('irrigation.smartTitle', language, 'Smart IoT Irrigation Advisory')}</h1>
                    <span className="rounded-full bg-white/20 text-white border border-white/30 px-3 py-0.5 text-xs font-bold">
                      {t('irrigation.mvpActive', language, 'MVP Active')}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-white/90">
                    {t(
                      'irrigation.smartSubtitle',
                      language,
                      'Crop-tailored irrigation intelligence combining farm records with live Open-Meteo weather data.'
                    )}
                  </p>
                </div>
              </section>

              {/* Weather Data Sync Overview Pill */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/70 via-card to-emerald-50/70 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    {maxRain > 5 ? <CloudRain className="size-5" /> : <Sun className="size-5 text-amber-600" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {locationName} · {currentTemp}°C
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {todayRain > 0 || tomorrowRain > 0
                        ? `${t('weather.expectedRain', language, 'Rain')}: ${todayRain}mm (${t('weather.day.today', language, 'Today')}), ${tomorrowRain}mm (${t('weather.day.tomorrow', language, 'Tomorrow')})`
                        : `${t('weather.condition.clear', language, 'Dry weather forecast')} · 0mm rain`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-foreground">
                    <Sprout className="size-3.5 text-primary" />
                    {crops.length} {t('irrigation.activeCrops', language, 'Active Crops')}
                  </span>
                </div>
              </div>

              {/* Main Content: Loading State, Empty State, or Active Crop Advisories */}
              {loading ? (
                <div className="flex min-h-[340px] flex-col items-center justify-center gap-4 rounded-3xl border border-primary/20 bg-card p-10 text-center shadow-sm">
                  <Loader2 className="size-12 animate-spin text-primary" />
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {t('weather.updating', language, 'Calculating Smart Irrigation Advisories...')}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Synthesizing crop data with Open-Meteo atmospheric models
                    </p>
                  </div>
                </div>
              ) : crops.length === 0 ? (
                /* Empty State: Prompt user to add crops in My Crop */
                <div className="flex min-h-[380px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-primary/30 bg-card p-10 text-center shadow-sm">
                  <div className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                    <Droplets className="size-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {t('irrigation.noCropsTitle', language, 'No Active Crops Found')}
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
                      {t(
                        'irrigation.noCropsDesc',
                        language,
                        "Please add a crop in the 'My Crop' tab to get smart irrigation advisories."
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => onNavigate('My Crop')}
                      className="action-button inline-flex items-center gap-2"
                    >
                      <PlusCircle className="size-4" />
                      {t('irrigation.goToMyCrop', language, 'Go to My Crop')}
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadDemoCrops}
                      className="secondary-button inline-flex items-center gap-2"
                    >
                      <Zap className="size-4 text-amber-500" />
                      <span>{language === 'hi' ? 'डेमो फसलें लोड करें' : language === 'mr' ? 'डेमो पिके लोड करा' : 'Load Presentation Demo Crops'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Crop Cards Grid with Smart Advisory */
                <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {crops.map((crop) => {
                    const advisory: IrrigationAdvisoryResult = calculateIrrigationAdvisory(crop, weather)
                    const cropName = crop.crop_name || crop.name || 'Crop'
                    const cropArea = crop.area_acres ?? crop.area ?? 1
                    const isValveOn = !!activeValves[crop.id]

                    return (
                      <article
                        key={crop.id || cropName}
                        className="flex flex-col justify-between rounded-3xl border border-primary/20 bg-card p-6 shadow-sm transition-all hover:shadow-md"
                      >
                        <div>
                          {/* Card Header: Crop Name, Area, Status Badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h2 className="font-serif text-xl font-bold text-foreground">{cropName}</h2>
                                {crop.variety && (
                                  <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                    {crop.variety}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {cropArea} {cropArea === 1 ? 'Acre' : 'Acres'} · {crop.soil || 'Black Soil'}
                              </p>
                            </div>

                            {/* Color-Coded Status Badge: Blue for pause, Red for critical, Green for normal */}
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                                advisory.status === 'pause'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
                                  : advisory.status === 'critical'
                                  ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {advisory.status === 'pause' ? (
                                <CloudRain className="size-3.5" />
                              ) : advisory.status === 'critical' ? (
                                <AlertTriangle className="size-3.5" />
                              ) : (
                                <CheckCircle2 className="size-3.5" />
                              )}
                              {t(advisory.statusKey, language, advisory.statusLabel)}
                            </span>
                          </div>

                          {/* Advisory Highlight Card */}
                          <div
                            className={`mt-4 rounded-2xl border p-4 ${
                              advisory.status === 'pause'
                                ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900'
                                : advisory.status === 'critical'
                                ? 'bg-red-50/70 border-red-200 dark:bg-red-950/30 dark:border-red-900'
                                : 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Water Drop Icon (prominently featured as required) */}
                              <div
                                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                                  advisory.status === 'pause'
                                    ? 'bg-blue-600 text-white'
                                    : advisory.status === 'critical'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-emerald-600 text-white'
                                } shadow-sm`}
                              >
                                <Droplets className="size-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-foreground">
                                  {t(advisory.messageKey, language, advisory.message)}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                  {advisory.triggerReason}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Soil Moisture Progress */}
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-muted-foreground">
                                {t('irrigation.soilMoisture', language, 'Estimated Root Moisture')}
                              </span>
                              <span
                                className={`font-bold ${
                                  advisory.status === 'critical'
                                    ? 'text-red-600'
                                    : advisory.status === 'pause'
                                    ? 'text-blue-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {advisory.soilMoistureEst}%
                              </span>
                            </div>
                            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  advisory.status === 'critical'
                                    ? 'bg-red-500'
                                    : advisory.status === 'pause'
                                    ? 'bg-blue-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${advisory.soilMoistureEst}%` }}
                              />
                            </div>
                          </div>

                          {/* Water Requirement Metrics */}
                          <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-secondary/50 p-3 text-xs">
                            <div>
                              <p className="text-muted-foreground">
                                {t('irrigation.waterRecommendation', language, 'Target Volume')}
                              </p>
                              <p className="mt-0.5 text-sm font-bold text-foreground">
                                {advisory.recommendedWater}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                {t('irrigation.totalLiters', language, 'Plot Total')}
                              </p>
                              <p className="mt-0.5 text-sm font-bold text-foreground">
                                {advisory.totalWaterRequirementLiters > 0
                                  ? `${advisory.totalWaterRequirementLiters.toLocaleString()} L`
                                  : '0 L (Hold)'}
                              </p>
                            </div>
                          </div>

                          {/* Best Window & Actionable Tip */}
                          <div className="mt-3.5 space-y-2 text-xs leading-relaxed text-muted-foreground">
                            <div className="flex items-start gap-2">
                              <Clock className="size-4 shrink-0 text-primary mt-0.5" />
                              <span>{t('irrigation.irrigationWindowDesc', language, 'Optimal timing: Early morning (6:00 AM – 8:30 AM) minimizes evaporation.')}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Sprout className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                              <span>{t(advisory.cropSpecificTipKey, language, advisory.cropSpecificTip)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Action Button: Valve Simulation */}
                        <div className="mt-5 pt-4 border-t border-border">
                          <button
                            type="button"
                            onClick={() => handleToggleValve(crop.id, cropName)}
                            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all ${
                              isValveOn
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                : advisory.status === 'pause'
                                ? 'border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                          >
                            {isValveOn ? (
                              <>
                                <span className="size-2 rounded-full bg-white animate-ping" />
                                <Check className="size-4" />
                                {t('irrigation.valveActive', language, 'Drip Valve Active')}
                              </>
                            ) : (
                              <>
                                <Droplets className="size-4" />
                                {t('irrigation.valveAction', language, 'Trigger Drip Valve')}
                              </>
                            )}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </section>
              )}

              {/* Safety-Tiered Automation Section */}
              <section className="irrigation-safety mt-4">
                <div className="flex items-center gap-4">
                  <div className="safety-icon">
                    <Zap className="size-6 text-primary" />
                  </div>
                  <div>
                    <h2>
                      {t('irrigation.safetyTitle', language, 'Safety-Tiered Automation')}{' '}
                      <span className="text-muted-foreground font-normal text-sm">
                        {t('irrigation.concept', language, '(Hardware-Ready Architecture)')}
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t('irrigation.futureReady', language, 'Future-ready IoT control infrastructure')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="safety-tier active border border-primary/30 rounded-2xl bg-primary/5 p-4">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <span className="size-2 rounded-full bg-primary" />
                      {t('irrigation.tier1Title', language, 'Tier 1 — Advisory (Active)')}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(
                        'irrigation.tier1Desc',
                        language,
                        'System analyzes crop stage and weather to recommend irrigation. Farmer confirms manually.'
                      )}
                    </p>
                    <b className="mt-2 block text-[11px] text-primary font-semibold">
                      {t('irrigation.mvpActive', language, 'Live In Presentation Demo')}
                    </b>
                  </div>

                  <div className="safety-tier rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <span className="size-2 rounded-full bg-muted-foreground/40" />
                      {t('irrigation.tier2Title', language, 'Tier 2 — Assisted')}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(
                        'irrigation.tier2Desc',
                        language,
                        'System prepares irrigation schedule with pre-filled valve timings. Farmer one-tap confirms.'
                      )}
                    </p>
                  </div>

                  <div className="safety-tier rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                      <span className="size-2 rounded-full bg-muted-foreground/40" />
                      {t('irrigation.tier3Title', language, 'Tier 3 — Automated')}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(
                        'irrigation.tier3Desc',
                        language,
                        'System auto-activates solenoid valves based on threshold triggers. Farmer can override at any time.'
                      )}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
