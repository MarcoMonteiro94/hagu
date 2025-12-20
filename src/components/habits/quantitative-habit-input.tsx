'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus, Check, X } from 'lucide-react'
import type { HabitCompletion } from '@/types'

interface QuantitativeHabitInputProps {
  target: number
  unit: string
  completion: HabitCompletion | undefined
  onValueChange: (value: number) => void
  onRemove: () => void
}

export function QuantitativeHabitInput({
  target,
  unit,
  completion,
  onValueChange,
  onRemove,
}: QuantitativeHabitInputProps) {
  const currentValue = completion?.value ?? 0
  const isCompleted = currentValue >= target

  const [inputValue, setInputValue] = useState(currentValue.toString())

  useEffect(() => {
    setInputValue(currentValue.toString())
  }, [currentValue])

  const handleIncrement = useCallback(() => {
    const newValue = currentValue + 1
    onValueChange(newValue)
  }, [currentValue, onValueChange])

  const handleDecrement = useCallback(() => {
    if (currentValue <= 0) {
      if (completion) {
        onRemove()
      }
      return
    }
    const newValue = currentValue - 1
    if (newValue === 0 && completion) {
      onRemove()
    } else {
      onValueChange(newValue)
    }
  }, [currentValue, completion, onValueChange, onRemove])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handleInputBlur = useCallback(() => {
    const parsed = parseInt(inputValue, 10)
    if (!isNaN(parsed) && parsed >= 0) {
      if (parsed === 0 && completion) {
        onRemove()
      } else if (parsed > 0) {
        onValueChange(parsed)
      }
    } else {
      setInputValue(currentValue.toString())
    }
  }, [inputValue, currentValue, completion, onValueChange, onRemove])

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    } else if (e.key === 'Escape') {
      setInputValue(currentValue.toString())
    }
  }, [currentValue])

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleDecrement}
        disabled={currentValue <= 0}
        aria-label={currentValue === 1 ? 'Remover progresso' : 'Diminuir valor'}
      >
        {currentValue === 1 ? (
          <X className="h-3.5 w-3.5" />
        ) : (
          <Minus className="h-3.5 w-3.5" />
        )}
      </Button>

      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="h-7 w-12 px-1 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          aria-label={`Progresso atual: ${currentValue} de ${target} ${unit}`}
        />
        <span className="text-xs text-muted-foreground">
          / {target} {unit}
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleIncrement}
        aria-label="Aumentar valor"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>

      {isCompleted && (
        <Check className="ml-1 h-4 w-4 text-green-500" />
      )}
    </div>
  )
}
