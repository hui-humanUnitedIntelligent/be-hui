/**
 * OrbMotionSystem.js — Phase 4G
 *
 * Kein Spring-Library. Kein Framer. Reines CSS-Timing.
 * Atmosphärisch, ruhig, cinematic.
 */

// ─── Timing Tokens ────────────────────────────────────────────────────────────
export const MOTION = {
  // Orb expandiert organisch beim Öffnen
  orbExpand:   "0.62s cubic-bezier(0.16,1,0.3,1)",
  // Hintergrund dimmt weich
  backdropIn:  "0.48s cubic-bezier(0.22,1,0.36,1)",
  // Cards erscheinen gestaffelt
  cardReveal:  "0.52s cubic-bezier(0.16,1,0.3,1)",
  // Atmosphären-Shift bei Hover
  atmosShift:  "0.70s cubic-bezier(0.22,1,0.36,1)",
  // Schließen: schnell aber sanft
  closeFade:   "0.32s cubic-bezier(0.4,0,1,1)",
  // Card-Stagger Basis
  staggerBase: 0.06,   // s per Card
  staggerStart: 0.18,  // s Delay vor erster Card
};

// ─── Content Type DNA ─────────────────────────────────────────────────────────
export const CONTENT_DNA = {
  moment: {
    key:         "moment",
    label:       "Moment",
    tagline:     "Teile einen Gedanken oder Augenblick",
    icon:        "✦",
    // Atmosphäre bei Hover
    glow:        "rgba(96,165,250,0.18)",      // soft blue
    glowStrong:  "rgba(96,165,250,0.32)",
    backdropTint:"rgba(219,234,254,0.06)",
    cardBg:      "rgba(219,234,254,0.08)",
    cardBorder:  "rgba(96,165,250,0.22)",
    accentColor: "#60A5FA",
    accentGrad:  "linear-gradient(135deg, #60A5FA, #93C5FD)",
    // Energiebeschreibung
    energy:      "ruhig · intim · menschlich",
    // Für Atmosphären-Blob-Shift
    blobColor:   "rgba(96,165,250,",
    // action → was öffnet sich
    action:      "story",
  },
  experience: {
    key:         "experience",
    label:       "Experience",
    tagline:     "Öffne einen Raum für Begegnung",
    icon:        "✧",
    glow:        "rgba(251,191,36,0.18)",      // warm gold
    glowStrong:  "rgba(251,191,36,0.30)",
    backdropTint:"rgba(254,243,199,0.06)",
    cardBg:      "rgba(254,243,199,0.08)",
    cardBorder:  "rgba(251,191,36,0.25)",
    accentColor: "#FBBF24",
    accentGrad:  "linear-gradient(135deg, #F59E0B, #FCD34D)",
    energy:      "wertvoll · lebendig · cinematic",
    blobColor:   "rgba(251,191,36,",
    action:      "experience",
  },
  work: {
    key:         "work",
    label:       "Werk",
    tagline:     "Zeige etwas das du erschaffen hast",
    icon:        "◈",
    glow:        "rgba(251,146,60,0.18)",      // coral/editorial
    glowStrong:  "rgba(251,146,60,0.30)",
    backdropTint:"rgba(255,237,213,0.05)",
    cardBg:      "rgba(255,237,213,0.07)",
    cardBorder:  "rgba(251,146,60,0.22)",
    accentColor: "#FB923C",
    accentGrad:  "linear-gradient(135deg, #F97316, #FCA5A1)",
    energy:      "editorial · klar · künstlerisch",
    blobColor:   "rgba(251,146,60,",
    action:      "werk",
  },
  invitation: {
    key:         "invitation",
    label:       "Einladung",
    tagline:     "Lade Menschen spontan ein",
    icon:        "◎",
    glow:        "rgba(167,139,250,0.18)",     // violet/social
    glowStrong:  "rgba(167,139,250,0.32)",
    backdropTint:"rgba(237,233,254,0.06)",
    cardBg:      "rgba(237,233,254,0.08)",
    cardBorder:  "rgba(167,139,250,0.25)",
    accentColor: "#A78BFA",
    accentGrad:  "linear-gradient(135deg, #8B5CF6, #C4B5FD)",
    energy:      "warm · sozial · offen",
    blobColor:   "rgba(167,139,250,",
    action:      "invitation",
  },
};

export const CONTENT_TYPE_ORDER = ["moment", "experience", "work", "invitation"];

// ─── CSS Keyframes ────────────────────────────────────────────────────────────
export const ORB_PORTAL_CSS = `
  /* ── Overlay Backdrop ───────────────────────────────────────── */
  @keyframes orbPortalBackdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes orbPortalBackdropOut {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  /* ── Orb expandiert organisch ───────────────────────────────── */
  @keyframes orbPortalExpand {
    0%   { transform: scale(0.55); opacity: 0; }
    60%  { transform: scale(1.04); opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
  }

  /* ── Card Reveal — gestaffelt, schwebt ein ─────────────────── */
  @keyframes orbCardReveal {
    0%   { opacity: 0; transform: translateY(18px) scale(0.94); }
    100% { opacity: 1; transform: translateY(0)     scale(1);   }
  }

  /* ── Card Hover Float ───────────────────────────────────────── */
  @keyframes orbCardFloat {
    0%,100% { transform: translateY(0px);  }
    50%     { transform: translateY(-4px); }
  }

  /* ── Center Orb Breath ──────────────────────────────────────── */
  @keyframes orbPortalBreath {
    0%,100% { box-shadow: 0 0 0 0 rgba(13,196,181,0), 0 8px 32px rgba(13,196,181,0.18); }
    50%     { box-shadow: 0 0 0 10px rgba(13,196,181,0.05), 0 12px 48px rgba(13,196,181,0.28); }
  }

  /* ── Ambient Blob — langsam, atmet ─────────────────────────── */
  @keyframes orbPortalBlobA {
    0%,100% { transform: translate(-50%,-50%) scale(1)    rotate(0deg);   }
    40%     { transform: translate(-50%,-50%) scale(1.08) rotate(8deg);   }
    70%     { transform: translate(-52%,-48%) scale(0.94) rotate(-4deg);  }
  }
  @keyframes orbPortalBlobB {
    0%,100% { transform: translate(-50%,-50%) scale(1)    rotate(0deg);   }
    35%     { transform: translate(-50%,-50%) scale(1.06) rotate(-6deg);  }
    65%     { transform: translate(-48%,-52%) scale(0.96) rotate(4deg);   }
  }

  /* ── Particle drift ─────────────────────────────────────────── */
  @keyframes orbPortalParticle {
    0%   { opacity: 0;    transform: translate(0,0)    scale(1);   }
    20%  { opacity: 0.6;  }
    100% { opacity: 0;    transform: translate(var(--pdx),var(--pdy)) scale(0); }
  }

  /* ── Icon Rotate on hover ───────────────────────────────────── */
  @keyframes orbPortalIconSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  /* ── Pulse ring für aktive Karte ────────────────────────────── */
  @keyframes orbPortalRingPulse {
    0%,100% { transform: scale(1);    opacity: 0.20; }
    50%     { transform: scale(1.14); opacity: 0.06; }
  }

  /* Touch targets */
  .orb-portal-card { -webkit-tap-highlight-color: transparent; }
  .orb-portal-close { -webkit-tap-highlight-color: transparent; }
`;
