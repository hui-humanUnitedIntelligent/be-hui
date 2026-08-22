import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './web.css';

const _diag = document.getElementById('diag');
if (_diag) _diag.innerHTML += '<br>[JS] Test 1: BrowserRouter + div';

try {
  ReactDOM.createRoot(document.getElementById('web-root')).render(
    React.createElement(BrowserRouter, { basename: '/app' },
      React.createElement('div', { style: { padding: 40, fontSize: 24 } }, 'BrowserRouter works!')
    )
  );
  _diag && (_diag.innerHTML += '<br>[JS] render() called');
} catch (e) {
  _diag && (_diag.innerHTML += '<br>[JS] ❌ CRASH: ' + e.message);
}

setTimeout(function() {
  var root = document.getElementById('web-root');
  _diag && (_diag.innerHTML += '<br>[1s] children: ' + (root ? root.childNodes.length : 'NULL'));
}, 1000);
