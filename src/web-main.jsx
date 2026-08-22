import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('web-root')).render(
  React.createElement('div', { style: { padding: 40, fontFamily: 'monospace', fontSize: 14 } }, 
    'HUI Web — Module loaded, React renders OK. Timestamp: ' + new Date().toISOString())
);
