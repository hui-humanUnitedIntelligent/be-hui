// HuiPlusSheet.jsx — HUI Orb Experience v5 — IMMERSIVE
// Der Orb ist KEINE Liste. Kein Dropdown. Keine Card.
// Er ist ein eigener kreativer Raum — eine Betriebssystem-Ebene.
//
// ARCHITEKTUR:
//   - Fullscreen fixed (inset:0, zIndex:9000) — über ALLEM
//   - Orb-Stage: 100vw x 100vh — die gesamte Fläche
//   - Nodes: SVG-Polarkoordinaten, absolut positioniert
//   - Blur: CSS-backdrop-filter auf dem Overlay selbst
//   - BottomNav-Pill: via orbActive-Prop ausgeblendet (Home.jsx)
//
// Props: { onSelect, onClose, isTalent, isTrusted }
// onSelect(type) → "story"|"werk"|"experience"|"impact"|"connect"|"membership"

import React, {
  useState, useEffect, useCallback, useMemo, useRef
} from "react";

/* ─────────────────────────────────────────────────
   TOKENS
───────────────────────────────────────────────── */
const T = {
  teal:   "#20D3C2", tealD:"#16BFB0",
  coral:  "#FF8A7A", coralD:"#E8604A",
  blue:   "#60A8FA", blueD:"#4A8AE0",
  violet: "#B08AFA", violetD:"#9060E0",
  gold:   "#F6C768", goldD:"#D4A040",
  bg:     "rgba(5,12,10,0.92)",
  glass:  "rgba(255,255,255,0.09)",
  glassB: "rgba(255,255,255,0.18)",
  white:  "#FFFFFF",
  w80:    "rgba(255,255,255,0.80)",
  w50:    "rgba(255,255,255,0.50)",
  w25:    "rgba(255,255,255,0.25)",
  w12:    "rgba(255,255,255,0.12)",
  w06:    "rgba(255,255,255,0.06)",
};

/* ─────────────────────────────────────────────────
   CSS — alle Animationen
───────────────────────────────────────────────── */
const CSS = `
  /* ── Overlay ── */
  @keyframes orbOverlayIn {
    from { opacity:0; }
    to   { opacity:1; }
  }

  /* ── Zentral-Orb ── */
  @keyframes orbLogoIn {
    0%   { opacity:0; transform:scale(0.2) rotate(-20deg); }
    70%  { opacity:1; transform:scale(1.08) rotate(3deg); }
    100% { transform:scale(1) rotate(0deg); }
  }
  @keyframes orbBreath {
    0%,100% { box-shadow:
      0 0 0 0   rgba(32,211,194,0),
      0 0 60px  rgba(32,211,194,0.35),
      0 0 120px rgba(32,211,194,0.12); }
    50% { box-shadow:
      0 0 0 18px rgba(32,211,194,0.06),
      0 0 80px  rgba(32,211,194,0.55),
      0 0 160px rgba(32,211,194,0.18); }
  }
  @keyframes orbBreathCoral {
    0%,100% { box-shadow:
      0 0 0 0   rgba(255,138,122,0),
      0 0 60px  rgba(255,138,122,0.35),
      0 0 120px rgba(255,138,122,0.12); }
    50% { box-shadow:
      0 0 0 18px rgba(255,138,122,0.06),
      0 0 80px  rgba(255,138,122,0.55),
      0 0 160px rgba(255,138,122,0.18); }
  }
  @keyframes ringPulse {
    0%,100% { transform:scale(1);   opacity:0.22; }
    50%     { transform:scale(1.16);opacity:0.08; }
  }
  @keyframes ringPulse2 {
    0%,100% { transform:scale(1);   opacity:0.14; }
    50%     { transform:scale(1.22);opacity:0.05; }
  }

  /* ── Nodes ── */
  @keyframes nodeIn {
    0%   { opacity:0; transform:translate(var(--nx0),var(--ny0)) scale(0.2); }
    65%  { opacity:1; transform:translate(var(--nx),var(--ny))   scale(1.06); }
    100% {            transform:translate(var(--nx),var(--ny))   scale(1); }
  }
  @keyframes floatA { 0%,100%{transform:translate(var(--nx),calc(var(--ny) - 0px))} 50%{transform:translate(var(--nx),calc(var(--ny) - 10px))} }
  @keyframes floatB { 0%,100%{transform:translate(var(--nx),calc(var(--ny) + 5px))} 50%{transform:translate(var(--nx),calc(var(--ny) - 7px))} }
  @keyframes floatC { 0%,100%{transform:translate(var(--nx),calc(var(--ny) - 4px))} 50%{transform:translate(var(--nx),calc(var(--ny) + 9px))} }
  @keyframes floatD { 0%,100%{transform:translate(var(--nx),calc(var(--ny) + 7px))} 50%{transform:translate(var(--nx),calc(var(--ny) - 5px))} }
  @keyframes floatE { 0%,100%{transform:translate(var(--nx),calc(var(--ny) - 6px))} 50%{transform:translate(var(--nx),calc(var(--ny) + 8px))} }

  /* ── Partikel ── */
  @keyframes particleLife {
    0%   { opacity:0; transform:translate(0,0) scale(0); }
    20%  { opacity:0.7; }
    80%  { opacity:0.3; }
    100% { opacity:0; transform:translate(var(--pdx),var(--pdy)) scale(0); }
  }

  /* ── Detail Card ── */
  @keyframes sheetUp {
    from { opacity:0; transform:translateY(56px) scale(0.96); }
    to   { opacity:1; transform:translateY(0)    scale(1); }
  }
  @keyframes impactIn {
    from { opacity:0; transform:scale(0.92); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes impactGlow {
    0%,100% { opacity:0.12; transform:scale(1); }
    50%     { opacity:0.28; transform:scale(1.08); }
  }

  /* ── Ambient ── */
  @keyframes ambientShift {
    0%,100% { opacity:0.6; }
    50%     { opacity:1; }
  }

  /* ── Utility ── */
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes mantIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .orb-tap {
    -webkit-tap-highlight-color:transparent;
    cursor:pointer;
    transition:opacity 0.18s ease;
  }
  .orb-tap:active { opacity:0.75; }
  .orb-no-scroll::-webkit-scrollbar { display:none; }
  .orb-no-scroll { -ms-overflow-style:none; scrollbar-width:none; }
`;

/* ─────────────────────────────────────────────────
   NODE DATEN
   angle: Grad (0=rechts, -90=oben, 90=unten)
   radius: px vom Orb-Zentrum
───────────────────────────────────────────────── */
const NODES = [
  {
    key:"teilen",     label:"Teilen",            icon:"🌿",
    color:T.teal,     dark:T.tealD,
    glow:"rgba(32,211,194,",
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
    glow:"rgba(255,138,122,",
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
    glow:"rgba(96,168,250,",
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
    glow:"rgba(255,138,122,",
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
    glow:"rgba(176,138,250,",
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

/* ─────────────────────────────────────────────────
   HELPER: Polarkoordinaten → px
───────────────────────────────────────────────── */
function polar(angleDeg, r) {
  const rad = angleDeg * Math.PI / 180;
  return { x: Math.round(Math.cos(rad) * r), y: Math.round(Math.sin(rad) * r) };
}

/* ─────────────────────────────────────────────────
   PARTICLES
───────────────────────────────────────────────── */
function Particles({ color }) {
  const pts = useMemo(() => Array.from({length:18}, (_, i) => {
    const a = (i / 18) * 2 * Math.PI;
    const r = 90 + (i % 3) * 40;
    return {
      id:i,
      x: Math.cos(a) * r,
      y: Math.sin(a) * r,
      dx: (Math.random()-0.5)*120,
      dy: (Math.random()-0.5)*120,
      s: 1.5 + Math.random()*2.5,
      delay: i * 0.18,
      dur: 2.8 + Math.random() * 1.8,
    };
  }), []);

  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:1 }}>
      {pts.map(p => (
        <div key={p.id} style={{
          position:"absolute",
          left:`calc(50% + ${p.x}px)`,
          top:`calc(50% + ${p.y}px)`,
          width:p.s, height:p.s, borderRadius:"50%",
          background:color || T.teal,
          "--pdx": `${p.dx}px`,
          "--pdy": `${p.dy}px`,
          animation:`particleLife ${p.dur}s ease-out ${p.delay}s infinite`,
        }}/>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   HUI LOGO ORB (zentral, 100px)
───────────────────────────────────────────────── */
function LogoOrb({ size=100, activeColor=null }) {
  const isCoralMode = activeColor === T.coral;
  return (
    <div style={{ position:"relative", width:size, height:size,
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      {/* Ring 1 */}
      <div style={{
        position:"absolute", inset:-20, borderRadius:"50%",
        border:`1.5px solid ${activeColor || T.teal}`,
        opacity:0.20,
        animation:"ringPulse 3.5s ease-in-out infinite",
      }}/>
      {/* Ring 2 */}
      <div style={{
        position:"absolute", inset:-40, borderRadius:"50%",
        border:`1px solid ${activeColor || T.teal}`,
        opacity:0.10,
        animation:"ringPulse2 4.5s ease-in-out 0.8s infinite",
      }}/>
      {/* Ring 3 — outer */}
      <div style={{
        position:"absolute", inset:-62, borderRadius:"50%",
        border:`1px solid ${activeColor || T.teal}`,
        opacity:0.05,
        animation:"ringPulse2 5.5s ease-in-out 1.6s infinite",
      }}/>

      {/* Logo Container */}
      <div style={{
        width:size, height:size, borderRadius:"50%", overflow:"hidden",
        animation: isCoralMode
          ? "orbBreathCoral 4s ease-in-out infinite"
          : "orbBreath 4s ease-in-out infinite",
        background: "linear-gradient(135deg,#0d3830 0%,#1a6050 50%,#0d3830 100%)",
        boxShadow:`0 0 0 2px ${(activeColor||T.teal)}55`,
        transition:"box-shadow 0.7s ease",
        flexShrink:0,
      }}>
        <img src="/hui-logo.jpg" alt="HUI" loading="eager"
          style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
          onError={e => {
            e.target.style.display="none";
            const fb = document.createElement("div");
            fb.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#20D3C2,#FF8A7A)";
            const sp = document.createElement("span");
            sp.style.cssText = "font-size:40px;font-weight:900;color:#fff;font-family:system-ui";
            sp.textContent = "H";
            fb.appendChild(sp);
            e.target.parentNode.replaceChild(fb, e.target);
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   NODE BUTTON
   Positioniert über CSS-Variablen (--nx, --ny, --nx0, --ny0)
───────────────────────────────────────────────── */
function NodeBtn({ node, idx, active, dimmed, locked, onTap, radius }) {
  const {x,y} = polar(node.angle, radius);

  // Startpunkt der nodeIn-Animation (vom Orb-Zentrum)
  const {x:x0,y:y0} = polar(node.angle, 20);

  const SIZE    = active ? 72 : 62;
  const FONT    = active ? 30 : 26;
  const glowVal = `${node.glow}${active ? "0.55" : "0.18"})`;

  return (
    <div
      className="orb-tap"
      onClick={() => !locked && onTap(node)}
      style={{
        position:"absolute",
        left:"50%", top:"50%",
        // Base translate via CSS vars → float animation overrides
        "--nx":  `${x - SIZE/2}px`,
        "--ny":  `${y - SIZE/2}px`,
        "--nx0": `${x0 - SIZE/2}px`,
        "--ny0": `${y0 - SIZE/2}px`,
        width:SIZE, height:SIZE,
        animation:[
          `nodeIn 0.60s cubic-bezier(0.34,1.40,0.64,1) ${node.delay}s both`,
          `${node.floatAnim} ${3.2+idx*0.4}s ease-in-out ${node.delay+0.7}s infinite`,
        ].join(", "),
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start",
        zIndex:5,
        cursor: locked ? "default" : "pointer",
        opacity: locked ? 0.28 : dimmed ? 0.20 : 1,
        filter:  locked ? "grayscale(0.7) blur(0.5px)" : "none",
        transition:"opacity 0.40s ease, filter 0.40s ease",
        // KEIN transform hier — animation kümmert sich
      }}
    >
      {/* Glow-Halo hinter dem Kreis */}
      <div style={{
        position:"absolute", inset:-8, borderRadius:"50%",
        background:`radial-gradient(circle, ${node.glow}${active?"0.35":"0.08"}) 0%, transparent 70%)`,
        transition:"background 0.4s ease",
        pointerEvents:"none",
      }}/>

      {/* Kreis */}
      <div style={{
        width:SIZE, height:SIZE, borderRadius:"50%", flexShrink:0,
        background: active
          ? `radial-gradient(circle at 36% 28%, ${node.color} 0%, ${node.dark} 100%)`
          : T.glass,
        backdropFilter:"blur(16px)",
        WebkitBackdropFilter:"blur(16px)",
        border:`${active ? 2 : 1.5}px solid ${active ? node.color : T.w25}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:FONT,
        boxShadow: active
          ? `0 0 0 6px ${node.glow}0.25), 0 12px 32px ${node.glow}0.45), inset 0 1px 0 rgba(255,255,255,0.30)`
          : `0 6px 22px rgba(0,0,0,0.35), inset 0 1px 0 ${T.w12}`,
        transition:"all 0.40s cubic-bezier(0.34,1.20,0.64,1)",
        position:"relative",
      }}>
        {node.icon}
        {/* Top-left refraction */}
        <div style={{
          position:"absolute", top:9, left:10, width:22, height:10,
          borderRadius:"50%",
          background:"radial-gradient(ellipse, rgba(255,255,255,0.35) 0%, transparent 100%)",
          filter:"blur(2px)", transform:"rotate(-22deg)",
          pointerEvents:"none",
        }}/>
      </div>

      {/* Label */}
      <div style={{
        marginTop:7, fontSize:10.5, fontWeight:700, lineHeight:1.25,
        color: active ? node.color : T.w80,
        textAlign:"center",
        textShadow:"0 1px 6px rgba(0,0,0,0.70)",
        transition:"color 0.35s ease",
        whiteSpace:"nowrap",
        letterSpacing:0.2,
      }}>
        {node.label}
        {locked && (
          <div style={{ fontSize:9, color:T.w50, fontWeight:500, marginTop:1 }}>
            Talent
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   ACTIVE NODE HINT BAR (erscheint wenn Node aktiv)
───────────────────────────────────────────────── */
function NodeHint({ node, onOpen }) {
  return (
    <div style={{
      position:"fixed",
      bottom:"calc(max(32px,env(safe-area-inset-bottom,32px)) + 8px)",
      left:"50%", transform:"translateX(-50%)",
      zIndex:9010,
      background:"rgba(10,24,20,0.92)",
      backdropFilter:"blur(18px)",
      WebkitBackdropFilter:"blur(18px)",
      borderRadius:22,
      padding:"13px 20px",
      border:`1px solid ${node.color}40`,
      boxShadow:`0 8px 36px rgba(0,0,0,0.38), 0 0 0 1px ${node.glow}0.20)`,
      display:"flex", alignItems:"center", gap:12,
      animation:"sheetUp 0.30s cubic-bezier(0.32,0.72,0,1) both",
      whiteSpace:"nowrap",
    }}>
      <span style={{ fontSize:18 }}>{node.icon}</span>
      <div>
        <div style={{ fontSize:13.5, fontWeight:800, color:T.white,
          letterSpacing:-0.3 }}>{node.label}</div>
        <div style={{ fontSize:11, color:T.w50, marginTop:1 }}>{node.desc}</div>
      </div>
      <button className="orb-tap" onClick={onOpen} style={{
        background:`linear-gradient(135deg, ${node.color} 0%, ${node.dark} 100%)`,
        border:"none", borderRadius:14, padding:"8px 16px",
        fontSize:13, fontWeight:700, color:T.white, cursor:"pointer",
        boxShadow:`0 4px 14px ${node.glow}0.45)`,
        marginLeft:6,
      }}>
        Öffnen →
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   IMPACT DETAIL (zeremoniell)
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
      {/* Dark coral atmosphere */}
      <div style={{
        position:"absolute", inset:0,
        background:"rgba(10,4,4,0.82)",
        backdropFilter:"blur(14px)",
        WebkitBackdropFilter:"blur(14px)",
      }}/>
      {/* Coral glow center */}
      <div style={{
        position:"absolute",
        left:"50%", top:"40%",
        transform:"translate(-50%,-50%)",
        width:300, height:300,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(255,138,122,0.22) 0%, transparent 70%)",
        animation:"impactGlow 4s ease-in-out infinite",
        pointerEvents:"none",
      }}/>

      {/* Sheet */}
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%", maxWidth:480,
        background:"rgba(16,8,8,0.96)",
        borderRadius:"32px 32px 0 0",
        padding:"0 0 max(32px,env(safe-area-inset-bottom,32px))",
        border:"1px solid rgba(255,138,122,0.18)",
        borderBottom:"none",
        boxShadow:"0 -20px 72px rgba(255,100,80,0.18), 0 -4px 20px rgba(0,0,0,0.50)",
        animation:"sheetUp 0.45s cubic-bezier(0.32,0.72,0,1) both",
        overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{
          padding:"26px 24px 18px",
          borderBottom:"1px solid rgba(255,138,122,0.10)",
          textAlign:"center", position:"relative",
        }}>
          <button className="orb-tap" onClick={onClose} style={{
            position:"absolute", top:18, right:20,
            width:30, height:30, borderRadius:"50%",
            background:"rgba(255,255,255,0.08)", border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, color:T.w50,
          }}>✕</button>
          <div style={{
            width:64, height:64, borderRadius:"50%",
            background:"linear-gradient(135deg,#FF8A7A,#D04030)",
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            fontSize:30, marginBottom:12,
            boxShadow:"0 8px 28px rgba(255,100,80,0.50)",
          }}>❤️</div>
          <div style={{ fontSize:20, fontWeight:900, color:T.white,
            letterSpacing:-0.5, marginBottom:6 }}>Wirkung starten</div>
          <div style={{ fontSize:12.5, color:"rgba(255,200,190,0.65)",
            lineHeight:1.6, padding:"0 24px" }}>
            Reiche eine Vision ein, die Menschen und die Welt bewegt.
          </div>
        </div>

        {/* HUI Hinweis */}
        <div style={{ margin:"14px 22px 0",
          background:"rgba(255,138,122,0.10)",
          borderRadius:14, padding:"10px 14px",
          border:"1px solid rgba(255,138,122,0.18)",
          display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:16 }}>🌿</span>
          <div style={{ fontSize:11.5, color:"rgba(255,200,190,0.80)", lineHeight:1.5 }}>
            Einreichungen werden vom HUI Team geprüft. Creator mit echter Wirkung erhalten schneller Zugang zum Impact Pool.
          </div>
        </div>

        {/* 4 Steps */}
        <div style={{ padding:"14px 22px 0" }}>
          {IMPACT_STEPS.map((s,i) => (
            <div key={i} style={{ display:"flex", gap:12, marginBottom:12 }}>
              <div style={{
                width:34, height:34, borderRadius:11, flexShrink:0,
                background:"rgba(255,138,122,0.12)",
                border:"1px solid rgba(255,138,122,0.20)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:15,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.88)" }}>
                  {s.title}</div>
                <div style={{ fontSize:11.5, color:T.w50, lineHeight:1.45, marginTop:1 }}>
                  {s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ padding:"14px 22px 0", display:"flex", flexDirection:"column", gap:10 }}>
          <button className="orb-tap" onClick={() => onAction("idee")} style={{
            width:"100%", height:52, borderRadius:18, border:"none",
            background:"linear-gradient(135deg,#FF8A7A 0%,#D04030 100%)",
            color:T.white, fontSize:15, fontWeight:800, cursor:"pointer",
            boxShadow:"0 8px 28px rgba(255,100,80,0.45)",
          }}>
            Vision einreichen →
          </button>
          <button className="orb-tap" onClick={() => onAction("wirkraum")} style={{
            width:"100%", height:44, borderRadius:14, border:"none",
            background:"rgba(255,255,255,0.06)",
            color:T.w50, fontSize:13, fontWeight:600, cursor:"pointer",
          }}>
            Wirkungsraum entdecken
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   STANDARD DETAIL CARD
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
        background:"rgba(8,18,14,0.75)",
        backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
      }}/>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%", maxWidth:460,
        background:"rgba(255,255,255,0.98)",
        borderRadius:"30px 30px 0 0",
        padding:"0 0 max(30px,env(safe-area-inset-bottom,30px))",
        boxShadow:"0 -12px 56px rgba(0,0,0,0.25)",
        animation:"sheetUp 0.40s cubic-bezier(0.32,0.72,0,1) both",
        overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{
          height:120, position:"relative",
          background:`linear-gradient(135deg, ${node.color}18 0%, transparent 100%)`,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:7,
        }}>
          <div style={{
            position:"absolute", inset:0,
            background:`radial-gradient(circle at 50% 90%, ${node.glow}0.20) 0%, transparent 60%)`,
          }}/>
          <button className="orb-tap" onClick={onClose} style={{
            position:"absolute", top:14, right:18,
            width:28, height:28, borderRadius:"50%",
            background:"rgba(0,0,0,0.07)", border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, color:"rgba(0,0,0,0.40)",
          }}>✕</button>
          <div style={{
            width:52, height:52, borderRadius:"50%",
            background:`linear-gradient(135deg, ${node.color}, ${node.dark})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:26, position:"relative", zIndex:2,
            boxShadow:`0 6px 20px ${node.glow}0.45)`,
          }}>{node.icon}</div>
          <div style={{ fontSize:17, fontWeight:900, color:"#1A1A1A",
            letterSpacing:-0.4, zIndex:2 }}>{node.label}</div>
          <div style={{ fontSize:12, color:"rgba(0,0,0,0.50)", zIndex:2,
            textAlign:"center", padding:"0 28px", lineHeight:1.5 }}>
            {node.desc}
          </div>
        </div>

        {/* Locked Badge */}
        {locked && (
          <div style={{
            margin:"14px 20px 0",
            background:"rgba(246,199,104,0.14)",
            borderRadius:14, padding:"10px 14px",
            border:"1px solid rgba(246,199,104,0.35)",
            display:"flex", gap:8, alignItems:"center",
          }}>
            <span style={{ fontSize:18 }}>🌱</span>
            <div style={{ fontSize:12, color:"#8A6A00", lineHeight:1.5 }}>
              Werde HUI Wirker, um diesen Bereich zu nutzen.
            </div>
          </div>
        )}

        {/* Sub-Items */}
        <div style={{ padding:"14px 20px 0" }}>
          {node.sub.map((item,i) => (
            <button key={item.key} className="orb-tap"
              onClick={() => !locked && onAction(item.key, node)}
              disabled={locked}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:13,
                padding:"11px 12px", borderRadius:15, border:"none",
                background:i%2===0?"rgba(0,0,0,0.025)":"transparent",
                cursor:locked?"default":"pointer",
                opacity:locked?0.45:1, marginBottom:3,
              }}>
              <div style={{
                width:36, height:36, borderRadius:11, flexShrink:0,
                background:`${node.color}18`,
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18,
              }}>{item.icon}</div>
              <span style={{ fontSize:13.5, fontWeight:600,
                color:"#1A1A1A", textAlign:"left" }}>{item.label}</span>
              <span style={{ marginLeft:"auto", fontSize:14,
                color:"rgba(0,0,0,0.20)" }}>›</span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding:"16px 20px 0" }}>
          {locked ? (
            <button className="orb-tap" onClick={() => onAction("membership", node)} style={{
              width:"100%", height:52, borderRadius:18, border:"none",
              background:`linear-gradient(135deg, ${T.teal}, ${T.tealD})`,
              color:T.white, fontSize:14.5, fontWeight:800, cursor:"pointer",
              boxShadow:"0 6px 22px rgba(32,211,194,0.40)",
            }}>Wirker werden →</button>
          ) : (
            <button className="orb-tap" onClick={() => onAction(node.cta, node)} style={{
              width:"100%", height:52, borderRadius:18, border:"none",
              background:`linear-gradient(135deg, ${node.color}, ${node.dark})`,
              color:T.white, fontSize:14.5, fontWeight:800, cursor:"pointer",
              boxShadow:`0 6px 22px ${node.glow}0.45)`,
            }}>{node.ctaLabel} →</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────── */
export default function HuiPlusSheet({
  onSelect, onClose,
  isTalent = false,
  isTrusted = false,
}) {
  // ── State (alle top-level, stabile Reihenfolge) ──────────────────
  const [mounted,    setMounted]    = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [detailNode, setDetailNode] = useState(null);
  const [impactOpen, setImpactOpen] = useState(false);
  const [vw,         setVw]         = useState(window.innerWidth);
  const [vh,         setVh]         = useState(window.innerHeight);

  // ── Mount ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 16);
    return () => clearTimeout(t);
  }, []);

  // ── Resize ───────────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── Escape ───────────────────────────────────────────────────────
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

  // ── Node Tap ─────────────────────────────────────────────────────
  // ── Action ───────────────────────────────────────────────────────
  const handleAction = useCallback((type) => {
    console.log("[ORB ACTION] type:", type);
    setDetailNode(null);
    setActiveNode(null);
    setImpactOpen(false);
    onSelect?.(type);
    onClose?.();
  }, [onSelect, onClose]);

  const handleNodeTap = useCallback(node => {
    if (activeNode?.key === node.key) {
      // Zweiter Tap: Aktion direkt auslösen
      if (node.isImpact) {
        setImpactOpen(true);
        setActiveNode(null);
      } else if (node.cta === "story" || node.cta === "teilen" || node.key === "teilen") {
        // Teilen → direkt TeilenFlow öffnen, kein DetailCard
        console.log("[ORB TEILEN DIRECT] → story");
        setActiveNode(null);
        handleAction("story");
      } else if (node.cta === "connect") {
        console.log("[ORB VERBINDUNG DIRECT] → connect");
        setActiveNode(null);
        handleAction("connect");
      } else {
        setDetailNode(node);
        setActiveNode(null);
      }
    } else {
      // Erster Tap: Node aktivieren
      setActiveNode(node);
    }
  }, [activeNode, handleAction]);

  // ── Open from Hint Bar ───────────────────────────────────────────
  const handleHintOpen = useCallback(() => {
    if (!activeNode) return;
    if (activeNode.isImpact) {
      setImpactOpen(true);
      setActiveNode(null);
    } else if (activeNode.cta === "story" || activeNode.cta === "teilen" || activeNode.key === "teilen") {
      console.log("[ORB HINT TEILEN] → story");
      setActiveNode(null);
      handleAction("story");
    } else if (activeNode.cta === "connect") {
      setActiveNode(null);
      handleAction("connect");
    } else {
      setDetailNode(activeNode);
      setActiveNode(null);
    }
  }, [activeNode, handleAction]);

  // ── Orb tap: wenn Node aktiv → öffnen ───────────────────────────
  const handleOrbTap = useCallback(() => {
    if (!activeNode) return;
    if (activeNode.isImpact) {
      setImpactOpen(true);
      setActiveNode(null);
    } else if (activeNode.cta === "story" || activeNode.cta === "teilen" || activeNode.key === "teilen") {
      console.log("[ORB TAP TEILEN] → story");
      setActiveNode(null);
      handleAction("story");
    } else if (activeNode.cta === "connect") {
      setActiveNode(null);
      handleAction("connect");
    } else {
      setDetailNode(activeNode);
      setActiveNode(null);
    }
  }, [activeNode, handleAction]);



  // ── Node Radius: responsiv ────────────────────────────────────────
  const R = Math.min(vw, vh) * 0.30;          // 30% der kleineren Seite
  const orbR = Math.min(Math.max(R, 100), 155); // clamp 100–155px

  // ── Aktive Farbe für Ambient ──────────────────────────────────────
  const ambientColor = activeNode?.color || T.teal;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* ═══════════════════════════════════════════════════════════
          FULLSCREEN IMMERSIVE OVERLAY
          zIndex:9000 — über BottomNav (z:100), über allem
      ═══════════════════════════════════════════════════════════ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="HUI Orb — Dein kreatives Zentrum"
        style={{
          position:"fixed", inset:0,
          zIndex:9000,
          // Die GESAMTE App tritt in den Hintergrund
          background:T.bg,
          backdropFilter:"blur(28px) brightness(0.55) saturate(1.4)",
          WebkitBackdropFilter:"blur(28px) brightness(0.55) saturate(1.4)",
          opacity: mounted ? 1 : 0,
          transition:"opacity 0.35s ease",
          overflow:"hidden",
          // Orb Stage = gesamte Fläche
          display:"flex", alignItems:"center", justifyContent:"center",
        }}
        onClick={e => {
          if (e.target !== e.currentTarget) return;
          if (activeNode) { setActiveNode(null); return; }
          onClose?.();
        }}
      >
        {/* ── Vignette (Fokus-Effekt) ── */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"radial-gradient(ellipse at 50% 44%, transparent 20%, rgba(0,0,0,0.60) 100%)",
        }}/>

        {/* ── Ambient Glow (Farbe folgt aktivem Node) ── */}
        <div style={{
          position:"absolute",
          left:"50%", top:"44%",
          transform:"translate(-50%,-50%)",
          width:Math.max(vw,vh) * 0.8,
          height:Math.max(vw,vh) * 0.8,
          borderRadius:"50%",
          background:`radial-gradient(circle, ${ambientColor}10 0%, transparent 60%)`,
          transition:"background 0.65s ease",
          pointerEvents:"none",
          animation:"ambientShift 6s ease-in-out infinite",
        }}/>

        {/* ── Header Titel ── */}
        <div style={{
          position:"absolute",
          top:"max(44px,env(safe-area-inset-top,44px))",
          left:0, right:0,
          textAlign:"center",
          pointerEvents:"none",
          animation:"mantIn 0.55s 0.15s both",
        }}>
          <div style={{ fontSize:20, fontWeight:900, color:T.white,
            letterSpacing:-0.5, textShadow:"0 2px 12px rgba(0,0,0,0.50)" }}>
            Der HUI Orb<span style={{ color:T.teal }}>·</span>
          </div>
          <div style={{ fontSize:11.5, color:T.w50, marginTop:3, letterSpacing:0.2 }}>
            Dein Zugang zu allem, was du erschaffen möchtest.
          </div>
        </div>

        {/* ── Particles ── */}
        {mounted && <Particles color={`${ambientColor}80`} />}

        {/* ══════════════════════════════════════════════════════
            ORB STAGE — zentriert, responsiv
        ══════════════════════════════════════════════════════ */}
        <div style={{
          position:"relative",
          // Stage-Größe: 2*R + Node-Durchmesser + Label + Padding
          width:  orbR * 2 + 180,
          height: orbR * 2 + 200,
          display:"flex", alignItems:"center", justifyContent:"center",
          // Leicht nach oben versetzt (Platz für BottomNav-Freiraum)
          marginTop: vh > 700 ? -50 : -30,
          flexShrink:0,
        }}>
          {/* ── Nodes ── */}
          {NODES.map((node, i) => {
            const locked = !node.forAll && !isTalent;
            const dimmed = activeNode !== null && activeNode.key !== node.key;
            const {x,y} = polar(node.angle, orbR);
            const {x:x0,y:y0} = polar(node.angle, 18);
            return (
              <NodeBtn
                key={node.key}
                node={node}
                idx={i}
                active={activeNode?.key === node.key}
                dimmed={dimmed}
                locked={locked}
                onTap={handleNodeTap}
                radius={orbR}
              />
            );
          })}

          {/* ── Zentraler Logo-Orb ── */}
          <div
            className="orb-tap"
            onClick={handleOrbTap}
            style={{
              position:"relative", zIndex:10,
              animation:"orbLogoIn 0.60s cubic-bezier(0.34,1.50,0.64,1) 0.05s both",
            }}
          >
            <LogoOrb size={100} activeColor={activeNode?.color || null} />
          </div>
        </div>

        {/* ── Node Hint Bar ── */}
        {activeNode && (
          <NodeHint node={activeNode} onOpen={handleHintOpen} />
        )}

        {/* ── Kein aktiver Node: Aufforderung ── */}
        {!activeNode && mounted && (
          <div style={{
            position:"absolute",
            bottom:"calc(max(32px,env(safe-area-inset-bottom,32px)) + 12px)",
            left:0, right:0, textAlign:"center",
            pointerEvents:"none",
            animation:"mantIn 0.6s 0.9s both",
          }}>
            <div style={{ fontSize:11, color:T.w25, letterSpacing:0.5 }}>
              Tippe einen Bereich an
            </div>
          </div>
        )}

        {/* ── Close Button ── */}
        <button
          className="orb-tap"
          onClick={onClose}
          aria-label="Schließen"
          style={{
            position:"absolute",
            bottom:"max(28px,env(safe-area-inset-bottom,28px))",
            left:"50%", transform:"translateX(-50%)",
            width:44, height:44, borderRadius:"50%",
            background:T.w06,
            backdropFilter:"blur(8px)",
            border:`1.5px solid ${T.w12}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:T.w50,
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
          <div style={{ fontSize:10, color:T.w25, letterSpacing:0.5 }}>
            ✦  Hier beginnt deine Wirkung  ✦
          </div>
        </div>
      </div>

      {/* ── Impact Detail (eigene Ebene, über Overlay) ── */}
      {impactOpen && (
        <ImpactDetail onAction={handleAction} onClose={() => setImpactOpen(false)} />
      )}

      {/* ── Standard Detail Card ── */}
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
