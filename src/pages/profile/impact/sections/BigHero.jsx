import React from "react";
import { T } from "../tokens.js";

const HERO_IMG = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000&q=92";

export function BigHero({ stats, pool }) {
  return (
    <div style={{
      position:"relative", overflow:"hidden", minHeight:320,
      background:`linear-gradient(172deg,#FCF0DE 0%,#F8EFE0 50%,#F3E9D6 100%)`,
    }}>
      {/* Hintergrundbild — rechte Hälfte */}
      <div style={{
        position:"absolute", top:0, right:0, width:"52%", height:"100%",
        overflow:"hidden",
      }}>
        <img src={HERO_IMG} alt="" loading="eager" decoding="sync" style={{
          width:"100%", height:"100%", objectFit:"cover",
          objectPosition:"center",
          filter:"saturate(0.82) brightness(0.90)",
        }}/>
        {/* Gradient-Überblendung nach links */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to right,#FCF0DE 0%,rgba(252,240,222,0.6) 35%,transparent 70%)",
        }}/>
      </div>

      {/* Content — linke Hälfte */}
      <div style={{ position:"relative", zIndex:2, padding:"52px 22px 48px", maxWidth:"56%" }}>
        {/* Badge */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:7,
          background:`${T.teal}18`, border:`1px solid ${T.teal}28`,
          borderRadius:99, padding:"5px 13px", marginBottom:18 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal,
            animation:"ipPulse 2s ease-in-out infinite" }}/>
          <span style={{ fontSize:10, fontWeight:800, color:T.teal,
            letterSpacing:"0.14em", textTransform:"uppercase" }}>HUI Impact Pool</span>
        </div>

        {/* Headline — groß + emotional */}
        <h1 style={{ margin:"0 0 14px", fontSize:30, fontWeight:900,
          lineHeight:1.15, letterSpacing:"-0.028em", color:T.ink }}>
          Gemeinsam<br/>
          <span style={{ color:T.teal }}>Wirkung</span> schaffen.
        </h1>

        <p style={{ margin:"0 0 8px", fontSize:14, color:T.ink2, lineHeight:1.7, maxWidth:280 }}>
          Jede Buchung auf HUI hilft dabei, echte Herzensprojekte möglich zu machen.
        </p>

        <p style={{ margin:"0 0 28px", fontSize:14, fontWeight:700, color:T.teal }}>
          Kein Projekt geht leer aus.
        </p>

        {/* Handschrift-Stil Spruch (wie Screenshot) */}
        <div style={{
          position:"absolute", top:28, right:"-48%",
          fontFamily:"'Georgia',serif",
          fontSize:13, color:T.ink2, fontStyle:"italic",
          lineHeight:1.5, maxWidth:160, textAlign:"center",
          transform:"rotate(-4deg)",
          opacity:0.75,
          pointerEvents:"none",
        }}>
          Deine Entscheidungen<br/>
          <span style={{ fontWeight:700, color:T.ink }}>bewegen echte Projekte.</span>
          <div style={{
            marginTop:4, borderBottom:`1.5px solid ${T.teal}`,
            width:80, margin:"8px auto 0",
          }}/>
        </div>
      </div>

      {/* LIVE-Ticker unten */}
      <div style={{
        position:"relative", zIndex:2,
        display:"flex", alignItems:"center", gap:8,
        padding:"10px 22px",
        background:"rgba(13,196,181,0.08)",
        borderTop:`1px solid ${T.teal}20`,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.teal,
            animation:"ipPulse 1.4s ease-in-out infinite" }}/>
          <span style={{ fontSize:10, fontWeight:800, color:T.teal, letterSpacing:"0.1em" }}>LIVE</span>
        </div>
        <span style={{ fontSize:12, color:T.ink2 }}>
          Der Impact Pool wächst gerade durch neue Buchungen
        </span>
      </div>
    </div>
  );
}
