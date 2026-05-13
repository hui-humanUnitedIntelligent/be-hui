// HuiMembershipFlow.jsx — Emotionales HUI Membership Onboarding
// Cinematic cards, echte Bilder, voller Bildschirm

import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealGlow:"rgba(22,215,197,0.28)",
  coral:"#FF8A6B", coral2:"#FF7055", coralGlow:"rgba(255,138,107,0.28)",
  cream:"#F9F7F4", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", muted:"#888",
};

const CSS = `
  @keyframes hmfIn {
    from { opacity:0; transform:scale(1.04); }
    to   { opacity:1; transform:scale(1); }
  }
  @keyframes hmfSlide {
    from { opacity:0; transform:translateX(40px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes hmfSlideUp {
    from { opacity:0; transform:translateY(28px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes hmfPulse {
    0%,100% { opacity:0.6; transform:scale(1); }
    50%     { opacity:1;   transform:scale(1.18); }
  }
  @keyframes hmfFloat {
    0%,100% { transform:translateY(0px); }
    50%     { transform:translateY(-6px); }
  }
  @keyframes hmfKen {
    from { transform:scale(1); }
    to   { transform:scale(1.08); }
  }
  @keyframes hmfShimmer {
    0%   { background-position: -300% 0; }
    100% { background-position: 300% 0; }
  }
  @keyframes hmfSuccess {
    0%   { transform:scale(0.5) rotate(-10deg); opacity:0; }
    60%  { transform:scale(1.2) rotate(3deg); opacity:1; }
    100% { transform:scale(1) rotate(0deg); }
  }
  @keyframes hmfDotPulse {
    0%,100% { transform:scale(1); opacity:0.4; }
    50%     { transform:scale(1.4); opacity:1; }
  }
`;

// ── Onboarding Cards Data ────────────────────────────────────────────────
const CARDS = [
  {
    img: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/656974f30_generated_image.png",
    tag: "Gemeinschaft",
    tagColor: C.teal,
    title: "Willkommen\nbei HUI",
    sub:  "Eine Gemeinschaft für Menschen, Talente und echte Herzensprojekte. Hier zählt, wer du bist.",
    accent: C.teal,
    grad: "linear-gradient(180deg, rgba(0,0,0,0) 25%, rgba(10,30,30,0.82) 65%, rgba(10,30,30,0.96) 100%)",
  },
  {
    img: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/9d12bef56_generated_image.png",
    tag: "Dein Talent",
    tagColor: "#F5A623",
    title: "Zeige, was\nin dir steckt",
    sub:  "Teile Werke, Ideen, Erlebnisse und Momente. Dein Talent verdient eine Bühne.",
    accent: "#F5A623",
    grad: "linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(20,15,5,0.80) 60%, rgba(20,15,5,0.97) 100%)",
  },
  {
    img: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/1885ebd2d_generated_image.png",
    tag: "Impact",
    tagColor: "#A78BFA",
    title: "Gemeinsam\nbewirken",
    sub:  "Ein Teil jeder Transaktion fließt in echte Herzensprojekte. Du machst den Unterschied.",
    accent: "#A78BFA",
    grad: "linear-gradient(180deg, rgba(0,0,0,0) 25%, rgba(8,5,25,0.82) 62%, rgba(8,5,25,0.97) 100%)",
  },
  {
    img: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/1885ebd2d_generated_image.png",
    tag: "Dein Fokus",
    tagColor: "#F5A623",
    title: "Was beschreibt\ndich mehr?",
    sub:  "Das hilft HUI, dein Profil optimal zu gestalten. Du kannst das jederzeit ändern.",
    accent: "#F5A623",
    grad: "linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(15,10,0,0.88) 55%, rgba(15,10,0,0.97) 100%)",
    isFocusStep: true,
  },
  {
    img: "https://media.base44.com/images/public/69e91ff9d24a19ce6f9abd25/1f05aec0c_generated_image.png",
    tag: "Schritt 5 von 5",
    tagColor: C.coral,
    title: "Mitglied\nwerden",
    sub:  "Werde Teil von etwas Echtem. Bestätige kurz — und los geht's.",
    accent: C.coral,
    grad: "linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(25,10,5,0.82) 58%, rgba(25,10,5,0.97) 100%)",
  },
];

// ── Preloader (invisible img tags) ──────────────────────────────────────
function Preloader() {
  return (
    <div style={{ display:"none" }}>
      {CARDS.map((c,i) => <img key={i} src={c.img} alt=""/>)}
    </div>
  );
}

// ── Progress Bar Row ─────────────────────────────────────────────────────
function ProgressDots({ step, total, accent }) {
  return (
    <div style={{
      display:"flex", gap:5, alignItems:"center",
    }}>
      {Array.from({length: total}).map((_, i) => (
        <div key={i} style={{
          height: i === step ? 6 : 4,
          width:  i === step ? 22 : 6,
          borderRadius: 999,
          background: i === step ? accent : "rgba(255,255,255,0.30)",
          transition: "all 0.35s cubic-bezier(0.34,1.2,0.64,1)",
        }}/>
      ))}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────
export default function HuiMembershipFlow({ onComplete, onClose }) {
  const { user } = useAuth();
  const [step,        setStep]        = useState(0);
  const [animKey,     setAnimKey]     = useState(0);
  const [agb,         setAgb]         = useState(false);
  const [datenschutz, setDatenschutz] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [done,        setDone]        = useState(false);
  const [focusType,   setFocusType]   = useState(null); // works | experiences | hybrid

  const card       = CARDS[step];
  const isLastCard = step === 4;
  const canFinish  = agb && datenschutz;

  function goNext() {
    if (step < CARDS.length - 1) {
      // On focus step: require a selection
      if (card.isFocusStep && !focusType) {
        setFocusType("hybrid"); // auto-select hybrid if user skips
      }
      setAnimKey(k => k + 1);
      setStep(s => s + 1);
    }
  }

  async function handleFinish() {
    if (!canFinish || loading) return;
    setLoading(true); setError("");
    try {
      // Delegate to parent — activateTalentProfile() in AuthContext
      // writes has_talent_profile=true to Supabase AND updates in-memory profile
      setDone(true);
      setTimeout(() => onComplete?.(focusType || 'hybrid'), 2200);
    } catch(err) {
      setError("Etwas ist schiefgelaufen. Bitte nochmal.");
      setLoading(false);
    }
  }

  // ── Success Screen ────────────────────────────────────────────────────
  if (done) return (
    <>
      <style>{CSS}</style>
      <div style={{
        position:"fixed", inset:0, zIndex:3200,
        background:"linear-gradient(145deg,#0A1E1E,#0D0A08)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        overflow:"hidden",
      }}>
        {/* BG glow */}
        <div style={{
          position:"absolute", top:"30%", left:"50%",
          transform:"translate(-50%,-50%)",
          width:280, height:280, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(22,215,197,0.22), transparent 70%)",
          filter:"blur(30px)",
          pointerEvents:"none",
        }}/>

        <div style={{ textAlign:"center", padding:"0 36px", position:"relative", zIndex:1 }}>
          {/* Emoji burst */}
          <div style={{
            fontSize:80, marginBottom:24,
            animation:"hmfSuccess 0.6s cubic-bezier(0.34,1.4,0.64,1) both",
            display:"block",
          }}>🎉</div>

          <div style={{
            fontWeight:900, fontSize:28, color:"#FFFFFF",
            letterSpacing:-1, lineHeight:1.1, marginBottom:14,
            animation:"hmfSlideUp 0.5s 0.2s ease both",
          }}>
            Willkommen in<br/>der HUI-Familie!
          </div>
          <div style={{
            fontSize:15, color:"rgba(255,255,255,0.6)", lineHeight:1.65,
            animation:"hmfSlideUp 0.5s 0.35s ease both",
          }}>
            Du bist jetzt Teil von etwas Echtem.<br/>
            Teile, verbinde, bewirke.
          </div>

          {/* Teal shimmer line */}
          <div style={{
            width:60, height:2, borderRadius:999, margin:"24px auto 0",
            background:`linear-gradient(90deg, transparent, ${C.teal}, transparent)`,
            backgroundSize:"300% 100%",
            animation:"hmfShimmer 1.8s ease infinite, hmfSlideUp 0.5s 0.5s ease both",
          }}/>
        </div>

        {/* Pulsing dots */}
        <div style={{ marginTop:48, display:"flex", gap:10, position:"relative", zIndex:1 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width:8, height:8, borderRadius:"50%",
              background:C.teal,
              animation:`hmfDotPulse 1.2s ${i * 0.18}s ease-in-out infinite`,
            }}/>
          ))}
        </div>
      </div>
    </>
  );

  // ── Main Onboarding ───────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <Preloader/>

      {/* Full screen overlay */}
      <div style={{
        position:"fixed", inset:0, zIndex:3100,
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        overflow:"hidden",
      }}>
        {/* BG Image — ken burns */}
        <div key={`bg-${step}`} style={{
          position:"absolute", inset:0, zIndex:0,
          backgroundImage:`url(${card.img})`,
          backgroundSize:"cover",
          backgroundPosition:"center",
          animation:"hmfKen 8s ease-in-out both",
        }}/>

        {/* Gradient overlay */}
        <div style={{
          position:"absolute", inset:0, zIndex:1,
          background: card.grad,
        }}/>

        {/* Top row: dots + close */}
        <div style={{
          position:"absolute", top:0, left:0, right:0,
          zIndex:10,
          padding:"max(52px, env(safe-area-inset-top, 52px)) 22px 0",
          display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          <ProgressDots step={step} total={5} accent={card.accent}/>
          <button onClick={onClose} style={{
            width:34, height:34, borderRadius:"50%",
            background:"rgba(255,255,255,0.15)",
            backdropFilter:"blur(8px)",
            WebkitBackdropFilter:"blur(8px)",
            border:"1px solid rgba(255,255,255,0.22)",
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer",
            WebkitTapHighlightColor:"transparent",
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 1L12 12M12 1L1 12"
                stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tag badge */}
        <div key={`tag-${animKey}`} style={{
          position:"absolute", bottom: isLastCard ? 430 : 290, left:24, zIndex:10,
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"6px 12px",
          background:"rgba(255,255,255,0.12)",
          backdropFilter:"blur(10px)",
          WebkitBackdropFilter:"blur(10px)",
          borderRadius:999,
          border:`1px solid ${card.accent}55`,
          animation:"hmfSlideUp 0.45s cubic-bezier(0.34,1.2,0.64,1) both",
        }}>
          <div style={{
            width:7, height:7, borderRadius:"50%",
            background:card.accent,
            boxShadow:`0 0 8px ${card.accent}`,
          }}/>
          <span style={{
            fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.9)",
            letterSpacing:0.6,
          }}>
            {card.tag}
          </span>
        </div>

        {/* Main text block */}
        <div key={`text-${animKey}`} style={{
          position:"absolute", bottom: isLastCard ? 280 : 140, left:0, right:0,
          zIndex:10, padding:"0 24px",
          animation:"hmfSlideUp 0.5s 0.08s cubic-bezier(0.34,1.2,0.64,1) both",
        }}>
          <h1 style={{
            fontWeight:900, fontSize:36, lineHeight:1.05,
            color:"#FFFFFF", letterSpacing:-1.2,
            margin:"0 0 14px 0",
            textShadow:"0 2px 20px rgba(0,0,0,0.4)",
            whiteSpace:"pre-line",
          }}>
            {card.title}
          </h1>
          <p style={{
            fontSize:15.5, color:"rgba(255,255,255,0.72)",
            lineHeight:1.65, margin:0, maxWidth:320,
          }}>
            {card.sub}
          </p>
        </div>

        {/* Checkboxes (only step 3) */}
        {isLastCard && (
          <div key="checks" style={{
            position:"absolute", bottom:195, left:0, right:0,
            zIndex:10, padding:"0 22px",
            display:"flex", flexDirection:"column", gap:10,
            animation:"hmfSlideUp 0.45s 0.15s cubic-bezier(0.34,1.2,0.64,1) both",
          }}>
            {[
              { state:agb, set:setAgb, text:"Ich akzeptiere die", link:"AGB" },
              { state:datenschutz, set:setDatenschutz, text:"Ich akzeptiere den", link:"Datenschutz" },
            ].map((item, i) => (
              <button key={i} onClick={() => item.set(p => !p)} style={{
                display:"flex", alignItems:"center", gap:12,
                background: item.state
                  ? "rgba(22,215,197,0.18)"
                  : "rgba(255,255,255,0.10)",
                backdropFilter:"blur(12px)",
                WebkitBackdropFilter:"blur(12px)",
                border:`1.5px solid ${item.state
                  ? "rgba(22,215,197,0.55)"
                  : "rgba(255,255,255,0.18)"}`,
                borderRadius:16, padding:"13px 16px",
                cursor:"pointer", textAlign:"left",
                transition:"all 0.22s cubic-bezier(0.34,1.2,0.64,1)",
                WebkitTapHighlightColor:"transparent",
              }}>
                <div style={{
                  width:24, height:24, borderRadius:8, flexShrink:0,
                  background: item.state
                    ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                    : "rgba(255,255,255,0.15)",
                  border: item.state ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all 0.2s",
                  boxShadow: item.state ? `0 2px 12px ${C.tealGlow}` : "none",
                }}>
                  {item.state && (
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M1 5L5 9L12 1" stroke="white"
                        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{ fontSize:14, color:"rgba(255,255,255,0.88)", fontWeight:500 }}>
                  {item.text}{" "}
                  <span style={{ color:C.teal, fontWeight:700 }}>{item.link}</span>
                </span>
              </button>
            ))}
            {error && (
              <div style={{
                padding:"9px 14px", borderRadius:12,
                background:"rgba(255,80,80,0.18)",
                border:"1px solid rgba(255,80,80,0.3)",
                fontSize:13, color:"#ff9999",
              }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* CTA Button */}
        <div key={`cta-${animKey}`} style={{
          position:"absolute",
          bottom:"max(36px, env(safe-area-inset-bottom, 36px))",
          left:0, right:0,
          zIndex:10, padding:"0 22px",
          animation:"hmfSlideUp 0.5s 0.18s cubic-bezier(0.34,1.2,0.64,1) both",
        }}>
          <button
            onClick={isLastCard ? handleFinish : goNext}
            disabled={isLastCard && (!canFinish || loading)}
            style={{
              width:"100%", padding:"19px 24px",
              background: isLastCard && !canFinish
                ? "rgba(255,255,255,0.12)"
                : `linear-gradient(135deg, ${card.accent === C.teal ? C.teal : card.accent}, ${
                    card.accent === C.teal ? C.coral
                    : card.accent === "#F5A623" ? "#FF8A6B"
                    : card.accent === "#A78BFA" ? "#16D7C5"
                    : C.teal
                  })`,
              border: isLastCard && !canFinish
                ? "1.5px solid rgba(255,255,255,0.22)"
                : "none",
              borderRadius:20,
              color: isLastCard && !canFinish
                ? "rgba(255,255,255,0.45)"
                : "white",
              fontSize:16.5, fontWeight:800,
              cursor: isLastCard && !canFinish ? "default" : "pointer",
              fontFamily:"inherit", letterSpacing:0.2,
              backdropFilter: isLastCard && !canFinish ? "blur(10px)" : "none",
              WebkitBackdropFilter: isLastCard && !canFinish ? "blur(10px)" : "none",
              boxShadow: isLastCard && !canFinish
                ? "none"
                : `0 6px 28px ${card.accent}55`,
              transition:"all 0.28s cubic-bezier(0.34,1.2,0.64,1)",
              WebkitTapHighlightColor:"transparent",
              opacity: loading ? 0.7 : 1,
              display:"flex", alignItems:"center",
              justifyContent:"center", gap:8,
            }}>
            {loading
              ? "Wird gespeichert…"
              : isLastCard
                ? "🤝  Jetzt HUI Mitglied werden"
                : step === 0 ? "Los geht's  →"
                : step === 1 ? "Weiter  →"
                : "Weiter  →"
            }
          </button>

          {/* Skip — nur bei Karte 0 */}
          {step === 0 && (
            <button onClick={onClose} style={{
              display:"block", width:"100%",
              paddingTop:14, background:"none", border:"none",
              color:"rgba(255,255,255,0.4)", fontSize:13,
              fontWeight:500, cursor:"pointer", fontFamily:"inherit",
              WebkitTapHighlightColor:"transparent",
            }}>
              Jetzt nicht
            </button>
          )}
        </div>
      </div>
    </>
  );
}
