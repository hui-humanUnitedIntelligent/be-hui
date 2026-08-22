import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext.jsx';
import { ToastContainer } from './lib/useToast.jsx';
import './index.css';
import './web.css';
import './landing.css';

const _diag = document.getElementById('diag');
if (_diag) _diag.innerHTML += '<br>[JS] Test 2: BrowserRouter + AuthProvider + div';

try {
  ReactDOM.createRoot(document.getElementById('web-root')).render(
    React.createElement(BrowserRouter, { basename: '/app' },
      React.createElement(AuthProvider, null,
        React.createElement(React.Fragment, null,
          React.createElement(ToastContainer),
          React.createElement('div', { style: { padding: 40, fontSize: 24 } }, 'AuthProvider works!')
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
