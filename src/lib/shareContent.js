// src/lib/shareContent.js — SHARE.2 (2026-07-22)
// ══════════════════════════════════════════════════════════════════
// Zentrale Share-Funktion. Öffnet jetzt das HuiShareModal via
// CustomEvent 'hui:share' (wenn Listener registriert), sonst
// Fallback auf native navigator.share / Clipboard.
//
// Rückwärtskompatibel: alle bisherigen Aufrufer (ContentPreviewSheet,
// PostFullscreenView, WorkDetailPage, Home.jsx) bleiben unverändert.
// ══════════════════════════════════════════════════════════════════
import { toast } from "./useToast.jsx";

const TYPE_LABEL = {
  work: "Werk", experience: "Erlebnis", moment: "Beitrag", event: "Veranstaltung",
  project: "Impact-Projekt", recommendation: "Empfehlung", wirker: "Wirker",
  connection: "Verbindung", talent: "Talent-Angebot",
};

function publicUrlForItem(item) {
  const origin = (typeof window !== "undefined" && window.location?.origin) || "";
  if (item.type === "work")       return `${origin}/work/${item.id}`;
  if (item.type === "talent")     return `${origin}/talent/${item.id}`;
  if (item.type === "moment")     return `${origin}/beitrag/${item.id}`;
  if (item.type === "project")    return `${origin}/projekt/${item.id}`;
  if (item.type === "experience") return `${origin}/erlebnis/${item.id}`;
  if (item.type === "event")      return `${origin}/veranstaltung/${item.id}`;
  if (item.type === "wirker") {
    const username = item.username || item.author?.username || item._raw?.username;
    if (username) return `${origin}/profile/${username}`;
  }
  const authorUsername = item.author?.username;
  if (authorUsername) return `${origin}/profile/${authorUsername}`;
  return `${origin}/Home`;
}

/**
 * shareContent — öffnet das HuiShareModal (wenn in App registriert),
 * sonst nativer Fallback via navigator.share / Clipboard.
 */
export async function shareContent(item) {
  if (!item) return;

  // HUI Share Modal via CustomEvent (App.jsx / Home.jsx lauscht):
  if (typeof window !== "undefined" && window.__HUI_SHARE_REGISTERED) {
    window.dispatchEvent(new CustomEvent("hui:share", { detail: { item } }));
    return;
  }

  // Fallback (kein Listener registriert):
  const title = item.title || item.name || TYPE_LABEL[item.type] || "HUI";
  const text  = (item.text || item.description || "").slice(0, 220);
  const url   = publicUrlForItem(item);

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }
  } catch (err) {
    if (err?.name === "AbortError") return;
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.info("Link wurde in die Zwischenablage kopiert.", { duration: 2200 });
  } catch {
    toast.info("Teilen war leider nicht möglich.", { duration: 2200 });
  }
}

// Exportiere publicUrlForItem für externe Nutzung (z.B. HuiShareModal):
export { publicUrlForItem };
