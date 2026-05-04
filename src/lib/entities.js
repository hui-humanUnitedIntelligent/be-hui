import { supabase } from "./supabaseClient";

const makeAdapter = (tableName) => ({
  list: async () => {
    const { data, error } = await supabase.from(tableName).select("*");
    if (error) { console.error(tableName, error); return []; }
    return data || [];
  },
  get: async (id) => {
    const { data, error } = await supabase.from(tableName).select("*").eq("id", id).single();
    if (error) { console.error(tableName, error); return null; }
    return data;
  },
  create: async (payload) => {
    const { data, error } = await supabase.from(tableName).insert(payload).select().single();
    if (error) { console.error(tableName, error); return null; }
    return data;
  },
  update: async (id, payload) => {
    const { data, error } = await supabase.from(tableName).update(payload).eq("id", id).select().single();
    if (error) { console.error(tableName, error); return null; }
    return data;
  },
  delete: async (id) => {
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (error) { console.error(tableName, error); return false; }
    return true;
  },
  filter: async (params) => {
    let query = supabase.from(tableName).select("*");
    Object.entries(params).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query;
    if (error) { console.error(tableName, error); return []; }
    return data || [];
  },
});

export const HuiWirker = makeAdapter("wirker");
export const HuiPayment = makeAdapter("payments");
export const HuiMessage = makeAdapter("messages");
export const HuiImpactProject = makeAdapter("impact_projects");
