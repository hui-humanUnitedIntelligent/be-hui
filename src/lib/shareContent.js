// src/lib/shareContent.js — SHARE.1 (2026-07-09)
// ══════════════════════════════════════════════════════════════════
// EINE zentrale Share-Funktion fuer die gesamte App. Ersetzt alle
// bisherigen, verstreuten navigator.share/clipboard-Implementierungen
// fuer die 8 vereinheitlichten Content-Typen (work/experience/moment/
// event/project/recommendation/wirker/connection) -- dieselbe Shape,
// die bereits von toFeedItem()/previewNormalizers.js appweit genutzt
// wird (siehe ContentPreviewSheet.jsx/PostFullscreenView.jsx).
//
// Bestandsanalyse (2026-07-09): 3 echte, unabhaengige Implementierungen
// gefunden (ContentPreviewSheet.jsx, PostFullscreenView.jsx,
// WorkDetailPage.jsx) + EIN entdeckter Bug: Home.jsx verdrahtete das
// Feed-Karten-"Weitergeben" faelschlich auf setShowTeilen(true) (oeffnet
// den "Neuen Beitrag erstellen"-Flow statt den angetippten Inhalt zu
// teilen) -- ignorierte das uebergebene item komplett. Alle 4 Stellen
// nutzen jetzt ausschliesslich diese eine Funktion.
//
// Oeffentliche URL pro Typ (niemals interne IDs/Session-Daten):
//   - work   → /work/:id            (einzige echte Detailroute der App)
//   - wirker → /profile/:username   (falls Username bekannt)
//   - alles andere (experience/moment/event/project/recommendation/
//     connection) → es gibt appweit noch KEINE eigene Detailseite fuer
//     diese Typen (etablierte, bereits an mehreren Stellen dokumentierte
//     Baseline, siehe OPEN.1/MERKLISTE.1). Fallback: oeffentliches Profil
//     des Autors -- dieselbe Konvention, die die Merkliste bereits fuer
//     "Original oeffnen" nutzt. Ist kein Autor/Username bekannt: Fallback
//     auf die oeffentliche HUI-Startseite (/Home) -- niemals eine kaputte
//     oder interne URL.
//
// Architektur-Vorbereitung fuer spaeter (kein Umbau noetig):
//   shareContent(item, { channel }) -- `channel` ist optional und heute
//   ungenutzt (native Share ist der einzige Kanal). Kuenftige Kanaele
//   ("Mit HUI-Mitglied teilen", QR-Code, Social-Media-Links, Einladungen)
//   koennen als weitere `channel`-Werte ergaenzt werden, ohne die
//   bestehende Aufruf-Signatur oder die Aufrufer zu aendern.
// ══════════════════════════════════════════════════════════════════
import { toast } from "./useToast.jsx";

const TYPE_LABEL = {
  work: "Werk", experience: "Erlebnis", moment: "Beitrag", event: "Veranstaltung",
  project: "Impact-Projekt", recommendation: "Empfehlung", wirker: "Wirker",
  connection: "Verbindung",
};

function publicUrlForItem(item) {
  const origin = (typeof window !== "undefined" && window.location?.origin) || "";
  if (item.type === "work" && item.id) return `${origin}/work/${item.id}`;

  if (item.type === "wirker") {
    const username = item.username || item.author?.username || item._raw?.username;
    if (username) return `${origin}/profile/${username}`;
  }

  // Kein eigener Detail-Link fuer diesen Typ (siehe Kommentar am Dateikopf) --
  // Fallback: oeffentliches Autor-Profil, sonst generischer Home-Link.
  const authorUsername = item.author?.username;
  if (authorUsername) return `${origin}/profile/${authorUsername}`;
  return `${origin}/Home`;
}

function textForItem(item) {
  const raw = item.text || item.bio || item.description || "";
  return raw.length > 220 ? `${raw.slice(0, 217)}…` : raw;
}

function previewImageUrl(item) {
  return item.media?.[0]?.url || item.img || item.cover_url || null;
}

// Best-effort Vorschaubild als Datei fuer navigator.share({files}) --
// nur wenn der Browser das unterstuetzt (canShare mit files), sonst
// wird die Datei einfach weggelassen (Titel/Text/URL reichen dann aus).
async function tryBuildPreviewFile(imageUrl) {
  if (!imageUrl || typeof navigator === "undefined" || !navigator.canShare) return null;
  try {
    const res = await fetch(imageUrl, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type?.startsWith("image/")) return null;
    const ext = (blob.type.split("/")[1] || "jpg").split("+")[0];
    const file = new File([blob], `hui-share.${ext}`, { type: blob.type });
    return navigator.canShare({ files: [file] }) ? file : null;
  } catch {
    return null; // stilles Scheitern -- Vorschaubild ist rein optional
  }
}

/**
 * shareContent — zentrale, einzige Share-Funktion der App.
 * @param {object} item - normalisiertes Content-Item (Shape aus toFeedItem()/
 *   previewNormalizers.js): {id,type,title,text,media,author,...}
 */
export async function shareContent(item) {
  if (!item) return;

  const title = item.title || item.name || TYPE_LABEL[item.type] || "HUI";
  const text  = textForItem(item);
  const url   = publicUrlForItem(item);

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      const file = await tryBuildPreviewFile(previewImageUrl(item));
      const shareData = file ? { title, text, url, files: [file] } : { title, text, url };
      if (file && navigator.canShare && !navigator.canShare(shareData)) {
        delete shareData.files; // Kombination (Text+Bild) nicht unterstuetzt -> ohne Bild
      }
      await navigator.share(shareData);
      return;
    }
  } catch (err) {
    if (err?.name === "AbortError") return; // Nutzer hat das Share-Sheet selbst geschlossen
    // sonst: weiter zum Zwischenablage-Fallback
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.info("Link wurde in die Zwischenablage kopiert.", { duration: 2200 });
  } catch {
    toast.info("Teilen war leider nicht möglich.", { duration: 2200 });
  }
}
