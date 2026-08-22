import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { ToastContainer } from './lib/useToast.jsx';
import './index.css';
import './web.css';
import './landing.css';

const _diag = document.getElementById('diag');
if (_diag) _diag.innerHTML += '<br>[JS] Test 3: ConditionalRouter with NON-lazy routes';

function LoadingScreen() {
  return React.createElement('div', { style: { padding: 40 } }, 'Loading...');
}

// Same ConditionalRouter but with eager (non-lazy) components
function ConditionalRouter() {
  const { isAuthenticated, loadingAuth } = useAuth();
  _diag && (_diag.innerHTML += '<br>[JS] ConditionalRouter: loading=' + loadingAuth + ' auth=' + isAuthenticated);
  
  if (loadingAuth) return React.createElement(LoadingScreen);
  
  if (!isAuthenticated) {
    return React.createElement(Suspense, { fallback: React.createElement(LoadingScreen) },
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/', element: React.createElement('div', { style: { padding: 40 } }, 'Landing Page') }),
        React.createElement(Route, { path: '/login', element: React.createElement('div', { style: { padding: 40 } }, 'Login Page') }),
        React.createElement(Route, { path: '/auth/callback', element: React.createElement('div', { style: { padding: 40 } }, 'Auth Callback') }),
        React.createElement(Route, { path: '*', element: React.createElement(Navigate, { to: '/login', replace: true }) })
      )
    );
  }
  
  return React.createElement('div', { style: { padding: 40 } }, 'Authenticated');
}

try {
  ReactDOM.createRoot(document.getElementById('web-root')).render(
    React.createElement(BrowserRouter, { basename: '/app' },
      React.createElement(AuthProvider, null,
        React.createElement(React.Fragment, null,
          React.createElement(ToastContainer),
          React.createElement(ConditionalRouter)
        )
      )
    )
  );
  _diag && (_diag.innerHTML += '<br>[JS] render() called');
} catch (e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ CRASH: ' + e.message);
}

[500, 1000, 2000].forEach(function(delay) {
  setTimeout(function() {
    var root = document.getElementById('web-root');
    _diag && (_diag.innerHTML += '<br>[' + delay + 'ms] children: ' + (root ? root.childNodes.length : 'NULL'));
  }, delay);
});
