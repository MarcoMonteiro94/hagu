import { describe, it, expect } from 'vitest'
import { cn, parseLocalDate, getTodayString, formatLocalDate } from './utils'

describe('cn (className utility)', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
  })

  it('should merge tailwind conflicts correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle undefined and null', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })
})

describe('parseLocalDate', () => {
  it('should parse YYYY-MM-DD format correctly', () => {
    const date = parseLocalDate('2024-01-15')
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(0) // January is 0
    expect(date.getDate()).toBe(15)
  })

  it('should handle end of year dates', () => {
    const date = parseLocalDate('2024-12-31')
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(11) // December is 11
    expect(date.getDate()).toBe(31)
  })

  it('should handle beginning of year dates', () => {
    const date = parseLocalDate('2024-01-01')
    expect(date.getFullYear()).toBe(2024)
    expect(date.getMonth()).toBe(0)
    expect(date.getDate()).toBe(1)
  })
})

describe('getTodayString', () => {
  it('should return date in YYYY-MM-DD format', () => {
    const result = getTodayString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('should return today\'s date', () => {
    const result = getTodayString()
    const today = new Date()
    const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    expect(result).toBe(expected)
  })
})

describe('formatLocalDate', () => {
  it('should format date for pt-BR locale', () => {
    const result = formatLocalDate('2024-01-15', 'pt-BR')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('should format date for en-US locale', () => {
    const result = formatLocalDate('2024-01-15', 'en-US')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('should accept custom options', () => {
    const result = formatLocalDate('2024-01-15', 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    expect(result).toContain('January')
    expect(result).toContain('Monday')
  })
})
