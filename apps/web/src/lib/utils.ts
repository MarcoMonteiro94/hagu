import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a date string (YYYY-MM-DD) as local time, not UTC.
 * This prevents timezone issues where dates appear as the previous day.
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Get today's date as YYYY-MM-DD string in local timezone.
 */
export function getTodayString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format a date string (YYYY-MM-DD) for display using local timezone.
 */
export function formatLocalDate(
  dateString: string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseLocalDate(dateString)
  return date.toLocaleDateString(locale, options)
}
