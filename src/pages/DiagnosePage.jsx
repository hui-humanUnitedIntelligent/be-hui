// src/pages/DiagnosePage.jsx
// HUI Schema-Diagnose — zeigt exakten Zustand von DB, Schema, Feed Pipeline
import React, { useState, useEffect } from "react";
import { supabase } from ".../lib/supabaseClient";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Felder die das Frontend ERWARTET (aus Schema-Audit 024)
const EXPECTED = {
  works:       ['id','user_id','title','description','price','cover_url','media_url','images',
                'category','status','for_sale','mood_tags','atmosphere_tags','energy_level',
                'social_energy','creator_vibe','likes_count','medium','tags','created_at'],
  stories:     ['id','user_id','username','avatar_url','media_url','media_type','text_overlay',
                'caption','mood','location','is_highlight','expires_at','mood_tags',
                'atmosphere_tags','energy_level','social_energy','status','created_at'],
  experiences: ['id','user_id','title','description','price','price_type','format',
                'location_text','category','status','mood_tags','atmosphere_tags',
                'energy_level','social_energy','creator_vibe','media_url','media_type',
                'available_days','language','created_at'],
  profiles:    ['id','display_name','username','avatar_url','header_img','bio','is_wirker',
                'has_talent_profile','focus_type','talent','location_label','is_available',
                'impact_eur','followers_count','dna_tags','profile_modules','role','created_at'],
  wirker_profiles: ['id','user_id','slug','talent','wirker_type','location_label','categories',
                    'bio','hourly_rate','is_verified','impact_eur','followers_count',
                    'recommendations_count','availability_slots'],
  bookings:    ['id','user_id','wirker_id','work_id','experience_id','status','amount',
                'total_amount','scheduled_at','client_name','service_title','work_title'],
  messages:    ['id','chat_id','sender_id','receiver_id','text','read','created_at',
                'image_url','background','story_id'],
  chats:       ['id','user1_id','user2_id','booking_id','created_at'],
  notifications: ['id','user_id','type','title','body','read','data','created_at'],
  notification_settings: ['user_id','email_bookings','email_messages','email_impact',
                          'push_bookings','push_messages','push_impact'],
  privacy_settings: ['user_id','profile_visibility','show_location','show_availability',
                     'allow_messages'],
};

const C = {
  bg:'#0f172a', card:'#1e293b', border:'#334155',
  text:'#f1f5f9', muted:'#94a3b8',
  ok:'#4ade80', err:'#f87171', warn:'#fbbf24',
};

export default function DiagnosePage() {
  const [results, setResults]   = useState({});
  const [schema,  setSchema]    = useState({});
  const [running, setRunning]   = useState(false);

  async function runAudit() {
    setRunning(true);
    const out = {};

    // 1. ENV
    out.env_url  = SUPABASE_URL  || null;
    out.env_key  = SUPABASE_KEY  ? SUPABASE_KEY.slice(0,24)+'...' : null;
    out.connected = !!(SUPABASE_URL && SUPABASE_KEY);

    // 2. Auth
    try {
      const { data: { session } } = await supabase.auth.getSession();
      out.auth = session ? `✓ ${session.user.email}` : '⚠ anon (nicht eingeloggt)';
    } catch(e) { out.auth = `✗ ${e.message}`; }

    // 3. Tabellen-Counts
    const tables = ['works','stories','experiences','profiles','wirker_profiles',
                    'bookings','messages','chats','notifications','follows',
                    'work_likes','work_saves','impact_projects','impact_votes',
                    'recommendations','favorites','media'];

    out.counts = {};
    for (const t of tables) {
      try {
        const { count, error } = await supabase.from(t).select('*', { count:'exact', head:true });
        out.counts[t] = error ? `✗ ${error.code}: ${error.message.slice(0,60)}` : count ?? 0;
      } catch(e) { out.counts[t] = `✗ ${e.message.slice(0,60)}`; }
    }

    // 4. Schema-Audit — versuche jedes erwartete Feld zu selektieren
    const schemaOut = {};
    for (const [table, fields] of Object.entries(EXPECTED)) {
      const missing = [];
      const present = [];
      try {
        // Selektiere alle erwarteten Felder auf einmal
        const { data, error } = await supabase.from(table)
          .select(fields.join(',')).limit(1);
        if (error) {
          // Parse: welche Felder fehlen?
          const errMsg = error.message || '';
          for (const f of fields) {
            if (errMsg.includes(f) || error.code === 'PGRST204') {
              missing.push(f);
            } else {
              present.push(f);
            }
          }
          if (missing.length === 0 && error.code === 'PGRST204') {
            missing.push(...fields);
          }
        } else {
          // Prüfe welche Felder tatsächlich im Ergebnis sind
          const row = data?.[0] || {};
          for (const f of fields) {
            if (f in row || data?.length === 0) present.push(f);
            else missing.push(f);
          }
        }
      } catch(e) {
        missing.push(...fields);
      }
      schemaOut[table] = { present, missing };
    }
    setSchema(schemaOut);

    // 5. Feed Pipeline
    out.feed = {};
    try {
      const { data: w, error: we } = await supabase.from('works')
        .select('id,title,status,media_url,cover_url,created_at')
        .order('created_at', { ascending: false }).limit(5);
      out.feed.works = we ? `✗ ${we.message}` :
        `✓ ${w?.length ?? 0} Works (${w?.filter(x=>x.media_url)?.length ?? 0} mit media_url)`;
      out.feed.works_sample = w?.slice(0,2).map(x => ({
        id: x.id?.slice(0,8), title: x.title?.slice(0,20),
        status: x.status, has_media: !!x.media_url
      }));
    } catch(e) { out.feed.works = `✗ ${e.message}`; }

    try {
      const { data: s, error: se } = await supabase.from('stories')
        .select('id,status,media_url,media_type,created_at')
        .order('created_at', { ascending: false }).limit(5);
      out.feed.stories = se ? `✗ ${se.message}` :
        `✓ ${s?.length ?? 0} Stories (${s?.filter(x=>x.media_url)?.length ?? 0} mit media_url)`;
    } catch(e) { out.feed.stories = `✗ ${e.message}`; }

    try {
      const { data: e, error: ee } = await supabase.from('experiences')
        .select('id,title,status,media_url,location_text,energy_level,created_at')
        .order('created_at', { ascending: false }).limit(5);
      out.feed.experiences = ee ? `✗ ${ee.message}` :
        `✓ ${e?.length ?? 0} Experiences`;
    } catch(e) { out.feed.experiences = `✗ ${e.message}`; }

    // 6. Storage Buckets
    try {
      const { data: b, error: be } = await supabase.storage.listBuckets();
      out.buckets = be ? `✗ ${be.message}` : b?.map(x=>x.name).join(', ') || 'keine';
    } catch(e) { out.buckets = `✗ ${e.message}`; }

    setResults(out);
    setRunning(false);
  }

  useEffect(() => { runAudit(); }, []);

  const S = { fontFamily:'monospace,-apple-system', fontSize:11 };

  const Tag = ({ ok, children }) => (
    <span style={{
      display:'inline-block', padding:'2px 8px', borderRadius:6,
      background: ok === true ? 'rgba(74,222,128,.15)' : ok === false ? 'rgba(248,113,113,.15)' : 'rgba(251,191,36,.1)',
      color:       ok === true ? C.ok                  : ok === false ? C.err                   : C.warn,
      fontWeight:700, fontSize:10, marginRight:4, marginBottom:3,
    }}>{children}</span>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom:16, background:C.card, borderRadius:12,
      border:`1px solid ${C.border}`, padding:16 }}>
      <div style={{ fontSize:10, fontWeight:800, color:C.muted, textTransform:'uppercase',
        letterSpacing:1.2, marginBottom:12 }}>{title}</div>
      {children}
    </div>
  );

  const Row = ({ label, value, ok }) => (
    <div style={{ display:'flex', gap:8, marginBottom:6, alignItems:'flex-start' }}>
      <div style={{ color:C.muted, fontSize:11, minWidth:180, flexShrink:0 }}>{label}</div>
      <div style={{ color: ok===true?C.ok : ok===false?C.err : C.text, fontSize:11,
        fontFamily:'monospace', wordBreak:'break-all', flex:1 }}>
        {String(value ?? '—')}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.bg, color:C.text,
      padding:'20px 16px 80px', ...S }}>

      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:900, letterSpacing:'-.5px', marginBottom:4 }}>
          🔬 HUI Schema-Diagnose
        </div>
        <div style={{ fontSize:11, color:C.muted }}>
          024 Master Schema Audit · {new Date().toLocaleString('de-DE')}
        </div>
      </div>

      <Section title="Verbindung">
        <Row label="SUPABASE_URL"  value={results.env_url  || '✗ FEHLT'} ok={!!results.env_url}/>
        <Row label="SUPABASE_KEY"  value={results.env_key  || '✗ FEHLT'} ok={!!results.env_key}/>
        <Row label="Connected"     value={results.connected ? '✓ JA' : '✗ NEIN'} ok={results.connected}/>
        <Row label="Auth Session"  value={results.auth} ok={results.auth?.startsWith('✓')}/>
        <Row label="Storage"       value={results.buckets}/>
      </Section>

      <Section title="Tabellen & Counts">
        {results.counts && Object.entries(results.counts).map(([t, v]) => {
          const isErr = String(v).startsWith('✗');
          return <Row key={t} label={t} value={v} ok={!isErr}/>;
        })}
      </Section>

      <Section title="Feed Pipeline">
        {results.feed && <>
          <Row label="works"       value={results.feed.works}       ok={results.feed.works?.startsWith('✓')}/>
          {results.feed.works_sample && (
            <pre style={{ fontSize:9, color:C.muted, margin:'4px 0 8px 180px',
              background:'rgba(0,0,0,.3)', padding:'4px 8px', borderRadius:6 }}>
              {JSON.stringify(results.feed.works_sample, null, 2)}
            </pre>
          )}
          <Row label="stories"     value={results.feed.stories}     ok={results.feed.stories?.startsWith('✓')}/>
          <Row label="experiences" value={results.feed.experiences} ok={results.feed.experiences?.startsWith('✓')}/>
        </>}
      </Section>

      <Section title="Schema-Audit — Fehlende Spalten">
        {Object.entries(schema).map(([table, { present, missing }]) => (
          <div key={table} style={{ marginBottom:12 }}>
            <div style={{ fontWeight:800, color: missing.length ? C.warn : C.ok,
              fontSize:11, marginBottom:4 }}>
              {missing.length ? '⚠' : '✓'} {table}
              <span style={{ color:C.muted, fontWeight:400, marginLeft:8 }}>
                {present.length}/{present.length+missing.length} Felder vorhanden
              </span>
            </div>
            {missing.length > 0 && (
              <div style={{ marginLeft:16 }}>
                <span style={{ color:C.err, fontSize:10, fontWeight:700 }}>FEHLT: </span>
                {missing.map(f => <Tag key={f} ok={false}>{f}</Tag>)}
              </div>
            )}
            {missing.length === 0 && (
              <div style={{ marginLeft:16, color:C.ok, fontSize:10 }}>
                Alle Felder vorhanden ✓
              </div>
            )}
          </div>
        ))}
      </Section>

      <button onClick={runAudit} disabled={running}
        style={{ padding:'12px 24px', borderRadius:10, background:'#16D7C5',
          border:'none', color:'#0f172a', fontWeight:800, fontSize:13,
          cursor: running?'default':'pointer', fontFamily:'inherit' }}>
        {running ? 'Audit läuft…' : '🔄 Audit nochmal ausführen'}
      </button>

      <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(22,215,197,.07)',
        borderRadius:10, border:'1px solid rgba(22,215,197,.2)', fontSize:11 }}>
        <strong style={{ color:'#16D7C5' }}>024 Migration ausführen:</strong>
        <div style={{ color:C.muted, marginTop:4 }}>
          Supabase Dashboard → SQL Editor →{' '}
          <code style={{ color:'#16D7C5' }}>supabase/024_master_schema.sql</code>
          {' '}einfügen und ausführen. Danach diese Seite neu laden.
        </div>
      </div>
    </div>
  );
}
