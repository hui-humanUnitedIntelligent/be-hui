// HuiMembershipFlow.jsx — Emotionales HUI Mitgliedschafts-Onboarding
// 4 Karten, clean, kein Formular-Stress

import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coralGlow:"rgba(255,138,107,0.22)",
  cream:"#F9F7F4", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", muted:"#888",
  border:"rgba(0,0,0,0.07)",
};

const CSS = `
  @keyframes hmfFadeUp {
    from { opacity:0; transform:translateY(24px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes hmfSlideLeft {
    from { opacity:0; transform:translateX(32px); }
    to   { opacity:1; transform:translateX(0); }
  }
  @keyframes hmfPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(22,215,197,0.35); }
    50%     { box-shadow: 0 0 0 16px rgba(22,215,197,0); }
  }
  @keyframes hmfFloat {
    0%,100% { transform:translateY(0px); }
    50%     { transform:translateY(-8px); }
  }
`;

const CARDS = [
  {
    emoji: "🌱",
    emojiAnim: "hmfFloat 3s ease-in-out infinite",
    title: "Willkommen bei HUI",
    text: "Eine Gemeinschaft für Menschen,\nTalente und echte Herzensprojekte.",
    btn: "Weiter",
    bg: `linear-gradient(145deg, rgba(22,215,197,0.07), rgba(255,138,107,0.05))`,
    accent: C.teal,
  },
  {
    emoji: "✨",
    emojiAnim: "hmfFloat 3.5s ease-in-out infinite",
    title: "Zeige dein Talent",
    text: "Teile Werke, Ideen,\nErlebnisse und Momente mit anderen.",
    btn: "Weiter",
    bg: `linear-gradient(145deg, rgba(167,139,250,0.07), rgba(22,215,197,0.05))`,
    accent: "#A78BFA",
  },
  {
    emoji: "💛",
    emojiAnim: "hmfFloat 4s ease-in-out infinite",
    title: "Gemeinsam bewirken",
    text: "Ein Teil der Einnahmen unterstützt\nsoziale und kreative Herzensprojekte.",
    btn: "Weiter",
    bg: `linear-gradient(145deg, rgba(245,166,35,0.07), rgba(255,138,107,0.05))`,
    accent: "#F5A623",
  },
];

export default function HuiMembershipFlow({ onComplete, onClose }) {
  const { user } = useAuth();
  const [step, setStep]       = useState(0);   // 0-3 (4 cards)
  const [agb, setAgb]         = useState(false);
  const [datenschutz, setDatenschutz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  const isLastCard = step === 3;
  const canFinish  = agb && datenschutz;

  async function handleFinish() {
    if (!canFinish || loading) return;
    setLoading(true);
    setError("");
    try {
      const uid = user?.id;
      if (uid) {
        const { error: e } = await supabase
          .from("profiles")
          .update({ has_talent_profile: true, updated_at: new Date().toISOString() })
          .eq("id", uid);
        if (e) { console.error("[HuiMembership]", e); }
      }
      setDone(true);
      setTimeout(() => onComplete?.(), 1400);
    } catch(err) {
      setError("Etwas ist schiefgelaufen. Bitte nochmal versuchen.");
      setLoading(false);
    }
  }

  // ── Success screen
  if (done) return (
    <>
      <style>{CSS}</style>
      <div style={{
        position:"fixed", inset:0, zIndex:3000,
        background:"linear-gradient(145deg,#E6FAF8,#FFF9F4)",
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
      }}>
        <div style={{
          animation:"hmfFadeUp 0.5s ease both",
          textAlign:"center", padding:"0 32px",
        }}>
          <div style={{
            fontSize:80, marginBottom:20,
            animation:"hmfFloat 2s ease-in-out infinite",
          }}>🎉</div>
          <div style={{
            fontWeight:900, fontSize:26, color:C.ink,
            letterSpacing:-0.8, marginBottom:12,
          }}>
            Willkommen in der HUI-Familie!
          </div>
          <div style={{
            fontSize:15, color:C.muted, lineHeight:1.65,
          }}>
            Du bist jetzt Teil von etwas Echtem.
          </div>
        </div>
        {/* Progress dots pulse */}
        <div style={{
          marginTop:40, display:"flex", gap:8,
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width:8, height:8, borderRadius:"50%",
              background:C.teal,
              opacity: 0.3 + i * 0.35,
              animation:`hmfPulse 1.4s ${i*0.2}s ease-in-out infinite`,
            }}/>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:2900,
        background:"rgba(0,0,0,0.35)",
        backdropFilter:"blur(4px)",
        WebkitBackdropFilter:"blur(4px)",
      }}/>

      {/* Sheet */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:2901,
        background:C.card,
        borderRadius:"28px 28px 0 0",
        paddingBottom:"max(32px, env(safe-area-inset-bottom, 32px))",
        boxShadow:"0 -8px 48px rgba(0,0,0,0.14)",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        animation:"hmfFadeUp 0.38s cubic-bezier(0.34,1.3,0.64,1) both",
        maxHeight:"90vh",
        overflow:"hidden",
        display:"flex", flexDirection:"column",
      }}>
        {/* Handle */}
        <div style={{
          width:40, height:4, borderRadius:999,
          background:"rgba(0,0,0,0.12)",
          margin:"14px auto 0",
          flexShrink:0,
        }}/>

        {/* Progress bar */}
        <div style={{
          height:2, margin:"16px 24px 0",
          background:"rgba(0,0,0,0.07)", borderRadius:999,
          flexShrink:0, overflow:"hidden",
        }}>
          <div style={{
            height:"100%", borderRadius:999,
            background:`linear-gradient(90deg,${C.teal},${C.coral})`,
            width:`${((step + 1) / 4) * 100}%`,
            transition:"width 0.4s cubic-bezier(0.34,1.2,0.64,1)",
          }}/>
        </div>

        {/* Card content */}
        <div style={{
          flex:1, overflowY:"auto",
          padding:"28px 28px 8px",
          WebkitOverflowScrolling:"touch",
        }}>

          {/* Cards 0-2 */}
          {step < 3 && (() => {
            const card = CARDS[step];
            return (
              <div key={step} style={{
                animation:"hmfSlideLeft 0.35s cubic-bezier(0.34,1.2,0.64,1) both",
              }}>
                {/* Emoji */}
                <div style={{
                  width:80, height:80, borderRadius:24,
                  background: card.bg,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:40, marginBottom:24,
                  border:`1.5px solid ${card.accent}22`,
                  boxShadow:`0 4px 20px ${card.accent}18`,
                }}>
                  <span style={{ animation:card.emojiAnim, display:"block" }}>
                    {card.emoji}
                  </span>
                </div>

                {/* Step counter */}
                <div style={{
                  fontSize:11.5, fontWeight:700, color:card.accent,
                  letterSpacing:1.2, textTransform:"uppercase",
                  marginBottom:10,
                }}>
                  {step + 1} von 4
                </div>

                {/* Title */}
                <div style={{
                  fontWeight:900, fontSize:26, color:C.ink,
                  letterSpacing:-0.8, lineHeight:1.15, marginBottom:14,
                }}>
                  {card.title}
                </div>

                {/* Text */}
                <div style={{
                  fontSize:16, color:"#5A5A5A", lineHeight:1.7,
                  whiteSpace:"pre-line",
                }}>
                  {card.text}
                </div>
              </div>
            );
          })()}

          {/* Card 3 — Mitglied werden */}
          {step === 3 && (
            <div key="final" style={{
              animation:"hmfSlideLeft 0.35s cubic-bezier(0.34,1.2,0.64,1) both",
            }}>
              {/* Emoji */}
              <div style={{
                width:80, height:80, borderRadius:24,
                background:`linear-gradient(145deg,${C.teal}15,${C.coral}10)`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:40, marginBottom:24,
                border:`1.5px solid ${C.teal}22`,
                boxShadow:`0 4px 20px ${C.teal}18`,
              }}>
                <span style={{ animation:"hmfFloat 3s ease-in-out infinite", display:"block" }}>
                  🤝
                </span>
              </div>

              <div style={{
                fontSize:11.5, fontWeight:700, color:C.teal,
                letterSpacing:1.2, textTransform:"uppercase",
                marginBottom:10,
              }}>
                4 von 4
              </div>

              <div style={{
                fontWeight:900, fontSize:26, color:C.ink,
                letterSpacing:-0.8, lineHeight:1.15, marginBottom:20,
              }}>
                Mitglied werden
              </div>

              {/* Checkboxes */}
              <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:8 }}>
                {[
                  { key:"agb",  checked:agb,  set:setAgb,
                    label:"Ich akzeptiere die", link:"AGB" },
                  { key:"ds",   checked:datenschutz, set:setDatenschutz,
                    label:"Ich akzeptiere die", link:"Datenschutzbestimmungen" },
                ].map(item => (
                  <button key={item.key}
                    onClick={() => item.set(p => !p)}
                    style={{
                      display:"flex", alignItems:"center", gap:14,
                      background: item.checked
                        ? `linear-gradient(145deg,${C.teal}10,${C.coral}06)`
                        : "rgba(0,0,0,0.025)",
                      border: item.checked
                        ? `1.5px solid ${C.teal}44`
                        : `1.5px solid rgba(0,0,0,0.08)`,
                      borderRadius:16, padding:"14px 16px",
                      cursor:"pointer", textAlign:"left",
                      transition:"all 0.22s cubic-bezier(0.34,1.2,0.64,1)",
                      WebkitTapHighlightColor:"transparent",
                    }}>
                    {/* Checkbox */}
                    <div style={{
                      width:24, height:24, borderRadius:8, flexShrink:0,
                      background: item.checked
                        ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                        : "rgba(0,0,0,0.06)",
                      border: item.checked ? "none" : "1.5px solid rgba(0,0,0,0.14)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all 0.2s ease",
                      boxShadow: item.checked ? `0 2px 10px ${C.tealGlow}` : "none",
                    }}>
                      {item.checked && (
                        <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                          <path d="M1 5L5 9L12 1"
                            stroke="white" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span style={{
                      fontSize:14, color:C.ink2, fontWeight:500, lineHeight:1.4,
                    }}>
                      {item.label}{" "}
                      <span style={{ color:C.teal, fontWeight:700 }}>{item.link}</span>
                    </span>
                  </button>
                ))}
              </div>

              {error && (
                <div style={{
                  marginTop:12, padding:"10px 14px",
                  background:"rgba(255,100,100,0.08)",
                  border:"1px solid rgba(255,100,100,0.2)",
                  borderRadius:12, fontSize:13, color:"#c00",
                }}>
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div style={{ padding:"16px 24px 0", flexShrink:0 }}>
          <button
            onClick={step < 3 ? () => setStep(s => s + 1) : handleFinish}
            disabled={step === 3 && (!canFinish || loading)}
            style={{
              width:"100%", padding:"17px 24px",
              background: (step === 3 && !canFinish)
                ? "rgba(0,0,0,0.08)"
                : `linear-gradient(135deg,${C.teal},${C.coral})`,
              border:"none", borderRadius:18,
              color: (step === 3 && !canFinish) ? C.muted : "white",
              fontSize:16, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit", letterSpacing:0.2,
              boxShadow: (step === 3 && !canFinish)
                ? "none"
                : `0 4px 22px ${C.tealGlow}`,
              transition:"all 0.25s cubic-bezier(0.34,1.2,0.64,1)",
              WebkitTapHighlightColor:"transparent",
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? "Wird gespeichert…" :
             step < 3 ? CARDS[step].btn :
             "🤝  HUI Mitglied werden"}
          </button>

          {/* Skip / Close */}
          <button onClick={onClose} style={{
            width:"100%", padding:"13px",
            background:"none", border:"none",
            color:C.muted, fontSize:13.5, fontWeight:500,
            cursor:"pointer", marginTop:4,
            WebkitTapHighlightColor:"transparent",
          }}>
            Jetzt nicht
          </button>
        </div>
      </div>
    </>
  );
}
