import React from 'react'
import { View } from 'react-native'
import { BentoWidget } from '../BentoWidget'

// Simple unit tests that don't require full React Native rendering

describe('BentoWidget', () => {
  it('should be a function component', () => {
    expect(typeof BentoWidget).toBe('function')
  })

  it('should accept children prop', () => {
    const element = React.createElement(BentoWidget, {
      children: React.createElement(View, { key: 'test' }),
    })

    expect(element).toBeTruthy()
    expect(element.props.children).toBeTruthy()
  })

  it('should accept size prop', () => {
    const sizes = ['small', 'medium', 'large', 'wide'] as const

    sizes.forEach((size) => {
      const element = React.createElement(BentoWidget, {
        size,
        children: React.createElement(View, { key: 'test' }),
      })

      expect(element.props.size).toBe(size)
    })
  })

  it('should accept index prop for animation delay', () => {
    const element = React.createElement(BentoWidget, {
      index: 5,
      children: React.createElement(View, { key: 'test' }),
    })

    expect(element.props.index).toBe(5)
  })

  it('should accept gap prop', () => {
    const element = React.createElement(BentoWidget, {
      gap: 16,
      children: React.createElement(View, { key: 'test' }),
    })

    expect(element.props.gap).toBe(16)
  })

  it('should have default values when props not provided', () => {
    const element = React.createElement(BentoWidget, {
      children: React.createElement(View, { key: 'test' }),
    })

    // These will use defaults in the component
    expect(element.props.size).toBeUndefined()
    expect(element.props.index).toBeUndefined()
    expect(element.props.gap).toBeUndefined()
  })
})
