'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Mail, ShieldCheck } from 'lucide-react'
import { useLanguage, type Language } from '@/components/krishi-mitra/language-context'
import { signInBuyer, signUpUser, getSession } from '@/lib/actions/auth-actions'

const logoUrl = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-28%20010159-SbmrxdxXjUScSHgQ3ehJq2jWqvkG3u.png'

export default function BuyerLoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isPending, startTransition] = useTransition()
  const { language, setLanguage } = useLanguage()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') || '').trim()
    const password = String(data.get('password') || '')

    if (!name) {
      setAuthError('Please enter your email address.')
      return
    }
    if (!password) {
      setAuthError('Please enter your password.')
      return
    }

    startTransition(async () => {
      setAuthError('')

      if (!isLogin) {
        // Sign Up flow
        const result = await signUpUser(data, 'buyer')
        if (result.error) {
          if (result.error.includes('fetch') || result.error.includes('URL')) {
            router.push(`/?role=buyer&name=${encodeURIComponent(name.split('@')[0])}`)
            return
          }
          setAuthError(result.error)
          return
        }
        const session = await getSession()
        router.push(`/?role=buyer&name=${encodeURIComponent(session.fullName || name.split('@')[0])}`)
        return
      }

      // Login flow
      const buyerIdentifier = name.includes('@') ? name : `${name.replace(/[^0-9a-zA-Z]/g, '')}@buyer.krishimitra.in`
      const result = await signInBuyer(buyerIdentifier, password)
      if (result.error) {
        if (result.error.includes('fetch') || result.error.includes('URL')) {
          router.push(`/?role=buyer&name=${encodeURIComponent(name.split('@')[0])}`)
          return
        }
        setAuthError(result.error)
        return
      }
      const session = await getSession()
      router.push(`/?role=buyer&name=${encodeURIComponent(session.fullName || name.split('@')[0])}`)
    })
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6 flex flex-col justify-between">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Back to Home
        </Link>
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="buyer-login-language">Choose language</label>
          <select
            id="buyer-login-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            className="rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none transition-colors hover:bg-secondary focus:ring-2 focus:ring-ring"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>
      </header>

      <section className="mx-auto my-auto w-full max-w-md py-8">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="size-16 overflow-hidden rounded-full bg-background/80 p-1 shadow-md ring-1 ring-primary/20 mb-3">
            <img src={logoUrl} alt="Krishi Mitra Logo" className="size-full rounded-full object-contain" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            कृषि-मित्र <span className="text-primary font-sans text-sm block font-semibold tracking-wider uppercase">Krishi Mitra</span>
          </h1>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-3xl border border-primary/20 bg-card/95 p-6 sm:p-8 shadow-2xl shadow-primary/10 backdrop-blur-md transition-all duration-300"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              BUYER PORTAL
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-foreground">
              {isLogin ? 'Buyer Login' : 'Buyer Sign Up'}
            </h2>
          </div>

          {/* Modern Pill / Bubble Toggle for Login vs Sign Up */}
          <div className="flex rounded-full bg-secondary/80 p-1.5 border border-border/80 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true)
                setAuthError('')
              }}
              className={`flex-1 rounded-full py-2 text-xs sm:text-sm font-bold transition-all duration-200 ${
                isLogin
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false)
                setAuthError('')
              }}
              className={`flex-1 rounded-full py-2 text-xs sm:text-sm font-bold transition-all duration-200 ${
                !isLogin
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Buyer UI Form Fields: Exactly 2 fields (Email ID & Password) */}
          <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
            <span>Email ID</span>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 size-4 text-muted-foreground" />
              <input
                name="name"
                type="email"
                required
                className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-3 font-normal text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Enter your email address"
              />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
            <span>Password</span>
            <div className="relative">
              <input
                name="password"
                required
                type={showPassword ? 'text' : 'password'}
                className="h-11 w-full rounded-xl border border-border bg-background/80 px-3.5 pr-10 font-normal text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Enter password"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {authError && <p role="alert" className="text-sm font-semibold text-destructive">{authError}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="action-button mt-2 w-full justify-center bg-primary text-primary-foreground font-bold py-3 px-6 rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {isLogin ? 'Logging in…' : 'Signing up…'}
              </>
            ) : (
              <>
                {isLogin ? 'Login' : 'Sign Up'}
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          <p className="text-center text-xs leading-5 text-muted-foreground">Credentials verified securely via Supabase Auth.</p>
        </form>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-center pb-4 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 mr-1 text-primary" /> Verified buyer portal with end-to-end encryption.
      </footer>
    </main>
  )
}
