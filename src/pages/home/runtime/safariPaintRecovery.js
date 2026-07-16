/** Phase 16.6: Safari Paint Recovery — safe, cancel-aware */
export function runSafariPaintRecoveryOnSurfaceClose({
  paintManager,
  scrollContainerRef,
  tabRefs,
  tab,
  isMember,
  activeSurface,
}) {
  if (activeSurface !== null) return undefined;

  paintManager.current.cleanup();

  const t = setTimeout(() => {
    paintManager.current.stripHints(scrollContainerRef.current, "scroll-container");

    const activeTabRef = tabRefs[tab];
    if (typeof window !== "undefined") {
      window.__HUI_WORLD_STATE__ = {
        ...(window.__HUI_WORLD_STATE__ || {}),
        activeTab: tab,
        membershipType: isMember ? "member" : "free",
      };
    }
    if (activeTabRef?.current) {
      paintManager.current.repaint(activeTabRef.current, `tab-${tab}`);
    }
  }, 320);

  return () => {
    clearTimeout(t);
    paintManager.current.cleanup();
  };
}
