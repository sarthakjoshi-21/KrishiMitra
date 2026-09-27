'use client'

import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Compass,
  Droplets,
  Languages,
  Loader2,
  LogOut,
  MapPin,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'
import { FarmerSidebar } from './farmer-sidebar'
import {
  WeatherData,
  DEFAULT_COORDINATES,
  fetchWeatherForecast,
  getFallbackWeatherData,
} from '@/lib/weather-utils'

interface Props {
  onNavigate: (tab: string) => void
  onLogout?: () => void
}

/**
 * Maps WeatherData iconType to Lucide React icons
 */
function WeatherIcon({
  type,
  className = 'size-6',
}: {
  type: 'Sun' | 'Cloud' | 'CloudSun' | 'CloudRain' | 'CloudLightning' | 'CloudSnow' | 'CloudFog'
  className?: string
}) {
  switch (type) {
    case 'Sun':
      return <Sun className={`${className} text-amber-500`} />
    case 'CloudSun':
      return <CloudSun className={`${className} text-amber-500`} />
    case 'Cloud':
      return <Cloud className={`${className} text-slate-400`} />
    case 'CloudRain':
      return <CloudRain className={`${className} text-blue-500`} />
    case 'CloudLightning':
      return <CloudLightning className={`${className} text-purple-600`} />
    case 'CloudSnow':
      return <CloudSnow className={`${className} text-sky-400`} />
    case 'CloudFog':
      return <CloudFog className={`${className} text-slate-400`} />
    default:
      return <CloudSun className={`${className} text-amber-500`} />
  }
}

export default function WeatherScreen({ onNavigate, onLogout }: Props) {
  const { language, setLanguage } = useLanguage()

  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isGps, setIsGps] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lon: number }>(DEFAULT_COORDINATES)
  const [locationName, setLocationName] = useState<string>(DEFAULT_COORDINATES.name)

  // Empty dependency array [] to prevent infinite loops as requested in directive
  useEffect(() => {
    let isMounted = true

    const loadWeatherData = async (lat: number, lon: number, locName: string, gpsActive: boolean) => {
      try {
        const data = await fetchWeatherForecast(lat, lon, locName)
        if (isMounted) {
          setWeather(data)
          setCoords({ lat, lon })
          setLocationName(locName)
          setIsGps(gpsActive)
          setLoading(false)
        }
      } catch (err) {
        console.warn('[WeatherScreen] Error in fetch, applying resilient fallback:', err)
        if (isMounted) {
          setWeather(getFallbackWeatherData(lat, lon, locName))
          setCoords({ lat, lon })
          setLocationName(locName)
          setIsGps(gpsActive)
          setLoading(false)
        }
      }
    }

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords.latitude.toFixed(4))
          const lon = Number(position.coords.longitude.toFixed(4))
          loadWeatherData(lat, lon, 'Current Farm Location', true)
        },
        (error) => {
          console.warn('[WeatherScreen] Geolocation unavailable or denied, using Pimpri-Chinchwad default:', error.message)
          loadWeatherData(DEFAULT_COORDINATES.lat, DEFAULT_COORDINATES.lon, DEFAULT_COORDINATES.name, false)
        },
        { timeout: 5000, enableHighAccuracy: false }
      )
    } else {
      loadWeatherData(DEFAULT_COORDINATES.lat, DEFAULT_COORDINATES.lon, DEFAULT_COORDINATES.name, false)
    }

    return () => {
      isMounted = false
    }
  }, [])

  // Manual refresh action for live demonstration
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const data = await fetchWeatherForecast(coords.lat, coords.lon, locationName)
      setWeather(data)
    } catch (e) {
      console.error('[WeatherScreen] Refresh failed:', e)
    } finally {
      setRefreshing(false)
    }
  }

  // Format date nicely based on active language
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const locale = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN'
      return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <div className="weather-page min-h-screen bg-background">
        {/* Topbar matching app standard with Language Selector & Navigation */}
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
              <CloudSun className="size-6 text-amber-500" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-foreground">
                {t('weather.pageTitle', language, 'Hyper-Local Weather')}
              </p>
              <p className="-mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                {isGps
                  ? t('weather.gpsActive', language, 'Live GPS Active')
                  : t('weather.defaultLocation', language, 'Pimpri-Chinchwad')}
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
              title={t('weather.refresh', language, 'Refresh Weather')}
            >
              <RefreshCw className={`size-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
              <span className="hidden sm:inline">{t('weather.refresh', language, 'Refresh')}</span>
            </button>

            {/* Language Selector Component */}
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
              <Languages className="size-4 text-primary" />
              <label htmlFor="weather-language-select" className="sr-only">
                Language
              </label>
              <select
                id="weather-language-select"
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
          <FarmerSidebar activeTab="Weather" onNavigate={onNavigate} onLogout={onLogout} />

          <main className="dashboard-main">
            <div className="weather-stack">
              {/* Back to Dashboard Link */}
              <button
                type="button"
                onClick={() => onNavigate('Overview')}
                className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-2 transition-colors w-fit"
              >
                <ArrowLeft className="size-4" />
                {t('nav.backToDashboard', language, 'Back to Dashboard')}
              </button>

              {loading && !weather ? (
                /* Loading State Card */
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-3xl border border-primary/20 bg-card p-10 text-center shadow-sm">
                  <Loader2 className="size-12 animate-spin text-primary" />
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {t('weather.updating', language, 'Fetching Hyper-Local Weather Feed...')}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isGps ? 'Querying Open-Meteo for your live GPS coordinates' : 'Loading forecast for Pimpri-Chinchwad, Maharashtra'}
                    </p>
                  </div>
                </div>
              ) : weather ? (
                <>
                  {/* Hero Weather Metric Card */}
                  <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-emerald-500/10 via-card to-amber-500/10 p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      {/* Left: Temperature & Weather Condition */}
                      <div className="flex items-center gap-6">
                        <div className="flex size-20 sm:size-24 shrink-0 items-center justify-center rounded-3xl bg-card border border-primary/20 shadow-md">
                          <WeatherIcon type={weather.current.iconType} className="size-12 sm:size-14" />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl sm:text-6xl font-black tracking-tight text-foreground">
                              {weather.current.temperature}°
                            </span>
                            <span className="text-xl sm:text-2xl font-bold text-muted-foreground">C</span>
                          </div>
                          <p className="mt-1 text-base sm:text-lg font-semibold text-foreground">
                            {t(weather.current.translationKey, language, weather.current.weatherDescription)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                              <MapPin className="size-3" />
                              {locationName}
                            </span>
                            {isGps ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                {t('weather.gpsActive', language, 'Live GPS')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                {t('weather.defaultLocation', language, 'Pimpri-Chinchwad')}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              {weather.isFallback
                                ? t('weather.status.demo', language, 'Cached Demo Data')
                                : t('weather.status.live', language, 'Live Open-Meteo')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Highlight Stats */}
                      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-sm sm:gap-6">
                        <div className="text-center sm:text-left">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            {t('weather.highLow', language, 'High / Low')}
                          </p>
                          <p className="mt-1 text-base sm:text-lg font-bold text-foreground">
                            {weather.daily[0]?.maxTemp ?? 32}° / {weather.daily[0]?.minTemp ?? 22}°C
                          </p>
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            {t('weather.wind', language, 'Wind')}
                          </p>
                          <p className="mt-1 text-base sm:text-lg font-bold text-foreground">
                            {weather.current.windSpeed} km/h
                          </p>
                        </div>
                        <div className="text-center sm:text-left">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            {t('weather.precipitation', language, 'Rain')}
                          </p>
                          <p className="mt-1 text-base sm:text-lg font-bold text-blue-600">
                            {weather.daily[0]?.precipitation ?? 0} mm
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Agricultural Advisory Banner */}
                  <section className="weather-alert">
                    <div className="weather-alert-icon">
                      <AlertTriangle className="size-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-lg sm:text-xl font-bold text-foreground">
                          {t(weather.advisory.titleKey, language, weather.advisory.defaultTitle)}
                        </h1>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            weather.advisory.isHighRisk
                              ? 'bg-orange-100 text-orange-800 border border-orange-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {t(weather.advisory.riskKey, language, weather.advisory.defaultRisk)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        {t(weather.advisory.descKey, language, weather.advisory.defaultDesc)}
                      </p>
                      <div className="weather-action">
                        <strong>{t('weather.recommendedAction', language, 'Recommended Farm Action')}</strong>
                        <p>{t(weather.advisory.actionKey, language, weather.advisory.defaultAction)}</p>
                      </div>
                    </div>
                  </section>

                  {/* 7-Day Forecast Grid */}
                  <section className="weather-panel">
                    <div className="weather-heading">
                      <div className="weather-heading-icon">
                        <CalendarDays className="size-6 text-primary" />
                      </div>
                      <div>
                        <h2>{t('weather.forecastTitle', language, '7-Day Forecast')}</h2>
                        <p>{locationName}</p>
                      </div>
                    </div>
                    <div className="forecast-grid">
                      {weather.daily.map((day, index) => {
                        const dayLabel = day.dayKey ? t(day.dayKey, language, day.dayName) : day.dayName
                        const conditionLabel = day.translationKey
                          ? t(day.translationKey, language, day.weatherDescription)
                          : day.weatherDescription

                        return (
                          <div
                            key={day.date}
                            className={`forecast-day ${index === 0 ? 'selected' : ''}`}
                          >
                            <div className="flex flex-col items-center">
                              <strong>{dayLabel}</strong>
                              <span className="text-[10px] text-muted-foreground">{formatDate(day.date)}</span>
                            </div>

                            <div className="my-1 flex items-center justify-center">
                              <WeatherIcon type={day.iconType} className="size-8" />
                            </div>

                            <p className="text-[11px] font-medium text-foreground line-clamp-1" title={conditionLabel}>
                              {conditionLabel}
                            </p>

                            <div className="flex items-center gap-1.5">
                              <b>{day.maxTemp}°</b>
                              <small>{day.minTemp}°</small>
                            </div>

                            {day.precipitation > 0 ? (
                              <em className="text-xs font-bold text-blue-600 not-italic">
                                {day.precipitation}mm
                              </em>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">0mm</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>

                  {/* Current Farm Conditions Grid */}
                  <section className="weather-panel">
                    <div className="weather-heading">
                      <div className="weather-heading-icon">
                        <Thermometer className="size-6 text-primary" />
                      </div>
                      <div>
                        <h2>{t('weather.conditionsTitle', language, 'Current Farm Conditions')}</h2>
                        <p className="text-xs text-muted-foreground">
                          {coords.lat.toFixed(4)}°N, {coords.lon.toFixed(4)}°E
                        </p>
                      </div>
                    </div>
                    <div className="conditions-grid">
                      <div className="condition-card">
                        <div className="flex items-center gap-2">
                          <Thermometer className="size-5 text-primary" />
                          <span>{t('weather.highLow', language, 'High / Low Temp')}</span>
                        </div>
                        <strong>
                          {weather.daily[0]?.maxTemp ?? 32}° / {weather.daily[0]?.minTemp ?? 22}°C
                        </strong>
                      </div>

                      <div className="condition-card">
                        <div className="flex items-center gap-2">
                          <Wind className="size-5 text-primary" />
                          <span>{t('weather.wind', language, 'Wind Speed')}</span>
                        </div>
                        <strong>{weather.current.windSpeed} km/h</strong>
                      </div>

                      <div className="condition-card">
                        <div className="flex items-center gap-2">
                          <CloudRain className="size-5 text-blue-500" />
                          <span>{t('weather.precipitation', language, 'Rain Expected')}</span>
                        </div>
                        <strong className="text-blue-600">
                          {weather.daily[0]?.precipitation ?? 0} mm
                        </strong>
                      </div>

                      <div className="condition-card">
                        <div className="flex items-center gap-2">
                          <Compass className="size-5 text-primary" />
                          <span>{t('weather.coordinates', language, 'Coordinates')}</span>
                        </div>
                        <strong className="text-sm">
                          {coords.lat.toFixed(2)}°N, {coords.lon.toFixed(2)}°E
                        </strong>
                      </div>
                    </div>
                  </section>
                </>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
