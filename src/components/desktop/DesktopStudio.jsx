// ══════════════════════════════════════════════════════════════════════════════
// DesktopStudio.jsx — HUI Desktop V3 — Werkstatt (Workspace)
// ══════════════════════════════════════════════════════════════════════════════
//
// Links: Subnavigation (sticky). Mitte: Arbeitsbereich.
// Keine Mobile-Unterseiten, keine Fullscreen-Modals.
//
// ══════════════════════════════════════════════════════════════════════════════
// ARCHITEKTURREGELN
// ══════════════════════════════════════════════════════════════════════════════
//
// ARL-09: DAS STUDIO GEHÖRT DEM MENSCHEN
//   Das Studio ist kein Werkzeugkasten mit möglichst vielen Funktionen.
//   Es ist der persönliche Wirkungsraum eines Menschen.
//   Jeder Bereich muss einen echten Beitrag zum persönlichen Weg leisten.
//   Neue Bereiche dürfen niemals entstehen, nur weil eine Funktion
//   technisch möglich wäre. Sie müssen einen erkennbaren Mehrwert für
//   den Menschen und seine Wirkung besitzen.
//   Diese Regel ist dauerhaft gültig.
//
// ARL-10: DAS STUDIO BLEIBT RUHIG
//   Das Studio soll langfristig ein Ort der Konzentration bleiben.
//   Keine Benachrichtigungsflut. Keine blinkenden Elemente.
//   Keine künstliche Dringlichkeit. Keine Engagement-Mechaniken.
//   Informationen erscheinen nur dann, wenn sie dem Menschen wirklich helfen.
//   Ruhe ist ein bewusstes Gestaltungsprinzip der Architektur.
//   Diese Regel ist dauerhaft gültig.
// ══════════════════════════════════════════════════════════════════════════════
//
// DATEN: useCreatorBookings, StudioSubPages (reduziert)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { isProfileTalent } from '../../lib/profileUtils.js';
import { useCreatorBookings } from '../../lib/bookingContext.js';

import {
  VerfuegbarkeitPage, MeineInhaltePage, BestellungenPage,
} from '../../pages/studio/StudioSubPages';
import SupportPage from '../../pages/studio/SupportPage.jsx';
import StudioOverviewPage from '../../pages/studio/StudioOverviewPage.jsx';
import DesktopEntwicklungszentrum from './DesktopEntwicklungszentrum.jsx';
import TalentAntragPage from '../../pages/studio/TalentAntragPage.jsx';
import ProjektreisenPage from '../../pages/studio/ProjektreisenPage.jsx';
import WirkungPage from '../../pages/studio/WirkungPage.jsx';
import CommunityPage from '../../pages/studio/CommunityPage.jsx';
import KontoSettingsPage from '../../pages/studio/KontoSettingsPage.jsx';
import { useTranslation } from "../../hooks/useTranslation.js";

function StudioIcon({ name }) {
  const paths = {
    content:      <><rect x="3" y="3" width="14" height="14" rx="2" /><path d="M3 8h14M7 3v5" /></>,
    orders:       <><circle cx="10" cy="10" r="7" /><path d="M7 10l2 2 4-4" /></>,
    availability: <><rect x="3" y="5" width="14" height="12" rx="2" /><path d="M3 9h14M7 5v3" /></>,
    impact:       <path d="M10 2v6l4 2-4 8v-6l-4-2 4-8z" />,
  journey:      <><path d="M4 6c0-1.5 2.5-2.5 6-2.5s6 1 6 2.5v8c0 1.5-2.5 2.5-6 2.5s-6-1-6-2.5V6z" /><path d="M4 6c0 1.5 2.5 2.5 6 2.5s6-1 6-2.5" /></>,
    support:      <><circle cx="10" cy="10" r="7" /><path d="M8 8a2 2 0 1 1 4 0c0 1-2 2-2 2M10 14h.01" /></>,
    settings:     <><circle cx="10" cy="10" r="2.5" /><path d="M10 2v2M10 16v2M2 10h2M16 10h2" /></>,
    overview:     <><rect x="3" y="3" width="6" height="6" rx="1.5" /><rect x="11" y="3" width="6" height="6" rx="1.5" /><rect x="3" y="11" width="6" height="6" rx="1.5" /><rect x="11" y="11" width="6" height="6" rx="1.5" /></>,
    community:    <><circle cx="7" cy="8" r="2.5" /><circle cx="13" cy="8" r="2.5" /><path d="M3 16c0-2.2 1.8-4 4-4s4 1.8 4 4M9 16c0-2.2 1.8-4 4-4s4 1.8 4 4" /></>,
    entwicklung:  <><path d="M10 3v6M6.5 5.5L10 9l3.5-3.5" /><circle cx="10" cy="14" r="3" /><path d="M7.5 16.5L10 14l2.5 2.5" /></>,
  };
  return <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

// ══════════════════════════════════════════════════════════════════════════════
// V7.5 STUDIO NAV — ARCHITEKTUR-DOKUMENTATION
// ══════════════════════════════════════════════════════════════════════════════
//
// talentOnly ist KEIN Spezialfall. Es ist die erste konkrete Ausprägung
// eines allgemeinen Aktivierungsprinzips fuer Studio-Bereiche.
//
// Zukuenftig koennen weitere Gruppen dieselbe Struktur nutzen:
//   membershipRequired  — sichtbar fuer alle aktiven Mitglieder
//   talentOnly            — sichtbar bei Talent-Verantwortung
//   ambassadorRequired   — sichtbar bei Ambassador-Verantwortung
//   guardianRequired     — sichtbar bei Guardian-Verantwortung
//   adminRequired         — sichtbar bei Team-Verantwortung
//   adminRequired         — sichtbar bei Administrator-Verantwortung
//
// Dadurch bleibt die Architektur offen fuer neue Verantwortungen,
// ohne die bestehende Logik umzubauen.
//
// EVOLUTION (nicht V7.5): Die Aktivierungsbedingungen sollten langfristig
// zentralisiert werden (z.B. StudioVisibility oder StudioAccess), damit
// zukuenftige Verantwortungen lediglich neue Regeln ergaenzen und nicht
// DesktopStudio selbst veraendern muessen. Dies ist ausdrücklich keine
// Aufgabe fuer V7.5, sondern eine dokumentierte Evolution fuer spaeter.
//
// FIT-02: Jeder Studio-Bereich hat genau eine Aktivierungsbedingung.
// ADR-008/ADR-009: Keine ausgegrauten Bereiche, keine "Coming Soon".
// ══════════════════════════════════════════════════════════════════════════════
const NAV_GROUPS = [
  // Mitglied — immer sichtbar
  { label: 'Mitglied', items: [
    { key: 'overview', icon: 'overview', label: 'Übersicht' },
    { key: 'community', icon: 'community', label: 'Community' },
  ]},
  // Talent-Bereiche — nur sichtbar bei Talent-Verantwortung
  { label: 'Werkzeug', talentOnly: true, items: [
    { key: 'content', icon: 'content', label: 'Werke & Inhalte' },
    { key: 'orders', icon: 'orders', label: 'Zusammenarbeit' },
    { key: 'availability', icon: 'availability', label: 'Verfügbarkeit' },
  ]},
  // V7.5 Phase 7: Wirkung — ein ruhiger Spiegel, kein Analytics-Dashboard
  { label: 'Wirkung', talentOnly: true, items: [
    { key: 'wirkung', icon: 'impact', label: 'Wirkung' },
  ]},
  // V7.5 Phase 6: Projekte — Projektreisen als fortlaufende Geschichte
  { label: 'Projekte', talentOnly: true, items: [
    { key: 'projektreisen', icon: 'journey', label: 'Projektreisen' },
  ]},
  // Talent-Antrag — sichtbar fuer Mitglieder, die NOCH KEINE Talent-Verantwortung tragen
  // Dieser Bereich verschwindet automatisch, sobald isProfileTalent() === true
  { label: 'Werden', memberRequiredNonTalent: true, items: [
    { key: 'talentantrag', icon: 'overview', label: 'Talent werden' },
  ]},
  // Team — nur sichtbar bei Team-Verantwortung (admin, superadmin)
  { label: 'Vertrauenszentrum', adminRequired: true, items: [
    { key: 'entwicklung', icon: 'entwicklung', label: 'Entwicklungszentrum' },
  ]},
  // Persönliches — immer sichtbar
  { label: 'Persönliches', items: [
    { key: 'support', icon: 'support', label: 'Support' },
    { key: 'settings', icon: 'settings', label: 'Einstellungen' },
  ]},
];

function renderSubPage(activeTool, handleBack, onNavigate) {
  const map = {
    // V7.5 Mitglied-Bereiche
    overview:     () => <StudioOverviewPage onNavigate={onNavigate} />,
    community:    () => <CommunityPage />,
    // V7.5 Phase 5: Talent-Antrag (nur fuer Non-Talents sichtbar)
    talentantrag:  () => <TalentAntragPage />,
    entwicklung:  () => <DesktopEntwicklungszentrum />,
    // Talent-Bereiche
    content:      () => <MeineInhaltePage onBack={handleBack} />,
    orders:       () => <BestellungenPage onBack={handleBack} />,
    availability: () => <VerfuegbarkeitPage onBack={handleBack} />,
    projektreisen: () => <ProjektreisenPage />,
    wirkung:      () => <WirkungPage />,
    support:      () => <SupportPage onBack={handleBack} />,
    settings:     () => <KontoSettingsPage />,
  };
  const SubPage = map[activeTool];
  return SubPage ? <SubPage /> : null;
}

// V7.5: Community — echter Studio-Bereich, startet mit Informationen und Nachrichten.
// Waechst schrittweise weiter (INV-14, ADR-009: keine Coming-Soon-Bereiche).



export default function DesktopStudio() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { section } = useParams();
  const { profile, user } = useAuth();
  const isTalent = isProfileTalent(profile);
  const isTeam = profile?.role === 'admin' || profile?.role === 'superadmin';
  const { grouped: bookingGroups } = useCreatorBookings();
  const [activeTool, setActiveTool] = useState(section || 'overview');

  useEffect(() => { if (section) setActiveTool(section); }, [section]);

  // V7.5: Studio Gate — nur Mitglieder dürfen das Studio betreten
  if (profile && profile.membership_active !== true) {
    return <Navigate to="/Home" replace />;
  }
  if (!profile) {
    return null; // Profil noch am Laden — kein Zugriff
  }

  // V7.5: Progressive Freischaltung — Talent-Bereiche nur fuer Talents
  const talentOnlyKeys = ['content', 'orders', 'availability', 'wirkung', 'projektreisen'];
  if (!isTalent && talentOnlyKeys.includes(activeTool)) {
    return <Navigate to="/studio" replace />;
  }

  // V7.5: Team-Bereiche nur fuer Team-Mitglieder (admin, superadmin)
  const adminOnlyKeys = ['entwicklung'];
  if (!isTeam && adminOnlyKeys.includes(activeTool)) {
    return <Navigate to="/studio" replace />;
  }

  const pendingCount = bookingGroups.pending?.length || 0;

  function handleBack() { setActiveTool(null); navigate('/studio'); }

  return (
    <div className="studio-page" style={activeTool === 'entwicklung' ? { maxWidth: 'none', width: 'calc(100% + 96px)', margin: '-40px -48px -80px' } : undefined}>
      <aside className="studio-nav">
        <div className="studio-nav-sticky">
          <h2 className="studio-title">Studio</h2>
          {NAV_GROUPS
          .filter(group => (!group.talentOnly || isTalent) && (!group.adminRequired || isTeam) && (!group.memberRequiredNonTalent || (profile?.membership_active === true && !isTalent)))
          .map(group => (
            <div key={group.label} className="studio-group">
              <div className="studio-group-label">{group.label}</div>
              {group.items.map(item => (
                <button
                  key={item.key}
                  className={`studio-nav-item ${activeTool === item.key ? 'active' : ''}`}
                  onClick={() => { setActiveTool(item.key); if (item.key === 'overview' || item.key === 'content' || item.key === 'entwicklung' || item.key === 'talentantrag') { navigate('/studio'); } else { navigate(`/studio/${item.key}`); } }}
                >
                  <StudioIcon name={item.icon} />
                  <span>{item.label}</span>
                  {item.key === 'orders' && pendingCount > 0 && <span className="studio-badge">{pendingCount}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
      <div className="studio-workspace" style={activeTool === 'entwicklung' ? { padding: 0, maxWidth: 'none' } : undefined}>
        {activeTool === 'overview' || activeTool === 'community'
        ? renderSubPage(activeTool, handleBack, (k) => { setActiveTool(k); if (k !== 'overview') navigate('/studio/' + k); else navigate('/studio'); })
        : activeTool && activeTool !== 'content'
          ? renderSubPage(activeTool, handleBack, null)
          : <MeineInhaltePage onBack={handleBack} />}
      </div>
    </div>
  );
}
