import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const wirkerAPI = {
  getAll: () => supabase.from('wirker').select('*'),
  getById: (id) => supabase.from('wirker').select('*').eq('id', id).single(),
  search: (query) => supabase.from('wirker').select('*').ilike('name', `%${query}%`),
  getVerified: () => supabase.from('wirker').select('*').eq('verified', true),
}

export const projectsAPI = {
  getAll: () => supabase.from('impact_projects').select('*'),
  getActive: () => supabase.from('impact_projects').select('*').eq('status', 'active'),
  vote: (id) => supabase.rpc('increment_votes', { project_id: id }),
}

export const paymentsAPI = {
  create: (data) => supabase.from('payments').insert(data),
  getByUser: (userId) => supabase.from('payments').select('*').eq('user_id', userId),
}

export const messagesAPI = {
  getByChat: (chatId) => supabase.from('messages').select('*').eq('chat_id', chatId).order('created_at'),
  send: (data) => supabase.from('messages').insert(data),
}
