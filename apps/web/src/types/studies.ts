// Studies Module Types

import type { Block } from '@blocknote/core'

// Notebook (Caderno)
export interface Notebook {
  id: string
  userId: string
  title: string
  description?: string
  color: string
  icon?: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface NotebookWithPageCount extends Notebook {
  pageCount: number
}

// Notebook Page (Página/Nota)
export interface NotebookPage {
  id: string
  notebookId: string
  userId: string
  title: string
  content: Block[] // BlockNote content
  order: number
  createdAt: string
  updatedAt: string
}

export interface NotebookPageSummary {
  id: string
  notebookId: string
  title: string
  order: number
  createdAt: string
  updatedAt: string
}

// Form types
export interface CreateNotebookData {
  title: string
  description?: string
  color?: string
  icon?: string
}

export interface UpdateNotebookData {
  title?: string
  description?: string
  color?: string
  icon?: string
  order?: number
}

export interface CreatePageData {
  notebookId: string
  title: string
  content?: Block[]
}

export interface UpdatePageData {
  title?: string
  content?: Block[]
  order?: number
}

// Default colors for notebooks
export const NOTEBOOK_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
] as const

// Default icons for notebooks (Lucide icon names)
export const NOTEBOOK_ICONS = [
  'book',
  'book-open',
  'notebook',
  'file-text',
  'graduation-cap',
  'brain',
  'lightbulb',
  'pencil',
  'bookmark',
  'folder',
  'star',
  'heart',
  'code',
  'flask-conical',
  'calculator',
  'music',
  'palette',
  'globe',
] as const

export type NotebookColor = (typeof NOTEBOOK_COLORS)[number]
export type NotebookIcon = (typeof NOTEBOOK_ICONS)[number]
