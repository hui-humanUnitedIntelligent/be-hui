import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

Deno.serve(async (req) => {
  try {
    const { table, action, query, data, id } = await req.json();

    if (!table || !action) {
      return Response.json({ error: 'table and action are required' }, { status: 400 });
    }

    let result;

    if (action === 'list') {
      let q = supabase.from(table).select('*');
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          q = q.eq(key, value);
        });
      }
      const { data: rows, error } = await q;
      if (error) return Response.json({ error: error.message }, { status: 500 });
      result = rows;
    } else if (action === 'create') {
      const { data: row, error } = await supabase.from(table).insert(data).select().single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      result = row;
    } else if (action === 'update') {
      const { data: row, error } = await supabase.from(table).update(data).eq('id', id).select().single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      result = row;
    } else if (action === 'delete') {
      const { error } = await supabase.from(table).delete().eq('id', id);
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