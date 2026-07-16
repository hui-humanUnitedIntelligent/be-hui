/** COMMERCE-01: WorkDetailPage → /Home + state → WerkKaufFlow öffnen */
export function applyPendingWerkKauf(locationState, setShowWerkCheckout) {
  const pending = locationState?.pendingWerkKauf;
  if (pending && setShowWerkCheckout) {
    setShowWerkCheckout(pending);
    try { window.history.replaceState({}, document.title, window.location.pathname); } catch { /* silent */ }
  }
}
