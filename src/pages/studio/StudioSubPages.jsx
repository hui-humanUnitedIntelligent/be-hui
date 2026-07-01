// src/pages/studio/StudioSubPages.jsx
// HUI Creator Studio — Sub-Page-Stubs
import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";

const C = {
  teal:   "#16D7C5",
  coral:  "#FF8A6B",
  cream:  "#F9F7F4",
  ink:    "#1A1A1A",
  muted:  "rgba(80,80,80,0.55)",
};

/* ── Gemeinsamer Sub-Page Wrapper ── */
function SubPageShell({ title, emoji, onBack, children }) {
  return (
    <div style={{
      position:"fixed", inset:0,
      background:C.cream,
      display:"flex", flexDirection:"column",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      <div style={{
        display:"flex", alignItems:"center", gap:12,
        padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px",
        background:"white",
        borderBottom:"1px solid rgba(0,0,0,0.06)",
      }}>
        <button onClick={onBack} style={{
          width:36, height:36, borderRadius:10,
          background:"rgba(0,0,0,0.05)", border:"none",
          display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", fontSize:16,
        }}>←</button>
        <span style={{ fontSize:18 }}>{emoji}</span>
        <span style={{ fontSize:17, fontWeight:700, color:C.ink }}>{title}</span>
      </div>
      <div style={{
        flex:1, overflowY:"auto",
        padding:"24px 20px",
        WebkitOverflowScrolling:"touch",
      }}>
        {children || (
          <div style={{ textAlign:"center", padding:"60px 20px", color:C.muted }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✦</div>
            <div style={{ fontSize:14 }}>Dieser Bereich wird gerade aufgebaut.</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Status-Konfiguration ── */
const STATUS_CFG = {
  pending_review: { label:"In Prüfung",  color:"#D97706", bg:"rgba(217,119,6,0.1)",   icon:"🔍" },
  published:      { label:"Freigegeben", color:"#10B981", bg:"rgba(16,185,129,0.1)",  icon:"✅" },
  rejected:       { label:"Abgelehnt",   color:"#EF4444", bg:"rgba(239,68,68,0.1)",   icon:"❌" },
  draft:          { label:"Entwurf",     color:"#94A3B8", bg:"rgba(148,163,184,0.1)", icon:"📝" },
};

/* ── Werke & Inhalte ── */
export function MeineInhaltePage({ onBack, userId }) {
  const navigate = useNavigate();
  const [works,    setWorks]    = React.useState([]);
  const [exps,     setExps]     = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);
  const [resubDlg, setResubDlg] = React.useState(null);
  const [toast,    setToast]    = React.useState(null);

  React.useEffect(() => {
    if (!userId) { setLoading(false); return; }
    async function load() {
      const [wRes, eRes] = await Promise.all([
        supabase.from("works")
          .select("id,title,cover_url,category,status,admin_comment,rejection_reason,reviewed_at,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending:false }).limit(50),
        supabase.from("experiences")
          .select("id,title,cover_url,category,status,admin_comment,rejection_reason,reviewed_at,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending:false }).limit(50),
      ]);
      setWorks(wRes.data || []);
      setExps(eRes.data  || []);
      setLoading(false);
    }
    load();
  }, [userId]);

  function showToast(msg, ok=true) {
    setToast({msg,ok});
    setTimeout(() => setToast(null), 3000);
  }

  async function resubmit(type, id) {
    const table  = type === "werk" ? "works" : "experiences";
    const { error } = await supabase.from(table)
      .update({
        status:           "pending_review",
        rejection_reason: null,
        rejected_at:      null,
        updated_at:       new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      showToast("Fehler: " + error.message, false);
    } else {
      showToast("✅ Erneut eingereicht — wird geprüft");
      const setter = type === "werk" ? setWorks : setExps;
      setter(prev => prev.map(x =>
        x.id === id ? { ...x, status:"pending_review", rejection_reason:null } : x
      ));
    }
    setResubDlg(null);
  }

  const allItems = [
    ...(works||[]).map(w => ({ ...w, _type:"werk" })),
    ...(exps||[]).map(e  => ({ ...e, _type:"experience" })),
  ].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <SubPageShell title="Werke & Inhalte" emoji="🎨" onBack={onBack}>
      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
          zIndex:9999, padding:"10px 20px", borderRadius:99,
          background:toast.ok?"#10B981":"#EF4444", color:"#fff",
          fontSize:13, fontWeight:700, pointerEvents:"none",
          boxShadow:"0 4px 16px rgba(0,0,0,0.2)",
        }}>{toast.msg}</div>
      )}

      {/* Einreich-Dialog */}
      {resubDlg && (
        <div style={{
          position:"fixed", inset:0, zIndex:9900,
          background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:20,
        }}>
          <div style={{
            background:"#fff", borderRadius:20, padding:24,
            width:"100%", maxWidth:400,
            boxShadow:"0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <div style={{ fontSize:16, fontWeight:800, marginBottom:8 }}>
              🔄 Erneut einreichen?
            </div>
            <div style={{ fontSize:13, color:"#555", marginBottom:20 }}>
              „{resubDlg.title}" wird erneut zur Prüfung eingereicht.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setResubDlg(null)} style={{
                flex:1, padding:"11px", borderRadius:12,
                border:"1px solid #ddd", background:"none",
                fontSize:13, cursor:"pointer",
              }}>Abbrechen</button>
              <button onClick={() => resubmit(resubDlg.type, resubDlg.id)} style={{
                flex:2, padding:"11px", borderRadius:12, border:"none",
                background:"#0EC4B8", color:"#fff",
                fontSize:13, fontWeight:700, cursor:"pointer",
              }}>✅ Einreichen</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:48, color:C.muted }}>
          <div style={{ fontSize:28, marginBottom:8 }}>🎨</div>
          Lade deine Inhalte…
        </div>
      ) : !userId ? (
        <div style={{ textAlign:"center", padding:48, color:C.muted, fontSize:14 }}>
          Bitte anmelden.
        </div>
      ) : allItems.length === 0 ? (
        <div style={{ textAlign:"center", padding:48, color:C.muted }}>
          <div style={{ fontSize:36, marginBottom:12 }}>✦</div>
          <div style={{ fontSize:14 }}>Noch keine Werke oder Erlebnisse eingereicht.</div>
        </div>
      ) : allItems.map(item => {
        const st         = STATUS_CFG[item.status] || STATUS_CFG.draft;
        const isRejected = item.status === "rejected";
        return (
          <div
            key={item.id}
            onClick={() => {
              if (item._type === "werk") navigate(`/work/${item.id}`);
              else if (item._type === "experience") navigate(`/experience/${item.id}`);
            }}
            style={{
            background:"#fff", borderRadius:16,
            boxShadow:"0 2px 12px rgba(0,0,0,0.07)",
            border:"1px solid rgba(0,0,0,0.06)",
            marginBottom:12, overflow:"hidden",
            cursor:"pointer",
          }}>
            <div style={{ display:"flex" }}>
              {/* Thumbnail */}
              <div style={{
                width:76, flexShrink:0, minHeight:76,
                background:"#f0efed", position:"relative",
              }}>
                {item.cover_url
                  ? <img src={item.cover_url} alt=""
                      style={{ width:"100%", height:"100%", objectFit:"cover",
                               position:"absolute", inset:0 }}/>
                  : <div style={{
                      position:"absolute", inset:0,
                      display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:22,
                    }}>
                      {item._type === "werk" ? "🎨" : "🎟"}
                    </div>
                }
              </div>

              {/* Content */}
              <div style={{ flex:1, padding:"10px 12px" }}>
                {/* Titel + Status-Badge */}
                <div style={{
                  display:"flex", alignItems:"flex-start",
                  justifyContent:"space-between", gap:8, marginBottom:4,
                }}>
                  <div style={{
                    fontSize:13.5, fontWeight:700, color:"#1A1A18", lineHeight:1.3,
                  }}>
                    {item.title || "Kein Titel"}
                  </div>
                  <span style={{
                    flexShrink:0, padding:"2px 8px", borderRadius:99,
                    background:st.bg, color:st.color,
                    fontSize:9.5, fontWeight:700, whiteSpace:"nowrap",
                  }}>
                    {st.icon} {st.label}
                  </span>
                </div>

                {/* Kategorie */}
                {item.category && (
                  <div style={{ fontSize:11, color:"#888", marginBottom:6 }}>
                    {item.category}
                  </div>
                )}

                {/* Ablehnungsgrund */}
                {isRejected && item.rejection_reason && (
                  <div style={{
                    fontSize:11, color:"#EF4444",
                    background:"rgba(239,68,68,0.06)",
                    border:"1px solid rgba(239,68,68,0.15)",
                    borderRadius:8, padding:"6px 9px",
                    marginBottom:8, lineHeight:1.5,
                  }}>
                    <b>Ablehnungsgrund:</b><br/>
                    {item.rejection_reason}
                  </div>
                )}

                {/* Admin-Kommentar */}
                {item.admin_comment && (
                  <div style={{
                    fontSize:11, color:"#555",
                    background:"rgba(0,0,0,0.04)",
                    borderRadius:8, padding:"6px 9px",
                    marginBottom:8, lineHeight:1.5,
                  }}>
                    <b>Hinweis des Teams:</b> {item.admin_comment}
                  </div>
                )}

                {/* Prüfdatum */}
                {item.reviewed_at && item.status !== "pending_review" && (
                  <div style={{ fontSize:10, color:"#aaa", marginBottom:8 }}>
                    Geprüft: {new Date(item.reviewed_at).toLocaleDateString("de-DE")}
                  </div>
                )}

                {/* Erneut einreichen */}
                {isRejected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setResubDlg({
                        type:item._type, id:item.id, title:item.title,
                      });
                    }}
                    style={{
                      padding:"6px 14px", borderRadius:99, border:"none",
                      background:"#0EC4B8", color:"#fff",
                      fontSize:11.5, fontWeight:700, cursor:"pointer",
                    }}>
                    🔄 Erneut einreichen
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </SubPageShell>
  );
}

/* ── Weitere Sub-Pages ── */

export function AnalyticsPage({ onBack }) {
  return (
    <SubPageShell title="Reichweite" emoji="✦" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Analytics werden bald verfügbar sein.
      </div>
    </SubPageShell>
  );
}

export function EinnahmenPage({ onBack }) {
  return (
    <SubPageShell title="Einnahmen" emoji="◎" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Einnahmen-Übersicht wird bald verfügbar sein.
      </div>
    </SubPageShell>
  );
}

export function VerfuegbarkeitPage({ onBack }) {
  return (
    <SubPageShell title="Verfügbarkeit" emoji="🗓" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Verfügbarkeits-Einstellungen folgen bald.
      </div>
    </SubPageShell>
  );
}

export function BestellungenPage({ onBack }) {
  return (
    <SubPageShell title="Zusammenarbeit" emoji="🤝" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Anfragen & Projekte werden hier verwaltet.
      </div>
    </SubPageShell>
  );
}

export function ImpactSubPage({ onBack }) {
  return (
    <SubPageShell title="Impact" emoji="🌱" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Dein Beitrag zur Community.
      </div>
    </SubPageShell>
  );
}

export function ReputationInsightsPage({ onBack }) {
  return (
    <SubPageShell title="Vertrauen" emoji="⭐" onBack={onBack}>
      <div style={{ textAlign:"center", padding:"40px 0", color:C.muted, fontSize:14 }}>
        Vertrauen & Feedback-Übersicht folgt bald.
      </div>
    </SubPageShell>
  );
}

export function KontoPage({ onBack, onLogout }) {
  return (
    <SubPageShell title="Einstellungen" emoji="◦" onBack={onBack}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{
          padding:"16px", background:"white",
          borderRadius:16, boxShadow:"0 2px 8px rgba(0,0,0,0.05)",
          fontSize:14, color:C.ink,
        }}>
          Konto-Einstellungen folgen bald.
        </div>
        {onLogout && (
          <button onClick={onLogout} style={{
            width:"100%", padding:"14px", borderRadius:14, border:"none",
            background:"rgba(255,90,90,0.08)", color:"#E53E3E",
            fontSize:14, fontWeight:600, cursor:"pointer", marginTop:8,
          }}>
            Abmelden
          </button>
        )}
      </div>
    </SubPageShell>
  );
}
