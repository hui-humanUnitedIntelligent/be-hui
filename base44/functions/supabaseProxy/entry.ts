import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

// Anon client for auth operations (respects RLS & auth flows)
const supabaseAnon = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_ANON_KEY")
);

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { action } = body;

    // --- AUTH ACTIONS ---
    if (action === 'auth.signIn') {
      const { email, password } = body;
      const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
      if (error) return Response.json({ error: error.message }, { status: 401 });
      return Response.json({ data });
    }

    if (action === 'auth.signUp') {
      const { email, password, fullName } = body;
      const { data, error } = await supabaseAnon.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } }
      });
      if (error) return Response.json({ error: error.message }, { status: 400 });
      return Response.json({ data });
    }

    if (action === 'auth.getSession') {
      // Extract JWT from Authorization header or body
      const authHeader = req.headers.get('Authorization') || '';
      const token = body._authToken || authHeader.replace('Bearer ', '');
      if (!token) return Response.json({ data: { session: null } });

      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data?.user) return Response.json({ data: { session: null } });
      return Response.json({ data: { session: { user: data.user, access_token: token } } });
    }

    // --- DB ACTIONS ---
    const { table, query, data, id } = body;

    if (!table) return Response.json({ error: 'table is required' }, { status: 400 });

    let result;

    if (action === 'list') {
      let q = supabaseAdmin.from(table).select('*');
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          q = q.eq(key, value);
        });
      }
      const { data: rows, error } = await q;
      if (error) return Response.json({ error: error.message }, { status: 500 });
      result = rows;
    } else if (action === 'create') {
      const { data: row, error } = await supabaseAdmin.from(table).insert(data).select().single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      result = row;
    } else if (action === 'update') {
      const { data: row, error } = await supabaseAdmin.from(table).update(data).eq('id', id).select().single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      result = row;
    } else if (action === 'delete') {
      const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
      if (error) return Response.json({ error: error.message }, { status: 500 });
      result = { success: true };
    } else {
      return Response.json({ error: 'Unknown action' }, { status: 400 });
    }

    return Response.json({ data: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});