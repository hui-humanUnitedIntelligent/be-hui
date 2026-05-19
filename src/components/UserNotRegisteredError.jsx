// src/components/UserNotRegisteredError.jsx
// Stub — ProtectedRoute zeigt diese Komponente wenn User nicht registriert ist
import React from 'react';

export default function UserNotRegisteredError() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#F9F7F4', padding: 24, textAlign: 'center',
    }}>
      <h2 style={{ color: '#1A1A1A', fontWeight: 700, marginBottom: 8 }}>
        Kein Zugang
      </h2>
      <p style={{ color: '#888', maxWidth: 320 }}>
        Dein Account ist noch nicht vollständig eingerichtet.
        Bitte melde dich erneut an.
      </p>
      <button
        onClick={() => window.location.href = '/login'}
        style={{
          marginTop: 24,
          background: 'linear-gradient(135deg,#16D7C5,#11C5B7)',
          color: '#fff', border: 'none', borderRadius: 12,
          padding: '12px 28px', cursor: 'pointer', fontWeight: 600,
        }}
      >
        Zum Login
      </button>
    </div>
  );
}
