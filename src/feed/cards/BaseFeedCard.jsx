// src/feed/cards/BaseFeedCard.jsx — Phase 4D
// Avatar tap → direkt vollständiges Profil öffnen (kein QuickPreview mehr)
// ══════════════════════════════════════════════════════════════
// Double-tap like · Heart burst · Optimistic reactions
// Shimmer skeleton · Lazy image loading · Scale press states
// GPU-accelerated animations via transform
// ══════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, memo } from "react";
import { PresenceDot } from "../../lib/usePresence.jsx";
import { MembershipLabel } from "../../components/ui/TalentBadge.jsx";
// HUI Interaction Language v1.0 (2026-07-05) — Single Source of Truth fuer
// die vier universellen Interaktionen (Resonanz/Austauschen/Merken/Empfehlen).
// Ersetzt die bisherigen Emoji-Icons (✦/🤍/💬/🔖) plattformweit.
import {
  HUIHeartIcon, HUIChatIcon, HUIBookmarkIcon, HUIShareIcon,
} from "../../design/icons/HuiInteractionIcons.jsx";
import { haptic } from "../../components/commerce/commerceUtils.js";

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
      fontSize:size*0.38,fontWeight:700,color:T.teal,
    }}>
      {src && !err
        ? <img loading="lazy" decoding="async" src={src} alt={name||""} onError={() => setErr(true)}
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
function getBegegnungsgrund(item) {
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
    if (cat && first)
      return `${first} wirkt im Bereich ${cat} und hat ein neues Werk erschaffen.`;
    if (first)
      return `${first} hat ein neues Werk veröffentlicht.`;
    return "Hat ein neues Werk veröffentlicht.";
  }

  // ── ERLEBNIS ──────────────────────────────────────────────────────────────
  if (type === "experience") {
    if (tag && first)
      return `${first} lädt dich zu einem Erlebnis ein im Bereich ${tag}.`;
    if (loc && first)
      return `${first} lädt zu einem gemeinsamen Erlebnis ein in ${loc}.`;
    if (first)
      return `${first} lädt zu einem gemeinsamen Erlebnis ein.`;
    return "Lädt zu einem gemeinsamen Erlebnis ein.";
  }

  // ── TALENT-ANGEBOT ────────────────────────────────────────────────────────
  if (type === "talent") {
    if (cat && first)
      return `${first} wirkt als Talent und bietet sein Können im Bereich ${cat} an.`;
    if (first)
      return `${first} bietet sein Talent an.`;
    return "Bietet ein Talent an.";
  }

  // ── IMPACT / HERZENSPROJEKT ───────────────────────────────────────────────
  if (type === "impact") {
    if (first)
      return `${first} hat ein Herzensprojekt geteilt.`;
    return "Ein Herzensprojekt wurde geteilt.";
  }

  // ── EVENT ─────────────────────────────────────────────────────────────────
  if (type === "event") {
    if (loc && first)
      return `${first} organisiert ein Event in ${loc}.`;
    if (first)
      return `${first} organisiert ein gemeinsames Event.`;
    return "Organisiert ein gemeinsames Event.";
  }

  // ── MOMENT / GEDANKE / ALLES ANDERE ───────────────────────────────────────
  // NIEMALS Profilbezeichnung (author.talent) hier verwenden.
  if (first)
    return `${first} teilt einen persönlichen Moment.`;
  return "Teilt einen persönlichen Moment.";
}

// ── HumanHeader v3.0 — exakt nach Mockup ─────────────────────
// Zeile 1: Avatar (52px rund) · Name · Zeit rechts · ⋮
// Zeile 2: Talent (farbig) · Pin-SVG · Ort
// Zeile 3: " (groß, orange) + Story-Satz
export const HumanHeader = memo(function HumanHeader({ item, onProfile }) {
  const author   = item?.author || {};
  // ── TRACE STEP 8 ──────────────────────────────────────
  if (!window.__HUI_STEP8_DONE__ && item?.type === "work") {
    window.__HUI_STEP8_DONE__ = true;
    if (import.meta.env.DEV) {
      console.group("🔍 STEP 8 - HumanHeader (first work)");
      if (import.meta.env.DEV) { console.log("item.author:", author?.name, "| avatar:", author?.avatar ? "✅" : "❌"); }
      console.groupEnd();
    }
  }
  const name     = (author.name || author.displayName || "").trim() || "Mitglied";
  const avatar   = author.avatar || author.avatar_url || null;
  const talent   = author.talent || null;
  const loc      = author.location_label || item?.location || null;
  const isT      = author.isTalent || false;
  const mType    = author.membershipType || "base";
  const presence = item?._presenceStatus || null;
  const timeStr  = item?.createdAt || null;
  const grund    = getBegegnungsgrund(item);
  const [pressed, setPressed] = React.useState(false);

  // Talent-Akzentfarbe: Wirker=Teal, Ambassador=Coral, Basis=gedämpft
  const talentColor = (isT || mType === "talent" || mType === "wirker")
    ? "#0DC4B5"
    : (mType === "ambassador" ? "#F47355" : "rgba(26,26,46,0.52)");

  return (
    <div style={{ padding: "14px 14px 0" }}>

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
              display:"block", fontSize:16, fontWeight:800,
              color:"#1A1A2E", letterSpacing:-0.3, lineHeight:1.25,
              cursor:"pointer", WebkitTapHighlightColor:"transparent",
            }}
          >{name}</span>

          {/* Status (Talent/Rolle) + Ort — vertikal gestapelt (CARD-HEADER-001) */}
          <div style={{ display:"flex", flexDirection:"column", gap:2, marginTop:3 }}>
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
          <button style={{
            background:"none", border:"none", padding:"1px 4px",
            cursor:"pointer", color:"rgba(26,26,46,0.38)", fontSize:20, lineHeight:1,
            WebkitTapHighlightColor:"transparent",
          }}>⋮</button>
        </div>
      </div>

      {/* Großes " + Story-Satz */}
      {grund && (
        <div style={{ display:"flex", alignItems:"flex-start", gap:7, marginTop:11, marginBottom:12 }}>
          <span style={{
            fontSize:30, fontWeight:900, color:"#F47355",
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
  const _isTalent = author?.isTalent || false;
  const _mType    = author?.membershipType || "base";
  const name   = ((author && (author.name || author.displayName)) || "").trim() || "Mitglied";
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
        onClick={onProfile ? () => onProfile() : () => console.warn("🔴 STEP 1 — Avatar click: onProfile ist undefined (uid:", uid, ")")}
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
            style={{ fontSize:13.5,fontWeight:700,color:T.ink,letterSpacing:-0.2,
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
          fontSize:10,fontWeight:700,color:badge.color||T.teal,
          flexShrink:0,letterSpacing:0.3,
        }}>
          {badge.label}
        </div>
      )}
    </div>
  );
});

// ── Media (lazy + fade-in + double-tap like) ──────────────────
export const FeedMedia = memo(function FeedMedia({ media, alt, relaxed, onDoubleTap }) {
  const [err,     setErr]     = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const [heartPos,setHeartPos]= useState(null);
  const tapRef = useRef({ t: 0, x: 0, y: 0 });

  injectCardCSS();

  let url = null;
  if (Array.isArray(media) && media.length > 0) {
    const f = media[0];
    url = f?.url || (typeof f === "string" ? f : null);
  } else if (typeof media === "string" && media.length > 0) {
    url = media;
  }

  if (!url || err) return null;

  const h = relaxed ? 340 : T.mediaH;

  function handleTap(e) {
    const now = Date.now();
    const dt  = now - tapRef.current.t;
    if (dt < 320 && dt > 60) {
      // Double tap
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = (e.touches?.[0]?.clientX || e.clientX) - rect.left;
      const cy = (e.touches?.[0]?.clientY || e.clientY) - rect.top;
      setHeartPos({ x: cx, y: cy });
      onDoubleTap?.();
      setTimeout(() => setHeartPos(null), 750);
    }
    tapRef.current = { t: now };
  }

  return (
    <div
      style={{
        margin: "14px " + T.p + "px 0",
        height: h, borderRadius: T.rMedia,
        overflow: "hidden", background: "#F0EFED",
        flexShrink: 0, position: "relative",
        cursor: "pointer",
        // Soft shadow under media
        boxShadow: "0 4px 20px rgba(26,26,46,0.08)",
      }}
      onTouchEnd={handleTap}
      onDoubleClick={handleTap}
    >
      {/* Blur placeholder while loading */}
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg,rgba(22,215,197,0.07),rgba(255,138,107,0.07))",
          animation: "huiShimmer 1.6s ease-in-out infinite",
          backgroundSize: "200% 100%",
        }} />
      )}

      <img
        src={url}
        alt={alt || ""}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setErr(true)}
        className="hui-card-img"
        style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
          willChange: "opacity, transform",
        }}
      />

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
const ACTION_ARIA = {
  resonanz:    { on: "Resonanz entfernen",   off: "Resonanz geben" },
  austauschen: { on: "Austausch beenden",    off: "Austauschen" },
  merken:      { on: "Aus Merkliste entfernen", off: "Merken" },
  weitergeben: { off: "Weitergeben" }, // kein Toggle -- einmalige Aktion
  // KOMMENTAR.1 (2026-07-09): oeffnet die Kommentarfunktion, kein Toggle
  kommentieren: { off: "Kommentare öffnen" },
};
export const ActionBtn = memo(function ActionBtn({
  Icon, label, count, active, onClick, activeColor, inactiveColor, variant, disabled, loading
}) {
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
          fontWeight: active ? 700 : 400,
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
function getResonanzText(r) {
  const inspire = r.inspireCount || 0;
  const touch   = r.touchCount   || 0;
  const total   = inspire + touch;
  if (total === 0) return null;
  const firstName = r.firstInspirer
    ? (r.firstInspirer.split(" ")[0] || null)
    : null;
  if (firstName && total > 1)
    return `${firstName} und ${total - 1} weitere wurden inspiriert.`;
  if (firstName && total === 1)
    return `${firstName} wurde inspiriert.`;
  if (total === 1)
    return "Ein Mensch hat darauf reagiert.";
  if (inspire >= touch)
    return `${total} Menschen wurden inspiriert.`;
  return `${total} Menschen haben reagiert.`;
}

// ── Actions bar ───────────────────────────────────────────────
export const FeedActions = memo(function FeedActions({
  reactions, onReaction, onShare, extraActions
}) {
  const r = reactions || {};
  const resonanz = getResonanzText(r);
  // Premium-Finetuning Runde 3 2026-07-05 (Lars Punkt 3, "mit der Karte
  // verschmelzen"): marginTop 12->4, Border-Deckkraft 0.07->0.045
  // ("nur sehr dezent"), explizites background:T.bgCard (identisch zur
  // Karte) + untere Eckenrundung wie die Karte (T.r, die Karte selbst
  // hat bereits overflow:hidden, hier zusaetzlich defensiv gesetzt).
  return (
    <div style={{
      borderTop: "1px solid rgba(26,26,46,0.045)",
      marginTop: 4,
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
        <ActionBtn Icon={HUIChatIcon}     count={r.touchCount||null}   active={r.touched}  activeColor={T.teal}  inactiveColor={T.teal}   variant="austauschen" onClick={() => { haptic(r.touched ? "selection" : "light"); onReaction?.("touch"); }} />
        <ActionBtn Icon={HUIShareIcon}    activeColor={T.teal}  inactiveColor={T.teal}   variant="weitergeben" onClick={() => { haptic("light"); onShare?.(); }} />
        <ActionBtn Icon={HUIBookmarkIcon} active={r.saved} activeColor={"#F59E0B"} inactiveColor={"#F59E0B"} variant="merken" onClick={() => { haptic(r.saved ? "selection" : "light"); onReaction?.("save"); }} />
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
  item, onProfile, onReaction, onShare, badge, children, extraActions, onCardClick
}) {
  injectCardCSS();

  const reactions = item?._reactions || {};

  // Optimistic like state
  const [localReactions, setLocalReactions] = useState(reactions);

  // Sync if item changes externally.
  // FIX B (2026-07-16): Primitive Dependencies statt Objekt-Referenz.
  // Vorher: [item?.id] — reagierte nie auf asynchron nachgeladene Counts
  // (inspireCount/touchCount kommen aus useSingleReaction nach dem Mount).
  // Jetzt: drei primitive Werte — React vergleicht mit === statt Referenz.
  React.useEffect(() => {
    setLocalReactions(item?._reactions || {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, item?._reactions?.inspireCount, item?._reactions?.touchCount]);

  if (!item?.id) return null;

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
        next.saved = !prev.saved;
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
            fontSize:10, fontWeight:700, color:badge.color||T.teal, letterSpacing:0.3,
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
        {/* IMPACT-IMG-002: Impact-Karten rendern ihr Bild selbst in ImpactContent.
             FeedMedia hier skippen → kein Doppelbild (cover_url ≠ media_urls Konflikt) */}
        {item.type !== "impact" && (
          <FeedMedia
            media={item.media}
            alt={item.title || item.text}
            relaxed={!!(item._reactions?._relaxed)}
            onDoubleTap={onCardClick ? (e) => { /* double-tap → detail, kein like-trigger */ } : handleDoubleTap}
          />
        )}
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