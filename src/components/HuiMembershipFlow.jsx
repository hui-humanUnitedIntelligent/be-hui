/**
 * HuiMembershipFlow.jsx
 *
 * ZWECK: Freischaltung der HUI-Mitgliedschaft.
 * TRIGGER: Basis-User tippt auf den HUI-Button (Orb).
 * NICHT: allgemeines App-Onboarding oder Login-Intro.
 *
 * FLOW:
 *   Basis-User → tippt Orb → diese Journey → Zustimmung → Mitglied
 *   → Orb transformiert dauerhaft zum echten Orb
 *
 * 7 Screens + Welcome:
 *   1. Dein Fokus       — Auswahl Werke / Menschen / Beides
 *   2. Dein Talent      — Warme Atelier-Stimmung
 *   3. Gemeinschaft     — Community-Werte
 *   4. Deine Wirkung    — Impact / Sonnenuntergang
 *   5. Unsere Werte     — Echtheit, Respekt, Wachstum, Wirkung
 *   6. Fairness & Sicherheit
 *   7. Zustimmung       — AGB + "Zustimmen & Mitglied werden"
 *   8. Willkommen       — Orb-Glow, Reveal, "Du bist angekommen."
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../lib/AuthContext";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  teal:     "#16D7C5",
  tealDim:  "rgba(22,215,197,0.14)",
  tealGlow: "rgba(22,215,197,0.35)",
  coral:    "#FF8A6B",
  gold:     "#F5A623",
  white:    "#FFFFFF",
  off:      "rgba(255,255,255,0.88)",
  muted:    "rgba(255,255,255,0.52)",
  dim:      "rgba(255,255,255,0.28)",
  bg:       "#090D1A",
  glass:    "rgba(255,255,255,0.07)",
  border:   "rgba(255,255,255,0.10)",
};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const CSS = `
  @keyframes hmf-in      { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hmf-scale-in{ from{opacity:0;transform:scale(0.82)}      to{opacity:1;transform:scale(1)}      }
  @keyframes hmf-ken     { from{transform:scale(1)}   to{transform:scale(1.06)} }
  @keyframes hmf-pulse   { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
  @keyframes hmf-spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes hmf-dot     { 0%,100%{transform:scale(1);opacity:.35} 50%{transform:scale(1.5);opacity:1} }
  @keyframes hmf-shimmer { 0%{background-position:-300% 0} 100%{background-position:300% 0} }
  @keyframes hmf-blob1   { from{transform:translate(0,0) scale(1)} to{transform:translate(6%,8%) scale(1.12)} }
  @keyframes hmf-blob2   { from{transform:translate(0,0) scale(1)} to{transform:translate(-6%,-5%) scale(1.1)} }
`;

// ─── HUI Logo — exakt nach Brand-Referenz ─────────────────────────────────────
// Türkis-Coral Gradient Hintergrund, weißes Oval, "HUI" SVG-Zeichen
function HuiLogo({ size = 56, glow = false }) {
  const r = size * 0.22;
  return (
    <div style={{
      width: size, height: size, borderRadius: r, flexShrink: 0,
      background: "linear-gradient(135deg,#4ECDC4 0%,#16D7C5 45%,#FF8A6B 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: glow
        ? `0 0 ${size*.7}px rgba(22,215,197,.55),0 0 ${size*1.4}px rgba(22,215,197,.22)`
        : `0 4px 20px rgba(22,215,197,.32)`,
      position: "relative",
    }}>
      {/* Weißes Innen-Oval */}
      <div style={{
        width: size * .82, height: size * .82, borderRadius: r * .85,
        background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {/* SVG: H (drei Balken + U-Bogen) + i (Punkt + Schaft) + Coral-Kurve */}
        <svg width={size*.68} height={size*.58} viewBox="0 0 68 58" fill="none">
          <defs>
            <linearGradient id="hg" x1="0" y1="0" x2="68" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4ECDC4"/>
              <stop offset="100%" stopColor="#16D7C5"/>
            </linearGradient>
          </defs>
          {/* H — drei vertikale Säulen */}
          <rect x="2"  y="4" width="8.5" height="50" rx="4.25" fill="url(#hg)" opacity=".65"/>
          <rect x="14" y="4" width="8.5" height="50" rx="4.25" fill="url(#hg)" opacity=".82"/>
          <rect x="26" y="4" width="8.5" height="50" rx="4.25" fill="url(#hg)"/>
          {/* U-Bogen unter den H-Säulen */}
          <path d="M2 36 Q17 58 34 36" stroke="url(#hg)" strokeWidth="8.5" fill="none" strokeLinecap="round"/>
          {/* i — Punkt */}
          <circle cx="54" cy="8" r="6" fill="url(#hg)"/>
          {/* i — Schaft leicht geneigt */}
          <rect x="47.5" y="18" width="8.5" height="36" rx="4.25" fill="url(#hg)" transform="rotate(-7 47.5 18)"/>
          {/* Coral-Kurve rechts unten (Marken-Element) */}
          <path d="M37 54 Q51 65 64 48" stroke="#FF8A6B" strokeWidth="7" fill="none"
                strokeLinecap="round" opacity=".9"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div style={{ display:"flex", gap:4, width:"100%" }}>
      {Array.from({length: total}).map((_, i) => (
        <div key={i} style={{
          flex:1, height:3, borderRadius:2,
          background: i < current
            ? `linear-gradient(90deg,${T.teal},${T.coral})`
            : "rgba(255,255,255,0.16)",
          transition: "background 0.4s ease",
        }}/>
      ))}
    </div>
  );
}

// ─── Step Badge ───────────────────────────────────────────────────────────────
function StepBadge({ step, total, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
      <div style={{
        width:20, height:20, borderRadius:"50%",
        background: T.tealDim, border:`1px solid ${T.teal}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:10, fontWeight:700, color:T.teal,
      }}>{step}</div>
      <span style={{ fontSize:11, fontWeight:600, color:T.teal,
        letterSpacing:".08em", textTransform:"uppercase" }}>{label}</span>
      <span style={{ fontSize:11, color:T.muted, marginLeft:"auto" }}>{step}/{total}</span>
    </div>
  );
}

// ─── Hero Glow Panel (kein echtes Bild — cinematische CSS-Atmosphäre) ─────────
function HeroPanel({ gradient, glow, pill, pillColor = T.teal, height = "min(55vmax,320px)" }) {
  return (
    <div style={{ width:"100%", height, position:"relative", overflow:"hidden", flexShrink:0 }}>
      <div style={{ position:"absolute", inset:0, background:gradient }}/>
      {glow && (
        <div style={{
          position:"absolute", ...glow.pos,
          width:glow.w||180, height:glow.h||180, borderRadius:"50%",
          background:glow.color,
          animation:"hmf-pulse 4s ease-in-out infinite",
        }}/>
      )}
      {/* Pill Label */}
      {pill && (
        <div style={{
          position:"absolute", bottom:28, left:24,
          background:`${pillColor}20`, border:`1px solid ${pillColor}50`,
          borderRadius:20, padding:"4px 12px",
          fontSize:12, fontWeight:600, color:pillColor,
          backdropFilter:"blur(8px)",
        }}>● {pill}</div>
      )}
      {/* Fade unten */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0, height:90,
        background:`linear-gradient(to bottom,transparent,${T.bg})`,
      }}/>
    </div>
  );
}

// ─── Primary Button ───────────────────────────────────────────────────────────
function Btn({ onClick, children, disabled=false, coral=false }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onPointerDown={()=>setP(true)} onPointerUp={()=>setP(false)} onPointerLeave={()=>setP(false)}
      style={{
        width:"100%", padding:"18px 24px", borderRadius:16, border:"none",
        cursor: disabled ? "not-allowed" : "pointer", fontFamily:"inherit",
        fontSize:16, fontWeight:700, letterSpacing:-.2,
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        background: disabled ? "rgba(255,255,255,0.10)"
          : coral  ? `linear-gradient(135deg,${T.coral},#FF7055)`
          :          `linear-gradient(135deg,${T.teal},#0AB9AE)`,
        color: disabled ? T.muted : T.bg,
        opacity: disabled ? .55 : 1,
        transform: p ? "scale(0.97)" : "scale(1)",
        transition: "transform .12s ease, opacity .2s ease",
        boxShadow: disabled ? "none"
          : coral ? `0 8px 28px rgba(255,138,107,.38)`
          :         `0 8px 28px rgba(22,215,197,.38)`,
        WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
      }}>{children}</button>
  );
}

// ─── Select Card ──────────────────────────────────────────────────────────────
function SelectCard({ icon, title, subtitle, selected, onClick }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onClick}
      onPointerDown={()=>setP(true)} onPointerUp={()=>setP(false)} onPointerLeave={()=>setP(false)}
      style={{
        width:"100%", padding:"15px 16px", borderRadius:16, border:"none",
        background: selected ? "rgba(22,215,197,0.12)" : T.glass,
        outline: `1px solid ${selected ? T.teal : T.border}`,
        cursor:"pointer", textAlign:"left",
        display:"flex", alignItems:"center", gap:14,
        transform: p ? "scale(0.98)" : "scale(1)",
        transition:"all 0.2s ease",
        boxShadow: selected ? `0 0 0 1px ${T.teal},0 6px 20px rgba(22,215,197,.14)` : "none",
        WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
        fontFamily:"inherit",
      }}>
      <div style={{
        width:44, height:44, borderRadius:12, flexShrink:0, fontSize:22,
        background: selected ? "rgba(22,215,197,0.18)" : "rgba(255,255,255,0.07)",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"background 0.2s",
      }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:700, fontSize:15, color:T.white, marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:12, color:T.muted, lineHeight:1.4 }}>{subtitle}</div>
      </div>
      <div style={{
        width:22, height:22, borderRadius:"50%", flexShrink:0,
        border:`2px solid ${selected ? T.teal : "rgba(255,255,255,0.24)"}`,
        background: selected ? T.teal : "transparent",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all 0.2s",
      }}>
        {selected && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4.5L4 7.5L10 1.5" stroke={T.bg} strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </button>
  );
}

// ─── Animated Row ─────────────────────────────────────────────────────────────
function AnimRow({ icon, iconBg, title, subtitle, delay=0, slide="up" }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t=setTimeout(()=>setV(true),delay); return()=>clearTimeout(t); }, [delay]);
  return (
    <div style={{
      display:"flex", alignItems:"flex-start", gap:14,
      opacity:v?1:0,
      transform:v?"translate(0,0)": slide==="left"?"translateX(-16px)":"translateY(14px)",
      transition:"opacity .5s ease,transform .5s ease",
    }}>
      <div style={{
        width:42, height:42, borderRadius:12, flexShrink:0, fontSize:20,
        background: iconBg||T.tealDim,
        border:"1px solid rgba(22,215,197,0.2)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>{icon}</div>
      <div style={{ paddingTop:4 }}>
        {title && <div style={{ fontWeight:700, fontSize:15, color:T.white, marginBottom:3 }}>{title}</div>}
        <div style={{ fontSize:14, color:T.off, lineHeight:1.55 }}>{subtitle}</div>
      </div>
    </div>
  );
}

// ─── Legal Row ────────────────────────────────────────────────────────────────
function LegalRow({ label }) {
  const [p,setP]=useState(false);
  return (
    <div onPointerDown={()=>setP(true)} onPointerUp={()=>setP(false)} onPointerLeave={()=>setP(false)}
      style={{
        width:"100%", padding:"15px 18px", borderRadius:14,
        background: p?"rgba(255,255,255,0.09)":T.glass,
        border:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        cursor:"pointer",
        transform:p?"scale(0.98)":"scale(1)",
        transition:"all .15s ease",
        touchAction:"manipulation",
      }}>
      <span style={{ fontSize:15, color:T.off, fontWeight:500 }}>{label}</span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4L10 8L6 12" stroke="rgba(255,255,255,.38)" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ─── Atmospheric Background ───────────────────────────────────────────────────
function AtmoBg() {
  return (
    <>
      <div style={{ position:"absolute", top:"-20%", left:"-10%",
        width:"65%", height:"65%", borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle,rgba(22,215,197,.12) 0%,transparent 70%)",
        animation:"hmf-blob1 14s ease-in-out infinite alternate",
      }}/>
      <div style={{ position:"absolute", bottom:"0%", right:"-15%",
        width:"55%", height:"55%", borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle,rgba(255,138,107,.09) 0%,transparent 70%)",
        animation:"hmf-blob2 17s ease-in-out infinite alternate",
      }}/>
    </>
  );
}

// ─── Screen Wrapper ───────────────────────────────────────────────────────────
function Screen({ children, noScroll=false }) {
  return (
    <div style={{
      position:"absolute", inset:0,
      overflowY: noScroll?"hidden":"auto", overflowX:"hidden",
      WebkitOverflowScrolling:"touch",
      animation:"hmf-in .35s ease both",
      display: noScroll?"flex":undefined,
      flexDirection: noScroll?"column":undefined,
      alignItems: noScroll?"center":undefined,
      justifyContent: noScroll?"center":undefined,
    }}>{children}</div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 1 — Dein Fokus
// ══════════════════════════════════════════════════════════════════════════════
function S1({ onNext, data, setData }) {
  const opts = [
    { key:"works",       icon:"🎨", title:"Ich bringe Werke in die Welt",  subtitle:"Gemälde, Musik, Fotos, Objekte …" },
    { key:"experiences", icon:"✨", title:"Ich begleite Menschen",          subtitle:"Kurse, Events, Sessions, Reisen …" },
    { key:"hybrid",      icon:"🌿", title:"Ich tue beides",                 subtitle:"Werke schaffen und Menschen verbinden" },
  ];
  return (
    <Screen>
      <HeroPanel
        gradient="linear-gradient(135deg,#0A2A1A 0%,#0D3A20 40%,#1A4A2A 70%,#0A1A28 100%)"
        glow={{ pos:{top:"22%",left:"50%",transform:"translate(-50%,-50%)"},
          w:200,h:200,
          color:"radial-gradient(circle,rgba(245,166,35,.65) 0%,rgba(22,215,197,.38) 45%,transparent 72%)" }}
        pill="Dein Fokus"
      />
      <div style={{ padding:"0 22px 36px" }}>
        <div style={{ marginBottom:20 }}>
          <StepBadge step={1} total={7} label="Dein Fokus"/>
          <ProgressBar current={1} total={7}/>
        </div>
        <h1 style={{ fontWeight:900, fontSize:30, color:T.white, letterSpacing:-1,
          lineHeight:1.15, marginBottom:8 }}>Was beschreibt<br/>dich mehr?</h1>
        <p style={{ fontSize:15, color:T.muted, marginBottom:24, lineHeight:1.6 }}>
          Wähle deinen Weg — du kannst ihn später anpassen.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:28 }}>
          {opts.map(o=>(
            <SelectCard key={o.key} icon={o.icon} title={o.title} subtitle={o.subtitle}
              selected={data.focus===o.key} onClick={()=>setData(d=>({...d,focus:o.key}))}/>
          ))}
        </div>
        <Btn onClick={onNext} disabled={!data.focus}>Weiter →</Btn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 2 — Dein Talent
// ══════════════════════════════════════════════════════════════════════════════
function S2({ onNext }) {
  return (
    <Screen>
      <HeroPanel
        gradient="linear-gradient(135deg,#1A1208 0%,#2A1E10 55%,#1A1A28 100%)"
        glow={{ pos:{top:"22%",right:"18%"}, w:180, h:220,
          color:"radial-gradient(ellipse,rgba(245,166,35,.52) 0%,rgba(255,138,107,.28) 45%,transparent 72%)" }}
        pill="Dein Talent" pillColor={T.gold}
      />
      <div style={{ padding:"0 22px 40px" }}>
        <div style={{ marginBottom:20 }}>
          <StepBadge step={2} total={7} label="Dein Talent"/>
          <ProgressBar current={2} total={7}/>
        </div>
        <h1 style={{ fontWeight:900, fontSize:30, color:T.white, letterSpacing:-1,
          lineHeight:1.15, marginBottom:12 }}>Zeige, was<br/>in dir steckt</h1>
        <p style={{ fontSize:15, color:T.muted, lineHeight:1.7, marginBottom:32 }}>
          Teile Werke, Ideen, Erlebnisse und Momente.<br/>
          Dein Talent verdient eine Bühne.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:40 }}>
          {[
            { icon:"🎭", bg:"rgba(245,166,35,.10)", text:"Werke & Kreationen teilen" },
            { icon:"💫", bg:"rgba(245,166,35,.08)", text:"Deine eigene kreative Bühne" },
            { icon:"🤝", bg:"rgba(245,166,35,.08)", text:"Mit echten Menschen verbinden" },
          ].map((it,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14,
              animation:`hmf-in .5s ease ${i*.14}s both` }}>
              <div style={{ width:40,height:40,borderRadius:12,
                background:it.bg, border:"1px solid rgba(245,166,35,.22)",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>{it.icon}</div>
              <span style={{ fontSize:15, color:T.off, fontWeight:500 }}>{it.text}</span>
            </div>
          ))}
        </div>
        <Btn onClick={onNext}>Weiter →</Btn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 3 — Gemeinschaft
// ══════════════════════════════════════════════════════════════════════════════
function S3({ onNext }) {
  return (
    <Screen>
      <HeroPanel
        gradient="linear-gradient(135deg,#0E2820 0%,#1A3520 55%,#102030 100%)"
        glow={{ pos:{top:"30%",left:"30%"}, w:220, h:200,
          color:"radial-gradient(ellipse,rgba(22,215,197,.28) 0%,rgba(100,200,150,.18) 55%,transparent 78%)" }}
        pill="Gemeinschaft"
      />
      <div style={{ padding:"0 22px 40px" }}>
        <div style={{ marginBottom:20 }}>
          <StepBadge step={3} total={7} label="Gemeinschaft"/>
          <ProgressBar current={3} total={7}/>
        </div>
        <h1 style={{ fontWeight:900, fontSize:30, color:T.white, letterSpacing:-1,
          lineHeight:1.15, marginBottom:12 }}>Willkommen<br/>bei HUI</h1>
        <p style={{ fontSize:15, color:T.muted, lineHeight:1.7, marginBottom:28 }}>
          Eine Gemeinschaft für Menschen, Talente und echte Herzensprojekte.<br/>
          Hier zählt, wer du bist.
        </p>
        <div style={{
          background:"rgba(22,215,197,.06)", border:"1px solid rgba(22,215,197,.12)",
          borderRadius:20, padding:"20px 18px", marginBottom:36,
          display:"flex", flexDirection:"column", gap:14,
        }}>
          {[
            ["🌱","Echte Menschen, echte Begegnungen"],
            ["💡","Kreativität ohne Wettbewerb"],
            ["🌍","Gemeinsam etwas bewegen"],
          ].map(([e,t],i)=>(
            <div key={i} style={{ display:"flex",alignItems:"center",gap:12,
              animation:`hmf-in .5s ease ${i*.12}s both` }}>
              <span style={{ fontSize:20 }}>{e}</span>
              <span style={{ fontSize:15, color:T.off }}>{t}</span>
            </div>
          ))}
        </div>
        <Btn onClick={onNext}>Weiter →</Btn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 4 — Deine Wirkung
// ══════════════════════════════════════════════════════════════════════════════
function S4({ onNext }) {
  return (
    <Screen>
      <HeroPanel
        gradient="linear-gradient(175deg,#0A1A2A 0%,#1A1208 35%,#2A1208 65%,#1A0A18 100%)"
        glow={{ pos:{bottom:"22%",left:"50%",transform:"translateX(-50%)"},
          w:260, h:160,
          color:"radial-gradient(ellipse,rgba(245,100,35,.82) 0%,rgba(245,166,35,.5) 30%,rgba(255,50,100,.18) 65%,transparent 82%)" }}
        pill="Deine Wirkung" pillColor={T.coral}
      />
      <div style={{ padding:"0 22px 40px" }}>
        <div style={{ marginBottom:20 }}>
          <StepBadge step={4} total={7} label="Deine Wirkung"/>
          <ProgressBar current={4} total={7}/>
        </div>
        <h1 style={{ fontWeight:900, fontSize:28, color:T.white, letterSpacing:-.8,
          lineHeight:1.2, marginBottom:28 }}>Bereit, deine Wirkung<br/>zu entfalten?</h1>
        <div style={{ display:"flex", flexDirection:"column", gap:18, marginBottom:40 }}>
          {[
            { icon:"🌿", bg:"rgba(78,205,196,.12)", bd:"rgba(78,205,196,.2)",  t:"Teile dein Talent mit der Welt" },
            { icon:"❤️", bg:"rgba(255,107,107,.12)", bd:"rgba(255,107,107,.2)", t:"Verbinde dich mit echten Menschen" },
            { icon:"✦",  bg:"rgba(245,166,35,.12)", bd:"rgba(245,166,35,.2)",  t:"Bewirke gemeinsam Großes" },
          ].map((it,i)=>(
            <div key={i} style={{ display:"flex",alignItems:"center",gap:16,
              animation:`hmf-in .5s ease ${i*.15}s both` }}>
              <div style={{ width:44,height:44,borderRadius:14,flexShrink:0,fontSize:20,
                background:it.bg,border:`1px solid ${it.bd}`,
                display:"flex",alignItems:"center",justifyContent:"center" }}>{it.icon}</div>
              <span style={{ fontSize:16,color:T.off,fontWeight:500 }}>{it.t}</span>
            </div>
          ))}
        </div>
        <Btn onClick={onNext}>Los geht's →</Btn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 5 — Unsere Werte
// ══════════════════════════════════════════════════════════════════════════════
function S5({ onNext }) {
  return (
    <Screen>
      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 22px 40px" }}>
        <div style={{ marginBottom:24 }}>
          <StepBadge step={5} total={7} label="Unsere Werte"/>
          <ProgressBar current={5} total={7}/>
        </div>
        <h1 style={{ fontWeight:900,fontSize:32,color:T.white,letterSpacing:-1,lineHeight:1.15,marginBottom:8 }}>
          Wofür wir stehen
        </h1>
        <p style={{ fontSize:15,color:T.muted,marginBottom:36,lineHeight:1.6 }}>
          Diese Werte tragen uns gemeinsam.
        </p>
        <div style={{ display:"flex",flexDirection:"column",gap:22,marginBottom:44 }}>
          <AnimRow icon="🤍" title="Echtheit"  subtitle="Sei du selbst. Immer."                     delay={80}/>
          <AnimRow icon="🤝" title="Respekt"   subtitle="Wir begegnen uns auf Augenhöhe."            delay={200}/>
          <AnimRow icon="🌱" title="Wachstum"  subtitle="Wir inspirieren und entwickeln uns."        delay={320}/>
          <AnimRow icon="🎯" title="Wirkung"   subtitle="Wir schaffen echten Mehrwert."              delay={440}/>
        </div>
        <div style={{ height:1,marginBottom:32,
          background:`linear-gradient(90deg,transparent,${T.teal}40,transparent)` }}/>
        <Btn onClick={onNext}>Weiter →</Btn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 6 — Fairness & Sicherheit
// ══════════════════════════════════════════════════════════════════════════════
function S6({ onNext }) {
  return (
    <Screen>
      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 22px 40px" }}>
        <div style={{ marginBottom:24 }}>
          <StepBadge step={6} total={7} label="Fairness & Sicherheit"/>
          <ProgressBar current={6} total={7}/>
        </div>
        <h1 style={{ fontWeight:900,fontSize:30,color:T.white,letterSpacing:-.8,lineHeight:1.2,marginBottom:12 }}>
          Ein sicherer Raum<br/>für alle
        </h1>
        <p style={{ fontSize:15,color:T.muted,marginBottom:36,lineHeight:1.6 }}>
          HUI ist ein Ort des Vertrauens.
        </p>
        <div style={{ display:"flex",flexDirection:"column",gap:22,marginBottom:36 }}>
          <AnimRow icon="🛡️" slide="left" subtitle="Wir schützen deine Daten und deine Privatsphäre."                    delay={80}/>
          <AnimRow icon="🔒" slide="left" subtitle="Wir dulden keine Diskriminierung, Hass oder Belästigung."             delay={200}/>
          <AnimRow icon="⚙️" slide="left" subtitle="Du hast die Kontrolle über deine Inhalte und Sichtbarkeit."          delay={320}/>
        </div>
        {/* Trust Badge */}
        <div style={{
          background:"rgba(22,215,197,.06)",border:"1px solid rgba(22,215,197,.15)",
          borderRadius:16,padding:"16px 18px",
          display:"flex",alignItems:"center",gap:12,marginBottom:36,
        }}>
          <div style={{ fontSize:24 }}>✦</div>
          <div>
            <div style={{ fontWeight:700,fontSize:14,color:T.teal }}>Community-Versprechen</div>
            <div style={{ fontSize:13,color:T.muted,lineHeight:1.5 }}>
              Wir bauen HUI gemeinsam auf Vertrauen und Respekt.
            </div>
          </div>
        </div>
        <Btn onClick={onNext}>Weiter →</Btn>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 7 — Zustimmung (AGB)
// ══════════════════════════════════════════════════════════════════════════════
function S7({ onNext, data, setData }) {
  const agreed = data.agbAll;
  const toggle = () => setData(d=>({...d,agbAll:!d.agbAll}));

  return (
    <Screen>
      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 22px 40px" }}>
        <div style={{ marginBottom:24 }}>
          <StepBadge step={7} total={7} label="Deine Zustimmung"/>
          <ProgressBar current={7} total={7}/>
        </div>
        <h1 style={{ fontWeight:900,fontSize:28,color:T.white,letterSpacing:-.8,lineHeight:1.2,marginBottom:10 }}>
          Gemeinsam gestalten<br/>wir HUI
        </h1>
        <p style={{ fontSize:15,color:T.muted,marginBottom:28,lineHeight:1.6 }}>
          Bitte lies unsere Bedingungen sorgfältig durch und stimm zu,
          um Teil der HUI-Gemeinschaft zu werden.
        </p>
        {/* Dokumente */}
        <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:22 }}>
          <LegalRow label="AGBs (Allgemeine Geschäftsbedingungen)"/>
          <LegalRow label="Datenschutzerklärung"/>
          <LegalRow label="Community-Richtlinien"/>
        </div>

        {/* Emotionale Checkbox */}
        <button onClick={toggle} style={{
          width:"100%",padding:"17px 18px",borderRadius:16,border:"none",
          background: agreed?"rgba(22,215,197,.10)":"rgba(255,255,255,0.04)",
          outline:`1.5px solid ${agreed?T.teal:T.border}`,
          display:"flex",alignItems:"flex-start",gap:14,
          cursor:"pointer",textAlign:"left",
          transition:"all .25s ease",
          boxShadow: agreed?`0 0 0 1px rgba(22,215,197,.28),0 6px 22px rgba(22,215,197,.12)`:"none",
          WebkitTapHighlightColor:"transparent",touchAction:"manipulation",
          fontFamily:"inherit",marginBottom:24,
        }}>
          {/* Custom Checkbox */}
          <div style={{
            width:24,height:24,borderRadius:7,flexShrink:0,marginTop:1,
            border:`2px solid ${agreed?T.teal:"rgba(255,255,255,.3)"}`,
            background: agreed?T.teal:"transparent",
            display:"flex",alignItems:"center",justifyContent:"center",
            transition:"all .2s",
          }}>
            {agreed&&(
              <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                <path d="M1.5 5L5 8.5L11.5 1.5" stroke={T.bg} strokeWidth="2.2"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ fontSize:15,color:agreed?T.off:T.muted,lineHeight:1.55 }}>
            Ich habe die Bedingungen gelesen und stimme zu.
          </span>
        </button>

        <Btn onClick={onNext} disabled={!agreed}>
          Zustimmen &amp; Mitglied werden
        </Btn>

        {agreed&&(
          <p style={{ textAlign:"center",fontSize:12,color:T.muted,
            marginTop:12,lineHeight:1.5,animation:"hmf-in .4s ease both" }}>
            Du wirst Teil einer besonderen Gemeinschaft. 🌿
          </p>
        )}
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SCREEN 8 — Willkommen (Success)
// ══════════════════════════════════════════════════════════════════════════════
function S8({ onDone }) {
  const [ph, setPh] = useState(0);
  const t = useRef(null);
  useEffect(()=>{
    t.current = setTimeout(()=>setPh(1),350);
    return()=>clearTimeout(t.current);
  },[]);

  return (
    <Screen noScroll>
      <div style={{ textAlign:"center", padding:"0 28px max(44px,env(safe-area-inset-bottom,44px))" }}>
        {/* Logo Orb mit Glow-Aura */}
        <div style={{
          position:"relative", marginBottom:36, display:"inline-block",
          opacity:ph?1:0, transform:ph?"scale(1)":"scale(.65)",
          transition:"all .85s cubic-bezier(.34,1.56,.64,1)",
        }}>
          {/* Äußerer Glow */}
          <div style={{
            position:"absolute",inset:-32,borderRadius:"50%",
            background:"radial-gradient(circle,rgba(22,215,197,.28) 0%,rgba(255,138,107,.14) 55%,transparent 75%)",
            animation:"hmf-pulse 3.2s ease-in-out infinite",
          }}/>
          {/* Drehender Ring */}
          <div style={{
            position:"absolute",inset:-10,border:"1px solid rgba(22,215,197,.22)",
            borderRadius:"50%",animation:"hmf-spin 22s linear infinite",
          }}/>
          <HuiLogo size={96} glow/>
        </div>

        {/* Text */}
        <div style={{
          opacity:ph?1:0, transform:ph?"translateY(0)":"translateY(20px)",
          transition:"all .65s ease .32s",
        }}>
          <div style={{ fontSize:30,marginBottom:10 }}>🎉</div>
          <h1 style={{ fontWeight:900,fontSize:28,color:T.white,letterSpacing:-.8,
            lineHeight:1.2,marginBottom:14 }}>
            Willkommen in der<br/>HUI-Gemeinschaft!
          </h1>
          <p style={{ fontSize:16,color:T.muted,lineHeight:1.7,marginBottom:44,
            maxWidth:280,margin:"0 auto 44px" }}>
            Schön, dass du da bist.<br/>Gemeinsam schaffen wir etwas Besonderes.
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display:"flex",gap:24,justifyContent:"center",marginBottom:44,
          opacity:ph?1:0,transform:ph?"translateY(0)":"translateY(14px)",
          transition:"all .6s ease .5s",
        }}>
          {[["1.000+","Kreative"],["∞","Möglichkeiten"],["1","Gemeinschaft"]].map(([n,l],i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ fontWeight:900,fontSize:22,color:T.teal }}>{n}</div>
              <div style={{ fontSize:12,color:T.muted,marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          width:"100%", maxWidth:320, margin:"0 auto",
          opacity:ph?1:0,transform:ph?"translateY(0)":"translateY(14px)",
          transition:"all .6s ease .7s",
        }}>
          <Btn onClick={onDone}>Los geht's →</Btn>
        </div>

        {/* Shimmer line */}
        <div style={{
          width:60,height:2,borderRadius:999,margin:"24px auto 0",
          background:`linear-gradient(90deg,transparent,${T.teal},transparent)`,
          backgroundSize:"300% 100%",animation:"hmf-shimmer 1.8s ease infinite",
          opacity:ph?1:0,transition:"opacity .6s ease .9s",
        }}/>
      </div>
    </Screen>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export default function HuiMembershipFlow({ onComplete, onClose }) {
  const { activateMembership, refreshProfile, activateTalentProfile } = useAuth();

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState({ focus: null, agbAll: false });

  const TOTAL = 7;

  const next = useCallback(() => setStep(s => Math.min(s+1, 8)), []);

  // Screen 7 → 8: Mitgliedschaft in DB aktivieren, dann Welcome zeigen
  const handleFinish = useCallback(async () => {
    if (!data.agbAll || loading) return;
    setLoading(true);
    try {
      await activateMembership();
      // Fokus in Profil speichern (non-blocking)
      if (data.focus && activateTalentProfile) {
        activateTalentProfile(data.focus).catch(()=>{});
      }
      refreshProfile?.().catch(()=>{});
    } catch(e) {/* silent */} finally {
      setLoading(false);
    }
    setStep(8);
  }, [data, loading, activateMembership, activateTalentProfile, refreshProfile]);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9800,
      background:T.bg, overflow:"hidden",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      <style>{CSS}</style>
      <AtmoBg/>

      {/* Schließen — nur sichtbar auf ersten Screens, dezent */}
      {step < 7 && (
        <button onClick={onClose} style={{
          position:"absolute", top:"max(16px,env(safe-area-inset-top,16px))", right:20,
          zIndex:10, background:"rgba(255,255,255,0.08)",
          border:"1px solid rgba(255,255,255,0.12)",
          borderRadius:"50%", width:36, height:36,
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", WebkitTapHighlightColor:"transparent",
          touchAction:"manipulation", color:T.muted, fontSize:16,
        }}>✕</button>
      )}

      {/* Screens */}
      {step===1 && <S1 onNext={next}         data={data} setData={setData}/>}
      {step===2 && <S2 onNext={next}/>}
      {step===3 && <S3 onNext={next}/>}
      {step===4 && <S4 onNext={next}/>}
      {step===5 && <S5 onNext={next}/>}
      {step===6 && <S6 onNext={next}/>}
      {step===7 && <S7 onNext={handleFinish} data={data} setData={setData}/>}
      {step===8 && <S8 onDone={()=>onComplete?.()}/>}

      {/* Loading Overlay (während DB-Write) */}
      {loading && (
        <div style={{
          position:"absolute",inset:0,zIndex:20,
          background:"rgba(9,13,26,.72)",backdropFilter:"blur(8px)",
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <div style={{
            width:40,height:40,borderRadius:"50%",
            border:"3px solid rgba(255,255,255,.12)",
            borderTopColor:T.teal,
            animation:"hmf-spin .8s linear infinite",
          }}/>
        </div>
      )}
    </div>
  );
}
