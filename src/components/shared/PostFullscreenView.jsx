// src/components/shared/PostFullscreenView.jsx — FULLSCREEN.1 (2026-07-08)
// ══════════════════════════════════════════════════════════════════
// Dedizierte Fullscreen-Ansicht NUR fuer Beitraege (type==="moment").
// Ersetzt fuer diesen einen Typ die ContentPreviewSheet (Bottom Sheet).
// Alle anderen Typen (work/experience/event/project/recommendation/
// wirker/connection) bleiben unveraendert bei ContentPreviewSheet --
// siehe Verzweigung in ContentPreviewContext.jsx.
//
// Wiederverwendet bewusst bestehende Bausteine (keine neue Navigations-
// oder Interaktionslogik):
//   - useSingleReaction / useSavedPostsContext  (identisch zu ContentPreviewSheet)
//   - FeedActions (aus BaseFeedCard.jsx)        (identische Action-Bar wie im Feed)
//   - useWizardBodyLock (wizardBodyLock.js)     (bestehender, referenzgezaehlter
//                                                 Mechanismus der die Bottom-
//                                                 Navigation ausblendet -- exakt
//                                                 der geforderte "Tabbar ausblenden"-
//                                                 Effekt, kein neuer Code dafuer)
//   - window.__HUI_OPEN_PROFILE__                (bestehende, bereits etablierte
//                                                 globale Bruecke aus HomeShell.jsx
//                                                 fuer Profil-Navigation von
//                                                 ausserhalb des Home-Baums --
//                                                 dieselbe Bruecke die z.B. Debug-
//                                                 Tools nutzen, keine neue Bruecke)
//
// Bekannte, dokumentierte Grenzen (kein DB-Nachweis vorhanden -> nicht
// stillschweigend neue Spalten erfinden, siehe Datenmigrationsregel):
//   - "Eingebettete Inhalte" (Werke/Erlebnisse/Projekte/Veranstaltungen):
//     Die Tabelle "beitraege" hat aktuell KEINE Spalte um ein Werk/Erlebnis/
//     Projekt/Veranstaltung an einen Beitrag zu haengen (echte Spalten laut
//     TeilenFlow.jsx: user_id, src, type, caption, created_at). Sektion ist
//     vorbereitet und wird nur gerendert wenn `item.embeddedRefs` befuellt
//     ist -- aktuell nie der Fall. Fuer eine echte Umsetzung braucht es
//     zuerst eine Migration (mit Lars abzustimmen), das ist NICHT Teil
//     dieses Auftrags.
//   - Kommentare (KOMMENTAR.1, 2026-07-09): frueher ein ehrlicher
//     Platzhalter, da "comments" nur ueber work_id verknuepft war. Jetzt
//     ueber die generalisierte post_comments-Tabelle (Migration 073) echt
//     angebunden -- dieselbe CommentsSheet-Komponente wie ContentPreviewSheet.
// ══════════════════════════════════════════════════════════════════
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useSingleReaction } from "../../lib/useReactions.jsx";
import { useSavedPostsContext } from "../../context/SavedPostsContext.jsx";
import { FeedActions, ActionBtn } from "../../feed/cards/BaseFeedCard.jsx";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
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

const CSS = `
  .pfv-btn { cursor:pointer; touch-action:manipulation; -webkit-tap-highlight-color:transparent;
    border:none; background:none; font-family:inherit; transition:opacity .14s, transform .14s; }
  .pfv-btn:active { opacity:.6; transform:scale(0.96); }
  .pfv-strip::-webkit-scrollbar { display:none; }
`;

const ANIM_MS = 280;

// ── "Weitere Beitraege dieses Wirkers" — schlanker Nachbar-Query,
//    gleiches Muster wie die bestehenden beitraege-Queries in useFeedStream.js
function useMoreFromAuthor(authorId, excludeId) {
  const [more, setMore] = useState([]);
  useEffect(() => {
    let cancelled = false;
    if (!authorId) { setMore([]); return; }
    supabase.from("beitraege")
      .select("id,user_id,src,type,caption,created_at")
      .eq("user_id", authorId)
      .neq("id", excludeId || "")
      .order("created_at", { ascending:false })
      .limit(8)
      .then(({ data }) => { if (!cancelled) setMore(data || []); });
    return () => { cancelled = true; };
  }, [authorId, excludeId]);
  return more;
}

export default function PostFullscreenView({ item, onClose, onOpenPost }) {
  const { isSaved, toggleSave } = useSavedPostsContext();

  // ── Enter/Exit-Animation: eigener "mountedItem"-State entkoppelt vom
  //    Provider-State, damit beim Schliessen (item -> null) erst die
  //    Rueckanimation abspielt, bevor tatsaechlich unmountet wird.
  const [mountedItem, setMountedItem] = useState(item);
  const [visible, setVisible] = useState(false);
  const rafRef = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (item) {
      setMountedItem(item);
      if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
      rafRef.current = requestAnimationFrame(() => setVisible(true));
    } else if (mountedItem) {
      setVisible(false);
      closeTimerRef.current = setTimeout(() => setMountedItem(null), ANIM_MS);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  // Body-Lock NUR solange ein Post tatsaechlich angezeigt wird — NICHT
  // bedingungslos beim Komponenten-Mount. PostFullscreenView bleibt als
  // Kind von ContentPreviewProvider dauerhaft gemountet (fuer Exit-Animation);
  // useWizardBodyLock() ohne active-Flag setzte hui-wizard-open permanent
  // auf body → HUIBottomNavigation pointerEvents:"none" fuer alle Tabs.
  useWizardBodyLock(!!mountedItem);

  // Body-Scroll sperren solange offen (identisches, simples Muster wie
  // in ContentPreviewSheet.jsx -- bewusst kein Wizard-Stack-Coupling).
  useEffect(() => {
    if (!mountedItem) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mountedItem]);

  const postId    = mountedItem?.id || null;
  const postType  = mountedItem?.type || "moment";
  const authorId  = mountedItem?.author?.id || null;
  const snapshot  = useMemo(() => mountedItem ? ({
    cover_url: mountedItem.media?.[0]?.url || null, title: mountedItem.title,
    author_name: mountedItem.author?.name || null, user_id: authorId,
  }) : null, [mountedItem, authorId]);

  const { counts, myTypes, toggle } = useSingleReaction(postId, postType, authorId, snapshot);
  const saved = postId ? isSaved(postId) : false;
  const moreFromAuthor = useMoreFromAuthor(authorId, postId);

  const handleReaction = useCallback((type) => {
    if (!postId) return;
    if (type === "save") {
      toggleSave(postId, postType, snapshot);
      toast.info(saved ? "Aus Merkliste entfernt" : "Gespeichert", { duration:1800 });
      return;
    }
    toggle(type);
  }, [postId, postType, snapshot, toggle, toggleSave, saved]);

  // SHARE.1 (2026-07-09): zentrale, appweit einheitliche Share-Funktion.
  const handleShare = useCallback(() => { shareContent(mountedItem); }, [mountedItem]);

  // KOMMENTAR.1 (2026-07-09): Kommentarzaehler + Sheet.
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    countComments(postId, postType).then(n => { if (!cancelled) setCommentCount(n); });
    return () => { cancelled = true; };
  }, [postId, postType]);

  const handleOpenProfile = useCallback(() => {
    if (authorId && typeof window.__HUI_OPEN_PROFILE__ === "function") {
      onClose();
      window.__HUI_OPEN_PROFILE__(authorId);
    }
  }, [authorId, onClose]);

  // ── Swipe-nach-unten zum Schliessen (einfacher, self-contained Touch-
  //    Tracker, keine Motion-Library) ──
  const dragRef  = useRef({ startY:0, dy:0, dragging:false });
  const [dragY, setDragY] = useState(0);
  const onTouchStart = useCallback((e) => {
    dragRef.current = { startY: e.touches[0].clientY, dy:0, dragging:true };
  }, []);
  const onTouchMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    if (dy > 0) { dragRef.current.dy = dy; setDragY(dy); }
  }, []);
  const onTouchEnd = useCallback(() => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (dragRef.current.dy > 110) { onClose(); } else { setDragY(0); }
  }, [onClose]);

  if (!mountedItem) return null;

  const reactions = {
    inspired: myTypes?.has?.("inspire") ?? false,
    touched:  myTypes?.has?.("touch")   ?? false,
    saved,
    inspireCount: counts?.inspire || null,
    touchCount:   counts?.like    || null,
  };

  const hero      = mountedItem.media?.[0]?.url || null;
  const extraMedia = (mountedItem.media || []).slice(1);
  const hasEmbedded = Array.isArray(mountedItem.embeddedRefs) && mountedItem.embeddedRefs.length > 0;

  const translate = visible ? Math.max(0, dragY) : (typeof window !== "undefined" ? window.innerHeight : 800);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:15000, background:T.sheet,
      opacity: visible ? 1 : 0,
      pointerEvents: visible ? "auto" : "none",
      transition: dragRef.current.dragging ? "none" : `transform ${ANIM_MS}ms cubic-bezier(.4,0,.2,1), opacity ${ANIM_MS}ms ease`,
      transform: `translateY(${translate}px)`,
      display:"flex", flexDirection:"column",
    }}>
      <style>{CSS}</style>

      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        style={{ flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch" }}
      >
        {/* Griff + Close — Statusbar bleibt sichtbar (paddingTop respektiert Safe-Area) */}
        <div style={{
          position:"sticky", top:0, zIndex:2, background:"transparent",
          paddingTop:"calc(env(safe-area-inset-top, 0px) + 8px)",
        }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,46,0.15)", margin:"0 auto 8px" }}/>
          <div style={{ display:"flex", justifyContent:"flex-end", padding:"0 16px" }}>
            <button className="pfv-btn" onClick={onClose} aria-label="Schliessen" style={{
              width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
              background:"rgba(26,26,46,0.06)", fontSize:18, color:T.ink,
            }}>✕</button>
          </div>
        </div>

        {/* 1) Grosses Bild/Video */}
        {hero && (
          <img loading="lazy" decoding="async" src={hero} alt={mountedItem.title || ""} style={{ width:"100%", maxHeight:"62vh", objectFit:"cover", display:"block", marginTop:8 }}/>
        )}

        <div style={{ padding:"18px 18px 0" }}>
          {/* 2) Autor: Profilbild / Name / Ort / Datum */}
          {mountedItem.author?.name && (
            <div className="pfv-btn" onClick={handleOpenProfile} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ width:40, height:40, borderRadius:"50%", overflow:"hidden", flexShrink:0,
                background:"rgba(13,196,181,0.14)" }}>
                {mountedItem.author.avatar && <img loading="lazy" decoding="async" src={mountedItem.author.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:14.5, fontWeight:700, color:T.ink }}>{mountedItem.author.name}</div>
                <div style={{ fontSize:12, color:T.inkFaint, display:"flex", gap:8, flexWrap:"wrap" }}>
                  {mountedItem.location && <span>📍 {mountedItem.location}</span>}
                  {mountedItem.createdAt && <span>🕐 {mountedItem.createdAt}</span>}
                </div>
              </div>
            </div>
          )}

          {/* 3) Vollstaendiger Beitrag */}
          {mountedItem.text && (
            <div style={{ fontSize:15, color:T.inkSoft, lineHeight:1.65, marginBottom:16, whiteSpace:"pre-wrap" }}>
              {mountedItem.text}
            </div>
          )}

          {/* Weitere Medien */}
          {extraMedia.length > 0 && (
            <div className="pfv-strip" style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:16 }}>
              {extraMedia.map((m, i) => (
                <img loading="lazy" decoding="async" key={i} src={m.url} alt="" style={{ width:110, height:110, borderRadius:12, objectFit:"cover", flexShrink:0 }}/>
              ))}
            </div>
          )}

          {/* 4) Eingebettete Inhalte (Werke/Erlebnisse/Projekte/Veranstaltungen) --
              vorbereitet, rendert nur bei vorhandenen Daten. Aktuell existiert
              dafuer keine DB-Verknuepfung (siehe Kommentar am Dateikopf). */}
          {hasEmbedded && (
            <div className="pfv-strip" style={{ display:"flex", gap:10, overflowX:"auto", marginBottom:16 }}>
              {mountedItem.embeddedRefs.map((ref, i) => (
                <div key={i} className="pfv-btn" onClick={() => onOpenPost?.(ref)} style={{
                  minWidth:140, border:`1px solid ${T.border}`, borderRadius:14, padding:12, flexShrink:0,
                }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.teal, marginBottom:4 }}>{ref.typeLabel}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>{ref.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5) Interaktionsleiste — identisch zum Feed + 5. Aktion
            "Kommentieren" (extraActions-Slot, KOMMENTAR.1) */}
        <FeedActions
          reactions={reactions} onReaction={handleReaction} onShare={handleShare}
          extraActions={
            <ActionBtn Icon={HUICommentIcon} count={commentCount || null} variant="kommentieren"
              activeColor={T.teal} onClick={() => setShowComments(true)} />
          }
        />

        <div style={{ padding:"0 18px 24px" }}>
          {/* 7) Weitere Beitraege dieses Wirkers */}
          {moreFromAuthor.length > 0 && (
            <div style={{ marginTop:22 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:10 }}>
                Weitere Beiträge von {mountedItem.author?.name || "diesem Wirker"}
              </div>
              <div className="pfv-strip" style={{ display:"flex", gap:8, overflowX:"auto" }}>
                {moreFromAuthor.map((row) => (
                  <div key={row.id} className="pfv-btn" onClick={() => onOpenPost?.(row)} style={{
                    width:96, height:96, borderRadius:12, overflow:"hidden", flexShrink:0,
                    background:"rgba(26,26,46,0.05)",
                  }}>
                    {row.src && <img loading="lazy" decoding="async" src={row.src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8) Profil ansehen */}
          <button className="pfv-btn" onClick={handleOpenProfile} style={{
            width:"100%", marginTop:22, padding:"13px", borderRadius:14,
            background:T.ink, color:"#fff", fontSize:14, fontWeight:700,
          }}>
            Profil ansehen
          </button>
        </div>
      </div>

      {/* KOMMENTAR.1: ausserhalb des touch-gesteuerten Scroll-Containers
          gerendert (eigener onTouchStart/Move/End waere sonst betroffen).
          Eigener, hoeherer z-Index als das Fullscreen-Grundgeruest (15000). */}
      <CommentsSheet
        open={showComments} onClose={() => setShowComments(false)}
        postId={postId} postType={postType} postAuthorId={authorId}
      />
    </div>
  );
}
