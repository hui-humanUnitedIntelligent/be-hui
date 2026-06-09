// src/pages/ProfileDebugPage.jsx
// ═══════════════════════════════════════════════════════════════
// SPRINT D.3 — Temporäre Debug-Seite /profile-debug
// READ-ONLY. Kein Schreiben. Kein Editieren. Kein Routing-Einfluss.
// ═══════════════════════════════════════════════════════════════
import React, { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { useProfileData } from "../hooks/useProfileData";

// ── Design-Tokens (minimal, inline) ─────────────────────────────
const C = {
  bg:       "#F7F5F0",
  card:     "#FFFFFF",
  border:   "#E8E4DC",
  ink:      "#1A1A18",
  inkSoft:  "#4A4A45",
  inkFaint: "#8C8C85",
  teal:     "#16D7C5",
  tealBg:   "#E8FBF9",
  red:      "#E53E3E",
  redBg:    "#FFF5F5",
  yellow:   "#D97706",
  yellowBg: "#FFFBEB",
  green:    "#16A34A",
  greenBg:  "#F0FFF4",
};

// ── Kleine Helfer-Komponenten ────────────────────────────────────

function Card({ title, color = C.border, children }) {
  return (
    <div style={{
      background: C.card, borderRadius: 12,
      border: `2px solid ${color}`,
      marginBottom: 12, overflow: "hidden",
    }}>
      <div style={{
        padding: "8px 14px",
        background: color === C.border ? "#F0EDE8" : color + "22",
        borderBottom: `1px solid ${color}`,
        fontSize: 11, fontWeight: 800, color: C.inkSoft,
        letterSpacing: "0.08em", textTransform: "uppercase",
      }}>
        {title}
      </div>
      <div style={{ padding: "10px 14px" }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  const isEmpty  = value === null || value === undefined || value === "";
  const isArr    = Array.isArray(value);
  const isObj    = !isArr && typeof value === "object" && value !== null;

  let display = isEmpty ? <span style={{ color: C.inkFaint, fontStyle: "italic" }}>null / leer</span>
              : isArr   ? <span style={{ color: C.teal }}>[{value.length}] {JSON.stringify(value).slice(0,120)}</span>
              : isObj   ? <span style={{ color: C.inkSoft, fontSize: 11 }}>{JSON.stringify(value).slice(0,200)}</span>
              :           <span style={{ color: highlight || C.ink }}>{String(value)}</span>;

  return (
    <div style={{
      display: "flex", gap: 8, padding: "5px 0",
      borderBottom: `1px solid ${C.border}`,
      alignItems: "flex-start",
    }}>
      <span style={{ minWidth: 140, fontSize: 11.5, fontWeight: 700, color: C.inkFaint, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, wordBreak: "break-word", flex: 1 }}>
        {display}
      </span>
    </div>
  );
}

function Badge({ val, trueLabel = "true", falseLabel = "false" }) {
  const ok = val === true;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 700,
      background: ok ? C.greenBg : C.redBg,
      color: ok ? C.green : C.red,
    }}>
      {ok ? trueLabel : falseLabel}
    </span>
  );
}

function StatusPill({ val }) {
  const colors = {
    published:      [C.greenBg,  C.green],
    approved:       [C.greenBg,  C.green],
    pending_review: [C.yellowBg, C.yellow],
    pending:        [C.yellowBg, C.yellow],
    draft:          ["#F3F4F6",  "#6B7280"],
    rejected:       [C.redBg,    C.red],
  };
  const [bg, fg] = colors[val] || ["#F3F4F6", "#6B7280"];
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 99,
      fontSize: 11, fontWeight: 700, background: bg, color: fg,
    }}>
      {val || "—"}
    </span>
  );
}

// ── Haupt-Komponente ─────────────────────────────────────────────
export default function ProfileDebugPage() {
  const { user } = useAuth();

  // Default: eigene User-ID; über Input änderbar
  const [inputId, setInputId] = useState("");
  const profileId = inputId.trim() || user?.id || null;

  const {
    profile,
    wirkerProfile,
    works,
    experiences,
    recommendations,
    moments,
    loading,
    error,
  } = useProfileData(profileId);

  const isOwner = !!user?.id && !!profileId && (profileId === user.id);

  return (
    <div style={{
      minHeight: "100dvh",
      background: C.bg,
      padding: "20px 16px 60px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: "inline-block", padding: "3px 10px", borderRadius: 99,
          background: C.tealBg, color: C.teal, fontSize: 11, fontWeight: 800,
          marginBottom: 8, letterSpacing: "0.06em",
        }}>
          SPRINT D.3 · DEBUG READ-ONLY
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.ink }}>
          Profile Debug Screen
        </div>
        <div style={{ fontSize: 13, color: C.inkFaint, marginTop: 2 }}>
          /profile-debug — kein Schreiben, kein Löschen, nur Anzeige
        </div>
      </div>

      {/* ── Profile-ID Input ───────────────────────────────── */}
      <Card title="🔍 Profile-ID eingeben (leer = eigenes Profil)">
        <input
          type="text"
          placeholder={user?.id || "UUID eingeben..."}
          value={inputId}
          onChange={e => setInputId(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: `1.5px solid ${C.border}`, fontSize: 13,
            fontFamily: "monospace", color: C.ink, background: C.bg,
            outline: "none", boxSizing: "border-box",
          }}
        />
        {inputId && (
          <button
            onClick={() => setInputId("")}
            style={{
              marginTop: 8, padding: "6px 14px", borderRadius: 8,
              border: `1px solid ${C.border}`, background: "white",
              fontSize: 12, color: C.inkSoft, cursor: "pointer",
              fontFamily: "inherit",
            }}>
            ← Zurück zu eigenem Profil
          </button>
        )}
      </Card>

      {/* ── Loading / Error ────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: C.inkFaint, fontSize: 13 }}>
          ⏳ Laden...
        </div>
      )}
      {error && (
        <Card title="❌ Error" color={C.red}>
          <div style={{ color: C.red, fontFamily: "monospace", fontSize: 12 }}>{error}</div>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* ── 0. Meta ──────────────────────────────────────── */}
          <Card title="🔐 Meta" color={C.teal}>
            <Row label="profileId"  value={profileId} highlight={C.teal} />
            <Row label="user.id"    value={user?.id}  highlight={C.inkSoft} />
            <div style={{ padding: "5px 0", display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ minWidth: 140, fontSize: 11.5, fontWeight: 700, color: C.inkFaint }}>isOwner</span>
              <Badge val={isOwner} trueLabel="✅ OWNER" falseLabel="🔒 VISITOR" />
            </div>
          </Card>

          {/* ── 1. Profile ───────────────────────────────────── */}
          <Card title="👤 profiles" color={C.border}>
            <Row label="display_name"    value={profile?.display_name} />
            <Row label="membership_type" value={profile?.membership_type} />
            <Row label="is_talent"       value={profile?.is_talent !== undefined ? String(profile.is_talent) : null} />
            <Row label="bio"             value={profile?.bio} />
            <Row label="location"        value={profile?.location} />
            <Row label="location_final"  value={profile?.location_final} highlight={C.teal} />
            <Row label="skills"          value={profile?.skills} />
            <Row label="skills_final"    value={profile?.skills_final} />
          </Card>

          {/* ── 2. wirker_profiles ───────────────────────────── */}
          <Card title="⚡ wirker_profiles" color={wirkerProfile ? C.teal : C.red}>
            {!wirkerProfile ? (
              <div style={{ color: C.red, fontSize: 13, fontWeight: 700, padding: "4px 0" }}>
                ⚠️ Kein wirker_profiles Eintrag gefunden
              </div>
            ) : (
              <>
                <Row label="talent"         value={wirkerProfile?.talent} />
                <Row label="categories"     value={wirkerProfile?.categories} />
                <Row label="location_label" value={wirkerProfile?.location_label} />
                <Row label="hourly_rate"    value={wirkerProfile?.hourly_rate} />
                <Row label="is_verified"    value={wirkerProfile?.is_verified !== undefined ? String(wirkerProfile.is_verified) : null} />
                <Row label="rating_avg"     value={wirkerProfile?.rating_avg} />
                <Row label="booking_count"  value={wirkerProfile?.booking_count} />
              </>
            )}
          </Card>

          {/* ── 3. Counts ────────────────────────────────────── */}
          <Card title="📊 Counts">
            <Row label="works.length"           value={works?.length ?? 0} />
            <Row label="experiences.length"     value={experiences?.length ?? 0} />
            <Row label="recommendations.length" value={recommendations?.length ?? 0} />
            <Row label="moments.length"         value={moments?.length ?? 0} />
          </Card>

          {/* ── 4. Works ─────────────────────────────────────── */}
          <Card title={`🎨 works (${works?.length ?? 0})`} color={works?.length ? C.border : C.red}>
            {(!works || works.length === 0) ? (
              <div style={{ color: C.red, fontSize: 13, fontStyle: "italic" }}>Keine Werke in DB gefunden</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      {["Titel","status","approval_status"].map(h => (
                        <th key={h} style={{ padding: "4px 8px", textAlign: "left",
                          color: C.inkFaint, fontWeight: 700, fontSize: 11 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {works.map((w, i) => (
                      <tr key={w.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "5px 8px", color: C.ink, maxWidth: 140,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {w.title || "—"}
                        </td>
                        <td style={{ padding: "5px 8px" }}>
                          <StatusPill val={w.status} />
                        </td>
                        <td style={{ padding: "5px 8px" }}>
                          <StatusPill val={w.approval_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ── 5. Experiences ───────────────────────────────── */}
          <Card title={`🗓 experiences (${experiences?.length ?? 0})`} color={experiences?.length ? C.border : C.red}>
            {(!experiences || experiences.length === 0) ? (
              <div style={{ color: C.red, fontSize: 13, fontStyle: "italic" }}>Keine Erlebnisse in DB gefunden</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      {["Titel","status","visibility"].map(h => (
                        <th key={h} style={{ padding: "4px 8px", textAlign: "left",
                          color: C.inkFaint, fontWeight: 700, fontSize: 11 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {experiences.map((e, i) => (
                      <tr key={e.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "5px 8px", color: C.ink, maxWidth: 140,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.title || "—"}
                        </td>
                        <td style={{ padding: "5px 8px" }}>
                          <StatusPill val={e.status} />
                        </td>
                        <td style={{ padding: "5px 8px", color: C.inkSoft, fontSize: 11 }}>
                          {e.visibility || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ── 6. Recommendations ───────────────────────────── */}
          <Card title={`⭐ recommendations (${recommendations?.length ?? 0})`}>
            {(!recommendations || recommendations.length === 0) ? (
              <div style={{ color: C.inkFaint, fontSize: 13, fontStyle: "italic" }}>
                Keine Empfehlungen — FK: wirker_id = profileId
              </div>
            ) : (
              recommendations.map((r, i) => (
                <div key={r.id || i} style={{
                  padding: "6px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12,
                }}>
                  <div style={{ fontWeight: 700, color: C.ink }}>{r.reviewer_name || "Anonym"}</div>
                  <div style={{ color: C.inkFaint, fontSize: 11 }}>
                    wirker_id: {r.wirker_id} · rating: {r.rating}
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* ── Raw JSON Toggle ───────────────────────────────── */}
          <RawJson label="RAW profile" data={profile} />
          <RawJson label="RAW wirkerProfile" data={wirkerProfile} />
        </>
      )}
    </div>
  );
}

// ── Raw JSON aufklappbar ─────────────────────────────────────────
function RawJson({ label, data }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "8px 14px", borderRadius: 8,
          border: `1px solid ${C.border}`, background: "#F0EDE8",
          textAlign: "left", fontSize: 11.5, fontWeight: 700,
          color: C.inkSoft, cursor: "pointer", fontFamily: "inherit",
        }}>
        {open ? "▼" : "▶"} {label}
      </button>
      {open && (
        <pre style={{
          background: "#1A1A18", color: "#A3E6DC", padding: 12,
          borderRadius: "0 0 8px 8px", fontSize: 10.5, overflowX: "auto",
          margin: 0, lineHeight: 1.5,
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
