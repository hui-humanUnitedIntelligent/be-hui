// ══════════════════════════════════════════════════════════════════════════════
// StudioOverviewPage.jsx — HUI Studio V7.5 — Übersicht (Mitglieder-Startbereich)
// ══════════════════════════════════════════════════════════════════════════════
//
// Zweck: Begrüßungsseite für Mitglieder beim Betreten des Studios.
//        Zeigt persönlichen Wirkungsstatus und Schnellzugriff auf Bereiche.
//
// Architektur-Richtlinie: Diese Seite ist bewusst leichtgewichtig.
// Sie dient ausschließlich als Informations- und Navigationsseite.
// Business-Logik, Berechnungen oder komplexe Prozesse gehören nicht hierhin.
// Sie zeigt Status, Verantwortungen und Schnellzugriffe — nichts weiter.
//
// V7.5: Die erste Seite, die ein Mitglied sieht. Ruhig, klar, menschenzentriert.
// Rendert INLINE im studio-workspace (kein SubPageShell-Overlay).
//
// DATEN: useAuth (profile), useNotifications (unread count)
// Keine neue Business-Logik — nur Anzeige bestehender Daten.
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useAuth } from '../../lib/AuthContext.jsx';
import { isProfileTalent } from '../../lib/profileUtils.js';

const C = {
  teal:    '#16D7C5',
  coral:   '#FF8A6B',
  cream:   '#F9F7F4',
  ink:     '#1A1A1A',
  muted:   'rgba(80,80,80,0.55)',
  white:   '#FFFFFF',
  border:  'rgba(0,0,0,0.06)',
};

export default function StudioOverviewPage({ onNavigate }) {
  const { profile } = useAuth();
  const isTalent = isProfileTalent(profile);
  const isAmbassador = profile?.is_ambassador === true;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  const displayName = profile?.display_name || profile?.username || 'Mitglied';

  // Verantwortungs-Status
  const responsibilities = [];
  if (isTalent) responsibilities.push({ label: 'Talent', emoji: '✨' });
  if (isAmbassador) responsibilities.push({ label: 'Ambassador', emoji: '🤝' });
  if (profile?.profile_modules?.guardian?.status === 'active') responsibilities.push({ label: 'Guardian', emoji: '🛡' });
  if (profile?.profile_modules?.team?.status === 'active') responsibilities.push({ label: 'Team', emoji: '👥' });
  if (isAdmin) responsibilities.push({ label: 'Administrator', emoji: '⚙' });

  return (
    <div style={{
      padding: '40px 32px',
      maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Begrüßung */}
      <h1 style={{
        fontSize: 28, fontWeight: 700, color: C.ink,
        marginBottom: 8, lineHeight: 1.3,
      }}>
        Willkommen, {displayName}
      </h1>
      <p style={{
        fontSize: 15, color: C.muted,
        marginBottom: 32,
      }}>
        Dein persönlicher Wirkungsraum im Dachverband „Einer für Alle, alle Fair(ein)t".
      </p>

      {/* Mitgliedschafts-Status */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 16px', borderRadius: 12,
        background: `${C.teal}12`, color: C.teal,
        fontSize: 13, fontWeight: 600,
        marginBottom: 32,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.teal }} />
        Mitglied
      </div>

      {/* Verantwortungen */}
      {responsibilities.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Deine Verantwortungen
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {responsibilities.map(r => (
              <div key={r.label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 12,
                background: C.white, border: `1px solid ${C.border}`,
                fontSize: 14, fontWeight: 500, color: C.ink,
              }}>
                <span>{r.emoji}</span>
                {r.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schnellzugriff */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Schnellzugriff
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <QuickCard
            label="Einstellungen"
            hint="Konto und Präferenzen"
            onClick={() => onNavigate?.('settings')}
          />
          <QuickCard
            label="Support"
            hint="Hilfe und Kontakt"
            onClick={() => onNavigate?.('support')}
          />
        </div>
      </div>

      {/* Hinweis für Mitglieder ohne Talent-Verantwortung */}
      {!isTalent && (
        <div style={{
          padding: '20px', borderRadius: 16,
          background: C.white, border: `1px solid ${C.border}`,
          fontSize: 14, color: C.ink, lineHeight: 1.6,
        }}>
          <p style={{ margin: 0, marginBottom: 8, fontWeight: 600 }}>
            Möchtest du Verantwortung übernehmen?
          </p>
          <p style={{ margin: 0, color: C.muted }}>
            Als Talent kannst du kreative Angebote gestalten und Wirkung entfalten.
            Sprich mit dem HUI-Team, um den Talent-Bewerbungsprozess zu starten.
          </p>
        </div>
      )}
    </div>
  );
}

function QuickCard({ label, hint, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        padding: '16px', borderRadius: 14,
        background: C.white, border: `1px solid ${C.border}`,
        cursor: 'pointer', textAlign: 'left',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 4 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: C.muted }}>
        {hint}
      </span>
    </button>
  );
}
