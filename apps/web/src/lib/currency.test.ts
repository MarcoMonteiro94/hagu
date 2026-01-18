import { describe, it, expect } from 'vitest'
import {
  formatCurrencyValue,
  parseCurrencyValue,
  formatCurrency,
  CURRENCY_SYMBOLS,
  CURRENCY_LOCALE,
} from './currency'

describe('currency utilities', () => {
  describe('CURRENCY_SYMBOLS', () => {
    it('has correct symbol for BRL', () => {
      expect(CURRENCY_SYMBOLS.BRL).toBe('R$')
    })

    it('has correct symbol for USD', () => {
      expect(CURRENCY_SYMBOLS.USD).toBe('$')
    })

    it('has correct symbol for EUR', () => {
      expect(CURRENCY_SYMBOLS.EUR).toBe('€')
    })
  })

  describe('CURRENCY_LOCALE', () => {
    it('has correct locale for BRL', () => {
      expect(CURRENCY_LOCALE.BRL).toBe('pt-BR')
    })

    it('has correct locale for USD', () => {
      expect(CURRENCY_LOCALE.USD).toBe('en-US')
    })

    it('has correct locale for EUR', () => {
      expect(CURRENCY_LOCALE.EUR).toBe('de-DE')
    })
  })

  describe('formatCurrencyValue', () => {
    it('returns empty string for zero value', () => {
      expect(formatCurrencyValue(0, 'BRL')).toBe('')
      expect(formatCurrencyValue(0, 'USD')).toBe('')
      expect(formatCurrencyValue(0, 'EUR')).toBe('')
    })

    it('formats BRL currency with Brazilian locale (dot for thousands, comma for decimals)', () => {
      expect(formatCurrencyValue(1234.56, 'BRL')).toBe('1.234,56')
      expect(formatCurrencyValue(100, 'BRL')).toBe('100,00')
      expect(formatCurrencyValue(0.99, 'BRL')).toBe('0,99')
    })

    it('formats USD currency with US locale (comma for thousands, dot for decimals)', () => {
      expect(formatCurrencyValue(1234.56, 'USD')).toBe('1,234.56')
      expect(formatCurrencyValue(100, 'USD')).toBe('100.00')
      expect(formatCurrencyValue(0.99, 'USD')).toBe('0.99')
    })

    it('formats EUR currency with German locale (dot for thousands, comma for decimals)', () => {
      expect(formatCurrencyValue(1234.56, 'EUR')).toBe('1.234,56')
      expect(formatCurrencyValue(100, 'EUR')).toBe('100,00')
    })

    it('handles large numbers', () => {
      expect(formatCurrencyValue(1234567.89, 'BRL')).toBe('1.234.567,89')
      expect(formatCurrencyValue(1234567.89, 'USD')).toBe('1,234,567.89')
    })

    it('handles small decimal values', () => {
      expect(formatCurrencyValue(0.01, 'BRL')).toBe('0,01')
      expect(formatCurrencyValue(0.01, 'USD')).toBe('0.01')
    })
  })

  describe('parseCurrencyValue', () => {
    it('returns 0 for empty string', () => {
      expect(parseCurrencyValue('')).toBe(0)
    })

    it('returns 0 for string without digits', () => {
      expect(parseCurrencyValue('abc')).toBe(0)
      expect(parseCurrencyValue('R$')).toBe(0)
    })

    it('parses digits and converts to decimal (last 2 digits as cents)', () => {
      expect(parseCurrencyValue('100')).toBe(1)
      expect(parseCurrencyValue('1234')).toBe(12.34)
      expect(parseCurrencyValue('12345')).toBe(123.45)
    })

    it('extracts only digits from formatted values', () => {
      expect(parseCurrencyValue('1.234,56')).toBe(1234.56)
      expect(parseCurrencyValue('1,234.56')).toBe(1234.56)
      expect(parseCurrencyValue('R$ 100,00')).toBe(100)
    })

    it('handles values with spaces and symbols', () => {
      expect(parseCurrencyValue('R$ 1.234,56')).toBe(1234.56)
      expect(parseCurrencyValue('$ 1,234.56')).toBe(1234.56)
      expect(parseCurrencyValue('€ 1.234,56')).toBe(1234.56)
    })

    it('handles single digit input', () => {
      expect(parseCurrencyValue('1')).toBe(0.01)
      expect(parseCurrencyValue('5')).toBe(0.05)
    })

    it('handles two digit input', () => {
      expect(parseCurrencyValue('12')).toBe(0.12)
      expect(parseCurrencyValue('99')).toBe(0.99)
    })
  })

  describe('formatCurrency', () => {
    it('formats BRL with symbol', () => {
      const result = formatCurrency(1234.56, 'BRL')
      expect(result).toMatch(/R\$/)
      expect(result).toMatch(/1\.234,56/)
    })

    it('formats USD with symbol', () => {
      const result = formatCurrency(1234.56, 'USD')
      expect(result).toMatch(/\$/)
      expect(result).toMatch(/1,234\.56/)
    })

    it('formats EUR with symbol', () => {
      const result = formatCurrency(1234.56, 'EUR')
      expect(result).toMatch(/€/)
      expect(result).toMatch(/1\.234,56/)
    })

    it('formats zero value', () => {
      const result = formatCurrency(0, 'BRL')
      expect(result).toMatch(/R\$/)
      expect(result).toMatch(/0,00/)
    })
  })
})
