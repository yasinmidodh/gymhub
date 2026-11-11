export type ThemeMode = 'dark' | 'light';
export type RadiusOption = 'sharp' | 'rounded' | 'pill';
export type DensityOption = 'comfortable' | 'compact';

export interface AccentColorPreset {
  id: string;
  name: string;
  hex: string;
  rgb: string;
  hoverHex: string;
}

export const ACCENT_PRESETS: AccentColorPreset[] = [
  { id: 'cyan', name: 'Athletic Cyan', hex: '#00E5FF', rgb: '0, 229, 255', hoverHex: '#38BDF8' },
  { id: 'emerald', name: 'Hyper Emerald', hex: '#10B981', rgb: '16, 185, 129', hoverHex: '#34D399' },
  { id: 'blue', name: 'Cobalt Pro', hex: '#3B82F6', rgb: '59, 130, 246', hoverHex: '#60A5FA' },
  { id: 'amber', name: 'Power Amber', hex: '#F59E0B', rgb: '245, 158, 11', hoverHex: '#FBBF24' },
  { id: 'crimson', name: 'Intensity Red', hex: '#EF4444', rgb: '239, 68, 68', hoverHex: '#F87171' },
  { id: 'purple', name: 'Royal Violet', hex: '#8B5CF6', rgb: '139, 92, 246', hoverHex: '#A78BFA' },
];

export interface ThemeSettings {
  mode: ThemeMode;
  accentHex: string;
  accentName: string;
  radius: RadiusOption;
  density: DensityOption;
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'dark',
  accentHex: '#00E5FF',
  accentName: 'Athletic Cyan',
  radius: 'rounded',
  density: 'comfortable',
};

const THEME_STORAGE_KEY = 'gymapp_theme_settings_v1';
const GLOBAL_ACCENT_KEY = 'gymapp_global_gym_accent';

// Convert hex to rgb string 'r, g, b'
export function hexToRgb(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '0, 229, 255';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export function getThemeSettings(): ThemeSettings {
  if (typeof window === 'undefined') return DEFAULT_THEME_SETTINGS;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_THEME_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load theme settings:', e);
  }

  // Check if admin set a global gym accent
  const globalAccent = localStorage.getItem(GLOBAL_ACCENT_KEY);
  if (globalAccent) {
    return { ...DEFAULT_THEME_SETTINGS, accentHex: globalAccent };
  }

  return DEFAULT_THEME_SETTINGS;
}

export function saveThemeSettings(settings: ThemeSettings): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
    applyThemeToDom(settings);
  } catch (e) {
    console.warn('Failed to save theme settings:', e);
  }
}

export function saveGlobalGymAccent(hex: string): void {
  try {
    localStorage.setItem(GLOBAL_ACCENT_KEY, hex);
  } catch (e) {
    console.warn('Failed to save global gym accent:', e);
  }
}

export function applyThemeToDom(settings: ThemeSettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Dark vs Light mode class
  if (settings.mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    document.body.style.backgroundColor = '#000000';
    document.body.style.color = '#F8FAFC';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    document.body.style.backgroundColor = '#F8FAFC';
    document.body.style.color = '#0F172A';
  }

  // 2. CSS variables for dynamic custom accent
  const rgb = hexToRgb(settings.accentHex);
  root.style.setProperty('--brand-accent', settings.accentHex);
  root.style.setProperty('--brand-accent-rgb', rgb);

  // 3. Border radius variables
  const radiusMap: Record<RadiusOption, string> = {
    sharp: '4px',
    rounded: '12px',
    pill: '20px',
  };
  root.style.setProperty('--app-radius', radiusMap[settings.radius] || '12px');
}
