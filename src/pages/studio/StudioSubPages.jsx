// src/pages/studio/StudioSubPages.jsx
// HUI Creator Studio — Sub-Page-Stubs
// Ersetzt MeinHUI_SubPages.jsx (gelöscht im Profile Purge Pass)
// Eigenständig — kein altes Profil-System

import React from "react";

const C = {
  teal:   "#16D7C5",
  coral:  "#FF8A6B",
  cream:  "#F9F7F4",
  ink:    "#1A1A1A",
  muted:  "rgba(80,80,80,0.55)",
};

/* ── Gemeinsamer Sub-Page Wrapper ── */
function SubPageShell({ title, emoji, onBack, children }) {
  return (
    <div style={{
      position:"fixed", inset:0,
      background:C.cream,
      display:"flex", flexDirection:"column",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px",
        background:"white",
        borderBottom:"1px solid rgba(0,0,0,0.06)",
      }}>
        <button onClick={onBack} style={{
          width:36, height:36, borderRadius:10,
          background:"rgba(0,0,0,0.05)", border:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", fontSize:16,
        }}>←</button>
        <span style={{ fontSize:18 }}>{emoji}</span>
        <span style={{
          fontSize:17, fontWeight:700, color:C.ink,
        }}>{title}</span>
      </div>

      {/* Content */}
      <div style={{
        flex:1, overflowY:"auto",
        padding:"24px 20px",
        WebkitOverflowScrolling:"touch",
      }}>
        {children || (
          <div style={{
            textAlign:"center", padding:"60px 20px",
            color:C.muted,
          }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✦</div>
            <div style={{ fontSize:14 }}>
              Dieser Bereich wird gerade aufgebaut.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-Pages ── */

export function AnalyticsPage({ onBack }) {
  return (
    <SubPageShell title="Reichweite" emoji="✦" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Analytics werden bald verfügbar sein.
      </div>
    </SubPageShell>
  );
}

export function EinnahmenPage({ onBack }) {
  return (
    <SubPageShell title="Einnahmen" emoji="◎" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Einnahmen-Übersicht wird bald verfügbar sein.
      </div>
    </SubPageShell>
  );
}

export function MeineInhaltePage({ onBack }) {
  return (
    <SubPageShell title="Werke & Inhalte" emoji="🎨" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Deine Werke werden hier angezeigt.
      </div>
    </SubPageShell>
  );
}

export function VerfuegbarkeitPage({ onBack }) {
  return (
    <SubPageShell title="Verfügbarkeit" emoji="🗓" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Verfügbarkeits-Einstellungen folgen bald.
      </div>
    </SubPageShell>
  );
}

export function BestellungenPage({ onBack }) {
  return (
    <SubPageShell title="Zusammenarbeit" emoji="🤝" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Anfragen & Projekte werden hier verwaltet.
      </div>
    </SubPageShell>
  );
}

export function ImpactSubPage({ onBack }) {
  return (
    <SubPageShell title="Impact" emoji="🌱" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Dein Beitrag zur Community.
      </div>
    </SubPageShell>
  );
}

export function ReputationInsightsPage({ onBack }) {
  return (
    <SubPageShell title="Vertrauen" emoji="⭐" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Vertrauen & Feedback-Übersicht folgt bald.
      </div>
    </SubPageShell>
  );
}

export function KontoPage({ onBack, onLogout }) {
  return (
    <SubPageShell title="Einstellungen" emoji="◦" onBack={onBack}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{
          padding:"16px", background:"white",
          borderRadius:16,
          boxShadow:"0 2px 8px rgba(0,0,0,0.05)",
          fontSize:14, color:C.ink,
        }}>
          Konto-Einstellungen folgen bald.
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              width:"100%", padding:"14px",
              borderRadius:14, border:"none",
              background:"rgba(255,90,90,0.08)",
              color:"#E53E3E", fontSize:14, fontWeight:600,
              cursor:"pointer",
              marginTop:8,
            }}
          >
            Abmelden
          </button>
        )}
      </div>
    </SubPageShell>
  );
}
