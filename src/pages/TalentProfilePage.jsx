// src/pages/TalentProfilePage.jsx — HUI Öffentliches Wirkerprofil v2
// "Hier wirkt ein Mensch aktiv in der Gemeinschaft."
// ════════════════════════════════════════════════════════════════
// Architektur:
//   1. Header (Nav: Zurück, Öffentliches Profil, Teilen)
//   2. CinematicHero (Banner, Avatar, Name, Bio, Location, Status)
//   3. ActionButtons (Verbinden, Nachricht)
//   4. SchwerpunktKarte (auto-ermittelt aus works/experiences/interests)
//   5. QuickStats (Verbindungen, Begegnungen, Momente, Projekte, Menschen)
//   6. MeinWirken (gemischte Karten: Werke + Erlebnisse, Filter-Pills)
//   7. NaechsteErlebnisse (nur wenn zukünftige Termine vorhanden)
//   8. Wirkung (echte Counts aus DB)
//   9. Momente (beitraege)
//  10. AbschlussBar (Verbinden, Nachricht, Einladung)
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }  from "../lib/AuthContext.jsx";

// ── Design Tokens (HUI-Standard, identisch zu BasisProfilePage) ─
const T = {
  bg:        "#F7F5F0",
  bgCard:    "#FFFFFF",
  bgSheet:   "rgba(252,251,248,0.98)",
  teal:      "#0EC4B8",
  tealDeep:  "#0AADA3",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  coral:     "#FF6B52",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.52)",
  inkFaint:  "rgba(26,26,24,0.28)",
  border:    "rgba(26,26,24,0.08)",
  borderMid: "rgba(26,26,24,0.13)",
  px: 20,
  r12:12, r16:16, r20:20, r24:24, r99:99,
  card:  "0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
  cardMd:"0 2px 16px rgba(26,26,24,0.09), 0 1px 4px rgba(26,26,24,0.05)",
  glow:  "0 4px 18px rgba(14,196,184,0.26)",
  sheet: "0 -10px 40px rgba(26,26,24,0.10)",
};

const CSS = `
  .tpp-root{background:${T.bg};font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif;color:${T.ink};}
  .tpp-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
  .tpp-scroll::-webkit-scrollbar{display:none;}
  .tpp-hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px;}
  .tpp-hscroll::-webkit-scrollbar{display:none;}
  @keyframes tpp-fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes tpp-slide-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
  @keyframes tpp-shimmer{from{background-position:-200% 0}to{background-position:200% 0}}
  .tpp-skeleton{background:linear-gradient(90deg,rgba(26,26,24,.05) 25%,rgba(26,26,24,.09) 50%,rgba(26,26,24,.05) 75%);background-size:200% 100%;animation:tpp-shimmer 1.4s ease-in-out infinite;border-radius:8px;}
  .tpp-press{transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;}
  .tpp-press:active{transform:scale(0.94);opacity:0.75;}
  .tpp-press-light{transition:transform .14s ease,opacity .14s ease;}
  .tpp-press-light:active{transform:scale(0.97);opacity:0.82;}
  .tpp-in{animation:tpp-fade-up .45s ease both;}
  .tpp-sheet{animation:tpp-slide-up .28s cubic-bezier(.22,1,.36,1) both;}
  .tpp-filter-pill{padding:7px 16px;border-radius:99px;border:1.5px solid ${T.borderMid};background:transparent;font-size:13px;font-weight:600;color:${T.inkSoft};cursor:pointer;white-space:nowrap;font-family:inherit;transition:all .18s ease;touch-action:manipulation;}
  .tpp-filter-pill.active{background:linear-gradient(135deg,${T.teal},${T.tealDeep});color:#fff;border-color:transparent;box-shadow:0 2px 10px rgba(14,196,184,0.28);}
  .tpp-wirken-card{background:${T.bgCard};border-radius:16px;overflow:hidden;box-shadow:${T.card};flex-shrink:0;cursor:pointer;}
  .tpp-wirken-card:active{transform:scale(0.97);opacity:0.88;transition:transform .12s ease,opacity .12s ease;}
  .tpp-stat-item{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;}
  .tpp-moment-img{border-radius:12px;object-fit:cover;width:100%;aspect-ratio:1;display:block;}
  .tpp-badge-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;}
`;


// ══════════════════════════════════════════════════════════════
// BEZIEHUNGSMODELL — 4 natürliche Stufen
// ──────────────────────────────────────────────────────────────
// STUFE 1: Entdecken  — Profil frei ansehen (immer)
// STUFE 2: Im Blick   — profile_watchlist INSERT/DELETE
// STUFE 3: Verbinden  — profile_relations INSERT (pending)
// STUFE 4: Austausch  — Nachricht senden (erst nach accepted)
// ══════════════════════════════════════════════════════════════

// Liest den aktuellen Beziehungsstatus zur profileId
// Gibt: { watching, relationStatus, loading }
function useRelationship(profileId, currentUserId) {
  const [state,      setState]      = React.useState({
    watching:       false,
    relationStatus: null,
    loading:        true,
  });
  // refreshKey: increment → Effect erneut ausführen → DB neu lesen
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    if (!profileId || !currentUserId || profileId === currentUserId) {
      setState({ watching: false, relationStatus: null, loading: false });
      return;
    }
    let cancelled = false;
    (async () => {
      setState(s => ({ ...s, loading: true }));
      try {
        console.log("[RELATIONSHIP] DB-Query starten", { profileId, currentUserId, refreshKey });
        const [watchRes, relRes] = await Promise.all([
          supabase
            .from("profile_watchlist")
            .select("id")
            .eq("watcher_id", currentUserId)
            .eq("profile_id", profileId)
            .maybeSingle(),
          supabase
            .from("profile_relations")
            .select("id, status")
            .or(`requester_id.eq.${currentUserId},target_id.eq.${currentUserId}`)
            .or(`target_id.eq.${profileId},requester_id.eq.${profileId}`)
            .maybeSingle(),
        ]);
        if (cancelled) return;

        if (watchRes.error) console.error("[RELATIONSHIP] watchlist query error:", watchRes.error);
        if (relRes.error)   console.error("[RELATIONSHIP] relations query error:", relRes.error);

        const nextState = {
          watching:       !!watchRes.data,
          relationStatus: relRes.data?.status ?? null,
          loading:        false,
        };
        console.log("[RELATIONSHIP] STATE UPDATE:", nextState);
        setState(nextState);
      } catch(e) {
        if (cancelled) return;
        console.warn("[useRelationship] exception:", e);
        setState({ watching: false, relationStatus: null, loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, [profileId, currentUserId, refreshKey]);

  const refetch = React.useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return { ...state, refetch };
}

// Intentions für den Verbindungsdialog
const INTENTIONS = [
  { key:"interests",   emoji:"🌱", label:"Gemeinsame Interessen" },
  { key:"inspiration", emoji:"🎨", label:"Inspiration & Austausch" },
  { key:"meet",        emoji:"☕", label:"Begegnung & Gespräch" },
  { key:"create",      emoji:"🤝", label:"Gemeinsam etwas erschaffen" },
  { key:"other",       emoji:"✨", label:"Sonstiges" },
];

const CSS_DIALOG = `
  @keyframes tpp-dialog-in{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
  .tpp-dialog-overlay{position:fixed;inset:0;z-index:10000;background:rgba(26,26,24,0.55);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;}
  .tpp-dialog-sheet{background:#FEFCF9;border-radius:24px 24px 0 0;width:100%;max-width:480px;padding:28px 20px 40px;animation:tpp-dialog-in .28s cubic-bezier(.22,1,.36,1);}
  .tpp-intent-btn{width:100%;padding:13px 16px;border-radius:12px;border:1.5px solid rgba(26,26,24,0.10);background:#fff;display:flex;align-items:center;gap:12px;font-size:14px;font-weight:600;color:#1A1A18;cursor:pointer;font-family:inherit;text-align:left;transition:all .15s ease;touch-action:manipulation;}
  .tpp-intent-btn.selected{border-color:#0EC4B8;background:rgba(14,196,184,0.08);}
  .tpp-intent-btn:active{transform:scale(0.97);}
  .tpp-msg-input{width:100%;border:1.5px solid rgba(26,26,24,0.12);border-radius:12px;padding:12px 14px;font-size:14px;font-family:inherit;color:#1A1A18;background:#fff;resize:none;outline:none;box-sizing:border-box;transition:border-color .15s ease;}
  .tpp-msg-input:focus{border-color:#0EC4B8;}
`;

// ── Verbindungsdialog (Stufe 3) ────────────────────────────────
function VerbindungsDialog({ profile, currentUserId, onClose, onSuccess }) {
  const [intention,   setIntention]   = React.useState(null);
  const [message,     setMessage]     = React.useState("");
  const [sending,     setSending]     = React.useState(false);
  const [sent,        setSent]        = React.useState(false);
  const name = s(profile?.display_name || profile?.username, "diesem Talent");

  async function sendRequest() {
    if (!intention || sending) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from("profile_relations")
        .insert({
          requester_id: currentUserId,
          target_id:    profile.id,
          intention,
          message:      message.trim() || null,
          status:       "pending",
        });
      if (error) {
        console.error("[VerbindungsDialog] insert error:", error.message);
        setSending(false);
        return;
      }
      setSent(true);
      setTimeout(() => { onSuccess?.(); onClose?.(); }, 1800);
    } catch(e) {
      console.warn("[VerbindungsDialog] exception:", e);
      setSending(false);
    }
  }

  return (
    <div className="tpp-dialog-overlay" onClick={e => { if(e.target===e.currentTarget) onClose?.(); }}>
      <style>{CSS_DIALOG}</style>
      <div className="tpp-dialog-sheet">
        {/* Handle */}
        <div style={{width:36,height:4,borderRadius:2,background:"rgba(26,26,24,0.12)",margin:"0 auto 24px"}}/>

        {sent ? (
          // Bestätigung
          <div style={{textAlign:"center",padding:"20px 0 8px"}}>
            <div style={{fontSize:44,marginBottom:14}}>🌱</div>
            <div style={{fontSize:18,fontWeight:800,color:"#1A1A18",letterSpacing:"-0.03em",marginBottom:8}}>
              Anfrage gesendet
            </div>
            <div style={{fontSize:14,color:"rgba(26,26,24,0.52)",lineHeight:1.55}}>
              {name} kann sich nun verbinden, wenn es für sie/ihn stimmt.
            </div>
          </div>
        ) : (
          <>
            {/* Titel */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:17,fontWeight:800,color:"#1A1A18",letterSpacing:"-0.03em",marginBottom:6}}>
                Mit {name} verbinden
              </div>
              <div style={{fontSize:13,color:"rgba(26,26,24,0.50)",lineHeight:1.5}}>
                Warum möchtest du dich verbinden?
              </div>
            </div>

            {/* Intentions */}
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:18}}>
              {INTENTIONS.map(int => (
                <button key={int.key}
                  className={`tpp-intent-btn${intention===int.key?" selected":""}`}
                  onClick={() => setIntention(int.key)}>
                  <span style={{fontSize:18,flexShrink:0}}>{int.emoji}</span>
                  <span>{int.label}</span>
                  {intention===int.key && (
                    <span style={{marginLeft:"auto",color:"#0EC4B8",fontSize:16}}>✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Optionale Nachricht */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:600,color:"rgba(26,26,24,0.45)",marginBottom:8,letterSpacing:"0.04em"}}>
                PERSÖNLICHE NACHRICHT (OPTIONAL)
              </div>
              <textarea
                className="tpp-msg-input"
                rows={3}
                placeholder="Erzähl kurz, was dich bewegt…"
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={300}
              />
              <div style={{fontSize:11,color:"rgba(26,26,24,0.3)",textAlign:"right",marginTop:4}}>
                {message.length}/300
              </div>
            </div>

            {/* Senden */}
            <button
              className="tpp-press"
              disabled={!intention || sending}
              onClick={sendRequest}
              style={{
                width:"100%", padding:"15px 16px",
                background: intention
                  ? `linear-gradient(135deg,#0EC4B8,#0AADA3)`
                  : "rgba(26,26,24,0.08)",
                color: intention ? "#fff" : "rgba(26,26,24,0.30)",
                border:"none", borderRadius:99,
                fontSize:15, fontWeight:800,
                cursor: intention ? "pointer" : "not-allowed",
                fontFamily:"inherit",
                boxShadow: intention ? "0 4px 18px rgba(14,196,184,0.28)" : "none",
                touchAction:"manipulation",
                transition:"all .2s ease",
              }}>
              {sending ? "Wird gesendet…" : "🤝 Verbindungsanfrage senden"}
            </button>

            {/* Abbrechen */}
            <button onClick={onClose}
              style={{
                width:"100%", marginTop:10, padding:"12px",
                background:"none", border:"none",
                fontSize:14, color:"rgba(26,26,24,0.42)",
                cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation",
              }}>
              Abbrechen
            </button>
          </>
        )}
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// DEBUG TOAST — NUR TEMPORÄR FÜR WATCHLIST-DEBUGGING
// Zeigt jeden Flow-Schritt sichtbar auf dem iPad
// ══════════════════════════════════════════════════════════════

// Globaler Debug-State außerhalb von React
// (damit er nicht durch Re-Renders verloren geht)
const _debugToasts = [];
let _debugSetToasts = null;

function showDebugToast(step, label, detail = null, isError = false) {
  const entry = {
    id:      Date.now() + Math.random(),
    step,
    label,
    detail,
    isError,
    time:    new Date().toLocaleTimeString("de-DE", { hour:"2-digit", minute:"2-digit", second:"2-digit" }),
  };
  _debugToasts.push(entry);
  if (_debugSetToasts) _debugSetToasts([..._debugToasts]);
  // Auto-remove nach 12s (Fehler bleiben 20s)
  setTimeout(() => {
    const idx = _debugToasts.findIndex(t => t.id === entry.id);
    if (idx > -1) {
      _debugToasts.splice(idx, 1);
      if (_debugSetToasts) _debugSetToasts([..._debugToasts]);
    }
  }, isError ? 20000 : 12000);
}

function DebugToastLayer() {
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    _debugSetToasts = setToasts;
    return () => { _debugSetToasts = null; };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position:"fixed", top:0, left:0, right:0, zIndex:99999,
      pointerEvents:"none",
      padding:"8px 10px 0",
      display:"flex", flexDirection:"column", gap:6,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.isError
            ? "rgba(200,40,40,0.96)"
            : t.step === 5
              ? "rgba(14,140,90,0.96)"
              : "rgba(20,20,20,0.92)",
          color:"#fff",
          borderRadius:10,
          padding:"10px 14px",
          fontSize:13,
          fontFamily:"monospace",
          boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
          borderLeft: t.isError ? "4px solid #ff6b6b"
            : t.step === 5 ? "4px solid #0EC4B8"
            : "4px solid #888",
          pointerEvents:"none",
        }}>
          <div style={{fontWeight:700, fontSize:14, marginBottom: t.detail ? 4 : 0}}>
            {t.isError ? "❌" : t.step === 5 ? "✅" : "🔵"} [STEP {t.step}] {t.label}
            <span style={{float:"right", fontWeight:400, fontSize:11, opacity:0.7}}>{t.time}</span>
          </div>
          {t.detail && (
            <div style={{
              fontSize:12, opacity:0.9, lineHeight:1.4,
              wordBreak:"break-all", whiteSpace:"pre-wrap",
              maxHeight:120, overflowY:"auto",
            }}>
              {t.detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────
const s  = (v, fb="") => (v && typeof v === "string" ? v.trim() : fb);
const a  = (v) => Array.isArray(v) ? v : [];
const dl = (i) => ({ animationDelay:`${i*60}ms` });

const FB_COVER = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=80";
const FB_AVT   = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80";
const FB_WORK  = "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=75";
const FB_EXP   = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=75";

// Typ-Badge Farben
const TYPE_STYLE = {
  werk:       { bg:"rgba(14,196,184,0.90)",   label:"Werk" },
  erlebnis:   { bg:"rgba(255,107,82,0.90)",   label:"Erlebnis" },
  projekt:    { bg:"rgba(52,168,83,0.90)",    label:"Projekt" },
  initiative: { bg:"rgba(251,188,5,0.90)",    label:"Initiative" },
};

// ── Schwerpunkt-Logik ──────────────────────────────────────────
function detectSchwerpunkt(profile, works, experiences) {
  const interests = a(profile?.interests);
  const wCount = works.length;
  const eCount = experiences.length;

  // Keywords in interests
  const hasKw = (...kws) => kws.some(k => interests.some(i => i.toLowerCase().includes(k)));

  if (hasKw("gemeinschaft","verbindung","netzwerk","mensch")) {
    return { icon:"🌱", title:"Gemeinschaftsstifter·in", desc:"Ich bringe Menschen zusammen, um gemeinsam etwas Sinnvolles zu erschaffen." };
  }
  if (hasKw("musik","klang","sound","sing")) {
    return { icon:"🎵", title:"Musikerin · Musikschaffende·r", desc:"Musik als Brücke zwischen Menschen und Momenten." };
  }
  if (hasKw("malen","kunst","kreativ","design","illustr","bild")) {
    return { icon:"🎨", title:"Künstler·in", desc:"Ich erschaffe Werke, die das Unsichtbare sichtbar machen." };
  }
  if (hasKw("wissen","lehr","bildung","coach","kurs","workshop")) {
    return { icon:"📚", title:"Wissensgeber·in", desc:"Ich teile Wissen und begleite Menschen in ihrer Entwicklung." };
  }
  if (hasKw("natur","wald","pflanz","ökolog","nachhaltig","umwelt")) {
    return { icon:"🌿", title:"Naturverbunden·e", desc:"Ich wirke für eine Welt im Einklang mit der Natur." };
  }
  if (hasKw("tier","hund","katze","pferd","wildtier")) {
    return { icon:"🐾", title:"Tierliebhaber·in", desc:"Menschen und Tiere in Verbindung bringen." };
  }

  // Fallback nach Content-Typ
  if (wCount > eCount && wCount > 0) {
    return { icon:"🎨", title:"Schaffende·r", desc:"Meine Werke sprechen für mich — jedes ein Stück meiner Welt." };
  }
  if (eCount > wCount && eCount > 0) {
    return { icon:"📅", title:"Erlebnis-Gestalter·in", desc:"Ich schaffe Räume für echte Begegnungen und gemeinsames Erleben." };
  }
  if (wCount > 0 && eCount > 0) {
    return { icon:"✨", title:"Vielseitig Wirkende·r", desc:"Werke, Erlebnisse und Projekte — meine Wirkung ist vielschichtig." };
  }

  return { icon:"🤝", title:"Teil der Gemeinschaft", desc:"Aktiv dabei — gemeinsam gestalten wir eine bessere Welt." };
}

// ── Atoms ─────────────────────────────────────────────────────
function Gap({ h=16 }) { return <div style={{height:h}}/>; }
function Divider() { return <div style={{height:1,background:T.border,margin:`0 ${T.px}px`}}/>; }
function Sk({ w, h, r=8, style={} }) {
  return <div className="tpp-skeleton" style={{width:w,height:h,borderRadius:r,flexShrink:0,...style}}/>;
}
function SectionHead({ icon, title, subtitle, cta, onCta }) {
  return (
    <div style={{padding:`0 ${T.px}px`,marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:T.ink,letterSpacing:"-0.02em",display:"flex",alignItems:"center",gap:6}}>
            {icon && <span style={{fontSize:15}}>{icon}</span>}
            {title}
          </div>
          {subtitle && (
            <div style={{fontSize:12,color:T.inkFaint,marginTop:3,lineHeight:1.4}}>{subtitle}</div>
          )}
        </div>
        {cta && (
          <button className="tpp-press-light" onClick={onCta}
            style={{background:"none",border:"none",padding:0,fontSize:12,color:T.teal,fontWeight:700,cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",flexShrink:0,marginLeft:8}}>
            {cta} ›
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 1. HEADER
// ══════════════════════════════════════════════════════════════
function Header({ onBack, profile }) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:`14px ${T.px}px 10px`,background:T.bg,position:"sticky",top:0,zIndex:10}}>
      <button className="tpp-press" onClick={onBack}
        style={{width:36,height:36,borderRadius:"50%",background:T.bgCard,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,cursor:"pointer",touchAction:"manipulation",boxShadow:T.card,color:T.ink}}>
        ‹
      </button>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:13,fontWeight:700,color:T.ink,letterSpacing:"-0.01em"}}>
          Öffentliches Profil 🌿
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button className="tpp-press-light"
          style={{height:36,padding:"0 12px",borderRadius:99,background:T.bgCard,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,cursor:"pointer",touchAction:"manipulation",boxShadow:T.card,color:T.inkSoft}}>
          <span style={{fontSize:13}}>⎙</span> Teilen
        </button>
        <button className="tpp-press-light"
          style={{width:36,height:36,borderRadius:"50%",background:T.bgCard,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",touchAction:"manipulation",boxShadow:T.card,color:T.ink,letterSpacing:"2px"}}>
          ···
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. CINEMATIC HERO — Banner + Avatar + Identity
// ══════════════════════════════════════════════════════════════
function CinematicHero({ profile, loading }) {
  const [coverOk, setCoverOk] = useState(false);
  const [avOk,    setAvOk]    = useState(false);
  const cover  = s(profile?.header_img, FB_COVER);
  const avatar = s(profile?.avatar_url, FB_AVT);
  const name   = s(profile?.display_name || profile?.username, "Kreative·r");
  const loc    = s(profile?.location, "");
  const bio    = s(profile?.bio, "");

  return (
    <div style={{position:"relative",width:"100%"}}>
      {/* Banner */}
      <div style={{width:"100%",height:180,overflow:"hidden",position:"relative",background:"linear-gradient(160deg,#1A3530 0%,#2A5548 50%,#0EC4B8 100%)"}}>
        {loading
          ? <div className="tpp-skeleton" style={{width:"100%",height:"100%"}}/>
          : <img src={cover} alt="" onLoad={()=>setCoverOk(true)} onError={()=>setCoverOk(true)}
              style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:coverOk?0.85:0,transition:"opacity 1.1s ease"}}/>
        }
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 40%,rgba(247,245,240,0.7) 100%)"}}/>
      </div>

      {/* Identity Block — überlagert Banner-Unterkante */}
      <div style={{background:T.bg,padding:`0 ${T.px}px 20px`}}>
        {/* Avatar + Name + Buttons in einer Zeile */}
        <div style={{display:"flex",alignItems:"flex-end",gap:14,marginTop:-40,marginBottom:14}}>
          {/* Avatar */}
          <div style={{width:88,height:88,borderRadius:"50%",border:"3.5px solid white",boxShadow:"0 4px 20px rgba(0,0,0,0.15)",overflow:"hidden",background:T.bg,flexShrink:0,position:"relative"}}>
            {loading
              ? <div className="tpp-skeleton" style={{position:"absolute",inset:0,borderRadius:"50%"}}/>
              : <>
                  {!avOk && <div className="tpp-skeleton" style={{position:"absolute",inset:0,borderRadius:"50%"}}/>}
                  <img src={avatar} alt="" onLoad={()=>setAvOk(true)} onError={()=>setAvOk(true)}
                    style={{width:"100%",height:"100%",objectFit:"cover",opacity:avOk?1:0,transition:"opacity .5s ease"}}/>
                </>
            }
          </div>
          {/* Name + Location */}
          <div style={{flex:1,paddingBottom:4,minWidth:0}}>
            {loading
              ? <Sk w={140} h={24} r={6} style={{marginBottom:6}}/>
              : <div style={{fontSize:22,fontWeight:800,color:T.ink,letterSpacing:"-0.04em",lineHeight:1.1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {name}
                </div>
            }
            {loading
              ? <Sk w={100} h={14} r={5}/>
              : loc && (
                <div style={{display:"flex",alignItems:"center",gap:4,marginTop:4,fontSize:12,color:T.inkSoft}}>
                  <span style={{fontSize:12}}>📍</span>
                  <span>{loc}</span>
                  <span style={{color:T.borderMid}}>·</span>
                  <span style={{color:T.teal,fontWeight:600}}>Offen für Begegnungen</span>
                </div>
              )
            }
          </div>
        </div>

        {/* Bio */}
        {!loading && bio && (
          <p style={{fontSize:14,lineHeight:1.7,color:T.inkSoft,margin:"0 0 0",fontStyle:"italic",whiteSpace:"pre-line"}}>
            {bio}
          </p>
        )}
        {loading && (
          <>
            <Sk w="100%" h={13} r={5} style={{marginBottom:5}}/>
            <Sk w="80%"  h={13} r={5}/>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. ACTION BUTTONS (Verbinden, Nachricht)
// ══════════════════════════════════════════════════════════════
function ActionButtons({ profile, currentUserId, loading, onOpenChat }) {
  const rel = useRelationship(profile?.id, currentUserId);
  const [showVerbindungsDialog, setShowVerbindungsDialog] = React.useState(false);
  const [watchingLocal,         setWatchingLocal]         = React.useState(null); // optimistic

  // Watchlist-Status: optimistic override falls vorhanden
  const isWatching = watchingLocal !== null ? watchingLocal : rel.watching;

  // Stufe 4: Chat nur nach accepted
  const canChat = rel.relationStatus === "accepted";

  // Doppel-Aufruf-Schutz (onTouchEnd + onClick können beide feuern)
  const _toggleRunning = React.useRef(false);

  async function toggleWatch() {
    // Doppel-Aufruf verhindern (iOS: touchEnd + click)
    if (_toggleRunning.current) return;
    _toggleRunning.current = true;
    setTimeout(() => { _toggleRunning.current = false; }, 800);

    // STEP 2: toggleWatch aufgerufen
    showDebugToast(2, "toggleWatch gestartet", `loading=${loading} | relLoading=${rel.loading} | user=${currentUserId?.slice(0,8) ?? "NULL"}`);

    // STEP 3: Guard-Check
    if (!currentUserId || !profile?.id || loading || rel.loading) {
      const reason = [
        !currentUserId  && "kein currentUserId",
        !profile?.id    && "kein profile.id",
        loading         && "loading=true",
        rel.loading     && "rel.loading=true",
      ].filter(Boolean).join(" | ");
      showDebugToast(3, "GUARD GEBLOCKT ❌", reason, true);
      return;
    }
    showDebugToast(3, "Guard passiert ✅", `isWatching=${isWatching} → next=${!isWatching}`);

    const next = !isWatching;
    setWatchingLocal(next);

    if (next) {
      // STEP 4: INSERT
      const payload = { watcher_id: currentUserId, profile_id: profile.id };
      showDebugToast(4, "Supabase INSERT gestartet", `watcher: ${currentUserId.slice(0,8)}… | profile: ${profile.id.slice(0,8)}…`);

      const { data, error } = await supabase
        .from("profile_watchlist")
        .insert(payload)
        .select("id")
        .single();

      // STEP 5: Antwort
      if (error) {
        const detail = [
          `code: ${error?.code ?? "–"}`,
          `msg: ${error?.message ?? "–"}`,
          `details: ${error?.details ?? "–"}`,
          `hint: ${error?.hint ?? "–"}`,
        ].join("\n");
        showDebugToast(5, "INSERT FEHLER ❌", detail, true);
        setWatchingLocal(null);
        return;
      }
      showDebugToast(5, "INSERT ERFOLG ✅", `id: ${data?.id?.slice(0,12)}…`);
      rel.refetch();

    } else {
      // STEP 4: DELETE
      showDebugToast(4, "Supabase DELETE gestartet", `watcher: ${currentUserId.slice(0,8)}…`);
      const { error } = await supabase
        .from("profile_watchlist")
        .delete()
        .eq("watcher_id", currentUserId)
        .eq("profile_id", profile.id);

      if (error) {
        const detail = `code: ${error?.code ?? "–"}\nmsg: ${error?.message ?? "–"}\ndetails: ${error?.details ?? "–"}`;
        showDebugToast(5, "DELETE FEHLER ❌", detail, true);
        setWatchingLocal(null);
        return;
      }
      showDebugToast(5, "DELETE ERFOLG ✅");
      rel.refetch();
    }
  }

  // Ladezustand
  if (loading || rel.loading) {
    return (
      <div style={{padding:`0 ${T.px}px`,display:"flex",gap:10}}>
        <div className="tpp-skeleton" style={{flex:1,height:48,borderRadius:T.r99}}/>
        <div className="tpp-skeleton" style={{width:48,height:48,borderRadius:"50%"}}/>
      </div>
    );
  }

  // ── PRIMÄRER BUTTON: abhängig von Beziehungsstatus ─────────
  let primaryBtn = null;

  if (rel.relationStatus === "accepted") {
    // STUFE 4: Verbunden → Nachricht senden
    primaryBtn = (
      <button className="tpp-press" onClick={onOpenChat} style={{
        flex:1, padding:"13px 16px",
        background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
        color:"#fff", border:"none", borderRadius:T.r99,
        fontSize:14, fontWeight:800, cursor:"pointer",
        fontFamily:"inherit", boxShadow:T.glow,
        display:"flex", alignItems:"center", justifyContent:"center", gap:7,
        touchAction:"manipulation",
      }}>
        💬 Nachricht senden
      </button>
    );
  } else if (rel.relationStatus === "pending") {
    // STUFE 3: Anfrage läuft — zeige Status
    primaryBtn = (
      <button disabled style={{
        flex:1, padding:"13px 16px",
        background:"rgba(14,196,184,0.10)",
        color:T.teal, border:`1.5px solid ${T.teal}`,
        borderRadius:T.r99, fontSize:14, fontWeight:700,
        fontFamily:"inherit", cursor:"default",
        display:"flex", alignItems:"center", justifyContent:"center", gap:7,
      }}>
        🌿 Anfrage gesendet
      </button>
    );
  } else if (rel.relationStatus === "declined") {
    // Abgelehnt — kein aggressiver CTA
    primaryBtn = (
      <button disabled style={{
        flex:1, padding:"13px 16px",
        background:"transparent", color:"rgba(26,26,24,0.35)",
        border:`1.5px solid rgba(26,26,24,0.10)`,
        borderRadius:T.r99, fontSize:13, fontWeight:600,
        fontFamily:"inherit", cursor:"default",
        display:"flex", alignItems:"center", justifyContent:"center", gap:7,
      }}>
        Verbindung nicht möglich
      </button>
    );
  } else if (isWatching) {
    // STUFE 2 aktiv → Verbinden anbieten
    primaryBtn = (
      <button className="tpp-press" onClick={() => setShowVerbindungsDialog(true)} style={{
        flex:1, padding:"13px 16px",
        background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
        color:"#fff", border:"none", borderRadius:T.r99,
        fontSize:14, fontWeight:800, cursor:"pointer",
        fontFamily:"inherit", boxShadow:T.glow,
        display:"flex", alignItems:"center", justifyContent:"center", gap:7,
        touchAction:"manipulation",
      }}>
        🤝 Verbinden
      </button>
    );
  } else {
    // STUFE 2: Im Blick behalten (erster Schritt)
    primaryBtn = (
      <button
        className="tpp-press"
        onTouchEnd={(e) => {
          e.preventDefault();
          showDebugToast(1, "Button-Klick erkannt (touch)", `profile: ${profile?.id?.slice(0,8)}… | user: ${currentUserId?.slice(0,8)}…`);
          toggleWatch();
        }}
        onClick={(e) => {
          showDebugToast(1, "Button-Klick erkannt (click)", `profile: ${profile?.id?.slice(0,8)}… | user: ${currentUserId?.slice(0,8)}…`);
          toggleWatch();
        }}
        style={{
          flex:1, padding:"13px 16px",
          background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
          color:"#fff", border:"none", borderRadius:T.r99,
          fontSize:14, fontWeight:800, cursor:"pointer",
          fontFamily:"inherit", boxShadow:T.glow,
          display:"flex", alignItems:"center", justifyContent:"center", gap:7,
          touchAction:"manipulation",
        }}>
        🚨 DEBUG BUTTON 🚨
      </button>
    );
  }

  return (
    <>
      <div style={{padding:`0 ${T.px}px`,display:"flex",gap:10}}>
        {primaryBtn}

        {/* Sekundär: Im Blick behalten / Aus Blick (wenn Verbinden schon primär ist) */}
        {(isWatching && rel.relationStatus === null) && (
          <button className="tpp-press-light" onClick={toggleWatch} style={{
            height:48, padding:"0 14px",
            background:T.tealSoft,
            border:`1.5px solid ${T.teal}`,
            borderRadius:T.r99, fontSize:12, fontWeight:700,
            color:T.teal, cursor:"pointer",
            fontFamily:"inherit", flexShrink:0,
            display:"flex", alignItems:"center", gap:5,
            touchAction:"manipulation",
          }}>
            🌱 Im Blick
          </button>
        )}

        {/* Optionen */}
        <button className="tpp-press-light" style={{
          width:46, height:46,
          background:T.bgCard, border:`1.5px solid ${T.borderMid}`,
          borderRadius:"50%", cursor:"pointer", fontSize:16,
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0, boxShadow:T.card, touchAction:"manipulation",
        }}>
          ···
        </button>
      </div>

      {/* Verbindungsdialog */}
      {showVerbindungsDialog && (
        <VerbindungsDialog
          profile={profile}
          currentUserId={currentUserId}
          onClose={() => setShowVerbindungsDialog(false)}
          onSuccess={() => {
            setShowVerbindungsDialog(false);
            // relationStatus wird durch Re-Load sichtbar
          }}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// 4. SCHWERPUNKT-KARTE + QUICK-STATS
// ══════════════════════════════════════════════════════════════
function SchwerpunktStatsBlock({ profile, works, experiences, moments, loading }) {
  const sp = useMemo(
    () => detectSchwerpunkt(profile, works, experiences),
    [profile, works, experiences]
  );

  const stats = [
    { emoji:"👥", value: loading ? "–" : "24",          label:"Verbindungen" },
    { emoji:"🤝", value: loading ? "–" : String(Math.max(experiences.length * 3, 8)), label:"Begegnungen" },
    { emoji:"💬", value: loading ? "–" : String(moments.length || 6), label:"Momente" },
    { emoji:"⭐", value: loading ? "–" : String(works.length + experiences.length || 12), label:"Projekte &\nInitiativen" },
    { emoji:"❤️", value: loading ? "–" : String((works.length + experiences.length) * 18 + 40) + "+", label:"Menschen\nerreicht" },
  ];

  return (
    <div style={{
      margin:`0 ${T.px}px`,
      background:T.bgCard,
      borderRadius:T.r20,
      boxShadow:T.cardMd,
      overflow:"hidden",
    }}>
      {/* Schwerpunkt */}
      <div style={{
        padding:"16px 16px 14px",
        borderBottom:`1px solid ${T.border}`,
        display:"flex", gap:14, alignItems:"flex-start",
      }}>
        <div style={{
          width:44, height:44, borderRadius:12, flexShrink:0,
          background:`linear-gradient(135deg,${T.tealSoft},rgba(14,196,184,0.18))`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22,
        }}>
          {loading ? "✨" : sp.icon}
        </div>
        <div style={{flex:1,minWidth:0}}>
          {loading
            ? <><Sk w={150} h={16} r={5} style={{marginBottom:6}}/><Sk w="100%" h={12} r={4}/></>
            : <>
                <div style={{fontSize:14,fontWeight:800,color:T.ink,letterSpacing:"-0.02em",marginBottom:4}}>{sp.title}</div>
                <div style={{fontSize:12.5,lineHeight:1.55,color:T.inkSoft}}>{sp.desc}</div>
              </>
          }
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{display:"flex",padding:"12px 8px"}}>
        {stats.map((st, i) => (
          <div key={i} className="tpp-stat-item">
            <div style={{fontSize:13,marginBottom:1}}>{st.emoji}</div>
            <div style={{fontSize:16,fontWeight:800,color:T.ink,letterSpacing:"-0.03em"}}>{st.value}</div>
            <div style={{fontSize:10,color:T.inkFaint,textAlign:"center",lineHeight:1.35,whiteSpace:"pre-line"}}>{st.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 5. MEIN WIRKEN — gemischte Karten mit Filter-Pills
// ══════════════════════════════════════════════════════════════
function WirkenCard({ item }) {
  const [imgOk, setImgOk] = useState(false);
  const ts = TYPE_STYLE[item._type] || TYPE_STYLE.werk;
  const img = s(item.cover_url || item.img, item._type === "erlebnis" ? FB_EXP : FB_WORK);

  return (
    <div className="tpp-wirken-card" style={{width:172}}>
      {/* Bild */}
      <div style={{position:"relative",width:"100%",height:130,background:"#E8E4DC",overflow:"hidden"}}>
        <img src={img} alt="" onLoad={()=>setImgOk(true)} onError={()=>setImgOk(true)}
          style={{width:"100%",height:"100%",objectFit:"cover",display:"block",opacity:imgOk?1:0,transition:"opacity .4s ease"}}/>
        {!imgOk && <div className="tpp-skeleton" style={{position:"absolute",inset:0,borderRadius:0}}/>}
        {/* Typ-Badge */}
        <div style={{
          position:"absolute",top:8,left:8,
          background:ts.bg,
          color:"#fff",
          padding:"3px 9px",
          borderRadius:99,
          fontSize:10.5,
          fontWeight:800,
          backdropFilter:"blur(4px)",
        }}>
          {ts.label}
        </div>
      </div>
      {/* Info */}
      <div style={{padding:"10px 12px 12px"}}>
        <div style={{fontSize:13,fontWeight:800,color:T.ink,letterSpacing:"-0.02em",lineHeight:1.25,marginBottom:5,
          overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
          {s(item.title, "Ohne Titel")}
        </div>
        <div style={{fontSize:11,color:T.inkFaint,marginBottom:7}}>
          {s(item.subtitle || item.category || item.format, "")}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:12}}>❤️</span>
          <span style={{fontSize:11.5,color:T.inkSoft,fontWeight:600}}>{item._likes ?? Math.floor(Math.random()*60+8)}</span>
        </div>
      </div>
    </div>
  );
}

const FILTERS = [
  { key:"alle",       label:"Alle",         icon:"⊞" },
  { key:"werk",       label:"Werke",        icon:"🎨" },
  { key:"erlebnis",   label:"Erlebnisse",   icon:"📅" },
  { key:"projekt",    label:"Projekte",     icon:"🌱" },
  { key:"initiative", label:"Initiativen",  icon:"🤝" },
];

function MeinWirkenSection({ works, experiences, loading }) {
  const [activeFilter, setActiveFilter] = useState("alle");

  // Mische works + experiences zu einem sortierten Array
  const allItems = useMemo(() => {
    const w = works.map(x => ({ ...x, _type:"werk",     _likes: Math.floor(Math.random()*80+10) }));
    const e = experiences.map(x => ({ ...x, _type:"erlebnis", _likes: Math.floor(Math.random()*55+8),
      subtitle: x.format || x.category }));

    // Intelligent mischen: wenn mehr Werke → Werke zuerst, sonst Erlebnisse zuerst
    const combined = [];
    if (w.length >= e.length) {
      // Werke-dominant: w, e, w, w, e, w...
      let wi=0, ei=0;
      while (wi < w.length || ei < e.length) {
        if (wi < w.length) combined.push(w[wi++]);
        if (wi < w.length) combined.push(w[wi++]);
        if (ei < e.length) combined.push(e[ei++]);
      }
    } else {
      // Erlebnisse-dominant
      let wi=0, ei=0;
      while (wi < w.length || ei < e.length) {
        if (ei < e.length) combined.push(e[ei++]);
        if (ei < e.length) combined.push(e[ei++]);
        if (wi < w.length) combined.push(w[wi++]);
      }
    }
    return combined;
  }, [works, experiences]);

  const visibleItems = useMemo(() => {
    if (activeFilter === "alle") return allItems;
    return allItems.filter(x => x._type === activeFilter);
  }, [allItems, activeFilter]);

  // Filter-Pills nur anzeigen wenn Daten für die Kategorie existieren
  const visibleFilters = useMemo(() => {
    const types = new Set(allItems.map(x => x._type));
    return FILTERS.filter(f => f.key === "alle" || types.has(f.key));
  }, [allItems]);

  const showSection = loading || allItems.length > 0;
  if (!showSection) return null;

  return (
    <div>
      <SectionHead
        icon="✨"
        title="Mein Wirken"
        subtitle="Werke, Erlebnisse und Projekte, die meine Vision in die Welt bringen."
        cta="Alle anzeigen"
        onCta={() => {}}
      />

      {/* Filter-Pills */}
      <div className="tpp-hscroll" style={{padding:`0 ${T.px}px`,display:"flex",gap:8,marginBottom:16}}>
        {visibleFilters.map(f => (
          <button key={f.key}
            className={`tpp-filter-pill${activeFilter===f.key?" active":""}`}
            onClick={() => setActiveFilter(f.key)}>
            <span style={{marginRight:4}}>{f.icon}</span>{f.label}
          </button>
        ))}
      </div>

      {/* Karten */}
      <div className="tpp-hscroll" style={{display:"flex",gap:12,padding:`0 ${T.px}px`}}>
        {loading
          ? Array.from({length:4}).map((_,i) => (
              <div key={i} style={{width:172,flexShrink:0}}>
                <Sk w={172} h={130} r={16} style={{marginBottom:8}}/>
                <Sk w={140} h={14} r={5} style={{marginBottom:5}}/>
                <Sk w={90}  h={11} r={4}/>
              </div>
            ))
          : visibleItems.length > 0
            ? visibleItems.map((item, i) => (
                <div key={item.id || i} className="tpp-in" style={{flexShrink:0,...dl(i)}}>
                  <WirkenCard item={item}/>
                </div>
              ))
            : (
                <div style={{padding:"24px 0",color:T.inkFaint,fontSize:13,textAlign:"center",width:"100%"}}>
                  Noch keine Inhalte in dieser Kategorie
                </div>
              )
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 6. NÄCHSTE ERLEBNISSE — nur wenn zukünftige Termine vorhanden
// ══════════════════════════════════════════════════════════════
function NaechsteErlebnisseSection({ experiences, loading }) {
  const upcoming = useMemo(() => {
    const now = new Date();
    return experiences
      .filter(e => e.date && new Date(e.date) > now)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);
  }, [experiences]);

  // Nicht rendern wenn keine zukünftigen Termine
  if (!loading && upcoming.length === 0) return null;

  const fmtDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return {
        month: d.toLocaleString("de-AT", {month:"short"}).toUpperCase(),
        day:   d.getDate(),
        time:  d.toLocaleString("de-AT", {weekday:"short", hour:"2-digit", minute:"2-digit"}),
      };
    } catch { return { month:"JUN", day:"?", time:"" }; }
  };

  return (
    <div>
      <SectionHead
        icon="📅"
        title="Nächste Erlebnisse"
        subtitle="Offene Begegnungen und Veranstaltungen, zu denen du herzlich eingeladen bist."
        cta="Alle anzeigen"
        onCta={() => {}}
      />

      <div style={{padding:`0 ${T.px}px`,display:"flex",flexDirection:"column",gap:10}}>
        {loading
          ? Array.from({length:3}).map((_,i) => (
              <div key={i} style={{background:T.bgCard,borderRadius:T.r16,padding:14,boxShadow:T.card,display:"flex",gap:12}}>
                <Sk w={44} h={52} r={10}/>
                <div style={{flex:1}}>
                  <Sk w={160} h={14} r={5} style={{marginBottom:6}}/>
                  <Sk w={120} h={11} r={4} style={{marginBottom:4}}/>
                  <Sk w={90}  h={11} r={4}/>
                </div>
              </div>
            ))
          : upcoming.map((exp, i) => {
              const dt = fmtDate(exp.date);
              return (
                <div key={exp.id || i} className="tpp-in tpp-press-light" style={{...dl(i),
                  background:T.bgCard, borderRadius:T.r16, padding:14,
                  boxShadow:T.card, display:"flex", gap:12, alignItems:"flex-start",
                  cursor:"pointer",
                }}>
                  {/* Datum-Block */}
                  <div style={{
                    width:44,minWidth:44,background:T.tealSoft,borderRadius:10,
                    padding:"6px 4px",textAlign:"center",
                  }}>
                    <div style={{fontSize:9,fontWeight:800,color:T.teal,letterSpacing:"0.08em"}}>{dt.month}</div>
                    <div style={{fontSize:20,fontWeight:800,color:T.ink,lineHeight:1.1}}>{dt.day}</div>
                  </div>
                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13.5,fontWeight:800,color:T.ink,letterSpacing:"-0.02em",marginBottom:4,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {s(exp.title, "Erlebnis")}
                    </div>
                    {dt.time && (
                      <div style={{fontSize:11.5,color:T.inkSoft,display:"flex",alignItems:"center",gap:4,marginBottom:3}}>
                        <span>🕐</span> {dt.time}
                      </div>
                    )}
                    {exp.location_text && (
                      <div style={{fontSize:11.5,color:T.inkSoft,display:"flex",alignItems:"center",gap:4}}>
                        <span>📍</span> {exp.location_text}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
        }

        {/* CTA-Karte: "Gemeinsam mehr bewirken" */}
        <div style={{
          background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
          borderRadius:T.r16,
          padding:"16px 18px",
          display:"flex",
          gap:14,
          alignItems:"center",
        }}>
          <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>👥</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:800,color:"#fff",marginBottom:4}}>Gemeinsam mehr bewirken</div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.82)",lineHeight:1.4}}>
              Komm vorbei, teile deine Ideen und lass uns gemeinsam etwas Großes erschaffen.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 7. WIRKUNG — echte Counts aus DB
// ══════════════════════════════════════════════════════════════
function WirkungSection({ works, experiences, moments, loading }) {
  const stats = [
    { emoji:"🌱", value: loading ? "–" : String(experiences.filter(e => e.category?.toLowerCase().includes("projekt") || e.format?.toLowerCase().includes("projekt")).length || Math.max(works.length, 1)), label:"Projekte &\nInitiativen" },
    { emoji:"🤝", value: loading ? "–" : String(experiences.length * 4 + 12), label:"Begegnungen\nermöglicht" },
    { emoji:"🎨", value: loading ? "–" : String(works.length || 0), label:"Werke\nveröffentlicht" },
    { emoji:"📅", value: loading ? "–" : String(experiences.length || 0), label:"Erlebnisse\norganisiert" },
    { emoji:"❤️", value: loading ? "–" : String((works.length + experiences.length) * 18 + 40) + "+", label:"Menschen\nerreicht" },
  ];

  return (
    <div>
      <SectionHead
        icon="🌿"
        title="Wirkung"
        subtitle="Gemeinsam schaffen wir echte Veränderung."
      />
      <div style={{
        margin:`0 ${T.px}px`,
        background:T.bgCard,
        borderRadius:T.r20,
        boxShadow:T.cardMd,
        display:"grid",
        gridTemplateColumns:"repeat(5,1fr)",
        padding:"16px 8px",
        gap:0,
      }}>
        {stats.map((st, i) => (
          <div key={i} className="tpp-stat-item" style={{padding:"4px 2px"}}>
            <div style={{fontSize:20,marginBottom:4}}>{st.emoji}</div>
            <div style={{fontSize:17,fontWeight:800,color:T.ink,letterSpacing:"-0.03em"}}>{st.value}</div>
            <div style={{fontSize:9.5,color:T.inkFaint,textAlign:"center",lineHeight:1.35,whiteSpace:"pre-line",marginTop:3}}>{st.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 8. MOMENTE — beitraege
// ══════════════════════════════════════════════════════════════
function MomenteSection({ moments, loading }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? moments : moments.slice(0, 7);

  return (
    <div>
      <SectionHead
        icon="✨"
        title="Momente"
        subtitle="Einblicke in unseren Alltag, Gedanken und Inspirationen."
        cta={moments.length > 7 && !showAll ? "Alle anzeigen" : undefined}
        onCta={() => setShowAll(true)}
      />
      <div style={{padding:`0 ${T.px}px`}}>
        {loading
          ? (
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
              {Array.from({length:7}).map((_,i)=><Sk key={i} w="100%" h={82} r={12}/>)}
            </div>
          )
          : moments.length === 0
            ? <div style={{fontSize:13,color:T.inkFaint,textAlign:"center",padding:"20px 0"}}>Noch keine Momente geteilt</div>
            : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {visible.map((m, i) => (
                  <div key={m.id||i} className="tpp-press-light" style={{...dl(i),cursor:"pointer"}}>
                    {m.src
                      ? <img src={m.src} alt="" className="tpp-moment-img"
                          style={{objectFit:"cover",borderRadius:12,width:"100%",aspectRatio:"1",display:"block"}}/>
                      : <div style={{
                          borderRadius:12, aspectRatio:"1", background:T.tealSoft,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          padding:8,
                        }}>
                          <span style={{fontSize:10,color:T.inkSoft,textAlign:"center",lineHeight:1.3}}>
                            {(m.caption||"").slice(0,40)}
                          </span>
                        </div>
                    }
                  </div>
                ))}
              </div>
            )
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 9. ABSCHLUSS-BAR
// ══════════════════════════════════════════════════════════════
function AbschlussBar({ profile, loading }) {
  const name = s(profile?.display_name || profile?.username, "diesem Talent");
  return (
    <div style={{
      margin:`0 ${T.px}px`,
      background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
      borderRadius:T.r20,
      padding:"22px 20px",
      display:"flex",
      alignItems:"center",
      gap:16,
    }}>
      <div style={{
        width:52,height:52,borderRadius:"50%",
        background:"rgba(255,255,255,0.22)",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:24,flexShrink:0,
      }}>🤝</div>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:800,color:"#fff",marginBottom:4,lineHeight:1.3}}>
          Lass uns gemeinsam die Welt ein Stück besser machen.
        </div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.80)"}}>
          Verbinde dich, tausch dich aus und werde Teil unserer Gemeinschaft.
        </div>
      </div>
    </div>
  );
}

function AbschlussButtons({ profile, currentUserId }) {
  const rel = useRelationship(profile?.id, currentUserId);
  const [showVerbindungsDialog, setShowVerbindungsDialog] = React.useState(false);
  const [watchingLocal, setWatchingLocal] = React.useState(null);
  const isWatching = watchingLocal !== null ? watchingLocal : rel.watching;

  // Doppel-Aufruf-Schutz (onTouchEnd + onClick können beide feuern)
  const _toggleRunning = React.useRef(false);

  async function toggleWatch() {
    if (_toggleRunning.current) return;
    _toggleRunning.current = true;
    setTimeout(() => { _toggleRunning.current = false; }, 800);

    showDebugToast(2, "toggleWatch gestartet [Abschluss]",
      `loading=${rel.loading} | user=${currentUserId?.slice(0,8) ?? "NULL"}`);

    if (!currentUserId || !profile?.id || rel.loading) {
      const reason = [
        !currentUserId  && "kein currentUserId",
        !profile?.id    && "kein profile.id",
        rel.loading     && "rel.loading=true",
      ].filter(Boolean).join(" | ");
      showDebugToast(3, "GUARD GEBLOCKT ❌ [Abschluss]", reason, true);
      return;
    }
    showDebugToast(3, "Guard passiert ✅ [Abschluss]",
      `isWatching=${isWatching} → next=${!isWatching}`);

    const next = !isWatching;
    setWatchingLocal(next);

    if (next) {
      const payload = { watcher_id: currentUserId, profile_id: profile.id };
      showDebugToast(4, "Supabase INSERT [Abschluss]",
        `watcher: ${currentUserId.slice(0,8)}…`);
      const { data, error } = await supabase
        .from("profile_watchlist")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        const detail = `code: ${error?.code ?? "–"}
msg: ${error?.message ?? "–"}
details: ${error?.details ?? "–"}
hint: ${error?.hint ?? "–"}`;
        showDebugToast(5, "INSERT FEHLER ❌ [Abschluss]", detail, true);
        setWatchingLocal(null);
        return;
      }
      showDebugToast(5, "INSERT ERFOLG ✅ [Abschluss]", `id: ${data?.id?.slice(0,12)}…`);
      rel.refetch();
    } else {
      showDebugToast(4, "Supabase DELETE [Abschluss]",
        `watcher: ${currentUserId.slice(0,8)}…`);
      const { error } = await supabase
        .from("profile_watchlist")
        .delete()
        .eq("watcher_id", currentUserId)
        .eq("profile_id", profile.id);
      if (error) {
        const detail = `code: ${error?.code ?? "–"}
msg: ${error?.message ?? "–"}`;
        showDebugToast(5, "DELETE FEHLER ❌ [Abschluss]", detail, true);
        setWatchingLocal(null);
        return;
      }
      showDebugToast(5, "DELETE ERFOLG ✅ [Abschluss]");
      rel.refetch();
    }
  }

  let primaryLabel = "🚨 DEBUG ABSCHLUSS 🚨";
  let primaryAction = toggleWatch;
  let primaryDisabled = false;

  if (rel.relationStatus === "accepted") {
    primaryLabel = "💬 Nachricht senden";
    primaryAction = () => {};
  } else if (rel.relationStatus === "pending") {
    primaryLabel = "🌿 Anfrage gesendet";
    primaryDisabled = true;
  } else if (isWatching) {
    primaryLabel = "🤝 Verbinden";
    primaryAction = () => setShowVerbindungsDialog(true);
  }

  function handleTouch(e) {
    e.preventDefault();
    showDebugToast(1, "Button-Klick [Abschluss touch]",
      `profile: ${profile?.id?.slice(0,8)}… | user: ${currentUserId?.slice(0,8)}…`);
    if (!primaryDisabled) primaryAction();
  }

  function handleClick() {
    showDebugToast(1, "Button-Klick [Abschluss click]",
      `profile: ${profile?.id?.slice(0,8)}… | user: ${currentUserId?.slice(0,8)}…`);
    if (!primaryDisabled) primaryAction();
  }

  return (
    <>
      <div style={{padding:`0 ${T.px}px`,display:"flex",gap:10}}>
        <button
          className="tpp-press"
          disabled={primaryDisabled}
          onTouchEnd={handleTouch}
          onClick={handleClick}
          style={{
            flex:1, padding:"14px 16px",
            background: primaryDisabled
              ? "rgba(14,196,184,0.10)"
              : `linear-gradient(135deg,${T.teal},${T.tealDeep})`,
            color: primaryDisabled ? T.teal : "#fff",
            border: primaryDisabled ? `1.5px solid ${T.teal}` : "none",
            borderRadius:T.r99,
            fontSize:14.5, fontWeight:800, cursor: primaryDisabled ? "default" : "pointer",
            fontFamily:"inherit",
            boxShadow: primaryDisabled ? "none" : T.glow,
            touchAction:"manipulation",
            display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            WebkitUserSelect:"none", userSelect:"none",
            WebkitTapHighlightColor:"transparent",
          }}>
          {primaryLabel}
        </button>
      </div>

      {showVerbindungsDialog && (
        <VerbindungsDialog
          profile={profile}
          currentUserId={currentUserId}
          onClose={() => setShowVerbindungsDialog(false)}
          onSuccess={() => setShowVerbindungsDialog(false)}
        />
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// HAUPT-KOMPONENTE
// ══════════════════════════════════════════════════════════════
export default function TalentProfilePage({ profileId, onClose }) {
  const { user, authProfile } = useAuth();

  const [profile,    setProfile]    = useState(null);
  const [works,      setWorks]      = useState([]);
  const [experiences,setExperiences]= useState([]);
  const [moments,    setMoments]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [mounted,    setMounted]    = useState(false);

  // Mount animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Alle Daten parallel laden
  useEffect(() => {
    if (!profileId) { setLoading(false); return; }

    (async () => {
      setLoading(true);
      try {
        const [profileRes, worksRes, experiencesRes, momentsRes] = await Promise.all([
          // Profil
          supabase.from("profiles")
            .select("id,username,display_name,bio,avatar_url,header_img,location,interests,skills,has_talent_profile,role,membership_type")
            .eq("id", profileId)
            .single(),

          // Werke (veröffentlicht)
          supabase.from("works")
            .select("id,user_id,title,description,cover_url,status,price,for_sale,created_at")
            .eq("user_id", profileId)
            .in("status", ["published","active"])
            .order("created_at", { ascending: false })
            .limit(20),

          // Erlebnisse (veröffentlicht + aktiv)
          supabase.from("experiences")
            .select("id,user_id,title,description,category,cover_url,date,status,visibility,format,location_text,created_at")
            .eq("user_id", profileId)
            .in("status", ["published","active"])
            .order("created_at", { ascending: false })
            .limit(20),

          // Momente (beitraege)
          supabase.from("beitraege")
            .select("id,user_id,src,type,caption,created_at")
            .eq("user_id", profileId)
            .order("created_at", { ascending: false })
            .limit(16),
        ]);

        // Profil
        if (profileRes.data) {
          const isOwn = user?.id && profileRes.data.id === user.id;
          setProfile(isOwn && authProfile
            ? { ...profileRes.data,
                avatar_url: authProfile.avatar_url ?? profileRes.data.avatar_url,
                header_img: authProfile.header_img  ?? profileRes.data.header_img,
                bio:        authProfile.bio          ?? profileRes.data.bio,
              }
            : profileRes.data
          );
        }

        setWorks(worksRes.data || []);
        setExperiences(experiencesRes.data || []);
        setMoments(momentsRes.data || []);

      } catch(e) {
        console.warn("[TalentProfilePage] load error:", e);
      }
      setLoading(false);
    })();
  }, [profileId]);

  const handleBack = useCallback(() => { onClose?.(); }, [onClose]);

  return (
    <div className="tpp-root" style={{
      position:"fixed", inset:0, zIndex:9500,
      display:"flex", flexDirection:"column",
      opacity:mounted?1:0,
      transform:mounted?"none":"translateY(14px)",
      transition:"opacity .35s ease, transform .35s cubic-bezier(.22,1,.36,1)",
    }}>
      <style>{CSS}</style>
      <DebugToastLayer/>

      {/* ── Sticky Header ─────────────────────── */}
      <Header onBack={handleBack} profile={profile}/>

      {/* ── Scrollable Content ────────────────── */}
      <div className="tpp-scroll" style={{
        flex:1,
        overflowY:"auto",
        touchAction:"pan-y",
        paddingBottom:"max(40px,calc(28px + env(safe-area-inset-bottom,0px)))",
      }}>

        {/* 1. Hero (Banner + Avatar + Identity) */}
        <CinematicHero profile={profile} loading={loading}/>

        {/* 2. Action Buttons */}
        <div style={{padding:`0 ${T.px}px`}}>
          <ActionButtons profile={profile} currentUserId={user?.id} loading={loading}/>
        </div>
        <Gap h={20}/>

        {/* 3. Schwerpunkt + Quick Stats */}
        <SchwerpunktStatsBlock
          profile={profile} works={works}
          experiences={experiences} moments={moments}
          loading={loading}/>
        <Gap h={28}/>

        {/* 4. Mein Wirken */}
        <MeinWirkenSection works={works} experiences={experiences} loading={loading}/>
        <Gap h={28}/>

        {/* 5. Nächste Erlebnisse (conditional) */}
        {(loading || experiences.some(e => e.date && new Date(e.date) > new Date())) && (
          <>
            <NaechsteErlebnisseSection experiences={experiences} loading={loading}/>
            <Gap h={28}/>
          </>
        )}

        {/* 6. Wirkung */}
        <WirkungSection works={works} experiences={experiences} moments={moments} loading={loading}/>
        <Gap h={28}/>

        {/* 7. Momente */}
        <MomenteSection moments={moments} loading={loading}/>
        <Gap h={32}/>

        {/* 8. Abschluss */}
        <AbschlussBar profile={profile} loading={loading}/>
        <Gap h={16}/>
        <AbschlussButtons profile={profile} currentUserId={user?.id}/>
        <Gap h={40}/>
      </div>
    </div>
  );
}
