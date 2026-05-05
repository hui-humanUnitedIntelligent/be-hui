import { supabaseProxy } from "@/functions/supabaseProxy";

// Token storage
const TOKEN_KEY = 'hui_auth_token';

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function storeToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Auth listeners
const authListeners = [];
function notifyListeners(event, session) {
  authListeners.forEach(fn => fn(event, session));
}

// Proxy-based Supabase auth object
const auth = {
  _session: null,

  async getSession() {
    const token = getStoredToken();
    if (!token) return { data: { session: null }, error: null };
    const res = await supabaseProxy({
      action: 'auth.getSession',
      _authToken: token
    });
    const session = res.data?.data?.session || null;
    this._session = session;
    return { data: { session }, error: null };
  },

  async signInWithPassword({ email, password }) {
    const res = await supabaseProxy({ action: 'auth.signIn', email, password });
    if (res.data?.error) return { data: null, error: { message: res.data.error } };
    const session = res.data?.data?.session || null;
    const user = res.data?.data?.user || null;
    if (session?.access_token) storeToken(session.access_token);
    this._session = session;
    notifyListeners('SIGNED_IN', session);
    return { data: { session, user }, error: null };
  },

  async signUp({ email, password, options }) {
    const fullName = options?.data?.full_name || '';
    const res = await supabaseProxy({ action: 'auth.signUp', email, password, fullName });
    if (res.data?.error) return { data: null, error: { message: res.data.error } };
    return { data: res.data?.data, error: null };
  },

  async signOut() {
    storeToken(null);
    this._session = null;
    notifyListeners('SIGNED_OUT', null);
  },

  onAuthStateChange(callback) {
    authListeners.push(callback);
    // immediately fire with current state
    this.getSession().then(({ data: { session } }) => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
    });
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const idx = authListeners.indexOf(callback);
            if (idx > -1) authListeners.splice(idx, 1);
          }
        }
      }
    };
  }
};

// DB adapter via proxy
function makeAdapter(tableName) {
  return {
    list: async () => {
      const res = await supabaseProxy({ table: tableName, action: "list" });
      return res.data?.data || [];
    },
    filter: async (query) => {
      const res = await supabaseProxy({ table: tableName, action: "list", query });
      return res.data?.data || [];
    },
    get: async (id) => {
      const res = await supabaseProxy({ table: tableName, action: "list", query: { id } });
      return (res.data?.data || [])[0] || null;
    },
    create: async (payload) => {
      const res = await supabaseProxy({ table: tableName, action: "create", data: payload });
      return res.data?.data;
    },
    update: async (id, payload) => {
      const res = await supabaseProxy({ table: tableName, action: "update", id, data: payload });
      return res.data?.data;
    },
    delete: async (id) => {
      const res = await supabaseProxy({ table: tableName, action: "delete", id });
      return res.data?.data;
    },
  };
}

export const HuiWirkerDB = makeAdapter("wirker");
export const HuiPaymentDB = makeAdapter("payments");
export const HuiMessageDB = makeAdapter("messages");
export const HuiImpactProjectDB = makeAdapter("impact_projects");

// Chainable query builder
function makeQueryBuilder(table, action, payload = null) {
  const state = { query: {}, singleResult: false, _payload: payload };

  const builder = {
    eq(col, val) {
      state.query[col] = val;
      return builder;
    },
    or(filter) {
      // Parse simple "col.eq.val,col2.eq.val2" patterns
      state._orFilter = filter;
      return builder;
    },
    order(col, opts) {
      state._order = { col, ascending: opts?.ascending !== false };
      return builder;
    },
    single() {
      state.singleResult = true;
      return builder;
    },
    then(resolve, reject) {
      return builder._execute().then(resolve, reject);
    },
    async _execute() {
      try {
        const res = await supabaseProxy({ table, action, query: state.query, data: state._payload });
        let data = res.data?.data || (action === 'list' ? [] : null);
        if (state.singleResult && Array.isArray(data)) data = data[0] || null;
        return { data, error: null };
      } catch (e) {
        return { data: null, error: { message: e.message } };
      }
    }
  };
  return builder;
}

// Supabase-style object for pages/Admin compatibility
export const supabase = {
  auth,
  from: (table) => ({
    select: (cols) => makeQueryBuilder(table, 'list'),
    insert: async (payload) => {
      const res = await supabaseProxy({ table, action: "create", data: payload });
      return { data: res.data?.data, error: null };
    },
    update: (payload) => ({
      eq: async (col, val) => {
        const res = await supabaseProxy({ table, action: "update", id: val, data: payload });
        return { data: res.data?.data, error: null };
      },
    }),
    delete: () => ({
      eq: async (col, val) => {
        const res = await supabaseProxy({ table, action: "delete", id: val });
        return { data: null, error: null };
      },
    }),
  }),
};