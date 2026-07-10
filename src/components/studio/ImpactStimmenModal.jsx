// src/components/studio/ImpactStimmenModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Impact-Stimmen Fenster — HUI Studio
// Zeigt verfügbare Stimmen, aktive Projekte, abgegebene Stimmen als Icons
// Schema: impact_votes (voter_id, project_id, pool_month, weight, created_at)
//         impact_projects (id, name, icon, color, votes, status)
// Basis-User: 1 Stimme/Monat | Talent-User: 2 Stimmen/Monat
// Reset: automatisch am 1. des Monats (month_key = "YYYY-MM")
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from "react";
import { isProfileTalent } from '../../lib/profileUtils.js';
import { createPortal } from "react-dom";
import { supabase } from "../../lib/supabaseClient.js";

// ── Design Tokens (identisch mit HuiStudio) ────────────────────────────────
const T = {
  bg:        "#F7F5F0",
  bgCard:    "#FFFFFF",
  teal:      "#0EC4B8",
  tealDeep:  "#0AADA3",
  tealSoft:  "rgba(14,196,184,0.10)",
  tealMid:   "rgba(14,196,184,0.22)",
  ink:       "#1A1A18",
  inkSoft:   "rgba(26,26,24,0.52)",
  inkFaint:  "rgba(26,26,24,0.32)",
  border:    "rgba(26,26,24,0.08)",
  px:        20,
  r16: 16, r12: 12, r99: 99,
  card: "0 1px 6px rgba(26,26,24,0.07)",
};

// ── Aktueller Monatsschlüssel ───────────────────────────────────────────────
function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── Projekt-Icon ────────────────────────────────────────────────────────────
function ProjectIcon({ project, onClick, size = 54 }) {
  const bg = project?.color || T.teal;
  return (
    <button
      onClick={() => onClick?.(project)}
      title={project?.name || "Projekt"}
      style={{
        width: size, height: size, borderRadius: "50%",
        background: bg,
        border: `2px solid ${T.tealMid}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.44, cursor: "pointer",
        boxShadow: "0 2px 8px rgba(14,196,184,0.18)",
        flexShrink: 0, transition: "transform .15s",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      {project?.icon || "🌱"}
    </button>
  );
}

// ── Stimm-Button ────────────────────────────────────────────────────────────
function VoteButton({ index, used, loading, onClick }) {
  const isUsed = used;
  return (
    <button
      onClick={isUsed || loading ? undefined : onClick}
      disabled={isUsed || loading}
      style={{
        width: 64, height: 64, borderRadius: "50%",
        background: isUsed
          ? "rgba(26,26,24,0.08)"
          : `linear-gradient(135deg, ${T.teal}, ${T.tealDeep})`,
        border: isUsed ? `2px solid rgba(26,26,24,0.12)` : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 26, cursor: isUsed ? "not-allowed" : "pointer",
        boxShadow: isUsed ? "none" : "0 4px 14px rgba(14,196,184,0.35)",
        transition: "all .2s ease",
        WebkitTapHighlightColor: "transparent",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {isUsed ? "✓" : "🗳️"}
    </button>
  );
}

// ── Haupt-Modal ─────────────────────────────────────────────────────────────
export default function ImpactStimmenModal({ profile, onClose, switchTab = null }) {
  // Sprint F.4C: einzige Wahrheitsquelle
  const isTalent  = isProfileTalent(profile);
  const maxVotes  = isTalent ? 2 : 1;
  const monthKey  = currentMonthKey();

  const [projects,    setProjects]    = useState([]);
  const [myVotes,     setMyVotes]     = useState([]); // Votes diesen Monat
  const [loading,     setLoading]     = useState(true);
  const [voting,      setVoting]      = useState(false); // Stimme wird gerade abgegeben
  const [showPicker,  setShowPicker]  = useState(false); // Projekt-Auswahl
  const [detailProj,  setDetailProj]  = useState(null);  // Projekt-Detail Panel
  const [errorMsg,    setErrorMsg]    = useState("");
  const [successMsg,  setSuccessMsg]  = useState("");

  // Daten laden
  const load = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      // Single Source of Truth: impact_applications (approved) + impact_votes
      const [projRes, votesRes] = await Promise.all([
        supabase.from("impact_applications")
          .select("id,project_name,short_desc,cover_url,media_urls,funding_goal,current_amount_eur,rank,status,created_at")
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
        supabase.from("impact_votes")
          .select("id,project_id,created_at")
          .eq("voter_id", profile.id)
          .eq("pool_month", monthKey),
      ]);
      // Normalisiere auf einheitliches Format
      const normalized = (projRes.data || []).map(a => ({
        id:               a.id,
        name:             a.project_name,
        description:      a.short_desc,
        icon:             "💚",
        color:            "#0DC4B5",
        status:           "approved",
        votes:            0, // wird live aus impact_votes gezählt
        img_url:          a.cover_url || (a.media_urls && a.media_urls[0]) || null,
        current_amount_eur: parseFloat(a.current_amount_eur) || 0,
        funding_goal:     parseFloat(a.funding_goal) || 0,
        rank:             a.rank || 99,
      }));
      setProjects(normalized);
      setMyVotes(votesRes.data || []);
    } catch (e) {
      console.warn("[ImpactStimmen] load:", e);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, monthKey]);

  useEffect(() => { load(); }, [load]);

  // Realtime: impact_votes → Studio sofort aktualisieren
  useEffect(() => {
    if (!profile?.id) return;
    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    const topic = "studio_votes_rt";
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let sub = existing;
    let createdHere = false;
    if (!existing) {
      sub = supabase.channel(topic)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "impact_votes" },
          (payload) => {
            const v = payload.new;
            if (!v) return;
            // Eigene neue Stimme → myVotes aktualisieren
            if (v.voter_id === profile.id && v.pool_month === monthKey) {
              setMyVotes(prev => [...prev, v]);
            }
          })
        .subscribe();
      createdHere = true;
    }
    return () => { if (createdHere) supabase.removeChannel(sub); };
  }, [profile?.id, monthKey]);

  // Stimme abgeben
  const castVote = async (projectId) => {
    if (!profile?.id || voting) return;
    // Prüfe ob bereits für dieses SPEZIFISCHE Projekt gestimmt wurde
    if (myVotes.some(v => v.project_id === projectId)) {
      setErrorMsg("Du hast für dieses Projekt bereits gestimmt.");
      setTimeout(() => setErrorMsg(""), 3500);
      return;
    }
    // Prüfe ob alle Stimmen aufgebraucht
    if (myVotes.length >= maxVotes) {
      setErrorMsg("Du hast diesen Monat alle Stimmen genutzt.");
      setTimeout(() => setErrorMsg(""), 3500);
      return;
    }
    setVoting(true);
    setErrorMsg("");
    try {
      const { error } = await supabase.from("impact_votes").insert({
        voter_id:   profile.id,
        project_id: projectId,
        pool_month: monthKey,
      });
      if (error) throw error;
      // Kein separates impact_projects Update — impact_votes ist SSOT

      setSuccessMsg("✅ Stimme abgegeben!");
      setTimeout(() => setSuccessMsg(""), 2500);
      setShowPicker(false);
      await load();
    } catch (e) {
      console.error("[ImpactStimmen] vote:", e);
      setErrorMsg(e.message?.includes("duplicate") || e.code === "23505"
        ? "Du hast für dieses Projekt bereits gestimmt."
        : "Fehler beim Abstimmen – bitte nochmals versuchen.");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setVoting(false);
    }
  };

  // Hilfsfunktion: navigiert zum Impact-Tab sauber via switchTab (HomeShell) oder Fallback
  const _navigateToImpact = (projectId = null) => {
    // 1. Overlay cleanup: overflow:hidden freigeben
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";

    // 2. Modal schließen
    onClose?.();

    // 3. Tab wechseln — bevorzugt via switchTab (HomeShell), sonst via popstate
    if (typeof switchTab === "function") {
      switchTab("impact");
    } else {
      const hash = projectId ? `#project-${projectId}` : "";
      window.history.pushState({}, "", `/impact${hash}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }

    // 4. Scroll zum Projekt nach kurzer Verzögerung (Tab-Mount abwarten)
    if (projectId) {
      setTimeout(() => {
        document.body.style.overflow = "";
        const el = document.getElementById(`project-${projectId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 450);
    }
  };

  // Zum Projekt navigieren
  const goToProject = (project) => {
    if (!project?.id) return;
    _navigateToImpact(project.id);
  };

  // Zum Impact Pool
  const goToPool = () => {
    _navigateToImpact(null);
  };

  const usedCount   = myVotes.length;
  const freeCount   = Math.max(0, maxVotes - usedCount);
  const allUsed     = usedCount >= maxVotes;

  // Projekte für abgegebene Stimmen
  const votedProjects = myVotes
    .map(v => projects.find(p => p.id === v.project_id))
    .filter(Boolean);

  // Noch nicht gewählte Projekte für Picker
  const votedProjectIds = new Set(myVotes.map(v => v.project_id));
  const availableProjects = projects.filter(p => !votedProjectIds.has(p.id));

  const modal = (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10500,
      background: "rgba(26,26,24,0.52)",
      display: "flex", alignItems: "flex-end",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: T.bg,
        borderRadius: "24px 24px 0 0",
        maxHeight: "92vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -4px 32px rgba(26,26,24,0.18)",
      }}>
        {/* ── Handle ── */}
        <div style={{ padding: "12px 20px 0", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(26,26,24,0.15)" }} />
        </div>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px 10px",
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.ink, letterSpacing: "-0.02em" }}>
              🗳️ Impact-Stimmen
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
              {monthKey} · {isTalent ? "Talent" : "Basis"}-Mitglied
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: "50%", border: "none",
            background: "rgba(26,26,24,0.08)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, color: T.inkSoft,
          }}>✕</button>
        </div>

        {/* ── Scroll Content ── */}
        <div style={{
          overflowY: "auto", flex: 1, padding: "0 20px 100px",
          WebkitOverflowScrolling: "touch",
        }}>

          {/* ── Hero-Card ── */}
          <div style={{
            background: `linear-gradient(135deg, ${T.teal} 0%, #0AADA3 60%, #068F87 100%)`,
            borderRadius: T.r16, padding: "22px 20px", marginBottom: 16,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -20, right: -20,
              width: 110, height: 110, borderRadius: "50%",
              background: "rgba(255,255,255,0.10)",
            }} />
            <div style={{
              position: "absolute", bottom: -30, right: 30,
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
            }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
              • HUI IMPACT POOL
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>
              Deine Stimme<br />zählt.
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 1.45 }}>
              Jede Stimme bewegt echte Projekte.{"\n"}
              Kein Projekt geht leer aus.
            </div>
          </div>

          {/* ── Verfügbare Stimmen ── */}
          <div style={{
            background: T.bgCard, borderRadius: T.r16,
            border: `1px solid ${T.border}`, padding: "18px",
            marginBottom: 16, boxShadow: T.card,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 14 }}>
              Deine Stimmen diesen Monat
            </div>

            {/* Stimm-Buttons */}
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
              {Array.from({ length: maxVotes }).map((_, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <VoteButton
                    index={idx}
                    used={idx < usedCount}
                    loading={voting}
                    onClick={() => {
                      if (availableProjects.length > 0) setShowPicker(true);
                      else setErrorMsg("Keine aktiven Projekte verfügbar.");
                    }}
                  />
                  <span style={{ fontSize: 11, color: T.inkFaint, fontWeight: 500 }}>
                    {idx < usedCount ? "Vergeben" : "Verfügbar"}
                  </span>
                </div>
              ))}
              <div style={{ flex: 1 }}>
                {allUsed ? (
                  <div style={{
                    background: "rgba(26,26,24,0.04)", borderRadius: T.r12,
                    padding: "10px 14px",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>
                      Alle Stimmen eingesetzt.
                    </div>
                    <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 3 }}>
                      Nächsten Monat gibt es neue.
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: T.tealSoft, borderRadius: T.r12,
                    border: `1px solid ${T.tealMid}`, padding: "10px 14px",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>
                      {freeCount} Stimme{freeCount !== 1 ? "n" : ""} verfügbar
                    </div>
                    <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 3 }}>
                      Tippe auf 🗳️ um abzustimmen
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Talent-Hinweis für Basis-User */}
            {!isTalent && (
              <div style={{
                background: "rgba(255,193,7,0.08)", borderRadius: T.r12,
                border: "1px solid rgba(255,193,7,0.2)", padding: "10px 14px",
                display: "flex", gap: 10, alignItems: "center",
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>⭐</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#92700A" }}>
                    Mit Mitgliedschaft auf 2 Stimmen
                  </div>
                  <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>
                    Mitglieder und Talente können doppelt so viel bewirken.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Abgegebene Stimmen als Icons ── */}
          {votedProjects.length > 0 && (
            <div style={{
              background: T.bgCard, borderRadius: T.r16,
              border: `1px solid ${T.border}`, padding: "18px",
              marginBottom: 16, boxShadow: T.card,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 14 }}>
                Deine Stimme{votedProjects.length > 1 ? "n" : ""} diesen Monat
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {votedProjects.map(proj => (
                  <div key={proj.id} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    cursor: "pointer",
                  }}
                    onClick={() => goToProject(proj)}
                  >
                    <ProjectIcon project={proj} onClick={goToProject} size={48} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>
                        {proj.name}
                      </div>
                      <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
                        Stimme vergeben · zum Projekt →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Fehler / Erfolg ── */}
          {errorMsg && (
            <div style={{
              background: "rgba(220,38,38,0.08)", borderRadius: T.r12,
              border: "1px solid rgba(220,38,38,0.18)", padding: "12px 16px",
              marginBottom: 14, fontSize: 13, color: "#B91C1C", fontWeight: 500,
            }}>
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{
              background: "rgba(14,196,184,0.10)", borderRadius: T.r12,
              border: `1px solid ${T.tealMid}`, padding: "12px 16px",
              marginBottom: 14, fontSize: 13, color: T.tealDeep, fontWeight: 600,
            }}>
              {successMsg}
            </div>
          )}

          {/* ── Projekt-Picker (wenn Stimme geklickt) ── */}
          {/* ── Projekt-Detail-Panel ── */}
          {detailProj && (
            <div style={{
              background: T.bgCard, borderRadius: T.r16,
              border: `2px solid ${T.tealMid}`, padding: "20px",
              marginBottom: 16, boxShadow: "0 4px 20px rgba(14,196,184,0.15)",
            }}>
              {/* Header mit Zurück */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <button onClick={() => setDetailProj(null)} style={{
                  background: "rgba(26,26,24,0.07)", border: "none", cursor: "pointer",
                  borderRadius: "50%", width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, color: T.inkSoft, flexShrink: 0,
                }}>‹</button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{detailProj.name}</div>
                  {detailProj.category && (
                    <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 1 }}>{detailProj.category}</div>
                  )}
                </div>
                <span style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: detailProj.color || T.teal,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>{detailProj.icon || "🌱"}</span>
              </div>

              {/* Kurzzusammenfassung — max 500 Zeichen */}
              {detailProj.description && (
                <div style={{
                  fontSize: 14, color: T.ink, lineHeight: 1.55,
                  marginBottom: 14, padding: "12px 14px",
                  background: "rgba(26,26,24,0.03)", borderRadius: T.r12,
                }}>
                  {detailProj.description.length > 500
                    ? detailProj.description.slice(0, 497) + "…"
                    : detailProj.description}
                </div>
              )}

              {/* Tags */}
              {detailProj.tags?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {detailProj.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 11, fontWeight: 600, color: T.teal,
                      background: T.tealSoft, border: `1px solid ${T.tealMid}`,
                      padding: "3px 10px", borderRadius: 99,
                    }}>{tag}</span>
                  ))}
                </div>
              )}

              {/* Website-Link */}
              {detailProj.website && (
                <a
                  href={detailProj.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 12, fontWeight: 600, color: T.teal,
                    textDecoration: "none", marginBottom: 14,
                    padding: "8px 12px", borderRadius: T.r12,
                    background: T.tealSoft, border: `1px solid ${T.tealMid}`,
                  }}
                >
                  🔗 {detailProj.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}

              {/* Finanzierungsbalken */}
              {(() => {
                const funded = detailProj.current_amount_eur || 0;
                const goal   = detailProj.funding_goal || 0;
                const pct    = goal > 0 ? Math.min(100, Math.round(funded / goal * 100)) : 0;
                return goal > 0 ? (
                  <div style={{ background: "rgba(13,196,181,0.06)", borderRadius: T.r12,
                    border: `1px solid rgba(13,196,181,0.18)`, padding: "14px 16px", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      fontSize: 12, color: T.inkSoft, marginBottom: 6 }}>
                      <span>Finanzierungsfortschritt</span>
                      <span style={{ fontWeight: 800, color: T.teal }}>{pct}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: "rgba(0,0,0,0.08)",
                      overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`,
                        background: `linear-gradient(90deg, ${T.teal}, ${T.tealDeep})`,
                        transition: "width 1.2s ease", minWidth: pct > 0 ? 6 : 0 }} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>
                      €{funded.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} von €{goal.toLocaleString("de-DE")} finanziert
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Stats */}
              <div style={{
                display: "flex", gap: 10, marginBottom: 16,
              }}>
                <div style={{
                  flex: 1, background: T.tealSoft, borderRadius: T.r12,
                  border: `1px solid ${T.tealMid}`, padding: "10px 12px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.teal }}>
                    {detailProj.votes ?? 0}
                  </div>
                  <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>Stimmen</div>
                </div>
                {detailProj.contact_name && (
                  <div style={{
                    flex: 2, background: "rgba(26,26,24,0.04)", borderRadius: T.r12,
                    border: `1px solid ${T.border}`, padding: "10px 12px",
                  }}>
                    <div style={{ fontSize: 11, color: T.inkFaint, marginBottom: 2 }}>Kontakt</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>
                      {detailProj.contact_name}
                    </div>
                  </div>
                )}
              </div>

              {/* Buttons: Zum Projekt + Wählen */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => goToProject(detailProj)}
                  style={{
                    flex: 1, padding: "12px 10px", borderRadius: T.r12,
                    background: "rgba(26,26,24,0.06)",
                    border: `1px solid ${T.border}`,
                    cursor: "pointer", fontSize: 13, fontWeight: 700,
                    color: T.ink, fontFamily: "inherit",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  Zum Projekt →
                </button>
                <button
                  onClick={() => {
                    if (votedProjectIds.has(detailProj.id)) {
                      setErrorMsg("Du hast für dieses Projekt bereits gestimmt.");
                      setTimeout(() => setErrorMsg(""), 3000);
                      setDetailProj(null);
                      return;
                    }
                    castVote(detailProj.id);
                    setDetailProj(null);
                  }}
                  disabled={voting}
                  style={{
                    flex: 1, padding: "12px 10px", borderRadius: T.r12,
                    background: `linear-gradient(135deg, ${T.teal}, ${T.tealDeep})`,
                    border: "none", cursor: voting ? "not-allowed" : "pointer",
                    fontSize: 13, fontWeight: 800, color: "#fff",
                    fontFamily: "inherit",
                    boxShadow: "0 3px 10px rgba(14,196,184,0.30)",
                    WebkitTapHighlightColor: "transparent",
                    opacity: voting ? 0.65 : 1,
                  }}
                >
                  🗳️ Jetzt wählen
                </button>
              </div>
            </div>
          )}

          {/* ── Projekt-Picker Liste ── */}
          {showPicker && !detailProj && (
            <div style={{
              background: T.bgCard, borderRadius: T.r16,
              border: `2px solid ${T.tealMid}`, padding: "18px",
              marginBottom: 16, boxShadow: "0 4px 20px rgba(14,196,184,0.15)",
            }}>
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: 14,
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>
                  Für welches Projekt?
                </div>
                <button onClick={() => setShowPicker(false)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 14, color: T.inkSoft, padding: "2px 6px",
                }}>
                  Abbrechen
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {availableProjects.map(proj => (
                  <div
                    key={proj.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: "none", border: `1px solid ${T.border}`,
                      borderRadius: T.r12, padding: "12px 14px",
                    }}
                  >
                    {/* Icon */}
                    <span style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: proj.color || T.teal,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, flexShrink: 0,
                    }}>{proj.icon || "🌱"}</span>

                    {/* Name + Stimmen */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.ink,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {proj.name}
                      </div>
                      <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
                        {proj.votes ?? 0} Stimmen bisher
                      </div>
                    </div>

                    {/* Details-Button */}
                    <button
                      onClick={() => { setDetailProj(proj); }}
                      style={{
                        padding: "5px 11px", borderRadius: 99,
                        background: "rgba(26,26,24,0.06)",
                        border: `1px solid ${T.border}`,
                        fontSize: 12, fontWeight: 600, color: T.inkSoft,
                        cursor: "pointer", fontFamily: "inherit",
                        flexShrink: 0,
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      Details
                    </button>

                    {/* Wählen-Button */}
                    <button
                      onClick={() => { setShowPicker(false); castVote(proj.id); }}
                      disabled={voting}
                      style={{
                        padding: "5px 12px", borderRadius: 99,
                        background: T.tealSoft,
                        border: `1px solid ${T.tealMid}`,
                        fontSize: 12, fontWeight: 700, color: T.teal,
                        cursor: voting ? "not-allowed" : "pointer",
                        fontFamily: "inherit", flexShrink: 0,
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      Wählen
                    </button>
                  </div>
                ))}
                {availableProjects.length === 0 && (
                  <div style={{ fontSize: 13, color: T.inkSoft, textAlign: "center", padding: "10px 0" }}>
                    Keine weiteren Projekte verfügbar.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Zum Impact Pool Button ── */}
          <button
            onClick={goToPool}
            style={{
              width: "100%", padding: "16px", borderRadius: T.r16,
              background: `linear-gradient(135deg, ${T.teal}, ${T.tealDeep})`,
              border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 800, color: "#fff",
              letterSpacing: "-0.01em",
              boxShadow: "0 4px 16px rgba(14,196,184,0.30)",
              fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
              transition: "opacity .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            Zum Impact Pool →
          </button>

        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
