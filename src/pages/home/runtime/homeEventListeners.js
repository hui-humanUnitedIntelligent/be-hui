export function bindFeedRefreshListener(feedRefreshRef) {
  const handler = () => {
    feedRefreshRef.current?.();
  };
  window.addEventListener("feed-refresh", handler);
  return () => window.removeEventListener("feed-refresh", handler);
}

export function bindNavigateTabListener(handleTab) {
  const handler = (e) => { if (e.detail?.tab) handleTab(e.detail.tab); };
  window.addEventListener("hui:navigate:tab", handler);
  return () => window.removeEventListener("hui:navigate:tab", handler);
}
