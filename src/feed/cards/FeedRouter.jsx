// src/feed/cards/FeedRouter.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — Feed Router
// Phase 4 canonical: entityType ist der primaere Entscheider.
//
// Routing-Logik:
//   story / feed_post / beitrag → MomentCard
//   experience / erlebnis  → ExperienceCard
//   work / werk            → WorkCard
//   invitation / einladung → InvitationCard
//   (default)              → MomentCard (graceful fallback)
//
// Rhythm-Spacing:
//   MomentCard   → margin-bottom 10px (kompakt)
//   ExperienceCard → 14px (dominant)
//   WorkCard     → 12px (medium)
//   InvitationCard → 12px (conversational)
// ═══════════════════════════════════════════════════════════════

import React, { Suspense, lazy } from "react";
import { getRhythmMargin, getEnergyLabel } from "../feedRhythmEngine.js";
import { getFeedRouteType } from "../../entities/entityTypes.js";

const MomentCard     = lazy(() => import("./MomentCard.jsx"));
const ExperienceCard = lazy(() => import("./ExperienceCard.jsx"));
const WorkCard       = lazy(() => import("./WorkCard.jsx"));
const InvitationCard = lazy(() => import("../../content/invitation/InvitationCard.jsx"));

/* ── Type Resolver ────────────────────────────────────────────── */
function resolveType(item) {
  if (item?.entityType) return getFeedRouteType(item.entityType);

  // Legacy-Fallback: content_type/type bleiben nur fuer transitional Items.
  const ct = (
    item?.content_type ||
    item?.type         ||
    item?._raw?.type   ||
    item?._raw?.content_type ||
    ""
  ).toLowerCase();

  if (ct === "moment" || ct === "note" || ct === "story" ||
      ct === "post"   || ct === "thought" || ct === "beitrag") {
    return "moment";
  }
  if (ct === "experience" || ct === "erlebnis" || ct === "event" ||
      ct === "workshop"   || ct === "session"  || ct === "retreat") {
    return "experience";
  }
  if (ct === "work" || ct === "werk" || ct === "work_upload" ||
      ct === "kunstwerk" || ct === "design" || ct === "handwerk") {
    return "work";
  }
  if (ct === "invitation" || ct === "einladung") {
    return "invitation";
  }
  // Legacy rhythm-state fallback (für Items ohne content_type)
  const state = item?.rhythmState || item?.state || "";
  if (state === "experience") return "experience";
  if (state === "note")       return "moment";
  if (state === "hero")       return "moment";
  if (state === "resonance")  return "moment";

  return "moment"; // graceful default
}

/* ── Spacing: _rhythm.marginBottom (von rhythmizeFeed) oder Fallback ── */
const FALLBACK_MARGIN = {
  moment:     10,
  experience: 16,
  work:       12,
  invitation: 12,
};

/* ── Fallback ────────────────────────────────────────────────── */
function CardSkeleton({ type }) {
  const heights = { moment:80, experience:280, work:220, invitation:100 };
  return (
    <div style={{
      margin:       `0 ${type === "experience" ? 12 : 14}px`,
      height:       heights[type] || 80,
      borderRadius: type === "experience" ? 22 : 18,
      background:   "rgba(0,0,0,0.04)",
    }}/>
  );
}

/* ── Main Router ─────────────────────────────────────────────── */
export default function FeedRouter({ item, onProfile, onReaction, onBook, onDetail, itemReactions = {} }) {
  if (!item) return null;

  // Phase 4D: Ghost-Items sind unsichtbare Atemräume — nur Spacing, kein Inhalt
  if (item._isGhost) {
    return <div style={{ height: getRhythmMargin(item) || 8, display:"block" }} />;
  }

  const type  = resolveType(item);
  // Phase 4D: Spacing von Rhythm Engine — sonst Typ-Fallback
  const mbPx  = getRhythmMargin(item) || FALLBACK_MARGIN[type] || 12;

  const sharedProps = {
    item,
    onProfile,
    onReaction,
    itemReactions,
  };

  // Dev-only: Energy Badge
  const energyBadge = process.env.NODE_ENV !== "production"
    ? getEnergyLabel(item)
    : null;

  return (
    <div style={{ marginBottom: mbPx, position:"relative" }}>
      {energyBadge && (
        <div style={{
          position:"absolute", top:8, right:20, zIndex:9999,
          padding:"2px 7px", borderRadius:50,
          background:`${energyBadge.color}22`,
          border:`1px solid ${energyBadge.color}55`,
          fontSize:9, fontWeight:700,
          color: energyBadge.color,
          pointerEvents:"none", userSelect:"none",
          fontFamily:"monospace", letterSpacing:"0.04em",
        }}>
          {energyBadge.label} · mb:{mbPx}
        </div>
      )}
      <Suspense fallback={<CardSkeleton type={type} />}>
        {type === "experience" ? (
          <ExperienceCard {...sharedProps} onBook={onBook} />
        ) : type === "work" ? (
          <WorkCard {...sharedProps} onDetail={onDetail} />
        ) : type === "invitation" ? (
          <InvitationCard {...sharedProps} />
        ) : (
          <MomentCard {...sharedProps} />
        )}
      </Suspense>
    </div>
  );
}

/* ── Export resolveType für Tests / Feed-Curator ──────────────── */
export { resolveType };
