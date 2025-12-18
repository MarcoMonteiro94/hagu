import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { LifeArea, MetricEntry } from '@/types'

interface AreasState {
  areas: LifeArea[]
  metrics: MetricEntry[]

  // Area actions
  addArea: (area: Omit<LifeArea, 'id' | 'createdAt' | 'isDefault' | 'order'>) => void
  updateArea: (id: string, updates: Partial<Omit<LifeArea, 'id' | 'createdAt' | 'isDefault'>>) => void
  deleteArea: (id: string) => void
  reorderAreas: (orderedIds: string[]) => void

  // Metric actions
  addMetric: (metric: Omit<MetricEntry, 'id' | 'createdAt'>) => void
  updateMetric: (id: string, updates: Partial<Omit<MetricEntry, 'id' | 'createdAt'>>) => void
  deleteMetric: (id: string) => void

  // Queries
  getAreaById: (id: string) => LifeArea | undefined
  getAreaBySlug: (slug: string) => LifeArea | undefined
  getMetricsByArea: (areaId: string) => MetricEntry[]
  getMetricsByType: (areaId: string, type: string) => MetricEntry[]
}

function generateId(): string {
  return crypto.randomUUID()
}

// Default life areas
const DEFAULT_AREAS: LifeArea[] = [
  {
    id: 'health',
    name: 'Health',
    slug: 'health',
    color: '#22c55e', // green-500
    icon: 'heart',
    isDefault: true,
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'studies',
    name: 'Studies',
    slug: 'studies',
    color: '#3b82f6', // blue-500
    icon: 'book',
    isDefault: true,
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'finances',
    name: 'Finances',
    slug: 'finances',
    color: '#eab308', // yellow-500
    icon: 'wallet',
    isDefault: true,
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'hobbies',
    name: 'Hobbies',
    slug: 'hobbies',
    color: '#a855f7', // purple-500
    icon: 'palette',
    isDefault: true,
    order: 3,
    createdAt: new Date().toISOString(),
  },
]

export const useAreasStore = create<AreasState>()(
  persist(
    (set, get) => ({
      areas: DEFAULT_AREAS,
      metrics: [],

      // Area actions
      addArea: (areaData) => {
        const areas = get().areas
        const maxOrder = Math.max(...areas.map((a) => a.order), -1)

        const area: LifeArea = {
          ...areaData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          isDefault: false,
          order: maxOrder + 1,
        }
        set((state) => ({ areas: [...state.areas, area] }))
      },

      updateArea: (id, updates) => {
        set((state) => ({
          areas: state.areas.map((area) =>
            area.id === id ? { ...area, ...updates } : area
          ),
        }))
      },

      deleteArea: (id) => {
        const area = get().areas.find((a) => a.id === id)
        // Prevent deleting default areas
        if (area?.isDefault) return

        set((state) => ({
          areas: state.areas.filter((area) => area.id !== id),
          // Also remove metrics for this area
          metrics: state.metrics.filter((metric) => metric.areaId !== id),
        }))
      },

      reorderAreas: (orderedIds) => {
        set((state) => ({
          areas: state.areas.map((area) => ({
            ...area,
            order: orderedIds.indexOf(area.id),
          })),
        }))
      },

      // Metric actions
      addMetric: (metricData) => {
        const metric: MetricEntry = {
          ...metricData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ metrics: [...state.metrics, metric] }))
      },

      updateMetric: (id, updates) => {
        set((state) => ({
          metrics: state.metrics.map((metric) =>
            metric.id === id ? { ...metric, ...updates } : metric
          ),
        }))
      },

      deleteMetric: (id) => {
        set((state) => ({
          metrics: state.metrics.filter((metric) => metric.id !== id),
        }))
      },

      // Queries
      getAreaById: (id) => get().areas.find((area) => area.id === id),

      getAreaBySlug: (slug) => get().areas.find((area) => area.slug === slug),

      getMetricsByArea: (areaId) =>
        get().metrics.filter((metric) => metric.areaId === areaId),

      getMetricsByType: (areaId, type) =>
        get()
          .metrics.filter((metric) => metric.areaId === areaId && metric.type === type)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }),
    {
      name: 'hagu-areas',
    }
  )
)

// Selector hooks
export function useOrderedAreas(): LifeArea[] {
  return useAreasStore(
    useShallow((state) => [...state.areas].sort((a, b) => a.order - b.order))
  )
}
