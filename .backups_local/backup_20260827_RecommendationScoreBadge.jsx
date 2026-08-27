// src/components/profile/RecommendationScoreBadge.jsx
// ══════════════════════════════════════════════════════════════════════
// EMPFEHLUNGS-SCORE BADGE — Prozentanzeige neben "Kundenstimmen"
// positiv / gesamt * 100 = Prozent
// Grün ≥80%, Gelb 50-79%, Rot <50%
// Klick öffnet RecommendationRankingModal
// Pflicht: createPortal, zIndex >= 10500
// ══════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { useSheetDrag } from "../../hooks/useSheetDrag.js";

const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.32)",
  border:   "rgba(26,26,24,0.08)",
  green:    "#10B981",
  greenBg:  "rgba(16,185,129,0.10)",
  yellow:   "#F59E0B",
  yellowBg: "rgba(245,158,11,0.10)",
  red:      "#E83A3A",
  redBg:    "rgba(232,58,58,0.08)",
  r16:      16,
  r12:      12,
  r99:      99,
  ff:       "Inter,sans-serif",
};

function getColor(pct) {
  if (pct >= 80) return { color: T.green, bg: T.greenBg };
  if (pct >= 50) return { color: T.yellow, bg: T.yellowBg };
  return { color: T.red, bg: T.redBg };
}

function ScoreRing({ pct, size = 44, stroke = 4 }) {
  const { color } = getColor(pct);
  const radius = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0, transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={T.border} strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

export function RecommendationScoreBadge({ profileOwnerId = "", onOpen = null }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileOwnerId) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("rpc_get_recommendation_score", {
          p_user_id: profileOwnerId,
        });
        if (mounted && !error && data) setScore(data);
      } catch (e) {}
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [profileOwnerId]);

  if (loading || !score || score.total_count === 0) return null;

  const pct = score.score_percentage;
  const { color, bg } = getColor(pct);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpen?.(); }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        border: `1px solid ${color}`,
        borderRadius: T.r99,
        padding: "3px 10px 3px 6px",
        cursor: "pointer",
        fontFamily: T.ff,
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      <ScoreRing pct={pct} size={22} stroke={2.5} />
      <span style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: "-0.02em" }}>
        {pct}%
      </span>
    </button>
  );
}

export function RecommendationRankingModal({
  profileOwnerId = "",
  profileOwnerName = "",
  onClose = () => {},
}) {
  const { dragHandlers, sheetTransform, sheetTransition } = useSheetDrag(onClose);
  useModalRegistration(true, onClose, "RecommendationRankingModal");

  const [score, setScore]       = useState(null);
  const [recs, setRecs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [currentUid, setCurrentUid] = useState("");
  const [itemTitles, setItemTitles] = useState({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setCurrentUid(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!profileOwnerId) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const [scoreRes, recsRes] = await Promise.all([
          supabase.rpc("rpc_get_recommendation_score", { p_user_id: profileOwnerId }),
          supabase
            .from("recommendations")
            .select("id,from_user_id,to_user_id,text,is_public,order_id,booking_id,is_positive,created_at,deleted_at")
            .eq("to_user_id", profileOwnerId)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(100),
        ]);
        if (mounted && !scoreRes.error) setScore(scoreRes.data);
        if (mounted && !recsRes.error) setRecs(recsRes.data || []);

        if (mounted && currentUid) {
          supabase.from("commerce_events").insert({
            event_type: "recommendation_ranking_opened",
            actor_id: currentUid,
            actor_type: "user",
            payload: { profile_owner_id: profileOwnerId },
          }).then(() => {});
        }
      } catch (e) {}
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, [profileOwnerId, currentUid]);

  useEffect(() => {
    if (!recs.length) return;
    const orderIds = [...new Set(recs.map(r => r.order_id).filter(Boolean))];
    const bookingIds = [...new Set(recs.map(r => r.booking_id).filter(Boolean))];
    if (orderIds.length) {
      supabase.from("order_items")
        .select("order_id,snapshot->>title")
        .in("order_id", orderIds)
        .then(({ data }) => {
          const titles = {};
          (data || []).forEach(d => { if (d.order_id) titles[d.order_id] = d.snapshot?.title || "Werk"; });
          setItemTitles(prev => ({ ...prev, ...titles }));
        });
    }
    if (bookingIds.length) {
      supabase.from("talents")
        .select("id,title")
        .in("id", bookingIds)
        .then(({ data }) => {
          const titles = {};
          (data || []).forEach(d => { titles[d.id] = d.title || "Talent-Buchung"; });
          setItemTitles(prev => ({ ...prev, ...titles }));
        });
    }
  }, [recs]);

  const positiveRecs = recs.filter(r => r.is_positive !== false);
  const negativeRecs = recs.filter(r => r.is_positive === false);
  const pct = score?.score_percentage ?? 100;
  const { color, bg } = getColor(pct);

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
  };

  const renderItem = (rec, isPositive) => {
    const title = rec.order_id ? itemTitles[rec.order_id] : rec.booking_id ? itemTitles[rec.booking_id] : null;
    return (
      <div key={rec.id} style={{
        background: T.bgCard, borderRadius: T.r12, padding: "12px 14px",
        border: `1px solid ${T.border}`, marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isPositive ? T.greenBg : T.redBg, fontSize: 14,
          }}>
            {isPositive ? "✓" : "✕"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.5, fontStyle: isPositive ? "italic" : "normal", marginBottom: 4 }}>
              {rec.text || (isPositive ? "Empfohlen" : "Nicht empfohlen")}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11, color: T.inkFaint }}>
              <span>{formatDate(rec.created_at)}</span>
              {title && <span>• {title}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{ position: "fixed", inset: 0, zIndex: 10500, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end", WebkitOverflowScrolling: "touch" }}
    >
      <div
        data-hui-kbd-self-managed
        style={{
          width: "100%", maxWidth: 480,
          maxHeight: "calc(92dvh - var(--hui-keyboard-inset, 0px))",
          overflowY: "auto", WebkitOverflowScrolling: "touch",
          background: T.bg, borderRadius: "24px 24px 0 0",
          padding: "20px 20px calc(88px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))",
          display: "flex", flexDirection: "column", gap: 16,
          fontFamily: T.ff,
          transform: sheetTransform, transition: sheetTransition,
          animation: "rsbSlideUp 0.28s cubic-bezier(.32,1.2,.55,1) both",
        }}
      >
        <style>{`@keyframes rsbSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        <div {...dragHandlers} style={{ touchAction: "none", cursor: "grab", width: 40, height: 4, borderRadius: 2, background: "rgba(26,26,24,0.12)", margin: "0 auto 0", flexShrink: 0 }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 17, fontWeight: 600, color: T.ink, letterSpacing: "-0.02em" }}>Empfehlungs-Ranking</div>
          <button onClick={onClose} style={{ background: "rgba(26,26,24,0.07)", border: "none", borderRadius: T.r99, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: T.inkSoft, fontFamily: T.ff }}>✕</button>
        </div>

        <div style={{ background: T.bgCard, borderRadius: T.r16, padding: "20px", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 20 }}>
          <ScoreRing pct={pct} size={64} stroke={6} />
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color, letterSpacing: "-0.03em" }}>{pct}%</div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{score?.positive_count ?? 0} positiv · {score?.negative_count ?? 0} negativ</div>
            <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 4 }}>Empfehlungs-Score für {profileOwnerName || "dieses Mitglied"}</div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid rgba(14,196,184,0.2)", borderTopColor: T.teal, animation: "hui-spin 0.7s linear infinite" }} />
            <style>{`@keyframes hui-spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : recs.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: T.inkFaint, fontSize: 13 }}>Noch keine Empfehlungen vorhanden.</div>
        ) : (
          <>
            {positiveRecs.length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 10, paddingLeft: 2 }}>Positive Empfehlungen ({positiveRecs.length})</div>
                {positiveRecs.map(r => renderItem(r, true))}
              </div>
            )}
            {negativeRecs.length > 0 && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 10, paddingLeft: 2 }}>Negative Empfehlungen ({negativeRecs.length})</div>
                {negativeRecs.map(r => renderItem(r, false))}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
