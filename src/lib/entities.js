// src/lib/entities.js
// Generic table adapter — legacy compatibility layer
// Delegates to service layer where possible, otherwise uses safe defaults
import { supabase } from "./supabaseClient";
import { safeQuery } from "./perfUtils";

const makeAdapter = (tableName, defaultFields = null) => ({
  list: async (fields = defaultFields) => {
    const { data } = await safeQuery(
      supabase.from(tableName).select(fields || "id,created_at").order("created_at", { ascending: false }).limit(50)
    );
    return data || [];
  },
  get: async (id, fields = defaultFields) => {
    const { data } = await safeQuery(
      supabase.from(tableName).select(fields || "id,created_at").eq("id", id).single()
    );
    return data;
  },
  create: async (payload) => {
    const { data } = await safeQuery(
      supabase.from(tableName).insert(payload).select().single()
    );
    return data;
  },
  update: async (id, payload) => {
    const { data } = await safeQuery(
      supabase.from(tableName).update(payload).eq("id", id).select().single()
    );
    return data;
  },
  delete: async (id) => {
    const { error } = await safeQuery(supabase.from(tableName).delete().eq("id", id));
    return !error;
  },
  filter: async (params, fields = defaultFields, limit = 50) => {
    let query = supabase.from(tableName).select(fields || "id,created_at").limit(limit);
    Object.entries(params).forEach(([key, value]) => { query = query.eq(key, value); });
    const { data } = await safeQuery(query);
    return data || [];
  },
});

// Explicit field sets per table — no more select(*)
export const HuiWirker = makeAdapter("wirker",
  "id,user_id,name,full_name,talent,location,lat,lng,bio,img,header_img,hourly_rate,skills,recommendations,bookings,followers,impact_eur,verified"
);
export const HuiPayment = makeAdapter("payments",
  "id,user_id,wirker_id,amount,status,payment_status,created_at,stripe_session_id"
);
export const HuiMessage = makeAdapter("messages",
  "id,chat_id,sender_id,sender_name,text,read,message_type,created_at"
);
export const HuiImpactProject = makeAdapter("impact_projects",
  "id,name,category,description,icon,color,votes,status,goal_eur,awarded_eur,month,tags"
);
