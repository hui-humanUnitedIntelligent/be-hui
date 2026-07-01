// src/pages/CheckoutCancel.jsx
// HUI — Checkout Abgebrochen
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CheckoutCancel() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      background: 'var(--bg-primary, #0f0f0f)', color: 'var(--text-primary, #fff)',
      padding: 32,
    }}>
      <div style={{ fontSize: 64 }}>❌</div>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Zahlung abgebrochen</h1>
      <p style={{ color: '#aaa', fontSize: 14, textAlign: 'center', maxWidth: 360 }}>
        Die Zahlung wurde nicht abgeschlossen. Kein Geld wurde abgebucht.
      </p>
      <button onClick={() => navigate(-1)} style={{
        padding: '10px 24px', borderRadius: 10, border: 'none',
        background: '#635BFF', color: '#fff', fontWeight: 700, cursor: 'pointer',
      }}>Zurück</button>
    </div>
  );
}
