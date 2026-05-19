// src/pages/EditProfile.jsx
// Stub — EditProfile wurde in Phase A entfernt
// ProfilePage.jsx importiert diese Komponente
import React from 'react';

export default function EditProfile({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 32,
        maxWidth: 400, width: '90%', textAlign: 'center',
      }}>
        <p style={{ color: '#888', marginBottom: 16 }}>
          Profil bearbeiten kommt bald.
        </p>
        <button
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg,#16D7C5,#11C5B7)',
            color: '#fff', border: 'none', borderRadius: 12,
            padding: '10px 24px', cursor: 'pointer', fontWeight: 600,
          }}
        >
          Schließen
        </button>
      </div>
    </div>
  );
}
