// src/feed/UnifiedFeed.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — UNIFIED FEED  (Phase 2A: Safe Reintegration)
//
// Vereint Stories + Events + Cards in einer stabilen Struktur.
// Jede Sektion ist isoliert — Crash einer Sektion = kein Global-Crash.
//
// CSS KEYFRAMES werden nur einmal injiziert.
// ═══════════════════════════════════════════════════════════════

import { NAV_CONTENT_SPACER_CSS } from "../components/home/navigation/navigationGeometry.js";
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
import { usePresenceMap }      from "../lib/usePresence.jsx";
import CommentsSheet            from "../components/shared/CommentsSheet.jsx";
import { countComments, getComments } from "../lib/commentsService.js";
import { prefetchComments } from "../lib/commentsPrefetchCache.js";
import { filterDiscoveryItems, hasActiveSearchFilter } from "../lib/searchFilter.js";

// TEMP PERF — no-op on mobile (window.__HUI_PERF__ not set)
import { PerfProfiler, usePerfMount, feedMark } from "../components/desktop/perf-instrument.js";


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

// ── "Heute auf HUI" — Live-Stats (HEUTE.4-001) ──────────────────
// 4 Kategorien: Werke, Talentangebote, Erlebnisse, Momente
// Realtime: sofort aktuell wenn neues Item erscheint
function useHeuteStats() {
  const [stats, setStats] = React.useState({
    works: 0, talents: 0, experiences: 0, moments: 0, liveText: "", isLive: false,
  });
  const channelRef = React.useRef(null);

  const loadStats = React.useCallback(async () => {
    try {
      const { supabase } = await import("../lib/supabaseClient.js");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const iso = today.toISOString();

      // Alle 4 Kategorien parallel laden — nur Zählung (head: true)
      const [worksRes, talentsRes, expRes, momentsRes, recentMember] = await Promise.all([
        supabase.from("works").select("id", { count: "exact", head: true })
          .gte("created_at", iso).eq("approval_status", "approved"),
        supabase.from("talents").select("id", { count: "exact", head: true })
          .gte("created_at", iso).eq("status", "approved"),
        supabase.from("experiences").select("id", { count: "exact", head: true })
          .gte("created_at", iso).eq("approval_status", "approved"),
        supabase.from("beitraege").select("id", { count: "exact", head: true })
          .gte("created_at", iso),
        supabase.from("profiles")
          .select("full_name, display_name, username, location_label")
          .order("created_at", { ascending: false })
          .limit(1).maybeSingle(),
      ]);

      const name = recentMember.data?.full_name || recentMember.data?.display_name || recentMember.data?.username || null;
      const city = recentMember.data?.location_label || null;
      const liveText = name
        ? `${name}${city ? ` aus ${city}` : ""} ist HUI beigetreten`
        : "Neue Inhalte erscheinen gerade";

      const w = worksRes.count   ?? 0;
      const t = talentsRes.count ?? 0;
      const e = expRes.count     ?? 0;
      const m = momentsRes.count ?? 0;

      setStats({
        works: w, talents: t, experiences: e, moments: m,
        liveText,
        isLive: true, // REGEL: alle 4 Bereiche sind immer live
      });
    } catch { /* silent — Platzhalter bleiben */ }
  }, []);

  // Initialer Load
  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Realtime: bei jedem neuen Eintrag in den 4 Tabellen neu laden
  React.useEffect(() => {
    let sub;
    (async () => {
      const { supabase } = await import("../lib/supabaseClient.js");
      if (channelRef.current) { supabase.removeChannel(channelRef.current); }

      sub = supabase
        .channel("heute_auf_hui_live_v1")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "works" },
          () => loadStats())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "talents" },
          () => loadStats())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "experiences" },
          () => loadStats())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "beitraege" },
          () => loadStats())
        .subscribe();

      channelRef.current = sub;
    })();

    return () => {
      (async () => {
        const { supabase } = await import("../lib/supabaseClient.js");
        if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
      })();
    };
  }, [loadStats]);

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
              fontSize: 26, fontWeight: 600,
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
              Dein Zuhause wo{" "}
              <span style={{ color: "#F5A623", fontWeight: 600 }}>Menschen</span>,{" "}
              <span style={{ color: TEAL, fontWeight: 600 }}>Ideen</span>{" "}
              und{" "}
              <span style={{ color: CORAL, fontWeight: 600 }}>Erlebnisse</span>{" "}
              dich inspirieren.
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
            <span style={{ fontSize: 14, fontWeight: 600, color: INK, letterSpacing: -0.2 }}>
              Heute auf HUI
            </span>
          </div>
        </div>

        {/* Stats: 2×2 Grid — HEUTE.4-002 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
          background: "rgba(26,53,48,0.06)",
          margin: "4px 0 0",
          borderRadius: "0 0 18px 18px",
          overflow: "hidden",
        }}>
          {[
            { icon: "🌿", bg: "rgba(22,215,197,0.10)",  count: stats.works,       label: "neue Werke"          },
            { icon: "⭐", bg: "rgba(255,190,30,0.13)",   count: stats.talents,     label: "neue Talentangebote" },
            { icon: "🗓️", bg: "rgba(100,149,255,0.12)",  count: stats.experiences, label: "neue Erlebnisse"     },
            { icon: "💬", bg: "rgba(190,160,255,0.13)",  count: stats.moments,     label: "neue Momente"        },
          ].map((s, i) => (
            <div key={i} style={{
              background: "rgba(255,253,251,0.97)",
              padding: "14px 14px 14px 12px",
              display: "flex", alignItems: "center", gap: 10,
              position: "relative",
            }}>
              {/* Icon-Kachel mit Live-Dot */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 13,
                  background: s.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 19,
                }}>
                  {s.icon}
                </div>
              </div>
              {/* Zahl + Label */}
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <span style={{
                  fontSize: 21, fontWeight: 600, color: INK,
                  lineHeight: 1, letterSpacing: -0.7,
                }}>
                  {s.count}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, color: MUTED, letterSpacing: -0.1, lineHeight: 1.3 }}>
                  {s.label}
                </span>
              </div>
            </div>
          ))}
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
// DISCOVER-IMG-UNIFORM-001 (2026-07-17): Einheitliche Bildhöhe für alle Karten
// isRelaxed immer false → alle Karten gleich T.mediaH (220px)
// Kein abwechselndes spacing mehr — sauberes, konsistentes Grid
function getCardRhythm(idx) {
  const isRelaxed  = false;              // UNIFORM: alle Karten gleiche Höhe
  const mbVariant  = 14;                 // einheitlicher Abstand
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

function ReactionCardInner({ item, onProfile, onBook, onDetail, onShare, itemIndex, onDepth, onOpenComments }) {
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
  const { toggle, myTypes, counts, trackShare } = useSingleReaction(
    visible ? postId : null,
    postType,
    authorId
  );

  // COMMENT-COUNT: Lade Kommentar-Anzahl lazy wenn Karte sichtbar
  const [commentCount, setCommentCount] = useState(item?._reactions?.commentCount ?? null);
  const ccLoadedRef = useRef(false);
  useEffect(() => {
    if (!visible || !postId || ccLoadedRef.current) return;
    ccLoadedRef.current = true;
    countComments(postId, postType).then(n => { setCommentCount(n); });
    // INSTANT-COMMENTS.1 (2026-08-07): Kommentare bereits jetzt im
    // Hintergrund vorladen, solange die Karte nur sichtbar ist -- lange
    // bevor der Nutzer auf das Sprechblasen-Icon tippt. Damit zeigt
    // CommentsSheet beim Öffnen sofort Inhalte, ohne "wird geladen".
    prefetchComments(postId, postType, user?.id, getComments);
  }, [visible, postId, postType, user?.id]); // eslint-disable-line

  // LIVE-COMMENT-COUNT.1 (2026-08-07): CommentsSheet ist ein separates
  // Geschwister-Element (einmalig in UnifiedFeed gemountet, siehe unten),
  // kein Kind dieser Karte -- ein neu geschriebener/geloeschter Kommentar
  // aenderte die Sprechblasen-Zahl auf der Karte bisher NICHT, weil
  // ccLoadedRef das erneute Laden blockierte und niemand die Karte davon
  // informierte. Fix: CommentsSheet feuert bei jeder erfolgreichen
  // Aenderung ein globales "hui:comments:changed"-Event mit {postId,
  // postType} -- diese Karte lauscht darauf und laedt bei Treffer den
  // echten Server-Wert frisch nach (kein Delta-Raten, keine Doppelzaehlung).
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

  const handleReaction = useCallback((type) => {
    // Sprechblase → CommentsSheet öffnen statt Reaction-Toggle
    if (type === "touch") {
      const mediaUrl  = item?._raw?.media_url || item?._raw?.image_url || item?._raw?.video_url || item?.media?.url || null;
      const mediaType = item?._raw?.type || item?.type || "beitrag";
      onOpenComments?.(postId, postType, authorId, mediaUrl, mediaType, item?._raw?.title || item?._raw?.caption || item?.title || null);
      return;
    }
    if (!toggle) return;
    toggle(type);
    const labels       = { like:"Gefällt dir ✦", inspire:"Inspiriert dich ✨", save:"Gespeichert 🔖" };
    const removeLabels = { like:"Gefällt dir nicht mehr", inspire:"Inspiration entfernt", save:"Entfernt" };
    const wasActive    = myTypes?.has?.(type);
    toast.info(wasActive ? (removeLabels[type] || type) : (labels[type] || type), { duration: 1800 });
  }, [toggle, myTypes, onOpenComments, postId, postType, authorId, item]);

  // Merge live reaction state into item
  // RESONANZ.1 (2026-07-16): inspireCount + touchCount aus Hook-State (counts),
  // nicht aus Feed-Snapshot — Feed-Items haben keine reaction_count-Spalten.
  const enriched = {
    ...item,
    _reactions: {
      ...(item._reactions || {}),
      touched:      myTypes?.has?.("like")    ?? false,
      inspired:     myTypes?.has?.("inspire") ?? false,
      saved:        myTypes?.has?.("save")    ?? false,
      inspireCount: counts?.inspire ?? (item._reactions?.inspireCount ?? null),
      touchCount:   counts?.like    ?? (item._reactions?.touchCount   ?? null),
      commentCount: commentCount    ?? (item._reactions?.commentCount  ?? null),
      saveCount:    counts?.save    ?? (item._reactions?.saveCount    ?? null),
      shareCount:   counts?.share   ?? (item._reactions?.shareCount   ?? null),
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
        onShare={() => { trackShare?.(); onShare?.(); }}
        onOpenComments={onOpenComments}
      />
    </div>
  );
}

function ReactionCard({ item, onProfile, onBook, onDetail, onShare, itemIndex, onDepth, onOpenComments }) {
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
        onOpenComments={onOpenComments}
      />
    </ReactionErrorBoundary>
  );
}

function FeedList({ items, onProfile, onReaction, onBook, onDetail, onShare, loadMore, hasMore, loadingMore, onDiscover, scrollContainerRef = null, onOpenComments }) {
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

  // Sprint 8 Phase 5 — Presence Read Cutover: user_presence via usePresenceMap
  const authorIds = useMemo(() => {
    const ids = new Set();
    for (const item of arr) {
      const uid = item?.author?.id || item?._raw?.user_id || item?._raw?.creator_id;
      if (uid) ids.add(uid);
    }
    return [...ids];
  }, [arr]);

  const presenceMap = usePresenceMap(authorIds);

  const resolvePresenceStatus = useCallback((item) => {
    const uid = item?.author?.id || item?._raw?.user_id || item?._raw?.creator_id;
    if (!uid) return null;
    return presenceMap[uid]?.status || "offline";
  }, [presenceMap]);

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

  // INFSCROLL-001 (2026-07-19): Infinite Scroll — kein Button mehr.
  // Initial 15 Items, +15 automatisch sobald letzter Post sichtbar.
  // Sentinel-div am Ende der Liste triggert IntersectionObserver → sofort nachladen.
  const INITIAL_COUNT  = 15;
  const LOAD_MORE_STEP = 15;
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const sentinelRef = useRef(null);

  // arr-Wechsel (Filter/Suche/Refresh) → visibleCount zurücksetzen
  const arrLenRef = useRef(arr.length);
  useEffect(() => {
    if (arr.length !== arrLenRef.current) {
      arrLenRef.current = arr.length;
      setVisibleCount(INITIAL_COUNT);
    }
  }, [arr.length]);

  const visibleItems = arr.slice(0, visibleCount);
  const allShown     = visibleCount >= arr.length && !hasMore;
  const canLoadMore  = visibleCount < arr.length || hasMore;

  // Intern: nächste 15 Items aufdecken + ggf. DB-Seite nachladen
  const handleLoadMore = useCallback(() => {
    const next = visibleCount + LOAD_MORE_STEP;
    setVisibleCount(next);
    if (next >= arr.length - 2 && hasMore && !loadingMore) {
      loadMore?.();
    }
  }, [visibleCount, arr.length, hasMore, loadingMore, loadMore]);

  // Sentinel-Observer: sobald letzter sichtbarer Card-Bereich viewport-nah → sofort nachladen
  useEffect(() => {
    if (!sentinelRef.current || !canLoadMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) handleLoadMore(); },
      { rootMargin: "200px" }
    );
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [canLoadMore, handleLoadMore]);

  if (arr.length === 0) return <EmptyFeed />;

  return (
    <div style={{ paddingTop: 8 }}>
      {visibleItems.map((item, idx) => {
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
              item={{
                ...item,
                _reactions: { ...itemReactions, _relaxed: isRelaxed },
                _presenceStatus: resolvePresenceStatus(item),
              }}
              onProfile={onProfile}
              onBook={onBook}
              onDetail={onDetail}
              onShare={() => onShare?.(item)}
              itemIndex={idx}
              onDepth={onDepth}
              onOpenComments={onOpenComments}
            />
          </div>
        );
      })}

      {/* ── INFSCROLL-001: Sentinel — unsichtbarer Trigger am Listen-Ende ──
           IntersectionObserver (rootMargin 200px) feuert bevor der Nutzer
           das Ende erreicht → nächste 15 Posts erscheinen sofort, kein Button. ── */}
      {canLoadMore && (
        <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />
      )}
      {loadingMore && (
        <div style={{
          display: "flex", justifyContent: "center",
          padding: "12px 0 4px",
          color: "rgba(13,196,181,0.5)",
          fontSize: 12, fontWeight: 500, letterSpacing: 0.2,
        }}>
          Weitere Beiträge werden geladen …
        </div>
      )}

      {/* Ende-Hinweis: alle Items geladen, keine weiteren in DB */}
      {allShown && arr.length > 0 && (
        <div style={{
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          textAlign:     "center",
          padding:       "24px 24px 16px",
          gap:           10,
        }}>
          <div style={{ fontSize: 16, color: "rgba(13,196,181,0.45)", letterSpacing: 2 }}>✦</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(26,53,48,0.55)", letterSpacing: -0.1 }}>
            Du hast das Ende erreicht
          </div>
          <div style={{ fontSize: 12, color: "rgba(26,53,48,0.35)", fontWeight: 400, lineHeight: 1.55, maxWidth: 240 }}>
            Warte, bis neue Talente ihr Können präsentieren.
          </div>
        </div>
      )}

      {/* ── Orb-Clearance-Spacer — IMMER als letztes Element.
           Verhindert, dass der Orb den letzten Karteninhalt überlagert.
           Wert: ORB_OVERHANG + TAB_H + safe-area + 24px Buffer ── */}
      <div style={{ height: NAV_CONTENT_SPACER_CSS }} aria-hidden="true" />
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
        ? <PerfProfiler id={`FeedCard:${raw.id}`}><FeedRouter item={raw} {...handlers} /></PerfProfiler>
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
  skipWelcome  = false,
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
  // Search-Filter (von Home.jsx searchState -> SearchCommandCenter). Das
  // Discovery-Panel (SearchCommandCenter) ist über die fixe Suchleiste
  // JEDERZEIT erreichbar, auch beim Scrollen -- deshalb sitzen Content-Typ/
  // Ort/Sortierung dort und nicht mehr als eigene, im Feed verschwindende
  // FeedFilterBar (2026-08-12, Michael-Auftrag "Filter immer verfügbar").
  searchActive   = false,
  searchQuery    = "",
  typeFilter     = null,     // null | "work" | "moment" | "experience" | "talent"
  categoryFilters = [],      // Array von { id, label, ... }
  kiMode         = null,     // null | "people" | "match" | "discover" (KI-Suggestions)
  locationQuery  = "",       // Freitext-Ort-Filter (Substring auf item.location)
  sort           = "newest", // "newest" | "oldest"
}) {
  usePerfMount('UnifiedFeed');
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

  // ── COMMENTS SHEET STATE ────────────────────────────────────────────
  const [commentsTarget, setCommentsTarget] = React.useState(null);
  // commentsTarget: { postId, postType, postAuthorId, mediaUrl, mediaType, postTitle }
  const openComments = React.useCallback((postId, postType, postAuthorId, mediaUrl, mediaType, postTitle = null) => {
    setCommentsTarget({ postId, postType, postAuthorId, mediaUrl, mediaType, postTitle });
  }, []);
  const closeComments = React.useCallback(() => setCommentsTarget(null), []);

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

  // ── SEARCH FILTER (2026-08-12) ────────────────────────────────────
  // BUGFIX: SearchCommandCenter schreibt query/typeFilter/categories in
  // searchState (HomeShell) → Home.jsx gibt sie hierher weiter. Bisher
  // wurden diese Props von UnifiedFeed GAR NICHT deklariert → still ignoriert.
  // Jetzt: clientseitige Filterung der bereits normalisierten Feed-Items.
  // typeFilter "profile" → nur Momente (Menschen-Posts), "work" → Werke,
  // "experience" → Erlebnisse. Text+Kategorie via filterDiscoveryItems.
  const searchFilteredItems = useMemo(() => {
    // KI-Modus: Kein normaler Text-Filter, sondern eine spezielle
    // Vorfilterung. Die KI-Suggestions ("Ich suche kreative Menschen" etc.)
    // setzen kiMode statt query/typeFilter. Hier steuern wir, was der Feed
    // in jedem Modus zeigt.
    if (kiMode && !searchQuery && !typeFilter) {
      let result = resolvedItems;
      switch (kiMode) {
        case "people":
          // Kreative Menschen: Zeige Momente (Menschen-Posts) und Werke
          // (kreative Outputs), aber keine Erlebnisse. Sortiert nach
          // Autoren-Vielfalt (verschiedene Autoren zuerst).
          result = result.filter(i => i.type === "moment" || i.type === "work");
          break;
        case "match":
          // Wer passt zu meinem Profil: breit, alle Typen, aber sortiert
          // nach Relevanz (Tag-Overlap mit currentUser-Interessen wäre
          // ideal — vorläufig: alle, Reihenfolge wie Feed).
          // Keine Filterung, nur kennzeichnen dass KI-Modus aktiv.
          break;
        case "discover":
          // Welche Menschen sollte ich kennen: Momente + Werke, sortiert
          // nach Autor (gleiche Autoren gebündelt, damit man verschiedene
          // Menschen entdeckt statt denselben Autor 5x).
          result = result.filter(i => i.type === "moment" || i.type === "work");
          // Nach Autor gruppieren: jeden Autor nur 1x in den ersten 10 Items
          const seenAuthors = new Set();
          const grouped = [];
          const overflow = [];
          for (const item of result) {
            const authorId = item.author?.id || item.author?.name || "";
            if (!seenAuthors.has(authorId)) {
              seenAuthors.add(authorId);
              grouped.push(item);
            } else {
              overflow.push(item);
            }
          }
          result = [...grouped, ...overflow];
          break;
      }
      return result;
    }

    if (!hasActiveSearchFilter({ query: searchQuery, categoryFilters }) && !typeFilter) {
      return resolvedItems;
    }
    let result = resolvedItems;
    // Type-Filter
    if (typeFilter) {
      const typeMap = { work: ["work"], moment: ["moment"], experience: ["experience"], talent: ["talent"] };
      const allowed = typeMap[typeFilter] || null;
      if (allowed) result = result.filter(i => allowed.includes(i.type));
    }
    // Text + Kategorie-Filter
    result = filterDiscoveryItems(result, { query: searchQuery, categoryFilters }, (item) => [
      item.title || "",
      item.text  || "",
      item.author?.name || "",
      item.author?.username || "",
      item.location || "",
      ...(item.tags || []),
      item._raw?.category || "",
    ]);
    return result;
  }, [resolvedItems, searchQuery, typeFilter, categoryFilters, kiMode]);

  // ── ORT + SORTIERUNG — zweite Filterstufe (2026-08-12) ────────────
  // Wendet Ort-Filter + Datum-Sortierung (aus dem Discovery-Panel in
  // SearchCommandCenter, ueber searchState/Props hierher durchgereicht)
  // AUF DIE BEREITS durch Suche/Typ/KI-Modus gefilterten Items an
  // (AND-Verknuepfung). Ersetzt die vormals eigenstaendige FeedFilterBar,
  // die im Feed sass und beim Scrollen verschwand -- jetzt ist die
  // Steuerung Teil des immer ueber die fixe Suchleiste erreichbaren Panels.
  const displayItems = useMemo(() => {
    let result = searchFilteredItems;
    const locQ = (locationQuery || "").trim().toLowerCase();
    if (locQ) {
      result = result.filter(i => (i.location || "").toLowerCase().includes(locQ));
    }
    if (sort === "oldest") {
      result = [...result].sort((a, b) => {
        const ta = new Date(a._raw?.created_at || a._raw?.createdAt || 0).getTime();
        const tb = new Date(b._raw?.created_at || b._raw?.createdAt || 0).getTime();
        return ta - tb;
      });
    }
    // "newest" = Standard-Feed-Reihenfolge (bereits neueste-zuerst vom Backend) -- kein Sort nötig.
    return result;
  }, [searchFilteredItems, locationQuery, sort]);

  // Sections are directly imported — no lazy load needed

  return (
    <PerfProfiler id="UnifiedFeed">
    <div style={{
      width: "100%",
      overflowX: "hidden",
      background: "#FAFAF8",
      minHeight: "100vh",
    }}>

      {/* ── FEED WELCOME HEADER — Kapitel 2 Sprint 2.1 ── */}
      {!skipWelcome && <FeedWelcomeHeader currentUser={currentUser} />}

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
        {streamLoading && displayItems.length === 0 && (
          <div>
            {Array.from({length:4}).map((_,i) => <CardSkeleton key={i} />)}
          </div>
        )}
        {/* DEAD CODE BELOW — kept for reference */}
        {false && streamLoading && displayItems.length === 0 && (
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
        {(!streamLoading || displayItems.length > 0) && (
          <FeedList
            items={displayItems}
            onProfile={onProfile}
            onBook={onBook}
            onDetail={onDetail}
            onShare={onShare}
            loadMore={loadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onDiscover={onDiscover}
            scrollContainerRef={scrollContainerRef}
            onOpenComments={openComments}
          />
        )}
      </SectionBoundary>

      {/* ── No-Results bei aktiver Suche ── */}
      {((searchActive && (searchQuery || typeFilter || (categoryFilters && categoryFilters.length > 0) || kiMode)) ||
        typeFilter || (locationQuery && locationQuery.trim())) &&
       !streamLoading && displayItems.length === 0 && (
        <div style={{ padding:"60px 24px", textAlign:"center", color:"rgba(26,53,48,0.38)" }}>
          <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>Keine Ergebnisse</div>
          <div style={{ fontSize:13 }}>
            {searchQuery
              ? <>Für „{searchQuery}" wurde nichts im Feed gefunden.</>
              : <>Keine Beiträge passen zu diesem Filter.</>
            }
          </div>
        </div>
      )}

      {/* ── COMMENTS SHEET ── */}
      <CommentsSheet
        open={!!commentsTarget}
        onClose={closeComments}
        postId={commentsTarget?.postId || ""}
        postType={commentsTarget?.postType || "beitrag"}
        postAuthorId={commentsTarget?.postAuthorId || ""}
        mediaUrl={commentsTarget?.mediaUrl}
        mediaType={commentsTarget?.mediaType}
        postTitle={commentsTarget?.postTitle}
      />
    </div>
    </PerfProfiler>
  );
}

// Named exports for selective use
export { FeedList };
