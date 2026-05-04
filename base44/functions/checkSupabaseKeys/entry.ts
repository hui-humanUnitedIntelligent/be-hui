import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { accessToken } = await base44.asServiceRole.connectors.getConnection("supabase");

    const projectsRes = await fetch("https://api.supabase.com/v1/projects", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const projects = await projectsRes.json();

    if (!Array.isArray(projects) || projects.length === 0) {
      return Response.json({ error: "Keine Supabase-Projekte gefunden." }, { status: 404 });
    }

    const results = await Promise.all(projects.map(async (project) => {
      const keysRes = await fetch(`https://api.supabase.com/v1/projects/${project.ref}/api-keys`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const keys = await keysRes.json();
      const supabaseUrl = `https://${project.ref}.supabase.co`;
      const keyMap = {};
      if (Array.isArray(keys)) {
        keys.forEach(k => {
          if (k.name === 'anon') keyMap.anon_key = k.api_key;
          if (k.name === 'service_role') keyMap.service_role_key = k.api_key;
        });
      }
      return {
        project_name: project.name,
        project_ref: project.ref,
        region: project.region,
        status: project.status,
        supabase_url: supabaseUrl,
        anon_key: keyMap.anon_key || null,
        service_role_key: keyMap.service_role_key || null,
      };
    }));

    return Response.json({ projects: results, count: projects.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});