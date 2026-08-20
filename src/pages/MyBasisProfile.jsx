// src/pages/MyBasisProfile.jsx — HUI Mein Profil v1
// "Ich gestalte meine Präsenz."
// ════════════════════════════════════════════════════════════════
// Eigene Profil-Seite für Basis-User. Kein Creator-Dashboard.
// Alles inline-editierbar. Ruhig. Emotional. Human.
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { makeChunkReload } from "../lib/chunkReload.js";

// Chunk-Mismatch Recovery: lädt Seite neu wenn ein alter Chunk nicht gefunden wird
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabaseClient.js";
import {
  FB_AVATAR,
  handleAvatarUpload, handleCoverUpload,
} from "../lib/profileMedia.js";
import { NAV_RESERVED_HEIGHT_CSS, NAV_CLEARANCE_CSS } from "../components/home/navigation/navigationGeometry.js";
import { useAuth }   from "../lib/AuthContext.jsx";
import { useHome }   from "../components/home/HomeShell.jsx";
// GemeinschaftsFlow direkt importiert (kein lazy/Suspense — verhindert Klick-ohne-Reaktion-Bug)
// NotificationPanel direkt importiert (kein lazy/Suspense)
// AmbassadorModal direkt importiert (kein lazy/Suspense)
import SettingsModal from "../components/settings/SettingsModal.jsx";
import { useAmbassador } from "../hooks/useAmbassador.js";
import { useNotifications } from "../lib/useNotifications.jsx";
import { useProfileData } from "../hooks/useProfileData.js";
import { usePullToRefresh } from "../hooks/usePullToRefresh.js";
import { PullToRefreshIndicator } from "../components/ui/PullToRefreshIndicator.jsx";
import { toast } from "../lib/useToast.jsx";
// HuiStudio direkt importiert (kein lazy/Suspense)
import MeineResonanz from "./studio/MeineResonanz.jsx";
const PublicProfilePreview = React.lazy(() => import("../components/profile/PublicProfilePreview.jsx").catch(makeChunkReload("MyBasisProfile:PublicProfilePreview")));
const OrbSignatur = React.lazy(() => import("../components/profile/OrbSignatur.jsx").then(m => ({ default: m.OrbSignatur })).catch(makeChunkReload("MyBasisProfile:OrbSignatur")));
import MerkenSection from "../components/profile/MerkenSection.jsx";
import { optimizeCard } from "../lib/perfUtils.js";
// Sprint F.7D Phase 4: Kanonische Sections
const AboutSection = React.lazy(() => import("../components/profile/sections/AboutSection.jsx").then(m => ({ default: m.AboutSection })).catch(makeChunkReload("MyBasisProfile:AboutSection")));
import { ProfileHeader as CanonicalProfileHeader } from "../components/profile/ProfileHeader.jsx";
const TalentSection = React.lazy(() => import("../components/profile/sections/TalentSection.jsx").then(m => ({ default: m.TalentSection })).catch(makeChunkReload("MyBasisProfile:TalentSection")));
const RecommendationsSection = React.lazy(() => import("../components/profile/sections/RecommendationsSection.jsx").then(m => ({ default: m.RecommendationsSection })).catch(makeChunkReload("MyBasisProfile:RecommendationsSection")));
const AvailabilitySection = React.lazy(() => import("../components/profile/sections/AvailabilitySection.jsx").then(m => ({ default: m.AvailabilitySection })).catch(makeChunkReload("MyBasisProfile:AvailabilitySection")));
const VisibilitySection = React.lazy(() => import("../components/profile/sections/VisibilitySection.jsx").then(m => ({ default: m.VisibilitySection })).catch(makeChunkReload("MyBasisProfile:VisibilitySection")));
// Shared loading spinner for wizard Suspense fallbacks
const WIZARD_LOADING = (
  <div style={{position:"fixed",inset:0,zIndex:10500,background:"rgba(26,26,24,0.5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{width:36,height:36,border:"3px solid rgba(255,255,255,0.3)",borderTopColor:"#0EC4B8",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
  </div>
);

import WerkWizard from "../components/works/WerkWizard.jsx";
import TalentAngebotWizard from "../components/talents/TalentAngebotWizard.jsx";
import { useTalents, deleteTalent } from "../hooks/useTalents.js";
import ExperienceWizard from "../components/experiences/ExperienceWizard.jsx";
// AmbassadorStudioSection wird direkt importiert (kein lazy → kein Suspense-Hänger)
// HuiMomentSheet direkt importiert (kein lazy — verhindert ewigen Suspense-Spinner)
// MyRecommendationsModal direkt importiert
// ImpactStimmenModal direkt importiert
// MeineProjekteModal direkt importiert
// ImpactUpdateSheet direkt importiert
import ProfilBearbeitenModal from "../components/studio/ProfilBearbeitenModal.jsx";
import { HUIBookmarkIcon }      from "../design/icons/HuiInteractionIcons.jsx";
import {
  HUIResonanzIcon, HUITalentIcon, HUIWerkeIcon, HUIErlebnisIcon,
  HUIAmbassadorIcon, HUIEmpfehlungIcon, HUIImpactIcon, HUIFinanzIcon,
  HUIStimmeIcon, HUIProjektIcon, HUIEinAusIcon, HUIKalenderIcon,
  HUIVerkaufIcon, HUIStatistikIcon,
  HUIFotoIcon, HUIAnsichtIcon, HUISettingsIcon, HUISchreibenIcon,
} from "../design/icons/HuiSystemIcons.jsx";
import { HUILogo } from '../components/brand/HUILogo.jsx';
import { useContentPreview } from "../context/ContentPreviewContext.jsx";
// AmbassadorStudioSection direkt importiert (kein lazy/Suspense)
import HuiMomentSheet from "../components/HuiMomentSheet.jsx";
import MyRecommendationsModal from "../components/studio/MyRecommendationsModal.jsx";
import ImpactStimmenModal from "../components/studio/ImpactStimmenModal.jsx";
import MeineProjekteModal from "../components/studio/MeineProjekteModal.jsx";
import TalentOnboarding from "../components/TalentOnboarding.jsx";
import GemeinschaftsFlow from "../components/GemeinschaftsFlow.jsx";
import NotificationPanel from "../components/notifications/NotificationPanel.jsx";
import AmbassadorModal from "../components/ambassador/AmbassadorModal.jsx";
import HuiStudio from "../components/studio/HuiStudio.jsx";
import AmbassadorStudioSection from "../components/ambassador/AmbassadorStudioSection.jsx";
import ImpactUpdateSheet from "../components/studio/ImpactUpdateSheet.jsx";
import { formatDateDE, formatNumberDE } from "../lib/formatters.js";
// FinanzuebersichtModal — ersetzt 4 separate Finanz-Modals (eager, kein Lazy-Bug)
import FinanzuebersichtModal from "../components/studio/FinanzuebersichtModal.jsx";
import { useModalRegistration } from "../hooks/useModalRegistration.js";
import { useImageGallery } from "../context/ImageGalleryContext.jsx";
// ── Design Tokens ────────────────────────────────────────────────

// ── Ambassador ErrorBoundary ─────────────────────────────────────
class AmbassadorErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e, info) { console.error("[Ambassador] Render-Fehler:", e, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding:"24px 20px", textAlign:"center", color:"rgba(26,26,24,0.45)", fontSize:13 }}>
          <div style={{ fontSize:22, marginBottom:8 }}>⚠️</div>
          Ambassador-Bereich konnte nicht geladen werden.
          <br/>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop:12, padding:"8px 18px", borderRadius:99,
              background:"rgba(14,196,184,0.12)", border:"1px solid rgba(14,196,184,0.3)",
              color:"#0A9E94", fontSize:12, fontWeight: 600, cursor:"pointer", fontFamily:"inherit",
            }}
          >Nochmal versuchen</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  .mbp-root { background:#F9F7F4; font-family:Inter,sans-serif; color:${T.ink}; }
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
  @keyframes spin { to{transform:rotate(360deg)} }
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

function SectionRow({ title = "", sub = "", onEdit = () => {} }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:`0 ${T.px}px 10px` }}>
      <div>
        <div style={{ fontSize:15, fontWeight: 600, color:T.ink, letterSpacing:"-0.02em" }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:T.inkFaint, marginTop:2, fontWeight:400 }}>{sub}</div>}
      </div>
      {onEdit && (
        <button className="mbp-press-light" onClick={onEdit} style={{
          background:"none", border:"none", padding:0,
          fontSize:12, color:T.teal, fontWeight: 600,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          display:"flex", alignItems:"center", gap:3,
        }}>Bearbeiten ›</button>
      )}
    </div>
  );
}

function Sheet({ onClose = () => {}, children = null, zIndex=9800 }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex,
      background:"rgba(26,26,24,0.4)",
      display:"flex", alignItems:"flex-end",
    }}>
      <div className="mbp-sheet" onClick={e=>e.stopPropagation()} style={{
        width:"100%", background:T.bgSheet,
        borderRadius:`${T.r24}px ${T.r24}px 0 0`,
        padding:"20px 20px max(36px,calc(24px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px)))",
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
          <div style={{ fontSize:16, fontWeight: 600, color:T.ink, marginBottom:4 }}>Interessen & Werte</div>
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
            color:"white", fontSize:15, fontWeight: 600,
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
          <HUILogo size={32} style={{opacity:0.55}} />
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
          <div style={{ fontSize:16, fontWeight: 600, color:T.ink, marginBottom:4 }}>Offen für Begegnungen</div>
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
            color:"white", fontSize:15, fontWeight: 600,
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
  // savedCount entfernt (2026-07-30): keine rote Zahl am Bookmark-Icon
  const [showSettings,    setShowSettings]    = useState(false);
  // BANKDATEN-LINK (2026-08-16): Für Deep-Link aus Notification → Settings → Bankdaten
  const [settingsAutoBankdaten, setSettingsAutoBankdaten] = useState(false);
  const [showProfilEditPage, setShowProfilEditPage] = useState(false);
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

  
  // ── Back-Button: Sub-Modals registrieren ─────────────────────────
  useModalRegistration(showSettings, () => setShowSettings(false), "MyBasisProfile-Settings");

  // BANKDATEN-LINK (2026-08-16): Globaler Event-Listener — von Home.jsx
  // window.__HUI_OPEN_BANKDATEN__ dispatched 'hui:open-bankdaten' CustomEvent.
  // Öffnet Settings-Modal + setzt autoOpenBankdaten-Flag für BankdatenModal.
  useEffect(() => {
    const handler = () => {
      setSettingsAutoBankdaten(true);
      setShowSettings(true);
    };
    window.addEventListener("hui:open-bankdaten", handler);
    return () => window.removeEventListener("hui:open-bankdaten", handler);
  }, []);
  // ── Back-Button: Weitere Modals/Overlays registrieren ────────────
  // NOTE: activeDrawer/empfehlungDetail/showFinanzModal werden in MeinBereichMenu
  // registriert (separate Komponente) — hier entfernt da TDZ-Crash im Bundle.
  useModalRegistration(showGemeinschaft, () => setShowGemeinschaft(false), "MyBasisProfile-Gemeinschaft");
  useModalRegistration(showAmbModal, () => setShowAmbModal(false), "MyBasisProfile-AmbModal");
  useModalRegistration(showAmbDrawer, () => setShowAmbDrawer(false), "MyBasisProfile-AmbDrawer");
  useModalRegistration(showMomentSheet, () => setShowMomentSheet(false), "MyBasisProfile-MomentSheet");
  useModalRegistration(showPublicPreview, () => setShowPublicPreview(false), "MyBasisProfile-PublicPreview");
  useModalRegistration(showMerken, () => setShowMerken(false), "MyBasisProfile-Merken");
  useModalRegistration(showProfilEditPage, () => setShowProfilEditPage(false), "MyBasisProfile-ProfilEditPage");
  useModalRegistration(showStudio, () => setShowStudio(false), "MyBasisProfile-Studio");
  useModalRegistration(showResonanz, () => setShowResonanz(false), "MyBasisProfile-Resonanz");
  useModalRegistration(showNotifications, () => setShowNotifications(false), "MyBasisProfile-Notifications");

  // BACK-BUTTON-STACK-FIX (2026-08-15, Michael-Report): analog zum Fix in
  // NotificationButton.jsx — setShowNotifications(false) stand vorher
  // unbedingt vor dem gesamten Switch und schloss das Resonanzzentrum-Panel
  // (inkl. DetailModal darin) IMMER, auch beim Oeffnen einer reinen Entity-
  // Vorschau (openRef). Jetzt: nur noch bei echten Seitenwechseln schliessen.
  const handleNotifAction = (n) => {
    const meta = n.metadata || {};
    const targetId = meta.target_id || meta.actor_id || n.actor_id || null;
    const werkId   = meta.werk_id   || null;

    // ── RESONANZ-BUCHUNG-001 (2026-08-08): "Mit Nutzer chatten" aus dem
    //    Buchungsdetail-Modal — typunabhängig, hat Vorrang vor dem Switch ──
    if (n._openChat) {
      setShowNotifications(false);
      const chatObj = typeof n._openChat === "object" ? n._openChat : { id: n._openChat, display_name: null };
      setChatRecipient(chatObj);
      setShowChat(true);
      return;
    }
    // BANKDATEN-LINK (2026-08-16): "Bankdaten hinterlegen" aus
    // payout_bank_details_needed Notification → Settings → Bankdaten
    if (n._openBankdaten) {
      setShowNotifications(false);
      setSettingsAutoBankdaten(true);
      setShowSettings(true);
      return;
    }

    // BELEG-002: Angebot-Link aus DetailModal (_refType/_refId) — Vorschau
    // bleibt im Panel-Kontext, kein Schliessen.
    if (n._openRef && n._refType && n._refId) {
      openRef({ type: n._refType, id: n._refId });
      return;
    }
    // 1. action_url ohne Entity-Ref → echter Seitenwechsel, Panel schliessen
    if (n.action_url && !n._openRef) {
      setShowNotifications(false);
      // Intern-Routing via Typ trotzdem ausführen für nahtlose UX
    }

    switch (n.type) {
      // ── Buchungen (Talent + Erlebnis): Detail wird bereits im DetailModal
      //    selbst vollständig angezeigt (wer/was/wann/wo), kein Routing nötig ──
      case "talent_booking_paid":
      case "talent_booking_confirmed":
      case "talent_booking_cancelled":
      case "experience_booking_paid":
      case "experience_booking_confirmed":
      case "experience_booking_cancelled":
        break;
      // ── Profil öffnen ───────────────────────────────────────────────────
      case "follow":
      case "follow_request":
      case "new_follower":
        setShowNotifications(false);
        if (targetId) openProfileById(targetId);
        break;

      // ── Chat öffnen ─────────────────────────────────────────────────────
      case "begegnung":
      case "buchung":
      case "booking":
      case "message":
      case "new_message":
        setShowNotifications(false);
        if (targetId) { setChatRecipient(targetId); setShowChat(true); }
        break;

      // ── Tab-Navigation ──────────────────────────────────────────────────
      case "impact":
      case "project_update":
      case "impact_update":
        setShowNotifications(false);
        switchTab("impact");
        break;

      case "community":
      case "community_update":
        setShowNotifications(false);
        switchTab("discover");
        break;

      case "inspiration":
      case "discover":
        setShowNotifications(false);
        switchTab("discover");
        break;

      // ── Werk-Detail öffnen ──────────────────────────────────────────────
      case "work_approved": {
        // _openRef vom DetailModal → ContentPreview öffnen (preferred)
        if (n._openRef && n.entity_id) {
          openRef({ type: n.entity_type || "work", id: n.entity_id });
        } else if (werkId) {
          setShowNotifications(false);
          setShowWerkDetail(werkId);
        }
        break;
      }

      // ── Kommentar/Antwort: oeffnet den kommentierten Beitrag in der
      //    bestehenden Preview/Fullscreen-Infrastruktur (KOMMENTAR.1) ───────
      case "comment":
      case "comment_reply": {
        const cmMeta = n.metadata || {};
        const cmId   = cmMeta.post_id   || n.entity_id   || null;
        const cmType = cmMeta.post_type || n.entity_type || null;
        if (cmId && cmType) openRef({ type: cmType, id: cmId });
        break;
      }

      // ── Werk abgelehnt: Modal wird in NotifCard selbst geöffnet ─────────
      case "work_rejected":
      case "content_rejected": {
        // _openRef vom DetailModal → Werk/Inhalt öffnen zum Überarbeiten
        if (n._openRef && n.entity_id && n.entity_type) {
          const rejectType = n.entity_type === "impact_project" ? "project" : n.entity_type;
          if (["work","experience","talent"].includes(rejectType)) {
            openRef({ type: rejectType, id: n.entity_id });
          }
        }
        break;
      }

      // ── Admin / System / Broadcast: Detailansicht (kein externes Routing) ──
      case "admin":
      case "admin_broadcast":
      case "broadcast":
      case "system":
      case "info":
      case "save_digest":
        // Kein Routing — alle Infos im DetailModal
        break;

      // ── Freigaben mit entity_id → _openRef-fähig ────────────────────────────
      case "experience_approved": {
        if (n._openRef && n.entity_id) openRef({ type: "experience", id: n.entity_id });
        break;
      }
      case "experience_rejected": {
        if (n._openRef && n.entity_id) openRef({ type: "experience", id: n.entity_id });
        break;
      }
      case "impact_project_approved":
      case "impact_project_rejected":
        // Kein openRef — ImpactProject-Preview nicht via ContentPreview
        break;
      case "work_deleted":
        // Kein Routing — Modal zeigt Titel + Grund vollständig
        break;

      // ── Resonanz/Like: öffnet Inhalt wenn entity_id vorhanden ─────────────
      case "resonanz":
      case "like":
      case "save": {
        // RESONANZ.5 (2026-07-30): save → direkt zum Beitrag navigieren
        const rEntityId   = n.entity_id   || (n.metadata || {}).post_id   || null;
        const rEntityType = n.entity_type || (n.metadata || {}).post_type || null;
        if (n._openRef && rEntityId && rEntityType) {
          openRef({ type: rEntityType, id: rEntityId });
        }
        break;
      }

      // ── Support: kein Routing — Antwort im Modal lesen ─────────────────────
      case "support_ticket":
      case "support_ticket_reply":
        break;

      // ── Bestellung/Zahlung — BELEG-002: jetzt mit Routing ───────────────
      case "new_order":
      case "order_confirmed": {
        // Werk öffnen wenn entity_id vorhanden (vom DetailModal "Werk ansehen")
        const oEntityId = n.entity_id || n.metadata?.work_id || n.metadata?.entity_id || null;
        const oEntityType = n.entity_type || n.metadata?.entity_type || "work";
        if (n._openRef && oEntityId) {
          openRef({ type: oEntityType, id: oEntityId });
        }
        break;
      }

      // ── Impact-Projekt eingereicht/gelöscht → Impact-Tab ─────────────────
      case "impact_project_completed":
        // BELEG-001: Projekt-Vollfinanzierung → Projekt öffnen wenn möglich
        if (n._openRef && (n.metadata?.project_id || n.entity_id)) {
          openRef({ type: "project", id: n.metadata?.project_id || n.entity_id });
        } else {
          setShowNotifications(false);
          switchTab("impact");
        }
        break;
      case "impact_project_submitted":
      case "impact_project_deleted":
        setShowNotifications(false);
        switchTab("impact");
        break;

      // ── Inhalt gemeldet/gelöscht/freigegeben → openRef wenn entity_id da ─
      case "work_flagged":
      case "content_flagged":
      case "content_deleted":
      case "content_approved": {
        const cMeta = n.metadata || {};
        const cEntityId   = n.entity_id   || cMeta.entity_id   || null;
        const cEntityType = n.entity_type || cMeta.entity_type || null;
        if (n._openRef && cEntityId && cEntityType) {
          openRef({ type: cEntityType, id: cEntityId });
        }
        break;
      }

            // ── Geteilter Inhalt öffnen ────────────────────────────────────────────
      case "share": {
        const shareMeta = n.metadata || {};
        const shareEntityId   = n._openRef ? (n.entity_id || shareMeta.entity_id) : (shareMeta.entity_id || n.entity_id);
        const shareEntityType = n.entity_type || shareMeta.entity_type || null;
        const shareActionUrl  = n._openUrl || n.action_url || null;
        if (shareEntityId && shareEntityType) {
          openRef({ type: shareEntityType, id: shareEntityId });
        } else if (shareActionUrl) {
          setShowNotifications(false);
          const path = shareActionUrl.startsWith("http")
            ? new URL(shareActionUrl).pathname
            : shareActionUrl;
          navigate(path);
        }
        break;
      }

      default:
        // _openRef: DetailModal hat einen Entity-Link → openRef öffnen
        if (n._openRef && n.entity_id && n.entity_type) {
          openRef({ type: n.entity_type, id: n.entity_id });
        }
        // _openUrl: DetailModal hat eine URL → navigate
        else if (n._openUrl) {
          setShowNotifications(false);
          const path = n._openUrl.startsWith("http")
            ? new URL(n._openUrl).pathname
            : n._openUrl;
          navigate(path);
        }
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
    loading:         hookLoading,
    reload,
    loadLazy,
    followCounts,
  } = useProfileData(user?.id, true); // includePrivate=true → phone für eigenes Profil

  // F.9C HOTFIX: lokale Aliase erst NACH useProfileData — TDZ-Fix
  // (hooksWorks/hooksExps/hooksRecs/profile sind jetzt deklariert)
  const ambState = useAmbassador(profile);
  const [localWorks,       setLocalWorks]       = useState(null);
  const [localExperiences, setLocalExperiences] = useState(null);
  const works          = localWorks       ?? hooksWorks ?? [];
  const experiences    = localExperiences ?? hooksExps  ?? [];
  const recommendations = hooksRecs ?? [];

  // Lazy-Content laden (recommendations, works, experiences, moments) — fehlte zuvor
  useEffect(() => {
    if (profile?.id) loadLazy?.();
  }, [profile?.id, loadLazy]);
  const [showWerkWizard, setShowWerkWizard] = useState(false);
  const [showExpWizard,  setShowExpWizard]  = useState(false);
  const [editingWerk,   setEditingWerk]   = useState(null);
  const [editingExp,    setEditingExp]    = useState(null);
  const [showTalentWizard, setShowTalentWizard] = useState(false);
  const [showTalentOnboarding, setShowTalentOnboarding] = useState(false);
  const [editingTalent,    setEditingTalent]    = useState(null);
  const { talents, reload: reloadTalents } = useTalents(profile?.id);

  // ── PULL-TO-REFRESH (2026-08-17): eigenes Profil hat eigenen
  // Scroll-Container (.mbp-scroll), unabhaengig vom Home.jsx-Feed-Scroll ──
  const profileScrollRef = React.useRef(null);
  const handleProfilePullRefresh = React.useCallback(async () => {
    reload?.();
    loadLazy?.();
    reloadTalents?.();
    await new Promise(r => setTimeout(r, 400));
  }, [reload, loadLazy, reloadTalents]);
  const { pullDistance: profilePullDistance, isRefreshing: profileIsRefreshing, isTriggered: profileIsTriggered } = usePullToRefresh({
    onRefresh:  handleProfilePullRefresh,
    scrollRef:  profileScrollRef,
    threshold:  72,
    maxPull:    110,
    enabled:    true,
  });


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
    _save({ location: locationStr, location_label: locationStr });
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
        bottom:NAV_RESERVED_HEIGHT_CSS,
        zIndex:9500, /* <BottomNav(10000) — Root endet auf Tabbar-Unterkante */
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
    <Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10500,background:"rgba(249,247,244,0.85)",backdropFilter:"blur(6px)"}}><div style={{width:36,height:36,borderRadius:"50%",border:"3px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}>
    <div className="mbp-root" style={{
      position:"fixed", top:0, left:0, right:0,
      bottom:NAV_RESERVED_HEIGHT_CSS,
      zIndex:9500, /* <BottomNav(10000) — Root endet auf Tabbar-Unterkante */
      display:"flex", flexDirection:"column",
    }}>

      
{/* styles via head-inject — siehe useEffect */}

      {/* Save-Error-Toast */}
      {saveErrMsg ? (
        <div style={{
          position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
          zIndex:9999, padding:"10px 18px", borderRadius:99,
          background:"rgba(200,40,40,0.95)", color:"white",
          fontSize:12, fontWeight: 600, maxWidth:"88vw",
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
        padding:`max(14px,calc(10px + max(var(--hui-safe-top, 0px), env(safe-area-inset-top,0px)))) ${T.px}px 10px`,
        display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        flexShrink:0,
        position:"relative", zIndex:2,   /* über mbp-scroll (overflow=auto erzeugt Stacking Context) */
      }}>
        <div>
          <div style={{ fontSize:24, fontWeight: 600, color:T.ink, letterSpacing:"-0.04em",
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
            aria-label="Gemerkte Inhalte"
            style={{
              width:34, height:34, borderRadius:"50%",
              background:"rgba(26,26,24,0.06)", border:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:T.ink, cursor:"pointer", touchAction:"manipulation", flexShrink:0,
            }}
          >
            <HUIBookmarkIcon size={18} />
          </button>
          <button
            className="mbp-press-light"
            onClick={() => {
              // Öffentliches Profil via globalem Hook öffnen — eager import, kein React.lazy
              if (profile?.id && window.__HUI_OPEN_PROFILE__) {
                window.__HUI_OPEN_PROFILE__(profile.id);
              }
            }}
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

      <div className="mbp-scroll" ref={profileScrollRef} style={{ flex:1, overflowY:"auto",
        position:"relative", paddingBottom: NAV_RESERVED_HEIGHT_CSS }}>

        {/* ── Pull-to-Refresh Indikator — oben im Scroll-Container ── */}
        <PullToRefreshIndicator
          pullDistance={profilePullDistance}
          isRefreshing={profileIsRefreshing}
          isTriggered={profileIsTriggered}
        />

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
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><OrbSignatur profileId={profile?.id ?? user?.id} /></Suspense>
        )}
        <Gap h={28}/>

        {/* Meine Resonanz — verschoben in "Mein Bereich"-Menü, 2026-07-06 */}

        {/* ══ TALENT-PROFIL-LAYOUT (is_talent === true) ══════════ */}
        {profile?.is_talent ? (
          <>
            {/* T1. Über mich — kanonisch: AboutSection */}
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><AboutSection
                profile={profile}
                isOwner={true}
                onSave={(bio) => handleBioSave(bio)}
              /></Suspense>
        <Gap h={24}/>

            {/* T2. Talente (TalentSection, Skill-Tag-Pillen "Meine Talente & Angebote")
                — auf Nutzerwunsch (2026-07-05) im eigenen Dashboard ausgeblendet, wird
                nicht benoetigt. Bewusst NICHT geloescht (nur auskommentiert) fuer den
                Fall einer spaeteren Reaktivierung/Verschmelzung mit TalentAngeboteSection
                (siehe Memory #528 "vertagt"). Bleibt auf TalentProfilePage.jsx bestehen,
                dort nicht Teil dieser Anfrage. */}
            {/*
            <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><TalentSection
              profile={profile}
              isOwner={true}
              onChange={handleSkillsSave}
            /></Suspense>
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
              recommendations={recommendations}
              onTalentWizard={(t) => { setEditingTalent(t || null); setShowTalentWizard(true); }}
              onDeleteTalent={() => reloadTalents()}
              onWerkWizard={(w) => { setEditingWerk(w || null); setShowWerkWizard(true); }}
              onDeleteWerk={(id) => { setLocalWorks(null); reload(); }}
              onErlebnisWizard={(exp) => { setEditingExp(exp || null); setShowExpWizard(true); }}
              onDeleteErlebnis={(id) => { setLocalExperiences(null); reload(); }}
              onOpenResonanz={() => setShowResonanz(true)}
              onOpenMomentSheet={() => setShowMomentSheet(true)}
              onProfileUpdate={(upd) => {
                setAuthProfile && setAuthProfile(p => ({ ...p, ...upd }));
                refreshProfile?.().catch(() => {});
                reload();
              }}
            />
            <Gap h={20}/>

            {/* T5. Kundenstimmen — kanonisch: RecommendationsSection */}
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><RecommendationsSection
                recommendations={recommendations}
                isOwner={true}
                profileOwnerId={profile?.id || ""}
                profileOwnerName={profile?.display_name || profile?.nickname || ""}
              /></Suspense>
        <Gap h={24}/>



            <Gap h={24}/>

            {/* T7. Sichtbarkeit — kanonisch: VisibilitySection */}
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><VisibilitySection
                profile={profile}
                isOwner={true}
                onSave={handleVisibilitySave}
              /></Suspense>
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
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><AboutSection
                profile={profile}
                isOwner={true}
                onSave={(bio) => handleBioSave(bio)}
              /></Suspense>
        <Gap h={24}/>

            {/* B1a. Kundenstimmen — kanonisch: RecommendationsSection (auch für Basis-User) */}
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><RecommendationsSection
                recommendations={recommendations}
                isOwner={true}
                profileOwnerId={profile?.id || ""}
                profileOwnerName={profile?.display_name || profile?.nickname || ""}
              /></Suspense>
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
              recommendations={recommendations}
              onTalentWizard={(t) => { setEditingTalent(t || null); setShowTalentWizard(true); }}
              onDeleteTalent={() => reloadTalents()}
              onWerkWizard={(w) => { setEditingWerk(w || null); setShowWerkWizard(true); }}
              onDeleteWerk={(id) => { setLocalWorks(null); reload(); }}
              onErlebnisWizard={(exp) => { setEditingExp(exp || null); setShowExpWizard(true); }}
              onDeleteErlebnis={(id) => { setLocalExperiences(null); reload(); }}
              onOpenResonanz={() => setShowResonanz(true)}
              onOpenMomentSheet={() => setShowMomentSheet(true)}
              onProfileUpdate={(upd) => {
                setAuthProfile && setAuthProfile(p => ({ ...p, ...upd }));
                refreshProfile?.().catch(() => {});
                reload();
              }}
            />
            <Gap h={20}/>

            {/* B2+B4. Interessen & Werte + Offen für Begegnungen — auf Nutzerwunsch
                (2026-08-07) aus dem Basis-Profil entfernt. Bewusst NICHT geloescht
                (nur auskommentiert), Komponenten InteressenSection/OffenFuerSection
                bleiben im Code fuer den Fall einer spaeteren Reaktivierung. Die
                zugrundeliegenden DB-Spalten profiles.skills / profiles.is_available
                bleiben unangetastet (skills hat fuer Talent-User in
                TalentProfilePage.jsx eine andere, weiterhin aktive Bedeutung
                "Professionelle Skills" — siehe ProfilBearbeitenModal.jsx Kommentar). */}

            {/* B5. Sichtbarkeit — kanonisch: VisibilitySection */}
        <Suspense fallback={<div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 0",opacity:0.4}}><div style={{width:24,height:24,borderRadius:"50%",border:"2px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}><VisibilitySection
                profile={profile}
                isOwner={true}
                onSave={handleVisibilitySave}
              /></Suspense>
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

      {/* MEINE MOMENTE SHEET — createPortal direkt zu body, zIndex 11000 (über Drawer 10500)
          Suspense INNERHALB des Portals — nicht darum (sonst rendert Portal nicht) */}
      {showMomentSheet && createPortal(
        <HuiMomentSheet
            visible={showMomentSheet}
            onClose={() => setShowMomentSheet(false)}
            visibilityScope="public"
          />
        ,
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
            paddingBottom:"calc(16px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))",
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
                <span style={{ fontSize:16, fontWeight: 600, color:"#1A1A18" }}>Ambassador-Bereich</span>
              </div>
              <button onClick={() => setShowAmbDrawer(false)} style={{
                background:"none", border:"none", cursor:"pointer",
                fontSize:18, color:"rgba(26,26,24,0.45)", padding:4,
                fontFamily:"inherit",
              }}>✕</button>
            </div>
            {/* AmbassadorStudioSection direkt — kein lazy/Suspense nötig */}
            <AmbassadorErrorBoundary>
        <AmbassadorStudioSection profile={profile} />
        </AmbassadorErrorBoundary>
          </div>
        </div>,
        document.body
      )}

      {/* GEMEINSCHAFT FLOW MODAL */}
      {showGemeinschaft && (
        <GemeinschaftsFlow
          onClose={() => setShowGemeinschaft(false)}
          onComplete={() => {
            setShowGemeinschaft(false);
            // Sprint F.7D P2: reload() übernimmt is_talent-Aktualisierung
            refreshProfile?.().catch(() => {});
            reload();
          }}
        />
      )}

      {/* SETTINGS MODAL — eigenes Suspense, damit die Seite beim Laden nicht blank geht */}
      {showSettings && (
          <SettingsModal
            profile={profile}
            onClose={() => { setShowSettings(false); setSettingsAutoBankdaten(false); }}
            autoOpenBankdaten={settingsAutoBankdaten}
            onProfileUpdate={(updated) => {
              refreshProfile?.().catch(() => {});
            }}
            onEditProfile={() => {
              setShowSettings(false);
              setShowProfilEditPage(true);
            }}
            onOpenBookings={() => {
              setShowSettings(false);
              if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hui:openBookings"));
            }}
          />
      )}
      {showProfilEditPage && (
          <ProfilBearbeitenModal
            profile={profile}
            onClose={() => setShowProfilEditPage(false)}
            onProfileUpdate={() => { refreshProfile?.().catch(() => {}); setShowProfilEditPage(false); }}
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
            // HEADER-ZU-WEIT-OBEN-FIX (2026-08-18, Michael-Screenshot): Header lag
            // unter Statusleiste (Uhrzeit/Akku), da kein Safe-Area-Top-Padding gesetzt
            // war. Fix: SSOT-Pattern wie in MeinHUI.jsx/PostFullscreenView.jsx —
            // max(CSS-Var, Fallback-px, env()) statt reinem "12px 16px".
            paddingTop:"max(var(--hui-safe-top, 0px), 14px, env(safe-area-inset-top, 14px))",
            paddingBottom:"12px",
            paddingLeft:"16px",
            paddingRight:"16px",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            backdropFilter:"blur(2px)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ display:"flex", color:"#1A1A2E" }}><HUIBookmarkIcon size={18} /></span>
              <span style={{ fontSize:15, fontWeight: 600, color:"#1A1A2E", letterSpacing:"-0.02em" }}>
                Gemerkte Inhalte
              </span>
            </div>
            <button
              onClick={() => setShowMerken(false)}
              style={{
                padding:"6px 14px", borderRadius:20,
                background:"rgba(26,26,46,0.08)", border:"1px solid rgba(26,26,46,0.10)",
                fontSize:12, fontWeight: 600, color:"rgba(26,26,46,0.55)",
                cursor:"pointer", touchAction:"manipulation",
              }}
            >✕ Schließen</button>
          </div>
          {/* Content */}
          <div style={{ padding:"16px" }}>
        <MerkenSection
              onClose={() => setShowMerken(false)}
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
        <Suspense fallback={<div style={{position:"fixed",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:10500,background:"rgba(249,247,244,0.85)",backdropFilter:"blur(6px)"}}><div style={{width:36,height:36,borderRadius:"50%",border:"3px solid rgba(22,215,197,0.2)",borderTopColor:"#16D7C5",animation:"hui-spin 0.7s linear infinite"}}/></div>}>
        <PublicProfilePreview
            profileId={profile.id}
            onClose={() => setShowPublicPreview(false)}
          />
        </Suspense>
        )}

      {/* HUI STUDIO MODAL */}
      {showStudio && (
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
      )}

      {/* ❤️ MEINE RESONANZ */}
      {showResonanz && (
        <MeineResonanz
          onClose={() => setShowResonanz(false)}
          onNavigate={(type, navId) => {
            setShowResonanz(false);
          }}
        />
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
        <NotificationPanel
          userId={profile.id}
          onClose={() => setShowNotifications(false)}
          onUnreadChange={setUnreadCount}
          onAction={handleNotifAction}
        />
      )}


      {/* WERK WIZARD */}
      {showWerkWizard && profile?.id && (
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
        <TalentAngebotWizard
          userId={profile.id}
          existingTalent={editingTalent}
          onClose={() => { setShowTalentWizard(false); setEditingTalent(null); }}
          onSaved={() => { setShowTalentWizard(false); setEditingTalent(null); reloadTalents(); }}
        />
      )}

      {/* EXPERIENCE WIZARD */}
      {showExpWizard && profile?.id && (
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
      )}
    </div>
    </Suspense>
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
  const { openRef } = useContentPreview();
  const [moments, setMoments]       = React.useState([]);
  const [loading, setLoading]       = React.useState(true);
  const [confirmMoment, setConfirmMoment] = React.useState(null);

  // ── Daten laden (beitraege, type='moment') ────────────────────────
  const loadMoments = React.useCallback(() => {
    if (!profile?.id) return;
    supabase
      .from("beitraege")
      .select("id, src, type, caption, content, moment_source, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) setMoments(data);
        setLoading(false);
      });
  }, [profile?.id]);

  React.useEffect(() => {
    setLoading(true);
    loadMoments();
  }, [loadMoments]);

  // ── Nach Upload sofort neu laden (HuiMomentSheet dispatcht "feed-refresh") ──
  // BUGFIX (2026-08-18): Vorherige Version rief hier faelschlich refreshProfile()
  // auf — diese Variable existiert in MeinMomenteDrawerContent NICHT (nur in der
  // MyBasisProfile-Hauptkomponente, siehe deren eigenes dediziertes Pull-to-Refresh
  // via profileScrollRef/usePullToRefresh, Zeile ~805). Das verursachte
  // "refreshProfile is not defined" ReferenceError + kompletten Profil-Crash.
  // Zurueck auf Original: nur loadMoments().
  React.useEffect(() => {
    const handler = () => { loadMoments(); };
    window.addEventListener("feed-refresh", handler);
    return () => window.removeEventListener("feed-refresh", handler);
  }, [loadMoments]);

  // ── Löschen ──────────────────────────────────────────────────────────
  const handleDeleteClick = (e, m) => {
    e.stopPropagation();
    setConfirmMoment(m);
  };

  const handleConfirmDelete = async () => {
    const m = confirmMoment;
    setConfirmMoment(null);
    if (!m?.id) return;
    try {
      await supabase.from("beitraege").delete().eq("id", m.id);
      setMoments(prev => prev.filter(x => x.id !== m.id));
    } catch(e) { console.error("Moment löschen:", e); }
  };

  // ── Loading-Shimmer ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding:`0 ${T.px}px` }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{
              width:"100%", aspectRatio:"1/1", borderRadius:T.r12,
              background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
              backgroundSize:"200% 100%", animation:"mbp-shimmer 1.4s ease-in-out infinite",
            }}/>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Löschen-Bestätigung (Portal, >BottomNav) ────────── */}
      {confirmMoment && createPortal(
        <div onClick={() => setConfirmMoment(null)}
          style={{ position:"fixed", inset:0, zIndex:10500,
            background:"rgba(0,0,0,0.55)", display:"flex",
            alignItems:"center", justifyContent:"center", padding:24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#fff", borderRadius:16, padding:"24px 20px 20px",
              maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)" }}>
            <div style={{ textAlign:"center", marginBottom:8, display:"flex",
              justifyContent:"center", color:"#F59E0B", fontSize:32 }}>⚠️</div>
            <div style={{ fontSize:16, fontWeight: 600, textAlign:"center",
              marginBottom:6, color:"#1A1A18" }}>
              Moment löschen?
            </div>
            <div style={{ fontSize:13, color:"#666", textAlign:"center",
              lineHeight:1.5, marginBottom:20 }}>
              Dieser Moment wird unwiderruflich gelöscht.
            </div>
            <button onClick={handleConfirmDelete}
              style={{ width:"100%", padding:"12px", borderRadius:99,
                background:"#ff3b3b", border:"none", color:"#fff",
                fontSize:14, fontWeight: 600, cursor:"pointer",
                fontFamily:"inherit", marginBottom:8 }}>
              Ja, endgültig löschen
            </button>
            <button onClick={() => setConfirmMoment(null)}
              style={{ width:"100%", padding:"12px", borderRadius:99,
                background:"#f0f0ee", border:"none", color:"#444",
                fontSize:14, fontWeight:600, cursor:"pointer",
                fontFamily:"inherit" }}>Abbrechen</button>
          </div>
        </div>,
        document.body
      )}

      <div style={{ padding:`0 ${T.px}px` }}>
        {/* ── Header ────────────────────────────────────────── */}
        <div style={{ fontSize:12, color:"#8C8C85", marginBottom:12 }}>
          {moments.length > 0
            ? `${moments.length} ${moments.length === 1 ? "Moment" : "Momente"} geteilt`
            : "Fotos, Gedanken oder Videos"}
        </div>

        {/* ── Kachel-Grid 3-spaltig ─── */}
        {moments.length > 0 && (
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(3,1fr)",
            gap:10, marginBottom:12,
          }}>
            {moments.map((m, i) => {
              const mediaSrc = m.src || m.media_url;
              const isVideo  = m.type === "video" || (mediaSrc && mediaSrc.match(/\.mp4|\.mov|\.webm/i));
              const label    = m.caption || (isVideo ? "Video" : "Foto");
              return (
              <div key={m.id || i}
                onClick={() => openRef({ type:"moment", id:m.id })}
                style={{
                  width:"100%", aspectRatio:"1/1",
                  borderRadius:T.r12, overflow:"hidden",
                  background:"#e8e4de", position:"relative",
                  boxShadow:"0 0 0 2px #0EC4B8",
                  cursor:"pointer",
                }}>
                {/* Bild / Video-Vorschau */}
                {mediaSrc
                  ? (isVideo
                    ? <video src={mediaSrc} muted playsInline preload="metadata"
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <img loading="lazy" decoding="async" src={mediaSrc} alt=""
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}
                        onError={e => e.target.style.display = "none"}/>)
                  : <div style={{ width:"100%", height:"100%", display:"flex",
                      alignItems:"center", justifyContent:"center" }}>
                      <HUILogo size={32} style={{opacity:0.5}}/>
                    </div>
                }
                {/* X-Löschen-Button oben rechts */}
                <button
                  onClick={(e) => handleDeleteClick(e, m)}
                  style={{
                    position:"absolute", top:4, right:4,
                    width:20, height:20, borderRadius:"50%",
                    background:"rgba(0,0,0,0.65)", border:"none",
                    color:"#fff", fontSize:11, fontWeight: 600,
                    cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    lineHeight:1, padding:0, zIndex:2,
                  }}
                >✕</button>
                {/* Live-Badge unten — identisch zu Talent-Angeboten */}
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background:"rgba(14,196,184,0.92)",
                  fontSize:9, fontWeight: 600, color:"#fff",
                  padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
                }}>
                  ✅ Live
                </div>
                {/* Titel/Caption oben — identisch zu Talent-Angeboten */}
                <div style={{
                  position:"absolute", top:0, left:0, right:0,
                  background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                  padding:"3px 22px 3px 5px", whiteSpace:"nowrap",
                  overflow:"hidden", textOverflow:"ellipsis",
                }}>
                  {isVideo ? "🎥 " : "📷 "}{label}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* ── Empty-State (nur als kleine Kachel, nicht als großer Block) ── */}
        {moments.length === 0 && (
          <div style={{ marginBottom:12 }}>
            <div onClick={onOpenMomentSheet} style={{
              width:"30%", aspectRatio:"1/1",
              borderRadius:T.r12, overflow:"hidden",
              background:"#F7F5F0", position:"relative", cursor:"pointer",
              border:`1.5px dashed rgba(14,196,184,0.4)`,
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:4,
            }}>
              <HUIFotoIcon size={22} style={{color:"rgba(14,196,184,0.55)"}}/>
              <div style={{ fontSize:9, fontWeight:600, color:"rgba(26,26,24,0.4)",
                textAlign:"center", lineHeight:1.2, padding:"0 4px" }}>
                Ersten Moment teilen
              </div>
            </div>
          </div>
        )}

        {/* ── "+ Moment hinzufügen" Button (identisch zu Talent-Angeboten) ── */}
        <button className="mbp-press-light" onClick={onOpenMomentSheet} style={{
          display:"flex", alignItems:"center", gap:8,
          padding:"8px 14px", borderRadius:T.r12,
          background:T.tealSoft, border:`1px solid ${T.tealMid}`,
          fontSize:12.5, fontWeight: 600, color:T.teal,
          cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
          width:"100%",
        }}>
          <span style={{
            width:18, height:18, borderRadius:"50%", flexShrink:0,
            background:T.teal, color:"#fff", fontSize:13, fontWeight: 600,
            display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1,
          }}>+</span>
          Moment hinzufügen
        </button>
      </div>
    </>
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
          fontSize:11, fontWeight: 600, color:T2.teal,
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
            <div style={{fontSize:18, fontWeight: 600, color:T2.teal}}>{value}</div>
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
          <div style={{fontSize:11, fontWeight: 600, color:T2.teal, marginBottom:4}}>
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
            fontSize:11, fontWeight: 600, cursor:"pointer", fontFamily:"inherit",
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
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
          <span className="hui-emoji">🌱</span> Du bist Teil der Gemeinschaft
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Gestalte dein Profil und werde sichtbar.
        </div>
      </div>


      {/* Meine Werke */}
      <div style={{ fontSize: 13, fontWeight: 600, color: T.inkSoft, marginBottom: 12, letterSpacing: "0.05em" }}>
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
          fontSize: 13, fontWeight: 600, color: "#fff",
        }}>
          + Werk hinzufügen
        </button>
      </div>

      {/* Meine Erlebnisse */}
      <div style={{ fontSize: 13, fontWeight: 600, color: T.inkSoft, marginBottom: 12, letterSpacing: "0.05em" }}>
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
          fontSize: 13, fontWeight: 600, color: "#fff",
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
          <div style={{ fontSize:13, fontWeight: 600, color:T.ink, marginBottom:1 }}>
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
            fontSize:12, fontWeight: 600,
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


// ITEM-ACTION-CHOICE (2026-08-16, Michael-Feedback Screenshot "Meine Werke"):
// Klick auf ein Werk/Talent/Erlebnis in "Mein Bereich" oeffnete bisher IMMER
// direkt den Bearbeiten-Wizard. Michael will zusaetzlich die Moeglichkeit,
// den Beitrag GENAUSO anzusehen wie er im Home-Feed erscheint -- ueber den
// bereits bestehenden, app-weiten Oeffnen-Mechanismus openRef({type,id})
// (ContentPreviewContext.jsx -> PostFullscreenView/ContentPreviewSheet,
// exakt dieselbe Ansicht wie im Feed). Fix: kleine Auswahl-Sheet zwischen
// Karten-Klick und Wizard/Ansicht -- additiv, kein bestehendes Verhalten
// entfernt (Wizard bleibt via "bearbeiten" weiterhin 1 Klick entfernt).
// createPortal(document.body) + zIndex 10500 Pflicht fuer neue Modals
// (siehe footer-navbar-zindex.md).
function DraftActionSheet({ label, onPublish, onEdit, onDelete = null, onCancel }) {
  // DRAFT-ACTION (2026-08-20, Michael-Request): Beim Klick auf einen Entwurf
  // im Mein-Bereich erscheint dieses Sheet statt des normalen Aktions-Menüs.
  // Optionen: Veröffentlichen (→ Einreichen zur Prüfung) oder Bearbeiten.
  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10500,
      background:"rgba(0,0,0,0.55)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:"24px",
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:16, padding:"22px 20px 20px",
        maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
        fontFamily:"Inter, sans-serif",
      }}>
        <div style={{ fontSize:16, fontWeight: 600, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
          {label} als Entwurf
        </div>
        <div style={{ fontSize:13, color:"#888", textAlign:"center", marginBottom:18, lineHeight:1.4 }}>
          Was möchtest du mit diesem Entwurf tun?
        </div>
        <button onClick={onPublish} style={{
          width:"100%", padding:"13px", borderRadius:99,
          background:"#0EC4B8", border:"none", color:"#fff",
          fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit", marginBottom:10,
        }}>
          Veröffentlichen
        </button>
        <button onClick={onEdit} style={{
          width:"100%", padding:"13px", borderRadius:99,
          background:"rgba(14,196,184,0.08)", border:"1.5px solid rgba(14,196,184,0.35)",
          color:"#0EC4B8", fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit", marginBottom:10,
        }}>
          Bearbeiten
        </button>
        {onDelete && (
          <button onClick={onDelete} style={{
            width:"100%", padding:"13px", borderRadius:99,
            background:"rgba(255,59,59,0.08)", border:"1.5px solid rgba(255,59,59,0.30)",
            color:"#ff3b3b", fontSize:14, fontWeight: 600, cursor:"pointer",
            fontFamily:"inherit", marginBottom:10,
          }}>
            Entwurf löschen
          </button>
        )}
        <button onClick={onCancel} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#f0f0ee", border:"none", color:"#444",
          fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit",
        }}>
          Abbrechen
        </button>
      </div>
    </div>,
    document.body
  );
}

function ItemActionChoiceSheet({ label, onEdit, onView, onDelete = null, onCancel }) {
  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10500, /* >BottomNav(10000) */
      background:"rgba(0,0,0,0.55)", display:"flex",
      alignItems:"center", justifyContent:"center", padding:"24px",
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"#fff", borderRadius:16, padding:"22px 20px 20px",
        maxWidth:320, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
        fontFamily:"Inter, sans-serif",
      }}>
        <div style={{ fontSize:16, fontWeight: 600, textAlign:"center", marginBottom:18, color:"#1a1a18" }}>
          Was möchtest du tun?
        </div>
        <button onClick={onEdit} style={{
          width:"100%", padding:"13px", borderRadius:99,
          background:"#0EC4B8", border:"none", color:"#fff",
          fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit", marginBottom:10,
        }}>
          {label} bearbeiten
        </button>
        <button onClick={onView} style={{
          width:"100%", padding:"13px", borderRadius:99,
          background:"rgba(14,196,184,0.08)", border:"1.5px solid rgba(14,196,184,0.35)",
          color:"#0EC4B8", fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit", marginBottom:10,
        }}>
          {label} ansehen
        </button>
        {/* ITEM-ACTION-CHOICE-DELETE (2026-08-17, Michael-Feedback): Loeschen
            zusaetzlich direkt im Popup, nicht nur ueber die kleine X-Ecke auf
            der Karte -- bessere Auffindbarkeit. Oeffnet dieselbe bestehende
            Delete*Confirm-Bestaetigung wie der X-Button (kein Duplikat,
            Wiederverwendung der schon vorhandenen Loesch-Logik). */}
        {onDelete && (
          <button onClick={onDelete} style={{
            width:"100%", padding:"13px", borderRadius:99,
            background:"rgba(255,59,59,0.08)", border:"1.5px solid rgba(255,59,59,0.30)",
            color:"#ff3b3b", fontSize:14, fontWeight: 600, cursor:"pointer",
            fontFamily:"inherit", marginBottom:10,
          }}>
            {label} löschen
          </button>
        )}
        <button onClick={onCancel} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#f0f0ee", border:"none", color:"#444",
          fontSize:14, fontWeight: 600, cursor:"pointer",
          fontFamily:"inherit",
        }}>
          Abbrechen
        </button>
      </div>
    </div>,
    document.body
  );
}

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
        <div style={{ fontSize:36, textAlign:"center", marginBottom:8 }}><span className="hui-emoji">🗑</span>️</div>
        <div style={{ fontSize:16, fontWeight: 600, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
          Werk unwiderruflich löschen?
        </div>
        <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
          <strong>„{werk.title || 'Dieses Werk'}"</strong> wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
        </div>
        <button onClick={onConfirm} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#ff3b3b", border:"none", color:"#fff",
          fontSize:14, fontWeight: 600, cursor:"pointer",
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
        <div style={{ fontSize:36, textAlign:"center", marginBottom:8 }}><span className="hui-emoji">🗑</span>️</div>
        <div style={{ fontSize:16, fontWeight: 600, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
          Talent-Angebot unwiderruflich löschen?
        </div>
        <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
          <strong>„{talent.title || 'Dieses Angebot'}"</strong> wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
        </div>
        <button onClick={onConfirm} style={{
          width:"100%", padding:"12px", borderRadius:99,
          background:"#ff3b3b", border:"none", color:"#fff",
          fontSize:14, fontWeight: 600, cursor:"pointer",
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

function MeinBereichDrawer({ title, icon, subtitle, onClose, children, footer = true }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:10500,
        background:"rgba(26,26,24,0.55)",
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        fontFamily:"Inter,sans-serif",
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
        {/* Header: Icon + Titel nebeneinander, Subtitle darunter, dann Trennlinie */}
        <div style={{
          padding:"8px 20px 14px", flexShrink:0,
          borderBottom:"1px solid rgba(26,26,24,0.08)",
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            {/* Icon + Titel in einer Zeile */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ display:"flex", alignItems:"center", color:"rgba(14,196,184,0.9)", flexShrink:0 }}>{icon}</span>
              <span style={{ fontSize:17, fontWeight: 600, color:"#1A1A18", letterSpacing:"-0.02em" }}>{title}</span>
            </div>
            <button onClick={onClose} style={{
              background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer",
              borderRadius:"50%", width:32, height:32,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, color:"rgba(26,26,24,0.52)",
            }}>✕</button>
          </div>
          {/* Subtitle direkt unter dem Titel, über der Trennlinie */}
          {subtitle && (
            <div style={{ fontSize:12, color:"#8C8C85", marginTop:4, paddingLeft:0 }}>{subtitle}</div>
          )}
        </div>
        {/* Inhalt scrollbar */}
        {/* SYSTEM-NAVBAR-SAFETY-FIX (2026-08-11): mind. 50px + Safe-Area-Inset
            Abstand zur System-UI-Navigationsleiste (Android Gesten-/Softkeys) */}
        <div style={{
          flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch", willChange:"transform", overscrollBehavior:"contain",
          scrollbarWidth:"none", padding: footer ? undefined : "0 0 calc(50px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))",
        }}>
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div style={{ padding:"12px 20px calc(50px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))", borderTop:"1px solid rgba(26,26,24,0.08)", flexShrink:0 }}>
            <button onClick={onClose} style={{
              width:"100%", padding:"13px", borderRadius:14, border:"none",
              cursor:"pointer", background:"rgba(26,26,24,0.08)",
              color:"rgba(26,26,24,0.52)", fontSize:14, fontWeight: 600,
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
        <div style={{ fontSize:14, fontWeight: 600, color:"#1A1A18" }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:"rgba(26,26,24,0.5)", marginTop:1 }}>{desc}</div>}
      </div>
      <span style={{ color:"rgba(26,26,24,0.32)", fontSize:17 }}>›</span>
    </button>
  );
}

// MEIN-BEREICH-UPDATE-DOT (2026-08-15, Michael-Request): "wenn ein Update
// vom SADB kommt wie z.b ein Werk wurde freigegeben. oder du tätigst eine
// Buchung und bekommst einen Beleg. dann soll 'Mein Bereich' einen roten
// Punkt oben rechts vom Kreis am Kreisrand angezeigt werden". showDot ist
// additiv/optional (Default false) -- bestehende Aufrufer ohne den Prop
// verhalten sich unveraendert.
function MeinBereichTile({ icon, label, onPress, showDot = false }) {
  return (
    <button
      onClick={onPress}
      aria-label={showDot ? `${label} — neues Update` : label}
      className="mbp-press-light"
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:8,
        background:"none", border:"none", cursor:"pointer", fontFamily:"inherit",
        padding:"4px 2px", WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
      }}
    >
      <span style={{ position:"relative", flexShrink:0 }}>
        <span style={{
          width:52, height:52, borderRadius:"50%",
          background:"rgba(14,196,184,0.10)", border:"1px solid rgba(14,196,184,0.22)",
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0, color:"rgba(14,196,184,0.85)",
        }}>{icon}</span>
        {showDot && (
          <span style={{
            position:"absolute", top:-2, right:-2,
            width:11, height:11, borderRadius:"50%",
            background:"#EF4444", border:"2px solid #FFFFFF",
            boxShadow:"0 1px 3px rgba(239,68,68,0.45)",
          }} aria-hidden="true"/>
        )}
      </span>
      <span style={{
        fontSize:11, fontWeight:600, color:"rgba(26,26,24,0.75)",
        textAlign:"center", lineHeight:1.3, maxWidth:72,
        wordBreak:"normal", overflowWrap:"anywhere", hyphens:"auto",
        whiteSpace:"normal",
      }} lang="de">{label}</span>
    </button>
  );
}

function MeinBereichMenu({
  profile, isTalent,
  talents, works, experiences, recommendations = [],
  onTalentWizard, onDeleteTalent,
  onWerkWizard, onDeleteWerk,
  onErlebnisWizard, onDeleteErlebnis,
  onOpenResonanz = () => {},
  onOpenMomentSheet: onOpenMomentSheetProp = null,
  onProfileUpdate = () => {},
}) {
  const { switchTab } = useHome();
  const [activeDrawer, setActiveDrawer] = useState(null); // talente|werke|erlebnisse|momente|ambassador|empfehlungen|impact|finanzen

  // MEIN-BEREICH-UPDATE-DOT (2026-08-15, Michael-Request) -- SSOT ist die
  // bestehende notifications-Tabelle + is_read (siehe Memory #637/#877,
  // exakt dasselbe Feld, das schon den Resonanzzentrum-Glocken-Badge
  // fuellt). Kein neues Feld/keine neue Tabelle noetig -- nur eine neue
  // GRUPPIERUNG der bereits vorhandenen Daten nach Kachel. useNotifications()
  // ist mehrfach-mount-sicher (Realtime-Channel-Dedupe ueber Topic-Name),
  // daher unbedenklich hier zusaetzlich aufgerufen (Resonanzzentrum-Panel
  // selbst ruft den Hook ebenfalls separat auf).
  const { items: notifItems, markRead: markNotifRead } = useNotifications();

  // type -> Kachel-Zuordnung. Nur "wichtige" SADB-Updates (Freigabe-
  // Entscheidungen + Buchungs-/Kaufbelege) loesen den Punkt aus -- bewusst
  // NICHT jede Interaktion (Kommentar/Like/Follower), die bleiben
  // ausschliesslich im Resonanzzentrum sichtbar (kein zweiter Kanal fuer
  // dieselbe Info, sonst zwei widersprechende Signale).
  const TILE_NOTIF_TYPES = {
    werke:        ["work_approved", "work_rejected"],
    talente:      ["talent_approved", "talent_rejected"],
    erlebnisse:   ["experience_approved", "experience_rejected", "project_approved", "project_rejected", "impact_project_approved", "impact_project_rejected", "impact_project_submitted"],
    // FINANZ-DOT-FIX (2026-08-16): "experience_booking_paid" (Verkäufer, Neue
    // Buchung) + "experience_booking_confirmed" (Käufer, Buchung bestätigt)
    // fehlten hier -- Erlebnis-Buchungen loesten dadurch NIE den roten Punkt
    // aus, obwohl exakt dieselben Typen bereits im NotificationPanel/
    // NotificationButton/useNotifications.jsx bekannt sind (siehe dort).
    // Werk-Kauf (new_order/order_confirmed) und Talent-Buchung
    // (talent_booking_paid/talent_booking_confirmed) waren bereits korrekt.
    finanzen:     ["order_confirmed", "new_order", "order", "talent_booking_paid", "talent_booking_confirmed", "experience_booking_paid", "experience_booking_confirmed", "support_received", "support_succeeded"],
  };
  const unreadNotifTypes = new Set((notifItems || []).filter(n => !n.is_read).map(n => n.type));
  const hasTileDot = (tileKey) => (TILE_NOTIF_TYPES[tileKey] || []).some(t => unreadNotifTypes.has(t));

  // Beim Oeffnen der Kachel: alle zugehoerigen Notifications als gelesen
  // markieren -- der Punkt verschwindet, sobald der Nutzer den Bereich
  // gesehen hat (gleiches Prinzip wie das Oeffnen des Resonanzzentrums).
  const openDrawerAndClearDot = (tileKey, drawerKey, extra) => {
    const types = TILE_NOTIF_TYPES[tileKey] || [];
    (notifItems || []).forEach(n => {
      if (!n.is_read && types.includes(n.type)) markNotifRead(n.id);
    });
    if (extra) extra();
    setActiveDrawer(drawerKey);
  };

  // PRELOAD: Wenn ein Drawer geöffnet wird, sofort die zugehörigen Wizard-Chunks
  // preloaden, damit der "Hinzufügen"-Button instant reagiert.
  useEffect(() => {
    if (activeDrawer === "werke") {
      import("../components/works/WerkWizard.jsx").catch(() => {});
    } else if (activeDrawer === "erlebnisse") {
      import("../components/experiences/ExperienceWizard.jsx").catch(() => {});
    } else if (activeDrawer === "talente") {
      import("../components/talents/TalentAngebotWizard.jsx").catch(() => {});
    }
  }, [activeDrawer]);
  // openMomentSheet: delegiert immer an Parent (onOpenMomentSheetProp)
  // Falls kein Prop: fallback auf leere Funktion (sollte nie passieren)
  const openMomentSheet = onOpenMomentSheetProp ?? (() => {
    console.warn("[MeinBereichMenu] openMomentSheet aufgerufen ohne Parent-Prop");
  });
  const [impactDetail, setImpactDetail] = useState(null); // stimmen|projekte
  const [empfehlungDetail, setEmpfehlungDetail] = useState(null); // incoming|outgoing
  const [showFinanzModal, setShowFinanzModal] = useState(false); // Finanzübersicht Modal
  const [activeTab, setActiveTab] = useState("erlebnisse"); // erlebnisse | impact
  const [showUpdateSheet, setShowUpdateSheet] = useState(false);
  const [updateTargetProject, setUpdateTargetProject] = useState(null);
  const [showProfilEdit, setShowProfilEdit] = useState(false);

  // ── Back-Button: MeinBereichMenu Sub-Modals registrieren ────────
  // BACK-BUTTON-FIX (2026-08-11): MeinBereichDrawer muss registriert werden
  // — sonst faellt die Zuruecktaste durch zum Tab-Wechsel, waehrend der Drawer
  // noch sichtbar ist (=> weisser Bildschirm).
  useModalRegistration(!!activeDrawer, () => setActiveDrawer(null), "MeinBereichDrawer");
  useModalRegistration(!!impactDetail, () => setImpactDetail(null), "MeinBereichMenu-ImpactDetail");
  useModalRegistration(showFinanzModal, () => setShowFinanzModal(false), "MeinBereichMenu-FinanzModal");
  useModalRegistration(showUpdateSheet, () => setShowUpdateSheet(false), "MeinBereichMenu-UpdateSheet");
  useModalRegistration(showProfilEdit, () => setShowProfilEdit(false), "MeinBereichMenu-ProfilEdit");

  const close = () => setActiveDrawer(null);

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      {/* Titel außerhalb der Kachel */}
      <div style={{ fontSize:15, fontWeight: 600, color:T.ink, marginBottom:10, letterSpacing:"-0.01em" }}>
        Mein Bereich
      </div>

      <div style={{
        background:T.bgCard, borderRadius:T.r20,
        border:`1px solid ${T.border}`, boxShadow:T.card,
        padding:"18px 18px 20px",
      }}>
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(4, 1fr)",
          rowGap:18, columnGap:4,
        }}>
          {isTalent && (
            <MeinBereichTile icon={<HUIWerkeIcon size={22}/>} label="Meine Werke" showDot={hasTileDot("werke")} onPress={() => openDrawerAndClearDot("werke", "werke")} />
          )}
          {isTalent && (
            <MeinBereichTile icon={<HUITalentIcon size={22}/>} label="Talent-Angebote" showDot={hasTileDot("talente")} onPress={() => openDrawerAndClearDot("talente", "talente")} />
          )}
          {isTalent && (
            <MeinBereichTile icon={<HUIErlebnisIcon size={22}/>} label="Erlebnisse & Projekte" showDot={hasTileDot("erlebnisse")} onPress={() => openDrawerAndClearDot("erlebnisse", "erlebnisse")} />
          )}
          <MeinBereichTile icon={<HUIFotoIcon size={22}/>} label="Meine Momente" onPress={() => setActiveDrawer("momente")} />
          <MeinBereichTile icon={<HUIImpactIcon size={22}/>} label="Impact & Stimmen" onPress={() => setActiveDrawer("impact")} />
          <MeinBereichTile icon={<HUIFinanzIcon size={22}/>} label="Käufe/Verkäufe" showDot={hasTileDot("finanzen")} onPress={() => openDrawerAndClearDot("finanzen", null, () => setShowFinanzModal(true))} />
          <MeinBereichTile icon={<HUIResonanzIcon size={22}/>} label="Meine Resonanz" onPress={onOpenResonanz} />
          <MeinBereichTile icon={<HUIEmpfehlungIcon size={22}/>} label="Empfehlungen" onPress={() => setActiveDrawer("empfehlungen")} />
        </div>
      </div>

      {/* ── Talent-Angebote ─────────────────────────────────── */}
      {activeDrawer === "talente" && (
        <MeinBereichDrawer title="Talent-Angebote" icon={<HUITalentIcon size={18}/>} subtitle="Deine buchbaren Leistungen & Dienstleistungen." onClose={close} footer={false}>
          <TalentAngeboteSection
            talents={talents}
            onTalentWizard={onTalentWizard}
            onDeleteTalent={onDeleteTalent}
          />
        </MeinBereichDrawer>
      )}

      {/* ── Meine Werke ──────────────────────────────────────── */}
      {activeDrawer === "werke" && (
        <MeinBereichDrawer title="Meine Werke" icon={<HUIWerkeIcon size={18}/>} subtitle="Deine veröffentlichten Kreationen." onClose={close} footer={false}>
          <MeineWerkeSection
            works={works}
            onWerkWizard={onWerkWizard}
            onDeleteWerk={onDeleteWerk}
          />
        </MeinBereichDrawer>
      )}

      {/* ── Erlebnisse & Projekte ────────────────────────────── */}
      {activeDrawer === "erlebnisse" && (
        <MeinBereichDrawer title="Erlebnisse & Projekte" icon={<HUIErlebnisIcon size={18}/>} subtitle="Deine Erlebnisse, Events und Herzensprojekte." onClose={close} footer={false}>
          {/* Tab-Switcher */}
          <div style={{ display:"flex", gap:0, margin:"0 20px 16px", background:"rgba(0,0,0,0.05)", borderRadius:12, padding:4 }}>
            {[["erlebnisse","Erlebnisse"],["impact","Impact Projekte"]].map(([key,label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                flex:1, padding:"8px 4px", borderRadius:10, border:"none",
                background: activeTab===key ? "white" : "transparent",
                color: activeTab===key ? "#0DC4B5" : "#666",
                fontSize:13, fontWeight: activeTab===key ? 600 : 600,
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
        <ImpactUpdateSheet
                project={updateTargetProject}
                currentUser={profile}
                onClose={() => { setShowUpdateSheet(false); setUpdateTargetProject(null); }}
                onSuccess={() => { window.dispatchEvent(new Event("hui:impact-update-added")); }}
              />
        )}
        </MeinBereichDrawer>
      )}

      {/* ── Meine Momente ───────────────────────────────────── */}
      {activeDrawer === "momente" && (
        <MeinBereichDrawer title="Meine Momente" icon={<HUIFotoIcon size={18}/>} subtitle="Fotos, Gedanken oder Videos aus deinem Alltag." onClose={close} footer={false}>
          <MeinMomenteDrawerContent
            profile={profile}
            onOpenMomentSheet={() => {
              close();
              openMomentSheet();
            }}
          />
        </MeinBereichDrawer>
      )}

      {/* HuiMomentSheet — wird AUSSCHLIESSLICH über MyBasisProfile-Portal geöffnet
          (onOpenMomentSheetProp = MyBasisProfile.setShowMomentSheet).
          Kein eigenes internes Portal → kein redundanter lazy-Load-Hänger */}

      {/* ── Ambassador-Bereich ───────────────────────────────── */}
      {activeDrawer === "ambassador" && (
        <MeinBereichDrawer title="Ambassador-Bereich" icon={<HUIAmbassadorIcon size={18}/>} subtitle="Dein Ambassador-Programm und Provisionen." onClose={close} footer={false}>
          <AmbassadorStudioSection profile={profile} />
        </MeinBereichDrawer>
      )}

      {/* ── Empfehlungen — Chooser: Kundenstimmen + Meine Empfehlungen ─ */}
      {activeDrawer === "empfehlungen" && !empfehlungDetail && (
        <MeinBereichDrawer title="Empfehlungen" icon={<HUIEmpfehlungIcon size={18}/>} subtitle="Erhaltene und gegebene Empfehlungen." onClose={close} footer={false}>
          <MeinBereichChooserRow
            icon={<HUIEmpfehlungIcon size={18}/>} label="Kundenstimmen"
            desc="Empfehlungen, die du erhalten hast"
            onPress={() => setEmpfehlungDetail("incoming")}
          />
          <MeinBereichChooserRow
            icon={<HUIEmpfehlungIcon size={18}/>} label="Meine Empfehlungen"
            desc="Empfehlungen, die du gegeben hast"
            onPress={() => setEmpfehlungDetail("outgoing")}
          />
        </MeinBereichDrawer>
      )}
      {activeDrawer === "empfehlungen" && empfehlungDetail === "incoming" && (
        <MeinBereichDrawer title="Kundenstimmen" icon={<HUIEmpfehlungIcon size={18}/>} subtitle="Empfehlungen, die du erhalten hast." onClose={() => setEmpfehlungDetail(null)} footer={false}>
          <RecommendationsSection
            recommendations={recommendations}
            isOwner={true}
            profileOwnerId={profile?.id || ""}
            profileOwnerName={profile?.display_name || profile?.nickname || ""}
          />
        </MeinBereichDrawer>
      )}
      {activeDrawer === "empfehlungen" && empfehlungDetail === "outgoing" && (
        <MyRecommendationsModal userId={profile?.id} onClose={() => setEmpfehlungDetail(null)} />
      )}

      {/* ── Impact & Stimmen (Chooser + Detail-Drawer) ──────── */}
      {activeDrawer === "impact" && !impactDetail && (
        <MeinBereichDrawer title="Impact & Stimmen" icon={<HUIImpactIcon size={18}/>} subtitle="Deine Wirkung und abgegebene Stimmen." onClose={close} footer={false}>
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
        <ImpactStimmenModal
            profile={profile}
            onClose={() => setImpactDetail(null)}
            switchTab={switchTab}
          />
        )}
      {activeDrawer === "impact" && impactDetail === "projekte" && (
        <MeineProjekteModal
            profile={profile}
            onClose={() => setImpactDetail(null)}
            switchTab={switchTab}
          />
        )}

      {/* ── Finanzübersicht (neues Unified-Modal) ───────── */}
      {showFinanzModal && (
        <FinanzuebersichtModal profile={profile} onClose={() => setShowFinanzModal(false)} />
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
  const [choiceTalent, setChoiceTalent] = React.useState(null); // ITEM-ACTION-CHOICE (2026-08-16)
  const { openRef } = useContentPreview();

  const handleDeleteClick = (e, t) => {
    e.stopPropagation();
    setConfirmTalent(t);
  };

  const handleConfirmDelete = async () => {
    const t = confirmTalent;
    setConfirmTalent(null);
    if (!t?.id) return;
    try {
      // UNWIDERRUFLICH LOESCHEN (2026-08-17): HARD DELETE nur wenn keine
      // Buchungen existieren. talent_bookings_talent_id_fkey ist ON DELETE
      // CASCADE (DB-Check 2026-08-17) — ein ungeprueftes Hard-Delete wuerde
      // bestehende (auch bezahlte) Buchungen samt Zahlungshistorie mitloeschen.
      // Schutz: vorher zaehlen, bei Treffern Soft-Delete (status='deleted')
      // statt Hard-Delete — Talent verschwindet trotzdem sofort aus
      // Feed/Entdecken (beide filtern strikt auf status='approved'), die
      // Buchungs-/Zahlungshistorie bleibt aber vollstaendig erhalten.
      const { count, error: countErr } = await supabase
        .from("talent_bookings")
        .select("id", { count: "exact", head: true })
        .eq("talent_id", t.id);
      if (!countErr && count > 0) {
        console.warn(`Talent Hard-Delete blockiert — ${count} bestehende Buchung(en) gefunden. Fallback Soft-Delete.`);
        await supabase.from("talents").update({ status: "deleted" }).eq("id", t.id);
        toast.success("Talent wurde gelöscht (Buchungsdaten geschützt).", { duration: 3000 });
      } else {
        await deleteTalent(t.id);
        toast.success("Talent wurde unwiderruflich gelöscht.", { duration: 3000 });
      }
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
    {choiceTalent && (
      <ItemActionChoiceSheet
        label="Talent"
        onEdit={() => { const t = choiceTalent; setChoiceTalent(null); onTalentWizard?.(t); }}
        onView={() => { const t = choiceTalent; setChoiceTalent(null); openRef({ type:"talent", id:t.id }); }}
        onDelete={() => { const t = choiceTalent; setChoiceTalent(null); setConfirmTalent(t); }}
        onCancel={() => setChoiceTalent(null)}
      />
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      {talents.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
          gap:10, marginBottom:12 }}>
          {talents.map((t, i) => {
            const isApproved = t.status === "approved";
            const isPending  = t.status === "pending";
            const badgeBg    = isApproved ? "rgba(14,196,184,0.92)" : isPending ? "rgba(234,179,8,0.92)" : "rgba(255,80,80,0.92)";
            const badgeText  = isApproved ? "✅ Live" : isPending ? "⏳ Prüfung" : "❌ Abgelehnt";
            const cover = Array.isArray(t.images) && t.images[0]?.url;
            return (
              <div key={t.id || i}
                onClick={() => setChoiceTalent(t)}
                style={{
                  width:"100%", aspectRatio:"1/1",
                  borderRadius:12, overflow:"hidden",
                  background:"#e8e4de", position:"relative", cursor:"pointer",
                  boxShadow: isApproved ? "0 0 0 2px #0EC4B8" : isPending ? "0 0 0 2px #D4A800" : "0 0 0 2px #ff5050",
                }}>
                {cover
                  ? <img loading="lazy" decoding="async" src={optimizeCard(cover)} alt={t.title||""}
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
                    color:"#fff", fontSize:11, fontWeight: 600,
                    cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    lineHeight:1, padding:0, zIndex:2,
                  }}
                >✕</button>
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background: badgeBg,
                  fontSize:9, fontWeight: 600, color:"#fff",
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
        fontSize:12.5, fontWeight: 600, color:T.teal,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        width:"100%",
      }}>
        <span style={{
          width:18, height:18, borderRadius:"50%", flexShrink:0,
          background:T.teal, color:"#fff", fontSize:13, fontWeight: 600,
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
  const [choiceWork, setChoiceWork] = React.useState(null); // ITEM-ACTION-CHOICE (2026-08-16)
  const [draftWork, setDraftWork] = React.useState(null); // DRAFT-ACTION (2026-08-20)
  const { openRef } = useContentPreview();

  const handleDeleteClick = (e, w) => {
    e.stopPropagation();
    setConfirmWork(w);
  };

  const handleConfirmDelete = async () => {
    const w = confirmWork;
    setConfirmWork(null);
    if (!w?.id) return;
    try {
      // UNWIDERRUFLICH LOESCHEN (2026-08-17): primaer HARD DELETE — die Zeile
      // verschwindet komplett aus der DB, damit garantiert nichts mehr in
      // Feed/Entdecken/Profil auftaucht. FK-Schutz (order_items_work_id_fkey,
      // bookings_work_id_fkey, work_sales_work_id_fkey — alle NO ACTION/RESTRICT,
      // DB-Check 2026-08-17) verhindert das Hard-Delete automatisch wenn das
      // Werk bereits bestellt/gebucht/verkauft wurde (schuetzt Bestell- und
      // Zahlungshistorie vor Datenverlust). In diesem Fall Fallback auf
      // Soft-Delete (status='deleted') — verschwindet trotzdem sofort aus
      // Feed/Entdecken, die beide strikt auf status='published' filtern.
      const { error } = await supabase.from("works").delete().eq("id", w.id);
      if (error) {
        console.warn("Werk Hard-Delete blockiert (vermutlich bestehende Bestellung/Buchung) — Fallback Soft-Delete:", error);
        await supabase.from("works").update({ status: "deleted", visibility: "private" }).eq("id", w.id);
        toast.success("Werk wurde gelöscht (Bestelldaten geschützt).", { duration: 3000 });
      } else {
        toast.success("Werk wurde unwiderruflich gelöscht.", { duration: 3000 });
      }
      onDeleteWerk(w.id);
    } catch(e) { console.error("Werk löschen:", e); }
  };

  // DRAFT-PUBLISH (2026-08-20): Entwurf zur Prüfung einreichen — setzt
  // status auf pending_review und schickt es an den SADB.
  const publishDraft = async (w) => {
    if (!w?.id) return;
    try {
      const { error } = await supabase.from("works").update({
        status: "pending_review",
        approval_status: "pending",
        last_submitted_at: new Date().toISOString(),
        is_update: false,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      }).eq("id", w.id);
      if (error) throw error;
      toast.success("Werk wurde zur Veröffentlichung eingereicht.", { duration: 3000 });
      onDeleteWerk(); // triggert reload im Parent
    } catch(e) {
      console.error("Draft publish:", e);
      toast.error("Konnte nicht eingereicht werden.", { duration: 3000 });
    }
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
    {draftWork && (
      <DraftActionSheet
        label="Werk"
        onPublish={() => { const w = draftWork; setDraftWork(null); publishDraft(w); }}
        onEdit={() => { const w = draftWork; setDraftWork(null); onWerkWizard?.(w); }}
        onDelete={() => { const w = draftWork; setDraftWork(null); setConfirmWork(w); }}
        onCancel={() => setDraftWork(null)}
      />
    )}
    {choiceWork && (
      <ItemActionChoiceSheet
        label="Werk"
        onEdit={() => { const w = choiceWork; setChoiceWork(null); onWerkWizard?.(w); }}
        onView={() => { const w = choiceWork; setChoiceWork(null); openRef({ type:"work", id:w.id }); }}
        onDelete={() => { const w = choiceWork; setChoiceWork(null); setConfirmWork(w); }}
        onCancel={() => setChoiceWork(null)}
      />
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      {works.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
          gap:10, marginBottom:12 }}>
          {works.map((w, i) => {
            const isApproved = w.approval_status === "approved";
            const isDraft    = w.status === "draft";
            // ENTWURF-BADGE-FIX (2026-08-20, Michael-Report "wird NICHT als
            // Entwurf gekennzeichnet"): works.approval_status ist NOT NULL +
            // CHECK IN ('pending','approved','rejected') -- kann bei einem
            // Entwurf (status='draft') NIE leer/eigenständig sein, sondern
            // steht durch den DB-Spalten-Default technisch immer auf
            // 'pending', auch wenn der Entwurf nie eingereicht wurde. isDraft
            // (status, die einzig verlässliche Quelle) muss deshalb VOR
            // isPending geprüft werden -- sonst gewinnt fälschlich "⏳ Prüfung".
            const isPending  = !isDraft && (w.approval_status === "pending" || w.status === "pending_review");
            const isRejected = !isDraft && (w.approval_status === "rejected" || w.status === "rejected");
            const badgeBg    = isApproved ? "rgba(14,196,184,0.92)"
              : isPending  ? "rgba(234,179,8,0.92)"
              : isDraft    ? "rgba(120,120,128,0.85)"
              : "rgba(255,80,80,0.92)";
            const badgeText  = isApproved ? "✅ Live"
              : isPending  ? "⏳ Prüfung"
              : isDraft    ? "📝 Entwurf"
              : "❌ Abgelehnt";
            return (
              <div key={w.id || i}
                onClick={() => isDraft ? setDraftWork(w) : setChoiceWork(w)}
                style={{
                  width:"100%", aspectRatio:"1/1",
                  borderRadius:T.r12, overflow:"hidden",
                  background:"#e8e4de", position:"relative", cursor:"pointer",
                  boxShadow: isApproved ? "0 0 0 2px #0EC4B8" : isPending ? "0 0 0 2px #D4A800" : isDraft ? "0 0 0 2px rgba(120,120,128,0.5)" : "0 0 0 2px #ff5050",
                }}>
                {w.cover_url
                  ? <img loading="lazy" decoding="async" src={optimizeCard(w.cover_url)} alt={w.title||""} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none"; const sib=e.target.nextSibling; if(sib) sib.style.display="flex";}}/>
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><HUILogo size={36} style={{opacity:0.5}} /></div>
                }
                {/* X-Löschen-Button oben rechts */}
                <button
                  onClick={(e) => handleDeleteClick(e, w)}
                  style={{
                    position:"absolute", top:4, right:4,
                    width:20, height:20, borderRadius:"50%",
                    background:"rgba(0,0,0,0.65)", border:"none",
                    color:"#fff", fontSize:11, fontWeight: 600,
                    cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    lineHeight:1, padding:0, zIndex:2,
                  }}
                >✕</button>
                {/* Status-Badge */}
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background: badgeBg,
                  fontSize:9, fontWeight: 600, color:"#fff",
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
        fontSize:12.5, fontWeight: 600, color:T.teal,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        width:"100%",
      }}>
        <span style={{
          width:18, height:18, borderRadius:"50%", flexShrink:0,
          background:T.teal, color:"#fff", fontSize:13, fontWeight: 600,
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
  const [choiceExp, setChoiceExp] = React.useState(null); // ITEM-ACTION-CHOICE (2026-08-16)
  const [draftExp, setDraftExp] = React.useState(null); // DRAFT-ACTION-FIX (2026-08-20, Michael-Report)
  const { openRef } = useContentPreview();

  // DRAFT-PUBLISH (2026-08-20, analog zu MeineWerkeSection.publishDraft):
  // Entwurf zur Prüfung einreichen — setzt status auf pending_review und
  // schickt es an den SADB. Zuvor gab es dafür keinen Pfad im Erlebnis-
  // Bereich, ein Entwurf blieb für immer status='draft' + approval_status
  // 'pending' (DB-Default) hängen und wurde faelschlich als "⏳ Prüfung"
  // angezeigt statt als "📝 Entwurf" — siehe Badge-Logik unten.
  const publishDraftExp = async (exp) => {
    if (!exp?.id) return;
    try {
      const { error } = await supabase.from("experiences").update({
        status: "pending_review",
        approval_status: "pending",
        last_submitted_at: new Date().toISOString(),
        is_update: false,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      }).eq("id", exp.id);
      if (error) throw error;
      toast.success("Erlebnis wurde zur Veröffentlichung eingereicht.", { duration: 3000 });
      onDeleteErlebnis(); // triggert reload im Parent (identisch zu Werke-Muster)
    } catch(e) {
      console.error("Draft publish (Erlebnis):", e);
      toast.error("Konnte nicht eingereicht werden.", { duration: 3000 });
    }
  };

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
        toast.success("Erlebnis wurde unwiderruflich gelöscht.", { duration: 3000 });
        onDeleteErlebnis(exp.id);
      } else {
        console.error("Erlebnis löschen:", error);
        // Fallback: soft-delete wenn Hard-Delete nicht erlaubt (RLS)
        await supabase.from(table).update({ status: "deleted" }).eq("id", exp.id);
        toast.success("Erlebnis wurde gelöscht.", { duration: 3000 });
        onDeleteErlebnis(exp.id);
      }
    } catch(e) { console.error("Erlebnis löschen:", e); }
  };

  function fmtDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return formatDateDE(dt, { month:"short", year:"numeric" });
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
          <div style={{ fontSize:36, textAlign:"center", marginBottom:8 }}><span className="hui-emoji">🗑</span>️</div>
          <div style={{ fontSize:16, fontWeight: 600, textAlign:"center", marginBottom:6, color:"#1a1a18" }}>
            Erlebnis unwiderruflich löschen?
          </div>
          <div style={{ fontSize:13, color:"#666", textAlign:"center", lineHeight:1.5, marginBottom:20 }}>
            <strong>„{confirmExp.title || 'Dieses Erlebnis'}"</strong> wird dauerhaft gelöscht und kann nicht wiederhergestellt werden.
          </div>
          <button onClick={handleConfirmDelete} style={{
            width:"100%", padding:"12px", borderRadius:99,
            background:"#ff3b3b", border:"none", color:"#fff",
            fontSize:14, fontWeight: 600, cursor:"pointer",
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
    {draftExp && (
      <DraftActionSheet
        label="Erlebnis"
        onPublish={() => { const exp = draftExp; setDraftExp(null); publishDraftExp(exp); }}
        onEdit={() => { const exp = draftExp; setDraftExp(null); onErlebnisWizard?.(exp); }}
        onDelete={() => { const exp = draftExp; setDraftExp(null); setConfirmExp(exp); }}
        onCancel={() => setDraftExp(null)}
      />
    )}
    {choiceExp && (
      <ItemActionChoiceSheet
        label="Erlebnis"
        onEdit={() => { const exp = choiceExp; setChoiceExp(null); onErlebnisWizard?.(exp); }}
        onView={() => {
          const exp = choiceExp; setChoiceExp(null);
          // Projekte (Impact) und Erlebnisse liegen in unterschiedlichen Tabellen/Loadern
          openRef({ type: exp._source === "projects" ? "project" : "experience", id: exp.id });
        }}
        onDelete={() => { const exp = choiceExp; setChoiceExp(null); setConfirmExp(exp); }}
        onCancel={() => setChoiceExp(null)}
      />
    )}
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{ fontSize:12, color:"#8C8C85", marginBottom:12 }}>Momente, die mein Wirken zeigen.</div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
        gap:10, marginBottom:12 }}>
        {experiences.map((exp, i) => {
          // ── Badge-System identisch zu Meine Werke ──────────────
          const isApproved = exp.approval_status === "approved" || exp.status === "published";
          const isDraft     = !isApproved && exp.status === "draft";
          // ENTWURF-BADGE-FIX (2026-08-20, Michael-Report "als Entwurf
          // speichern hat nicht geklappt"): identisch zum WERK-Fix von
          // heute — experiences.approval_status ist NOT NULL mit Default
          // 'pending' und wird bei einem Entwurf (status='draft', save()
          // schickt approval_status:undefined) NIE explizit gesetzt, bleibt
          // also technisch immer auf 'pending' stehen, obwohl der Entwurf
          // nie eingereicht wurde. isDraft (status, die einzig verlässliche
          // Quelle) muss deshalb VOR isPending geprüft werden — sonst
          // gewinnt fälschlich "⏳ Prüfung" statt "📝 Entwurf".
          const isPending  = !isApproved && !isDraft && (exp.approval_status === "pending" || exp.status === "pending_review" || exp.status === "pending");
          const isRejected = !isApproved && !isDraft && !isPending && (exp.approval_status === "rejected" || exp.status === "rejected");
          const badgeBg    = isApproved
            ? "rgba(14,196,184,0.92)"
            : isPending
              ? "rgba(234,179,8,0.92)"
              : isDraft
                ? "rgba(120,120,128,0.85)"
                : isRejected
                  ? "rgba(255,80,80,0.92)"
                  : "rgba(14,196,184,0.92)";
          const badgeText  = isApproved
            ? "✅ Live"
            : isPending
              ? "⏳ Prüfung"
              : isDraft
                ? "📝 Entwurf"
                : isRejected
                  ? "❌ Abgelehnt"
                  : "✅ Live";
          const borderCol  = isApproved ? "#0EC4B8" : isPending ? "#D4A800" : isDraft ? "rgba(120,120,128,0.5)" : isRejected ? "#ff5050" : "#0EC4B8";
          return (
            <div key={exp.id || i}
              onClick={() => isDraft ? setDraftExp(exp) : setChoiceExp(exp)}
              style={{
                width:"100%", aspectRatio:"1/1",
                borderRadius:T.r12, overflow:"hidden",
                background:"#e8e4de", position:"relative", cursor:"pointer",
                boxShadow: `0 0 0 2px ${borderCol}`,
              }}>
              {exp.cover_url
                ? <img loading="lazy" decoding="async" src={optimizeCard(exp.cover_url)} alt={exp.title||""} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none"; const sib=e.target.nextSibling; if(sib) sib.style.display="flex";}}/>
                : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><HUILogo size={36} style={{opacity:0.5}} /></div>
              }
              {/* X-Löschen-Button oben rechts */}
              <button
                onClick={(e) => handleDeleteClick(e, exp)}
                style={{
                  position:"absolute", top:4, right:4,
                  width:20, height:20, borderRadius:"50%",
                  background:"rgba(0,0,0,0.65)", border:"none",
                  color:"#fff", fontSize:11, fontWeight: 600,
                  cursor:"pointer", display:"flex",
                  alignItems:"center", justifyContent:"center",
                  lineHeight:1, padding:0, zIndex:2,
                }}
              >✕</button>
              {/* Status-Badge unten */}
              <div style={{
                position:"absolute", bottom:0, left:0, right:0,
                background: badgeBg,
                fontSize:9, fontWeight: 600, color:"#fff",
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
                    fontSize:8, fontWeight: 600, padding:"2px 7px",
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
        fontSize:12.5, fontWeight: 600, color:T.teal,
        cursor:"pointer", touchAction:"manipulation", fontFamily:"inherit",
        width:"100%",
      }}>
        <span style={{
          width:18, height:18, borderRadius:"50%", flexShrink:0,
          background:T.teal, color:"#fff", fontSize:13, fontWeight: 600,
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
  const { openGallery } = useImageGallery();
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState(null);
  const [updates, setUpdates] = React.useState([]);
  const [updatesLoading, setUpdatesLoading] = React.useState(false);
  const [editingUpdateId, setEditingUpdateId] = React.useState(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState(null);

  // impact_applications nutzt 'user_id' als User-Feld
  const userField = "user_id";

  const loadUpdatesFor = React.useCallback(async (projectId) => {
    if (!projectId) { setUpdates([]); return; }
    setUpdatesLoading(true);
    const { data, error } = await supabase
      .from("impact_project_updates")
      .select("id,title,content,update_type,media_urls,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) console.error("[ImpactProjekteTab] updates query error:", error);
    setUpdates(data || []);
    setUpdatesLoading(false);
  }, [supabase]);

  const startEditUpdate = (u) => {
    setEditingUpdateId(u.id);
    setEditTitle(u.title || "");
    setEditContent(u.content || "");
    setEditError(null);
  };

  const cancelEditUpdate = () => {
    setEditingUpdateId(null);
    setEditTitle("");
    setEditContent("");
    setEditError(null);
  };

  const saveEditUpdate = async (updateId) => {
    if (!editTitle.trim()) { setEditError("Überschrift darf nicht leer sein."); return; }
    setSavingEdit(true);
    setEditError(null);
    const { error } = await supabase
      .from("impact_project_updates")
      .update({ title: editTitle.trim(), content: editContent.trim() || null })
      .eq("id", updateId);
    setSavingEdit(false);
    if (error) {
      console.error("[ImpactProjekteTab] update edit error:", error);
      setEditError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }
    // Lokal aktualisieren (optimistic) + Live-Refresh-Event für andere offene Views (z.B. ImpactPage)
    setUpdates(prev => prev.map(u => u.id === updateId ? { ...u, title: editTitle.trim(), content: editContent.trim() || null } : u));
    window.dispatchEvent(new Event("hui:impact-update-added"));
    cancelEditUpdate();
  };

  React.useEffect(() => {
    loadUpdatesFor(selected?.id);
    setEditingUpdateId(null);
    setEditError(null);
  }, [selected?.id, loadUpdatesFor]);

  React.useEffect(() => {
    const handler = () => { if (selected?.id) loadUpdatesFor(selected.id); };
    window.addEventListener("hui:impact-update-added", handler);
    return () => window.removeEventListener("hui:impact-update-added", handler);
  }, [selected?.id, loadUpdatesFor]);

  React.useEffect(() => {
    if (!profile?.user_id && !profile?.id) return;
    const uid = profile.user_id || profile.id;
    supabase
      .from("impact_applications")
      .select("id,project_name,short_desc,funding_goal,current_amount_eur,status,rank,is_completed,created_at,cover_url")
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
        <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>
          Noch kein Impact-Projekt
        </div>
        <div style={{ fontSize: 13, color: "#666" }}>
          Reiche dein erstes Herzensprojekt ein und erhalte Community-Finanzierung.
        </div>
      </div>
    );
  }

  return (
    <>
    {/* Kachel-Grid — identisch zum Muster von Meine Werke/Erlebnisse (3-spaltig, aspect-ratio 1/1) */}
    <div style={{ padding: `0 ${T.px}px` }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
        gap:10, marginBottom:12 }}>
        {projects.map((proj, i) => {
          const isApproved = proj.status === "approved";
          const isRejected = proj.status === "rejected";
          const badgeBg = isApproved ? "rgba(14,196,184,0.92)" : isRejected ? "rgba(255,80,80,0.92)" : "rgba(234,179,8,0.92)";
          const badgeText = isApproved ? "✅ Bewilligt" : isRejected ? "❌ Abgelehnt" : "⏳ Prüfung";
          const borderCol = isApproved ? "#0EC4B8" : isRejected ? "#ff5050" : "#D4A800";
          return (
            <div key={proj.id || i}
              onClick={() => setSelected(proj)}
              style={{
                width:"100%", aspectRatio:"1/1",
                borderRadius:T.r12, overflow:"hidden",
                background:"#e8f7f4", position:"relative", cursor:"pointer",
                boxShadow: `0 0 0 2px ${borderCol}`,
              }}>
              {proj.cover_url
                ? <img loading="lazy" decoding="async" src={optimizeCard(proj.cover_url)} alt={proj.project_name||""}
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : <div style={{ width:"100%", height:"100%", display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:24 }}>💚</div>
              }
              {/* Status-Badge unten */}
              <div style={{
                position:"absolute", bottom:0, left:0, right:0,
                background: badgeBg,
                fontSize:9, fontWeight: 600, color:"#fff",
                padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
              }}>
                {badgeText}
              </div>
              {/* Titel oben */}
              {proj.project_name && (
                <div style={{
                  position:"absolute", top:0, left:0, right:0,
                  background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                  padding:"3px 5px", whiteSpace:"nowrap",
                  overflow:"hidden", textOverflow:"ellipsis",
                }}>
                  {proj.project_name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* Detail-Overlay — Beschreibung, Fortschritt, Update-Button (per Tap auf Kachel) */}
    {selected && (
      <div style={{
        position:"fixed", inset:0, zIndex:10500,
        background:"rgba(0,0,0,0.55)", display:"flex",
        alignItems:"center", justifyContent:"center", padding:"24px",
      }} onClick={() => setSelected(null)}>
        <div onClick={e => e.stopPropagation()} style={{
          background:"#fff", borderRadius:20, padding:"20px",
          maxWidth:360, width:"100%", maxHeight:"80vh", overflowY:"auto",
          boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
        }}>
          {selected.cover_url && (
            <img src={optimizeCard(selected.cover_url)} alt={selected.project_name||""}
              style={{ width:"100%", height:160, objectFit:"cover", borderRadius:14, marginBottom:14 }} />
          )}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6, gap:8 }}>
            <div style={{ fontSize:16, fontWeight: 600, color:"#1A1A1A", flex:1 }}>{selected.project_name}</div>
            <span style={{
              fontSize:11, fontWeight: 600, flexShrink:0, padding:"3px 8px", borderRadius:99,
              color: selected.status==="approved" ? "#0DC4B5" : selected.status==="rejected" ? "#e74c3c" : "#f39c12",
              background: (selected.status==="approved" ? "#0DC4B5" : selected.status==="rejected" ? "#e74c3c" : "#f39c12") + "15",
            }}>
              {selected.status==="approved" ? "✅ Bewilligt" : selected.status==="rejected" ? "❌ Abgelehnt" : "⏳ In Prüfung"}
            </span>
          </div>
          {selected.short_desc && (
            <div style={{ fontSize:13, color:"#666", marginBottom:12, lineHeight:1.5 }}>{selected.short_desc}</div>
          )}
          {(() => {
            const funded = selected.current_amount_eur || 0;
            const goal = selected.funding_goal || 0;
            const pct = goal > 0 ? Math.min(100, Math.round((funded / goal) * 100)) : 0;
            return (
              <>
                <div style={{ fontSize:12, color:"#666", marginBottom:6 }}>
                  €{formatNumberDE(funded)} von €{formatNumberDE(goal)} finanziert
                </div>
                <div style={{ height:6, borderRadius:99, background:"rgba(0,0,0,0.08)", overflow:"hidden", marginBottom:16 }}>
                  <div style={{ height:"100%", borderRadius:99, width:`${pct}%`, background:"linear-gradient(90deg,#0DC4B5,#09A89D)" }} />
                </div>
              </>
            );
          })()}
          {/* ── Neuigkeiten / Projekt-Updates ── */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight: 600, color:"#1A1A1A", marginBottom:8 }}>📰 Neuigkeiten</div>
            {updatesLoading ? (
              <div style={{ fontSize:12, color:"#888" }}>Laden...</div>
            ) : updates.length === 0 ? (
              <div style={{ fontSize:12, color:"#888" }}>Noch keine Neuigkeiten.</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {updates.map((u) => {
                  const typeColors = {
                    "Meilenstein": { c:"#F59E0B", bg:"rgba(245,158,11,0.10)" },
                    "Fortschritt": { c:"#0EC4B8", bg:"rgba(14,196,184,0.10)" },
                    "Neuigkeit":   { c:"#7C3AED", bg:"rgba(124,58,237,0.10)" },
                    "Geplant":     { c:"#10B981", bg:"rgba(16,185,129,0.10)" },
                    "Proof of Work": { c:"#0EC4B8", bg:"rgba(14,196,184,0.10)" },
                  };
                  const tc = typeColors[u.update_type] || typeColors["Neuigkeit"];
                  const fmtD = u.created_at ?formatDateDE(new Date(u.created_at), { day:"2-digit", month:"short", year:"numeric" }) : "";
                  const isEditing = editingUpdateId === u.id;
                  return (
                    <div key={u.id} style={{
                      background:"#f8f8f6", border:"1px solid rgba(0,0,0,0.06)",
                      borderRadius:12, padding:12,
                    }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4, gap:6 }}>
                        <span style={{ fontSize:10, fontWeight: 600, color:tc.c, background:tc.bg, padding:"2px 6px", borderRadius:99, flexShrink:0 }}>{u.update_type || "Update"}</span>
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                          <span style={{ fontSize:10, color:"#999" }}>{fmtD}</span>
                          {!isEditing && (
                            <button
                              onClick={() => startEditUpdate(u)}
                              aria-label="Update bearbeiten"
                              style={{
                                background:"none", border:"none", padding:2, cursor:"pointer",
                                display:"flex", alignItems:"center", color:"#999",
                              }}
                            >
                              <HUISchreibenIcon size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            maxLength={120}
                            placeholder="Überschrift"
                            style={{
                              width:"100%", padding:"7px 10px", marginBottom:6,
                              borderRadius:8, border:"1px solid rgba(0,0,0,0.12)",
                              fontSize:13, fontWeight: 600, fontFamily:"inherit", color:"#1A1A1A",
                              outline:"none", boxSizing:"border-box",
                            }}
                          />
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            maxLength={2000}
                            rows={3}
                            placeholder="Beschreibung (optional)"
                            style={{
                              width:"100%", padding:"7px 10px", marginBottom:8,
                              borderRadius:8, border:"1px solid rgba(0,0,0,0.12)",
                              fontSize:12, fontFamily:"inherit", color:"#333",
                              outline:"none", resize:"vertical", boxSizing:"border-box", lineHeight:1.4,
                            }}
                          />
                          {editError && (
                            <div style={{ fontSize:11, color:"#e74c3c", marginBottom:6 }}>{editError}</div>
                          )}
                          <div style={{ display:"flex", gap:8 }}>
                            <button
                              onClick={() => saveEditUpdate(u.id)}
                              disabled={savingEdit}
                              style={{
                                flex:1, padding:"7px 0", borderRadius:8, border:"none",
                                background: savingEdit ? "#9fd8d2" : "#0DC4B5", color:"#fff",
                                fontSize:12, fontWeight: 600, cursor: savingEdit ? "default" : "pointer",
                                fontFamily:"inherit",
                              }}
                            >
                              {savingEdit ? "Speichert…" : "Speichern"}
                            </button>
                            <button
                              onClick={cancelEditUpdate}
                              disabled={savingEdit}
                              style={{
                                flex:1, padding:"7px 0", borderRadius:8,
                                border:"1px solid rgba(0,0,0,0.12)", background:"#fff", color:"#666",
                                fontSize:12, fontWeight:600, cursor: savingEdit ? "default" : "pointer",
                                fontFamily:"inherit",
                              }}
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize:13, fontWeight: 600, color:"#1A1A1A", marginBottom:2 }}>{u.title}</div>
                          {u.content && <div style={{ fontSize:12, color:"#666", lineHeight:1.4 }}>{u.content}</div>}
                          {u.media_urls && u.media_urls.length > 0 && (
                            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:6 }}>
                              {u.media_urls.map((url, idx) => (
                                <div key={idx} onClick={() => openGallery(u.media_urls, idx)} style={{ cursor:"pointer" }} role="button" tabIndex={0}>
                                  <img loading="lazy" decoding="async" src={url} alt=""
                                    style={{ width:50, height:50, objectFit:"cover", borderRadius:6, border:"1px solid rgba(0,0,0,0.08)" }} />
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selected.status === "approved" && (
            <button
              onClick={() => { onUpdateClick(selected); setSelected(null); }}
              style={{
                width:"100%", padding:"10px 0", borderRadius:12,
                border:"1.5px dashed #0DC4B5", background:"transparent",
                color:"#0DC4B5", fontSize:13, fontWeight: 600,
                cursor:"pointer", fontFamily:"inherit", marginBottom:8,
              }}
            >
              + Update hinzufügen
            </button>
          )}
          <button onClick={() => setSelected(null)} style={{
            width:"100%", padding:"10px 0", borderRadius:12,
            background:"#f0f0ee", border:"none", color:"#444",
            fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
          }}>
            Schließen
          </button>
        </div>
      </div>
    )}
    </>
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
          fontSize:22, fontWeight: 600, color:"#1A1A18",
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
            fontSize:15, fontWeight: 600,
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
          <span className="hui-emoji">🤝</span> Der Gemeinschaft beitreten
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

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
          <div style={{ width: '100%' }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: '#FF8A6B',
              textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4,
            }}>
              Dein nächster Schritt
            </div>
            <div style={{
              fontSize: 17, fontWeight: 600, color: '#1A1A18',
              lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 6,
            }}>
              Werde HUI-Talent
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(26,26,24,0.58)',
              lineHeight: 1.65, marginBottom: 16,
            }}>
              Teile dein Talent, biete Dienstleistungen an und verdiene
              mit dem was du liebst — in 3 einfachen Schritten.
            </div>

            {/* Feature-Punkte */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 18 }}>
              {[
                { icon: '🎯', text: 'Eigenes Talent-Profil erstellen' },
                { icon: '💼', text: 'Dienstleistungen & Angebote anbieten' },
                { icon: '💰', text: '80% der Einnahmen direkt erhalten' },
              ].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, color: 'rgba(26,26,24,0.72)' }}>
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
                fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(255,138,107,0.35)',
                touchAction: 'manipulation',
                width: '100%', justifyContent: 'center',
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Jetzt Talent werden
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
// TalentOnboarding wird jetzt eager importiert (siehe Import-Block oben) — kein React.lazy mehr, um den Suspense-fallback={null}-Hang-Bug zu vermeiden (analog zu MyRecommendationsModal/ImpactStimmenModal).




function TalentOnboardingModal({ onClose = () => {}, onSuccess = () => {} }) {
  return createPortal(
      <TalentOnboarding
        onClose={onClose}
        onActivate={onSuccess}
      />,
    document.body
  );
}
