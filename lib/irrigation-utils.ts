/**
 * Smart Irrigation Utility — IoT Algorithm & Advisory Engine
 * Combines farmer crop data with hyper-local Open-Meteo weather data
 * to recommend optimal watering schedules, prevent crop stress, and conserve water.
 */

import { FarmerCrop } from './crop-utils'
import { WeatherData, WeatherForecastDay } from './weather-utils'

export type IrrigationStatus = 'pause' | 'critical' | 'normal'

export interface IrrigationAdvisoryResult {
  status: IrrigationStatus
  statusLabel: string
  statusKey: string
  message: string
  messageKey: string
  badgeColor: 'blue' | 'red' | 'green'
  badgeBgClass: string
  badgeTextClass: string
  badgeBorderClass: string
  recommendedWater: string // e.g., '0 L / acre', '20 L / acre', '10–12 L / acre'
  totalWaterRequirementLiters: number // computed based on crop area
  urgency: 'low' | 'high' | 'normal'
  soilMoistureEst: number // estimated percentage (e.g. 28% for heat, 65% for rain, 46% for normal)
  iconType: 'CloudRain' | 'AlertTriangle' | 'Droplets'
  actionKey: string
  defaultAction: string
  triggerReason: string
  cropSpecificTip: string
  cropSpecificTipKey: string
}

/**
 * Returns crop-specific moisture and irrigation guidance
 */
function getCropMoistureTip(cropName: string = ''): { tip: string; tipKey: string } {
  const normalized = cropName.trim().toLowerCase()
  if (normalized.includes('onion')) {
    return {
      tip: 'Onion bulbs are shallow-rooted. Maintain even topsoil moisture and stop irrigation 10-15 days prior to harvest.',
      tipKey: 'irrigation.cropTip.onion',
    }
  }
  if (normalized.includes('wheat')) {
    return {
      tip: 'Wheat is highly sensitive at Crown Root Initiation (CRI) and flowering stages. Avoid irrigation during high winds to prevent lodging.',
      tipKey: 'irrigation.cropTip.wheat',
    }
  }
  if (normalized.includes('tomato')) {
    return {
      tip: 'Tomatoes require consistent drip moisture. Erratic watering causes blossom-end rot and fruit cracking.',
      tipKey: 'irrigation.cropTip.tomato',
    }
  }
  if (normalized.includes('rice')) {
    return {
      tip: 'Maintain shallow submergence (2-5 cm) during active tillering. Drain field 7-10 days before harvest.',
      tipKey: 'irrigation.cropTip.rice',
    }
  }
  if (normalized.includes('cotton')) {
    return {
      tip: 'Cotton has deep taproots. Ensure deep percolation during boll formation, but avoid vegetative waterlogging.',
      tipKey: 'irrigation.cropTip.cotton',
    }
  }
  if (normalized.includes('soybean')) {
    return {
      tip: 'Pod development and seed filling are critical moisture windows. Water stress causes pod abortion.',
      tipKey: 'irrigation.cropTip.soybean',
    }
  }
  if (normalized.includes('sugarcane')) {
    return {
      tip: 'Grand growth phase requires regular furrow/drip irrigation every 7-10 days depending on soil type.',
      tipKey: 'irrigation.cropTip.sugarcane',
    }
  }
  return {
    tip: 'Ensure root-zone aeration between drip cycles to prevent fungal root diseases.',
    tipKey: 'irrigation.cropTip.default',
  }
}

/**
 * Synchronous Smart Irrigation Algorithm:
 * Combines crop parameters with live weather metrics to calculate actionable watering advisory.
 *
 * Rules:
 * 1. If precipitation > 5mm today or tomorrow -> status: 'pause' (Rain expected)
 * 2. If max temp > 35°C and no rain (< 2mm) -> status: 'critical' (High heat alert)
 * 3. Default/Normal -> status: 'normal' (Optimal drip schedule)
 */
export function calculateIrrigationAdvisory(
  crop: FarmerCrop | null,
  weather: WeatherData | WeatherForecastDay | null
): IrrigationAdvisoryResult {
  // Extract rainfall and temperature metrics safely
  let todayRain = 0
  let tomorrowRain = 0
  let maxTemp = 30

  if (weather) {
    if ('daily' in weather && Array.isArray(weather.daily)) {
      todayRain = weather.daily[0]?.precipitation ?? 0
      tomorrowRain = weather.daily[1]?.precipitation ?? 0
      maxTemp = weather.daily[0]?.maxTemp ?? weather.current?.temperature ?? 30
    } else {
      const dailyAny = weather as any
      todayRain = dailyAny.precipitation_sum ?? dailyAny.precipitation ?? 0
      tomorrowRain = dailyAny.tomorrow_precipitation ?? 0
      maxTemp = dailyAny.temperature_max ?? dailyAny.temperature_2m_max ?? dailyAny.maxTemp ?? 30
    }
  }

  const maxRain = Math.max(todayRain, tomorrowRain)
  const cropArea = crop ? Number(crop.area_acres ?? crop.area ?? 1) : 1
  const cropName = crop?.crop_name || crop?.name || 'Crop'
  const cropTip = getCropMoistureTip(cropName)

  // 1. Rain Expected Alert (> 5mm today or tomorrow)
  if (maxRain > 5 || todayRain > 5 || tomorrowRain > 5) {
    return {
      status: 'pause',
      statusLabel: 'Pause Irrigation',
      statusKey: 'irrigation.status.pause',
      message: 'Rain expected. Pause irrigation to save water and prevent waterlogging.',
      messageKey: 'irrigation.advisory.rain',
      badgeColor: 'blue',
      badgeBgClass: 'bg-blue-100 dark:bg-blue-950/60',
      badgeTextClass: 'text-blue-800 dark:text-blue-300',
      badgeBorderClass: 'border-blue-300 dark:border-blue-800',
      recommendedWater: '0 L / acre',
      totalWaterRequirementLiters: 0,
      urgency: 'low',
      soilMoistureEst: 68,
      iconType: 'CloudRain',
      actionKey: 'irrigation.action.pause',
      defaultAction: 'Hold all irrigation cycles for the next 24-48 hours. Inspect field drainage ditches to prevent standing pools.',
      triggerReason: `Forecast indicates ${maxRain.toFixed(1)}mm rainfall within the next 48h.`,
      cropSpecificTip: cropTip.tip,
      cropSpecificTipKey: cropTip.tipKey,
    }
  }

  // 2. High Heat Alert (> 35°C and no significant rain < 2mm)
  if (maxTemp > 35 && maxRain < 2) {
    // 20 liters per acre in drip irrigation simulation (approx. 20,000L / acre for deep watering)
    const litersPerAcre = 20000
    return {
      status: 'critical',
      statusLabel: 'Critical Heat Alert',
      statusKey: 'irrigation.status.critical',
      message: 'High heat alert. Apply deep irrigation (e.g., 20 liters/acre) immediately to prevent crop stress.',
      messageKey: 'irrigation.advisory.heat',
      badgeColor: 'red',
      badgeBgClass: 'bg-red-100 dark:bg-red-950/60',
      badgeTextClass: 'text-red-800 dark:text-red-300',
      badgeBorderClass: 'border-red-300 dark:border-red-800',
      recommendedWater: '20 L / acre (Deep)',
      totalWaterRequirementLiters: Math.round(cropArea * litersPerAcre),
      urgency: 'high',
      soilMoistureEst: 26,
      iconType: 'AlertTriangle',
      actionKey: 'irrigation.action.heat',
      defaultAction: 'Schedule deep watering during low-evaporative windows (6:00 AM – 8:30 AM or after sunset). Apply mulch if feasible.',
      triggerReason: `High atmospheric thermal load (${maxTemp.toFixed(1)}°C) with zero rain. High evapotranspiration rate.`,
      cropSpecificTip: cropTip.tip,
      cropSpecificTipKey: cropTip.tipKey,
    }
  }

  // 3. Default / Normal Optimal Conditions
  const normalLitersPerAcre = 12000
  return {
    status: 'normal',
    statusLabel: 'Optimal Conditions',
    statusKey: 'irrigation.status.normal',
    message: 'Optimal conditions. Maintain standard drip irrigation schedule.',
    messageKey: 'irrigation.advisory.normal',
    badgeColor: 'green',
    badgeBgClass: 'bg-emerald-100 dark:bg-emerald-950/60',
    badgeTextClass: 'text-emerald-800 dark:text-emerald-300',
    badgeBorderClass: 'border-emerald-300 dark:border-emerald-800',
    recommendedWater: '10–12 L / acre',
    totalWaterRequirementLiters: Math.round(cropArea * normalLitersPerAcre),
    urgency: 'normal',
    soilMoistureEst: 48,
    iconType: 'Droplets',
    actionKey: 'irrigation.action.normal',
    defaultAction: 'Operate standard drip cycle (45-60 minutes). Check emitter nozzles for uniform flow.',
    triggerReason: `Balanced climatic conditions (${maxTemp.toFixed(1)}°C, ${maxRain.toFixed(1)}mm rain). Stable transpiration.`,
    cropSpecificTip: cropTip.tip,
    cropSpecificTipKey: cropTip.tipKey,
  }
}
