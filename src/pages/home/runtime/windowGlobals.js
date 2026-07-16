export function registerHomeWindowGlobals({
  setShowMembership,
  setShowCreatorDash,
  openProfileById,
}) {
  window.__HUI_OPEN_TALENT_FLOW  = () => setShowMembership(true);
  window.__HUI_OPEN_CREATOR_DASH = () => setShowCreatorDash(true);
  window.__HUI_OPEN_PROFILE__    = (id) => { if (id) openProfileById(id); };
}

export function unregisterHomeWindowGlobals() {
  delete window.__HUI_OPEN_TALENT_FLOW;
  delete window.__HUI_OPEN_CREATOR_DASH;
  delete window.__HUI_OPEN_PROFILE__;
}
