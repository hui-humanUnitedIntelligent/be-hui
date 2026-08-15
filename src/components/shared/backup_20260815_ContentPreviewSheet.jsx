// src/components/shared/ContentPreviewSheet.jsx — OPEN.1 (2026-07-08)
// ══════════════════════════════════════════════════════════════════
// EINE Vorschau-Komponente fuer JEDEN Karten-Typ (Werk, Erlebnis,
// Moment/Beitrag, Veranstaltung, Impact-Projekt, Empfehlung, Wirker,
// Verbindung). Wird global ueber ContentPreviewContext geoeffnet.
//
// Wiederverwendet bewusst bestehende Bausteine statt neue zu bauen:
//   - useSingleReaction / useSavedPostsContext  (Resonanz/Merken-Logik)
//   - FeedActions (aus BaseFeedCard.jsx)        (identische Action-Bar
//                                                 wie im Feed)
//   - CommentsSheet (KOMMENTAR.1, 2026-07-09) -- EIN Kommentar-Bottom-
//                                                 Sheet fuer ALLE Typen,
//                                                 nutzt die generische
//                                                 post_comments-Tabelle
//                                                 (post_id+post_type,
//                                                 Migration 073). Ersetzt
//                                                 die vorherige, auf
//                                                 type="work" begrenzte
//                                                 Inline-Implementierung.
// ══════════════════════════════════════════════════════════════════
import { HUILocationIcon } from '../../design/icons/HuiSystemIcons.jsx';
import ImageSlider from './ImageSlider.jsx';
import React, { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { optimizeAvatar, optimizeCard } from "../../lib/perfUtils.js";
import { formatNumberDE } from "../../lib/formatters.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useSingleReaction } from "../../lib/useReactions.jsx";
import { useSavedPostsContext } from "../../context/SavedPostsContext.jsx";
import { FeedActions } from "../../feed/cards/BaseFeedCard.jsx";
import { toast } from "../../lib/useToast.jsx";
import { shareContent } from "../../lib/shareContent.js";
import { countComments, getComments } from "../../lib/commentsService.js";
import { prefetchComments } from "../../lib/commentsPrefetchCache.js";
import CommentsSheet from "./CommentsSheet.jsx";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";

const T = {
  ink: "#1A1A2E", inkSoft: "rgba(26,26,46,0.60)", inkFaint: "rgba(26,26,46,0.38)",
  teal: "#0DC4B5", coral: "#F47355", border: "rgba(26,26,46,0.08)",
  sheet: "#FCFDFC", overlay: "rgba(20,24,22,0.46)",
};

const TYPE_LABEL = {
  work: "Werk", werk: "Werk",
  experience: "Erlebnis", erlebnis: "Erlebnis",
  moment: "Beitrag", beitrag: "Beitrag",
  event: "Veranstaltung", veranstaltung: "Veranstaltung",
  project: "Impact-Projekt", projekt: "Impact-Projekt",
  recommendation: "Empfehlung",
  wirker: "Wirker",
  talent: "Talent-Angebot",
  connection: "Verbindung",
};

const CSS = `
  @keyframes cps-overlay-in { from{opacity:0} to{opacity:1} }
  @keyframes cps-sheet-in   { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .cps-overlay { animation: cps-overlay-in 220ms ease; }
  .cps-sheet   { animation: cps-sheet-in 320ms cubic-bezier(.22,1,.36,1); }
  .cps-btn { cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent;
    border:none; background:none; font-family:inherit; transition:opacity .14s, transform .14s; }
  .cps-btn:active { opacity:.6; transform:scale(0.96); }
`;

export default function ContentPreviewSheet({ item, loading, onClose, onBookTalent = () => {} }) {
  // FIX: navigate VOR useCallback deklarieren (TDZ-Bug war: navigate nach useCallback)
  const navigate = useNavigate();
  const { user } = useAuth();

  // BACK-BUTTON: Register so Android back button closes the preview sheet
  useModalRegistration(!!item, onClose, "ContentPreviewSheet");

  // TALENT-PROFIL-FIX: navigate-basiert statt useProfileLauncher
  const openTalentProfile = useCallback(async (userId) => {
    if (!userId) return;
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle();
    const username = data?.username;
    if (username) navigate('/profile/' + username);
  }, [navigate]);
  const { isSaved, toggleSave } = useSavedPostsContext();

  const postId    = item?.id || null;
  const postType  = item?.type || "post";
  const authorId  = item?.author?.id || null;
  const snapshot  = useMemo(() => item ? ({
    cover_url: item.media?.[0]?.url || null, title: item.title, author_name: item.author?.name || null, user_id: authorId,
  }) : null, [item, authorId]);

  const { counts, myTypes, toggle } = useSingleReaction(postId, postType, authorId, snapshot);
  const saved = postId ? isSaved(postId) : false;

  const handleReaction = useCallback((type) => {
    if (!postId) return;
    // SSOT-Paritaet mit UnifiedFeed.jsx (ReactionCardInner.handleReaction) +
    // PostFullscreenView-Fix (2026-08-08): Die Sprechblase ("Austauschen"/
    // touch) oeffnet ueberall in der App die Kommentare statt eine Reaction
    // zu toggeln.
    if (type === "touch") {
      setShowComments(true);
      return;
    }
    if (type === "save") {
      // FIX (2026-08-10): toggle("save") ergaenzt — sonst blieb saveCount
      // neben dem Bookmark-Icon immer null (wie in PostFullscreenView).
      toggleSave(postId, postType, snapshot);
      toggle("save");
      toast.info(saved ? "Aus Merkliste entfernt" : "Gespeichert", { duration:1800 });
      return;
    }
    toggle(type);
  }, [postId, postType, snapshot, toggle, toggleSave, saved]);

  // SHARE.1 (2026-07-09): zentrale, appweit einheitliche Share-Funktion
  // (native OS-Share, Zwischenablage-Fallback, oeffentliche URL pro Typ).
  const handleShare = useCallback(() => { shareContent(item); }, [item]);

  // KOMMENTAR.1 (2026-07-09): Kommentarzaehler + Sheet -- fuer ALLE Typen,
  // nicht mehr nur type="work" (siehe post_comments-Generalisierung).
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  // DRAG-TO-DISMISS (2026-08-08): Sheet kann nach unten weggezogen werden.
  // Dasselbe Muster wie PostFullscreenView. Drag-Handle am oberen Rand.
  const dragRef = useRef({ startY: 0, dy: 0, dragging: false });
  const [dragY, setDragY] = useState(0);
  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    countComments(postId, postType).then(n => { if (!cancelled) setCommentCount(n); });
    // INSTANT-COMMENTS.1 (2026-08-07): Kommentare im Hintergrund vorladen.
    prefetchComments(postId, postType, user?.id, getComments);
    return () => { cancelled = true; };
  }, [postId, postType, user?.id]);

  // LIVE-COMMENT-COUNT.1 (2026-08-07): Kommentare in CommentsSheet aktualisieren
  // sofort den Zähler hier — ohne dieses Event blieb die Zahl bis zum nächsten
  // Öffnen/Reload auf dem alten Wert stehen.
  useEffect(() => {
    if (!postId) return;
    function onChanged(e) {
      const d = e?.detail;
      if (!d || d.postId !== postId) return;
      if (d.postType && postType && d.postType !== postType) return;
      countComments(postId, postType).then(n => { if (n != null) setCommentCount(n); });
    }
    window.addEventListener("hui:comments:changed", onChanged);
    return () => window.removeEventListener("hui:comments:changed", onChanged);
  }, [postId, postType]);

  // Body-Scroll sperren solange offen (Konvention aus wizardBodyLock.js
  // wird hier bewusst nicht importiert, um keine Kopplung an den
  // Flow-Wizard-Stack zu erzeugen -- einfache eigene Sperre reicht).
  useEffect(() => {
    if (!item) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [item]);

  // HOOK-ORDER-FIX (2026-08-08): Drag-to-Dismiss useCallback-Hooks standen
  // vorher NACH "if (!item && !loading) return null" -- fuehrte beim
  // Antippen eines Bildes (item kurzzeitig null waehrend des Ladens) zu
  // "Minified React error #310" durch inkonsistente Hook-Reihenfolge
  // zwischen Renders. Jetzt: alle Hooks vor jedem fruehen return.
  // ── Drag-to-Dismiss Handlers ──
  const handleDragStart = useCallback((e) => {
    if (e.touches && e.touches[0]) {
      dragRef.current = { startY: e.touches[0].clientY, dy: 0, dragging: true };
    }
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    if (dy > 0) { dragRef.current.dy = dy; setDragY(dy); }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (dragRef.current.dy > 110) { onClose?.(); }
    setDragY(0);
    dragRef.current = { startY: 0, dy: 0, dragging: false };
  }, [onClose]);

  if (!item && !loading) return null;
  // PORTAL.1 — muss zu document.body, sonst blockiert Stacking-Context den Footer

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  const reactions = {
    inspired: myTypes?.has?.("inspire") ?? false,
    touched:  myTypes?.has?.("like")    ?? false, // bestehende App-Konvention (siehe UnifiedFeed.jsx)
    saved,
    inspireCount: counts?.inspire || null,
    touchCount:   counts?.like    || null,
    // SSOT-Paritaet mit UnifiedFeed.jsx: commentCount an die Sprechblase
    // haengen -- dort steht der echte Kommentar-Zaehler, kein separates
    // 5. Icon mehr (Fix 2026-08-08).
    commentCount: commentCount || null,
    saveCount:    counts?.save  || null,
    shareCount:   counts?.share || null,
  };

  const hero = item?.media?.[0]?.url || null;
  const extraMedia = (item?.media || []).slice(1);

  return createPortal(
    <div
      className="cps-overlay"
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:10500, background:T.overlay,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
      }}
    >
      <style>{CSS}</style>
      <div
        className="cps-sheet"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        style={{
          width:"100%", maxWidth:560,
          // Sheet wird per marginBottom ueber die System-Navbar gehoben —
          // dadurch ist der GESAMTE Sheet-Boden sichtbar, nicht nur der
          // Inhalt per Spacer davorgeschoben. (2026-08-15, 3. Fix-Versuch)
          maxHeight:"calc(92dvh - max(var(--hui-safe-top, 0px), env(safe-area-inset-top, 44px)) - max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px)))",
          marginBottom:"max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px))",
          overflowY:"auto",
          background:T.sheet, borderTopLeftRadius:24, borderTopRightRadius:24,
          boxShadow:"0 -8px 40px rgba(20,24,22,0.25)",
          transform: "translateY(" + Math.max(0, dragY) + "px)",
          transition: dragRef.current.dragging ? "none" : "transform 0.25s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {/* Griff + Close */}
        <div style={{ position:"sticky", top:0, background:T.sheet, zIndex:2,
          borderTopLeftRadius:24, borderTopRightRadius:24, paddingTop:10 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,46,0.15)", margin:"0 auto 8px" }}/>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px 10px" }}>
            <span style={{ fontSize:11, fontWeight: 600, color:T.teal, letterSpacing:".04em",
              background:"rgba(13,196,181,0.10)", borderRadius:99, padding:"3px 10px" }}>
              {TYPE_LABEL[item?.type] || "Inhalt"}
            </span>
            <button className="cps-btn" onClick={onClose} style={{ fontSize:20, color:T.inkFaint, padding:4 }}>✕</button>
          </div>
        </div>

        {loading && (
          <div style={{ padding:"40px 20px", textAlign:"center", color:T.inkFaint, fontSize:13 }}>Lädt…</div>
        )}

        {item && (
          <div style={{ padding:"0 0 8px" }}>
            {/* Titelbild - LIGHTBOX+SLIDER.1 (2026-08-08):
                Bei 2+ Bildern horizontaler Slider. Tappbar -> Full-Screen Lightbox. */}
            {(item?.media || []).length > 0 ? (
              <ImageSlider
                images={item.media}
                height={320}
                borderRadius={0}
                showDots={true}
                objectFit="cover"
              />
            ) : item.type === "project" || item.type === "projekt" ? (
              <div style={{ width:"100%", height:140, display:"flex", alignItems:"center", justifyContent:"center",
                background: item.color ? `${item.color}14` : "rgba(13,196,181,0.08)", fontSize:44 }}>
                {item.icon || "🌱"}
              </div>
            ) : null}

            <div style={{ padding:"18px 18px 0" }}>
              {/* Autor — NICHT klickbar (2026-07-29). "Profil ansehen" Button statt dessen. */}
              {item.author?.name && (
                <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", overflow:"hidden", flexShrink:0,
                    background:"rgba(13,196,181,0.14)" }}>
                    {item.author.avatar && <img loading="lazy" decoding="async" src={optimizeAvatar(item.author.avatar)} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>}
                  </div>
                  <div style={{ fontSize:13.5, fontWeight: 600, color:T.ink }}>{item.author.name}</div>
{/* kleiner Profil-Button entfernt — nur großer Button unten (2026-07-29) */}
                </div>
              )}

              {/* Titel */}
              {item.title && (
                <div style={{ fontSize:19, fontWeight: 600, color:T.ink, lineHeight:1.3, marginBottom:8, letterSpacing:"-0.02em" }}>
                  {item.title}
                </div>
              )}

              {/* Text (vollstaendig) */}
              {item.text && (
                <div style={{ fontSize:14.5, color:T.inkSoft, lineHeight:1.6, marginBottom:14, whiteSpace:"pre-wrap" }}>
                  {item.text}
                </div>
              )}

              {/* Meta: Datum + Ort */}
              {(item.createdAt || item.location) && (
                <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:14 }}>
                  {item.createdAt && (
                    <span style={{ fontSize:12, color:T.inkFaint }}>🕐 {item.createdAt}</span>
                  )}
                  {item.location && (
                    <span style={{ fontSize:12, color:T.inkFaint, display:"flex", alignItems:"center", gap:2 }}><HUILocationIcon size={12}/>{item.location}</span>
                  )}
                </div>
              )}

              {/* Werk: Preis + Kategorie — FIX (2026-08-15, Michael-Report):
                  Die Werk-Vorschau zeigte bisher (anders als Talent-Angebote)
                  weder Preis noch Kategorie an, obwohl beide Felder in der
                  works-Tabelle vorhanden sind ("lückenhaft, was der Nutzer
                  gekauft hat" bei Bestellungs-Benachrichtigungen). Additiv,
                  identische Pill-Optik wie der bestehende Talent-Preis-Chip. */}
              {item.type === "work" && (item.price != null || item._raw?.category) && (
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                  {item.price != null && (
                    <div style={{
                      display:"inline-flex", alignItems:"center", gap:6,
                      background:"rgba(13,196,181,0.10)", borderRadius:99,
                      padding:"7px 16px",
                    }}>
                      <span style={{ fontSize:16, fontWeight: 600, color:"rgba(0,150,136,1)" }}>
                        {formatNumberDE(Number(item.price))} €
                      </span>
                    </div>
                  )}
                  {item._raw?.category && (
                    <div style={{
                      display:"inline-flex", alignItems:"center",
                      background:"rgba(26,26,46,0.05)", borderRadius:99,
                      padding:"7px 16px",
                    }}>
                      <span style={{ fontSize:13, fontWeight:600, color:T.inkSoft }}>
                        {item._raw.category}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Talent-Angebot: Preis + Profil + Buchen Buttons */}
              {item.type === "talent" && (
                <>
                  {item.price && (
                    <div style={{
                      display:"inline-flex", alignItems:"center", gap:6,
                      background:"rgba(13,196,181,0.10)", borderRadius:99,
                      padding:"7px 16px", marginBottom:16,
                    }}>
                      <span style={{ fontSize:16, fontWeight: 600, color:"rgba(0,150,136,1)" }}>{item.price}</span>
                    </div>
                  )}
                  {/* "Talent buchen" — primärer CTA.
                      TALENT-BUCHEN-ANCHOR-FIX (2026-08-07): Sheet schliesst
                      sich jetzt beim Klick (onClose), statt "zu stark
                      verankert" hinter dem TalentBookingFlow-Sheet stehen
                      zu bleiben — identisches Muster wie "Talent-Profil
                      ansehen" direkt darunter. */}
                  {item._raw?.price_per_hour != null || item._raw?.price_per_session != null ? (
                    <button
                      onClick={() => { onClose?.(); onBookTalent(item._raw); }}
                      style={{
                        width:"100%", marginBottom:10, padding:"14px", borderRadius:14,
                        background:"rgba(13,196,181,1)", color:"#fff",
                        fontSize:15, fontWeight: 600, border:"none", cursor:"pointer",
                        letterSpacing:"-0.01em",
                      }}>
                      Talent buchen
                    </button>
                  ) : null}
                  {/* "Talent-Profil ansehen" — sekundär, KEIN onClose (würde Discover resetten) */}
                  {item.userId && (
                    <button
                      onClick={() => { onClose?.(); openTalentProfile(item.userId); }}
                      style={{
                        width:"100%", marginBottom:12, padding:"13px", borderRadius:14,
                        background:"rgba(26,26,46,0.92)", color:"#fff",
                        fontSize:14, fontWeight: 600, border:"none", cursor:"pointer",
                      }}>
                      Talent-Profil ansehen
                    </button>
                  )}

                </>
              )}

              {/* Weitere Medien */}
              {extraMedia.length > 0 && (
                <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:14 }}>
                  {extraMedia.map((m, i) => (
                    <img loading="lazy" decoding="async" key={i} src={optimizeCard(m.url)} alt="" style={{ width:96, height:96, borderRadius:12, objectFit:"cover", flexShrink:0 }}/>
                  ))}
                </div>
              )}
            </div>

            {/* Action-Bar — 1:1 identisch zur Hauptseite (UnifiedFeed.jsx
                ReactionCardInner): 4 Standard-Icons, die Sprechblase
                ("Austauschen") oeffnet die Kommentare und zeigt den echten
                Kommentar-Zaehler. Kein separates 5. Icon mehr (Fix 2026-08-08). */}
            <FeedActions
              reactions={reactions} onReaction={handleReaction} onShare={handleShare}
            />

            <div style={{ padding:"0 18px" }}>
              {/* Vollstaendige Detailseite, falls vorhanden */}
              {item.canOpenFull && (item.fullPath || item._onOpenFull) && (
                <button className="cps-btn" onClick={() => {
                  onClose();
                  if (item._onOpenFull) { item._onOpenFull(); }
                  else if (item.type === "impact" || item.type === "project" || item.type === "projekt") {
                    // Impact-Projekt: zu /impact navigieren mit openProjectId im State
                    navigate("/impact", { state: { openProjectId: item.id } });
                  } else {
                    navigate(item.fullPath);
                  }
                }} style={{
                  width:"100%", marginTop:16, padding:"13px", borderRadius:14,
                  background:T.ink, color:"#fff", fontSize:14, fontWeight: 600,
                }}>
                  {item.type === "impact" || item.type === "project" || item.type === "projekt"
                    ? "Vollständige Ansicht öffnen"
                    : item.type === "talent"
                    ? "Talent-Profil ansehen"
                    : "Vollständige Ansicht öffnen"}
                </button>
              )}
            </div>

            {/* Großer "Profil ansehen" Button — für alle non-talent Typen (2026-07-29) */}
            {item && item.type !== "talent" && authorId && (
              <div style={{ padding:"0 18px" }}>
                <button
                  className="cps-btn"
                  onClick={() => {
                    if (typeof window.__HUI_OPEN_PROFILE__ === "function") {
                      onClose?.();
                      window.__HUI_OPEN_PROFILE__(authorId);
                    }
                  }}
                  style={{
                    width:"100%", marginTop:16, padding:"13px", borderRadius:14,
                    background:T.ink, color:"#fff", fontSize:14, fontWeight: 600,
                    border:"none", cursor:"pointer", fontFamily:"inherit",
                    letterSpacing:"-0.01em",
                  }}
                >
                  Profil ansehen
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom-Spacer: Navbar (72px) + safe-area — verhindert Abschneiden
            auf iOS (Safari ignoriert paddingBottom bei overflowY:auto).
            ROOT-CAUSE-FIX (2026-08-15, Michael-Report — 2. Report, Screenshots
            zeigten Text/Buttons weiterhin hinter der System-Navbar TROTZ
            korrekter max()-Formel): Der Spacer stand vorher als Flex-SIBLING
            AUSSERHALB von .cps-sheet, im äußeren Overlay-Div. Das Overlay ist
            aber display:"flex" OHNE flexDirection (= Default "row") — der
            Spacer landete dadurch horizontal NEBEN dem Sheet statt darunter
            und hatte de facto NULL Wirkung auf die scrollbare Fläche, egal wie
            groß sein height-Wert war. Jetzt: Spacer ist letztes Kind INNERHALB
            von .cps-sheet (dem overflowY:auto-Container) — wird dadurch Teil
            der scrollbaren Inhaltshöhe und schafft echten Freiraum am Ende,
            exakt wie bei jedem anderen Bottom-Sheet im Code. */}
        <div style={{ height:"calc(88px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 20px), 20px))", flexShrink:0 }}/>
      </div>

      {/* KOMMENTAR.1: EIN Kommentar-Sheet fuer ALLE Typen (post_comments,
          generisch ueber post_id+post_type, Migration 073). */}
      <CommentsSheet
        open={showComments} onClose={() => setShowComments(false)}
        postId={postId} postType={postType} postAuthorId={authorId}
      />
    </div>
  , portalTarget);
}
