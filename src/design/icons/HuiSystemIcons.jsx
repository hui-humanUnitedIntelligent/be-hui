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
