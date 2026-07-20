// HUI Service Worker — v202607201954
// Strategie: Network First — JS/CSS Assets NIEMALS im Cache (Chunks sind hash-benannt)
// Live-Updates: funktionieren sofort ohne App-Store-Update

const CACHE_NAME = "hui-v202607201954";
// Nur wirklich statische Assets cachen (keine JS-Chunks):
const STATIC_ASSETS = ["/hui-icon-192.png", "/hui-icon-512.png"];

// Install: nur Icons cachen — KEIN index.html, KEIN manifest.json, KEINE JS-Chunks
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: alle alten Caches löschen + Clients übernehmen
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(async keys => {
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
      await self.clients.claim();
      // Alle Tabs anweisen die Seite neu zu laden
      const allClients = await self.clients.matchAll({ includeUncontrolled: true });
      allClients.forEach(client => client.postMessage({ type: "SW_UPDATED", cache: CACHE_NAME }));
    })
  );
});

// Fetch: Network First — JS/CSS/HTML IMMER frisch vom Netzwerk
self.addEventListener("fetch", (e) => {
  const url = e.request.url;

  // API-Calls (Supabase/Auth) immer direkt durchlassen:
  if (url.includes("supabase.co") || url.includes("/rest/v1/") || url.includes("/auth/")) {
    return;
  }

  // JS-Chunks, CSS, HTML, JSON → IMMER vom Netzwerk (nie aus Cache):
  if (url.includes("/assets/") || url.endsWith(".js") || url.endsWith(".css") ||
      url.endsWith(".html") || url.endsWith("manifest.json") || url.endsWith(".json")) {
    e.respondWith(
      fetch(e.request).catch(() => {
        // Offline-Fallback für Navigation: index.html aus Cache (falls vorhanden)
        if (e.request.mode === "navigate") {
          return caches.match("/") || new Response("Offline", { status: 503 });
        }
        return new Response("", { status: 503 });
      })
    );
    return;
  }

  // Icons + sonstige statische Binaries: Network First mit Cache-Fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && e.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
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
