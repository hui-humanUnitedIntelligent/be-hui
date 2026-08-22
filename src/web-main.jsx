import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { ToastContainer } from './lib/useToast.jsx';
import './index.css';
import './web.css';
import './landing.css';

const _diag = document.getElementById('diag');
if (_diag) _diag.innerHTML += '<br>[JS] Test 4: Lazy import of minimal component';

// Lazy import of a TRIVIAL component
const TestLazy = lazy(() => import('./_test_lazy.jsx'));

function LoadingScreen() {
  return React.createElement('div', { style: { padding: 40 } }, 'Loading...');
}

function ConditionalRouter() {
  const { isAuthenticated, loadingAuth } = useAuth();
  _diag && (_diag.innerHTML += '<br>[JS] CR: loading=' + loadingAuth + ' auth=' + isAuthenticated);
  
  if (loadingAuth) return React.createElement(LoadingScreen);
  
  if (!isAuthenticated) {
    return React.createElement(Suspense, { fallback: React.createElement(LoadingScreen) },
      React.createElement(Routes, null,
        React.createElement(Route, { path: '/login', element: React.createElement(TestLazy) }),
        React.createElement(Route, { path: '*', element: React.createElement(Navigate, { to: '/login', replace: true }) })
      )
    );
  }
  
  return React.createElement('div', null, 'Authenticated');
}

// Error boundary
class DiagBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    const d = document.getElementById('diag');
    if (d) d.innerHTML += '<br>[JS] ❌ BOUNDARY: ' + (error?.message || error);
  }
  render() {
    if (this.state.error) return React.createElement('div', { style: { padding: 20, color: 'red' } }, 'CAUGHT: ' + this.state.error.message);
    return this.props.children;
  }
}

try {
  ReactDOM.createRoot(document.getElementById('web-root')).render(
    React.createElement(DiagBoundary, null,
      React.createElement(BrowserRouter, { basename: '/app' },
        React.createElement(AuthProvider, null,
          React.createElement(React.Fragment, null,
            React.createElement(ToastContainer),
            React.createElement(ConditionalRouter)
          )
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
