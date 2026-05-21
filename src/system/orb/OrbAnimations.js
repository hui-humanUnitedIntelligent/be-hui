// src/system/orb/OrbAnimations.js
// ═══════════════════════════════════════════════════════════════
// HUI ORB — Zentrales Animations-System
// Alle Keyframes an einem Ort. Keine Inline-Animationen.
//
// Philosophie: ruhig, weich, menschlich.
// KEIN: spring, bounce, overshoot, aggressive transforms.
// NUR:  opacity, leichte scale, sanfter glow, translateY
// ═══════════════════════════════════════════════════════════════

export const ORB_CSS = `
  /* ── Overlay Entry ──────────────────────────────────────── */
  @keyframes orbOverlayIn {
    from { opacity:0; }
    to   { opacity:1; }
  }

  /* ── Logo-Orb Entry ─────────────────────────────────────── */
  @keyframes orbLogoIn {
    0%   { opacity:0; transform:scale(0.5); }
    100% { opacity:1; transform:scale(1);   }
  }

  /* ── Logo-Orb Breath ────────────────────────────────────── */
  /* Sehr subtil — Tiefe, keine Ablenkung                      */
  @keyframes orbBreath {
    0%,100% { box-shadow:
      0 0 0 0   rgba(10,191,184,0),
      0 10px 36px rgba(10,191,184,0.16),
      0 0 70px  rgba(10,191,184,0.07); }
    50% { box-shadow:
      0 0 0 8px rgba(10,191,184,0.04),
      0 14px 48px rgba(10,191,184,0.22),
      0 0 90px  rgba(10,191,184,0.10); }
  }
  @keyframes orbBreathCoral {
    0%,100% { box-shadow:
      0 0 0 0   rgba(251,146,60,0),
      0 10px 36px rgba(251,146,60,0.16),
      0 0 70px  rgba(251,146,60,0.07); }
    50% { box-shadow:
      0 0 0 8px rgba(251,146,60,0.04),
      0 14px 48px rgba(251,146,60,0.22),
      0 0 90px  rgba(251,146,60,0.10); }
  }

  /* ── Orb-Ringe ──────────────────────────────────────────── */
  @keyframes orbRingPulse {
    0%,100% { transform:scale(1);    opacity:0.16; }
    50%     { transform:scale(1.12); opacity:0.05; }
  }
  @keyframes orbRingPulse2 {
    0%,100% { transform:scale(1);    opacity:0.09; }
    50%     { transform:scale(1.18); opacity:0.03; }
  }

  /* ── Node Entry ─────────────────────────────────────────── */
  /* ease-out: kein Bounce, direkt zur Position                */
  @keyframes orbNodeIn {
    0%   { opacity:0; transform:scale(0.72); }
    100% { opacity:1; transform:scale(1);   }
  }

  /* ── Node Float — nur translateY, Position nie verändert ── */
  @keyframes orbFloatA { 0%,100%{transform:translateY(0px)}  50%{transform:translateY(-4px)} }
  @keyframes orbFloatB { 0%,100%{transform:translateY(2px)}  50%{transform:translateY(-3px)} }
  @keyframes orbFloatC { 0%,100%{transform:translateY(-2px)} 50%{transform:translateY(2px)}  }
  @keyframes orbFloatD { 0%,100%{transform:translateY(2px)}  50%{transform:translateY(-3px)} }
  @keyframes orbFloatE { 0%,100%{transform:translateY(-2px)} 50%{transform:translateY(3px)}  }

  /* ── Atmosphere Blobs ───────────────────────────────────── */
  @keyframes orbBlobA {
    0%,100% { transform:translate(-50%,-50%) scale(1)    rotate(0deg); }
    33%     { transform:translate(-50%,-50%) scale(1.07) rotate(5deg); }
    66%     { transform:translate(-52%,-48%) scale(0.95) rotate(-3deg); }
  }
  @keyframes orbBlobB {
    0%,100% { transform:translate(-50%,-50%) scale(1)    rotate(0deg); }
    40%     { transform:translate(-48%,-52%) scale(1.05) rotate(-4deg); }
    70%     { transform:translate(-50%,-50%) scale(0.97) rotate(2deg); }
  }
  @keyframes orbBlobC {
    0%,100% { transform:translate(-50%,-50%) scale(1);   }
    50%     { transform:translate(-50%,-50%) scale(1.08); }
  }

  /* ── Partikel ───────────────────────────────────────────── */
  @keyframes orbParticle {
    0%   { opacity:0; transform:translate(0,0) scale(0.2); }
    20%  { opacity:0.50; }
    80%  { opacity:0.18; }
    100% { opacity:0; transform:translate(var(--pdx),var(--pdy)) scale(0); }
  }

  /* ── Cards / Sheets ─────────────────────────────────────── */
  @keyframes orbSheetUp {
    from { opacity:0; transform:translateY(44px) scale(0.97); }
    to   { opacity:1; transform:translateY(0)    scale(1);    }
  }
  @keyframes orbHintIn {
    from { opacity:0; transform:translateX(-50%) translateY(16px); }
    to   { opacity:1; transform:translateX(-50%) translateY(0);    }
  }
  @keyframes orbFadeUp {
    from { opacity:0; transform:translateY(5px); }
    to   { opacity:1; transform:translateY(0);   }
  }
  @keyframes orbFadeIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes orbImpactGlow {
    0%,100% { opacity:0.07; transform:scale(1);    }
    50%     { opacity:0.16; transform:scale(1.07); }
  }

  /* ── Tap Utility Class ──────────────────────────────────── */
  .orb-tap {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    cursor: pointer;
    transition: opacity 0.16s ease;
  }
  .orb-tap:active { opacity: 0.68; }

  /* ── Scrollbar Hide ─────────────────────────────────────── */
  .orb-scroll::-webkit-scrollbar { display:none; }
  .orb-scroll { -ms-overflow-style:none; scrollbar-width:none; }
`;
