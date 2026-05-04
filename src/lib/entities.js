import { supabaseProxy } from "@/functions/supabaseProxy";

const makeAdapter = (tableName) => ({
  list: async () => {
    const res = await supabaseProxy({ table: tableName, action: "list" });
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
  filter: async (params) => {
    const res = await supabaseProxy({ table: tableName, action: "list", query: params });
    return res.data?.data || [];
  },
});

export const HuiWirker = makeAdapter("wirker");
export const HuiPayment = makeAdapter("payments");
export const HuiMessage = makeAdapter("messages");
export const HuiImpactProject = makeAdapter("impact_projects");