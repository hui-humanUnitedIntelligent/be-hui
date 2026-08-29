// src/components/BiometricLockScreen.jsx
// Biometric + PIN Lock Screen — zeigt sich beim App-Start / Background-Resume
// wenn Biometric oder PIN aktiviert ist.
// ══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../hooks/useTranslation.js';
import { HUILogo } from './brand/HUILogo.jsx';
import {
  checkBiometricAvailability,
  isBiometricEnabled,
  isPINEnabled,
  authenticateWithBiometric,
  getSavedSession,
  verifyPIN,
  clearSavedSession,
} from '../lib/biometricService.js';

// ── Theme (konsistent mit AuthGate.jsx) ────────────────────────────
const TEAL = '#16D7C5';
const INK  = '#1A1A2E';

// ── Inline SVG Icons (kein Emoji) ──────────────────────────────────
function FingerprintIcon({ size = 56, color = TEAL }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 11a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
      <path d="M14 13c0 1.57-.11 3.08-.32 4"/>
      <path d="M6.26 16A13 13 0 0 0 6 13c0-3.31 2.69-6 6-6a5.85 5.85 0 0 1 3.4 1.08"/>
      <path d="M9.68 20a9 9 0 0 1-.5-2.5c-.13-1.26-.18-2.74-.18-4.5a3 3 0 0 1 6 0c0 .52 0 1.04-.02 1.55"/>
      <path d="M17.7 18.5c.2-1.79.3-3.75.3-5.5a6 6 0 0 0-10.5-3.97"/>
      <path d="M5 13a7 7 0 0 1 14 0c0 1.1-.05 2.17-.15 3.2"/>
      <path d="M20.5 17a22 22 0 0 1-.5 3.5"/>
    </svg>
  );
}

export function BiometricLockScreen({ onUnlock, onLogout }) {
  const { t } = useTranslation();

  const [mode, setMode] = useState('loading'); // loading | biometric | pin | error
  const [pinInput, setPinInput] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const autoAttemptedRef = useRef(false);

  // ── Init: Verfügbare Methoden prüfen ────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const avail = await checkBiometricAvailability();
      const bioOn = await isBiometricEnabled();
      const pinOn = await isPINEnabled();
      if (cancelled) return;

      setBiometricAvailable(avail.available);
      setBiometricEnabled(bioOn);
      setPinEnabled(pinOn);

      if (bioOn && avail.available) {
        setMode('biometric');
      } else if (pinOn) {
        setMode('pin');
      } else {
        // Weder Biometric noch PIN aktiv → direkt unlocken
        onUnlock?.(null, null);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-Biometric Attempt (einmalig) ───────────────────────────
  useEffect(() => {
    if (mode === 'biometric' && !autoAttemptedRef.current) {
      autoAttemptedRef.current = true;
      attemptBiometric();
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Biometric durchführen ───────────────────────────────────────
  const attemptBiometric = useCallback(async () => {
    setBusy(true);
    const success = await authenticateWithBiometric();
    setBusy(false);

    if (success) {
      const { email, refreshToken } = await getSavedSession();
      onUnlock?.(refreshToken, email);
    } else {
      // Biometric fehlgeschlagen → PIN Fallback (falls aktiv)
      if (pinEnabled) {
        setMode('pin');
      } else {
        setMode('error');
      }
    }
  }, [pinEnabled, onUnlock]);

  // ── PIN Eingabe ─────────────────────────────────────────────────
  const handlePinChange = useCallback(async (value) => {
    const clean = value.replace(/\D/g, '').slice(0, 6);
    setPinInput(clean);

    if (clean.length === 6) {
      setBusy(true);
      const ok = await verifyPIN(clean);
      setBusy(false);

      if (ok) {
        const { email, refreshToken } = await getSavedSession();
        onUnlock?.(refreshToken, email);
      } else {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        setShake(true);
        setTimeout(() => setShake(false), 400);
        setPinInput('');

        if (next >= 3) {
          await clearSavedSession();
          onLogout?.();
        }
      }
    }
  }, [failedAttempts, onUnlock, onLogout]);

  // Eigener In-App-Ziffernblock statt natives System-Keyboard
  // (KEYBOARD-VISIBILITY-FIX, 2026-08-29 — gleicher Fix wie im
  // Settings-PIN-Setup-Dialog): Ein hidden <input autoFocus> ist auf
  // Android/Xiaomi-Geräten fragil — mal öffnet es die Systemtastatur
  // gar nicht (dieser Screen), mal verdeckt die Systemtastatur den
  // darüberliegenden Dialog (Settings-PIN-Setup). Fix: kein natives
  // Keyboard mehr, Ziffern werden über eigene Buttons erfasst.
  const handlePinDigit = useCallback((digit) => {
    if (busy || pinInput.length >= 6) return;
    handlePinChange(pinInput + digit);
  }, [busy, pinInput, handlePinChange]);

  const handlePinBackspace = useCallback(() => {
    if (busy) return;
    setPinInput(prev => prev.slice(0, -1));
  }, [busy]);

  // ── Logout ──────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    await clearSavedSession();
    onLogout?.();
  }, [onLogout]);

  // ── Render ──────────────────────────────────────────────────────
  if (mode === 'loading') return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 20000,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#ffffff',
      fontFamily: 'Inter, sans-serif',
      padding: '24px',
    }}>
      {/* Logo */}
      <HUILogo size={56} style={{ marginBottom: 32 }} />

      {/* Titel */}
      <h1 style={{
        fontSize: 22, fontWeight: 600, color: INK,
        letterSpacing: -0.4, marginBottom: 8, margin: 0,
      }}>
        {t('lock.unlockTitle')}
      </h1>

      {/* Subtext */}
      <p style={{
        fontSize: 14, color: 'rgba(26,26,46,0.5)',
        marginBottom: 32, textAlign: 'center', lineHeight: 1.5, margin: 0,
      }}>
        {mode === 'biometric'
          ? t('lock.biometricPrompt')
          : mode === 'pin'
            ? t('lock.pinPrompt')
            : t('lock.lockedOut')}
      </p>

      {/* Biometric Mode */}
      {mode === 'biometric' && (
        <button
          onClick={attemptBiometric}
          disabled={busy}
          style={{
            background: 'none', border: 'none', cursor: busy ? 'default' : 'pointer',
            padding: 16, borderRadius: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.15s',
            opacity: busy ? 0.5 : 1,
          }}
          aria-label={t('lock.biometricRetry')}
        >
          <FingerprintIcon size={56} color={TEAL} />
        </button>
      )}

      {/* PIN Mode */}
      {mode === 'pin' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
          animation: shake ? 'huiShake 0.4s ease' : undefined,
        }}>
          <style>{`
            @keyframes huiShake {
              0%, 100% { transform: translateX(0); }
              20% { transform: translateX(-8px); }
              40% { transform: translateX(8px); }
              60% { transform: translateX(-6px); }
              80% { transform: translateX(4px); }
            }
          `}</style>

          {/* PIN Dots */}
          <div style={{ display: 'flex', gap: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${i < pinInput.length ? TEAL : 'rgba(26,26,46,0.15)'}`,
                background: i < pinInput.length ? TEAL : 'transparent',
                transition: 'all 0.15s ease',
              }} />
            ))}
          </div>

          {/* Eigener Ziffernblock — kein natives Keyboard (siehe Kommentar oben) */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
            width: '100%', maxWidth: 340,
            opacity: busy ? 0.5 : 1, pointerEvents: busy ? 'none' : 'auto',
          }}>
            {["1","2","3","4","5","6","7","8","9"].map((d) => (
              <button
                key={d}
                onClick={() => handlePinDigit(d)}
                style={{
                  padding: '16px 0', borderRadius: 16, border: 'none',
                  background: 'rgba(26,26,46,0.05)', color: INK,
                  fontSize: 20, fontWeight: 600,
                  cursor: 'pointer', touchAction: 'manipulation',
                }}
              >
                {d}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePinDigit("0")}
              style={{
                padding: '16px 0', borderRadius: 16, border: 'none',
                background: 'rgba(26,26,46,0.05)', color: INK,
                fontSize: 20, fontWeight: 600,
                cursor: 'pointer', touchAction: 'manipulation',
              }}
            >
              0
            </button>
            <button
              onClick={handlePinBackspace}
              aria-label="Backspace"
              style={{
                padding: '16px 0', borderRadius: 16, border: 'none',
                background: 'none', color: 'rgba(26,26,46,0.5)',
                fontSize: 18, fontWeight: 600,
                cursor: 'pointer', touchAction: 'manipulation',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ⌫
            </button>
          </div>

          {/* Fehlerhinweis */}
          {failedAttempts > 0 && (
            <p style={{
              fontSize: 13, color: '#EF4444',
              textAlign: 'center', margin: 0,
            }}>
              {t('lock.pinWrong', { attempts: 3 - failedAttempts })}
            </p>
          )}

          {/* Biometric Button (falls verfügbar) */}
          {biometricAvailable && biometricEnabled && (
            <button
              onClick={() => setMode('biometric')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 8, display: 'flex', alignItems: 'center',
                color: TEAL, fontSize: 13, fontWeight: 500,
              }}
            >
              <FingerprintIcon size={20} color={TEAL} />
              <span style={{ marginLeft: 6 }}>{t('lock.useBiometric')}</span>
            </button>
          )}
        </div>
      )}

      {/* Error Mode */}
      {mode === 'error' && (
        <p style={{
          fontSize: 14, color: '#EF4444', textAlign: 'center',
          marginBottom: 24, lineHeight: 1.5,
        }}>
          {t('lock.biometricFailed')}
        </p>
      )}

      {/* Abbrechen / Logout */}
      <button
        onClick={handleLogout}
        style={{
          marginTop: 40,
          background: 'none', border: 'none',
          color: 'rgba(26,26,46,0.35)', fontSize: 13,
          cursor: 'pointer', textDecoration: 'underline',
          touchAction: 'manipulation',
        }}
      >
        {t('lock.logout')}
      </button>
    </div>,
    document.body
  );
}
