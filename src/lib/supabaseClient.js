import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Real Supabase client — only if env vars are present
const _supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ─── Auth ───────────────────────────────────────────────────────────
// Provide a safe no-op auth object when Supabase is not configured
export const supabase = _supabase || {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ error: { message: "Supabase not configured" } }),
    signUp: async () => ({ error: { message: "Supabase not configured" } }),
    signOut: async () => ({}),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({ select: () => ({ data: [], error: null }) }),
};

// ─── DB helpers (backwards-compatible with old proxy pattern) ───────
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

export const HuiWirkerDB = makeAdapter("wirker");
export const HuiPaymentDB = makeAdapter("payments");
export const HuiMessageDB = makeAdapter("messages");
export const HuiImpactProjectDB = makeAdapter("impact_projects");