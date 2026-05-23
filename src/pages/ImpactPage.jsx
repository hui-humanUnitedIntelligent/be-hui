// ImpactPage.jsx — PHASE 17.2 STEP 1: Statisches Layout + safeUser
// Strategie: Schichtweise Restauration — erst Layout, dann Daten, dann Intelligence
// currentUser kann null sein → safeUser ist IMMER ein vollständiges Objekt

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

// ── SAFE DEFAULTS — niemals undefined downstream ─────────────────
const EMPTY_PROFILE = {
  id:              null,
  username:        null,
  display_name:    "Gast",
  avatar_url:      null,
  membership_type: "basic",
  has_talent_profile: false,
  impact_eur:      0,
};

const EMPTY_STATS = {
  total_pool_eur:    0,
  distributed_eur:  0,
  active_projects:  0,
  community_voices: 0,
  this_month_eur:   0,
};

const EMPTY_FEED = [];

// ── Design Tokens ────────────────────────────────────────────────
const C = {
  teal:   "#16D7C5",
  coral:  "#FF8A6B",
  cream:  "#F9F7F4",
  ink:    "#1A1A1A",
  muted:  "#888888",
  border: "#EEEBE6",
  card:   "#FFFFFF",
};

// ── safe helpers ─────────────────────────────────────────────────
function safeArr(v)  { return Array.isArray(v) ? v : []; }
function safeNum(v)  { return typeof v === "number" && isFinite(v) ? v : 0; }
function safeStr(v, fallback = "") { return typeof v === "string" && v.length > 0 ? v : fallback; }

// ── Logging ──────────────────────────────────────────────────────
function log(label, data = {}) {
  const ws = window.__HUI_WORLD_STATE__ || {};
  console.log("[IMPACT 17.2]", label, {
    activeTab: ws.activeTab ?? null,
    activeSurface: ws.activeSurface ?? null,
    ...data,
  });
}

/* ══════════════════════════════════════════════════════════════════
   IMPACT PAGE
══════════════════════════════════════════════════════════════════ */
export default function ImpactPage({ currentUser }) {
  // SCHRITT 1: safeUser — IMMER ein vollständiges Objekt, niemals null
  const safeUser = currentUser ?? EMPTY_PROFILE;

  log("MOUNT", {
    currentUser_null: currentUser === null,
    safeUser_id: safeUser.id,
    membership: safeUser.membership_type,
  });

  // ── State ────────────────────────────────────────────────────
  const [stats,    setStats]    = useState(EMPTY_STATS);
  const [projects, setProjects] = useState(EMPTY_FEED);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ── Daten laden — nur wenn User vorhanden ────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        log("LOAD START");
        const { data, error: qErr } = await supabase
          .from("impact_projects")
          .select("id, name, category, description, goal_eur, raised_eur, votes, status, tags, icon, color, website")
          .eq("status", "active")
          .order("votes", { ascending: false })
          .limit(12);

        if (cancelled) return;
        if (qErr) throw qErr;

        const safe = safeArr(data).map(p => ({
          id:          p.id          ?? "unknown",
          name:        safeStr(p.name, "Unbekanntes Projekt"),
          category:    safeStr(p.category, "Gemeinschaft"),
          description: safeStr(p.description, ""),
          goal_eur:    safeNum(p.goal_eur),
          raised_eur:  safeNum(p.raised_eur),
          votes:       safeNum(p.votes),
          status:      safeStr(p.status, "active"),
          tags:        safeArr(p.tags),
          icon:        safeStr(p.icon, "🌱"),
          color:       safeStr(p.color, C.teal),
          website:     safeStr(p.website),
        }));

        // Stats aus Projekten ableiten
        const totalRaised = safe.reduce((s, p) => s + p.raised_eur, 0);
        const totalVoices = safe.reduce((s, p) => s + p.votes, 0);
        setStats({
          total_pool_eur:    totalRaised,
          distributed_eur:  totalRaised * 0.4,
          active_projects:  safe.length,
          community_voices: totalVoices,
          this_month_eur:   totalRaised * 0.1,
        });
        setProjects(safe);
        log("LOAD OK", { count: safe.length });
      } catch (err) {
        if (cancelled) return;
        // Sichtbarer Fehler — kein stiller null return
        console.error("[IMPACT 17.2] LOAD ERROR", err?.message, err?.stack?.slice(0, 200));
        setError(err?.message ?? "Unbekannter Ladefehler");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []); // Kein safeUser.id dependency — Impact ist öffentlich

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:      "100vh",
      background:     C.cream,
      paddingBottom:  100,
      width:          "100%",
      fontFamily:     "-apple-system, 'SF Pro Display', sans-serif",
    }}>

      {/* ── Header ────────────────────────────────────────────── */}
      <ImpactHeader safeUser={safeUser} />

      {/* ── Fehler-Anzeige — niemals null ────────────────────── */}
      {error && (
        <div style={{
          margin: "12px 20px", padding: "14px 16px",
          background: "#FFF5F5", border: "1px solid #FFCDD2",
          borderRadius: 12, fontSize: 13, color: "#C62828",
        }}>
          ⚠️ Ladefehler: {error}
          <span style={{ marginLeft: 8, color: C.teal, cursor: "pointer", fontWeight: 700 }}
            onClick={() => { setError(null); setLoading(true); }}>
            Erneut versuchen
          </span>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────── */}
      <ImpactStats stats={stats} loading={loading} />

      {/* ── Projekte ──────────────────────────────────────────── */}
      {loading ? (
        <ImpactSkeleton />
      ) : (
        <ImpactProjects
          projects={projects}
          safeUser={safeUser}
        />
      )}

    </div>
  );
}

/* ── ImpactHeader ─────────────────────────────────────────────── */
function ImpactHeader({ safeUser }) {
  return (
    <div style={{
      padding:    "52px 20px 24px",
      background: `linear-gradient(160deg, ${C.teal}22 0%, ${C.cream} 60%)`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.teal,
        letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
        HUI Impact Pool
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: C.ink,
        lineHeight: 1.15, marginBottom: 8 }}>
        Gemeinsam Wirkung<br/>
        <span style={{ color: C.teal }}>schaffen</span>
      </div>
      <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, maxWidth: 340 }}>
        Jede Buchung auf HUI fließt zu 15% in diesen Pool —<br/>
        die Community entscheidet, wo das Geld wirkt.
      </div>
    </div>
  );
}

/* ── ImpactStats ──────────────────────────────────────────────── */
function ImpactStats({ stats, loading }) {
  const items = [
    { label: "Im Pool",        value: loading ? "—" : `€${safeNum(stats.total_pool_eur).toLocaleString("de-DE")}`,   color: C.teal  },
    { label: "Aktive Projekte",value: loading ? "—" : String(safeNum(stats.active_projects)),                        color: C.coral },
    { label: "Stimmen",        value: loading ? "—" : String(safeNum(stats.community_voices)),                       color: C.teal  },
    { label: "Diesen Monat",   value: loading ? "—" : `€${safeNum(stats.this_month_eur).toLocaleString("de-DE")}`,   color: C.coral },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: 12, padding: "0 20px 24px" }}>
      {items.map(item => (
        <div key={item.label} style={{
          background: C.card, borderRadius: 16, padding: "14px 10px",
          textAlign: "center", boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: item.color,
            marginBottom: 2 }}>{item.value}</div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 600,
            lineHeight: 1.3 }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── ImpactSkeleton ───────────────────────────────────────────── */
function ImpactSkeleton() {
  return (
    <div style={{ padding: "0 20px" }}>
      {[1,2,3].map(i => (
        <div key={i} style={{
          background: C.card, borderRadius: 20, padding: 20,
          marginBottom: 16, height: 120,
          animation: "hui-pulse 1.4s ease-in-out infinite",
          opacity: 0.6,
        }}/>
      ))}
      <style>{`@keyframes hui-pulse { 0%,100%{opacity:0.4} 50%{opacity:0.7} }`}</style>
    </div>
  );
}

/* ── ImpactProjects ───────────────────────────────────────────── */
function ImpactProjects({ projects, safeUser }) {
  const list = safeArr(projects);

  if (list.length === 0) {
    return (
      <div style={{ padding: "32px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🌱</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
          Noch keine aktiven Projekte
        </div>
        <div style={{ fontSize: 13, color: C.muted }}>
          Die ersten Projekte werden gerade kuratiert.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink,
        marginBottom: 16, letterSpacing: "0.04em" }}>
        Aktive Projekte ({list.length})
      </div>
      {list.map(project => (
        <ImpactProjectCard key={project.id} project={project} safeUser={safeUser} />
      ))}
    </div>
  );
}

/* ── ImpactProjectCard ────────────────────────────────────────── */
function ImpactProjectCard({ project, safeUser }) {
  const pct = project.goal_eur > 0
    ? Math.min(100, Math.round((project.raised_eur / project.goal_eur) * 100))
    : 0;

  return (
    <div style={{
      background: C.card, borderRadius: 20, padding: "18px 20px",
      marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      border: `1px solid ${C.border}`,
    }}>
      {/* Icon + Name + Category */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: `${project.color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>
          {project.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink,
            marginBottom: 2, lineHeight: 1.3 }}>
            {project.name}
          </div>
          <div style={{ fontSize: 11, color: project.color, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {project.category}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.teal }}>
            {project.votes}
          </div>
          <div style={{ fontSize: 10, color: C.muted }}>Stimmen</div>
        </div>
      </div>

      {/* Description */}
      {project.description.length > 0 && (
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6,
          marginBottom: 12, display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {project.description}
        </div>
      )}

      {/* Progress Bar */}
      {project.goal_eur > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between",
            marginBottom: 4, fontSize: 11, color: C.muted }}>
            <span>€{project.raised_eur.toLocaleString("de-DE")} gesammelt</span>
            <span>{pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: C.border, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 6, width: `${pct}%`,
              background: `linear-gradient(90deg, ${C.teal}, ${C.coral})`,
              transition: "width 0.8s ease",
            }}/>
          </div>
        </div>
      )}

      {/* Tags */}
      {project.tags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {project.tags.slice(0,3).map(tag => (
            <span key={tag} style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 20,
              background: `${C.teal}18`, color: C.teal, fontWeight: 600,
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
