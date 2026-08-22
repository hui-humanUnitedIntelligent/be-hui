// WHITESCREEN DIAGNOSTIC: Find which import crashes
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('web-root'));

function show(content) {
  root.render(
    React.createElement('div', { style: { padding: 40, fontFamily: 'monospace', fontSize: 14, whiteSpace: 'pre-wrap' } },
      content
    )
  );
}

show('Testing imports one by one...');

async function testImport(name, importFn) {
  try {
    const mod = await importFn();
    show(document.getElementById('web-root').textContent + `\n✅ ${name} OK`);
    return mod;
  } catch (e) {
    show(document.getElementById('web-root').textContent + `\n❌ ${name} CRASHED: ${e.message}\n${e.stack?.split('\n').slice(0,5).join('\n')}`);
    throw e;
  }
}

(async () => {
  try {
    // Test each import from WebApp.jsx chain
    await testImport('sentry.js', () => import('./lib/sentry.js'));
    await testImport('globalKeyboardHandler.js', () => import('./lib/globalKeyboardHandler.js'));
    await testImport('supabaseClient.js', () => import('./lib/supabaseClient.js'));
    await testImport('AuthContext.jsx', () => import('./lib/AuthContext.jsx'));
    await testImport('useToast.jsx', () => import('./lib/useToast.jsx'));
    await testImport('WebApp.jsx', () => import('./WebApp.jsx'));
    
    show(document.getElementById('web-root').textContent + '\n\nAll imports OK! Rendering WebApp...');
    
    const { default: WebApp } = await import('./WebApp.jsx');
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(WebApp)
      )
    );
  } catch (e) {
    // Error already shown by testImport
    console.error('Import chain failed:', e);
  }
})();
