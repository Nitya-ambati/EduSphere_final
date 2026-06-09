import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ color: '#e11d48', marginBottom: '12px' }}>EduSphere — App Error</h2>
          <p style={{ color: '#64748b', marginBottom: '16px' }}>
            Something went wrong. Copy the error below and share it for debugging.
          </p>
          <pre style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
            padding: '16px', color: '#b91c1c', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13px'
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/login' }}
            style={{ marginTop: '16px', padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Go to Login
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: { borderRadius: '12px', background: '#1e1b4b', color: '#fff', fontSize: '14px' },
              success: { style: { background: '#059669', color: '#fff' } },
              error: { style: { background: '#e11d48', color: '#fff' } },
            }}
          />
        </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
