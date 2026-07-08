// src/pages/TalentProfilePage.jsx — HUI Öffentliches Wirkerprofil v2
// "Hier wirkt ein Mensch aktiv in der Gemeinschaft."
// ════════════════════════════════════════════════════════════════
// Architektur:
//   1. Header (Nav: Zurück, Öffentliches Profil, Teilen)
//   3. ActionButtons (Verbinden, Nachricht)
//   4. SchwerpunktKarte (auto-ermittelt aus works/experiences/interests)
//   5. QuickStats (Verbindungen, Begegnungen, Momente, Projekte, Menschen)
//   7. NaechsteErlebnisse (nur wenn zukünftige Termine vorhanden)
//   9. Momente (beitraege)
//  10. AbschlussBar (Verbinden, Nachricht, Einladung)
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth }  from "../lib/AuthContext.jsx";
import { notifyWatcher } from "../lib/notificationService.js";
import { useHome }       from "../components/home/HomeShell.jsx";
import SettingsModal  from "../components/settings/SettingsModal.jsx";
import HuiStudio      from "../components/studio/HuiStudio.jsx";
// Sprint D: Datenlayer
import { useProfileData } from "../hooks/useProfileData.js";
// Sprint D: Unified Sections (Sprint C)
import { ProfileHeader }           from "../components/profile/ProfileHeader.jsx";
import { TalentSection }          from "../components/profile/sections/TalentSection.jsx";
import { WorksSection }           from "../components/profile/sections/WorksSection.jsx";
import { ExperiencesSection }     from "../components/profile/sections/ExperiencesSection.jsx";
import { RecommendationsSection } from "../components/profile/sections/RecommendationsSection.jsx";
import { AvailabilitySection }    from "../components/profile/sections/AvailabilitySection.jsx";
import { LocationSection }        from "../components/profile/sections/LocationSection.jsx";
import { VisibilitySection }      from "../components/profile/sections/VisibilitySection.jsx";
import { MomentsSection }         from "../components/profile/sections/MomentsSection.jsx";
import { OrbSignatur }            from "../components/profile/OrbSignatur.jsx";

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
// ── Schwerpunkt-Logik ──────────────────────────────────────────
function detectSchwerpunkt(profile, works, experiences) {
  const interests = a(profile?.dna_tags || profile?.skills); // interests nicht in DB → dna_tags/skills
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
function Header({ onBack, isOwner, onSettings }) {
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:`14px ${T.px}px 10px`,background:T.bg,position:"sticky",top:0,zIndex:10}}>
      <button className="tpp-press" onClick={onBack}
        style={{width:36,height:36,borderRadius:"50%",background:T.bgCard,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,cursor:"pointer",touchAction:"manipulation",boxShadow:T.card,color:T.ink}}>
        ‹
      </button>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:15,fontWeight:700,color:T.ink,letterSpacing:"-0.02em",display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
          Öffentliches Talent-Profil <span style={{fontSize:14}}>✨</span>
        </div>
        <div style={{fontSize:11.5,color:T.inkFaint,fontWeight:400,marginTop:1}}>
          Entdecke meine Welt und meine Werke.
        </div>
      </div>
      {isOwner ? (
        <button className="tpp-press" onClick={onSettings}
          style={{width:36,height:36,borderRadius:"50%",background:T.bgCard,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,cursor:"pointer",touchAction:"manipulation",boxShadow:T.card,color:T.ink}}>
          ⚙️
        </button>
      ) : (
        <button className="tpp-press-light"
          style={{width:36,height:36,borderRadius:"50%",background:T.bgCard,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",touchAction:"manipulation",boxShadow:T.card,color:T.ink,letterSpacing:"2px"}}>
          ···
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. CINEMATIC HERO — Banner + Avatar + Identity
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// KOMPASS ACTION SHEET
// ══════════════════════════════════════════════════════════════
function KompassActionSheet({ profile, isWatching, onWatch, onClose }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:10500,
        background:"rgba(26,26,24,0.45)",
        display:"flex", alignItems:"flex-end",
        WebkitTapHighlightColor:"transparent",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"100%",
          background:"#FFFBF8",
          borderRadius:"22px 22px 0 0",
          padding:"24px 20px max(28px,calc(16px + env(safe-area-inset-bottom,0px)))",
          boxShadow:"0 -8px 40px rgba(26,26,24,0.18)",
          fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
        }}
      >
        <div style={{
          width:36, height:4, borderRadius:2,
          background:"rgba(26,26,24,0.12)",
          margin:"0 auto 18px",
        }}/>
        <div style={{fontSize:15, fontWeight:700, color:"rgba(26,26,24,0.55)", marginBottom:18, textAlign:"center"}}>
          {profile?.display_name || "Creator"}
        </div>
        <button
          onClick={() => { onWatch?.(); onClose(); }}
          style={{
            width:"100%", padding:"15px 18px",
            background: isWatching ? "rgba(255,138,107,0.07)" : "rgba(22,215,197,0.07)",
            border: isWatching
              ? "1.5px solid rgba(255,138,107,0.22)"
              : "1.5px solid rgba(22,215,197,0.22)",
            borderRadius:14, cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center", gap:12,
            marginBottom:10, touchAction:"manipulation",
          }}
        >
          <span style={{fontSize:20}}>{isWatching ? "\uD83D\uDC41" : "\uD83C\uDF31"}</span>
          <div style={{textAlign:"left"}}>
            <div style={{fontSize:14, fontWeight:700, color:"#1a1a18"}}>
              {isWatching ? "Nicht mehr beobachten" : "Im Blick behalten"}
            </div>
            <div style={{fontSize:12, color:"rgba(26,26,24,0.45)", marginTop:1}}>
              {isWatching
                ? "Aus deiner Beobachtungsliste entfernen"
                : "Werde benachrichtigt wenn sich etwas tut"}
            </div>
          </div>
        </button>
        <button
          onClick={onClose}
          style={{
            width:"100%", padding:"14px",
            background:"rgba(26,26,24,0.05)",
            border:"none", borderRadius:14,
            fontSize:14, fontWeight:600, color:"rgba(26,26,24,0.55)",
            cursor:"pointer", fontFamily:"inherit", touchAction:"manipulation",
          }}
        >
          Abbrechen
        </button>
      </div>
    </div>,
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
    { emoji:"🌿", value: loading ? "–" : (profile?.impact_eur ?? 0) > 0 ? "€\u202f" + Math.round(profile.impact_eur) : "–", label:"Gemeinsame\nWirkung" },
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
            <div style={{fontSize:10,color:T.inkFaint,textAlign:"center",lineHeight:1.35,textAlign:"center"}}>{st.label}</div>
          </div>
        ))}
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
      .filter(e => e.date && new Date(e.date) > now && ["published","active","approved"].includes(e.status))
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
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 8. MOMENTE — beitraege
// ══════════════════════════════════════════════════════════════

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

function AbschlussButtons({ profile, currentUserId, onOpenChat }) {
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
          <button className="tpp-press" onClick={onOpenChat} style={{
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
// MEINE TALENTE & ANGEBOTE — Skill-Pills aus profile.skills
// ══════════════════════════════════════════════════════════════
// LEGACY — Ersetzt durch gemeinsame TalentSection (src/components/profile/sections/TalentSection.jsx)

// ══════════════════════════════════════════════════════════════
// MEINE WERKE — horizontaler Scroller, Screenshot-exakt
// ══════════════════════════════════════════════════════════════
// LEGACY — Ersetzt durch gemeinsame WorksSection (src/components/profile/sections/WorksSection.jsx)

// ══════════════════════════════════════════════════════════════
// ERLEBNISSE & PROJEKTE — Screenshot-exakt mit Labels
// ══════════════════════════════════════════════════════════════
const CAT_MAP = {
  workshop:"Workshop", kurs:"Workshop", malen:"Workshop",
  event:"Event", festival:"Event", konzert:"Event",
  ausstellung:"Ausstellung", galerie:"Ausstellung",
  projekt:"Projekt", community:"Projekt",
};
// LEGACY — Ersetzt durch gemeinsame ExperiencesSection (src/components/profile/sections/ExperiencesSection.jsx)

// ══════════════════════════════════════════════════════════════
// KUNDENSTIMMEN — horizontaler Scroller, Screenshot-exakt
// ══════════════════════════════════════════════════════════════
// LEGACY — Ersetzt durch gemeinsame RecommendationsSection (src/components/profile/sections/RecommendationsSection.jsx)

// ══════════════════════════════════════════════════════════════
// VERFÜGBARKEIT + STANDORT — 2-Spalten, Screenshot-exakt
// ══════════════════════════════════════════════════════════════
// LEGACY — Ersetzt durch AvailabilitySection + LocationSection (src/components/profile/sections/)

// ══════════════════════════════════════════════════════════════
// SICHTBARKEIT — Screenshot-exakt
// ══════════════════════════════════════════════════════════════
// LEGACY — Ersetzt durch gemeinsame VisibilitySection (src/components/profile/sections/VisibilitySection.jsx)

// ══════════════════════════════════════════════════════════════
// SOCIAL CONTEXT BAR — 3 Spalten: Verbindungen · Begegnungen · Momente
// ══════════════════════════════════════════════════════════════
function SocialContextBarTalent({ followCounts, experiences, moments, loading }) {
  const stats = [
    { icon:"👥", value: loading?"–":String(followCounts?.followers??0),            label:"Verbindungen"      },
    { icon:"❤️", value: loading?"–":String(Math.max(experiences.length*3,8)), label:"Gem. Begegnungen" },
    { icon:"💬", value: loading?"–":String(moments.length||6), label:"Gem. Momente" },
  ];
  return (
    <div style={{
      display:"grid",gridTemplateColumns:"repeat(3,1fr)",
      background:T.bgCard,borderRadius:T.r20,
      border:`1px solid ${T.border}`,margin:`0 ${T.px}px`,
      boxShadow:T.card,overflow:"hidden",
    }}>
      {stats.map((st,i)=>(
        <div key={i} style={{
          display:"flex",flexDirection:"column",alignItems:"center",
          padding:"16px 8px",
          borderRight:i<2?`1px solid ${T.border}`:"none",
        }}>
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
            <span style={{fontSize:16}}>{st.icon}</span>
            <span style={{fontSize:18,fontWeight:800,color:T.ink,letterSpacing:"-0.03em"}}>{st.value}</span>
          </div>
          <span style={{fontSize:10.5,color:T.inkFaint,textAlign:"center",lineHeight:1.35,textAlign:"center"}}>{st.label}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// HAUPT-KOMPONENTE — Sprint D
// Datenlayer: useProfileData() statt lokaler Queries
// Header: ProfileHeader (unified)
// Sections: gemeinsame Sprint-C-Komponenten
// ══════════════════════════════════════════════════════════════
export default function TalentProfilePage({ profileId, onClose, publicView = false }) {
  const { user, setProfile: setAuthProfile } = useAuth();

  // ── Sprint D: Datenlayer via useProfileData ─────────────────
  const {
    profile,
    wirkerProfile,
    works,
    experiences,
    recommendations,
    moments,
    followCounts,
    loading,
    error,
    reload,
  } = useProfileData(profileId);

  // ── Lokale UI-States (kein Datenlayer) ──────────────────────
  const [mounted,           setMounted]           = useState(false);
  const [showKompassSheet,  setShowKompassSheet]  = useState(false);
  const [kompassWatchLocal, setKompassWatchLocal] = useState(null);
  const [showSettings,      setShowSettings]      = useState(false);
  const [showStudio,        setShowStudio]        = useState(false);
  const kompassToggleRef = React.useRef(() => {});

  const isOwner = !publicView && (!!user?.id && (profileId === user.id || (!profileId && !!user.id)));

  // Mount-Animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);
  // ── Sprint F.9G.4: Realtime — Admin-Freigabe (works + experiences) ──
  // Nur UPDATE: wenn Admin status → published/approved setzt, sofort sichtbar.
  // DELETE bewusst ausgelassen (Skalierungsrisiko, kein primärer UX-Flow).
  useEffect(() => {
    if (!profileId) return;
    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    const topic = "ttp:works-exps:" + profileId;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let ch = existing;
    let createdHere = false;
    if (!existing) {
      ch = supabase
        .channel(topic)
        .on("postgres_changes", {
          event: "UPDATE", schema: "public", table: "works",
          filter: "user_id=eq." + profileId,
        }, () => reload())
        .on("postgres_changes", {
          event: "UPDATE", schema: "public", table: "experiences",
          filter: "user_id=eq." + profileId,
        }, () => reload())
        .subscribe();
      createdHere = true;
    }
    return () => { if (createdHere) supabase.removeChannel(ch); };
  }, [profileId, reload]);

  const handleBack = useCallback(() => { onClose?.(); }, [onClose]);

  // Chat via CCO (identisch zu bisheriger Logik)
  const { setShowChat, setChatRecipient } = useHome();
  const handleOpenChat = useCallback(() => {
    if (!profile?.id) return;
    setChatRecipient({
      id:           profile.id,
      display_name: profile.display_name || profile.username || "Talent",
      avatar_url:   profile.avatar_url || null,
    });
    setShowChat(true);
  }, [profile, setChatRecipient, setShowChat]);

  // Avatar/Cover-Update → sofortiger AuthContext-Update + reload
  // Sprint F.4D.1: setAuthProfile sofort aufrufen — kein Reload nötig
  const handleAvatarChange = useCallback((url) => {
    if (url && setAuthProfile) {
      setAuthProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
    }
    reload();
  }, [reload, setAuthProfile]);

  const handleCoverChange = useCallback((url) => {
    if (url && setAuthProfile) {
      setAuthProfile(prev => prev ? { ...prev, header_img: url } : prev);
    }
    reload();
  }, [reload, setAuthProfile]);

  // Verfügbarkeit — schreibt direkt in profiles.is_available (Sprint F.3A / F.9G.1: error-check)
  const handleAvailabilityChange = useCallback(async (isAvailable) => {
    if (!user?.id) return;
    const { error } = await supabase.from("profiles")
      .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) { console.error("handleAvailabilityChange:", error.message); return; }
    reload();
  }, [user?.id, reload]);

  // Standort — schreibt direkt in profiles.location (Sprint F.3B — einzige Wahrheitsquelle)
  // Standort error-check (Sprint F.9G.1)
  const handleLocationChange = useCallback(async (locationStr) => {
    if (!user?.id) return;
    const { error } = await supabase.from("profiles")
      .update({ location: locationStr, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) { console.error("handleLocationChange:", error.message); return; }
    reload();
  }, [user?.id, reload]);

  // Talente/Skills — schreibt direkt in profiles.skills (Sprint F.3C — einzige Wahrheitsquelle)
  // labels: string[] — z.B. ["Malerei", "Fotografie"]
  // Debounced reload: mehrere schnelle Toggle-Klicks = nur ein reload am Ende
  const _skillsReloadTimer = React.useRef(null);
  const handleSkillsChange = useCallback(async (labels) => {
    if (!user?.id) return;
    // Optimistisches Update — sofort sichtbar ohne Warten auf reload
    // (Profile-Objekt im Hook wird beim reload() aktualisiert)
    const { error } = await supabase.from("profiles")
      .update({ skills: labels, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) { console.error("handleSkillsChange:", error.message); return; }
    // Reload debounced: 400ms nach letztem Toggle
    clearTimeout(_skillsReloadTimer.current);
    _skillsReloadTimer.current = setTimeout(() => reload(), 400);
  }, [user?.id, reload]);

  // Sichtbarkeit — schreibt direkt in profiles.focus_type (Sprint F.9G.1)
  const handleVisibilityChange = useCallback(async (visibility) => {
    if (!user?.id) return;
    const { error } = await supabase.from("profiles")
      .update({ focus_type: visibility, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) { console.error("handleVisibilityChange:", error.message); return; }
    reload();
  }, [user?.id, reload]);

  return (
    <div className="tpp-root" style={{
      position:"fixed", inset:0, zIndex:9500, /* <BottomNav(10000) — Basis-Root der Seite, siehe PROFIL-NAV-FIX 2026-07-05 */
      display:"flex", flexDirection:"column",
      opacity:mounted?1:0,
      transform:mounted?"none":"translateY(14px)",
      transition:"opacity .35s ease, transform .35s cubic-bezier(.22,1,.36,1)",
    }}>
      <style>{CSS}</style>

      {/* ── Sticky Header (unverändert) ──────────────────────── */}
      <Header onBack={handleBack} isOwner={isOwner} onSettings={() => setShowSettings(true)}/>

      {/* ── Scrollable Content ───────────────────────────────── */}
      <div className="tpp-scroll" style={{
        flex:1, overflowY:"auto", touchAction:"pan-y",
        paddingBottom:"max(40px,calc(28px + env(safe-area-inset-bottom,0px)))",
      }}>

        {/* ── 1. ProfileHeader (Sprint B) ───────────────────── */}
        <ProfileHeader
          profile={profile}
          isOwner={isOwner}
          isTalent={profile?.is_talent === true}
          loading={loading}
          followCounts={followCounts}
          onEditAvatar={handleAvatarChange}
          onEditCover={handleCoverChange}
        />

        {profileId && <OrbSignatur profileId={profileId} />}

        {/* ── 2. Action Buttons — nur Besucher ─────────────── */}
        {!isOwner && (
          <div style={{padding:`0 ${T.px}px`}}>
            <ActionButtons
              profile={profile}
              currentUserId={user?.id}
              loading={loading}
              onOpenChat={handleOpenChat}
              onOpenKompass={({ isWatching: iw, toggleWatch: tw }) => {
                setKompassWatchLocal(iw);
                kompassToggleRef.current = tw;
                setShowKompassSheet(true);
              }}
            />
          </div>
        )}
        <Gap h={20}/>

        {/* ── 3. Schwerpunkt + Stats (unverändert) ─────────── */}
        <SchwerpunktStatsBlock
          profile={profile} works={works} experiences={experiences}
          moments={moments} loading={loading} followCounts={followCounts}
        />
        <Gap h={28}/>

        {/* ── 5. Nächste Erlebnisse (unverändert) ──────────── */}
        <NaechsteErlebnisseSection experiences={experiences} loading={loading}/>
        <Gap h={28}/>
        {/* ── 7. Talente & Angebote → TalentSection ────────── */}
        <TalentSection
          profile={profile}
          isOwner={isOwner}
          loading={loading}
          onChange={handleSkillsChange}
        />
        <Gap h={28}/>

        {/* ── 8. Werke → WorksSection ──────────────────────── */}
        <WorksSection
          works={works}
          profile={profile}
          isOwner={isOwner}
          loading={loading}
          onShowAll={() => {}}
        />
        <Gap h={28}/>

        {/* ── 9. Erlebnisse → ExperiencesSection ───────────── */}
        <ExperiencesSection
          experiences={experiences}
          isOwner={isOwner}
          loading={loading}
          onShowAll={() => {}}
        />
        <Gap h={28}/>

        {/* ── 10. Kundenstimmen → RecommendationsSection ───── */}
        <RecommendationsSection
          recommendations={recommendations}
          isOwner={isOwner}
          loading={loading}
          onShowAll={() => {}}
        />
        <Gap h={28}/>

        {/* ── 11. Verfügbarkeit → AvailabilitySection ──────── */}
        <AvailabilitySection
          profile={profile}
          isOwner={isOwner}
          loading={loading}
          onSave={handleAvailabilityChange}
        />
        <Gap h={12}/>

        {/* ── 12. Standort → LocationSection ───────────────── */}
        <LocationSection
          profile={profile}
          isOwner={isOwner}
          loading={loading}
          onSave={handleLocationChange}
        />
        <Gap h={12}/>

        {/* ── 13. Sichtbarkeit → VisibilitySection ─────────── */}
        <VisibilitySection
          profile={profile}
          isOwner={isOwner}
          loading={loading}
          onSave={handleVisibilityChange}
        />
        <Gap h={24}/>

        {/* ── 14. Momente → MomentsSection (Sprint C) ──────── */}
        <MomentsSection
          moments={moments}
          isOwner={isOwner}
          loading={loading}
        />
        <Gap h={24}/>

        {/* ── 15. Social Context Bar (unverändert) ─────────── */}
        <SocialContextBarTalent
          followCounts={followCounts}
          experiences={experiences}
          moments={moments}
          loading={loading}
        />
        <Gap h={24}/>

        {/* ── 16. Abschluss — nur Besucher ─────────────────── */}
        {!isOwner && (
          <>
            <AbschlussBar profile={profile} loading={loading}/>
            <Gap h={16}/>
            <AbschlussButtons profile={profile} currentUserId={user?.id} onOpenChat={handleOpenChat}/>
          </>
        )}
        <Gap h={40}/>
      </div>

      {/* ── Kompass Sheet ────────────────────────────────────── */}
      {showKompassSheet && (
        <KompassActionSheet
          profile={profile}
          isWatching={kompassWatchLocal}
          onWatch={kompassToggleRef.current}
          onClose={() => setShowKompassSheet(false)}
        />
      )}

      {/* ── Owner Modals ─────────────────────────────────────── */}
      {isOwner && showSettings && (
        <SettingsModal
          profile={profile}
          onClose={() => setShowSettings(false)}
          onSave={(updated) => {
            reload();
            setShowSettings(false);
          }}
        />
      )}
      {isOwner && showStudio && (
        <HuiStudio
          profile={profile}
          onClose={() => setShowStudio(false)}
        />
      )}
    </div>
  );
}
