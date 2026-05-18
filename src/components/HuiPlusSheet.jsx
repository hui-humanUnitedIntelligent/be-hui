// HuiPlusSheet.jsx — HUI Orb Experience v3
// Screenshot-exact: Fullscreen Orb-Overlay, 5 Nodes radial, Detail-Cards, Info-Panel
// ERSETZE HuiPlusSheet komplett — Props: { onSelect, onClose } — rückwärtskompatibel
// KEIN Framer Motion (kein package verfügbar) — pure CSS + React State Animationen
// Logo: /hui-logo.jpg — zentrales Element

import React, { useState, useEffect, useCallback, useRef } from "react";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════ */
const C = {
  teal:      "#20D3C2",
  teal2:     "#16BFB0",
  tealGlow:  "rgba(32,211,194,0.35)",
  tealSoft:  "rgba(32,211,194,0.15)",
  coral:     "#FF8A7A",
  coralGlow: "rgba(255,138,122,0.35)",
  gold:      "#F6C768",
  blue:      "#5BA8F5",
  blueGlow:  "rgba(91,168,245,0.35)",
  violet:    "#A78BFA",
  violetGlow:"rgba(167,139,250,0.35)",
  green:     "#4CAF85",
  ink:       "#1E1E1E",
  ink2:      "#3A3A3A",
  muted:     "#8A8A8A",
  card:      "rgba(255,255,255,0.08)",
  cardSolid: "rgba(255,255,255,0.96)",
};

/* ══════════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════════ */
const CSS = `
  @keyframes orbIn    { from{opacity:0;transform:scale(0.4)} to{opacity:1;transform:scale(1)} }
  @keyframes orbFade  { from{opacity:0} to{opacity:1} }
  @keyframes nodeIn   { from{opacity:0;transform:scale(0) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes float1   { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-7px)} }
  @keyframes float2   { 0%,100%{transform:translateY(-4px)} 50%{transform:translateY(4px)} }
  @keyframes float3   { 0%,100%{transform:translateY(3px)} 50%{transform:translateY(-5px)} }
  @keyframes float4   { 0%,100%{transform:translateY(-2px)} 50%{transform:translateY(6px)} }
  @keyframes float5   { 0%,100%{transform:translateY(5px)} 50%{transform:translateY(-3px)} }
  @keyframes orbPulse { 0%,100%{box-shadow:0 0 0 0 rgba(32,211,194,0),0 0 60px rgba(32,211,194,0.3)} 50%{box-shadow:0 0 0 16px rgba(32,211,194,0.08),0 0 80px rgba(32,211,194,0.5)} }
  @keyframes ringPulse{ 0%,100%{transform:scale(1);opacity:0.35} 50%{transform:scale(1.12);opacity:0.15} }
  @keyframes cardUp   { from{opacity:0;transform:translateY(40px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes particle { 0%{transform:translate(0,0) scale(1);opacity:0.6} 100%{transform:translate(var(--px),var(--py)) scale(0);opacity:0} }
  @keyframes sparkle  { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
  @keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
  .ho-tap { -webkit-tap-highlight-color:transparent; transition:transform 0.15s ease; cursor:pointer; }
  .ho-tap:active { transform:scale(0.93); }
  .ho-scroll::-webkit-scrollbar { display:none; }
  .ho-scroll { -ms-overflow-style:none; scrollbar-width:none; }
`;

/* ══════════════════════════════════════════════════════════════
   5 NODE CONFIGS
══════════════════════════════════════════════════════════════ */
const NODES = [
  {
    key:"teilen", label:"Teilen", icon:"🌿",
    color:C.teal, glow:C.tealGlow,
    desc:"Zeige etwas, das dich bewegt.",
    angle:-90,  // oben
    float:"float1",
    sub:[
      { key:"foto",       icon:"📷", label:"Foto / Video"       },
      { key:"gedanke",    icon:"💭", label:"Gedanke"            },
      { key:"inspiration",icon:"✨", label:"Inspiration"        },
      { key:"musik",      icon:"🎵", label:"Musik"              },
      { key:"geschichte", icon:"📖", label:"Geschichte"         },
    ],
    cta:"story",
  },
  {
    key:"werk", label:"Werk erschaffen", icon:"🎨",
    color:C.coral, glow:C.coralGlow,
    desc:"Biete deine Kunst, dein Handwerk oder Design an.",
    angle:-18,  // oben rechts
    float:"float2",
    sub:[
      { key:"kunstwerk",icon:"🖼",  label:"Kunstwerk"           },
      { key:"handwerk", icon:"🏺",  label:"Handwerk"            },
      { key:"design",   icon:"✏️",  label:"Design"              },
      { key:"digital",  icon:"💻",  label:"Digitale Produkte"   },
      { key:"sammler",  icon:"💎",  label:"Sammlerstücke"       },
    ],
    cta:"werk",
  },
  {
    key:"erlebnis", label:"Erlebnis öffnen", icon:"📅",
    color:C.blue, glow:C.blueGlow,
    desc:"Lade Menschen in einen besonderen Moment ein.",
    angle:54,   // rechts unten
    float:"float3",
    sub:[
      { key:"workshop", icon:"🔨", label:"Workshop"             },
      { key:"retreat",  icon:"🌲", label:"Retreat"              },
      { key:"event",    icon:"🎉", label:"Event"                },
      { key:"session",  icon:"🎯", label:"Session"              },
      { key:"erlebnis_s",icon:"🌟",label:"Erlebnis"             },
    ],
    cta:"experience",
  },
  {
    key:"wirkung", label:"Wirkung starten", icon:"❤️",
    color:C.coral, glow:C.coralGlow,
    desc:"Starte ein Projekt und bewege gemeinsam etwas.",
    angle:126,  // links unten
    float:"float4",
    isImpact:true,
    impactNote:"Dein Projekt wird zuerst vom HUI Team geprüft, bevor es im Impact Pool erscheint.",
    sub:[
      { key:"idee",      icon:"💡", label:"Projekt einreichen"  },
      { key:"wirkraum",  icon:"🌍", label:"Wirkungsraum entdecken" },
      { key:"einreich",  icon:"📋", label:"Meine Einreichungen" },
    ],
    cta:"impact",
  },
  {
    key:"verbindung", label:"Verbindung suchen", icon:"👥",
    color:C.violet, glow:C.violetGlow,
    desc:"Finde kreative Menschen und kollaboriere.",
    angle:198,  // links oben
    float:"float5",
    sub:[
      { key:"kollab",  icon:"🤝", label:"Kollaboration finden"  },
      { key:"mentor",  icon:"🎓", label:"Mentor finden"         },
      { key:"partner", icon:"🔗", label:"Projektpartner"        },
      { key:"community",icon:"🌐",label:"Community beitreten"   },
    ],
    cta:"connect",
  },
];

/* ══════════════════════════════════════════════════════════════
   IMPACT FLOW INFO
══════════════════════════════════════════════════════════════ */
const IMPACT_STEPS = [
  { icon:"💡", title:"Idee einreichen",           sub:"Teile deine Vision in unserem Wirkungsraum." },
  { icon:"🔍", title:"Prüfung durch das HUI Team", sub:"Wir prüfen, ob dein Projekt zu HUI passt." },
  { icon:"🗳",  title:"Community Entscheidung",    sub:"Wird dein Projekt angenommen, entscheidet die Community über die Unterstützung." },
  { icon:"🌱", title:"Gemeinsam Wirkung schaffen", sub:"Transparenz, Updates und echter Impact." },
];

/* ══════════════════════════════════════════════════════════════
   HUI LOGO COMPONENT (zentraler Orb)
══════════════════════════════════════════════════════════════ */
function HuiLogoOrb({ size = 90, glowing = true }) {
  return (
    <div style={{
      width:size, height:size,
      borderRadius:"50%",
      position:"relative",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {/* Äußerer Pulse-Ring */}
      {glowing && (
        <div style={{
          position:"absolute", inset:-12,
          borderRadius:"50%",
          background:"radial-gradient(circle, rgba(32,211,194,0.18) 0%, transparent 70%)",
          animation:"ringPulse 3s ease-in-out infinite",
        }}/>
      )}
      {/* Zweiter Ring */}
      {glowing && (
        <div style={{
          position:"absolute", inset:-24,
          borderRadius:"50%",
          background:"radial-gradient(circle, rgba(32,211,194,0.08) 0%, transparent 60%)",
          animation:"ringPulse 4s ease-in-out 0.5s infinite",
        }}/>
      )}
      {/* Logo Container */}
      <div style={{
        width:size, height:size, borderRadius:"50%",
        overflow:"hidden",
        boxShadow: glowing
          ? `0 0 0 2px rgba(32,211,194,0.40), 0 0 40px rgba(32,211,194,0.50), 0 8px 32px rgba(0,0,0,0.30)`
          : `0 4px 16px rgba(0,0,0,0.20)`,
        animation: glowing ? "orbPulse 4s ease-in-out infinite" : "none",
        background:"linear-gradient(135deg, #1a4a45 0%, #2d8a7a 50%, #1a4a45 100%)",
        flexShrink:0,
      }}>
        <img
          src="/hui-logo.jpg"
          alt="HUI"
          loading="eager"
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          onError={e => {
            // Fallback: SVG Logo
            e.target.style.display = "none";
            const fb = document.createElement('div');
            fb.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#20D3C2,#FF8A7A);border-radius:50%';
            const sp = document.createElement('span');
            sp.style.cssText = 'font-size:36px;font-weight:900;color:#fff;font-family:sans-serif';
            sp.textContent = 'H';
            fb.appendChild(sp);
            e.target.parentNode.replaceChild(fb, e.target);
          }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NODE BUTTON (schwebt um den Orb)
══════════════════════════════════════════════════════════════ */
function NodeButton({ node, idx, active, onSelect }) {
  const R = 130; // Radius in px
  const rad = (node.angle * Math.PI) / 180;
  const x = Math.cos(rad) * R;
  const y = Math.sin(rad) * R;

  return (
    <div
      className="ho-tap"
      onClick={() => onSelect(node)}
      style={{
        position:"absolute",
        left:"50%", top:"50%",
        transform:`translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        display:"flex", flexDirection:"column", alignItems:"center", gap:6,
        animation:`nodeIn 0.5s ${0.1 + idx*0.08}s both, ${node.float} ${3 + idx*0.4}s ease-in-out ${0.6 + idx*0.1}s infinite`,
        zIndex:3,
      }}
    >
      {/* Node Circle */}
      <div style={{
        width:56, height:56, borderRadius:"50%",
        background: active
          ? node.color
          : `rgba(255,255,255,0.12)`,
        backdropFilter:"blur(12px)",
        WebkitBackdropFilter:"blur(12px)",
        border: `2px solid ${active ? node.color : 'rgba(255,255,255,0.22)'}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:24,
        boxShadow: active
          ? `0 0 0 4px ${node.glow}, 0 8px 24px ${node.glow}`
          : `0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)`,
        transition:"all 0.3s ease",
      }}>
        {node.icon}
      </div>
      {/* Label */}
      <div style={{
        fontSize:11, fontWeight:700,
        color: active ? node.color : "rgba(255,255,255,0.85)",
        textAlign:"center", whiteSpace:"nowrap",
        textShadow:"0 1px 4px rgba(0,0,0,0.5)",
        transition:"color 0.3s ease",
        maxWidth:80,
        lineHeight:1.3,
      }}>
        {node.label}
      </div>
      {/* Sub-label */}
      {active && (
        <div style={{
          fontSize:9.5, color:`rgba(${node.color === C.teal ? '32,211,194' : node.color === C.coral ? '255,138,122' : node.color === C.blue ? '91,168,245' : node.color === C.violet ? '167,139,250' : '255,138,122'},0.90)`,
          textAlign:"center", maxWidth:90,
          textShadow:"0 1px 4px rgba(0,0,0,0.5)",
          animation:"orbFade 0.3s ease both",
        }}>
          {node.desc}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   DETAIL CARD (aufgeklappt nach Node-Tap)
══════════════════════════════════════════════════════════════ */
function DetailCard({ node, onAction, onClose }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:500,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"flex-end",
      background:"rgba(10,20,20,0.6)",
      backdropFilter:"blur(8px)",
      WebkitBackdropFilter:"blur(8px)",
      animation:"orbFade 0.2s ease both",
    }}
    onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:440,
          background:C.cardSolid,
          borderRadius:"28px 28px 0 0",
          padding:"0 0 max(28px,env(safe-area-inset-bottom,28px))",
          boxShadow:"0 -12px 48px rgba(0,0,0,0.25)",
          animation:"cardUp 0.4s cubic-bezier(0.32,0.72,0,1) both",
          overflow:"hidden",
        }}
      >
        {/* Header Bild / Color Bar */}
        <div style={{
          height:120, position:"relative", overflow:"hidden",
          background:`linear-gradient(135deg, ${node.color}33 0%, ${node.color}11 100%)`,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          gap:8,
        }}>
          {/* Soft Glow */}
          <div style={{
            position:"absolute", inset:0,
            background:`radial-gradient(circle at 50% 60%, ${node.glow} 0%, transparent 70%)`,
          }}/>
          {/* Close */}
          <button className="ho-tap" onClick={onClose} style={{
            position:"absolute", top:14, right:16,
            width:28, height:28, borderRadius:"50%",
            background:"rgba(0,0,0,0.10)", border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, color:"rgba(0,0,0,0.50)", fontWeight:700,
          }}>{"✕"}</button>
          {/* Icon */}
          <div style={{
            width:52, height:52, borderRadius:"50%",
            background:node.color,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24, position:"relative", zIndex:2,
            boxShadow:`0 4px 16px ${node.glow}`,
          }}>
            {node.icon}
          </div>
          <div style={{ fontSize:17, fontWeight:900, color:"#1A1A1A",
            letterSpacing:-0.4, position:"relative", zIndex:2 }}>
            {node.label}
          </div>
          <div style={{ fontSize:12, color:"rgba(0,0,0,0.55)",
            position:"relative", zIndex:2, textAlign:"center", padding:"0 24px" }}>
            {node.desc}
          </div>
        </div>

        {/* Impact Hinweis */}
        {node.isImpact && (
          <div style={{
            margin:"14px 20px 0",
            background:`linear-gradient(135deg, rgba(255,138,122,0.10) 0%, rgba(246,199,104,0.10) 100%)`,
            borderRadius:14, padding:"10px 14px",
            border:"1px solid rgba(255,138,122,0.20)",
            fontSize:11.5, color:"#FF6B55", fontWeight:600, lineHeight:1.5,
          }}>
            {"· "}
            {node.impactNote}
          </div>
        )}

        {/* Sub-Items */}
        <div style={{ padding:"14px 20px 0" }}>
          {node.sub.map((item, i) => (
            <button
              key={item.key}
              className="ho-tap"
              onClick={() => onAction(item.key, node)}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:14,
                padding:"12px 14px", borderRadius:16, border:"none",
                background: i % 2 === 0 ? "rgba(0,0,0,0.025)" : "transparent",
                cursor:"pointer", marginBottom:4,
                transition:"background 0.18s ease",
              }}
            >
              <div style={{
                width:36, height:36, borderRadius:12, flexShrink:0,
                background:`${node.color}18`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18,
              }}>
                {item.icon}
              </div>
              <span style={{ fontSize:14, fontWeight:600, color:"#1A1A1A", textAlign:"left" }}>
                {item.label}
              </span>
              <span style={{ marginLeft:"auto", fontSize:14, color:"rgba(0,0,0,0.25)" }}>
                {"\u203A"}
              </span>
            </button>
          ))}
        </div>

        {/* Impact-Flow Steps */}
        {node.isImpact && (
          <div style={{ padding:"14px 20px 0" }}>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(0,0,0,0.50)",
              letterSpacing:0.4, marginBottom:10 }}>
              {"WIRKUNG STARTEN \u2014 SO FUNKTIONIERT ES"}
            </div>
            {IMPACT_STEPS.map((s, i) => (
              <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start",
                marginBottom:10 }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize:12.5, fontWeight:700, color:"#1A1A1A" }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize:11.5, color:"rgba(0,0,0,0.50)", lineHeight:1.4 }}>
                    {s.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ padding:"16px 20px 0" }}>
          <button
            className="ho-tap"
            onClick={() => onAction(node.cta, node)}
            style={{
              width:"100%", height:50, borderRadius:18, border:"none",
              background:`linear-gradient(135deg, ${node.color} 0%, ${node.color}CC 100%)`,
              color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer",
              boxShadow:`0 6px 20px ${node.glow}`,
              letterSpacing:-0.2,
            }}
          >
            Weiter {"→"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   INFO PANEL (rechts bei iPad — Zusammenfassung aller Nodes)
══════════════════════════════════════════════════════════════ */
function InfoPanel({ onNodeSelect }) {
  return (
    <div style={{
      width:280, flexShrink:0,
      background:"rgba(20,30,28,0.85)",
      backdropFilter:"blur(20px)",
      WebkitBackdropFilter:"blur(20px)",
      borderRadius:24,
      padding:"22px 20px",
      border:"1px solid rgba(255,255,255,0.10)",
      boxShadow:"0 16px 48px rgba(0,0,0,0.30)",
      animation:"cardUp 0.4s 0.2s both",
    }}>
      <div style={{ fontSize:16, fontWeight:900, color:"#fff",
        letterSpacing:-0.4, marginBottom:3 }}>
        {"Der HUI Orb ·"}
      </div>
      <div style={{ fontSize:11.5, color:"rgba(255,255,255,0.50)",
        marginBottom:18, lineHeight:1.5 }}>
        Jede Option öffnet einen eigenen kreativen Raum.
      </div>
      {NODES.map((node, i) => (
        <div key={node.key}
          className="ho-tap"
          onClick={() => onNodeSelect(node)}
          style={{
            display:"flex", alignItems:"flex-start", gap:10,
            marginBottom:14, cursor:"pointer",
          }}>
          <div style={{
            width:32, height:32, borderRadius:10, flexShrink:0,
            background:node.color,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16,
          }}>
            {node.icon}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff", lineHeight:1.2 }}>
              {node.label}
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", lineHeight:1.4 }}>
              {node.desc}
            </div>
          </div>
        </div>
      ))}

      {/* Impact Flow */}
      <div style={{
        background:"rgba(255,255,255,0.06)",
        borderRadius:16, padding:"14px",
        marginTop:6, border:"1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.60)",
          marginBottom:10, letterSpacing:0.3 }}>
          WIRKUNG STARTEN
        </div>
        {IMPACT_STEPS.map((s, i) => (
          <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start",
            marginBottom:8 }}>
            <span style={{ fontSize:13, flexShrink:0, opacity:0.8 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:11.5, fontWeight:600, color:"rgba(255,255,255,0.80)" }}>
                {s.title}
              </div>
              <div style={{ fontSize:10.5, color:"rgba(255,255,255,0.40)", lineHeight:1.4 }}>
                {s.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Text */}
      <div style={{ marginTop:14, textAlign:"center",
        fontSize:11, color:"rgba(255,255,255,0.30)", lineHeight:1.5 }}>
        {"✦ Der HUI Orb begleitet dich bei jedem\nSchritt deiner kreativen Reise. ❤"}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SPARKLE PARTICLES
══════════════════════════════════════════════════════════════ */
function Particles() {
  const particles = Array.from({length:12}, (_, i) => ({
    id:i,
    x: (Math.random()-0.5)*200,
    y: (Math.random()-0.5)*200,
    size: 2 + Math.random()*3,
    delay: Math.random()*2,
    duration: 1.5 + Math.random()*1.5,
  }));
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:"absolute",
          left:`calc(50% + ${p.x}px)`,
          top:`calc(50% + ${p.y}px)`,
          width:p.size, height:p.size, borderRadius:"50%",
          background:`rgba(32,211,194,${0.4 + Math.random()*0.4})`,
          animation:`sparkle ${p.duration}s ease-in-out ${p.delay}s infinite`,
        }}/>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN: HuiPlusSheet (Orb Experience)
   Props: { onSelect, onClose } — RÜCKWÄRTSKOMPATIBEL
   onSelect(type) → "story" | "werk" | "experience" | "impact" | "connect"
══════════════════════════════════════════════════════════════ */
export default function HuiPlusSheet({ onSelect, onClose }) {
  // ── Hooks (stabile Reihenfolge) ──────────────────────────────────
  const [mounted,      setMounted]      = useState(false);
  const [activeNode,   setActiveNode]   = useState(null);
  const [detailNode,   setDetailNode]   = useState(null);
  const [isWide,       setIsWide]       = useState(window.innerWidth >= 768);

  // ── Mount-Animation ───────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  // ── Resize ───────────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setIsWide(window.innerWidth >= 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── Escape ───────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") {
        if (detailNode) setDetailNode(null);
        else onClose?.();
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [detailNode, onClose]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleNodeSelect = useCallback((node) => {
    setActiveNode(n => n?.key === node.key ? null : node);
  }, []);

  const handleNodeOpen = useCallback((node) => {
    setDetailNode(node);
  }, []);

  const handleAction = useCallback((type, node) => {
    setDetailNode(null);
    onSelect?.(type);
    onClose?.();
  }, [onSelect, onClose]);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* ── Fullscreen Overlay ──────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="HUI Orb — Kreatives Zentrum"
        style={{
          position:"fixed", inset:0, zIndex:450,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(8,18,16,0.88)",
          backdropFilter:"blur(22px)",
          WebkitBackdropFilter:"blur(22px)",
          opacity: mounted ? 1 : 0,
          transition:"opacity 0.3s ease",
        }}
        onClick={onClose}
      >
        {/* ── Vignette ──────────────────────────────────────────── */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.35) 100%)",
        }}/>

        {/* ── Ambient Glow ──────────────────────────────────────── */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"radial-gradient(circle at 50% 45%, rgba(32,211,194,0.08) 0%, transparent 55%)",
          animation:"orbFade 1s ease both",
        }}/>

        {/* ── Content Wrapper ───────────────────────────────────── */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            display:"flex", alignItems:"center", justifyContent:"center",
            gap:32, padding:"0 24px", width:"100%", maxWidth:720,
          }}
        >
          {/* ── Left: Header (mobile) / nur auf schmalen Screens ── */}
          {!isWide && (
            <div style={{
              position:"absolute", top:"max(52px,env(safe-area-inset-top,52px))",
              left:0, right:0, padding:"0 24px",
              textAlign:"center",
              animation:"orbFade 0.6s 0.1s both",
            }}>
              <div style={{ fontSize:22, fontWeight:900, color:"#fff",
                letterSpacing:-0.6, lineHeight:1.2 }}>
                {"Der HUI Orb ·"}
              </div>
              <div style={{ fontSize:12.5, color:"rgba(255,255,255,0.50)",
                marginTop:4, lineHeight:1.5 }}>
                Dein Zugang zu allem,{"\n"}was du in die Welt bringen möchtest.
              </div>
            </div>
          )}

          {/* ── Left: Info Panel (iPad) ───────────────────────────── */}
          {isWide && (
            <InfoPanel onNodeSelect={(node) => { setDetailNode(node); }}/>
          )}

          {/* ── Central Orb Stage ─────────────────────────────────── */}
          <div style={{
            position:"relative",
            width:320, height:320,
            flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            {/* Particles */}
            {mounted && <Particles />}

            {/* Node Buttons */}
            {NODES.map((node, i) => (
              <NodeButton
                key={node.key}
                node={node}
                idx={i}
                active={activeNode?.key === node.key}
                onSelect={(n) => {
                  setActiveNode(n);
                  // Double-tap → öffnet Detail
                  if (activeNode?.key === n.key) {
                    setDetailNode(n);
                    setActiveNode(null);
                  }
                }}
              />
            ))}

            {/* Central HUI Logo Orb */}
            <div
              className="ho-tap"
              onClick={() => {
                if (activeNode) {
                  setDetailNode(activeNode);
                  setActiveNode(null);
                }
              }}
              style={{
                position:"relative", zIndex:10,
                animation:"orbIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
              }}
            >
              <HuiLogoOrb size={90} glowing={true} />
            </div>
          </div>

          {/* ── Right: keine zweite Seite auf Mobile ──────────────── */}
        </div>

        {/* ── Close Button ─────────────────────────────────────── */}
        <button
          className="ho-tap"
          onClick={onClose}
          aria-label="Schließen"
          style={{
            position:"absolute",
            bottom: `calc(max(28px,env(safe-area-inset-bottom,28px)) + 70px)`,
            left:"50%", transform:"translateX(-50%)",
            width:42, height:42, borderRadius:"50%",
            background:"rgba(255,255,255,0.12)",
            backdropFilter:"blur(8px)",
            border:"1.5px solid rgba(255,255,255,0.18)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:"rgba(255,255,255,0.70)",
            animation:"orbFade 0.6s 0.4s both",
          }}
        >
          {"✕"}
        </button>

        {/* ── Mobile Header (nochmal für Lesbarkeit) ─────────────── */}
        {!isWide && (
          <div style={{
            position:"absolute",
            bottom:`calc(max(28px,env(safe-area-inset-bottom,28px)) + 126px)`,
            left:0, right:0, textAlign:"center",
            animation:"orbFade 0.6s 0.5s both",
            pointerEvents:"none",
          }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.30)", letterSpacing:0.5 }}>
              {"TIPPE EINEN BEREICH AN"}
            </div>
          </div>
        )}

        {/* ── Bottom Mantra ──────────────────────────────────────── */}
        <div style={{
          position:"absolute",
          bottom:`max(18px,env(safe-area-inset-bottom,18px))`,
          left:0, right:0, textAlign:"center",
          animation:"orbFade 0.8s 0.6s both",
          pointerEvents:"none",
        }}>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", letterSpacing:0.3 }}>
            {"✦ Der HUI Orb begleitet dich bei jedem Schritt deiner kreativen Reise. ❤"}
          </div>
        </div>

        {/* ── Mobile Node List (unter dem Orb) ──────────────────── */}
        {!isWide && mounted && (
          <div className="ho-scroll" style={{
            position:"absolute",
            bottom:`calc(max(28px,env(safe-area-inset-bottom,28px)) + 150px)`,
            left:0, right:0,
            display:"flex", gap:10, justifyContent:"center",
            padding:"0 20px",
            flexWrap:"wrap",
            pointerEvents:"none",
            opacity: activeNode ? 0 : 0,  // nur via Nodes sichtbar
          }}>
          </div>
        )}
      </div>

      {/* ── Node Quick-Actions (aktiver Node → Leiste unten) ──────── */}
      {activeNode && !isWide && (
        <div style={{
          position:"fixed",
          bottom:`calc(max(28px,env(safe-area-inset-bottom,28px)) + 62px)`,
          left:"50%", transform:"translateX(-50%)",
          zIndex:460,
          background:"rgba(20,30,28,0.90)",
          backdropFilter:"blur(16px)",
          borderRadius:20, padding:"12px 20px",
          border:"1px solid rgba(255,255,255,0.12)",
          display:"flex", gap:8, alignItems:"center",
          animation:"cardUp 0.3s cubic-bezier(0.32,0.72,0,1) both",
          boxShadow:"0 8px 32px rgba(0,0,0,0.30)",
        }}>
          <div style={{ fontSize:13.5, fontWeight:800, color:"#fff", marginRight:4 }}>
            {activeNode.label}
          </div>
          <button className="ho-tap" onClick={() => setDetailNode(activeNode)} style={{
            background:activeNode.color, border:"none", borderRadius:12,
            padding:"7px 14px", fontSize:12.5, fontWeight:700, color:"#fff",
            cursor:"pointer",
          }}>
            Öffnen {"\u203A"}
          </button>
        </div>
      )}

      {/* ── Detail Card ──────────────────────────────────────────── */}
      {detailNode && (
        <DetailCard
          node={detailNode}
          onAction={handleAction}
          onClose={() => setDetailNode(null)}
        />
      )}
    </>
  );
}
