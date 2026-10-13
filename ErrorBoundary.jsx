import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', backgroundColor: '#2a0e17', color: '#ff4d6d', borderRadius: '8px', border: '1px solid #800f2f', margin: '20px 0' }}>
          <h2>Something went wrong loading this section.</h2>
          <p style={{ color: '#ccc' }}>{this.state.error?.toString() || 'An unexpected error occurred.'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })} 
            style={{ padding: '8px 16px', backgroundColor: '#e14eca', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}