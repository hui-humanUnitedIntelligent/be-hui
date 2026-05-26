// src/feed/UnifiedFeed.jsx
// ═══════════════════════════════════════════════════════════════
// HUI — UNIFIED FEED  (Phase 2A: Safe Reintegration)
//
// Vereint Stories + Events + Cards in einer stabilen Struktur.
// Jede Sektion ist isoliert — Crash einer Sektion = kein Global-Crash.
//
// CSS KEYFRAMES werden nur einmal injiziert.
// ═══════════════════════════════════════════════════════════════

import React, { useState, useMemo, useRef, useEffect } from "react";
import FeedRouter from "./cards/FeedRouter.jsx";

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
  // Items
  items = null,
  // Section visibility
  showStories = true,
  showEvents  = true,
  // Handlers
  onProfile   = null,
  onBook      = null,
  onShare     = null,
  onStory     = null,
  onAddStory  = null,
  onEventPress = null,
  onMoreEvents = null,
  // User context
  currentUser = null,
}) {
  useEffect(() => { injectFeedCSS(); }, []);

  // Lazy-load isolated sections to avoid blocking feed render
  const [StoriesBar,    setStoriesBar]    = useState(null);
  const [EventsSection, setEventsSection] = useState(null);

  useEffect(() => {
    if (showStories) {
      import("./FeedStoriesBar.jsx").then(m => setStoriesBar(() => m.default)).catch(() => {});
    }
    if (showEvents) {
      import("./FeedEventsSection.jsx").then(m => setEventsSection(() => m.default)).catch(() => {});
    }
  }, [showStories, showEvents]);

  return (
    <div style={{
      width: "100%",
      overflowX: "hidden",
      background: "#FAFAF8",
      minHeight: "100vh",
    }}>

      {/* ── STORIES — isolated, lazy-loaded ── */}
      {showStories && StoriesBar && (
        <SectionBoundary name="stories">
          <StoriesBar
            onStoryClick={onStory}
            onAddStory={onAddStory}
            currentUser={currentUser}
          />
        </SectionBoundary>
      )}

      {/* ── EVENTS — isolated, lazy-loaded ── */}
      {showEvents && EventsSection && (
        <SectionBoundary name="events">
          <EventsSection
            onEventPress={onEventPress}
            onMoreEvents={onMoreEvents}
          />
        </SectionBoundary>
      )}

      {/* ── MAIN FEED — vertical timeline, stable, always renders ── */}
      <SectionBoundary name="feedList">
        <FeedList
          items={items}
          onProfile={onProfile}
          onReaction={null}
          onBook={onBook}
          onShare={onShare}
        />
      </SectionBoundary>

    </div>
  );
}

// Named exports for selective use
export { FeedList };
