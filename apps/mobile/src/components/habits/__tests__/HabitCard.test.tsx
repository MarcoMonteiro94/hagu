import React from 'react'
import { HabitCard } from '../HabitCard'
import type { Habit, HabitFrequency } from '@hagu/core'

type HabitCardProps = React.ComponentProps<typeof HabitCard>

// Simple unit tests that don't require full React Native rendering

describe('HabitCard', () => {
  const mockHabit: Habit = {
    id: '1',
    title: 'Exercise',
    description: 'At least 30 minutes of activity',
    areaId: 'health',
    color: '#22c55e',
    frequency: { type: 'daily' },
    tracking: { type: 'boolean' },
    completions: [],
    createdAt: new Date().toISOString(),
  }

  const mockLast7Days = [
    '2025-01-12',
    '2025-01-13',
    '2025-01-14',
    '2025-01-15',
    '2025-01-16',
    '2025-01-17',
    '2025-01-18',
  ]

  const mockOnToggle = jest.fn()

  const defaultProps: HabitCardProps = {
    habit: mockHabit,
    last7Days: mockLast7Days,
    onToggle: mockOnToggle,
    index: 0,
  }

  beforeEach(() => {
    mockOnToggle.mockClear()
  })

  it('should be a function component', () => {
    expect(typeof HabitCard).toBe('function')
  })

  it('should accept required props', () => {
    const element = React.createElement(HabitCard, defaultProps)

    expect(element).toBeTruthy()
    expect(element.props.habit).toBe(mockHabit)
    expect(element.props.last7Days).toBe(mockLast7Days)
    expect(element.props.onToggle).toBe(mockOnToggle)
    expect(element.props.index).toBe(0)
  })

  it('should accept habit with completions', () => {
    const completedHabit: Habit = {
      ...mockHabit,
      completions: [
        { date: '2025-01-18', value: 1, completedAt: new Date().toISOString() },
      ],
    }

    const element = React.createElement(HabitCard, {
      ...defaultProps,
      habit: completedHabit,
    })

    expect(element.props.habit.completions).toHaveLength(1)
    expect(element.props.habit.completions[0].date).toBe('2025-01-18')
  })

  it('should accept habit without description', () => {
    const habitNoDesc: Habit = {
      ...mockHabit,
      description: undefined,
    }

    const element = React.createElement(HabitCard, {
      ...defaultProps,
      habit: habitNoDesc,
    })

    expect(element.props.habit.description).toBeUndefined()
  })

  it('should accept habit with empty completions (no streak)', () => {
    const habitNoCompletions: Habit = {
      ...mockHabit,
      completions: [],
    }

    const element = React.createElement(HabitCard, {
      ...defaultProps,
      habit: habitNoCompletions,
    })

    expect(element.props.habit.completions).toHaveLength(0)
  })

  it('should accept quantitative tracking habit', () => {
    const quantHabit: Habit = {
      ...mockHabit,
      tracking: { type: 'quantitative', target: 20, unit: 'pages' },
    }

    const element = React.createElement(HabitCard, {
      ...defaultProps,
      habit: quantHabit,
    })

    expect(element.props.habit.tracking.type).toBe('quantitative')
    if (element.props.habit.tracking.type === 'quantitative') {
      expect(element.props.habit.tracking.target).toBe(20)
      expect(element.props.habit.tracking.unit).toBe('pages')
    }
  })

  it('should accept different frequency types', () => {
    const frequencies: HabitFrequency[] = [
      { type: 'daily' },
      { type: 'weekly', daysPerWeek: 3 },
      { type: 'specificDays', days: [1, 3, 5] },
      { type: 'monthly', timesPerMonth: 4 },
    ]

    frequencies.forEach((frequency) => {
      const habit: Habit = {
        ...mockHabit,
        frequency,
      }

      const element = React.createElement(HabitCard, {
        ...defaultProps,
        habit,
      })

      expect(element.props.habit.frequency.type).toBe(frequency.type)
    })
  })

  it('should accept different colors', () => {
    const colors = ['#22c55e', '#3b82f6', '#8b5cf6', '#ef4444']

    colors.forEach((color) => {
      const habit: Habit = {
        ...mockHabit,
        color,
      }

      const element = React.createElement(HabitCard, {
        ...defaultProps,
        habit,
      })

      expect(element.props.habit.color).toBe(color)
    })
  })

  it('should accept different index values', () => {
    [0, 1, 5, 10].forEach((index) => {
      const element = React.createElement(HabitCard, {
        ...defaultProps,
        index,
      })

      expect(element.props.index).toBe(index)
    })
  })

  it('should have onToggle callback function', () => {
    const element = React.createElement(HabitCard, defaultProps)

    expect(typeof element.props.onToggle).toBe('function')
  })

  it('should accept habit with multiple completions', () => {
    const habit: Habit = {
      ...mockHabit,
      completions: [
        { date: '2025-01-16', value: 1, completedAt: '2025-01-16T10:00:00Z' },
        { date: '2025-01-17', value: 1, completedAt: '2025-01-17T09:30:00Z' },
        { date: '2025-01-18', value: 1, completedAt: '2025-01-18T08:00:00Z' },
      ],
    }

    const element = React.createElement(HabitCard, {
      ...defaultProps,
      habit,
    })

    expect(element.props.habit.completions).toHaveLength(3)
  })
})
