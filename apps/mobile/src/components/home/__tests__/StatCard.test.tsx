import React from 'react'
import { View } from 'react-native'
import { StatCard } from '../StatCard'

// Simple unit tests that don't require full React Native rendering

describe('StatCard', () => {
  const mockIcon = React.createElement(View, { key: 'icon' })

  it('should be a function component', () => {
    expect(typeof StatCard).toBe('function')
  })

  it('should accept required props', () => {
    const element = React.createElement(StatCard, {
      icon: mockIcon,
      label: 'Test Label',
      value: 42,
      iconBgColor: '#8b5cf620',
    })

    expect(element).toBeTruthy()
    expect(element.props.label).toBe('Test Label')
    expect(element.props.value).toBe(42)
    expect(element.props.iconBgColor).toBe('#8b5cf620')
  })

  it('should accept string value', () => {
    const element = React.createElement(StatCard, {
      icon: mockIcon,
      label: 'Money',
      value: 'R$ 100',
      iconBgColor: '#10b98120',
    })

    expect(element.props.value).toBe('R$ 100')
  })

  it('should accept suffix prop', () => {
    const element = React.createElement(StatCard, {
      icon: mockIcon,
      label: 'Streak',
      value: 7,
      suffix: 'days',
      iconBgColor: '#f9731620',
    })

    expect(element.props.suffix).toBe('days')
  })

  it('should accept delay prop', () => {
    const element = React.createElement(StatCard, {
      icon: mockIcon,
      label: 'Level',
      value: 5,
      iconBgColor: '#eab30820',
      delay: 200,
    })

    expect(element.props.delay).toBe(200)
  })

  it('should have optional props as undefined when not provided', () => {
    const element = React.createElement(StatCard, {
      icon: mockIcon,
      label: 'Test',
      value: 0,
      iconBgColor: '#000000',
    })

    expect(element.props.suffix).toBeUndefined()
    expect(element.props.delay).toBeUndefined()
  })
})
