/**
 * Centralized color system for Hagu
 * All colors used across the application should be defined here
 */

// Base color palette - Tailwind CSS colors
export const PALETTE = {
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  pink: '#ec4899',
  gray: '#6b7280',
  slate: '#64748b',
} as const

export type PaletteColor = keyof typeof PALETTE

// Colors available in color pickers (habits, goals, areas)
export const PICKER_COLORS = [
  PALETTE.red,
  PALETTE.orange,
  PALETTE.yellow,
  PALETTE.green,
  PALETTE.teal,
  PALETTE.blue,
  PALETTE.violet,
  PALETTE.pink,
] as const

// Extended picker for areas (more options)
export const AREA_PICKER_COLORS = [
  PALETTE.green,
  PALETTE.blue,
  PALETTE.yellow,
  PALETTE.purple,
  PALETTE.red,
  PALETTE.orange,
  PALETTE.pink,
  PALETTE.teal,
  PALETTE.indigo,
  PALETTE.lime,
  PALETTE.violet,
  PALETTE.cyan,
] as const

// Priority colors with multiple variants
export const PRIORITY_COLORS = {
  low: {
    hex: PALETTE.green,
    text: 'text-green-500',
    bg: 'bg-green-500',
  },
  medium: {
    hex: PALETTE.yellow,
    text: 'text-yellow-500',
    bg: 'bg-yellow-500',
  },
  high: {
    hex: PALETTE.orange,
    text: 'text-orange-500',
    bg: 'bg-orange-500',
  },
  urgent: {
    hex: PALETTE.red,
    text: 'text-red-500',
    bg: 'bg-red-500',
  },
} as const

export type Priority = keyof typeof PRIORITY_COLORS

// Task status colors
export const STATUS_COLORS = {
  pending: {
    hex: PALETTE.gray,
    text: 'text-gray-500',
    bg: 'bg-gray-500',
  },
  in_progress: {
    hex: PALETTE.blue,
    text: 'text-blue-500',
    bg: 'bg-blue-500',
  },
  done: {
    hex: PALETTE.green,
    text: 'text-green-500',
    bg: 'bg-green-500',
  },
} as const

export type TaskStatus = keyof typeof STATUS_COLORS

// Achievement rarity colors
export const RARITY_COLORS = {
  common: {
    hex: '#9ca3af',
    text: 'text-gray-400',
    bg: 'bg-gray-400',
  },
  rare: {
    hex: PALETTE.blue,
    text: 'text-blue-500',
    bg: 'bg-blue-500',
  },
  epic: {
    hex: PALETTE.purple,
    text: 'text-purple-500',
    bg: 'bg-purple-500',
  },
  legendary: {
    hex: PALETTE.amber,
    text: 'text-amber-500',
    bg: 'bg-amber-500',
  },
} as const

export type Rarity = keyof typeof RARITY_COLORS

// Chart colors (for consistency across visualizations)
export const CHART_COLORS = {
  income: PALETTE.green,
  expense: PALETTE.red,
  balance: PALETTE.blue,
  primary: PALETTE.blue,
  secondary: PALETTE.violet,
} as const

// Color name mapping for accessibility
export const COLOR_NAMES: Record<string, string> = {
  [PALETTE.red]: 'Vermelho',
  [PALETTE.orange]: 'Laranja',
  [PALETTE.amber]: 'Âmbar',
  [PALETTE.yellow]: 'Amarelo',
  [PALETTE.lime]: 'Lima',
  [PALETTE.green]: 'Verde',
  [PALETTE.emerald]: 'Esmeralda',
  [PALETTE.teal]: 'Verde-azulado',
  [PALETTE.cyan]: 'Ciano',
  [PALETTE.blue]: 'Azul',
  [PALETTE.indigo]: 'Índigo',
  [PALETTE.violet]: 'Violeta',
  [PALETTE.purple]: 'Roxo',
  [PALETTE.pink]: 'Rosa',
  [PALETTE.gray]: 'Cinza',
  [PALETTE.slate]: 'Ardósia',
}

// Helper to get color name for accessibility
export function getColorName(hex: string): string {
  return COLOR_NAMES[hex] || 'Cor'
}
