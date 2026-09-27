'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Compass,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  Sprout,
  Truck,
  Users,
  Warehouse,
  Wrench,
  X,
} from 'lucide-react'
import { useLanguage } from './language-context'
import { t } from '@/lib/translations'
import { FarmerSidebar } from './farmer-sidebar'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  createServiceRequest,
  getNearbyProviders,
  registerServiceProvider,
} from '@/lib/actions/service-actions'
import { calculateHaversineDistance, formatDistance } from '@/lib/geo-utils'
import type { ServiceCategory, ServiceProvider } from '@/types/database'

type Props = { onLogout: () => void; onNavigate: (tab: string) => void }
type Category = 'All' | 'Seeds' | 'Fertilizer' | 'Machinery' | 'Labour' | 'Logistics' | 'Storage'

const categoryKeyMap: Record<Category, string> = {
  All: 'resources.cat.all',
  Seeds: 'resources.cat.seeds',
  Fertilizer: 'resources.cat.fertilizer',
  Machinery: 'resources.cat.machinery',
  Labour: 'resources.cat.labour',
  Logistics: 'resources.cat.logistics',
  Storage: 'resources.cat.storage',
}

interface NormalizedServiceItem {
  name: string
  price: string
  detail: string
  stock: string
}

function normalizeServices(provider: ServiceProvider): NormalizedServiceItem[] {
  if (Array.isArray(provider.services) && provider.services.length > 0) {
    return provider.services.map((item: any) => {
      if (Array.isArray(item)) {
        return {
          name: String(item[0] || ''),
          price: String(item[1] || ''),
          detail: String(item[2] || ''),
          stock: String(item[3] || 'In stock'),
        }
      }
      if (typeof item === 'object' && item !== null) {
        return {
          name: String(item.name || item.title || ''),
          price: String(item.price || item.cost || ''),
          detail: String(item.detail || item.unit || ''),
          stock: String(item.stock || (item.in_stock === false ? 'Out' : 'In stock')),
        }
      }
      return {
        name: String(item),
        price: provider.price_info || '',
        detail: '',
        stock: 'In stock',
      }
    })
  }
  if (provider.price_info) {
    return [
      {
        name: `${provider.category} Service`,
        price: provider.price_info,
        detail: 'Direct inquiries accepted',
        stock: 'In stock',
      },
    ]
  }
  return [
    {
      name: `${provider.category} Support`,
      price: 'Standard rates',
      detail: 'Available on request',
      stock: 'In stock',
    },
  ]
}

export default function ResourcesScreen({ onLogout, onNavigate }: Props) {
  const { language, setLanguage } = useLanguage()
  const [category, setCategory] = useState<Category>('All')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)

  // Geolocation state
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationName, setLocationName] = useState('Nashik (Default)')
  const [isLocating, setIsLocating] = useState(false)
  const [locationDenied, setLocationDenied] = useState(false)
  const [manualLocationInput, setManualLocationInput] = useState('')
  const [isResolvingManualLoc, setIsResolvingManualLoc] = useState(false)

  // Service Request Modal state
  const [requestModalProvider, setRequestModalProvider] = useState<ServiceProvider | null>(null)
  const [farmerName, setFarmerName] = useState('')
  const [farmerPhone, setFarmerPhone] = useState('')
  const [serviceNotes, setServiceNotes] = useState('')
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)

  // Provider Onboarding Modal state
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [newBizName, setNewBizName] = useState('')
  const [newOwnerName, setNewOwnerName] = useState('')
  const [newCategory, setNewCategory] = useState<Category>('Seeds')
  const [newPhone, setNewPhone] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newPincode, setNewPincode] = useState('')
  const [newLat, setNewLat] = useState<number | null>(null)
  const [newLng, setNewLng] = useState<number | null>(null)
  const [newServicesText, setNewServicesText] = useState('')
  const [isGettingBizLocation, setIsGettingBizLocation] = useState(false)
  const [isSubmittingBiz, setIsSubmittingBiz] = useState(false)
  const [bizFeedback, setBizFeedback] = useState('')

  // 1. Initial Geolocation Detection with 8-second safety timeout
  const requestCurrentLocation = useCallback(() => {
    setIsLocating(true)
    setLocationDenied(false)

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setIsLocating(false)
      setLocationDenied(true)
      setUserCoords({ lat: 19.9975, lng: 73.7898 })
      setLocationName('Nashik, Maharashtra')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
        }
        setUserCoords(coords)
        setLocationName('Live GPS Location')
        setIsLocating(false)
        setLocationDenied(false)
      },
      (error) => {
        console.warn('[Resources] Geolocation denied or timed out:', error.message)
        setIsLocating(false)
        setLocationDenied(true)
        // Fallback agricultural center
        setUserCoords({ lat: 19.9975, lng: 73.7898 })
        setLocationName('Nashik, Maharashtra')
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      }
    )
  }, [])

  useEffect(() => {
    requestCurrentLocation()
  }, [requestCurrentLocation])

  // 2. Fetch providers with RPC + Server Action fallback + 8s safety net
  const loadProviders = useCallback(async (lat: number, lon: number, activeCat: Category) => {
    setLoading(true)

    const catParam = activeCat === 'All' ? null : activeCat

    // Safety timeout: Ensure 8s maximum wait so rural slow networks never hang
    const abortTimeout = setTimeout(() => {
      setLoading(false)
    }, 8000)

    try {
      let liveList: ServiceProvider[] | null = null

      // Attempt Supabase RPC directly from browser client first
      try {
        const supabase = getSupabaseBrowserClient()
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
          'get_nearby_providers',
          {
            farmer_lat: lat,
            farmer_lon: lon,
            filter_category: catParam,
            max_distance_km: 150,
          }
        )

        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          liveList = rpcData as ServiceProvider[]
        }
      } catch (browserErr) {
        console.warn('[Resources] Browser Supabase RPC skipped, calling server action:', browserErr)
      }

      // If browser RPC didn't return data, call server action with built-in resilience
      if (!liveList || liveList.length === 0) {
        const result = await getNearbyProviders(lat, lon, catParam, 150)
        if (result.data) {
          liveList = result.data
        }
      }

      if (liveList) {
        // Rank providers primarily by is_verified DESC, distance_km ASC, and rating DESC
        const sorted = [...liveList].sort((a, b) => {
          if (a.is_verified !== b.is_verified) {
            return a.is_verified ? -1 : 1
          }
          const distA = a.distance_km ?? 9999
          const distB = b.distance_km ?? 9999
          if (distA !== distB) {
            return distA - distB
          }
          return (Number(b.rating) || 0) - (Number(a.rating) || 0)
        })
        setProviders(sorted)
      }
    } catch (err: any) {
      console.error('[Resources] Error loading providers:', err?.message)
    } finally {
      clearTimeout(abortTimeout)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userCoords) {
      loadProviders(userCoords.lat, userCoords.lng, category)
    }
  }, [userCoords, category, loadProviders])

  // 3. Manual Village or Pincode lookup via isolated server route (/api/places)
  const handleManualLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualLocationInput.trim()) return

    setIsResolvingManualLoc(true)
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: manualLocationInput.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.coordinates?.lat && data.coordinates?.lng) {
          const newCoords = {
            lat: Number(data.coordinates.lat),
            lng: Number(data.coordinates.lng),
          }
          setUserCoords(newCoords)
          setLocationName(data.name || manualLocationInput.trim())
          setLocationDenied(false)
          setNotice(
            language === 'hi'
              ? `स्थान सेट किया गया: ${data.name || manualLocationInput.trim()}`
              : language === 'mr'
                ? `स्थान सेट केले: ${data.name || manualLocationInput.trim()}`
                : `Location set to: ${data.name || manualLocationInput.trim()}`
          )
        }
      }
    } catch (err: any) {
      console.warn('[Resources] Manual location resolve error:', err?.message)
    } finally {
      setIsResolvingManualLoc(false)
    }
  }

  // 4. Fixed Provider Onboarding "Use My Location" GPS button
  const handleGetBusinessGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setBizFeedback('Geolocation is not supported by your browser')
      return
    }
    setIsGettingBizLocation(true)
    setBizFeedback('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewLat(Number(pos.coords.latitude.toFixed(6)))
        setNewLng(Number(pos.coords.longitude.toFixed(6)))
        setIsGettingBizLocation(false)
      },
      (err) => {
        console.warn('Business GPS capture failed:', err.message)
        setIsGettingBizLocation(false)
        setBizFeedback('Could not fetch GPS. You can enter coordinates or address below.')
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  }

  // 5. Submit Provider Onboarding Form
  const handleRegisterProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBizName.trim() || !newPhone.trim() || !newAddress.trim()) {
      setBizFeedback('Please fill in Business Name, Phone, and Address.')
      return
    }

    setIsSubmittingBiz(true)
    setBizFeedback('')

    // Fallback coordinates if GPS button wasn't pressed
    let finalLat = newLat
    let finalLng = newLng
    if (finalLat === null || finalLng === null) {
      finalLat = userCoords?.lat || 19.9975
      finalLng = userCoords?.lng || 73.7898
    }

    const servicesArray = newServicesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(',')
        return {
          name: parts[0]?.trim() || line,
          price: parts[1]?.trim() || 'On inquiry',
          detail: parts[2]?.trim() || 'Fixed location',
          stock: 'In stock',
        }
      })

    try {
      const result = await registerServiceProvider({
        provider_name: newBizName.trim(),
        owner_name: newOwnerName.trim() || newBizName.trim(),
        category: newCategory,
        phone: newPhone.trim(),
        address: newAddress.trim(),
        pincode: newPincode.trim() || undefined,
        latitude: finalLat,
        longitude: finalLng,
        services: servicesArray.length > 0 ? servicesArray : undefined,
        price_info: newServicesText.trim() || undefined,
      })

      if (result.error) {
        setBizFeedback(result.error)
      } else {
        setOnboardingOpen(false)
        setNotice(t('resources.pendingVerificationNotice', language))
        // Reset form
        setNewBizName('')
        setNewOwnerName('')
        setNewPhone('')
        setNewAddress('')
        setNewPincode('')
        setNewLat(null)
        setNewLng(null)
        setNewServicesText('')
        // Refresh provider list
        if (userCoords) {
          loadProviders(userCoords.lat, userCoords.lng, category)
        }
      }
    } catch (err: any) {
      setBizFeedback(err?.message || 'Registration failed')
    } finally {
      setIsSubmittingBiz(false)
    }
  }

  // 6. Submit Service Request Modal
  const handleSubmitServiceRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestModalProvider) return
    if (!farmerName.trim() || !farmerPhone.trim()) return

    setIsSubmittingRequest(true)
    try {
      const result = await createServiceRequest({
        provider_id: requestModalProvider.id,
        farmer_name: farmerName.trim(),
        farmer_phone: farmerPhone.trim(),
        service_category: requestModalProvider.category,
        notes: serviceNotes.trim(),
      })

      if (result.error) {
        setNotice(result.error)
      } else {
        const providerName = requestModalProvider.provider_name
        setRequestModalProvider(null)
        setFarmerName('')
        setFarmerPhone('')
        setServiceNotes('')
        setNotice(
          language === 'hi'
            ? `${providerName} को सेवा अनुरोध भेजा गया। स्थिति: लंबित`
            : language === 'mr'
              ? `${providerName} ला सेवा विनंती पाठवली. स्थिती: प्रलंबित`
              : `Service request sent to ${providerName}! Status: Pending response.`
        )
      }
    } catch (err: any) {
      setNotice(err?.message || 'Could not send service request')
    } finally {
      setIsSubmittingRequest(false)
    }
  }

  // Filtered providers based on search query
  const filtered = useMemo(() => {
    return providers.filter((provider) => {
      const searchBlob = `${provider.provider_name} ${provider.address} ${provider.category} ${provider.owner_name || ''} ${provider.pincode || ''}`.toLowerCase()
      return searchBlob.includes(query.toLowerCase())
    })
  }, [providers, query])

  return (
    <div className="resources-page min-h-screen bg-background">
      {/* Topbar */}
      <header className="topbar">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('Overview')} className="secondary-button">
            <ArrowLeft className="size-4" /> {t('schemes.topbar.dashboard', language)}
          </button>
          <div className="brand-mark">
            <Sprout className="size-5" />
          </div>
          <p className="font-serif text-lg font-bold text-foreground">कृषी-मित्र</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center" htmlFor="resources-language">
            <span className="sr-only">Choose website language</span>
            <select
              id="resources-language"
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
            {t('nav.logout', language)}
          </button>
        </div>
      </header>

      <div className="app-layout">
        <FarmerSidebar activeTab="Resources" onNavigate={onNavigate} onLogout={onLogout} />

        <main className="dashboard-main">
          {/* Back to Dashboard */}
          <button
            type="button"
            onClick={() => onNavigate('Overview')}
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-4 transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t('nav.backToDashboard', language)}
          </button>

          {/* Hero Section */}
          <div className="resources-hero justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Warehouse className="size-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  {t('resources.title', language)}
                </h1>
                <p className="mt-1 text-sm leading-6 text-white/75">
                  {t('resources.subtitle', language)}
                </p>
              </div>
            </div>

            {/* Provider Onboarding Trigger Button */}
            <button
              onClick={() => setOnboardingOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-primary shadow-sm hover:bg-white/90 transition"
            >
              <PlusCircle className="size-4" />
              {t('resources.registerProvider', language)}
            </button>
          </div>

          {/* Trust Banner */}
          <div className="resources-trust">
            <ShieldCheck className="size-4 shrink-0" />
            {t('resources.trust', language)}
          </div>

          {/* Location Bar & Geolocation Fallback */}
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-primary/15 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">
                {isLocating ? t('resources.locating', language) : locationName}
              </span>
              {userCoords && (
                <span className="text-xs text-muted-foreground">
                  ({userCoords.lat.toFixed(3)}, {userCoords.lng.toFixed(3)})
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={requestCurrentLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition disabled:opacity-60"
              >
                {isLocating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Compass className="size-3.5 text-primary" />
                )}
                {t('resources.useMyLocation', language)}
              </button>

              <form onSubmit={handleManualLocationSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualLocationInput}
                  onChange={(e) => setManualLocationInput(e.target.value)}
                  placeholder={t('resources.villageOrPincode', language)}
                  className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-48 sm:w-60"
                />
                <button
                  type="submit"
                  disabled={isResolvingManualLoc || !manualLocationInput.trim()}
                  className="h-8 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {isResolvingManualLoc ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    t('resources.manualLocation', language)
                  )}
                </button>
              </form>
            </div>
          </div>

          {locationDenied && (
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="size-4 shrink-0" />
              {t('resources.locationDenied', language)}
            </div>
          )}

          {/* Search Input */}
          <div className="input-with-icon mt-4 h-12">
            <Search className="size-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('resources.searchPlaceholder', language)}
              aria-label="Search providers"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="resources-filters mt-5">
            {(
              [
                'All',
                'Seeds',
                'Fertilizer',
                'Machinery',
                'Labour',
                'Logistics',
                'Storage',
              ] as Category[]
            ).map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={category === item ? 'resource-filter active' : 'resource-filter'}
              >
                {t(categoryKeyMap[item], language)}
              </button>
            ))}
          </div>

          {/* Toast / Notification */}
          {notice && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-primary">
              <div className="flex items-center gap-2">
                <Check className="size-4 shrink-0" />
                <span>{notice}</span>
              </div>
              <button
                onClick={() => setNotice('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Loading Skeleton State matching card dimensions */}
          {loading ? (
            <div className="resources-grid mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="provider-card animate-pulse flex flex-col justify-between"
                  style={{ minHeight: '280px' }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-2xl bg-secondary/70 shrink-0" />
                        <div className="flex flex-col gap-2">
                          <div className="h-5 w-40 rounded-md bg-secondary/70" />
                          <div className="h-3.5 w-24 rounded-md bg-secondary/50" />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="h-4 w-12 rounded-md bg-secondary/70" />
                        <div className="h-3 w-16 rounded-md bg-secondary/50" />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-4">
                      <div className="h-4 w-28 rounded-md bg-secondary/50" />
                      <div className="h-4 w-24 rounded-md bg-secondary/50" />
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="h-12 w-full rounded-xl bg-secondary/40" />
                      <div className="h-12 w-full rounded-xl bg-secondary/40" />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <div className="h-10 flex-1 rounded-xl bg-secondary/70" />
                    <div className="h-10 w-24 rounded-xl bg-secondary/50" />
                    <div className="h-10 w-24 rounded-xl bg-secondary/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Live Provider Cards Grid */
            <div className="resources-grid mt-6">
              {filtered.map((provider) => {
                const services = normalizeServices(provider)
                const distanceFormatted =
                  typeof provider.distance_km === 'number'
                    ? formatDistance(provider.distance_km)
                    : 'Nearby'

                return (
                  <article
                    key={provider.id || provider.provider_name}
                    className="provider-card flex flex-col justify-between"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="scheme-icon shrink-0">
                            {provider.category === 'Machinery' ? (
                              <Wrench className="size-6" />
                            ) : provider.category === 'Logistics' ? (
                              <Truck className="size-6" />
                            ) : provider.category === 'Labour' ? (
                              <Users className="size-6" />
                            ) : provider.category === 'Storage' ? (
                              <Warehouse className="size-6" />
                            ) : (
                              <Sprout className="size-6" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-lg font-bold text-foreground">
                                {provider.provider_name}
                              </h2>
                              {/* Krishi Mitra Verified Badge */}
                              {provider.is_verified && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-bold border border-emerald-300">
                                  <ShieldCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                                  {t('resources.verifiedBadge', language)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {provider.owner_name ? `${provider.owner_name} · ` : ''}
                              {t(categoryKeyMap[provider.category as Category] || provider.category, language)}
                            </p>
                          </div>
                        </div>

                        {/* Rating & Distance */}
                        <div className="text-right shrink-0">
                          <p className="font-bold text-foreground">★ {provider.rating || 4.5}</p>
                          <p className="text-xs font-semibold text-primary">{distanceFormatted}</p>
                        </div>
                      </div>

                      {/* Location & Response Info */}
                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="size-4" />
                          {provider.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock3 className="size-4" />
                          {t('resources.respondsIn', language)}
                          {provider.response_time || '2h'}
                        </span>
                      </div>

                      {/* Services & Stock Items */}
                      <div className="mt-4 flex flex-col gap-2">
                        {services.map((item, idx) => (
                          <div key={idx} className="provider-item">
                            <div>
                              <p className="font-semibold text-foreground">{item.name}</p>
                              {item.detail && (
                                <p className="text-xs text-muted-foreground">{item.detail}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-foreground">{item.price}</p>
                              <p
                                className={`text-xs font-semibold ${
                                  item.stock === 'Out' ? 'text-destructive' : 'text-primary'
                                }`}
                              >
                                {item.stock === 'Out'
                                  ? t('resources.outOfStock', language)
                                  : t('resources.inStock', language)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons: Request Service, Direct Phone Call, Google Maps Directions */}
                    <div className="mt-5 flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                      <button
                        onClick={() => setRequestModalProvider(provider)}
                        className="primary-button flex-1 min-w-[140px] text-center"
                      >
                        {t('resources.requestService', language)} <ArrowRight className="size-4" />
                      </button>

                      <a
                        href={`tel:${provider.phone}`}
                        className="secondary-button flex items-center justify-center gap-1.5 min-w-[70px]"
                      >
                        <Phone className="size-4 text-primary" />
                        <span>{t('resources.call', language)}</span>
                      </a>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${provider.latitude},${provider.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="secondary-button flex items-center justify-center gap-1.5 min-w-[95px]"
                      >
                        <Navigation className="size-4 text-primary" />
                        <span>{t('resources.directions', language)}</span>
                      </a>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* Informative Empty State */}
          {!loading && filtered.length === 0 && (
            <div className="mt-8 rounded-3xl border border-dashed border-primary/30 p-10 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <MapPin className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">
                {t('resources.emptyTitle', language)}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                {t('resources.emptySubtitle', language)}
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('All')
                    setQuery('')
                  }}
                  className="secondary-button"
                >
                  {t('resources.resetFilters', language)}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── Service Request Modal ─── */}
      {requestModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-primary/20 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {t('resources.requestModalTitle', language)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {requestModalProvider.provider_name} · {requestModalProvider.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRequestModalProvider(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitServiceRequest} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-foreground">
                  {t('resources.farmerName', language)} *
                </label>
                <input
                  required
                  type="text"
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">
                  {t('resources.farmerPhone', language)} *
                </label>
                <input
                  required
                  type="tel"
                  value={farmerPhone}
                  onChange={(e) => setFarmerPhone(e.target.value)}
                  placeholder="e.g. +91 98220 12345"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">
                  {t('resources.notes', language)}
                </label>
                <textarea
                  rows={3}
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder={t('resources.notesPlaceholder', language)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRequestModalProvider(null)}
                  className="secondary-button"
                >
                  {t('resources.cancel', language)}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest || !farmerName.trim() || !farmerPhone.trim()}
                  className="primary-button flex items-center gap-2"
                >
                  {isSubmittingRequest ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  {isSubmittingRequest
                    ? t('resources.submitting', language)
                    : t('resources.submitRequest', language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Fixed Provider Onboarding Modal ─── */}
      {onboardingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-primary/20 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {t('resources.providerFormTitle', language)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('resources.providerFormSubtitle', language)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOnboardingOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {bizFeedback && (
              <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
                {bizFeedback}
              </div>
            )}

            <form onSubmit={handleRegisterProviderSubmit} className="mt-4 flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground">
                    {t('resources.businessName', language)} *
                  </label>
                  <input
                    required
                    type="text"
                    value={newBizName}
                    onChange={(e) => setNewBizName(e.target.value)}
                    placeholder="e.g. Kisan Agro Center"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">
                    {t('resources.ownerName', language)}
                  </label>
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="e.g. Anand Shinde"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground">
                    {t('resources.cat.all', language)} Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Category)}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Seeds">Seeds</option>
                    <option value="Fertilizer">Fertilizer</option>
                    <option value="Machinery">Machinery</option>
                    <option value="Labour">Labour</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Storage">Storage</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">
                    {t('resources.farmerPhone', language)} *
                  </label>
                  <input
                    required
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. +91 98220 99999"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Fixed Coordinates with "Use My Location" button */}
              <div className="rounded-2xl border border-primary/15 bg-secondary/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-foreground">
                    {t('resources.gpsCoords', language)}
                  </label>
                  <button
                    type="button"
                    onClick={handleGetBusinessGps}
                    disabled={isGettingBizLocation}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
                  >
                    {isGettingBizLocation ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Compass className="size-3" />
                    )}
                    {t('resources.useMyLocation', language)}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.000001"
                    value={newLat !== null ? newLat : ''}
                    onChange={(e) => setNewLat(parseFloat(e.target.value) || null)}
                    placeholder="Latitude (e.g. 20.3268)"
                    className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="number"
                    step="0.000001"
                    value={newLng !== null ? newLng : ''}
                    onChange={(e) => setNewLng(parseFloat(e.target.value) || null)}
                    placeholder="Longitude (e.g. 74.2389)"
                    className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Address and Pincode as fallback */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">
                    {t('resources.address', language)} *
                  </label>
                  <input
                    required
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="e.g. Main Market, Chandwad, Nashik"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">
                    {t('resources.pincode', language)}
                  </label>
                  <input
                    type="text"
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value)}
                    placeholder="423101"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">
                  Services & Pricing (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newServicesText}
                  onChange={(e) => setNewServicesText(e.target.value)}
                  placeholder="e.g. Tractor rental, ₹450/hour&#10;Rotavator, ₹350/hour"
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="mt-2 flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setOnboardingOpen(false)}
                  className="secondary-button"
                >
                  {t('resources.cancel', language)}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBiz || !newBizName.trim() || !newPhone.trim()}
                  className="primary-button flex items-center gap-2"
                >
                  {isSubmittingBiz ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {isSubmittingBiz ? 'Registering...' : 'Register Center'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
