**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

Run the app: `npm run dev`

**Feed Runtime Debug auf iPad verwenden**

Die Feed-Runtime-Diagnostik sammelt Scroll-, Pagination- und Observer-Messwerte für Safari/WebKit-Tests. Sie ändert keine Feed-Logik und fügt keine neuen Messwerte hinzu — sie macht den bestehenden Debug-Export auf dem iPad ohne DevTools nutzbar.

1. App im **DEV-Modus** starten (`npm run dev`)
2. Auf dem iPad in Safari die Dev-URL öffnen
3. In der Browser-Konsole (oder per Bookmarklet) aktivieren:

```javascript
localStorage.setItem('hui_feed_debug', '1');
location.reload();
```

4. Unten rechts erscheint ein kleines **Feed Debug**-Menü mit:
   - **Export Debug Report** — lädt `hui-feed-debug-YYYY-MM-DD-HHMM.json` herunter
   - **Copy Debug Report** — kopiert den vollständigen JSON-Report in die Zwischenablage
   - **Reset Debug** — leert alle Runtime-Messungen

Alternativ in DevTools: `window.__HUI_FEED_DEBUG__.export()`

Deaktivieren:

```javascript
localStorage.removeItem('hui_feed_debug');
location.reload();
```

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)

<!-- deploy trigger 1777973743 -->

