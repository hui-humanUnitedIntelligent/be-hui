import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useImpactProjects(status = null) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      let query = supabase.from('impact_projects').select('*').order('votes', { ascending: false })
      if (status) query = query.eq('status', status)
      const { data } = await query
      setProjects(data || [])
      setLoading(false)
    }
    load()
  }, [status])

  const vote = async (projectId, userId) => {
    // Vote zählen
    const { data: project } = await supabase
      .from('impact_projects').select('votes').eq('id', projectId).single()
    if (project) {
      await supabase.from('impact_projects')
        .update({ votes: (project.votes || 0) + 1 })
        .eq('id', projectId)
      setProjects(prev => prev.map(p =>
        p.id === projectId ? { ...p, votes: (p.votes || 0) + 1 } : p
      ))
    }
  }

  return { projects, loading, vote }
}
