// Currency formatting and parsing utilities

export type Currency = 'BRL' | 'USD' | 'EUR'

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
}

export const CURRENCY_LOCALE: Record<Currency, string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'de-DE',
}

/**
 * Formats a numeric value as a currency string without the symbol.
 * Example: 1234.56 -> "1.234,56" (BRL) or "1,234.56" (USD)
 */
export function formatCurrencyValue(value: number, currency: Currency): string {
  if (value === 0) return ''

  const locale = CURRENCY_LOCALE[currency]

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Parses a currency string to a numeric value.
 * Extracts only digits and converts to a number with 2 decimal places.
 * Example: "1.234,56" -> 1234.56 or "12345" -> 123.45
 */
export function parseCurrencyValue(value: string): number {
  if (!value) return 0

  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')
  if (!digits) return 0

  // Convert to number with 2 decimal places
  const numericValue = parseInt(digits, 10) / 100

  return numericValue
}

/**
 * Formats a number as a full currency string with symbol.
 * Example: 1234.56 -> "R$ 1.234,56" (BRL)
 */
export function formatCurrency(value: number, currency: Currency): string {
  const locale = CURRENCY_LOCALE[currency]

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}
