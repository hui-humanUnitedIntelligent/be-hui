import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext.jsx';
import { ToastContainer } from './lib/useToast.jsx';

function LoadingScreen() {
  return React.createElement('div', { style: { padding: 40 } }, 'Loading...');
}

function ConditionalRouter() {
  const { isAuthenticated, loadingAuth } = useAuth();
  if (loadingAuth) return React.createElement(LoadingScreen);
  if (!isAuthenticated) {
    return React.createElement(Routes, null,
      React.createElement(Route, { path: '/login', element: React.createElement('div', {style:{padding:40}}, 'Login Page Placeholder') }),
      React.createElement(Route, { path: '*', element: React.createElement(Navigate, { to: '/login', replace: true }) })
    );
  }
  return React.createElement('div', {style:{padding:40}}, 'Authenticated');
}

export default function WebApp() {
  return React.createElement(BrowserRouter, { basename: '/app' },
    React.createElement(AuthProvider, null,
      React.createElement(React.Fragment, null,
        React.createElement(ToastContainer),
        React.createElement(ConditionalRouter)
      )
    )
  );
}
