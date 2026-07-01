// src/pages/CheckoutSuccess.jsx
// HUI — Checkout Erfolgreich
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  useEffect(() => {
    // Nach 4 Sekunden zurück zur App
    const t = setTimeout(() => navigate('/studio'), 4000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
      background: 'var(--bg-primary, #0f0f0f)', color: 'var(--text-primary, #fff)',
      padding: 32,
    }}>
      <div style={{ fontSize: 64 }}>✅</div>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Zahlung erfolgreich!</h1>
      <p style={{ color: '#aaa', fontSize: 14, textAlign: 'center', maxWidth: 360 }}>
        Deine Zahlung wurde bestätigt. Du wirst gleich weitergeleitet…
      </p>
      {sessionId && (
        <p style={{ fontSize: 11, color: '#555' }}>Referenz: {sessionId.slice(0,20)}…</p>
      )}
      <button onClick={() => navigate('/studio')} style={{
        padding: '10px 24px', borderRadius: 10, border: 'none',
        background: '#51cf66', color: '#000', fontWeight: 700, cursor: 'pointer',
      }}>Zurück zu HUI</button>
    </div>
  );
}
