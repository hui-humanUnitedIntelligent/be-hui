import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../lib/supabaseClient';
import { platformPath } from '../../lib/platform.js';
import { useTranslation } from '../../hooks/useTranslation.js';

/**
 * EmailVerificationModal
 *
 * Zeigt einen blockierenden Modal nach der Registrierung, der erst
 * verschwindet, wenn die E-Mail-Adresse bestätigt wurde.
 *
 * Pollt Supabase alle 3 Sekunden via signInWithPassword.
 *  - "Email not confirmed" → weiter pollen
 *  - Erfolg → Modal schließen, App neu laden → Home Feed
 *
 * Da signUp mit mailer_autoconfirm=false KEINE Session zurückgibt,
 * ist signInWithPassword der zuverlässigste Weg zu prüfen, ob die
 * E-Mail bereits bestätigt wurde.
 *
 * Portal zu document.body, zIndex 10500 (Conform footer-navbar-zindex Regel).
 */
export default function EmailVerificationModal({ open, email, password, onClose }) {
  const { t } = useTranslation();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState('');
  const [resendIsError, setResendIsError] = useState(false);
  const [polling, setPolling] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const pollRef = useRef(null);
  const cooldownRef = useRef(null);

  // ── Polling: alle 3 Sekunden rpc_check_email_confirmed (leise, kein Auth-Versuch) ──
  // Vorher: signInWithPassword bei jedem Tick → 400 Bad Request solange nicht
  // bestätigt (Console-Rauschen, siehe Report 2026-08-15). Jetzt: read-only RPC
  // ohne Passwort-Versuch. signInWithPassword wird erst EIN EINZIGES MAL
  // aufgerufen, sobald die RPC bestätigt meldet — dann garantiert erfolgreich.
  const checkConfirmed = useCallback(async () => {
    if (!email) return;
    try {
      const { data: isConfirmed, error: rpcErr } = await supabase.rpc('rpc_check_email_confirmed', {
        p_email: email,
      });
      if (rpcErr || !isConfirmed) return; // weiter pollen

      // E-Mail ist bestätigt → jetzt einmalig einloggen, um die Session zu erhalten
      if (!password) return;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (data?.session && !error) {
        setConfirmed(true);
        setPolling(false);
        if (pollRef.current) clearInterval(pollRef.current);
        // Kurze Verzögerung für visuelles Feedback, dann reload
        setTimeout(() => {
          try {
            const v = Date.now();
            window.location.replace(platformPath('/Home') + '?v=' + v);
          } catch (_) {
            window.location.href = platformPath('/Home');
          }
        }, 1000);
      }
    } catch (e) {
      // Netzwerkfehler etc → weiter pollen
    }
  }, [email, password]);

  useEffect(() => {
    if (!open) return;

    // Starte Polling
    setPolling(true);
    setConfirmed(false);

    // Erster Check nach 2 Sekunden (gibt Mailzustellung etwas Zeit)
    const initialTimer = setTimeout(() => {
      checkConfirmed();
    }, 2000);

    // Dann alle 3 Sekunden
    pollRef.current = setInterval(() => {
      checkConfirmed();
    }, 3000);

    return () => {
      clearTimeout(initialTimer);
      if (pollRef.current) clearInterval(pollRef.current);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [open, checkConfirmed]);

  // ── Mail erneut senden ──
  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setResendMsg(''); setResendIsError(false);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: window.location.origin + platformPath('/auth/callback'),
        },
      });
      if (error) {
        setResendMsg(t("verify.resendFailedRetry")); setResendIsError(true);
      } else {
        setResendMsg(t("verify.resendSuccess")); setResendIsError(false);
        setResendCooldown(60);
        cooldownRef.current = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(cooldownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (e) {
      setResendMsg(t("verify.resendFailed")); setResendIsError(true);
    }
  }, [email, resendCooldown]);

  if (!open) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10500,
      background: 'rgba(0,0,0,0.88)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: 'rgba(20,20,22,0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 24,
        padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Icon */}
        <div style={{
          width: 56,
          height: 56,
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: confirmed ? 'rgba(22,215,197,0.15)' : 'rgba(22,215,197,0.08)',
          border: confirmed ? '2px solid #16D7C5' : '2px solid rgba(22,215,197,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          color: '#16D7C5',
          transition: 'all 400ms ease',
        }}>
          {confirmed ? '✓' : (
            <span style={{
              display: 'inline-block',
              width: 24,
              height: 24,
              border: '2px solid rgba(22,215,197,0.3)',
              borderTop: '2px solid #16D7C5',
              borderRadius: '50%',
              animation: 'hui-verify-spin 1s linear infinite',
            }}/>
          )}
        </div>

        <style>{`
          @keyframes hui-verify-spin { to { transform: rotate(360deg); } }
          @keyframes hui-verify-fade { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: translateY(0); } }
        `}</style>

        {/* Titel */}
        <h2 style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#fff',
          marginBottom: 12,
          letterSpacing: '-0.3px',
        }}>
          {confirmed ? t("verify.emailConfirmed") : t("verify.confirmYourEmail")}
        </h2>

        {/* Text */}
        <p style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.6,
          marginBottom: 20,
        }}>
          {confirmed
            ? t("verify.accountActivatedRedirect")
            : <>{t("verify.sentToPrefix")} <strong style={{ color: 'rgba(22,215,197,0.9)' }}>{email}</strong> {t("verify.sentToSuffix")}</>
          }
        </p>

        {/* Polling-Indikator */}
        {polling && !confirmed && (
          <div style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.35)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#16D7C5',
              animation: 'hui-verify-spin 1.5s ease-in-out infinite',
            }}/>
            {t("verify.checkingConfirmation")}
          </div>
        )}

        {/* Resend Button */}
        {!confirmed && (
          <>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              style={{
                width: '100%',
                padding: '12px',
                background: resendCooldown > 0 ? 'rgba(255,255,255,0.05)' : 'rgba(22,215,197,0.12)',
                border: '1px solid rgba(22,215,197,0.25)',
                borderRadius: 12,
                color: resendCooldown > 0 ? 'rgba(255,255,255,0.3)' : '#16D7C5',
                fontSize: 14,
                fontWeight: 500,
                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 200ms ease',
              }}
            >
              {resendCooldown > 0 ? t("verify.resendCountdown", { s: resendCooldown }) : t("verify.resendButton")}
            </button>
            {resendMsg && (
              <div style={{
                fontSize: 12,
                color: resendIsError ? 'rgba(255,138,107,0.8)' : 'rgba(22,215,197,0.7)',
                marginTop: 8,
              }}>
                {resendMsg}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        {!confirmed && (
          <p style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.25)',
            marginTop: 24,
            lineHeight: 1.5,
          }}>
            {t("verify.checkSpam")}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
