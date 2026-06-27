// src/pages/MyCreatorDashboard.jsx
// ═══════════════════════════════════════════════════════════════════
// LEGACY — SUPERSEDED BY COMMERCE 2.0 — REMOVE AFTER PHASE 5
// Kanonisch: CreatorDashboard.jsx
// ═══════════════════════════════════════════════════════════════════
// HUI Vertrauensprofil v3
// ═══════════════════════════════════════════════════════════════
// "Mein HUI" — persönliches Zuhause innerhalb der Gemeinschaft
// Kein Instagram. Kein LinkedIn. Kein Etsy.
// Stattdessen: Vertrauen · Wirken · Empfehlungen · Gemeinschaft.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth }          from "../lib/AuthContext.jsx";
import { supabase }         from "../lib/supabaseClient.js";
import { useHuiActions, A } from "../core/hui.actions.js";

// ── Design Tokens ─────────────────────────────────────────────
const T = {
  pageBg:    "#F8F9FB",
  cardBg:    "#FFFFFF",
  heroBg:    "linear-gradient(160deg,#F0FDFC 0%,#FFF8F6 60%,#F8F9FB 100%)",
  teal:      "#1ECFCB", tealDeep:"#0DC4B5",
  tealLight: "#E6FAFA", tealGlow: "rgba(30,207,203,0.14)",
  coral:     "#FF7A59", coralLight:"#FFF2EE",
  green:     "#22C55E", gold:"#D4952A",
  ink:       "#1A1F2E", ink2:"#3D4356",
  soft:      "#7A8299", muted:"#B0B8CC",
  border:    "rgba(26,31,46,0.07)",
  borderSoft:"rgba(26,31,46,0.04)",
  shadow:    "0 2px 20px rgba(26,31,46,0.06)",
  shadowMd:  "0 8px 32px rgba(26,31,46,0.09)",
  shadowSm:  "0 1px 8px rgba(26,31,46,0.05)",
  shadowTeal:"0 6px 24px rgba(30,207,203,0.20)",
  r:20, r2:16, r3:12, rFull:999,
};

// ── Helpers ───────────────────────────────────────────────────
const safeStr = (v, fb="") => (v && typeof v === "string" ? v.trim() : fb);
const safeNum = (v, fb=0)  => { const n=Number(v); return isFinite(n)?n:fb; };
const fmtEur  = (n) => "€"+safeNum(n).toLocaleString("de-DE",{minimumFractionDigits:0});

function fmtMonthYear(ts) {
  if (!ts) return null;
  try {
    return new Date(ts).toLocaleDateString("de-DE",{month:"long",year:"numeric"});
  } catch { return null; }
}
function fmtDate(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleDateString("de-DE",{month:"short",year:"numeric"});
  } catch { return ""; }
}

// ── Vertrauensstatus berechnen ────────────────────────────────
function calcTrustStatus(recs=0, experiences=0) {
  if (recs >= 10 || experiences >= 20) return { icon:"💎", label:"Vertrauenspartner", color:T.gold };
  if (recs >= 5  || experiences >= 10) return { icon:"🌳", label:"Bewährtes Mitglied", color:T.teal };
  if (recs >= 2  || experiences >= 3)  return { icon:"🌿", label:"Empfohlenes Mitglied", color:T.green };
  return { icon:"🌱", label:"Neues Mitglied", color:T.soft };
}

// ── CSS ───────────────────────────────────────────────────────
let _css = false;
function injectCSS() {
  if (_css || typeof document === "undefined") return; _css = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes mcd-rise  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
    @keyframes mcd-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
    @keyframes orb-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(30,207,203,0.30)} 50%{box-shadow:0 0 0 8px rgba(30,207,203,0)} }
    @keyframes mcd-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes mcd-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .mcd-tap { -webkit-tap-highlight-color:transparent; touch-action:manipulation; user-select:none; cursor:pointer; }
    .mcd-scroll { -webkit-overflow-scrolling:touch; overflow-y:auto; overflow-x:hidden; }
    .mcd-scroll::-webkit-scrollbar { display:none; }
    .mcd-press:active { transform:scale(0.982); transition:transform .12s ease; }
    .mcd-skeleton {
      background:linear-gradient(90deg,#F0F2F8 25%,#E8EBF5 50%,#F0F2F8 75%);
      background-size:400% 100%;
      animation:mcd-shimmer 1.4s ease infinite;
    }
  `;
  document.head.appendChild(s);
}

// ── Tap-Wrapper ───────────────────────────────────────────────
function Tap({ onClick, style, children, className="" }) {
  const [p, setP] = useState(false);
  return (
    <div
      className={`mcd-tap ${className}`}
      onClick={onClick}
      onTouchStart={() => setP(true)}
      onTouchEnd={() => setP(false)}
      onTouchCancel={() => setP(false)}
      style={{ transform: p?"scale(0.982)":"scale(1)", transition:"transform .12s ease", ...style }}
    >{children}</div>
  );
}

// ── Section Label ─────────────────────────────────────────────
function SLabel({ text, sub }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:15, fontWeight:700, color:T.ink, letterSpacing:-0.2 }}>{text}</div>
      {sub && <div style={{ fontSize:12, color:T.soft, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// ── Menu Row ──────────────────────────────────────────────────
function MenuRow({ icon, label, onClick, danger, last }) {
  return (
    <Tap onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
      borderBottom: last ? "none" : `1px solid ${T.borderSoft}`,
    }}>
      <div style={{
        width:34, height:34, borderRadius:10, flexShrink:0,
        background: danger ? T.coralLight : T.tealLight,
        display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
      }}>{icon}</div>
      <span style={{ flex:1, fontSize:15, fontWeight:500, color: danger ? T.coral : T.ink }}>{label}</span>
      <span style={{ fontSize:18, color:T.muted }}>›</span>
    </Tap>
  );
}

// ══════════════════════════════════════════════
// HERO SECTION
// ══════════════════════════════════════════════
function HeroSection({ profile, trustStatus, onViewProfile, onCreate, onClose }) {
  const name   = safeStr(profile?.display_name || profile?.full_name || profile?.email?.split("@")[0], "Mitglied");
  const uname  = safeStr(profile?.username, "");
  const avatar = profile?.avatar_url || null;
  const bio    = safeStr(profile?.bio || profile?.tagline, "");
  const talent = safeStr(profile?.talent, "");
  const verified = !!(profile?.verified || profile?.is_verified);

  return (
    <div style={{ background:T.heroBg, padding:"20px 20px 24px", position:"relative", overflow:"hidden" }}>
      {/* Ambient */}
      <div style={{ position:"absolute",top:-60,right:-40,width:200,height:200,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(30,207,203,0.08) 0%,transparent 70%)",
        pointerEvents:"none",animation:"mcd-float 10s ease-in-out infinite" }}/>
      <div style={{ position:"absolute",bottom:-40,left:-30,width:160,height:160,borderRadius:"50%",
        background:"radial-gradient(circle,rgba(255,122,89,0.06) 0%,transparent 70%)",
        pointerEvents:"none",animation:"mcd-float 13s 2s ease-in-out infinite" }}/>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
        <div style={{ fontSize:20, fontWeight:900, letterSpacing:-0.8,
          background:"linear-gradient(135deg,#1ECFCB 0%,#FF7A59 100%)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Mein HUI
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Tap onClick={onClose} style={{
            width:34, height:34, borderRadius:12, background:T.cardBg,
            border:`1px solid ${T.border}`, boxShadow:T.shadowSm,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:16,
          }}>✕</Tap>
        </div>
      </div>

      {/* Profil */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:16 }}>
        {/* Avatar */}
        <div style={{ position:"relative", flexShrink:0 }}>
          <div style={{ width:74,height:74,borderRadius:"50%",padding:3,
            background:"linear-gradient(135deg,#1ECFCB 0%,#FF7A59 100%)",
            boxShadow:T.shadowTeal, animation:"orb-pulse 3s ease-in-out infinite" }}>
            <div style={{ width:"100%",height:"100%",borderRadius:"50%",
              background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden" }}>
              {avatar
                ? <img src={avatar} alt={name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <span style={{fontSize:26,color:T.teal,fontWeight:700}}>{name[0]?.toUpperCase()}</span>}
            </div>
          </div>
          {/* Trust-Dot */}
          <div style={{
            position:"absolute", bottom:2, right:2,
            width:22, height:22, borderRadius:"50%",
            background:trustStatus?.color || T.soft,
            border:"2.5px solid #fff",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:10, boxShadow:"0 2px 6px rgba(0,0,0,0.12)",
          }}>{trustStatus?.icon}</div>
        </div>

        {/* Identity */}
        <div style={{ flex:1, minWidth:0 }}>
          {talent && (
            <div style={{ fontSize:11,fontWeight:700,color:T.teal,
              letterSpacing:1,textTransform:"uppercase",marginBottom:3 }}>{talent}</div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:22,fontWeight:800,color:T.ink,
              letterSpacing:-0.6,lineHeight:1.1 }}>{name}</span>
            {verified && (
              <div style={{ width:20,height:20,borderRadius:"50%",
                background:"linear-gradient(135deg,#1ECFCB,#0DC4B5)",
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,color:"#fff",fontWeight:700,flexShrink:0 }}>✓</div>
            )}
          </div>
          {uname && <div style={{ fontSize:13,color:T.soft,marginTop:2 }}>@{uname}</div>}
          {bio && (
            <div style={{ fontSize:13,color:T.ink2,marginTop:6,lineHeight:1.45 }}>{bio}</div>
          )}
          {/* Trust Status Badge */}
          {trustStatus && (
            <div style={{
              display:"inline-flex", alignItems:"center", gap:5,
              marginTop:8, padding:"4px 10px", borderRadius:999,
              background:`${trustStatus.color}12`,
              border:`1px solid ${trustStatus.color}28`,
            }}>
              <span style={{ fontSize:11 }}>{trustStatus.icon}</span>
              <span style={{ fontSize:11, fontWeight:700, color:trustStatus.color }}>
                {trustStatus.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display:"flex", gap:10, marginTop:18 }}>
        <button className="mcd-tap" onClick={onViewProfile} style={{
          flex:1, background:T.cardBg, border:`1.5px solid ${T.border}`,
          borderRadius:T.rFull, padding:"10px 16px", fontSize:13, fontWeight:600,
          color:T.ink2, boxShadow:T.shadowSm,
          display:"flex", alignItems:"center", justifyContent:"center", gap:6, cursor:"pointer",
        }}><span>👁</span> Profil ansehen</button>
        <button className="mcd-tap" onClick={onCreate} style={{
          flex:1, background:"linear-gradient(135deg,#1ECFCB 0%,#FF7A59 100%)",
          border:"none", borderRadius:T.rFull, padding:"10px 16px",
          fontSize:13, fontWeight:700, color:"#fff", boxShadow:T.shadowTeal,
          display:"flex", alignItems:"center", justifyContent:"center", gap:6, cursor:"pointer",
        }}><span style={{fontSize:15}}>+</span> Erstellen</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// 1. MEIN WIRKEN
// ══════════════════════════════════════════════
function MeinWirken({ data, loading, onPress }) {
  const items = [
    { icon:"💚", label:"Weiterempfehlungen erhalten", value:data?.recs ?? 0     },
    { icon:"🎨", label:"Werke veröffentlicht",        value:data?.works ?? 0    },
    { icon:"🔭", label:"Erlebnisse durchgeführt",     value:data?.exps ?? 0     },
    { icon:"🌍", label:"Impact-Projekte unterstützt", value:data?.impact ?? 0   },
  ];
  const seit = fmtMonthYear(data?.since);

  return (
    <Tap onClick={onPress} style={{
      background:T.cardBg, borderRadius:T.r, padding:"18px 18px",
      border:`1px solid ${T.border}`, boxShadow:T.shadow,
      animation:"mcd-rise .4s .05s ease both",
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>💚</span>
          <span style={{ fontSize:15, fontWeight:800, color:T.ink }}>Mein Wirken</span>
        </div>
        <span style={{ fontSize:14, color:T.muted }}>›</span>
      </div>

      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[0,1,2,3].map(i => (
            <div key={i} className="mcd-skeleton" style={{ height:18, borderRadius:8, width:`${70+i*8}%` }}/>
          ))}
        </div>
      ) : (
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {items.map(({ icon, label, value }) => (
              <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:15 }}>{icon}</span>
                  <span style={{ fontSize:13, color:T.ink2 }}>{label}</span>
                </div>
                <span style={{ fontSize:16, fontWeight:800, color:T.teal }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Kein Follower-Count. Kein Like-Count. */}
          <div style={{
            marginTop:14, paddingTop:12, borderTop:`1px solid ${T.borderSoft}`,
            display:"flex", alignItems:"center", gap:6,
          }}>
            <span style={{ fontSize:12 }}>📅</span>
            <span style={{ fontSize:12, color:T.soft }}>
              {seit ? `Mitglied seit ${seit}` : "Mitglied der HUI-Gemeinschaft"}
            </span>
          </div>

          {/* HUI-Prinzip */}
          <div style={{
            marginTop:10, padding:"8px 12px", borderRadius:10,
            background:T.tealGlow,
            fontSize:11, color:T.tealDeep, fontStyle:"italic", lineHeight:1.5,
          }}>
            Keine Likes · Keine Follower · Keine Sterne. Nur echtes Wirken.
          </div>
        </>
      )}
    </Tap>
  );
}

// ══════════════════════════════════════════════
// 2. MEINE MOTIVATION
// ══════════════════════════════════════════════
function MeineMotivation({ motivation, onEdit }) {
  const has = !!motivation?.trim();
  return (
    <Tap onClick={onEdit} style={{
      background: has ? T.cardBg : `${T.teal}06`,
      borderRadius:T.r, padding:"16px 18px",
      border:`1.5px solid ${has ? T.border : T.teal+"22"}`,
      boxShadow:T.shadowSm,
      animation:"mcd-rise .4s .1s ease both",
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:17 }}>🌱</span>
          <span style={{ fontSize:14, fontWeight:700, color:T.ink }}>Warum ich auf HUI bin</span>
        </div>
        <div style={{
          fontSize:11, fontWeight:700, color:T.teal,
          padding:"3px 10px", borderRadius:999,
          background:T.tealLight,
        }}>Bearbeiten</div>
      </div>
      {has ? (
        <p style={{ margin:0, fontSize:14, color:T.ink2, lineHeight:1.65,
          fontStyle:"italic" }}>
          "{motivation}"
        </p>
      ) : (
        <p style={{ margin:0, fontSize:13, color:T.soft, lineHeight:1.5 }}>
          Teile mit der Community, was dich antreibt, welche Werte dir wichtig sind
          und warum du Teil von HUI bist. Freiwillig, ehrlich, persönlich.
        </p>
      )}
    </Tap>
  );
}

// ══════════════════════════════════════════════
// 3. WEITEREMPFEHLUNGEN (keine Sterne)
// ══════════════════════════════════════════════
const COLLAB_LABELS = {
  experience: "Nach einem Erlebnis",
  work:       "Nach Werkkauf",
  collab:     "Nach Zusammenarbeit",
  booking:    "Nach einer Buchung",
};

function WeiterempfehlungenCard({ recs, loading, onOpen }) {
  const count = recs?.length ?? 0;
  const preview = (recs || []).slice(0, 2);

  return (
    <Tap onClick={onOpen} style={{
      background:T.cardBg, borderRadius:T.r, padding:"18px 18px",
      border:`1px solid ${T.border}`, boxShadow:T.shadow,
      animation:"mcd-rise .4s .15s ease both",
    }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>💚</span>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:T.ink }}>
              Weiterempfehlungen
            </div>
            {!loading && (
              <div style={{ fontSize:12, color:T.teal, fontWeight:600 }}>
                {count === 0
                  ? "Noch keine Empfehlungen"
                  : `Von ${count} ${count === 1 ? "Person" : "Menschen"} weiterempfohlen`}
              </div>
            )}
          </div>
        </div>
        <span style={{ fontSize:14, color:T.muted }}>›</span>
      </div>

      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <div className="mcd-skeleton" style={{ height:64, borderRadius:12 }}/>
          <div className="mcd-skeleton" style={{ height:64, borderRadius:12 }}/>
        </div>
      ) : count === 0 ? (
        <div style={{
          padding:"14px 16px", borderRadius:T.r2,
          background:T.tealGlow, textAlign:"center",
        }}>
          <div style={{ fontSize:12, color:T.tealDeep, lineHeight:1.5 }}>
            Empfehlungen entstehen nach echten Erlebnissen, Buchungen und Zusammenarbeiten.
          </div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {preview.map((rec, i) => {
            const author = rec.from_profile?.display_name || "Mitglied";
            const text   = rec.text || "";
            return (
              <div key={rec.id || i} style={{
                padding:"12px 14px", borderRadius:T.r2,
                background:`${T.teal}07`,
                border:`1px solid ${T.teal}15`,
              }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.teal, marginBottom:4 }}>
                  💚 Empfohlen
                </div>
                {text && (
                  <div style={{ fontSize:13, color:T.ink2, lineHeight:1.5,
                    fontStyle:"italic", marginBottom:6 }}>
                    "{text.length > 100 ? text.slice(0,100)+"…" : text}"
                  </div>
                )}
                <div style={{ fontSize:11, color:T.soft }}>— {author}</div>
              </div>
            );
          })}
          {count > 2 && (
            <div style={{ textAlign:"center", fontSize:12, color:T.teal, fontWeight:600, paddingTop:4 }}>
              + {count - 2} weitere Empfehlungen ansehen
            </div>
          )}
        </div>
      )}
    </Tap>
  );
}

// ══════════════════════════════════════════════
// 4. HUI-VERTRAUENSSTATUS
// ══════════════════════════════════════════════
function VertrauensstatusCard({ trustStatus, recs, exps }) {
  const STATUS_ALL = [
    { icon:"🌱", label:"Neues Mitglied",     desc:"Willkommen in der HUI-Gemeinschaft.",               color:T.soft  },
    { icon:"🌿", label:"Empfohlenes Mitglied",desc:"2+ Weiterempfehlungen oder 3+ Erlebnisse.",        color:T.green },
    { icon:"🌳", label:"Bewährtes Mitglied",  desc:"5+ Weiterempfehlungen oder 10+ Erlebnisse.",       color:T.teal  },
    { icon:"💎", label:"Vertrauenspartner",   desc:"10+ Weiterempfehlungen oder 20+ Erlebnisse.",      color:T.gold  },
  ];
  const currentIdx = STATUS_ALL.findIndex(s => s.label === trustStatus?.label);

  return (
    <div style={{
      background:T.cardBg, borderRadius:T.r, padding:"16px 18px",
      border:`1px solid ${T.border}`, boxShadow:T.shadowSm,
      animation:"mcd-rise .4s .2s ease both",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:18 }}>{trustStatus?.icon}</span>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:T.ink }}>
            HUI-Vertrauensstatus
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:trustStatus?.color }}>
            {trustStatus?.label}
          </div>
        </div>
      </div>

      {/* Status-Leiter */}
      <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:12 }}>
        {STATUS_ALL.map((s, i) => {
          const reached = i <= currentIdx;
          return (
            <React.Fragment key={s.label}>
              <div style={{ textAlign:"center", flex:1 }}>
                <div style={{
                  width:28, height:28, borderRadius:"50%", margin:"0 auto 4px",
                  background: reached ? s.color : T.border,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12,
                  boxShadow: reached ? `0 0 0 3px ${s.color}20` : "none",
                  transition:"all .3s ease",
                }}>{s.icon}</div>
                <div style={{ fontSize:8.5, color: reached ? s.color : T.muted,
                  fontWeight: reached ? 700 : 400, lineHeight:1.2 }}>
                  {s.label.split(" ")[0]}
                </div>
              </div>
              {i < STATUS_ALL.length-1 && (
                <div style={{
                  flex:1, height:2, borderRadius:1,
                  background: i < currentIdx
                    ? `linear-gradient(90deg,${STATUS_ALL[i].color},${STATUS_ALL[i+1].color})`
                    : T.border,
                  marginBottom:16,
                  transition:"background .3s ease",
                }}/>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Keine Gamification */}
      <div style={{ fontSize:11, color:T.soft, textAlign:"center", lineHeight:1.5 }}>
        Automatisch berechnet aus echten Erlebnissen und Empfehlungen.
        <br/>Keine Punkte. Kein Level-System. Kein Ranking.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// 5. WIRKUNGSCHRONIK
// ══════════════════════════════════════════════
function WirkungsChronik({ events, loading }) {
  if (loading) return (
    <div style={{ background:T.cardBg, borderRadius:T.r, padding:"16px 18px",
      border:`1px solid ${T.border}`, boxShadow:T.shadowSm,
      animation:"mcd-rise .4s .25s ease both" }}>
      <div style={{ fontSize:14, fontWeight:700, color:T.ink, marginBottom:12 }}>
        🕰 Mein Weg auf HUI
      </div>
      {[0,1,2].map(i => (
        <div key={i} className="mcd-skeleton" style={{ height:48, borderRadius:10, marginBottom:8 }}/>
      ))}
    </div>
  );

  if (!events || events.length === 0) return null;

  return (
    <div style={{ background:T.cardBg, borderRadius:T.r, padding:"16px 18px",
      border:`1px solid ${T.border}`, boxShadow:T.shadowSm,
      animation:"mcd-rise .4s .25s ease both" }}>
      <div style={{ fontSize:14, fontWeight:700, color:T.ink, marginBottom:16 }}>
        🕰 Mein Weg auf HUI
      </div>

      <div style={{ position:"relative", paddingLeft:20 }}>
        {/* Vertikale Linie */}
        <div style={{
          position:"absolute", left:8, top:0, bottom:0, width:2,
          background:`linear-gradient(to bottom,${T.teal},${T.teal}22)`,
          borderRadius:1,
        }}/>

        {events.map((ev, i) => (
          <div key={i} style={{ display:"flex", gap:12, marginBottom: i<events.length-1 ? 16 : 0,
            animation:`mcd-rise .4s ${0.08*i}s ease both` }}>
            {/* Dot */}
            <div style={{
              position:"absolute", left:3.5, width:9, height:9, borderRadius:"50%",
              background: i===0 ? T.teal : T.cardBg,
              border:`2px solid ${T.teal}`,
              marginTop:4, flexShrink:0,
            }}/>
            <div style={{ paddingLeft:8 }}>
              <div style={{ fontSize:10, color:T.soft, marginBottom:2 }}>{fmtDate(ev.date)}</div>
              <div style={{ fontSize:13, fontWeight:600, color:T.ink, lineHeight:1.3 }}>
                {ev.icon} {ev.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// 6. MEIN NETZWERK (keine Follower)
// ══════════════════════════════════════════════
function MeinNetzwerk({ connections, loading, onOpen }) {
  return (
    <Tap onClick={onOpen} style={{
      background:T.cardBg, borderRadius:T.r, padding:"16px 18px",
      border:`1px solid ${T.border}`, boxShadow:T.shadowSm,
      animation:"mcd-rise .4s .3s ease both",
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>🤝</span>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:T.ink }}>Mein Netzwerk</div>
            {!loading && (
              <div style={{ fontSize:13, fontWeight:800, color:T.teal, marginTop:1 }}>
                {connections ?? 0} {(connections ?? 0) === 1 ? "Verbindung" : "Verbindungen"}
              </div>
            )}
          </div>
        </div>
        <span style={{ fontSize:14, color:T.muted }}>›</span>
      </div>
      {!loading && (
        <div style={{ marginTop:10, fontSize:11, color:T.soft, lineHeight:1.5 }}>
          Nur echte Verbindungen — Menschen mit denen du chattest,
          zusammenarbeitest oder Erlebnisse teilst.
          <br/>Keine Follower. Keine Reichweitenzahlen.
        </div>
      )}
    </Tap>
  );
}

// ══════════════════════════════════════════════
// 7. IMPACT-VERBINDUNG
// ══════════════════════════════════════════════
function ImpactVerbindung({ impactData, loading, onOpen }) {
  const eur = safeNum(impactData?.impact_eur, 0);
  const proj = safeNum(impactData?.projects, 0);

  return (
    <Tap onClick={onOpen} style={{
      background:`linear-gradient(130deg,${T.teal}10,${T.teal}04)`,
      border:`1.5px solid ${T.teal}25`,
      borderRadius:T.r, padding:"16px 18px",
      boxShadow:T.shadowSm,
      animation:"mcd-rise .4s .35s ease both",
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>❤️</span>
          <span style={{ fontSize:14, fontWeight:700, color:T.ink }}>Mein Beitrag zur Wirkung</span>
        </div>
        <span style={{ fontSize:14, color:T.muted }}>›</span>
      </div>
      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <div className="mcd-skeleton" style={{ height:16, borderRadius:8, width:"60%" }}/>
          <div className="mcd-skeleton" style={{ height:16, borderRadius:8, width:"45%" }}/>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <p style={{ margin:0, fontSize:12, color:T.ink2, lineHeight:1.5 }}>
            Durch deine Aktivitäten wurden bereits:
          </p>
          {[
            { icon:"💶", val:`${fmtEur(eur)} in den Impact Pool eingebracht`, active: eur > 0 },
            { icon:"🌍", val:`${proj} ${proj===1?"Herzensprojekt":"Herzensprojekte"} unterstützt`, active: proj > 0 },
          ].map(({ icon, val, active }, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8,
              opacity: active ? 1 : 0.5 }}>
              <span style={{ fontSize:14 }}>{icon}</span>
              <span style={{ fontSize:13, fontWeight: active ? 700 : 400, color: active ? T.ink : T.soft }}>
                {val}
              </span>
            </div>
          ))}
          {eur === 0 && proj === 0 && (
            <div style={{ fontSize:12, color:T.tealDeep, lineHeight:1.5, marginTop:4 }}>
              Durch Buchungen und Werkkäufe fließen automatisch Anteile in den HUI Impact Pool.
            </div>
          )}
        </div>
      )}
    </Tap>
  );
}

// ══════════════════════════════════════════════
// HAUPTKOMPONENTE
// ══════════════════════════════════════════════
export default function MyCreatorDashboard({ onClose }) {
  const { profile: rawAuth, user } = useAuth();
  const actions = useHuiActions();

  const [dbProfile,   setDbProfile]   = useState(null);
  const [wirkenData,  setWirkenData]  = useState(null);
  const [recs,        setRecs]        = useState([]);
  const [chronik,     setChronik]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [motivEdit,   setMotivEdit]   = useState(false);
  const [motivText,   setMotivText]   = useState("");
  const [motivSaving, setMotivSaving] = useState(false);

  const authId = rawAuth?.id || user?.id || null;

  useEffect(() => { injectCSS(); }, []);

  // ── Daten laden ─────────────────────────────────────────────
  useEffect(() => {
    if (!authId) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      try {
        const [profRes, worksRes, expsRes, recsRes, fcRes, paymentsRes] = await Promise.all([
          // Profil
          supabase.from("profiles")
            .select("id,display_name,username,avatar_url,bio,location_label,member_since,role,has_talent_profile,talent,membership_type,membership_active,followers_count,impact_eur,profile_views") // Identity Contract v1.0 (Dead Code)
            .eq("id", authId).single(),
          // Werke
          supabase.from("works")
            .select("id,created_at,title")
            .eq("user_id", authId)
            .order("created_at", { ascending:false }).limit(50),
          // Erlebnisse
          supabase.from("experiences")
            .select("id,created_at,title")
            .eq("user_id", authId)
            .order("created_at", { ascending:false }).limit(50),
          // Empfehlungen
          supabase.from("recommendations")
            .select(`id,text,is_public,created_at,
              from_profile:profiles!recommendations_from_user_id_fkey(display_name,avatar_url)`)
            .eq("to_user_id", authId)
            .eq("is_public", true)
            .order("created_at", { ascending:false }).limit(20),
          // Verbindungen (gegenseitige Follows)
          supabase.rpc("get_follow_counts", { target_id: authId }),
          // Impact-Zahlungen
          supabase.from("payments")
            .select("impact_eur,created_at")
            .eq("user_id", authId).limit(200),
        ]);
        if (cancelled) return;

        const prof  = profRes.data;
        const works = worksRes.data  || [];
        const exps  = expsRes.data   || [];
        const recs_ = recsRes.data   || [];
        const pays  = paymentsRes.data || [];

        // Motivation aus Profil
        setMotivText(safeStr(prof?.motivation || prof?.bio, ""));

        // Wirken-Daten
        const impactEur  = pays.reduce((s,p) => s+safeNum(p.impact_eur), 0);
        const impactProj = safeNum(prof?.impact_eur, 0) > 0 ? 1 : 0; // Vereinfachung
        setWirkenData({
          recs:   recs_.length,
          works:  works.length,
          exps:   exps.length,
          impact: safeNum(prof?.experiences_count, 0) > 0 ? 1 : 0,
          since:  prof?.membership_since || prof?.created_at,
          impact_eur: impactEur || safeNum(prof?.impact_eur, 0),
          projects:   impactProj,
          connections: fcRes.data?.[0]?.followers ?? safeNum(prof?.connections_count, 0),
        });

        setRecs(recs_);
        setDbProfile(prof);

        // Chronik aufbauen
        const events = [];
        if (prof?.membership_since || prof?.created_at) {
          events.push({ date: prof?.membership_since || prof?.created_at, icon:"🌱", label:"HUI-Mitglied geworden" });
        }
        works.forEach(w => events.push({ date:w.created_at, icon:"🎨", label:`Werk veröffentlicht: ${w.title||""}` }));
        exps.forEach(e  => events.push({ date:e.created_at, icon:"🔭", label:`Erlebnis erstellt: ${e.title||""}` }));
        recs_.forEach((r,i) => {
          if (i < 3) events.push({ date:r.created_at, icon:"💚", label:"Weiterempfehlung erhalten" });
        });
        events.sort((a,b) => new Date(b.date)-new Date(a.date));
        setChronik(events.slice(0, 6));

      } catch(e) { console.warn("[MeinHUI]", e?.message); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [authId]);

  const profile = useMemo(() => ({
    ...(rawAuth||{}), ...(dbProfile||{}),
    id:authId, user_id:authId,
  }), [rawAuth, dbProfile, authId]);

  const trustStatus = useMemo(() =>
    calcTrustStatus(recs.length, wirkenData?.exps ?? 0),
  [recs.length, wirkenData?.exps]);

  // ── Motivation speichern ─────────────────────────────────────
  const saveMotivation = useCallback(async () => {
    if (!authId) return;
    setMotivSaving(true);
    try {
      await supabase.from("profiles")
        .update({ motivation: motivText.trim() })
        .eq("id", authId);
      setMotivEdit(false);
    } catch(e) { console.warn("[MeinHUI] Motivation:", e?.message); }
    finally { setMotivSaving(false); }
  }, [authId, motivText]);

  // ── MENU ─────────────────────────────────────────────────────
  const MENU = [
    { icon:"✏️", label:"Profil bearbeiten",      cb:()=>actions[A.OPEN_PROFILE_EDITOR]?.() },
    { icon:"📅", label:"Meine Buchungen",         cb:()=>actions[A.OPEN_EARNINGS]?.() },
    { icon:"💰", label:"Einnahmen & Zahlungen",   cb:()=>actions[A.OPEN_EARNINGS]?.() },
    { icon:"🌍", label:"Impact Pool",             cb:()=>actions[A.OPEN_IMPACT]?.() },
    { icon:"🔒", label:"Privatsphäre",            cb:()=>actions[A.OPEN_PRIVACY]?.() },
    { icon:"🎧", label:"Support",                cb:()=>setShowSupport(true) },
        { icon:"↪️", label:"Abmelden",               danger:true, cb:()=>actions[A.SIGN_OUT]?.() },
  ];

  if (!authId && !loading) {
    return (
      <div style={{ position:"fixed",inset:0,zIndex:9500,background:T.pageBg,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontFamily:"-apple-system,sans-serif" }}>
        <p style={{ color:T.soft,fontSize:15 }}>Nicht angemeldet</p>
      </div>
    );
  }

  return (
    <div className="mcd-scroll" style={{
      position:"fixed", inset:0, zIndex:9500,
      background:T.pageBg,
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif",
      paddingBottom:"max(100px, calc(88px + env(safe-area-inset-bottom,0px)))",
      WebkitFontSmoothing:"antialiased",
    }}>
      {/* ── HERO ── */}
      <HeroSection
        profile={profile}
        trustStatus={trustStatus}
        onViewProfile={() => actions[A.VIEW_OWN_PUBLIC_PROFILE]?.()}
        onCreate={() => actions[A.CREATE_EXPERIENCE]?.()}
        onClose={onClose}
      />

      {/* ── CONTENT ── */}
      <div style={{ padding:"20px 16px", display:"flex", flexDirection:"column", gap:16 }}>

        {/* 1. Mein Wirken */}
        <MeinWirken
          data={wirkenData}
          loading={loading}
          onPress={() => actions[A.VIEW_OWN_PUBLIC_PROFILE]?.()}
        />

        {/* 2. Meine Motivation */}
        {motivEdit ? (
          <div style={{ background:T.cardBg, borderRadius:T.r, padding:"16px 18px",
            border:`1.5px solid ${T.teal}33`, boxShadow:T.shadowMd }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.ink, marginBottom:10 }}>
              🌱 Warum ich auf HUI bin
            </div>
            <textarea
              value={motivText}
              onChange={e => setMotivText(e.target.value)}
              placeholder="Ich glaube daran, dass…"
              maxLength={400}
              rows={4}
              autoFocus
              style={{ width:"100%", padding:"12px 14px", borderRadius:12,
                border:`1.5px solid ${T.teal}44`, background:"#fff",
                fontSize:14, color:T.ink, lineHeight:1.65, resize:"none",
                outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}
            />
            <div style={{ fontSize:11, color:T.muted, textAlign:"right", marginBottom:10 }}>
              {motivText.length}/400
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setMotivEdit(false)} style={{
                flex:1, padding:"10px", borderRadius:12, border:`1px solid ${T.border}`,
                background:"none", fontSize:13, color:T.soft, cursor:"pointer",
              }}>Abbrechen</button>
              <button onClick={saveMotivation} disabled={motivSaving} style={{
                flex:2, padding:"10px", borderRadius:12, border:"none",
                background:`linear-gradient(135deg,${T.teal},#22DDD0)`,
                fontSize:13, fontWeight:700, color:"#fff", cursor:"pointer",
                opacity: motivSaving ? 0.7 : 1,
              }}>{motivSaving ? "Speichern…" : "Speichern ✓"}</button>
            </div>
          </div>
        ) : (
          <MeineMotivation
            motivation={motivText}
            onEdit={() => setMotivEdit(true)}
          />
        )}

        {/* 3. Weiterempfehlungen */}
        <WeiterempfehlungenCard
          recs={recs}
          loading={loading}
          onOpen={() => actions[A.VIEW_OWN_PUBLIC_PROFILE]?.()}
        />

        {/* 4. Vertrauensstatus */}
        <VertrauensstatusCard
          trustStatus={trustStatus}
          recs={recs.length}
          exps={wirkenData?.exps ?? 0}
        />

        {/* 5. Wirkungschronik */}
        <WirkungsChronik events={chronik} loading={loading} />

        {/* 6. Mein Netzwerk */}
        <MeinNetzwerk
          connections={wirkenData?.connections}
          loading={loading}
          onOpen={() => actions[A.VIEW_OWN_PUBLIC_PROFILE]?.()}
        />

        {/* 7. Impact-Verbindung */}
        <ImpactVerbindung
          impactData={wirkenData}
          loading={loading}
          onOpen={() => actions[A.OPEN_IMPACT]?.()}
        />

        {/* ── Account-Menü ── */}
        <div>
          <SLabel text="Account" />
          <div style={{ background:T.cardBg, border:`1px solid ${T.border}`,
            borderRadius:T.r, overflow:"hidden", boxShadow:T.shadowSm,
            animation:"mcd-rise .4s .45s ease both" }}>
            {MENU.map(({ icon, label, danger, cb }, i) => (
              <MenuRow key={label} icon={icon} label={label}
                danger={danger} onClick={cb} last={i===MENU.length-1}/>
            ))}
          </div>
        </div>

        {/* Profil vervollständigen */}
        {!profile?.profile_complete && !loading && (
          <Tap onClick={() => actions[A.OPEN_PROFILE_EDITOR]?.()} style={{
            background:"linear-gradient(120deg,#FFF8F5 0%,#FFF2EE 100%)",
            border:`1.5px solid rgba(255,122,89,0.2)`, borderRadius:T.r,
            padding:"16px 18px", display:"flex", alignItems:"center", gap:14,
            animation:"mcd-rise .4s .5s ease both",
          }}>
            <div style={{fontSize:22,flexShrink:0}}>✦</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:T.coral,marginBottom:3}}>
                Profil vervollständigen
              </div>
              <div style={{fontSize:12,color:T.soft,lineHeight:1.4}}>
                Vollständige Profile werden häufiger gefunden und weiterempfohlen.
              </div>
            </div>
            <span style={{fontSize:18,color:T.muted}}>›</span>
          </Tap>
        )}

        {/* Support Modal */}
        {showSupport && (
          <SupportPage
            onBack={() => setShowSupport(false)}
            userId={authId}
            userEmail={profile?.email}
            userName={profile?.display_name || profile?.full_name}
          />
        )}

        {/* HUI-Prinzip Footer */}
        <div style={{ textAlign:"center", padding:"8px 0 4px" }}>
          <div style={{ fontSize:12, color:T.muted, lineHeight:1.6 }}>
            Menschen werden bei HUI sichtbar durch ihr Wirken.
            <br/>Nicht durch Likes. Nicht durch Sterne. Nicht durch Reichweite.
          </div>
          <div style={{ marginTop:6, fontSize:14, fontWeight:900,
            background:"linear-gradient(135deg,#1ECFCB,#FF7A59)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            HUI
          </div>
        </div>

      </div>
    </div>
  );
}
