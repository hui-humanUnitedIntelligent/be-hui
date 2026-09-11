/**
 * ImpactContent.jsx — Feed-Karte für Herzensprojekte
 * IMPACT-CLICK-002 (2026-07-16) — BaseFeedCard-konformes Layout
 * PUNKT2-HERZENSPROJEKT-CTA (2026-09-08, Michael): Karte jetzt visuell
 * eigenständig (sanfter Grün-Tint + grüne Border via BaseFeedCard-cardStyle),
 * Badge zeigt IMMER "💚 Herzensprojekt" (Rank-Medaille zusätzlich) und unter
 * dem Fortschritt steht ein Voting-CTA, der direkt in den Impact-Bereich
 * ("hui:navigate:tab") führt — der Post wirkt so nicht mehr wie jeder andere.
 *
 * Identischer Aufbau wie WorkContent/ExperienceContent/TalentContent:
 * Header + Bild (via BaseFeedCard.FeedMedia) + Badge + Titel + Progress
 * Karte anklicken → ContentPreviewSheet → "Zum Herzensprojekt" → Impact-Tab
 */
import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { formatNumberDE } from "../../lib/formatters.js";

const GREEN      = "rgba(34,197,94,1)";
const GREEN_SOFT = "rgba(34,197,94,0.10)";
const INK        = "#1A1A2E";
const INK_SUB    = "#55556B";

// IMPACT-IMG-001: Stabiler Unsplash-Fallback für Projekte ohne eigenes Bild.
// Als Modul-Konstante → wird einmal evaluiert, nie neu erzeugt.
// IMPACT_FALLBACK removed — FeedMedia in BaseFeedCard handles image rendering now

const RANK_MEDAL = { 1:"🥇", 2:"🥈", 3:"🥉" };
const RANK_LABEL = { 1:"Top 1", 2:"Top 2", 3:"Top 3" };

function ProgressBar({ current, goal }) {
  const { t } = useTranslation();
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:11, color:INK_SUB }}>{t("impact.collected")}</span>
        <span style={{ fontSize:11, color:GREEN, fontWeight: 600 }}>
          {pct.toFixed(0)}% · €{formatNumberDE((current || 0))}
        </span>
      </div>
      <div style={{ height:5, borderRadius:3, background:"rgba(26,26,46,0.07)", overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:3,
          width:`${pct}%`,
          background:`linear-gradient(90deg, ${GREEN}, rgba(34,197,94,0.6))`,
          transition:"width 0.4s ease",
        }}/>
      </div>
    </div>
  );
}

export default function ImpactContent({ item, onProfile, onReaction, onShare }) {
  // HOOK-ORDER-FIX (2026-08-30, analog MomentContent.jsx 2026-08-08):
  // Alle Hooks MÜSSEN vor jedem early return stehen — sonst überspringt
  // React bei kurzzeitig leerem item (Feed-Virtualisierung) Hooks für
  // diesen Render → Hook-Reihenfolge weicht beim nächsten Render ab →
  // "Minified React error #310".
  const { t } = useTranslation();
  const { open } = useContentPreview();

  if (!item) return null;

  const raw   = item._raw || {};
  const title = item.title || raw.project_name || raw.name || "";
  const descRaw  = item.text  || raw.short_desc   || raw.problem || raw.description || "";
  // FIX: Normalizer setzt title=text.slice(0,60) → desc könnte identisch sein
  const desc  = (descRaw && title && (descRaw.trim() === title.trim() || descRaw.trim().startsWith(title.trim()))) ? null : descRaw;
  const rank  = raw.rank   || null;
  const goal  = raw.funding_goal       || 0;
  const curr  = raw.current_amount_eur || 0;
  const isCompleted = raw.is_completed === true || (goal > 0 && curr >= goal);

  // PUNKT2-HERZENSPROJEKT-CTA (2026-09-08): Badge zeigt IMMER die Kategorie
  // "Herzensprojekt" (erkennbar auf einen Blick); eine Top-Rank-Medaille wird
  // zusätzlich dahinter angehängt statt sie zu ersetzen.
  const badgeText = t("impact.herzensprojektCategory")
    + (rank && RANK_MEDAL[rank] ? ` · ${RANK_MEDAL[rank]} ${RANK_LABEL[rank]}` : "");

  const handleCardClick = () => open({
    ...item,
    canOpenFull: true,
    fullPath: null,
    _onOpenFull: () => {
      window.dispatchEvent(new CustomEvent("hui:navigate:tab", { detail: { tab: "impact" } }));
    },
  });

  // PUNKT2-HERZENSPROJEKT-CTA (2026-09-08): direkter Sprung in den
  // Impact-Bereich (gleicher SSOT-Event wie _onOpenFull oben) — stopPropagation,
  // damit nicht zusätzlich die Karten-Klick-Vorschau (ContentPreviewSheet) auf geht.
  const handleVoteCta = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("hui:navigate:tab", { detail: { tab: "impact" } }));
  };

  return (
    <BaseFeedCard
      item={item}
      onProfile={onProfile}
      onReaction={onReaction}
      onShare={onShare}
      onCardClick={handleCardClick}
      cardStyle={{
        // Sanfter Grün-Tint (Kategorie-Farbe Impact) statt purem Weiß —
        // Design-System: Farben der Kategorie GREEN aus dieser Datei, kein
        // neuer Farb-Token nötig.
        background: "linear-gradient(180deg, rgba(34,197,94,0.10) 0%, rgba(34,197,94,0.03) 38%, #FFFFFF 100%)",
        border: "1px solid rgba(34,197,94,0.30)",
      }}
    >
      {/* Badge — alleine auf einer Zeile */}
      <div style={{ marginBottom:6 }}>
        <span style={{
          fontSize:10.5, fontWeight: 600, color:GREEN,
          background:GREEN_SOFT,
          border:`1px solid rgba(34,197,94,0.22)`,
          borderRadius:99, padding:"3px 9px",
          letterSpacing:0.2, whiteSpace:"nowrap",
        }}>💚 {badgeText}</span>
      </div>

      {/* Titel — 2-3 Zeilen, nicht abgeschnitten */}
      {title && (
        <h3 style={{
          margin:"0 0 6px", fontSize:15, fontWeight: 600, color:INK,
          lineHeight:1.3, letterSpacing:"-0.02em",
          overflow:"hidden", display:"-webkit-box",
          WebkitLineClamp:3, WebkitBoxOrient:"vertical",
        }}>{title}</h3>
      )}

      {/* Wunsch-Betrag erreicht (nur bei abgeschlossenen Projekten) */}
      {isCompleted && goal > 0 && (
        <p style={{
          margin:"0 0 8px", fontSize:12, fontWeight:400,
          color:INK_SUB, lineHeight:1.4,
        }}>
          {t("impact.wishAmountReached", { amount: formatNumberDE(goal) })}
        </p>
      )}

      {/* Fortschrittsbalken (nur bei nicht-abgeschlossenen Projekten) */}
      {!isCompleted && goal > 0 && <ProgressBar current={curr} goal={goal} />}

      {/* PUNKT2-HERZENSPROJEKT-CTA (2026-09-08): Voting-Hinweis + CTA in
          der Karte — führt direkt in den Impact-Bereich zum Abstimmen.
          Bei abgeschlossenen Projekten kein CTA (Abstimmung beendet). */}
      {!isCompleted && (
        <div
          onClick={handleVoteCta}
          style={{
            marginTop: 12, display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 12, cursor: "pointer",
            background: GREEN_SOFT, border: `1px solid rgba(34,197,94,0.22)`,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>🗳️</span>
          <span style={{ flex: 1, fontSize: 12, lineHeight: 1.35, color: INK_SUB }}>
            {t("feed.impactVoteHint")}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 600, color: GREEN, whiteSpace: "nowrap",
          }}>{t("feed.impactVoteCta")} ›</span>
        </div>
      )}
    </BaseFeedCard>
  );
}
