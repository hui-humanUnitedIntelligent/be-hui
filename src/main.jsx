// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { initSentry, sentryCapture } from './lib/sentry'

initSentry();

window.addEventListener('unhandledrejection', (event) => {
  const err = event.reason instanceof Error
    ? event.reason
    : new Error(String(event.reason ?? 'Unhandled rejection'));
  sentryCapture(err, { source: 'unhandledrejection', href: window.location.href });
});

window.addEventListener('error', (event) => {
  if (!event.error) return;
  sentryCapture(event.error, { source: 'window.onerror', href: window.location.href });
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
