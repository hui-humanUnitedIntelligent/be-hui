/**
 * HUI System Icon Library v1.0 (2026-07-14) — Single Source of Truth
 * ─────────────────────────────────────────────────────────────────────
 * Navigations- und Funktions-Icons für "Mein Bereich" und alle
 * weiteren strukturellen UI-Bereiche in HUI.
 *
 * Design-Vorgaben (Lars, 2026-07-14):
 *   - Gleicher Stil wie HuiInteractionIcons (Outline, 2px stroke)
 *   - Ausschließlich currentColor — keine Hex-Farben im SVG
 *   - Gleiche Bounding Box: viewBox="0 0 24 24"
 *   - Minimalistisch, ruhig, modern, hochwertig
 *   - Kein Emoji, kein Clipart
 *
 * API: { size = 24, className, style }
 */
import React from "react";

function Icon({ size = 24, className, style, children, title }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={title} className={className} style={style}
    >{children}</svg>
  );
}

/* 1. Resonanz — offizielles HUI-Herz */
export function HUIResonanzIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Meine Resonanz">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </Icon>
  );
}

/* 2. Talent-Angebote — Person + Funken */
export function HUITalentIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Talent-Angebote">
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
      <path d="M19 2l.5 1.5L21 4l-1.5.5L19 6l-.5-1.5L17 4l1.5-.5L19 2z" />
    </Icon>
  );
}

/* 3. Meine Werke — Palette */
export function HUIWerkeIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Meine Werke">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10 .83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.97-4.03-9-9-9z" />
      <circle cx="6.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* 4. Erlebnisse & Projekte — Kompass */
export function HUIErlebnisIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Erlebnisse & Projekte">
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,7 13.2,12 12,11 10.8,12" fill="currentColor" stroke="none" />
      <polygon points="12,17 13.2,12 12,13 10.8,12" fill="none" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* 5. Ambassador-Bereich — zwei Personen */
export function HUIAmbassadorIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Ambassador-Bereich">
      <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3" />
      <path d="M21 20c0-2.42-1.72-4.44-4-4.9" />
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.31 2.69-6 6-6s6 2.69 6 6" />
    </Icon>
  );
}

/* 6. Meine Empfehlungen — Outline-Stern */
export function HUIEmpfehlungIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Meine Empfehlungen">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Icon>
  );
}

/* 7. Impact & Stimmen — Wellen-Impuls */
export function HUIImpactIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Impact & Stimmen">
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 6a6 6 0 0 1 0 12" />
      <path d="M12 6a6 6 0 0 0 0 12" strokeDasharray="3 2" />
      <path d="M12 2a10 10 0 0 1 0 20" />
      <path d="M12 2a10 10 0 0 0 0 20" strokeDasharray="5 3" />
    </Icon>
  );
}

/* 8. Finanzabteilung — Wallet */
export function HUIFinanzIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Finanzabteilung">
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M2 10h20" />
      <rect x="15" y="13" width="4" height="2.5" rx="1.25" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* 9. Profil — Person */
export function HUIProfilIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Profil bearbeiten">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
    </Icon>
  );
}

/* 10. Verifizierung — Schild + Check */
export function HUIVerifIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Verifizierung">
      <path d="M12 2l8 3v6c0 5-3.5 9.74-8 11-4.5-1.26-8-6-8-11V5l8-3z" />
      <polyline points="9 12 11 14 15 10" />
    </Icon>
  );
}

/* 11. Sicherheit — Schloss */
export function HUISicherheitIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Sicherheit">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* 12. Mitgliedschaft — Diamant */
export function HUIMitgliedIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Mitgliedschaft">
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M2 9h20" />
      <path d="M12 3l4 6m-8 0l4-6" />
    </Icon>
  );
}

/* 13. Support — Headset */
export function HUISupportIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Support">
      <path d="M3 11V12a9 9 0 0 0 18 0v-1" />
      <path d="M3 11a2 2 0 0 1 4 0v2a2 2 0 0 1-4 0v-2z" />
      <path d="M17 11a2 2 0 0 1 4 0v2a2 2 0 0 1-4 0v-2z" />
    </Icon>
  );
}

/* 14. Tickets */
export function HUITicketIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Meine Tickets">
      <path d="M15 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-3" />
      <path d="M18 5a2 2 0 0 1 2 2" />
      <path d="M9 9h6M9 13h4" />
    </Icon>
  );
}

/* 15. Abmelden — Pfeil raus */
export function HUIAbmeldenIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Abmelden">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Icon>
  );
}

/* 16. Statistiken — Balken */
export function HUIStatistikIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Statistiken">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </Icon>
  );
}

/* 17. Ein-/Ausgaben */
export function HUIEinAusIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Ein- & Ausgaben">
      <path d="M12 2v10M8 8l4 4 4-4" />
      <line x1="4" y1="14" x2="20" y2="14" />
      <path d="M12 22V14M8 18l4-4 4 4" />
    </Icon>
  );
}

/* 18. Kalender / Buchungen */
export function HUIKalenderIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Buchungen">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Icon>
  );
}

/* 19. Verkäufe — Tasche */
export function HUIVerkaufIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Meine Verkäufe">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </Icon>
  );
}

/* 20. Impact-Stimmen */
export function HUIStimmeIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Impact-Stimmen">
      <circle cx="12" cy="12" r="3" />
      <path d="M6.34 6.34a8 8 0 0 0 0 11.32" />
      <path d="M17.66 6.34a8 8 0 0 1 0 11.32" />
    </Icon>
  );
}

/* 21. Projekte — Keim/Wachstum */
export function HUIProjektIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Meine Projekte">
      <path d="M12 22V12" />
      <path d="M12 12C12 8 8 4 4 5c0 4 3 7 8 7z" />
      <path d="M12 12c0-4 4-8 8-7 0 4-3 7-8 7z" />
    </Icon>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ERWEITERUNG v1.1 — Icons für appweite Migration (2026-07-14)
   Neue Icons für Feed, Formulare, Wizard, Settings, Admin
   ═══════════════════════════════════════════════════════════════ */

/* 22. Suche — Lupe */
export function HUISearchIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Suche">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" strokeLinecap="round" />
    </Icon>
  );
}

/* 23. Standort — Pin */
export function HUILocationIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Standort">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* 24. Link — Kette */
export function HUILinkIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Link">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Icon>
  );
}

/* 25. E-Mail — Briefumschlag */
export function HUIMailIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="E-Mail">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </Icon>
  );
}

/* 26. Telefon */
export function HUIPhoneIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Telefon">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12 19.79 19.79 0 0 1 1 3.38 2 2 0 0 1 2.96 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 8 8l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Icon>
  );
}

/* 27. Preis / Euro */
export function HUIEuroIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Preis">
      <path d="M18 5.5A7.5 7.5 0 0 0 6 11H4" />
      <path d="M18 18.5A7.5 7.5 0 0 1 6 13H4" />
      <line x1="4" y1="11" x2="11" y2="11" />
      <line x1="4" y1="13" x2="11" y2="13" />
    </Icon>
  );
}

/* 28. Öffentlich — Globus */
export function HUIGlobeIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Öffentlich">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </Icon>
  );
}

/* 29. Community / Gruppe */
export function HUIGemeinschaftIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Gemeinschaft">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="8" r="3" />
      <path d="M3 20c0-3 2.69-5.5 6-5.5h2" />
      <path d="M14 14.5c3.31 0 6 2.5 6 5.5" />
    </Icon>
  );
}

/* 30. Privat — Schloss */
export function HUIPrivatIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Privat">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

/* 31. Beitrag / Neuigkeit — Zeitung */
export function HUINachrichtIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Beitrag">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="13" y2="16" />
    </Icon>
  );
}

/* 32. Versand / Lieferung */
export function HUIVersandIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Versand">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 5v4h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </Icon>
  );
}

/* 33. Zeit / Uhr */
export function HUIZeitIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Uhrzeit">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Icon>
  );
}

/* 34. Personen-Anzahl */
export function HUIPersonenIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Personen">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

/* 35. Schreiben / Texteingabe */
export function HUISchreibenIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Beschreibung">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </Icon>
  );
}

/* 36. Vor Ort */
export function HUIVorOrtIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Vor Ort">
      <path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 11 6 11s6-6.5 6-11c0-3.31-2.69-6-6-6z" />
      <circle cx="12" cy="8" r="2" fill="currentColor" stroke="none" />
      <path d="M7 20h10" strokeLinecap="round" />
    </Icon>
  );
}

/* 37. Online / Digital */
export function HUIOnlineIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Online">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </Icon>
  );
}

/* 38. Warnung */
export function HUIWarnIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Warnung">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </Icon>
  );
}

/* 39. Analytics / Daten */
export function HUIAnalyticsIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Analytics">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" y1="9" x2="6" y2="21" />
    </Icon>
  );
}

/* 40. Einstellungen — Zahnrad */
export function HUISettingsIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Einstellungen">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Icon>
  );
}

/* 41. Datenschutz — Auge-Off */
export function HUIDatenschutzIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Datenschutz">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </Icon>
  );
}

/* 42. Senden — Pfeil Abschicken */
export function HUISendenIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Senden">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </Icon>
  );
}

/* 43. Foto / Bild */
export function HUIFotoIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Foto">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
      <polyline points="21 15 16 10 5 21" />
    </Icon>
  );
}

/* 44. Video / Abspielen */
export function HUIVideoIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Video">
      <polygon points="5 3 19 12 5 21 5 3" />
    </Icon>
  );
}

/* 45. Datei / Dokument */
export function HUIDateiIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Datei">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </Icon>
  );
}

/* 46. Einladung / Gemeinschaft */
export function HUIEinladungIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Einladung">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </Icon>
  );
}

/* 47. Kategorie / Tag */
export function HUIKategorieIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Kategorie">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" strokeWidth="3" strokeLinecap="round" />
    </Icon>
  );
}

/* 48. Sprache */
export function HUISpracheIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Sprache">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </Icon>
  );
}

/* 49. Stimmung / Atmosphäre */
export function HUIStimmungIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Stimmung">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
    </Icon>
  );
}

/* 50. Wirker / Person mit Stern */
export function HUIWirkerIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Wirker">
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3 20c0-3.87 3.13-7 7-7s7 3.13 7 7" />
      <path d="M20 8l.5 1.5L22 10l-1.5.5L20 12l-.5-1.5L18 10l1.5-.5L20 8z" strokeLinejoin="round" />
    </Icon>
  );
}

/* 51. Kontaktdaten / Visitenkarte */
export function HUIKontaktIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Kontakt">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <circle cx="8" cy="12" r="2.5" />
      <line x1="13" y1="10" x2="19" y2="10" />
      <line x1="13" y1="14" x2="19" y2="14" />
    </Icon>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ERWEITERUNG v1.2 — Icons #52-56 (2026-07-14)
   ═══════════════════════════════════════════════════════════════ */

/* 52. Ansicht — Auge (öffentlich sehen / Passwort-Toggle) */
export function HUIAnsichtIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Ansicht">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

/* 53. Benachrichtigung — Glocke */
export function HUIBenachrichtigungIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Benachrichtigung">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Icon>
  );
}

/* 54. Folgen — Pfeil rechts mit Person */
export function HUIFolgenIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Folge ich">
      <path d="M5 12h14" />
      <polyline points="12 5 19 12 12 19" />
    </Icon>
  );
}

/* 55. Award — Auszeichnung / Gefördert */
export function HUIAwardIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Auszeichnung">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </Icon>
  );
}

/* 56. Fortschritt — Aufsteigender Trend */
export function HUIFortschrittIcon({ size = 24, className, style }) {
  return (
    <Icon size={size} className={className} style={style} title="Fortschritt">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </Icon>
  );
}
