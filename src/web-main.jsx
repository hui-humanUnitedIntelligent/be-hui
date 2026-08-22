import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { ToastContainer } from './lib/useToast.jsx';
import './index.css';
import './web.css';

const _d = document.getElementById('diag');
const rootEl = document.getElementById('web-root');
if (_d) _d.innerHTML = '[JS] start';

function SimpleDiv() {
  return <div style={{padding:40,color:'#0dc4b5'}}>SimpleDiv works</div>;
}

function TestRouter() {
  return (
    <BrowserRouter basename="/app">
      <SimpleDiv />
    </BrowserRouter>
  );
}

function TestAuth() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <SimpleDiv />
      </AuthProvider>
    </BrowserRouter>
  );
}

function TestToast() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <ToastContainer />
        <SimpleDiv />
      </AuthProvider>
    </BrowserRouter>
  );
}

// Step 1: Just BrowserRouter
try {
  const r1 = ReactDOM.createRoot(rootEl);
  r1.render(<TestRouter />);
  if (_d) _d.innerHTML += '\n[JS] TestRouter render() OK';
} catch(e) {
  if (_d) _d.innerHTML += '\n[JS] TestRouter CRASH: ' + e.message;
}

setTimeout(() => {
  if (_d) {
    _d.innerHTML += '\n[1s] After TestRouter: children=' + rootEl.childElementCount + ' html.len=' + rootEl.innerHTML.length;
    _d.innerHTML += '\n[1s] preview=' + rootEl.innerHTML.substring(0, 200);
    
    // Step 2: Replace with AuthProvider
    try {
      const r2 = ReactDOM.createRoot(rootEl);
      r2.render(<TestAuth />);
      if (_d) _d.innerHTML += '\n[1s] TestAuth render() OK';
    } catch(e) {
      if (_d) _d.innerHTML += '\n[1s] TestAuth CRASH: ' + e.message;
    }
    
    setTimeout(() => {
      if (_d) {
        _d.innerHTML += '\n[2s] After TestAuth: children=' + rootEl.childElementCount + ' html.len=' + rootEl.innerHTML.length;
        _d.innerHTML += '\n[2s] preview=' + rootEl.innerHTML.substring(0, 200);
        
        // Step 3: Add ToastContainer
        try {
          const r3 = ReactDOM.createRoot(rootEl);
          r3.render(<TestToast />);
          if (_d) _d.innerHTML += '\n[2s] TestToast render() OK';
        } catch(e) {
          if (_d) _d.innerHTML += '\n[2s] TestToast CRASH: ' + e.message;
        }
        
        setTimeout(() => {
          if (_d) {
            _d.innerHTML += '\n[3s] After TestToast: children=' + rootEl.childElementCount + ' html.len=' + rootEl.innerHTML.length;
            _d.innerHTML += '\n[3s] preview=' + rootEl.innerHTML.substring(0, 200);
          }
        }, 1000);
      }
    }, 1000);
  }
}, 1000);
