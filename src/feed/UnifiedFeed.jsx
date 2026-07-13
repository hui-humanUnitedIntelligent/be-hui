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
import { useSavedPostsContext } from "../context/SavedPostsContext.jsx";
import { useAuth }             from "../lib/AuthContext.jsx";
import { analyticsService }    from "../services/creatorEconomy.js";
import { emit }                from "../lib/events/index.js";
import { toast }               from "../lib/useToast.jsx";
import { useContentPreview } from "../context/ContentPreviewContext.jsx"; // OPEN.2 2026-07-08
import { normalizePostForPreview, normalizeProjectForPreview, normalizeWirkerForPreview } from "../lib/previewNormalizers.js";
import { HUIBookmarkIcon }     from "../design/icons/HuiInteractionIcons.jsx";


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

/* Search Experience 2.0 (2026-07-06, Lars) -- weicher Uebergang
   zwischen Normal-/Such-Zustand des Feeds, kein harter Layoutwechsel. */
@keyframes hui-search-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Suchtreffer-Zeilen (2026-07-07) -- EINE Touch-/Hover-Definition fuer
   alle sechs Suchtypen (SearchResultRow), statt je Typ eigenes Verhalten.
   Erste Zeile je Gruppe verliert den oberen Trennstrich (die Gruppen-
   Card selbst hat schon einen sauberen oberen Abschluss via Radius). */
.hui-search-row:active { background: rgba(26,53,48,0.035); }
.hui-search-group > .hui-search-row:first-child { border-top: none; }
@media (hover:hover) {
  .hui-search-row:hover { background: rgba(26,53,48,0.02); }
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

  // MERKEN.2A (2026-07-08): Snapshot der echten Anzeige-Daten fuer
  // saved_posts.post_data -- ohne das zeigt "Gemerkte Inhalte" nur
  // Platzhalter statt Titel/Bild/Ersteller. useMemo haelt die Objekt-
  // Referenz stabil (sonst Re-Trigger von useSingleReaction bei jedem Render).
  const postSnapshot = useMemo(() => ({
    cover_url:   Array.isArray(item?.media) ? (item.media[0] || null) : (item?.media || null),
    title:       item?.title || item?.text || null,
    author_name: item?.author?.name || item?.author?.displayName || null,
    user_id:     item?.author?.id || null,
  }), [item?.media, item?.title, item?.text, item?.author?.name, item?.author?.displayName, item?.author?.id]);

  // Hook-Gating: kein RPC / kein SELECT solange nicht sichtbar
  const { toggle, myTypes } = useSingleReaction(
    visible ? postId : null,
    postType,
    authorId,
    postSnapshot
  );
  // Zweck: "gemerkt"-Status appweit einheitlich aus saved_posts lesen
  // (nicht aus post_reactions). Warum: EIN geteilter Context-Zustand
  // (siehe SavedPostsContext.jsx) statt lokal pro Karte -- Feed, Suche,
  // Detailseite, Profil und Gemerkte Inhalte zeigen so garantiert denselben
  // Zustand, optimistisch und live.
  const { isSaved, toggleSave } = useSavedPostsContext();
  const { open: openPreview } = useContentPreview(); // OPEN.2 2026-07-08 -- Suche nutzt jetzt dieselbe Vorschau wie Feed/Discover/Profil
  const saved = isSaved(postId);

  const handleReaction = useCallback((type) => {
    if (type === "save") {
      // Merken laeuft ausschliesslich ueber den geteilten Context-Toggle --
      // schreibt saved_posts + post_reactions, optimistisch appweit sichtbar.
      toggleSave(postId, postType, postSnapshot);
      toast.info(saved ? "Aus Merkliste entfernt" : "Gespeichert", { duration: 1800 });
      return;
    }
    if (!toggle) return;
    toggle(type);
    const labels       = { like:"Gefällt dir ✦", inspire:"Inspiriert dich ✨" };
    const removeLabels = { like:"Gefällt dir nicht mehr", inspire:"Inspiration entfernt" };
    const wasActive    = myTypes?.has?.(type);
    toast.info(wasActive ? (removeLabels[type] || type) : (labels[type] || type), { duration: 1800 });
  }, [toggle, myTypes, toggleSave, postId, postType, postSnapshot, saved]);

  // Merge live reaction state into item
  const enriched = {
    ...item,
    _reactions: {
      ...(item._reactions || {}),
      touched:  myTypes?.has?.("touch")   ?? false,
      inspired: myTypes?.has?.("inspire") ?? false,
      saved,
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

function FeedList({ items, onProfile, onReaction, onBook, onDetail, onShare, loadMore, hasMore, loadingMore, onDiscover }) {
  // per-item reaction is handled in ReactionCard wrapper below
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
  const depthRef    = useRef(0);           // max sichtbarer 1-basierter Index
  const sentRef     = useRef(new Set());   // gesendete Schwellen {5,10,20}
  const endSentRef  = useRef(false);       // feed_end_reached gesendet?

  const DEPTH_THRESHOLDS = [5, 10, 20];

  const onDepth = useCallback((zeroBasedIdx) => {
    if (!depthUser?.id) return;
    const reached = zeroBasedIdx + 1; // 1-basiert
    if (reached <= depthRef.current) return; // schon gesehen
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

  // Feed-Ende: einmalig senden wenn !hasMore + Karten vorhanden
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

  if (arr.length === 0) return <EmptyFeed />;
  return (
    <div style={{ paddingTop: 8 }}>
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
      {/* ── Pagination: Sentinel + Spinner (solange hasMore) ── */}
      <FeedLoadMoreSpinner loading={!!loadingMore} />
      <FeedBottomSentinel
        enabled={!!hasMore && !loadingMore}
        onVisible={loadMore}
      />

      {/* ── FEED.11B — Feed-Ende State ── */}
      {!hasMore && arr.length > 0 && (
        <div style={{
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          textAlign:      "center",
          padding:        "32px 24px 48px",
          gap:            12,
        }}>
          {/* Dekoratives Symbol */}
          <div style={{
            fontSize:    18,
            color:       "rgba(13,196,181,0.55)",
            marginBottom: 4,
            letterSpacing: 2,
          }}>
            ✦
          </div>

          {/* Haupttext */}
          <div style={{
            fontSize:   14,
            fontWeight: 600,
            color:      "rgba(26,53,48,0.70)",
            letterSpacing: -0.2,
          }}>
            Das war dein aktueller Feed
          </div>

          {/* Subtext */}
          <div style={{
            fontSize:   12.5,
            color:      "rgba(26,53,48,0.40)",
            fontWeight: 400,
            maxWidth:   220,
            lineHeight: 1.5,
          }}>
            Neue Talente und Erlebnisse warten auf dich.
          </div>

          {/* Discovery CTA */}
          <button
            onClick={() => onDiscover?.()}
            style={{
              marginTop:    8,
              padding:      "10px 22px",
              borderRadius: 20,
              border:       "1.5px solid rgba(13,196,181,0.35)",
              background:   "rgba(13,196,181,0.06)",
              color:        "#0DC4B5",
              fontSize:     13,
              fontWeight:   600,
              cursor:       "pointer",
              letterSpacing: -0.1,
              touchAction:  "manipulation",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Neue Talente entdecken →
          </button>
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

/* ── Wirker-/Projekte-Suchtreffer (2026-07-06) ────────────────────
   "Home reagiert auf die globale Suche": fetchSearchResults() (useFeedStream)
   liefert neben den gewohnten Content-Items (Werk/Erlebnis/Beitrag/Event)
   jetzt zusaetzlich Wirker- und Impact-Projekt-Treffer. BaseFeedCard bleibt
   bewusst UNVERAENDERT (Architektur-Charta: keine Rewrites an stabilen,
   fein abgestimmten Komponenten) -- Menschen/Projekte sind keine "Beitraege
   eines Autors" und passen konzeptionell nicht in dessen Karten-Layout.
   Stattdessen: eigene, kompakte Ergebnis-Reihe, gleiche Tokens (TEAL/CORAL/
   Ink) wie der Rest von UnifiedFeed -- kein neues Design erfunden. */
const SXR = {
  teal:  "#0DC4B5",
  coral: "#F47355",
  ink:   "rgba(26,53,48,0.82)",
  ink2:  "rgba(26,53,48,0.50)",
  ink3:  "rgba(26,53,48,0.34)",
  border:"rgba(26,53,48,0.08)",
};

// Suchbegriff dezent hervorheben (2026-07-07, "intelligente Treffer") --
// EINE Komponente fuer alle sechs Suchtypen, respektiert das bestehende
// Farbsystem (Teal, bereits die Suchakzentfarbe in SXR) statt eine neue
// "Textmarker"-Farbe zu erfinden. Hebt nur den ERSTEN Treffer hervor (reicht
// fuer die Wiedererkennung, wirkt ruhiger als jedes Vorkommen zu markieren).
function HighlightText({ text, query }) {
  const str = text == null ? "" : String(text);
  const q = (query || "").trim();
  if (!q || !str) return <>{str}</>;
  const idx = str.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{str}</>;
  return (
    <>
      {str.slice(0, idx)}
      <span style={{
        background: "rgba(13,196,181,0.16)", color: SXR.teal,
        borderRadius: 4, padding: "0 2px", fontWeight: 800,
      }}>
        {str.slice(idx, idx + q.length)}
      </span>
      {str.slice(idx + q.length)}
    </>
  );
}

// EINE gemeinsame Trefferzeile fuer alle sechs Suchtypen (2026-07-07,
// "einheitliches Sucherlebnis"). Vorher: SearchPersonRow/SearchProjectRow
// (kompakte Karten in Horizontal-Scrollern) fuer Wirker/Projekte, dazu die
// volle ReactionCard/FeedRouter-Feedkarte (Bild+Reaktionsleiste+Autorzeile)
// fuer Werke/Erlebnisse/Veranstaltungen/Beitraege -- zwei komplett
// unterschiedliche Optiken UND zwei Layout-Richtungen (horizontal vs.
// vertikal) nebeneinander, was den "wirkt wie einzelne Bereiche"-Eindruck
// erzeugt hat. Jetzt: EINE Zeilen-Komponente, EINE Layout-Richtung
// (vertikal, wie eine durchgehende Trefferliste), parametrisiert nur ueber
// shape (circle=Person, square=alles andere) und optionalem Bild/Icon-
// Fallback. Reaktionen (Resonanz/Austauschen/Merken/Weitergeben) bleiben
// bewusst der Detailseite/dem normalen Feed vorbehalten -- eine Suchzeile
// dient dem schnellen Finden, nicht dem Interagieren; Antippen fuehrt
// weiterhin zur jeweils bestehenden Zielaktion (Profil/Projekt/Werk/
// Buchung/Event/Profil-des-Autors), keine neuen Navigationsziele erfunden.
function SearchResultRow({ shape = "square", image, fallbackIcon, tint, title, subtitle, query, onPress, saved, onToggleSave }) {
  const [imgErr, setImgErr] = useState(false);
  const showImg = image && !imgErr;
  return (
    <div
      onClick={onPress}
      className="hui-search-row"
      style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"10px 16px", background:"#fff",
        borderTop:`1px solid ${SXR.border}`,
        touchAction:"manipulation", WebkitTapHighlightColor:"transparent",
        cursor: onPress ? "pointer" : "default",
      }}
    >
      <div style={{
        width:44, height:44, borderRadius: shape === "circle" ? "50%" : 12,
        overflow:"hidden", flexShrink:0,
        background: showImg ? "transparent" : (tint || "rgba(13,196,181,0.10)"),
        border: shape === "circle" ? "1.5px solid rgba(13,196,181,0.25)" : `1px solid ${SXR.border}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize: shape === "circle" ? 17 : 18, fontWeight:700, color:SXR.teal,
      }}>
        {showImg
          ? <img loading="lazy" decoding="async" src={image} alt="" onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : (fallbackIcon || (title?.[0] || "H").toUpperCase())}
      </div>
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:SXR.ink, lineHeight:1.3,
          overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
          <HighlightText text={title} query={query} />
        </div>
        {subtitle && (
          <div style={{ fontSize:11.5, color:SXR.ink2, fontWeight:500, marginTop:1,
            overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
            <HighlightText text={subtitle} query={query} />
          </div>
        )}
      </div>
      {/* Merken-Icon nur fuer bookmarkbare Typen (Werke/Erlebnisse/
          Veranstaltungen/Beitraege) -- Wirker/Projekte bewusst ohne
          (bestehende Entscheidung, siehe MerkenSection-Kommentare). */}
      {onToggleSave && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
          aria-label={saved ? "Aus Merkliste entfernen" : "Merken"}
          style={{
            flexShrink:0, width:36, height:36, display:"flex",
            alignItems:"center", justifyContent:"center",
            background:"transparent", border:"none", cursor:"pointer",
            color: saved ? SXR.coral : SXR.ink2, touchAction:"manipulation",
          }}
        >
          <HUIBookmarkIcon size={19} active={saved} />
        </button>
      )}
    </div>
  );
}

// Dezente Gruppen-Ueberschrift -- EINE Stildefinition fuer alle sechs
// Suchergebnis-Gruppen (Lars-Vorgabe: "kleine, dezente Ueberschrift").
function SearchGroupHeader({ icon, label }) {
  return (
    <div style={{ fontSize:11.5, fontWeight:700, color:SXR.ink2, letterSpacing:"0.02em",
      textTransform:"uppercase", padding:"4px 16px 8px", display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ fontSize:13, textTransform:"none" }}>{icon}</span>
      {label}
    </div>
  );
}

// Eine Gruppen-"Card" -- rundet die ganze Gruppe als EIN visuelles Objekt
// ab (Radius+Schatten), die einzelnen SearchResultRow-Zeilen darin trennen
// sich nur durch einen 1px-Strich (siehe .hui-search-group CSS). Dieselbe
// Huelle fuer alle sechs Gruppen -- der einzige Unterschied ist der Inhalt.
function SearchGroupCard({ icon, label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <SearchGroupHeader icon={icon} label={label} />
      <div className="hui-search-group" style={{
        borderRadius: 18, overflow: "hidden", background: "#fff",
        border: `1px solid ${SXR.border}`,
        boxShadow: "0 1px 6px rgba(26,53,48,0.05)",
      }}>
        {children}
      </div>
    </div>
  );
}

/* ── Gruppierte, einheitliche Suchergebnisse (2026-07-07, "ein einziges
   zusammenhaengendes Sucherlebnis") ───────────────────────────────────
   Feste Reihenfolge Wirker → Projekte → Werke → Erlebnisse →
   Veranstaltungen → Beitraege (Lars-Vorgabe). Jede Gruppe ist bereits vom
   Hook relevanzsortiert (useFeedStream.fetchSearchResults) -- hier wird nur
   noch gerendert, keine zweite Sortierung/Sucharchitektur.
   ALLE SECHS Typen nutzen jetzt dieselbe SearchResultRow (siehe oben) statt
   vorher zwei verschiedener Optiken (kompakte Karten im Horizontal-Scroller
   fuer Wirker/Projekte vs. volle ReactionCard/FeedRouter-Feedkarte fuer
   Werke/Erlebnisse/Veranstaltungen/Beitraege) -- EIN Renderer, EINE
   Layout-Richtung (vertikale Liste), EIN Antipp-Verhalten (siehe unten),
   keine Sonderbehandlung mehr pro Typ ausser der Datenzuordnung selbst.
   Antippen fuehrt zu genau denselben Zielen wie im normalen Feed/Header
   (kein neues Navigationsziel erfunden): Werk→onDetail (bestehende
   /work/:id-Route), Erlebnis→onBook (bestehender Buchungs-Einstieg),
   Veranstaltung→onEventPress (bestehender Handler der Events-Reihe),
   Beitrag→onProfile des Autors (es gibt aktuell keine eigene Beitrags-
   Detailseite -- "wer hat das gepostet" ist der sinnvollste Fallback). */
function GroupedSearchResults({
  people, projects, groups, query,
  onProfile, onBook, onDetail, onShare, onProjectPress, onEventPress,
}) {
  const { works = [], experiences = [], events = [], moments = [] } = groups || {};
  const hasAny = people.length || projects.length || works.length || experiences.length || events.length || moments.length;
  if (!hasAny) return null;

  // Zweck: dieselbe saved_posts-Quelle wie Feed/Detail/Profil fuer die
  // Merken-Icons in der Suche -- kein zweiter Zustand, kein Re-Fetch.
  const { isSaved, toggleSave } = useSavedPostsContext();
  const bookmarkProps = (item, postType) => {
    const alreadySaved = isSaved(item.id);
    return {
      saved: alreadySaved,
      onToggleSave: () => {
        toggleSave(item.id, postType, {
          cover_url:   Array.isArray(item.media) ? (item.media[0] || null) : (item.media || item.media?.[0]?.url || null),
          title:       item.title || null,
          author_name: item.author?.name || null,
          user_id:     item.author?.id || null,
        });
        toast.info(alreadySaved ? "Aus Merkliste entfernt" : "Gespeichert", { duration: 1800 });
      },
    };
  };

  const TEAL_TINT = "rgba(13,196,181,0.10)";
  const firstMediaUrl = (item) => item.media?.find(m => m.type === "image")?.url || item.media?.[0]?.url || null;

  return (
    <div style={{ animation: "hui-search-fade-in .2s cubic-bezier(.22,1,.36,1) both", marginBottom: 4 }}>
      {people.length > 0 && (
        <SearchGroupCard icon="👤" label="Wirker">
          {people.map(p => {
            const name = p.display_name || p.full_name || p.username || "Mitglied";
            return (
              <SearchResultRow key={p.id} shape="circle" image={p.avatar_url}
                title={name} subtitle={p.talent || p.location_label} query={query}
                onPress={() => {
                  const item = normalizeWirkerForPreview({ ...p, name });
                  if (item) openPreview({ ...item, canOpenFull: !!p.username, fullPath: p.username ? `/${p.username}` : null });
                  else onProfile?.(p.id);
                }} />
            );
          })}
        </SearchGroupCard>
      )}
      {projects.length > 0 && (
        <SearchGroupCard icon="🌱" label="Projekte">
          {projects.map(p => (
            <SearchResultRow key={p.id} shape="square" fallbackIcon={p.icon || "🌱"}
              tint={p.color ? `${p.color}1A` : `${SXR.coral}1A`}
              title={p.name} subtitle={p.category} query={query}
              onPress={() => {
                const item = normalizeProjectForPreview(p);
                if (item) openPreview(item); else onProjectPress?.(p);
              }} />
          ))}
        </SearchGroupCard>
      )}
      {works.length > 0 && (
        <SearchGroupCard icon="🛠" label="Werke">
          {works.map(it => (
            <SearchResultRow key={it.id} shape="square" fallbackIcon="🛠" tint={TEAL_TINT}
              image={firstMediaUrl(it)}
              title={it.title} subtitle={[it.author?.name, it._raw?.category].filter(Boolean).join(" · ")}
              query={query} onPress={() => {
                const item = normalizePostForPreview(it._raw || it, "work");
                if (item) openPreview({ ...item, canOpenFull:true, fullPath:`/work/${it.id}` });
                else onDetail?.(it);
              }} {...bookmarkProps(it, "work")} />
          ))}
        </SearchGroupCard>
      )}
      {experiences.length > 0 && (
        <SearchGroupCard icon="✨" label="Erlebnisse">
          {experiences.map(it => (
            <SearchResultRow key={it.id} shape="square" fallbackIcon="✨" tint={TEAL_TINT}
              image={firstMediaUrl(it)}
              title={it.title} subtitle={[it.author?.name, it._raw?.location_text].filter(Boolean).join(" · ")}
              query={query} onPress={() => {
                const item = normalizePostForPreview(it._raw || it, "experience");
                if (item) openPreview(item); else onBook?.(it);
              }} {...bookmarkProps(it, "experience")} />
          ))}
        </SearchGroupCard>
      )}
      {events.length > 0 && (
        <SearchGroupCard icon="📅" label="Veranstaltungen">
          {events.map(it => (
            <SearchResultRow key={it.id} shape="square" fallbackIcon="📅" tint={TEAL_TINT}
              image={firstMediaUrl(it)}
              title={it.title} subtitle={[it.author?.name, it.location].filter(Boolean).join(" · ")}
              query={query} onPress={() => {
                const item = normalizePostForPreview(it._raw || it, "event");
                if (item) openPreview(item); else onEventPress?.(it);
              }} {...bookmarkProps(it, "event")} />
          ))}
        </SearchGroupCard>
      )}
      {moments.length > 0 && (
        <SearchGroupCard icon="📰" label="Beiträge">
          {moments.map(it => (
            <SearchResultRow key={it.id} shape="square" fallbackIcon="📰" tint={TEAL_TINT}
              image={firstMediaUrl(it)}
              title={it.title} subtitle={it.author?.name}
              query={query} onPress={() => {
                const item = normalizePostForPreview(it._raw || it, "moment");
                if (item) openPreview(item); else onProfile?.(it.author?.id);
              }} {...bookmarkProps(it, "post")} />
          ))}
        </SearchGroupCard>
      )}
    </div>
  );
}

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
  // Wirker-/Projekte-Suchtreffer (2026-07-06): Klick auf einen Projekt-Treffer
  // in der Suche -- optional, faellt bei Nichtangabe auf No-Op zurueck statt
  // zu crashen.
  onProjectPress = null,
  // Refresh binding — parent can register for feed refresh fn
  onRefreshBind = null,
  // Navigation
  onDiscover   = null,
  // User context
  currentUser  = null,
  // Search Experience 2.0 (2026-07-06, Lars) -- Suche als Feed-Zustand statt
  // eigene Seite/Overlay. Wenn searchActive: Dashboard-Elemente (Begruessung,
  // Heute-auf-HUI, Events) werden ausgeblendet; bei nicht-leerer searchQuery
  // zeigt der Feed direkt die (im useFeedStream-Hook) gefilterten Ergebnisse
  // -- dieselben Karten/Komponenten wie im Normalzustand, keine Suchkarten.
  searchActive   = false,
  searchQuery    = "",
  typeFilter     = null,
  // "Alle Kategorien"-Feature (2026-07-06); Mehrfachauswahl (2026-07-07):
  // Array von Kategorie-Objekten aus src/lib/categories.js oder null/leer.
  // Wird 1:1 an useFeedStream durchgereicht.
  categoryFilters = null,
  // Umkreissuche (2026-07-06): radiusKm (Zahl oder "world") + geo ({lat,lng})
  // aus SearchCommandCenter/useRadiusFilter. Wird 1:1 an useFeedStream durchgereicht.
  radiusKm       = null,
  geo            = null,
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
    isSearching,
    searchPeople,
    searchProjects,
    searchGroups,
  } = useFeedStream({ searchQuery, typeFilter, categoryFilters, radiusKm, geo });

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

  // Search Experience 2.0: waehrend die Suche aktiv ist (Bar fokussiert),
  // sind Dashboard-Elemente (Begruessung/Heute-auf-HUI/Events) ausgeblendet --
  // sie sind kein Suchergebnis und wuerden wieder wie "ein zweites Home" wirken.
  const hideDashboard = searchActive;
  // Reine Discovery-Phase (Bar aktiv, aber noch kein Suchtext): die Kategorien-/
  // Filter-/Verlaufs-Chips werden vom Header (SearchExperience) gerendert --
  // der Feed-Bereich selbst bleibt hier bewusst leer (keine Karten, kein
  // Dashboard), bis der Nutzer zu tippen beginnt.
  const pureDiscovery = searchActive && !isSearching;

  return (
    <div style={{
      width: "100%",
      overflowX: "hidden",
      background: "#FAFAF8",
      minHeight: "100vh",
    }}>

      {/* ── FEED WELCOME HEADER — Kapitel 2 Sprint 2.1 — ausgeblendet waehrend Suche aktiv ── */}
      {!hideDashboard && (
        <div style={{ animation: "hui-search-fade-in .18s cubic-bezier(.22,1,.36,1) both" }}>
          <FeedWelcomeHeader currentUser={currentUser} />
        </div>
      )}

      {/* Stories entfernt — HUI-Momente sind die Stories */}

      {/* ── EVENTS — below stories — ausgeblendet waehrend Suche aktiv ── */}
      {showEvents && !hideDashboard && (
        <SectionBoundary name="events">
          <FeedEventsSection
            onEventPress={onEventPress}
            onMoreEvents={onMoreEvents}
          />
        </SectionBoundary>
      )}

      {/* Reine Discovery-Phase: Feed-Bereich bewusst leer -- Kategorien/Filter/
          Verlauf werden vom Header (SearchExperience) darueber angezeigt. */}
      {pureDiscovery && (
        <div style={{ minHeight:"40vh" }} aria-hidden="true"/>
      )}

      {/* ── MAIN FEED — vertical timeline, stable, always renders (auch mit gefilterten Suchergebnissen) ── */}
      {!pureDiscovery && (
      <div key={searchActive ? "search" : "normal"} style={{ animation: "hui-search-fade-in .22s cubic-bezier(.22,1,.36,1) both" }}>

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

        {/* Keine Ergebnisse -- Suchmodus, kompakter Hinweis statt leerer Flaeche.
            Zaehlt Wirker-/Projekte-Treffer mit -- sonst wuerde "keine Ergebnisse"
            angezeigt, obwohl oben bereits Menschen/Projekte gefunden wurden. */}
        {isSearching && !streamLoading && resolvedItems.length === 0
          && searchPeople.length === 0 && searchProjects.length === 0 && (
          <div style={{ padding:"48px 24px", textAlign:"center" }}>
            <div style={{ fontSize:26, marginBottom:8 }}>🔍</div>
            <div style={{ fontSize:13.5, color:"rgba(26,53,48,0.55)", fontWeight:500 }}>
              Keine Ergebnisse für „{searchQuery || categoryFilters?.map(c => c.name).join(", ") || ""}"
            </div>
          </div>
        )}

        {/* Feed list — only when not first-load.
            Sanftes Fade waehrend eines Refetches (Radius-/Kategorie-/
            Suchwechsel, 2026-07-06): die ALTEN Items bleiben im DOM (kein
            Unmount, kein Skeleton, kein Flackern) und dimmen nur kurz ab,
            bis die neuen Items da sind -- dann Wechsel + Fade zurueck auf
            volle Deckkraft. Kein Layout-Sprung, keine Ladeunterbrechung. */}
        {(!streamLoading || resolvedItems.length > 0) && (
          <div style={{
            opacity: streamLoading ? 0.45 : 1,
            transition: "opacity .25s ease",
          }}>
            {/* Suchmodus: EINE einheitliche, nach Typ gruppierte Ergebnis-
                Darstellung (Wirker→Projekte→Werke→Erlebnisse→Veranstaltungen→
                Beitraege) statt der normalen chronologischen Feed-Liste.
                Ausserhalb der Suche unveraendert: normale FeedList. Beide
                haengen im selben Fade-Wrapper -- "keine Ladeunterbrechung"
                gilt fuer beide Zustaende identisch. */}
            {isSearching ? (
              <SectionBoundary name="groupedSearchResults">
                <GroupedSearchResults
                  people={searchPeople}
                  projects={searchProjects}
                  groups={searchGroups}
                  query={searchQuery}
                  onProfile={onProfile}
                  onBook={onBook}
                  onDetail={onDetail}
                  onShare={onShare}
                  onProjectPress={onProjectPress}
                  onEventPress={onEventPress}
                />
              </SectionBoundary>
            ) : (
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
              />
            )}
          </div>
        )}
      </SectionBoundary>

      </div>
      )}

    </div>
  );
}

// Named exports for selective use
export { FeedList };
