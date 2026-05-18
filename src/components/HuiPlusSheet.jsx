// HuiPlusSheet.jsx — HUI Orb Experience v4
// VOLLSTÄNDIGE UX-ÜBERARBEITUNG:
//   - Orb öffnet für ALLE Nutzer (nicht nur Talente)
//   - Node-Interaktion: aktiver Node wächst, andere verblassen
//   - Impact-Bereich: zeremoniell, coral glow, besondere Atmosphäre
//   - User-Level-Logik: normal / talent / trusted
//   - Smooth floating nodes mit individueller Physik
//   - DetailCard slide-up mit Sub-Items
//   - Props: { onSelect, onClose, isTalent, isTrusted } — erweitert, abwärtskompatibel

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS
══════════════════════════════════════════════════════════════ */
const C = {
  teal:       "#20D3C2",
  teal2:      "#16BFB0",
  tealGlow:   "rgba(32,211,194,0.40)",
  tealSoft:   "rgba(32,211,194,0.12)",
  coral:      "#FF8A7A",
  coralDeep:  "#F06050",
  coralGlow:  "rgba(255,138,122,0.45)",
  coralSoft:  "rgba(255,138,122,0.12)",
  gold:       "#F6C768",
  goldGlow:   "rgba(246,199,104,0.35)",
  blue:       "#5BA8F5",
  blueGlow:   "rgba(91,168,245,0.38)",
  blueSoft:   "rgba(91,168,245,0.12)",
  violet:     "#A78BFA",
  violetGlow: "rgba(167,139,250,0.38)",
  violetSoft: "rgba(167,139,250,0.12)",
  ink:        "#1E1E1E",
  muted:      "#8A8A8A",
  cardSolid:  "rgba(255,255,255,0.97)",
};

/* ══════════════════════════════════════════════════════════════
   CSS ANIMATIONEN
══════════════════════════════════════════════════════════════ */
const CSS = `
  @keyframes orbBgIn   { from{opacity:0} to{opacity:1} }
  @keyframes orbLogoIn { from{opacity:0;transform:scale(0.3)} to{opacity:1;transform:scale(1)} }
  @keyframes nodeIn0   { from{opacity:0;transform:translate(calc(-50% + 0px),calc(-50% + 30px)) scale(0.3)} to{opacity:1;transform:translate(calc(-50% + 0px),calc(-50% + -130px)) scale(1)} }
  @keyframes nodeIn1   { from{opacity:0;transform:translate(calc(-50% + -20px),calc(-50% + 20px)) scale(0.3)} to{opacity:1;transform:translate(calc(-50% + 124px),calc(-50% + -40px)) scale(1)} }
  @keyframes nodeIn2   { from{opacity:0;transform:translate(calc(-50% + -20px),calc(-50% + -20px)) scale(0.3)} to{opacity:1;transform:translate(calc(-50% + 77px),calc(-50% + 105px)) scale(1)} }
  @keyframes nodeIn3   { from{opacity:0;transform:translate(calc(-50% + 20px),calc(-50% + -20px)) scale(0.3)} to{opacity:1;transform:translate(calc(-50% + -77px),calc(-50% + 105px)) scale(1)} }
  @keyframes nodeIn4   { from{opacity:0;transform:translate(calc(-50% + 20px),calc(-50% + 20px)) scale(0.3)} to{opacity:1;transform:translate(calc(-50% + -124px),calc(-50% + -40px)) scale(1)} }
  @keyframes floatA    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes floatB    { 0%,100%{transform:translateY(-5px)} 50%{transform:translateY(6px)} }
  @keyframes floatC    { 0%,100%{transform:translateY(4px)} 50%{transform:translateY(-7px)} }
  @keyframes floatD    { 0%,100%{transform:translateY(-3px)} 50%{transform:translateY(7px)} }
  @keyframes floatE    { 0%,100%{transform:translateY(6px)} 50%{transform:translateY(-4px)} }
  @keyframes orbPulseT { 0%,100%{box-shadow:0 0 0 0 rgba(32,211,194,0),0 0 50px rgba(32,211,194,0.3)} 50%{box-shadow:0 0 0 14px rgba(32,211,194,0.07),0 0 80px rgba(32,211,194,0.55)} }
  @keyframes orbPulseC { 0%,100%{box-shadow:0 0 0 0 rgba(255,138,122,0),0 0 50px rgba(255,138,122,0.3)} 50%{box-shadow:0 0 0 14px rgba(255,138,122,0.07),0 0 80px rgba(255,138,122,0.55)} }
  @keyframes ringOut   { 0%,100%{transform:scale(1);opacity:0.30} 50%{transform:scale(1.14);opacity:0.12} }
  @keyframes cardUp    { from{opacity:0;transform:translateY(48px) scale(0.94)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes impactGlow{ 0%,100%{background:radial-gradient(circle,rgba(255,138,122,0.10) 0%,transparent 60%)} 50%{background:radial-gradient(circle,rgba(255,138,122,0.25) 0%,transparent 55%)} }
  @keyframes sparkle   { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 50%{opacity:0.8;transform:scale(1) rotate(180deg)} }
  @keyframes mantIn    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .ho-tap  { -webkit-tap-highlight-color:transparent; cursor:pointer; }
  .ho-tap:active { opacity:0.82; }
  .ho-scroll::-webkit-scrollbar { display:none; }
  .ho-scroll { -ms-overflow-style:none; scrollbar-width:none; }
`;

/* ══════════════════════════════════════════════════════════════
   NODE DEFINITIONEN
   angle in Grad, float-Animationsname
══════════════════════════════════════════════════════════════ */
const NODES = [
  {
    key:"teilen",    label:"Teilen",            icon:"🌿",
    color:C.teal,    glow:C.tealGlow,   soft:C.tealSoft,
    angle:-90, float:"floatA",
    desc:"Zeige etwas, das dich bewegt.",
    cta:"story", ctaLabel:"Jetzt teilen",
    forAll:true,
    sub:[
      { key:"foto",        icon:"📷", label:"Foto / Video"        },
      { key:"gedanke",     icon:"💭", label:"Gedanke"             },
      { key:"inspiration", icon:"✨", label:"Inspiration"         },
      { key:"musik",       icon:"🎵", label:"Musik"               },
      { key:"geschichte",  icon:"📖", label:"Geschichte"          },
    ],
  },
  {
    key:"werk",      label:"Werk erschaffen",   icon:"🎨",
    color:C.coral,   glow:C.coralGlow,  soft:C.coralSoft,
    angle:-18, float:"floatB",
    desc:"Biete deine Kunst, dein Handwerk oder Design an.",
    cta:"werk", ctaLabel:"Werk erstellen",
    forAll:false, talentOnly:true,
    sub:[
      { key:"kunstwerk", icon:"🖼",  label:"Kunstwerk"            },
      { key:"handwerk",  icon:"🏺",  label:"Handwerk"             },
      { key:"design",    icon:"✏️",  label:"Design"               },
      { key:"digital",   icon:"💻",  label:"Digitale Produkte"    },
      { key:"sammler",   icon:"💎",  label:"Sammlerstücke"        },
    ],
  },
  {
    key:"erlebnis",  label:"Erlebnis öffnen",   icon:"📅",
    color:C.blue,    glow:C.blueGlow,   soft:C.blueSoft,
    angle:54,  float:"floatC",
    desc:"Lade Menschen in einen besonderen Moment ein.",
    cta:"experience", ctaLabel:"Erlebnis öffnen",
    forAll:false, talentOnly:true,
    sub:[
      { key:"workshop",   icon:"🔨", label:"Workshop"             },
      { key:"retreat",    icon:"🌲", label:"Retreat"              },
      { key:"event",      icon:"🎉", label:"Event"                },
      { key:"session",    icon:"🎯", label:"Session"              },
      { key:"erlebnis_s", icon:"🌟", label:"Erlebnis"             },
    ],
  },
  {
    key:"wirkung",   label:"Wirkung starten",   icon:"❤️",
    color:C.coral,   glow:C.coralGlow,  soft:C.coralSoft,
    angle:126, float:"floatD",
    desc:"Reiche eine Vision ein, die Menschen und die Welt bewegt.",
    cta:"impact", ctaLabel:"Vision einreichen",
    forAll:true, isImpact:true,
    impactNote:"Dein Projekt wird vom HUI Team geprüft, bevor es im Impact Pool erscheint.",
    sub:[
      { key:"idee",     icon:"💡", label:"Idee einreichen"        },
      { key:"wirkraum", icon:"🌍", label:"Wirkungsraum entdecken" },
      { key:"einreich", icon:"📋", label:"Meine Einreichungen"    },
    ],
  },
  {
    key:"verbindung",label:"Verbindung suchen", icon:"👥",
    color:C.violet,  glow:C.violetGlow, soft:C.violetSoft,
    angle:198, float:"floatE",
    desc:"Finde kreative Menschen und kollaboriere.",
    cta:"connect", ctaLabel:"Verbindungen finden",
    forAll:true,
    sub:[
      { key:"kollab",   icon:"🤝", label:"Kollaboration finden"   },
      { key:"mentor",   icon:"🎓", label:"Mentor finden"          },
      { key:"partner",  icon:"🔗", label:"Projektpartner"         },
      { key:"community",icon:"🌐", label:"Community beitreten"    },
    ],
  },
];

const IMPACT_STEPS = [
  { icon:"💡", title:"Idee einreichen",            sub:"Teile deine Vision in unserem Wirkungsraum." },
  { icon:"🔍", title:"Prüfung durch das HUI Team", sub:"Wir prüfen, ob dein Projekt zu HUI passt." },
  { icon:"🗳",  title:"Community Entscheidung",     sub:"Die Community entscheidet über die Unterstützung." },
  { icon:"🌱", title:"Gemeinsam Wirkung schaffen",  sub:"Transparenz, Updates und echter Impact." },
];

/* ══════════════════════════════════════════════════════════════
   HELPER: Node-Position (Polarkoordinaten, fix)
══════════════════════════════════════════════════════════════ */
function nodePos(angle, R) {
  const rad = (angle * Math.PI) / 180;
  return { x: Math.cos(rad) * R, y: Math.sin(rad) * R };
}

/* ══════════════════════════════════════════════════════════════
   SPARKLE PARTICLES
══════════════════════════════════════════════════════════════ */
function Particles({ color = C.teal }) {
  const pts = useMemo(() => Array.from({length:14}, (_, i) => ({
    id:i,
    x: (Math.sin(i*2.3)*90 + (Math.random()-0.5)*40),
    y: (Math.cos(i*1.7)*80 + (Math.random()-0.5)*40),
    s: 2 + Math.random()*2.5,
    delay: i*0.15,
    dur: 2 + Math.random()*1.5,
  })), []);
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:1 }}>
      {pts.map(p => (
        <div key={p.id} style={{
          position:"absolute",
          left:`calc(50% + ${p.x}px)`, top:`calc(50% + ${p.y}px)`,
          width:p.s, height:p.s, borderRadius:"50%",
          background:color,
          opacity:0.5,
          animation:`sparkle ${p.dur}s ease-in-out ${p.delay}s infinite`,
        }}/>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HUI LOGO ORB (zentral)
══════════════════════════════════════════════════════════════ */
function HuiLogoOrb({ size=90, activeColor=null }) {
  const isImpact = activeColor === C.coral;
  return (
    <div style={{ width:size, height:size, position:"relative",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      {/* Äußerer Pulsring */}
      <div style={{
        position:"absolute", inset:-14, borderRadius:"50%",
        background:`radial-gradient(circle, ${activeColor || C.teal}1A 0%, transparent 70%)`,
        animation:"ringOut 3.5s ease-in-out infinite",
      }}/>
      {/* Zweiter Ring */}
      <div style={{
        position:"absolute", inset:-28, borderRadius:"50%",
        background:`radial-gradient(circle, ${activeColor || C.teal}0D 0%, transparent 55%)`,
        animation:"ringOut 4.5s ease-in-out 0.7s infinite",
      }}/>
      {/* Logo */}
      <div style={{
        width:size, height:size, borderRadius:"50%", overflow:"hidden",
        boxShadow:`0 0 0 2px ${(activeColor||C.teal)}55, 0 0 44px ${(activeColor||C.teal)}66, 0 8px 32px rgba(0,0,0,0.35)`,
        animation: isImpact ? "orbPulseC 3.5s ease-in-out infinite" : "orbPulseT 3.5s ease-in-out infinite",
        background:"linear-gradient(135deg,#1a4a45 0%,#2d8a7a 100%)",
        flexShrink:0, transition:"box-shadow 0.6s ease",
      }}>
        <img src="/hui-logo.jpg" alt="HUI" loading="eager"
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          onError={e => {
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
   NODE BUTTON
══════════════════════════════════════════════════════════════ */
function NodeBtn({ node, idx, active, dimmed, locked, onTap }) {
  const R = 130;
  const {x, y} = nodePos(node.angle, R);
  const floatAnims = ["floatA","floatB","floatC","floatD","floatE"];
  const nodeAnim   = `nodeIn${idx}`;
  const floatAnim  = floatAnims[idx] || "floatA";
  const dur        = 3.2 + idx * 0.45;
  const delay      = 0.6 + idx * 0.1;

  return (
    <div
      className="ho-tap"
      onClick={() => !locked && onTap(node)}
      style={{
        position:"absolute",
        left:"50%", top:"50%",
        transform:`translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        display:"flex", flexDirection:"column", alignItems:"center", gap:5,
        animation:`${nodeAnim} 0.55s cubic-bezier(0.34,1.40,0.64,1) ${0.08 + idx*0.08}s both, ${floatAnim} ${dur}s ease-in-out ${delay}s infinite`,
        zIndex:4,
        cursor: locked ? "default" : "pointer",
        transition:"opacity 0.35s ease, transform 0.35s ease",
        opacity: locked ? 0.35 : dimmed ? 0.28 : 1,
        filter: locked ? "grayscale(0.6)" : "none",
      }}
    >
      {/* Kreis */}
      <div style={{
        width: active ? 62 : 54,
        height: active ? 62 : 54,
        borderRadius:"50%",
        background: active
          ? node.color
          : "rgba(255,255,255,0.10)",
        backdropFilter:"blur(14px)",
        WebkitBackdropFilter:"blur(14px)",
        border:`2px solid ${active ? node.color : "rgba(255,255,255,0.20)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize: active ? 26 : 22,
        boxShadow: active
          ? `0 0 0 5px ${node.glow}, 0 10px 28px ${node.glow}`
          : `0 4px 18px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)`,
        transition:"all 0.35s cubic-bezier(0.34,1.20,0.64,1)",
      }}>
        {node.icon}
      </div>

      {/* Label */}
      <div style={{
        fontSize:10.5, fontWeight:700,
        color: active ? node.color : "rgba(255,255,255,0.82)",
        textAlign:"center", whiteSpace:"nowrap",
        textShadow:"0 1px 5px rgba(0,0,0,0.55)",
        transition:"color 0.3s ease",
        letterSpacing:0.1,
        maxWidth:82, lineHeight:1.25,
      }}>
        {node.label}
        {locked && (
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.40)",
            fontWeight:500, marginTop:1 }}>
            Talent nötig
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   IMPACT DETAIL (zeremoniell — eigene Komponente)
══════════════════════════════════════════════════════════════ */
function ImpactDetail({ onAction, onClose }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:500,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"flex-end",
      animation:"fadeIn 0.25s ease both",
    }}
    onClick={onClose}
    >
      {/* Coral Atmosphere */}
      <div style={{
        position:"absolute", inset:0,
        background:"rgba(12,8,6,0.78)",
        backdropFilter:"blur(12px)",
        WebkitBackdropFilter:"blur(12px)",
      }}/>
      <div style={{
        position:"absolute", inset:0, pointerEvents:"none",
        animation:"impactGlow 4s ease-in-out infinite",
      }}/>

      {/* Card */}
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%", maxWidth:480,
        background:"rgba(24,14,12,0.95)",
        borderRadius:"32px 32px 0 0",
        padding:"0 0 max(32px,env(safe-area-inset-bottom,32px))",
        boxShadow:`0 -16px 64px rgba(255,138,122,0.25), 0 -4px 16px rgba(0,0,0,0.40)`,
        border:"1px solid rgba(255,138,122,0.18)",
        borderBottom:"none",
        animation:"cardUp 0.45s cubic-bezier(0.32,0.72,0,1) both",
        overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{
          padding:"24px 24px 18px",
          background:"linear-gradient(to bottom, rgba(255,138,122,0.10) 0%, transparent 100%)",
          borderBottom:"1px solid rgba(255,138,122,0.10)",
        }}>
          {/* Close */}
          <button className="ho-tap" onClick={onClose} style={{
            position:"absolute", top:18, right:20,
            width:30, height:30, borderRadius:"50%",
            background:"rgba(255,255,255,0.08)", border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, color:"rgba(255,255,255,0.50)",
          }}>{"✕"}</button>

          {/* Icon */}
          <div style={{ textAlign:"center", marginBottom:12 }}>
            <div style={{
              width:60, height:60, borderRadius:"50%",
              background:"linear-gradient(135deg,#FF8A7A,#F06050)",
              display:"inline-flex", alignItems:"center", justifyContent:"center",
              fontSize:28, marginBottom:10,
              boxShadow:`0 8px 28px ${C.coralGlow}`,
            }}>{"❤️"}</div>
            <div style={{ fontSize:20, fontWeight:900, color:"#fff",
              letterSpacing:-0.5 }}>
              Wirkung starten
            </div>
            <div style={{ fontSize:12.5, color:"rgba(255,255,255,0.50)",
              marginTop:5, lineHeight:1.6, padding:"0 20px" }}>
              {"Reiche eine Vision ein, die Menschen\nund die Welt positiv bewegt."}
            </div>
          </div>
        </div>

        {/* Hinweis */}
        <div style={{
          margin:"16px 22px 0",
          background:"rgba(255,138,122,0.10)",
          borderRadius:14, padding:"10px 14px",
          border:"1px solid rgba(255,138,122,0.18)",
          display:"flex", gap:10, alignItems:"flex-start",
        }}>
          <span style={{ fontSize:16, flexShrink:0 }}>{"🌿"}</span>
          <div style={{ fontSize:11.5, color:"rgba(255,200,190,0.85)",
            lineHeight:1.55 }}>
            Jede Einreichung wird vom HUI Team geprüft. Creator mit echter Wirkung erhalten schneller Zugang.
          </div>
        </div>

        {/* 4-Step Flow */}
        <div style={{ padding:"16px 22px 0" }}>
          {IMPACT_STEPS.map((s, i) => (
            <div key={i} style={{
              display:"flex", gap:12, alignItems:"flex-start",
              marginBottom:12, opacity: 0.9,
            }}>
              <div style={{
                width:32, height:32, borderRadius:10, flexShrink:0,
                background:"rgba(255,138,122,0.15)",
                border:"1px solid rgba(255,138,122,0.20)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:15,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.90)" }}>
                  {s.title}
                </div>
                <div style={{ fontSize:11.5, color:"rgba(255,255,255,0.40)",
                  lineHeight:1.45, marginTop:1 }}>
                  {s.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ padding:"14px 22px 0", display:"flex", flexDirection:"column", gap:10 }}>
          <button className="ho-tap" onClick={() => onAction("idee")} style={{
            width:"100%", height:52, borderRadius:18, border:"none",
            background:"linear-gradient(135deg,#FF8A7A 0%,#F06050 100%)",
            color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer",
            boxShadow:`0 8px 24px ${C.coralGlow}`,
            letterSpacing:-0.2,
          }}>
            Vision einreichen {"→"}
          </button>
          <button className="ho-tap" onClick={() => onAction("wirkraum")} style={{
            width:"100%", height:44, borderRadius:14, border:"none",
            background:"rgba(255,255,255,0.07)",
            color:"rgba(255,255,255,0.65)", fontSize:13, fontWeight:600,
            cursor:"pointer",
          }}>
            Wirkungsraum entdecken
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STANDARD DETAIL CARD (für nicht-Impact Nodes)
══════════════════════════════════════════════════════════════ */
function DetailCard({ node, isTalent, onAction, onClose }) {
  const locked = !node.forAll && !isTalent;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:500,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"flex-end",
      animation:"fadeIn 0.2s ease both",
    }}
    onClick={onClose}
    >
      <div style={{
        position:"absolute", inset:0,
        background:"rgba(10,20,18,0.72)",
        backdropFilter:"blur(10px)",
        WebkitBackdropFilter:"blur(10px)",
      }}/>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"100%", maxWidth:460,
        background:C.cardSolid,
        borderRadius:"28px 28px 0 0",
        boxShadow:"0 -10px 48px rgba(0,0,0,0.22)",
        animation:"cardUp 0.40s cubic-bezier(0.32,0.72,0,1) both",
        overflow:"hidden",
        padding:"0 0 max(28px,env(safe-area-inset-bottom,28px))",
      }}>
        {/* Header */}
        <div style={{
          height:116, position:"relative",
          background:`linear-gradient(135deg, ${node.soft} 0%, transparent 100%)`,
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:7,
        }}>
          <div style={{
            position:"absolute", inset:0,
            background:`radial-gradient(circle at 50% 80%, ${node.glow}22 0%, transparent 65%)`,
          }}/>
          <button className="ho-tap" onClick={onClose} style={{
            position:"absolute", top:14, right:16,
            width:28, height:28, borderRadius:"50%",
            background:"rgba(0,0,0,0.08)", border:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, color:"rgba(0,0,0,0.45)",
          }}>{"✕"}</button>
          <div style={{
            width:50, height:50, borderRadius:"50%",
            background:node.color,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:24, position:"relative", zIndex:2,
            boxShadow:`0 4px 16px ${node.glow}`,
          }}>{node.icon}</div>
          <div style={{ fontSize:16.5, fontWeight:900, color:C.ink,
            letterSpacing:-0.4, zIndex:2 }}>{node.label}</div>
          <div style={{ fontSize:12, color:"rgba(0,0,0,0.50)", zIndex:2,
            textAlign:"center", padding:"0 28px", lineHeight:1.5 }}>
            {node.desc}
          </div>
        </div>

        {/* Locked State */}
        {locked && (
          <div style={{
            margin:"14px 20px 0",
            background:"rgba(246,199,104,0.12)",
            borderRadius:14, padding:"10px 14px",
            border:"1px solid rgba(246,199,104,0.30)",
            display:"flex", gap:8, alignItems:"center",
          }}>
            <span style={{ fontSize:18 }}>{"🌱"}</span>
            <div style={{ fontSize:12, color:"#8A6A00", lineHeight:1.5 }}>
              Dieser Bereich ist für HUI Wirker. Werde Teil der kreativen Community.
            </div>
          </div>
        )}

        {/* Sub-Items */}
        <div style={{ padding:"14px 20px 0" }}>
          {node.sub.map((item, i) => (
            <button key={item.key} className="ho-tap"
              onClick={() => !locked && onAction(item.key, node)}
              disabled={locked}
              style={{
                width:"100%", display:"flex", alignItems:"center", gap:13,
                padding:"11px 12px", borderRadius:15, border:"none",
                background: i%2===0 ? "rgba(0,0,0,0.025)" : "transparent",
                cursor: locked ? "default" : "pointer",
                opacity: locked ? 0.45 : 1, marginBottom:3,
                transition:"background 0.18s ease",
              }}>
              <div style={{
                width:34, height:34, borderRadius:11, flexShrink:0,
                background:`${node.color}18`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:17,
              }}>{item.icon}</div>
              <span style={{ fontSize:13.5, fontWeight:600,
                color:C.ink, textAlign:"left" }}>{item.label}</span>
              <span style={{ marginLeft:"auto", fontSize:14,
                color:"rgba(0,0,0,0.20)" }}>{"›"}</span>
            </button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding:"16px 20px 0" }}>
          {locked ? (
            <button className="ho-tap" onClick={() => onAction("membership", node)} style={{
              width:"100%", height:50, borderRadius:16, border:"none",
              background:"linear-gradient(135deg,#20D3C2,#16BFB0)",
              color:"#fff", fontSize:14.5, fontWeight:800, cursor:"pointer",
              boxShadow:`0 6px 20px ${C.tealGlow}`,
            }}>
              Wirker werden {"→"}
            </button>
          ) : (
            <button className="ho-tap" onClick={() => onAction(node.cta, node)} style={{
              width:"100%", height:50, borderRadius:16, border:"none",
              background:`linear-gradient(135deg, ${node.color} 0%, ${node.color}CC 100%)`,
              color:"#fff", fontSize:14.5, fontWeight:800, cursor:"pointer",
              boxShadow:`0 6px 20px ${node.glow}`,
            }}>
              {node.ctaLabel} {"→"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN: HuiPlusSheet — Orb Experience v4
   Props: { onSelect, onClose, isTalent, isTrusted }
   onSelect(type) → "story"|"werk"|"experience"|"impact"|"connect"|"membership"
══════════════════════════════════════════════════════════════ */
export default function HuiPlusSheet({ onSelect, onClose, isTalent = false, isTrusted = false }) {
  // ── Hooks (stabile Reihenfolge) ───────────────────────────────────
  const [mounted,    setMounted]    = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [detailNode, setDetailNode] = useState(null);
  const [impactOpen, setImpactOpen] = useState(false);
  const [isWide,     setIsWide]     = useState(window.innerWidth >= 768);

  // ── Mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  // ── Resize ────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setIsWide(window.innerWidth >= 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // ── Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = e => {
      if (e.key !== "Escape") return;
      if (impactOpen)        { setImpactOpen(false); return; }
      if (detailNode)        { setDetailNode(null);  return; }
      onClose?.();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [impactOpen, detailNode, onClose]);

  // ── Node-Tap: aktiv setzen oder direkt öffnen (Doppel-Tap) ───────
  const handleNodeTap = useCallback(node => {
    if (activeNode?.key === node.key) {
      // Zweiter Tap → öffnen
      if (node.isImpact) setImpactOpen(true);
      else               setDetailNode(node);
      setActiveNode(null);
    } else {
      setActiveNode(node);
    }
  }, [activeNode]);

  // ── Action aus DetailCard / ImpactDetail ──────────────────────────
  const handleAction = useCallback((type, node) => {
    setDetailNode(null);
    setImpactOpen(false);
    if (type === "membership") { onSelect?.("membership"); onClose?.(); return; }
    onSelect?.(type);
    onClose?.();
  }, [onSelect, onClose]);

  // ── Quick-Open bei aktivem Node ───────────────────────────────────
  const handleOrbTap = useCallback(() => {
    if (activeNode) {
      if (activeNode.isImpact) setImpactOpen(true);
      else                     setDetailNode(activeNode);
      setActiveNode(null);
    }
  }, [activeNode]);

  // ── Aktive Farbe für Logo-Orb ─────────────────────────────────────
  const activeColor = activeNode?.color ?? null;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>

      {/* ── Fullscreen Overlay ────────────────────────────────────── */}
      <div
        role="dialog" aria-modal="true"
        aria-label="HUI Orb"
        style={{
          position:"fixed", inset:0, zIndex:450,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(6,14,12,0.90)",
          backdropFilter:"blur(24px)",
          WebkitBackdropFilter:"blur(24px)",
          opacity: mounted ? 1 : 0,
          transition:"opacity 0.30s ease",
        }}
        onClick={e => {
          if (e.target === e.currentTarget) {
            if (activeNode) { setActiveNode(null); return; }
            onClose?.();
          }
        }}
      >
        {/* Vignette */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:"radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.45) 100%)",
        }}/>

        {/* Ambient Glow — wechselt mit aktivem Node */}
        <div style={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:`radial-gradient(circle at 50% 44%, ${activeColor || C.teal}0F 0%, transparent 50%)`,
          transition:"background 0.5s ease",
        }}/>

        {/* Particles */}
        {mounted && <Particles color={activeColor || C.teal} />}

        {/* Mantra oben (iPad) */}
        {isWide && (
          <div style={{
            position:"absolute", top:"max(44px,env(safe-area-inset-top,44px))",
            left:0, right:0, textAlign:"center",
            animation:"mantIn 0.6s 0.2s both", pointerEvents:"none",
          }}>
            <div style={{ fontSize:20, fontWeight:900, color:"#fff",
              letterSpacing:-0.5, lineHeight:1.2 }}>
              {"Der HUI Orb ·"}
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.40)",
              marginTop:4 }}>
              Dein Zugang zu allem, was du in die Welt bringen möchtest.
            </div>
          </div>
        )}

        {/* ── Orb Stage ─────────────────────────────────────────── */}
        <div style={{
          position:"relative",
          width:310, height:310,
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0,
          marginTop: isWide ? 40 : 0,
        }}>
          {/* Node Buttons */}
          {NODES.map((node, i) => {
            const locked = !node.forAll && !isTalent;
            const dimmed = activeNode !== null && activeNode.key !== node.key;
            return (
              <NodeBtn
                key={node.key}
                node={node}
                idx={i}
                active={activeNode?.key === node.key}
                dimmed={dimmed}
                locked={locked}
                onTap={handleNodeTap}
              />
            );
          })}

          {/* Zentraler HUI Logo Orb */}
          <div
            className="ho-tap"
            onClick={handleOrbTap}
            style={{
              position:"relative", zIndex:10,
              animation:"orbLogoIn 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.05s both",
            }}
          >
            <HuiLogoOrb size={90} activeColor={activeColor} />
          </div>
        </div>

        {/* ── Aktiver Node Info ──────────────────────────────────── */}
        {activeNode && (
          <div style={{
            position:"absolute",
            bottom:`calc(max(28px,env(safe-area-inset-bottom,28px)) + 72px)`,
            left:"50%", transform:"translateX(-50%)",
            background:"rgba(20,30,26,0.92)",
            backdropFilter:"blur(14px)",
            borderRadius:20, padding:"11px 18px",
            border:`1px solid ${activeNode.color}33`,
            display:"flex", alignItems:"center", gap:10,
            boxShadow:`0 8px 28px rgba(0,0,0,0.30), 0 0 0 1px ${activeNode.glow}22`,
            animation:"cardUp 0.30s cubic-bezier(0.32,0.72,0,1) both",
            zIndex:20, whiteSpace:"nowrap",
          }}>
            <span style={{ fontSize:15 }}>{activeNode.icon}</span>
            <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>
              {activeNode.label}
            </div>
            <button className="ho-tap" onClick={() => {
              if (activeNode.isImpact) setImpactOpen(true);
              else                     setDetailNode(activeNode);
              setActiveNode(null);
            }} style={{
              background:activeNode.color, border:"none",
              borderRadius:12, padding:"6px 13px",
              fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer",
              boxShadow:`0 3px 10px ${activeNode.glow}`,
              marginLeft:4,
            }}>
              Öffnen {"›"}
            </button>
          </div>
        )}

        {/* ── Close Button ──────────────────────────────────────── */}
        <button
          className="ho-tap"
          onClick={onClose}
          aria-label="Schließen"
          style={{
            position:"absolute",
            bottom:`calc(max(22px,env(safe-area-inset-bottom,22px)) + 68px)`,
            left:"50%", transform:"translateX(-50%)",
            width:40, height:40, borderRadius:"50%",
            background:"rgba(255,255,255,0.10)",
            backdropFilter:"blur(8px)",
            border:"1.5px solid rgba(255,255,255,0.14)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:15, color:"rgba(255,255,255,0.55)",
            animation:"mantIn 0.6s 0.45s both",
          }}
        >{"✕"}</button>

        {/* ── Mantra unten ──────────────────────────────────────── */}
        <div style={{
          position:"absolute",
          bottom:`max(14px,env(safe-area-inset-bottom,14px))`,
          left:0, right:0, textAlign:"center",
          pointerEvents:"none",
          animation:"mantIn 0.8s 0.65s both",
        }}>
          <div style={{ fontSize:10.5, color:"rgba(255,255,255,0.20)",
            letterSpacing:0.4 }}>
            {"✦  Hier beginnt deine Wirkung  ✦"}
          </div>
        </div>

        {/* ── Hinweis ohne aktiven Node (mobil) ────────────────── */}
        {!activeNode && mounted && !isWide && (
          <div style={{
            position:"absolute",
            bottom:`calc(max(28px,env(safe-area-inset-bottom,28px)) + 72px)`,
            left:0, right:0, textAlign:"center",
            pointerEvents:"none",
            animation:"mantIn 0.6s 0.8s both",
          }}>
            <div style={{ fontSize:10.5, color:"rgba(255,255,255,0.28)",
              letterSpacing:0.3 }}>
              Tippe einen Bereich an
            </div>
          </div>
        )}
      </div>

      {/* ── Impact Detail (zeremoniell) ────────────────────────── */}
      {impactOpen && (
        <ImpactDetail
          onAction={handleAction}
          onClose={() => setImpactOpen(false)}
        />
      )}

      {/* ── Standard Detail Card ───────────────────────────────── */}
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
