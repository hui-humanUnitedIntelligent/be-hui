// src/pages/MyBasisProfile.jsx — HUI Mein Profil v1
// "Ich gestalte meine Präsenz."
// ════════════════════════════════════════════════════════════════
// Eigene Profil-Seite für Basis-User. Kein Creator-Dashboard.
// Alles inline-editierbar. Ruhig. Emotional. Human.
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient.js";
import {
  FB_AVATAR,
  handleAvatarUpload, handleCoverUpload,
} from "../lib/profileMedia.js";
import { NAV_RESERVED_HEIGHT_CSS } from "../components/home/navigation/navigationGeometry.js";
import { useAuth }   from "../lib/AuthContext.jsx";
import { useHome }   from "../components/home/HomeShell.jsx";
const GemeinschaftsFlow = React.lazy(() => import("../components/GemeinschaftsFlow.jsx"));
const NotificationPanel = React.lazy(() => import("../components/notifications/NotificationPanel.jsx"));
import AmbassadorModal from "../components/ambassador/AmbassadorModal.jsx";
import SettingsModal  from "../components/settings/SettingsModal.jsx";
import { useAmbassador } from "../hooks/useAmbassador.js";
import { useProfileData } from "../hooks/useProfileData.js";
const HuiStudio              = React.lazy(() => import("../components/studio/HuiStudio.jsx"));
const MeineResonanz           = React.lazy(() => import("./studio/MeineResonanz.jsx"));
import PublicProfilePreview   from "../components/profile/PublicProfilePreview.jsx";
import { OrbSignatur }        from "../components/profile/OrbSignatur.jsx";
import MerkenSection          from "../components/profile/MerkenSection.jsx";
// Sprint F.7D Phase 4: Kanonische Sections
import { AboutSection }          from "../components/profile/sections/AboutSection.jsx";
import { ProfileHeader as CanonicalProfileHeader } from "../components/profile/ProfileHeader.jsx";
import { TalentSection }         from "../components/profile/sections/TalentSection.jsx";
import { MomentsSection }        from "../components/profile/sections/MomentsSection.jsx";
import { RecommendationsSection } from "../components/profile/sections/RecommendationsSection.jsx";
import { AvailabilitySection }   from "../components/profile/sections/AvailabilitySection.jsx";
import { LocationSection }       from "../components/profile/sections/LocationSection.jsx";
import { VisibilitySection }     from "../components/profile/sections/VisibilitySection.jsx";
const WerkWizard      = React.lazy(() => import("../components/works/WerkWizard.jsx"));
const TalentAngebotWizard = React.lazy(() => import("../components/talents/TalentAngebotWizard.jsx"));
import { useTalents, deleteTalent } from "../hooks/useTalents.js";
const ExperienceWizard = React.lazy(() => import("../components/experiences/ExperienceWizard.jsx"));
const AmbassadorStudioSection = React.lazy(() => import("../components/ambassador/AmbassadorStudioSection.jsx"));
const HuiMomentSheet = React.lazy(() => import("../components/HuiMomentSheet.jsx"));
const MyRecommendationsModal   = React.lazy(() => import("../components/studio/MyRecommendationsModal.jsx"));
const ImpactStimmenModal       = React.lazy(() => import("../components/studio/ImpactStimmenModal.jsx"));
const MeineProjekteModal       = React.lazy(() => import("../components/studio/MeineProjekteModal.jsx"));
const ImpactUpdateSheet       = React.lazy(() => import("../components/studio/ImpactUpdateSheet.jsx"));
const EinAusgabenModal         = React.lazy(() => import("../components/studio/EinAusgabenModal.jsx"));
const MeineVerkaeufeModal      = React.lazy(() => import("../components/studio/MeineVerkaeufeModal.jsx"));
const MeineBuchungenModal      = React.lazy(() => import("../components/studio/MeineBuchungenModal.jsx"));
const StatistikenModal         = React.lazy(() => import("../components/studio/StatistikenModal.jsx"));
import ProfilBearbeitenModal    from "../components/studio/ProfilBearbeitenModal.jsx";
import { HUIBookmarkIcon }      from "../design/icons/HuiInteractionIcons.jsx";
import {
  HUIResonanzIcon, HUITalentIcon, HUIWerkeIcon, HUIErlebnisIcon,
  HUIAmbassadorIcon, HUIEmpfehlungIcon, HUIImpactIcon, HUIFinanzIcon,
  HUIStimmeIcon, HUIProjektIcon, HUIEinAusIcon, HUIKalenderIcon,
  HUIVerkaufIcon, HUIStatistikIcon,
  HUIFotoIcon, HUIAnsichtIcon, HUISettingsIcon, HUISchreibenIcon,
} from "../design/icons/HuiSystemIcons.jsx";
import { NotificationBadge }    from "../lib/useNotifications.jsx";
import { useSavedPostsContext }  from "../context/SavedPostsContext.jsx";
import { useContentPreview } from "../context/ContentPreviewContext.jsx";

// ── Design Tokens ────────────────────────────────────────────────
const T = {
  bg:       "#F9F7F4",
  bgCard:   "#FFFFFF",
  bgSheet:  "rgba(252,251,248,0.98)",
  teal:     "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.22)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.28)",
  border:   "rgba(26,26,24,0.08)",
  borderMid:"rgba(26,26,24,0.14)",
  px:       20,
  r12:12, r16:16, r20:20, r24:24, r99:99,
  card:     "0 1px 8px rgba(26,26,24,0.07), 0 1px 2px rgba(26,26,24,0.04)",
  glowTeal: "0 4px 18px rgba(14,196,184,0.26)",
  sheet:    "0 -10px 40px rgba(26,26,24,0.10)",
};

// ── CSS ──────────────────────────────────────────────────────────
const CSS = `
  .mbp-root { background:#F9F7F4; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif; color:${T.ink}; }
  .mbp-scroll { overflow-y:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .mbp-scroll::-webkit-scrollbar { display:none; }
  .mbp-hscroll { overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .mbp-hscroll::-webkit-scrollbar { display:none; }

  @keyframes mbp-fade-up  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes mbp-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes mbp-shimmer  { from{background-position:-200% 0} to{background-position:200% 0} }

  .mbp-skeleton {
    background:linear-gradient(90deg,rgba(26,26,24,.05) 25%,rgba(26,26,24,.09) 50%,rgba(26,26,24,.05) 75%);
    background-size:200% 100%; animation:mbp-shimmer 1.4s ease-in-out infinite; border-radius:8px;
  }
  .mbp-press  { transition:transform .12s cubic-bezier(.22,1,.36,1),opacity .12s ease; }
  .mbp-press:active  { transform:scale(0.93); opacity:0.74; }
  .mbp-press-light { transition:transform .14s ease,opacity .14s ease; }
  .mbp-press-light:active { transform:scale(0.96); opacity:0.82; }
  .mbp-in { animation:mbp-fade-up .45s ease both; }
  .mbp-sheet { animation:mbp-slide-up .28s cubic-bezier(.22,1,.36,1) both; }
  .mbp-file-input { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; z-index:10; }
  @keyframes mbp-upload-spin { to{transform:rotate(360deg)} }
  .mbp-uploading { animation:mbp-upload-spin .7s linear infinite; display:inline-block; }
`;

const s = (v, fb="") => (v && typeof v==="string" ? v.trim() : fb);
const a = (v) => Array.isArray(v) ? v : [];

// ── Fallbacks ─────────────────────────────────────────────────
const FB_COVER = "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80";
const FB_AVT = FB_AVATAR; // Alias fuer FB_AVATAR aus profileMedia.js

// MOMENT_SEEDS entfernt — keine Placeholder-Bilder mehr

const ALL_INTERESTS = [
  { icon:"🌿", label:"Natur"       },
  { icon:"🎵", label:"Musik"       },
  { icon:"☕", label:"Begegnungen" },
  { icon:"🧘", label:"Ruhe"        },
  { icon:"🐾", label:"Tiere"       },
  { icon:"✨", label:"Kreativität" },
  { icon:"📖", label:"Lesen"       },
  { icon:"🌍", label:"Reisen"      },
  { icon:"🎨", label:"Kunst"       },
  { icon:"🤝", label:"Gemeinschaft"},
];

const OPEN_FOR_ALL = [
  { icon:"🌲", label:"Naturgruppen"    },
  { icon:"🎵", label:"Musikabende"     },
  { icon:"☕", label:"Café & Gespräche"},
  { icon:"🧘", label:"Achtsamkeit"     },
  { icon:"🎨", label:"Kreativ-Abende"  },
  { icon:"🐾", label:"Tier-Spaziergänge"},
];

const VISIBILITY_OPTIONS = [
  { key:"public",      icon:"🌍", label:"Öffentlich",    sub:"Für alle sichtbar" },
  { key:"connections", icon:"👥", label:"Verbindungen",  sub:"Nur für deine Verbindungen" },
  { key:"private",     icon:"🔒", label:"Privat",        sub:"Nur für dich" },
];

// ── Atoms ────────────────────────────────────────────────────────
function Gap({ h=16 }) { return <div style={{height:h}}/>; }
function Divider() { return <div style={{height:1,background:T.border,margin:`0 ${T.px}px`}}/>; }

function SectionRow({ title, sub, onEdit }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:`0 ${T.px}px 10px` }}>
      <div>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, letterSpacing:"-0.02em" }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:T.inkFaint, marginTop:2, fontWeight:400 }}>{sub}</div>}
      </div>
      {onEdit && (
        <button className="mbp-press-light" onClick={onEdit} style={{
          background:"none", border:"none", padding:0,
          fontSize:12, color:T.teal, fontWeight:700,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          display:"flex", alignItems:"center", gap:3,
        }}>Bearbeiten ›</button>
      )}
    </div>
  );
}

function Sheet({ onClose, children, zIndex=9800 }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex,
      background:"rgba(26,26,24,0.4)",
      display:"flex", alignItems:"flex-end",
    }}>
      <div className="mbp-sheet" onClick={e=>e.stopPropagation()} style={{
        width:"100%", background:T.bgSheet,
        borderRadius:`${T.r24}px ${T.r24}px 0 0`,
        padding:"20px 20px max(36px,calc(24px + env(safe-area-inset-bottom,0px)))",
        boxShadow:T.sheet, maxHeight:"80vh", overflowY:"auto",
      }}>
        <div style={{width:36,height:4,borderRadius:99,background:T.borderMid,margin:"0 auto 20px"}}/>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// HEADER — "Mein Profil 🌿" + cinematic cover + floating avatar
// ══════════════════════════════════════════════════════════════
// ── Upload Helper ────────────────────────────────────────────────
// uploadProfileImage(), FB_COVER, FB_AVATAR, handleAvatarUpload, handleCoverUpload aus ../lib/profileMedia.js


// ══════════════════════════════════════════════════════════════
// ÜBER DICH — Inline text editor with char counter
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// INTERESSEN & WERTE — Tappable pills + edit sheet
// ══════════════════════════════════════════════════════════════
function InterestPill({ icon, label, active, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"9px 16px", borderRadius:T.r99,
      background: active ? T.tealSoft : T.bgCard,
      border:`1px solid ${active ? T.tealMid : T.border}`,
      fontSize:13.5, fontWeight:600,
      color: active ? T.teal : T.ink,
      cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
      transition:"all .18s cubic-bezier(.22,1,.36,1)",
      boxShadow: active ? T.glowTeal : T.card,
    }}>
      <span style={{fontSize:15}}>{icon}</span>{label}
    </button>
  );
}

function InteressenSection({ interests, onChange }) {
  const [showEdit, setShowEdit] = useState(false);
  const current = a(interests);

  const toggle = (label) => {
    if (current.includes(label)) onChange(current.filter(x=>x!==label));
    else onChange([...current, label]);
  };

  const displayTags = current.length
    ? ALL_INTERESTS.filter(t=>current.includes(t.label))
    : ALL_INTERESTS.slice(0,6);

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Interessen & Werte" onEdit={()=>setShowEdit(true)}/>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {displayTags.map((t,i)=>(
          <div key={i} className="mbp-in" style={{ display:"inline-flex", alignItems:"center", gap:6,
            padding:"9px 16px", borderRadius:T.r99,
            background:T.bgCard, border:`1px solid ${T.border}`,
            fontSize:13.5, fontWeight:600, color:T.ink,
            boxShadow:T.card }}>
            <span style={{fontSize:15}}>{t.icon}</span>{t.label}
          </div>
        ))}
      </div>

      {showEdit && (
        <Sheet onClose={()=>setShowEdit(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:4 }}>Interessen & Werte</div>
          <div style={{ fontSize:12, color:T.inkFaint, marginBottom:16 }}>Wähle, was dich bewegt.</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {ALL_INTERESTS.map((t,i)=>(
              <InterestPill key={i} icon={t.icon} label={t.label}
                active={current.includes(t.label)}
                onToggle={()=>toggle(t.label)}/>
            ))}
          </div>
          <button className="mbp-press" onClick={()=>setShowEdit(false)} style={{
            width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
            background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
            color:"white", fontSize:15, fontWeight:700,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:T.glowTeal,
          }}>Fertig</button>
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MOMENTE — Editable cinematic thumbnails
// ══════════════════════════════════════════════════════════════

function MomentThumb({ m, onRemove }) {
  const [loaded,  setLoaded]  = useState(false);
  const [broken,  setBroken]  = useState(false);
  return (
    <div style={{ position:"relative", width:116, height:116, borderRadius:T.r12,
      overflow:"hidden", background:"rgba(26,26,24,0.07)", flexShrink:0 }}>
      {!loaded && !broken && <div className="mbp-skeleton" style={{position:"absolute",inset:0}}/>}
      {broken ? (
        /* Broken-State: graue Box, isoliert — andere Momente unberührt */
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          background:"rgba(26,26,24,0.06)", gap:4 }}>
          <HUIFotoIcon size={22} style={{color:"rgba(26,26,24,0.35)"}} />
          <span style={{fontSize:9, color:"rgba(26,26,24,0.35)", textAlign:"center",
            padding:"0 6px", lineHeight:1.4}}>Bild nicht verfügbar</span>
        </div>
      ) : (
        <img loading="lazy" decoding="async" src={m.img} alt="" onLoad={()=>setLoaded(true)} onError={()=>{ setLoaded(true); setBroken(true); }}
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
            opacity:loaded?1:0, transition:"opacity .5s ease" }}/>
      )}
      {/* × remove */}
      <button className="mbp-press" onClick={onRemove} style={{
        position:"absolute", top:5, right:5,
        width:20, height:20, borderRadius:"50%",
        background:"rgba(26,26,24,0.65)", backdropFilter:"blur(6px)",
        border:"none", color:"white", fontSize:11,
        display:"flex", alignItems:"center", justifyContent:"center",
        cursor:"pointer", touchAction:"manipulation", lineHeight:1,
      }}>×</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// OFFEN FÜR BEGEGNUNGEN — Editable open-for capsules
// ══════════════════════════════════════════════════════════════
function OffenFuerSection({ openFor, onChange }) {
  const [showEdit, setShowEdit] = useState(false);
  const current = a(openFor);
  const display = current.length ? OPEN_FOR_ALL.filter(t=>current.includes(t.label)) : OPEN_FOR_ALL.slice(0,4);

  const toggle = (label) => {
    if (current.includes(label)) onChange(current.filter(x=>x!==label));
    else onChange([...current, label]);
  };

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Offen für Begegnungen" sub="Wofür bist du offen? Was interessiert dich?"/>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {display.map((t,i)=>(
          <div key={i} style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"9px 16px", borderRadius:T.r99,
            background:T.bgCard, border:`1px solid ${T.border}`,
            fontSize:13, fontWeight:600, color:T.ink,
            boxShadow:T.card,
          }}>
            <span style={{fontSize:14}}>{t.icon}</span>{t.label}
          </div>
        ))}
        <button className="mbp-press-light" onClick={()=>setShowEdit(true)} style={{
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"9px 16px", borderRadius:T.r99,
          background:"transparent", border:`1px dashed ${T.borderMid}`,
          fontSize:13, fontWeight:600, color:T.inkSoft,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        }}>
          <span style={{fontSize:14}}>+</span> Weiteres hinzufügen
        </button>
      </div>

      {showEdit && (
        <Sheet onClose={()=>setShowEdit(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, marginBottom:4 }}>Offen für Begegnungen</div>
          <div style={{ fontSize:12, color:T.inkFaint, marginBottom:16 }}>Was interessiert dich gerade?</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {OPEN_FOR_ALL.map((t,i)=>(
              <InterestPill key={i} icon={t.icon} label={t.label}
                active={current.includes(t.label)}
                onToggle={()=>toggle(t.label)}/>
            ))}
          </div>
          <button className="mbp-press" onClick={()=>setShowEdit(false)} style={{
            width:"100%", padding:"14px", borderRadius:T.r99, border:"none",
            background:`linear-gradient(135deg,${T.teal},#0DBBAF)`,
            color:"white", fontSize:15, fontWeight:700,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
            boxShadow:T.glowTeal,
          }}>Fertig</button>
        </Sheet>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SICHTBARKEIT — 3-option toggle
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// BIO EDIT MODAL — "Über mich" bearbeiten
// ══════════════════════════════════════════════════════════════
const MAX_BIO = 500;

export default function MyBasisProfile({ onClose, profileId }) {
  const navigate = useNavigate();
  // AuthContext: eigenen Profile-Cache nach Uploads aktualisieren
  const _auth = useAuth() || {};
  const user            = _auth.user   ?? null;          // Sprint F.7D: user für useProfileData
  const setAuthProfile  = _auth.setProfile ?? null;
  const refreshProfile  = _auth.refreshProfile ?? null;
  // Sprint F.7D: profile + loading aus useProfileData — lokale States entfernt
  const [bio,        setBio]        = useState("");

  const [interests,  setInterests]  = useState([]);
  const [openFor,    setOpenFor]    = useState([]);
  const [moments,    setMoments]    = useState([]);
  const [visibility, setVisibility] = useState("connections"); // lokal — kein DB-Write
  const [saving,     setSaving]     = useState(false);
  const [saveOk,     setSaveOk]     = useState(false);
  const [saveErrMsg, setSaveErrMsg] = useState("");
  // Lokale URL-Overrides für sofortige UI-Aktualisierung nach Upload
  const [localAvatar, setLocalAvatar] = useState(null);
  const [localCover,  setLocalCover]  = useState(null);
  const [showGemeinschaft, setShowGemeinschaft] = useState(false);
  const [showAmbModal,    setShowAmbModal]    = useState(false);
  const [showAmbDrawer,   setShowAmbDrawer]   = useState(false);
  const [showMomentSheet, setShowMomentSheet]  = useState(false);
  const [showPublicPreview, setShowPublicPreview] = useState(false);
  const [showMerken,       setShowMerken]       = useState(false);
  // MERKEN.3 (2026-07-08): Live-Zaehler fuer den Merken-Badge im Header.
  // Einzige Stelle im Baum, die useSavedPosts() aufruft (siehe
  // MerkenSection.jsx-Kommentar) -- count kommt direkt aus saved_posts,
  // keine zweite Berechnung/Query.
  const { count: savedCount } = useSavedPostsContext();
  const [showSettings,    setShowSettings]    = useState(false);
  const [showStudio,        setShowStudio]        = useState(false);
  const [showResonanz,      setShowResonanz]      = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // ── Notification Action Routing ───────────────────────────────────────────
  const {
    openProfileById   = () => {},
    switchTab         = () => {},
    setChatRecipient  = () => {},
    setShowChat       = () => {},
    setShowWerkDetail = () => {},
    setShowTalentFlow = () => {},
  } = useHome?.() || {};
  const { openRef } = useContentPreview();

  const handleNotifAction = (n) => {
    // 1. action_url hat Vorrang
    if (n.action_url) {
      setShowNotifications(false);
      // Intern-Routing via Typ trotzdem ausführen für nahtlose UX
    }
    const meta = n.metadata || {};
    const targetId = meta.target_id || meta.actor_id || n.actor_id || null;
    const werkId   = meta.werk_id   || null;

    setShowNotifications(false); // Panel schließen

    switch (n.type) {
      // ── Profil öffnen ───────────────────────────────────────────────────
      case "follow":
      case "follow_request":
      case "new_follower":
        if (targetId) openProfileById(targetId);
        break;

      // ── Chat öffnen ─────────────────────────────────────────────────────
      case "begegnung":
      case "buchung":
      case "booking":
      case "message":
      case "new_message":
        if (targetId) { setChatRecipient(targetId); setShowChat(true); }
        break;

      // ── Tab-Navigation ──────────────────────────────────────────────────
      case "impact":
      case "project_update":
      case "impact_update":
        switchTab("impact");
        break;

      case "community":
      case "community_update":
        switchTab("discover");
        break;

      case "inspiration":
      case "discover":
        switchTab("discover");
        break;

      // ── Werk-Detail öffnen ──────────────────────────────────────────────
      case "work_approved":
        if (werkId) setShowWerkDetail(werkId);
        break;

      // ── Kommentar/Antwort: oeffnet den kommentierten Beitrag in der
      //    bestehenden Preview/Fullscreen-Infrastruktur (KOMMENTAR.1) ───────
      case "comment":
      case "comment_reply": {
        const cmMeta = n.metadata || {};
        if (cmMeta.post_id && cmMeta.post_type) openRef({ type: cmMeta.post_type, id: cmMeta.post_id });
        break;
      }

      // ── Werk abgelehnt: Modal wird in NotifCard selbst geöffnet ─────────
      case "work_rejected":
      case "content_rejected":
        // Handled by NotifCard → RejectionModal (kein weiteres Routing nötig)
        break;

      // ── Admin / System: Detailansicht ───────────────────────────────────
      case "admin":
      case "admin_broadcast":
      case "system":
      case "info":
        // Kein spezifisches Routing — Panel bleibt offen für Lesbarkeit
        break;

      default:
        // Unbekannter Typ — nichts tun, Panel wurde bereits geschlossen
        break;
    }
  };
  const [unreadCount,       setUnreadCount]       = useState(0);
  // ── Sprint F.7D: Einheitliche Datenpipeline via useProfileData ──────────
  // Ersetzt: eigenen Profil-Loader useEffect (Zeilen ~962-1003)
  // Beibehaltung: Realtime-Listener für works+experiences (Regel 1)
  const {
    profile,
    works:           hooksWorks,
    experiences:     hooksExps,
    recommendations: hooksRecs,
    moments:         hooksMoments,
    loading:         hookLoading,
    reload,
    followCounts,
  } = useProfileData(user?.id);

  // F.9C HOTFIX: lokale Aliase erst NACH useProfileData — TDZ-Fix
  // (hooksWorks/hooksExps/hooksRecs/profile sind jetzt deklariert)
  const ambState = useAmbassador(profile);
  const [localWorks,       setLocalWorks]       = useState(null);
  const [localExperiences, setLocalExperiences] = useState(null);
  const works          = localWorks       ?? hooksWorks ?? [];
  const experiences    = localExperiences ?? hooksExps  ?? [];
  const recommendations = hooksRecs ?? [];
  const [showWerkWizard, setShowWerkWizard] = useState(false);
  const [showExpWizard,  setShowExpWizard]  = useState(false);
  const [editingWerk,   setEditingWerk]   = useState(null);
  const [editingExp,    setEditingExp]    = useState(null);
  const [showTalentWizard, setShowTalentWizard] = useState(false);
  const [showTalentOnboarding, setShowTalentOnboarding] = useState(false);
  const [editingTalent,    setEditingTalent]    = useState(null);
  const { talents, reload: reloadTalents } = useTalents(profile?.id);


  // Sprint F.7D: Profil-Loader entfernt — useProfileData(user?.id) übernimmt
  // Alte lokale States (profile, loading) werden durch Hook-Werte ersetzt (Phase 2)
  // dna_tags → hooksMoments bereits normalisiert durch useProfileData
  // skills → profile.skills direkt aus useProfileData
  // is_available → profile.is_available direkt aus useProfileData

  // ── Sprint F.7D: Realtime-Listener (Regel 1: beibehalten, nutzt reload()) ──
  // loadWorksAndExps() entfernt — useProfileData lädt works+experiences
  // reload() triggert useProfileData neu → Realtime-Events bleiben wirksam
  useEffect(() => {
    if (!profile?.id) return;
    let channel;
    let createdHere = false;

    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    const topic = "mbp:works-exps:" + profile.id;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    if (existing) {
      channel = existing;
    } else {
      // Realtime: wenn Admin Status ändert → useProfileData neu laden
      channel = supabase
        .channel(topic)
        .on("postgres_changes", {
          event: "UPDATE", schema: "public", table: "works",
          filter: "user_id=eq." + profile.id,
        }, () => reload())
        .on("postgres_changes", {
          event: "UPDATE", schema: "public", table: "experiences",
          filter: "user_id=eq." + profile.id,
        }, () => reload())
        // Admin Hard-Delete → sofort neu laden
        .on("postgres_changes", {
          event: "DELETE", schema: "public", table: "experiences",
        }, () => reload())
        .on("postgres_changes", {
          event: "DELETE", schema: "public", table: "projects",
        }, () => reload())
        .subscribe();
      createdHere = true;
    }

    return () => { if (createdHere && channel) supabase.removeChannel(channel); };
  }, [profile?.id, reload]);

  // Auto-save on bio/interests/visibility change (debounced 1.2s)
  // ── Sprint F.7D Phase 3: Explizite Save-Handler (autoSave entfernt) ─────
  const saveTimer = useRef(null);

  // Gemeinsame Save-Funktion (intern, kein Debounce)
  const _save = useCallback(async (fields) => {
    const uid = profile?.id ?? user?.id;
    if (!uid) return;
    setSaving(true);
    try {
      const { error: saveErr } = await supabase.from("profiles")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", uid);
      if (saveErr) {
        setSaveErrMsg(Object.keys(fields).join(",") + ": " + saveErr.message);
        setTimeout(() => setSaveErrMsg(""), 8000);
      } else {
        setSaveOk(true); setTimeout(() => setSaveOk(false), 2000);
        setAuthProfile(prev => prev ? { ...prev, ...fields } : prev);
        reload();
      }
    } catch (e) {
      console.error("SAVE ERROR:", e?.message);
    }
    setSaving(false);
  }, [profile?.id, user?.id, setAuthProfile, reload]);

  const handleBioSave = useCallback((v) => {
    setBio(v);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => _save({ bio: v }), 1200);
  }, [_save]);

  // Alias für inline onChange (debounced)
  const handleBioChange = handleBioSave;

  const handleSkillsSave = useCallback((v) => {
    setInterests(v);
    _save({ skills: v });
  }, [_save]);
  const handleInterestsChange = handleSkillsSave; // Alias

  const handleMomentsSave = useCallback((newItems) => {
    setMoments(newItems);
    const urls = newItems.map(m => m.img).filter(Boolean);
    _save({ dna_tags: urls });
  }, [_save]);
  const handleMomentsChange = handleMomentsSave; // Alias

  const handleVisibilitySave = useCallback((v) => {
    setVisibility(v);
    _save({ focus_type: v });
  }, [_save]);
  const handleVisibilityChange = handleVisibilitySave; // Alias

  const handleAvailabilitySave = useCallback((v) => {
    setOpenFor(v);
    // v.length > 0 = verfügbar (true), [] = ausgelastet (false)
    _save({ is_available: v.length > 0 });
  }, [_save]);
  const handleOpenForChange = handleAvailabilitySave; // Alias

  const handleLocationSave = useCallback((locationStr) => {
    _save({ location: locationStr });
  }, [_save]);

  // Sofortige lokale Anzeige + globaler AuthContext-Update nach Upload
  const handleAvatarChange = useCallback((url) => {
    // Sofort lokalen State setzen — bleibt persistent bis Seitenwechsel
    setLocalAvatar(url);
    setAuthProfile(prev => prev ? { ...prev, avatar_url: url } : prev);
    // Cache wurde bereits in profileMedia.js invalidiert → reload holt frische DB-Daten
    // KEIN reload() hier — localAvatar reicht für sofortige Anzeige
    // reload() würde unnötig re-render triggern bevor DB geschrieben hat
  }, [setAuthProfile]);

  const handleCoverChange = useCallback((url) => {
    // Sofort lokalen State setzen — bleibt persistent bis Seitenwechsel
    setLocalCover(url);
    setAuthProfile(prev => prev ? { ...prev, header_img: url } : prev);
    // KEIN reload() — localCover reicht für sofortige Anzeige
  }, [setAuthProfile]);

  // CSS sofort in <head> injizieren — Safari-safe, kein Blink beim Lazy-Load
  useEffect(() => {
    const id = "__mbp_styles__";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = CSS;
      document.head.appendChild(el);
    }
    return () => {
      // Style bleibt — kein Flicker bei re-mount
    };
  }, []);


  // Sofort sichtbarer Spinner während Profil lädt — kein weißer Screen
  if (hookLoading) {
    return (
      <div style={{
        position:"fixed", top:0, left:0, right:0,
        bottom:"calc(72px + env(safe-area-inset-bottom, 0px))",
        zIndex:9500, /* <BottomNav(10000) — Root endet vor Navbar */
        background:T.bg,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        <div style={{
          width:36, height:36, borderRadius:"50%",
          border:"3px solid rgba(14,196,184,0.15)",
          borderTop:"3px solid #0EC4B8",
          animation:"spin .8s linear infinite",
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="mbp-root" style={{
      position:"fixed", top:0, left:0, right:0,
      bottom:"calc(72px + env(safe-area-inset-bottom, 0px))",
      zIndex:9500, /* <BottomNav(10000) — Root endet vor Navbar */
      display:"flex", flexDirection:"column",
    }}>

      
{/* styles via head-inject — siehe useEffect */}

      {/* Save-Error-Toast */}
      {saveErrMsg ? (
        <div style={{
          position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
          zIndex:9999, padding:"10px 18px", borderRadius:99,
          background:"rgba(200,40,40,0.95)", color:"white",
          fontSize:12, fontWeight:700, maxWidth:"88vw",
          boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
          textAlign:"center", lineHeight:1.5,
        }}>
          ⚠️ Speicher-Fehler: {saveErrMsg}
        </div>
      ) : null}

      {/* Save indicator */}
      {(saving || saveOk) && (
        <div style={{
          position:"fixed", top:16, right:16, zIndex:9900,
          padding:"6px 14px", borderRadius:T.r99,
          background: saveOk ? T.tealSoft : "rgba(26,26,24,0.07)",
          border:`1px solid ${saveOk ? T.tealMid : T.border}`,
          fontSize:11.5, fontWeight:600,
          color: saveOk ? T.teal : T.inkFaint,
          backdropFilter:"blur(2px)",
          transition:"all .2s ease",
        }}>
          {saveOk ? "✓ Gespeichert" : "Speichert…"}
        </div>
      )}

      {/* ── SEITEN-TITEL — AUSSERHALB scroll (kein touch-offset Bug) ── */}
      <div style={{
        padding:`max(14px,calc(10px + env(safe-area-inset-top,0px))) ${T.px}px 10px`,
        display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        flexShrink:0,
        position:"relative", zIndex:2,   /* über mbp-scroll (overflow=auto erzeugt Stacking Context) */
      }}>
        <div>
          <div style={{ fontSize:24, fontWeight:900, color:T.ink, letterSpacing:"-0.04em",
            lineHeight:1.15 }}>
            {profile?.is_talent ? "Mein Talent-Profil ✨" : "Mein Profil 🌿"}
          </div>
          <div style={{ fontSize:12, color:T.inkFaint, marginTop:2, fontWeight:400 }}>
            {profile?.is_talent
              ? "Gestalte dein Talent-Profil, wie es dich und dein Wirken zeigt."
              : "Gestalte dein Profil so, wie du bist."}
          </div>
        </div>
        {/* Header-Buttons: Icon-Only — Bookmark 👁️ ⚙️ */}
        <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
          <button
            className="mbp-press-light"
            onClick={() => { setShowPublicPreview(false); setShowSettings(false); setShowMerken(true); }}
            title="Gemerkt"
            aria-label={savedCount > 0 ? `Gemerkt, ${savedCount} gespeicherte Inhalte` : "Gemerkt"}
            style={{
              width:34, height:34, borderRadius:"50%",
              background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:T.ink, cursor:"pointer", touchAction:"manipulation", flexShrink:0,
              position:"relative",
            }}
          >
            <HUIBookmarkIcon size={18} />
            <NotificationBadge count={savedCount} />
          </button>
          <button
            className="mbp-press-light"
            onClick={() => { setShowMerken(false); setShowSettings(false); setShowPublicPreview(true); }}
            title="Profil ansehen"
            aria-label="Profil ansehen"
            style={{
              width:34, height:34, borderRadius:"50%",
              background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, cursor:"pointer", touchAction:"manipulation", flexShrink:0,
            }}
          ><HUIAnsichtIcon size={16}/></button>
          <button
            className="mbp-press-light"
            onClick={() => { setShowMerken(false); setShowPublicPreview(false); setShowSettings(true); }}
            title="Einstellungen"
            aria-label="Einstellungen"
            style={{
              width:34, height:34, borderRadius:"50%",
              background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, cursor:"pointer", touchAction:"manipulation", flexShrink:0,
            }}
          ><HUISettingsIcon size={16}/></button>
        </div>
      </div>

      <div className="mbp-scroll" style={{ flex:1, overflowY:"auto",
        paddingBottom: NAV_RESERVED_HEIGHT_CSS }}>

        {/* ── HEADER — Cover + Avatar + Name ───────────────── */}
        <CanonicalProfileHeader
          profile={{
            ...profile,
            avatar_url: localAvatar || profile?.avatar_url,
            header_img: localCover  || profile?.header_img,
          }}
          isOwner={true}
          isTalent={!!profile?.is_talent}
          loading={hookLoading}
          followCounts={followCounts}
          onEditAvatar={handleAvatarChange}
          onEditCover={handleCoverChange}
        />
        {(profile?.id ?? user?.id) && (
          <OrbSignatur profileId={profile?.id ?? user?.id} />
        )}
        <Gap h={28}/>

        {/* Meine Resonanz — verschoben in "Mein Bereich"-Menü, 2026-07-06 */}

        {/* ══ TALENT-PROFIL-LAYOUT (is_talent === true) ══════════ */}
        {profile?.is_talent ? (
          <>
            {/* T1. Über mich — kanonisch: AboutSection */}
            <AboutSection
              profile={profile}
              isOwner={true}
              onSave={(bio) => handleBioSave(bio)}
            />
            <Gap h={24}/>

            {/* T2. Talente (TalentSection, Skill-Tag-Pillen "Meine Talente & Angebote")
                — auf Nutzerwunsch (2026-07-05) im eigenen Dashboard ausgeblendet, wird
                nicht benoetigt. Bewusst NICHT geloescht (nur auskommentiert) fuer den
                Fall einer spaeteren Reaktivierung/Verschmelzung mit TalentAngeboteSection
                (siehe Memory #528 "vertagt"). Bleibt auf TalentProfilePage.jsx bestehen,
                dort nicht Teil dieser Anfrage. */}
            {/*
            <TalentSection
              profile={profile}
              isOwner={true}
              onChange={handleSkillsSave}
            />
            <Gap h={24}/>
            */}

            {/* T2b-T4 + Ambassador/Empfehlungen/Impact/Finanzen — PROFIL-DRAWER-REDESIGN-003
                (2026-07-06): zusammengefasst in die "Mein Bereich"-Menü-Karte
                (MeinBereichMenu). Jede Kachel oeffnet die jeweilige Section/Modal
                als Bottom-Sheet-Drawer statt permanent inline zu rendern. */}
            <MeinBereichMenu
              profile={profile}
              isTalent={true}
              talents={talents}
              works={works}
              experiences={experiences}
              onTalentWizard={(t) => { setEditingTalent(t || null); setShowTalentWizard(true); }}
              onDeleteTalent={() => reloadTalents()}
              onWerkWizard={(w) => { setEditingWerk(w || null); setShowWerkWizard(true); }}
              onDeleteWerk={(id) => { setLocalWorks(null); reload(); }}
              onErlebnisWizard={(exp) => { setEditingExp(exp || null); setShowExpWizard(true); }}
              onDeleteErlebnis={(id) => { setLocalExperiences(null); reload(); }}
              onOpenResonanz={() => setShowResonanz(true)}
              onOpenMomentSheet={() => {
                close(); // Drawer zuerst schließen
                setTimeout(() => setShowMomentSheet(true), 80); // dann Sheet öffnen
              }}
              onProfileUpdate={(upd) => {
                setAuthProfile && setAuthProfile(p => ({ ...p, ...upd }));
                refreshProfile?.().catch(() => {});
                reload();
              }}
            />
            <Gap h={20}/>

            {/* T5. Kundenstimmen — kanonisch: RecommendationsSection */}
            <RecommendationsSection
              recommendations={recommendations}
              isOwner={true}
            />
            <Gap h={24}/>

            {/* T6a. Verfügbarkeit — kanonisch: AvailabilitySection */}
            <AvailabilitySection
              profile={profile}
              isOwner={true}
              onSave={handleAvailabilitySave}
            />
            <Gap h={16}/>

            {/* T6b. Standort — kanonisch: LocationSection */}
            <LocationSection
              profile={profile}
              isOwner={true}
              onSave={handleLocationSave}
            />
            <Gap h={24}/>

            {/* T7. Sichtbarkeit — kanonisch: VisibilitySection */}
            <VisibilitySection
              profile={profile}
              isOwner={true}
              onSave={handleVisibilitySave}
            />
            <Gap h={28}/>

            {/* T8. Ambassador-Balken — nur sichtbar wenn is_ambassador=true */}
            <AmbassadorBanner
              profile={profile}
              ambState={ambState}
              onPress={() => setShowAmbDrawer(true)}
            />
            <Gap h={40}/>
          </>
        ) : (
          <>
            {/* ══ BASIS-PROFIL-LAYOUT ══════════════════════════════ */}
            {/* B1. Über mich — kanonisch: AboutSection */}
            <AboutSection
              profile={profile}
              isOwner={true}
              onSave={(bio) => handleBioSave(bio)}
            />
            <Gap h={24}/>

            {/* B1c. TALENT WERDEN — Einladungskarte für Basis-User */}
            {!profile?.is_talent && (
              <TalentWerdenBanner onStart={() => setShowTalentOnboarding(true)} />
            )}
            <Gap h={20}/>

            {/* B1b. Mein Bereich — PROFIL-DRAWER-REDESIGN-003 (2026-07-06):
                Basis-Profil zeigt nur die universellen Kacheln (kein Talent-Bereich). */}
            <MeinBereichMenu
              profile={profile}
              isTalent={false}
              talents={talents}
              works={works}
              experiences={experiences}
              onTalentWizard={(t) => { setEditingTalent(t || null); setShowTalentWizard(true); }}
              onDeleteTalent={() => reloadTalents()}
              onWerkWizard={(w) => { setEditingWerk(w || null); setShowWerkWizard(true); }}
              onDeleteWerk={(id) => { setLocalWorks(null); reload(); }}
              onErlebnisWizard={(exp) => { setEditingExp(exp || null); setShowExpWizard(true); }}
              onDeleteErlebnis={(id) => { setLocalExperiences(null); reload(); }}
              onOpenResonanz={() => setShowResonanz(true)}
              onOpenMomentSheet={() => {
                close(); // Drawer zuerst schließen
                setTimeout(() => setShowMomentSheet(true), 80); // dann Sheet öffnen
              }}
              onProfileUpdate={(upd) => {
                setAuthProfile && setAuthProfile(p => ({ ...p, ...upd }));
                refreshProfile?.().catch(() => {});
                reload();
              }}
            />
            <Gap h={20}/>

            {/* B2. Interessen & Werte — InteressenSection bleibt (Basis-spezifisch) */}
            <InteressenSection interests={interests} onChange={handleInterestsChange}/>
            <Gap h={24}/>

            {/* B3. Momente — kanonisch: MomentsSection */}
            <MomentsSection
              moments={moments}
              isOwner={true}
              onAddMoment={(newMoments) => handleMomentsSave(newMoments)}
            />
            <Gap h={24}/>

            {/* B4. Offen für Begegnungen — OffenFuerSection bleibt (Basis-spezifisch) */}
            <OffenFuerSection openFor={openFor} onChange={handleOpenForChange}/>
            <Gap h={24}/>

            {/* B5. Sichtbarkeit — kanonisch: VisibilitySection */}
            <VisibilitySection
              profile={profile}
              isOwner={true}
              onSave={handleVisibilitySave}
            />
            <Gap h={28}/>

            {/* B6. Ambassador-Balken — nur sichtbar wenn is_ambassador=true */}
            <AmbassadorBanner
              profile={profile}
              ambState={ambState}
              onPress={() => setShowAmbDrawer(true)}
            />
            <Gap h={40}/>
          </>
        )}
      </div>

      {/* PROFIL-NAV-BACKDROP entfernt (2026-07-05): Die Einzel-Loesung hier
          wurde durch einen zentralen Fix in der einzigen geteilten
          HUIBottomNavigation-Komponente ersetzt (siehe dort "NAV-BACKDROP"),
          der jetzt automatisch auf ALLEN vier Tabs (Entdecken/Home/Impact/
          Profil) gleichzeitig greift -- keine Duplikat-Loesung pro Seite
          mehr noetig. */}

      {/* MEINE MOMENTE SHEET — createPortal direkt zu body, zIndex 11000 (über Drawer 10500) */}
      {showMomentSheet && createPortal(
        <React.Suspense fallback={null}>
          <HuiMomentSheet
            visible={showMomentSheet}
            onClose={() => setShowMomentSheet(false)}
            visibilityScope="public"
          />
        </React.Suspense>,
        document.body
      )}

      {/* AMBASSADOR-DRAWER — createPortal(body), zIndex:10500 */}
      {showAmbDrawer && createPortal(
        <div style={{
          position:"fixed", inset:0, zIndex:10500,
          display:"flex", flexDirection:"column", justifyContent:"flex-end",
        }}>
          {/* Backdrop */}
          <div onClick={() => setShowAmbDrawer(false)} style={{
            position:"absolute", inset:0,
            background:"rgba(26,26,24,0.55)", backdropFilter:"blur(2px)",
          }}/>
          {/* Sheet */}
          <div style={{
            position:"relative", zIndex:1,
            background:"#F7F5F0", borderRadius:"20px 20px 0 0",
            maxHeight:"88dvh", overflowY:"auto",
            paddingBottom:"calc(16px + env(safe-area-inset-bottom,0px))",
          }}>
            {/* Handle */}
            <div style={{ display:"flex", justifyContent:"center", paddingTop:12, marginBottom:4 }}>
              <div style={{ width:38, height:4, borderRadius:2, background:"rgba(26,26,24,0.15)" }}/>
            </div>
            {/* Header */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"8px 20px 14px",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <HUIAmbassadorIcon size={18} style={{color:"rgba(255,193,7,0.9)"}}/>
                <span style={{ fontSize:16, fontWeight:800, color:"#1A1A18" }}>Ambassador-Bereich</span>
              </div>
              <button onClick={() => setShowAmbDrawer(false)} style={{
                background:"none", border:"none", cursor:"pointer",
                fontSize:18, color:"rgba(26,26,24,0.45)", padding:4,
                fontFamily:"inherit",
              }}>✕</button>
            </div>
            {/* Suspense nur um die lazy Komponente — NICHT um das Portal */}
            <React.Suspense fallback={
              <div style={{ padding:"32px 20px", textAlign:"center", color:"rgba(26,26,24,0.4)", fontSize:13 }}>
                Lädt...
              </div>
            }>
              <AmbassadorStudioSection profile={profile} />
            </React.Suspense>
          </div>
        </div>,
        document.body
      )}

      {/* GEMEINSCHAFT FLOW MODAL */}
      {showGemeinschaft && (
              <React.Suspense fallback={null}>
        <GemeinschaftsFlow
          onClose={() => setShowGemeinschaft(false)}
          onComplete={() => {
            setShowGemeinschaft(false);
            // Sprint F.7D P2: reload() übernimmt is_talent-Aktualisierung
            refreshProfile?.().catch(() => {});
            reload();
          }}
        />
              </React.Suspense>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <SettingsModal
          profile={profile}
          onClose={() => setShowSettings(false)}
          onProfileUpdate={(updated) => {
            refreshProfile?.().catch(() => {});
          }}
          onEditProfile={() => {
            setShowSettings(false);
            // Öffne Profil-Editor falls vorhanden
            if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hui:openEditor"));
          }}
          onOpenBookings={() => {
            setShowSettings(false);
            if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hui:openBookings"));
          }}
        />
      )}

      {/* GEMERKTE INHALTE — Portal pflicht (liegt sonst hinter BottomNav durch mbp-root Stacking Context) */}
      {showMerken && createPortal(
        <div style={{
          position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
          background:"#F9F7F4",
          overflowY:"auto",
          WebkitOverflowScrolling:"touch",
        }}>
          {/* Header */}
          <div style={{
            position:"sticky", top:0, zIndex:10510, /* >BottomNav(10000) */
            background:"rgba(249,247,244,0.95)",
            borderBottom:"1px solid rgba(26,26,46,0.07)",
            padding:"12px 16px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            backdropFilter:"blur(2px)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ display:"flex", color:"#1A1A2E" }}><HUIBookmarkIcon size={18} /></span>
              <span style={{ fontSize:15, fontWeight:800, color:"#1A1A2E", letterSpacing:"-0.02em" }}>
                Gemerkte Inhalte
              </span>
            </div>
            <button
              onClick={() => setShowMerken(false)}
              style={{
                padding:"6px 14px", borderRadius:20,
                background:"rgba(26,26,46,0.08)", border:"1px solid rgba(26,26,46,0.10)",
                fontSize:12, fontWeight:700, color:"rgba(26,26,46,0.55)",
                cursor:"pointer", touchAction:"manipulation",
              }}
            >✕ Schließen</button>
          </div>
          {/* Content */}
          <div style={{ padding:"16px" }}>
            <MerkenSection
              onOpenProfile={(id) => {
                setShowMerken(false);
                if (typeof window !== "undefined" && window.__HUI_OPEN_PROFILE__) {
                  window.__HUI_OPEN_PROFILE__(id);
                }
              }}
              onOpenDiscover={() => {
                setShowMerken(false);
                switchTab("discover");
              }}
            />
          </div>
        </div>,
        document.body
      )}

      {/* 👁️ ÖFFENTLICHE PROFILANSICHT */}
      {showPublicPreview && profile?.id && (
        <PublicProfilePreview
          profileId={profile.id}
          onClose={() => setShowPublicPreview(false)}
        />
      )}

      {/* HUI STUDIO MODAL */}
      {showStudio && (
              <React.Suspense fallback={null}>
        <HuiStudio
          profile={profile}
          onClose={() => setShowStudio(false)}
          onProfileUpdate={(upd) => {
            // Sprint F.7D P2: setProfile → reload()
            setAuthProfile && setAuthProfile(p => ({ ...p, ...upd }));
            refreshProfile?.().catch(() => {});
            reload();
          }}
        />
              </React.Suspense>
      )}

      {/* ❤️ MEINE RESONANZ */}
      {showResonanz && (
              <React.Suspense fallback={null}>
        <MeineResonanz
          onClose={() => setShowResonanz(false)}
          onNavigate={(type, navId) => {
            setShowResonanz(false);
          }}
        />
              </React.Suspense>
      )}

      {/* AMBASSADOR BEWERBUNGS-MODAL */}
      {showAmbModal && profile?.id && (
        <AmbassadorModal
          userId={profile.id}
          onClose={() => setShowAmbModal(false)}
          onSuccess={() => {
            setShowAmbModal(false);
            refreshProfile?.().catch(() => {});
          }}
        />
      )}

      {/* NOTIFICATION PANEL */}
      {showNotifications && profile?.id && (
              <React.Suspense fallback={null}>
        <NotificationPanel
          userId={profile.id}
          onClose={() => setShowNotifications(false)}
          onUnreadChange={setUnreadCount}
          onAction={handleNotifAction}
        />
              </React.Suspense>
      )}


      {/* WERK WIZARD */}
      {showWerkWizard && profile?.id && (
              <React.Suspense fallback={null}>
        <WerkWizard
          userId={profile.id}
          existingWork={editingWerk}
          onClose={() => { setShowWerkWizard(false); setEditingWerk(null); }}
          onSaved={(werk) => {
            setShowWerkWizard(false); setEditingWerk(null);
            setLocalWorks(prev => {
              const list = Array.isArray(prev) ? prev : (Array.isArray(hooksWorks) ? hooksWorks : []);
              const idx = list.findIndex(w => w.id === werk.id);
              if (idx >= 0) { const n=[...list]; n[idx]=werk; return n; }
              return [werk, ...list];
            });
          }}
        />
              </React.Suspense>
      )}

      {/* TALENT WERDEN — Onboarding Flow */}
      {showTalentOnboarding && (
        <TalentOnboardingModal
          onClose={() => setShowTalentOnboarding(false)}
          onSuccess={() => {
            setShowTalentOnboarding(false);
            reload();
            refreshProfile?.().catch(() => {});
          }}
        />
      )}

      {/* TALENT-ANGEBOT WIZARD */}
      {showTalentWizard && profile?.id && (
              <React.Suspense fallback={null}>
        <TalentAngebotWizard
          userId={profile.id}
          existingTalent={editingTalent}
          onClose={() => { setShowTalentWizard(false); setEditingTalent(null); }}
          onSaved={() => { setShowTalentWizard(false); setEditingTalent(null); reloadTalents(); }}
        />
              </React.Suspense>
      )}

      {/* EXPERIENCE WIZARD */}
      {showExpWizard && profile?.id && (
              <React.Suspense fallback={null}>
        <ExperienceWizard
          userId={profile.id}
          existingExp={editingExp}
          onClose={() => { setShowExpWizard(false); setEditingExp(null); }}
          onSaved={(exp) => {
            setShowExpWizard(false); setEditingExp(null);
            setLocalExperiences(prev => {
              const list = Array.isArray(prev) ? prev : (Array.isArray(hooksExps) ? hooksExps : []);
              const idx = list.findIndex(e => e.id === exp.id);
              if (idx >= 0) { const n=[...list]; n[idx]=exp; return n; }
              return [exp, ...list];
            });
          }}
        />
              </React.Suspense>
      )}
    </div>
  );
}



// ══════════════════════════════════════════════════════════════
// AMBASSADOR-PROFIL-SEKTION
// Zeigt Status, Einladungslink, Empfehlungen
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// MEIN MOMENTE DRAWER — Zeigt Momente-Grid + "Neuen Moment erstellen"
// Performance: lazy images, keine Off-Screen-Elemente, Viewport-only Render
// Rechte: alle Nutzer können Momente veröffentlichen
// ══════════════════════════════════════════════════════════════
function MeinMomenteDrawerContent({ profile, onOpenMomentSheet }) {
  const [moments, setMoments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [imgErrors, setImgErrors] = React.useState({});

  // Lade Momente des Users aus beitraege-Tabelle (type='moment')
  React.useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    setLoading(true);

    supabase
      .from("beitraege")
      .select("id, src, type, caption, created_at")
      .eq("user_id", profile.id)
      .eq("type", "moment")
      .order("created_at", { ascending: false })
      .limit(18)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setMoments(data);
        setLoading(false);
      });

    // Memory-Cleanup bei Unmount
    return () => { cancelled = true; };
  }, [profile?.id]);

  const handleImgError = React.useCallback((id) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  }, []);

  if (loading) {
    return (
      <div style={{ padding:"16px 20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:4 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{
              aspectRatio:"1", borderRadius:12,
              background:"linear-gradient(90deg,rgba(26,26,24,0.06) 25%,rgba(26,26,24,0.12) 50%,rgba(26,26,24,0.06) 75%)",
              backgroundSize:"200% 100%",
              animation:"mbp-shimmer 1.4s ease-in-out infinite",
            }}/>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding:"16px 20px", paddingBottom:"calc(24px + env(safe-area-inset-bottom,0px))" }}>
      {/* Header-Zeile mit Zähler und CTA */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        marginBottom:14,
      }}>
        <div style={{ fontSize:14, fontWeight:800, color:"#1A1A18", letterSpacing:"-0.01em" }}>
          Meine Momente
          {moments.length > 0 && (
            <span style={{ fontSize:12, fontWeight:600, color:"rgba(26,26,24,0.45)", marginLeft:6 }}>
              ({moments.length})
            </span>
          )}
        </div>
        <button
          onClick={onOpenMomentSheet}
          style={{
            padding:"8px 16px", borderRadius:99,
            background:"#0EC4B8", border:"none", color:"white",
            fontSize:12.5, fontWeight:700, cursor:"pointer",
            fontFamily:"inherit", touchAction:"manipulation",
            WebkitTapHighlightColor:"transparent",
          }}
        >
          + Neuer Moment
        </button>
      </div>

      {moments.length === 0 ? (
        /* Empty-State — kein Off-Screen-Content */
        <button
          onClick={onOpenMomentSheet}
          style={{
            width:"100%", padding:"28px 16px", borderRadius:16,
            background:"#FFFFFF", border:"1.5px dashed rgba(26,26,24,0.14)",
            display:"flex", flexDirection:"column", alignItems:"center", gap:8,
            cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          }}
        >
          <HUIFotoIcon size={28} style={{color:"rgba(14,196,184,0.5)"}} />
          <div style={{ fontSize:14, fontWeight:700, color:"#1A1A18" }}>
            Ersten Moment teilen
          </div>
          <div style={{ fontSize:12, color:"rgba(26,26,24,0.45)" }}>
            Fotos, Gedanken oder Videos
          </div>
        </button>
      ) : (
        /* Grid — nur Bilder laden (lazy), 3-spaltig */
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:4 }}>
          {moments.map((m, i) => (
            <div key={m.id || i} style={{
              aspectRatio:"1", borderRadius:12, overflow:"hidden",
              background:"rgba(26,26,24,0.06)", position:"relative",
            }}>
              {m.src && !imgErrors[m.id] ? (
                <img
                  loading="lazy"
                  decoding="async"
                  src={m.src}
                  alt=""
                  onError={() => handleImgError(m.id)}
                  style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                />
              ) : (
                <div style={{
                  width:"100%", height:"100%",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <HUIFotoIcon size={18} style={{color:"rgba(14,196,184,0.4)"}} />
                </div>
              )}
            </div>
          ))}
          {/* Hinzufügen-Kachel — performance-safe */}
          <button
            onClick={onOpenMomentSheet}
            style={{
              aspectRatio:"1", borderRadius:12,
              background:"#FFFFFF", border:"1.5px dashed rgba(26,26,24,0.14)",
              display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:4, cursor:"pointer",
              touchAction:"manipulation",
            }}
          >
            <span style={{ fontSize:20, color:"rgba(26,26,24,0.45)" }}>+</span>
          </button>
        </div>
      )}
    </div>
  );
}

function AmbassadorProfilSection({ profile, ambState, onApply }) {
  const T2 = {
    teal:"#0EC4B8", tealSoft:"rgba(14,196,184,0.08)",
    tealMid:"rgba(14,196,184,0.2)", ink:"#1A1A18",
    inkSoft:"#555552", inkFaint:"#888885",
    bgCard:"#FFFFFF", border:"rgba(26,26,24,0.09)",
    r16:"12px", r12:"10px", r99:"99px", card:"0 1px 4px rgba(0,0,0,0.06)",
  };

  const isAmb      = profile?.is_ambassador === true;
  const status     = ambState?.applicationStatus;
  const hasPending = status === 'offen' || status === 'pending';
  const isRejected = status === 'abgelehnt' || status === 'rejected';
  const ref_link   = profile?.profile_modules?.ambassador?.referral_link || null;
  const ref_code   = profile?.profile_modules?.ambassador?.referral_code || null;
  const refCount   = profile?.profile_modules?.ambassador?.referral_count || 0;

  function copyLink() {
    if (ref_link) {
      navigator.clipboard.writeText(ref_link).catch(() => {});
    }
  }

  // RECHTE-LOGIK: Kein Ambassador → nichts anzeigen
  // Ambassador-Rechte werden ausschließlich durch SADB vergeben (kein Self-Signup)
  if (!isAmb) return null;

  // Aktiver Ambassador: Dashboard

  return (
    <div style={{ padding:"0 20px" }}>
      {/* Status-Badge */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <SectionRow title="Ambassador" />
        <div style={{
          display:"inline-flex", alignItems:"center", gap:5,
          background:"rgba(14,196,184,0.08)", borderRadius:T2.r99,
          border:`1px solid ${T2.tealMid}`, padding:"3px 10px",
          fontSize:11, fontWeight:700, color:T2.teal,
        }}>
          ✅ Aktiv
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:10, marginBottom:14,
      }}>
        {[
          { emoji:"👥", label:"Eingeladene", value: refCount },
          { emoji:"🥉", label:"Level", value: refCount >= 201 ? "Platin" : refCount >= 51 ? "Gold" : refCount >= 11 ? "Silber" : "Bronze" },
        ].map(({ emoji, label, value }) => (
          <div key={label} style={{
            background:T2.bgCard, borderRadius:T2.r12,
            border:`1px solid ${T2.border}`, padding:"12px",
            textAlign:"center", boxShadow:T2.card,
          }}>
            <div style={{fontSize:20, marginBottom:4}}>{emoji}</div>
            <div style={{fontSize:18, fontWeight:800, color:T2.teal}}>{value}</div>
            <div style={{fontSize:11, color:T2.inkFaint}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Einladungslink */}
      {ref_link && (
        <div style={{
          background:T2.tealSoft, borderRadius:T2.r12,
          border:`1px solid ${T2.tealMid}`, padding:"12px 14px",
          marginBottom:10,
        }}>
          <div style={{fontSize:11, fontWeight:700, color:T2.teal, marginBottom:4}}>
            🔗 Dein Einladungslink
          </div>
          <div style={{
            fontSize:12, color:T2.inkSoft, fontFamily:"monospace",
            wordBreak:"break-all", marginBottom:8,
          }}>
            {ref_link}
          </div>
          <button onClick={copyLink} style={{
            padding:"6px 14px", borderRadius:T2.r99,
            background:T2.teal, border:"none", color:"white",
            fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            touchAction:"manipulation",
          }}>
            Link kopieren
          </button>
        </div>
      )}


    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TALENT-ERWEITERUNG
// Sichtbar wenn profiles.is_talent = true
// Zeigt 6 Schritte + Meine Werke + Meine Erlebnisse
// Basiert auf DEMSELBEN Profil — kein neues Profil
// ══════════════════════════════════════════════════════════════
function TalentErweiterung({ profile, onProfileUpdate }) {


  return (
    <div style={{ padding: "0 20px" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0EC4B8 0%, #00A8A0 100%)",
        borderRadius: T.r16,
        padding: "20px",
        marginBottom: 20,
        color: "#fff",
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          🌱 Du bist Teil der Gemeinschaft
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Gestalte dein Profil und werde sichtbar.
        </div>
      </div>


      {/* Meine Werke */}
      <div style={{ fontSize: 13, fontWeight: 700, color: T.inkSoft, marginBottom: 12, letterSpacing: "0.05em" }}>
        MEINE WERKE
      </div>
      <div style={{
        background: T.bgCard, borderRadius: T.r16,
        border: `1px solid ${T.border}`, padding: "16px",
        boxShadow: T.card, marginBottom: 20,
      }}>
        <div style={{ fontSize: 13, color: T.inkFaint, lineHeight: 1.65 }}>
          Noch keine Werke hinzugefügt. Teile deine Projekte, Ideen und Leistungen mit der Gemeinschaft.
        </div>
        <button style={{
          marginTop: 12, padding: "8px 16px", borderRadius: 99,
          background: "#0EC4B8", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 700, color: "#fff",
        }}>
          + Werk hinzufügen
        </button>
      </div>

      {/* Meine Erlebnisse */}
      <div style={{ fontSize: 13, fontWeight: 700, color: T.inkSoft, marginBottom: 12, letterSpacing: "0.05em" }}>
        MEINE ERLEBNISSE
      </div>
      <div style={{
        background: T.bgCard, borderRadius: T.r16,
        border: `1px solid ${T.border}`, padding: "16px",
        boxShadow: T.card,
      }}>
        <div style={{ fontSize: 13, color: T.inkFaint, lineHeight: 1.65 }}>
          Noch keine Erlebnisse hinzugefügt. Berichte von echten Begegnungen und Erfahrungen.
        </div>
        <button style={{
          marginTop: 12, padding: "8px 16px", borderRadius: 99,
          background: "#0EC4B8", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 700, color: "#fff",
        }}>
          + Erlebnis hinzufügen
        </button>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// AMBASSADOR BANNER — Screenshot-genau unten im Profil
// Kompakter Banner mit Bild + Text + Button
// ══════════════════════════════════════════════════════════════
function AmbassadorBanner({ profile, ambState, onPress }) {
  // RECHTE-LOGIK: Ambassador-Balken nur für bestätigte Ambassadors sichtbar
  // Vergabe ausschließlich durch SADB — keine Self-Aktivierung möglich
  const isAmb = profile?.is_ambassador === true;
  if (!isAmb) return null; // Kein CTA, kein Bewerben-Button — nur für aktive Ambassadors

  // Ambassador-Balken: horizontaler Streifen am unteren Profilrand
  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{
        background:"linear-gradient(135deg,rgba(255,193,7,0.10),rgba(255,165,0,0.07))",
        borderRadius:T.r16,
        border:"1.5px solid rgba(255,193,7,0.28)",
        padding:"13px 16px",
        display:"flex", alignItems:"center", gap:12,
      }}>
        {/* Badge-Icon */}
        <div style={{
          width:36, height:36, borderRadius:T.r12, flexShrink:0,
          background:"linear-gradient(135deg,rgba(255,193,7,0.18),rgba(255,193,7,0.08))",
          border:"1.5px solid rgba(255,193,7,0.30)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:18,
        }}>
          🏅
        </div>

        {/* Text */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:800, color:T.ink, marginBottom:1 }}>
            HUI Ambassador
          </div>
          <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.4 }}>
            Aktiv · Empfiehlst HUI weiter
          </div>
        </div>

        {/* Öffnen-Button */}
        <button
          onClick={onPress}
          className="mbp-press"
          style={{
            flexShrink:0,
            padding:"8px 14px", borderRadius:T.r99,
            background:"rgba(255,193,7,0.18)",
            border:"1.5px solid rgba(255,193,7,0.35)",
            color:"#9A7000",
            fontSize:12, fontWeight:700,
            cursor:"pointer", touchAction:"manipulation",
            fontFamily:"inherit",
            whiteSpace:"nowrap",
          }}
        >
          Mein Bereich ›
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TALENT-PROFIL SEKTIONEN (is_talent === true)
// ══════════════════════════════════════════════════════════════

const TALENT_KATEGORIEN = [
  {icon:"🎨", label:"Malerei"},      {icon:"✏️", label:"Illustration"},
  {icon:"📸", label:"Fotografie"},   {icon:"🎵", label:"Musik"},
  {icon:"🎤", label:"Gesang"},       {icon:"🪡", label:"Handwerk"},
  {icon:"💻", label:"Programmierung"},{icon:"📐", label:"Design"},
  {icon:"📚", label:"Bildung"},      {icon:"🎭", label:"Theater"},
  {icon:"🧘", label:"Coaching"},     {icon:"🌿", label:"Naturführung"},
  {icon:"🍳", label:"Kochen"},       {icon:"🎬", label:"Film"},
  {icon:"✍️", label:"Schreiben"},   {icon:"🏺", label:"Töpfern"},
  {icon:"🎸", label:"Workshops"},    {icon:"⭐", label:"Kunstberatung"},
  {icon:"🖼️", label:"Auftragskunst"},{icon:"🎁", label:"Weitere Angebote"},
];


function DeleteWerkConfirm({ werk, onConfirm, onCancel }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
      background:"rgba(0,0,0,0.55)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:"24px",
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:16, padding:"24px 20px 20px",
        maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ fontSize:36, textAlign:"center", marginBottom:8 }}>🗑️</div>
        <div style={{ fontSize:16, fontWeight:700, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
          Werk unwiderruflich löschen?
        </div>
        <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
          <strong>„{werk.title || 'Dieses Werk'}"</strong> wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
        </div>
        <button onClick={onConfirm} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#ff3b3b", border:"none", color:"#fff",
          fontSize:14, fontWeight:700, cursor:"pointer",
          fontFamily:"inherit", marginBottom:8,
        }}>
          Ja, endgültig löschen
        </button>
        <button onClick={onCancel} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#f0f0ee", border:"none", color:"#444",
          fontSize:14, fontWeight:600, cursor:"pointer",
          fontFamily:"inherit",
        }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

function DeleteTalentConfirm({ talent, onConfirm, onCancel }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
      background:"rgba(0,0,0,0.55)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:"24px",
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:16, padding:"24px 20px 20px",
        maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
      }}>
        <div style={{ fontSize:36, textAlign:"center", marginBottom:8 }}>🗑️</div>
        <div style={{ fontSize:16, fontWeight:700, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
          Talent-Angebot unwiderruflich löschen?
        </div>
        <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
          <strong>„{talent.title || 'Dieses Angebot'}"</strong> wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
        </div>
        <button onClick={onConfirm} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#ff3b3b", border:"none", color:"#fff",
          fontSize:14, fontWeight:700, cursor:"pointer",
          fontFamily:"inherit", marginBottom:8,
        }}>
          Ja, endgültig löschen
        </button>
        <button onClick={onCancel} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#f0f0ee", border:"none", color:"#444",
          fontSize:14, fontWeight:600, cursor:"pointer",
          fontFamily:"inherit",
        }}>
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MEIN BEREICH — Drawer-Menü (PROFIL-DRAWER-REDESIGN-003, 2026-07-06)
// ────────────────────────────────────────────────────────────────
// Ersetzt die bisherigen, permanent sichtbaren Inline-Listen
// (Talent-Angebote/Meine Werke/Erlebnisse) sowie die aus dem Studio
// umgezogenen Bereiche (Ambassador/Empfehlungen/Impact/Finanzen) durch
// eine kompakte Menü-Karte mit Icon-Grid — jedes Feld oeffnet die
// jeweilige bestehende Section/Modal als Bottom-Sheet-Drawer. Kein
// Feature neu gebaut, nur die Praesentation vereinheitlicht (Charta:
// Wiederverwendung vor Neuerstellung, Evolution statt Rewrite).
// ════════════════════════════════════════════════════════════════

function MeinBereichDrawer({ title, icon, onClose, children, footer = true }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:10500,
        background:"rgba(26,26,24,0.55)",
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:480,
          background:"#F7F5F0", borderRadius:"24px 24px 0 0",
          maxHeight:"90vh", display:"flex", flexDirection:"column",
          boxShadow:"0 -4px 32px rgba(26,26,24,0.20)",
        }}
      >
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px", flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,24,0.12)" }} />
        </div>
        {/* Header */}
        <div style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"8px 20px 14px", flexShrink:0,
          borderBottom:"1px solid rgba(26,26,24,0.08)",
        }}>
          <div style={{ fontSize:17, fontWeight:800, color:"#1A1A18", letterSpacing:"-0.02em" }}>
            <span style={{display:"flex",alignItems:"center",gap:7,color:"rgba(14,196,184,0.9)"}}>{icon}</span>{title}
          </div>
          <button onClick={onClose} style={{
            background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer",
            borderRadius:"50%", width:32, height:32,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:16, color:"rgba(26,26,24,0.52)",
          }}>✕</button>
        </div>
        {/* Inhalt scrollbar */}
        <div style={{
          flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch", willChange:"transform", overscrollBehavior:"contain",
          scrollbarWidth:"none", padding: footer ? undefined : "0 0 24px",
        }}>
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div style={{ padding:"12px 20px 36px", borderTop:"1px solid rgba(26,26,24,0.08)", flexShrink:0 }}>
            <button onClick={onClose} style={{
              width:"100%", padding:"13px", borderRadius:14, border:"none",
              cursor:"pointer", background:"rgba(26,26,24,0.08)",
              color:"rgba(26,26,24,0.52)", fontSize:14, fontWeight:700,
              fontFamily:"inherit", WebkitTapHighlightColor:"transparent",
            }}>Schließen</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function MeinBereichChooserRow({ icon, label, desc, onPress }) {
  return (
    <button onClick={onPress} className="mbp-press-light" style={{
      width:"100%", display:"flex", alignItems:"center", gap:14,
      padding:"15px 20px", background:"none", border:"none", cursor:"pointer",
      fontFamily:"inherit", textAlign:"left", borderBottom:"1px solid rgba(26,26,24,0.06)",
      WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
    }}>
      <span style={{
        width:38, height:38, borderRadius:11, flexShrink:0,
        background:"rgba(14,196,184,0.10)",
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"rgba(14,196,184,0.85)",
      }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#1A1A18" }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:"rgba(26,26,24,0.5)", marginTop:1 }}>{desc}</div>}
      </div>
      <span style={{ color:"rgba(26,26,24,0.32)", fontSize:17 }}>›</span>
    </button>
  );
}

function MeinBereichTile({ icon, label, onPress }) {
  return (
    <button
      onClick={onPress}
      className="mbp-press-light"
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:8,
        background:"none", border:"none", cursor:"pointer", fontFamily:"inherit",
        padding:"4px 2px", WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
      }}
    >
      <span style={{
        width:52, height:52, borderRadius:"50%",
        background:"rgba(14,196,184,0.10)", border:"1px solid rgba(14,196,184,0.22)",
        display:"flex", alignItems:"center", justifyContent:"center",
        flexShrink:0, color:"rgba(14,196,184,0.85)",
      }}>{icon}</span>
      <span style={{
        fontSize:11.5, fontWeight:600, color:"rgba(26,26,24,0.75)",
        textAlign:"center", lineHeight:1.25, maxWidth:76,
      }}>{label}</span>
    </button>
  );
}

function MeinBereichMenu({
  profile, isTalent,
  talents, works, experiences,
  onTalentWizard, onDeleteTalent,
  onWerkWizard, onDeleteWerk,
  onErlebnisWizard, onDeleteErlebnis,
  onOpenResonanz = () => {},
  onProfileUpdate = () => {},
}) {
  const { switchTab } = useHome();
  const [activeDrawer, setActiveDrawer] = useState(null); // talente|werke|erlebnisse|momente|ambassador|empfehlungen|impact|finanzen
  const [showMomentSheet, setShowMomentSheet] = useState(false);
  const [impactDetail, setImpactDetail] = useState(null); // stimmen|projekte
  const [financeDetail, setFinanceDetail] = useState(null); // ein_aus|verkaeufe|buchungen|statistiken
  const [activeTab, setActiveTab] = useState("erlebnisse"); // erlebnisse | impact
  const [showUpdateSheet, setShowUpdateSheet] = useState(false);
  const [updateTargetProject, setUpdateTargetProject] = useState(null);
  const [showProfilEdit, setShowProfilEdit] = useState(false);

  const close = () => setActiveDrawer(null);

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{
        background:T.bgCard, borderRadius:T.r20,
        border:`1px solid ${T.border}`, boxShadow:T.card,
        padding:"18px 18px 20px",
      }}>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, marginBottom:14, letterSpacing:"-0.01em" }}>
          Mein Bereich
        </div>

        <button
          onClick={() => setShowProfilEdit(true)}
          className="mbp-press-light"
          style={{
            width:"100%", padding:"13px", borderRadius:T.r99,
            background:T.tealSoft, border:`1px solid ${T.tealMid}`,
            color:T.teal, fontSize:14, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit", marginBottom:18,
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
          }}
        >
          Profil bearbeiten
        </button>

        <div style={{
          display:"grid", gridTemplateColumns:"repeat(4, 1fr)",
          rowGap:18, columnGap:4,
        }}>
          <MeinBereichTile icon={<HUIResonanzIcon size={22}/>} label="Meine Resonanz" onPress={onOpenResonanz} />
          {isTalent && (
            <MeinBereichTile icon={<HUITalentIcon size={22}/>} label="Talent-Angebote" onPress={() => setActiveDrawer("talente")} />
          )}
          {isTalent && (
            <MeinBereichTile icon={<HUIWerkeIcon size={22}/>} label="Meine Werke" onPress={() => setActiveDrawer("werke")} />
          )}
          {isTalent && (
            <MeinBereichTile icon={<HUIErlebnisIcon size={22}/>} label="Erlebnisse & Projekte" onPress={() => setActiveDrawer("erlebnisse")} />
          )}
          <MeinBereichTile icon={<HUIFotoIcon size={22}/>} label="Meine Momente" onPress={() => setActiveDrawer("momente")} />
          <MeinBereichTile icon={<HUIEmpfehlungIcon size={22}/>} label="Meine Empfehlungen" onPress={() => setActiveDrawer("empfehlungen")} />
          <MeinBereichTile icon={<HUIImpactIcon size={22}/>} label="Impact & Stimmen" onPress={() => setActiveDrawer("impact")} />
          <MeinBereichTile icon={<HUIFinanzIcon size={22}/>} label="Finanzabteilung" onPress={() => setActiveDrawer("finanzen")} />
        </div>
      </div>

      {/* ── Talent-Angebote ─────────────────────────────────── */}
      {activeDrawer === "talente" && (
        <MeinBereichDrawer title="Talent-Angebote" icon={<HUITalentIcon size={18}/>} onClose={close} footer={false}>
          <TalentAngeboteSection
            talents={talents}
            onTalentWizard={onTalentWizard}
            onDeleteTalent={onDeleteTalent}
          />
        </MeinBereichDrawer>
      )}

      {/* ── Meine Werke ──────────────────────────────────────── */}
      {activeDrawer === "werke" && (
        <MeinBereichDrawer title="Meine Werke" icon={<HUIWerkeIcon size={18}/>} onClose={close} footer={false}>
          <MeineWerkeSection
            works={works}
            onWerkWizard={onWerkWizard}
            onDeleteWerk={onDeleteWerk}
          />
        </MeinBereichDrawer>
      )}

      {/* ── Erlebnisse & Projekte ────────────────────────────── */}
      {activeDrawer === "erlebnisse" && (
        <MeinBereichDrawer title="Erlebnisse & Projekte" icon={<HUIErlebnisIcon size={18}/>} onClose={close} footer={false}>
          {/* Tab-Switcher */}
          <div style={{ display:"flex", gap:0, margin:"0 20px 16px", background:"rgba(0,0,0,0.05)", borderRadius:12, padding:4 }}>
            {[["erlebnisse","Erlebnisse"],["impact","Impact Projekte"]].map(([key,label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                flex:1, padding:"8px 4px", borderRadius:10, border:"none",
                background: activeTab===key ? "white" : "transparent",
                color: activeTab===key ? "#0DC4B5" : "#666",
                fontSize:13, fontWeight: activeTab===key ? 800 : 600,
                cursor:"pointer", fontFamily:"inherit",
                boxShadow: activeTab===key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                transition:"all 0.2s"
              }}>{label}</button>
            ))}
          </div>

          {activeTab === "erlebnisse" ? (
            <ErlebnisseSection
              experiences={experiences}
              onErlebnisWizard={onErlebnisWizard}
              onDeleteErlebnis={onDeleteErlebnis}
            />
          ) : (
            <ImpactProjekteTab
              profile={profile}
              supabase={supabase}
              onUpdateClick={(proj) => { setUpdateTargetProject(proj); setShowUpdateSheet(true); }}
            />
          )}

          {showUpdateSheet && updateTargetProject && (
                  <React.Suspense fallback={null}>
            <ImpactUpdateSheet
              project={updateTargetProject}
              currentUser={profile}
              onClose={() => { setShowUpdateSheet(false); setUpdateTargetProject(null); }}
              onSuccess={() => { /* optional: refetch */ }}
            />
                  </React.Suspense>
          )}
        </MeinBereichDrawer>
      )}

      {/* ── Meine Momente ───────────────────────────────────── */}
      {activeDrawer === "momente" && (
        <MeinBereichDrawer title="Meine Momente" icon={<HUIFotoIcon size={18}/>} onClose={close} footer={false}>
          <MeinMomenteDrawerContent
            profile={profile}
            onOpenMomentSheet={() => {
              close();
              setTimeout(() => setShowMomentSheet(true), 80);
            }}
          />
        </MeinBereichDrawer>
      )}

      {/* HuiMomentSheet — Portal, via showMomentSheet */}
      {showMomentSheet && (
        <React.Suspense fallback={null}>
          <HuiMomentSheet
            visible={showMomentSheet}
            onClose={() => setShowMomentSheet(false)}
            visibilityScope="public"
          />
        </React.Suspense>
      )}

      {/* ── Ambassador-Bereich ───────────────────────────────── */}
      {activeDrawer === "ambassador" && (
              <React.Suspense fallback={null}>
        <MeinBereichDrawer title="Ambassador-Bereich" icon={<HUIAmbassadorIcon size={18}/>} onClose={close} footer={false}>
          <AmbassadorStudioSection profile={profile} />
        </MeinBereichDrawer>
              </React.Suspense>
      )}

      {/* ── Meine Empfehlungen (bereits eigenstaendiger Drawer) ─ */}
      {activeDrawer === "empfehlungen" && (
              <React.Suspense fallback={null}>
        <MyRecommendationsModal userId={profile?.id} onClose={close} />
              </React.Suspense>
      )}

      {/* ── Impact & Stimmen (Chooser + Detail-Drawer) ──────── */}
      {activeDrawer === "impact" && !impactDetail && (
        <MeinBereichDrawer title="Impact & Stimmen" icon={<HUIImpactIcon size={18}/>} onClose={close} footer={false}>
          <MeinBereichChooserRow
            icon={<HUIStimmeIcon size={18}/>} label="Impact-Stimmen"
            desc={isTalent ? "2 Stimmen / Monat" : "1 Stimme / Monat"}
            onPress={() => setImpactDetail("stimmen")}
          />
          <MeinBereichChooserRow
            icon={<HUIProjektIcon size={18}/>} label="Meine unterstützten Projekte"
            onPress={() => setImpactDetail("projekte")}
          />
        </MeinBereichDrawer>
      )}
      {activeDrawer === "impact" && impactDetail === "stimmen" && (
              <React.Suspense fallback={null}>
        <ImpactStimmenModal
          profile={profile}
          onClose={() => setImpactDetail(null)}
          switchTab={switchTab}
        />
              </React.Suspense>
      )}
      {activeDrawer === "impact" && impactDetail === "projekte" && (
              <React.Suspense fallback={null}>
        <MeineProjekteModal
          profile={profile}
          onClose={() => setImpactDetail(null)}
          switchTab={switchTab}
        />
              </React.Suspense>
      )}

      {/* ── Finanzabteilung (Chooser + Detail-Drawer) ───────── */}
      {activeDrawer === "finanzen" && !financeDetail && (
        <MeinBereichDrawer title="Finanzabteilung" icon={<HUIFinanzIcon size={18}/>} onClose={close} footer={false}>
          <MeinBereichChooserRow icon={<HUIEinAusIcon size={18}/>} label="Ein-/Ausgaben Übersicht" onPress={() => setFinanceDetail("ein_aus")} />
          <MeinBereichChooserRow icon={<HUIVerkaufIcon size={18}/>} label="Meine Verkäufe" onPress={() => setFinanceDetail("verkaeufe")} />
          <MeinBereichChooserRow icon={<HUIKalenderIcon size={18}/>} label="Meine Buchungen" onPress={() => setFinanceDetail("buchungen")} />
          <MeinBereichChooserRow icon={<HUIStatistikIcon size={18}/>} label="Statistiken" onPress={() => setFinanceDetail("statistiken")} />
        </MeinBereichDrawer>
      )}
      {activeDrawer === "finanzen" && financeDetail === "ein_aus" && (
              <React.Suspense fallback={null}>
        <EinAusgabenModal profile={profile} onClose={() => setFinanceDetail(null)} />
              </React.Suspense>
      )}
      {activeDrawer === "finanzen" && financeDetail === "verkaeufe" && (
              <React.Suspense fallback={null}>
        <MeineVerkaeufeModal profile={profile} onClose={() => setFinanceDetail(null)} />
              </React.Suspense>
      )}
      {activeDrawer === "finanzen" && financeDetail === "buchungen" && (
              <React.Suspense fallback={null}>
        <MeineBuchungenModal profile={profile} onClose={() => setFinanceDetail(null)} />
              </React.Suspense>
      )}
      {activeDrawer === "finanzen" && financeDetail === "statistiken" && (
              <React.Suspense fallback={null}>
        <StatistikenModal profile={profile} onClose={() => setFinanceDetail(null)} />
              </React.Suspense>
      )}

      {/* ── Profil bearbeiten ───────────────────────────────── */}
      {showProfilEdit && (
        <ProfilBearbeitenModal
          profile={profile}
          onClose={() => setShowProfilEdit(false)}
          onProfileUpdate={onProfileUpdate}
        />
      )}
    </div>
  );
}


function TalentAngeboteSection({ talents = [], onTalentWizard, onDeleteTalent = () => {} }) {
  const [confirmTalent, setConfirmTalent] = React.useState(null);

  const handleDeleteClick = (e, t) => {
    e.stopPropagation();
    setConfirmTalent(t);
  };

  const handleConfirmDelete = async () => {
    const t = confirmTalent;
    setConfirmTalent(null);
    if (!t?.id) return;
    try {
      await deleteTalent(t.id);
      onDeleteTalent(t.id);
    } catch(e) { console.error("Talent-Angebot löschen:", e); }
  };

  return (
    <>
    {confirmTalent && (
      <DeleteTalentConfirm
        talent={confirmTalent}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTalent(null)}
      />
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Talent-Angebote" sub="Deine buchbaren Leistungen & Dienstleistungen"/>
      {talents.length > 0 && (
        <div style={{ display:"flex", gap:8, overflowX:"auto",
          WebkitOverflowScrolling:"touch", scrollbarWidth:"none",
          paddingBottom:4, marginBottom:8 }}>
          {talents.map((t, i) => {
            const isApproved = t.status === "approved";
            const isPending  = t.status === "pending";
            const badgeBg    = isApproved ? "rgba(14,196,184,0.92)" : isPending ? "rgba(234,179,8,0.92)" : "rgba(255,80,80,0.92)";
            const badgeText  = isApproved ? "✅ Live" : isPending ? "⏳ Prüfung" : "❌ Abgelehnt";
            const cover = Array.isArray(t.images) && t.images[0]?.url;
            return (
              <div key={t.id || i}
                onClick={() => onTalentWizard?.(t)}
                style={{
                  flexShrink:0, width:88, height:88,
                  borderRadius:12, overflow:"hidden",
                  background:"#e8e4de", position:"relative", cursor:"pointer",
                  boxShadow: isApproved ? "0 0 0 2px #0EC4B8" : isPending ? "0 0 0 2px #D4A800" : "0 0 0 2px #ff5050",
                }}>
                {cover
                  ? <img loading="lazy" decoding="async" src={cover} alt={t.title||""}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <div style={{ width:"100%", height:"100%", display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:24 }}>💼</div>
                }
                <button
                  onClick={(e) => handleDeleteClick(e, t)}
                  style={{
                    position:"absolute", top:4, right:4,
                    width:20, height:20, borderRadius:"50%",
                    background:"rgba(0,0,0,0.65)", border:"none",
                    color:"#fff", fontSize:11, fontWeight:700,
                    cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    lineHeight:1, padding:0, zIndex:2,
                  }}
                >✕</button>
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background: badgeBg,
                  fontSize:9, fontWeight:700, color:"#fff",
                  padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
                }}>
                  {badgeText}
                </div>
                {t.title && (
                  <div style={{
                    position:"absolute", top:0, left:0, right:0,
                    background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                    padding:"3px 22px 3px 5px", whiteSpace:"nowrap",
                    overflow:"hidden", textOverflow:"ellipsis",
                  }}>
                    {t.title}
                  </div>
                )}
                {/* Preis-Hinweis (Master-Prompt 2026-07-05) — nur eine kompakte Zeile,
                    Sichtbarkeit fuer Dritte ohnehin ueber RLS (approved-only) geregelt */}
                {(t.price_per_hour || t.price_per_session) && (
                  <div style={{
                    position:"absolute", bottom:18, left:0, right:0,
                    background:"rgba(0,0,0,0.35)", fontSize:8.5, color:"#fff",
                    padding:"2px 5px", textAlign:"center", fontWeight:600,
                  }}>
                    {t.price_per_hour ? `${t.price_per_hour}€/Std` : `${t.price_per_session}€/Termin`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <button className="mbp-press-light" onClick={() => onTalentWizard?.()} style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"8px 14px", borderRadius:T.r12,
        background:T.tealSoft, border:`1px solid ${T.tealMid}`,
        fontSize:12.5, fontWeight:700, color:T.teal,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        width:"100%",
      }}>
        <span style={{
          width:18, height:18, borderRadius:"50%", flexShrink:0,
          background:T.teal, color:"#fff", fontSize:13, fontWeight:800,
          display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1,
        }}>+</span>
        Talent-Angebot hinzufügen
      </button>
    </div>
    </>
  );
}

function MeineWerkeSection({ works, onWerkWizard, onDeleteWerk = () => {} }) {
  const [confirmWork, setConfirmWork] = React.useState(null);

  const handleDeleteClick = (e, w) => {
    e.stopPropagation();
    setConfirmWork(w);
  };

  const handleConfirmDelete = async () => {
    const w = confirmWork;
    setConfirmWork(null);
    if (!w?.id) return;
    try {
      await supabase.from("works").update({ status: "deleted", visibility: "private" }).eq("id", w.id);
      onDeleteWerk(w.id);
    } catch(e) { console.error("Werk löschen:", e); }
  };

  return (
    <>
    {confirmWork && (
      <DeleteWerkConfirm
        werk={confirmWork}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmWork(null)}
      />
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Meine Werke" sub="Deine veröffentlichten Kreationen."/>
      {works.length > 0 && (
        <div style={{ display:"flex", gap:8, overflowX:"auto",
          WebkitOverflowScrolling:"touch", scrollbarWidth:"none",
          paddingBottom:4, marginBottom:8 }}>
          {works.map((w, i) => {
            const isApproved = w.approval_status === "approved";
            const isPending  = w.approval_status === "pending" || w.status === "pending_review";
            const badgeBg    = isApproved ? "rgba(14,196,184,0.92)" : isPending ? "rgba(234,179,8,0.92)" : "rgba(255,80,80,0.92)";
            const badgeText  = isApproved ? "✅ Live" : isPending ? "⏳ Prüfung" : "❌ Abgelehnt";
            return (
              <div key={w.id || i}
                onClick={() => onWerkWizard?.(w)}
                style={{
                  flexShrink:0, width:88, height:88,
                  borderRadius:T.r12, overflow:"hidden",
                  background:"#e8e4de", position:"relative", cursor:"pointer",
                  boxShadow: isApproved ? "0 0 0 2px #0EC4B8" : isPending ? "0 0 0 2px #D4A800" : "0 0 0 2px #ff5050",
                }}>
                {w.cover_url
                  ? <img loading="lazy" decoding="async" src={w.cover_url} alt={w.title||""}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                  : <div style={{ width:"100%", height:"100%", display:"flex",
                      alignItems:"center", justifyContent:"center", fontSize:24 }}>🎨</div>
                }
                {/* X-Löschen-Button oben rechts */}
                <button
                  onClick={(e) => handleDeleteClick(e, w)}
                  style={{
                    position:"absolute", top:4, right:4,
                    width:20, height:20, borderRadius:"50%",
                    background:"rgba(0,0,0,0.65)", border:"none",
                    color:"#fff", fontSize:11, fontWeight:700,
                    cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    lineHeight:1, padding:0, zIndex:2,
                  }}
                >✕</button>
                {/* Status-Badge */}
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background: badgeBg,
                  fontSize:9, fontWeight:700, color:"#fff",
                  padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
                }}>
                  {badgeText}
                </div>
                {/* Titel */}
                {w.title && (
                  <div style={{
                    position:"absolute", top:0, left:0, right:0,
                    background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                    padding:"3px 22px 3px 5px", whiteSpace:"nowrap",
                    overflow:"hidden", textOverflow:"ellipsis",
                  }}>
                    {w.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <button className="mbp-press-light" onClick={() => onWerkWizard?.()} style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"8px 14px", borderRadius:T.r12,
        background:T.tealSoft, border:`1px solid ${T.tealMid}`,
        fontSize:12.5, fontWeight:700, color:T.teal,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        width:"100%",
      }}>
        <span style={{
          width:18, height:18, borderRadius:"50%", flexShrink:0,
          background:T.teal, color:"#fff", fontSize:13, fontWeight:800,
          display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1,
        }}>+</span>
        Werk hinzufügen
      </button>
    </div>
    </>
  );
}

function ErlebnisseSection({ experiences, onErlebnisWizard, onDeleteErlebnis = () => {} }) {
  const [confirmExp, setConfirmExp] = React.useState(null);

  const handleDeleteClick = (e, exp) => {
    e.stopPropagation();
    setConfirmExp(exp);
  };

  const handleConfirmDelete = async () => {
    const exp = confirmExp;
    setConfirmExp(null);
    if (!exp?.id) return;
    try {
      const table = exp._source === "projects" ? "projects" : "experiences";
      // Hard-Delete: Zeile vollständig aus DB entfernen
      // → Realtime triggert Admin-Dashboard, Zeile verschwindet dort sofort
      const { error } = await supabase.from(table).delete().eq("id", exp.id);
      if (!error) {
        onDeleteErlebnis(exp.id);
      } else {
        console.error("Erlebnis löschen:", error);
        // Fallback: soft-delete wenn Hard-Delete nicht erlaubt (RLS)
        await supabase.from(table).update({ status: "deleted" }).eq("id", exp.id);
        onDeleteErlebnis(exp.id);
      }
    } catch(e) { console.error("Erlebnis löschen:", e); }
  };

  function fmtDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toLocaleDateString("de-DE", { month:"short", year:"numeric" });
  }
  return (
    <>
    {confirmExp && (
      <div style={{
        position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
        background:"rgba(0,0,0,0.55)", display:"flex",
        alignItems:"center", justifyContent:"center", padding:"24px",
      }} onClick={() => setConfirmExp(null)}>
        <div onClick={e => e.stopPropagation()} style={{
          background:"#fff", borderRadius:16, padding:"24px 20px 20px",
          maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
        }}>
          <div style={{ fontSize:36, textAlign:"center", marginBottom:8 }}>🗑️</div>
          <div style={{ fontSize:16, fontWeight:700, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
            Erlebnis unwiderruflich löschen?
          </div>
          <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
            <strong>„{confirmExp.title || 'Dieses Erlebnis'}"</strong> wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
          </div>
          <button onClick={handleConfirmDelete} style={{
            width:"100%", padding:"12px", borderRadius:99,
            background:"#ff3b3b", border:"none", color:"#fff",
            fontSize:14, fontWeight:700, cursor:"pointer",
            fontFamily:"inherit", marginBottom:8,
          }}>
            Ja, endgültig löschen
          </button>
          <button onClick={() => setConfirmExp(null)} style={{
            width:"100%", padding:"12px", borderRadius:99,
            background:"#f0f0ee", border:"none", color:"#444",
            fontSize:14, fontWeight:600, cursor:"pointer",
            fontFamily:"inherit",
          }}>
            Abbrechen
          </button>
        </div>
      </div>
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      <SectionRow title="Erlebnisse & Projekte"
        sub="Momente, die mein Wirken zeigen."/>

      <div style={{ display:"flex", gap:8, overflowX:"auto",
        WebkitOverflowScrolling:"touch", scrollbarWidth:"none", paddingBottom:4, marginBottom:8 }}>
        {experiences.map((exp, i) => {
          // ── Badge-System identisch zu Meine Werke ──────────────
          const isApproved = exp.approval_status === "approved" || exp.status === "published";
          const isPending  = !isApproved && (exp.approval_status === "pending" || exp.status === "pending_review" || exp.status === "pending");
          const isRejected = !isApproved && !isPending && (exp.approval_status === "rejected" || exp.status === "rejected");
          const badgeBg    = isApproved
            ? "rgba(14,196,184,0.92)"
            : isPending
              ? "rgba(234,179,8,0.92)"
              : isRejected
                ? "rgba(255,80,80,0.92)"
                : "rgba(14,196,184,0.92)";
          const badgeText  = isApproved
            ? "✅ Live"
            : isPending
              ? "⏳ Prüfung"
              : isRejected
                ? "❌ Abgelehnt"
                : "✅ Live";
          const borderCol  = isApproved ? "#0EC4B8" : isPending ? "#D4A800" : isRejected ? "#ff5050" : "#0EC4B8";
          return (
            <div key={exp.id || i}
              onClick={() => onErlebnisWizard?.(exp)}
              style={{
                flexShrink:0, width:88, height:88,
                borderRadius:T.r12, overflow:"hidden",
                background:"#e8e4de", position:"relative", cursor:"pointer",
                boxShadow: `0 0 0 2px ${borderCol}`,
              }}>
              {exp.cover_url
                ? <img loading="lazy" decoding="async" src={exp.cover_url} alt={exp.title||""}
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : <div style={{ width:"100%", height:"100%", display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:24 }}>🎟</div>
              }
              {/* X-Löschen-Button oben rechts */}
              <button
                onClick={(e) => handleDeleteClick(e, exp)}
                style={{
                  position:"absolute", top:4, right:4,
                  width:20, height:20, borderRadius:"50%",
                  background:"rgba(0,0,0,0.65)", border:"none",
                  color:"#fff", fontSize:11, fontWeight:700,
                  cursor:"pointer", display:"flex",
                  alignItems:"center", justifyContent:"center",
                  lineHeight:1, padding:0, zIndex:2,
                }}
              >✕</button>
              {/* Status-Badge unten */}
              <div style={{
                position:"absolute", bottom:0, left:0, right:0,
                background: badgeBg,
                fontSize:9, fontWeight:700, color:"#fff",
                padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
              }}>
                {badgeText}
              </div>
              {/* Titel oben */}
              {exp.title && (
                <div style={{
                  position:"absolute", top:0, left:0, right:0,
                  background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                  padding:"3px 22px 3px 5px", whiteSpace:"nowrap",
                  overflow:"hidden", textOverflow:"ellipsis",
                }}>
                  {exp.title}
                </div>
              )}
              {/* Ablehnungsgrund Overlay + "Anpassen"-CTA */}
              {isRejected && (
                <div style={{
                  position:"absolute", top:0, left:0, right:0, bottom:0,
                  background:"rgba(255,80,80,0.08)",
                  pointerEvents:"none",
                }}/>
              )}
              {/* Anpassen-Hinweis bei abgelehnten Erlebnissen */}
              {isRejected && (
                <div style={{
                  position:"absolute", top:"50%", left:0, right:0,
                  transform:"translateY(-50%)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  pointerEvents:"none",
                }}>
                  <span style={{
                    background:"rgba(0,0,0,0.72)", color:"#fff",
                    fontSize:8, fontWeight:700, padding:"2px 7px",
                    borderRadius:20, letterSpacing:"0.3px",
                  }}>Anpassen</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    {/* ── Add-Button — EXAKT identisch zu "+ Werk hinzufügen" ── */}
    <div style={{ padding:`0 ${T.px}px` }}>
      <button className="mbp-press-light" onClick={() => onErlebnisWizard?.()} style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"8px 14px", borderRadius:T.r12,
        background:T.tealSoft, border:`1px solid ${T.tealMid}`,
        fontSize:12.5, fontWeight:700, color:T.teal,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        width:"100%",
      }}>
        <span style={{
          width:18, height:18, borderRadius:"50%", flexShrink:0,
          background:T.teal, color:"#fff", fontSize:13, fontWeight:800,
          display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1,
        }}>+</span>
        Erlebnis &amp; Projekte hinzufügen
      </button>
    </div>
    </>
  );
}



// ══════════════════════════════════════════════════════════════
// IMPACT PROJEKTE TAB — Zeigt die Impact-Projekte des Users
// Fragt impact_applications per user_id ab.
// Für bewilligte Projekte: "+ Update hinzufügen" Button.
// ══════════════════════════════════════════════════════════════
function ImpactProjekteTab({ profile, supabase, onUpdateClick }) {
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // impact_applications nutzt 'user_id' als User-Feld
  const userField = "user_id";

  React.useEffect(() => {
    if (!profile?.user_id && !profile?.id) return;
    const uid = profile.user_id || profile.id;
    supabase
      .from("impact_applications")
      .select("id,project_name,short_desc,funding_goal,current_amount_eur,status,rank,is_completed,created_at")
      .eq(userField, uid)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("[ImpactProjekteTab] query error:", error);
        }
        setProjects(data || []);
        setLoading(false);
      });
  }, [profile?.user_id, profile?.id]);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#666" }}>
        Lädt...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div style={{ padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>💚</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
          Noch kein Impact-Projekt
        </div>
        <div style={{ fontSize: 13, color: "#666" }}>
          Reiche dein erstes Herzensprojekt ein und erhalte Community-Finanzierung.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px" }}>
      {projects.map((proj) => {
        const funded = proj.current_amount_eur || 0;
        const goal = proj.funding_goal || 0;
        const pct = goal > 0 ? Math.min(100, Math.round((funded / goal) * 100)) : 0;
        const statusColor =
          proj.status === "approved" ? "#0DC4B5" :
          proj.status === "rejected" ? "#e74c3c" : "#f39c12";
        const statusLabel =
          proj.status === "approved" ? "✅ Bewilligt" :
          proj.status === "rejected" ? "❌ Abgelehnt" : "⏳ In Prüfung";
        return (
          <div
            key={proj.id}
            style={{
              background: "#F5FBF8",
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              border: "1px solid rgba(13,196,181,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#1A1A1A",
                  flex: 1,
                  marginRight: 8,
                }}
              >
                {proj.project_name}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: statusColor,
                  background: statusColor + "15",
                  padding: "3px 8px",
                  borderRadius: 99,
                  flexShrink: 0,
                }}
              >
                {statusLabel}
              </span>
            </div>
            {proj.short_desc && (
              <div style={{ fontSize: 12, color: "#666", marginBottom: 8, lineHeight: 1.4 }}>
                {proj.short_desc}
              </div>
            )}
            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
              €{funded.toLocaleString("de-DE")} von €{goal.toLocaleString("de-DE")} finanziert
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 99,
                background: "rgba(0,0,0,0.08)",
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 99,
                  width: `${pct}%`,
                  background: "linear-gradient(90deg,#0DC4B5,#09A89D)",
                }}
              />
            </div>
            {proj.status === "approved" && (
              <button
                onClick={() => onUpdateClick(proj)}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 12,
                  border: "1.5px dashed #0DC4B5",
                  background: "transparent",
                  color: "#0DC4B5",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                + Update hinzufügen
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// GEMEINSCHAFTSKARTE
// Einladende Karte zwischen "Über mich" und "Interessen"
// Nur sichtbar für Basis-User (kein Talent-Profil aktiv)
// ══════════════════════════════════════════════════════════════
function GemeinschaftsKarte({ onJoin }) {
  return (
    <div style={{ padding:`0 20px` }}>
      <div style={{
        background:"linear-gradient(140deg,#F0FDFB 0%,#E8FAF8 60%,#F5FCF5 100%)",
        border:"1.5px solid rgba(14,196,184,0.20)",
        borderRadius:20,
        padding:"24px 20px 20px",
        boxShadow:"0 2px 16px rgba(14,196,184,0.10)",
        position:"relative",
        overflow:"hidden",
      }}>
        {/* Deko-Glow hinten */}
        <div style={{
          position:"absolute", right:-20, top:-20,
          width:120, height:120, borderRadius:"50%",
          background:"radial-gradient(circle,rgba(14,196,184,0.12),transparent 70%)",
          pointerEvents:"none",
        }}/>

        <h3 style={{
          fontSize:22, fontWeight:800, color:"#1A1A18",
          letterSpacing:"-0.03em", lineHeight:1.25,
          margin:"0 0 10px",
        }}>
          Werde Teil der<br/>HUI-Gemeinschaft ✨
        </h3>

        <p style={{
          fontSize:14, lineHeight:1.72, color:"rgba(26,26,24,0.58)",
          margin:"0 0 20px",
        }}>
          Jeder Mensch trägt etwas Wertvolles in sich.
          Teile deine Talente, Ideen, Werke und Erfahrungen mit anderen
          und gestalte gemeinsam eine bessere Welt.
        </p>

        <button
          onClick={onJoin}
          style={{
            display:"inline-flex", alignItems:"center", gap:8,
            padding:"14px 22px",
            background:"linear-gradient(135deg,#0EC4B8,#0AADA3)",
            color:"#fff", border:"none", borderRadius:99,
            fontSize:15, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 4px 16px rgba(14,196,184,0.30)",
            touchAction:"manipulation",
            transition:"transform .15s, box-shadow .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform="scale(1.02)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; }}
          onTouchStart={e => { e.currentTarget.style.transform="scale(0.97)"; }}
          onTouchEnd={e => { e.currentTarget.style.transform="scale(1)"; }}
        >
          🤝 Der Gemeinschaft beitreten
        </button>
      </div>
    </div>
  );
}


// ══════════════════════════════════════════════════════════════
// TALENT WERDEN BANNER
// Einladungskarte für Basis-User — direkt unter "Über mich"
// Öffnet den TalentOnboarding-Flow (3 Schritte, setzt is_talent=true)
// ══════════════════════════════════════════════════════════════
function TalentWerdenBanner({ onStart = () => {} }) {
  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #FFF8F5 0%, #FFF3EE 50%, #F0FDFB 100%)',
        border: '1.5px solid rgba(255,138,107,0.22)',
        borderRadius: 20,
        padding: '22px 20px 20px',
        boxShadow: '0 2px 20px rgba(255,138,107,0.10)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Deko-Blur */}
        <div style={{
          position: 'absolute', right: -16, top: -16,
          width: 100, height: 100, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(255,138,107,0.12),transparent 70%)',
          pointerEvents: 'none',
        }}/>
        <div style={{
          position: 'absolute', left: -10, bottom: -10,
          width: 70, height: 70, borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(22,215,197,0.10),transparent 70%)',
          pointerEvents: 'none',
        }}/>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
          {/* Icon */}
          <div style={{
            width: 46, height: 46, borderRadius: 14, flexShrink: 0,
            background: 'linear-gradient(135deg, #FF8A6B, #FF6B47)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 4px 14px rgba(255,138,107,0.30)',
          }}>✦</div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#FF8A6B',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4,
            }}>
              Dein nächster Schritt
            </div>
            <div style={{
              fontSize: 17, fontWeight: 800, color: '#1A1A18',
              lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 6,
            }}>
              Werde HUI-Talent ✨
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(26,26,24,0.58)',
              lineHeight: 1.65, marginBottom: 16,
            }}>
              Teile dein Talent, biete Dienstleistungen an und verdiene
              mit dem was du liebst — in 3 einfachen Schritten.
            </div>

            {/* Feature-Punkte */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
              {[
                { icon: '🎯', text: 'Eigenes Talent-Profil erstellen' },
                { icon: '💼', text: 'Dienstleistungen & Angebote anbieten' },
                { icon: '💰', text: '80% der Einnahmen direkt erhalten' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(26,26,24,0.72)' }}>
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            <button
              onClick={onStart}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 24px',
                background: 'linear-gradient(135deg, #FF8A6B, #FF6B47)',
                color: '#fff', border: 'none', borderRadius: 99,
                fontSize: 15, fontWeight: 800,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(255,138,107,0.35)',
                touchAction: 'manipulation',
                width: '100%', justifyContent: 'center',
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              ✦ Jetzt Talent werden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TALENT ONBOARDING MODAL WRAPPER
// Lädt TalentOnboarding (aus Home.jsx bekannt) lazy,
// wrapped in createPortal + zIndex:10500 (Pflicht-Regel)
// ══════════════════════════════════════════════════════════════
const LazyTalentOnboarding = React.lazy(() => import('../components/TalentOnboarding.jsx'));

function TalentOnboardingModal({ onClose = () => {}, onSuccess = () => {} }) {
  return createPortal(
    <React.Suspense fallback={null}>
      <LazyTalentOnboarding
        onClose={onClose}
        onActivate={onSuccess}
      />
    </React.Suspense>,
    document.body
  );
}
