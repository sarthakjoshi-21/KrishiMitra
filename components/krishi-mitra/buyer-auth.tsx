'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Languages,
  Loader2,
  Lock,
  Mail,
  Package,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useLanguage, type Language } from './language-context'
import { t } from '@/lib/translations'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const logoUrl =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202026-08-28%20010159-SbmrxdxXjUScSHgQ3ehJq2jWqvkG3u.png'

interface BuyerAuthProps {
  onBack: () => void
  onSuccess: (buyerIdentifier: string) => void
}

export default function BuyerAuth({ onBack, onSuccess }: BuyerAuthProps) {
  const { language, setLanguage } = useLanguage()

  const [isLogin, setIsLogin] = useState<boolean>(true)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [authError, setAuthError] = useState<string>('')
  const [successMsg, setSuccessMsg] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setSuccessMsg('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setAuthError(
        language === 'hi'
          ? 'कृपया अपना ईमेल पता दर्ज करें।'
          : language === 'mr'
          ? 'कृपया तुमचा ईमेल पत्ता प्रविष्ट करा.'
          : 'Please enter your email address.'
      )
      return
    }

    if (!password || password.length < 6) {
      setAuthError(
        language === 'hi'
          ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
          : language === 'mr'
          ? 'पासवर्ड किमान ६ वर्णांचा असावा.'
          : 'Password must be at least 6 characters.'
      )
      return
    }

    setIsLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      if (isLogin) {
        // Buyer Login with Email and Password
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        })

        if (error) {
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            setAuthError(
              language === 'hi'
                ? 'अमान्य ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।'
                : language === 'mr'
                ? 'अवैध ईमेल किंवा पासवर्ड. कृपया पुन्हा प्रयत्न करा.'
                : 'Invalid email or password. Please verify and try again.'
            )
          } else {
            setAuthError(error.message)
          }
          setIsLoading(false)
          return
        }

        if (data.user) {
          const resolvedName =
            data.user.user_metadata?.full_name ||
            data.user.email?.split('@')[0] ||
            'Buyer'
          onSuccess(resolvedName)
        }
      } else {
        // Buyer Sign Up with standard email and password
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              role: 'buyer',
            },
          },
        })

        if (error) {
          if (
            error.message.toLowerCase().includes('already registered') ||
            error.message.toLowerCase().includes('already exists')
          ) {
            setAuthError(
              language === 'hi'
                ? 'यह ईमेल पहले से पंजीकृत है। कृपया लॉग इन करें।'
                : language === 'mr'
                ? 'हा ईमेल आधीच नोंदणीकृत आहे. कृपया लॉगिन करा.'
                : 'This email is already registered. Please log in instead.'
            )
          } else {
            setAuthError(error.message)
          }
          setIsLoading(false)
          return
        }

        if (data.session && data.user) {
          const resolvedName = cleanEmail.split('@')[0] || 'Buyer'
          onSuccess(resolvedName)
        } else {
          setSuccessMsg(
            language === 'hi'
              ? 'खरीदार खाता सफलतापूर्वक बनाया गया! अब आप लॉग इन कर सकते हैं।'
              : language === 'mr'
              ? 'खरेदीदार खाते यशस्वीरित्या तयार केले! आता तुम्ही लॉगिन करू शकता.'
              : 'Buyer account created successfully! You can now log in.'
          )
          setIsLogin(true)
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-6 flex flex-col justify-between">
      {/* Top Header */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <button
          type="button"
          id="buyer-auth-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" /> {t('auth.backToHome', language, 'Back to Home')}
        </button>

        <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
          <Languages className="size-4 text-primary" />
          <label className="sr-only" htmlFor="buyer-auth-language">
            Choose language
          </label>
          <select
            id="buyer-auth-language"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
            className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>
      </header>

      {/* Main Authentication Card */}
      <section className="mx-auto my-auto w-full max-w-md py-6">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="size-16 overflow-hidden rounded-full bg-background/80 p-1 shadow-md ring-1 ring-primary/20 mb-3">
            <Image
              src={logoUrl}
              alt="Krishi Mitra Logo"
              width={64}
              height={64}
              priority
              className="size-full rounded-full object-contain"
            />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            कृषि-मित्र{' '}
            <span className="text-primary font-sans text-xs block font-semibold tracking-wider uppercase mt-0.5">
              Krishi Mitra
            </span>
          </h1>
        </div>

        <form
          noValidate
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 rounded-3xl border border-primary/20 bg-card/95 p-6 sm:p-8 shadow-2xl shadow-primary/10 backdrop-blur-md transition-all"
        >
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2">
              <Package className="size-3.5" />
              <span>{t('auth.buyerPortal', language, 'Buyer Marketplace')}</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-foreground">
              {isLogin
                ? t('auth.buyerLogin', language, 'Buyer Login')
                : t('auth.buyerSignUp', language, 'Buyer Registration')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {isLogin
                ? language === 'hi'
                  ? 'अपने ईमेल और पासवर्ड से लॉग इन करें।'
                  : language === 'mr'
                  ? 'तुमच्या ईमेल आणि पासवर्डने लॉगिन करा.'
                  : 'Log in with your verified email and password.'
                : language === 'hi'
                ? 'नया खरीदार खाता बनाएं और किसानों से सीधे जुड़ें।'
                : language === 'mr'
                ? 'नवीन खरेदीदार खाते तयार करा आणि शेतकऱ्यांशी थेट जोडा.'
                : 'Create a buyer account to bid on verified crops and arrange transport.'}
            </p>
          </div>

          {/* Toggle for Login vs Sign Up */}
          <div className="flex rounded-full bg-secondary/80 p-1 border border-border/80 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true)
                setAuthError('')
                setSuccessMsg('')
              }}
              className={`flex-1 rounded-full py-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                isLogin
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('auth.login', language, 'Login')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false)
                setAuthError('')
                setSuccessMsg('')
              }}
              className={`flex-1 rounded-full py-2 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                !isLogin
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('auth.signUp', language, 'Sign Up')}
            </button>
          </div>

          {/* Alert messages */}
          {authError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-medium"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{authError}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 font-medium"
            >
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          {/* Input: Email ID */}
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground">
            <span>{t('auth.email', language, 'Email ID')}</span>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <input
                id="buyer-email-input"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-3 font-normal text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder={t(
                  'auth.buyerEmailPlaceholder',
                  language,
                  'Enter business email (e.g. buyer@agro.com)'
                )}
              />
            </div>
          </label>

          {/* Input: Password */}
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-foreground">
            <span>{t('auth.password', language, 'Password')}</span>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <input
                id="buyer-password-input"
                name="password"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-10 font-normal text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder={t('auth.passwordPlaceholder', language, 'Enter password (min 6 characters)')}
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>

          {/* Submit button */}
          <button
            type="submit"
            id="buyer-submit-btn"
            disabled={isLoading}
            className="action-button mt-1 w-full justify-center bg-primary text-primary-foreground font-bold py-3 px-6 rounded-2xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                {isLogin
                  ? t('auth.loggingIn', language, 'Logging in…')
                  : t('auth.signingUp', language, 'Signing up…')}
              </>
            ) : (
              <>
                <span>
                  {isLogin
                    ? language === 'hi'
                      ? 'खरीदार लॉगिन'
                      : language === 'mr'
                      ? 'खरेदीदार लॉगिन'
                      : 'Log In as Buyer'
                    : language === 'hi'
                    ? 'खरीदार खाता बनाएं'
                    : language === 'mr'
                    ? 'खरेदीदार खाते तयार करा'
                    : 'Create Buyer Account'}
                </span>
                <ArrowRight className="size-4 ml-1" />
              </>
            )}
          </button>

          <p className="text-center text-xs leading-5 text-muted-foreground">
            {t('auth.credentialsSecure', language, 'Credentials verified securely via Supabase Auth.')}
          </p>
        </form>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex w-full max-w-6xl items-center justify-center pb-4 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 mr-1 text-primary" />{' '}
        {t('auth.buyerProtected', language, 'Verified buyer portal with end-to-end encryption.')}
      </footer>
    </main>
  )
}
