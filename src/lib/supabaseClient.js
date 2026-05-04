import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxztrhvhcxhmunhhkfjd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4enRyaHZoY3hobXVuaGhrZmpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4ODI2NDIsImV4cCI6MjA5MzQ1ODY0Mn0.cq8E_NQkmeTZPIe0G0SSqEzzg6yJhyce5xpW2iwVIbk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper functions to match Base44 entity API pattern
export const SupabaseEntity = (tableName) => ({
  list: async (orderBy = 'created_at', limit) => {
    let q = supabase.from(tableName).select('*').order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data || [];
  },

  filter: async (filters, orderBy = 'created_at', limit) => {
    let q = supabase.from(tableName).select('*');
    Object.entries(filters).forEach(([key, value]) => {
      q = q.eq(key, value);
    });
    q = q.order(orderBy.replace('-', ''), { ascending: !orderBy.startsWith('-') });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data || [];
  },

  get: async (id) => {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
  },

  create: async (record) => {
    const { data, error } = await supabase.from(tableName).insert(record).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  update: async (id, updates) => {
    const { data, error } = await supabase.from(tableName).update(updates).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
});

// Supabase-backed entities
export const HuiWirkerDB = SupabaseEntity('hui_wirker');
export const HuiPaymentDB = SupabaseEntity('hui_payment');
export const HuiMessageDB = SupabaseEntity('hui_message');
export const HuiImpactProjectDB = SupabaseEntity('hui_impact_project');