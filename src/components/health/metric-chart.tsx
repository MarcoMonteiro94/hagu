'use client'

import { useMemo } from 'react'
import type { MetricEntry } from '@/types'

interface MetricChartProps {
  data: MetricEntry[]
  color: string
  unit: string
  type: string
}

const MOOD_LABELS = ['', 'Muito mal', 'Mal', 'Neutro', 'Bem', 'Muito bem']
const ENERGY_LABELS = ['', 'Exausto', 'Cansado', 'Normal', 'Energizado', 'Muito energizado']

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatValue(value: number, type: string, unit: string): string {
  if (type === 'mood') return MOOD_LABELS[value] || String(value)
  if (type === 'energy') return ENERGY_LABELS[value] || String(value)
  return `${value}${unit ? ` ${unit}` : ''}`
}

export function MetricChart({ data, color, unit, type }: MetricChartProps) {
  const chartData = useMemo(() => {
    // Get last 30 entries or all if less
    const entries = data.slice(-30)
    if (entries.length === 0) return null

    const values = entries.map((e) => e.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const range = maxValue - minValue || 1

    // Chart dimensions
    const width = 100
    const height = 40
    const padding = 2

    // Calculate points
    const points = entries.map((entry, index) => {
      const x = padding + (index / (entries.length - 1 || 1)) * (width - padding * 2)
      const y = height - padding - ((entry.value - minValue) / range) * (height - padding * 2)
      return { x, y, entry }
    })

    // Create SVG path
    const pathD = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')

    // Create area path (for gradient fill)
    const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

    return {
      entries,
      points,
      pathD,
      areaD,
      minValue,
      maxValue,
      width,
      height,
    }
  }, [data])

  if (!chartData || chartData.entries.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        Nenhum dado disponível
      </div>
    )
  }

  const { entries, points, pathD, areaD, minValue, maxValue, width, height } = chartData

  // Calculate stats
  const values = entries.map((e) => e.value)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const latest = entries[entries.length - 1]
  const first = entries[0]
  const change = latest.value - first.value

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Mínimo</p>
          <p className="font-semibold">{formatValue(minValue, type, unit)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Média</p>
          <p className="font-semibold">
            {formatValue(Math.round(avg * 10) / 10, type, unit)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Máximo</p>
          <p className="font-semibold">{formatValue(maxValue, type, unit)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-40">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-full w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaD} fill={`url(#gradient-${type})`} />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="1"
              fill={color}
              className="cursor-pointer"
            >
              <title>
                {formatDate(point.entry.date)}: {formatValue(point.entry.value, type, unit)}
              </title>
            </circle>
          ))}
        </svg>
      </div>

      {/* Recent Entries */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Últimos registros</p>
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {[...entries].reverse().slice(0, 10).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{formatDate(entry.date)}</span>
              <span className="font-medium">{formatValue(entry.value, type, unit)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Change indicator */}
      {entries.length > 1 && (
        <div className="rounded-lg bg-muted/50 p-3 text-center text-sm">
          <span className="text-muted-foreground">Variação no período: </span>
          <span
            className={`font-medium ${
              change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : ''
            }`}
          >
            {change > 0 ? '+' : ''}
            {type === 'mood' || type === 'energy'
              ? change
              : `${Math.round(change * 10) / 10}${unit ? ` ${unit}` : ''}`}
          </span>
        </div>
      )}
    </div>
  )
}
