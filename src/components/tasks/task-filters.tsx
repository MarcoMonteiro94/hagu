'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOrderedAreas } from '@/hooks/queries/use-areas'
import { Filter, X } from 'lucide-react'
import type { TaskPriority } from '@/types'

export type DateFilter = 'all' | 'today' | 'upcoming' | 'overdue'

export interface TaskFilters {
  areaId: string | null
  priority: TaskPriority | null
  dateFilter: DateFilter
}

interface TaskFiltersProps {
  filters: TaskFilters
  onFiltersChange: (filters: TaskFilters) => void
}

const DEFAULT_FILTERS: TaskFilters = {
  areaId: null,
  priority: null,
  dateFilter: 'all',
}

export function TaskFiltersComponent({ filters, onFiltersChange }: TaskFiltersProps) {
  const t = useTranslations('tasks')
  const { data: areas = [] } = useOrderedAreas()

  const activeFilterCount = [
    filters.areaId,
    filters.priority,
    filters.dateFilter !== 'all' ? filters.dateFilter : null,
  ].filter(Boolean).length

  const handleReset = () => {
    onFiltersChange(DEFAULT_FILTERS)
  }

  const handleAreaChange = (value: string) => {
    onFiltersChange({
      ...filters,
      areaId: value === 'all' ? null : value,
    })
  }

  const handlePriorityChange = (value: string) => {
    onFiltersChange({
      ...filters,
      priority: value === 'all' ? null : (value as TaskPriority),
    })
  }

  const handleDateFilterChange = (value: string) => {
    onFiltersChange({
      ...filters,
      dateFilter: value as DateFilter,
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          {t('filters.all')}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{t('filters.all')}</h4>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleReset}
              >
                <X className="mr-1 h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Período</label>
            <Select value={filters.dateFilter} onValueChange={handleDateFilterChange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.all')}</SelectItem>
                <SelectItem value="today">{t('filters.today')}</SelectItem>
                <SelectItem value="upcoming">{t('filters.upcoming')}</SelectItem>
                <SelectItem value="overdue">{t('filters.overdue')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">{t('priority')}</label>
            <Select
              value={filters.priority || 'all'}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.all')}</SelectItem>
                <SelectItem value="urgent">{t('priorityUrgent')}</SelectItem>
                <SelectItem value="high">{t('priorityHigh')}</SelectItem>
                <SelectItem value="medium">{t('priorityMedium')}</SelectItem>
                <SelectItem value="low">{t('priorityLow')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Area Filter */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Área</label>
            <Select
              value={filters.areaId || 'all'}
              onValueChange={handleAreaChange}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.all')}</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      {area.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Filter function to apply filters to tasks
export function filterTasks<T extends { dueDate?: string; priority?: TaskPriority; areaId?: string; status: string }>(
  tasks: T[],
  filters: TaskFilters
): T[] {
  const today = new Date().toISOString().split('T')[0]

  return tasks.filter((task) => {
    // Area filter
    if (filters.areaId && task.areaId !== filters.areaId) {
      return false
    }

    // Priority filter
    if (filters.priority && task.priority !== filters.priority) {
      return false
    }

    // Date filter
    if (filters.dateFilter !== 'all') {
      // Tasks without due date only show when not filtering by date
      if (!task.dueDate) {
        return false
      }

      switch (filters.dateFilter) {
        case 'today':
          if (task.dueDate !== today) return false
          break
        case 'overdue':
          if (task.dueDate >= today || task.status === 'done') return false
          break
        case 'upcoming': {
          const nextWeek = new Date()
          nextWeek.setDate(nextWeek.getDate() + 7)
          const nextWeekStr = nextWeek.toISOString().split('T')[0]
          if (task.dueDate < today || task.dueDate > nextWeekStr) return false
          break
        }
      }
    }

    return true
  })
}

export { DEFAULT_FILTERS }
