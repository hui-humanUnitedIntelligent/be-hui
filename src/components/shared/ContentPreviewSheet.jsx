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
import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
const TalentBookingFlow = lazy(() => import('../talents/TalentBookingFlow.jsx'));
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useSingleReaction } from "../../lib/useReactions.jsx";
import { useSavedPostsContext } from "../../context/SavedPostsContext.jsx";
import { FeedActions, ActionBtn } from "../../feed/cards/BaseFeedCard.jsx";
import { toast } from "../../lib/useToast.jsx";
import { shareContent } from "../../lib/shareContent.js";
import { HUICommentIcon } from "../../design/icons/HuiInteractionIcons.jsx";
import { countComments } from "../../lib/commentsService.js";
import CommentsSheet from "./CommentsSheet.jsx";

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

export default function ContentPreviewSheet({ item, loading, onClose }) {
  // FIX: navigate + showTalentBooking VOR useCallback deklarieren (TDZ-Bug)
  const navigate = useNavigate();
  const [showTalentBooking, setShowTalentBooking] = useState(false);

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
    if (type === "save") {
      toggleSave(postId, postType, snapshot);
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
  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    countComments(postId, postType).then(n => { if (!cancelled) setCommentCount(n); });
    return () => { cancelled = true; };
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
        style={{
          width:"100%", maxWidth:560,
          maxHeight:"calc(92dvh - env(safe-area-inset-top, 44px))",
          overflowY:"auto",
          background:T.sheet, borderTopLeftRadius:24, borderTopRightRadius:24,
          boxShadow:"0 -8px 40px rgba(20,24,22,0.25)",
        }}
      >
        {/* Griff + Close */}
        <div style={{ position:"sticky", top:0, background:T.sheet, zIndex:2,
          borderTopLeftRadius:24, borderTopRightRadius:24, paddingTop:10 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,46,0.15)", margin:"0 auto 8px" }}/>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px 10px" }}>
            <span style={{ fontSize:11, fontWeight:700, color:T.teal, letterSpacing:".04em",
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
            {/* Titelbild */}
            {hero ? (
              <img loading="lazy" decoding="async" src={hero} alt={item.title || ""} style={{ width:"100%", maxHeight:320, objectFit:"cover", display:"block" }}/>
            ) : item.type === "project" || item.type === "projekt" ? (
              <div style={{ width:"100%", height:140, display:"flex", alignItems:"center", justifyContent:"center",
                background: item.color ? `${item.color}14` : "rgba(13,196,181,0.08)", fontSize:44 }}>
                {item.icon || "🌱"}
              </div>
            ) : null}

            <div style={{ padding:"18px 18px 0" }}>
              {/* Autor */}
              {item.author?.name && (
                <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", overflow:"hidden", flexShrink:0,
                    background:"rgba(13,196,181,0.14)" }}>
                    {item.author.avatar && <img loading="lazy" decoding="async" src={item.author.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>}
                  </div>
                  <div style={{ fontSize:13.5, fontWeight:700, color:T.ink }}>{item.author.name}</div>
                </div>
              )}

              {/* Titel */}
              {item.title && (
                <div style={{ fontSize:19, fontWeight:800, color:T.ink, lineHeight:1.3, marginBottom:8, letterSpacing:"-0.02em" }}>
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

              {/* Talent-Angebot: Preis + Profil + Buchen Buttons */}
              {item.type === "talent" && (
                <>
                  {item.price && (
                    <div style={{
                      display:"inline-flex", alignItems:"center", gap:6,
                      background:"rgba(13,196,181,0.10)", borderRadius:99,
                      padding:"7px 16px", marginBottom:16,
                    }}>
                      <span style={{ fontSize:16, fontWeight:800, color:"rgba(0,150,136,1)" }}>{item.price}</span>
                    </div>
                  )}
                  {/* "Talent buchen" — primärer CTA */}
                  {item._raw?.price_per_hour != null || item._raw?.price_per_session != null ? (
                    <button
                      onClick={() => setShowTalentBooking(true)}
                      style={{
                        width:"100%", marginBottom:10, padding:"14px", borderRadius:14,
                        background:"rgba(13,196,181,1)", color:"#fff",
                        fontSize:15, fontWeight:800, border:"none", cursor:"pointer",
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
                        fontSize:14, fontWeight:700, border:"none", cursor:"pointer",
                      }}>
                      Talent-Profil ansehen
                    </button>
                  )}
                  {/* TalentBookingFlow — lazy geladen (Stripe erst bei Bedarf) */}
                  {showTalentBooking && item._raw && (
                    <Suspense fallback={null}>
                      <TalentBookingFlow
                        talent={item._raw}
                        onClose={() => setShowTalentBooking(false)}
                      />
                    </Suspense>
                  )}
                </>
              )}

              {/* Weitere Medien */}
              {extraMedia.length > 0 && (
                <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:14 }}>
                  {extraMedia.map((m, i) => (
                    <img loading="lazy" decoding="async" key={i} src={m.url} alt="" style={{ width:96, height:96, borderRadius:12, objectFit:"cover", flexShrink:0 }}/>
                  ))}
                </div>
              )}
            </div>

            {/* Action-Bar — identisch zum Feed (Resonanz/Austauschen/Weitergeben/
                Merken) + 5. Aktion "Kommentieren" (extraActions-Slot, KOMMENTAR.1) */}
            <FeedActions
              reactions={reactions} onReaction={handleReaction} onShare={handleShare}
              extraActions={
                <ActionBtn Icon={HUICommentIcon} count={commentCount || null} variant="kommentieren"
                  activeColor={T.teal} onClick={() => setShowComments(true)} />
              }
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
                  background:T.ink, color:"#fff", fontSize:14, fontWeight:700,
                }}>
                  {item.type === "impact" || item.type === "project" || item.type === "projekt"
                    ? "Vollständige Ansicht öffnen"
                    : item.type === "talent"
                    ? "Talent-Profil ansehen"
                    : "Vollständige Ansicht öffnen"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom-Spacer: Navbar (72px) + safe-area — verhindert Abschneiden
          auf iOS (Safari ignoriert paddingBottom bei overflowY:auto) */}
      <div style={{ height:"calc(88px + env(safe-area-inset-bottom, 0px))", flexShrink:0 }}/>

      {/* KOMMENTAR.1: EIN Kommentar-Sheet fuer ALLE Typen (post_comments,
          generisch ueber post_id+post_type, Migration 073). */}
      <CommentsSheet
        open={showComments} onClose={() => setShowComments(false)}
        postId={postId} postType={postType} postAuthorId={authorId}
      />
    </div>
  , portalTarget);
}
