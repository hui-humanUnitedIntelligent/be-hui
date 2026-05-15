// src/pages/DiagnosePage.jsx
// ══════════════════════════════════════════════════════════════════
// HUI Diagnose-Panel — TEMPORÄR, nicht für Produktion
// Zeigt exakt warum der Feed leer ist.
// Entfernen nach Debugging.
// ══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const ROW = ({ label, value, ok }) => (
  <div style={{
    display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"10px 0", borderBottom:"1px solid #f0ede8",
    fontFamily:"system-ui,sans-serif",
  }}>
    <span style={{ fontSize:13, color:"#444", fontWeight:500 }}>{label}</span>
    <span style={{
      fontSize:12, fontWeight:700,
      color: ok === true ? "#16a34a" : ok === false ? "#dc2626" : "#888",
      background: ok === true ? "#dcfce7" : ok === false ? "#fee2e2" : "#f3f4f6",
      padding:"3px 10px", borderRadius:8,
      maxWidth:220, textAlign:"right", wordBreak:"break-all",
    }}>{String(value)}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom:24 }}>
    <div style={{
      fontSize:11, fontWeight:800, letterSpacing:"0.08em",
      color:"#16D7C5", textTransform:"uppercase", marginBottom:8,
    }}>{title}</div>
    <div style={{
      background:"white", borderRadius:16,
      border:"1px solid #ede9e3", padding:"0 16px",
      boxShadow:"0 2px 12px rgba(0,0,0,0.04)",
    }}>{children}</div>
  </div>
);

export default function DiagnosePage() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnosis();
  }, []);

  async function runDiagnosis() {
    setLoading(true);
    const r = {};

    // ── 1. Auth Status ──────────────────────────────────────────
    try {
      const { data: { session } } = await supabase.auth.getSession();
      r.authUserId    = session?.user?.id || null;
      r.authEmail     = session?.user?.email || null;
      r.authLoggedIn  = !!session?.user;
    } catch(e) { r.authError = e.message; }

    // ── 2. Tabellen existieren + Row-Count ──────────────────────
    // Ohne Auth (anon) zählen → zeigt ob RLS SELECT blockiert
    const tables = ["works", "experiences", "stories", "profiles", "wirker_profiles"];
    for (const t of tables) {
      try {
        const { count, error } = await supabase
          .from(t)
          .select("*", { count:"exact", head:true });
        r[`count_${t}`]       = error ? `ERROR: ${error.message}` : count;
        r[`count_${t}_ok`]    = !error;
        r[`count_${t}_err`]   = error?.message || null;
      } catch(e) {
        r[`count_${t}`]       = `CRASH: ${e.message}`;
        r[`count_${t}_ok`]    = false;
      }
    }

    // ── 3. Column-Check — kritische Spalten vorhanden? ──────────
    // Supabase REST gibt PGRST204 wenn Spalte nicht existiert
    const colChecks = [
      { table:"works",       cols:"id,title,status,mood_tags,cover_url,media_url,user_id" },
      { table:"experiences", cols:"id,title,status,available_days,location_text,mood_tags,user_id" },
      { table:"stories",     cols:"id,media_url,status,mood_tags,location,user_id" },
    ];
    for (const { table, cols } of colChecks) {
      try {
        const { data, error } = await supabase.from(table).select(cols).limit(1);
        r[`cols_${table}`]    = error ? `ERROR: ${error.message}` : `OK (${(data||[]).length} rows)`;
        r[`cols_${table}_ok`] = !error;
      } catch(e) {
        r[`cols_${table}`]    = `CRASH: ${e.message}`;
        r[`cols_${table}_ok`] = false;
      }
    }

    // ── 4. Erste Rows (sehen ob Daten da sind) ──────────────────
    const dataChecks = ["works","experiences","stories"];
    for (const t of dataChecks) {
      try {
        const { data, error } = await supabase
          .from(t).select("id,created_at").order("created_at",{ascending:false}).limit(3);
        r[`rows_${t}`]    = error
          ? `ERROR: ${error.message}`
          : data?.length > 0
            ? data.map(d => d.id.slice(0,8) + "…" + " (" + (d.created_at||"?").slice(0,10) + ")").join(", ")
            : "LEER — keine Daten";
        r[`rows_${t}_ok`] = !error && (data?.length||0) > 0;
      } catch(e) {
        r[`rows_${t}`]    = `CRASH: ${e.message}`;
        r[`rows_${t}_ok`] = false;
      }
    }

    // ── 5. RLS Analyse — als eingeloggter User ──────────────────
    // Versuche zu inserting in works (ohne echten Insert)
    // Stattdessen: INSERT mit fehlenden Pflichtfeldern → zeigt ob RLS oder Schema-Error
    if (r.authLoggedIn) {
      try {
        const { error } = await supabase.from("works").insert({
          user_id:    r.authUserId,
          title:      "__HUI_DIAG_TEST__",
          media_url:  "https://diagnose.test/img.jpg",
          status:     "draft",
        });
        // Wenn RLS blockiert → error.code = "42501" / message includes "row-level"
        // Wenn Schema-Fehler → error.code = "PGRST204" / "23502" etc.
        if (error) {
          r.rlsInsertWorks = `FEHLER code=${error.code}: ${error.message}`;
          r.rlsInsertOk    = false;
        } else {
          r.rlsInsertWorks = "INSERT OK (cleanup nötig!)";
          r.rlsInsertOk    = true;
          // Test-Row löschen
          await supabase.from("works").delete().eq("title","__HUI_DIAG_TEST__");
        }
      } catch(e) {
        r.rlsInsertWorks = `CRASH: ${e.message}`;
        r.rlsInsertOk    = false;
      }
    } else {
      r.rlsInsertWorks = "nicht eingeloggt — kein Test";
      r.rlsInsertOk    = null;
    }

    // ── 6. Storage Buckets ──────────────────────────────────────
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        r.storageBuckets = `ERROR: ${error.message}`;
        r.storageOk      = false;
      } else {
        const names = (buckets||[]).map(b => b.name);
        r.storageBuckets = names.join(", ") || "(keine Buckets)";
        r.storageMedia   = names.includes("media");
        r.storageStories = names.includes("stories");
        r.storageOk      = r.storageMedia && r.storageStories;
      }
    } catch(e) {
      r.storageBuckets = `CRASH: ${e.message}`;
      r.storageOk      = false;
    }

    // ── 7. loadFeed Simulation ──────────────────────────────────
    // Exakt dieselben Queries wie loadFeed() — zeigt was der Feed sieht
    const PAGE_SIZE = 10;
    for (const [table, sel] of [
      ["works",       "id,title,cover_url,media_url,status,state,created_at,user_id"],
      ["experiences", "id,title,media_url,status,state,created_at,user_id"],
      ["stories",     "id,media_url,status,state,created_at,user_id"],
    ]) {
      try {
        const { data, error } = await supabase
          .from(table).select(sel)
          .order("created_at",{ascending:false})
          .range(0, PAGE_SIZE-1);
        r[`feed_${table}`]    = error
          ? `ERROR: ${error.message}`
          : `${(data||[]).length} items${data?.length > 0 ? " ✓" : " — LEER"}`;
        r[`feed_${table}_ok`] = !error && (data?.length||0) > 0;
      } catch(e) {
        r[`feed_${table}`]    = `CRASH: ${e.message}`;
        r[`feed_${table}_ok`] = false;
      }
    }

    // ── 8. Supabase Client Status ────────────────────────────────
    r.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "NICHT GESETZT";
    r.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      ? import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0,20) + "…"
      : "NICHT GESETZT";
    r.supabaseOk  = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

    setResults(r);
    setLoading(false);

    // Alles auch in Console loggen
    console.log("[HUI DIAGNOSE] vollständige Ergebnisse:", r);
  }

  return (
    <div style={{
      minHeight:"100vh", background:"#F9F7F4",
      padding:"24px 20px 60px", fontFamily:"system-ui,sans-serif",
      maxWidth:560, margin:"0 auto",
    }}>
      <div style={{ marginBottom:28, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{
          width:40, height:40, borderRadius:12,
          background:"linear-gradient(135deg,#16D7C5,#FF8A6B)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:20,
        }}>🔍</div>
        <div>
          <div style={{ fontWeight:800, fontSize:18, color:"#1a1a1a" }}>HUI Diagnose</div>
          <div style={{ fontSize:12, color:"#888" }}>Feed + Publish + Database Debug</div>
        </div>
        {!loading && (
          <button onClick={runDiagnosis} style={{
            marginLeft:"auto", padding:"8px 16px", borderRadius:10,
            background:"#16D7C5", border:"none", color:"white",
            fontWeight:700, fontSize:12, cursor:"pointer",
          }}>Neu laden</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"#888", fontSize:14 }}>
          Diagnose läuft…
        </div>
      ) : (
        <>
          <Section title="Supabase Client">
            <ROW label="URL"           value={results.supabaseUrl}  ok={results.supabaseOk} />
            <ROW label="Anon Key"      value={results.supabaseKey}  ok={results.supabaseOk} />
          </Section>

          <Section title="Auth Status">
            <ROW label="Eingeloggt"    value={results.authLoggedIn ? "JA" : "NEIN"} ok={results.authLoggedIn} />
            <ROW label="User ID"       value={results.authUserId  || "—"} ok={!!results.authUserId} />
            <ROW label="E-Mail"        value={results.authEmail   || "—"} ok={!!results.authEmail} />
          </Section>

          <Section title="Tabellen — Row Count (via RLS)">
            <ROW label="works"             value={results.count_works}            ok={results.count_works_ok} />
            <ROW label="experiences"       value={results.count_experiences}      ok={results.count_experiences_ok} />
            <ROW label="stories"           value={results.count_stories}          ok={results.count_stories_ok} />
            <ROW label="profiles"          value={results.count_profiles}         ok={results.count_profiles_ok} />
            <ROW label="wirker_profiles"   value={results.count_wirker_profiles}  ok={results.count_wirker_profiles_ok} />
          </Section>

          <Section title="Schema Check — kritische Spalten">
            <ROW label="works Spalten"       value={results.cols_works}       ok={results.cols_works_ok} />
            <ROW label="experiences Spalten" value={results.cols_experiences} ok={results.cols_experiences_ok} />
            <ROW label="stories Spalten"     value={results.cols_stories}     ok={results.cols_stories_ok} />
          </Section>

          <Section title="Feed Simulation — exakt wie loadFeed()">
            <ROW label="works im Feed"       value={results.feed_works}       ok={results.feed_works_ok} />
            <ROW label="experiences im Feed" value={results.feed_experiences} ok={results.feed_experiences_ok} />
            <ROW label="stories im Feed"     value={results.feed_stories}     ok={results.feed_stories_ok} />
          </Section>

          <Section title="Daten — neueste 3 Rows (sichtbar für dich)">
            <ROW label="works"       value={results.rows_works}       ok={results.rows_works_ok} />
            <ROW label="experiences" value={results.rows_experiences} ok={results.rows_experiences_ok} />
            <ROW label="stories"     value={results.rows_stories}     ok={results.rows_stories_ok} />
          </Section>

          <Section title="RLS Insert Test">
            <ROW label="works INSERT" value={results.rlsInsertWorks} ok={results.rlsInsertOk} />
          </Section>

          <Section title="Storage Buckets">
            <ROW label="Alle Buckets"    value={results.storageBuckets}  ok={results.storageOk} />
            <ROW label="media (Bucket)"  value={results.storageMedia ? "vorhanden ✓" : "FEHLT ✗"} ok={results.storageMedia} />
            <ROW label="stories (Bucket)"value={results.storageStories ? "vorhanden ✓" : "FEHLT ✗"} ok={results.storageStories} />
          </Section>

          <div style={{
            padding:"16px", borderRadius:14, background:"#FFF8F0",
            border:"1px solid #FF8A6B33", fontSize:12, color:"#666", lineHeight:1.7,
          }}>
            <strong>📋 Vollständige Logs in Browser Console</strong><br/>
            Öffne DevTools → Console → suche nach "[HUI DIAGNOSE]"<br/>
            Nach diesem Fix: diese Seite entfernen und DiagnosePage aus Routing löschen.
          </div>
        </>
      )}
    </div>
  );
}
