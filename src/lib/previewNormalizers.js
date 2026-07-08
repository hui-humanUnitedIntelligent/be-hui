// src/lib/previewNormalizers.js — OPEN.1 (2026-07-08)
// ══════════════════════════════════════════════════════════════════
// Bestandsanalyse-Ergebnis: Fuer "post-artige" Feed-Typen (work,
// experience, moment, event) existiert bereits ein voll ausgereifter
// Normalizer (toFeedItem in system/feed/unifiedNormalizer.js), der
// jede Roh-DB-Zeile in {id,type,author,title,text,media,createdAt,
// location,...} umwandelt. Der wird hier 1:1 wiederverwendet -- keine
// zweite Normalisierungs-Logik fuer dieselben vier Typen.
//
// Vier weitere Karten-Typen (Impact-Projekt, Empfehlung, Wirker,
// Verbindung) sind strukturell KEINE Posts (kein "Autor postet etwas"-
// Konzept, andere Felder) -- dafuer je ein kleiner, dedizierter
// Normalizer, der auf dasselbe Zielformat abbildet, damit
// ContentPreviewSheet nur EINE Shape kennen muss.
// ══════════════════════════════════════════════════════════════════
import { toFeedItem } from "../system/feed/unifiedNormalizer.js";

const str = (v, fb=null) => (v==null || v==="") ? fb : String(v).trim();

export function normalizeProjectForPreview(p) {
  if (!p?.id) return null;
  return {
    id: String(p.id), type: "project",
    author: null, // Projekte haben keinen einzelnen "Autor" im Post-Sinn
    title: str(p.name, "Impact-Projekt"),
    text:  str(p.description),
    media: p.img_url ? [{ type:"image", url: p.img_url }] : [],
    createdAt: p.created_at || null,
    location: null,
    icon: p.icon || "🌱", color: p.color || null,
    category: str(p.category),
    canOpenFull: true, fullPath: "/impact",
    _raw: p,
  };
}

export function normalizeRecommendationForPreview(r) {
  if (!r?.id) return null;
  const fromName = r.from_profile?.display_name || "Ein Mitglied";
  const toName   = r.to_profile?.display_name   || null;
  return {
    id: String(r.id), type: "recommendation",
    author: r.from_profile
      ? { id: r.from_user_id, name: fromName, avatar: r.from_profile.avatar_url }
      : null,
    title: toName ? `Empfehlung für ${toName}` : "Empfehlung",
    text:  str(r.text),
    media: Array.isArray(r.result_images) ? r.result_images.map(u => ({ type:"image", url:u })) : [],
    createdAt: r.created_at || null,
    location: null,
    canOpenFull: false, fullPath: null,
    _raw: r,
  };
}

export function normalizeWirkerForPreview(w) {
  if (!w?.id) return null;
  return {
    id: String(w.id), type: "wirker",
    author: { id: w.user_id || w.id, name: w.name || w.full_name, avatar: w.img },
    title: w.name || w.full_name || "Wirker",
    text:  str(w.bio) || (w.talent ? `Talent: ${w.talent}` : null),
    media: w.img ? [{ type:"image", url:w.img }] : [],
    createdAt: w.created_at || null,
    location: str(w.location),
    canOpenFull: false, fullPath: null,
    _raw: w,
  };
}

export function normalizeConnectionForPreview(c) {
  if (!c?.id) return null;
  return {
    id: String(c.id), type: "connection",
    author: null,
    title: str(c.title, "Neue Verbindung"),
    text:  str(c.description),
    media: [],
    createdAt: c.created_at || null,
    location: str(c.location),
    canOpenFull: false, fullPath: null,
    _raw: c,
  };
}

// Post-artige Typen (work/experience/moment/event): bestehenden
// Normalizer 1:1 wiederverwenden, nur den Typ erzwingen falls die
// Rohdaten (z.B. aus Discover-Karten) ihn nicht mitbringen.
export function normalizePostForPreview(raw, forcedType) {
  if (!raw?.id) return null;
  const item = toFeedItem(forcedType ? { ...raw, type: forcedType } : raw);
  if (!item) return null;
  const fullPath = item.type === "work" ? `/work/${item.id}` : null;
  return { ...item, canOpenFull: !!fullPath, fullPath };
}
