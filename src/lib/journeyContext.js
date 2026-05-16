// journeyContext.js — HUI Creator Journey Layer v1.0
// Phase 3D: Kohärenz & Atmosphäre
//
// ZWECK:
// Verbindet alle Phase-3 Systeme zu einem einzigen natürlichen Erlebnis.
// Nutzer spüren keine "Feature-Grenzen" — nur eine lebendige kreative Welt.
//
// JOURNEY-STAGES:
// discovery → profile → inquiry → chat → collaboration → recommendation → repeat
//
// MICRO-INTERACTIONS:
// Weiche Animationen, sanfte Status-Übergänge, persistente Kontexte.
// Kein harter Reset. Kein Verlust des Ursprungs.

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabaseClient";
import { useAuth } from "./AuthContext";

// ────────────────────────────────────────────────────────────────
// JOURNEY STAGES — die kreative Reise eines Nutzers
// ────────────────────────────────────────────────────────────────
export const JOURNEY_STAGES = {
  discovery:      { label: "Entdeckt",           color: "#16D7C5", icon: "✦" },
  profile:        { label: "Profil besucht",      color: "#8B5CF6", icon: "👤" },
  inquiry:        { label: "Anfrage gesendet",    color: "#F59E0B", icon: "📋" },
  chat:           { label: "Im Gespräch",         color: "#16D7C5", icon: "💬" },
  collaboration:  { label: "Zusammenarbeit",      color: "#10B981", icon: "🤝" },
  recommendation: { label: "Empfohlen",           color: "#FF8A6B", icon: "⭐" },
  repeat:         { label: "Wiederkehrend",       color: "#8B5CF6", icon: "🌱" },
};

// ────────────────────────────────────────────────────────────────
// SOFT STATUS TRANSITIONS — sanfte, emotionale Status-Texte
// Kein "COMPLETED" in Großbuchstaben. Keine aggressive Notification.
// ────────────────────────────────────────────────────────────────
export const SOFT_STATUS = {
  // Booking
  draft:            { text: "Wird vorbereitet …",        sub: null,                         color: "#888"    },
  requested:        { text: "Anfrage unterwegs",         sub: "Du wirst bald Antwort bekommen", color: "#F59E0B" },
  pending_response: { text: "Warten auf Rückmeldung",   sub: "Der Creator prüft deine Anfrage", color: "#F59E0B" },
  accepted:         { text: "Zusammenarbeit bestätigt ✓",sub: "Es geht los",                color: "#10B981" },
  declined:         { text: "Leider nicht möglich",     sub: "Probiere es mit einem anderen Creator", color: "#888" },
  scheduled:        { text: "Termin steht",              sub: "Die Zusammenarbeit ist geplant", color: "#16D7C5" },
  in_progress:      { text: "Ihr arbeitet gemeinsam",   sub: "Kreative Phase aktiv",        color: "#8B5CF6" },
  completed:        { text: "Zusammenarbeit abgeschlossen", sub: "Möchtest du eine Empfehlung schreiben?", color: "#10B981" },
  cancelled:        { text: "Nicht zustande gekommen",  sub: null,                         color: "#888"    },

  // Trust Events
  collaboration_completed: { text: "Neue kreative Verbindung",    color: "#10B981" },
  recommendation_received: { text: "Jemand empfiehlt dich weiter", color: "#FF8A6B" },
  repeat_client:           { text: "Wiederkehrende Zusammenarbeit", color: "#8B5CF6" },
};

// ────────────────────────────────────────────────────────────────
// AMBIENT GREETINGS — kontextsensitive Begrüßung
// Ersetzt generisches "Hallo" durch lebendige, zeitbasierte Stimmung
// ────────────────────────────────────────────────────────────────
export function getAmbientGreeting(displayName, options = {}) {
  const hour     = new Date().getHours();
  const firstName = displayName?.split(" ")[0] || "Creator";
  const { pendingBookings = 0, newMessages = 0, hasActiveCollab = false } = options;

  // Aktivitäts-basierte Begrüßung
  if (pendingBookings > 0) {
    return {
      greeting: `${firstName},`,
      sub:      `${pendingBookings} Anfrage${pendingBookings > 1 ? "n" : ""} wartet auf dich`,
      mood:     "active",
    };
  }
  if (newMessages > 0) {
    return {
      greeting: `${firstName},`,
      sub:      `${newMessages} neue Nachricht${newMessages > 1 ? "en" : ""}`,
      mood:     "connected",
    };
  }
  if (hasActiveCollab) {
    return {
      greeting: `${firstName},`,
      sub:      "Eure Zusammenarbeit läuft gerade",
      mood:     "creative",
    };
  }

  // Zeit-basiert
  if (hour < 6)  return { greeting: `Noch wach, ${firstName}?`, sub: "Die Nacht gehört den Kreativen", mood: "night" };
  if (hour < 11) return { greeting: `Guten Morgen, ${firstName}`, sub: "Was entsteht heute?", mood: "morning" };
  if (hour < 14) return { greeting: `${firstName},`, sub: "Lass dich heute inspirieren", mood: "midday" };
  if (hour < 18) return { greeting: `${firstName},`, sub: "Der kreative Nachmittag wartet", mood: "afternoon" };
  if (hour < 22) return { greeting: `${firstName},`, sub: "Schön, dass du wieder da bist", mood: "evening" };
  return { greeting: `${firstName},`, sub: "Ruhige kreative Zeit", mood: "night" };
}

// ────────────────────────────────────────────────────────────────
// useCreatorJourney — vollständige Reise eines Users
// Zeigt wo der User gerade in der Creator-Welt steht
// ────────────────────────────────────────────────────────────────
export function useCreatorJourney() {
  const { user } = useAuth();
  const [journey,  setJourney]  = useState(null);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);

    Promise.all([
      // Aktive Bookings
      supabase.from("bookings")
        .select("id, status, req_type, requester_id, creator_id")
        .or(`requester_id.eq.${user.id},creator_id.eq.${user.id}`)
        .in("status", ["accepted","scheduled","in_progress"])
        .limit(5),
      // Pending Bookings (als Creator)
      supabase.from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", user.id)
        .in("status", ["requested","pending_response"]),
      // Ungelesene Nachrichten
      supabase.from("messages")
        .select("id", { count: "exact", head: true })
        .eq("read", false)
        .neq("sender_id", user.id),
    ]).then(([activeRes, pendingRes, msgsRes]) => {
      setJourney({
        activeCollabs:   activeRes.data    || [],
        pendingBookings: pendingRes.count  || 0,
        unreadMessages:  msgsRes.count     || 0,
        hasActiveCollab: (activeRes.data?.length || 0) > 0,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  return { journey, loading };
}

// ────────────────────────────────────────────────────────────────
// useContextBreadcrumb — "Wo bin ich gerade?"
// Leichter Context-Stack für Overlay-Navigation
// ────────────────────────────────────────────────────────────────
export function useContextBreadcrumb() {
  const stackRef = useRef([]);

  const push = useCallback((context) => {
    // { label, type, id } — z.B. { label:"Mia Vogel", type:"profile", id:"abc" }
    stackRef.current = [...stackRef.current.slice(-3), context]; // max 4 Ebenen
  }, []);

  const pop = useCallback(() => {
    const next = [...stackRef.current];
    next.pop();
    stackRef.current = next;
    return next[next.length - 1] || null;
  }, []);

  const current = useCallback(() => {
    return stackRef.current[stackRef.current.length - 1] || null;
  }, []);

  const clear = useCallback(() => {
    stackRef.current = [];
  }, []);

  return { push, pop, current, clear };
}

// ────────────────────────────────────────────────────────────────
// TRANSITION TOKENS — einheitliche Animations-Kurven
// Alle UI-Übergänge verwenden diese Kurven
// GPU-beschleunigt, kein Stottern
// ────────────────────────────────────────────────────────────────
export const TRANSITIONS = {
  // Für Cards und Overlays
  overlay:   "cubic-bezier(0.22, 1, 0.36, 1)",
  // Für Buttons + Micro-Interactions
  spring:    "cubic-bezier(0.34, 1.4, 0.64, 1)",
  // Für Status-Wechsel
  soft:      "cubic-bezier(0.4, 0, 0.2, 1)",
  // Für sehr sanfte Übergänge
  breathe:   "cubic-bezier(0.45, 0.05, 0.55, 0.95)",

  // Dauern
  fast:      "120ms",
  normal:    "220ms",
  slow:      "380ms",
  verySlow:  "600ms",
};

// ────────────────────────────────────────────────────────────────
// AMBIENT CSS — globale Micro-Interaction Styles
// Einmal einbinden, überall nutzen
// ────────────────────────────────────────────────────────────────
export const AMBIENT_CSS = `
  /* ── Micro-Interactions ─────────────────────────────── */
  .hui-tap {
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
    transition: transform 120ms cubic-bezier(0.34,1.4,0.64,1),
                opacity   120ms ease;
    will-change: transform;
  }
  .hui-tap:active {
    transform: scale(0.96);
    opacity: 0.80;
  }

  /* ── Card Hover (Desktop) ────────────────────────────── */
  @media (hover: hover) {
    .hui-card-hover {
      transition: transform 220ms cubic-bezier(0.22,1,0.36,1),
                  box-shadow 220ms cubic-bezier(0.22,1,0.36,1);
    }
    .hui-card-hover:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.10);
    }
  }

  /* ── Fade-In Slides ──────────────────────────────────── */
  @keyframes huiSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes huiSlideDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes huiFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes huiScaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* ── Breathing (Orb, Indicators) ────────────────────── */
  @keyframes huiBreathe {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50%      { opacity: 1;   transform: scale(1.04); }
  }

  /* ── Status Pulse (sanft, nicht aggressiv) ───────────── */
  @keyframes huiStatusPulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.4; }
  }

  /* ── Shimmer Loading ─────────────────────────────────── */
  @keyframes huiShimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .hui-skeleton {
    background: linear-gradient(90deg,
      rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.03) 37%, rgba(0,0,0,0.06) 63%);
    background-size: 400% 100%;
    animation: huiShimmer 1.4s ease infinite;
    border-radius: 8px;
  }

  /* ── Soft Status Badge ───────────────────────────────── */
  .hui-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 11px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1px;
  }

  /* ── Journey Continuity Indicator ───────────────────── */
  .hui-context-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-size: 11px;
    font-weight: 500;
    color: rgba(0,0,0,0.45);
    background: rgba(0,0,0,0.03);
    border-radius: 50px;
  }
`;

// ────────────────────────────────────────────────────────────────
// SoftStatusBadge — emotionale Status-Anzeige
// Kein harter "COMPLETED" Text — sanft, menschlich
// ────────────────────────────────────────────────────────────────
export function getSoftStatus(bookingStatus) {
  return SOFT_STATUS[bookingStatus] || { text: bookingStatus, sub: null, color: "#888" };
}

// ────────────────────────────────────────────────────────────────
// useReturnVisitor — "meine kreative Umgebung wartet auf mich"
// Merkt sich letzten Kontext, begrüßt beim Wiederkommen
// ────────────────────────────────────────────────────────────────
export function useReturnVisitor(profile) {
  const [lastContext, setLastContext] = useState(null);
  const { journey } = useCreatorJourney();

  useEffect(() => {
    // Letzten Besuchskontext aus localStorage holen
    try {
      const stored = localStorage.getItem("hui_last_context");
      if (stored) setLastContext(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const saveContext = useCallback((ctx) => {
    try {
      localStorage.setItem("hui_last_context", JSON.stringify({
        ...ctx, savedAt: Date.now()
      }));
      setLastContext(ctx);
    } catch { /* ignore */ }
  }, []);

  // Letzten Kontext nur anzeigen wenn < 48h alt
  const relevantContext = lastContext &&
    (Date.now() - (lastContext.savedAt || 0)) < 48 * 3600 * 1000
    ? lastContext : null;

  return { relevantContext, saveContext, journey };
}
