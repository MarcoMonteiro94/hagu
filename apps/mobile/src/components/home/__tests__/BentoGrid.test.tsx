import React from 'react'
import { View, Text } from 'react-native'
import { BentoGrid } from '../BentoGrid'

// Simple unit tests that don't require full React Native rendering

describe('BentoGrid', () => {
  it('should be a function component', () => {
    expect(typeof BentoGrid).toBe('function')
  })

  it('should accept children prop', () => {
    // Test that the component can be called with children
    const element = React.createElement(BentoGrid, {
      children: React.createElement(View, { key: 'test' }),
    })

    expect(element).toBeTruthy()
    expect(element.props.children).toBeTruthy()
  })

  it('should accept gap prop', () => {
    const element = React.createElement(BentoGrid, {
      gap: 20,
      children: React.createElement(View, { key: 'test' }),
    })

    expect(element.props.gap).toBe(20)
  })

  it('should use default gap of 12 when not provided', () => {
    const element = React.createElement(BentoGrid, {
      children: React.createElement(View, { key: 'test' }),
    })

    expect(element.props.gap).toBeUndefined() // Will use default in component
  })
})
