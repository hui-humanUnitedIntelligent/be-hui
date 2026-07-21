// HUI Service Worker — v202507211418
// Strategie: Network First — JS/CSS Assets NIEMALS im SW-Cache
// Favicon v2: favicon.ico, favicon.png, favicon-16x16.png, favicon-32x32.png,
//             apple-touch-icon.png, hui-icon-192.png, hui-icon-512.png

const CACHE_NAME = "hui-v202507211418";

// Alle Icon-Assets vorladen (inkl. neuer Favicon-Dateien):
const ICON_ASSETS = [
  "/favicon.ico",
  "/favicon.png",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon-64x64.png",
  "/apple-touch-icon.png",
  "/hui-icon-192.png",
  "/hui-icon-512.png",
];

// Install: Sofort übernehmen, Icons vorladen
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
          if (k !== CACHE_NAME) {
            console.log("[HUI SW] Alter Cache gelöscht:", k);
            return caches.delete(k);
          }
        })
      ))
      .then(() => self.clients.claim())
      .then(async () => {
        // Alle offenen Tabs über SW-Update informieren
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
        if (e.request.mode === "navigate") {
          return caches.match("/index.html") || caches.match("/") ||
                 new Response("HUI ist offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        }
        return new Response("", { status: 503 });
      })
    );
    return;
  }

  // Icons + Favicons: Cache First (vorab beim Install gecacht)
  // ?v=2 Query-Parameter: Cache-URL normalisieren (URL ohne Query cachen)
  const urlWithoutQuery = url.split("?")[0];
  const isFavicon = ICON_ASSETS.some(asset => urlWithoutQuery.endsWith(asset));

  e.respondWith(
    caches.match(urlWithoutQuery).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && e.request.method === "GET") {
          // WICHTIG: erst klonen, DANN in Cache schreiben (clone-Bug vermeiden)
          const toCache = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            // Icons ohne Query-String cachen für konsistenten Cache-Key:
            if (isFavicon) {
              cache.put(new Request(urlWithoutQuery), toCache);
            } else {
              cache.put(e.request, toCache);
            }
          });
        }
        return res;
      }).catch(() => new Response("", { status: 503 }));
    })
  );
});

// Push Notifications (Icon aktualisiert):
self.addEventListener("push", (e) => {
  const data = e.data?.json() || { title: "HUI", body: "Neue Nachricht" };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/hui-icon-192.png",
      badge: "/favicon-32x32.png",
    })
  );
});
