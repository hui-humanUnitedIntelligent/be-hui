import { supabaseProxy } from "@/functions/supabaseProxy";

// Adapter that mimics the entity API (list, create, update, delete)
function makeAdapter(table) {
  return {
    list: async () => {
      const res = await supabaseProxy({ table, action: "list" });
      return res.data?.data || [];
    },
    filter: async (query) => {
      const res = await supabaseProxy({ table, action: "list", query });
      return res.data?.data || [];
    },
    create: async (data) => {
      const res = await supabaseProxy({ table, action: "create", data });
      return res.data?.data;
    },
    update: async (id, data) => {
      const res = await supabaseProxy({ table, action: "update", id, data });
      return res.data?.data;
    },
    delete: async (id) => {
      const res = await supabaseProxy({ table, action: "delete", id });
      return res.data?.data;
    },
  };
}

export const HuiWirkerDB = makeAdapter("wirker");
export const HuiPaymentDB = makeAdapter("payments");
export const HuiImpactProjectDB = makeAdapter("impact_projects");
export const HuiMessageDB = makeAdapter("messages");