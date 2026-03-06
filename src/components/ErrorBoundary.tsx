import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Screen error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="screen-content" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--coral, #ff6b6b)" strokeWidth="2" style={{ marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>
            {this.props.fallback || 'Something went wrong'}
          </h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: 16 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
