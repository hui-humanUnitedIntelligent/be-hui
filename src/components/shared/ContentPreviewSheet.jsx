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
//   - comments-Tabelle + Query/Insert-Pattern    (1:1 aus WorkDetailPage
//                                                 uebernommen -- nur
//                                                 fuer type="work", da
//                                                 die Tabelle bislang
//                                                 ausschliesslich ueber
//                                                 work_id verknuepft ist;
//                                                 andere Typen brauchen
//                                                 dafuer erst eine DB-
//                                                 Migration, siehe
//                                                 Datenmigration-Regel)
// ══════════════════════════════════════════════════════════════════
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useSingleReaction } from "../../lib/useReactions.jsx";
import { useSavedPostsContext } from "../../context/SavedPostsContext.jsx";
import { FeedActions } from "../../feed/cards/BaseFeedCard.jsx";
import { toast } from "../../lib/useToast.jsx";
import { shareContent } from "../../lib/shareContent.js";

const T = {
  ink: "#1A1A2E", inkSoft: "rgba(26,26,46,0.60)", inkFaint: "rgba(26,26,46,0.38)",
  teal: "#0DC4B5", coral: "#F47355", border: "rgba(26,26,46,0.08)",
  sheet: "#FCFDFC", overlay: "rgba(20,24,22,0.46)",
};

const TYPE_LABEL = {
  work: "Werk", experience: "Erlebnis", moment: "Beitrag", event: "Veranstaltung",
  project: "Impact-Projekt", recommendation: "Empfehlung", wirker: "Wirker",
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

function Comments({ workId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [input, setInput]       = useState("");
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.from("comments")
      .select("id,text,created_at,user_id,profiles(display_name,avatar_url)")
      .eq("work_id", workId)
      .order("created_at", { ascending:true }).limit(50)
      .then(({ data }) => { if (!cancelled) setComments(data || []); });
    return () => { cancelled = true; };
  }, [workId]);

  const submit = useCallback(async () => {
    const txt = input.trim();
    if (!txt || !user?.id || busy) return;
    setBusy(true);
    const optimistic = {
      id: "opt_" + Date.now(), text: txt, user_id: user.id, created_at: new Date().toISOString(),
      profiles: { display_name: user.user_metadata?.full_name || "Du", avatar_url: null },
    };
    setComments(c => [...c, optimistic]);
    setInput("");
    const { error } = await supabase.from("comments").insert({ work_id: workId, user_id: user.id, text: txt });
    if (error) setComments(c => c.filter(x => x.id !== optimistic.id));
    setBusy(false);
  }, [input, user, busy, workId]);

  return (
    <div style={{ marginTop:18 }}>
      <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:10 }}>
        Kommentare {comments.length > 0 ? `(${comments.length})` : ""}
      </div>
      {comments.length === 0 && (
        <div style={{ fontSize:12.5, color:T.inkFaint, marginBottom:10 }}>Noch keine Kommentare.</div>
      )}
      {comments.map(c => (
        <div key={c.id} style={{ display:"flex", gap:8, marginBottom:10 }}>
          <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0, overflow:"hidden",
            background:"rgba(13,196,181,0.14)" }}>
            {c.profiles?.avatar_url && <img src={c.profiles.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.ink }}>{c.profiles?.display_name || "Mitglied"}</div>
            <div style={{ fontSize:13, color:T.inkSoft, lineHeight:1.5 }}>{c.text}</div>
          </div>
        </div>
      ))}
      {user?.id && (
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            placeholder="Kommentar schreiben…"
            onKeyDown={e => { if (e.key === "Enter") submit(); }}
            style={{ flex:1, border:`1px solid ${T.border}`, borderRadius:99, padding:"9px 14px",
              fontSize:13, outline:"none", background:"#fff" }}
          />
          <button className="cps-btn" onClick={submit} disabled={busy || !input.trim()} style={{
            background: T.teal, color:"#fff", borderRadius:99, padding:"9px 16px",
            fontSize:13, fontWeight:700, opacity: (busy || !input.trim()) ? 0.5 : 1,
          }}>Senden</button>
        </div>
      )}
    </div>
  );
}

export default function ContentPreviewSheet({ item, loading, onClose }) {
  const navigate = useNavigate();
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

  const reactions = {
    inspired: myTypes?.has?.("inspire") ?? false,
    touched:  myTypes?.has?.("like")    ?? false, // bestehende App-Konvention (siehe UnifiedFeed.jsx)
    saved,
    inspireCount: counts?.inspire || null,
    touchCount:   counts?.like    || null,
  };

  const hero = item?.media?.[0]?.url || null;
  const extraMedia = (item?.media || []).slice(1);

  return (
    <div
      className="cps-overlay"
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:9200, background:T.overlay,
        display:"flex", alignItems:"flex-end", justifyContent:"center",
      }}
    >
      <style>{CSS}</style>
      <div
        className="cps-sheet"
        onClick={e => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:560, maxHeight:"88vh", overflowY:"auto",
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
          <div style={{ padding:"0 0 24px" }}>
            {/* Titelbild */}
            {hero ? (
              <img src={hero} alt={item.title || ""} style={{ width:"100%", maxHeight:320, objectFit:"cover", display:"block" }}/>
            ) : item.type === "project" ? (
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
                    {item.author.avatar && <img src={item.author.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>}
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
                    <span style={{ fontSize:12, color:T.inkFaint }}>📍 {item.location}</span>
                  )}
                </div>
              )}

              {/* Weitere Medien */}
              {extraMedia.length > 0 && (
                <div style={{ display:"flex", gap:8, overflowX:"auto", marginBottom:14 }}>
                  {extraMedia.map((m, i) => (
                    <img key={i} src={m.url} alt="" style={{ width:96, height:96, borderRadius:12, objectFit:"cover", flexShrink:0 }}/>
                  ))}
                </div>
              )}
            </div>

            {/* Action-Bar — identisch zum Feed (Resonanz/Austauschen/Weitergeben/Merken) */}
            <FeedActions reactions={reactions} onReaction={handleReaction} onShare={handleShare} />

            <div style={{ padding:"0 18px" }}>
              {/* Vollstaendige Detailseite, falls vorhanden */}
              {item.canOpenFull && item.fullPath && (
                <button className="cps-btn" onClick={() => { onClose(); navigate(item.fullPath); }} style={{
                  width:"100%", marginTop:16, padding:"13px", borderRadius:14,
                  background:T.ink, color:"#fff", fontSize:14, fontWeight:700,
                }}>
                  Vollständige Ansicht öffnen
                </button>
              )}

              {/* Kommentare — aktuell nur fuer Werke (comments-Tabelle ist
                  ausschliesslich ueber work_id verknuepft; andere Typen
                  brauchen dafuer erst eine DB-Migration) */}
              {item.type === "work" && <Comments workId={item.id} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
