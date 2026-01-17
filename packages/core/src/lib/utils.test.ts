import { describe, it, expect } from 'vitest'
import { parseLocalDate, getTodayString, formatLocalDate } from './utils'

// Note: cn() function tests are in apps/web/src/lib/utils.test.ts

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
