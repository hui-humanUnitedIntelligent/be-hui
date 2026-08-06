// src/lib/pushDeepLinkHandler.js
// Verarbeitet Notification-Taps → navigiert zur richtigen Seite.
// Wird in App.jsx einmal registriert, hört auf 'hui:push:navigate'.

/**
 * Registriert den globalen Navigation-Handler für Push-Notification-Taps.
 * @param {Function} navigate - React Router navigate function
 * @param {Function} openProfileById - Funktion um ein Profil zu öffnen
 */
export function setupPushDeepLinkHandler(navigate, openProfileById) {
  window.addEventListener("hui:push:navigate", (e) => {
    const { entity_type, entity_id, action_url, data } = e.detail || {};
    console.log("[HUI_PUSH_DEEPLINK] Navigiere:", { entity_type, entity_id, action_url });

    // 1. action_url hat Priorität
    if (action_url && typeof action_url === "string" && action_url.startsWith("/")) {
      navigate(action_url);
      return;
    }

    // 2. entity_type → Route
    switch (entity_type) {
      case "chat":
        if (data?.entity_id) navigate(`/chat/${data.entity_id}`);
        else navigate("/chat");
        break;

      case "profile":
      case "connection":
        if (data?.sender_id) {
          openProfileById?.(data.sender_id);
        } else if (data?.entity_id) {
          openProfileById?.(data.entity_id);
        }
        break;

      case "booking":
        // Geht zum Profil des Buchenden oder zur Buchungsverwaltung
        navigate("/home", { state: { openBookings: true } });
        break;

      case "work":
      case "experience":
      case "talent":
      case "project":
      case "moment":
        // Feed öffnen und zum Item scrollen — oder direkt öffnen
        if (data?.entity_id) {
          navigate("/home", { state: { highlightId: data.entity_id, highlightType: entity_type } });
        } else {
          navigate("/home");
        }
        break;

      case "order":
      case "purchase":
        navigate("/home", { state: { openFinances: true } });
        break;

      case "impact":
        navigate("/home", { state: { openImpact: true } });
        break;

      default:
        // Unbekannter Typ → Startseite
        navigate("/home");
    }
  });
}
