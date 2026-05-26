// src/feed/UnifiedFeed.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — UNIFIED FEED  (Phase 2A: Safe Reintegration)
//
// Vereint Stories + Events + Cards in einer stabilen Struktur.
// Jede Sektion ist isoliert — Crash einer Sektion = kein Global-Crash.
//
// CSS KEYFRAMES werden nur einmal injiziert.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useMemo, useEffect } from "react";
import FeedRouter          from "./cards/FeedRouter.jsx";
import { useFeedStream }   from "./useFeedStream.js";
import { toFeedItem }      from "../system/feed/unifiedNormalizer.js";
import FeedStoriesBar      from "./FeedStoriesBar.jsx";
import FeedEventsSection   from "./FeedEventsSection.jsx";

/* ── CSS: fade-in + scroll-feel ───────────────────────────────── */
const FEED_CSS = `
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
function FeedList({ items, onProfile, onReaction, onBook, onShare }) {
  const arr = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const valid = items.filter(i => i && typeof i === "object" && i.id);
    return Array.from(
      new Map(valid.map(i => [String(i.id), i])).values()
    );
  }, [items]);

  const [reactions, setReactions] = useState({});

  if (arr.length === 0) return <EmptyFeed />;

  return (
    <div style={{ paddingTop: 8, paddingBottom: 100 }}>
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
            <FeedRouter
              item={item}
              itemReactions={{ ...itemReactions, _relaxed: isRelaxed }}
              onProfile={onProfile}
              onReaction={(type) => {
                setReactions(prev => ({
                  ...prev,
                  [String(item.id)]: {
                    ...(prev[String(item.id)] || {}),
                    [type === "inspire" ? "inspired"
                     : type === "touch"  ? "touched"
                     : type === "save"   ? "saved" : type]: true,
                    [`${type}Count`]:
                      ((prev[String(item.id)] || {})[`${type}Count`] || 0) + 1,
                  },
                }));
              }}
              onShare={() => onShare?.(item)}
              onBook={onBook}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ── Main UnifiedFeed ─────────────────────────────────────────── */
export default function UnifiedFeed({
  // Items prop (optional — wenn nicht übergeben, eigener useFeedStream)
  items: itemsProp = null,
  // Section visibility
  showStories  = true,
  showEvents   = true,
  // Handlers
  onProfile    = null,
  onBook       = null,
  onShare      = null,
  onStory      = null,
  onAddStory   = null,
  onEventPress = null,
  onMoreEvents = null,
  // User context
  currentUser  = null,
}) {
  useEffect(() => { injectFeedCSS(); }, []);

  // ── OWN FEED STREAM — läuft immer, liefert Items aus DB ──────────
  const {
    items: streamItems,
    loading: streamLoading,
  } = useFeedStream();

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
        // Absolute fallback — id vorhanden → immer etwas zurückgeben
        if (!n) {
          return {
            id:        String(raw.id),
            type:      raw.type || "moment",
            author:    { id: "", name: raw.display_name || raw.name || "Human",
                         displayName: raw.display_name || raw.name || "Human",
                         avatar: raw.avatar_url || raw.avatar || null },
            title:     raw.title || raw.caption?.slice(0, 60) || null,
            text:      raw.caption || raw.description || raw.text || null,
            media:     [],
            createdAt: "",
            _reactions: {},
            _raw: raw,
          };
        }
        return n;
      } catch (err) {
        console.warn("[UNIFIED_NORM_ERR]", raw?.id, err?.message);
        return {
          id:         String(raw.id),
          type:       "moment",
          author:     { id: "", name: "Human", displayName: "Human", avatar: null },
          title:      null, text: null, media: [], createdAt: "",
          _reactions: {}, _raw: raw,
        };
      }
    });

    // Nur null-Items und Items ohne id rausfiltern — nie mehr
    const safe = normalized.filter(i => i?.id);

    console.log("[UNIFIED_FEED_TRACE]", {
      propItems:   itemsProp?.length ?? 0,
      streamItems: (streamItems||[]).length,
      normalized:  normalized.length,
      safe:        safe.length,
      loading:     streamLoading,
    });

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

      {/* ── STORIES — top section, always first ── */}
      {showStories && (
        <SectionBoundary name="stories">
          <FeedStoriesBar
            onStoryClick={onStory}
            onAddStory={onAddStory}
            currentUser={currentUser}
          />
        </SectionBoundary>
      )}

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
      <SectionBoundary name="feedList">
        {/* Loading state — minimal, non-intrusive */}
        {streamLoading && resolvedItems.length === 0 && (
          <div style={{ padding: "32px 16px 0" }}>
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
            onShare={onShare}
          />
        )}
      </SectionBoundary>

    </div>
  );
}

// Named exports for selective use
export { FeedList };
