import { AccentColorId, AppearanceConfig, ThemeMode } from '../types/optimizer';

export interface AccentPreset {
  id: AccentColorId;
  label: string;
  swatch: string;
  rgb: string;
  solid: string;
  hover: string;
  active: string;
  fg: string;
  textDark: string;
  textLight: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'azul',
    label: 'Azul',
    swatch: '#3B82F6',
    rgb: '59, 130, 246',
    solid: '#3B82F6',
    hover: '#2563EB',
    active: '#1D4ED8',
    fg: '#FFFFFF',
    textDark: '#60A5FA',
    textLight: '#2563EB',
  },
  {
    id: 'roxo',
    label: 'Roxo',
    swatch: '#8B5CF6',
    rgb: '139, 92, 246',
    solid: '#8B5CF6',
    hover: '#7C3AED',
    active: '#6D28D9',
    fg: '#FFFFFF',
    textDark: '#A78BFA',
    textLight: '#7C3AED',
  },
  {
    id: 'vermelho',
    label: 'Vermelho',
    swatch: '#EF4444',
    rgb: '239, 68, 68',
    solid: '#EF4444',
    hover: '#DC2626',
    active: '#B91C1C',
    fg: '#FFFFFF',
    textDark: '#F87171',
    textLight: '#DC2626',
  },
  {
    id: 'amarelo',
    label: 'Amarelo',
    swatch: '#EAB308',
    rgb: '234, 179, 8',
    solid: '#EAB308',
    hover: '#CA8A04',
    active: '#A16207',
    fg: '#111317',
    textDark: '#FACC15',
    textLight: '#A16207',
  },
  {
    id: 'laranja',
    label: 'Laranja',
    swatch: '#F97316',
    rgb: '249, 115, 22',
    solid: '#F97316',
    hover: '#EA580C',
    active: '#C2410C',
    fg: '#FFFFFF',
    textDark: '#FB923C',
    textLight: '#C2410C',
  },
  {
    id: 'verde',
    label: 'Verde',
    swatch: '#22C55E',
    rgb: '34, 197, 94',
    solid: '#16A34A',
    hover: '#15803D',
    active: '#166534',
    fg: '#FFFFFF',
    textDark: '#4ADE80',
    textLight: '#15803D',
  },
  {
    id: 'rosa',
    label: 'Rosa',
    swatch: '#EC4899',
    rgb: '236, 72, 153',
    solid: '#EC4899',
    hover: '#DB2777',
    active: '#BE185D',
    fg: '#FFFFFF',
    textDark: '#F472B6',
    textLight: '#DB2777',
  },
];

export const DEFAULT_APPEARANCE: AppearanceConfig = {
  themeMode: 'dark',
  accentColor: 'azul',
  starfieldEnabled: true,
};

export function getAccentPreset(id: AccentColorId): AccentPreset {
  return ACCENT_PRESETS.find((p) => p.id === id) ?? ACCENT_PRESETS[0];
}

export function applyAppearanceToDocument(appearance: AppearanceConfig): void {
  const root = document.documentElement;
  const preset = getAccentPreset(appearance.accentColor);
  const isLight: boolean = appearance.themeMode === 'light';

  root.setAttribute('data-theme', appearance.themeMode);
  root.setAttribute('data-accent', appearance.accentColor);
  root.style.colorScheme = appearance.themeMode;

  root.style.setProperty('--wp-accent', preset.solid);
  root.style.setProperty('--wp-accent-hover', preset.hover);
  root.style.setProperty('--wp-accent-active', preset.active);
  root.style.setProperty('--wp-accent-fg', preset.fg);
  root.style.setProperty('--wp-accent-rgb', preset.rgb);
  root.style.setProperty(
    '--wp-accent-text',
    isLight ? preset.textLight : preset.textDark
  );
  root.style.setProperty(
    '--wp-accent-soft',
    isLight ? `rgba(${preset.rgb}, 0.11)` : `rgba(${preset.rgb}, 0.16)`
  );
  root.style.setProperty(
    '--wp-accent-border',
    isLight ? `rgba(${preset.rgb}, 0.45)` : `rgba(${preset.rgb}, 0.55)`
  );
}

export function isValidThemeMode(val: unknown): val is ThemeMode {
  return val === 'dark' || val === 'light';
}

export function isValidAccentColor(val: unknown): val is AccentColorId {
  return ACCENT_PRESETS.some((p) => p.id === val);
}
