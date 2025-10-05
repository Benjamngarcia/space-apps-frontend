export interface AQILevel {
  value: number;
  label: string;
  description: string;
  textColor: string;
  bgColor: string;
  ringColor: string;
  borderColor: string;
}

export const AQI_LEVELS: Record<string, AQILevel> = {
  good: {
    value: 0,
    label: 'Good',
    description: 'Air quality is satisfactory',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    ringColor: 'ring-green-200',
    borderColor: 'border-green-200',
  },
  moderate: {
    value: 51,
    label: 'Moderate',
    description: 'Air quality is acceptable',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    ringColor: 'ring-yellow-200',
    borderColor: 'border-yellow-200',
  },
  unhealthyForSensitive: {
    value: 101,
    label: 'Unhealthy for Sensitive',
    description: 'Sensitive individuals may experience symptoms',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    ringColor: 'ring-orange-200',
    borderColor: 'border-orange-200',
  },
  unhealthy: {
    value: 151,
    label: 'Unhealthy',
    description: 'Everyone may experience health effects',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    ringColor: 'ring-red-200',
    borderColor: 'border-red-200',
  },
  veryUnhealthy: {
    value: 201,
    label: 'Very Unhealthy',
    description: 'Health warnings for everyone',
    textColor: 'text-red-800',
    bgColor: 'bg-red-100',
    ringColor: 'ring-red-300',
    borderColor: 'border-red-300',
  },
  hazardous: {
    value: 301,
    label: 'Hazardous',
    description: 'Emergency conditions',
    textColor: 'text-red-900',
    bgColor: 'bg-red-200',
    ringColor: 'ring-red-400',
    borderColor: 'border-red-400',
  },
};

export function getAQILevel(value: number): AQILevel {
  if (value <= 50) return AQI_LEVELS.good;
  if (value <= 100) return AQI_LEVELS.moderate;
  if (value <= 150) return AQI_LEVELS.unhealthyForSensitive;
  if (value <= 200) return AQI_LEVELS.unhealthy;
  if (value <= 300) return AQI_LEVELS.veryUnhealthy;
  return AQI_LEVELS.hazardous;
}

// Pollutant-specific color mappings
export function getPollutantColor(pollutant: string, value: number) {
  const level = getAQILevel(value);
  return {
    text: level.textColor,
    bg: level.bgColor,
    ring: level.ringColor,
    border: level.borderColor,
  };
}

export const BRAND_COLORS = {
  primary: {
    50: 'bg-blue-50',
    100: 'bg-blue-100',
    500: 'bg-blue-500',
    600: 'bg-blue-600',
    700: 'bg-blue-700',
  },
  secondary: {
    50: 'bg-cyan-50',
    100: 'bg-cyan-100',
    400: 'bg-cyan-400',
    500: 'bg-cyan-500',
    600: 'bg-cyan-600',
  },
  text: {
    primary: 'text-blue-600',
    secondary: 'text-cyan-600',
    muted: 'text-slate-600',
  },
  ring: {
    primary: 'ring-blue-500',
    secondary: 'ring-cyan-400',
  },
};
