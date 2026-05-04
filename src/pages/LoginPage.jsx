import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';

const CORAL = "#FF6B5B";
const TEAL = "#2ABFAC";

export default function LoginPage({ onSuccess }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
      else onSuccess?.();
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error.message);
      else setSuccess('✅ Bitte bestätige deine E-Mail! Dann kannst du dich einloggen.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #fff5f4 0%, #f0fffe 100%)',
      padding: 24, fontFamily: '-apple-system, sans-serif'
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, margin: '0 auto 12px'
        }}>🌱</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>
          <span style={{ color: CORAL }}>H</span>uman{' '}
          <span style={{ color: TEAL }}>U</span>nited{' '}
          <span style={{ color: CORAL }}>I</span>ntelligent
        </div>
        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>
          Talente, Werke & Impact — an einem Ort
        </div>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: 32,
        width: '100%', maxWidth: 360,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>
          {mode === 'login' ? 'Willkommen zurück 👋' : 'Konto erstellen ✨'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <input
              type="text" placeholder="Dein Name" value={fullName}
              onChange={e => setFullName(e.target.value)} required
              style={inputStyle}
            />
          )}
          <input
            type="email" placeholder="E-Mail" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={inputStyle}
          />
          <input
            type="password" placeholder="Passwort" value={password}
            onChange={e => setPassword(e.target.value)} required minLength={6}
            style={inputStyle}
          />

          {error && <div style={{ color: CORAL, fontSize: 13, padding: '8px 12px', background: '#fff5f4', borderRadius: 8 }}>{error}</div>}
          {success && <div style={{ color: TEAL, fontSize: 13, padding: '8px 12px', background: '#f0fffe', borderRadius: 8 }}>{success}</div>}

          <button type="submit" disabled={loading} style={{
            background: `linear-gradient(135deg, ${CORAL}, ${TEAL})`,
            color: '#fff', border: 'none', borderRadius: 12,
            padding: '14px', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: 4
          }}>
            {loading ? '...' : mode === 'login' ? 'Einloggen' : 'Registrieren'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' }}>
          {mode === 'login' ? (
            <>Noch kein Konto?{' '}
              <span onClick={() => setMode('signup')} style={{ color: TEAL, fontWeight: 600, cursor: 'pointer' }}>
                Jetzt registrieren
              </span>
            </>
          ) : (
            <>Schon dabei?{' '}
              <span onClick={() => setMode('login')} style={{ color: CORAL, fontWeight: 600, cursor: 'pointer' }}>
                Einloggen
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '12px 16px', borderRadius: 12, border: '1.5px solid #eee',
  fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box',
  fontFamily: '-apple-system, sans-serif'
};
