// Design system constants for consistent styling across the app
// mobile/universal-coffee-shop/constants/theme.js

export const Colors = {
  // Primary
  background: '#F8FAFC',
  backgroundAlt: '#FFFFFF',
  primary: '#101828',
  primaryLight: '#1F2937',
  
  // Text
  text: '#101828',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textLight: '#CBD5E1',
  
  // Accents
  accent: '#F97316',
  accentLight: '#FFEDD5',
  espresso: '#101828',
  crema: '#F8FAFC',
  error: '#FF3B30',
  success: '#15803D',
  warning: '#D97706',
  info: '#2563EB',
  
  // UI Elements
  border: '#E5E7EB',
  borderDark: '#101828',
  divider: '#E5E7EB',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Backgrounds
  cardBg: '#FFFFFF',
  inputBg: '#FFFFFF',
  disabledBg: '#E2E8F0',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 28,
  circle: 9999,
};

export const Typography = {
  // Font Families
  primary: 'Anton-Regular',
  stylized: 'Canopee',
  
  // Font Sizes
  tiny: 12,
  small: 13,
  body: 14,
  bodyLarge: 16,
  subtitle: 18,
  title: 20,
  heading: 24,
  large: 32,
  xlarge: 48,
  xxlarge: 64,
};

export const Shadows = {
  small: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  medium: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const Buttons = {
  primary: {
    height: 56,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
    ...Shadows.large,
  },
  secondary: {
    height: 56,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.circle,
    backgroundColor: Colors.backgroundAlt,
    ...Shadows.medium,
  },
};

export const Inputs = {
  default: {
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: Spacing.lg,
  },
};

export const Cards = {
  default: {
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.cardBg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  flat: {
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.cardBg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
};
