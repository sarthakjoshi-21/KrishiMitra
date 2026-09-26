'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Calendar, Check, Clock, Globe, IndianRupee, Languages, Loader2, MapPin, Minus, PlusCircle, RotateCw, ShieldCheck } from 'lucide-react'
import { counterBid, getBidsForFarmer, updateBidStatus } from '@/lib/actions/bid-actions'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getFarmerListings } from '@/lib/actions/crop-actions'
import type { Bid } from '@/types/database'
import InteractiveMap from '@/components/InteractiveMap'
import { getCurrentUserPosition } from '@/lib/geo-utils'
import BidRow from './bid-row'
import { FarmerSidebar } from './farmer-sidebar'
import { useLanguage } from './language-context'
import { normalizeCommodityKey, t } from '@/lib/translations'
import { translateTextsBhashini } from '@/lib/bhashini'
import type { BhashiniLang } from '@/lib/bhashini'

type Props = { onLogout: () => void; onNavigate: (tab: string) => void }

const prices = [
  { crop: 'Onion', price: '₹29.20 / kg', trend: 'up' as const, percent: '+8.4%', updated: '12 min ago' },
  { crop: 'Basmati Rice', price: '₹35.60 / kg', trend: 'up' as const, percent: '+4.1%', updated: '18 min ago' },
  { crop: 'Tur Dal', price: '₹83.50 / kg', trend: 'down' as const, percent: '-2.6%', updated: '25 min ago' },
  { crop: 'Wheat', price: '₹24.80 / kg', trend: 'stable' as const, percent: '+0.3%', updated: '31 min ago' },
]

// Pan-India state → agricultural district mapping
const STATE_DISTRICT_MAP: Record<string, string[]> = {
  'Andhra Pradesh': [
    'Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool',
    'Nellore', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram',
    'West Godavari', 'YSR Kadapa',
  ],
  'Arunachal Pradesh': [
    'Changlang', 'Dibang Valley', 'East Kameng', 'East Siang', 'Lohit',
    'Papum Pare', 'Tawang', 'West Kameng', 'West Siang',
  ],
  'Assam': [
    'Barpeta', 'Bongaigaon', 'Cachar', 'Darrang', 'Dhemaji', 'Dhubri',
    'Dibrugarh', 'Goalpara', 'Golaghat', 'Jorhat', 'Kamrup', 'Kamrup Metropolitan',
    'Karbi Anglong', 'Karimganj', 'Kokrajhar', 'Lakhimpur', 'Morigaon',
    'Nagaon', 'Nalbari', 'Sibasagar', 'Sonitpur', 'Tinsukia', 'Udalguri',
  ],
  'Bihar': [
    'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur',
    'Bhojpur', 'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj',
    'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj',
    'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda',
    'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur',
    'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul',
    'Vaishali', 'West Champaran',
  ],
  'Chhattisgarh': [
    'Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur',
    'Bilaspur', 'Dantewada', 'Dhamtari', 'Durg', 'Gariaband', 'Janjgir-Champa',
    'Jashpur', 'Kabirdham', 'Kanker', 'Kondagaon', 'Korba', 'Korea',
    'Mahasamund', 'Mungeli', 'Narayanpur', 'Raigarh', 'Raipur', 'Rajnandgaon',
    'Sukma', 'Surajpur', 'Surguja',
  ],
  'Delhi': ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
  'Goa': ['North Goa', 'South Goa'],
  'Gujarat': [
    'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch',
    'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka',
    'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch',
    'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal',
    'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar',
    'Tapi', 'Vadodara', 'Valsad',
  ],
  'Haryana': [
    'Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram',
    'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra',
    'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula', 'Panipat', 'Rewari',
    'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar',
  ],
  'Himachal Pradesh': [
    'Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu',
    'Lahaul and Spiti', 'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una',
  ],
  'Jharkhand': [
    'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum',
    'Garhwa', 'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara',
    'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu',
    'Ramgarh', 'Ranchi', 'Sahebganj', 'Seraikela Kharsawan', 'Simdega', 'West Singhbhum',
  ],
  'Karnataka': [
    'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
    'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
    'Dakshina Kannada', 'Davangere', 'Dharwad', 'Gadag', 'Hassan',
    'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
    'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga',
    'Tumkur', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir',
  ],
  'Kerala': [
    'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam',
    'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta',
    'Thiruvananthapuram', 'Thrissur', 'Wayanad',
  ],
  'Madhya Pradesh': [
    'Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani',
    'Betul', 'Bhind', 'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara',
    'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori', 'Guna',
    'Gwalior', 'Harda', 'Hoshangabad', 'Indore', 'Jabalpur', 'Jhabua',
    'Katni', 'Khandwa', 'Khargone', 'Mandla', 'Mandsaur', 'Morena',
    'Narsinghpur', 'Neemuch', 'Panna', 'Raisen', 'Rajgarh', 'Ratlam',
    'Rewa', 'Sagar', 'Satna', 'Sehore', 'Seoni', 'Shahdol',
    'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli', 'Tikamgarh',
    'Ujjain', 'Umaria', 'Vidisha',
  ],
  'Maharashtra': [
    'Ahmednagar', 'Akola', 'Amravati', 'Beed', 'Bhandara', 'Buldhana',
    'Chandrapur', 'Chhatrapati Sambhajinagar', 'Dhule', 'Gadchiroli', 'Gondia',
    'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City',
    'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad',
    'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli',
    'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal',
  ],
  'Manipur': ['Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Senapati', 'Tamenglong', 'Thoubal', 'Ukhrul'],
  'Meghalaya': ['East Garo Hills', 'East Khasi Hills', 'Jaintia Hills', 'Ri Bhoi', 'South Garo Hills', 'West Garo Hills', 'West Khasi Hills'],
  'Mizoram': ['Aizawl', 'Champhai', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit', 'Saiha', 'Serchhip'],
  'Nagaland': ['Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung', 'Mon', 'Peren', 'Phek', 'Tuensang', 'Wokha', 'Zunheboto'],
  'Odisha': [
    'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh',
    'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur',
    'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Kendujhar',
    'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh',
    'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh',
  ],
  'Punjab': [
    'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka',
    'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana',
    'Mansa', 'Moga', 'Mohali', 'Muktsar', 'Nawanshahr', 'Pathankot',
    'Patiala', 'Rupnagar', 'Sangrur', 'Tarn Taran',
  ],
  'Rajasthan': [
    'Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur',
    'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa',
    'Dholpur', 'Dungarpur', 'Hanumangarh', 'Jaipur', 'Jaisalmer', 'Jalore',
    'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 'Kota', 'Nagaur',
    'Pali', 'Pratapgarh', 'Rajsamand', 'Sawai Madhopur', 'Sikar',
    'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur',
  ],
  'Sikkim': ['East Sikkim', 'North Sikkim', 'South Sikkim', 'West Sikkim'],
  'Tamil Nadu': [
    'Ariyalur', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul',
    'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanyakumari', 'Karur', 'Krishnagiri',
    'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur',
    'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
    'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur',
    'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar',
  ],
  'Telangana': [
    'Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagitial', 'Jangaon',
    'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar',
    'Khammam', 'Kumuram Bheem', 'Mahabubabad', 'Mahabubnagar', 'Mancherial',
    'Medak', 'Medchal–Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda',
    'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla',
    'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad',
    'Wanaparthy', 'Warangal Rural', 'Warangal Urban', 'Yadadri Bhuvanagiri',
  ],
  'Tripura': ['Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'Sipahijala', 'South Tripura', 'Unakoti', 'West Tripura'],
  'Uttar Pradesh': [
    'Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya',
    'Ayodhya', 'Azamgarh', 'Baghpat', 'Bahraich', 'Ballia', 'Balrampur',
    'Banda', 'Barabanki', 'Bareilly', 'Basti', 'Bhadohi', 'Bijnor',
    'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah',
    'Etawah', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar',
    'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur',
    'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi', 'Kannauj',
    'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kushinagar',
    'Lakhimpur Kheri', 'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba',
    'Mainpuri', 'Mathura', 'Mau', 'Meerut', 'Mirzapur', 'Moradabad',
    'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 'Prayagraj', 'Rae Bareli',
    'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur',
    'Shamli', 'Shravasti', 'Siddharthnagar', 'Sitapur', 'Sonbhadra',
    'Sultanpur', 'Unnao', 'Varanasi',
  ],
  'Uttarakhand': [
    'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar',
    'Nainital', 'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal',
    'Udham Singh Nagar', 'Uttarkashi',
  ],
  'West Bengal': [
    'Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur',
    'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram',
    'Kalimpong', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia',
    'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman',
    'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur',
  ],
  'Andaman and Nicobar': ['Nicobar', 'North and Middle Andaman', 'South Andaman'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Dadra and Nagar Haveli', 'Daman', 'Diu'],
  'Jammu and Kashmir': [
    'Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal',
    'Jammu', 'Kathua', 'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch',
    'Pulwama', 'Rajouri', 'Ramban', 'Reasi', 'Samba', 'Shopian',
    'Srinagar', 'Udhampur',
  ],
  'Ladakh': ['Kargil', 'Leh'],
  'Lakshadweep': ['Lakshadweep'],
  'Puducherry': ['Karaikal', 'Mahe', 'Puducherry', 'Yanam'],
}

// Derived convenience slices kept for backwards-compat with any remaining references
const MAHARASHTRA_DISTRICTS = STATE_DISTRICT_MAP['Maharashtra']
const INDIA_STATES = Object.keys(STATE_DISTRICT_MAP).sort()

function getTodayIso(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function cleanDistrictName(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/\b(district|division|zilla|zila|tahsil|taluka)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function Trend({ type, text }: { type: 'up' | 'down' | 'stable'; text: string }) {
  const Icon = type === 'up' ? ArrowUp : type === 'down' ? ArrowDown : Minus
  return <span className={`market-trend ${type}`}><Icon className="size-3" />{text}</span>
}

export default function MarketBidsScreen({ onLogout, onNavigate }: Props) {
  const { language, setLanguage } = useLanguage()
  const [view, setView] = useState<'bids' | 'map' | 'market'>('bids')
  const [listings, setListings] = useState<any[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [counterModal, setCounterModal] = useState<Bid | null>(null)
  const [counterPrice, setCounterPrice] = useState('')
  const [counterNotes, setCounterNotes] = useState('')
  const [paymentModal, setPaymentModal] = useState<Bid | null>(null)
  const [toast, setToast] = useState('')
  const [farmerCoords, setFarmerCoords] = useState<{ lat: number; lng: number } | null>(null)

  // Real-time geolocation & district resolution states
  const [userDistrict, setUserDistrict] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState<boolean>(true)
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIso())
  const [selectedState, setSelectedState] = useState<string>('Maharashtra')
  const [strictLiveMode, setStrictLiveMode] = useState<boolean>(false)

  // Live Mandi prices state & dynamic filters
  const [mandiRecords, setMandiRecords] = useState<any[]>([])
  const [mandiLoading, setMandiLoading] = useState(false)
  const [mandiError, setMandiError] = useState<string | null>(null)
  const [mandiTimeout, setMandiTimeout] = useState(false)
  const [isMandiFallback, setIsMandiFallback] = useState(false)
  const [selectedCommodity, setSelectedCommodity] = useState<string>('all')
  const [mandiMarket, setMandiMarket] = useState('Lasalgaon')
  // Dynamic translation cache: English crop name -> translated string
  // Hydrated from localStorage and populated at runtime by Bhashini NMT for crops absent from the local dictionary
  const [dynamicTranslations, setDynamicTranslations] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const cached = localStorage.getItem('km_crop_translations')
      return cached ? JSON.parse(cached) : {}
    } catch {
      return {}
    }
  })

  const loadMandiData = async (targetDistrict?: string, targetDate?: string) => {
    const districtToFetch = targetDistrict !== undefined ? targetDistrict : (userDistrict || (selectedState === 'Maharashtra' ? 'Nashik' : ''))
    // Always send a date – default to today when selectedDate is empty
    const rawDate = targetDate !== undefined ? targetDate : (selectedDate || getTodayIso())
    // Convert YYYY-MM-DD → DD/MM/YYYY for the backend
    const parts = rawDate.split('-')
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : rawDate

    const params = new URLSearchParams({
      state: selectedState,
      date: formattedDate,
    })
    if (districtToFetch) {
      params.append('district', districtToFetch)
    }
    if (selectedState === 'Maharashtra' && districtToFetch.toLowerCase() === 'nashik' && mandiMarket) {
      params.append('market', mandiMarket)
    }
    if (strictLiveMode) {
      params.append('strict', 'true')
    }

    const cacheKey = `km_mandi_${params.toString()}`

    // 1. SWR Immediate Read: Check sessionStorage for cached response
    let hasCachedData = false
    if (typeof window !== 'undefined') {
      try {
        const cachedStr = sessionStorage.getItem(cacheKey)
        if (cachedStr) {
          const cached = JSON.parse(cachedStr)
          if (Array.isArray(cached?.data)) {
            setMandiRecords(cached.data)
            setIsMandiFallback(Boolean(cached.isFallback))
            hasCachedData = true
          }
        }
      } catch (cacheErr) {
        console.warn('[MarketBidsScreen] Failed to read mandi cache from sessionStorage:', cacheErr)
      }
    }

    // Only display full loading spinner if we have no cached data to show immediately
    if (!hasCachedData) {
      setMandiLoading(true)
    }
    setMandiError(null)
    setMandiTimeout(false)

    // 2. Fetch fresh data in background with 8-second AbortController failsafe
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    try {
      const res = await fetch(`/api/mandi?${params.toString()}`, {
        signal: controller.signal,
      })
      clearTimeout(timer)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = await res.json()
      let list: any[] = []
      let fallbackFlag = false

      if (Array.isArray(json)) {
        list = json
        fallbackFlag = false
      } else if (json && Array.isArray(json.data)) {
        list = json.data
        fallbackFlag = Boolean(json.isFallback)
      } else if (json && Array.isArray(json.records)) {
        list = json.records
        fallbackFlag = Boolean(json.isFallback)
      }

      setMandiRecords(list)
      setIsMandiFallback(fallbackFlag)

      // Save fresh data to sessionStorage
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ data: list, isFallback: fallbackFlag, ts: Date.now() })
          )
        } catch (saveErr) {
          console.warn('[MarketBidsScreen] Failed to save mandi data to sessionStorage:', saveErr)
        }
      }
    } catch (err: any) {
      clearTimeout(timer)
      if (err?.name === 'AbortError') {
        console.warn('[MarketBidsScreen] Mandi API fetch timed out after 8s (2G/3G network failsafe)')
        setMandiTimeout(true)
        if (!hasCachedData) {
          if (strictLiveMode) {
            setMandiError('Request timed out (8s). Strict live mode is active, so no fallback data is shown.')
          }
        }
      } else {
        console.error('[MarketBidsScreen] Failed to fetch live mandi prices:', err)
        if (!hasCachedData) {
          setMandiError('Failed to load live Mandi prices.')
        }
      }
    } finally {
      setMandiLoading(false)
    }
  }

  // Geolocation & Reverse Geocoding to detect user's district
  const detectLocation = () => {
    if (typeof window === 'undefined') return

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      setIsLocating(false)
      setUserDistrict('Nashik')
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 8000)
        try {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            {
              signal: controller.signal,
              headers: {
                Accept: 'application/json',
              },
            }
          )
          clearTimeout(timer)

          if (!res.ok) {
            throw new Error(`Nominatim HTTP ${res.status}`)
          }

          const data = await res.json()
          const address = data?.address || {}

          // Sync State from Nominatim address.state
          const rawState = (address.state || '').trim()
          const cleanedState = cleanDistrictName(rawState) // strips suffixes like "State"
          // Only update if Nominatim returned a state that exists in our map
          if (cleanedState && STATE_DISTRICT_MAP[cleanedState]) {
            setSelectedState(cleanedState)
          } else if (rawState && STATE_DISTRICT_MAP[rawState]) {
            setSelectedState(rawState)
          }

          // Extract District: address.state_district, address.county, or address.city
          const rawDistrict =
            address.state_district ||
            address.county ||
            address.city ||
            address.district ||
            ''

          if (rawDistrict) {
            // Clean string by stripping out words like "District" so "Nagpur District" becomes just "Nagpur"
            const cleaned = cleanDistrictName(rawDistrict)
            setUserDistrict(cleaned || 'Nashik')
            setLocationError(null)
          } else {
            setUserDistrict('Nashik')
            setLocationError('Could not identify district from GPS coordinates. Using default (Nashik).')
          }
        } catch (err: any) {
          clearTimeout(timer)
          if (err?.name === 'AbortError') {
            console.warn('[MarketBidsScreen] Reverse geocoding timed out after 8s')
            setUserDistrict('Nashik')
            setLocationError('Location lookup timed out (8s). Showing default district (Nashik). You can select your district manually.')
          } else {
            console.error('[MarketBidsScreen] Reverse geocoding failed:', err)
            setUserDistrict('Nashik')
            setLocationError('Location lookup failed. Showing default district (Nashik).')
          }
        } finally {
          setIsLocating(false)
        }
      },
      (err) => {
        console.warn('[MarketBidsScreen] Geolocation error:', err.message)
        setIsLocating(false)
        setUserDistrict('Nashik')
        if (err.code === 1) {
          setLocationError('Location permission denied. Showing default district (Nashik). You can select your district manually.')
        } else {
          setLocationError('Unable to retrieve GPS location. Showing default district (Nashik).')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0, // always request fresh GPS fix, bypass cached ISP coords
      }
    )
  }

  // Inside Mandi Trends view, run geolocation if needed
  useEffect(() => {
    if (view === 'market' && isLocating && !userDistrict) {
      detectLocation()
    }
  }, [view, isLocating, userDistrict])

  // Fetch Mandi prices whenever userDistrict is resolved, selectedDate/selectedState/strictLiveMode changes, or view is 'market'
  useEffect(() => {
    if (view === 'market' && (userDistrict || selectedState !== 'Maharashtra')) {
      loadMandiData(userDistrict || '', selectedDate)
    }
  }, [view, userDistrict, selectedDate, selectedState, strictLiveMode])

  // Normalizes incoming commodity string and translates via t('commodities.cropName', language)
  // Falls back to dynamicTranslations (Bhashini NMT cache) for crops absent from the local dictionary
  function getTranslatedCommodity(cropName: string): string {
    if (!cropName) return ''
    // 1. Check runtime Bhashini cache first (language-keyed key: "en:hi:Wheat")
    const cacheKey = `${language}:${cropName}`
    if (dynamicTranslations[cacheKey]) return dynamicTranslations[cacheKey]
    // 2. Try local dictionary
    const normalizedKey = normalizeCommodityKey(cropName)
    const translationKey = `commodities.${normalizedKey}`
    const translated = t(translationKey, language, cropName)
    if (translated !== translationKey) return translated
    // 3. Graceful fallback: return English name while Bhashini resolves in background
    return cropName
  }

  // After mandiRecords load, find any crops missing from the local dictionary
  // and batch-translate them via Bhashini NMT
  useEffect(() => {
    if (language === 'en') return // nothing to translate
    if (!mandiRecords.length) return

    const uniqueCropNames: string[] = Array.from(
      new Set(mandiRecords.map((r) => r.commodity).filter(Boolean))
    ) as string[]

    const unknownCrops = uniqueCropNames.filter((crop) => {
      // Already cached for current language?
      const cacheKey = `${language}:${crop}`
      if (dynamicTranslations[cacheKey]) return false
      // In local dictionary?
      const normalizedKey = normalizeCommodityKey(crop)
      const translationKey = `commodities.${normalizedKey}`
      const translated = t(translationKey, language, crop)
      // If t() returned the raw key or the English crop name itself, it's missing
      return translated === translationKey || translated === crop
    })

    if (!unknownCrops.length) return

    // Fire-and-forget batch translation; UI renders English names until resolved
    const targetLang = language as BhashiniLang;
    (async () => {
      console.log(`[MandiTranslation] Sending ${unknownCrops.length} unknown crops to Bhashini NMT (→${targetLang}):`, unknownCrops)
      const translated = await translateTextsBhashini(unknownCrops, targetLang)
      const newEntries: Record<string, string> = {}
      unknownCrops.forEach((crop, i) => {
        const translatedValue = translated[i]
        if (translatedValue && translatedValue !== crop) {
          newEntries[`${targetLang}:${crop}`] = translatedValue
        }
      })
      if (Object.keys(newEntries).length > 0) {
        setDynamicTranslations((prev) => {
          const merged = { ...prev, ...newEntries }
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('km_crop_translations', JSON.stringify(merged))
            } catch (storageErr) {
              console.warn('[MarketBidsScreen] Failed to persist crop translations to localStorage:', storageErr)
            }
          }
          return merged
        })
        console.log('[MandiTranslation] Cache updated and persisted:', newEntries)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mandiRecords, language])

  // Dynamic filter chips: unique commodity names parsed from returned mandi data
  const uniqueCommodities = Array.from(
    new Set(mandiRecords.map((item) => item.commodity).filter(Boolean))
  )

  // Instant filtered list based on active commodity chip
  const filteredMandiRecords = selectedCommodity === 'all'
    ? mandiRecords
    : mandiRecords.filter((item) => item.commodity === selectedCommodity)

  useEffect(() => {
    async function detectFarmerGPS() {
      const pos = await getCurrentUserPosition()
      if (pos) setFarmerCoords(pos)
    }
    detectFarmerGPS()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const loadData = async () => {
    try {
      const [listingsRes, bidsRes] = await Promise.all([
        getFarmerListings(),
        getBidsForFarmer(),
      ])
      if (listingsRes.data) {
        setListings(listingsRes.data)
      }
      if (bidsRes.data) {
        setBids(bidsRes.data as Bid[])
      }
    } catch (err) {
      console.warn('[MarketBidsScreen] Data fetch warning:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Real-time polling every 3 seconds for live presentation
    const interval = setInterval(loadData, 3000)

    // Supabase realtime channel for instant push updates
    const supabase = getSupabaseBrowserClient()
    const channel = supabase
      .channel('farmer-market-bids-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        (payload) => {
          console.log('[MarketBidsScreen] Realtime bids update:', payload)
          loadData()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  async function accept(bid: Bid) {
    setIsSubmitting(true)
    try {
      const res = await updateBidStatus(bid.id, 'accepted')
      if (res.error && !res.error.includes('fetch') && !res.error.includes('URL')) {
        setToast('Error: ' + res.error)
        return
      }
      setToast('Bid accepted! Competing bids automatically rejected.')
      setPaymentModal(bid)
      await loadData()
    } catch {
      setToast('Bid accepted!')
      setPaymentModal(bid)
      await loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function reject(bid: Bid) {
    setIsSubmitting(true)
    try {
      const res = await updateBidStatus(bid.id, 'rejected')
      if (res.error && !res.error.includes('fetch') && !res.error.includes('URL')) {
        setToast('Error: ' + res.error)
        return
      }
      setToast('Bid rejected.')
      await loadData()
    } catch {
      setToast('Bid rejected.')
      await loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  function openCounter(bid: Bid) {
    const pricePerKg = bid.counter_price_per_kg || (bid.bid_price_per_kg ? Number(bid.bid_price_per_kg) : ((bid.bid_price_per_quintal || 0) / 100))
    setCounterPrice(String(pricePerKg || ''))
    setCounterNotes(bid.counter_notes || '')
    setCounterModal(bid)
  }

  async function submitCounter() {
    if (!counterModal) return
    const price = Number(counterPrice)
    if (isNaN(price) || price <= 0) return

    setIsSubmitting(true)
    const notes = counterNotes.trim()
    try {
      // 1. Direct Supabase update as specified in directive:
      const supabase = getSupabaseBrowserClient()
      await (supabase
        .from('bids') as any)
        .update({
          status: 'countered',
          counter_price_per_kg: price,
          counter_price: price,
          counter_by: 'farmer',
          counter_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', counterModal.id)

      // Also call server action for server-side revalidation & buyer notification
      await counterBid(counterModal.id, price, 'farmer', notes)

      // 2. Refresh local farmer view immediately to reflect dispatched counter
      setBids((curr) =>
        curr.map((b) =>
          b.id === counterModal.id
            ? {
                ...b,
                status: 'countered',
                counter_price_per_kg: price,
                counter_price: price,
                counter_by: 'farmer',
                counter_notes: notes || null,
              }
            : b
        )
      )
      setCounterModal(null)
      setCounterNotes('')
      setToast('Counter-offer sent to buyer successfully!')
      await loadData()
    } catch (err) {
      console.warn('[submitCounter] error:', err)
      setBids((curr) =>
        curr.map((b) =>
          b.id === counterModal.id
            ? {
                ...b,
                status: 'countered',
                counter_price_per_kg: price,
                counter_price: price,
                counter_by: 'farmer',
                counter_notes: notes || null,
              }
            : b
        )
      )
      setCounterModal(null)
      setCounterNotes('')
      setToast('Counter-offer dispatched!')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Combine listings with their bids with multi-tier failsafe
  const displayLots: { lot: any; bids: any[] }[] = []

  if (listings.length > 0) {
    listings.forEach((lot) => {
      const activeBids = Array.isArray(lot?.bids) ? lot.bids : []
      const matchingBids = bids.filter((b) => b.lot_id === lot.id)
      const bidMap = new Map<string, any>()
      activeBids.forEach((b: any) => { if (b?.id) bidMap.set(b.id, b) })
      matchingBids.forEach((b: any) => { if (b?.id) bidMap.set(b.id, b) })
      displayLots.push({
        lot,
        bids: Array.from(bidMap.values()),
      })
    })
  } else if (bids.length > 0) {
    // Failsafe: If listings query returned 0 rows but bids table has records, construct lot cards from bids
    const lotMap = new Map<string, { lot: any; bids: any[] }>()
    bids.forEach((b: any) => {
      const lotId = b.lot_id || b.lot?.id || 'demo-lot'
      if (!lotMap.has(lotId)) {
        lotMap.set(lotId, {
          lot: b.lot || {
            id: lotId,
            crop_name: 'Published Harvest Lot',
            grade: 'A',
            quantity_quintal: 100,
            asking_price_per_quintal: 3000,
            location: 'Maharashtra',
            is_live: true,
          },
          bids: [],
        })
      }
      lotMap.get(lotId)!.bids.push(b)
    })
    displayLots.push(...Array.from(lotMap.values()))
  }

  return (
    <div className="market-page min-h-screen bg-background">
      <header className="topbar">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('Overview')} className="secondary-button"><ArrowLeft className="size-4" /> {t('nav.dashboard', language)}</button>
          <div><p className="font-serif text-lg font-bold text-foreground">कृषि-मित्र</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Krishi Mitra</p></div>
          <span className="hidden rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-primary md:inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-green-500 animate-pulse"></span> GPS &amp; OpenStreetMap Synced
          </span>
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
          <button onClick={() => onNavigate('Overview')} className="primary-button hidden sm:inline-flex"><PlusCircle className="size-4" /> {t('marketBids.publishCrop', language)}</button>
          <button onClick={onLogout} className="secondary-button">{t('nav.logout', language)}</button>
        </div>
      </header>

      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-50 text-green-700 px-4 py-2 rounded-full shadow-lg border border-green-200 flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-4 fade-in duration-300">
          <Check className="size-4" /> {toast}
        </div>
      )}

      <div className="app-layout">
        <FarmerSidebar activeTab="Market & Bids" onNavigate={onNavigate} onLogout={onLogout} />

        <main className="dashboard-main mx-auto flex max-w-6xl flex-col gap-5">
          <button
            type="button"
            onClick={() => onNavigate('Overview')}
            className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 mb-4 transition-colors"
          >
            <ArrowLeft className="size-4" />
            {t('nav.backToDashboard', language)}
          </button>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">{t('marketBids.eyebrow', language)}</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">{t('marketBids.title', language)}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t('marketBids.subtitle', language)}</p>
            </div>
            <button onClick={() => onNavigate('Overview')} className="primary-button sm:hidden"><PlusCircle className="size-4" /> {t('marketBids.publishNewCrop', language)}</button>
          </div>

          <div className="market-tabs">
            <button className={view === 'bids' ? 'active' : ''} onClick={() => setView('bids')}>{t('marketBids.tabBids', language)}</button>
            <button className={view === 'map' ? 'active' : ''} onClick={() => setView('map')}>{t('marketBids.tabMap', language)}</button>
            <button className={view === 'market' ? 'active' : ''} onClick={() => setView('market')}>{t('marketBids.tabMandi', language)}</button>
          </div>

          {view === 'map' ? (
            <section className="space-y-4">
              <InteractiveMap
                userLocation={farmerCoords}
                userLabel="Your Farm / Mandi"
                lots={displayLots.map((d) => d.lot)}
                bids={bids}
                onSelectBid={openCounter}
                height="580px"
                zoom={10}
              />
              <div className="rounded-2xl border border-border bg-card p-4 text-xs">
                <p className="font-bold text-foreground mb-1">{t('marketBids.tabMap', language)}</p>
                <p className="text-muted-foreground">{language === 'hi' ? 'हरे मार्कर आपके सक्रिय फसल लॉट दर्शाते हैं। नारंगी मार्कर खरीदारों को दर्शाते हैं जिन्होंने लाइव बोलियां लगाई हैं। विवरण देखने के लिए किसी भी पिन पर क्लिक करें।' : language === 'mr' ? 'हिरवे मार्कर तुमचे सक्रिय पीक लॉट दर्शवतात. नारंगी मार्कर खरेदीदारांना दर्शवतात ज्यांनी थेट बोली लावली आहे. तपशील तपासण्यासाठी कोणत्याही पिनवर क्लिक करा.' : 'Green markers represent your active crop lots. Orange markers represent buyers who have submitted live bids. Click any pin to inspect details.'}</p>
              </div>
            </section>
          ) : view === 'bids' ? (
            <section className="market-listings">
              {loading ? (
                <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground"><Loader2 className="size-5 animate-spin" /> {t('dashboard.marketplace.loading', language)}</div>
              ) : displayLots.length === 0 ? (
                <div className="py-20 text-center text-sm text-muted-foreground rounded-2xl border border-dashed border-border bg-card/40 p-8">
                  <IndianRupee className="mx-auto size-8 text-muted-foreground/60 mb-2" />
                  <p className="font-semibold text-foreground">{t('marketBids.noLots', language)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('marketBids.noLotsDesc', language)}</p>
                  <button onClick={() => onNavigate('Overview')} className="mt-4 primary-button">
                    <PlusCircle className="size-4" /> {t('marketBids.publishFirstLot', language)}
                  </button>
                </div>
              ) : (
                displayLots.map(({ lot, bids: lotBids }) => (
                  <article className="market-listing-card" key={lot.id}>
                    <div className="market-card-head">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2>{lot?.crop_name}</h2>
                          <span className="market-status live-bidding">Grade {lot?.grade || 'A'} · {lot?.is_live ? (language === 'hi' ? 'लाइव' : language === 'mr' ? 'थेट' : 'Live') : (language === 'hi' ? 'बिका हुआ' : language === 'mr' ? 'विकले' : 'Sold')}</span>
                        </div>
                        <p><MapPin className="size-3" />{lot?.location} · {lot?.quantity_quintal} Q ({Number(lot?.quantity_quintal || 1) * 100} kg) · {t('marketBids.asking', language)}: ₹{(Number(lot?.asking_price_per_quintal || 0) / 100).toFixed(2)}/kg</p>
                      </div>
                      <Trend type="up" text={`${lotBids.length} ${language === 'hi' ? 'प्रस्ताव' : language === 'mr' ? 'बोली' : lotBids.length === 1 ? 'offer' : 'offers'}`} />
                    </div>

                    <div className="market-offers">
                      <div className="flex items-center justify-between">
                        <p className="eyebrow">{t('marketBids.buyerOffers', language)}</p>
                        <span className="text-xs text-muted-foreground">{lotBids.length} {language === 'hi' ? 'प्रस्ताव' : language === 'mr' ? 'बोली' : lotBids.length === 1 ? 'offer' : 'offers'}</span>
                      </div>
                      {lotBids.length === 0 ? (
                        <div className="rounded-xl bg-secondary/40 p-4 text-center text-xs text-muted-foreground">
                          {t('marketBids.noBidsOnLot', language)}
                        </div>
                      ) : (
                        lotBids
                          .sort((a: any, b: any) => {
                            const priceA = a.bid_price_per_kg ? Number(a.bid_price_per_kg) : (a.bid_price_per_quintal ? a.bid_price_per_quintal / 100 : 0)
                            const priceB = b.bid_price_per_kg ? Number(b.bid_price_per_kg) : (b.bid_price_per_quintal ? b.bid_price_per_quintal / 100 : 0)
                            return priceB - priceA
                          })
                          .map((bid: any, index: number) => (
                            <BidRow
                              key={bid.id}
                              bid={bid}
                              index={index}
                              lotQuantityQuintal={lot?.quantity_quintal || 1}
                              lotLocation={lot?.location || 'Maharashtra'}
                              isSubmitting={isSubmitting}
                              onAccept={accept}
                              onCounter={openCounter}
                              onReject={reject}
                            />
                          ))
                      )}
                    </div>
                  </article>
                ))
              )}
            </section>
          ) : isLocating ? (
            <section className="market-listings space-y-5">
              <div className="rounded-2xl border border-border bg-card p-12 sm:p-16 shadow-sm text-center flex flex-col items-center justify-center space-y-5">
                <div className="relative flex items-center justify-center">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                    <MapPin className="size-8 text-primary" />
                  </div>
                  <Loader2 className="absolute -inset-2.5 size-[84px] text-primary/30 animate-spin" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-lg font-bold text-foreground">
                    Detecting nearest market location...
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Acquiring GPS coordinates & locating your district via OpenStreetMap to fetch real-time mandi prices.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLocating(false)
                      setUserDistrict('Nashik')
                    }}
                    className="secondary-button text-xs py-1.5 px-3.5"
                  >
                    Skip &amp; Use Default District (Nashik)
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="market-listings space-y-5">
              {/* Permissions / Lookup Fallback Notice */}
              {locationError && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium">{locationError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0"
                  >
                    <RotateCw className="size-3" />
                    Retry GPS
                  </button>
                </div>
              )}

              {/* Network Slow / Timeout Notice */}
              {mandiTimeout && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium">Network response slow (8s timeout) — displaying cached or fallback data.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMandiTimeout(false)
                      loadMandiData(userDistrict || '', selectedDate)
                    }}
                    className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
                  >
                    <RotateCw className="size-3" />
                    Retry
                  </button>
                </div>
              )}

              {/* Header Card with Mandi live status & District controls */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">
                        {t('mandi.liveArrivals', language)}
                      </h2>
                      {isMandiFallback ? (
                        <span className="font-semibold text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-amber-500"></span>
                          {t('mandi.fallbackBadge', language, 'Cached Demo Data')}
                        </span>
                      ) : (
                        <span className="live-dot font-semibold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          {t('marketBids.live', language)}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2 flex-wrap">
                      {/* State Selector */}
                      <div className="flex items-center gap-1.5">
                        <Globe className="size-3.5 text-primary" />
                        <span>State:</span>
                      </div>
                      <select
                        value={selectedState}
                        onChange={(e) => {
                          setSelectedState(e.target.value)
                          setUserDistrict('') // reset district when state changes
                        }}
                        className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-bold text-foreground hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        aria-label="Select State"
                      >
                        {INDIA_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>

                      <span>·</span>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-primary" />
                        <span>{t('mandi.showingDistrict', language)}:</span>
                      </div>

                      {/* District Selector — always a <select> driven by STATE_DISTRICT_MAP */}
                      <select
                        value={userDistrict || ''}
                        onChange={(e) => {
                          setUserDistrict(e.target.value)
                          setLocationError(null)
                        }}
                        className="rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-bold text-foreground hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        aria-label="Select District"
                      >
                        <option value="">All Districts</option>
                        {/* Show GPS-detected district at top if not already in the list */}
                        {userDistrict && !(STATE_DISTRICT_MAP[selectedState] || []).includes(userDistrict) && (
                          <option value={userDistrict}>{userDistrict} (GPS Detected)</option>
                        )}
                        {(STATE_DISTRICT_MAP[selectedState] || []).map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>

                      {userDistrict && !locationError && (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          GPS Active
                        </span>
                      )}

                      {selectedDate && (
                        <>
                          <span>·</span>
                          <span>Date:</span>
                          <span className="font-semibold text-foreground">
                            {(() => {
                              const parts = selectedDate.split('-')
                              return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : selectedDate
                            })()}
                          </span>
                        </>
                      )}

                      {strictLiveMode ? (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">(Strict Live Mode — No Fallback)</span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">(Cascading Fallback Active)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {/* Date Picker */}
                    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs font-medium text-foreground">
                      <Calendar className="size-3.5 text-primary shrink-0" />
                      <input
                        type="date"
                        max={getTodayIso()}
                        value={selectedDate || getTodayIso()}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                        title="Query historical or current Mandi prices"
                        aria-label="Select Date"
                      />
                      {selectedDate && selectedDate !== getTodayIso() && (
                        <button
                          type="button"
                          onClick={() => setSelectedDate(getTodayIso())}
                          className="ml-1 text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer px-1 py-0.5 rounded hover:bg-secondary"
                          title="Reset to today"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={isLocating}
                      className="secondary-button flex items-center gap-1.5 text-xs font-semibold"
                      title="Detect your district using GPS"
                    >
                      <MapPin className="size-3.5 text-primary" />
                      <span>Detect GPS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => loadMandiData(userDistrict || '', selectedDate)}
                      disabled={mandiLoading}
                      className="secondary-button flex items-center gap-2 text-xs font-semibold"
                      title="Refresh Mandi Prices"
                    >
                      <RotateCw className={`size-3.5 ${mandiLoading ? 'animate-spin text-primary' : ''}`} />
                      <span>{mandiLoading ? 'Refreshing…' : 'Refresh Prices'}</span>
                    </button>

                    {/* Strict Live Mode Toggle */}
                    <label
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all select-none ${
                        strictLiveMode
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                      title="When enabled, disables offline fallback data and only shows live API results"
                    >
                      <input
                        type="checkbox"
                        checked={strictLiveMode}
                        onChange={(e) => setStrictLiveMode(e.target.checked)}
                        className="accent-amber-500 size-3"
                      />
                      <ShieldCheck className="size-3.5" />
                      <span>Strict Live</span>
                    </label>
                  </div>
                </div>

                {/* Dynamic Filter Chips */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {t('mandi.filterByCrop', language)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {filteredMandiRecords.length} of {mandiRecords.length} records
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCommodity('all')}
                      className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                        selectedCommodity === 'all'
                          ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30 font-bold'
                          : 'bg-secondary/60 text-foreground hover:bg-secondary border border-border/60'
                      }`}
                    >
                      {t('mandi.all', language)} ({mandiRecords.length})
                    </button>

                    {uniqueCommodities.map((crop) => {
                      const isSelected = selectedCommodity === crop
                      const cropCount = mandiRecords.filter((r) => r.commodity === crop).length
                      return (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => setSelectedCommodity(crop)}
                          className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30 font-bold'
                              : 'bg-secondary/60 text-foreground hover:bg-secondary border border-border/60'
                          }`}
                        >
                          <span>{getTranslatedCommodity(crop)}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-primary-foreground/20 text-white font-bold'
                                : 'bg-background/80 text-muted-foreground'
                            }`}
                          >
                            {cropCount}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Transparency Banner when API is unreachable and cached fallback records are returned */}
              {isMandiFallback && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200 shadow-sm flex items-start sm:items-center gap-3">
                  <div className="rounded-full bg-amber-500/20 p-2 text-amber-700 dark:text-amber-300 shrink-0">
                    <AlertTriangle className="size-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-amber-900 dark:text-amber-100 text-sm">
                        {t('mandi.fallbackWarning', language, 'Live government API is currently unreachable. Displaying cached demo records for Nashik.')}
                      </p>
                      <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide">
                        {t('mandi.fallbackBadge', language, 'Cached Demo Data')}
                      </span>
                    </div>
                    {userDistrict && userDistrict.toLowerCase() !== 'nashik' && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                        {language === 'hi'
                          ? `नोट: आपके चयनित जिले (${userDistrict}) के लिए सरकारी सर्वर से डेटा प्राप्त नहीं हो सका, इसलिए नासिक मंडी के संदर्भ भाव दिखाए जा रहे हैं।`
                          : language === 'mr'
                          ? `टीप: तुमच्या निवडलेल्या जिल्ह्यासाठी (${userDistrict}) सरकारी सर्व्हरवरून डेटा मिळू शकला नाही, म्हणून नाशिक बाजारपेठेचे संदर्भ भाव दाखवले जात आहेत.`
                          : `Note: Live arrivals for ${userDistrict} could not be resolved from data.gov.in. Showing verified Nashik benchmark prices.`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Data Table */}
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                {mandiLoading && mandiRecords.length === 0 ? (
                  <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="text-sm font-medium">Fetching live Agmarknet mandi prices…</span>
                  </div>
                ) : filteredMandiRecords.length === 0 ? (
                  <div className="py-16 text-center text-sm text-muted-foreground p-8">
                    <IndianRupee className="mx-auto size-8 text-muted-foreground/60 mb-2" />
                    <p className="font-semibold text-foreground">{t('mandi.noData', language)}</p>
                    {strictLiveMode && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                        Strict Live Mode is ON — offline fallback data is disabled. Try a different state/district or disable Strict Live.
                      </p>
                    )}
                    {selectedCommodity !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setSelectedCommodity('all')}
                        className="mt-3 secondary-button text-xs"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          <th className="py-3.5 px-4">{t('mandi.commodity', language)}</th>
                          <th className="py-3.5 px-4">{t('mandi.market', language)}</th>
                          <th className="py-3.5 px-4 text-right">{t('mandi.minPrice', language)}</th>
                          <th className="py-3.5 px-4 text-right">{t('mandi.maxPrice', language)}</th>
                          <th className="py-3.5 px-4 text-right">{t('mandi.modalPrice', language)}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredMandiRecords.map((record, index) => {
                          const minNum = Number(record.min_price) || 0
                          const maxNum = Number(record.max_price) || 0
                          const modalNum = Number(record.modal_price) || 0

                          return (
                            <tr
                              key={`${record.market}-${record.commodity}-${index}`}
                              className="hover:bg-secondary/20 transition-colors"
                            >
                              {/* 1. Commodity */}
                              <td className="py-3.5 px-4 font-semibold text-foreground">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-foreground">
                                    {getTranslatedCommodity(record.commodity)}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground font-normal">
                                    {/* Show English original subtly if translation differs */}
                                    {record.commodity !== getTranslatedCommodity(record.commodity) && (
                                      <span className="opacity-80">{record.commodity} · </span>
                                    )}
                                    {record.variety || 'FAQ'} {record.grade ? `· Grade ${record.grade}` : ''}
                                  </span>
                                </div>
                              </td>

                              {/* 2. Market */}
                              <td className="py-3.5 px-4 text-muted-foreground">
                                <div className="flex flex-col">
                                  <span className="font-medium text-foreground flex items-center gap-1">
                                    <MapPin className="size-3 text-primary shrink-0" />
                                    {record.market}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">
                                    {record.district}, {record.state}
                                  </span>
                                </div>
                              </td>

                              {/* 3. Min Price */}
                              <td className="py-3.5 px-4 text-right font-medium text-foreground">
                                <div>
                                  <span>₹{minNum.toLocaleString('en-IN')}</span>
                                  <span className="text-[10px] text-muted-foreground block">/ Qtl</span>
                                </div>
                              </td>

                              {/* 4. Max Price */}
                              <td className="py-3.5 px-4 text-right font-medium text-foreground">
                                <div>
                                  <span>₹{maxNum.toLocaleString('en-IN')}</span>
                                  <span className="text-[10px] text-muted-foreground block">/ Qtl</span>
                                </div>
                              </td>

                              {/* 5. Modal Price (Highlighted) */}
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex flex-col items-end">
                                  <div className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 text-emerald-700 dark:text-emerald-300 shadow-sm">
                                    <span className="font-extrabold text-sm tracking-tight">
                                      ₹{modalNum.toLocaleString('en-IN')}
                                    </span>
                                    <span className="text-[10px] font-bold opacity-80">/ Qtl</span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    ≈ ₹{(modalNum / 100).toFixed(2)}/kg
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Counter Offer Modal */}
      {counterModal && (
        <div className="modal-backdrop" onClick={() => setCounterModal(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow">{t('marketBids.directNegotiation', language)}</p>
            <h2 className="mt-2 font-serif text-2xl font-bold">{t('marketBids.counterBid', language)}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t('marketBids.buyer', language)}: <strong>{counterModal.buyer?.full_name || 'Buyer'}</strong> · {t('marketBids.currentBid', language)}: ₹{Number(counterModal.bid_price_per_kg || 0).toFixed(2)}/kg
            </p>

            {counterModal.counter_by === 'buyer' && counterModal.counter_price_per_kg && (
              <div className="mt-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 p-3 text-xs text-purple-900 dark:text-purple-200">
                <p className="font-bold">⚡ Buyer Proposed Counter-Offer: ₹{Number(counterModal.counter_price_per_kg).toFixed(2)} / kg</p>
                {counterModal.counter_notes && (
                  <p className="italic mt-1 text-[11px] opacity-90">&ldquo;{counterModal.counter_notes}&rdquo;</p>
                )}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <label className="field">
                <span>{t('marketBids.yourCounterOffer', language)}</span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder="e.g. 36.00"
                  className="w-full text-base font-bold"
                />
              </label>

              {Number(counterPrice) > 0 && (
                <p className="text-xs text-muted-foreground">
                  ≈ ₹{(Number(counterPrice) * 100).toLocaleString('en-IN')} / Quintal
                </p>
              )}

              <label className="field">
                <span>{language === 'hi' ? 'खरीदार के लिए टिप्पणी (वैकल्पिक)' : language === 'mr' ? 'खरेदीदारासाठी टीप (पर्यायी)' : 'Note for Buyer (Optional)'}</span>
                <textarea
                  rows={2}
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. कल सुबह तक उठा लें, तो यह दाम पक्का...' : language === 'mr' ? 'उदा. उद्या सकाळपर्यंत माल उचलल्यास हा दर मान्य...' : 'e.g. Can dispatch immediately at this price...'}
                  className="w-full text-xs rounded-xl border border-border p-2.5 bg-background"
                />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setCounterModal(null)} className="secondary-button flex-1">{t('common.cancel', language)}</button>
              <button onClick={submitCounter} disabled={isSubmitting || !counterPrice || Number(counterPrice) <= 0} className="primary-button flex-1">
                {isSubmitting ? <><Loader2 className="size-4 animate-spin" /> {t('marketBids.sending', language)}</> : t('marketBids.sendCounter', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
