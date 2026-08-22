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

// Global error handlers to catch EVERYTHING
window.addEventListener('error', (e) => {
  if (_d) _d.innerHTML += '\n[WINDOW ERROR] ' + e.message + ' @ ' + (e.filename||'') + ':' + (e.lineno||'');
});
window.addEventListener('unhandledrejection', (e) => {
  if (_d) _d.innerHTML += '\n[UNHANDLED REJECTION] ' + (e.reason?.message || e.reason || 'unknown');
});

class EC extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  componentDidCatch(e, i) {
    if (_d) _d.innerHTML += '\n[CAUGHT] ' + e.message + '\n' + (i.componentStack||'').substring(0,400);
  }
  render() {
    if (this.state.err) return <div style={{padding:20,color:'red',fontFamily:'monospace',fontSize:14}}>ERR: {String(this.state.err.message)}<br/>Stack: {String(this.state.err.stack||'').substring(0,500)}</div>;
    return this.props.children;
  }
}

function TestB() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <EC>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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

setTimeout(() => {
  if (_d) _d.innerHTML += '\n[5s] children=' + rootEl.childElementCount + ' html.len=' + rootEl.innerHTML.length;
  if (_d) _d.innerHTML += '\n[5s] preview=' + rootEl.innerHTML.substring(0, 500);
}, 5000);
