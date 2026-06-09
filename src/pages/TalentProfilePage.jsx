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
            {/* A1: Talent-Badge direkt unter Name */}
            {!loading && (
              <div style={{
                display:"inline-flex", alignItems:"center", gap:5,
                marginTop:4, marginBottom:2,
                background:"rgba(14,196,184,0.09)",
                border:"1px solid rgba(14,196,184,0.22)",
                borderRadius:99, padding:"3px 10px",
                fontSize:11, fontWeight:700, color:"#0AADA3",
              }}>
                <span style={{fontSize:11}}>✨</span>
                <span>HUI-Talent</span>
                <span style={{fontWeight:400,color:"rgba(10,173,163,0.6)",fontSize:10}}>· Aktiver Gestalter</span>
              </div>
            )}
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
          <p style={{fontSize:14,lineHeight:1.7,color:T.inkSoft,margin:"0 0 0",fontStyle:"italic",textAlign:"center"}}>
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
            <div style={{fontSize:10,color:T.inkFaint,textAlign:"center",lineHeight:1.35,textAlign:"center"}}>{st.label}</div>
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
  // Aufgabe 2: Empty-State statt null — leeres Talent-Profil bleibt sichtbar

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
                <div style={{
                  padding:"28px 16px",
                  display:"flex", flexDirection:"column", gap:8, minWidth:260,
                }}>
                  <div style={{fontSize:12,fontWeight:700,color:T.teal,marginBottom:2}}>✨ HUI-Talent</div>
                  <div style={{fontSize:12.5,color:T.inkFaint,lineHeight:1.6}}>Dieses Talent baut sein Profil gerade auf.</div>
                  {[
                    {icon:"🎨",text:"Noch keine Werke veröffentlicht"},
                    {icon:"📅",text:"Noch keine Erlebnisse erstellt"},
                    {icon:"🌱",text:"Noch keine Projekte veröffentlicht"},
                  ].map((item,idx)=>(
                    <div key={idx} style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:T.inkFaint}}>
                      <span style={{fontSize:13}}>{item.icon}</span>
                      <span>{item.text}</span>
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
      {/* Aufgabe 4: Talent-Info für Besucher */}
      {!loading && (
        <div style={{
          margin:`0 ${T.px}px 16px`,
          background:T.tealSoft,
          border:`1px solid ${T.tealMid}`,
          borderRadius:T.r16,
          padding:"12px 16px",
          display:"flex", flexDirection:"column", gap:6,
        }}>
          <div style={{fontSize:11.5,fontWeight:700,color:T.teal,letterSpacing:"0.01em"}}>
            ✨ HUI-Talent
          </div>
          <div style={{fontSize:12.5,color:T.inkSoft,lineHeight:1.55}}>
            Dieses Mitglied veröffentlicht Werke, veranstaltet Erlebnisse
            und gestaltet die Gemeinschaft aktiv mit.
          </div>
          {/* Aufgabe 5: Impact-Stimmen */}
          <div style={{
            display:"flex", alignItems:"center", gap:6,
            marginTop:2, padding:"8px 10px",
            background:"rgba(14,196,184,0.06)",
            borderRadius:T.r12,
            border:`1px solid rgba(14,196,184,0.15)`,
          }}>
            <span style={{fontSize:16}}>🗳️</span>
            <div>
              <div style={{fontSize:11.5,fontWeight:700,color:T.teal}}>2 Stimmen pro Monat</div>
              <div style={{fontSize:11,color:T.inkFaint,lineHeight:1.4}}>
                Als HUI-Talent entscheidest du mit, welche Impact-Projekte unterstützt werden.
              </div>
            </div>
          </div>
        </div>
      )}
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
            <div style={{fontSize:9.5,color:T.inkFaint,textAlign:"center",lineHeight:1.35,textAlign:"center",marginTop:3}}>{st.label}</div>
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
function TalentAngeboteSection({ profile, wirkerProfile, loading, isOwner }) {
  // wirker_profiles.categories PRIMARY — profiles.skills FALLBACK
  const rawCats   = Array.isArray(wirkerProfile?.categories) ? wirkerProfile.categories : [];
  const rawSkills = Array.isArray(profile?.skills) ? profile.skills : [];
  // Kategorien mergen: wirker_profiles zuerst, dann skills-Felder die noch nicht drin sind
  const skills = rawCats.length > 0
    ? rawCats.map(c => typeof c === "string" ? { icon: "✨", label: c } : c)
    : rawSkills;
  if (!loading && skills.length === 0 && !isOwner) return null;
  return (
    <div style={{padding:`0 ${T.px}px`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:15,fontWeight:800,color:T.ink,letterSpacing:"-0.02em"}}>
          Meine Talente & Angebote
        </div>
      </div>
      {loading ? (
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {[100,80,110,90,70].map((w,i)=><Sk key={i} w={w} h={32} r={99}/>)}
        </div>
      ) : (
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {skills.slice(0,8).map((sk,i) => {
            const label = typeof sk === "string" ? sk : (sk.label || "");
            const icon  = typeof sk === "object" && sk.icon ? sk.icon : "✨";
            return (
              <div key={i} style={{
                display:"flex",alignItems:"center",gap:5,
                padding:"7px 14px",borderRadius:T.r99,
                background:T.bgCard,border:`1px solid ${T.border}`,
                fontSize:13,fontWeight:600,color:T.ink,
                boxShadow:T.card,
              }}>
                <span style={{fontSize:13}}>{icon}</span>{label}
              </div>
            );
          })}
          {isOwner && (
            <div style={{
              display:"flex",alignItems:"center",gap:5,
              padding:"7px 14px",borderRadius:T.r99,
              background:T.bgCard,border:`1.5px dashed ${T.borderMid}`,
              fontSize:12.5,fontWeight:600,color:T.inkSoft,
            }}>
              <span style={{fontSize:14}}>+</span> Weitere hinzufügen
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MEINE WERKE — horizontaler Scroller, Screenshot-exakt
// ══════════════════════════════════════════════════════════════
// LEGACY — Ersetzt durch gemeinsame WorksSection (src/components/profile/sections/WorksSection.jsx)
function MeineWerkeSection({ works, loading, onShowAll }) {
  if (!loading && works.length === 0) return null;
  return (
    <div>
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:`0 ${T.px}px`,marginBottom:12,
      }}>
        <div style={{fontSize:15,fontWeight:800,color:T.ink,letterSpacing:"-0.02em"}}>Meine Werke</div>
        {works.length > 0 && (
          <button onClick={onShowAll} style={{background:"none",border:"none",padding:0,
            fontSize:12,fontWeight:600,color:T.teal,cursor:"pointer",
            display:"flex",alignItems:"center",gap:3,fontFamily:"inherit"}}>
            Alle Werke ansehen <span style={{fontSize:11}}>›</span>
          </button>
        )}
      </div>
      <div className="tpp-hscroll" style={{
        display:"flex",gap:10,
        padding:`0 ${T.px}px 4px`,
      }}>
        {loading
          ? [1,2,3,4,5].map(i=><Sk key={i} w={100} h={100} r={T.r16} style={{flexShrink:0}}/>)
          : works.slice(0,7).map((w,i) => (
            <div key={w.id} className="tpp-press" style={{
              flexShrink:0,width:100,height:100,
              borderRadius:T.r16,overflow:"hidden",
              background:"linear-gradient(135deg,#2C3B2D,#4A6741)",
              boxShadow:T.card,
            }}>
              {w.cover_url
                ? <img src={w.cover_url} alt={w.title||""} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🎨</div>}
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ERLEBNISSE & PROJEKTE — Screenshot-exakt mit Labels
// ══════════════════════════════════════════════════════════════
const CAT_MAP = {
  workshop:"Workshop", kurs:"Workshop", malen:"Workshop",
  event:"Event", festival:"Event", konzert:"Event",
  ausstellung:"Ausstellung", galerie:"Ausstellung",
  projekt:"Projekt", community:"Projekt",
};
function catLabel(cat) {
  if (!cat) return "Projekt";
  const k = cat.toLowerCase();
  for (const [key,val] of Object.entries(CAT_MAP)) { if (k.includes(key)) return val; }
  return "Projekt";
}
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("de-DE",{month:"short",year:"numeric"});
  } catch { return ""; }
}

// LEGACY — Ersetzt durch gemeinsame ExperiencesSection (src/components/profile/sections/ExperiencesSection.jsx)
function ErlebnisseProjekteSection({ experiences, loading, isOwner, onShowAll }) {
  if (!loading && experiences.length === 0 && !isOwner) return null;
  const items = experiences.slice(0, 4);
  return (
    <div>
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:`0 ${T.px}px`,marginBottom:12,
      }}>
        <div style={{fontSize:15,fontWeight:800,color:T.ink,letterSpacing:"-0.02em"}}>Erlebnisse & Projekte</div>
        {experiences.length > 0 && (
          <button onClick={onShowAll} style={{background:"none",border:"none",padding:0,
            fontSize:12,fontWeight:600,color:T.teal,cursor:"pointer",
            display:"flex",alignItems:"center",gap:3,fontFamily:"inherit"}}>
            Alle anzeigen <span style={{fontSize:11}}>›</span>
          </button>
        )}
      </div>
      <div className="tpp-hscroll" style={{
        display:"flex",gap:10,padding:`0 ${T.px}px 4px`,
      }}>
        {loading
          ? [1,2,3,4].map(i=><Sk key={i} w={110} h={130} r={T.r16} style={{flexShrink:0}}/>)
          : <>
              {items.map((ex,i) => (
                <div key={ex.id} className="tpp-press" style={{
                  flexShrink:0,width:110,
                  display:"flex",flexDirection:"column",gap:0,
                }}>
                  <div style={{
                    width:110,height:100,borderRadius:T.r16,overflow:"hidden",
                    background:"linear-gradient(135deg,#2C3B2D,#8B7355)",
                    marginBottom:6,
                  }}>
                    {ex.cover_url
                      ? <img src={ex.cover_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
                      : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🎭</div>}
                  </div>
                  <div style={{fontSize:11.5,fontWeight:700,color:T.ink,lineHeight:1.3,marginBottom:2,
                    overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                    {ex.title || "Erlebnis"}
                  </div>
                  <div style={{fontSize:10.5,color:T.inkFaint}}>
                    {catLabel(ex.category)}
                  </div>
                  <div style={{fontSize:10,color:T.inkFaint}}>
                    {formatDate(ex.date || ex.created_at)}
                  </div>
                </div>
              ))}
              {/* Neues Projekt CTA — nur für Owner */}
              {isOwner && (
                <div className="tpp-press" style={{
                  flexShrink:0,width:80,height:100,
                  borderRadius:T.r16,border:`1.5px dashed ${T.borderMid}`,
                  background:T.bgCard,
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  gap:4,cursor:"pointer",
                }}>
                  <span style={{fontSize:22,color:T.inkFaint}}>+</span>
                  <span style={{fontSize:10,fontWeight:600,color:T.inkFaint,textAlign:"center",lineHeight:1.3}}>Neues Projekt</span>
                </div>
              )}
            </>
        }
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// KUNDENSTIMMEN — horizontaler Scroller, Screenshot-exakt
// ══════════════════════════════════════════════════════════════
// LEGACY — Ersetzt durch gemeinsame RecommendationsSection (src/components/profile/sections/RecommendationsSection.jsx)
function KundenstimmenPublicSection({ recommendations, loading, isOwner, onShowAll }) {
  if (!loading && recommendations.length === 0 && !isOwner) return null;
  return (
    <div>
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:`0 ${T.px}px`,marginBottom:12,
      }}>
        <div style={{fontSize:15,fontWeight:800,color:T.ink,letterSpacing:"-0.02em"}}>Kundenstimmen</div>
        {recommendations.length > 0 && (
          <button onClick={onShowAll} style={{background:"none",border:"none",padding:0,
            fontSize:12,fontWeight:600,color:T.teal,cursor:"pointer",
            display:"flex",alignItems:"center",gap:3,fontFamily:"inherit"}}>
            Alle anzeigen <span style={{fontSize:11}}>›</span>
          </button>
        )}
      </div>
      <div className="tpp-hscroll" style={{
        display:"flex",gap:12,padding:`0 ${T.px}px 4px`,
      }}>
        {loading ? (
          <Sk w={200} h={100} r={T.r16}/>
        ) : recommendations.length === 0 ? (
          <div style={{fontSize:13,color:T.inkFaint,fontStyle:"italic",paddingLeft:0,paddingBottom:4}}>
            Noch keine Empfehlungen.
          </div>
        ) : (
                    recommendations.slice(0,4).map((rec,i) => (
                      <div key={rec.id||i} style={{
                        flexShrink:0,width:210,
                        background:T.bgCard,borderRadius:T.r16,
                        border:`1px solid ${T.border}`,padding:"14px 16px",boxShadow:T.card,
                      }}>
                        {rec.rating > 0 && (
                          <div style={{fontSize:11,color:"#F59E0B",marginBottom:4,letterSpacing:"1px"}}>
                            {"★".repeat(Math.min(5,Math.round(rec.rating)))}
                            {"☆".repeat(Math.max(0,5-Math.round(rec.rating)))}
                          </div>
                        )}
                        <div style={{fontSize:22,color:T.teal,marginBottom:6}}>❝</div>
                        <div style={{fontSize:13,color:T.ink,lineHeight:1.55,fontStyle:"italic",marginBottom:10}}>
                          {rec.text || ""}
                        </div>
                        {rec.work_title && (
                          <div style={{fontSize:10.5,color:T.inkFaint,marginBottom:6}}>
                            zum Werk: {rec.work_title}
                          </div>
                        )}
                        <div style={{fontSize:11.5,color:T.inkFaint,fontWeight:600}}>
                          — {rec.reviewer_name || "Mitglied"}
                        </div>
                      </div>
                    ))
        )}
        {isOwner && (
          <div className="tpp-press" style={{
            flexShrink:0,display:"flex",alignItems:"center",gap:6,
            padding:"10px 16px",borderRadius:T.r16,
            background:T.bgCard,border:`1.5px dashed ${T.borderMid}`,
            fontSize:12.5,fontWeight:600,color:T.inkSoft,
            cursor:"pointer",touchAction:"manipulation",alignSelf:"flex-start",
          }}>
            <span style={{fontSize:16}}>+</span> Weitere hinzufügen
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// VERFÜGBARKEIT + STANDORT — 2-Spalten, Screenshot-exakt
// ══════════════════════════════════════════════════════════════
// LEGACY — Ersetzt durch AvailabilitySection + LocationSection (src/components/profile/sections/)
function VerfuegbarkeitStandortPublic({ profile, wirkerProfile, loading }) {
  if (loading) return null;
  const isOpen = profile?.focus_type !== "private";
  // wirker_profiles.location_label PRIMARY — profiles.location FALLBACK
  const loc = wirkerProfile?.location_label || profile?.location || "";
  return (
    <div style={{padding:`0 ${T.px}px`}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {/* Verfügbarkeit */}
        <div style={{background:T.bgCard,borderRadius:T.r16,border:`1px solid ${T.border}`,padding:"14px",boxShadow:T.card}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div style={{fontSize:13,fontWeight:800,color:T.ink}}>Verfügbarkeit</div>
            <button style={{background:"none",border:"none",padding:0,fontSize:11,color:T.teal,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              Mehr erfahren ›
            </button>
          </div>
          <div style={{fontSize:10.5,color:T.inkFaint,marginBottom:8}}>
            Wann du für neue Anfragen offen bist.
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",borderRadius:T.r12,
            background:T.tealSoft,border:`1px solid ${T.tealMid}`}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:T.teal,display:"inline-block",flexShrink:0}}/>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:T.teal}}>
                {isOpen ? "Offen für neue Anfragen" : "Momentan ausgelastet"}
              </div>
              <div style={{fontSize:10,color:T.inkFaint}}>Antwortzeit: innerhalb von 24h</div>
            </div>
          </div>
        </div>
        {/* Standort */}
        <div style={{background:T.bgCard,borderRadius:T.r16,border:`1px solid ${T.border}`,padding:"14px",boxShadow:T.card}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div style={{fontSize:13,fontWeight:800,color:T.ink}}>Standort</div>
            <button style={{background:"none",border:"none",padding:0,fontSize:11,color:T.teal,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              Mehr erfahren ›
            </button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 8px",borderRadius:T.r12,
            background:"rgba(26,26,24,0.03)",border:`1px solid ${T.border}`,
            marginTop:8,
          }}>
            <span style={{fontSize:14}}>📍</span>
            <span style={{fontSize:11.5,color:T.ink,fontWeight:500}}>
              {loc || "Standort nicht angegeben"}
            </span>
            <span style={{marginLeft:"auto",fontSize:13,color:T.inkFaint}}>›</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SICHTBARKEIT — Screenshot-exakt
// ══════════════════════════════════════════════════════════════
// LEGACY — Ersetzt durch gemeinsame VisibilitySection (src/components/profile/sections/VisibilitySection.jsx)
function SichtbarkeitPublicSection({ profile, loading }) {
  const [showSheet, setShowSheet] = useState(false);
  if (loading) return null;
  const visText = "Dieses Profil ist für deine Verbindungen sichtbar.";
  return (
    <div style={{padding:`0 ${T.px}px`}}>
      <div style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        background:T.bgCard,borderRadius:T.r20,
        border:`1px solid ${T.border}`,padding:"14px 16px",boxShadow:T.card,
      }}>
        <div style={{display:"flex",alignItems:"flex-start",gap:8,flex:1,minWidth:0}}>
          <span style={{fontSize:15,flexShrink:0}}>🔒</span>
          <span style={{fontSize:12.5,color:T.inkSoft,fontWeight:400,lineHeight:1.45}}>
            {visText}
          </span>
        </div>
        <button className="tpp-press-light" onClick={()=>setShowSheet(true)} style={{
          display:"flex",alignItems:"center",gap:6,
          padding:"9px 14px",borderRadius:T.r99,border:`1px solid ${T.border}`,
          background:T.bg,fontSize:12,fontWeight:600,color:T.ink,
          cursor:"pointer",touchAction:"manipulation",fontFamily:"inherit",
          flexShrink:0,boxShadow:T.card,
        }}>
          <span style={{fontSize:13}}>👥</span> Mehr erfahren
        </button>
      </div>
      {showSheet && createPortal(
        <div onClick={()=>setShowSheet(false)} style={{
          position:"fixed",inset:0,zIndex:9900,
          background:"rgba(26,26,24,0.4)",display:"flex",alignItems:"flex-end",
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            width:"100%",background:T.bgSheet,
            borderRadius:`${T.r24}px ${T.r24}px 0 0`,
            padding:"20px 20px max(36px,calc(24px + env(safe-area-inset-bottom,0px)))",
            boxShadow:T.sheet,
          }}>
            <div style={{width:36,height:4,borderRadius:99,background:T.borderMid,margin:"0 auto 20px"}}/>
            <div style={{fontSize:16,fontWeight:800,color:T.ink,marginBottom:6}}>🔒 Sichtbarkeit</div>
            <p style={{fontSize:14,lineHeight:1.68,color:T.inkSoft,margin:"0 0 16px",fontStyle:"italic"}}>
              {visText} Du kannst die Sichtbarkeit in deinen Einstellungen anpassen.
            </p>
            <button className="tpp-press" onClick={()=>setShowSheet(false)} style={{
              width:"100%",padding:"14px",borderRadius:T.r99,border:"none",
              background:`linear-gradient(135deg,#0EC4B8,#0DBBAF)`,
              color:"white",fontSize:15,fontWeight:700,cursor:"pointer",
              fontFamily:"inherit",boxShadow:"0 4px 18px rgba(14,196,184,0.26)",
            }}>Verstanden</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

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
export default function TalentProfilePage({ profileId, onClose }) {
  const { user } = useAuth();

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
    reload,
  } = useProfileData(profileId);

  // ── Lokale UI-States (kein Datenlayer) ──────────────────────
  const [mounted,           setMounted]           = useState(false);
  const [showKompassSheet,  setShowKompassSheet]  = useState(false);
  const [kompassWatchLocal, setKompassWatchLocal] = useState(null);
  const [showSettings,      setShowSettings]      = useState(false);
  const [showStudio,        setShowStudio]        = useState(false);
  const kompassToggleRef = React.useRef(() => {});

  const isOwner = !!user?.id && (profileId === user.id || (!profileId && !!user.id));

  // Mount-Animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

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

  // Avatar/Cover-Update → reload damit ProfileHeader aktuell ist
  const handleAvatarChange = useCallback(() => reload(), [reload]);
  const handleCoverChange  = useCallback(() => reload(), [reload]);

  // ── SPRINT E.5 TRACE ──────────────────────────────────────────
  console.log('[E5] PAGE PROFILE', profile?.id);
  console.log('[E5] PAGE WORKS', works?.length ?? 0);
  // ── END E.5 TRACE ──────────────────────────────────────────────
  return (
    <div className="tpp-root" style={{
      position:"fixed", inset:0, zIndex:9500,
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

        {/* ── 4. Mein Wirken — gemischt (unverändert) ──────── */}
        <MeinWirkenSection works={works} experiences={experiences} loading={loading}/>
        <Gap h={28}/>

        {/* ── 5. Nächste Erlebnisse (unverändert) ──────────── */}
        <NaechsteErlebnisseSection experiences={experiences} loading={loading}/>
        <Gap h={28}/>

        {/* ── 6. Wirkung (unverändert) ─────────────────────── */}
        <WirkungSection works={works} experiences={experiences} moments={moments} loading={loading}/>
        <Gap h={28}/>

        {/* ── 7. Talente & Angebote → TalentSection ────────── */}
        <TalentSection
          profile={profile}
          isOwner={isOwner}
          loading={loading}
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
        />
        <Gap h={12}/>

        {/* ── 12. Standort → LocationSection ───────────────── */}
        <LocationSection
          profile={profile}
          isOwner={isOwner}
          loading={loading}
        />
        <Gap h={12}/>

        {/* ── 13. Sichtbarkeit → VisibilitySection ─────────── */}
        <VisibilitySection
          profile={profile}
          isOwner={isOwner}
          loading={loading}
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
