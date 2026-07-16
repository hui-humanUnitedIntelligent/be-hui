import React from "react";
import ReactDOM from "react-dom";
import { supabase } from "../../../../lib/supabaseClient.js";
import { isProfileTalent } from "../../../../lib/profileUtils.js";
import { HUIStimmeIcon } from "../../../../design/icons/HuiSystemIcons.jsx";
import { safeNum } from "../utils.js";
import { MilestoneCard } from "../components/MilestoneCard.jsx";
import { MilestoneDetailSheet } from "./MilestoneDetailSheet.jsx";
import ImpactProjektUpdateSheet from "../../../../components/studio/ImpactProjektUpdateSheet.jsx";

export function ApprovedProjectDetail({ app: rawApp, onClose, currentUser, onVoted = () => {} }) {
  // Normalisierung: Akzeptiert sowohl impact_applications-Format als auch VotingCard-Format
  const app = React.useMemo(() => ({
    id:           rawApp.id,
    project_name: rawApp.project_name || rawApp.name || "",
    short_desc:   rawApp.short_desc   || rawApp.description || "",
    long_desc:    rawApp.long_desc    || rawApp.description || "",
    cover_url:    rawApp.cover_url    || rawApp.img          || null,
    media_urls:   rawApp.media_urls   || (rawApp.img ? [rawApp.img] : []),
    funding_goal: rawApp.funding_goal || rawApp.goal_eur     || 0,
    applicant_name: rawApp.applicant_name || "",
    applicant_type: rawApp.applicant_type || "",
    impact_category: rawApp.impact_category || rawApp.category || "",
    application_date: rawApp.application_date || rawApp.created_at || null,
  }), [rawApp]);

  const [voted,        setVoted]        = React.useState(false);
  const [voteCount,    setVoteCount]    = React.useState(0);
  const [userVotesLeft, setUserVotesLeft] = React.useState(null); // null = lädt noch
  const [loading,      setLoading]      = React.useState(false);
  const [checking,     setChecking]     = React.useState(true);
  const [voteError,    setVoteError]    = React.useState(null);
  const [updates,      setUpdates]      = React.useState([]);
  const [updatesLoading, setUpdatesLoading] = React.useState(true);
  const [showUpdateSheet, setShowUpdateSheet] = React.useState(false);

  // ── Finanzierungs-Daten (frisch aus DB) ────────────────────
  const [fundedEur,  setFundedEur]  = React.useState(safeNum(rawApp.current_amount_eur) || 0);
  const [goalFromDb, setGoalFromDb] = React.useState(safeNum(rawApp.funding_goal) || safeNum(rawApp.goal_eur) || 0);
  const [milestones, setMilestones] = React.useState([]);
  const [milestonesLoading, setMilestonesLoading] = React.useState(false);
  const [detailMilestone, setDetailMilestone] = React.useState(null);
  const fundPct = goalFromDb > 0 ? Math.min(100, Math.round(fundedEur / goalFromDb * 100)) : 0;

  const img = app.cover_url
    || (app.media_urls && app.media_urls[0])
    || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90";

  // Pool-Monat: YYYY-MM des aktuellen Monats
  const poolMonth = new Date().toISOString().slice(0, 7); // z.B. "2026-06"

  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        // 1. Bereits für dieses Projekt abgestimmt?
        if (currentUser?.id) {
          const { data: existing } = await supabase
            .from("impact_votes")
            .select("id")
            .eq("voter_id", currentUser.id)
            .eq("project_id", app.id)
            .limit(1);
          if (!dead && existing?.length) setVoted(true);

          // 2. Wieviele Stimmen hat der User diesen Monat bereits vergeben?
          const { count: usedThisMonth } = await supabase
            .from("impact_votes")
            .select("id", { count: "exact", head: true })
            .eq("voter_id", currentUser.id)
            .eq("pool_month", poolMonth);
          // Single Source of Truth: isProfileTalent
          const maxStimmen = isProfileTalent(currentUser) ? 2 : 1;
          if (!dead) setUserVotesLeft(Math.max(0, maxStimmen - (usedThisMonth || 0)));
        }

        // 3. Gesamtstimmen für dieses Projekt
        const { count } = await supabase
          .from("impact_votes")
          .select("id", { count: "exact", head: true })
          .eq("project_id", app.id);
        if (!dead) setVoteCount(count || 0);
      } catch { /* silent */ }
      if (!dead) setChecking(false);
    })();
    return () => { dead = true; };
  }, [app.id, currentUser?.id]);

  // ── Projekt-Updates laden ────────────────────────────────────
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data: updData } = await supabase
          .from("impact_project_updates")
          .select("id,title,content,update_type,media_urls,created_at,author_id")
          .eq("project_id", app.id)
          .order("created_at", { ascending: false });
        if (!dead) setUpdates(updData || []);
      } catch { /* silent */ }
      if (!dead) setUpdatesLoading(false);
    })();
    return () => { dead = true; };
  }, [app.id]);

  // ── Finanzierungs-Daten + Meilensteine frisch laden ──────────
  React.useEffect(() => {
    let dead = false;
    (async () => {
      try {
        // 1. Aktuelles current_amount_eur + funding_goal aus DB
        const { data: fundData } = await supabase
          .from("impact_applications")
          .select("current_amount_eur, funding_goal")
          .eq("id", app.id)
          .single();
        if (!dead && fundData) {
          setFundedEur(safeNum(fundData.current_amount_eur) || 0);
          setGoalFromDb(safeNum(fundData.funding_goal) || 0);
        }
        // 2. Meilensteine laden (mit Updates)
        setMilestonesLoading(true);
        const { data: msData } = await supabase
          .from("impact_milestones")
          .select("*, impact_milestone_updates(*)")
          .eq("project_id", app.id)
          .order("sort_order");
        if (!dead) { setMilestones(msData || []); setMilestonesLoading(false); }
      } catch { /* silent */ }
    })();
    return () => { dead = true; };
  }, [app.id]);

  const handleVote = async () => {
    if (!currentUser?.id || voted || loading) return;
    if (userVotesLeft !== null && userVotesLeft <= 0) {
      setVoteError("Du hast diesen Monat keine Stimmen mehr.");
      return;
    }
    setLoading(true);
    setVoteError(null);
    try {
      const { error } = await supabase.from("impact_votes").insert({
        voter_id:   currentUser.id,
        project_id: app.id,
        pool_month: poolMonth,
        weight:     1,
        created_at: new Date().toISOString(),
      });
      if (!error) {
        setVoted(true);
        setVoteCount(v => v + 1);
        setUserVotesLeft(v => Math.max(0, (v || 1) - 1));
        onVoted(app.id);
      } else {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("maximale") || msg.includes("keine stimmen")) {
          setVoteError("Du hast bereits alle deine Stimmen diesen Monat vergeben.");
        } else if (msg.includes("bereits")) {
          setVoteError("Du hast bereits für dieses Projekt gestimmt.");
        } else {
          setVoteError("Abstimmung fehlgeschlagen. Bitte lade die Seite neu und versuche es erneut. (Session abgelaufen?)");
        }
      }
    } catch { setVoteError("Verbindungsfehler. Bitte lade die Seite neu und versuche es erneut."); }
    setLoading(false);
  };

  const fmtDate = (iso) => iso
    ? new Date(iso).toLocaleDateString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric" })
    : "";

  // Portal: direkt in document.body mounten — kein Clipping durch Page-Flow
  const content = (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:"fixed", inset:0, zIndex:10490, /* >BottomNav(10000) */
        background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)",
        animation:"ipFadeIn 0.22s ease both",
      }} />
      {/* Bottom-Sheet: top=15px → minimale Luft oben, Navbar-sicher */}
      <div onClick={e => e.stopPropagation()} style={{
        position:"fixed", left:0, right:0, top:15, bottom:0, zIndex:10500, /* >BottomNav(10000) */
        background:"#FDFAF5",
        borderRadius:"24px 24px 0 0",
        boxShadow:"0 -12px 60px rgba(0,0,0,0.22)",
        display:"flex", flexDirection:"column",
        overflow:"hidden",
        animation:"ipSlideUp 0.30s cubic-bezier(0.22,1,0.36,1) both",
      }}>
        {/* Drag-Handle — fixiert oben */}
        <div style={{ flexShrink:0, paddingTop:10, paddingBottom:4 }}>
          <div style={{
            width:40, height:4, borderRadius:99,
            background:"rgba(20,20,34,0.15)",
            margin:"0 auto",
          }} />
        </div>
        {/* Scrollbarer Inhalt — nimmt restliche Höhe, Navbar-Abstand innen */}
        <div style={{
          flex:1, overflowY:"auto",
          overscrollBehavior:"contain",
          WebkitOverflowScrolling:"touch",
          paddingBottom:"calc(88px + env(safe-area-inset-bottom, 0px))",
        }}>
        {/* Bild */}
        <div style={{ position:"relative", height:220, borderRadius:"24px 24px 0 0", overflow:"hidden" }}>
          <img loading="lazy" decoding="async" src={img} alt={app.project_name}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}
            onError={e => { e.target.src = "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=90"; }}
          />
          <button onClick={onClose} style={{
            position:"absolute", top:12, right:12,
            width:36, height:36, borderRadius:"50%",
            background:"rgba(0,0,0,0.50)", border:"none",
            color:"#fff", fontSize:18, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            backdropFilter:"blur(4px)",
            zIndex:2,
          }}>✕</button>
          <div style={{
            position:"absolute", bottom:12, left:12,
            background:"rgba(13,196,181,0.92)", borderRadius:99,
            padding:"4px 12px", fontSize:11, fontWeight:700, color:"#fff",
          }}>✅ Bewilligt</div>
        </div>

        {/* Inhalt */}
        <div style={{ padding:"20px 20px 28px" }}>
          <h2 style={{ margin:"0 0 8px", fontSize:20, fontWeight:900, color:"#141422" }}>
            {app.project_name}
          </h2>
          <p style={{ margin:"0 0 16px", fontSize:13.5, color:"#555", lineHeight:1.6 }}>
            {app.short_desc}
          </p>

          {app.problem && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:4 }}>Das Problem</div>
              <p style={{ margin:0, fontSize:13, color:"#333", lineHeight:1.6 }}>{app.problem}</p>
            </div>
          )}
          {app.vision && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:4 }}>Vision & Lösung</div>
              <p style={{ margin:0, fontSize:13, color:"#333", lineHeight:1.6 }}>{app.vision}</p>
            </div>
          )}
          {app.why_support && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:4 }}>Warum fördern?</div>
              <p style={{ margin:0, fontSize:13, color:"#333", lineHeight:1.6 }}>{app.why_support}</p>
            </div>
          )}

          {/* Meta-Infos */}
          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr",
            gap:8, margin:"16px 0",
            background:"rgba(13,196,181,0.07)", borderRadius:14, padding:14,
          }}>
            <div>
              <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase" }}>Förderbetrag</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#0DC4B5" }}>
                € {(app.funding_goal || 0).toLocaleString("de-DE")}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase" }}>Eingereicht</div>
              <div style={{ fontSize:14, fontWeight:700, color:"#141422" }}>{fmtDate(app.created_at)}</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase" }}>Stimmen</div>
              <div style={{ fontSize:16, fontWeight:900, color:"#0DC4B5" }}>
                {checking ? "…" : `${voteCount} 🗳`}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10, color:"#999", fontWeight:700, textTransform:"uppercase" }}>Status</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#22c55e" }}>✅ Bewilligt</div>
            </div>
          </div>

          {/* Finanzierungsbalken */}
          <div style={{ background:'rgba(13,196,181,0.06)', borderRadius:16, padding:'16px', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#666', marginBottom:6 }}>
              <span>Finanzierungsfortschritt</span>
              <span style={{ fontWeight:700, color:'#0DC4B5' }}>{fundPct}%</span>
            </div>
            <div style={{ height:8, borderRadius:99, background:'rgba(0,0,0,0.08)', overflow:'hidden', marginBottom:8 }}>
              <div style={{ height:'100%', borderRadius:99, width:`${fundPct}%`,
                background:'linear-gradient(90deg,#0DC4B5,#09A89D)', transition:'width 1.2s ease' }}/>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:'#1A1A1A' }}>
              €{fundedEur.toLocaleString('de-DE')} von €{goalFromDb.toLocaleString('de-DE')} finanziert
            </div>
          </div>
          {/* Stimmen-Counter — NUR Counter, kein Balken */}
          <div style={{ fontSize:13, color:"#888", marginBottom:16, display:"flex", alignItems:"center", gap:4 }}><HUIStimmeIcon size={13}/>{voteCount} Stimmen bisher</div>

          {/* Zusatzmaterial */}
          {app.media_urls && app.media_urls.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#999", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:8 }}>
                Zusatzmaterial ({app.media_urls.length} Datei{app.media_urls.length !== 1 ? "en" : ""})
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {app.media_urls.map((url, idx) => {
                  const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
                  return isImg ? (
                    <a key={idx} href={url} target="_blank" rel="noreferrer">
                      <img loading="lazy" decoding="async" src={url} alt={`Datei ${idx+1}`}
                        style={{ width:72, height:72, objectFit:"cover", borderRadius:10,
                          border:"1px solid rgba(0,0,0,0.10)" }} />
                    </a>
                  ) : (
                    <a key={idx} href={url} target="_blank" rel="noreferrer"
                      style={{
                        display:"flex", alignItems:"center", gap:6,
                        background:"rgba(114,100,214,0.08)",
                        border:"1px solid rgba(114,100,214,0.20)",
                        borderRadius:10, padding:"8px 12px",
                        fontSize:12, color:"#7264D6", fontWeight:600,
                        textDecoration:"none",
                      }}>
                      📎 Datei {idx+1}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Meilensteine ── */}
          <div style={{ marginTop: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#141422', marginBottom: 12 }}>🏁 Meilensteine</div>
            {milestonesLoading ? (
              <div style={{ color: '#888', fontSize: 13 }}>Laden...</div>
            ) : milestones.length === 0 ? (
              <div style={{ color: '#888', fontSize: 13 }}>Noch keine Meilensteine definiert.</div>
            ) : (
              milestones.map((m, idx) => <MilestoneCard key={m.id} milestone={m} index={idx} onViewProgress={() => setDetailMilestone(m)} />)
            )}
          </div>



          {/* ── Stimmen-System ── */}
          <div style={{ marginTop: 8 }}>

            {/* Stimmen-Counter */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:12,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <HUIStimmeIcon size={20} />
                <span style={{ fontSize:15, fontWeight:800, color:"#141422" }}>
                  {checking ? "…" : voteCount}
                </span>
                <span style={{ fontSize:12, color:"#888" }}>
                  {voteCount === 1 ? "Stimme" : "Stimmen"} bisher
                </span>
              </div>
              {currentUser?.id && userVotesLeft !== null && !voted && (
                <div style={{
                  fontSize:11, fontWeight:700,
                  background: userVotesLeft > 0 ? "rgba(13,196,181,0.10)" : "rgba(239,68,68,0.10)",
                  color:      userVotesLeft > 0 ? "#0DC4B5" : "#ef4444",
                  border:     `1px solid ${userVotesLeft > 0 ? "rgba(13,196,181,0.25)" : "rgba(239,68,68,0.25)"}`,
                  borderRadius:99, padding:"4px 10px",
                }}>
                  {userVotesLeft > 0 ? `${userVotesLeft} Stimme${userVotesLeft !== 1 ? "n" : ""} übrig` : "Keine Stimmen mehr"}
                </div>
              )}
            </div>

            {/* Fortschrittsbalken */}
            {voteCount > 0 && (
              <div style={{
                height:4, borderRadius:99, background:"rgba(13,196,181,0.12)", marginBottom:14,
              }}>
                <div style={{
                  height:"100%", borderRadius:99,
                  background:"linear-gradient(90deg,#0DC4B5,#22DDD0)",
                  width:`${Math.min(100, (voteCount / Math.max(voteCount, 20)) * 100)}%`,
                  transition:"width 0.5s ease",
                }} />
              </div>
            )}

            {/* Error */}
            {voteError && (
              <div style={{
                fontSize:12, color:"#ef4444", marginBottom:10,
                padding:"8px 12px", background:"rgba(239,68,68,0.08)",
                borderRadius:10, border:"1px solid rgba(239,68,68,0.20)",
              }}>
                ⚠️ {voteError}
              </div>
            )}

            {/* Vote-Button */}
            {currentUser?.id ? (
              voted ? (
                <div style={{
                  textAlign:"center", padding:"14px 16px",
                  background:"rgba(34,197,94,0.10)", borderRadius:14,
                  border:"1px solid rgba(34,197,94,0.25)",
                }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>💚</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#22c55e" }}>Deine Stimme zählt!</div>
                  <div style={{ fontSize:12, color:"#666", marginTop:2 }}>
                    Du hast für „{app.project_name}" gestimmt.
                  </div>
                </div>
              ) : userVotesLeft === 0 ? (
                <div style={{
                  textAlign:"center", padding:"14px 16px",
                  background:"rgba(239,68,68,0.06)", borderRadius:14,
                  border:"1px solid rgba(239,68,68,0.20)",
                }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#ef4444" }}>
                    🗳 Keine Stimmen mehr diesen Monat
                  </div>
                  <div style={{ fontSize:11, color:"#888", marginTop:4 }}>
                    Deine Stimmen werden am 1. des nächsten Monats erneuert.
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleVote}
                  disabled={loading || checking || userVotesLeft === 0}
                  style={{
                    width:"100%", padding:"15px",
                    background: (loading || checking)
                      ? "rgba(13,196,181,0.50)"
                      : "linear-gradient(135deg,#0DC4B5,#22DDD0)",
                    border:"none", borderRadius:99, color:"#fff",
                    fontSize:15, fontWeight:800,
                    cursor: (loading || checking) ? "not-allowed" : "pointer",
                    boxShadow:"0 4px 18px rgba(13,196,181,0.35)",
                    transition:"all 0.2s",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                  }}
                >
                  {loading ? (
                    <><span style={{ fontSize:16 }}>⏳</span> Wird gespeichert…</>
                  ) : (
                    <><HUIStimmeIcon size={16}/> Für dieses Projekt abstimmen</>
                  )}
                </button>
              )
            ) : (
              <div style={{
                textAlign:"center", padding:"14px",
                background:"rgba(0,0,0,0.04)", borderRadius:14,
              }}>
                <div style={{ fontSize:13, color:"#666" }}>Melde dich an, um abstimmen zu können.</div>
              </div>
            )}
          </div>

        </div>
        </div>{/* /Scroll-Wrapper */}
      </div>{/* /Sheet */}

      {/* ── Meilenstein-Detail-Sheet (über dem Projektfenster) ── */}
      {detailMilestone && (
        <MilestoneDetailSheet
          milestone={detailMilestone}
          onClose={() => setDetailMilestone(null)}
        />
      )}

    </>
  );
  return typeof document !== "undefined"
    ? ReactDOM.createPortal(content, document.body)
    : content;
}
