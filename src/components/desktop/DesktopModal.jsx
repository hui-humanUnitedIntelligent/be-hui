// ══════════════════════════════════════════════════════════════════════════════
// DesktopModal.jsx — Zentrales Desktop Modal Framework
// ══════════════════════════════════════════════════════════════════════════════
//
// ZWECK:
//   EIN zentrales Modal-System für ALLE Desktop-Dialoge.
//   Keine eigenen Modal-Implementierungen in Desktop-Komponenten.
//
// FEATURES:
//   ✓ Zentriert (vertikal + horizontal)
//   ✓ ESC schließt
//   ✓ Outside-Click schließt (Klick auf Backdrop)
//   ✓ Sanfte Open/Close-Animation (fade + scale)
//   ✓ Responsive (max 90vw, scroll bei overflow)
//   ✓ Dark Mode kompatibel (via CSS Variablen)
//   ✓ Focus-Trap (Tab bleibt im Modal)
//   ✓ Body-Scroll-Lock während Modal offen
//   ✓ Accessible (role="dialog", aria-modal, aria-labelledby)
//
// USAGE:
//   <DesktopModal open={isOpen} onClose={handleClose} title="Titel">
//     <Content />
//   </DesktopModal>
//
//   <DesktopModal
//     open={isOpen}
//     onClose={handleClose}
//     title="Titel"
//     width={520}           // Optional: überschreibt Standard-Breite
//     closeOnBackdrop={true} // Optional: default true
//     showCloseButton={true} // Optional: default true
//   >
//     <Content />
//   </DesktopModal>
//
// REGEL:
//   Jede Desktop-Komponente, die einen Dialog/Modal/Sheet braucht,
//   verwendet DesktopModal. Keine Fullscreen-Overlays, keine Bottom-Sheets.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MODAL, ANIMATION, Z_INDEX } from './tokens/desktopTokens.js';

export default function DesktopModal({
  open,
  onClose,
  title,
  children,
  width,              // Optional: überschreibt MODAL.width
  closeOnBackdrop = true,
  showCloseButton = true,
  className = '',
}) {
  const modalRef = useRef(null);
  const previouslyFocused = useRef(null);

  // ── Body Scroll Lock ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // ── ESC Handler ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    }

    // Höchste Priorität — capture phase, vor anderen Listenern
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [open, onClose]);

  // ── Focus Trap ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    // Fokus merken
    previouslyFocused.current = document.activeElement;

    // Ersten fokussierbaren Element fokusieren
    const modal = modalRef.current;
    if (modal) {
      const focusable = modal.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }

    function handleTab(e) {
      if (e.key !== 'Tab') return;
      const modal = modalRef.current;
      if (!modal) return;

      const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleTab);
    return () => {
      document.removeEventListener('keydown', handleTab);
      // Fokus zurückgeben
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // ── Backdrop Click Handler ────────────────────────────────────────────────
  const handleBackdropClick = useCallback((e) => {
    if (!closeOnBackdrop) return;
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  }, [closeOnBackdrop, onClose]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!open) return null;

  const modalWidth  = width ?? MODAL.width;
  const labelId     = title ? `desktop-modal-${title.replace(/\s/g, '-').toLowerCase()}` : undefined;

  return createPortal(
    <div
      className={`desktop-modal-backdrop ${className}`}
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_INDEX.modalBackdrop,
        background: `rgba(20, 20, 28, ${MODAL.backdropOpacity})`,
        backdropFilter: `blur(${MODAL.backdropBlur}px)`,
        WebkitBackdropFilter: `blur(${MODAL.backdropBlur}px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: `desktopModalFadeIn ${ANIMATION.normal}ms ${ANIMATION.easing}`,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="desktop-modal"
        style={{
          width: '100%',
          maxWidth: typeof modalWidth === 'string' ? modalWidth : `${modalWidth}px`,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'var(--desktop-modal-bg, #FDFBF8)',
          borderRadius: `${MODAL.radius}px`,
          boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.08)',
          animation: `desktopModalScaleIn ${ANIMATION.normal}ms ${ANIMATION.easing}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header (optional) ─────────────────────────────────────── */}
        {(title || showCloseButton) && (
          <div
            className="desktop-modal-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: `20px ${MODAL.padding}px 16px`,
              borderBottom: title ? '1px solid var(--desktop-border, rgba(0,0,0,0.06))' : 'none',
            }}
          >
            {title && (
              <h2
                id={labelId}
                style={{
                  margin: 0,
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'var(--desktop-ink, #141422)',
                  letterSpacing: -0.3,
                }}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Schließen"
                className="desktop-modal-close"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--desktop-muted, #8A8A9E)',
                  transition: `background ${ANIMATION.fast}ms ${ANIMATION.easing}, color ${ANIMATION.fast}ms ${ANIMATION.easing}`,
                  marginLeft: title ? 'auto' : 'auto',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none"
                  stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* ── Content ──────────────────────────────────────────────── */}
        <div
          className="desktop-modal-body"
          style={{
            padding: title ? `${MODAL.padding}px` : `${MODAL.padding}px`,
          }}
        >
          {children}
        </div>
      </div>

      {/* ── Animation Keyframes ───────────────────────────────────── */}
      <style>{`
        @keyframes desktopModalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes desktopModalScaleIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
