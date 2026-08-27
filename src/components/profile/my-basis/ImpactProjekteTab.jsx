// src/components/profile/my-basis/ImpactProjekteTab.jsx
// ImpactProjekteTab — extracted from MyBasisProfile.jsx. No logic changes.
import React from "react";
import { T } from "./constants.js";
import { useImageGallery } from "../../../context/ImageGalleryContext.jsx";
import { optimizeCard } from "../../../lib/perfUtils.js";
import { HUISchreibenIcon } from "../../../design/icons/HuiSystemIcons.jsx";
import { formatDateDE, formatNumberDE } from "../../../lib/formatters.js";
import { useTranslation } from "../../../hooks/useTranslation.js";

export function ImpactProjekteTab({ profile, supabase, onUpdateClick }) {
  const { t } = useTranslation();
  const { openGallery } = useImageGallery();
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState(null);
  const [updates, setUpdates] = React.useState([]);
  const [updatesLoading, setUpdatesLoading] = React.useState(false);
  const [editingUpdateId, setEditingUpdateId] = React.useState(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [editError, setEditError] = React.useState(null);

  // impact_applications nutzt 'user_id' als User-Feld
  const userField = "user_id";

  const loadUpdatesFor = React.useCallback(async (projectId) => {
    if (!projectId) { setUpdates([]); return; }
    setUpdatesLoading(true);
    const { data, error } = await supabase
      .from("impact_project_updates")
      .select("id,title,content,update_type,media_urls,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) console.error("[ImpactProjekteTab] updates query error:", error);
    setUpdates(data || []);
    setUpdatesLoading(false);
  }, [supabase]);

  const startEditUpdate = (u) => {
    setEditingUpdateId(u.id);
    setEditTitle(u.title || "");
    setEditContent(u.content || "");
    setEditError(null);
  };

  const cancelEditUpdate = () => {
    setEditingUpdateId(null);
    setEditTitle("");
    setEditContent("");
    setEditError(null);
  };

  const saveEditUpdate = async (updateId) => {
    if (!editTitle.trim()) { setEditError(t("ipt.titleEmpty")); return; }
    setSavingEdit(true);
    setEditError(null);
    const { error } = await supabase
      .from("impact_project_updates")
      .update({ title: editTitle.trim(), content: editContent.trim() || null })
      .eq("id", updateId);
    setSavingEdit(false);
    if (error) {
      console.error("[ImpactProjekteTab] update edit error:", error);
      setEditError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }
    // Lokal aktualisieren (optimistic) + Live-Refresh-Event für andere offene Views (z.B. ImpactPage)
    setUpdates(prev => prev.map(u => u.id === updateId ? { ...u, title: editTitle.trim(), content: editContent.trim() || null } : u));
    window.dispatchEvent(new Event("hui:impact-update-added"));
    cancelEditUpdate();
  };

  React.useEffect(() => {
    loadUpdatesFor(selected?.id);
    setEditingUpdateId(null);
    setEditError(null);
  }, [selected?.id, loadUpdatesFor]);

  React.useEffect(() => {
    const handler = () => { if (selected?.id) loadUpdatesFor(selected.id); };
    window.addEventListener("hui:impact-update-added", handler);
    return () => window.removeEventListener("hui:impact-update-added", handler);
  }, [selected?.id, loadUpdatesFor]);

  React.useEffect(() => {
    if (!profile?.user_id && !profile?.id) return;
    const uid = profile.user_id || profile.id;
    supabase
      .from("impact_applications")
      .select("id,project_name,short_desc,funding_goal,current_amount_eur,status,rank,is_completed,created_at,cover_url")
      .eq(userField, uid)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("[ImpactProjekteTab] query error:", error);
        }
        setProjects(data || []);
        setLoading(false);
      });
  }, [profile?.user_id, profile?.id]);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#666" }}>
        Lädt...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div style={{ padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>💚</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", marginBottom: 8 }}>
          Noch kein Impact-Projekt
        </div>
        <div style={{ fontSize: 13, color: "#666" }}>
          Reiche dein erstes Herzensprojekt ein und erhalte Community-Finanzierung.
        </div>
      </div>
    );
  }

  return (
    <>
    {/* Kachel-Grid — identisch zum Muster von Meine Werke/Erlebnisse (3-spaltig, aspect-ratio 1/1) */}
    <div style={{ padding: `0 ${T.px}px` }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
        gap:10, marginBottom:12 }}>
        {projects.map((proj, i) => {
          const isApproved = proj.status === "approved";
          const isRejected = proj.status === "rejected";
          const badgeBg = isApproved ? "rgba(14,196,184,0.92)" : isRejected ? "rgba(255,80,80,0.92)" : "rgba(234,179,8,0.92)";
          const badgeText = isApproved ? "✅ Bewilligt" : isRejected ? "❌ Abgelehnt" : t("common.inReview");
          const borderCol = isApproved ? "#0EC4B8" : isRejected ? "#ff5050" : "#D4A800";
          return (
            <div key={proj.id || i}
              onClick={() => setSelected(proj)}
              style={{
                width:"100%", aspectRatio:"1/1",
                borderRadius:T.r12, overflow:"hidden",
                background:"#e8f7f4", position:"relative", cursor:"pointer",
                boxShadow: `0 0 0 2px ${borderCol}`,
              }}>
              {proj.cover_url
                ? <img loading="lazy" decoding="async" src={optimizeCard(proj.cover_url)} alt={proj.project_name||""}
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                : <div style={{ width:"100%", height:"100%", display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:24 }}>💚</div>
              }
              {/* Status-Badge unten */}
              <div style={{
                position:"absolute", bottom:0, left:0, right:0,
                background: badgeBg,
                fontSize:9, fontWeight: 600, color:"#fff",
                padding:"3px 5px", textAlign:"center", letterSpacing:"0.3px",
              }}>
                {badgeText}
              </div>
              {/* Titel oben */}
              {proj.project_name && (
                <div style={{
                  position:"absolute", top:0, left:0, right:0,
                  background:"rgba(0,0,0,0.45)", fontSize:9, color:"#fff",
                  padding:"3px 5px", whiteSpace:"nowrap",
                  overflow:"hidden", textOverflow:"ellipsis",
                }}>
                  {proj.project_name}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* Detail-Overlay — Beschreibung, Fortschritt, Update-Button (per Tap auf Kachel) */}
    {selected && (
      <div style={{
        position:"fixed", inset:0, zIndex:10500,
        background:"rgba(0,0,0,0.55)", display:"flex",
        alignItems:"center", justifyContent:"center", padding:"24px",
      }} onClick={() => setSelected(null)}>
        <div onClick={e => e.stopPropagation()} style={{
          background:"#fff", borderRadius:20, padding:"20px",
          maxWidth:360, width:"100%", maxHeight:"80vh", overflowY:"auto",
          boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
        }}>
          {selected.cover_url && (
            <img src={optimizeCard(selected.cover_url)} alt={selected.project_name||""}
              style={{ width:"100%", height:160, objectFit:"cover", borderRadius:14, marginBottom:14 }} />
          )}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6, gap:8 }}>
            <div style={{ fontSize:16, fontWeight: 600, color:"#1A1A1A", flex:1 }}>{selected.project_name}</div>
            <span style={{
              fontSize:11, fontWeight: 600, flexShrink:0, padding:"3px 8px", borderRadius:99,
              color: selected.status==="approved" ? "#0DC4B5" : selected.status==="rejected" ? "#e74c3c" : "#f39c12",
              background: (selected.status==="approved" ? "#0DC4B5" : selected.status==="rejected" ? "#e74c3c" : "#f39c12") + "15",
            }}>
              {selected.status==="approved" ? "✅ Bewilligt" : selected.status==="rejected" ? "❌ Abgelehnt" : t("common.inReview")}
            </span>
          </div>
          {selected.short_desc && (
            <div style={{ fontSize:13, color:"#666", marginBottom:12, lineHeight:1.5 }}>{selected.short_desc}</div>
          )}
          {(() => {
            const funded = selected.current_amount_eur || 0;
            const goal = selected.funding_goal || 0;
            const pct = goal > 0 ? Math.min(100, Math.round((funded / goal) * 100)) : 0;
            return (
              <>
                <div style={{ fontSize:12, color:"#666", marginBottom:6 }}>
                  €{formatNumberDE(funded)} von €{formatNumberDE(goal)} finanziert
                </div>
                <div style={{ height:6, borderRadius:99, background:"rgba(0,0,0,0.08)", overflow:"hidden", marginBottom:16 }}>
                  <div style={{ height:"100%", borderRadius:99, width:`${pct}%`, background:"linear-gradient(90deg,#0DC4B5,#09A89D)" }} />
                </div>
              </>
            );
          })()}
          {/* ── Neuigkeiten / Projekt-Updates ── */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight: 600, color:"#1A1A1A", marginBottom:8 }}>📰 Neuigkeiten</div>
            {updatesLoading ? (
              <div style={{ fontSize:12, color:"#888" }}>Laden...</div>
            ) : updates.length === 0 ? (
              <div style={{ fontSize:12, color:"#888" }}>Noch keine Neuigkeiten.</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {updates.map((u) => {
                  const typeColors = {
                    "Meilenstein": { c:"#F59E0B", bg:"rgba(245,158,11,0.10)" },
                    "Fortschritt": { c:"#0EC4B8", bg:"rgba(14,196,184,0.10)" },
                    "Neuigkeit":   { c:"#7C3AED", bg:"rgba(124,58,237,0.10)" },
                    "Geplant":     { c:"#10B981", bg:"rgba(16,185,129,0.10)" },
                    "Proof of Work": { c:"#0EC4B8", bg:"rgba(14,196,184,0.10)" },
                  };
                  const tc = typeColors[u.update_type] || typeColors["Neuigkeit"];
                  const fmtD = u.created_at ?formatDateDE(new Date(u.created_at), { day:"2-digit", month:"short", year:"numeric" }) : "";
                  const isEditing = editingUpdateId === u.id;
                  return (
                    <div key={u.id} style={{
                      background:"#f8f8f6", border:"1px solid rgba(0,0,0,0.06)",
                      borderRadius:12, padding:12,
                    }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4, gap:6 }}>
                        <span style={{ fontSize:10, fontWeight: 600, color:tc.c, background:tc.bg, padding:"2px 6px", borderRadius:99, flexShrink:0 }}>{u.update_type || "Update"}</span>
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                          <span style={{ fontSize:10, color:"#999" }}>{fmtD}</span>
                          {!isEditing && (
                            <button
                              onClick={() => startEditUpdate(u)}
                              aria-label="Update bearbeiten"
                              style={{
                                background:"none", border:"none", padding:2, cursor:"pointer",
                                display:"flex", alignItems:"center", color:"#999",
                              }}
                            >
                              <HUISchreibenIcon size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            maxLength={120}
                            placeholder={t("ipt.title")}
                            style={{
                              width:"100%", padding:"7px 10px", marginBottom:6,
                              borderRadius:8, border:"1px solid rgba(0,0,0,0.12)",
                              fontSize:13, fontWeight: 600, fontFamily:"inherit", color:"#1A1A1A",
                              outline:"none", boxSizing:"border-box",
                            }}
                          />
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            maxLength={2000}
                            rows={3}
                            placeholder="Beschreibung (optional)"
                            style={{
                              width:"100%", padding:"7px 10px", marginBottom:8,
                              borderRadius:8, border:"1px solid rgba(0,0,0,0.12)",
                              fontSize:12, fontFamily:"inherit", color:"#333",
                              outline:"none", resize:"vertical", boxSizing:"border-box", lineHeight:1.4,
                            }}
                          />
                          {editError && (
                            <div style={{ fontSize:11, color:"#e74c3c", marginBottom:6 }}>{editError}</div>
                          )}
                          <div style={{ display:"flex", gap:8 }}>
                            <button
                              onClick={() => saveEditUpdate(u.id)}
                              disabled={savingEdit}
                              style={{
                                flex:1, padding:"7px 0", borderRadius:8, border:"none",
                                background: savingEdit ? "#9fd8d2" : "#0DC4B5", color:"#fff",
                                fontSize:12, fontWeight: 600, cursor: savingEdit ? "default" : "pointer",
                                fontFamily:"inherit",
                              }}
                            >
                              {savingEdit ? "Speichert…" : "Speichern"}
                            </button>
                            <button
                              onClick={cancelEditUpdate}
                              disabled={savingEdit}
                              style={{
                                flex:1, padding:"7px 0", borderRadius:8,
                                border:"1px solid rgba(0,0,0,0.12)", background:"#fff", color:"#666",
                                fontSize:12, fontWeight:600, cursor: savingEdit ? "default" : "pointer",
                                fontFamily:"inherit",
                              }}
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize:13, fontWeight: 600, color:"#1A1A1A", marginBottom:2 }}>{u.title}</div>
                          {u.content && <div style={{ fontSize:12, color:"#666", lineHeight:1.4 }}>{u.content}</div>}
                          {u.media_urls && u.media_urls.length > 0 && (
                            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:6 }}>
                              {u.media_urls.map((url, idx) => (
                                <div key={idx} onClick={() => openGallery(u.media_urls, idx)} style={{ cursor:"pointer" }} role="button" tabIndex={0}>
                                  <img loading="lazy" decoding="async" src={url} alt=""
                                    style={{ width:50, height:50, objectFit:"cover", borderRadius:6, border:"1px solid rgba(0,0,0,0.08)" }} />
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selected.status === "approved" && (
            <button
              onClick={() => { onUpdateClick(selected); setSelected(null); }}
              style={{
                width:"100%", padding:"10px 0", borderRadius:12,
                border:"1.5px dashed #0DC4B5", background:"transparent",
                color:"#0DC4B5", fontSize:13, fontWeight: 600,
                cursor:"pointer", fontFamily:"inherit", marginBottom:8,
              }}
            >
              + Update hinzufügen
            </button>
          )}
          <button onClick={() => setSelected(null)} style={{
            width:"100%", padding:"10px 0", borderRadius:12,
            background:"#f0f0ee", border:"none", color:"#444",
            fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
          }}>
            Schließen
          </button>
        </div>
      </div>
    )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// GEMEINSCHAFTSKARTE
// Einladende Karte zwischen "Über mich" und "Interessen"
// Nur sichtbar für Basis-User (kein Talent-Profil aktiv)
// ══════════════════════════════════════════════════════════════
