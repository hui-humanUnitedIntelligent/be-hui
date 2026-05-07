
// HUI Icon System — Emotional. Menschlich. Inspirierend.
// Weiche 3D-Optik, warme Teal→Coral Verläufe, organische Formen
// Kein generisches SaaS. Jedes Icon erzählt eine Geschichte.

import React from "react";

const ID = (n) => `hui-icon-${n}`;

/* ── Base SVG wrapper ───────────────────────────────── */
function Svg({ size = 32, children, style = {} }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 64 64" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, ...style }}
    >
      {children}
    </svg>
  );
}

/* ── Shared defs ────────────────────────────────────── */
export function HuiIconDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        {/* Teal gradient */}
        <linearGradient id="hui-teal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22E8D8" />
          <stop offset="100%" stopColor="#11C5B7" />
        </linearGradient>
        {/* Coral gradient */}
        <linearGradient id="hui-coral" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA07A" />
          <stop offset="100%" stopColor="#FF7B72" />
        </linearGradient>
        {/* Warm gold */}
        <linearGradient id="hui-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        {/* Teal→Coral (diagonal) */}
        <linearGradient id="hui-tc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#16D7C5" />
          <stop offset="100%" stopColor="#FF8A6B" />
        </linearGradient>
        {/* Green */}
        <linearGradient id="hui-green" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        {/* Purple */}
        <linearGradient id="hui-purple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        {/* Soft shadow filter */}
        <filter id="hui-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000018" />
        </filter>
        <filter id="hui-glow-teal" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#16D7C540" />
        </filter>
        <filter id="hui-glow-coral" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#FF8A6B40" />
        </filter>
      </defs>
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   NAVIGATION ICONS
════════════════════════════════════════════════════ */

/* Home — warm house with teal roof */
export function IconHome({ size = 32, active = false }) {
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id="home-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={active ? "#22E8D8" : "#E4F9F7"} />
          <stop offset="100%" stopColor={active ? "#11C5B7" : "#B2F0EA"} />
        </linearGradient>
        <linearGradient id="home-roof" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#16D7C5" />
          <stop offset="100%" stopColor="#0FA89C" />
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle cx="32" cy="32" r="28" fill="url(#home-bg)" filter="url(#hui-shadow)" />
      {/* Chimney */}
      <rect x="40" y="18" width="5" height="9" rx="2" fill="#11C5B7" opacity="0.7" />
      {/* Roof */}
      <path d="M14 34 L32 16 L50 34 Z" fill="url(#home-roof)" />
      {/* Roof shine */}
      <path d="M20 30 L32 19 L40 27" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" fill="none" />
      {/* Walls */}
      <rect x="20" y="33" width="24" height="17" rx="3" fill="white" opacity="0.92" />
      {/* Door */}
      <rect x="28" y="40" width="8" height="10" rx="2.5" fill="url(#home-roof)" />
      {/* Windows */}
      <rect x="22" y="37" width="5" height="5" rx="1.5" fill="#B2F0EA" />
      <rect x="37" y="37" width="5" height="5" rx="1.5" fill="#B2F0EA" />
    </Svg>
  );
}

/* Impact — organic globe with leaf */
export function IconImpact({ size = 32, active = false }) {
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id="imp-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={active ? "#34D399" : "#D1FAE5"} />
          <stop offset="100%" stopColor={active ? "#10B981" : "#A7F3D0"} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#imp-bg)" filter="url(#hui-shadow)" />
      {/* Globe */}
      <circle cx="30" cy="33" r="14" fill="none" stroke={active?"#065F46":"#10B981"} strokeWidth="2.5" opacity="0.5" />
      <ellipse cx="30" cy="33" rx="6" ry="14" fill="none" stroke={active?"#065F46":"#10B981"} strokeWidth="2" opacity="0.4" />
      <line x1="16" y1="33" x2="44" y2="33" stroke={active?"#065F46":"#10B981"} strokeWidth="2" opacity="0.4" />
      {/* Big leaf */}
      <path d="M38 16 Q52 24 44 38 Q36 28 38 16Z" fill="#10B981" opacity="0.9" />
      <path d="M38 16 Q44 27 44 38" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" fill="none" strokeLinecap="round" />
      {/* Stem */}
      <path d="M44 38 Q40 44 36 48" stroke="#10B981" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Light */}
      <circle cx="42" cy="20" r="4" fill="#FFD166" opacity="0.85" filter="url(#hui-glow-teal)" />
    </Svg>
  );
}

/* Entdecken — compass with cinematic atmosphere */
export function IconEntdecken({ size = 32, active = false }) {
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id="ent-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={active ? "#FFA07A" : "#FFF2EE"} />
          <stop offset="100%" stopColor={active ? "#FF7B72" : "#FFD6C8"} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#ent-bg)" filter="url(#hui-shadow)" />
      {/* Compass outer ring */}
      <circle cx="32" cy="33" r="16" fill="white" opacity="0.85" />
      <circle cx="32" cy="33" r="16" fill="none" stroke="#FF8A6B" strokeWidth="2.5" opacity="0.6" />
      {/* N/S/E/W dots */}
      <circle cx="32" cy="18" r="1.5" fill="#FF7B72" />
      <circle cx="32" cy="48" r="1.5" fill="#FF7B72" />
      <circle cx="17" cy="33" r="1.5" fill="#FF7B72" />
      <circle cx="47" cy="33" r="1.5" fill="#FF7B72" />
      {/* Needle — coral North */}
      <path d="M32 33 L28 42 L32 40 L36 42 Z" fill="#FFCAB0" />
      <path d="M32 33 L28 24 L32 26 L36 24 Z" fill="url(#hui-coral)" />
      {/* Center */}
      <circle cx="32" cy="33" r="3" fill="white" stroke="#FF8A6B" strokeWidth="1.5" />
      {/* Sparkles */}
      <circle cx="48" cy="19" r="2.5" fill="#FFD166" opacity="0.8" />
      <circle cx="44" cy="14" r="1.5" fill="#FFD166" opacity="0.5" />
    </Svg>
  );
}

/* Favoriten — warm emotional heart */
export function IconFavoriten({ size = 32, active = false }) {
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id="fav-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={active ? "#FCA5A5" : "#FEE2E2"} />
          <stop offset="100%" stopColor={active ? "#F87171" : "#FCA5A5"} />
        </linearGradient>
        <linearGradient id="fav-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={active ? "#FF8A6B" : "#FFA07A"} />
          <stop offset="100%" stopColor={active ? "#FF5252" : "#FF7B72"} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#fav-bg)" filter="url(#hui-shadow)" />
      {/* Heart */}
      <path d="M32 46 C32 46 14 36 14 24 C14 18 19 14 24 14 C27 14 30 16 32 18 C34 16 37 14 40 14 C45 14 50 18 50 24 C50 36 32 46 32 46Z"
        fill="url(#fav-heart)" />
      {/* Shine */}
      <path d="M20 22 Q22 17 27 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5" fill="none" />
      {/* Small sparkle */}
      <circle cx="46" cy="18" r="3" fill="#FFD166" opacity="0.85" />
      <circle cx="50" cy="14" r="1.8" fill="#FFD166" opacity="0.5" />
    </Svg>
  );
}

/* Profil — warm person figure */
export function IconProfil({ size = 32, active = false }) {
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id="prof-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={active ? "#22E8D8" : "#E4F9F7"} />
          <stop offset="100%" stopColor={active ? "#11C5B7" : "#B2F0EA"} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#prof-bg)" filter="url(#hui-shadow)" />
      {/* Head */}
      <circle cx="32" cy="24" r="10" fill="white" opacity="0.92" />
      <circle cx="32" cy="24" r="10" fill="#16D7C5" opacity="0.18" />
      {/* Body */}
      <path d="M14 52 Q14 38 32 38 Q50 38 50 52" fill="white" opacity="0.88" />
      <path d="M14 52 Q14 38 32 38 Q50 38 50 52" fill="#16D7C5" opacity="0.15" />
      {/* Warmth dot */}
      <circle cx="44" cy="18" r="5" fill="#FF8A6B" opacity="0.85" />
      <circle cx="44" cy="18" r="2.5" fill="white" opacity="0.5" />
    </Svg>
  );
}

/* ════════════════════════════════════════════════════
   WERKEKORB — Handcrafted Rattan Basket
   Replaces ALL shopping cart iconography
════════════════════════════════════════════════════ */

export function IconWerkekorb({ size = 32, count = 0, active = false }) {
  const filled = count > 0;
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id="basket-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8A87C" />
          <stop offset="60%" stopColor="#C8784A" />
          <stop offset="100%" stopColor="#B5692E" />
        </linearGradient>
        <linearGradient id="basket-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16D7C5" />
          <stop offset="100%" stopColor="#11C5B7" />
        </linearGradient>
        <linearGradient id="basket-handle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D4934A" />
          <stop offset="100%" stopColor="#B5692E" />
        </linearGradient>
      </defs>

      {/* Handle */}
      <path d="M22 26 Q22 10 32 10 Q42 10 42 26"
        fill="none" stroke="url(#basket-handle)" strokeWidth="3.5"
        strokeLinecap="round" />
      {/* Handle highlight */}
      <path d="M24 25 Q24 13 32 13 Q40 13 40 25"
        fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.35"
        strokeLinecap="round" />

      {/* Basket body */}
      <path d="M12 30 Q12 52 32 52 Q52 52 52 30 Z"
        fill="url(#basket-body)" />

      {/* Weave pattern — horizontal stripes */}
      <path d="M13 36 Q32 34 51 36" fill="none" stroke="#B5692E" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M12 42 Q32 40 52 42" fill="none" stroke="#B5692E" strokeWidth="1.5" strokeOpacity="0.5" />
      <path d="M13 48 Q32 46 51 48" fill="none" stroke="#B5692E" strokeWidth="1.5" strokeOpacity="0.5" />

      {/* Weave pattern — vertical */}
      <path d="M20 30 Q19 41 20 51" fill="none" stroke="#9A5220" strokeWidth="1" strokeOpacity="0.35" />
      <path d="M26 29 Q25 41 26 52" fill="none" stroke="#9A5220" strokeWidth="1" strokeOpacity="0.35" />
      <path d="M32 29 Q31 41 32 52" fill="none" stroke="#9A5220" strokeWidth="1" strokeOpacity="0.35" />
      <path d="M38 29 Q37 41 38 52" fill="none" stroke="#9A5220" strokeWidth="1" strokeOpacity="0.35" />
      <path d="M44 30 Q43 41 44 51" fill="none" stroke="#9A5220" strokeWidth="1" strokeOpacity="0.35" />

      {/* Rim — teal */}
      <rect x="11" y="28" width="42" height="6" rx="3" fill="url(#basket-rim)" />
      <rect x="11" y="28" width="42" height="3" rx="2" fill="white" opacity="0.25" />

      {/* Contents if filled */}
      {filled && (
        <>
          {/* Colorful werk items peeking out */}
          <circle cx="24" cy="26" r="5" fill="#FF8A6B" opacity="0.9" />
          <circle cx="32" cy="24" r="5.5" fill="#16D7C5" opacity="0.9" />
          <circle cx="40" cy="26" r="4.5" fill="#FFD166" opacity="0.9" />
          {/* Shine on items */}
          <circle cx="22" cy="24" r="1.5" fill="white" opacity="0.4" />
          <circle cx="30" cy="22" r="2" fill="white" opacity="0.4" />
        </>
      )}

      {/* HUI brand mark on basket */}
      <circle cx="32" cy="42" r="5" fill="white" opacity="0.22" />
    </Svg>
  );
}

/* Werkekorb with badge count */
export function WerkekorbbadgeBtn({ count = 0, size = 34, onClick }) {
  return (
    <button onClick={onClick}
      style={{ position: "relative", background: "none", border: "none",
        cursor: "pointer", padding: 4, lineHeight: 0,
        WebkitTapHighlightColor: "transparent" }}>
      <IconWerkekorb size={size} count={count} />
      {count > 0 && (
        <div style={{
          position: "absolute", top: -2, right: -2,
          minWidth: 18, height: 18, borderRadius: 999,
          background: "linear-gradient(135deg,#FF8A6B,#FF7B72)",
          color: "white", fontSize: 9, fontWeight: 900,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 4px", border: "2px solid white",
          boxShadow: "0 2px 6px rgba(255,138,107,0.4)",
        }}>{count > 9 ? "9+" : count}</div>
      )}
    </button>
  );
}

/* ════════════════════════════════════════════════════
   ACTION ICONS
════════════════════════════════════════════════════ */

/* Vertrauen — soft shield with star */
export function IconVertrauen({ size = 32 }) {
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id="v-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22E8D8" />
          <stop offset="100%" stopColor="#11C5B7" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#E4F9F7" filter="url(#hui-shadow)" />
      <path d="M32 12 L48 19 L48 34 Q48 46 32 52 Q16 46 16 34 L16 19 Z"
        fill="url(#v-bg)" opacity="0.9" />
      <path d="M32 14 L46 21 L46 34 Q46 44 32 50"
        fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.3" />
      {/* Star */}
      <path d="M32 24 L33.8 29.5 L39.5 29.5 L35 33 L36.8 38.5 L32 35 L27.2 38.5 L29 33 L24.5 29.5 L30.2 29.5 Z"
        fill="white" />
      <circle cx="32" cy="31" r="4" fill="#FFD166" opacity="0.6" />
    </Svg>
  );
}

/* HUI Match — sparkle magic */
export function IconHuiMatch({ size = 32 }) {
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id="m-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#16D7C5" />
          <stop offset="100%" stopColor="#FF8A6B" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#m-bg)" filter="url(#hui-shadow)" />
      {/* Stars / sparkles */}
      <path d="M32 14 L34 22 L42 22 L36 27 L38 35 L32 30 L26 35 L28 27 L22 22 L30 22 Z"
        fill="white" opacity="0.95" />
      <circle cx="46" cy="20" r="4" fill="#FFD166" opacity="0.9" />
      <circle cx="50" cy="14" r="2.5" fill="#FFD166" opacity="0.6" />
      <circle cx="18" cy="44" r="3" fill="white" opacity="0.5" />
      <circle cx="44" cy="46" r="2" fill="white" opacity="0.4" />
      {/* Shine */}
      <path d="M22 18 L24 14 L26 18 L24 22 Z" fill="white" opacity="0.6" />
    </Svg>
  );
}

/* Nachricht — warm chat bubble */
export function IconNachricht({ size = 32, unread = false }) {
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id="n-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22E8D8" />
          <stop offset="100%" stopColor="#11C5B7" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#E4F9F7" filter="url(#hui-shadow)" />
      {/* Bubble */}
      <path d="M14 20 Q14 14 20 14 L44 14 Q50 14 50 20 L50 36 Q50 42 44 42 L34 42 L26 50 L26 42 L20 42 Q14 42 14 36 Z"
        fill="url(#n-bg)" />
      {/* Lines */}
      <rect x="22" y="24" width="20" height="3" rx="1.5" fill="white" opacity="0.7" />
      <rect x="22" y="31" width="14" height="3" rx="1.5" fill="white" opacity="0.5" />
      {unread && <circle cx="46" cy="16" r="5" fill="#FF8A6B" />}
    </Svg>
  );
}

/* Benachrichtigungen — soft bell */
export function IconBell({ size = 32, count = 0 }) {
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id="b-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD166" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="#FFFBEB" filter="url(#hui-shadow)" />
      {/* Bell body */}
      <path d="M32 14 Q20 18 18 32 L18 40 L46 40 L46 32 Q44 18 32 14Z"
        fill="url(#b-bg)" />
      {/* Shine */}
      <path d="M26 19 Q28 16 32 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" fill="none" />
      {/* Clapper */}
      <circle cx="32" cy="44" r="4" fill="#E8A000" />
      {/* Top dot */}
      <circle cx="32" cy="12" r="3" fill="#F59E0B" />
      {count > 0 && <circle cx="44" cy="18" r="6" fill="#FF8A6B" />}
    </Svg>
  );
}

/* Community — soft human bubbles */
export function IconCommunity({ size = 32 }) {
  return (
    <Svg size={size}>
      <circle cx="32" cy="32" r="28" fill="#F0FDFB" filter="url(#hui-shadow)" />
      {/* Three person circles */}
      <circle cx="21" cy="28" r="10" fill="#16D7C5" opacity="0.85" />
      <circle cx="43" cy="28" r="10" fill="#FF8A6B" opacity="0.85" />
      <circle cx="32" cy="22" r="11" fill="#FFD166" opacity="0.9" />
      {/* People heads */}
      <circle cx="21" cy="26" r="4" fill="white" opacity="0.8" />
      <circle cx="43" cy="26" r="4" fill="white" opacity="0.8" />
      <circle cx="32" cy="20" r="4.5" fill="white" opacity="0.8" />
      {/* Connection lines */}
      <path d="M25 34 Q32 40 39 34" stroke="white" strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round" fill="none" />
      {/* Heart center */}
      <circle cx="32" cy="42" r="5" fill="#FF8A6B" opacity="0.85" />
      <path d="M32 40 Q30 38 28 40 Q28 43 32 45 Q36 43 36 40 Q34 38 32 40Z"
        fill="white" opacity="0.7" transform="scale(0.7) translate(13.7 15)" />
    </Svg>
  );
}

/* Erstellen — organic plus with glow */
export function IconErstellen({ size = 32 }) {
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id="e-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF8A6B" />
          <stop offset="100%" stopColor="#FF5252" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#e-bg)" filter="url(#hui-shadow)" />
      <rect x="29" y="16" width="6" height="32" rx="3" fill="white" opacity="0.95" />
      <rect x="16" y="29" width="32" height="6" rx="3" fill="white" opacity="0.95" />
      <circle cx="32" cy="32" r="6" fill="white" opacity="0.3" />
    </Svg>
  );
}

/* Standort — soft pin with glow */
export function IconStandort({ size = 32 }) {
  return (
    <Svg size={size}>
      <circle cx="32" cy="32" r="28" fill="#FFF2EE" filter="url(#hui-shadow)" />
      <path d="M32 12 Q44 12 44 26 Q44 36 32 52 Q20 36 20 26 Q20 12 32 12Z"
        fill="url(#hui-coral)" />
      <circle cx="32" cy="26" r="7" fill="white" opacity="0.9" />
      <circle cx="32" cy="26" r="4" fill="#FF8A6B" opacity="0.7" />
      {/* Shine */}
      <path d="M26 20 Q28 16 32 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.45" fill="none" />
    </Svg>
  );
}

/* Speichern — warm bookmark ribbon */
export function IconSpeichern({ size = 32, saved = false }) {
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id="s-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={saved ? "#FFD166" : "#FFF8E1"} />
          <stop offset="100%" stopColor={saved ? "#F59E0B" : "#FFE082"} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#s-bg)" filter="url(#hui-shadow)" />
      <path d="M20 12 L44 12 L44 50 L32 40 L20 50 Z"
        fill={saved ? "#F59E0B" : "white"} stroke={saved ? "#E8A000" : "#FFB300"}
        strokeWidth="2" />
      {saved && (
        <>
          <circle cx="32" cy="26" r="6" fill="#FFD166" opacity="0.8" />
          <path d="M28 26 L31 29 L36 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
      {!saved && <path d="M26 28 L32 22 L38 28" stroke="#FFB300" strokeWidth="2.5" strokeLinecap="round" fill="none" />}
    </Svg>
  );
}

/* Teilen — organic share */
export function IconTeilen({ size = 32 }) {
  return (
    <Svg size={size}>
      <circle cx="32" cy="32" r="28" fill="#E4F9F7" filter="url(#hui-shadow)" />
      <circle cx="32" cy="20" r="7" fill="url(#hui-teal)" />
      <circle cx="18" cy="38" r="7" fill="url(#hui-teal)" opacity="0.85" />
      <circle cx="46" cy="38" r="7" fill="url(#hui-teal)" opacity="0.85" />
      <line x1="32" y1="27" x2="20" y2="32" stroke="#11C5B7" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="27" x2="44" y2="32" stroke="#11C5B7" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arrow up */}
      <path d="M28 18 L32 13 L36 18" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/* Empfehlen — heart with check */
export function IconEmpfehlen({ size = 32 }) {
  return (
    <Svg size={size}>
      <circle cx="32" cy="32" r="28" fill="#FEE2E2" filter="url(#hui-shadow)" />
      <path d="M32 46 C32 46 14 36 14 24 C14 18 19 14 24 14 C27 14 30 16 32 18 C34 16 37 14 40 14 C45 14 50 18 50 24 C50 36 32 46 32 46Z"
        fill="url(#hui-coral)" />
      <path d="M24 30 L29 35 L40 23" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

/* Einstellungen — organic gear */
export function IconEinstellungen({ size = 32 }) {
  return (
    <Svg size={size}>
      <circle cx="32" cy="32" r="28" fill="#F4F4F5" filter="url(#hui-shadow)" />
      <circle cx="32" cy="32" r="10" fill="none" stroke="#A1A1AA" strokeWidth="4" />
      <circle cx="32" cy="32" r="5" fill="#A1A1AA" />
      {[0,45,90,135,180,225,270,315].map((deg,i) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 32 + 14 * Math.cos(rad);
        const y1 = 32 + 14 * Math.sin(rad);
        const x2 = 32 + 19 * Math.cos(rad);
        const y2 = 32 + 19 * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#A1A1AA" strokeWidth="4" strokeLinecap="round" />;
      })}
    </Svg>
  );
}

/* Support — soft headset */
export function IconSupport({ size = 32 }) {
  return (
    <Svg size={size}>
      <circle cx="32" cy="32" r="28" fill="#E4F9F7" filter="url(#hui-shadow)" />
      <path d="M16 34 Q16 18 32 18 Q48 18 48 34" fill="none" stroke="url(#hui-teal)" strokeWidth="4" strokeLinecap="round" />
      <rect x="12" y="32" width="8" height="12" rx="4" fill="url(#hui-teal)" />
      <rect x="44" y="32" width="8" height="12" rx="4" fill="url(#hui-teal)" />
      <path d="M40 44 Q40 50 32 50" stroke="url(#hui-teal)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="50" r="3" fill="#11C5B7" />
    </Svg>
  );
}

/* Buchung — calendar with heart */
export function IconBuchung({ size = 32 }) {
  return (
    <Svg size={size}>
      <circle cx="32" cy="32" r="28" fill="#FFF2EE" filter="url(#hui-shadow)" />
      <rect x="14" y="18" width="36" height="32" rx="6" fill="url(#hui-coral)" />
      <rect x="14" y="18" width="36" height="12" rx="6" fill="#FF5252" opacity="0.25" />
      <rect x="14" y="24" width="36" height="6" fill="#FF7B72" />
      {/* Pins */}
      <rect x="22" y="12" width="4" height="12" rx="2" fill="#FF8A6B" />
      <rect x="38" y="12" width="4" height="12" rx="2" fill="#FF8A6B" />
      {/* Heart on calendar */}
      <path d="M32 38 Q29 35 27 37 Q27 41 32 44 Q37 41 37 37 Q35 35 32 38Z"
        fill="white" opacity="0.9" />
    </Svg>
  );
}

/* ════════════════════════════════════════════════════
   CATEGORY ICONS
════════════════════════════════════════════════════ */

function CategoryBase({ size, bg1, bg2, children }) {
  return (
    <Svg size={size}>
      <defs>
        <linearGradient id={`cat-${bg1.replace("#","")}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bg1} />
          <stop offset="100%" stopColor={bg2} />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill={`url(#cat-${bg1.replace("#","")})`} filter="url(#hui-shadow)" />
      <rect x="4" y="4" width="56" height="26" rx="16" fill="white" fillOpacity="0.12" />
      {children}
    </Svg>
  );
}

export function CatHandwerk({ size = 40 }) {
  return (
    <CategoryBase size={size} bg1="#16D7C5" bg2="#11C5B7">
      {/* Hammer */}
      <rect x="24" y="26" width="6" height="22" rx="3" fill="white" opacity="0.9" transform="rotate(-35 32 32)" />
      <rect x="20" y="14" width="22" height="10" rx="4" fill="white" transform="rotate(-35 32 32)" />
    </CategoryBase>
  );
}

export function CatKunst({ size = 40 }) {
  return (
    <CategoryBase size={size} bg1="#FF8A6B" bg2="#FF5252">
      {/* Palette + brush */}
      <circle cx="30" cy="32" r="12" fill="white" opacity="0.85" />
      <circle cx="30" cy="32" r="4" fill="#FF8A6B" opacity="0.6" />
      {/* Color dots */}
      <circle cx="22" cy="26" r="3" fill="#16D7C5" />
      <circle cx="38" cy="26" r="3" fill="#FFD166" />
      <circle cx="22" cy="38" r="3" fill="#A78BFA" />
      {/* Brush */}
      <line x1="38" y1="36" x2="50" y2="20" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="20" r="4" fill="#FFD166" />
    </CategoryBase>
  );
}

export function CatFotografie({ size = 40 }) {
  return (
    <CategoryBase size={size} bg1="#6366F1" bg2="#4F46E5">
      {/* Camera body */}
      <rect x="14" y="24" width="36" height="24" rx="6" fill="white" opacity="0.9" />
      {/* Lens */}
      <circle cx="32" cy="36" r="8" fill="url(#hui-purple)" opacity="0.9" />
      <circle cx="32" cy="36" r="5" fill="white" opacity="0.7" />
      <circle cx="32" cy="36" r="2.5" fill="#4F46E5" opacity="0.8" />
      {/* Viewfinder bump */}
      <rect x="26" y="18" width="12" height="8" rx="3" fill="white" opacity="0.9" />
      {/* Flash */}
      <circle cx="20" cy="30" r="3" fill="#FFD166" opacity="0.9" />
    </CategoryBase>
  );
}

export function CatCoaching({ size = 40 }) {
  return (
    <CategoryBase size={size} bg1="#F59E0B" bg2="#D97706">
      {/* Speech bubble */}
      <path d="M12 18 Q12 12 18 12 L46 12 Q52 12 52 18 L52 34 Q52 40 46 40 L36 40 L28 50 L28 40 L18 40 Q12 40 12 34 Z"
        fill="white" opacity="0.9" />
      {/* Three dots */}
      <circle cx="23" cy="26" r="3" fill="#F59E0B" />
      <circle cx="32" cy="26" r="3" fill="#F59E0B" />
      <circle cx="41" cy="26" r="3" fill="#F59E0B" />
    </CategoryBase>
  );
}

export function CatMusik({ size = 40 }) {
  return (
    <CategoryBase size={size} bg1="#EC4899" bg2="#DB2777">
      {/* Musical note */}
      <path d="M38 14 L38 38" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="32" cy="40" rx="8" ry="6" fill="white" opacity="0.9" />
      <rect x="35" y="14" width="14" height="6" rx="3" fill="white" opacity="0.75" />
    </CategoryBase>
  );
}

export function CatGesundheit({ size = 40 }) {
  return (
    <CategoryBase size={size} bg1="#10B981" bg2="#059669">
      {/* Yoga person / leaf */}
      <circle cx="32" cy="20" r="7" fill="white" opacity="0.9" />
      <path d="M20 36 Q26 28 32 28 Q38 28 44 36 Q38 40 32 42 Q26 40 20 36Z"
        fill="white" opacity="0.85" />
      {/* Lotus */}
      <path d="M32 44 Q28 40 26 44 Q28 48 32 48 Q36 48 38 44 Q36 40 32 44Z"
        fill="white" opacity="0.6" />
    </CategoryBase>
  );
}

export function CatNatur({ size = 40 }) {
  return (
    <CategoryBase size={size} bg1="#34D399" bg2="#059669">
      {/* Tree */}
      <circle cx="32" cy="24" r="14" fill="white" opacity="0.85" />
      <rect x="29" y="36" width="6" height="14" rx="3" fill="white" opacity="0.7" />
      {/* Leaf details */}
      <path d="M26 20 Q32 14 38 20 Q32 26 26 20Z" fill="#10B981" opacity="0.5" />
      <path d="M26 26 Q32 20 38 26 Q32 32 26 26Z" fill="#10B981" opacity="0.35" />
    </CategoryBase>
  );
}

export function CatEvents({ size = 40 }) {
  return (
    <CategoryBase size={size} bg1="#F59E0B" bg2="#D97706">
      {/* Party popper */}
      <path d="M14 50 L38 20" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M38 20 L32 16 L44 14 L46 26 Z" fill="white" opacity="0.9" />
      {/* Confetti */}
      <circle cx="44" cy="32" r="3" fill="#FF8A6B" opacity="0.9" />
      <circle cx="50" cy="22" r="2.5" fill="#16D7C5" opacity="0.9" />
      <circle cx="38" cy="42" r="2" fill="white" opacity="0.7" />
      <path d="M28 14 L30 10 L32 14" fill="#FFD166" />
    </CategoryBase>
  );
}

export function CatTechnologie({ size = 40 }) {
  return (
    <CategoryBase size={size} bg1="#6366F1" bg2="#4F46E5">
      {/* Chip / circuit */}
      <rect x="20" y="20" width="24" height="24" rx="4" fill="white" opacity="0.9" />
      <rect x="24" y="24" width="16" height="16" rx="2" fill="url(#hui-purple)" opacity="0.7" />
      {/* Pins */}
      {[24,30,36].map((x,i) => (
        <React.Fragment key={i}>
          <rect x={x} y="14" width="3" height="6" rx="1.5" fill="white" opacity="0.7" />
          <rect x={x} y="44" width="3" height="6" rx="1.5" fill="white" opacity="0.7" />
        </React.Fragment>
      ))}
      {[24,30,36].map((y,i) => (
        <React.Fragment key={i}>
          <rect x="14" y={y} width="6" height="3" rx="1.5" fill="white" opacity="0.7" />
          <rect x="44" y={y} width="6" height="3" rx="1.5" fill="white" opacity="0.7" />
        </React.Fragment>
      ))}
    </CategoryBase>
  );
}

export function CatBildung({ size = 40 }) {
  return (
    <CategoryBase size={size} bg1="#16D7C5" bg2="#FF8A6B">
      {/* Graduation cap */}
      <path d="M16 30 L32 22 L48 30 L32 38 Z" fill="white" opacity="0.95" />
      <rect x="40" y="30" width="4" height="14" rx="2" fill="white" opacity="0.7" />
      <circle cx="42" cy="45" r="4" fill="#FFD166" opacity="0.9" />
      {/* Book */}
      <rect x="20" y="36" width="20" height="14" rx="3" fill="white" opacity="0.75" />
      <line x1="30" y1="36" x2="30" y2="50" stroke="#16D7C5" strokeWidth="1.5" strokeOpacity="0.5" />
    </CategoryBase>
  );
}

/* ════════════════════════════════════════════════════
   HUI LOGO ICON — for nav center button
════════════════════════════════════════════════════ */

export function HuiLogoIcon({ size = 54 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22E8D8" />
          <stop offset="100%" stopColor="#11C5B7" />
        </linearGradient>
      </defs>
      {/* Rounded square */}
      <rect x="4" y="4" width="56" height="56" rx="16"
        fill="url(#logo-bg)" />
      {/* Shine */}
      <rect x="4" y="4" width="56" height="28" rx="16"
        fill="white" fillOpacity="0.18" />
      {/* "Hj" text mark */}
      <text x="14" y="42" fontSize="28" fontWeight="900"
        fill="white" fontFamily="-apple-system, system-ui, sans-serif"
        letterSpacing="-2">Hj</text>
    </svg>
  );
}

/* ════════════════════════════════════════════════════
   EXPORTS — convenience map
════════════════════════════════════════════════════ */

export const HuiIcons = {
  Home:         IconHome,
  Impact:       IconImpact,
  Entdecken:    IconEntdecken,
  Favoriten:    IconFavoriten,
  Profil:       IconProfil,
  Werkekorb:    IconWerkekorb,
  Vertrauen:    IconVertrauen,
  HuiMatch:     IconHuiMatch,
  Nachricht:    IconNachricht,
  Bell:         IconBell,
  Community:    IconCommunity,
  Erstellen:    IconErstellen,
  Standort:     IconStandort,
  Speichern:    IconSpeichern,
  Teilen:       IconTeilen,
  Empfehlen:    IconEmpfehlen,
  Einstellungen:IconEinstellungen,
  Support:      IconSupport,
  Buchung:      IconBuchung,
  // Categories
  Handwerk:     CatHandwerk,
  Kunst:        CatKunst,
  Fotografie:   CatFotografie,
  Coaching:     CatCoaching,
  Musik:        CatMusik,
  Gesundheit:   CatGesundheit,
  Natur:        CatNatur,
  Events:       CatEvents,
  Technologie:  CatTechnologie,
  Bildung:      CatBildung,
};

export default HuiIcons;
