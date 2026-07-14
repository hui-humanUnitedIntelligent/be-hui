// src/feed/cards/BaseFeedCard.jsx — Phase 4D
// Avatar tap → direkt vollständiges Profil öffnen (kein QuickPreview mehr)
// ══════════════════════════════════════════════════════════════
// Double-tap like · Heart burst · Optimistic reactions
// Shimmer skeleton · Lazy image loading · Scale press states
// GPU-accelerated animations via transform
// ══════════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, memo } from "react";
import { PresenceDot, fmtPresence } from "../../lib/usePresence.jsx";
import { MembershipLabel } from "../../components/ui/TalentBadge.jsx";
// HUI Interaction Language v1.0 (2026-07-05) — Single Source of Truth fuer
// die vier universellen Interaktionen (Resonanz/Austauschen/Merken/Empfehlen).
// Ersetzt die bisherigen Emoji-Icons (✦/🤍/💬/🔖) plattformweit.
import {
  HUIHeartIcon, HUIChatIcon, HUIBookmarkIcon, HUIShareIcon,
} from "../../design/icons/HuiInteractionIcons.jsx";
import { haptic } from "../../components/commerce/commerceUtils.js";
import HuiImage, { HuiImageSkeleton } from "../../components/ui/HuiImage.jsx";
import { IMAGE_SIZES } from "../../lib/huiImageUtils.js";

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

// ── Shimmer skeleton (einheitliche HuiImage-Placeholder) ─────
export function CardSkeleton() {
  injectCardCSS();
  return (
    <article style={{
      background: T.bgCard, borderRadius: T.r, marginBottom: 14,
      marginLeft: 12, marginRight: 12,
      boxShadow: T.shadow, border: "1px solid " + T.border, overflow: "hidden",
    }}>
      <div style={{ padding: "16px 16px 0", display:"flex", gap:12, alignItems:"center" }}>
        <HuiImageSkeleton width={38} height={38} borderRadius={T.rAvatar} />
        <div style={{ flex:1 }}>
          <HuiImageSkeleton width="55%" height={11} borderRadius={6} />
          <div style={{ height:7 }} />
          <HuiImageSkeleton width="35%" height={9} borderRadius={5} />
        </div>
      </div>
      <div style={{ padding:"14px 16px 6px" }}>
        <HuiImageSkeleton width="100%" height={10} borderRadius={5} />
        <div style={{ height:7 }} />
        <HuiImageSkeleton width="72%" height={10} borderRadius={5} />
      </div>
      <div style={{ margin:"10px 16px 16px" }}>
        <HuiImageSkeleton width="100%" height={180} borderRadius={T.rMedia} />
      </div>
    </article>
  );
}

// ── Avatar (HuiImage) ─────────────────────────────────────────
const CardAvatar = memo(function CardAvatar({ src, name, size = 38, isTalent = false, priority = false }) {
  return (
    <HuiImage
      src={src}
      alt={name || ""}
      width={size}
      height={size}
      variant="avatar"
      borderRadius={T.rAvatar}
      isTalent={isTalent}
      priority={priority}
      fallbackText={name}
      sizes={size >= 50 ? IMAGE_SIZES.avatar : IMAGE_SIZES.avatarSm}
      placeholder="shimmer"
    />
  );
});

// ── Story Engine — Sprint 2.6 ────────────────────────────────
// Begegnungsgrund: natürlich, kontextsensitiv, niemals generisch.
// Quellen: type · author.talent · author.name · item.title ·
//          item.location · item._raw.date · item._raw.category
// Kein neues Feld. Kein API-Call.
function getBegegnungsgrund(item) {
  const type    = item?.type || "moment";
  const author  = item?.author || {};
  const first   = (author.name || "").split(/\s/)[0].trim() || null;
  const talent  = (author.talent || "").trim() || null;
  const cat     = (item?._raw?.category || "").trim() || null;
  const title   = (item?.title || "").trim() || null;
  const loc     = (item?.location || "").trim() || null;
  const text    = item?.text || "";

  // ── WERK ──────────────────────────────────────────────────
  if (type === "work") {
    // Talent + Kategorie → kontextuelle Aussage
    if (talent && cat && first)
      return `${first} wirkt im Bereich ${cat} und hat ein neues Werk erschaffen.`;
    if (talent && first)
      return `${first} hat ein neues Werk als ${talent} erschaffen.`;
    if (title && first)
      return `${first} teilt heute: „${title}".`;
    if (first)
      return `${first} hat ein neues Werk veröffentlicht.`;
    return "Hat ein neues Werk erschaffen.";
  }

  // ── ERLEBNIS ──────────────────────────────────────────────
  if (type === "experience") {
    const date = item?._raw?.date || null;
    let datePart = null;
    if (date) {
      try {
        const d    = new Date(date);
        const now  = new Date(); now.setHours(0,0,0,0);
        const diff = Math.round((d - now) / 86400000);
        if (diff === 0)      datePart = "heute";
        else if (diff === 1) datePart = "morgen";
        else if (diff > 1 && diff <= 7) datePart = "diese Woche";
      } catch { /* ignore */ }
    }
    if (talent && loc && datePart && first)
      return `${first} lädt ${datePart} zu einem gemeinsamen Erlebnis in ${loc} ein.`;
    if (loc && datePart && first)
      return `${first} lädt ${datePart} nach ${loc} ein.`;
    if (talent && first)
      return `${first} lädt zu einem Erlebnis im Bereich ${talent} ein.`;
    if (loc && first)
      return `${first} lädt zu einem gemeinsamen Erlebnis in ${loc} ein.`;
    if (first)
      return `${first} lädt zu einem gemeinsamen Erlebnis ein.`;
    return "Lädt zu einem gemeinsamen Erlebnis ein.";
  }

  // ── EVENT ─────────────────────────────────────────────────
  if (type === "event") {
    if (talent && loc && first)
      return `${first} engagiert sich als ${talent} und organisiert ein Event in ${loc}.`;
    if (loc && first)
      return `${first} organisiert ein Event in ${loc}.`;
    if (talent && first)
      return `${first} engagiert sich als ${talent}.`;
    if (first)
      return `${first} organisiert ein gemeinsames Event.`;
    return "Organisiert ein gemeinsames Event.";
  }

  // ── MOMENT ────────────────────────────────────────────────
  if (talent && first)
    return `${first} wirkt als ${talent} und teilt einen persönlichen Moment.`;
  if (first && text.length > 120)
    return `${first} nimmt dich heute mit in seinen Alltag.`;
  if (first && text.length > 40)
    return `${first} teilt heute einen persönlichen Moment.`;
  if (first)
    return `${first} hat heute etwas Persönliches geteilt.`;
  return "Teilt heute einen persönlichen Moment.";
}

// ── HumanHeader v3.0 — exakt nach Mockup ─────────────────────
// Zeile 1: Avatar (52px rund) · Name · Zeit rechts · ⋮
// Zeile 2: Talent (farbig) · Pin-SVG · Ort
// Zeile 3: " (groß, orange) + Story-Satz
export const HumanHeader = memo(function HumanHeader({ item, onProfile, imagePriority = false }) {
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
          <CardAvatar src={avatar} name={name} size={52} isTalent={isT} priority={imagePriority} />
          {presence === "online" && (
            <div style={{
              position:"absolute", bottom:2, right:2,
              width:11, height:11, borderRadius:"50%",
              background:"#22C55E", border:"2.5px solid #FFFFFF",
            }} />
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

          {/* Talent · Pin-Icon · Ort */}
          {(talent || loc) && (
            <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3 }}>
              {talent && (
                <span style={{ fontSize:13, fontWeight:600, color:talentColor, lineHeight:1, whiteSpace:"nowrap" }}>
                  {talent}
                </span>
              )}
              {talent && loc && (
                <span style={{ fontSize:12, color:"rgba(26,26,46,0.28)" }}>·</span>
              )}
              {loc && (
                <div style={{ display:"flex", alignItems:"center", gap:2 }}>
                  <svg width="9" height="12" viewBox="0 0 9 12" fill="none" style={{ flexShrink:0, marginTop:1 }}>
                    <path d="M4.5 0C2.294 0 .5 1.794.5 4C.5 7.09 4.5 12 4.5 12S8.5 7.09 8.5 4C8.5 1.794 6.706 0 4.5 0ZM4.5 5.5C3.67 5.5 3 4.83 3 4C3 3.17 3.67 2.5 4.5 2.5C5.33 2.5 6 3.17 6 4C6 4.83 5.33 5.5 4.5 5.5Z" fill="#F47355"/>
                  </svg>
                  <span style={{ fontSize:13, color:"rgba(26,26,46,0.55)", fontWeight:400 }}>{loc}</span>
                </div>
              )}
            </div>
          )}
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
export const FeedCardHeader = memo(function FeedCardHeader({ author, time, badge, onProfile, presenceStatus, imagePriority = false }) {
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
        <CardAvatar src={avatar} name={name} size={38} isTalent={_isTalent} priority={imagePriority} />
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

// ── Media (HuiImage + Priorität + feste Aspect Ratio) ─────────
export const FeedMedia = memo(function FeedMedia({ media, alt, relaxed, onDoubleTap, priority = false, blurhash, thumbnail }) {
  const [heartPos,setHeartPos]= useState(null);
  const tapRef = useRef({ t: 0, x: 0, y: 0 });

  injectCardCSS();

  let url = null;
  if (Array.isArray(media) && media.length > 0) {
    const f = media[0];
    url = f?.url || (typeof f === "string" ? f : null);
    thumbnail = thumbnail || f?.thumbnail || f?.thumbnail_path || null;
    blurhash = blurhash || f?.blurhash || null;
  } else if (typeof media === "string" && media.length > 0) {
    url = media;
  }

  if (!url) return null;

  const h = relaxed ? 340 : T.mediaH;

  function handleTap(e) {
    const now = Date.now();
    const dt  = now - tapRef.current.t;
    if (dt < 320 && dt > 60) {
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
        overflow: "hidden", flexShrink: 0, position: "relative",
        cursor: "pointer",
        boxShadow: "0 4px 20px rgba(26,26,46,0.08)",
      }}
      onTouchEnd={handleTap}
      onDoubleClick={handleTap}
    >
      <HuiImage
        src={url}
        alt={alt || ""}
        fill
        height={h}
        borderRadius={T.rMedia}
        priority={priority}
        blurhash={blurhash}
        thumbnail={thumbnail}
        sizes={IMAGE_SIZES.feed}
        placeholder="auto"
      />

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
  Icon, label, count, active, onClick, activeColor, variant, disabled, loading
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

  const col = active ? (activeColor || T.teal) : T.ink3;
  // Zustände — Form bleibt IMMER identisch, nur Opacity/Scale ändern sich:
  // disabled < default < hover < active.
  const iconOpacity = disabled ? 0.28 : active ? 1 : hover ? 0.85 : 0.64;
  // Sehr dezenter Hintergrund-Kreis beim Antippen (8% HUI-Tuerkis/-Koralle,
  // je nach activeColor der jeweiligen Aktion) -- kein Schatten, kein Glanz.
  const circleBg = (activeColor === T.coral) ? "rgba(244,115,85,0.08)" : "rgba(13,196,181,0.08)";
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
        <ActionBtn Icon={HUIHeartIcon}    count={r.inspireCount||null} active={r.inspired} activeColor={T.teal}  variant="resonanz"    onClick={() => { haptic(r.inspired ? "selection" : "light"); onReaction?.("inspire"); }} />
        <ActionBtn Icon={HUIChatIcon}     count={r.touchCount||null}   active={r.touched}  activeColor={T.teal}  variant="austauschen" onClick={() => { haptic(r.touched ? "selection" : "light"); onReaction?.("touch"); }} />
        <ActionBtn Icon={HUIShareIcon}    activeColor={T.teal}  variant="weitergeben" onClick={() => { haptic("light"); onShare?.(); }} />
        <ActionBtn Icon={HUIBookmarkIcon} active={r.saved} activeColor={T.coral} variant="merken"      onClick={() => { haptic(r.saved ? "selection" : "light"); onReaction?.("save"); }} />
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
  imagePriority = false,
}) {
  injectCardCSS();

  const reactions = item?._reactions || {};

  // Optimistic like state
  const [localReactions, setLocalReactions] = useState(reactions);

  // Sync if item changes externally
  React.useEffect(() => {
    setLocalReactions(item?._reactions || {});
  }, [item?.id]); // eslint-disable-line

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
      <HumanHeader item={item} onProfile={onProfile} imagePriority={imagePriority} />

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
        <FeedMedia
          media={item.media}
          alt={item.title || item.text}
          relaxed={!!(item._reactions?._relaxed)}
          onDoubleTap={onCardClick ? (e) => { /* double-tap → detail, kein like-trigger */ } : handleDoubleTap}
          priority={imagePriority}
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