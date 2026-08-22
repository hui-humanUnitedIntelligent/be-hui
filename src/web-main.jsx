import React from 'react';
import ReactDOM from 'react-dom/client';

const _d = document.getElementById('diag');
if (_d) _d.innerHTML += '\n[JS] module loaded';

// Check React/ReactDOM versions
if (_d) _d.innerHTML += '\n[JS] React=' + (React.version || 'no version');
if (_d) _d.innerHTML += '\n[JS] ReactDOM=' + (ReactDOM.version || 'no version');

// Check #web-root exists
const root = document.getElementById('web-root');
if (_d) _d.innerHTML += '\n[JS] #web-root exists=' + (!!root) + ' children=' + (root ? root.childElementCount : 'N/A');

// Step 1: Render simple div
try {
  const r = ReactDOM.createRoot(root);
  r.render(React.createElement('div', {style:{padding:40,color:'#0dc4b5',fontSize:24}}, 'TEST DIV — React works!'));
  
  // Check after render
  if (_d) _d.innerHTML += '\n[JS] After render: #web-root children=' + root.childElementCount + ' innerHTML.len=' + root.innerHTML.length;
  if (_d) _d.innerHTML += '\n[JS] First child tag=' + (root.firstElementChild ? root.firstElementChild.tagName : 'none');
  if (_d) _d.innerHTML += '\n[JS] First child text=' + (root.firstElementChild ? root.firstElementChild.textContent.substring(0,50) : 'none');
  
  // Check after a tick
  setTimeout(() => {
    if (_d) _d.innerHTML += '\n[JS] After 1s: #web-root children=' + root.childElementCount + ' innerHTML.len=' + root.innerHTML.length;
    if (_d) _d.innerHTML += '\n[JS] After 1s child tag=' + (root.firstElementChild ? root.firstElementChild.tagName : 'none');
    if (_d) _d.innerHTML += '\n[JS] After 1s child text=' + (root.firstElementChild ? root.firstElementChild.textContent.substring(0,50) : 'none');
  }, 1000);
  
} catch(e) {
  if (_d) _d.innerHTML += '\n[JS] RENDER CRASH: ' + e.message + '\n' + (e.stack||'').split('\n').slice(0,3).join('\n');
}
