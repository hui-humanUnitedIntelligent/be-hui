import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext.jsx';
import LoginPage from './pages/LoginPage';
import './index.css';
import './web.css';
import './landing.css';

const _d = document.getElementById('diag');
const rootEl = document.getElementById('web-root');
if (_d) _d.innerHTML = '[JS] start';

window.addEventListener('error', (e) => {
  if (_d) _d.innerHTML += '\n[WIN_ERR] ' + e.message;
});
window.addEventListener('unhandledrejection', (e) => {
  if (_d) _d.innerHTML += '\n[REJ] ' + (e.reason?.message || e.reason);
});

class EC extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  componentDidCatch(e, i) {
    if (_d) _d.innerHTML += '\n[CAUGHT] ' + e.message + '\n' + (i.componentStack||'').substring(0,500);
  }
  render() {
    if (this.state.err) return <div style={{padding:20,color:'red',fontFamily:'monospace'}}>ERR: {String(this.state.err.message)}</div>;
    return this.props.children;
  }
}

// Check if LoginPage is valid
if (_d) _d.innerHTML += '\n[JS] LoginPage type=' + typeof LoginPage;
if (_d) _d.innerHTML += '\n[JS] LoginPage isFn=' + (typeof LoginPage === 'function');

// Wrap LoginPage to trace renders
function TracedLoginPage() {
  if (_d) _d.innerHTML += '\n[JS] TracedLoginPage RENDER called';
  try {
    const result = LoginPage();
    if (_d) _d.innerHTML += '\n[JS] LoginPage() returned type=' + (result === null ? 'null' : result === undefined ? 'undefined' : result?.type?.name || result?.type || 'element');
    return result;
  } catch(e) {
    if (_d) _d.innerHTML += '\n[JS] LoginPage() THREW: ' + e.message;
    throw e;
  }
}

function TestB() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <EC>
          <Routes>
            <Route path="/login" element={<TracedLoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </EC>
      </AuthProvider>
    </BrowserRouter>
  );
}

const r = ReactDOM.createRoot(rootEl);
r.render(<TestB />);
if (_d) _d.innerHTML += '\n[JS] render() called';

// Multiple checks
[1, 2, 3, 5].forEach(t => {
  setTimeout(() => {
    if (_d) _d.innerHTML += '\n[' + t + 's] children=' + rootEl.childElementCount + ' html.len=' + rootEl.innerHTML.length;
  }, t * 1000);
});
