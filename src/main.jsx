import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import App from './App';
import { initSentry } from './config/sentry';
import { AuthProvider } from './context/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// Initialize Sentry
initSentry();

// Performance monitoring
if (process.env.NODE_ENV === 'production') {
  // Basic performance metrics
  const reportPerformance = () => {
    const navigationTiming = performance.getEntriesByType('navigation')[0];
    const paintTiming = performance.getEntriesByType('paint');

    // Report to Sentry or monitoring service
    if (navigationTiming) {
      console.log('Page Load Time:', navigationTiming.loadEventEnd - navigationTiming.startTime);
      console.log('DOM Interactive Time:', navigationTiming.domInteractive - navigationTiming.startTime);
      console.log('DOM Complete Time:', navigationTiming.domComplete - navigationTiming.startTime);
    }

    if (paintTiming.length) {
      const firstPaint = paintTiming.find(entry => entry.name === 'first-paint');
      const firstContentfulPaint = paintTiming.find(entry => entry.name === 'first-contentful-paint');

      if (firstPaint) {
        console.log('First Paint:', firstPaint.startTime);
      }
      if (firstContentfulPaint) {
        console.log('First Contentful Paint:', firstContentfulPaint.startTime);
      }
    }
  };

  // Report performance after load
  window.addEventListener('load', reportPerformance);
}

// Add error boundary for uncaught errors in development
if (process.env.NODE_ENV === 'development') {
  window.onerror = (message, source, lineno, colno, error) => {
    console.error('Global error:', {
      message: message,
      source: source,
      line: lineno,
      column: colno,
      stack: error?.stack || 'No stack trace available'
    });
    return false; // Allow default error handling to continue
  };

  window.onunhandledrejection = (event) => {
    console.error('Unhandled promise rejection:', {
      message: event.reason?.message || event.reason,
      stack: event.reason?.stack || 'No stack trace available'
    });
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthProvider>
  </React.StrictMode>
);
