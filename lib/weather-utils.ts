/**
 * Weather Utility — Open-Meteo Integration for Krishi Mitra
 * Free, fast, hyper-local forecasting with 8-second rural network resiliency.
 */

export interface WeatherForecastDay {
  date: string;
  dayName: string;
  dayKey?: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  weatherCode: number;
  weatherDescription: string;
  translationKey: string;
  iconType: 'Sun' | 'Cloud' | 'CloudSun' | 'CloudRain' | 'CloudLightning' | 'CloudSnow' | 'CloudFog';
}

export interface WeatherData {
  current: {
    temperature: number;
    windSpeed: number;
    weatherCode: number;
    weatherDescription: string;
    translationKey: string;
    iconType: 'Sun' | 'Cloud' | 'CloudSun' | 'CloudRain' | 'CloudLightning' | 'CloudSnow' | 'CloudFog';
    time: string;
  };
  daily: WeatherForecastDay[];
  locationName: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  advisory: {
    titleKey: string;
    defaultTitle: string;
    riskKey: string;
    defaultRisk: string;
    isHighRisk: boolean;
    descKey: string;
    defaultDesc: string;
    actionKey: string;
    defaultAction: string;
  };
  isFallback?: boolean;
}

export const DEFAULT_COORDINATES = {
  lat: 18.6298,
  lon: 73.7997,
  name: 'Pimpri-Chinchwad, Maharashtra',
};

/**
 * Maps WMO weather interpretation codes to conditions and icons
 */
export function getWeatherDetailsFromCode(code: number): {
  description: string;
  translationKey: string;
  iconType: 'Sun' | 'Cloud' | 'CloudSun' | 'CloudRain' | 'CloudLightning' | 'CloudSnow' | 'CloudFog';
} {
  switch (code) {
    case 0:
      return { description: 'Clear Sky', translationKey: 'weather.condition.clear', iconType: 'Sun' };
    case 1:
      return { description: 'Mainly Clear', translationKey: 'weather.condition.mainlyClear', iconType: 'CloudSun' };
    case 2:
      return { description: 'Partly Cloudy', translationKey: 'weather.condition.partlyCloudy', iconType: 'CloudSun' };
    case 3:
      return { description: 'Overcast', translationKey: 'weather.condition.overcast', iconType: 'Cloud' };
    case 45:
    case 48:
      return { description: 'Fog / Mist', translationKey: 'weather.condition.fog', iconType: 'CloudFog' };
    case 51:
    case 53:
    case 55:
      return { description: 'Light Drizzle', translationKey: 'weather.condition.drizzle', iconType: 'CloudRain' };
    case 61:
    case 63:
      return { description: 'Moderate Rain', translationKey: 'weather.condition.rain', iconType: 'CloudRain' };
    case 65:
      return { description: 'Heavy Rain', translationKey: 'weather.condition.heavyRain', iconType: 'CloudRain' };
    case 80:
    case 81:
    case 82:
      return { description: 'Rain Showers', translationKey: 'weather.condition.showers', iconType: 'CloudRain' };
    case 95:
      return { description: 'Thunderstorm', translationKey: 'weather.condition.thunderstorm', iconType: 'CloudLightning' };
    case 96:
    case 99:
      return { description: 'Severe Thunderstorm & Hail', translationKey: 'weather.condition.hail', iconType: 'CloudLightning' };
    case 71:
    case 73:
    case 75:
      return { description: 'Snowfall', translationKey: 'weather.condition.snow', iconType: 'CloudSnow' };
    default:
      return { description: 'Partly Cloudy', translationKey: 'weather.condition.partlyCloudy', iconType: 'CloudSun' };
  }
}

const DAY_KEYS = [
  'weather.day.today',
  'weather.day.tomorrow',
  'weather.day.day3',
  'weather.day.day4',
  'weather.day.day5',
  'weather.day.day6',
  'weather.day.day7',
];

/**
 * Builds realistic agricultural advisory based on temperatures and rainfall
 */
function buildAgriculturalAdvisory(
  currentTemp: number,
  maxWeeklyTemp: number,
  totalRain: number,
  hasThunderstorm: boolean
): WeatherData['advisory'] {
  if (hasThunderstorm || totalRain > 25) {
    return {
      titleKey: 'weather.advisory.rainAlertTitle',
      defaultTitle: 'Heavy rain & thunderstorm forecast — protect standing crops',
      riskKey: 'weather.highRisk',
      defaultRisk: 'High Risk',
      isHighRisk: true,
      descKey: 'weather.advisory.rainAlertDesc',
      defaultDesc: 'Substantial precipitation expected over next 48 hours. Excessive moisture may cause root rot or lodging.',
      actionKey: 'weather.advisory.rainAlertAction',
      defaultAction: 'Clean field drainage channels immediately. Postpone all chemical spraying and urea broadcasting until rainfall ceases.',
    };
  }

  if (maxWeeklyTemp >= 36) {
    return {
      titleKey: 'weather.advisoryTitle',
      defaultTitle: 'Heatwave & thermal stress advisory — next 3 days',
      riskKey: 'weather.highRisk',
      defaultRisk: 'Moderate Risk',
      isHighRisk: true,
      descKey: 'weather.advisoryDesc',
      defaultDesc: 'Day temperatures expected to peak above 36°C. High evapotranspiration accelerates soil moisture depletion.',
      actionKey: 'weather.actionDesc',
      defaultAction: 'Irrigate in early morning or evening. Apply straw mulch where possible to reduce soil water evaporation.',
    };
  }

  return {
    titleKey: 'weather.advisory.optimalTitle',
    defaultTitle: 'Favorable farming weather window',
    riskKey: 'weather.advisory.lowRisk',
    defaultRisk: 'Low Risk',
    isHighRisk: false,
    descKey: 'weather.advisory.optimalDesc',
    defaultDesc: 'Mild temperatures and stable atmospheric conditions. Optimal window for active farm operations.',
    actionKey: 'weather.advisory.optimalAction',
    defaultAction: 'Ideal conditions for foliar nutrient sprays, weeding, hoeing, and grain/onion curing.',
  };
}

/**
 * Formats Open-Meteo JSON into structured WeatherData
 */
function formatOpenMeteoResponse(
  data: any,
  lat: number,
  lon: number,
  locationName: string
): WeatherData {
  const current = data.current_weather || {};
  const daily = data.daily || {};
  const currentDetails = getWeatherDetailsFromCode(current.weathercode ?? 1);

  const times: string[] = daily.time || [];
  const maxTemps: number[] = daily.temperature_2m_max || [];
  const minTemps: number[] = daily.temperature_2m_min || [];
  const precipitations: number[] = daily.precipitation_sum || [];
  const codes: number[] = daily.weathercode || [];

  const formattedDays: WeatherForecastDay[] = times.slice(0, 7).map((dateStr, i) => {
    const code = codes[i] ?? 0;
    const details = getWeatherDetailsFromCode(code);
    const dateObj = new Date(dateStr);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });

    return {
      date: dateStr,
      dayName,
      dayKey: DAY_KEYS[i],
      maxTemp: Math.round(maxTemps[i] ?? 30),
      minTemp: Math.round(minTemps[i] ?? 21),
      precipitation: Number((precipitations[i] ?? 0).toFixed(1)),
      weatherCode: code,
      weatherDescription: details.description,
      translationKey: details.translationKey,
      iconType: details.iconType,
    };
  });

  const maxWeeklyTemp = Math.max(...maxTemps, current.temperature ?? 30);
  const totalRain = precipitations.reduce((acc, v) => acc + (v || 0), 0);
  const hasThunderstorm = codes.some((c) => c === 95 || c === 96 || c === 99);
  const advisory = buildAgriculturalAdvisory(current.temperature ?? 29, maxWeeklyTemp, totalRain, hasThunderstorm);

  return {
    current: {
      temperature: Number((current.temperature ?? 29).toFixed(1)),
      windSpeed: Number((current.windspeed ?? 12).toFixed(1)),
      weatherCode: current.weathercode ?? 1,
      weatherDescription: currentDetails.description,
      translationKey: currentDetails.translationKey,
      iconType: currentDetails.iconType,
      time: current.time || new Date().toISOString(),
    },
    daily: formattedDays,
    locationName,
    coordinates: { lat, lon },
    advisory,
    isFallback: false,
  };
}

/**
 * Realistic Fallback Demo Data for Pimpri-Chinchwad / Maharashtra
 */
export function getFallbackWeatherData(
  lat: number = DEFAULT_COORDINATES.lat,
  lon: number = DEFAULT_COORDINATES.lon,
  locationName: string = DEFAULT_COORDINATES.name
): WeatherData {
  const today = new Date();
  const days: WeatherForecastDay[] = [
    { date: today.toISOString().split('T')[0], dayName: 'Today', dayKey: 'weather.day.today', maxTemp: 31, minTemp: 21, precipitation: 0.5, weatherCode: 1, weatherDescription: 'Mainly Clear', translationKey: 'weather.condition.mainlyClear', iconType: 'CloudSun' },
    { date: new Date(today.getTime() + 86400000).toISOString().split('T')[0], dayName: 'Tomorrow', dayKey: 'weather.day.tomorrow', maxTemp: 32, minTemp: 22, precipitation: 1.2, weatherCode: 2, weatherDescription: 'Partly Cloudy', translationKey: 'weather.condition.partlyCloudy', iconType: 'CloudSun' },
    { date: new Date(today.getTime() + 86400000 * 2).toISOString().split('T')[0], dayName: 'Day 3', dayKey: 'weather.day.day3', maxTemp: 30, minTemp: 21, precipitation: 6.8, weatherCode: 80, weatherDescription: 'Rain Showers', translationKey: 'weather.condition.showers', iconType: 'CloudRain' },
    { date: new Date(today.getTime() + 86400000 * 3).toISOString().split('T')[0], dayName: 'Day 4', dayKey: 'weather.day.day4', maxTemp: 29, minTemp: 20, precipitation: 14.5, weatherCode: 95, weatherDescription: 'Thunderstorm', translationKey: 'weather.condition.thunderstorm', iconType: 'CloudLightning' },
    { date: new Date(today.getTime() + 86400000 * 4).toISOString().split('T')[0], dayName: 'Day 5', dayKey: 'weather.day.day5', maxTemp: 30, minTemp: 21, precipitation: 3.2, weatherCode: 51, weatherDescription: 'Light Drizzle', translationKey: 'weather.condition.drizzle', iconType: 'CloudRain' },
    { date: new Date(today.getTime() + 86400000 * 5).toISOString().split('T')[0], dayName: 'Day 6', dayKey: 'weather.day.day6', maxTemp: 31, minTemp: 22, precipitation: 0.0, weatherCode: 1, weatherDescription: 'Mainly Clear', translationKey: 'weather.condition.mainlyClear', iconType: 'CloudSun' },
    { date: new Date(today.getTime() + 86400000 * 6).toISOString().split('T')[0], dayName: 'Day 7', dayKey: 'weather.day.day7', maxTemp: 32, minTemp: 22, precipitation: 0.0, weatherCode: 0, weatherDescription: 'Clear Sky', translationKey: 'weather.condition.clear', iconType: 'Sun' },
  ];

  return {
    current: {
      temperature: 29.4,
      windSpeed: 12.8,
      weatherCode: 1,
      weatherDescription: 'Mainly Clear',
      translationKey: 'weather.condition.mainlyClear',
      iconType: 'CloudSun',
      time: today.toISOString(),
    },
    daily: days,
    locationName,
    coordinates: { lat, lon },
    advisory: {
      titleKey: 'weather.advisoryTitle',
      defaultTitle: 'Pre-monsoon shower alert — maintain field drainage',
      riskKey: 'weather.highRisk',
      defaultRisk: 'Moderate Risk',
      isHighRisk: true,
      descKey: 'weather.advisoryDesc',
      defaultDesc: 'Showers expected around mid-week in Pimpri-Chinchwad / Pune district. Soil moisture levels will remain elevated.',
      actionKey: 'weather.actionDesc',
      defaultAction: 'Ensure crop furrows are unobstructed. Delay heavy nitrogen fertilization until post-rainfall.',
    },
    isFallback: true,
  };
}

/**
 * Standard client-safe Open-Meteo async fetcher with 8-second timeout
 */
export async function fetchWeatherForecast(
  lat: number = DEFAULT_COORDINATES.lat,
  lon: number = DEFAULT_COORDINATES.lon,
  locationName: string = DEFAULT_COORDINATES.name
): Promise<WeatherData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const data = await res.json();
    return formatOpenMeteoResponse(data, lat, lon, locationName);
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[fetchWeatherForecast] Open-Meteo fetch failed/timed out, serving resilient fallback:', error);
    return getFallbackWeatherData(lat, lon, locationName);
  }
}
