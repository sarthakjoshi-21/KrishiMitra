/**
 * Crop Health & AI Leaf Disease Diagnosis Utilities
 * Provides simulated computer-vision pathology diagnosis data,
 * confidence rankings, severity indicators, and dual organic/chemical treatment plans.
 */

export interface DiagnosisResult {
  id: string
  diseaseName: string
  diseaseKey: string
  cropName: string
  cropKey: string
  confidence: number // e.g., 94
  severity: 'low' | 'moderate' | 'high'
  severityKey: string
  symptoms: string
  symptomsKey: string
  organicTreatment: string
  organicTreatmentKey: string
  chemicalTreatment: string
  chemicalTreatmentKey: string
  phiDays: number // Pre-Harvest Interval in days
  phiWarning: string
  phiWarningKey: string
  safetyNotes: string
  safetyNotesKey: string
  sampleImageUrl?: string
}

/**
 * Master mock diagnosis as strictly specified in Master Directive
 */
export const MOCK_DIAGNOSIS: DiagnosisResult = {
  id: 'diag-early-blight',
  diseaseName: 'Early Blight (Alternaria solani)',
  diseaseKey: 'cropHealth.earlyBlight.name',
  cropName: 'Tomato / Potato',
  cropKey: 'cropHealth.earlyBlight.crop',
  confidence: 94,
  severity: 'moderate',
  severityKey: 'cropHealth.severity.moderate',
  symptoms: 'Concentric dark brown rings ("target-board" spots) on mature lower leaves surrounded by yellow chlorotic halos.',
  symptomsKey: 'cropHealth.earlyBlight.symptoms',
  organicTreatment: 'Neem oil spray (3–5 ml/L water) or Trichoderma viride foliar wash. Prune and destroy infected lower foliage.',
  organicTreatmentKey: 'cropHealth.earlyBlight.organic',
  chemicalTreatment: 'Mancozeb 75% WP (2 g/L) or Copper Oxychloride 50% WP (2.5 g/L). Alternate fungicides to prevent resistance.',
  chemicalTreatmentKey: 'cropHealth.earlyBlight.chemical',
  phiDays: 7,
  phiWarning: 'Do not harvest crops for 7 days after spraying to ensure zero chemical residues on produce.',
  phiWarningKey: 'cropHealth.earlyBlight.phiWarning',
  safetyNotes: 'Wear protective goggles and mask during spraying. Spray in early morning or late evening when wind speed is below 10 km/h.',
  safetyNotesKey: 'cropHealth.earlyBlight.safetyNotes',
  sampleImageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80',
}

/**
 * Additional interactive presets for presentations
 */
export const PRESET_DIAGNOSES: DiagnosisResult[] = [
  MOCK_DIAGNOSIS,
  {
    id: 'diag-powdery-mildew',
    diseaseName: 'Powdery Mildew (Erysiphe cichoracearum)',
    diseaseKey: 'cropHealth.powderyMildew.name',
    cropName: 'Grapes / Cucumber / Pea',
    cropKey: 'cropHealth.powderyMildew.crop',
    confidence: 91,
    severity: 'moderate',
    severityKey: 'cropHealth.severity.moderate',
    symptoms: 'White talcum-like powdery fungal patches on upper leaf surfaces causing leaf distortion, chlorosis, and premature leaf drop.',
    symptomsKey: 'cropHealth.powderyMildew.symptoms',
    organicTreatment: 'Potassium bicarbonate spray (3 g/L) or diluted milk-water wash (1:9 ratio). Improve plant canopy for direct sunlight.',
    organicTreatmentKey: 'cropHealth.powderyMildew.organic',
    chemicalTreatment: 'Wettable Sulfur 80% WP (2.5 g/L) or Hexaconazole 5% EC (1 ml/L). Avoid sulfur when ambient temperatures exceed 32°C.',
    chemicalTreatmentKey: 'cropHealth.powderyMildew.chemical',
    phiDays: 5,
    phiWarning: 'Wait 5 days after application before harvesting food crops.',
    phiWarningKey: 'cropHealth.powderyMildew.phiWarning',
    safetyNotes: 'Sulfur can cause eye and dermal irritation. Wash thoroughly with clean water.',
    safetyNotesKey: 'cropHealth.powderyMildew.safetyNotes',
    sampleImageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'diag-healthy-leaf',
    diseaseName: 'Healthy Foliage — No Pathogen Detected',
    diseaseKey: 'cropHealth.healthy.name',
    cropName: 'General Crops',
    cropKey: 'cropHealth.healthy.crop',
    confidence: 98,
    severity: 'low',
    severityKey: 'cropHealth.severity.low',
    symptoms: 'Uniform deep green leaf texture, fully intact cell walls, and zero chlorosis or necrotic lesions.',
    symptomsKey: 'cropHealth.healthy.symptoms',
    organicTreatment: 'Maintain preventive bio-fertilizer foliar spray (Pseudomonas fluorescens 5 ml/L) once every 15 days.',
    organicTreatmentKey: 'cropHealth.healthy.organic',
    chemicalTreatment: 'Zero chemical fungicide required. Avoid unnecessary prophylactic chemical sprays.',
    chemicalTreatmentKey: 'cropHealth.healthy.chemical',
    phiDays: 0,
    phiWarning: 'Crops are 100% pesticide-free and safe for immediate harvest and market sale.',
    phiWarningKey: 'cropHealth.healthy.phiWarning',
    safetyNotes: 'Continue balanced N-P-K nutrition and avoid overhead sprinkler wetting during sunset.',
    safetyNotesKey: 'cropHealth.healthy.safetyNotes',
    sampleImageUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=80',
  },
]
