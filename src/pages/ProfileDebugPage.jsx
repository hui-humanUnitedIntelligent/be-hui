// src/pages/ProfileDebugPage.jsx
// ═══════════════════════════════════════════════════════════════
// SPRINT D.8 — Data Flow Trace
// READ-ONLY. Kein Schreiben. Kein Editieren. Kein Routing-Einfluss.
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo } from "react";
import { useAuth } from "../lib/AuthContext";
import { useProfileData } from "../hooks/useProfileData";

const C = {
  bg:"#F7F5F0", card:"#FFFFFF", border:"#E8E4DC",
  ink:"#1A1A18", inkSoft:"#4A4A45", inkFaint:"#8C8C85",
  teal:"#0EC4B8", tealBg:"#E8FBF9",
  red:"#E53E3E", redBg:"#FFF5F5",
  yellow:"#D97706", yellowBg:"#FFFBEB",
  green:"#16A34A", greenBg:"#F0FFF4",
  orange:"#EA580C",
};

function Card({ title, color = C.border, children }) {
  return (
    <div style={{ background:C.card, borderRadius:12, border:`2px solid ${color}`,
      marginBottom:12, overflow:"hidden" }}>
      <div style={{ padding:"8px 14px",
        background: color === C.border ? "#F0EDE8" : color+"22",
        borderBottom:`1px solid ${color}`,
        fontSize:11, fontWeight:800, color:C.inkSoft,
        letterSpacing:"0.08em", textTransform:"uppercase" }}>
        {title}
      </div>
      <div style={{ padding:"10px 14px" }}>{children}</div>
    </div>
  );
}

function Row({ label, value, note, warn }) {
  const isEmpty = value === null || value === undefined || value === "";
  const isArr   = Array.isArray(value);
  const isObj   = !isArr && typeof value === "object" && value !== null;
  let display = isEmpty
    ? <span style={{ color:C.red, fontStyle:"italic", fontWeight:700 }}>⚠ null / leer / undefined</span>
    : isArr
      ? <span style={{ color:C.teal, fontFamily:"monospace" }}>[{value.length}] {JSON.stringify(value).slice(0,160)}</span>
      : isObj
        ? <span style={{ color:C.inkSoft, fontSize:11, fontFamily:"monospace" }}>{JSON.stringify(value).slice(0,200)}</span>
        : <span style={{ color: warn ? C.red : C.ink }}>{String(value).slice(0,300)}</span>;
  return (
    <div style={{ padding:"5px 0", borderBottom:`1px solid #F0EDE8` }}>
      <div style={{ display:"flex", gap:8, alignItems:"flex-start", flexWrap:"wrap" }}>
        <span style={{ minWidth:180, fontSize:11, fontWeight:700, color:C.inkFaint, flexShrink:0 }}>{label}</span>
        <span style={{ fontSize:12, wordBreak:"break-all", fontFamily:"monospace" }}>{display}</span>
      </div>
      {note && <div style={{ fontSize:10.5, color:C.yellow, marginTop:2, marginLeft:188 }}>↳ {note}</div>}
    </div>
  );
}

function Badge({ val, trueLabel="true", falseLabel="false" }) {
  return (
    <span style={{ padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:800,
      background: val ? C.greenBg : C.redBg, color: val ? C.green : C.red }}>
      {val ? trueLabel : falseLabel}
    </span>
  );
}

function CodeBlock({ children }) {
  return (
    <pre style={{ background:"#1A1A18", color:"#A3E6DC", padding:"10px 12px",
      borderRadius:8, fontSize:10.5, overflowX:"auto", margin:"8px 0 0",
      lineHeight:1.6, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
      {children}
    </pre>
  );
}

function RawJson({ label, data }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom:8 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width:"100%", padding:"8px 14px", borderRadius:8,
        border:`1px solid ${C.border}`, background:"#F0EDE8",
        textAlign:"left", fontSize:11.5, fontWeight:700,
        color:C.inkSoft, cursor:"pointer", fontFamily:"inherit" }}>
        {open ? "▼" : "▶"} {label}
      </button>
      {open && (
        <pre style={{ background:"#1A1A18", color:"#A3E6DC", padding:12,
          borderRadius:"0 0 8px 8px", fontSize:10.5, overflowX:"auto",
          margin:0, lineHeight:1.5 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

// ── Normalisierung — exakt wie im Produktionscode ─────────────────

function normalizeCats(cats) {
  if (!Array.isArray(cats)) return [];
  return cats.map(c => typeof c === "string" ? { icon:"✨", label:c } : c).filter(Boolean);
}
function normalizeSkillsHook(skills) {
  if (!Array.isArray(skills)) return [];
  return skills.map(s => typeof s === "string" ? { icon:"✨", label:s } : s).filter(Boolean);
}
function normalizeSkillsSection(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(s => typeof s === "string" ? { icon:"✨", label:s } : s).filter(s => s?.label);
}
function mergeUnique(primary = [], secondary = []) {
  const norm = v => {
    if (typeof v === "string") return v.trim().toLowerCase();
    if (typeof v === "object" && v !== null) return (v.label || v.name || "").trim().toLowerCase();
    return "";
  };
  const seen = new Set(primary.map(norm).filter(Boolean));
  const result = [...primary];
  for (const item of secondary) {
    const key = norm(item);
    if (key && !seen.has(key)) { seen.add(key); result.push(item); }
  }
  return result;
}

// ── Haupt-Komponente ─────────────────────────────────────────────
export default function ProfileDebugPage() {
  const { user } = useAuth();
  const [inputId, setInputId] = useState("e85e0057-7af7-44c8-bd94-df90926275fa");
  const profileId = inputId.trim() || user?.id || null;

  const { profile, wirkerProfile, works, experiences, recommendations, moments, loading, error } =
    useProfileData(profileId);

  const isOwner = !!user?.id && !!profileId && profileId === user.id;

  const trace = useMemo(() => {
    if (!profile) return null;
    const wp = wirkerProfile;

    // SCHRITT 1 — Rohwerte
    const raw_skills        = profile?.skills;
    const raw_location      = profile?.location;
    const wp_categories     = wp?.categories;
    const wp_location_label = wp?.location_label;

    // SCHRITT 2 — Normalisierung (identisch zu useProfileData.js)
    const cats_normalized      = normalizeCats(wp_categories);
    const skills_normalized    = normalizeSkillsHook(raw_skills);
    const skills_final_computed = mergeUnique(cats_normalized, skills_normalized);
    const location_final_computed =
      (wp_location_label && typeof wp_location_label === "string" && wp_location_label.trim())
        ? wp_location_label.trim()
        : (raw_location || "");

    // SCHRITT 3 — State-Werte
    const profile_skills_final   = profile?.skills_final;
    const profile_location_final = profile?.location_final;
    const profile_skills         = profile?.skills;
    const profile_location       = profile?.location;

    // SCHRITT 4 — TalentSection.jsx Zeile 40
    const ts_input  = profile_skills_final ?? profile_skills ?? [];
    const ts_skills = normalizeSkillsSection(ts_input);
    const ts_empty  = ts_skills.length === 0;

    const nullish = {
      "skills_final === null":      profile_skills_final === null,
      "skills_final === undefined": profile_skills_final === undefined,
      "skills_final ist []":        Array.isArray(profile_skills_final) && profile_skills_final.length === 0,
      "?? greift (null/undef)":     profile_skills_final == null,
    };

    // SCHRITT 5 — LocationSection.jsx Zeile 22
    const ls_location = profile_location_final || profile_location || "";
    const ls_empty    = !ls_location;

    const loc_check = {
      "location_final truthy":      !!profile_location_final,
      "location_final Wert":        profile_location_final,
      "profiles.location Wert":     profile_location,
      "|| greift auf profiles.loc": !profile_location_final,
    };

    return {
      raw_skills, raw_location, wp_categories, wp_location_label,
      cats_normalized, skills_normalized, skills_final_computed, location_final_computed,
      profile_skills_final, profile_location_final, profile_skills, profile_location,
      ts_input, ts_skills, ts_empty, nullish,
      ls_location, ls_empty, loc_check,
    };
  }, [profile, wirkerProfile]);

  return (
    <div style={{ minHeight:"100dvh", background:C.bg,
      padding:"20px 16px 80px",
      fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      <div style={{ marginBottom:20 }}>
        <div style={{ display:"inline-block", padding:"3px 10px", borderRadius:99,
          background:C.tealBg, color:C.teal, fontSize:11, fontWeight:800,
          marginBottom:8, letterSpacing:"0.06em" }}>
          SPRINT D.8 · DATA FLOW TRACE
        </div>
        <div style={{ fontSize:22, fontWeight:900, color:C.ink }}>Profile Data Trace</div>
        <div style={{ fontSize:13, color:C.inkFaint, marginTop:2 }}>
          DB → useProfileData → TalentSection → LocationSection
        </div>
      </div>

      <Card title="🔍 Profile-ID">
        <input type="text" value={inputId}
          onChange={e => setInputId(e.target.value)}
          placeholder="UUID eingeben..."
          style={{ width:"100%", padding:"10px 12px", borderRadius:8,
            border:`1.5px solid ${C.border}`, fontSize:12, fontFamily:"monospace",
            color:C.ink, background:C.bg, outline:"none", boxSizing:"border-box" }}/>
        <div style={{ fontSize:10.5, color:C.inkFaint, marginTop:6, fontFamily:"monospace" }}>
          Aktiv: {profileId || "—"}
        </div>
      </Card>

      {loading && <div style={{ textAlign:"center", padding:40, color:C.inkFaint, fontSize:13 }}>⏳ Laden...</div>}
      {error && <Card title="❌ Error" color={C.red}><div style={{ color:C.red, fontFamily:"monospace", fontSize:12 }}>{error}</div></Card>}

      {!loading && !error && profile && trace && (
        <>
          {/* META */}
          <Card title="🔐 Meta" color={C.teal}>
            <Row label="profileId" value={profileId} />
            <Row label="user.id"   value={user?.id} />
            <div style={{ padding:"5px 0", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ minWidth:180, fontSize:11, fontWeight:700, color:C.inkFaint }}>isOwner</span>
              <Badge val={isOwner} trueLabel="✅ OWNER" falseLabel="🔒 VISITOR" />
            </div>
          </Card>

          {/* SCHRITT 1 */}
          <Card title="SCHRITT 1 — Rohwerte aus DB (vor Normalisierung)" color={C.orange}>
            <div style={{ fontSize:11, color:C.inkFaint, marginBottom:8, fontStyle:"italic" }}>
              Was Supabase zurückgibt — kein Code hat diese Werte verändert
            </div>
            <Row label="raw.skills"         value={trace.raw_skills}        note="profiles.skills (TEXT[])" warn={!trace.raw_skills?.length} />
            <Row label="raw.location"       value={trace.raw_location}      note="profiles.location (TEXT)" warn={!trace.raw_location} />
            <Row label="wp.categories"      value={trace.wp_categories}     note="wirker_profiles.categories" warn={!trace.wp_categories?.length} />
            <Row label="wp.location_label"  value={trace.wp_location_label} note="wirker_profiles.location_label" warn={!trace.wp_location_label} />
            {!wirkerProfile && (
              <div style={{ marginTop:8, padding:"8px 10px", borderRadius:8,
                background:C.redBg, color:C.red, fontSize:12, fontWeight:700 }}>
                ⚠ Kein wirker_profiles Eintrag für diese User-ID
              </div>
            )}
          </Card>

          {/* SCHRITT 2 */}
          <Card title="SCHRITT 2 — Normalisierung in useProfileData.js" color={C.yellow}>
            <div style={{ fontSize:11, color:C.inkFaint, marginBottom:8, fontStyle:"italic" }}>
              useProfileData.js Zeilen 64–219
            </div>
            <Row label="cats_normalized"         value={trace.cats_normalized}       note="Zeile 64: normalizeCats(wp?.categories)" warn={!trace.cats_normalized.length} />
            <Row label="skills_normalized"       value={trace.skills_normalized}     note="Zeile 70: normalizeSkills(raw.skills)"   warn={!trace.skills_normalized.length} />
            <Row label="skills_final (computed)" value={trace.skills_final_computed} note="Zeile 72: mergeUnique(cats, skills)"      warn={!trace.skills_final_computed.length} />
            <Row label="location_final (comp.)"  value={trace.location_final_computed} note="Zeile 209: wp.location_label || raw.location" warn={!trace.location_final_computed} />
            <CodeBlock>{`// useProfileData.js — exakter Normalisierungs-Code
// Zeile 64
cats_normalized = normalizeCats(wp?.categories)
→ Array.isArray(wp?.categories) = ${Array.isArray(trace.wp_categories)}
→ cats_normalized = ${JSON.stringify(trace.cats_normalized).slice(0,100)}

// Zeile 70
skills_normalized = normalizeSkills(raw.skills)
→ raw.skills = ${JSON.stringify(trace.raw_skills)}
→ skills_normalized = ${JSON.stringify(trace.skills_normalized).slice(0,100)}

// Zeile 72
skills_final = mergeUnique(cats_normalized, skills_normalized)
→ skills_final = ${JSON.stringify(trace.skills_final_computed).slice(0,100)}

// Zeile 209
location_final = (wp?.location_label && wp.location_label.trim())
  ? wp.location_label.trim()
  : (raw.location || "")
→ wp.location_label = ${JSON.stringify(trace.wp_location_label)}
→ location_final = ${JSON.stringify(trace.location_final_computed)}`}
            </CodeBlock>
          </Card>

          {/* SCHRITT 3 */}
          <Card title="SCHRITT 3 — profile State (TalentProfilePage empfängt)" color={C.border}>
            <div style={{ fontSize:11, color:C.inkFaint, marginBottom:8, fontStyle:"italic" }}>
              setProfile(normalizedProfile) — diese Werte landen in der Komponente
            </div>
            <Row label="profile.skills"          value={trace.profile_skills}         note="unveränderter raw.skills Wert"    warn={!trace.profile_skills?.length} />
            <Row label="profile.skills_final"    value={trace.profile_skills_final}   note="berechnetes Merge-Ergebnis"       warn={!trace.profile_skills_final?.length} />
            <Row label="profile.location"        value={trace.profile_location}       note="unveränderter raw.location Wert"  warn={!trace.profile_location} />
            <Row label="profile.location_final"  value={trace.profile_location_final} note="berechnetes location Ergebnis"    warn={!trace.profile_location_final} />
          </Card>

          {/* SCHRITT 4 */}
          <Card title="SCHRITT 4 — TalentSection.jsx Zeile 40" color={trace.ts_empty ? C.red : C.green}>
            <div style={{ fontSize:11, color:C.inkFaint, marginBottom:8, fontStyle:"italic" }}>
              src/components/profile/sections/TalentSection.jsx
            </div>
            <Row label="ts_input (Z.40a)"  value={trace.ts_input}  note="profile?.skills_final ?? profile?.skills ?? []" warn={!trace.ts_input?.length} />
            <Row label="ts_skills (Z.40b)" value={trace.ts_skills} note="normalizeSkills(ts_input).filter(s => s?.label)" warn={trace.ts_empty} />
            <div style={{ padding:"5px 0", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ minWidth:180, fontSize:11, fontWeight:700, color:C.inkFaint }}>Empty-State (Zeile 88)</span>
              <Badge val={trace.ts_empty} trueLabel="⚠ EMPTY-STATE AKTIV" falseLabel="✅ Talente werden gerendert" />
            </div>

            <CodeBlock>{`// TalentSection.jsx — Zeile 40
const skills = normalizeSkills(
  profile?.skills_final ?? profile?.skills ?? []
);
// ?? greift NUR bei null/undefined — NICHT bei []

// profile?.skills_final = ${JSON.stringify(trace.profile_skills_final)?.slice(0,80)}
// typeof = ${typeof trace.profile_skills_final}
// Array.isArray = ${Array.isArray(trace.profile_skills_final)}
// .length = ${Array.isArray(trace.profile_skills_final) ? trace.profile_skills_final.length : "n/a"}

// ?? greift auf profile.skills: ${trace.nullish["?? greift (null/undef)"]}
//    (nur wenn skills_final === null oder === undefined)

// Zeile 88: skills.length === 0 → ${trace.ts_empty}
//           → ${trace.ts_empty ? "EMPTY-STATE wird gerendert" : "Pills werden gerendert"}`}
            </CodeBlock>

            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.inkFaint, marginBottom:6,
                textTransform:"uppercase", letterSpacing:"0.06em" }}>?? Operator Check</div>
              {Object.entries(trace.nullish).map(([k, v]) => (
                <div key={k} style={{ display:"flex", gap:8, padding:"3px 0",
                  borderBottom:`1px solid #F0EDE8`, alignItems:"center" }}>
                  <span style={{ minWidth:260, fontSize:11, color:C.inkFaint, fontFamily:"monospace" }}>{k}</span>
                  <Badge val={!!v} trueLabel="true" falseLabel="false" />
                </div>
              ))}
            </div>
          </Card>

          {/* SCHRITT 5 */}
          <Card title="SCHRITT 5 — LocationSection.jsx Zeile 22" color={trace.ls_empty ? C.red : C.green}>
            <div style={{ fontSize:11, color:C.inkFaint, marginBottom:8, fontStyle:"italic" }}>
              src/components/profile/sections/LocationSection.jsx
            </div>
            <Row label="ls_location (Z.22)" value={trace.ls_location} note="profile?.location_final || profile?.location || ''" warn={trace.ls_empty} />
            <div style={{ padding:"5px 0", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ minWidth:180, fontSize:11, fontWeight:700, color:C.inkFaint }}>"Standort hinzufügen" (Z.87)</span>
              <Badge val={trace.ls_empty && isOwner} trueLabel="⚠ SICHTBAR (Owner + leer)" falseLabel="nicht aktiv" />
            </div>
            <div style={{ padding:"5px 0", display:"flex", gap:8, alignItems:"center" }}>
              <span style={{ minWidth:180, fontSize:11, fontWeight:700, color:C.inkFaint }}>"Nicht angegeben" (Z.93)</span>
              <Badge val={trace.ls_empty && !isOwner} trueLabel="⚠ VISITOR SIEHT LEER" falseLabel="nicht aktiv" />
            </div>

            <CodeBlock>{`// LocationSection.jsx — Zeile 22
const location = profile?.location_final || profile?.location || "";
// || greift bei JEDEM falsy-Wert (null, undefined, "")

// profile?.location_final = ${JSON.stringify(trace.profile_location_final)}
//   truthy = ${!!trace.profile_location_final}
// profile?.location = ${JSON.stringify(trace.profile_location)}

// Ergebnis: location = ${JSON.stringify(trace.ls_location)}
// Leer = ${trace.ls_empty}

// Zeile 87 (isOwner && !location): ${isOwner && trace.ls_empty} → ${isOwner && trace.ls_empty ? "HINZUFÜGEN" : "nicht gezeigt"}
// Zeile 93 (!isOwner && !location): ${!isOwner && trace.ls_empty} → ${!isOwner && trace.ls_empty ? "LEER VISITOR" : "nicht gezeigt"}`}
            </CodeBlock>

            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:11, fontWeight:800, color:C.inkFaint, marginBottom:6,
                textTransform:"uppercase", letterSpacing:"0.06em" }}>|| Operator Check</div>
              {Object.entries(trace.loc_check).map(([k, v]) => (
                <div key={k} style={{ display:"flex", gap:8, padding:"3px 0",
                  borderBottom:`1px solid #F0EDE8`, alignItems:"center", flexWrap:"wrap" }}>
                  <span style={{ minWidth:230, fontSize:11, color:C.inkFaint, fontFamily:"monospace" }}>{k}</span>
                  <span style={{ fontSize:11, fontFamily:"monospace", color:C.ink }}>
                    {typeof v === "boolean" ? (v ? "✅ true" : "❌ false") : (JSON.stringify(v) || <span style={{color:C.red}}>leer</span>)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* ROOT CAUSE */}
          <Card title="🔴 ROOT CAUSE — Zusammenfassung" color={C.red}>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:800, color:C.red, marginBottom:6 }}>TALENTSECTION</div>
              {trace.ts_empty ? (
                <div style={{ fontSize:12, lineHeight:1.8 }}>
                  <div>raw.skills          = <code style={{color:C.orange}}>{JSON.stringify(trace.raw_skills)?.slice(0,100)}</code></div>
                  <div>wp.categories       = <code style={{color:C.orange}}>{JSON.stringify(trace.wp_categories)?.slice(0,100)}</code></div>
                  <div>skills_final        = <code style={{color:C.orange}}>{JSON.stringify(trace.profile_skills_final)?.slice(0,100)}</code></div>
                  <div style={{ marginTop:8, padding:"10px", background:C.redBg, borderRadius:8, fontSize:11, lineHeight:1.7 }}>
                    {trace.profile_skills_final !== null && trace.profile_skills_final !== undefined
                      ? `skills_final = [] (leeres Array) — der ??-Operator in Zeile 40 greift NICHT auf profile.skills zurück, weil [] kein null/undefined ist. Selbst wenn profiles.skills Daten hätte, würden sie ignoriert.`
                      : `skills_final = null/undefined — der ??-Operator greift auf profile.skills.`
                    }
                    {(!trace.raw_skills || trace.raw_skills.length === 0)
                      ? " Zusätzlich: profiles.skills ist leer/null in der DB."
                      : " profiles.skills hat Daten in der DB."
                    }
                  </div>
                </div>
              ) : (
                <div style={{ padding:"8px", background:C.greenBg, borderRadius:8,
                  fontSize:12, color:C.green, fontWeight:700 }}>
                  ✅ TalentSection zeigt Daten korrekt an.
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:C.red, marginBottom:6 }}>LOCATIONSECTION</div>
              {trace.ls_empty ? (
                <div style={{ fontSize:12, lineHeight:1.8 }}>
                  <div>raw.location        = <code style={{color:C.orange}}>{JSON.stringify(trace.raw_location)}</code></div>
                  <div>wp.location_label   = <code style={{color:C.orange}}>{JSON.stringify(trace.wp_location_label)}</code></div>
                  <div>location_final      = <code style={{color:C.orange}}>{JSON.stringify(trace.profile_location_final)}</code></div>
                  <div style={{ marginTop:8, padding:"10px", background:C.redBg, borderRadius:8, fontSize:11, lineHeight:1.7 }}>
                    {trace.wp_location_label && typeof trace.wp_location_label === "string" && trace.wp_location_label.trim()
                      ? `wirker_profiles.location_label = "${trace.wp_location_label}" hat Priorität (Zeile 210). profiles.location wird ignoriert.`
                      : `Beide Quellen leer: wp.location_label (${JSON.stringify(trace.wp_location_label)}) UND profiles.location (${JSON.stringify(trace.raw_location)}).`
                    }
                  </div>
                </div>
              ) : (
                <div style={{ padding:"8px", background:C.greenBg, borderRadius:8,
                  fontSize:12, color:C.green, fontWeight:700 }}>
                  ✅ LocationSection zeigt Standort korrekt an.
                </div>
              )}
            </div>
          </Card>

          {/* ROHDATEN */}
          <Card title="📊 Counts">
            <Row label="works.length"           value={works?.length ?? 0} />
            <Row label="experiences.length"     value={experiences?.length ?? 0} />
            <Row label="recommendations.length" value={recommendations?.length ?? 0} />
            <Row label="moments.length"         value={moments?.length ?? 0} />
          </Card>

          <RawJson label="RAW profile (vollständig)" data={profile} />
          <RawJson label="RAW wirkerProfile" data={wirkerProfile} />
        </>
      )}

      {!loading && !error && !profile && (
        <Card title="⚠ Kein Profil" color={C.red}>
          <div style={{ color:C.red, fontSize:13 }}>Kein Profil gefunden für: {profileId}</div>
        </Card>
      )}
    </div>
  );
}
