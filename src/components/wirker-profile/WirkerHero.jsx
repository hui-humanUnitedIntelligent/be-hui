// WirkerHero.jsx — Phase 24 FINAL
// Compact immersive hero — LEFT: text/CTAs, RIGHT: creator image + live card
// Self-contained — no broken hook dependencies
import React, { useState, useEffect, useRef } from "react";

const S = (v, fb = "") => (v && typeof v === "string" ? v : fb);
const IMG_FALLBACK = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&q=85";
const DEFAULT_TAGS = ["Atelier", "Natur", "Kreativitat", "Reisen", "Gemeinschaft"];

export default function WirkerHero({ profile = {}, presenceStatus, onChat, onBook, onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const name       = S(profile?.display_name || profile?.name, "Creator");
  const heroImg    = S(profile?.header_img || profile?.img, IMG_FALLBACK);
  const philosophy = S(profile?.bio, "Ich forme Raume und Momente, die uns zuruck zu uns selbst bringen.");
  const tags       = (Array.isArray(profile?.interests) ? profile.interests : DEFAULT_TAGS).slice(0, 5);
  const presence   = S(presenceStatus, "Gerade im Atelier");
  const liveCount  = Math.floor(Math.random() * 20) + 12;
  const currentWork = S(profile?.current_work, "Fragments of Light");

  return (
    <div style={{
      position: "relative",
      width: "100%",
      minHeight: 280,
      maxHeight: 360,
      overflow: "hidden",
      background: "#0F1E1E",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @keyframes orbPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.8)} }
        @keyframes particleFloat {
          0%,100%{transform:translateY(0) translateX(0);opacity:.5}
          50%{transform:translateY(-12px) translateX(4px);opacity:.8}
        }
      `}</style>

      {/* BG image */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${heroImg})`,
        backgroundSize: "cover", backgroundPosition: "center 25%",
        opacity: 0.45,
      }} />
      {/* gradient overlays */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(100deg, rgba(8,20,20,.92) 0%, rgba(8,20,20,.70) 45%, rgba(8,20,20,.15) 100%)",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
        background: "linear-gradient(to top, rgba(8,20,20,.85), transparent)",
      }} />

      {/* Particles */}
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          position:"absolute",
          width: 3+i, height: 3+i,
          borderRadius:"50%",
          background: `rgba(13,196,181,${.2+i*.08})`,
          top: `${12+i*15}%`, left: `${5+i*8}%`,
          animation: `particleFloat ${4+i}s ease-in-out ${i*.6}s infinite`,
          pointerEvents:"none",
        }} />
      ))}

      {/* Top nav */}
      <div style={{
        position:"absolute", top:0, left:0, right:0,
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"14px 18px", zIndex:10,
      }}>
        <button onClick={onClose} style={{
          background:"rgba(255,255,255,.13)", border:"1px solid rgba(255,255,255,.20)",
          backdropFilter:"blur(10px)", borderRadius:99,
          width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", color:"white", fontSize:18, touchAction:"manipulation",
        }}>←</button>

        <div style={{
          background:"rgba(13,196,181,.18)", border:"1px solid rgba(13,196,181,.38)",
          backdropFilter:"blur(10px)", borderRadius:99,
          padding:"5px 13px", display:"flex", alignItems:"center", gap:6,
          color:"#22DDD0", fontSize:11, fontWeight:700, letterSpacing:".04em",
        }}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#22DDD0",animation:"orbPulse 2s infinite"}} />
          CREATOR · aktiv
        </div>

        <button style={{
          background:"rgba(255,255,255,.13)", border:"1px solid rgba(255,255,255,.20)",
          backdropFilter:"blur(10px)", borderRadius:99,
          width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", color:"white", fontSize:16, touchAction:"manipulation",
        }}>···</button>
      </div>

      {/* Main content row */}
      <div style={{
        position:"relative", zIndex:5,
        flex:1, display:"flex",
        padding:"72px 18px 22px",
        alignItems:"flex-end",
        gap:14,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "none" : "translateY(8px)",
        transition:"opacity .55s ease, transform .55s ease",
      }}>
        {/* LEFT */}
        <div style={{ flex:"1 1 0", minWidth:0 }}>
          <h1 style={{
            fontSize:"clamp(22px,5.5vw,32px)", fontWeight:800,
            color:"white", lineHeight:1.12, letterSpacing:"-.025em",
            margin:"0 0 7px", textShadow:"0 2px 16px rgba(0,0,0,.5)",
          }}>
            Hey, ich bin {name}.<br/>
            <span style={{color:"rgba(255,255,255,.85)"}}>
              Ich erschaffe Raume,<br/>die verbinden & inspirieren.
            </span>
          </h1>

          <p style={{
            fontSize:12, color:"rgba(255,255,255,.65)",
            margin:"0 0 12px", lineHeight:1.45,
            fontStyle:"italic", maxWidth:260,
          }}>"{philosophy}"</p>

          {/* Tags */}
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
            {tags.map((t,i) => (
              <span key={i} style={{
                background:"rgba(255,255,255,.10)", border:"1px solid rgba(255,255,255,.18)",
                backdropFilter:"blur(6px)", borderRadius:99,
                padding:"4px 10px", color:"rgba(255,255,255,.80)",
                fontSize:10, fontWeight:600,
              }}>● {t}</span>
            ))}
          </div>

          {/* CTAs */}
          <div style={{display:"flex",gap:8}}>
            <button onClick={() => onBook?.()} style={{
              background:"linear-gradient(135deg,#0DC4B5,#22DDD0)",
              border:"none", borderRadius:99, padding:"10px 20px",
              color:"white", fontSize:13, fontWeight:700, cursor:"pointer",
              boxShadow:"0 4px 18px rgba(13,196,181,.40)",
              touchAction:"manipulation",
            }}>Erlebnis buchen</button>
            <button onClick={() => onChat?.()} style={{
              background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.22)",
              backdropFilter:"blur(10px)", borderRadius:99, padding:"10px 16px",
              color:"white", fontSize:13, fontWeight:600, cursor:"pointer",
              touchAction:"manipulation",
            }}>Nachricht</button>
          </div>
        </div>

        {/* RIGHT — Live card */}
        <div style={{
          flexShrink:0, width:176,
          background:"rgba(255,252,248,.93)", backdropFilter:"blur(20px)",
          borderRadius:16, padding:"12px 14px",
          boxShadow:"0 8px 28px rgba(0,0,0,.22)",
          border:"1px solid rgba(255,255,255,.55)",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}>
            <span style={{fontSize:11,fontWeight:700,color:"#1A1A1A"}}>{presence}</span>
            <span style={{
              background:"#FF3333",color:"white",
              fontSize:8,fontWeight:800,borderRadius:3,padding:"2px 5px",letterSpacing:".04em",
            }}>LIVE</span>
          </div>
          <div style={{fontSize:11,color:"#444",lineHeight:1.4,marginBottom:9}}>
            Neues Werk entsteht<br/>
            <em style={{color:"#0DC4B5",fontStyle:"italic"}}>"{currentWork}"</em>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{display:"flex"}}>
              {[7,14,21,28].map(n => (
                <img key={n} src={`https://i.pravatar.cc/24?img=${n}`}
                  style={{width:20,height:20,borderRadius:"50%",border:"2px solid white",marginLeft:n===7?0:-6}}
                  alt="" onError={e=>{e.target.style.display="none"}} />
              ))}
            </div>
            <span style={{fontSize:10,color:"#666",fontWeight:600}}>{liveCount} dabei</span>
          </div>
          <div style={{marginTop:8,fontSize:10,color:"#0DC4B5",fontWeight:700,cursor:"pointer"}}>
            Atelier betreten →
          </div>
        </div>
      </div>
    </div>
  );
}
