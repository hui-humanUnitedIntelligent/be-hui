// src/components/OrbCompass.jsx — HUI Begegnungs-Kompass v2
// VERBINDLICHE REFERENZ: screenshot 29.05.2026
// Zwei eigenständige Screens:
//   Screen 1 — Compass: fullscreen, dominant, große Nodes
//   Screen 2 — Moment: nur Talente, Tap auf HUI-Logo Mitte
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabaseClient.js";

// ── Tokens ───────────────────────────────────────────────────────
const T = {
  // Hintergrund des Overlays — helles mint/sage, wie im Screenshot
  overlayBg: "linear-gradient(160deg, #E8F4F0 0%, #D4EBE3 50%, #C8E8DC 100%)",
  ink:       "#1B3530",
  inkSoft:   "rgba(27,53,48,0.58)",
  inkFaint:  "rgba(27,53,48,0.32)",
  teal:      "#1B8A7A",
  tealMid:   "#0EC4B8",
  tealSoft:  "rgba(14,196,184,0.14)",
  tealMid2:  "rgba(14,196,184,0.26)",
  coral:     "#E8573A",
  white:     "#FFFFFF",
  border:    "rgba(27,53,48,0.10)",
  borderSoft:"rgba(27,53,48,0.07)",
  r12:12, r16:16, r20:20, r24:24, r99:99,
  card: "0 2px 16px rgba(27,53,48,0.10), 0 1px 4px rgba(27,53,48,0.06)",
  sheet:"0 -16px 56px rgba(27,53,48,0.16)",
};

// ── World config ──────────────────────────────────────────────────
// Positionen: exakt wie Screenshot
// Natur = oben Mitte, Kreativität = oben rechts, Gemeinschaft = links,
// Tiere = unten rechts, Wirkung = unten links
const WORLDS = [
  { id:"natur",        label:"Natur",       emoji:"🌿", bg:"#3D7A45", deg:270, r:0 },
  { id:"kreativitaet", label:"Kreativität", emoji:"🎨", bg:"#C8442A", deg:338, r:0 },
  { id:"gemeinschaft", label:"Gemeinschaft",emoji:"🤝", bg:"#D48420", deg:212, r:0 },
  { id:"tiere",        label:"Tiere",       emoji:"🐾", bg:"#1B8A7A", deg:145, r:0 },
  { id:"wirkung",      label:"Wirkung",     emoji:"🌍", bg:"#2B52A0", deg:193, r:0 },
];
// deg layout:
// 270 = top (12 o'clock)
// 338 = upper-right (~1:30)
// 212 = left (~7 o'clock)
// 145 = lower-right (~5 o'clock)
// 193 = lower-left (~6:30)

function polar(deg, r) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

const CSS = `
  .orc-root {
    position:fixed; inset:0; z-index:9200;
    display:flex; flex-direction:column;
    align-items:center;
    overflow:hidden;
  }
  .orc-backdrop {
    position:absolute; inset:0;
    backdrop-filter:blur(22px) saturate(1.2);
    -webkit-backdrop-filter:blur(22px) saturate(1.2);
  }
  .orc-bg-layer {
    position:absolute; inset:0;
    background:${T.overlayBg};
    opacity:0.96;
  }
  @keyframes orc-appear {
    from { opacity:0; transform:scale(0.94) }
    to   { opacity:1; transform:scale(1) }
  }
  @keyframes orc-vanish {
    from { opacity:1; transform:scale(1) }
    to   { opacity:0; transform:scale(0.96) }
  }
  @keyframes orc-node-in {
    from { opacity:0; transform:translate(-50%,-50%) scale(0.6) }
    to   { opacity:1; transform:translate(-50%,-50%) scale(1) }
  }
  @keyframes orc-node-label {
    from { opacity:0; transform:translateY(6px) }
    to   { opacity:1; transform:translateY(0) }
  }
  @keyframes orc-center-in {
    from { opacity:0; transform:scale(0.5) }
    to   { opacity:1; transform:scale(1) }
  }
  @keyframes orc-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(14,196,184,0.50) }
    50%     { box-shadow: 0 0 0 18px rgba(14,196,184,0) }
  }
  @keyframes orc-sheet-in {
    from { transform:translateY(100%) }
    to   { transform:translateY(0) }
  }
  @keyframes orc-shimmer {
    from { background-position:-200% 0 }
    to   { background-position:200% 0 }
  }
  .orc-appear { animation: orc-appear .3s cubic-bezier(.22,1,.36,1) both }
  .orc-vanish { animation: orc-vanish .22s cubic-bezier(.22,1,.36,1) both }
  .orc-center-in { animation: orc-center-in .4s cubic-bezier(.34,1.56,.64,1) .05s both }
  .orc-pulse { animation: orc-pulse 2.6s ease-in-out infinite }
  .orc-sheet-in { animation: orc-sheet-in .3s cubic-bezier(.22,1,.36,1) both }
  .orc-sk {
    background:linear-gradient(90deg,rgba(27,53,48,.06) 25%,rgba(27,53,48,.11) 50%,rgba(27,53,48,.06) 75%);
    background-size:200% 100%;
    animation:orc-shimmer 1.4s ease-in-out infinite;
    border-radius:8px;
  }
  .orc-press { transition:transform .14s cubic-bezier(.22,1,.36,1),opacity .14s; }
  .orc-press:active { transform:scale(0.88) !important; opacity:0.7; }
  .orc-press-md { transition:transform .14s cubic-bezier(.22,1,.36,1),opacity .14s; }
  .orc-press-md:active { transform:scale(0.93); opacity:0.78; }
`;

// ══════════════════════════════════════════════════════════════════
// SCREEN 1 — BEGEGNUNGS-KOMPASS
// ══════════════════════════════════════════════════════════════════
function CompassScreen({ isTalent, onSelectWorld, onOpenMoment, onClose, isClosing }) {
  // orbit radius — calculated from viewport
  const ORBIT_R = Math.min(window.innerWidth * 0.38, 148);
  const NODE_SIZE = Math.min(window.innerWidth * 0.155, 64);
  const CENTER_SIZE = Math.min(window.innerWidth * 0.195, 82);

  return (
    <div className={`orc-root ${isClosing ? "orc-vanish" : "orc-appear"}`}>
      <style>{CSS}</style>

      {/* Layered background */}
      <div className="orc-backdrop"/>
      <div className="orc-bg-layer"/>

      {/* ✕ Close */}
      <button
        className="orc-press"
        onClick={onClose}
        style={{
          position:"absolute",
          top:`max(52px, calc(44px + env(safe-area-inset-top,0px)))`,
          left:20, zIndex:10,
          width:38, height:38, borderRadius:"50%",
          background:"rgba(255,255,255,0.72)", backdropFilter:"blur(10px)",
          border:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20, color:T.ink,
          cursor:"pointer", touchAction:"manipulation",
          boxShadow:T.card,
        }}
      >×</button>

      {/* Full content area — vertically centered */}
      <div style={{
        position:"relative", zIndex:1,
        flex:1, width:"100%",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:`0 24px max(32px, calc(24px + env(safe-area-inset-bottom,0px)))`,
      }}>
        {/* Title block */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <h1 style={{
            fontSize:30, fontWeight:900, color:T.ink,
            letterSpacing:"-0.045em", lineHeight:1.18,
            margin:"0 0 12px", fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
          }}>
            Wonach suchst<br/>du heute?
          </h1>
          <p style={{
            fontSize:14.5, color:T.inkSoft, lineHeight:1.65,
            margin:0, fontWeight:400, maxWidth:260,
          }}>
            Wähle einen Bereich oder tippe<br/>
            in die Mitte, um einen Moment<br/>
            zu teilen.
          </p>
        </div>

        {/* Orbit stage */}
        <div style={{
          position:"relative",
          width: ORBIT_R*2 + NODE_SIZE + 60,
          height: ORBIT_R*2 + NODE_SIZE + 80,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {/* Dashed circle track */}
          <div style={{
            position:"absolute",
            width: ORBIT_R*2, height: ORBIT_R*2,
            left:"50%", top:"50%",
            transform:"translate(-50%,-50%)",
            borderRadius:"50%",
            border:`1.5px dashed rgba(27,53,48,0.15)`,
            pointerEvents:"none",
          }}/>

          {/* World nodes */}
          {WORLDS.map((w, i) => {
            const pos = polar(w.deg, ORBIT_R);
            return (
              <div
                key={w.id}
                className="orc-press"
                onClick={() => onSelectWorld(w)}
                style={{
                  position:"absolute",
                  left:"50%", top:"50%",
                  transform:`translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                  display:"flex", flexDirection:"column", alignItems:"center",
                  gap:9, cursor:"pointer", touchAction:"manipulation",
                  userSelect:"none",
                  animation:`orc-node-in .36s cubic-bezier(.34,1.56,.64,1) ${i*60+80}ms both`,
                }}
              >
                {/* Node circle */}
                <div style={{
                  width:NODE_SIZE, height:NODE_SIZE, borderRadius:"50%",
                  background:w.bg,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize: NODE_SIZE * 0.44,
                  boxShadow:`0 5px 22px rgba(0,0,0,0.22), 0 0 0 3.5px rgba(255,255,255,0.65)`,
                }}>
                  {w.emoji}
                </div>
                {/* Label */}
                <span style={{
                  fontSize:13.5, fontWeight:700, color:T.ink,
                  textShadow:"0 1px 8px rgba(255,255,255,0.9)",
                  letterSpacing:"-0.01em",
                  animation:`orc-node-label .32s ease ${i*60+160}ms both`,
                  whiteSpace:"nowrap",
                }}>
                  {w.label}
                </span>
              </div>
            );
          })}

          {/* Center HUI Orb */}
          <div
            className={`orc-center-in ${isTalent ? "orc-press" : ""}`}
            onClick={isTalent ? onOpenMoment : undefined}
            style={{
              position:"absolute", left:"50%", top:"50%",
              transform:"translate(-50%,-50%)",
              cursor:isTalent?"pointer":"default",
              touchAction:"manipulation",
              zIndex:5,
            }}
          >
            {/* Outer glow pulse ring */}
            <div className="orc-pulse" style={{
              width:CENTER_SIZE, height:CENTER_SIZE, borderRadius:"50%",
              background:`conic-gradient(from 10deg,
                ${T.tealMid} 0%,
                #6EE8E2 28%,
                ${T.coral} 52%,
                #F4927A 72%,
                ${T.tealMid} 100%)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:`0 8px 36px rgba(14,196,184,0.45), 0 2px 12px rgba(232,87,58,0.25)`,
            }}>
              {/* White inner ring */}
              <div style={{
                width:CENTER_SIZE - 8, height:CENTER_SIZE - 8, borderRadius:"50%",
                background:T.white,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"inset 0 1px 8px rgba(0,0,0,0.07)",
              }}>
                {/* Teal HUI logo core */}
                <div style={{
                  width:CENTER_SIZE - 20, height:CENTER_SIZE - 20, borderRadius:"50%",
                  background:`linear-gradient(135deg, ${T.tealMid} 0%, #0AADA3 100%)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <span style={{
                    fontSize:CENTER_SIZE * 0.3,
                    fontWeight:900, color:"white",
                    fontFamily:"system-ui,-apple-system",
                    letterSpacing:"-0.05em",
                    lineHeight:1,
                  }}>hui</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom hint — only for Talents */}
        {isTalent && (
          <div style={{
            marginTop:28, textAlign:"center",
            fontSize:13, color:T.inkSoft, lineHeight:1.7,
          }}>
            In die Mitte tippen,<br/>um einen{" "}
            <span style={{ fontWeight:800, color:T.teal }}>HUI-Moment</span>
            <br/>zu teilen
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SCREEN 2 — TEILE DEINEN MOMENT (nur Talente)
// ══════════════════════════════════════════════════════════════════
const MOMENT_TYPES = [
  { id:"foto",     emoji:"📷", label:"Foto"     },
  { id:"video",    emoji:"🎥", label:"Video"    },
  { id:"gedanke",  emoji:"✍️",  label:"Gedanke"  },
  { id:"einblick", emoji:"🌿", label:"Einblick" },
];

const STUDIO_IMG = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=700&q=82";

function MomentScreen({ onBack, onClose }) {
  const [type,    setType]    = useState("foto");
  const [caption, setCaption] = useState("");
  const [vis,     setVis]     = useState("Meine Follower");
  const [imgOk,   setImgOk]   = useState(false);
  const [state,   setState]   = useState("idle"); // idle | saving | done
  const fileRef = useRef(null);

  const handleShare = async () => {
    setState("saving");
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("stories").insert({
          user_id:    user.id,
          caption:    caption.trim() || null,
          type,
          status:     "active",
          expires_at: new Date(Date.now() + 24*60*60*1000).toISOString(),
        });
      }
    } catch(e) { console.warn("[Moment]", e); }
    setState("done");
    setTimeout(() => onClose?.(), 1600);
  };

  const showPreview = type === "foto" || type === "video" || type === "einblick";

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9300,
      background:"rgba(27,53,48,0.48)", backdropFilter:"blur(10px)",
      display:"flex", alignItems:"flex-end",
    }}>
      <div
        className="orc-sheet-in"
        onClick={e=>e.stopPropagation()}
        style={{
          width:"100%", background:T.white,
          borderRadius:"24px 24px 0 0",
          maxHeight:"95vh", overflowY:"auto",
          boxShadow:T.sheet,
          paddingBottom:`max(32px,calc(20px + env(safe-area-inset-bottom,0px)))`,
        }}
      >
        <style>{CSS}</style>

        {/* Handle */}
        <div style={{ padding:"16px 20px 0" }}>
          <div style={{
            width:40, height:4, borderRadius:99,
            background:"rgba(27,53,48,0.14)",
            margin:"0 auto 22px",
          }}/>

          {/* Header row */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <h2 style={{
                fontSize:22, fontWeight:900, color:T.ink,
                letterSpacing:"-0.035em", margin:"0 0 5px",
                lineHeight:1.2,
              }}>Teile einen Moment</h2>
              <p style={{ fontSize:13.5, color:T.inkSoft, margin:0, fontWeight:400 }}>
                Zeige, was dich gerade bewegt.
              </p>
            </div>
            <button
              className="orc-press"
              onClick={onBack}
              style={{
                width:32, height:32, borderRadius:"50%",
                background:"rgba(27,53,48,0.08)", border:"none",
                fontSize:18, color:T.ink,
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", touchAction:"manipulation",
                flexShrink:0,
              }}
            >×</button>
          </div>
        </div>

        <div style={{ padding:"20px 20px 0" }}>

          {/* Type tabs — 4 grid */}
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:9,
            marginBottom:20,
          }}>
            {MOMENT_TYPES.map(mt => (
              <button
                key={mt.id}
                className="orc-press-md"
                onClick={() => setType(mt.id)}
                style={{
                  display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                  padding:"13px 6px", borderRadius:T.r16,
                  background: type===mt.id
                    ? "rgba(14,196,184,0.12)"
                    : "rgba(27,53,48,0.04)",
                  border:`1.5px solid ${type===mt.id
                    ? "rgba(14,196,184,0.45)"
                    : "rgba(27,53,48,0.09)"}`,
                  cursor:"pointer", touchAction:"manipulation",
                  fontFamily:"inherit",
                  transition:"all .18s ease",
                }}
              >
                <span style={{ fontSize:22 }}>{mt.emoji}</span>
                <span style={{
                  fontSize:12, fontWeight:700,
                  color:type===mt.id ? T.teal : T.ink,
                  letterSpacing:"-0.01em",
                }}>{mt.label}</span>
              </button>
            ))}
          </div>

          {/* Preview image */}
          {showPreview && (
            <div style={{
              position:"relative", width:"100%",
              borderRadius:T.r20, overflow:"hidden",
              marginBottom:16,
              background:"rgba(27,53,48,0.06)",
              aspectRatio:"16/9",
            }}>
              {!imgOk && (
                <div className="orc-sk" style={{ position:"absolute", inset:0, borderRadius:T.r20 }}/>
              )}
              <img
                src={STUDIO_IMG} alt=""
                onLoad={()=>setImgOk(true)} onError={()=>setImgOk(true)}
                style={{
                  width:"100%", height:"100%", objectFit:"cover", display:"block",
                  opacity:imgOk?1:0, transition:"opacity .7s ease",
                }}
              />
              {/* Remove ✕ */}
              <button
                className="orc-press"
                style={{
                  position:"absolute", top:10, right:10,
                  width:30, height:30, borderRadius:"50%",
                  background:"rgba(255,255,255,0.90)",
                  backdropFilter:"blur(8px)",
                  border:"none", fontSize:15, color:T.ink,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  cursor:"pointer", touchAction:"manipulation",
                  boxShadow:"0 2px 8px rgba(0,0,0,0.14)",
                }}
              >×</button>
            </div>
          )}

          {/* Caption textarea */}
          <div style={{
            borderRadius:T.r16,
            border:`1.5px solid rgba(27,53,48,0.10)`,
            background:"rgba(27,53,48,0.03)",
            marginBottom:16,
            overflow:"hidden",
          }}>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value.slice(0, 280))}
              placeholder={
                type==="gedanke"
                  ? "Was bewegt dich gerade?"
                  : "Gerade entsteht etwas Neues in meinem Atelier.\nDie Farben, das Licht, die Stille – einfach magisch."
              }
              style={{
                width:"100%", minHeight:80, border:"none", outline:"none",
                background:"transparent", padding:"14px 16px",
                fontSize:14, color:T.ink, lineHeight:1.68,
                resize:"none", fontFamily:"-apple-system,'Georgia',serif",
                fontStyle:"italic", boxSizing:"border-box",
              }}
            />
            {caption.length > 0 && (
              <div style={{
                textAlign:"right", padding:"0 14px 10px",
                fontSize:11, color:T.inkFaint,
              }}>{caption.length} / 280</div>
            )}
          </div>

          {/* Visibility picker row */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"12px 16px",
            borderRadius:T.r12,
            border:`1px solid rgba(27,53,48,0.09)`,
            background:"rgba(27,53,48,0.03)",
            marginBottom:22, cursor:"pointer",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:16 }}>🌿</span>
              <span style={{ fontSize:13.5, color:T.inkSoft, fontWeight:500 }}>
                Sichtbar für:{" "}
                <span style={{ color:T.ink, fontWeight:700 }}>{vis}</span>
              </span>
            </div>
            <span style={{ fontSize:13, color:T.inkFaint }}>▾</span>
          </div>

          {/* Share button */}
          <button
            className="orc-press-md"
            onClick={handleShare}
            disabled={state !== "idle"}
            style={{
              width:"100%", padding:"17px",
              borderRadius:T.r20, border:"none",
              background: state==="done"
                ? "linear-gradient(135deg,#22c55e,#16a34a)"
                : `linear-gradient(135deg, ${T.teal} 0%, #0A6B62 100%)`,
              color:"white", fontSize:16, fontWeight:800,
              letterSpacing:"-0.02em",
              touchAction:"manipulation", fontFamily:"inherit",
              boxShadow:`0 8px 28px rgba(14,196,184,0.40)`,
              opacity:state==="saving" ? 0.75 : 1,
              transition:"all .22s ease",
              marginBottom:14,
            }}
          >
            {state==="done"   ? "✓  Moment geteilt!" :
             state==="saving" ? "Teilen…"            : "Moment teilen"}
          </button>

          {/* 24h hint */}
          <div style={{
            textAlign:"center", fontSize:12.5, color:T.inkFaint,
            display:"flex", alignItems:"center", justifyContent:"center", gap:7,
          }}>
            <span style={{ fontSize:14 }}>⏱</span>
            Verschwindet nach 24 Stunden
          </div>

        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════
export default function OrbCompass({ visible, isTalent=false, onClose, onWorldSelect }) {
  const [screen,    setScreen]    = useState("compass"); // "compass" | "moment"
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (visible) { setScreen("compass"); setIsClosing(false); }
  }, [visible]);

  const animatedClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => { setIsClosing(false); onClose?.(); }, 210);
  }, [onClose]);

  const handleWorldSelect = useCallback((world) => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose?.();
      onWorldSelect?.(world.id, world.label);
    }, 180);
  }, [onClose, onWorldSelect]);

  if (!visible) return null;

  return (
    <>
      {screen === "compass" && (
        <CompassScreen
          isTalent={isTalent}
          onSelectWorld={handleWorldSelect}
          onOpenMoment={() => setScreen("moment")}
          onClose={animatedClose}
          isClosing={isClosing}
        />
      )}
      {screen === "moment" && isTalent && (
        <MomentScreen
          onBack={() => setScreen("compass")}
          onClose={animatedClose}
        />
      )}
    </>
  );
}
