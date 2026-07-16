/**
 * GlobalDiscoverFeed.jsx — Globaler Discover-Feed
 *
 * Zeigt works / momente / talente / erlebnisse / impact_projekte
 * gemischt nach Datum sortiert.
 *
 * Performance-Architektur:
 *  - @tanstack/react-virtual für Virtualisierung (nur sichtbare Rows im DOM)
 *  - IntersectionObserver für Lazy-Loading + "Mehr laden" Trigger
 *  - React.memo auf allen Karten — kein globaler Re-Render
 *  - Bilder: loading="lazy" + decoding="async"
 *  - Kein sessionStorage-Cache (immer frische Daten)
 *
 * Layout: 2-Spalten-Grid auf Mobile, virtualisierte Row-Liste
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDiscoverFeed }  from "./useDiscoverFeed.js";
import DiscoverFeedCard     from "./DiscoverFeedCard.jsx";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  teal:   "rgba(13,196,181,1)",
  sub:    "rgba(26,26,46,0.40)",
  border: "rgba(13,196,181,0.15)",
  bg:     "transparent",
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = React.memo(function SkeletonCard() {
  return (
    <div style={{
      borderRadius:16, overflow:"hidden",
      border:"1px solid rgba(26,26,46,0.07)",
      background:"#fff",
    }}>
      <div style={{
        width:"100%", paddingTop:"56.25%",
        background:"linear-gradient(90deg,rgba(26,26,46,0.05) 25%,rgba(26,26,46,0.09) 50%,rgba(26,26,46,0.05) 75%)",
        backgroundSize:"200% 100%",
        animation:"hui-shimmer 1.4s ease infinite",
      }}/>
      <div style={{ padding:"12px 14px 14px" }}>
        <div style={{ height:14, borderRadius:7, background:"rgba(26,26,46,0.07)", marginBottom:8, width:"70%" }}/>
        <div style={{ height:11, borderRadius:6, background:"rgba(26,26,46,0.05)", marginBottom:5, width:"90%" }}/>
        <div style={{ height:11, borderRadius:6, background:"rgba(26,26,46,0.05)", width:"55%" }}/>
      </div>
    </div>
  );
});

// ─── Filter-Typen ─────────────────────────────────────────────────────────────
const FILTER_TYPES = [
  { key: "all",        label: "Alle" },
  { key: "work",       label: "Werke" },
  { key: "moment",     label: "Momente" },
  { key: "talent",     label: "Talente" },
  { key: "experience", label: "Erlebnisse" },
  { key: "impact",     label: "Projekte" },
];

// ─── Filter-Bar ───────────────────────────────────────────────────────────────
const FilterBar = React.memo(function FilterBar({ active, onChange }) {
  return (
    <div style={{
      display:"flex", gap:6, overflowX:"auto", padding:"0 16px 12px",
      scrollbarWidth:"none", WebkitOverflowScrolling:"touch",
    }}>
      {FILTER_TYPES.map(f => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          style={{
            flexShrink:0,
            padding:"6px 14px",
            borderRadius:20,
            fontSize:12, fontWeight:600,
            border:`1.5px solid ${active === f.key ? T.teal : "rgba(26,26,46,0.12)"}`,
            background: active === f.key ? T.teal : "transparent",
            color: active === f.key ? "#fff" : T.sub,
            cursor:"pointer",
            transition:"all 0.18s ease",
            WebkitTapHighlightColor:"transparent",
          }}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
});

// ─── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <div style={{ padding:"40px 24px", textAlign:"center" }}>
      <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
      <div style={{ fontSize:14, color:T.sub, marginBottom:16 }}>
        {message || "Etwas ist schiefgelaufen."}
      </div>
      <button
        onClick={onRetry}
        style={{
          padding:"10px 24px", borderRadius:24,
          background:T.teal, color:"#fff",
          fontSize:13, fontWeight:700, border:"none", cursor:"pointer",
        }}
      >
        Erneut versuchen
      </button>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ padding:"60px 24px", textAlign:"center" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>🌱</div>
      <div style={{ fontSize:15, fontWeight:700, color:"rgba(26,26,46,0.7)", marginBottom:6 }}>
        Noch keine Inhalte
      </div>
      <div style={{ fontSize:13, color:T.sub }}>
        Sei der Erste, der etwas teilt.
      </div>
    </div>
  );
}

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────
export default function GlobalDiscoverFeed({
  onPressWork,
  onPressTalent,
  onPressExperience,
  onPressImpact,
  onPressMoment,
  scrollContainerRef: externalScrollRef,
  style,
}) {
  const { items, loading, loadingMore, hasMore, error, loadMore, refresh } = useDiscoverFeed();
  const [activeFilter, setActiveFilter] = useState("all");

  // ── Filtere Items nach Typ ──────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter(item => item._type === activeFilter);
  }, [items, activeFilter]);

  // ── Zu 2er-Rows gruppieren (Grid) ──────────────────────────────────────────
  const rows = useMemo(() => {
    const r = [];
    for (let i = 0; i < filteredItems.length; i += 2) {
      r.push(filteredItems.slice(i, i + 2));
    }
    return r;
  }, [filteredItems]);

  // ── Scroll-Container ───────────────────────────────────────────────────────
  const internalScrollRef = useRef(null);
  const scrollRef = externalScrollRef || internalScrollRef;

  // ── Virtualizer ────────────────────────────────────────────────────────────
  const rowVirtualizer = useVirtualizer({
    count:           rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize:    () => 260, // geschätzte Zeilenhöhe (Karte ~220px + Gap 8px + Header)
    overscan:        3,         // 3 Rows außerhalb des Viewports im DOM halten
    measureElement:  el => el?.getBoundingClientRect().height ?? 260,
  });

  // ── "Mehr laden" Sentinel ─────────────────────────────────────────────────
  const sentinelRef = useRef(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  // ── Press-Handler ─────────────────────────────────────────────────────────
  const handlePress = useCallback((item) => {
    switch (item._type) {
      case "work":       onPressWork?.(item);       break;
      case "talent":     onPressTalent?.(item);     break;
      case "experience": onPressExperience?.(item); break;
      case "impact":     onPressImpact?.(item);     break;
      case "moment":     onPressMoment?.(item);     break;
    }
  }, [onPressWork, onPressTalent, onPressExperience, onPressImpact, onPressMoment]);

  // ── Filter-Wechsel → Virtualizer Reset ────────────────────────────────────
  useEffect(() => {
    rowVirtualizer.scrollToIndex(0, { behavior: "instant" });
  }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading-Skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding:"0 16px 16px", ...style }}>
        <style>{`
          @keyframes hui-shimmer {
            0%   { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
        `}</style>
        <FilterBar active="all" onChange={() => {}} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  if (!loading && filteredItems.length === 0) {
    return (
      <div style={style}>
        <FilterBar active={activeFilter} onChange={setActiveFilter} />
        <EmptyState />
      </div>
    );
  }

  // ── Virtualisierter Feed ──────────────────────────────────────────────────
  const virtualRows  = rowVirtualizer.getVirtualItems();
  const totalHeight  = rowVirtualizer.getTotalSize();

  return (
    <div style={{ ...style }}>
      <style>{`
        @keyframes hui-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .gdf-scroll-wrapper::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Filter */}
      <FilterBar active={activeFilter} onChange={setActiveFilter} />

      {/* Virtualisierter Grid-Container */}
      <div
        ref={externalScrollRef ? null : internalScrollRef}
        className="gdf-scroll-wrapper"
        style={{
          // Wenn externer ScrollRef → kein eigenes Scroll-Container-Styling
          ...(externalScrollRef ? {} : {
            overflowY:  "auto",
            height:     "100%",
            scrollbarWidth: "none",
          }),
          padding: "0 16px",
        }}
      >
        {/* Virtual-Spacer */}
        <div style={{ height: totalHeight, position:"relative" }}>
          {virtualRows.map(vRow => {
            const row = rows[vRow.index];
            if (!row) return null;
            return (
              <div
                key={vRow.key}
                data-index={vRow.index}
                ref={rowVirtualizer.measureElement}
                style={{
                  position:  "absolute",
                  top:       0,
                  left:      0,
                  width:     "100%",
                  transform: `translateY(${vRow.start}px)`,
                  display:   "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap:       8,
                  paddingBottom: 8,
                }}
              >
                {row.map(item => (
                  <DiscoverFeedCard
                    key={`${item._type}:${item.id}`}
                    item={item}
                    onPress={handlePress}
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* Sentinel für Infinite Scroll */}
        <div ref={sentinelRef} style={{ height:1 }} />

        {/* "Mehr laden" State */}
        {loadingMore && (
          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:8,
            padding:"8px 0 16px",
          }}>
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Ende-Indikator */}
        {!hasMore && filteredItems.length > 0 && (
          <div style={{
            textAlign:"center", padding:"24px 0 40px",
            fontSize:12, color:T.sub,
          }}>
            — Alle Inhalte geladen —
          </div>
        )}

        {/* Navbar-Abstand */}
        <div style={{ height:"calc(88px + env(safe-area-inset-bottom, 0px))" }} />
      </div>
    </div>
  );
}
