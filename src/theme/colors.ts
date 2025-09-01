export type ColorTokens = {
  primary: string;
  primaryDark: string;
  secondary: string;
  danger: string;
  warning: string;
  bg: string;
  bgMuted: string;
  text: string;
  textMuted: string;
  border: string;
};

// Backwards compatibility: existing screens import `colors` from '../theme'
// Backwards compatibility: existing screens import `colors` from '../theme'
// Will point to current light theme until screens adopt useTheme()

export const lightColors: ColorTokens = {
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  secondary: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  bg: '#FFFFFF',
  bgMuted: '#F8FAFC',
  text: '#111827',
  textMuted: '#6B7280',
  border: '#E5E7EB',
};

export const darkColors: ColorTokens = {
  primary: '#4F9CF5',
  primaryDark: '#1E63D6',
  secondary: '#22C38B',
  danger: '#F16B6B',
  warning: '#F4B93A',
  bg: '#0B1220',
  bgMuted: '#0D1526',
  text: '#E6EAF2',
  textMuted: '#A8B0BD',
  border: '#243047',
};

// Default export used by existing screens (will be replaced by useTheme progressively)
export const colors: ColorTokens = lightColors;
