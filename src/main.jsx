import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

window.onerror = function(message, source, lineno, colno, error) {
  document.body.innerHTML = `
    <div style="padding:20px;font-family:Arial;background:#fff;color:#000;">
      <h1>React Error</h1>
      <pre>${message}</pre>
      <pre>${error?.stack || ''}</pre>
    </div>
  `;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
