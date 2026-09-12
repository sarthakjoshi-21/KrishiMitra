'use client'

import { AlertTriangle, ArrowLeft, Cloud, CloudRain, CloudSun, Droplets, LogOut, Thermometer, Wind } from 'lucide-react'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'
import { FarmerSidebar } from './farmer-sidebar'

type Props = { onLogout: () => void; onNavigate: (tab: string) => void }

export default function WeatherScreen({ onLogout, onNavigate }: Props) {
  const { language, setLanguage } = useLanguage()

  const daysData = [
    { key: 'weather.day.today', icon: '☀', high: '37°', low: '24°', rain: '' },
    { key: 'weather.day.tomorrow', icon: '♨', high: '38°', low: '25°', rain: '' },
    { key: 'weather.day.fri', icon: '☀', high: '39°', low: '25°', rain: '' },
    { key: 'weather.day.sat', icon: '☀', high: '36°', low: '24°', rain: '2mm' },
    { key: 'weather.day.sun', icon: '☂', high: '33°', low: '23°', rain: '8mm' },
    { key: 'weather.day.mon', icon: 'ϟ', high: '32°', low: '22°', rain: '12mm' },
    { key: 'weather.day.tue', icon: '☀', high: '34°', low: '23°', rain: '3mm' },
  ]

  const conditions = [
    { icon: Thermometer, label: t('weather.highLow', language), value: '37° / 24°C' },
    { icon: Droplets, label: t('weather.humidity', language), value: '42%' },
    { icon: CloudRain, label: t('weather.rainChance', language), value: '5%' },
    { icon: Wind, label: t('weather.wind', language), value: '14 km/h' },
  ]

  return (
    <div className="weather-page min-h-screen bg-background">
      <header className="topbar">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('Overview')} className="secondary-button">
            <ArrowLeft className="size-4" /> {t('schemes.topbar.dashboard', language)}
          </button>
          <div className="brand-mark"><CloudSun className="size-6" /></div>
          <div>
            <p className="font-serif text-lg font-bold text-foreground">कृषी-मित्र</p>
            <p className="-mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center" htmlFor="weather-language">
            <span className="sr-only">Choose website language</span>
            <select
              id="weather-language"
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
          <button onClick={onLogout} className="secondary-button">
            <LogOut className="size-4" /> {t('nav.logout', language)}
          </button>
        </div>
      </header>
      <div className="app-layout">
        <FarmerSidebar activeTab="Weather" onNavigate={onNavigate} onLogout={onLogout} />
        <main className="dashboard-main">
          <div className="weather-stack">
            <section className="weather-alert">
              <div className="weather-alert-icon"><AlertTriangle className="size-7" /></div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1>{t('weather.advisoryTitle', language)}</h1>
                  <span>{t('weather.highRisk', language)}</span>
                </div>
                <p>{t('weather.advisoryDesc', language)}</p>
                <div className="weather-action">
                  <strong>{t('weather.recommendedAction', language)}</strong>
                  <p>{t('weather.actionDesc', language)}</p>
                </div>
              </div>
            </section>
            <section className="weather-panel">
              <div className="weather-heading">
                <div className="weather-heading-icon"><Cloud className="size-6" /></div>
                <div>
                  <h2>{t('weather.forecastTitle', language)}</h2>
                  <p>Nashik, Maharashtra</p>
                </div>
              </div>
              <div className="forecast-grid">
                {daysData.map(({ key, icon, high, low, rain }, index) => (
                  <div key={key} className={`forecast-day ${index === 0 ? 'selected' : ''}`}>
                    <strong>{t(key, language)}</strong>
                    <span className={`forecast-symbol ${rain ? 'rain' : index === 1 ? 'warm' : ''}`}>{icon}</span>
                    <b>{high}</b>
                    <small>{low}</small>
                    {rain ? <em>{rain}</em> : index === 0 ? <AlertTriangle className="size-4 text-orange-500" /> : null}
                  </div>
                ))}
              </div>
            </section>
            <section className="weather-panel">
              <div className="weather-heading">
                <div className="weather-heading-icon"><Thermometer className="size-6" /></div>
                <div>
                  <h2>{t('weather.conditionsTitle', language)}</h2>
                </div>
              </div>
              <div className="conditions-grid">
                {conditions.map(({ icon: Icon, label, value }) => (
                  <div className="condition-card" key={label}>
                    <Icon className="size-5 text-primary" />
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

