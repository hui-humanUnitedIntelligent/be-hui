import { getMeta } from "./notificationTypes.js";

/** Nutzer-Antworten auf Tickets NICHT im Resonanzzentrum anzeigen */
export function filterVisibleNotifications(data) {
  if (!data || !Array.isArray(data)) return [];
  return data.filter(n => {
    const d = n.data ?? {};
    return !(d.is_followup === true);
  });
}

export function countUnreadNotifications(data) {
  if (!data || !Array.isArray(data)) return 0;
  return data.filter(n => !n.is_read).length;
}

export const REJECTION_TYPES = new Set([
  "work_rejected",
  "content_rejected",
  "talent_rejected",
  "experience_rejected",
  "project_rejected",
  "impact_project_rejected",
]);

export function isRejectionType(type) {
  return REJECTION_TYPES.has(type);
}

export const REJECTION_TYPE_MAP = {
  work_rejected:            { label:"Werk",             emoji:"🎨", hint:"Du kannst dein Werk überarbeiten und erneut einreichen." },
  content_rejected:         { label:"Inhalt",           emoji:"📝", hint:"Du kannst den Inhalt überarbeiten und erneut einreichen." },
  talent_rejected:          { label:"Talent",           emoji:"⭐", hint:"Du kannst dein Talent-Angebot überarbeiten und erneut einreichen." },
  experience_rejected:      { label:"Erlebnis",         emoji:"🌿", hint:"Du kannst dein Erlebnis überarbeiten und erneut einreichen." },
  project_rejected:         { label:"Projekt",          emoji:"📌", hint:"Du kannst dein Projekt überarbeiten und erneut einreichen." },
  impact_project_rejected:  { label:"Herzensprojekt",   emoji:"💚", hint:"Du kannst dein Projekt überarbeiten und erneut einreichen." },
};

export function parseNotificationMeta(n) {
  const rawMeta = n.metadata || n.data || {};
  return typeof rawMeta === "string"
    ? (() => { try { return JSON.parse(rawMeta); } catch { return {}; } })()
    : rawMeta;
}

export const INTENTIONS_MAP = {
  work:       "Ich interessiere mich für deine Arbeit",
  experience: "Ich möchte an deinen Erlebnissen teilnehmen",
  exchange:   "Ich suche Austausch",
  create:     "Ich möchte gemeinsam etwas bewirken",
  other:      "Persönliche Nachricht",
};

export function computeTabCounts(safeItems, safeRequests) {
  const wichtig = safeItems.filter(n => getMeta(n?.type).tab === "wichtig" && !n?.is_read).length
                + safeRequests.length;
  const relevant = safeItems.filter(n => getMeta(n?.type).tab === "relevant" && !n?.is_read).length;
  const info     = safeItems.filter(n => getMeta(n?.type).tab === "info"     && !n?.is_read).length;
  return { alle: safeItems.length + safeRequests.length, wichtig, relevant, info };
}

export function filterItemsByTab(safeItems, tab) {
  if (tab === "alle") return safeItems;
  const tabKey = tab === "wichtig" ? "wichtig" : tab === "relevant" ? "relevant" : "info";
  return safeItems.filter(n => getMeta(n?.type).tab === tabKey);
}

export function groupItemsByTab(safeItems) {
  const w = safeItems.filter(n => getMeta(n?.type).tab === "wichtig");
  const r = safeItems.filter(n => getMeta(n?.type).tab === "relevant");
  const i = safeItems.filter(n => getMeta(n?.type).tab === "info");
  return { wichtig: w, relevant: r, info: i };
}

export const EMPTY_TAB_MESSAGES = {
  alle:      { icon:"✦",  text:"Alles ruhig – Dein Wirken entfaltet sich." },
  wichtig:   { icon:"🌿", text:"Nichts Dringendes. Genieße die Ruhe." },
  relevant:  { icon:"❤️", text:"Wenn Menschen auf dein Wirken reagieren, erscheint es hier." },
  info:      { icon:"📈", text:"Meilensteine und Entwicklungen erscheinen hier." },
};
