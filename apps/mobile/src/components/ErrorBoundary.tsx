import { Component, type ReactNode } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1a1a1a', padding: 20 }}>
          <Text style={{ color: '#ff6b6b', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
            Something went wrong
          </Text>
          <ScrollView style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, marginBottom: 8 }}>
              {this.state.error?.message}
            </Text>
            <Text style={{ color: '#888', fontSize: 12, fontFamily: 'monospace' }}>
              {this.state.error?.stack}
            </Text>
          </ScrollView>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: '#4a90d9',
              padding: 16,
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
              Try Again
            </Text>
          </Pressable>
        </View>
      )
    }

    return this.props.children
  }
}
