'use client'

import Link from 'next/link'
import { ArrowRight, Droplets, Leaf, Package, ShieldCheck, Sprout, TrendingUp, Truck } from 'lucide-react'
import { useLanguage, type Language } from './language-context'

const logoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-28%20010159-SbmrxdxXjUScSHgQ3ehJq2jWqvkG3u.png'

type Role = 'farmer' | 'buyer'
type Props = { onEnter?: (role: Role, fullName: string) => void }

const copy: Record<Language, Record<string, string>> = {
  en: {
    network: "India's connected farm network",
    title: 'Every stage, every problem —',
    solution: 'one solution.',
    body: "Connect your farm's complete life cycle from seed to soil. Sell better, plan smarter, and grow with a trusted local network.",
    farmer: 'Farmer',
    buyer: 'Buyer',
    welcome: 'Welcome to Krishi Mitra',
    details: 'Your details stay on this device',
    farmerLogin: 'Farmer Portal',
    buyerLogin: 'Buyer Portal',
  },
  hi: {
    network: 'भारत का जुड़ा हुआ कृषि नेटवर्क',
    title: 'हर चरण, हर समस्या —',
    solution: 'एक समाधान।',
    body: 'बीज से मिट्टी तक अपने खेत का पूरा जीवनचक्र जोड़ें। बेहतर बेचें, समझदारी से योजना बनाएं और भरोसेमंद स्थानीय नेटवर्क के साथ बढ़ें।',
    farmer: 'किसान',
    buyer: 'खरीदार',
    welcome: 'कृषि-मित्र में आपका स्वागत है',
    details: 'आपकी जानकारी इसी डिवाइस पर रहती है',
    farmerLogin: 'किसान पोर्टल',
    buyerLogin: 'खरीदार पोर्टल',
  },
  mr: {
    network: 'भारताचे जोडलेले शेती नेटवर्क',
    title: 'प्रत्येक टप्पा, प्रत्येक समस्या —',
    solution: 'एकच समाधान.',
    body: 'बियाण्यापासून मातीपर्यंत तुमच्या शेतीचे संपूर्ण जीवनचक्र जोडा. चांगले विक्री करा, योग्य नियोजन करा आणि विश्वासू स्थानिक नेटवर्कसोबत वाढा.',
    farmer: 'शेतकरी',
    buyer: 'खरेदीदार',
    welcome: 'कृषी-मित्रमध्ये स्वागत आहे',
    details: 'तुमची माहिती या डिव्हाइसवरच राहते',
    farmerLogin: 'शेतकरी पोर्टल',
    buyerLogin: 'खरेदीदार पोर्टल',
  },
}

export default function LoginScreen({ onEnter }: Props) {
  const { language, setLanguage } = useLanguage()
  const t = copy[language]

  return (
    <main className="min-h-screen bg-background px-5 py-1">
      <header className="mx-auto flex max-w-6xl items-center justify-end">
        <label className="sr-only" htmlFor="login-language">Choose language</label>
        <select
          id="login-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value as Language)}
          className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none transition-colors hover:bg-secondary focus:ring-2 focus:ring-ring"
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="mr">मराठी</option>
        </select>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 pb-3 pt-3 text-center lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10 lg:pt-5 lg:text-left">
        <div className="max-w-xl lg:pl-6">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">
            <span className="size-2 rounded-full bg-primary" /> {t.network}
          </p>
          <h1 className="text-balance font-serif text-5xl font-bold leading-[1.06] tracking-tight text-foreground sm:text-6xl">
            {t.title} <span className="text-primary">{t.solution}</span>
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-base leading-7 text-muted-foreground">{t.body}</p>
          <div className="mt-6 w-full max-w-md">
            <p className="mb-3 text-center text-sm font-bold text-foreground">Login As :</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/farmer-login"
                className="action-button flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                <Sprout className="size-5" /> {t.farmer} <ArrowRight className="ml-auto size-4" />
              </Link>
              <Link
                href="/buyer-login"
                className="action-button outline flex items-center justify-center gap-2 hover:shadow-lg transition-all"
              >
                <Package className="size-5" /> {t.buyer} <ArrowRight className="ml-auto size-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md justify-self-center text-left lg:max-w-lg lg:justify-self-end">
          <div className="flex flex-col items-center gap-2 py-0 text-center">
            <div className="aspect-square w-full max-w-[29rem] overflow-hidden rounded-full bg-background/70 p-2 shadow-[0_18px_28px_rgba(19,93,43,0.14)] ring-1 ring-primary/15">
              <img src={logoUrl} alt="कृषि-मित्र logo" className="size-full rounded-full object-contain mix-blend-multiply dark:mix-blend-normal" />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <ShieldCheck className="size-4" /> {t.details}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl rounded-[2rem] border border-primary/10 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6" aria-labelledby="lifecycle-title">
        <div className="mb-3 flex items-center justify-between gap-4">
          <p id="lifecycle-title" className="eyebrow text-center">The agricultural lifecycle, orchestrated</p>
          <span className="hidden h-px flex-1 bg-primary/10 sm:block" />
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-0">
          {[
            { icon: Sprout, title: 'Pre-Planting', helper: 'What should I grow?' },
            { icon: Leaf, title: 'In-Season', helper: 'How do I manage my crop?' },
            { icon: Droplets, title: 'Resources', helper: 'What do I need?' },
            { icon: TrendingUp, title: 'Post-Harvest', helper: 'How do I maximise earnings?' },
            { icon: Truck, title: 'Market', helper: 'Net realisation & logistics' },
          ].map(({ icon: Icon, title, helper }, index, stages) => (
            <div key={title} className="flex flex-1 items-center md:flex-row">
              <div className="flex min-h-24 flex-1 flex-col items-center justify-center gap-2 rounded-2xl bg-secondary/55 px-3 py-3 text-center transition hover:-translate-y-0.5 hover:bg-secondary">
                <div className="flex size-9 items-center justify-center rounded-xl bg-card text-primary shadow-sm ring-1 ring-primary/10"><Icon className="size-5" /></div>
                <div><p className="text-sm font-bold text-foreground">{title}</p><p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{helper}</p></div>
              </div>
              {index < stages.length - 1 && <div aria-hidden="true" className="flex h-8 w-10 shrink-0 items-center justify-center md:h-auto md:w-12"><ArrowRight className="lifecycle-arrow size-7 stroke-[3] text-primary drop-shadow-[0_2px_4px_rgba(20,140,100,0.3)]" /></div>}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
