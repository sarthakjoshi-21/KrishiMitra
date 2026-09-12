'use client'

import { useState } from 'react'
import { AlertTriangle, ArrowLeft, Check, CloudRain, Droplets, MapPin, Thermometer, Timer } from 'lucide-react'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'

type Props = { onLogout: () => void; onNavigate: (tab: string) => void }

export default function IrrigationScreen({ onLogout, onNavigate }: Props) {
  const { language, setLanguage } = useLanguage()
  const [scheduled, setScheduled] = useState<string[]>([])

  const zones = [
    {
      name: 'Zone A — North Plot',
      risk: t('weather.highRisk', language),
      action: language === 'hi' ? 'अभी सिंचाई करें' : language === 'mr' ? 'आता पाणी द्या' : 'Irrigate Now',
      detail: language === 'hi' ? '12 घंटे के भीतर · ~4,500 लीटर' : language === 'mr' ? '12 तासांत · ~4,500 लिटर' : 'Within 12h · ~4,500 litres',
      copy: language === 'hi' ? 'मिट्टी की नमी 28% (गंभीर स्तर)। उच्च तापमान से पानी तेजी से कम हो रहा है।' : language === 'mr' ? 'मातीतील ओलावा 28% (गंभीर स्तर). उच्च तापमानामुळे बाष्पीभवन वेगाने होत आहे.' : 'Soil moisture at 28% (critical). High temperature accelerating water loss.',
      moisture: 28,
      temp: '36.2°C',
      last: language === 'hi' ? '52 घंटे पहले' : language === 'mr' ? '52 तासांपूर्वी' : '52h ago',
      tone: 'high',
    },
    {
      name: 'Zone C — East Plot',
      risk: language === 'hi' ? 'मध्यम जोखिम' : language === 'mr' ? 'मध्यम धोका' : 'Medium Risk',
      action: language === 'hi' ? 'शीघ्र सिंचाई करें' : language === 'mr' ? 'लवकर पाणी द्या' : 'Irrigate Soon',
      detail: language === 'hi' ? '24 घंटे के भीतर · ~2,400 लीटर' : language === 'mr' ? '24 तासांत · ~2,400 लिटर' : 'Within 24h · ~2,400 litres',
      copy: language === 'hi' ? 'मिट्टी की नमी 38%, सतर्कता सीमा की ओर अग्रसर।' : language === 'mr' ? 'मातीतील ओलावा 38%, दक्षतेच्या पातळीकडे झुकत आहे.' : 'Soil moisture at 38%, trending toward the watch threshold.',
      moisture: 38,
      temp: '35.4°C',
      last: language === 'hi' ? '30 घंटे पहले' : language === 'mr' ? '30 तासांपूर्वी' : '30h ago',
      tone: 'medium',
    },
    {
      name: 'Zone B — Central Plot',
      risk: language === 'hi' ? 'कम जोखिम' : language === 'mr' ? 'कमी धोका' : 'Low Risk',
      action: language === 'hi' ? 'रोकें' : language === 'mr' ? 'थांबवा' : 'Hold',
      detail: language === 'hi' ? 'अभी कोई कार्रवाई आवश्यक नहीं' : language === 'mr' ? 'आता कोणत्याही कृतीची गरज नाही' : 'No action needed now',
      copy: language === 'hi' ? 'पर्याप्त नमी (51%)। जलभराव से बचने के लिए सिंचाई रोकें।' : language === 'mr' ? 'पुरेसा ओलावा (51%). दलदल टाळण्यासाठी पाणी देणे थांबवा.' : 'Adequate moisture (51%). Hold irrigation to avoid waterlogging.',
      moisture: 51,
      temp: '34.1°C',
      last: language === 'hi' ? '14 घंटे पहले' : language === 'mr' ? '14 तासांपूर्वी' : '14h ago',
      tone: 'low',
    },
  ]

  return (
    <div className="irrigation-page min-h-screen bg-background">
      <header className="topbar">
        <div className="flex items-center gap-3">
          <div className="brand-mark"><Droplets className="size-6" /></div>
          <div>
            <p className="font-serif text-lg font-bold text-foreground">कृषी-मित्र</p>
            <p className="-mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center" htmlFor="irrigation-language">
            <span className="sr-only">Choose website language</span>
            <select
              id="irrigation-language"
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
        <main className="dashboard-main">
          <div className="irrigation-stack">
            <button
              type="button"
              onClick={() => onNavigate('Overview')}
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80"
            >
              <ArrowLeft className="size-4" />{t('nav.backToDashboard', language)}
            </button>
            <section className="irrigation-hero">
              <div className="irrigation-hero-icon"><Droplets className="size-7" /></div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1>{t('irrigation.title', language)}</h1>
                  <span>{t('irrigation.simulatedSensors', language)}</span>
                </div>
                <p>{t('irrigation.heroDesc', language)}</p>
              </div>
            </section>
            <div className="irrigation-rain">
              <CloudRain className="size-6" />
              <strong>{t('irrigation.rainfallExpected', language)}</strong> {t('irrigation.rainfallDesc', language)}
            </div>
            <section className="irrigation-zones">
              {zones.map((zone) => (
                <article key={zone.name} className="irrigation-zone">
                  <div className="flex items-center justify-between gap-3">
                    <h2><MapPin className="size-5" />{zone.name}</h2>
                    <span className={`risk ${zone.tone}`}>{zone.risk}</span>
                  </div>
                  <div className={`irrigation-action ${zone.tone}`}>
                    <Droplets className="size-6" />
                    <div>
                      <strong>{zone.action}</strong>
                      <small>{zone.detail}</small>
                    </div>
                  </div>
                  <p className="zone-copy">{zone.copy}</p>
                  <div className="moisture-row">
                    <div className="flex justify-between text-xs">
                      <span>{t('irrigation.soilMoisture', language)}</span>
                      <b>{zone.moisture}%</b>
                    </div>
                    <div className="moisture-track">
                      <div className={`moisture-fill ${zone.tone}`} style={{ width: `${zone.moisture * 1.5}%` }} />
                    </div>
                  </div>
                  <div className="zone-meta">
                    <span><Thermometer className="size-4" />{t('irrigation.temperature', language)} <b>{zone.temp}</b></span>
                    <span><Timer className="size-4" />{t('irrigation.lastIrrigated', language)} <b>{zone.last}</b></span>
                  </div>
                  <button
                    onClick={() => setScheduled((items) => items.includes(zone.name) ? items.filter((item) => item !== zone.name) : [...items, zone.name])}
                    disabled={zone.tone === 'low'}
                    className="zone-button"
                  >
                    {zone.tone === 'low' ? (
                      <><Check className="size-4" />{t('irrigation.zoneHealthy', language)}</>
                    ) : scheduled.includes(zone.name) ? (
                      <><Check className="size-4" />{t('irrigation.scheduled', language)}</>
                    ) : (
                      <><Droplets className="size-4" />{t('irrigation.scheduleIrrigation', language)}</>
                    )}
                  </button>
                </article>
              ))}
            </section>
            <section className="irrigation-safety">
              <div className="flex items-center gap-4">
                <div className="safety-icon"><AlertTriangle className="size-6" /></div>
                <div>
                  <h2>{t('irrigation.safetyTitle', language)} <span>{t('irrigation.concept', language)}</span></h2>
                  <p>{t('irrigation.futureReady', language)}</p>
                </div>
              </div>
              <div className="safety-tier active">
                <i />
                <div>
                  <strong>{t('irrigation.tier1Title', language)}</strong>
                  <p>{t('irrigation.tier1Desc', language)}</p>
                  <b>{t('irrigation.mvpActive', language)}</b>
                </div>
              </div>
              <div className="safety-tier">
                <i />
                <div>
                  <strong>{t('irrigation.tier2Title', language)}</strong>
                  <p>{t('irrigation.tier2Desc', language)}</p>
                </div>
              </div>
              <div className="safety-tier">
                <i />
                <div>
                  <strong>{t('irrigation.tier3Title', language)}</strong>
                  <p>{t('irrigation.tier3Desc', language)}</p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

