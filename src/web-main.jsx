import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { ToastContainer } from './lib/useToast.jsx';
import LoginPage from './pages/LoginPage';
import './index.css';
import './web.css';
import './landing.css';

const _d = document.getElementById('diag');
const rootEl = document.getElementById('web-root');
if (_d) _d.innerHTML = '[JS] start';

class EC extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  componentDidCatch(e, i) {
    if (_d) _d.innerHTML += '\n[CAUGHT] ' + e.message + '\n' + (i.componentStack||'').substring(0,300);
  }
  render() {
    if (this.state.err) return <div style={{padding:20,color:'red',fontFamily:'monospace'}}>ERR: {String(this.state.err.message)}</div>;
    return this.props.children;
  }
}

// Test A: Routes with simple div (no LoginPage)
function TestA() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <EC>
          <Routes>
            <Route path="/login" element={<div style={{padding:40}}>Routes+Div works</div>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </EC>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Test B: Routes with real LoginPage
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

// Run Test A first
if (_d) _d.innerHTML += '\n[JS] TestA starting';
const r = ReactDOM.createRoot(rootEl);
r.render(<TestA />);
if (_d) _d.innerHTML += '\n[JS] TestA render() called';

setTimeout(() => {
  if (_d) {
    _d.innerHTML += '\n[2s] TestA: children=' + rootEl.childElementCount + ' html.len=' + rootEl.innerHTML.length;
    _d.innerHTML += '\n[2s] TestA preview=' + rootEl.innerHTML.substring(0, 200);
    
    // Now switch to Test B
    if (_d) _d.innerHTML += '\n[2s] Switching to TestB';
    r.render(<TestB />);
    if (_d) _d.innerHTML += '\n[2s] TestB render() called';
    
    setTimeout(() => {
      if (_d) {
        _d.innerHTML += '\n[5s] TestB: children=' + rootEl.childElementCount + ' html.len=' + rootEl.innerHTML.length;
        _d.innerHTML += '\n[5s] TestB preview=' + rootEl.innerHTML.substring(0, 200);
      }
    }, 3000);
  }
}, 2000);
