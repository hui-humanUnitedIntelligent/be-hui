// src/components/profile/my-basis/MeinMomenteDrawerContent.jsx
// MeinMomenteDrawerContent — extracted from MyBasisProfile.jsx.
// Shows moments grid + "Create new moment". No logic changes.
import React from "react";
import { createPortal } from "react-dom";
import { useContentPreview } from "../../../context/ContentPreviewContext.jsx";
import { supabase } from "../../../lib/supabaseClient.js";
import { HUIFotoIcon } from "../../../design/icons/HuiSystemIcons.jsx";
import { T } from "./constants.js";
import { HUILogo } from "../../brand/HUILogo.jsx";
import { useTranslation } from "../../../hooks/useTranslation.js";

export function MeinMomenteDrawerContent({ profile, onOpenMomentSheet }) {
  const { t } = useTranslation();
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
              {t("moment.deleteTitle")}
            </div>
            <div style={{ fontSize:13, color:"#666", textAlign:"center",
              lineHeight:1.5, marginBottom:20 }}>
              {t("moment.deleteWarning")}
            </div>
            <button onClick={handleConfirmDelete}
              style={{ width:"100%", padding:"12px", borderRadius:99,
                background:"#ff3b3b", border:"none", color:"#fff",
                fontSize:14, fontWeight: 600, cursor:"pointer",
                fontFamily:"inherit", marginBottom:8 }}>
              {t("moment.deletePermanent")}
            </button>
            <button onClick={() => setConfirmMoment(null)}
              style={{ width:"100%", padding:"12px", borderRadius:99,
                background:"#f0f0ee", border:"none", color:"#444",
                fontSize:14, fontWeight:600, cursor:"pointer",
                fontFamily:"inherit" }}>{t("common.cancel")}</button>
          </div>
        </div>,
        document.body
      )}

      <div style={{ padding:`0 ${T.px}px` }}>
        {/* ── Header ────────────────────────────────────────── */}
        <div style={{ fontSize:12, color:"#8C8C85", marginBottom:12 }}>
          {moments.length > 0
            ? `${moments.length} ${moments.length === 1 ? t("meinBereich.momentSingular") : t("meinBereich.momentPlural")} ${t("meinBereich.momentsShared").toLowerCase()}`
            : t("meinBereich.momentsEmpty")}
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
                {t("meinBereich.firstMoment")}
              </div>
            </div>
          </div>
        )}

        {/* ── "+ {t("meinBereich.addMoment")}" Button (identisch zu Talent-Angeboten) ── */}
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
          {t("meinBereich.addMoment")}
        </button>
      </div>
    </>
  );
}


// ══════════════════════════════════════════════════════════════
// TALENT-ERWEITERUNG
// Sichtbar wenn profiles.is_talent = true
// Zeigt 6 Schritte + Meine Werke + Meine Erlebnisse
// Basiert auf DEMSELBEN Profil — kein neues Profil
// ══════════════════════════════════════════════════════════════
