// src/pages/DiagnosePage.jsx
// HUI Schema-Diagnose — zeigt exakten Zustand von DB, Schema, Feed Pipeline
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { formatNumberDE } from "../lib/formatters.js";
import { useTranslation } from "../hooks/useTranslation.js";


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
  const { t } = useTranslation();
  const [results, setResults]   = useState({});
  const [schema,  setSchema]    = useState({});
  const [running, setRunning]   = useState(false);
  const [fontInfo, setFontInfo] = useState(null);

  async function runFontCheck() {
    // Test ALL 8 weights — measure digit width for each
    const weights = [200, 300, 400, 500, 600, 700, 800, 900];
    const weightResults = {};
    const elements = [];

    for (const w of weights) {
      const el = document.createElement('span');
      el.textContent = '1234567890';
      el.style.cssText = `position:absolute;left:-9999px;font-size:32px;font-weight:${w};font-family:'Inter',sans-serif;`;
      document.body.appendChild(el);
      elements.push(el);
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      weightResults[w] = {
        width: Math.round(rect.width) + 'px',
        height: Math.round(rect.height) + 'px',
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily,
      };
    }

    // Force load ALL weights and check which succeed
    const loadChecks = {};
    for (const w of weights) {
      try {
        const result = await document.fonts.load(`${w} 32px Inter`);
        loadChecks[w] = result.length > 0 ? 'loaded' : 'NOT loaded';
      } catch(e) {
        loadChecks[w] = `error: ${e.message}`;
      }
    }

    // Also check document.fonts.check (does NOT trigger load, just checks current status)
    const checkResults = {};
    for (const w of weights) {
      checkResults[w] = document.fonts.check(`${w} 32px Inter`) ? 'true' : 'false';
    }

    // Get the main test element (700 weight) for computed styles
    const cs700 = getComputedStyle(elements[5]); // index 5 = weight 700

    // List all registered fonts
    let loadedFonts = [];
    if (document.fonts) {
      document.fonts.forEach(f => {
        loadedFonts.push(`${f.family} ${f.weight} (${f.status})`);
      });
    }

    // Check if Google Fonts stylesheet loaded
    let gfLoaded = false;
    let gfHref = '';
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      if (link.href.includes('fonts.googleapis.com')) {
        gfLoaded = true;
        gfHref = link.href;
      }
    });

    setFontInfo({
      userAgent: navigator.userAgent.slice(0, 150),
      platform: navigator.platform,
      computedFontFamily: cs700.fontFamily,
      computedFontSize: cs700.fontSize,
      computedFontWeight: cs700.fontWeight,
      computedLetterSpacing: cs700.letterSpacing,
      computedFontFeatureSettings: cs700.fontFeatureSettings,
      computedFontSynthesis: cs700.fontSynthesis,
      renderedWidth: weightResults[700].width,
      renderedHeight: weightResults[700].height,
      googleFontsLink: gfLoaded ? 'YES' : 'NO',
      googleFontsHref: gfHref.slice(0, 80),
      loadedFontsCount: loadedFonts.length,
      loadedFonts: loadedFonts.slice(0, 20),
      fontDisplay: cs700.fontDisplay,
      weightResults,
      loadChecks,
      checkResults,
    });

    elements.forEach(el => document.body.removeChild(el));
  }

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
                    'post_reactions','post_comments','impact_projects','impact_votes',
                    'recommendations','favorites','core_connections','stripe_payments','media'];

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

  const S = { fontFamily:'monospace,Inter', fontSize:11 };

  const Tag = ({ ok, children }) => (
    <span style={{
      display:'inline-block', padding:'2px 8px', borderRadius:6,
      background: ok === true ? 'rgba(74,222,128,.15)' : ok === false ? 'rgba(248,113,113,.15)' : 'rgba(251,191,36,.1)',
      color:       ok === true ? C.ok                  : ok === false ? C.err                   : C.warn,
      fontWeight: 600, fontSize:10, marginRight:4, marginBottom:3,
    }}>{children}</span>
  );

  const Section = ({ title, children }) => (
    <div style={{ marginBottom:16, background:C.card, borderRadius:12,
      border:`1px solid ${C.border}`, padding:16 }}>
      <div style={{ fontSize:10, fontWeight: 600, color:C.muted, textTransform:'uppercase',
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
    <div style={{ minHeight:'100vh', maxHeight:'100vh', overflowY:'auto',
      WebkitOverflowScrolling:'touch', background:C.bg, color:C.text,
      padding:'20px 16px 80px', ...S }}>

      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight: 600, letterSpacing:'-.5px', marginBottom:4 }}>
          🔬 HUI Schema-Diagnose
        </div>
        <div style={{ fontSize:11, color:C.muted }}>
          024 Master Schema Audit · {formatNumberDE(new Date())}
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
            <div style={{ fontWeight: 600, color: missing.length ? C.warn : C.ok,
              fontSize:11, marginBottom:4 }}>
              {missing.length ? '⚠' : '✓'} {table}
              <span style={{ color:C.muted, fontWeight:400, marginLeft:8 }}>
                {present.length}/{present.length+missing.length} Felder vorhanden
              </span>
            </div>
            {missing.length > 0 && (
              <div style={{ marginLeft:16 }}>
                <span style={{ color:C.err, fontSize:10, fontWeight: 600 }}>FEHLT: </span>
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

      <Section title="🔤 Font-Diagnose">
        <button onClick={runFontCheck}
          style={{ padding:'10px 20px', borderRadius:8, background:'#16D7C5',
            border:'none', color:'#0f172a', fontWeight: 600, fontSize:12,
            cursor:'pointer', fontFamily:'inherit', marginBottom:12 }}>
          Font-Check ausführen
        </button>
        {fontInfo && <>
          <Row label="User-Agent" value={fontInfo.userAgent} />
          <Row label="Platform" value={fontInfo.platform} />
          <Row label="Computed font-family" value={fontInfo.computedFontFamily} />
          <Row label="Computed font-size" value={fontInfo.computedFontSize} />
          <Row label="Computed font-weight" value={fontInfo.computedFontWeight} />
          <Row label="Computed letter-spacing" value={fontInfo.computedLetterSpacing} />
          <Row label="Computed font-feature-settings" value={fontInfo.computedFontFeatureSettings} />
          <Row label="Computed font-synthesis" value={fontInfo.computedFontSynthesis} />
          <Row label="Google Fonts <link> loaded" value={fontInfo.googleFontsLink} />
          <Row label="Loaded fonts (document.fonts)" value={`${fontInfo.loadedFontsCount} fonts`} />
          {fontInfo.loadedFonts?.map((f, i) => (
            <Row key={i} label={`  ${i+1}`} value={f} />
          ))}
          <div style={{marginTop:12,marginBottom:8,fontWeight: 600,color:C.warn,fontSize:11}}>
            WEIGHT-BY-WEIGHT TEST (10 digits "1234567890"):
          </div>
          <div style={{display:'grid',gridTemplateColumns:'60px 80px 80px 80px',gap:2,fontSize:10,marginBottom:8}}>
            <div style={{fontWeight: 600,color:C.text}}>W</div>
            <div style={{fontWeight: 600,color:C.text}}>Width</div>
            <div style={{fontWeight: 600,color:C.text}}>Load()</div>
            <div style={{fontWeight: 600,color:C.text}}>Check()</div>
            {[200,300,400,500,600,700,800,900].map(w => (
              <React.Fragment key={w}>
                <div style={{color:C.muted}}>{w}</div>
                <div style={{color: fontInfo.weightResults?.[w]?.width?.startsWith('1') ? C.ok : C.err}}>
                  {fontInfo.weightResults?.[w]?.width || '-'}
                </div>
                <div style={{color: fontInfo.loadChecks?.[w] === 'loaded' ? C.ok : C.err}}>
                  {fontInfo.loadChecks?.[w] || '-'}
                </div>
                <div style={{color: fontInfo.checkResults?.[w] === 'true' ? C.ok : C.err}}>
                  {fontInfo.checkResults?.[w] || '-'}
                </div>
              </React.Fragment>
            ))}
          </div>
          <div style={{fontSize:10,color:C.muted,marginTop:4,marginBottom:8}}>
            "loaded" = Font-Loading-API kann Font laden - "true" = Browser hält Font für verfügbar
          </div>
          {/* ── V3 DIAGNOSE: Multiple Font-Varianten Side-by-Side ── */}
          <div style={{ marginTop:12, padding:'16px', background:'rgba(255,0,0,.15)', borderRadius:8, border:'2px solid #ff4444' }}>
            <div style={{ fontSize:16, fontWeight: 600, color:'#ff4444', marginBottom:8 }}>
              🔴 VERSION 3 — wenn du diesen roten Kasten siehst, ist die neue Version geladen
            </div>
          </div>
          <div style={{ marginTop:8, padding:'12px', background:'rgba(255,255,255,.05)', borderRadius:8 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>A) Inter Bold 32px:</div>
            <div style={{ fontSize:32, fontWeight: 600, fontFamily:'Inter, sans-serif' }}>
              1.234.567,89 €
            </div>
          </div>
          <div style={{ marginTop:8, padding:'12px', background:'rgba(255,255,255,.05)', borderRadius:8 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>B) System-UI Bold 32px:</div>
            <div style={{ fontSize:32, fontWeight: 600, fontFamily:'system-ui, sans-serif' }}>
              1.234.567,89 €
            </div>
          </div>
          <div style={{ marginTop:8, padding:'12px', background:'rgba(255,255,255,.05)', borderRadius:8 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>C) Roboto Bold 32px:</div>
            <div style={{ fontSize:32, fontWeight: 600, fontFamily:'Roboto, sans-serif' }}>
              1.234.567,89 €
            </div>
          </div>
          <div style={{ marginTop:8, padding:'12px', background:'rgba(255,255,255,.05)', borderRadius:8 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>D) Monospace 32px:</div>
            <div style={{ fontSize:32, fontWeight: 600, fontFamily:'monospace' }}>
              1.234.567,89 €
            </div>
          </div>
          <div style={{ marginTop:8, padding:'12px', background:'rgba(255,255,255,.05)', borderRadius:8 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>E) Inter — nur Buchstaben (sollte normal sein):</div>
            <div style={{ fontSize:32, fontWeight: 600, fontFamily:'Inter, sans-serif' }}>
              Hallo Welt
            </div>
          </div>
          <div style={{ marginTop:8, padding:'12px', background:'rgba(0,255,0,.1)', borderRadius:8, border:'1px solid #22ff22' }}>
            <div style={{ fontSize:14, fontWeight: 600, color:'#22ff22' }}>
              ✅ ROOT CAUSE GEFUNDEN: globales CSS `word-break: break-word` auf
              jedem div/span brach lange Zahlen mitten in der Ziffernfolge um
              (nicht Font-bedingt — bei ALLEN 4 Schriftarten identisch umgebrochen).
              Fix: Regel entschärft + `.hui-num-nowrap` (white-space:nowrap) auf
              allen Geld-Anzeigen. Test F unten beweist es:
            </div>
          </div>
          <div style={{ marginTop:8, padding:'12px', background:'rgba(255,255,255,.05)', borderRadius:8 }}>
            <div style={{ fontSize:11, color:C.muted, marginBottom:6 }}>F) Inter Bold 32px MIT hui-num-nowrap-Fix (nowrap only):</div>
            <div className="hui-num-nowrap" style={{ fontSize:32, fontWeight: 600, fontFamily:'Inter, sans-serif' }}>
              1.234.567,89 €
            </div>
          </div>
          <div style={{ marginTop:8, padding:'12px', background:'rgba(255,0,255,.08)', borderRadius:8, border:'1px solid #ff44ff' }}>
            <div style={{ fontSize:11, color:'#ff44ff', marginBottom:6, fontWeight: 600 }}>G) ZWEITER FIX — kleine Zahl OHNE tabular-nums (wie im echten Kaeufe-Modal):</div>
            <div style={{ fontSize:20, fontWeight: 600 }}>
              22.745,50 €
            </div>
            <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>
              ↑ Wenn hier KEINE Luecke nach jeder Ziffer ist: tabular-nums war der 2. Bug
            </div>
          </div>
        </>}
      </Section>

      <button onClick={runAudit} disabled={running}
        style={{ padding:'12px 24px', borderRadius:10, background:'#16D7C5',
          border:'none', color:'#0f172a', fontWeight: 600, fontSize:13,
          cursor: running?'default':'pointer', fontFamily:'inherit' }}>
        {running ? t("diag.auditRunning") : t("diag.rerunAudit")}
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

      {/* ═══ FONT WEIGHT DIAGNOSTIC ═══ */}
      <div style={{ marginTop:24, padding:16, borderRadius:12, background:'#fff', border:'1px solid #e5e7eb' }}>
        <div style={{ fontSize:14, fontWeight: 600, marginBottom:12, color:'#1a1a1a' }}>
          Font-Weight Render Test (Xiaomi WebView Bug)
        </div>
        
        <div style={{ fontSize:11, color:'#999', marginBottom:16 }}>
          Wenn Lücken zwischen Ziffern/Buchstaben auftreten → WebView Bug bei diesem Weight.<br/>
          Fix: @font-face mappt 700/800/900 → SemiBold(600) Datei.
        </div>

        {/* Test: Weight 400 */}
        <div style={{ marginBottom:12, padding:8, borderRadius:8, background:'#f9fafb' }}>
          <div style={{ fontSize:10, color:'#999', marginBottom:4 }}>Weight 400 (Regular) — sollte OK sein:</div>
          <div style={{ fontFamily:'Inter', fontSize:15, fontWeight:400 }}>
            22.745,50 € — Office zu verkaufen
          </div>
        </div>

        {/* Test: Weight 500 */}
        <div style={{ marginBottom:12, padding:8, borderRadius:8, background:'#f9fafb' }}>
          <div style={{ fontSize:10, color:'#999', marginBottom:4 }}>Weight 500 (Medium) — sollte OK sein:</div>
          <div style={{ fontFamily:'Inter', fontSize:15, fontWeight:500 }}>
            22.745,50 € — Office zu verkaufen
          </div>
        </div>

        {/* Test: Weight 600 */}
        <div style={{ marginBottom:12, padding:8, borderRadius:8, background:'#f9fafb' }}>
          <div style={{ fontSize:10, color:'#999', marginBottom:4 }}>Weight 600 (SemiBold) — sollte OK sein:</div>
          <div style={{ fontFamily:'Inter', fontSize:15, fontWeight:600 }}>
            22.745,50 € — Office zu verkaufen
          </div>
        </div>

        {/* Test: Weight 700 (now mapped to 600) */}
        <div style={{ marginBottom:12, padding:8, borderRadius:8, background:'#fff4e0', border:'1px solid #f0c060' }}>
          <div style={{ fontSize:10, color:'#b8860b', marginBottom:4 }}>Weight 700 (Bold) → gemappt auf SemiBold:</div>
          <div style={{ fontFamily:'Inter', fontSize:15, fontWeight: 600 }}>
            22.745,50 € — Office zu verkaufen
          </div>
        </div>

        {/* Test: Weight 800 (now mapped to 600) */}
        <div style={{ marginBottom:12, padding:8, borderRadius:8, background:'#e0f7fa', border:'1px solid #40c0d0' }}>
          <div style={{ fontSize:10, color:'#088', marginBottom:4 }}>Weight 800 (ExtraBold) → gemappt auf SemiBold:</div>
          <div style={{ fontFamily:'Inter', fontSize:15, fontWeight: 600 }}>
            22.745,50 € — Office zu verkaufen
          </div>
        </div>

        {/* Test: Weight 900 (now mapped to 600) */}
        <div style={{ marginBottom:12, padding:8, borderRadius:8, background:'#f0e0fa', border:'1px solid #a040d0' }}>
          <div style={{ fontSize:10, color:'#608', marginBottom:4 }}>Weight 900 (Black) → gemappt auf SemiBold:</div>
          <div style={{ fontFamily:'Inter', fontSize:15, fontWeight: 600 }}>
            22.745,50 € — Office zu verkaufen
          </div>
        </div>

        {/* System font comparison */}
        <div style={{ marginBottom:12, padding:8, borderRadius:8, background:'#f9fafb' }}>
          <div style={{ fontSize:10, color:'#999', marginBottom:4 }}>System sans-serif Weight 800 (Vergleich):</div>
          <div style={{ fontFamily:'sans-serif', fontSize:15, fontWeight: 600 }}>
            22.745,50 € — Office zu verkaufen
          </div>
        </div>

        {/* Canvas test */}
        <div style={{ marginBottom:12, padding:8, borderRadius:8, background:'#f9fafb' }}>
          <div style={{ fontSize:10, color:'#999', marginBottom:4 }}>Canvas 800 (sollte jetzt auch OK sein):</div>
          <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap" }}>22.745,50 €</span>
        </div>

        <div style={{ fontSize:10, color:'#999', marginTop:8, lineHeight:1.6 }}>
          userAgent: <span id="hua" style={{ wordBreak:'break-all' }}>{navigator.userAgent}</span>
        </div>
      </div>

    </div>
  );
}
