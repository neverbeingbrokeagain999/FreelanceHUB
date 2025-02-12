import { Component } from 'react';
import { captureException } from '../config/sentry';
import { handleComponentError } from '../utils/errorUtils';

/**
 * Error Boundary component to catch and handle React component errors
 * @extends {Component}
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    const errorDetails = handleComponentError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name
    });

    if (process.env.NODE_ENV === 'production') {
      captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
          ...errorDetails
        }
      });
    } else {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ error: null, errorInfo: null });
  };

  /**
   * @type {Object} DefaultProps
   * @property {JSX.Element} fallback - Fallback UI to show when error occurs
   */
  static defaultProps = {
    fallback: (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
        <p className="mt-2 text-red-600">
          We encountered an error while loading this component. Please try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Reload Page
        </button>
      </div>
    )
  };

  render() {
    const { fallback, children } = this.props;
    const { error } = this.state;

    if (error) {
      // If a custom fallback is provided, render it with error details
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback({ error, retry: this.handleRetry })
          : fallback;
      }

      // Otherwise, render the default error UI
      return ErrorBoundary.defaultProps.fallback;
    }

    return children;
  }
}

export default ErrorBoundary;
