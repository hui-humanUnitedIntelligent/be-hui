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
      return {
        project_name: project.name,
        project_ref: project.ref,
        region: project.region,
        status: project.status,
        api_keys: Array.isArray(keys) ? keys.map(k => ({
          name: k.name,
          key_preview: k.api_key ? `${k.api_key.slice(0, 8)}...${k.api_key.slice(-4)}` : "—",
          tags: k.tags || []
        })) : { error: "Fehler beim Laden", raw: keys }
      };
    }));

    return Response.json({ projects: results, count: projects.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});