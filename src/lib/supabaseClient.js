import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

// ─── Supabase Client mit expliziten Auth-Optionen ─────────────────────
// persistSession: true  → Session in localStorage schreiben (Reload-sicher)
// autoRefreshToken: true → Token automatisch refreshen bevor er abläuft
// detectSessionInUrl: true → OAuth Callback aus URL parsen
// storageKey: eindeutiger Key → kein Konflikt mit anderen Supabase-Projekten
// storage: localStorage explicite → kein versehentlicher sessionStorage-Fallback
//          (Safari PWA verwendet sonst manchmal sessionStorage → geht bei Reload verloren)
// ── STORAGE-BRIDGE-BYPASS (2026-09-06, STORAGE-NET-001) ────────────────
// BEWEISLAGE ( Karens Samsung, 16:20-16:25 UTC, v2.1.554, Fehler-Report
// 9f01849c): Moment-Foto-Upload scheiterte mit rawem Netzwerk-Fehler-Event
// ("{"isTrusted":true}") — zurückverfolgt in die CapacitorHttp-native-bridge
// (readFileAsBase64: reader.onerror = reject reicht das ProgressEvent als
// Rejection durch, storage-js stringifyt es). Dieselbe Pipeline hat seit
// Wochen 4 dokumentierte Fehlerklassen produziert: ArrayBuffer→"{}" (2
// Bytes), Uint8Array→UTF-8-mangled (EF BF BD), Blob-Korruptionen, und jetzt
// FileReader-Fehler bei echten Kamera-/Galerie-Dateien — während
// synthetisierte/kleine Dateien durchgehen.
//
// FIX: Storage-API-Requests (/storage/v1/*) laufen NICHT durch die
// CapacitorHttp-Bridge, sondern über die ORIGINALE WebView-fetch
// (window.CapacitorWebFetch — von der Bridge selbst vor dem Patch
// gespeichert). FormData wird dort nativ im Chromium-Netzwerk-Stack
// verarbeitet: kein FileReader, kein base64, kein okhttp-Rebuild. Die
// WebView kann die Datei nachweislich lesen (Preview via createObjectURL
// funktionierte bei Karen). DB/Auth/Functions-Requests bleiben auf der
// Bridge (funktionieren dort nachweislich stabil).
const _storageFetch = (input, init) => {
  let url = "";
  if (typeof input === "string") url = input;
  else if (input && input.url)   url = input.url;
  const isStorageCall = url.includes("/storage/v1/");
  const nativeFetch   = (typeof window !== "undefined" && window.CapacitorWebFetch) || null;
  if (isStorageCall && nativeFetch) return nativeFetch(input, init);
  return fetch(input, init);
};

const _supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession:     true,
        autoRefreshToken:   true,
        detectSessionInUrl: true,
        storageKey:         "hui-auth-token",
        storage:            typeof window !== "undefined" ? window.localStorage : undefined,
        flowType:           "pkce",   // sicherster Flow, funktioniert auch in PWA/Safari
      },
      global: { fetch: _storageFetch },
    })
  : null;

// ─── Safe No-Op Fallback (wenn env vars fehlen) ───────────────────────
// onAuthStateChange muss sofort INITIAL_SESSION mit null senden
// damit AuthContext nicht dauerhaft in loadingAuth=true hängt
const _noopAuth = {
  getSession:           async () => ({ data: { session: null }, error: null }),
  signInWithPassword:   async () => ({ error: { message: "Supabase nicht konfiguriert" } }),
  signUp:               async () => ({ error: { message: "Supabase nicht konfiguriert" } }),
  signOut:              async () => ({}),
  getUser:              async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: (cb) => {
    // Sofort INITIAL_SESSION mit null feuern — AuthContext kann dadurch
    // loadingAuth=false setzen statt 10s zu warten
    setTimeout(() => cb("INITIAL_SESSION", null), 0);
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
};

// ─── Warnung wenn nicht konfiguriert ─────────────────────────────
if (!_supabase) {
  console.error(
    "⚠️ [HUI Supabase] NICHT KONFIGURIERT — VITE_SUPABASE_URL und/oder " +
    "VITE_SUPABASE_ANON_KEY fehlen. " +
    "→ Vercel: Settings → Environment Variables prüfen. " +
    "→ Lokal: .env.local Datei mit VITE_SUPABASE_URL=https://xxx.supabase.co anlegen."
  );
}

const _noopError = { message: "Supabase nicht konfiguriert — VITE_SUPABASE_URL fehlt in Vercel", code: "SUPABASE_NOT_CONFIGURED" };

export const supabase = _supabase || {
  auth:  _noopAuth,
  // Noop gibt jetzt erkennbaren Error zurück statt leerem Array
  // → loadFeed sieht den Fehler und zeigt ihn im UI an
  from:  () => {
    const chain = {
      select:  () => { chain._isSelect=true; return chain; },
      insert:  () => Promise.resolve({ data: null, error: _noopError }),
      update:  () => Promise.resolve({ data: null, error: _noopError }),
      upsert:  () => Promise.resolve({ data: null, error: _noopError }),
      delete:  () => Promise.resolve({ data: null, error: _noopError }),
      order:   () => chain,
      range:   () => chain,
      limit:   () => chain,
      eq:      () => chain,
      neq:     () => chain,
      in:      () => chain,
      or:      () => chain,
      single:  () => Promise.resolve({ data: null, error: _noopError }),
      // select gibt am Ende Promise mit error zurück
      then:    (resolve) => resolve({ data: null, error: _noopError }),
    };
    return chain;
  },
  storage: {
    from: () => ({
      upload:     async () => ({ error: _noopError }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
      listBuckets:  async () => ({ data: [], error: _noopError }),
    }),
    listBuckets: async () => ({ data: [], error: _noopError }),
  },
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
  }),
  removeChannel: () => {},
};

// ─── DB helpers (backwards-compatible) ──────────────────────────────
function makeAdapter(tableName) {
  return {
    list: async () => {
      if (!_supabase) return [];
      const { data, error } = await _supabase.from(tableName).select("*").limit(200);
      if (error) { console.error(error); return []; }
      return data || [];
    },
    filter: async (query) => {
      if (!_supabase) return [];
      let req = _supabase.from(tableName).select("*");
      if (query) Object.entries(query).forEach(([k, v]) => { req = req.eq(k, v); });
      const { data, error } = await req.limit(200);
      if (error) { console.error(error); return []; }
      return data || [];
    },
    get: async (id) => {
      if (!_supabase) return null;
      const { data, error } = await _supabase.from(tableName).select("*").eq("id", id).single();
      if (error) return null;
      return data;
    },
    create: async (payload) => {
      if (!_supabase) return null;
      const { data, error } = await _supabase.from(tableName).insert(payload).select().single();
      if (error) { console.error(error); return null; }
      return data;
    },
    update: async (id, payload) => {
      if (!_supabase) return null;
      const { data, error } = await _supabase.from(tableName).update(payload).eq("id", id).select().single();
      if (error) { console.error(error); return null; }
      return data;
    },
    delete: async (id) => {
      if (!_supabase) return null;
      const { error } = await _supabase.from(tableName).delete().eq("id", id);
      if (error) console.error(error);
      return null;
    },
  };
}

export const HuiWirkerDB       = makeAdapter("wirker");
export const HuiPaymentDB      = makeAdapter("payments");
export const HuiMessageDB      = makeAdapter("messages");
export const HuiImpactProjectDB = makeAdapter("impact_projects");
