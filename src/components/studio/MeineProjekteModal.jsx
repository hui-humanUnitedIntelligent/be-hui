import { HUIAwardIcon, HUIFinanzIcon, HUIImpactIcon, HUIKategorieIcon, HUISchreibenIcon, HUIStimmeIcon } from '../../design/icons/HuiSystemIcons.jsx';
// MeineProjekteModal.jsx — "Meine unterstützten Projekte"
// ══════════════════════════════════════════════════════
// Zeigt finanzielle Unterstützungen aus project_support
// + Stimmabgaben aus impact_votes
// + Projekt-Details aus impact_projects
// Vorbereitet für zukünftige project_id-Verlinkung
// ══════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";
import ImpactProjektUpdateSheet from "./ImpactProjektUpdateSheet.jsx";
import MilestoneUpdateSheet from "./MilestoneUpdateSheet.jsx";

// ── Design Tokens (identisch zu HuiStudio) ────────────────────────
const T = {
  bg:       "#F7F5F0",
  bgCard:   "#FFFFFF",
  teal:     "#0EC4B8",
  tealDeep: "#0AADA3",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.22)",
  coral:    "#FF6B6B",
  coralSoft:"rgba(255,107,107,0.10)",
  violet:   "#7C3AED",
  violetSoft:"rgba(124,58,237,0.10)",
  amber:    "#F59E0B",
  amberSoft:"rgba(245,158,11,0.10)",
  green:    "#10B981",
  greenSoft:"rgba(16,185,129,0.10)",
  ink:      "#1A1A18",
  inkSoft:  "rgba(26,26,24,0.52)",
  inkFaint: "rgba(26,26,24,0.32)",
  border:   "rgba(26,26,24,0.08)",
  r16: 16, r12: 12, r8: 8, r99: 99,
  card: "0 1px 6px rgba(26,26,24,0.07)",
};

// ── Helpers ───────────────────────────────────────────────────────
function fmtEur(n) {
  if (!n && n !== 0) return "—";
  return `€${Number(n).toLocaleString("de-DE", { minimumFractionDigits: 0 })}`;
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMonth(iso) {
  if (!iso) return "";
  const [y, m] = iso.split("-");
  const N = ["","Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  return `${N[parseInt(m, 10)]} ${y}`;
}

// Projekt-Status berechnen
function projectStatus(proj) {
  if (!proj) return { label: "Unbekannt", color: T.inkSoft, bg: T.border, icon: "❓" };
  if (proj.distributed_at) return { label: "Abgeschlossen", color: T.green,  bg: T.greenSoft,  icon: "✅" };
  if (proj.status === "voting")      return { label: "Abstimmung",  color: T.violet, bg: T.violetSoft, icon: <HUIStimmeIcon size={14}/> };
  if (proj.status === "active")      return { label: "Laufend",     color: T.teal,   bg: T.tealSoft,   icon: "🟢" };
  if (proj.status === "funded")      return { label: "Gefördert",   color: T.amber,  bg: T.amberSoft,  icon: <HUIAwardIcon size={14}/> };
  return { label: proj.status || "Offen", color: T.inkSoft, bg: T.border, icon: "⏳" };
}

// ── Komponente ────────────────────────────────────────────────────
export default function MeineProjekteModal({ profile, onClose, switchTab = null }) {
  const [tab,          setTab]          = useState("unterstuetzt"); // "unterstuetzt" | "stimmen"
  const [supports,     setSupports]     = useState([]);  // project_support records
  const [votes,        setVotes]        = useState([]);  // impact_votes records
  const [projects,     setProjects]     = useState({});  // { [id]: impact_projects record }
  const [loading,      setLoading]      = useState(true);
  const [selectedProj, setSelectedProj] = useState(null); // Projekt-Detail
  const [impactApps,  setImpactApps]  = useState([]);  // impact_applications des Users
  const [impactLoading, setImpactLoading] = useState(false);
  const [showUpdateSheet, setShowUpdateSheet] = useState(false);
  const [updateProject,  setUpdateProject]  = useState(null); // project_id for update sheet
  const [milestoneUpdate, setMilestoneUpdate] = useState(null); // { milestone, projectId } for MilestoneUpdateSheet

  // ── Daten laden ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // 1. Finanzielle Unterstützungen (project_support)
      const { data: supData } = await supabase
        .from("project_support")
        .select("id,project_id,amount_eur,message,anonymous,created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false });

      // 2. Stimmabgaben (impact_votes)
      const { data: voteData } = await supabase
        .from("impact_votes")
        .select("id,project_id,pool_month,weight,created_at")
        .eq("voter_id", profile.id)
        .order("created_at", { ascending: false });

      setSupports(supData || []);
      setVotes(voteData || []);

      // 3. Alle referenzierten Projekt-IDs → impact_projects laden
      const allIds = [
        ...new Set([
          ...(supData || []).map(s => s.project_id),
          ...(voteData || []).map(v => v.project_id),
        ].filter(Boolean))
      ];

      if (allIds.length > 0) {
        const { data: projData } = await supabase
          .from("impact_projects")
          .select("id,name,icon,color,status,description,tags,category,votes,awarded_eur,distributed_at,website,month")
          .in("id", allIds);
        const map = {};
        (projData || []).forEach(p => { map[p.id] = p; });
        setProjects(map);
      }

      // 4. Impact-Projekte des Users (impact_applications)
      const email = profile?.email || profile?.contact_email || null;
      let impactQuery = supabase
        .from("impact_applications")
        .select("id,project_name,short_desc,status,funding_goal,cover_url,media_urls,created_at,contact_email,user_id")
        .order("created_at", { ascending: false });
      // Filter by user_id OR contact_email
      if (email) {
        impactQuery = impactQuery.or(`user_id.eq.${profile.id},contact_email.eq.${email}`);
      } else {
        impactQuery = impactQuery.eq("user_id", profile.id);
      }
      const { data: impactData } = await impactQuery;
      setImpactApps(impactData || []);
    } catch (e) {
      console.warn("[MeineProjekte] load:", e);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  // ── Summen berechnen ─────────────────────────────────────────────
  const totalEur      = supports.reduce((s, r) => s + (r.amount_eur || 0), 0);
  const abgeschlossen = supports.filter(s => projects[s.project_id]?.distributed_at);
  const offen         = supports.filter(s => !projects[s.project_id]?.distributed_at);

  // ── Zum Projekt navigieren ───────────────────────────────────────
  const goToProject = (projectId) => {
    onClose?.();
    document.body.style.overflow = "";
    if (typeof switchTab === "function") {
      switchTab("impact");
    } else {
      window.history.pushState({}, "", "/impact");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
    if (projectId) {
      setTimeout(() => {
        const el = document.getElementById(`project-${projectId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 450);
    }
  };

  // ── Modal ─────────────────────────────────────────────────────────
  const modal = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10500,
        background: "rgba(26,26,24,0.52)",
        display: "flex", alignItems: "flex-end",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: T.bg, borderRadius: "24px 24px 0 0",
        maxHeight: "92vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -4px 32px rgba(26,26,24,0.18)",
      }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(26,26,24,0.12)" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px 14px",
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em" }}>
              
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
              Unterstützungen &amp; Stimmen
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(26,26,24,0.07)", border: "none", cursor: "pointer",
            borderRadius: "50%", width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: T.inkSoft,
          }}>✕</button>
        </div>

        {/* ── Übersichts-Kacheln ── */}
        <div style={{ padding: "0 20px 14px", display: "flex", gap: 10 }}>
          {/* Gesamt investiert */}
          <div style={{
            flex: 1, background: T.tealSoft, borderRadius: T.r12,
            border: `1px solid ${T.tealMid}`, padding: "12px 14px", textAlign: "center",
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.teal }}>{fmtEur(totalEur)}</div>
            <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>Gesamt investiert</div>
          </div>
          {/* Abgeschlossen */}
          <div style={{
            flex: 1, background: T.greenSoft, borderRadius: T.r12,
            border: `1px solid rgba(16,185,129,0.20)`, padding: "12px 14px", textAlign: "center",
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>{abgeschlossen.length}</div>
            <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>Abgeschlossen</div>
          </div>
          {/* Offen / laufend */}
          <div style={{
            flex: 1, background: T.amberSoft, borderRadius: T.r12,
            border: `1px solid rgba(245,158,11,0.20)`, padding: "12px 14px", textAlign: "center",
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.amber }}>{offen.length}</div>
            <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>Laufend</div>
          </div>
          {/* Stimmen gesamt */}
          <div style={{
            flex: 1, background: T.violetSoft, borderRadius: T.r12,
            border: `1px solid rgba(124,58,237,0.20)`, padding: "12px 14px", textAlign: "center",
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.violet }}>{votes.length}</div>
            <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>Stimmen</div>
          </div>
        </div>

        {/* ── Tab-Bar ── */}
        <div style={{
          display: "flex", gap: 0, margin: "0 20px 14px",
          background: "rgba(26,26,24,0.06)", borderRadius: T.r12, padding: 3,
        }}>
          {[
            { key: "unterstuetzt", label: "Finanziell" },
            { key: "stimmen",      label: "Stimmen" },
            { key: "impact",       label: "Impact" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: "8px 0", borderRadius: T.r12 - 2,
              border: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: 13, fontWeight: 700,
              background: tab === t.key ? T.bgCard : "transparent",
              color: tab === t.key ? T.ink : T.inkSoft,
              boxShadow: tab === t.key ? "0 1px 4px rgba(26,26,24,0.10)" : "none",
              transition: "all .15s",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Scroll-Content ── */}
        <div className="studio-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 20px 100px" }}>

          {loading && (
            <div style={{ textAlign: "center", padding: "32px 0", color: T.inkSoft, fontSize: 14 }}>
              Wird geladen…
            </div>
          )}

          {/* ════ TAB: Finanzielle Unterstützungen ════ */}
          {!loading && tab === "unterstuetzt" && (
            <>
              {supports.length === 0 ? (
                <EmptyState
                  icon={<HUIFinanzIcon size={36}/>}
                  title="Noch keine Unterstützungen"
                  desc="Sobald du Projekte finanziell unterstützt, erscheinen sie hier."
                />
              ) : (
                <>
                  {/* Abgeschlossene Projekte */}
                  {abgeschlossen.length > 0 && (
                    <GroupHeader label="✅ Abgeschlossen" count={abgeschlossen.length} />
                  )}
                  {abgeschlossen.map(s => (
                    <SupportCard
                      key={s.id}
                      support={s}
                      project={projects[s.project_id]}
                      onGoToProject={goToProject}
                    />
                  ))}

                  {/* Laufende Projekte */}
                  {offen.length > 0 && (
                    <GroupHeader label="🟡 Laufend / Offen" count={offen.length} />
                  )}
                  {offen.map(s => (
                    <SupportCard
                      key={s.id}
                      support={s}
                      project={projects[s.project_id]}
                      onGoToProject={goToProject}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {/* ════ TAB: Stimmen ════ */}
          {!loading && tab === "stimmen" && (
            <>
              {votes.length === 0 ? (
                <EmptyState
                  icon={<HUIStimmeIcon size={36}/>}
                  title="Noch keine Stimmen"
                  desc="Deine monatlichen Impact-Stimmen erscheinen hier, sobald du abgestimmt hast."
                />
              ) : (
                <>
                  {/* Stimmen nach Monat gruppieren */}
                  {groupByMonth(votes).map(({ month, items }) => (
                    <div key={month}>
                      <GroupHeader label={fmtMonth(month)} count={items.length} />
                      {items.map(v => (
                        <VoteCard
                          key={v.id}
                          vote={v}
                          project={projects[v.project_id]}
                          onGoToProject={goToProject}
                        />
                      ))}
                    </div>
                  ))}
                </>
              )}
            </>
          )}

          {/* ════ TAB: Impact Projekte ════ */}
          {!loading && tab === "impact" && (
            <>
              {impactApps.length === 0 ? (
                <EmptyState
                  icon={<HUIImpactIcon size={36}/>}
                  title="Du hast noch kein Impact-Projekt eingereicht"
                  desc="Reiche ein Herzensprojekt ein und sammle Unterstuetzung aus der Community."
                />
              ) : (
                <>
                  <GroupHeader label="Meine Impact-Projekte" count={impactApps.length} />
                  {impactApps.map(app => (
                    <ImpactProjectCard
                      key={app.id}
                      app={app}
                      onAddUpdate={(pid) => { setUpdateProject(pid); setShowUpdateSheet(true); }}
                      onMilestoneUpdate={(ms, pid) => { setMilestoneUpdate({ milestone: ms, projectId: pid }); }}
                    />
                  ))}
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );

  {/* Update-Sheet (legacy project update) */}
  {showUpdateSheet && updateProject && (
    <ImpactProjektUpdateSheet
      projectId={updateProject}
      authorId={profile?.id}
      onClose={() => { setShowUpdateSheet(false); setUpdateProject(null); }}
      onSubmitted={() => { /* could reload */ }}
    />
  )}

  {/* Milestone-Update-Sheet */}
  {milestoneUpdate && (
    <MilestoneUpdateSheet
      milestone={milestoneUpdate.milestone}
      projectId={milestoneUpdate.projectId}
      authorId={profile?.id}
      onClose={() => setMilestoneUpdate(null)}
      onSubmitted={() => { load(); }}
    />
  )}

  return createPortal(modal, document.body);
}

// ── Hilfsfunktion: nach pool_month gruppieren ─────────────────────
function groupByMonth(votes) {
  const map = {};
  votes.forEach(v => {
    const m = v.pool_month || "unbekannt";
    if (!map[m]) map[m] = [];
    map[m].push(v);
  });
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, items]) => ({ month, items }));
}

// ── Sub-Komponenten ───────────────────────────────────────────────
function GroupHeader({ label, count }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 8, marginTop: 4,
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{label}</div>
      <div style={{
        fontSize: 11, fontWeight: 600, color: T.inkSoft,
        background: "rgba(26,26,24,0.06)", borderRadius: T.r99,
        padding: "2px 8px",
      }}>{count}</div>
    </div>
  );
}

function SupportCard({ support: s, project: p, onGoToProject }) {
  const status = projectStatus(p);
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: T.bgCard, borderRadius: T.r16,
      border: `1px solid ${T.border}`, marginBottom: 10,
      boxShadow: T.card, overflow: "hidden",
    }}>
      {/* Haupt-Row */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "center", gap: 12,
          width: "100%", padding: "14px 14px",
          background: "none", border: "none", cursor: "pointer",
          textAlign: "left", fontFamily: "inherit",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Icon */}
        <span style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: p?.color || T.teal,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>{p?.icon || "🌱"}</span>

        {/* Name + Datum */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: T.ink,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {p?.name || "Projekt (ID vorbereitet)"}
          </div>
          <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>
            {fmtDate(s.created_at)}
          </div>
        </div>

        {/* Betrag + Status */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.teal }}>
            {fmtEur(s.amount_eur)}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: status.color,
            background: status.bg, borderRadius: T.r99,
            padding: "2px 8px", marginTop: 3,
          }}>
            {status.icon} {status.label}
          </div>
        </div>

        {/* Chevron */}
        <span style={{
          fontSize: 14, color: T.inkFaint,
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform .2s", flexShrink: 0,
        }}>›</span>
      </button>

      {/* Expandierter Detail-Bereich */}
      {expanded && (
        <div style={{
          borderTop: `1px solid ${T.border}`,
          padding: "12px 14px 14px",
          background: "rgba(26,26,24,0.02)",
        }}>
          {/* Beschreibung */}
          {p?.description && (
            <div style={{
              fontSize: 13, color: T.inkSoft, lineHeight: 1.5,
              marginBottom: 10,
            }}>
              {p.description.length > 200 ? p.description.slice(0, 197) + "…" : p.description}
            </div>
          )}

          {/* Tags */}
          {p?.tags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {p.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 11, fontWeight: 600, color: T.teal,
                  background: T.tealSoft, border: `1px solid ${T.tealMid}`,
                  padding: "2px 8px", borderRadius: T.r99,
                }}>{tag}</span>
              ))}
            </div>
          )}

          {/* Kategorie + Stimmen */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {p?.category && (
              <span style={{
                fontSize: 11, color: T.inkSoft,
                background: "rgba(26,26,24,0.06)", borderRadius: T.r99,
                padding: "3px 10px",
                display: "flex", alignItems: "center", gap: 3,
              }}><HUIKategorieIcon size={12}/>{p.category}</span>
            )}
            {p?.votes !== undefined && (
              <span style={{
                fontSize: 11, color: T.inkSoft,
                background: "rgba(26,26,24,0.06)", borderRadius: T.r99,
                padding: "3px 10px",
                display: "flex", alignItems: "center", gap: 3,
              }}><HUIStimmeIcon size={12}/>{p.votes} Stimmen</span>
            )}
            {p?.awarded_eur > 0 && (
              <span style={{
                fontSize: 11, color: T.green, fontWeight: 700,
                background: T.greenSoft, borderRadius: T.r99,
                padding: "3px 10px",
                display: "flex", alignItems: "center", gap: 3,
              }}><HUIAwardIcon size={12}/>{fmtEur(p.awarded_eur)} gefördert</span>
            )}
          </div>

          {/* Persönliche Nachricht */}
          {s.message && (
            <div style={{
              fontSize: 12, color: T.inkSoft, fontStyle: "italic",
              background: T.tealSoft, borderRadius: T.r12,
              padding: "8px 10px", marginBottom: 10,
            }}>
              „{s.message}"
            </div>
          )}

          {/* Aktions-Button: Zum Projekt */}
          {p?.id && (
            <button
              onClick={() => onGoToProject(p.id)}
              style={{
                width: "100%", padding: "10px", borderRadius: T.r12,
                background: `linear-gradient(135deg, ${T.teal}, ${T.tealDeep})`,
                border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700, color: "#fff",
                fontFamily: "inherit",
                boxShadow: "0 2px 8px rgba(14,196,184,0.25)",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              Zum Projekt im Impact Pool →
            </button>
          )}

          {/* Platzhalter wenn noch kein Impact-Projekt verknüpft */}
          {!p?.id && (
            <div style={{
              fontSize: 12, color: T.inkFaint, textAlign: "center",
              padding: "6px 0",
            }}>
              Projekt-Verlinkung wird vorbereitet (ID wird vergeben)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VoteCard({ vote: v, project: p, onGoToProject }) {
  const status = projectStatus(p);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: T.bgCard, borderRadius: T.r16,
      border: `1px solid ${T.border}`, marginBottom: 10,
      padding: "12px 14px", boxShadow: T.card,
    }}>
      {/* Icon */}
      <span style={{
        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
        background: p?.color || T.violet,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>{p?.icon || "🌱"}</span>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: T.ink,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {p?.name || "Projekt (ID vorbereitet)"}
        </div>
        <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>
          {fmtDate(v.created_at)}
          {v.weight > 1 && (
            <span style={{
              marginLeft: 8, fontSize: 10, fontWeight: 700, color: T.violet,
              background: T.violetSoft, borderRadius: T.r99, padding: "1px 6px",
            }}>×{v.weight} Gewicht</span>
          )}
        </div>
      </div>

      {/* Status + Link */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: status.color,
          background: status.bg, borderRadius: T.r99,
          padding: "2px 8px",
        }}>
          {status.icon} {status.label}
        </div>
        {p?.id && (
          <button
            onClick={() => onGoToProject(p.id)}
            style={{
              fontSize: 11, fontWeight: 600, color: T.teal,
              background: T.tealSoft, border: "none", cursor: "pointer",
              borderRadius: T.r99, padding: "3px 10px",
              fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            Ansehen →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Impact-Projekt-Karte ──────────────────────────────────────────
function ImpactProjectCard({ app, onAddUpdate, onMilestoneUpdate }) {
  const [voteCount, setVoteCount] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const fundingGoal = app.funding_goal || 0;
  const progressPct = fundingGoal > 0 ? Math.min(100, Math.round((app.current_amount_eur || 0) / fundingGoal * 100)) : 0;

  // Stimmen laden
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { count } = await supabase
          .from("impact_votes")
          .select("id", { count: "exact", head: true })
          .eq("project_id", app.id);
        if (!dead) setVoteCount(count || 0);
      } catch { if (!dead) setVoteCount(0); }
    })();
    return () => { dead = true; };
  }, [app.id]);

  // Meilensteine laden
  useEffect(() => {
    let dead2 = false;
    (async () => {
      try {
        setMilestonesLoading(true);
        const { data: msData } = await supabase
          .from("impact_milestones")
          .select("*, impact_milestone_updates(*)")
          .eq("project_id", app.id)
          .order("sort_order");
        if (!dead2) { setMilestones(msData || []); setMilestonesLoading(false); }
      } catch {
        if (!dead2) { setMilestones([]); setMilestonesLoading(false); }
      }
    })();
    return () => { dead2 = true; };
  }, [app.id]);

  const statusInfo = (() => {
    switch (app.status) {
      case "approved":  return { label: "Bewilligt",   color: T.green,  bg: T.greenSoft,  icon: "✅" };
      case "pending":   return { label: "In Pruefung", color: T.amber,  bg: T.amberSoft,  icon: "⏳" };
      case "rejected":  return { label: "Abgelehnt",   color: T.coral,  bg: T.coralSoft,  icon: "❌" };
      case "draft":     return { label: "Entwurf",     color: T.inkSoft,bg: T.border,      icon: <HUISchreibenIcon size={14}/> };
      default:          return { label: app.status || "Offen", color: T.inkSoft, bg: T.border, icon: <HUIStimmeIcon size={14}/> };
    }
  })();

  const coverImg = app.cover_url || (app.media_urls && app.media_urls[0]) || null;

  return (
    <div style={{
      background: T.bgCard, borderRadius: T.r16,
      border: `1px solid ${T.border}`, marginBottom: 10,
      boxShadow: T.card, overflow: "hidden",
    }}>
      {/* Cover */}
      {coverImg && (
        <div style={{ height: 100, overflow: "hidden" }}>
          <img loading="lazy" decoding="async" src={coverImg} alt={app.project_name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => e.target.style.display = "none"} />
        </div>
      )}

      <div style={{ padding: "12px 14px" }}>
        {/* Name + Status */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, lineHeight: 1.3 }}>
              {app.project_name || "Unbenanntes Projekt"}
            </div>
            {app.short_desc && (
              <div style={{
                fontSize: 12, color: T.inkSoft, marginTop: 3, lineHeight: 1.4,
                overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              }}>
                {app.short_desc}
              </div>
            )}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, color: statusInfo.color,
            background: statusInfo.bg, borderRadius: T.r99,
            padding: "3px 8px", flexShrink: 0,
          }}>
            {statusInfo.icon} {statusInfo.label}
          </span>
        </div>

        {/* Fortschrittsbalken */}
        {fundingGoal > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: 11, color: T.inkSoft, marginBottom: 4,
            }}>
              <span>Fortschritt</span>
              <span style={{ fontWeight: 700, color: T.teal }}>{progressPct}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: "rgba(26,26,24,0.06)" }}>
              <div style={{
                height: "100%", borderRadius: 99,
                background: `linear-gradient(90deg, ${T.teal}, ${T.tealDeep})`,
                width: `${progressPct}%`, transition: "width 0.5s ease",
              }} />
            </div>
            <div style={{
              fontSize: 11, color: T.inkFaint, marginTop: 3,
              display: "flex", justifyContent: "space-between",
            }}>
              <span>{fmtEur(app.current_amount_eur || 0)} erhalten</span>
              <span>Ziel: {fmtEur(fundingGoal)}</span>
            </div>
          </div>
        )}

        {/* Stimmen */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
        }}>
          <HUIStimmeIcon size={14} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>
            {voteCount === null ? "..." : voteCount}
          </span>
          <span style={{ fontSize: 11, color: T.inkSoft }}>
            {voteCount === 1 ? "Stimme" : "Stimmen"}
          </span>
        </div>

        {/* Meilensteine */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8,
          }}>🏁 Meilensteine</div>
          {milestonesLoading ? (
            <div style={{ fontSize: 12, color: T.inkSoft, padding: "8px 0" }}>Laden...</div>
          ) : milestones.length === 0 ? (
            <div style={{ fontSize: 12, color: T.inkSoft, padding: "8px 0" }}>
              Noch keine Meilensteine definiert.
            </div>
          ) : (
            milestones.map((m, mi) => {
              const msStatus = {
                planned:     { label: "Geplant",         color: T.inkSoft,  bg: T.border },
                in_progress: { label: "🔄 In Arbeit",    color: T.teal,     bg: T.tealSoft },
                completed:   { label: "✅ Abgeschlossen", color: T.green,    bg: T.greenSoft },
              };
              const msc = msStatus[m.status] || msStatus.planned;
              return (
                <div key={m.id} style={{
                  marginBottom: 8, padding: "10px 12px",
                  background: "rgba(26,26,24,0.03)", borderRadius: T.r12,
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
                    flexWrap: "wrap",
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: T.teal, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 800, flexShrink: 0,
                    }}>{mi + 1}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700, color: T.ink,
                      flex: 1, minWidth: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{m.title}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: msc.color,
                      background: msc.bg, borderRadius: T.r99, padding: "2px 6px",
                      flexShrink: 0,
                    }}>{msc.label}</span>
                  </div>
                  <button
                    onClick={() => onMilestoneUpdate?.(m, app.id)}
                    style={{
                      width: "100%", padding: "8px", borderRadius: T.r8,
                      background: T.tealSoft, border: `1px solid ${T.tealMid}`,
                      cursor: "pointer", fontFamily: "inherit",
                      fontSize: 12, fontWeight: 700, color: T.teal,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    Meilenstein aktualisieren
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.55 }}>{desc}</div>
    </div>
  );
}
