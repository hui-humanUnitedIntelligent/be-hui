// ══════════════════════════════════════════════════════════════════════════════
// DesktopEntwicklungszentrum.jsx — HUI V7.5 — Vertrauenszentrum (Desktop)
// ══════════════════════════════════════════════════════════════════════════════
//
// Das Entwicklungszentrum ist kein Admin-Panel. Es ist das Vertrauenszentrum
// von HUI. Hier werden Menschen begleitet, Verantwortungen vergeben und
// Entwicklungen ermöglicht. Die Oberfläche ist bewusst ruhig, wertschätzend
// und menschlich — nicht wie ein technisches Backoffice.
//
// Zugang: Nur für Team-Mitglieder (role: admin, superadmin).
// V7.5: Kein responsibilities-Tabelle. Vorhandene Felder (is_talent).
//
// Bereiche:
//   Übersicht    — Was braucht Aufmerksamkeit
//   Freigaben    — Warteschlange für Talent-Anträge, Werke, Projekte
//   Begleitung   — Mitglieder mit Verantwortung, aktiv Talente/Ambassador/Team
//   Meldungen    — Kommentar-Meldungen, Moderationsfälle
//   Aktivität    — Ruhige Chronik der letzten Veränderungen
//
// ══════════════════════════════════════════════════════════════════════════════
// ARCHITEKTURREGELN
// ══════════════════════════════════════════════════════════════════════════════
//
// ARL-01: VERANTWORTUNGS-EXKLUSIVITÄT
//   Das Entwicklungszentrum ist die EINZIGE offizielle Stelle, an der
//   Verantwortungen (is_talent, role, membership_active)
//   vergeben, geändert, pausiert oder entzogen werden.
//   Andere Bereiche der Anwendung dürfen Verantwortungen niemals direkt
//   verändern. Dies gilt für Desktop und Mobile.
//
// ARL-02: NOTIFICATION-KONSOLIDENZ (V8-EVOLUTION, nicht V7.5)
//   Die Notification-Erzeugung ist in V7.5 bewusst mehrfach vorhanden
//   (StudioBegleitung, StudioFreigaben, StudioMeldungen).
//   Langfristig soll daraus eine gemeinsame Domain-Funktion entstehen,
//   damit alle Verantwortungsänderungen dieselbe Ereignislogik verwenden.
//   Dies ist ausdrücklich eine V8-Evolution und keine Aufgabe für V7.5.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext.jsx';
import EntwicklungszentrumOverview from '../../pages/studio/EntwicklungszentrumOverview.jsx';
import StudioFreigaben from '../../pages/studio/StudioFreigaben.jsx';
import StudioBegleitung from '../../pages/studio/StudioBegleitung.jsx';
import StudioMeldungen from '../../pages/studio/StudioMeldungen.jsx';
import StudioAktivitaet from '../../pages/studio/StudioAktivitaet.jsx';
import { HUI } from "../../design/hui.design.js";

const C = {
  cream:   HUI.COLOR.creamStudio,
  white:   HUI.COLOR.white,
  ink:     HUI.COLOR.inkStudio,
  muted:   'rgba(80,80,80,0.55)',
  teal:    HUI.COLOR.tealStudio,
  coral:   HUI.COLOR.coralStudio,
  border:  'rgba(0,0,0,0.06)',
};

const NAV_ITEMS = [
  { key: 'overview',   label: 'Übersicht' },
  { key: 'freigaben',  label: 'Freigaben' },
  { key: 'begleitung', label: 'Begleitung' },
  { key: 'meldungen',  label: 'Meldungen' },
  { key: 'aktivitaet', label: 'Aktivität' },
];

export default function DesktopEntwicklungszentrum() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const isTeam = profile?.role === 'admin' || profile?.role === 'superadmin';

  if (!profile) return null;
  if (!isTeam) return null;

  return (
    <div style={{
      display: 'flex', minHeight: '100%',
      background: C.cream,
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Sub-Navigation */}
      <aside style={{
        width: 220, flexShrink: 0,
        padding: '40px 16px 20px',
        borderRight: `1px solid ${C.border}`,
        background: C.cream,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: C.muted,
          textTransform: 'uppercase', letterSpacing: 1,
          marginBottom: 16, paddingLeft: 12,
        }}>
          Vertrauenszentrum
        </div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            style={{
              display: 'block', width: '100%',
              padding: '10px 12px', borderRadius: 10,
              border: 'none', cursor: 'pointer', textAlign: 'left',
              background: activeTab === item.key ? C.white : 'transparent',
              color: activeTab === item.key ? C.ink : C.muted,
              fontSize: 14, fontWeight: activeTab === item.key ? 600 : 400,
              marginBottom: 2,
              transition: 'background 0.2s',
            }}
          >
            {item.label}
          </button>
        ))}
      </aside>

      {/* Workspace */}
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {activeTab === 'overview'   && <EntwicklungszentrumOverview onNavigate={setActiveTab} />}
        {activeTab === 'freigaben'  && <StudioFreigaben />}
        {activeTab === 'begleitung' && <StudioBegleitung />}
        {activeTab === 'meldungen'  && <StudioMeldungen />}
        {activeTab === 'aktivitaet' && <StudioAktivitaet />}
      </div>
    </div>
  );
}
