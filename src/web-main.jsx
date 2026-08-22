import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import LoginPage from './pages/LoginPage';
import LandingPage from './components/landing/LandingPage';
import './index.css';
import './web.css';
import './landing.css';

const _d = document.getElementById('diag');
const rootEl = document.getElementById('web-root');
if (_d) _d.innerHTML = '[JS] start';

class ErrorCatcher extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    if (_d) _d.innerHTML += '\n[CAUGHT] ' + error.message + '\n' + (info.componentStack||'').substring(0,400);
  }
  render() {
    if (this.state.error) return <div style={{padding:20,color:'red'}}>{String(this.state.error.message)}</div>;
    return this.props.children;
  }
}

// Test 1: Just LoginPage directly (no routes)
function TestLoginPage() {
  return (
    <BrowserRouter basename="/app">
      <ErrorCatcher>
        <LoginPage />
      </ErrorCatcher>
    </BrowserRouter>
  );
}

if (_d) _d.innerHTML += '\n[JS] importing done';

try {
  const r = ReactDOM.createRoot(rootEl);
  r.render(<TestLoginPage />);
  if (_d) _d.innerHTML += '\n[JS] render() called';
} catch(e) {
  if (_d) _d.innerHTML += '\n[JS] CRASH: ' + e.message;
}

setTimeout(() => {
  if (_d) _d.innerHTML += '\n[3s] children=' + rootEl.childElementCount + ' html.len=' + rootEl.innerHTML.length;
  if (_d) _d.innerHTML += '\n[3s] preview=' + rootEl.innerHTML.substring(0, 500);
}, 3000);
