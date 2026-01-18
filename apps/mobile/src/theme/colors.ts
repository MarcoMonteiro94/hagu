/**
 * Hagu Theme Colors
 * Synchronized with web app (Next.js) color system
 *
 * Web uses oklch colors which we convert to hex for React Native compatibility
 * Primary in web is neutral (dark/light), keeping violet as accent
 */

// =============================================================================
// Color Palette (Tailwind CSS compatible)
// =============================================================================

export const palette = {
  // Reds
  red: '#ef4444',

  // Oranges
  orange: '#f97316',
  amber: '#f59e0b',

  // Yellows
  yellow: '#eab308',

  // Greens
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',

  // Blues
  cyan: '#06b6d4',
  blue: '#3b82f6',
  indigo: '#6366f1',

  // Purples
  violet: '#8b5cf6',
  purple: '#a855f7',

  // Pinks
  pink: '#ec4899',

  // Neutrals
  gray: '#6b7280',
  slate: '#64748b',
} as const

export type PaletteColor = keyof typeof palette

// =============================================================================
// Picker Colors (for habit/goal/area color selection)
// =============================================================================

export const pickerColors = [
  palette.red,
  palette.orange,
  palette.yellow,
  palette.green,
  palette.teal,
  palette.blue,
  palette.violet,
  palette.pink,
] as const

export const areaPickerColors = [
  palette.green,
  palette.blue,
  palette.yellow,
  palette.purple,
  palette.red,
  palette.orange,
  palette.pink,
  palette.teal,
  palette.indigo,
  palette.lime,
  palette.violet,
  palette.cyan,
] as const

// =============================================================================
// Priority & Status Colors
// =============================================================================

export const priorityColors = {
  low: { hex: palette.green, bg: `${palette.green}20` },
  medium: { hex: palette.yellow, bg: `${palette.yellow}20` },
  high: { hex: palette.orange, bg: `${palette.orange}20` },
  urgent: { hex: palette.red, bg: `${palette.red}20` },
} as const

export type Priority = keyof typeof priorityColors

export const statusColors = {
  pending: { hex: palette.gray, bg: `${palette.gray}20` },
  in_progress: { hex: palette.blue, bg: `${palette.blue}20` },
  done: { hex: palette.green, bg: `${palette.green}20` },
} as const

export type TaskStatus = keyof typeof statusColors

// =============================================================================
// Achievement Rarity Colors
// =============================================================================

export const rarityColors = {
  common: { hex: '#9ca3af', bg: '#9ca3af20' },
  rare: { hex: palette.blue, bg: `${palette.blue}20` },
  epic: { hex: palette.purple, bg: `${palette.purple}20` },
  legendary: { hex: palette.amber, bg: `${palette.amber}20` },
} as const

export type Rarity = keyof typeof rarityColors

// =============================================================================
// Chart Colors
// =============================================================================

export const chartColors = {
  income: palette.green,
  expense: palette.red,
  balance: palette.blue,
  primary: palette.blue,
  secondary: palette.violet,
  // Additional colors for charts
  red: palette.red,
  orange: palette.orange,
  yellow: palette.yellow,
  green: palette.green,
  blue: palette.blue,
  violet: palette.violet,
  pink: palette.pink,
  teal: palette.teal,
} as const

// =============================================================================
// Theme Colors (matches web globals.css oklch values)
// =============================================================================

export const colors = {
  // Accent colors (violet as app accent, consistent across themes)
  accent: palette.violet,
  accentLight: '#a78bfa',
  accentDark: '#7c3aed',

  // Semantic colors
  success: palette.green,   // Web: #22c55e
  warning: palette.amber,   // Web: #f59e0b
  error: palette.red,       // Web: #ef4444
  info: palette.blue,       // Web: #3b82f6

  // Neutrals
  white: '#ffffff',
  black: '#000000',

  // Light mode (matches web :root oklch values)
  light: {
    background: '#ffffff',      // oklch(1 0 0)
    foreground: '#1a1a1a',      // oklch(0.145 0 0) - adjusted
    card: '#ffffff',            // oklch(1 0 0)
    cardForeground: '#1a1a1a',  // oklch(0.145 0 0)
    muted: '#f7f7f7',           // oklch(0.97 0 0)
    mutedForeground: '#6e6e6e', // oklch(0.556 0 0)
    border: '#e5e5e5',          // oklch(0.922 0 0)
    input: '#e5e5e5',           // oklch(0.922 0 0)
    ring: '#a3a3a3',            // oklch(0.708 0 0)
    primary: '#1a1a1a',         // oklch(0.205 0 0) - dark primary for light mode
    primaryForeground: '#fafafa', // oklch(0.985 0 0)
    secondary: '#f7f7f7',       // oklch(0.97 0 0)
    secondaryForeground: '#1a1a1a', // oklch(0.205 0 0)
  },

  // Dark mode (matches web .dark oklch values)
  dark: {
    background: '#1a1a1a',      // oklch(0.145 0 0)
    foreground: '#fafafa',      // oklch(0.985 0 0)
    card: '#242424',            // oklch(0.205 0 0)
    cardForeground: '#fafafa',  // oklch(0.985 0 0)
    muted: '#333333',           // oklch(0.269 0 0)
    mutedForeground: '#a3a3a3', // oklch(0.708 0 0)
    border: 'rgba(255,255,255,0.1)', // oklch(1 0 0 / 10%)
    input: 'rgba(255,255,255,0.15)', // oklch(1 0 0 / 15%)
    ring: '#6e6e6e',            // oklch(0.556 0 0)
    primary: '#e5e5e5',         // oklch(0.922 0 0) - light primary for dark mode
    primaryForeground: '#1a1a1a', // oklch(0.205 0 0)
    secondary: '#333333',       // oklch(0.269 0 0)
    secondaryForeground: '#fafafa', // oklch(0.985 0 0)
  },
} as const

// =============================================================================
// Color Names (for accessibility)
// =============================================================================

export const colorNames: Record<string, string> = {
  [palette.red]: 'Vermelho',
  [palette.orange]: 'Laranja',
  [palette.amber]: 'Âmbar',
  [palette.yellow]: 'Amarelo',
  [palette.lime]: 'Lima',
  [palette.green]: 'Verde',
  [palette.emerald]: 'Esmeralda',
  [palette.teal]: 'Verde-azulado',
  [palette.cyan]: 'Ciano',
  [palette.blue]: 'Azul',
  [palette.indigo]: 'Índigo',
  [palette.violet]: 'Violeta',
  [palette.purple]: 'Roxo',
  [palette.pink]: 'Rosa',
  [palette.gray]: 'Cinza',
  [palette.slate]: 'Ardósia',
}

export function getColorName(hex: string): string {
  return colorNames[hex] || 'Cor'
}
