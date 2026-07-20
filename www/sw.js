// HUI Service Worker — v202607201957
// Strategie: Network First — JS/CSS Assets NIEMALS im SW-Cache
// Cache-Control Headers via Vercel regeln das Browser-Caching direkt.

const CACHE_NAME = "hui-v202607201957";
const ICON_ASSETS = ["/hui-icon-192.png", "/hui-icon-512.png"];

// Install: Sofort übernehmen, nur Icons cachen
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ICON_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: ALLE alten Caches sofort löschen + Clients übernehmen
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.map(k => {
          // Alle alten Caches löschen (auch alte hui-v* Caches)
          if (k !== CACHE_NAME) {
            console.log("[HUI SW] Alter Cache gelöscht:", k);
            return caches.delete(k);
          }
        })
      ))
      .then(() => self.clients.claim())
      .then(async () => {
        // Alle offenen Tabs anweisen die Seite neu zu laden
        const allClients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
        allClients.forEach(client => {
          client.postMessage({ type: "SW_UPDATED", version: CACHE_NAME });
        });
      })
  );
});

// Fetch: Network First für ALLES — kein SW-Caching von HTML/JS/CSS/JSON
self.addEventListener("fetch", (e) => {
  const url = e.request.url;

  // Supabase/Auth-Calls: direkt durchlassen (kein SW-Eingriff)
  if (url.includes("supabase.co") || url.includes("/rest/v1/") || url.includes("/auth/")) {
    return;
  }

  // HTML, JS, CSS, JSON → IMMER vom Netzwerk, NIEMALS aus SW-Cache
  if (
    e.request.mode === "navigate" ||
    url.includes("/assets/") ||
    url.endsWith(".js") ||
    url.endsWith(".css") ||
    url.endsWith(".html") ||
    url.endsWith(".json")
  ) {
    e.respondWith(
      fetch(e.request, { cache: "no-store" }).catch(() => {
        // Offline: Navigation-Fallback auf gecachte index.html (falls vorhanden)
        if (e.request.mode === "navigate") {
          return caches.match("/index.html") || caches.match("/") ||
                 new Response("HUI ist offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        }
        return new Response("", { status: 503 });
      })
    );
    return;
  }

  // Icons + sonstige statische Binaries: Network First + Cache-Fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && e.request.method === "GET") {
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push Notifications
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
