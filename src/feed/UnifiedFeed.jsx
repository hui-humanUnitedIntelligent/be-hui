// src/feed/UnifiedFeed.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — UNIFIED FEED  (Phase 2A: Safe Reintegration)
//
// Vereint Stories + Events + Cards in einer stabilen Struktur.
// Jede Sektion ist isoliert — Crash einer Sektion = kein Global-Crash.
//
// CSS KEYFRAMES werden nur einmal injiziert.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import FeedRouter              from "./cards/FeedRouter.jsx";
import { CardSkeleton }        from "./cards/BaseFeedCard.jsx";
import { useFeedStream }       from "./useFeedStream.js";
import { FeedSoftHydrationBadge } from "./FeedSoftHydrationBadge.jsx";
import { toFeedItem }          from "../system/feed/unifiedNormalizer.js";
import FeedEventsSection       from "./FeedEventsSection.jsx";
import { FeedBottomSentinel, FeedLoadMoreSpinner } from "./FeedScrollSentinel.jsx";
import { useSingleReaction }   from "../lib/useReactions.jsx";
import { useAuth }             from "../lib/AuthContext.jsx";
import { analyticsService }    from "../services/creatorEconomy.js";
import { emit }                from "../lib/events/index.js";
import { toast }               from "../lib/useToast.jsx";


/* ═══════════════════════════════════════════════════════════════
   FeedWelcomeHeader — Kapitel 2, Sprint 2.1
   Begrüßung · HUI-Missionszeile · "Heute auf HUI"-Stats
   Einzige Stelle für Feed-Header-Logik.
   ═══════════════════════════════════════════════════════════════ */

// ── Tageszeit-Begrüßung ─────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)  return "Guten Morgen";
  if (h >= 12 && h < 17) return "Guten Tag";
  if (h >= 17 && h < 22) return "Guten Abend";
  return "Hallo";
}

// ── "Heute auf HUI" — Live-Stats ────────────────────────────────
function useHeuteStats() {
  const [stats, setStats] = React.useState({ works: 0, experiences: 0, members: 0, liveText: "" });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { supabase } = await import("../lib/supabaseClient.js");
        const today = new Date();
        today.setHours(0,0,0,0);
        const iso = today.toISOString();

        const [worksRes, expRes, membersRes, recentMember] = await Promise.all([
          supabase.from("works").select("id", { count: "exact", head: true })
            .gte("created_at", iso),
          supabase.from("experiences").select("id", { count: "exact", head: true })
            .gte("created_at", iso),
          supabase.from("profiles").select("id", { count: "exact", head: true })
            .gte("created_at", iso),
          supabase.from("profiles")
            .select("display_name, username, city")
            .order("created_at", { ascending: false })
            .limit(1)
            .single(),
        ]);

        if (cancelled) return;
        const name = recentMember.data?.display_name || recentMember.data?.username || null;
        const city = recentMember.data?.city || null;
        const liveText = name
          ? `${name}${city ? ` aus ${city}` : ""} ist HUI beigetreten`
          : "Neue Mitglieder entdecken die Plattform";

        setStats({
          works:       worksRes.count  ?? 0,
          experiences: expRes.count    ?? 0,
          members:     membersRes.count ?? 0,
          liveText,
        });
      } catch { /* silent — Platzhalter bleiben */ }
    })();
    return () => { cancelled = true; };
  }, []);

  return stats;
}

// ── FeedWelcomeHeader ────────────────────────────────────────────
function FeedWelcomeHeader({ currentUser }) {
  const greeting = getGreeting();
  const firstName = currentUser?.display_name?.split(" ")[0]
    || currentUser?.username
    || null;
  const stats = useHeuteStats();

  // Design-Tokens (aus HUI-Design-System)
  const TEAL   = "#0DC4B5";
  const CORAL  = "#F47355";
  const CREAM  = "#FAF7F2";
  const INK    = "#141422";
  const MUTED  = "rgba(20,20,34,0.50)";
  const BORDER = "rgba(13,196,181,0.12)";

  return (
    <div style={{
      background: CREAM,
      paddingTop: 20,
      paddingBottom: 4,
    }}>

      {/* ── Begrüßung ───────────────────────────────────────────── */}
      <div style={{ paddingLeft: 20, paddingRight: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
          {/* Sonne / Mond Icon */}
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "linear-gradient(135deg, #FFF3CC 0%, #FFE08A 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0, marginTop: 3,
            boxShadow: "0 2px 8px rgba(255,200,50,0.25)",
          }}>
            {(() => { const h = new Date().getHours(); return h >= 5 && h < 20 ? "☀️" : "🌙"; })()}
          </div>

          <div>
            <h1 style={{
              margin: 0, padding: 0,
              fontSize: 26, fontWeight: 800,
              color: INK, letterSpacing: -0.8,
              lineHeight: 1.15,
            }}>
              {greeting}{firstName ? (
                <>, <span style={{ color: TEAL }}>{firstName}.</span></>
              ) : "."}
            </h1>

            <p style={{
              margin: "6px 0 0", padding: 0,
              fontSize: 14, lineHeight: 1.55,
              color: MUTED, fontWeight: 400,
            }}>
              Entdecke heute{" "}
              <span style={{ color: TEAL, fontWeight: 600 }}>Menschen</span>,{" "}
              <span style={{ color: TEAL, fontWeight: 600 }}>Ideen</span>{" "}
              und{" "}
              <span style={{ color: CORAL, fontWeight: 600 }}>Erlebnisse</span>,
              <br />die dich inspirieren.
            </p>
          </div>
        </div>
      </div>

      {/* ── "Heute auf HUI" ────────────────────────────────────── */}
      <div style={{
        marginLeft: 16, marginRight: 16, marginBottom: 20,
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 18,
        border: `1px solid ${BORDER}`,
        boxShadow: "0 2px 16px rgba(13,196,181,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>
        {/* Karten-Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px 12px",
          borderBottom: "1px solid rgba(13,196,181,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 7,
              background: `linear-gradient(135deg, ${TEAL}22, ${TEAL}10)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11,
            }}>📈</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: INK, letterSpacing: -0.2 }}>
              Heute auf HUI
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#22C55E",
              boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
              animation: "huiPulseGreen 2s ease-in-out infinite",
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#22C55E", letterSpacing: 0.2 }}>
              Live
            </span>
          </div>
        </div>

        {/* Stats-Zeile */}
        <div style={{
          display: "flex", alignItems: "stretch",
          padding: "16px 16px 14px",
          gap: 0,
        }}>
          {[
            { icon: "🌿", color: TEAL,  bg: `${TEAL}14`,  count: stats.works,       label: "neue Werke"      },
            { icon: "🗓️", color: CORAL, bg: `${CORAL}12`, count: stats.experiences, label: "neue Erlebnisse" },
            { icon: "👥", color: TEAL,  bg: `${TEAL}14`,  count: stats.members,     label: "neue Begegnungen"},
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, display: "flex", alignItems: "center", gap: 9,
              paddingLeft: i > 0 ? 12 : 0,
              borderLeft: i > 0 ? "1px solid rgba(13,196,181,0.10)" : "none",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                background: s.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15,
              }}>
                {s.icon}
              </div>
              <div>
                <div style={{
                  fontSize: 22, fontWeight: 800, color: INK,
                  lineHeight: 1.1, letterSpacing: -0.8,
                }}>
                  {s.count}
                </div>
                <div style={{ fontSize: 10.5, color: MUTED, fontWeight: 500, marginTop: 1 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gerade passiert */}
        <div style={{
          margin: "0 12px 12px",
          background: "rgba(13,196,181,0.05)",
          borderRadius: 12,
          padding: "9px 12px",
          display: "flex", alignItems: "center", gap: 8,
          border: "1px solid rgba(13,196,181,0.09)",
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: "#22C55E",
          }} />
          <span style={{ fontSize: 12, color: MUTED, fontWeight: 600, flexShrink: 0 }}>
            Gerade passiert:
          </span>
          <span style={{
            fontSize: 12, color: "rgba(20,20,34,0.65)", fontWeight: 400,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {stats.liveText || "Neue Inhalte werden geladen…"}
          </span>
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */

/* ── CSS: fade-in + scroll-feel ───────────────────────────────── */
const FEED_CSS = `
@keyframes huiPulseGreen {
  0%,100% { opacity: 1; }
  50%     { opacity: 0.35; }
}
@keyframes huiFeedCardIn {
  from { opacity:0; transform:translateY(12px); }
  to   { opacity:1; transform:translateY(0);    }
}
.hui-feed-card {
  animation: huiFeedCardIn 0.32s ease both;
  -webkit-tap-highlight-color: transparent;
}
`;

let _feedCSSInjected = false;
function injectFeedCSS() {
  if (_feedCSSInjected || typeof document === "undefined") return;
  _feedCSSInjected = true;
  const s = document.createElement("style");
  s.textContent = FEED_CSS;
  document.head.appendChild(s);
}

/* ── Error Boundary for sections ──────────────────────────────── */
class SectionBoundary extends React.Component {
  constructor(p) { super(p); this.state = { crashed: false }; }
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(err) {
    console.error("[HUI_SECTION_CRASH]", this.props.name, err?.message);
  }
  render() {
    if (this.state.crashed) return null; // Fail silently — don't collapse feed
    return this.props.children;
  }
}

/* ── Rhythm Light ─────────────────────────────────────────────── */
// Every 4th card is "relaxed" (340px media instead of 280px)
// Alternating compact/relaxed spacing
// No variable width, no repositioning
function getCardRhythm(idx) {
  const isRelaxed  = (idx % 4 === 3);   // every 4th card
  const mbVariant  = (idx % 2 === 0) ? 14 : 18; // alternating 14/18px gap
  return { isRelaxed, mb: mbVariant };
}

/* ── Empty State ──────────────────────────────────────────────── */
function EmptyFeed() {
  return (
    <div style={{
      padding: "48px 24px", textAlign: "center",
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 12,
    }}>
      <div style={{ fontSize: 36 }}>🌱</div>
      <div style={{
        fontSize: 15, fontWeight: 600, color: "#1A1A2E",
        letterSpacing: -0.2,
      }}>
        Dein Feed erwacht gleich
      </div>
      <div style={{
        fontSize: 13, color: "rgba(26,26,46,0.45)",
        maxWidth: 220, lineHeight: 1.55,
      }}>
        Folge Menschen und teile Momente — dann lebt dieser Raum.
      </div>
    </div>
  );
}

/* ── Feed List ────────────────────────────────────────────────── */

// ── Per-item reaction wrapper — wires FeedRouter to reaction DB ─
// HARDENED: never returns null for a valid item
// Any crash inside is caught by ReactionErrorBoundary
class ReactionErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { crashed: false }; }
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(err, info) {
    console.error("[REACTION_CARD_CRASH]", this.props.itemId, err?.message, info?.componentStack?.slice(0,200));
  }
  render() {
    if (this.state.crashed) {
      // Fallback: render the FeedRouter directly without reaction logic
      const { item, onProfile, onBook, onShare } = this.props;
      return (
        <FeedRouter
          item={item}
          onProfile={onProfile}
          onBook={onBook}
          onDetail={onDetail}
          onShare={onShare}
        />
      );
    }
    return this.props.children;
  }
}

function ReactionCardInner({ item, onProfile, onBook, onDetail, onShare, itemIndex, onDepth }) {
  // Guard: item must be valid before calling any hook
  const postId   = item?.id    || "";
  const postType = item?.type  || "post";
  const authorId = item?.author?.id || null;

  // FEED.9B — Lazy-Loading: nur laden wenn Karte sichtbar
  const cardRef    = useRef(null);
  const [visible, setVisible] = useState(false);

  // FEED.12B — Impression Tracking
  const { user } = useAuth();
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    if (trackedRef.current) return;
    const creatorId = item?.author?.id;
    const type = item?.type;
    if (!creatorId) return;
    if (type !== "work" && type !== "experience") return;
    trackedRef.current = true;
    analyticsService.track({
      creatorId,
      eventType:  type === "experience" ? "experience_view" : "work_view",
      sourceType: "feed",
      sourceId:   item.id,
      viewerId:   user?.id || null,
    });
  }, [visible, item?.id, item?.type, item?.author?.id, user?.id]); // eslint-disable-line

  // FEED.12C — Scroll Depth Signal (kein neuer Observer)
  useEffect(() => {
    if (!visible) return;
    if (typeof itemIndex !== "number") return;
    onDepth?.(itemIndex);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = cardRef.current;
    if (!el || visible) return; // already visible — no new observer needed
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect(); // once=true: nie wieder beobachten
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  // Hook-Gating: kein RPC / kein SELECT solange nicht sichtbar
  const { toggle, myTypes } = useSingleReaction(
    visible ? postId : null,
    postType,
    authorId
  );

  const handleReaction = useCallback((type) => {
    if (!toggle) return;
    toggle(type);
    const labels       = { like:"Gefällt dir ✦", inspire:"Inspiriert dich ✨", save:"Gespeichert 🔖" };
    const removeLabels = { like:"Gefällt dir nicht mehr", inspire:"Inspiration entfernt", save:"Entfernt" };
    const wasActive    = myTypes?.has?.(type);
    toast.info(wasActive ? (removeLabels[type] || type) : (labels[type] || type), { duration: 1800 });
  }, [toggle, myTypes]);

  // Merge live reaction state into item
  const enriched = {
    ...item,
    _reactions: {
      ...(item._reactions || {}),
      touched:  myTypes?.has?.("like")    ?? false,
      inspired: myTypes?.has?.("inspire") ?? false,
      saved:    myTypes?.has?.("save")    ?? false,
    },
  };

  return (
    <div ref={cardRef}>
      <FeedRouter
        item={enriched}
        onProfile={onProfile}
        onReaction={handleReaction}
        onBook={onBook}
        onDetail={onDetail}
        onShare={onShare}
      />
    </div>
  );
}

function ReactionCard({ item, onProfile, onBook, onDetail, onShare, itemIndex, onDepth }) {
  // Absolute guard — no item = no render, log it
  if (!item?.id) {
    if (import.meta.env.DEV) console.warn("[REACTION_CARD] invalid item — skipping", item);
    return null;
  }
  return (
    <ReactionErrorBoundary item={item} itemId={item.id} onProfile={onProfile} onBook={onBook} onShare={onShare}>
      <ReactionCardInner
        item={item}
        onProfile={onProfile}
        onBook={onBook}
        onDetail={onDetail}
        onShare={onShare}
        itemIndex={itemIndex}
        onDepth={onDepth}
      />
    </ReactionErrorBoundary>
  );
}

function FeedList({ items, onProfile, onReaction, onBook, onDetail, onShare, loadMore, hasMore, loadingMore, onDiscover, scrollContainerRef = null }) {
  // VIRT-001 — Virtualisierter Feed mit @tanstack/react-virtual
  // Rendert nur Karten die im Viewport (+ 400px Margin) sichtbar sind.
  // Memory-Cleanup: Karten außerhalb DOM werden unmounted (overscan=3).

  const arr = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const valid = items.filter(i => i && typeof i === "object" && i.id);
    return Array.from(
      new Map(valid.map(i => [String(i.id), i])).values()
    );
  }, [items]);

  const [reactions, setReactions] = useState({});

  // FEED.12C — Scroll Depth Analytics
  const { user: depthUser } = useAuth();
  const depthRef   = useRef(0);
  const sentRef    = useRef(new Set());
  const endSentRef = useRef(false);
  const DEPTH_THRESHOLDS = [5, 10, 20];

  const onDepth = useCallback((zeroBasedIdx) => {
    if (!depthUser?.id) return;
    const reached = zeroBasedIdx + 1;
    if (reached <= depthRef.current) return;
    depthRef.current = reached;
    for (const threshold of DEPTH_THRESHOLDS) {
      if (reached >= threshold && !sentRef.current.has(threshold)) {
        sentRef.current.add(threshold);
        emit(`feed_depth_${threshold}`, {
          actorId:    depthUser.id,
          targetType: "feed",
          metadata:   { depth_reached: reached, threshold },
        });
      }
    }
  }, [depthUser?.id]); // eslint-disable-line

  useEffect(() => {
    if (!hasMore && arr.length > 0 && !endSentRef.current && depthUser?.id) {
      endSentRef.current = true;
      emit("feed_end_reached", {
        actorId:    depthUser.id,
        targetType: "feed",
        metadata:   { total_items: arr.length },
      });
    }
  }, [hasMore, arr.length, depthUser?.id]); // eslint-disable-line

  // VIRT-001 REV3: Stabiles normales Rendering — alle Items immer gerendert.
  // Kein contentVisibility-Hack, kein position:absolute. Einfach, korrekt, schnell.
  // Bei 200 Items Cap (useFeedStream) ist kein weiteres Virtualisierung nötig.

  if (arr.length === 0) return <EmptyFeed />;

  return (
    <div style={{ paddingTop: 8, paddingBottom: 8 }}>
      {arr.map((item, idx) => {
        const { isRelaxed, mb } = getCardRhythm(idx);
        const itemReactions = reactions[String(item.id)] || {};
        return (
          <div
            key={String(item.id)}
            className="hui-feed-card"
            style={{
              marginBottom: mb,
              animationDelay: Math.min(idx * 40, 300) + "ms",
            }}
          >
            <ReactionCard
              item={{ ...item, _reactions: { ...itemReactions, _relaxed: isRelaxed } }}
              onProfile={onProfile}
              onBook={onBook}
              onDetail={onDetail}
              onShare={() => onShare?.(item)}
              itemIndex={idx}
              onDepth={onDepth}
            />
          </div>
        );
      })}

      {/* Feed-Ende State (wenn kein hasMore mehr) */}
      {!hasMore && arr.length > 0 && (
        <div style={{
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          textAlign:     "center",
          padding:       "32px 24px 48px",
          gap:           12,
        }}>
          <div style={{ fontSize: 18, color: "rgba(13,196,181,0.55)", marginBottom: 4, letterSpacing: 2 }}>✦</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(26,53,48,0.70)", letterSpacing: -0.2 }}>
            Das war dein aktueller Feed
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(26,53,48,0.40)", fontWeight: 400, lineHeight: 1.5, maxWidth: 220 }}>
            Schau später wieder rein — neue Werke, Erlebnisse und Momente warten auf dich.
          </div>
          {onDiscover && (
            <button
              onClick={onDiscover}
              style={{
                marginTop:   8,
                padding:     "9px 20px",
                borderRadius: 20,
                border:      "1.5px solid rgba(13,196,181,0.35)",
                background:  "transparent",
                color:       "rgba(13,196,181,0.85)",
                fontSize:    13,
                fontWeight:  600,
                cursor:      "pointer",
                letterSpacing: -0.1,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Neue Talente entdecken →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── LazyCard — only renders when near viewport ──────────────── */
const LazyCard = React.memo(function LazyCard({ raw, ...handlers }) {
  const [visible, setVisible] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") {
      setVisible(true); return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { rootMargin: "200px" }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : 280 }}>
      {visible
        ? <FeedRouter item={raw} {...handlers} />
        : <CardSkeleton />}
    </div>
  );
});

/* ── Main UnifiedFeed ─────────────────────────────────────────── */
export default function UnifiedFeed({
  // Items prop (optional — wenn nicht übergeben, eigener useFeedStream)
  items: itemsProp = null,
  // Section visibility
  showEvents   = true,
  // Handlers
  onProfile    = null,
  onBook       = null,
  onDetail     = null,
  onShare      = null,
  onEventPress = null,
  onMoreEvents = null,
  // Refresh binding — parent can register for feed refresh fn
  onRefreshBind = null,
  // Navigation
  onDiscover   = null,
  // User context
  currentUser  = null,
  // Scroll-Container-Ref (von Home.jsx übergeben) — für Virtualisierung
  scrollContainerRef = null,
}) {
  useEffect(() => {
    injectFeedCSS();
  }, []); // eslint-disable-line

  // ── OWN FEED STREAM — läuft immer, liefert Items aus DB ──────────
  const {
    items: streamItems,
    loading: streamLoading,
    refresh: streamRefresh,
    loadMore,
    hasMore,
    loadingMore,
    pendingCount,
    flushPendingItems,
  } = useFeedStream();

  // ── Bind refresh fn to parent (defensive) ──────────────────────────
  React.useEffect(() => {
    if (typeof onRefreshBind === "function" && typeof streamRefresh === "function") {
      onRefreshBind(streamRefresh);
    }
  }, [onRefreshBind, streamRefresh]);

  // ── ITEM RESOLUTION ───────────────────────────────────────────────
  // Bevorzuge prop (für Tests / externe Steuerung),
  // fallback auf eigenen Stream
  const resolvedItems = useMemo(() => {
    const src = (itemsProp && itemsProp.length > 0) ? itemsProp : (streamItems || []);

    // Hardened normalization: item mit id → NIEMALS null
    const normalized = src.map(raw => {
      if (!raw?.id) return null;
      // Schon normalisiert? (hat author-Objekt + createdAt)
      if (raw.author && typeof raw.author === "object" && raw.createdAt !== undefined) {
        return raw;
      }
      try {
        const n = toFeedItem(raw);
        // Sprint P0: paralleler "Human"-Pfad entfernt.
        // toFeedItem() ist die einzige Normalisierungsquelle.
        // Wenn toFeedItem null zurückgibt (z.B. raw ohne id), wird das Item gefiltert.
        return n;
      } catch (err) {
        // Sprint P0: Error Boundary — kein "Human"-Fallback.
        // Item mit Crash wird auf null gesetzt und vom Filter entfernt.
        if (import.meta.env.DEV) console.warn("[UNIFIED_NORM_ERR]", raw?.id, err?.message);
        return null;
      }
    });

    // Nur null-Items und Items ohne id rausfiltern — nie mehr
    const safe = normalized.filter(i => i?.id);


    return safe;
  }, [itemsProp, streamItems, streamLoading]);

  // Sections are directly imported — no lazy load needed

  return (
    <div style={{
      width: "100%",
      overflowX: "hidden",
      background: "#FAFAF8",
      minHeight: "100vh",
    }}>

      {/* ── FEED WELCOME HEADER — Kapitel 2 Sprint 2.1 ── */}
      <FeedWelcomeHeader currentUser={currentUser} />

      {/* Stories entfernt — HUI-Momente sind die Stories */}

      {/* ── EVENTS — below stories ── */}
      {showEvents && (
        <SectionBoundary name="events">
          <FeedEventsSection
            onEventPress={onEventPress}
            onMoreEvents={onMoreEvents}
          />
        </SectionBoundary>
      )}

      {/* ── MAIN FEED — vertical timeline, stable, always renders ── */}

      {/* FEED.3B FIX-1 — Soft Hydration Badge */}
      <FeedSoftHydrationBadge
        count={pendingCount}
        onFlush={flushPendingItems}
      />

      <SectionBoundary name="feedList">
        {/* Loading state — shimmer skeletons */}
        {streamLoading && resolvedItems.length === 0 && (
          <div>
            {Array.from({length:4}).map((_,i) => <CardSkeleton key={i} />)}
          </div>
        )}
        {/* DEAD CODE BELOW — kept for reference */}
        {false && streamLoading && resolvedItems.length === 0 && (
          <div style={{ padding: "32px 16px 0", display:"none" }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{
                marginBottom: 14, marginLeft: 12, marginRight: 12,
                borderRadius: 28, overflow: "hidden",
                background: "#fff",
                border: "1px solid rgba(26,26,46,0.06)",
                boxShadow: "0 2px 16px rgba(26,26,46,0.07)",
              }}>
                <div style={{ padding: "16px 16px 0", display: "flex", gap: 12 }}>
                  <div style={{ width:38, height:38, borderRadius:13, background:"rgba(22,215,197,0.10)" }}/>
                  <div>
                    <div style={{ width:100, height:12, borderRadius:6, background:"rgba(26,26,46,0.07)", marginBottom:6 }}/>
                    <div style={{ width:60,  height:9,  borderRadius:5, background:"rgba(26,26,46,0.05)" }}/>
                  </div>
                </div>
                <div style={{ padding:"12px 16px 20px" }}>
                  <div style={{ height:10, borderRadius:5, background:"rgba(26,26,46,0.06)", marginBottom:6 }}/>
                  <div style={{ height:10, borderRadius:5, background:"rgba(26,26,46,0.06)", width:"70%" }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feed list — only when not first-load */}
        {(!streamLoading || resolvedItems.length > 0) && (
          <FeedList
            items={resolvedItems}
            onProfile={onProfile}
            onBook={onBook}
            onDetail={onDetail}
            onShare={onShare}
            loadMore={loadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onDiscover={onDiscover}
            scrollContainerRef={scrollContainerRef}
          />
        )}
      </SectionBoundary>

    </div>
  );
}

// Named exports for selective use
export { FeedList };
