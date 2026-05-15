import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── Supabase Client mit expliziten Auth-Optionen ─────────────────────
// persistSession: true  → Session in localStorage schreiben (Reload-sicher)
// autoRefreshToken: true → Token automatisch refreshen bevor er abläuft
// detectSessionInUrl: true → OAuth Callback aus URL parsen
// storageKey: eindeutiger Key → kein Konflikt mit anderen Supabase-Projekten
// storage: localStorage explicite → kein versehentlicher sessionStorage-Fallback
//          (Safari PWA verwendet sonst manchmal sessionStorage → geht bei Reload verloren)
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

export const supabase = _supabase || {
  auth:  _noopAuth,
  from:  () => ({
    select:  () => Promise.resolve({ data: [],   error: null }),
    insert:  () => Promise.resolve({ data: null, error: null }),
    update:  () => Promise.resolve({ data: null, error: null }),
    upsert:  () => Promise.resolve({ data: null, error: null }),
    delete:  () => Promise.resolve({ data: null, error: null }),
  }),
};

// ─── DB helpers (backwards-compatible) ──────────────────────────────
function makeAdapter(tableName) {
  return {
    list: async () => {
      if (!_supabase) return [];
      const { data, error } = await _supabase.from(tableName).select("*");
      if (error) { console.error(error); return []; }
      return data || [];
    },
    filter: async (query) => {
      if (!_supabase) return [];
      let req = _supabase.from(tableName).select("*");
      if (query) Object.entries(query).forEach(([k, v]) => { req = req.eq(k, v); });
      const { data, error } = await req;
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
