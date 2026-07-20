// HUI Service Worker — v2026-07-20
// Strategie: Network First mit Cache Fallback
// Live-Updates: funktionieren sofort ohne App-Store-Update

const CACHE_NAME = "hui-v20260720";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json",
  "/hui-icon-192.png", "/hui-icon-512.png"];

// Install: statische Assets cachen
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: alte Caches löschen
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Network First — Live-Updates funktionieren immer
self.addEventListener("fetch", (e) => {
  // API-Calls (Supabase) nie cachen
  if (e.request.url.includes("supabase.co") ||
      e.request.url.includes("/rest/v1/") ||
      e.request.url.includes("/auth/")) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Frische Antwort in Cache speichern
        if (res && res.status === 200 && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request)) // Fallback: Cache
  );
});

// Push Notifications (vorbereitet)
self.addEventListener("push", (e) => {
  const data = e.data?.json() || { title: "HUI", body: "Neue Nachricht" };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/hui-icon-192.png",
      badge: "/hui-icon-192.png",
    })
  );
});
