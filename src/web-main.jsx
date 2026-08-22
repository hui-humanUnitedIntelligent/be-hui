import React from 'react';
import ReactDOM from 'react-dom/client';

const rootEl = document.getElementById('web-root');
const root = ReactDOM.createRoot(rootEl);

function show(msg) {
  root.render(
    React.createElement('div', { style: { padding: 40, fontFamily: 'monospace', fontSize: 14, whiteSpace: 'pre-wrap', color: '#000' } }, msg)
  );
}

show('Testing imports...');

(async () => {
  try {
    show('1. Testing sentry.js...');
    await import('./lib/sentry.js');
    show('2. Testing globalKeyboardHandler.js...');
    await import('./lib/globalKeyboardHandler.js');
    show('3. Testing supabaseClient.js...');
    await import('./lib/supabaseClient.js');
    show('4. Testing AuthContext.jsx...');
    await import('./lib/AuthContext.jsx');
    show('5. Testing useToast.jsx...');
    await import('./lib/useToast.jsx');
    show('6. Testing WebApp.jsx...');
    await import('./WebApp.jsx');
    show('ALL IMPORTS OK!');
  } catch (e) {
    show('CRASH: ' + (e.message || e) + '\n' + (e.stack || '').split('\n').slice(0,5).join('\n'));
  }
})();
