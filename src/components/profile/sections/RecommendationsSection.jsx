// src/components/profile/sections/RecommendationsSection.jsx
// ══════════════════════════════════════════════════════════════════════
// RECOMMENDATIONS SECTION — Kundenstimmen / Empfehlungen
// Owner: + Weitere hinzufügen. Empty-State mit Hinweis.
// Visitor: Sterne-Rating + work_title. Empty-State statt null.
// ══════════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useContentPreview } from "../../../context/ContentPreviewContext.jsx"; // OPEN.1 2026-07-08
import { normalizeRecommendationForPreview } from "../../../lib/previewNormalizers.js";
import { useProfileLauncher } from '../../home/profile/ProfileLauncher.jsx';
import RecommendModal from "../RecommendModal.jsx";
import { RecommendationService } from "../../../services/db";
import { supabase } from "../../../lib/supabaseClient";
import { useModalRegistration } from "../../../hooks/useModalRegistration.js";

const T = {
  bg:"#F7F5F0", bgCard:"#FFFFFF", ink:"#1A1A18",
  inkSoft:"#4A4A45", inkFaint:"#8C8C85",
  teal:"#0EC4B8", tealMid:"rgba(14,196,184,0.22)", borderMid:"rgba(26,26,24,0.14)",
  border:"rgba(26,26,24,0.08)", r16:16, r99:99, px:16,
  card:"0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
};

function Sk({ w, h, r=8 }) {
  return <div style={{ width:w, height:h, borderRadius:r, flexShrink:0,
    background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
    backgroundSize:"200% 100%", animation:"ps-shimmer 1.4s ease-in-out infinite" }}/>;
}

function Stars({ rating }) {
  const r = Math.min(5, Math.max(0, Math.round(rating || 0)));
  return (
    <div style={{ fontSize:11, color:"#F59E0B", marginBottom:4, letterSpacing:"1px" }}>
      {"★".repeat(r)}{"☆".repeat(5 - r)}
    </div>
  );
}

export function RecommendationsSection({
  recommendations   = [],
  isOwner          = false,
  loading          = false,
  onShowAll        = null,
  profileOwnerId   = "",
  profileOwnerName = "",
}) {
  const { openCreatorProfile } = useProfileLauncher();
  const { open: openPreview } = useContentPreview();

  // ── Empfehlung schreiben (Visitor, nach Kauf/Buchung) ──
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [canRec, setCanRec]       = useState(false);
  const [hasRecd, setHasRecd]     = useState(false);
  const [recContext, setRecContext] = useState({ orderId: null, bookingId: null });
  const [currentUid, setCurrentUid] = useState("");

  useEffect(() => {
    if (!profileOwnerId || isOwner) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted || !data?.user?.id) return;
      setCurrentUid(data.user.id);
      const [eligible, already] = await Promise.all([
        RecommendationService.canRecommend(data.user.id, profileOwnerId),
        RecommendationService.hasRecommended(data.user.id, profileOwnerId),
      ]);
      if (!mounted) return;
      setCanRec(eligible.eligible);
      setHasRecd(already);
      setRecContext({ orderId: eligible.orderId, bookingId: eligible.bookingId });
    })();
    return () => { mounted = false; };
  }, [profileOwnerId, isOwner]);

  // ── Melden-Dialog (Owner) ──
  const [reportingId, setReportingId]     = useState(null);
  useModalRegistration(!!reportingId, () => setReportingId(null), "RecommendationsSection-Reporting");
  const [reportReason, setReportReason]   = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reported, setReported]           = useState({}); // rec.id → true

  const handleReport = async () => {
    if (!reportingId || !profileOwnerId || reportReason.trim().length < 3) return;
    setReportSubmitting(true);
    try {
      // rec-Daten holen für offender_id + message
      const rec = recommendations.find(r => r.id === reportingId);
      const result = await RecommendationService.reportRecommendation(reportingId, profileOwnerId, {
        reason: reportReason.trim(),
        offenderId: rec?.from_user_id || null,
        message: rec?.text || '',
      });
      if (result.error) throw result.error;
      setReported(prev => ({ ...prev, [reportingId]: true }));
      setReportingId(null);
      setReportReason("");
    } catch (e) {
      console.warn("[RecommendationsSection] report error:", e);
    }
    setReportSubmitting(false);
  };
  if (loading) {
    return (
      <div>
        <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.rs-hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.rs-hscroll::-webkit-scrollbar{display:none}`}</style>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:`0 ${T.px}px`, marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight: 600, color:T.ink }}>Kundenstimmen</div>
        </div>
        <div className="rs-hscroll" style={{ display:"flex", gap:12, padding:`0 ${T.px}px 4px` }}>
          <Sk w={210} h={110} r={T.r16}/>
          <Sk w={210} h={110} r={T.r16}/>
        </div>
      </div>
    );
  }

  // Visitor + keine Empfehlungen → Platzhalter anzeigen (nicht null)
  if (!isOwner && recommendations.length === 0) {
    return (
      <div>
        <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:`0 ${T.px}px`, marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight: 600, color:T.ink, letterSpacing:"-0.02em" }}>
            Kundenstimmen
          </div>
        </div>
        <div style={{ margin:`0 ${T.px}px` }}>
          <div style={{ padding:"16px", borderRadius:T.r16,
            background:T.bgCard, border:`1px solid ${T.border}`, textAlign:"center" }}>
            <div style={{ fontSize:22, color:T.teal, marginBottom:6 }}>❝</div>
            <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic", marginBottom:6 }}>
              Noch keine Empfehlungen vorhanden.
            </div>
            <div style={{ fontSize:11, color:T.inkSoft, lineHeight:1.5 }}>
              Empfehlungen entstehen, wenn andere Mitglieder nach einem Kauf oder einer Buchung ihre Erfahrung teilen.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.rs-hscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.rs-hscroll::-webkit-scrollbar{display:none}.rs-press{-webkit-tap-highlight-color:transparent;transition:opacity .12s ease}.rs-press:active{opacity:.65}`}</style>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:`0 ${T.px}px`, marginBottom:12 }}>
        <div style={{ fontSize:15, fontWeight: 600, color:T.ink, letterSpacing:"-0.02em" }}>
          Kundenstimmen
        </div>
        {recommendations.length > 0 && onShowAll && (
          <button onClick={onShowAll} style={{ background:"none", border:"none", padding:0,
            fontSize:12, fontWeight:600, color:T.teal, cursor:"pointer", fontFamily:"inherit" }}>
            Alle anzeigen ›
          </button>
        )}
      </div>

      {recommendations.length === 0 ? (
        isOwner ? (
          <div style={{ margin:`0 ${T.px}px` }}>
            <div style={{ padding:"16px", borderRadius:T.r16,
              background:T.bgCard, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:13, color:T.inkFaint, fontStyle:"italic", marginBottom:10 }}>
                Noch keine Empfehlungen von anderen Mitgliedern.
              </div>
              <div style={{ fontSize:12, color:T.inkSoft, lineHeight:1.5 }}>
                Empfehlungen entstehen, wenn andere Mitglieder deine Arbeit weiterempfehlen.
              </div>
            </div>
          </div>
        ) : null
      ) : (
        <div className="rs-hscroll" style={{ display:"flex", gap:12, padding:`0 ${T.px}px 4px` }}>
          {recommendations.slice(0,5).map((rec,i) => {
            // from_profile wird via Batch-Query in useProfileData.js geladen (FK zu auth.users)
            const authorName   = rec.from_profile?.display_name || "Mitglied";
            const authorAvatar = rec.from_profile?.avatar_url   || null;
            return (
            <div key={rec.id||i}
              onClick={() => { const item = normalizeRecommendationForPreview(rec); if (item) openPreview(item); }}
              style={{ flexShrink:0, width:210, cursor:"pointer",
              background:T.bgCard, borderRadius:T.r16,
              border:`1px solid ${T.border}`, padding:"14px 16px", boxShadow:T.card, position:"relative" }}>
              <div style={{ fontSize:22, color:T.teal, marginBottom:6 }}>❝</div>
              <div style={{ fontSize:13, color:T.ink, lineHeight:1.55, fontStyle:"italic", marginBottom:10 }}>
                {rec.text || ""}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); if (rec.from_user_id) openCreatorProfile(rec.from_user_id); }}
                style={{ display:"flex", alignItems:"center", gap:8, background:"none", border:"none",
                  padding:0, cursor:"pointer", WebkitTapHighlightColor:"transparent" }}
              >
                {authorAvatar && (
                  <img loading="lazy" decoding="async" src={authorAvatar} alt={authorName} style={{ width:24, height:24,
                    borderRadius:"50%", objectFit:"cover" }}/>
                )}
                <div style={{ fontSize:11.5, color:T.inkFaint, fontWeight:600 }}>
                  — {authorName}
                </div>
              </button>
              {/* Melden-Button — nur Owner, nur wenn nicht schon gemeldet */}
              {isOwner && !reported[rec.id] && (
                <button
                  onClick={(e) => { e.stopPropagation(); setReportingId(rec.id); }}
                  style={{
                    position: "absolute", top: 10, right: 10,
                    background: "rgba(26,26,24,0.04)",
                    border: "none", borderRadius: T.r99,
                    padding: "4px 8px", fontSize: 10, fontWeight: 600,
                    color: T.inkFaint, cursor: "pointer", fontFamily: T.ff,
                  }}
                >
                  ⚠ Melden
                </button>
              )}
              {isOwner && reported[rec.id] && (
                <span
                  style={{
                    position: "absolute", top: 10, right: 10,
                    fontSize: 10, fontWeight: 600, color: T.teal,
                  }}
                >
                  ✓ Gemeldet
                </span>
              )}
            </div>
            );
          })}

          {/* Empfehlen — Visitor (nicht Owner, nach Kauf/Buchung) */}
          {!isOwner && canRec && !hasRecd && (
            <div className="rs-press" onClick={() => setShowRecommendModal(true)} style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
              padding: "10px 16px", borderRadius: T.r16,
              background: T.bgCard, border: `1.5px solid ${T.teal}`,
              fontSize: 12.5, fontWeight: 600, color: T.teal,
              cursor: "pointer", whiteSpace: "nowrap",
              fontFamily: T.ff,
            }}>
              + Empfehlen
            </div>
          )}
          {!isOwner && canRec && hasRecd && (
            <div style={{
              flexShrink: 0, padding: "10px 16px", borderRadius: T.r16,
              background: T.bgCard, border: `1px solid ${T.border}`,
              fontSize: 12, fontWeight: 500, color: T.inkFaint,
              whiteSpace: "nowrap", fontFamily: T.ff,
            }}>
              ✓ Empfohlen
            </div>
          )}


        </div>
      )}

      {/* ── Modals (Portal zu document.body) ── */}

      {/* RecommendModal — Visitor kann Empfehlung schreiben */}
      {showRecommendModal && profileOwnerId && (
        <RecommendModal
          toUserId={profileOwnerId}
          toUserName={profileOwnerName}
          orderId={recContext.orderId}
          bookingId={recContext.bookingId}
          onClose={() => setShowRecommendModal(false)}
          onSubmitted={() => { setHasRecd(true); setShowRecommendModal(false); }}
        />
      )}

      {/* Melden-Dialog — Owner kann Empfehlung melden */}
      {reportingId && createPortal(
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setReportingId(null); setReportReason(""); } }}
          style={{ position: "fixed", inset: 0, zIndex: 10550, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end" }}
        >
          <div style={{
            width: "100%", background: T.bg,
            borderRadius: "16px 16px 0 0",
            padding: "20px 20px calc(88px + env(safe-area-inset-bottom, 0px))",
            display: "flex", flexDirection: "column", gap: 14, fontFamily: T.ff,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.ink }}>Empfehlung melden</div>
              <button onClick={() => { setReportingId(null); setReportReason(""); }}
                style={{ background: "rgba(26,26,24,0.07)", border: "none", borderRadius: 99, width: 30, height: 30, fontSize: 16, color: T.inkSoft, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.5 }}>
              Nur du kannst Empfehlungen auf deinem Profil melden. Gib einen Grund an.
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Warum möchtest du diese Empfehlung melden?"
              maxLength={300}
              style={{
                width: "100%", minHeight: 80, padding: "12px 14px",
                borderRadius: 12, border: `1px solid ${T.border}`,
                background: T.bgCard, fontSize: 14, lineHeight: 1.5,
                color: T.ink, fontFamily: T.ff, resize: "none", outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleReport}
              disabled={reportReason.trim().length < 3 || reportSubmitting}
              style={{
                padding: "13px 24px", borderRadius: 99, border: "none",
                background: reportReason.trim().length < 3 ? "rgba(26,26,24,0.08)" : "#DC2626",
                color: reportReason.trim().length < 3 ? T.inkFaint : "white",
                fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: T.ff,
                opacity: reportSubmitting ? 0.6 : 1,
              }}
            >
              {reportSubmitting ? "Wird gesendet…" : "Meldung senden"}
            </button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
export default RecommendationsSection;

