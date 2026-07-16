import React from "react";
import HuiLiveTicker from "../../../components/shared/HuiLiveTicker.jsx";
import UnifiedFeed from "../../../feed/UnifiedFeed.jsx";
import { SAFE_MODE } from "../../../config/safeMode.js";
import { SafeRender } from "../../../config/SafeRender.jsx";

export function HomeFeedTab({
  tabRef,
  keepFeed,
  feedHandlers,
  currentUser,
  searchState,
}) {
  return (
    <div ref={tabRef} style={keepFeed}>
      <HuiLiveTicker />
      {SAFE_MODE.homeFeed ? (
        <SafeRender flag="homeFeed" label="Feed">
          <UnifiedFeed
            onRefreshBind={feedHandlers.onRefreshBind}
            showEvents={true}
            currentUser={currentUser}
            searchActive={searchState.active}
            searchQuery={searchState.query}
            typeFilter={searchState.typeFilter}
            categoryFilters={searchState.categories}
            radiusKm={searchState.radiusKm}
            geo={searchState.geo}
            onProfile={feedHandlers.onProfile}
            onBook={feedHandlers.onBook}
            onDetail={feedHandlers.onDetail}
            onShare={feedHandlers.onShare}
            onEventPress={feedHandlers.onEventPress}
            onMoreEvents={feedHandlers.onMoreEvents}
            onDiscover={feedHandlers.onDiscover}
            onProjectPress={feedHandlers.onProjectPress}
            scrollContainerRef={feedHandlers.scrollContainerRef}
          />
        </SafeRender>
      ) : (
        <div style={{
          padding: "40px 20px", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: "linear-gradient(135deg,rgba(13,196,181,0.10),rgba(244,115,85,0.07))",
            animation: "huiBreathe 4.8s ease-in-out infinite",
            border: "1px solid rgba(13,196,181,0.12)",
          }}/>
          <div style={{
            fontSize: 13, color: "rgba(20,20,34,0.32)", fontWeight: 500,
            letterSpacing: "-0.005em", animation: "huiFadeIn 0.6s ease",
          }}>Atmet…</div>
        </div>
      )}
    </div>
  );
}
