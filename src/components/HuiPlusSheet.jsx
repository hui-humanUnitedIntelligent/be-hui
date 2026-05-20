// HuiPlusSheet.jsx — HUI Orb Experience v6 — LIGHT & HUMAN
// Visual: bright, soft glassmorphism, morning light atmosphere
// Logik: identisch zu v5 — nur visuelles Design-System erneuert
//
// ARCHITEKTUR:
//   - Fullscreen fixed (inset:0, zIndex:9000) — über allem
//   - Orb-Stage: 100vw x 100vh — die gesamte Fläche
//   - Nodes: Polarkoordinaten, absolut positioniert
//   - Background: warm white + soft mint + lavender blobs
//
// Props: { onSelect, onClose, isTalent, isTrusted }
// onSelect(type) → "story"|"werk"|"experience"|"impact"|"connect"|"membership"

import React, {
  useState, useEffect, useCallback, useMemo, useRef
} from "react";

/* ─────────────────────────────────────────────────
   TOKENS — Light Human Palette
   Entfernt: schwarz, cyber, neon-heavy
   Neu: warm white, soft mint, teal, coral, lavender
───────────────────────────────────────────────── */
const T = {
  // Brand
  teal:    "#0ABFB8",   tealD:   "#0891B2",
  coral:   "#FB923C",   coralD:  "#EA580C",
  violet:  "#8B5CF6",   violetD: "#7C3AED",
  blue:    "#38BDF8",   blueD:   "#0EA5E9",
  gold:    "#F59E0B",   goldD:   "#D97706",

  // Background System — light
  bg:      "rgba(245,243,255,0.82)",   // soft lavender white
  bgSolid: "#F7F6FF",

  // Glass — light version
  glass:   "rgba(255,255,255,0.72)",
  glassB:  "rgba(255,255,255,0.88)",
  glassBorder: "rgba(255,255,255,0.60)",

  // Typography — dark on light
  ink:     "#1A1A2E",
  ink2:    "rgba(26,26,46,0.65)",
  ink3:    "rgba(26,26,46,0.40)",
  ink4:    "rgba(26,26,46,0.22)",

  // Light helpers
  white:   "#FFFFFF",
  w90:     "rgba(255,255,255,0.90)",
  w70:     "rgba(255,255,255,0.70)",
  w40:     "rgba(255,255,255,0.40)",
  w20:     "rgba(255,255,255,0.20)",
  w10:     "rgba(255,255,255,0.10)",
};

/* ─────────────────────────────────────────────────
   CSS — Light Animationen
───────────────────────────────────────────────── */
const CSS = `
  /* ── Overlay Entry ── */
  @keyframes orbOverlayIn {
    from { opacity:0; }
    to   { opacity:1; }
  }

  /* ── Logo Orb ── */
  @keyframes orbLogoIn {
    0%   { opacity:0; transform:scale(0.3); }
    70%  { opacity:1; transform:scale(1.05); }
    100% { transform:scale(1); }
  }
  @keyframes orbBreath {
    0%,100% { box-shadow:
      0 0 0 0   rgba(10,191,184,0),
      0 12px 40px rgba(10,191,184,0.20),
      0 0 80px  rgba(10,191,184,0.08); }
    50% { box-shadow:
      0 0 0 10px rgba(10,191,184,0.05),
      0 16px 56px rgba(10,191,184,0.28),
      0 0 110px rgba(10,191,184,0.12); }
  }
  @keyframes orbBreathCoral {
    0%,100% { box-shadow:
      0 0 0 0   rgba(251,146,60,0),
      0 12px 40px rgba(251,146,60,0.20),
      0 0 80px  rgba(251,146,60,0.08); }
    50% { box-shadow:
      0 0 0 10px rgba(251,146,60,0.05),
      0 16px 56px rgba(251,146,60,0.28),
      0 0 110px rgba(251,146,60,0.12); }
  }
  @keyframes ringPulse {
    0%,100% { transform:scale(1);    opacity:0.18; }
    50%     { transform:scale(1.14); opacity:0.06; }
  }
  @keyframes ringPulse2 {
    0%,100% { transform:scale(1);    opacity:0.10; }
    50%     { transform:scale(1.20); opacity:0.04; }
  }

  /* ── Nodes ── */
  @keyframes nodeIn {
    0%   { opacity:0; transform:translate(var(--nx),var(--ny)) scale(0.55); }
    100% { opacity:1; transform:translate(var(--nx),var(--ny)) scale(1); }
  }
  /* Float: nur translateY — Position via top/left/margin fix gesetzt */
  @keyframes floatA { 0%,100%{transform:translateY(0px)}  50%{transform:translateY(-7px)} }
  @keyframes floatB { 0%,100%{transform:translateY(4px)}  50%{transform:translateY(-5px)} }
  @keyframes floatC { 0%,100%{transform:translateY(-3px)} 50%{transform:translateY(6px)} }
  @keyframes floatD { 0%,100%{transform:translateY(5px)}  50%{transform:translateY(-4px)} }
  @keyframes floatE { 0%,100%{transform:translateY(-4px)} 50%{transform:translateY(6px)} }

  /* ── Background Blobs ── */
  @keyframes blobFloat1 {
    0%,100% { transform:translate(-50%,-50%) scale(1)    rotate(0deg); }
    33%     { transform:translate(-50%,-50%) scale(1.08) rotate(6deg); }
    66%     { transform:translate(-52%,-48%) scale(0.95) rotate(-4deg); }
  }
  @keyframes blobFloat2 {
    0%,100% { transform:translate(-50%,-50%) scale(1)    rotate(0deg); }
    40%     { transform:translate(-48%,-52%) scale(1.06) rotate(-5deg); }
    70%     { transform:translate(-50%,-50%) scale(0.96) rotate(3deg); }
  }
  @keyframes blobFloat3 {
    0%,100% { transform:translate(-50%,-50%) scale(1)    rotate(0deg); }
    50%     { transform:translate(-50%,-50%) scale(1.10) rotate(8deg); }
  }

  /* ── Particles (light version) ── */
  @keyframes particleLife {
    0%   { opacity:0; transform:translate(0,0) scale(0); }
    20%  { opacity:0.55; }
    80%  { opacity:0.20; }
    100% { opacity:0; transform:translate(var(--pdx),var(--pdy)) scale(0); }
  }

  /* ── Cards & Hints ── */
  @keyframes sheetUp {
    from { opacity:0; transform:translateY(48px) scale(0.97); }
    to   { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes impactIn {
    from { opacity:0; transform:scale(0.94); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes impactGlow {
    0%,100% { opacity:0.08; transform:scale(1); }
    50%     { opacity:0.18; transform:scale(1.08); }
  }
  @keyframes hintIn {
    from { opacity:0; transform:translateX(-50%) translateY(18px) scale(0.96); }
    to   { opacity:1; transform:translateX(-50%) translateY(0)    scale(1); }
  }
  @keyframes mantIn {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  .orb-tap {
    -webkit-tap-highlight-color:transparent;
    touch-action: manipulation;
    cursor:pointer;
    transition:transform 0.16s ease, opacity 0.16s ease;
  }
  .orb-tap:active { opacity:0.70; }
  .orb-no-scroll::-webkit-scrollbar { display:none; }
  .orb-no-scroll { -ms-overflow-style:none; scrollbar-width:none; }
`;

/* ─────────────────────────────────────────────────
   NODE DATEN — unverändert (nur glow-rgba angepasst)
───────────────────────────────────────────────── */
const NODES = [
  {
    key:"teilen",     label:"Teilen",            icon:"🌿",
    color:T.teal,     dark:T.tealD,
    glow:"rgba(10,191,184,",
    angle:-90, floatAnim:"floatA", delay:0.08,
    desc:"Zeige etwas, das dich bewegt.",
    cta:"story",      ctaLabel:"Jetzt teilen",
    forAll:true,
    sub:[
      {key:"foto",        icon:"📷", label:"Foto / Video"       },
      {key:"gedanke",     icon:"💭", label:"Gedanke"            },
      {key:"inspiration", icon:"✨", label:"Inspiration"        },
      {key:"musik",       icon:"🎵", label:"Musik"              },
      {key:"geschichte",  icon:"📖", label:"Geschichte"         },
    ],
  },
  {
    key:"werk",       label:"Werk erschaffen",   icon:"🎨",
    color:T.coral,    dark:T.coralD,
    glow:"rgba(251,146,60,",
    angle:-18, floatAnim:"floatB", delay:0.16,
    desc:"Deine Kunst, dein Handwerk oder Design.",
    cta:"werk",       ctaLabel:"Werk erstellen",
    forAll:false, talentOnly:true,
    sub:[
      {key:"kunstwerk", icon:"🖼",  label:"Kunstwerk"           },
      {key:"handwerk",  icon:"🏺",  label:"Handwerk"            },
      {key:"design",    icon:"✏️",  label:"Design"              },
      {key:"digital",   icon:"💻",  label:"Digitale Produkte"   },
      {key:"sammler",   icon:"💎",  label:"Sammlerstücke"       },
    ],
  },
  {
    key:"erlebnis",   label:"Erlebnis öffnen",   icon:"📅",
    color:T.blue,     dark:T.blueD,
    glow:"rgba(56,189,248,",
    angle:54,  floatAnim:"floatC", delay:0.24,
    desc:"Lade Menschen in einen besonderen Moment.",
    cta:"experience", ctaLabel:"Erlebnis öffnen",
    forAll:false, talentOnly:true,
    sub:[
      {key:"workshop",    icon:"🔨", label:"Workshop"           },
      {key:"retreat",     icon:"🌲", label:"Retreat"            },
      {key:"event",       icon:"🎉", label:"Event"              },
      {key:"session",     icon:"🎯", label:"Session"            },
      {key:"erlebnis_s",  icon:"🌟", label:"Erlebnis"           },
    ],
  },
  {
    key:"wirkung",    label:"Wirkung starten",   icon:"❤️",
    color:T.coral,    dark:T.coralD,
    glow:"rgba(251,146,60,",
    angle:126, floatAnim:"floatD", delay:0.32,
    desc:"Reiche eine Vision für echten Impact ein.",
    cta:"impact",     ctaLabel:"Vision einreichen",
    forAll:true, isImpact:true,
    sub:[
      {key:"idee",      icon:"💡", label:"Idee einreichen"      },
      {key:"wirkraum",  icon:"🌍", label:"Wirkungsraum"         },
      {key:"einreich",  icon:"📋", label:"Meine Einreichungen"  },
    ],
  },
  {
    key:"verbindung", label:"Verbindung",         icon:"👥",
    color:T.violet,   dark:T.violetD,
    glow:"rgba(139,92,246,",
    angle:198, floatAnim:"floatE", delay:0.40,
    desc:"Finde kreative Menschen und kollaboriere.",
    cta:"connect",    ctaLabel:"Verbindungen finden",
    forAll:true,
    sub:[
      {key:"kollab",    icon:"🤝", label:"Kollaboration"        },
      {key:"mentor",    icon:"🎓", label:"Mentor finden"        },
      {key:"partner",   icon:"🔗", label:"Projektpartner"       },
      {key:"community", icon:"🌐", label:"Community"            },
    ],
  },
];

const IMPACT_STEPS = [
  {icon:"💡", title:"Idee einreichen",            sub:"Teile deine Vision."},
  {icon:"🔍", title:"Prüfung durch HUI Team",     sub:"Wir prüfen, ob es passt."},
  {icon:"🗳",  title:"Community Entscheidung",     sub:"Die Community entscheidet."},
  {icon:"🌱", title:"Gemeinsam Wirkung schaffen",  sub:"Transparenz und echter Impact."},
];

/* ─── Helper: Polarkoordinaten → px ─── */
function polar(angleDeg, r) {
  const rad = angleDeg * Math.PI / 180;
  return { x: Math.round(Math.cos(rad) * r), y: Math.round(Math.sin(rad) * r) };
}

/* ─────────────────────────────────────────────────
   BACKGROUND BLOBS — soft light atmosphere
───────────────────────────────────────────────── */
function AtmosphereBlobs() {
  return (
    <>
      {/* Mint blob — oben links */}
      <div style={{
        position:"absolute",
        left:"20%", top:"18%",
        width:320, height:280,
        borderRadius:"62% 38% 55% 45% / 50% 60% 40% 50%",
        background:"radial-gradient(ellipse, rgba(10,191,184,0.13) 0%, transparent 70%)",
        filter:"blur(48px)",
        animation:"blobFloat1 14s ease-in-out infinite",
        pointerEvents:"none",
        transform:"translate(-50%,-50%)",
      }}/>
      {/* Lavender blob — rechts */}
      <div style={{
        position:"absolute",
        left:"78%", top:"35%",
        width:280, height:260,
        borderRadius:"45% 55% 40% 60% / 55% 45% 60% 40%",
        background:"radial-gradient(ellipse, rgba(139,92,246,0.10) 0%, transparent 70%)",
        filter:"blur(56px)",
        animation:"blobFloat2 18s ease-in-out 2s infinite",
        pointerEvents:"none",
        transform:"translate(-50%,-50%)",
      }}/>
      {/* Peach blob — unten */}
      <div style={{
        position:"absolute",
        left:"50%", top:"75%",
        width:360, height:240,
        borderRadius:"55% 45% 60% 40% / 45% 60% 40% 55%",
        background:"radial-gradient(ellipse, rgba(251,146,60,0.08) 0%, transparent 70%)",
        filter:"blur(60px)",
        animation:"blobFloat3 22s ease-in-out 5s infinite",
        pointerEvents:"none",
        transform:"translate(-50%,-50%)",
      }}/>
      {/* Soft teal center glow */}
      <div style={{
        position:"absolute",
        left:"50%", top:"42%",
        width:500, height:400,
        background:"radial-gradient(ellipse, rgba(10,191,184,0.06) 0%, transparent 65%)",
        transform:"translate(-50%,-50%)",
        pointerEvents:"none",
      }}/>
    </>
  );
}

/* ─────────────────────────────────────────────────
   PARTICLES — light version (zart, hell)
───────────────────────────────────────────────── */
function Particles({ color }) {
  const items = useMemo(() => Array.from({length:16}, (_,i) => ({
    id:i,
    x:  (Math.random()-0.5)*320,
    y:  (Math.random()-0.5)*320,
    dx: (Math.random()-0.5)*180,
    dy: (Math.random()-0.5)*180,
    s:  2 + Math.random()*4,
    d:  2.8 + Math.random()*4,
    del:Math.random()*3,
  })), []);
  return (
    <div style={{ position:"absolute", left:"50%", top:"44%",
      width:0, height:0, pointerEvents:"none", zIndex:1 }}>
      {items.map(p => (
        <div key={p.id} style={{
          position:"absolute",
          left:p.x, top:p.y,
          width:p.s, height:p.s,
          borderRadius:"50%",
          background:color,
          "--pdx":`${p.dx}px`,
          "--pdy":`${p.dy}px`,
          animation:`particleLife ${p.d}s ${p.del}s ease-out infinite`,
        }}/>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   LOGO ORB — glass sphere, soft glow
───────────────────────────────────────────────── */
function LogoOrb({ size=100, activeColor=null }) {
  const isCoralMode = activeColor === T.coral;
  const glowColor   = activeColor || T.teal;
  return (
    <div style={{ position:"relative", width:size, height:size,
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      {/* Outer rings — very subtle */}
      <div style={{
        position:"absolute", inset:-22, borderRadius:"50%",
        border:`1.5px solid ${glowColor}`,
        opacity:0.15,
        animation:"ringPulse 3.8s ease-in-out infinite",
      }}/>
      <div style={{
        position:"absolute", inset:-42, borderRadius:"50%",
        border:`1px solid ${glowColor}`,
        opacity:0.08,
        animation:"ringPulse2 5s ease-in-out 1s infinite",
      }}/>
      <div style={{
        position:"absolute", inset:-64, borderRadius:"50%",
        border:`1px solid ${glowColor}`,
        opacity:0.04,
        animation:"ringPulse2 6.5s ease-in-out 2s infinite",
      }}/>

      {/* Glass sphere */}
      <div style={{
        width:size, height:size, borderRadius:"50%", overflow:"hidden",
        animation: isCoralMode
          ? "orbBreathCoral 4.5s ease-in-out infinite"
          : "orbBreath 4.5s ease-in-out infinite",
        // Glass look: white gradient overlay
        background:"linear-gradient(145deg,rgba(255,255,255,0.85) 0%,rgba(240,250,248,0.75) 100%)",
        boxShadow:[
          `0 0 0 2.5px ${glowColor}30`,
          `0 12px 36px ${glowColor}22`,
          `inset 0 2px 8px rgba(255,255,255,0.90)`,
          `inset 0 -4px 12px ${glowColor}14`,
        ].join(","),
        transition:"box-shadow 0.65s ease",
        flexShrink:0,
        position:"relative",
      }}>
        <img src="/hui-logo.jpg" alt="HUI" loading="eager"
          style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
          onError={e => {
            e.target.style.display="none";
            const fb = document.createElement("div");
            fb.style.cssText = [
              "width:100%","height:100%","display:flex",
              "align-items:center","justify-content:center",
              `background:linear-gradient(135deg,${T.teal},${T.violet})`,
            ].join(";");
            const sp = document.createElement("span");
            sp.style.cssText = "font-size:42px;font-weight:900;color:#fff;font-family:system-ui";
            sp.textContent = "H";
            fb.appendChild(sp);
            e.target.parentNode.replaceChild(fb, e.target);
          }}
        />
        {/* Glass highlight */}
        <div style={{
          position:"absolute", top:8, left:12, width:28, height:14,
          borderRadius:"50%",
          background:"radial-gradient(ellipse, rgba(255,255,255,0.80) 0%, transparent 100%)",
          filter:"blur(3px)", transform:"rotate(-18deg)",
          pointerEvents:"none",
        }}/>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   NODE BUTTON — glass card, pastel glow, light
───────────────────────────────────────────────── */
function NodeBtn({ node, idx, active, dimmed, locked, onTap, isTransitioning, posLeft, posTop }) {
  // POSITION: fix via posLeft/posTop Props — SIZE ist IMMER 62px
  // Active-State: nur visuell (glow + border) — keine Größenänderung
  const SIZE = 62;
  const FONT = 24;

  return (
    <div
      className="orb-tap"
      onClick={() => {
        if (locked || isTransitioning) return;
        onTap(node);
      }}
      style={{
        position:"absolute",
        left:`calc(50% + ${posLeft}px)`,
        top:`calc(50% + ${posTop}px)`,
        width:SIZE, height:SIZE,
        // Entry animation: einfaches fade+scale, kein bounce, kein translate
        animation:`nodeIn 0.40s ease-out ${node.delay}s both, ${node.floatAnim} ${3.8+idx*0.4}s ease-in-out ${node.delay+0.5}s infinite`,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start",
        zIndex: active ? 6 : 5,
        cursor:  (locked || isTransitioning) ? "default" : "pointer",
        opacity: locked ? 0.30 : dimmed ? 0.20 : 1,
        filter:  locked ? "grayscale(0.6)" : "none",
        transition:"opacity 0.22s ease",
        pointerEvents: (locked || isTransitioning) ? "none" : "auto",
      }}
    >
      {/* Glow halo — pointer-events:none */}
      <div style={{
        position:"absolute", inset:-10, borderRadius:"50%",
        background:`radial-gradient(circle, ${node.glow}${active?"0.20":"0.05"}) 0%, transparent 68%)`,
        transition:"background 0.22s ease",
        pointerEvents:"none",
        zIndex:0,
      }}/>

      {/* Glass circle — fixed size, nur visueller state */}
      <div style={{
        width:SIZE, height:SIZE, borderRadius:"50%", flexShrink:0,
        background: active
          ? `linear-gradient(145deg, ${node.color}20 0%, ${node.color}0a 100%)`
          : "rgba(255,255,255,0.82)",
        backdropFilter:"blur(20px) saturate(1.4)",
        WebkitBackdropFilter:"blur(20px) saturate(1.4)",
        border: active
          ? `2px solid ${node.color}65`
          : "1.5px solid rgba(255,255,255,0.75)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:FONT,
        // Nur box-shadow + border transition — kein scale, kein bounce
        boxShadow: active
          ? [
              `0 0 0 4px ${node.glow}0.10)`,
              `0 8px 24px ${node.glow}0.22)`,
              `inset 0 1px 0 rgba(255,255,255,0.90)`,
            ].join(",")
          : [
              `0 4px 16px rgba(0,0,0,0.05)`,
              `inset 0 1px 0 rgba(255,255,255,0.95)`,
            ].join(","),
        transition:"background 0.22s ease, border 0.22s ease, box-shadow 0.22s ease",
        position:"relative", zIndex:1,
      }}>
        {node.icon}
        {/* Glass highlight — decorative only */}
        <div style={{
          position:"absolute", top:8, left:10, width:16, height:7,
          borderRadius:"50%",
          background:"radial-gradient(ellipse, rgba(255,255,255,0.65) 0%, transparent 100%)",
          filter:"blur(2px)", transform:"rotate(-18deg)",
          pointerEvents:"none",
        }}/>
      </div>

      {/* Label */}
      <div style={{
        marginTop:6, fontSize:10, fontWeight:700, lineHeight:1.25,
        color: active ? node.color : T.ink2,
        textAlign:"center",
        transition:"color 0.22s ease",
        whiteSpace:"nowrap",
        letterSpacing:0.15,
        pointerEvents:"none",
      }}>
        {node.label}
        {locked && (
          <div style={{ fontSize:9, color:T.ink3, fontWeight:500, marginTop:1 }}>
            Talent
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   NODE HINT BAR — glassmorphism, light
───────────────────────────────────────────────── */
function NodeHint({ node, onOpen }) {
  return (
    <div style={{
      position:"fixed",
      bottom:"calc(max(32px,env(safe-area-inset-bottom,32px)) + 8px)",
      left:"50%",
      transform:"translateX(-50%)",
      zIndex:9010,
      background:"rgba(255,255,255,0.88)",
      backdropFilter:"blur(24px) saturate(1.6)",
      WebkitBackdropFilter:"blur(24px) saturate(1.6)",
      borderRadius:22,
      padding:"13px 18px",
      border:`1.5px solid ${node.color}30`,
      boxShadow:[
        `0 8px 32px rgba(0,0,0,0.08)`,
        `0 2px 8px rgba(0,0,0,0.04)`,
        `0 0 0 1px ${node.glow}0.12)`,
      ].join(","),
      display:"flex", alignItems:"center", gap:12,
      animation:"hintIn 0.28s cubic-bezier(0.32,0.72,0,1) both",
      whiteSpace:"nowrap",
    }}>
      <span style={{ fontSize:18 }}>{node.icon}</span>
      <div>
        <div style={{ fontSize:13.5, fontWeight:800, color:T.ink,
          letterSpacing:-0.3 }}>{node.label}</div>
        <div style={{ fontSize:11, color:T.ink3, marginTop:1 }}>{node.desc}</div>
      </div>
      <button className="orb-tap" onClick={onOpen} style={{
        background:`linear-gradient(135deg, ${node.color} 0%, ${node.dark} 100%)`,
        border:"none", borderRadius:14, padding:"8px 16px",
        fontSize:13, fontWeight:700, color:T.white, cursor:"pointer",
        boxShadow:`0 4px 14px ${node.glow}0.30)`,
        marginLeft:6,
      }}>
        Öffnen →
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   IMPACT DETAIL — warm, emotional, still light
───────────────────────────────────────────────── */
function ImpactDetail({ onAction, onClose }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:8500,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"flex-end",
    }}
    onClick={onClose}
    >
      {/* Light backdrop */}
      <div style={{
        position:"absolute", inset:0,
        background:"rgba(255,248,242,0.78)",
        backdropFilter:"blur(20px) saturate(1.5)",
        WebkitBackdropFilter:"blur(20px) saturate(1.5)",
      }}/>
      {/* Coral glow */}
      <div style={{
        position:"absolute", left:"50%", top:"40%",
        transform:"translate(-50%,-50%)",
        width:360, height:280,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(251,146,60,0.14) 0%, transparent 68%)",
        animation:"impactGlow 4s ease-in-out infinite",
        pointerEvents:"none",
        filter:"blur(20px)",
      }}/>

      {/* Sheet */}
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%", maxWidth:480,
        background:"rgba(255,255,255,0.97)",
        borderRadius:"32px 32px 0 0",
        padding:"0 0 max(32px,env(safe-area-inset-bottom,32px))",
        border:"1.5px solid rgba(251,146,60,0.16)",
        borderBottom:"none",
        boxShadow:[
          "0 -16px 60px rgba(251,146,60,0.10)",
          "0 -4px 20px rgba(0,0,0,0.06)",
        ].join(","),
        animation:"sheetUp 0.42s cubic-bezier(0.32,0.72,0,1) both",
        overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{
          padding:"26px 24px 18px",
          borderBottom:"1px solid rgba(251,146,60,0.08)",
          textAlign:"center", position:"relative",
          background:"linear-gradient(180deg, rgba(251,146,60,0.04) 0%, transparent 100%)",
        }}>
          <button className="orb-tap" onClick={onClose} style={{
            position:"absolute", top:18, right:20,
            width:30, height:30, borderRadius:"50%",
            background:"rgba(0,0,0,0.06)", border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, color:T.ink3,
          }}>✕</button>
          <div style={{
            width:64, height:64, borderRadius:"50%",
            background:`linear-gradient(135deg,${T.coral},${T.coralD})`,
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            fontSize:30, marginBottom:12,
            boxShadow:`0 8px 28px rgba(251,146,60,0.35)`,
          }}>❤️</div>
          <div style={{ fontSize:20, fontWeight:900, color:T.ink,
            letterSpacing:-0.5, marginBottom:6 }}>Wirkung starten</div>
          <div style={{ fontSize:12.5, color:T.ink2,
            lineHeight:1.6, padding:"0 20px" }}>
            Reiche eine Vision ein, die Menschen und die Welt bewegt.
          </div>
        </div>

        {/* HUI Hinweis */}
        <div style={{ margin:"14px 22px 0",
          background:"rgba(251,146,60,0.07)",
          borderRadius:14, padding:"10px 14px",
          border:"1px solid rgba(251,146,60,0.14)",
          display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:16 }}>🌿</span>
          <div style={{ fontSize:11.5, color:T.ink2, lineHeight:1.5 }}>
            Einreichungen werden vom HUI Team geprüft. Creator mit echter Wirkung erhalten schneller Zugang zum Impact Pool.
          </div>
        </div>

        {/* 4 Steps */}
        <div style={{ padding:"14px 22px 0" }}>
          {IMPACT_STEPS.map((s,i) => (
            <div key={i} style={{ display:"flex", gap:12, marginBottom:12 }}>
              <div style={{
                width:34, height:34, borderRadius:11, flexShrink:0,
                background:"rgba(251,146,60,0.10)",
                border:"1px solid rgba(251,146,60,0.18)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>{s.title}</div>
                <div style={{ fontSize:11.5, color:T.ink3, lineHeight:1.45, marginTop:1 }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ padding:"14px 22px 0", display:"flex", flexDirection:"column", gap:10 }}>
          <button className="orb-tap" onClick={() => onAction("idee")} style={{
            width:"100%", height:52, borderRadius:18, border:"none",
            background:`linear-gradient(135deg,${T.coral},${T.coralD})`,
            color:T.white, fontSize:15, fontWeight:800, cursor:"pointer",
            boxShadow:`0 8px 28px rgba(251,146,60,0.35)`,
          }}>
            Vision einreichen →
          </button>
          <button className="orb-tap" onClick={() => onAction("wirkraum")} style={{
            width:"100%", height:44, borderRadius:14, border:"none",
            background:"rgba(251,146,60,0.06)",
            color:T.ink2, fontSize:13, fontWeight:600, cursor:"pointer",
          }}>
            Wirkungsraum entdecken
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   DETAIL CARD — white glass, soft
───────────────────────────────────────────────── */
function DetailCard({ node, isTalent, onAction, onClose }) {
  const locked = !node.forAll && !isTalent;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:8500,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"flex-end",
    }}
    onClick={onClose}
    >
      <div style={{
        position:"absolute", inset:0,
        background:"rgba(245,243,255,0.72)",
        backdropFilter:"blur(18px) saturate(1.5)",
        WebkitBackdropFilter:"blur(18px) saturate(1.5)",
      }}/>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%", maxWidth:460,
        background:"rgba(255,255,255,0.98)",
        borderRadius:"30px 30px 0 0",
        padding:"0 0 max(30px,env(safe-area-inset-bottom,30px))",
        boxShadow:"0 -12px 48px rgba(0,0,0,0.08), 0 -2px 12px rgba(0,0,0,0.04)",
        animation:"sheetUp 0.38s cubic-bezier(0.32,0.72,0,1) both",
        overflow:"hidden",
        border:`1.5px solid ${node.color}20`,
        borderBottom:"none",
      }}>
        {/* Header */}
        <div style={{
          height:116, position:"relative",
          background:`linear-gradient(160deg, ${node.color}10 0%, rgba(255,255,255,0) 100%)`,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:6,
        }}>
          <div style={{
            position:"absolute", inset:0,
            background:`radial-gradient(circle at 50% 100%, ${node.glow}0.12) 0%, transparent 65%)`,
          }}/>
          <button className="orb-tap" onClick={onClose} style={{
            position:"absolute", top:14, right:18,
            width:28, height:28, borderRadius:"50%",
            background:"rgba(0,0,0,0.06)", border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, color:T.ink3,
          }}>✕</button>
          <div style={{
            width:52, height:52, borderRadius:"50%",
            background:`linear-gradient(145deg, ${node.color}, ${node.dark})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:26, position:"relative", zIndex:2,
            boxShadow:`0 6px 20px ${node.glow}0.30)`,
          }}>{node.icon}</div>
          <div style={{ fontSize:17, fontWeight:900, color:T.ink,
            letterSpacing:-0.4, zIndex:2 }}>{node.label}</div>
          <div style={{ fontSize:11.5, color:T.ink2, zIndex:2,
            textAlign:"center", padding:"0 28px", lineHeight:1.5 }}>
            {node.desc}
          </div>
        </div>

        {/* Locked Badge */}
        {locked && (
          <div style={{
            margin:"14px 20px 0",
            background:"rgba(245,158,11,0.08)",
            borderRadius:14, padding:"10px 14px",
            border:"1px solid rgba(245,158,11,0.22)",
            display:"flex", gap:8, alignItems:"center",
          }}>
            <span style={{ fontSize:18 }}>🌱</span>
            <div style={{ fontSize:12, color:"#92400E", lineHeight:1.5 }}>
              Werde HUI Wirker, um diesen Bereich zu nutzen.
            </div>
          </div>
        )}

        {/* Sub-Items */}
        <div style={{ padding:"12px 20px 0" }}>
          {node.sub.map((item,i) => (
            <button key={item.key} className="orb-tap"
              onClick={() => !locked && onAction(item.key, node)}
              disabled={locked}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:13,
                padding:"11px 12px", borderRadius:14, border:"none",
                background:i%2===0 ? `${node.color}06` : "transparent",
                cursor:locked ? "default" : "pointer",
                opacity:locked ? 0.40 : 1, marginBottom:3,
              }}>
              <div style={{
                width:36, height:36, borderRadius:11, flexShrink:0,
                background:`${node.color}14`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
              }}>{item.icon}</div>
              <span style={{ fontSize:13.5, fontWeight:600,
                color:T.ink, textAlign:"left" }}>{item.label}</span>
              <span style={{ marginLeft:"auto", fontSize:14, color:T.ink4 }}>›</span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding:"16px 20px 0" }}>
          {locked ? (
            <button className="orb-tap" onClick={() => onAction("membership", node)} style={{
              width:"100%", height:52, borderRadius:18, border:"none",
              background:`linear-gradient(135deg,${T.teal},${T.tealD})`,
              color:T.white, fontSize:14.5, fontWeight:800, cursor:"pointer",
              boxShadow:`0 6px 22px rgba(10,191,184,0.28)`,
            }}>Wirker werden →</button>
          ) : (
            <button className="orb-tap" onClick={() => onAction(node.cta, node)} style={{
              width:"100%", height:52, borderRadius:18, border:"none",
              background:`linear-gradient(135deg,${node.color},${node.dark})`,
              color:T.white, fontSize:14.5, fontWeight:800, cursor:"pointer",
              boxShadow:`0 6px 22px ${node.glow}0.28)`,
            }}>{node.ctaLabel} →</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   MAIN EXPORT — HuiPlusSheet
   LOGIK: 100% identisch zu v5
   VISUAL: komplett neu (light, human, airy)
───────────────────────────────────────────────── */
export default function HuiPlusSheet({
  onSelect, onClose,
  isTalent  = false,
  isTrusted = false,
}) {
  const [mounted,         setMounted]         = useState(false);
  const [activeNode,      setActiveNode]      = useState(null);
  const [detailNode,      setDetailNode]      = useState(null);
  const [impactOpen,      setImpactOpen]      = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [vw,              setVw]              = useState(window.innerWidth);
  const [vh,              setVh]              = useState(window.innerHeight);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 16);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fn = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  useEffect(() => {
    const fn = e => {
      if (e.key !== "Escape") return;
      if (impactOpen)  { setImpactOpen(false); return; }
      if (detailNode)  { setDetailNode(null);  return; }
      onClose?.();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [impactOpen, detailNode, onClose]);

  // ── handleAction: TIMING FIX (onClose first, onSelect in RAF) ──
  // ── handleAction: Click-Lock + Timing Fix ──────────────────────
  const handleAction = useCallback((type) => {
    if (isTransitioning) return;   // Click-Lock: verhindert Race Conditions
    setIsTransitioning(true);
    setDetailNode(null);
    setActiveNode(null);
    setImpactOpen(false);
    // Orb zuerst schliessen — synchron
    onClose?.();
    // Flow im nächsten Frame mounten — PlusSheet ist bereits unmounted
    window.requestAnimationFrame(() => {
      onSelect?.(type);
      // Lock nach 500ms freigeben
      setTimeout(() => setIsTransitioning(false), 500);
    });
  }, [onSelect, onClose, isTransitioning]);

  const handleNodeTap = useCallback(node => {
    if (isTransitioning) return;
    // SINGLE-TAP: Teilen / Verbindung / Impact → sofort auslösen
    if (node.key === "teilen" || node.cta === "story") {
      setActiveNode(null);
      handleAction("story");
    } else if (node.cta === "connect") {
      setActiveNode(null);
      handleAction("connect");
    } else if (node.isImpact) {
      setActiveNode(null);
      setImpactOpen(true);
    } else if (activeNode?.key === node.key) {
      // 2. Tap auf Werk/Erlebnis → DetailCard
      setDetailNode(node);
      setActiveNode(null);
    } else {
      // 1. Tap auf Werk/Erlebnis → aktivieren + Hint
      setActiveNode(node);
    }
  }, [activeNode, handleAction, isTransitioning]);

  const handleHintOpen = useCallback(() => {
    if (!activeNode || isTransitioning) return;
    if (activeNode.isImpact) {
      setImpactOpen(true);
      setActiveNode(null);
    } else if (activeNode.cta === "story" || activeNode.cta === "teilen" || activeNode.key === "teilen") {
      setActiveNode(null);
      handleAction("story");
    } else if (activeNode.cta === "connect") {
      setActiveNode(null);
      handleAction("connect");
    } else {
      setDetailNode(activeNode);
      setActiveNode(null);
    }
  }, [activeNode, handleAction, isTransitioning]);

  const handleOrbTap = useCallback(() => {
    if (!activeNode || isTransitioning) return;
    if (activeNode.isImpact) {
      setImpactOpen(true);
      setActiveNode(null);
    } else if (activeNode.cta === "story" || activeNode.cta === "teilen" || activeNode.key === "teilen") {
      setActiveNode(null);
      handleAction("story");
    } else if (activeNode.cta === "connect") {
      setActiveNode(null);
      handleAction("connect");
    } else {
      setDetailNode(activeNode);
      setActiveNode(null);
    }
  }, [activeNode, handleAction, isTransitioning]);

  const R    = Math.min(vw, vh) * 0.30;
  const orbR = Math.min(Math.max(R, 100), 155);

  const ambientColor = activeNode?.color || T.teal;

  return (
    <>
      <style>{CSS}</style>

      {/* ══════════════════════════════════════════════════════
          FULLSCREEN LIGHT OVERLAY
          Background: warm white + soft pastel blobs
      ══════════════════════════════════════════════════════ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="HUI Orb — Dein kreatives Zentrum"
        style={{
          position:"fixed", inset:0,
          zIndex:9000,
          background:"linear-gradient(160deg, #F8F7FF 0%, #F0FDF9 40%, #FFF7F0 80%, #F8F7FF 100%)",
          backdropFilter:"blur(0px)",
          opacity: mounted ? 1 : 0,
          transition:"opacity 0.30s ease",
          overflow:"hidden",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
        onClick={e => {
          if (e.target !== e.currentTarget) return;
          if (activeNode) { setActiveNode(null); return; }
          onClose?.();
        }}
      >
        {/* ── Atmospheric blobs ── */}
        <AtmosphereBlobs />

        {/* ── Subtle ambient shift mit aktiver Node-Farbe ── */}
        <div style={{
          position:"absolute",
          left:"50%", top:"44%",
          transform:"translate(-50%,-50%)",
          width:Math.max(vw,vh) * 0.65,
          height:Math.max(vw,vh) * 0.65,
          borderRadius:"50%",
          background:`radial-gradient(circle, ${ambientColor}08 0%, transparent 65%)`,
          transition:"background 0.70s ease",
          pointerEvents:"none",
        }}/>

        {/* ── Header ── */}
        <div style={{
          position:"absolute",
          top:"max(44px,env(safe-area-inset-top,44px))",
          left:0, right:0,
          textAlign:"center",
          pointerEvents:"none",
          animation:"mantIn 0.50s 0.12s both",
        }}>
          <div style={{
            fontSize:19, fontWeight:900, color:T.ink,
            letterSpacing:-0.5,
          }}>
            Der HUI Orb<span style={{ color:T.teal }}>·</span>
          </div>
          <div style={{ fontSize:11.5, color:T.ink3, marginTop:3, letterSpacing:0.15 }}>
            Dein Zugang zu allem, was du erschaffen möchtest.
          </div>
        </div>

        {/* ── Particles (very light) ── */}
        {mounted && (
          <Particles color={`${ambientColor}40`} />
        )}

        {/* ── Orb Stage ── */}
        <div style={{
          position:"relative",
          width:  orbR * 2 + 180,
          height: orbR * 2 + 200,
          display:"flex", alignItems:"center", justifyContent:"center",
          marginTop: vh > 700 ? -50 : -30,
          flexShrink:0,
        }}>
          {/* Nodes */}
          {NODES.map((node, i) => {
            const locked  = !node.forAll && !isTalent;
            const dimmed  = activeNode !== null && activeNode.key !== node.key;
            const active  = activeNode?.key === node.key;
            const SIZE    = 62; // konstant — kein Sprung bei active
            // Position: direkt via style, nicht via CSS-Variablen
            const {x,y}  = polar(node.angle, orbR);
            return (
              <NodeBtn
                key={node.key}
                node={node}
                idx={i}
                active={active}
                dimmed={dimmed}
                locked={locked}
                isTransitioning={isTransitioning}
                onTap={handleNodeTap}
                // Position direkt als style übergeben
                posLeft={x - SIZE/2}
                posTop={y - SIZE/2}
              />
            );
          })}

          {/* Zentraler Logo-Orb */}
          <div
            className="orb-tap"
            onClick={handleOrbTap}
            style={{
              position:"relative", zIndex:10,
              animation:"orbLogoIn 0.55s cubic-bezier(0.34,1.45,0.64,1) 0.05s both",
            }}
          >
            <LogoOrb size={100} activeColor={activeNode?.color || null} />
          </div>
        </div>

        {/* ── Node Hint Bar ── */}
        {activeNode && (
          <NodeHint node={activeNode} onOpen={handleHintOpen} />
        )}

        {/* ── Idle prompt ── */}
        {!activeNode && mounted && (
          <div style={{
            position:"absolute",
            bottom:"calc(max(32px,env(safe-area-inset-bottom,32px)) + 12px)",
            left:0, right:0, textAlign:"center",
            pointerEvents:"none",
            animation:"mantIn 0.6s 0.9s both",
          }}>
            <div style={{ fontSize:11, color:T.ink4, letterSpacing:0.4 }}>
              Tippe einen Bereich an
            </div>
          </div>
        )}

        {/* ── Close ── */}
        <button
          className="orb-tap"
          onClick={onClose}
          aria-label="Schließen"
          style={{
            position:"absolute",
            bottom:"max(28px,env(safe-area-inset-bottom,28px))",
            left:"50%", transform:"translateX(-50%)",
            width:44, height:44, borderRadius:"50%",
            background:"rgba(255,255,255,0.80)",
            backdropFilter:"blur(12px)",
            WebkitBackdropFilter:"blur(12px)",
            border:"1.5px solid rgba(0,0,0,0.08)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:T.ink3,
            boxShadow:"0 4px 14px rgba(0,0,0,0.07)",
            animation:"mantIn 0.6s 0.50s both",
          }}
        >✕</button>

        {/* ── Mantra ── */}
        <div style={{
          position:"absolute",
          bottom:"max(8px,env(safe-area-inset-bottom,8px))",
          left:0, right:0, textAlign:"center",
          pointerEvents:"none",
          animation:"mantIn 0.8s 0.70s both",
        }}>
          <div style={{ fontSize:10, color:T.ink4, letterSpacing:0.5 }}>
            ✦  Hier beginnt deine Wirkung  ✦
          </div>
        </div>
      </div>

      {/* ── ImpactDetail ── */}
      {impactOpen && (
        <ImpactDetail onAction={handleAction} onClose={() => setImpactOpen(false)} />
      )}

      {/* ── DetailCard ── */}
      {detailNode && !detailNode.isImpact && (
        <DetailCard
          node={detailNode}
          isTalent={isTalent}
          onAction={handleAction}
          onClose={() => setDetailNode(null)}
        />
      )}
    </>
  );
}
