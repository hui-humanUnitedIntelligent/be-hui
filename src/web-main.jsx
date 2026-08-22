import React from 'react';
import ReactDOM from 'react-dom/client';

const _d = document.getElementById('diag');
if (_d) _d.innerHTML += '\n[JS] web-main.jsx loaded';

// Step 1: Render a simple div
try {
  const testRoot = ReactDOM.createRoot(document.getElementById('web-root'));
  testRoot.render(
    <React.StrictMode>
      <div style={{padding:40,fontFamily:'sans-serif',fontSize:24,color:'#0dc4b5'}}>
        ✓ React works — loading WebApp...
      </div>
    </React.StrictMode>
  );
  if (_d) _d.innerHTML += '\n[JS] Test div rendered';
} catch(e) {
  if (_d) _d.innerHTML += '\n[JS] TEST DIV CRASH: ' + e.message;
}

// Step 2: After 2s, replace with WebApp
setTimeout(async () => {
  if (_d) _d.innerHTML += '\n[JS] Loading WebApp...';
  try {
    const WebApp = (await import('./WebApp.jsx')).default;
    const { GlobalAppBoundary } = await import('./lib/ErrorBoundaries.jsx');
    await import('./index.css');
    await import('./web.css');
    await import('./landing.css');
    
    const testRoot = ReactDOM.createRoot(document.getElementById('web-root'));
    testRoot.render(
      <React.StrictMode>
        <GlobalAppBoundary>
          <WebApp />
        </GlobalAppBoundary>
      </React.StrictMode>
    );
    if (_d) _d.innerHTML += '\n[JS] WebApp render() called';
  } catch(e) {
    if (_d) _d.innerHTML += '\n[JS] WEBAPP CRASH: ' + e.message + '\n' + (e.stack||'').split('\n').slice(0,5).join('\n');
  }
}, 2000);
