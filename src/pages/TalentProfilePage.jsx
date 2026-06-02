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
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }  from "../lib/AuthContext.jsx";
import { useHome }  from "../components/home/HomeShell.jsx";
import { notifyWatcher } from "../lib/notificationService.js";

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
  @keyframes tpp-fade-in{from{opacity:0}to{opacity:1}}
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
  { key:"work",        emoji:"🎨", label:"Ich interessiere mich für deine Arbeit" },
  { key:"experience",  emoji:"✨", label:"Ich möchte an deinen Erlebnissen teilnehmen" },
  { key:"exchange",    emoji:"☕", label:"Ich suche Austausch" },
  { key:"create",      emoji:"🌍", label:"Ich möchte gemeinsam etwas bewirken" },
  { key:"other",       emoji:"💬", label:"Eigene Nachricht" },
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
            <div style={{fontSize:44,marginBottom:14}}>🤝</div>
            <div style={{fontSize:18,fontWeight:800,color:"#1A1A18",letterSpacing:"-0.03em",marginBottom:8}}>
              Anfrage gesendet
            </div>
            <div style={{fontSize:14,color:"rgba(26,26,24,0.52)",lineHeight:1.55,maxWidth:260,margin:"0 auto"}}>
              {name} entscheidet in Ruhe, ob eine Verbindung entstehen soll.
            </div>
          </div>
        ) : (
          <>
            {/* Titel */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:17,fontWeight:800,color:"#1A1A18",letterSpacing:"-0.03em",marginBottom:6}}>
                Warum möchtest du dich verbinden?
              </div>
              <div style={{fontSize:13,color:"rgba(26,26,24,0.50)",lineHeight:1.5}}>
                Deine Anfrage geht persönlich an {name}. Sie entscheiden, ob eine Verbindung entsteht.
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
// KOMPASS ACTION SHEET
// ══════════════════════════════════════════════════════════════
function KompassActionSheet({ profile, isWatching, onWatch, onClose, onOpenChat }) {
  const name       = profile?.display_name || profile?.username || "Dieses Talent";
  const avatar     = profile?.avatar_url   || null;
  const bio        = profile?.bio          || null;
  const talent     = profile?.talent       || profile?.role     || null;
  const location   = profile?.location_label || profile?.location || null;
  const profileUrl = window.location.origin + "/profile/" + (profile?.username || profile?.id || "");

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: name + " auf HUI", url: profileUrl });
      } catch (_) {}
    } else {
      try { await navigator.clipboard.writeText(profileUrl); } catch (_) {}
    }
  }

  // ── Design-Tokens (inline, self-contained) ─────────────────
  const teal      = "#0EC4B8";
  const tealDeep  = "#0AADA3";
  const tealSoft  = "rgba(14,196,184,0.10)";
  const tealChip  = "rgba(14,196,184,0.13)";
  const ink       = "#1A1A18";
  const inkSoft   = "rgba(26,26,24,0.52)";
  const inkFaint  = "rgba(26,26,24,0.08)";
  const bgCard    = "#FFFFFF";
  const bgSheet   = "#F7F5F0";
  const ff        = "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif";

  // ── Aktions-Card Komponente ─────────────────────────────────
  function ActionCard({ icon, iconBg, iconColor, title, subtitle, rightEl, onClick, danger }) {
    const [pressed, setPressed] = React.useState(false);
    return (
      <div
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => setPressed(false)}
        onPointerLeave={() => setPressed(false)}
        onClick={onClick}
        style={{
          display:"flex", alignItems:"center", gap:14,
          background: pressed ? "rgba(26,26,24,0.04)" : bgCard,
          borderRadius:16,
          padding:"14px 16px",
          cursor:"pointer",
          transition:"background 0.12s",
          WebkitTapHighlightColor:"transparent",
          touchAction:"manipulation",
          userSelect:"none",
        }}
      >
        {/* Icon-Bubble */}
        <div style={{
          width:44, height:44, borderRadius:14, flexShrink:0,
          background: iconBg || tealSoft,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20,
        }}>
          {typeof icon === "string" ? icon : icon}
        </div>

        {/* Text */}
        <div style={{flex:1, minWidth:0}}>
          <div style={{
            fontSize:15, fontWeight:700,
            color: danger ? "#E53E3E" : ink,
            letterSpacing:"-0.01em",
            marginBottom:2,
          }}>{title}</div>
          {subtitle && (
            <div style={{
              fontSize:12.5, color: danger ? "rgba(229,62,62,0.65)" : inkSoft,
              lineHeight:1.4,
            }}>{subtitle}</div>
          )}
        </div>

        {/* Rechts-Element oder Chevron */}
        <div style={{flexShrink:0, display:"flex", alignItems:"center", gap:6}}>
          {rightEl || (
            <svg width="7" height="13" viewBox="0 0 7 13" fill="none">
              <path d="M1 1l5 5.5L1 12" stroke={danger ? "#E53E3E" : "rgba(26,26,24,0.25)"}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
    );
  }

  // ── Watch Chip ──────────────────────────────────────────────
  const WatchChip = ({ active }) => (
    <div style={{
      display:"flex", alignItems:"center", gap:5,
      padding:"5px 10px",
      borderRadius:99,
      background: active ? "rgba(14,196,184,0.12)" : "rgba(26,26,24,0.06)",
      border: active ? "1px solid rgba(14,196,184,0.30)" : "1px solid rgba(26,26,24,0.10)",
    }}>
      {active && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path d="M1 4.5L4 7.5L10 1" stroke={teal} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      <span style={{
        fontSize:12, fontWeight:700,
        color: active ? tealDeep : "rgba(26,26,24,0.45)",
        letterSpacing:"-0.01em",
      }}>
        {active ? "Aktiv" : "Nicht aktiv"}
      </span>
    </div>
  );

  // ── Kontext-Karte (Beziehungskontext) ───────────────────────
  function ContextCard({ emoji, value, label, color }) {
    return (
      <div style={{
        flex:1, display:"flex", flexDirection:"column", alignItems:"center",
        gap:4, padding:"10px 6px",
      }}>
        <div style={{
          width:32, height:32, borderRadius:"50%",
          background: color || "rgba(14,196,184,0.10)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:16, marginBottom:2,
        }}>{emoji}</div>
        <div style={{
          fontSize:15, fontWeight:800, color:ink,
          letterSpacing:"-0.02em", lineHeight:1,
        }}>{value}</div>
        <div style={{
          fontSize:11, color:inkSoft, textAlign:"center",
          lineHeight:1.3,
        }}>{label}</div>
      </div>
    );
  }

  return createPortal(
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position:"fixed", inset:0,
          background:"rgba(20,18,15,0.52)",
          backdropFilter:"blur(6px)",
          WebkitBackdropFilter:"blur(6px)",
          zIndex:9998,
        }}
      />

      {/* ── Sheet ── */}
      <div style={{
        position:"fixed",
        left:0, right:0, bottom:0,
        zIndex:9999,
        background:bgSheet,
        borderRadius:"26px 26px 0 0",
        paddingBottom:"max(20px,env(safe-area-inset-bottom,20px))",
        boxShadow:"0 -12px 60px rgba(26,26,24,0.18), 0 -2px 8px rgba(26,26,24,0.08)",
        fontFamily:ff,
        maxHeight:"92vh",
        overflowY:"auto",
        WebkitOverflowScrolling:"touch",
      }}>

        {/* ── Handle ── */}
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 0"}}>
          <div style={{width:38,height:4,borderRadius:2,background:"rgba(26,26,24,0.15)"}}/>
        </div>

        {/* ══════════════════════════════════
            BEREICH 1 — PROFILKOPF
            ══════════════════════════════════ */}
        <div style={{
          background:bgCard,
          borderRadius:20,
          margin:"12px 16px 0",
          padding:"18px 18px 16px",
          boxShadow:"0 1px 8px rgba(26,26,24,0.06)",
        }}>
          <div style={{display:"flex", gap:14, alignItems:"flex-start"}}>

            {/* Avatar */}
            <div style={{position:"relative", flexShrink:0}}>
              {avatar ? (
                <img src={avatar} alt={name} style={{
                  width:72, height:72, borderRadius:"50%",
                  objectFit:"cover",
                  border:"3px solid #fff",
                  boxShadow:"0 2px 12px rgba(26,26,24,0.14)",
                }}/>
              ) : (
                <div style={{
                  width:72, height:72, borderRadius:"50%",
                  background:`linear-gradient(135deg,${teal},${tealDeep})`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:28, fontWeight:800, color:"#fff",
                  boxShadow:"0 2px 12px rgba(14,196,184,0.28)",
                }}>
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Online-Dot */}
              <div style={{
                position:"absolute", bottom:2, right:2,
                width:13, height:13, borderRadius:"50%",
                background:"#22C55E",
                border:"2.5px solid #fff",
              }}/>
            </div>

            {/* Identität */}
            <div style={{flex:1, minWidth:0, paddingTop:2}}>
              <div style={{
                fontSize:20, fontWeight:900, color:ink,
                letterSpacing:"-0.03em", lineHeight:1.15,
                marginBottom:4,
              }}>{name}</div>

              {talent && (
                <div style={{
                  display:"flex", alignItems:"center", gap:5,
                  marginBottom:6,
                }}>
                  <span style={{fontSize:13}}>🎨</span>
                  <span style={{
                    fontSize:13, fontWeight:700,
                    color:tealDeep, letterSpacing:"-0.01em",
                  }}>{talent}</span>
                </div>
              )}

              {bio && (
                <div style={{
                  fontSize:13, color:inkSoft, lineHeight:1.5,
                  marginBottom:6,
                  display:"-webkit-box",
                  WebkitLineClamp:2,
                  WebkitBoxOrient:"vertical",
                  overflow:"hidden",
                }}>
                  &ldquo;{bio}&rdquo;
                </div>
              )}

              <div style={{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
                {location && (
                  <div style={{
                    display:"flex", alignItems:"center", gap:4,
                    fontSize:12, color:inkSoft,
                  }}>
                    <span>📍</span>
                    <span>{location}</span>
                  </div>
                )}
                {(profile?.is_wirker === true || profile?.role === "talent" || profile?.role === "wirker" || profile?.has_talent_profile) && (
                  <div style={{
                    display:"flex", alignItems:"center", gap:4,
                    fontSize:12, color:inkSoft,
                  }}>
                    <span>⭐</span>
                    <span>Wirker</span>
                  </div>
                )}
              </div>
            </div>

            {/* Watch-Status-Chip oben rechts */}
            {isWatching && (
              <div style={{flexShrink:0, paddingTop:2}}>
                <div style={{
                  display:"flex", flexDirection:"column", alignItems:"center",
                  padding:"7px 10px",
                  borderRadius:14,
                  background:tealSoft,
                  border:`1px solid rgba(14,196,184,0.22)`,
                  gap:3,
                }}>
                  <span style={{fontSize:16}}>🌱</span>
                  <span style={{fontSize:11,fontWeight:700,color:tealDeep}}>Im Blick</span>
                  <span style={{fontSize:10,color:inkSoft}}>aktiv</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════
            BEREICH 2 — BEZIEHUNGSKONTEXT
            ══════════════════════════════════ */}
        <div style={{
          background:bgCard,
          borderRadius:20,
          margin:"10px 16px 0",
          padding:"4px 8px",
          boxShadow:"0 1px 8px rgba(26,26,24,0.06)",
          display:"flex",
          alignItems:"stretch",
        }}>
          <ContextCard
            emoji="👥"
            value="2"
            label="Gemeinsame Kontakte"
            color="rgba(14,196,184,0.10)"
          />
          <div style={{width:1,background:inkFaint,margin:"12px 0"}}/>
          <ContextCard
            emoji="👁"
            value="1"
            label="Beobachtet dich"
            color="rgba(14,196,184,0.10)"
          />
          <div style={{width:1,background:inkFaint,margin:"12px 0"}}/>
          <ContextCard
            emoji="🤝"
            value="—"
            label="Noch keine Verbindung"
            color="rgba(255,107,82,0.10)"
          />
        </div>

        {/* ══════════════════════════════════
            BEREICH 3 — AKTIONEN
            ══════════════════════════════════ */}
        <div style={{
          display:"flex", flexDirection:"column", gap:8,
          margin:"10px 16px 0",
        }}>

          {/* Card 1: Im Blick behalten */}
          <ActionCard
            icon="🌱"
            iconBg={isWatching ? "rgba(14,196,184,0.12)" : "rgba(14,196,184,0.09)"}
            title="Im Blick behalten"
            subtitle="Du siehst Updates dieser Person."
            rightEl={<WatchChip active={!!isWatching} />}
            onClick={() => { onWatch?.(); onClose?.(); }}
          />

          {/* Card 2: Nachricht senden */}
          <ActionCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                  stroke="#6B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="11" r="1" fill="#6B5CF6"/>
                <circle cx="12" cy="11" r="1" fill="#6B5CF6"/>
                <circle cx="15" cy="11" r="1" fill="#6B5CF6"/>
              </svg>
            }
            iconBg="rgba(107,92,246,0.10)"
            title="Nachricht senden"
            subtitle="Starte ein Gespräch und tausche dich aus."
            onClick={() => { onOpenChat?.(); onClose?.(); }}
          />

          {/* Card 3: Profil teilen */}
          <ActionCard
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
                  stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            iconBg="rgba(59,130,246,0.10)"
            title="Profil teilen"
            subtitle="Profil mit anderen teilen."
            onClick={handleShare}
          />

          {/* Card 4: Schließen */}
          <ActionCard
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14"
                  stroke="#E53E3E" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            }
            iconBg="rgba(229,62,62,0.10)"
            title="Schließen"
            subtitle="Kompass schließen"
            onClick={onClose}
            danger={true}
          />
        </div>

        {/* Boden-Abstand */}
        <div style={{height:8}}/>
      </div>
    </>,
    document.body
  );
}

// ══════════════════════════════════════════════════════════════
// 3. ACTION BUTTONS (Verbinden, Nachricht)
// ══════════════════════════════════════════════════════════════
function ActionButtons({ profile, currentUserId, loading, onOpenChat, onOpenKompass }) {
  const rel = useRelationship(profile?.id, currentUserId);
  const { authProfile } = useAuth();
  const [showVerbindungsDialog, setShowVerbindungsDialog] = React.useState(false);
  const [watchingLocal,         setWatchingLocal]         = React.useState(null);
  const isWatching = watchingLocal !== null ? watchingLocal : rel.watching;
  const _toggleRunning = React.useRef(false);

  async function toggleWatch() {
    if (_toggleRunning.current) return;
    _toggleRunning.current = true;
    setTimeout(() => { _toggleRunning.current = false; }, 800);
    if (!currentUserId || !profile?.id || loading || rel.loading) return;

    const next = !isWatching;
    setWatchingLocal(next);
    if (next) {
      const { error } = await supabase
        .from("profile_watchlist")
        .insert({ watcher_id: currentUserId, profile_id: profile.id })
        .select("id").single();
      if (error) { setWatchingLocal(null); return; }
      // Notification an Profilinhaber — non-blocking, bestehender Service
      notifyWatcher({
        watcherId:   currentUserId,
        profileId:   profile.id,
        watcherName: authProfile?.display_name || "Jemand",
      }).catch(() => {});
      rel.refetch();
    } else {
      const { error } = await supabase
        .from("profile_watchlist")
        .delete()
        .eq("watcher_id", currentUserId)
        .eq("profile_id", profile.id);
      if (error) { setWatchingLocal(null); return; }
      rel.refetch();
    }
  }

  if (loading || rel.loading) {
    return (
      <div style={{display:"flex",gap:10}}>
        <div className="tpp-skeleton" style={{flex:1,height:48,borderRadius:T.r99}}/>
        <div className="tpp-skeleton" style={{width:48,height:48,borderRadius:"50%"}}/>
      </div>
    );
  }

  const isAccepted = rel.relationStatus === "accepted";
  const isPending  = rel.relationStatus === "pending";
  const isDeclined = rel.relationStatus === "declined";

  return (
    <>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <div style={{display:"flex",gap:10}}>

          {/* Primär-Button */}
          {isAccepted ? (
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

          ) : isPending ? (
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

          ) : isDeclined ? (
            <button disabled style={{
              flex:1, padding:"13px 16px",
              background:"transparent", color:"rgba(26,26,24,0.30)",
              border:`1.5px solid rgba(26,26,24,0.08)`,
              borderRadius:T.r99, fontSize:13, fontWeight:600,
              fontFamily:"inherit", cursor:"default",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              Verbindung nicht möglich
            </button>

          ) : isWatching ? (
            // STUFE 2 → Verbinden
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

          ) : (
            // STUFE 1 → Im Blick behalten
            <button className="tpp-press" onClick={toggleWatch} style={{
              flex:1, padding:"13px 16px",
              background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
              color:"#fff", border:"none", borderRadius:T.r99,
              fontSize:14, fontWeight:800, cursor:"pointer",
              fontFamily:"inherit", boxShadow:T.glow,
              display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              touchAction:"manipulation",
            }}>
              🌱 Im Blick behalten
            </button>
          )}

          {/* Kompass-Button */}
          <button
            className="tpp-press-light"
            onClick={() => onOpenKompass({ isWatching, toggleWatch })}
            style={{
              width:46, height:46,
              background:"#FFFFFF",
              border:`1.5px solid ${T.borderMid}`,
              borderRadius:"50%", cursor:"pointer", fontSize:22,
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0,
              boxShadow:"0 2px 12px rgba(26,26,24,0.10), 0 1px 3px rgba(26,26,24,0.06)",
              touchAction:"manipulation",
              color:T.teal,
            }}
            aria-label="Weitere Optionen"
          >
            🧭
          </button>
        </div>

        {/* Untertext: Beobachter-Status */}
        {isWatching && !isAccepted && (
          <div style={{
            textAlign:"center", fontSize:12, color:"rgba(26,26,24,0.42)",
            letterSpacing:"0.01em",
          }}>
            Du beobachtest das Wirken dieses Talents.
          </div>
        )}
      </div>

      {showVerbindungsDialog && (
        <VerbindungsDialog
          profile={profile}
          currentUserId={currentUserId}
          onClose={() => setShowVerbindungsDialog(false)}
          onSuccess={() => { setShowVerbindungsDialog(false); rel.refetch(); }}
        />
      )}
    </>
  );
}


// ══════════════════════════════════════════════════════════════
// 4. SCHWERPUNKT-KARTE + QUICK-STATS
// ══════════════════════════════════════════════════════════════
function SchwerpunktStatsBlock({ profile, works, experiences, moments, loading, followCounts }) {
  const sp = useMemo(
    () => detectSchwerpunkt(profile, works, experiences),
    [profile, works, experiences]
  );

  const stats = [
    { emoji:"👥", value: loading ? "–" : String(followCounts?.followers ?? 0), label:"Follower" },
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
  const { authProfile } = useAuth();
  const [showVerbindungsDialog, setShowVerbindungsDialog] = React.useState(false);
  const [watchingLocal, setWatchingLocal] = React.useState(null);
  const isWatching = watchingLocal !== null ? watchingLocal : rel.watching;
  const _toggleRunning = React.useRef(false);

  async function toggleWatch() {
    if (_toggleRunning.current) return;
    _toggleRunning.current = true;
    setTimeout(() => { _toggleRunning.current = false; }, 800);
    if (!currentUserId || !profile?.id || rel.loading) return;

    const next = !isWatching;
    setWatchingLocal(next);
    if (next) {
      const { error } = await supabase
        .from("profile_watchlist")
        .insert({ watcher_id: currentUserId, profile_id: profile.id })
        .select("id").single();
      if (error) { setWatchingLocal(null); return; }
      // Notification an Profilinhaber — non-blocking, bestehender Service
      notifyWatcher({
        watcherId:   currentUserId,
        profileId:   profile.id,
        watcherName: authProfile?.display_name || "Jemand",
      }).catch(() => {});
      rel.refetch();
    } else {
      const { error } = await supabase
        .from("profile_watchlist")
        .delete()
        .eq("watcher_id", currentUserId)
        .eq("profile_id", profile.id);
      if (error) { setWatchingLocal(null); return; }
      rel.refetch();
    }
  }

  // Stufe bestimmen
  const isAccepted = rel.relationStatus === "accepted";
  const isPending  = rel.relationStatus === "pending";
  const isDeclined = rel.relationStatus === "declined";

  return (
    <>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>

        {/* ── Primär-Button ── */}
        {isAccepted ? (
          <button className="tpp-press" onClick={() => {}} style={{
            width:"100%", padding:"14px 16px",
            background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
            color:"#fff", border:"none", borderRadius:T.r99,
            fontSize:14.5, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit", boxShadow:T.glow,
            display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            touchAction:"manipulation",
          }}>
            💬 Nachricht senden
          </button>

        ) : isPending ? (
          <button disabled style={{
            width:"100%", padding:"14px 16px",
            background:"rgba(14,196,184,0.10)",
            color:T.teal, border:`1.5px solid ${T.teal}`,
            borderRadius:T.r99, fontSize:14, fontWeight:700,
            fontFamily:"inherit", cursor:"default",
            display:"flex", alignItems:"center", justifyContent:"center", gap:7,
          }}>
            🌿 Anfrage gesendet
          </button>

        ) : isDeclined ? (
          <button disabled style={{
            width:"100%", padding:"14px 16px",
            background:"transparent", color:"rgba(26,26,24,0.30)",
            border:`1.5px solid rgba(26,26,24,0.08)`,
            borderRadius:T.r99, fontSize:13, fontWeight:600,
            fontFamily:"inherit", cursor:"default",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            Verbindung nicht möglich
          </button>

        ) : isWatching ? (
          // STUFE 2 → Verbinden
          <button className="tpp-press" onClick={() => setShowVerbindungsDialog(true)} style={{
            width:"100%", padding:"14px 16px",
            background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
            color:"#fff", border:"none", borderRadius:T.r99,
            fontSize:14.5, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit", boxShadow:T.glow,
            display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            touchAction:"manipulation",
          }}>
            🤝 Verbinden
          </button>

        ) : (
          // STUFE 1 → Im Blick behalten
          <button className="tpp-press" onClick={toggleWatch} style={{
            width:"100%", padding:"14px 16px",
            background:`linear-gradient(135deg,${T.teal},${T.tealDeep})`,
            color:"#fff", border:"none", borderRadius:T.r99,
            fontSize:14.5, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit", boxShadow:T.glow,
            display:"flex", alignItems:"center", justifyContent:"center", gap:7,
            touchAction:"manipulation",
          }}>
            🌱 Im Blick behalten
          </button>
        )}

        {/* ── Untertext: Beobachter-Status ── */}
        {isWatching && !isAccepted && (
          <div style={{
            textAlign:"center", fontSize:12, color:"rgba(26,26,24,0.42)",
            letterSpacing:"0.01em",
          }}>
            Du beobachtest das Wirken dieses Talents.
          </div>
        )}
      </div>

      {showVerbindungsDialog && (
        <VerbindungsDialog
          profile={profile}
          currentUserId={currentUserId}
          onClose={() => setShowVerbindungsDialog(false)}
          onSuccess={() => { setShowVerbindungsDialog(false); rel.refetch(); }}
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
  const { setShowChat, setChatRecipient } = useHome();

  const [profile,    setProfile]    = useState(null);
  const [works,      setWorks]      = useState([]);
  const [experiences,setExperiences]= useState([]);
  const [moments,    setMoments]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [mounted,    setMounted]    = useState(false);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [showKompassSheet, setShowKompassSheet] = useState(false);
  const [kompassWatchLocal, setKompassWatchLocal] = useState(null);
  const kompassToggleRef = React.useRef(() => {});

  // ── Chat aus Kompass öffnen ──────────────────────────────
  const handleOpenChat = useCallback(() => {
    if (!profile) return;
    const _hoc = { k:"HANDLE_OPEN_CHAT", profileId: profile?.id, profileUserId: profile?.user_id, display_name: profile?.display_name, ts: Date.now() };
    console.error("HANDLE_OPEN_CHAT", _hoc);
    if (!window.__HUI_RLOG__) window.__HUI_RLOG__ = [];
    window.__HUI_RLOG__.unshift(_hoc);
    if (window.__HUI_RLOG__.length > 10) window.__HUI_RLOG__.pop();
    const payload = {
      id:           profile.id,
      display_name: profile.display_name || profile.username || "Creator",
      avatar_url:   profile.avatar_url   || null,
      talent:       profile.talent        || null,
    };
    setChatRecipient(payload);
    const _crs = { k:"CHAT_RECIPIENT_SET", recipientId: payload?.id, display_name: payload?.display_name, ts: Date.now() };
    console.error("CHAT_RECIPIENT_SET", _crs);
    window.__HUI_RLOG__.unshift(_crs);
    if (window.__HUI_RLOG__.length > 10) window.__HUI_RLOG__.pop();
    console.log("[SHOW_CHAT_TRUE]", { caller: "TalentProfilePage/handleOpenChat", stack: new Error().stack, ts: Date.now() });
    if (typeof window !== "undefined") { window.__HUI_LAST_SHOWCHAT__ = { value: true, caller: "TalentProfilePage/handleOpenChat", ts: Date.now() }; }
    setShowChat(true);
  }, [profile, setChatRecipient, setShowChat]);

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
        const [profileRes, worksRes, experiencesRes, momentsRes, fcRes] = await Promise.all([
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

          // Follower-Zähler (live aus follows-Tabelle)
          supabase.rpc("get_follow_counts", { target_id: profileId }),
        ]);

        // Profil
        if (profileRes.data) {
          // Sicherstellen dass id immer vorhanden ist
          const safeData = { ...profileRes.data, id: profileRes.data.id ?? profileId };
          const isOwn = user?.id && safeData.id === user.id;
          setProfile(isOwn && authProfile
            ? { ...safeData,
                avatar_url: authProfile.avatar_url ?? safeData.avatar_url,
                header_img: authProfile.header_img  ?? safeData.header_img,
                bio:        authProfile.bio          ?? safeData.bio,
              }
            : safeData
          );
        } else {
          // Fallback: profileId ist bekannt — Mindest-Objekt setzen
          // damit ActionButtons nicht mit null-profile arbeitet
          setProfile({ id: profileId });
        }

        setWorks(worksRes.data || []);
        setExperiences(experiencesRes.data || []);
        setMoments(momentsRes.data || []);
        setFollowCounts({
          followers: fcRes.data?.[0]?.followers ?? 0,
          following: fcRes.data?.[0]?.following ?? 0,
        });

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
          <ActionButtons profile={profile} currentUserId={user?.id} loading={loading} onOpenKompass={({ isWatching: iw, toggleWatch: tw }) => { setKompassWatchLocal(iw); kompassToggleRef.current = tw; setShowKompassSheet(true); }}/>
        </div>
        <Gap h={20}/>

        {/* 3. Schwerpunkt + Quick Stats */}
        <SchwerpunktStatsBlock
          profile={profile} works={works}
          experiences={experiences} moments={moments}
          loading={loading} followCounts={followCounts}/>
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
      {showKompassSheet && (
        <KompassActionSheet
          profile={profile}
          isWatching={kompassWatchLocal}
          onWatch={kompassToggleRef.current}
          onClose={() => setShowKompassSheet(false)}
          onOpenChat={handleOpenChat}
        />
      )}
        <Gap h={16}/>
        <AbschlussButtons profile={profile} currentUserId={user?.id}/>
        <Gap h={40}/>
      </div>
    </div>
  );
}

