# HUI i18n System

## Architektur

- **Lokale JS-Dateien** — KEIN Supabase-Fetch, KEIN async, KEIN Network-Request
- **EAGER imports** — KEIN `React.lazy`, KEIN `dynamic import()`, KEIN `Suspense`
- **7 Sprachen**: Deutsch (Basis), English, Français, Español, Italiano, Türkçe, Português
- **Key-basiert** — jeder Text hat einen eindeutigen Key (z.B. `nav.home`, `profile.edit`)

## Dateistruktur

```
src/i18n/
  index.js      ← t() Funktion, detectSystemLang(), SUPPORTED_LANGS, LANG_LABELS, LANG_FLAGS
  de.js         ← Deutsch (Basis — SSOT für alle Keys)
  en.js         ← Englisch
  fr.js         ← Französisch
  es.js         ← Spanisch
  it.js         ← Italienisch
  tr.js         ← Türkisch
  pt.js         ← Portugiesisch
src/hooks/
  useTranslation.js  ← React Hook: { t, lang, changeLang, supportedLangs }
src/components/
  LangSwitcher.jsx   ← Sprachumschalter-Dropdown
```

## Wie neue Texte hinzugefügt werden

### 1. Key in `de.js` hinzufügen (Basis-Sprache)

```js
export default {
  'nav.home': 'Heute auf HUI',
  'nav.discover': 'Entdecken',
  'profile.edit': 'Profil bearbeiten',
  // NEU:
  'werke.create': 'Werk erstellen',
};
```

### 2. In allen anderen Sprachdateien hinzufügen

```js
// en.js
export default {
  'nav.home': 'Today on HUI',
  'nav.discover': 'Discover',
  'profile.edit': 'Edit Profile',
  'werke.create': 'Create Work',
};
```

### 3. In der Komponente verwenden

```jsx
import { useTranslation } from '../hooks/useTranslation.js';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('werke.create')}</h1>;
}
```

## Key-Namenskonvention

- **Punkt-Notation**: `bereich.unterbereich.aktion`
- **Beispiele**:
  - `nav.home`, `nav.discover`, `nav.profile`
  - `profile.edit`, `profile.settings`
  - `werke.create`, `werke.buy`, `werke.sell`
  - `impact.vote`, `impact.results`
  - `chat.send`, `chat.placeholder`
  - `common.cancel`, `common.save`, `common.delete`

## Spracherkennung

1. `localStorage.getItem('hui_lang')` — Nutzer-Auswahl (höchste Priorität)
2. `navigator.language` — Browser/OS-Sprache
3. `'de'` — Fallback (Deutsch als Default)

## White-Screen-Prävention

- Alle Sprachdateien sind **eager imports** — geladen beim Bundle, nicht zur Laufzeit
- KEIN `React.lazy` für i18n-Komponenten
- KEIN `dynamic import()` für Sprachdateien
- KEIN globaler Provider-Wrap um App/Router
- Die `t()` Funktion ist **synchron** — kein Promise, kein async/await
- Fallback bei fehlendem Key: zeigt den Key selbst + `console.warn`

## Was NICHT zu tun ist

- ❌ `React.lazy(() => import('./i18n/de.js'))` — White Screen Falle
- ❌ `const t = await import('./i18n')` — async → Suspense → Hang
- ❌ Supabase `i18n_translations` Tabelle abfragen — Network-Request → async → Hang
- ❌ `i18next` oder `react-i18next` — externe Abhängigkeit, eigener Provider
- ❌ Globaler `<I18nProvider>` um `<App>` — verändert Modulgraph, Chunk-Hashes
- ❌ `Suspense fallback={null}` — unsichtbare Fehler

---

## Wenn du eine neue Komponente baust:

SCHRITT 1 — Import:
```js
import { useTranslation } from '../hooks/useTranslation.js';
const { t } = useTranslation();
```

SCHRITT 2 — Kein hardcodierter Text in JSX:
```jsx
❌ <button>Speichern</button>
✅ <button>{t('common.save')}</button>
```

SCHRITT 3 — Key in de.js eintragen:
```js
'common.save': 'Speichern',
```

SCHRITT 4 — Alle 6 Sprachen eintragen:
```js
en.js: 'common.save': 'Save'
fr.js: 'common.save': 'Enregistrer'
es.js: 'common.save': 'Guardar'
it.js: 'common.save': 'Salva'
tr.js: 'common.save': 'Kaydet'
pt.js: 'common.save': 'Salvar'
```

SCHRITT 5 — Vollständigkeits-Check:
In DEV-Modus: `checkTranslationCompleteness()` läuft automatisch beim Start und warnt bei fehlenden Keys.

## Variablen in Texten:
```js
'profile.greeting': 'Hallo {name}!'
```
```jsx
t('profile.greeting', { name: 'Anna' })
```

## Eigennamen — NIE übersetzen:
- HUI
- Impact
- Wirker (nur in DE)

## Immer auf Deutsch lassen:
"Einer für alle, Alle (Fair)eint!" (hui.slogan)
