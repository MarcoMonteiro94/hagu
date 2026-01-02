'use client'

import { forwardRef, useCallback, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  type Currency,
  CURRENCY_SYMBOLS,
  formatCurrencyValue,
  parseCurrencyValue,
} from '@/lib/currency'

interface CurrencyInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
  value: number | string
  onChange: (value: number) => void
  currency?: Currency
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, currency = 'BRL', className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('')

    // Sync display value when external value changes
    useEffect(() => {
      const numericValue = typeof value === 'string'
        ? parseFloat(value.replace(',', '.')) || 0
        : value || 0

      setDisplayValue(formatCurrencyValue(numericValue, currency))
    }, [value, currency])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value
      const numericValue = parseCurrencyValue(rawValue)

      // Update display with formatted value
      setDisplayValue(formatCurrencyValue(numericValue, currency))

      // Notify parent with numeric value
      onChange(numericValue)
    }, [currency, onChange])

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, decimal separators
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', '.', ',']

      // Allow ctrl/cmd + a, c, v, x
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return
      }

      // Allow arrow keys
      if (e.key.startsWith('Arrow')) {
        return
      }

      // Allow digits and special keys
      if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
        e.preventDefault()
      }
    }, [])

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {CURRENCY_SYMBOLS[currency]}
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn('pl-10 text-lg font-medium', className)}
          {...props}
        />
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

export { CurrencyInput }
export type { CurrencyInputProps }
