export interface FarmerCrop {
  id: string;
  farmer_id: string;
  crop_name: string;
  variety?: string | null;
  sowing_date: string; // ISO date string (YYYY-MM-DD)
  area_acres: number; // acres
  expected_harvest_date?: string | null;
  created_at?: string;
  // Aliases for component convenience and backward compatibility
  name?: string;
  plantedDate?: string;
  area?: number;
  quantity?: number;
  unit?: string;
  soil?: string;
  irrigation?: string;
  notes?: string;
}

/**
 * Rough estimate of harvest date based on crop type.
 * Returns a date string in YYYY-MM-DD format.
 */
export function calculateHarvestDate(cropName: string, sowingDate: string): string {
  const daysMap: Record<string, number> = {
    Wheat: 120,
    Onion: 90,
    Rice: 150,
    Tomato: 80,
    Cotton: 160,
    Soybean: 100,
    Sugarcane: 365,
  };
  const defaultDays = 120;
  const days = daysMap[cropName] ?? defaultDays;
  const sow = new Date(sowingDate || new Date().toISOString().split('T')[0]);
  const validSow = isNaN(sow.getTime()) ? new Date() : sow;
  const harvest = new Date(validSow.getTime() + days * 24 * 60 * 60 * 1000);
  return harvest.toISOString().split('T')[0];
}

export interface CropStageGuidance {
  step: number;
  titleKey: string;
  defaultTitle: string;
  daysRange: string;
  descKey: string;
  defaultDesc: string;
  actionKey: string;
  defaultAction: string;
  minDay: number;
  maxDay: number;
}

export function getCropStages(cropName?: string): CropStageGuidance[] {
  return [
    {
      step: 1,
      titleKey: 'myCrop.guidance.step1Title',
      defaultTitle: 'Soil Preparation & Sowing',
      daysRange: 'Days 0–6',
      descKey: 'myCrop.guidance.step1Desc',
      defaultDesc: 'Deep plowing (2-3 passes), leveling, and application of well-rotted FYM (5-10 tons/acre).',
      actionKey: 'myCrop.guidance.step1Action',
      defaultAction: 'Basal fertilizer dose: Apply N:P:K (10:26:26 or DAP) into furrows before seed sowing.',
      minDay: 0,
      maxDay: 6,
    },
    {
      step: 2,
      titleKey: 'myCrop.guidance.step2Title',
      defaultTitle: 'Germination (Days 7-14)',
      daysRange: 'Days 7–20',
      descKey: 'myCrop.guidance.step2Desc',
      defaultDesc: 'Seeds sprout and establish initial root systems. Uniform emergence requires consistent moisture.',
      actionKey: 'myCrop.guidance.step2Action',
      defaultAction: 'Light irrigation to prevent soil crusting. Inspect for damping-off and root rot.',
      minDay: 7,
      maxDay: 20,
    },
    {
      step: 3,
      titleKey: 'myCrop.guidance.step3Title',
      defaultTitle: 'Vegetative Stage (Fertilizer Needed)',
      daysRange: 'Days 21–60',
      descKey: 'myCrop.guidance.step3Desc',
      defaultDesc: 'Rapid foliage and canopy development. High demand for nitrogen and sulfur.',
      actionKey: 'myCrop.guidance.step3Action',
      defaultAction: 'First top dressing: Apply Urea (35 kg/acre) + Micronutrient foliar spray. Regular weeding.',
      minDay: 21,
      maxDay: 60,
    },
    {
      step: 4,
      titleKey: 'myCrop.guidance.step4Title',
      defaultTitle: 'Flowering & Grain / Bulb Filling',
      daysRange: 'Days 61–89',
      descKey: 'myCrop.guidance.step4Desc',
      defaultDesc: 'Critical yield-determining stage. Plants allocate starches and nutrients to reproductive parts.',
      actionKey: 'myCrop.guidance.step4Action',
      defaultAction: 'Foliar spray of 0:0:50 (Potash) + Boron for size, weight, and disease resistance.',
      minDay: 61,
      maxDay: 89,
    },
    {
      step: 5,
      titleKey: 'myCrop.guidance.step5Title',
      defaultTitle: 'Harvesting (Expected Date)',
      daysRange: 'Days 90+',
      descKey: 'myCrop.guidance.step5Desc',
      defaultDesc: 'Crop reaches full physiological maturity, leaves yellow/neck tops fall over.',
      actionKey: 'myCrop.guidance.step5Action',
      defaultAction: 'Withhold irrigation 10-14 days prior. Harvest on a clear dry day and cure in shade.',
      minDay: 90,
      maxDay: 9999,
    },
  ];
}
