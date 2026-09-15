'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Languages, MapPin, Truck, Users } from 'lucide-react'
import { FarmerSidebar } from './farmer-sidebar'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'

type Props = { onBack: () => void; onLogout: () => void; onNavigate: (tab: string) => void }

export default function LogisticsScreen({ onBack, onLogout, onNavigate }: Props) {
  const { language, setLanguage } = useLanguage()
  const [joined, setJoined] = useState(false)

  const stops = [
    {
      name: language === 'hi' ? 'राजेश पाटिल (आप)' : language === 'mr' ? 'राजेश पाटील (तुम्ही)' : 'Rajesh Patil (You)',
      detail: language === 'hi' ? 'चांदवड़ · आपसे 4 किमी' : language === 'mr' ? 'चांदवड · तुमच्यापासून 4 किमी' : 'Chandwad · 4 km from you',
      qty: `40 ${language === 'hi' ? 'कुंतल' : language === 'mr' ? 'क्विंटल' : 'qt'}`,
      active: true,
    },
    {
      name: language === 'hi' ? 'सुरेश शिंदे' : language === 'mr' ? 'सुरेश शिंदे' : 'Suresh Shinde',
      detail: language === 'hi' ? 'चांदवड़ · आपसे 1.5 किमी' : language === 'mr' ? 'चांदवड · तुमच्यापासून 1.5 किमी' : 'Chandwad · 1.5 km from you',
      qty: `30 ${language === 'hi' ? 'कुंतल' : language === 'mr' ? 'क्विंटल' : 'qt'}`,
    },
    {
      name: language === 'hi' ? 'महादेव जाधव' : language === 'mr' ? 'महादेव जाधव' : 'Mahadev Jadhav',
      detail: language === 'hi' ? 'निफाड़ · आपसे 9 किमी' : language === 'mr' ? 'निफाड · तुमच्यापासून 9 किमी' : 'Niphad · 9 km from you',
      qty: `25 ${language === 'hi' ? 'कुंतल' : language === 'mr' ? 'क्विंटल' : 'qt'}`,
    },
  ]

  const steps = [
    t('logistics.step1', language),
    t('logistics.step2', language),
    t('logistics.step3', language),
    t('logistics.step4', language),
  ]

  return (
    <div className="logistics-page min-h-screen bg-background">
      <header className="topbar">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('Overview')} className="secondary-button">
            <ArrowLeft className="size-4" /> {t('nav.dashboard', language)}
          </button>
          <div>
            <p className="font-serif text-lg font-bold text-foreground">कृषि-मित्र</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p>
          </div>
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
        <FarmerSidebar activeTab="P2P Logistics" onNavigate={onNavigate} onLogout={onLogout} />

        <main className="dashboard-main mx-auto flex max-w-6xl flex-col gap-5">
          <button
            type="button"
            onClick={() => onNavigate('Overview')}
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-4 transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t('nav.backToDashboard', language)}
          </button>
          <section className="logistics-hero">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Truck className="size-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-white sm:text-3xl">{t('logistics.heroTitle', language)}</h1>
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                  {t('logistics.simulated', language)}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-white/80">
                {t('logistics.heroSubtitle', language)}
              </p>
            </div>
          </section>

          <section className="logistics-panel">
            <div className="mb-5 flex items-center gap-2">
              <Check className="size-5 text-primary" />
              <h2 className="text-xl font-bold">{t('logistics.poolMatch', language)}</h2>
              <span className="tag">
                3 {language === 'hi' ? 'किसान' : language === 'mr' ? 'शेतकरी' : 'farmers'}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="logistics-detail">
                <span>{t('logistics.crop', language)}</span>
                <strong>{language === 'hi' ? 'प्याज' : language === 'mr' ? 'कांदा' : 'Onion'}</strong>
              </div>
              <div className="logistics-detail">
                <span>{t('logistics.destination', language)}</span>
                <strong>FreshFields Agro Processor</strong>
              </div>
              <div className="logistics-detail">
                <span>{t('logistics.truckCapacity', language)}</span>
                <strong>100 {language === 'hi' ? 'कुंतल' : language === 'mr' ? 'क्विंटल' : 'quintals'}</strong>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-primary/15 bg-card p-5">
              <p className="eyebrow mb-4">{t('logistics.pickupRoute', language)}</p>
              <div className="flex flex-col">
                {stops.map((stop, index) => (
                  <div key={stop.name} className="relative flex items-center gap-4 py-2">
                    <div className={`route-marker ${stop.active ? 'active' : ''}`}>{index + 1}</div>
                    {index < stops.length - 1 && <span className="route-line" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground">{stop.name}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="size-3" />{stop.detail}
                      </p>
                    </div>
                    <span className="tag">{stop.qty}</span>
                  </div>
                ))}
                <div className="flex items-center gap-4 py-2">
                  <div className="route-marker destination"><ArrowRight className="size-4" /></div>
                  <div>
                    <p className="font-bold text-foreground">FreshFields Agro Processor, Sinnar</p>
                    <p className="text-sm text-muted-foreground">{t('logistics.finalDestination', language)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="logistics-cost">
                <span>{t('logistics.soloCost', language)}</span>
                <strong>₹4,200</strong>
                <small>{t('logistics.soloCostDesc', language)}</small>
              </div>
              <div className="logistics-cost pooled">
                <span>{t('logistics.pooledCost', language)}</span>
                <strong>₹1,400</strong>
                <small>{t('logistics.pooledCostDesc', language)}</small>
              </div>
            </div>

            <div className="savings-banner">
              <div>
                <p className="text-sm font-semibold text-white/80">{t('logistics.estimatedSavings', language)}</p>
                <strong>₹1,450</strong>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white/80">{t('logistics.totalLoad', language)}</p>
                <strong>95 {language === 'hi' ? 'कुंतल' : language === 'mr' ? 'क्विंटल' : 'quintals'}</strong>
              </div>
            </div>
          </section>

          <section className="logistics-panel">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Truck className="size-5" />
              </div>
              <h2 className="text-xl font-bold">{t('logistics.howItWorks', language)}</h2>
            </div>
            <div className="flex flex-col gap-3">
              {steps.map((step, index) => (
                <div key={index} className="logistics-step">
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={() => setJoined(!joined)} className="action-button flex-1 justify-center">
              <Users className="size-5" />
              {joined ? t('logistics.joinedPool', language) : t('logistics.joinPool', language)}
            </button>
            <button className="secondary-button h-14 justify-center px-6">
              {t('logistics.findOtherPools', language)}
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
