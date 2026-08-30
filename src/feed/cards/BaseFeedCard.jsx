// src/feed/cards/BaseFeedCard.jsx — Phase 4D
// Avatar tap → direkt vollständiges Profil öffnen (kein QuickPreview mehr)
// ══════════════════════════════════════════════════════════════
// Double-tap like · Heart burst · Optimistic reactions
// Shimmer skeleton · Lazy image loading · Scale press states
// GPU-accelerated animations via transform
// ══════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect, memo } from "react";
import { PresenceDot } from "../../lib/usePresence.jsx";
import { MembershipLabel } from "../../components/ui/TalentBadge.jsx";
// HUI Interaction Language v1.0 (2026-07-05) — Single Source of Truth fuer
// die vier universellen Interaktionen (Resonanz/Austauschen/Merken/Empfehlen).
// Ersetzt die bisherigen Emoji-Icons (✦/🤍/💬/🔖) plattformweit.
import {
  HUIHeartIcon, HUIChatIcon, HUIBookmarkIcon, HUIShareIcon,
} from "../../design/icons/HuiInteractionIcons.jsx";
import { haptic } from "../../components/commerce/commerceUtils.js";
import { prefetchProfile, optimizeAvatar, optimizeCard } from "../../lib/perfUtils.js";
import { CAT_KEY_MAP, WERK_CAT_KEY_MAP, translateCategory } from "../../lib/categoryMaps.js";
// LIGHTBOX+SLIDER.1 (2026-08-08): Wiederverwendbare Komponenten fuer
// Bild-Lightbox (Full-Screen Zoom) und Multi-Image Slider.
import ImageSlider from "../../components/shared/ImageSlider.jsx";
import { toast } from "../../lib/useToast.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

const T = {
  bgCard:   "#FFFFFF",
  ink:      "#1A1A2E",
  ink2:     "rgba(26,26,46,0.55)",
  ink3:     "rgba(26,26,46,0.38)",
  teal:     "#0DC4B5",
  tealSoft: "rgba(13,196,181,0.08)",
  tealLine: "rgba(13,196,181,0.18)",
  coral:    "#F47355",
  orange:   "#F05A28",
  shadow:   "0 2px 20px rgba(26,26,46,0.08)",
  border:   "rgba(26,26,46,0.07)",
  r: 16, rMedia: 14, rAvatar: 99, p: 16, gap: 12, mediaH: 220,
};

// ── Adaptive Media Height (Feed UX Redesign 2026-08-06) ──────
// Statt fester 220px für alle Bilder: Höhe orientiert sich am
// natürlichen Seitenverhältnis. Querformat → moderat, Hochformat →
// großzügig, Square → mittig. Min/Max-Caps verhindern Extreme.
// object-fit: cover bleibt, aber durch die adaptive Höhe wird kaum
// noch beschnitten — das Bild füllt den Container nahezu 1:1.
//
// ENTFERNUNG: Komplett in BaseFeedCard.jsx + ImpactContent.jsx.
// Revert auf `const h = relaxed ? 340 : T.mediaH;` + height: 220.
const MEDIA = {
  placeholderH: 300,   // vor onLoad (Shimmer)
  landscapeH:  360,    // Querformat (aspect >= 1.2)
  squareH:     380,    // Square (0.85 ≤ aspect < 1.2)
  portraitMax: 560,    // Hochformat cap (aspect < 0.85)
  portraitMin: 380,    // Hochformat floor
  relaxedBoost: 60,    // +60px wenn relaxed=true (zukünftig nutzbar)
};

export function getAdaptiveMediaHeight(aspect, containerWidth, relaxed) {
  if (!aspect || !containerWidth) return MEDIA.placeholderH;
  const boost = relaxed ? MEDIA.relaxedBoost : 0;

  if (aspect >= 1.2) {
    // Querformat: containerWidth / aspect → natürliche Höhe
    const natural = containerWidth / aspect;
    return Math.min(Math.max(natural, 260), MEDIA.landscapeH + boost);
  }
  if (aspect >= 0.85) {
    // Square
    const natural = containerWidth / aspect;
    return Math.min(Math.max(natural, 320), MEDIA.squareH + boost);
  }
  // Hochformat: großzügig, aber gecapped
  const natural = containerWidth / aspect;
  return Math.min(Math.max(natural, MEDIA.portraitMin), MEDIA.portraitMax + boost);
}

// ── CSS injection (once) ──────────────────────────────────────
const CARD_CSS = `
@keyframes huiHeartBurst {
  0%   { transform:translate(-50%,-50%) scale(0.3); opacity:1; }
  45%  { transform:translate(-50%,-50%) scale(1.25); opacity:1; }
  75%  { transform:translate(-50%,-50%) scale(1.0); opacity:0.9; }
  100% { transform:translate(-50%,-50%) scale(1.4); opacity:0; }
}
@keyframes huiBookmarkPulse {
  0%,100% { transform:scale(1); }
  40%     { transform:scale(1.35); }
  70%     { transform:scale(0.9); }
}
@keyframes huiShimmer {
  0%   { background-position:200% 0; }
  100% { background-position:-200% 0; }
}
@keyframes huiFadeUp {
  from { opacity:0; transform:translateY(8px); }
  to   { opacity:1; transform:translateY(0); }
}
.hui-card-img { animation: huiFadeUp 0.28s ease both; }
/* HUI: Kein Media-Zoom — ruhiger, hochwertiger Feed */
/* HUI Pillar Hint — dezent, nie dominant */
.hui-pillar-hint {
  font-size: 10px;
  font-weight: 500;
  color: rgba(26,26,46,0.37);
  letter-spacing: 0.02em;
  padding: 2px 16px 8px;
  user-select: none;
  opacity: 0.85;
}
`;
let _cardCSS = false;
function injectCardCSS() {
  if (_cardCSS || typeof document === "undefined") return;
  _cardCSS = true;
  const s = document.createElement("style"); s.textContent = CARD_CSS;
  document.head.appendChild(s);
}

// ── Shimmer skeleton ──────────────────────────────────────────
export function CardSkeleton() {
  injectCardCSS();
  const shimmer = {
    background: "linear-gradient(90deg,rgba(26,26,46,0.06) 25%,rgba(26,26,46,0.13) 50%,rgba(26,26,46,0.06) 75%)",
    backgroundSize: "200% 100%",
    animation: "huiShimmer 1.6s ease-in-out infinite",
  };
  return (
    <article style={{
      background: T.bgCard, borderRadius: T.r, marginBottom: 14,
      marginLeft: 12, marginRight: 12,
      boxShadow: T.shadow, border: "1px solid " + T.border, overflow: "hidden",
    }}>
      <div style={{ padding: "16px 16px 0", display:"flex", gap:12, alignItems:"center" }}>
        <div style={{ width:38,height:38,borderRadius:T.rAvatar, ...shimmer }} />
        <div style={{ flex:1 }}>
          <div style={{ height:11,borderRadius:6,width:"55%",marginBottom:7,...shimmer }} />
          <div style={{ height:9,borderRadius:5,width:"35%",...shimmer }} />
        </div>
      </div>
      <div style={{ padding:"14px 16px 6px" }}>
        <div style={{ height:10,borderRadius:5,marginBottom:7,...shimmer }} />
        <div style={{ height:10,borderRadius:5,width:"72%",...shimmer }} />
      </div>
      <div style={{ margin:"10px 16px 16px",height:180,borderRadius:T.rMedia,...shimmer }} />
    </article>
  );
}

// ── Avatar ────────────────────────────────────────────────────
const CardAvatar = memo(function CardAvatar({ src, name, size = 38, isTalent = false }) {
  const [err, setErr] = useState(false);
  const letter = ((name || "H")[0] || "H").toUpperCase();
  return (
    <div style={{
      width:size,height:size,borderRadius:T.rAvatar,flexShrink:0,
      overflow:"hidden",background:T.tealSoft,
      border: isTalent ? "2px solid #16D7C5" : "1.5px solid "+T.tealLine,
      boxShadow: isTalent ? "0 0 8px rgba(22,215,197,0.30)" : "none",
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*0.38,fontWeight: 600,color:T.teal,
    }}>
      {src && !err
        ? <img loading="lazy" decoding="async" src={optimizeAvatar(src)} alt={name||""} onError={() => setErr(true)}
            style={{ width:"100%",height:"100%",objectFit:"cover" }} />
        : letter}
    </div>
  );
});

// ── Story Engine — Sprint 2.6 ────────────────────────────────
// Begegnungsgrund: natürlich, kontextsensitiv, niemals generisch.
// Quellen: type · author.talent · author.name · item.title ·
// FEED-TEXT-001: Dynamische Einleitungstexte für alle Feed-Karten.
// Regel: Texte basieren auf Content-Typ und Content-Kategorie — NIEMALS auf
// der Profilbezeichnung (author.talent). Diese ist eine Rollenangabe (z.B.
// "Superadmin"), keine inhaltliche Kategorie.
//
// Quellen pro Typ:
//   WERK       → item._raw.category          (z.B. "Handwerk", "Kunst")
//   ERLEBNIS   → item._raw.tags[0]           (erster Tag des Erlebnisses)
//   TALENT     → item._raw.category          (Kategorie des Talent-Angebots)
//   IMPACT     → kein category-Feld → fester Text
//   MOMENT     → immer fester Text (keine Rollen-Einmischung)
//   EVENT      → item._raw.location_text
// Kein API-Call. Kein neues Feld. Pure Berechnung aus vorhandenen _raw-Daten.
function getBegegnungsgrund(item, t) {
  const type   = item?.type || "moment";
  const author = item?.author || {};
  const raw    = item?._raw  || {};

  // Vorname aus display_name / name
  const first = (author.displayName || author.name || "")
    .split(/\s/)[0].trim() || null;

  // Inhalts-Kategorie (aus Content-Feldern, NICHT aus Profil-Feldern)
  const cat  = (raw.category || "").trim() || null;

  // Erster Tag des Erlebnisses: item.tags (normalisiert) oder raw.tags
  const _tagsArr = Array.isArray(item?.tags) && item.tags.length > 0
    ? item.tags
    : (Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : []);
  const tag = (_tagsArr[0] || "").trim() || null;

  // Ort: location_text (Experiences) oder item.location
  const loc  = (raw.location_text || item?.location || "").trim() || null;

  // ── WERK ──────────────────────────────────────────────────────────────────
  if (type === "work") {
    // BUGFIX (2026-08-29): cat kam als roher DB-Wert (Ersteller-Sprache,
    // z.B. "Malerei" oder "Painting") direkt aus raw.category — unabhaengig
    // von der App-Sprache des Betrachters. Fix: ueber WERK_CAT_KEY_MAP auf
    // den i18n-Key mappen und uebersetzen; Fallback auf Rohwert.
    const catLabel = cat ? translateCategory(cat, WERK_CAT_KEY_MAP, t) : cat;
    if (catLabel && first)
      return t('card.reasonWorkCat', { first, cat: catLabel });
    if (first)
      return t('card.reasonWorkFirst', { first });
    return t('card.reasonWork');
  }

  // ── ERLEBNIS ──────────────────────────────────────────────────────────────
  if (type === "experience") {
    if (tag && first)
      return t('card.reasonExperienceTag', { first, tag });
    if (loc && first)
      return t('card.reasonExperienceLoc', { first, loc });
    if (first)
      return t('card.reasonExperienceFirst', { first });
    return t('card.reasonExperience');
  }

  // ── TALENT-ANGEBOT ────────────────────────────────────────────────────────
  if (type === "talent") {
    // BUGFIX (2026-08-29): cat kam als roher DB-Wert (deutsches Label, z.B.
    // "Weitere Angebote") direkt aus raw.category — unabhaengig von der
    // App-Sprache des Betrachters. Fix: ueber CAT_KEY_MAP (SSOT, siehe
    // TalentContent.jsx) auf den i18n-Key mappen und uebersetzen; Fallback
    // auf den Rohwert falls kein Mapping existiert.
    const catLabel = cat ? translateCategory(cat, CAT_KEY_MAP, t) : cat;
    if (catLabel && first)
      return t('card.reasonTalentCat', { first, cat: catLabel });
    if (first)
      return t('card.reasonTalentFirst', { first });
    return t('card.reasonTalent');
  }

  // ── IMPACT / HERZENSPROJEKT ───────────────────────────────────────────────
  if (type === "impact") {
    if (first)
      return t('card.reasonImpactFirst', { first });
    return t('card.reasonImpact');
  }

  // ── EVENT ─────────────────────────────────────────────────────────────────
  if (type === "event") {
    if (loc && first)
      return t('card.reasonEventLoc', { first, loc });
    if (first)
      return t('card.reasonEventFirst', { first });
    return t('card.reasonEvent');
  }

  // ── MOMENT / GEDANKE / ALLES ANDERE ───────────────────────────────────────
  // NIEMALS Profilbezeichnung (author.talent) hier verwenden.
  if (first)
    return t('card.reasonMomentFirst', { first });
  return t('card.reasonMoment');
}

// ── HumanHeader v3.0 — exakt nach Mockup ─────────────────────
// Zeile 1: Avatar (52px rund) · Name · Zeit rechts · ⋮
// Zeile 2: Talent (farbig) · Pin-SVG · Ort
// Zeile 3: " (groß, orange) + Story-Satz
// SYSTEM-BOT-BADGE-001 (2026-08-11): myHUI ist ein System-Account, kein
// echter Mensch — bekommt eine kleine "Bot"-Kennzeichnung im Header
// (analog zum Profil-Header in SystemBotProfile.jsx). ID identisch zu
// SYSTEM_USER_ID dort und in ProfileLauncher.jsx (bewusst dupliziert,
// kein Cross-Import um Bundle-Kopplung zu vermeiden).
const SYSTEM_USER_ID = "152619c1-9adc-40bf-9078-eb67f5024ed2";

export const HumanHeader = memo(function HumanHeader({ item, onProfile }) {
  const { t } = useTranslation();
  const _uid = item?.author?.id || item?.user_id || item?.creator_id || null;
  const author   = item?.author || {};
  const isSystemBot = _uid === SYSTEM_USER_ID;
  // ── TRACE STEP 8 ──────────────────────────────────────
  if (!window.__HUI_STEP8_DONE__ && item?.type === "work") {
    window.__HUI_STEP8_DONE__ = true;
    if (import.meta.env.DEV) {
      console.group("🔍 STEP 8 - HumanHeader (first work)");
      if (import.meta.env.DEV) { console.log("item.author:", author?.name, "| avatar:", author?.avatar ? "✅" : "❌"); }
      console.groupEnd();
    }
  }
  const name     = (author.name || author.displayName || "").trim() || t('bpp.member');
  const avatar   = author.avatar || author.avatar_url || null;
  const talent   = author.talent || null;
  const loc      = author.location_label || item?.location || null;
  const isT      = author.isTalent || false;
  const mType    = author.membershipType || "base";
  const presence = item?._presenceStatus || null;
  const timeStr  = item?.createdAt || null;
  const grund    = getBegegnungsgrund(item, t);
  const [pressed, setPressed] = React.useState(false);
  // SYSTEMNACHRICHT-LABEL (2026-08-13): Admin-Broadcasts (beitraege.moment_source
  // === "system_broadcast") zeigen statt des generischen Story-Satzes
  // ("myHUI teilt einen persoenlichen Moment.") ein fett/gross hervorgehobenes
  // "Systemnachricht"-Label -- macht sofort klar, dass es sich um eine
  // offizielle Mitteilung handelt, nicht um einen normalen Bot-Moment.
  const isBroadcast = (item?._raw?.moment_source === "system_broadcast");

  // Talent-Akzentfarbe: Wirker=Teal (#0DC4B5), Basis-Nutzer=
  // gedaempftes HUI-Teal (#0AADA3) -- konsistent mit dem etablierten
  // Badge-Farbschema in ProfileHeader.jsx (badgeLabel "Basis-Nutzer" nutzt
  // dort bereits #0AADA3, NICHT grau). Vorher faelschlich grau
  // (rgba(26,26,46,0.52)) -- Nutzer-Feedback (Screenshot, 2026-08-15):
  // "die richtige gruene Farbe" verwenden statt Grau.
  const talentColor = (isT || mType === "talent" || mType === "wirker")
    ? "#0DC4B5"
    : "#0AADA3";

  return (
    <div style={{ padding: "12px 16px 0" }}>

      {/* Zeile 1: Avatar · Name+Talent+Ort · Zeit · ⋮ */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:11 }}>

        {/* Avatar 52px rund */}
        <button
          onClick={onProfile}
          onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
          onMouseDown={() => setPressed(true)}  onMouseUp={() => setPressed(false)}
          style={{
            background:"none", border:"none", padding:0, flexShrink:0,
            position:"relative", opacity: pressed ? 0.75 : 1,
            transition:"opacity 0.15s ease", touchAction:"manipulation",
            WebkitTapHighlightColor:"transparent", cursor:"pointer",
          }}
        >
          <CardAvatar src={avatar} name={name} size={52} isTalent={isT} />
          {presence && presence !== "offline" && (
            <div style={{ position:"absolute", bottom:2, right:2 }}>
              <PresenceDot status={presence} size={11} />
            </div>
          )}
        </button>

        {/* Name + Talent · Ort */}
        <div style={{ flex:1, minWidth:0 }}>
          <span
            onClick={onProfile}
            style={{
              display:"block", fontSize:16, fontWeight: 600,
              color:"#1A1A2E", letterSpacing:-0.3, lineHeight:1.25,
              cursor:"pointer", WebkitTapHighlightColor:"transparent",
            }}
          >{name}</span>

          {/* Status (Talent/Rolle) + Ort — vertikal gestapelt (CARD-HEADER-001) */}
          <div style={{ display:"flex", flexDirection:"column", gap:2, marginTop:3 }}>
            {isSystemBot && (
              <span style={{
                display:"inline-flex", alignSelf:"flex-start",
                fontSize:10.5, fontWeight:600, color:"#0DC4B5",
                background:"rgba(13,196,181,0.10)",
                border:"1px solid rgba(13,196,181,0.22)",
                borderRadius:99, padding:"2px 8px", letterSpacing:0.2,
              }}>
                Bot
              </span>
            )}
            {talent && (
              <span style={{
                fontSize:13, fontWeight:600, color:talentColor,
                lineHeight:1.3, whiteSpace:"nowrap", overflow:"hidden",
                textOverflow:"ellipsis",
              }}>
                {talent}
              </span>
            )}
            {loc && (
              <div style={{ display:"flex", alignItems:"center", gap:2 }}>
                <svg width="9" height="12" viewBox="0 0 9 12" fill="none" style={{ flexShrink:0 }}>
                  <path d="M4.5 0C2.294 0 .5 1.794.5 4C.5 7.09 4.5 12 4.5 12S8.5 7.09 8.5 4C8.5 1.794 6.706 0 4.5 0ZM4.5 5.5C3.67 5.5 3 4.83 3 4C3 3.17 3.67 2.5 4.5 2.5C5.33 2.5 6 3.17 6 4C6 4.83 5.33 5.5 4.5 5.5Z" fill="#F47355"/>
                </svg>
                <span style={{
                  fontSize:12, color:"rgba(26,26,46,0.55)", fontWeight:400,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>{loc}</span>
              </div>
            )}
          </div>
        </div>

        {/* Zeit + ⋮ */}
        <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0, paddingTop:2 }}>
          {timeStr && (
            <span style={{ fontSize:12, color:"rgba(26,26,46,0.36)", fontWeight:400, whiteSpace:"nowrap" }}>
              {timeStr}
            </span>
          )}
          {/* 3-Punkte-Menü: auf Wunsch unsichtbar/entfernt (2026-08-05) — kein onClick-Handler vorhanden, war rein dekorativ */}
          <button aria-hidden="true" tabIndex={-1} style={{
            display:"none",
          }}>⋮</button>
        </div>
      </div>

      {/* Systemnachricht-Label (Broadcast) ODER Großes " + Story-Satz */}
      {isBroadcast ? (
        <div style={{ marginTop:9, marginBottom:10 }}>
          <span style={{
            display:"inline-block", fontSize:12.5, fontWeight:800,
            color:"#F47355", letterSpacing:"0.09em", textTransform:"uppercase",
          }}>{t("feed.systemMsg")}</span>
        </div>
      ) : grund && (
        <div style={{ display:"flex", alignItems:"flex-start", gap:7, marginTop:9, marginBottom:10 }}>
          <span style={{
            fontSize:30, fontWeight: 600, color:"#F47355",
            lineHeight:0.7, flexShrink:0, marginTop:5,
            fontFamily:"Georgia,'Times New Roman',serif",
            userSelect:"none",
          }}>"</span>
          <p style={{
            margin:0, fontSize:15, fontWeight:500,
            color:"#1A1A2E", lineHeight:1.45, letterSpacing:"-0.01em",
          }}>{grund}</p>
        </div>
      )}
    </div>
  );
});


// ── Header ────────────────────────────────────────────────────
export const FeedCardHeader = memo(function FeedCardHeader({ author, time, badge, onProfile, presenceStatus }) {
  const { t } = useTranslation();
  const _isTalent = author?.isTalent || false;
  const _mType    = author?.membershipType || "base";
  const name   = ((author && (author.name || author.displayName)) || "").trim() || t('bpp.member');
  const uname  = (author && author.username) || null;
  // avatar: author.avatar (normalisiert) — bereits als URL oder null
  const avatar = author?.avatar || author?.avatar_url || null;
  const ver    = (author && author.verified) || false;
  const uid    = (author && author.id)       || null;
  const [pressed, setPressed] = useState(false);

  return (
    <div style={{ display:"flex",alignItems:"center",gap:T.gap,padding:T.p+"px "+T.p+"px 0" }}>
      {/* Avatar → direkt vollständiges Profil öffnen */}
      <button
        onClick={onProfile ? () => onProfile() : undefined}
        onPointerDown={uid ? () => prefetchProfile(uid) : undefined}
        onMouseEnter={uid ? () => prefetchProfile(uid) : undefined}
        onTouchStart={onProfile ? () => setPressed(true)  : undefined}
        onTouchEnd={onProfile   ? () => setPressed(false) : undefined}
        onMouseDown={onProfile  ? () => setPressed(true)  : undefined}
        onMouseUp={onProfile    ? () => setPressed(false) : undefined}
        style={{
          background:"none",border:"none",padding:0,
          cursor: onProfile ? "pointer" : "default",
          flexShrink:0,
          position:"relative",
          opacity: pressed ? 0.72 : 1,
          transition: "opacity 0.15s ease",
          touchAction: "manipulation",
          WebkitTapHighlightColor:"transparent",
        }}
      >
        <CardAvatar src={avatar} name={name} size={38} isTalent={_isTalent}/>
        {presenceStatus && presenceStatus !== "offline" && (
          <div style={{ position:"absolute", bottom:-1, right:-1 }}>
            <PresenceDot status={presenceStatus} size={9} />
          </div>
        )}
      </button>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:5 }}>
          <span
            onClick={onProfile ? () => onProfile() : undefined}
            onPointerDown={uid ? () => prefetchProfile(uid) : undefined}
            onMouseEnter={uid ? () => prefetchProfile(uid) : undefined}
            style={{ fontSize:13.5,fontWeight: 600,color:T.ink,letterSpacing:-0.2,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
              cursor: onProfile ? "pointer" : "default",
              WebkitTapHighlightColor:"transparent",
            }}>
            {name}
          </span>
          {ver && <span style={{ fontSize:11,color:T.teal }}>✦</span>}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:2,flexWrap:"wrap" }}>
          <MembershipLabel membershipType={_mType} size="xs" />
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:1 }}>
          {uname && <span style={{ fontSize:11,color:T.ink3 }}>{"@"+uname}</span>}
          {uname && time && <span style={{ fontSize:11,color:T.ink3 }}>·</span>}
          {time  && <span style={{ fontSize:11,color:T.ink3 }}>{time}</span>}
          {presenceStatus === "online" && (
            <span style={{ fontSize:10.5, color:"#22C55E", fontWeight:500 }}>● gerade online</span>
          )}
        </div>
      </div>
      {badge && (
        <div style={{
          padding:"3px 9px",borderRadius:20,
          background: badge.bg||T.tealSoft,
          border:"1px solid "+(badge.border||T.tealLine),
          fontSize:10,fontWeight: 600,color:badge.color||T.teal,
          flexShrink:0,letterSpacing:0.3,
        }}>
          {badge.label}
        </div>
      )}
    </div>
  );
});

// ── Media (lazy + fade-in + double-tap like) ──────────────────
export const FeedMedia = memo(function FeedMedia({ media, alt, relaxed, onDoubleTap, disableTapLightbox = false, blurred = false }) {
  const { t } = useTranslation();
  const [err,       setErr]      = useState(false);
  const [loaded,    setLoaded]   = useState(false);
  const [heartPos,  setHeartPos] = useState(null);
  const tapRef = useRef({ t: 0, x: 0, y: 0, startY: 0, startX: 0, moved: false });
  const lightboxTimerRef = useRef(null);
  const containerRef = useRef(null);
  const [containerW, setContainerW] = useState(0);

  injectCardCSS();

  // Container-Breite messen
  useEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      if (containerRef.current) setContainerW(containerRef.current.offsetWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Medien normalisieren ──
  let imgs = [];
  if (Array.isArray(media) && media.length > 0) {
    imgs = media;
  } else if (typeof media === "string" && media.length > 0) {
    imgs = [{ url: media, type: "image" }];
  }
  // Video-Erkennung
  imgs = imgs.map(m => {
    const u = typeof m === "string" ? m : m?.url;
    if (!u) return null;
    let isVid = !!(typeof m === "object" && m.type === "video");
    if (!isVid) isVid = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(u);
    return { url: u, type: isVid ? "video" : "image", alt: (typeof m === "object" && m.alt) || alt || "" };
  }).filter(Boolean);

  if (!imgs.length || err) return null;

  const firstUrl = imgs[0].url;
  const isVideo = imgs[0].type === "video";

  // FEED-UNIFORM-FIX (2026-08-07): Feste Hoehe fuer alle Karten.
  const h = relaxed ? 340 : T.mediaH;

  function handleTouchStart(e) {
    if (e.touches && e.touches[0]) {
      tapRef.current.startX = e.touches[0].clientX;
      tapRef.current.startY = e.touches[0].clientY;
      tapRef.current.moved = false;
    }
  }

  function handleTouchMove(e) {
    if (e.touches && e.touches[0] && !tapRef.current.moved) {
      const dx = Math.abs(e.touches[0].clientX - tapRef.current.startX);
      const dy = Math.abs(e.touches[0].clientY - tapRef.current.startY);
      if (dx > 10 || dy > 10) {
        tapRef.current.moved = true;
        if (lightboxTimerRef.current) { clearTimeout(lightboxTimerRef.current); lightboxTimerRef.current = null; }
      }
    }
  }

  function handleTap(e) {
    // SYSTEM-PROJECT-LINK-001 (2026-08-10): Fuer Karten mit eigenem
    // onCardClick-Ziel (z.B. System-Post -> Projekt-Deep-Link) soll ein
    // Tap NICHT zusaetzlich den globalen Foto-Lightbox oeffnen -- additiv,
    // Default false aendert nichts am Verhalten aller anderen Karten.
    if (disableTapLightbox) return;
    // SCROLL-GUARD: Wenn der Finger beim Beruehren bewegt wurde → kein Tap
    if (tapRef.current.moved) {
      tapRef.current = { t: 0, startX: 0, startY: 0, moved: false };
      return;
    }
    const now = Date.now();
    const dt  = now - tapRef.current.t;
    if (dt < 320 && dt > 60) {
      // Double tap → Like (heart burst)
      if (lightboxTimerRef.current) { clearTimeout(lightboxTimerRef.current); lightboxTimerRef.current = null; }
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = (e.touches?.[0]?.clientX || e.clientX) - rect.left;
      const cy = (e.touches?.[0]?.clientY || e.clientY) - rect.top;
      setHeartPos({ x: cx, y: cy });
      onDoubleTap?.();
      setTimeout(() => setHeartPos(null), 750);
      tapRef.current = { t: 0, startX: 0, startY: 0, moved: false };
    } else {
      // Single tap → start timer for lightbox (wird cancelled bei double-tap)
      tapRef.current = { t: now, startX: tapRef.current.startX, startY: tapRef.current.startY, moved: false };
      if (lightboxTimerRef.current) clearTimeout(lightboxTimerRef.current);
      lightboxTimerRef.current = setTimeout(() => {
        if (blurred) {
          toast.warn(t('mom.underReview'));
          return;
        }
        if (typeof window !== "undefined" && window.__HUI_LIGHTBOX__) {
          window.__HUI_LIGHTBOX__.open(imgs, 0);
        }
      }, 300);
    }
  }

  // ── Single video: keep video with controls (no lightbox needed) ──
  if (isVideo && imgs.length === 1) {
    return (
      <div
        ref={containerRef}
        style={{
          margin: "10px " + T.p + "px 0",
          height: h, borderRadius: T.rMedia,
          overflow: "hidden", background: "#F0EFED",
          flexShrink: 0, position: "relative",
          boxShadow: "0 4px 20px rgba(26,26,46,0.08)",
        }}
      >
        {!loaded && (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(135deg,rgba(22,215,197,0.07),rgba(255,138,107,0.07))",
            animation: "huiShimmer 1.6s ease-in-out infinite",
            backgroundSize: "200% 100%",
          }} />
        )}
        <video
          src={firstUrl}
          muted
          loop
          playsInline
          autoPlay
          controls
          preload="metadata"
          onLoadedData={() => setLoaded(true)}
          onError={() => setErr(true)}
          className="hui-card-img"
          style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.3s ease",
            willChange: "opacity, transform",
            background: "#000",
            filter: blurred ? "blur(24px)" : "none",
          }}
        />
      </div>
    );
  }

  // ── 2+ images: use ImageSlider with lightbox on tap ──
  // ── 1 image: clickable to open lightbox ──
  // Both cases handled by ImageSlider (single-image = no dots, just tappable)
  return (
    <div
      ref={containerRef}
      style={{
        margin: "10px " + T.p + "px 0",
        height: h, borderRadius: T.rMedia,
        overflow: "hidden", background: "#F0EFED",
        flexShrink: 0, position: "relative",
        cursor: "pointer",
        boxShadow: "0 4px 20px rgba(26,26,46,0.08)",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTap}
      onDoubleClick={handleTap}
    >
      {/* Blur placeholder while loading (nur fuer erstes Bild) */}
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg,rgba(22,215,197,0.07),rgba(255,138,107,0.07))",
          animation: "huiShimmer 1.6s ease-in-out infinite",
          backgroundSize: "200% 100%",
          zIndex: 0,
        }} />
      )}

      <div style={{ position: "relative", zIndex: 1, height: "100%", filter: blurred ? "blur(24px)" : "none" }}>
        <ImageSlider
          images={imgs}
          height={h}
          borderRadius={0}
          showDots={imgs.length > 1}
          objectFit="cover"
          onImageTap={blurred ? () => { toast.warn(t('mom.underReview')); } : null /* MODERATION-BLUR-BYPASS-FIX */}
        />
        {/* onLoad tracking for first image shimmer */}
        <img
          src={firstUrl}
          alt=""
          loading="lazy"
          style={{ display: "none" }}
          onLoad={() => setLoaded(true)}
          onError={() => setErr(true)}
        />
      </div>

      {blurred && (
        <div style={{
          position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
          padding: "4px 12px", borderRadius: 16,
          background: "rgba(15,30,26,0.75)", color: "white",
          fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
          zIndex: 2, pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          ⚠️ Automatisch verpixelt — Inhalt wird geprüft
        </div>
      )}

      {/* Heart burst on double-tap */}
      {heartPos && (
        <div style={{
          position: "absolute",
          left: heartPos.x, top: heartPos.y,
          pointerEvents: "none",
          fontSize: 64,
          lineHeight: 1,
          animation: "huiHeartBurst 0.7s cubic-bezier(.22,1,.36,1) forwards",
          willChange: "transform, opacity",
          zIndex: 5,
          filter: "drop-shadow(0 4px 12px rgba(255,100,100,0.45))",
        }}>❤️</div>
      )}
    </div>
  );
});

// ── Action Button ─────────────────────────────────────────────
// HUI Interaction Language v1.0: "Icon" ist eine der vier zentralen SVG-
// Komponenten aus design/icons/HuiInteractionIcons.jsx (ResonanceIcon,
// HUIChatIcon, HUIBookmarkIcon, HUIShareIcon). Die Icons behalten ihre
// eigene, aus der Referenz uebernommene Gradient-Farbe IMMER -- aktiv/
// inaktiv wird nicht mehr ueber Farbwechsel, sondern ueber Opacity + Scale
// ausgedrueckt (Referenzgrafik gibt keine Toggle-Farbvariante vor).
// ARIA-Label je Interaktion (Toggle-Paar wo zutreffend) -- deckt alle 4
// Icons der HUI Interaction Icon Library v1.0 ab, nicht nur Resonanz.
function getActionAria(t) {
  return {
    resonanz:    { on: t('card.ariaResonanzOn'),   off: t('card.ariaResonanzOff') },
    austauschen: { on: t('card.ariaAustauschenOn'), off: t('hii.austauschen') },
    merken:      { on: t('card.ariaMerkenOn'),      off: t('hii.merken') },
    weitergeben: { off: t('hii.weitergeben') }, // kein Toggle -- einmalige Aktion
    // KOMMENTAR.1 (2026-07-09): oeffnet die Kommentarfunktion, kein Toggle
    kommentieren: { off: t('card.ariaKommentierenOff') },
  };
}
export const ActionBtn = memo(function ActionBtn({
  Icon, label, count, active, onClick, activeColor, inactiveColor, variant, disabled, loading
}) {
  const { t } = useTranslation();
  const ACTION_ARIA = getActionAria(t);
  const isResonanz = variant === "resonanz";
  const ariaSpec = ACTION_ARIA[variant];
  const ariaLabel = ariaSpec ? (active && ariaSpec.on ? ariaSpec.on : ariaSpec.off) : (label || undefined);
  const isToggle = !!(ariaSpec && ariaSpec.on);
  const [scale, setScale] = useState(false);
  const [hover, setHover] = useState(false);

  // Premium-Finetuning 2026-07-05 (Lars) -- Tap-Animation komplett
  // vereinheitlicht: EIN sanfter Scale (1.04, Fenster 1.03-1.05), EINE
  // Dauer (160ms, Fenster 140-180ms), ease-out, fuer ALLE vier Icons
  // identisch. Ersetzt die bisherigen variantspezifischen Bounce-/Pop-
  // Effekte (Bookmark-Pulse 1.3 mit Ueberschwing-Keyframe, Resonanz-Glow-
  // Filter, Default-Shrink auf 0.88) -- Lars: "keine Bounce-Effekte, keine
  // Pop-Animation, keine Spielerei".
  // Runde 3 (Lars Punkt 7): Scale 1.03 (statt 1.04), 150ms (statt 160ms) --
  // noch dezenter, exakt nach Vorgabe.
  const PRESS_MS = 150;
  const PRESS_SCALE = 1.03;

  function handleClick() {
    if (disabled || loading) return;
    setScale(true);
    setTimeout(() => setScale(false), PRESS_MS);
    onClick?.();
  }

  const col = active ? (activeColor || T.teal) : (inactiveColor || T.ink3);
  // Zustände — Form bleibt IMMER identisch, nur Opacity/Scale ändern sich:
  // disabled < default < hover < active.
  const iconOpacity = disabled ? 0.28 : active ? 1 : hover ? 0.9 : (inactiveColor ? 0.72 : 0.64);
  // Sehr dezenter Hintergrund-Kreis beim Antippen (8% HUI-Tuerkis/-Koralle,
  // je nach activeColor der jeweiligen Aktion) -- kein Schatten, kein Glanz.
  const resolvedColor = active ? (activeColor || T.teal) : (inactiveColor || activeColor || T.teal);
  const circleBg = (resolvedColor === T.coral || resolvedColor === "#F47355" || resolvedColor === "#E8573A")
    ? "rgba(244,115,85,0.08)"
    : (resolvedColor === "#F59E0B" || resolvedColor === "#FBBF24")
    ? "rgba(245,158,11,0.08)"
    : "rgba(13,196,181,0.08)";
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={isToggle ? !!active : undefined}
      aria-busy={!!loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        background: "none", border: "none",
        // Premium-Finetuning Runde 3 2026-07-05 (Lars Punkt 2 "Action-Leiste
        // flacher"): vertikales Padding 9px->5px reduziert (das sichtbare
        // Icon ist jetzt 31px, minHeight:44 bleibt als garantierter
        // Touch-Floor bestehen -- der Button wird also visuell flacher,
        // die tatsaechliche Tap-Flaeche bleibt >=44x44px unangetastet).
        padding: "5px 11px",
        cursor: disabled ? "default" : "pointer",
        display: "flex", alignItems: "center", gap: 6,
        borderRadius: 12,
        touchAction: "manipulation",
        minWidth: 48, minHeight: 48, justifyContent: "center", // alle 4 Icons: 48x48 Touchflaeche (A11y-Vorgabe)
        transform: scale ? `scale(${PRESS_SCALE})` : "scale(1)",
        transition: `transform ${PRESS_MS}ms cubic-bezier(0.16,1,0.3,1)`,
        willChange: "transform",
      }}
    >
      {/* Dezenter Tap-Hintergrundkreis -- faedet mit dem Scale synchron
          ein/aus, liegt hinter dem Icon (zIndex 0). */}
      <span aria-hidden="true" style={{
        position: "absolute", top: "50%", left: "50%",
        width: 40, height: 40, marginLeft: -20, marginTop: -20,
        borderRadius: "50%", background: circleBg,
        opacity: scale ? 1 : 0,
        transition: `opacity ${PRESS_MS}ms cubic-bezier(0.16,1,0.3,1)`,
        pointerEvents: "none", zIndex: 0,
      }} />
      <span style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        opacity: loading ? 0.5 : iconOpacity, color: col,
        // Premium-Finetuning 2026-07-05 (Lars): Icon-Reihe 4px tiefer gesetzt,
        // damit alle vier Icons (PNG + SVG, mit je eigenem visuellem
        // Schwerpunkt) auf einer gemeinsamen, vertikal zentrierten
        // Grundlinie liegen statt "schwebend" zu wirken. Kein Glanz-/
        // Schatten-Filter mehr (Charta: keine Glanzeffekte im aktiven Zustand).
        transform: "translateY(4px)",
        transition: "opacity 0.18s ease",
      }}>
        {/* Premium-Finetuning Runde 3 2026-07-05 (Lars): 27px -> 31px, im
            geforderten 30-32px-Fenster fuer "noch etwas praesenter". */}
        {Icon ? <Icon size={31} active={!!active} /> : null}
        {loading && (
          <span aria-hidden="true" style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `2px solid ${col}`, borderTopColor: "transparent",
            animation: "hui-icon-spin 700ms linear infinite",
          }} />
        )}
      </span>
      {(count != null || label) && (
        <span style={{
          fontSize: 12.5, color: col,
          fontWeight: active ? 600 : 400,
          transition: "color 0.18s ease",
        }}>
          {count != null ? count : label}
        </span>
      )}
    </button>
  );
});

// ── Resonanz-Zeile v3.0 — nach Mockup ────────────────────────
// Format: "[Name] und [N] weitere wurden inspiriert."
function getResonanzText(r, t) {
  const inspire = r.inspireCount || 0;
  const touch   = r.touchCount   || 0;
  const total   = inspire + touch;
  if (total === 0) return null;
  const firstName = r.firstInspirer
    ? (r.firstInspirer.split(" ")[0] || null)
    : null;
  if (firstName && total > 1)
    return t('card.resonanzMultiple', { firstName, n: total - 1 });
  if (firstName && total === 1)
    return t('card.resonanzSingleName', { firstName });
  if (total === 1)
    return t('card.resonanzOnePerson');
  if (inspire >= touch)
    return t('card.resonanzAllInspired', { total });
  return t('card.resonanzReacted', { total });
}

// ── Actions bar ───────────────────────────────────────────────
export const FeedActions = memo(function FeedActions({
  reactions, onReaction, onShare, extraActions
}) {
  const { t } = useTranslation();
  const r = reactions || {};
  const resonanz = getResonanzText(r, t);
  // Premium-Finetuning Runde 3 2026-07-05 (Lars Punkt 3, "mit der Karte
  // verschmelzen"): marginTop 12->4, Border-Deckkraft 0.07->0.045
  // ("nur sehr dezent"), explizites background:T.bgCard (identisch zur
  // Karte) + untere Eckenrundung wie die Karte (T.r, die Karte selbst
  // hat bereits overflow:hidden, hier zusaetzlich defensiv gesetzt).
  return (
    <div style={{
      borderTop: "1px solid rgba(26,26,46,0.045)",
      marginTop: 0,
      background: T.bgCard,
      borderBottomLeftRadius: T.r,
      borderBottomRightRadius: T.r,
    }}>
      {/* Reaktions-Buttons — Fine-Tuning 2026-07-05 (Lars): von "2 links /
          2 rechts via flex-Spacer" auf eine optisch exakt mittig
          ausgerichtete 4er-Gruppe umgestellt (Apple-Premium-Anmutung,
          ruhiger). gap von 2->10px erhoeht fuer mehr Luft zwischen den
          Icons; kombiniert mit der breiteren Klickflaeche (44x44) ergibt
          das einen deutlich grosszuegigeren, aber immer noch dezenten
          Gesamtabstand. Reihenfolge unveraendert: Resonanz, Austauschen,
          Weitergeben, Merken. extraActions (aktuell nirgends befuellt)
          bleibt als optionaler Slot am Ende der zentrierten Gruppe erhalten. */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center",
        // Runde 3 (Lars Punkt 2, "flacher"): Row-Padding 8/6px -> 3/3px --
        // zusammen mit dem verkleinerten Button-Padding ca. 18% weniger
        // Gesamthoehe ggue. Runde 2, trotz groesserer 31px-Icons.
        padding:"3px " + (T.p - 4) + "px 3px",
        gap:10,
      }}>
        {/* HUI Interaction Language v1.0 (2026-07-05) — Mapping auf bestehende
            Reaction-Handler (kein Datenmodell-Wechsel, reines Re-Skin):
              inspire → Resonanz   | touch → Austauschen
              onShare → Weitergeben (2026-07-05: ehem. "Empfehlen", Schale+Samen
                                    → Schwung-Pfeil nach Lars-Vorlage; onShare
                                    oeffnet bereits den Teilen-Flow)
              save    → Merken */}
        <ActionBtn Icon={HUIHeartIcon}    count={r.inspireCount||null} active={r.inspired} activeColor={T.coral}  inactiveColor={T.coral}  variant="resonanz"    onClick={() => { haptic(r.inspired ? "selection" : "light"); onReaction?.("inspire"); }} />
        <ActionBtn Icon={HUIChatIcon}     count={r.commentCount||null} active={false}      activeColor={T.teal}  inactiveColor={T.teal}   variant="austauschen" onClick={() => { haptic("light"); onReaction?.("touch"); }} />
        <ActionBtn Icon={HUIShareIcon}    count={r.shareCount||null} activeColor={T.teal}  inactiveColor={T.teal}   variant="weitergeben" onClick={() => { haptic("light"); onShare?.(); }} />
        <ActionBtn Icon={HUIBookmarkIcon} count={r.saveCount||null} active={r.saved} activeColor={"#F59E0B"} inactiveColor={"#F59E0B"} variant="merken" onClick={() => { haptic(r.saved ? "selection" : "light"); onReaction?.("save"); }} />
        {extraActions || null}
      </div>
      {/* Resonanz-Zeile — "Maja und 18 weitere wurden inspiriert." */}
      {resonanz && (
        <div style={{
          padding:"0 " + T.p + "px 11px",
        }}>
          <span style={{ fontSize:12, color:"rgba(26,26,46,0.50)", fontWeight:400 }}>
            {resonanz}
          </span>
        </div>
      )}
    </div>
  );
});

// ── Base Card ─────────────────────────────────────────────────
export default React.memo(function BaseFeedCard({
  item, onProfile, onReaction, onShare, badge, children, extraActions, onCardClick,
  disableMediaLightbox = false, // SYSTEM-PROJECT-LINK-001: additiv, Default false
}) {
  injectCardCSS();

  const reactions = item?._reactions || {};

  // Optimistic like state
  const [localReactions, setLocalReactions] = useState(reactions);

  // Sync if item changes externally.
  // FIX B (2026-07-16): Primitive Dependencies statt Objekt-Referenz.
  // Vorher: [item?.id] — reagierte nie auf asynchron nachgeladene Counts
  // (inspireCount/touchCount kommen aus useSingleReaction nach dem Mount).
  // FIX C (2026-08-04): commentCount fehlte in den Dependencies — die
  // Kommentar-Anzahl wird in UnifiedFeed.jsx lazy per RPC nachgeladen
  // (countComments, erst nach visible+Mount). Da inspireCount/touchCount
  // oft schon vor commentCount stabil sind, feuerte dieser Effect nie
  // erneut wenn NUR commentCount sich aenderte -> localReactions blieb
  // auf dem Mount-Wert (meist null) eingefroren -> Sprechblase zeigte
  // zufaellig mal die korrekte Zahl (falls ein anderer Count sich zufaellig
  // mitaenderte), mal keine Zahl -- vom Nutzer als "mal 7 mal 0" gemeldet.
  // Jetzt: vier primitive Werte — React vergleicht mit === statt Referenz.
  React.useEffect(() => {
    setLocalReactions(item?._reactions || {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, item?._reactions?.inspireCount, item?._reactions?.touchCount, item?._reactions?.commentCount,
      // FIX D (2026-08-07): saveCount/saved fehlten hier -- ein Klick auf
      // "Merken" aktualisierte die Herzchen/Sprechblase sofort (siehe
      // FIX C), aber der Bookmark-Zaehler/-Zustand blieb bis zum naechsten
      // Aendern von inspireCount/touchCount/commentCount (oder Reload)
      // auf dem alten Wert stehen, weil dieser Effect fuer save-Aenderungen
      // gar nicht erneut lief.
      item?._reactions?.saveCount, item?._reactions?.saved]);

  // HOOK-ORDER-FIX (2026-08-08): handleReaction/handleDoubleTap muessen
  // VOR dem fruehen "return null" stehen. Vorher standen sie danach --
  // sobald item?.id einmal falsy war (z.B. waehrend eines Re-Renders im
  // Feed-Stream), ueberspreng React diese beiden useCallback-Aufrufe fuer
  // diesen Render, wich damit von der Hook-Reihenfolge des vorherigen
  // Renders ab und crashte mit "Minified React error #310"
  // (Rendered fewer/more hooks than during the previous render) --
  // reproduzierbar beim Antippen eines Bildes, weil das Oeffnen der
  // Lightbox einen Re-Render dieser Karte ausloeste.
  const handleReaction = useCallback((type) => {
    // Optimistic update
    setLocalReactions(prev => {
      const next = { ...prev };
      if (type === "inspire") {
        next.inspired = !prev.inspired;
        next.inspireCount = (prev.inspireCount || 0) + (next.inspired ? 1 : -1);
      } else if (type === "touch") {
        next.touched = !prev.touched;
        next.touchCount = (prev.touchCount || 0) + (next.touched ? 1 : -1);
      } else if (type === "save") {
        // FIX D (2026-08-07): saveCount wurde nie mitgezaehlt -- der
        // Zaehler neben dem Bookmark-Icon aenderte sich beim Klick nicht
        // sofort (nur "saved"/Icon-Zustand), sondern erst nachdem der
        // obige Sync-Effect aus einem anderen Grund erneut lief.
        next.saved = !prev.saved;
        next.saveCount = Math.max(0, (prev.saveCount || 0) + (next.saved ? 1 : -1));
      }
      return next;
    });
    // Propagate to parent (DB update)
    onReaction?.(type);
  }, [onReaction]);

  const handleDoubleTap = useCallback(() => {
    if (!localReactions.touched) {
      handleReaction("touch");
    }
  }, [localReactions.touched, handleReaction]);

  if (!item?.id) return null;

  return (
    <article
      style={{
        background: T.bgCard,
        borderRadius: T.r,
        marginBottom: 12,
        marginLeft: 12,
        marginRight: 12,
        boxShadow: T.shadow,
        border: "1px solid " + T.border,
        overflow: "hidden",
        animation: "huiFadeUp 0.3s ease both",
        willChange: "transform, opacity",
      }}
    >
      {/* Kapitel 2.3: Menschen zuerst */}
      <HumanHeader item={item} onProfile={onProfile} />

      {/* HUI Pillar Hint — 🍃 dezent, nie dominant, nur wenn vorhanden */}
      {item?.pillar_hint && (
        <div className="hui-pillar-hint" aria-hidden="true">
          {item.pillar_hint}
        </div>
      )}

      {badge && (
        <div style={{ paddingLeft:16, paddingRight:16, marginBottom:6, display:"flex", justifyContent:"flex-end" }}>
          <div style={{
            padding:"3px 10px", borderRadius:20,
            background:badge.bg||T.tealSoft, border:"1px solid "+(badge.border||T.tealLine),
            fontSize:10, fontWeight: 600, color:badge.color||T.teal, letterSpacing:0.3,
          }}>{badge.label}</div>
        </div>
      )}
      {/* Content + Media: klickbarer Bereich für Werk-Detail-Navigation */}
      {/* onCardClick nur für Work-Karten gesetzt (von WorkContent) */}
      {/* Avatar/Name (HumanHeader) und Actions haben eigene Handler → kein Konflikt */}
      <div
        onClick={onCardClick || undefined}
        style={onCardClick ? { cursor:"pointer", WebkitTapHighlightColor:"transparent" } : undefined}
      >
        <div style={{ padding: "0 " + T.p + "px 4px" }}>{children}</div>
        <FeedMedia
          media={item.media}
          alt={item.title || item.text}
          relaxed={!!(item._reactions?._relaxed)}
          onDoubleTap={onCardClick ? (e) => { /* double-tap → detail, kein like-trigger */ } : handleDoubleTap}
          disableTapLightbox={disableMediaLightbox}
          blurred={!!(item?._raw?.moderation_blurred)}
        />
      </div>
      <FeedActions
        reactions={localReactions}
        onReaction={handleReaction}
        onShare={onShare}
        extraActions={extraActions}
      />
    </article>
  );
}); // React.memo(BaseFeedCard)