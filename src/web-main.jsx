import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { ToastContainer } from './lib/useToast.jsx';
import LandingPage from './components/landing/LandingPage';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import './index.css';
import './web.css';

const _d = document.getElementById('diag');
const rootEl = document.getElementById('web-root');
if (_d) _d.innerHTML = '[JS] start';

// Custom error catcher
class ErrorCatcher extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    if (_d) _d.innerHTML += '\n[CAUGHT] ' + error.message + '\n' + (info.componentStack||'').substring(0,300);
  }
  render() {
    if (this.state.error) {
      return <div style={{padding:20,color:'red',fontFamily:'monospace'}}>ERROR: {this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

function LoadingScreen() {
  return <div className="web-loading"><div className="web-loading-spinner" /><p>Loading…</p></div>;
}

function ConditionalRouter() {
  const { isAuthenticated, loadingAuth } = useAuth();
  if (_d) _d.innerHTML += '\n[JS] useAuth: loading=' + loadingAuth + ' auth=' + isAuthenticated;
  if (loadingAuth) return <LoadingScreen />;
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  return <LoadingScreen />;
}

function FullApp() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <ToastContainer />
        <ConditionalRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

try {
  const r = ReactDOM.createRoot(rootEl);
  r.render(
    <ErrorCatcher>
      <FullApp />
    </ErrorCatcher>
  );
  if (_d) _d.innerHTML += '\n[JS] render() called';
} catch(e) {
  if (_d) _d.innerHTML += '\n[JS] RENDER CRASH: ' + e.message;
}

setTimeout(() => {
  if (_d) {
    _d.innerHTML += '\n[3s] children=' + rootEl.childElementCount + ' html.len=' + rootEl.innerHTML.length;
    _d.innerHTML += '\n[3s] preview=' + rootEl.innerHTML.substring(0, 300);
  }
}, 3000);
