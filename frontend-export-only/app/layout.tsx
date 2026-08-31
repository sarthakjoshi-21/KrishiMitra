import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { DM_Sans, Noto_Serif_Devanagari } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/components/krishi-mitra/language-context'
import { TranslationLayer } from '@/components/krishi-mitra/translation-layer'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const notoSerif = Noto_Serif_Devanagari({ subsets: ['devanagari'], variable: '--font-serif' })

export const metadata: Metadata = {
  title: 'Krishi Mitra — हर चरण, हर समस्या, एक समाधान',
  description: "Connect your farm's complete life cycle from seed to soil.",
  generator: 'v0.app',
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f7faf9' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-background"><body className={`${dmSans.variable} ${notoSerif.variable} antialiased`}><LanguageProvider><TranslationLayer />{children}</LanguageProvider>{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
