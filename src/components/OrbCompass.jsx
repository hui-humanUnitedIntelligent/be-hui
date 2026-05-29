// src/components/OrbCompass.jsx — HUI Begegnungs-Kompass v1
// "Welche Welt möchtest du heute entdecken?"
// ═══════════════════════════════════════════════════════════════
// Reference: screenshot 2026-05-29, verbindlich 1:1
//
// Flow A — Themenwelt wählen:
//   Tap on Natur/Kreativität/Gemeinschaft/Tiere/Wirkung
//   → Orb closes
//   → Feed filters to that world
//   → Active pill shown at top of feed
//
// Flow B — HUI-Moment (only Talents):
//   Tap on center HUI-Logo
//   → MomentSheet opens
//   → Foto / Video / Gedanke / Einblick options
//   → Caption + visibility + "Moment teilen" button
//   → "Verschwindet nach 24 Stunden"
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";

// ── Design tokens ────────────────────────────────────────────────
const T = {
  bg:       "#F4F8F6",
  teal:     "#1B8A7A",
  tealMid:  "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.12)",
  tealGlow: "rgba(14,196,184,0.30)",
  ink:      "#1A2E2A",
  inkSoft:  "rgba(26,46,42,0.55)",
  inkFaint: "rgba(26,46,42,0.30)",
  border:   "rgba(26,46,42,0.10)",
  white:    "#FFFFFF",
  r12:12, r16:16, r20:20, r24:24, r99:99,
  card:     "0 2px 14px rgba(26,46,42,0.08), 0 1px 4px rgba(26,46,42,0.05)",
  sheet:    "0 -12px 48px rgba(26,46,42,0.14)",
};

const CSS = `
  .orc-overlay {
    position:fixed; inset:0; z-index:9200;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
  }
  .orc-bg {
    position:absolute; inset:0;
    background:linear-gradient(160deg,rgba(230,242,238,0.97) 0%,rgba(214,236,230,0.97) 100%);
    backdrop-filter:blur(16px);
  }
  .orc-content {
    position:relative; z-index:1;
    display:flex; flex-direction:column; align-items:center;
    width:100%; max-width:390px; padding:0 24px;
  }
  @keyframes orc-in    { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
  @keyframes orc-out   { from{opacity:1;transform:scale(1)}   to{opacity:0;transform:scale(0.94)} }
  @keyframes orc-world { from{opacity:0;transform:scale(0.82) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes orc-sheet { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes orc-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(14,196,184,0.4)} 50%{box-shadow:0 0 0 14px rgba(14,196,184,0)} }
  .orc-enter { animation:orc-in .28s cubic-bezier(.22,1,.36,1) both; }
  .orc-exit  { animation:orc-out .22s cubic-bezier(.22,1,.36,1) both; }
  .orc-world-node { animation:orc-world .35s cubic-bezier(.22,1,.36,1) both; }
  .orc-sheet-el { animation:orc-sheet .28s cubic-bezier(.22,1,.36,1) both; }
  .orc-orb-pulse { animation:orc-pulse 2.8s ease-in-out infinite; }
  .orc-press { transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s; }
  .orc-press:active { transform:scale(0.89); opacity:0.72; }
  .orc-press-light { transition:transform .14s ease,opacity .14s; }
  .orc-press-light:active { transform:scale(0.95); opacity:0.80; }
`;

// ── World definitions ─────────────────────────────────────────────
const WORLDS = [
  { id:"natur",       label:"Natur",       icon:"🌿", bg:"#3A7D44", glyph:"leaf",     deg:270, r:118 },
  { id:"kreativitaet",label:"Kreativität", icon:"🎨", bg:"#C04B2A", glyph:"palette",  deg:22,  r:118 },
  { id:"gemeinschaft",label:"Gemeinschaft",icon:"🤝", bg:"#D4820A", glyph:"people",   deg:218, r:118 },
  { id:"tiere",       label:"Tiere",       icon:"🐾", bg:"#1B8A7A", glyph:"paw",      deg:140, r:118 },
  { id:"wirkung",     label:"Wirkung",     icon:"🌍", bg:"#2B5BA8", glyph:"globe",    deg:160, r:118 },
];

// polar → cartesian (deg 0 = top)
function polar(deg, r) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

// ── World Node ────────────────────────────────────────────────────
function WorldNode({ w, i, onSelect }) {
  const pos = polar(w.deg, w.r);
  return (
    <div
      className="orc-world-node orc-press"
      onClick={() => onSelect(w)}
      style={{
        position:"absolute",
        left:"50%", top:"50%",
        transform:`translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
        display:"flex", flexDirection:"column", alignItems:"center", gap:7,
        cursor:"pointer", touchAction:"manipulation",
        animationDelay:`${i * 45}ms`,
        userSelect:"none",
      }}
    >
      {/* Circle icon */}
      <div style={{
        width:54, height:54, borderRadius:"50%",
        background:w.bg,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:24,
        boxShadow:`0 4px 16px rgba(0,0,0,0.18), 0 0 0 3px rgba(255,255,255,0.55)`,
      }}>{w.icon}</div>
      <span style={{
        fontSize:12.5, fontWeight:700, color:T.ink,
        textShadow:"0 1px 4px rgba(255,255,255,0.8)",
        letterSpacing:"-0.01em",
      }}>{w.label}</span>
    </div>
  );
}

// ── Center HUI Orb ────────────────────────────────────────────────
function CenterOrb({ isTalent, onMoment }) {
  return (
    <div className="orc-press" onClick={onMoment}
      style={{ position:"relative", cursor:isTalent?"pointer":"default", touchAction:"manipulation" }}>
      {/* Glow ring */}
      <div className="orc-orb-pulse" style={{
        width:72, height:72, borderRadius:"50%",
        background:`conic-gradient(from 0deg, ${T.tealMid}, #FF6B52, ${T.tealMid})`,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:`0 6px 28px rgba(14,196,184,0.38)`,
      }}>
        {/* Inner white ring */}
        <div style={{
          width:62, height:62, borderRadius:"50%",
          background:T.white,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"inset 0 1px 6px rgba(0,0,0,0.06)",
        }}>
          {/* HUI Logo — stylized */}
          <div style={{
            width:48, height:48, borderRadius:"50%",
            background:`linear-gradient(135deg, ${T.tealMid} 0%, #0DBBAF 100%)`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <span style={{ fontSize:22, fontWeight:900, color:"white",
              fontFamily:"system-ui", letterSpacing:"-0.05em" }}>hui</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Compass Screen ────────────────────────────────────────────────
function CompassScreen({ isTalent, onSelectWorld, onMoment, onClose, closing }) {
  return (
    <div className={`orc-overlay ${closing ? "orc-exit" : "orc-enter"}`}>
      <style>{CSS}</style>
      <div className="orc-bg" onClick={onClose}/>

      {/* Close button */}
      <button className="orc-press" onClick={onClose} style={{
        position:"absolute", top:"max(52px,calc(44px + env(safe-area-inset-top,0px)))", left:20,
        width:34, height:34, borderRadius:"50%",
        background:"rgba(255,255,255,0.75)", backdropFilter:"blur(8px)",
        border:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:18, color:T.ink, cursor:"pointer", touchAction:"manipulation",
        boxShadow:T.card,
      }}>×</button>

      <div className="orc-content">
        {/* Title */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{
            fontSize:26, fontWeight:800, color:T.ink,
            letterSpacing:"-0.04em", lineHeight:1.2, marginBottom:10,
          }}>Wonach suchst<br/>du heute?</div>
          <div style={{
            fontSize:13.5, color:T.inkSoft, lineHeight:1.65, fontWeight:400,
            maxWidth:260, margin:"0 auto",
          }}>
            Wähle einen Bereich oder tippe<br/>
            in die Mitte, um einen Moment<br/>
            zu teilen.
          </div>
        </div>

        {/* Compass orbit area */}
        <div style={{
          position:"relative", width:300, height:300,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {/* Subtle connection circle */}
          <div style={{
            position:"absolute", inset:0, borderRadius:"50%",
            border:`1.5px dashed rgba(26,46,42,0.12)`,
          }}/>

          {/* World nodes */}
          {WORLDS.map((w,i)=>(
            <WorldNode key={w.id} w={w} i={i} onSelect={onSelectWorld}/>
          ))}

          {/* Center HUI orb */}
          <CenterOrb isTalent={isTalent} onMoment={isTalent ? onMoment : undefined}/>
        </div>

        {/* Hint below orb */}
        {isTalent && (
          <div style={{
            marginTop:24, textAlign:"center",
            fontSize:12.5, color:T.inkSoft, lineHeight:1.6,
          }}>
            In die Mitte tippen,<br/>um einen<br/>
            <span style={{ fontWeight:700, color:T.teal }}>HUI-Moment</span><br/>
            zu teilen
          </div>
        )}
      </div>
    </div>
  );
}

// ── HUI-Moment Sheet ──────────────────────────────────────────────
const MOMENT_TYPES = [
  { id:"foto",    icon:"📷", label:"Foto"     },
  { id:"video",   icon:"🎥", label:"Video"    },
  { id:"gedanke", icon:"✍️",  label:"Gedanke"  },
  { id:"einblick",icon:"🌿", label:"Einblick" },
];

const PREVIEW_IMG = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80";

function MomentSheet({ onClose, onShare }) {
  const [type,     setType]     = useState("foto");
  const [caption,  setCaption]  = useState("");
  const [vis,      setVis]      = useState("Meine Follower");
  const [imgOk,    setImgOk]    = useState(false);
  const [sharing,  setSharing]  = useState(false);
  const [shared,   setShared]   = useState(false);

  const handleShare = async () => {
    setSharing(true);
    // In production: insert into stories table
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("stories").insert({
          user_id:    user.id,
          caption:    caption.trim() || null,
          type:       type,
          status:     "active",
          expires_at: new Date(Date.now() + 24*60*60*1000).toISOString(),
        });
      }
    } catch(e) { console.warn("moment share:", e); }
    setSharing(false);
    setShared(true);
    setTimeout(()=>onShare?.(), 1400);
  };

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9400,
      background:"rgba(26,46,42,0.45)", backdropFilter:"blur(8px)",
      display:"flex", alignItems:"flex-end",
    }}>
      <div className="orc-sheet-el" onClick={e=>e.stopPropagation()} style={{
        width:"100%", background:T.white,
        borderRadius:"24px 24px 0 0",
        padding:"0 0 max(32px,calc(20px + env(safe-area-inset-bottom,0px)))",
        boxShadow:T.sheet, maxHeight:"92vh", overflowY:"auto",
      }}>
        {/* Handle */}
        <div style={{ padding:"14px 20px 0" }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,46,42,0.15)", margin:"0 auto 20px" }}/>
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:T.ink, letterSpacing:"-0.03em", marginBottom:3 }}>
                Teile einen Moment
              </div>
              <div style={{ fontSize:13, color:T.inkSoft }}>Zeige, was dich gerade bewegt.</div>
            </div>
            <button className="orc-press" onClick={onClose} style={{
              width:30, height:30, borderRadius:"50%",
              background:"rgba(26,46,42,0.07)", border:"none",
              fontSize:16, color:T.ink, cursor:"pointer", touchAction:"manipulation",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0,
            }}>×</button>
          </div>
        </div>

        <div style={{ padding:"16px 20px 0" }}>
          {/* Type selector */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:18 }}>
            {MOMENT_TYPES.map(mt=>(
              <button key={mt.id} className="orc-press-light" onClick={()=>setType(mt.id)} style={{
                display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                padding:"12px 6px", borderRadius:T.r12,
                background: type===mt.id ? T.tealSoft : "rgba(26,46,42,0.04)",
                border:`1.5px solid ${type===mt.id ? T.tealMid : "rgba(26,46,42,0.10)"}`,
                cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
                transition:"all .18s ease",
              }}>
                <span style={{ fontSize:20 }}>{mt.icon}</span>
                <span style={{ fontSize:11.5, fontWeight:700, color:type===mt.id?T.teal:T.ink }}>{mt.label}</span>
              </button>
            ))}
          </div>

          {/* Preview image (for foto/video/einblick) */}
          {(type==="foto"||type==="video"||type==="einblick") && (
            <div style={{ position:"relative", width:"100%", borderRadius:T.r16, overflow:"hidden",
              marginBottom:14, background:"rgba(26,46,42,0.06)",
              aspectRatio:"16/9", maxHeight:200 }}>
              {!imgOk && <div style={{
                position:"absolute",inset:0,
                background:"linear-gradient(90deg,rgba(26,46,42,.05) 25%,rgba(26,46,42,.09) 50%,rgba(26,46,42,.05) 75%)",
                backgroundSize:"200% 100%",
              }}/>}
              <img src={PREVIEW_IMG} alt="" onLoad={()=>setImgOk(true)} onError={()=>setImgOk(true)}
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
                  opacity:imgOk?1:0, transition:"opacity .6s ease" }}/>
              <button className="orc-press" style={{
                position:"absolute", top:8, right:8,
                width:26, height:26, borderRadius:"50%",
                background:"rgba(255,255,255,0.88)", backdropFilter:"blur(6px)",
                border:"none", fontSize:13, color:T.ink,
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", touchAction:"manipulation",
              }}>×</button>
            </div>
          )}

          {/* Caption textarea */}
          <div style={{
            background:"rgba(26,46,42,0.04)", borderRadius:T.r12,
            border:"1px solid rgba(26,46,42,0.09)",
            marginBottom:14,
          }}>
            <textarea
              value={caption}
              onChange={e=>setCaption(e.target.value.slice(0,240))}
              placeholder={
                type==="gedanke"
                  ? "Was bewegt dich gerade?"
                  : "Gerade entsteht etwas Neues in meinem Atelier.\nDie Farben, das Licht, die Stille – einfach magisch."
              }
              style={{
                width:"100%", minHeight:72, border:"none", outline:"none",
                background:"transparent", padding:"12px 14px",
                fontSize:13.5, color:T.ink, lineHeight:1.65,
                resize:"none", fontFamily:"-apple-system,'Georgia',serif",
                fontStyle:"italic", boxSizing:"border-box",
              }}
            />
          </div>

          {/* Visibility selector */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"12px 14px", borderRadius:T.r12,
            border:"1px solid rgba(26,46,42,0.09)",
            background:"rgba(26,46,42,0.03)", marginBottom:20,
            cursor:"pointer", touchAction:"manipulation",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:14 }}>🌿</span>
              <span style={{ fontSize:13, color:T.inkSoft, fontWeight:500 }}>
                Sichtbar für: <span style={{ color:T.ink, fontWeight:700 }}>{vis}</span>
              </span>
            </div>
            <span style={{ fontSize:13, color:T.inkFaint }}>▾</span>
          </div>

          {/* Share button */}
          <button className="orc-press" onClick={handleShare} disabled={sharing||shared} style={{
            width:"100%", padding:"16px", borderRadius:T.r16,
            border:"none",
            background: shared
              ? "linear-gradient(135deg,#22c55e,#16a34a)"
              : `linear-gradient(135deg,${T.teal},#0A6B61)`,
            color:"white", fontSize:15.5, fontWeight:800,
            touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:`0 6px 24px rgba(14,196,184,0.38)`,
            letterSpacing:"-0.01em",
            opacity: sharing ? 0.8 : 1,
            transition:"all .2s ease",
            marginBottom:12,
          }}>
            {shared ? "✓ Moment geteilt!" : sharing ? "Teilen…" : "Moment teilen"}
          </button>

          {/* "Verschwindet nach 24 Stunden" */}
          <div style={{
            textAlign:"center", fontSize:12, color:T.inkFaint,
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}>
            <span style={{ fontSize:13 }}>⏱</span>
            Verschwindet nach 24 Stunden
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT EXPORT
// ══════════════════════════════════════════════════════════════════
export default function OrbCompass({ visible, isTalent=false, onClose, onWorldSelect }) {
  const [step,    setStep]    = useState("compass"); // "compass" | "moment"
  const [closing, setClosing] = useState(false);

  // Reset step when opening
  useEffect(()=>{
    if(visible) { setStep("compass"); setClosing(false); }
  },[visible]);

  const handleClose = useCallback(()=>{
    setClosing(true);
    setTimeout(()=>{ setClosing(false); onClose?.(); }, 200);
  },[onClose]);

  const handleWorldSelect = useCallback((world)=>{
    setClosing(true);
    setTimeout(()=>{
      setClosing(false);
      onClose?.();
      onWorldSelect?.(world.id, world.label);
    }, 180);
  },[onClose, onWorldSelect]);

  const handleMoment = useCallback(()=>{
    setStep("moment");
  },[]);

  const handleMomentShared = useCallback(()=>{
    handleClose();
  },[handleClose]);

  if (!visible) return null;

  return (
    <>
      {step==="compass" && (
        <CompassScreen
          isTalent={isTalent}
          onSelectWorld={handleWorldSelect}
          onMoment={handleMoment}
          onClose={handleClose}
          closing={closing}
        />
      )}
      {step==="moment" && (
        <MomentSheet
          onClose={()=>setStep("compass")}
          onShare={handleMomentShared}
        />
      )}
    </>
  );
}
