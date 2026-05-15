// src/pages/Diagnose.jsx
// Hard Debug — zeigt Supabase Status, ENV Vars, DB Queries
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;

const IS_CONNECTED  = !!(SUPABASE_URL && SUPABASE_KEY);

export default function Diagnose() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);

  const C = {
    ok:   "#16a34a", err: "#dc2626", warn: "#d97706",
    bg:   "#0f172a", card:"#1e293b", border:"#334155",
    text: "#f1f5f9", muted:"#94a3b8",
  };

  async function runChecks() {
    setRunning(true);
    const out = {};

    // 1. ENV VARS
    out.env_url  = SUPABASE_URL  || "❌ NICHT GESETZT";
    out.env_key  = SUPABASE_KEY  ? `✓ ${SUPABASE_KEY.slice(0,20)}...` : "❌ NICHT GESETZT";
    out.connected = IS_CONNECTED ? "✓ VERBUNDEN" : "❌ NICHT VERBUNDEN — KEY FEHLT";

    // 2. Works Query
    try {
      const { data, error } = await supabase
        .from("works").select("id, title, status, media_url, cover_url, created_at")
        .order("created_at", { ascending: false }).limit(5);
      if (error) out.works = `❌ ERROR: ${error.message} [${error.code}]`;
      else       out.works = data?.length ? `✓ ${data.length} Works: ${data.map(w=>w.title||w.id).join(", ")}` : "⚠ 0 Works in DB";
      out.works_raw = JSON.stringify(data?.slice(0,3), null, 2);
    } catch(e) { out.works = `❌ CRASH: ${e.message}`; }

    // 3. Experiences Query
    try {
      const { data, error } = await supabase
        .from("experiences").select("id, title, status, media_url, created_at")
        .order("created_at", { ascending: false }).limit(5);
      if (error) out.experiences = `❌ ERROR: ${error.message} [${error.code}]`;
      else       out.experiences = data?.length ? `✓ ${data.length} Experiences` : "⚠ 0 Experiences";
    } catch(e) { out.experiences = `❌ CRASH: ${e.message}`; }

    // 4. Stories Query
    try {
      const { data, error } = await supabase
        .from("stories").select("id, media_url, media_type, status, caption, text_overlay, created_at")
        .order("created_at", { ascending: false }).limit(5);
      if (error) out.stories = `❌ ERROR: ${error.message} [${error.code}]`;
      else       out.stories = data?.length ? `✓ ${data.length} Stories: ${data.map(s=>s.media_type||"text").join(", ")}` : "⚠ 0 Stories";
      out.stories_raw = JSON.stringify(data?.slice(0,3), null, 2);
    } catch(e) { out.stories = `❌ CRASH: ${e.message}`; }

    // 5. Profiles Query
    try {
      const { data, error } = await supabase
        .from("profiles").select("id, display_name, is_wirker").limit(5);
      if (error) out.profiles = `❌ ERROR: ${error.message} [${error.code}]`;
      else       out.profiles = data?.length ? `✓ ${data.length} Profile` : "⚠ 0 Profile";
    } catch(e) { out.profiles = `❌ CRASH: ${e.message}`; }

    // 6. Auth Session
    try {
      const { data:{ session } } = await supabase.auth.getSession();
      out.auth = session ? `✓ Eingeloggt: ${session.user.email}` : "⚠ Nicht eingeloggt (anon)";
    } catch(e) { out.auth = `❌ Auth CRASH: ${e.message}`; }

    // 7. Storage Buckets
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) out.storage = `❌ ${error.message}`;
      else       out.storage = data?.length ? `✓ Buckets: ${data.map(b=>b.name).join(", ")}` : "⚠ Keine Buckets";
    } catch(e) { out.storage = `❌ CRASH: ${e.message}`; }

    // 8. Storage Files in media bucket
    try {
      const { data, error } = await supabase.storage.from("media").list("", { limit: 10 });
      if (error) out.media_files = `❌ ${error.message}`;
      else       out.media_files = data?.length ? `✓ ${data.length} Dateien in /media` : "⚠ 0 Dateien in /media";
    } catch(e) { out.media_files = `❌ CRASH: ${e.message}`; }

    // 9. Storage Files in stories bucket
    try {
      const { data, error } = await supabase.storage.from("stories").list("", { limit: 10 });
      if (error) out.stories_files = `❌ ${error.message}`;
      else       out.stories_files = data?.length ? `✓ ${data.length} Dateien in /stories` : "⚠ 0 Dateien in /stories";
    } catch(e) { out.stories_files = `❌ CRASH: ${e.message}`; }

    setResults(out);
    setRunning(false);
  }

  useEffect(() => { runChecks(); }, []);

  const Row = ({ label, value, raw }) => {
    const isErr  = String(value).startsWith("❌");
    const isWarn = String(value).startsWith("⚠");
    const isOk   = String(value).startsWith("✓");
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
          <div style={{ minWidth:160, fontSize:11, color:C.muted, fontFamily:"monospace", paddingTop:2 }}>
            {label}
          </div>
          <div style={{
            fontSize:12, fontFamily:"monospace", flex:1, wordBreak:"break-all",
            color: isErr ? C.err : isWarn ? C.warn : isOk ? C.ok : C.text,
            fontWeight: (isErr || isWarn) ? 700 : 400,
          }}>
            {value || "—"}
          </div>
        </div>
        {raw && (
          <pre style={{
            marginTop:6, marginLeft:172, padding:"8px 10px",
            background:"rgba(0,0,0,0.4)", borderRadius:6,
            fontSize:10, color:C.muted, overflow:"auto", maxHeight:120,
            border:`1px solid ${C.border}`
          }}>{raw}</pre>
        )}
      </div>
    );
  };

  const isKeyMissing = !SUPABASE_KEY;

  return (
    <div style={{
      minHeight:"100vh", background:C.bg, color:C.text, padding:"24px 20px",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Mono',monospace",
    }}>
      {/* HEADER */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, color:C.muted, marginBottom:4 }}>
          🔍 HUI DIAGNOSE — {new Date().toLocaleString("de-DE")}
        </div>
        <h1 style={{ margin:"0 0 4px", fontSize:20, fontWeight:800, letterSpacing:"-.5px", color:C.text }}>
          Feed Debug
        </h1>
        <div style={{ fontSize:12, color:C.muted }}>
          Build: {import.meta.env.VITE_BUILD_DATE || "?"}  |  
          Mode: {import.meta.env.MODE}
        </div>
      </div>

      {/* CRITICAL ALERT wenn Key fehlt */}
      {isKeyMissing && (
        <div style={{
          marginBottom:20, padding:"16px 20px", borderRadius:12,
          background:"rgba(220,38,38,0.15)", border:"2px solid rgba(220,38,38,0.5)",
        }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#fca5a5", marginBottom:8 }}>
            🚨 KRITISCH: VITE_SUPABASE_ANON_KEY FEHLT IN VERCEL
          </div>
          <div style={{ fontSize:12, color:"#fca5a5", lineHeight:1.6 }}>
            Der Anon Key ist NICHT im Vercel-Bundle eingebettet.
            Supabase Client ist im NOOP-Modus → alle Queries geben [] zurück → Feed leer.
          </div>
          <div style={{ marginTop:12, padding:"12px 14px", background:"rgba(0,0,0,0.3)",
            borderRadius:8, fontSize:11, color:"#94a3b8", lineHeight:1.8 }}>
            <strong style={{color:"#f1f5f9"}}>FIX (2 Minuten):</strong><br/>
            1. Vercel öffnen → hui-humanunitedintelligents-projects → be-hui<br/>
            2. Settings → Environment Variables<br/>
            3. VITE_SUPABASE_ANON_KEY → Add<br/>
            4. Value = deinen Supabase anon key einfügen<br/>
               (Supabase Dashboard → Settings → API → Project API keys → anon public)<br/>
            5. Redeploy klicken
          </div>
        </div>
      )}

      {/* CHECKS */}
      <div style={{
        background:C.card, borderRadius:12, padding:"20px",
        border:`1px solid ${C.border}`, marginBottom:16
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:16, textTransform:"uppercase", letterSpacing:1 }}>
          ENV / Verbindung
        </div>
        <Row label="SUPABASE_URL"    value={results.env_url} />
        <Row label="SUPABASE_KEY"    value={results.env_key} />
        <Row label="IS_CONNECTED"    value={results.connected} />
        <Row label="Auth Session"    value={results.auth} />
      </div>

      <div style={{
        background:C.card, borderRadius:12, padding:"20px",
        border:`1px solid ${C.border}`, marginBottom:16
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:16, textTransform:"uppercase", letterSpacing:1 }}>
          Datenbank
        </div>
        <Row label="works"       value={results.works}       raw={results.works_raw} />
        <Row label="experiences" value={results.experiences} />
        <Row label="stories"     value={results.stories}     raw={results.stories_raw} />
        <Row label="profiles"    value={results.profiles} />
      </div>

      <div style={{
        background:C.card, borderRadius:12, padding:"20px",
        border:`1px solid ${C.border}`, marginBottom:24
      }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:16, textTransform:"uppercase", letterSpacing:1 }}>
          Storage
        </div>
        <Row label="Buckets"        value={results.storage} />
        <Row label="media/ files"   value={results.media_files} />
        <Row label="stories/ files" value={results.stories_files} />
      </div>

      <button
        onClick={runChecks}
        disabled={running}
        style={{
          padding:"13px 28px", borderRadius:10,
          background: running ? "rgba(22,211,197,0.3)" : "#16D7C5",
          border:"none", color: running ? "#16D7C5" : "#0f172a",
          fontWeight:800, fontSize:13, cursor: running ? "default" : "pointer",
          fontFamily:"inherit",
        }}
      >
        {running ? "Läuft…" : "Nochmal prüfen"}
      </button>
    </div>
  );
}
