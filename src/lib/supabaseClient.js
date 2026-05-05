import { supabaseProxy } from "@/functions/supabaseProxy";

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
    // Supabase-style chaining for pages/Admin compatibility
    from: null,
  };
}

// Named DB adapters for entities
export const HuiWirkerDB = makeAdapter("wirker");
export const HuiPaymentDB = makeAdapter("payments");
export const HuiMessageDB = makeAdapter("messages");
export const HuiImpactProjectDB = makeAdapter("impact_projects");

// Supabase-style proxy object for pages/Admin which uses supabase.from("table").select("*")
export const supabase = {
  from: (table) => ({
    select: async (cols = "*") => {
      const res = await supabaseProxy({ table, action: "list" });
      return { data: res.data?.data || [], error: null };
    },
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