// Dev-only feed card render profiler.
// Enable in browser console: window.__HUI_CARD_PROF__ = true
// Then reload the feed. Results: window.__HUI_CARD_PROF_REPORT__()

const ENABLED = () =>
  typeof window !== "undefined" && window.__HUI_CARD_PROF__ === true;

const store = {
  mounts: {},
  renders: {},
  marks: {},
};

export function profMark(cardId, phase) {
  if (!ENABLED() || !cardId) return;
  const key = `${cardId}:${phase}`;
  if (!store.marks[key]) store.marks[key] = performance.now();
}

export function profRender(component, cardId) {
  if (!ENABLED()) return;
  const k = `${component}:${cardId || "?"}`;
  store.renders[k] = (store.renders[k] || 0) + 1;
}

export function profMount(component, cardId) {
  if (!ENABLED()) return;
  const k = `${component}:${cardId || "?"}`;
  store.mounts[k] = (store.mounts[k] || 0) + 1;
}

export function profReport() {
  const phases = [
    "data",
    "card-created",
    "text-visible",
    "avatar-visible",
    "image-visible",
    "likes-visible",
    "comments-visible",
    "rest-visible",
  ];
  const timeline = {};
  for (const [key, t] of Object.entries(store.marks)) {
    const [id, phase] = key.split(":");
    if (!timeline[id]) timeline[id] = { id };
    timeline[id][phase] = t;
  }
  for (const row of Object.values(timeline)) {
    const base = row.data;
    if (base) {
      for (const p of phases) {
        if (row[p] != null) row[`${p}_ms`] = Math.round(row[p] - base);
      }
    }
  }
  return {
    renders: { ...store.renders },
    mounts: { ...store.mounts },
    timeline: Object.values(timeline).sort((a, b) => (a.data || 0) - (b.data || 0)),
  };
}

if (typeof window !== "undefined") {
  window.__HUI_CARD_PROF_REPORT__ = profReport;
}
