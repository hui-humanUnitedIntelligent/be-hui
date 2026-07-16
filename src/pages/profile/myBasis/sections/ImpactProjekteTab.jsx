import React from "react";
export function ImpactProjekteTab({ profile, supabase, onUpdateClick }) {
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // impact_applications nutzt 'user_id' als User-Feld
  const userField = "user_id";

  React.useEffect(() => {
    if (!profile?.user_id && !profile?.id) return;
    const uid = profile.user_id || profile.id;
    supabase
      .from("impact_applications")
      .select("id,project_name,short_desc,funding_goal,current_amount_eur,status,rank,is_completed,created_at")
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
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
          Noch kein Impact-Projekt
        </div>
        <div style={{ fontSize: 13, color: "#666" }}>
          Reiche dein erstes Herzensprojekt ein und erhalte Community-Finanzierung.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 20px" }}>
      {projects.map((proj) => {
        const funded = proj.current_amount_eur || 0;
        const goal = proj.funding_goal || 0;
        const pct = goal > 0 ? Math.min(100, Math.round((funded / goal) * 100)) : 0;
        const statusColor =
          proj.status === "approved" ? "#0DC4B5" :
          proj.status === "rejected" ? "#e74c3c" : "#f39c12";
        const statusLabel =
          proj.status === "approved" ? "✅ Bewilligt" :
          proj.status === "rejected" ? "❌ Abgelehnt" : "⏳ In Prüfung";
        return (
          <div
            key={proj.id}
            style={{
              background: "#F5FBF8",
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              border: "1px solid rgba(13,196,181,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#1A1A1A",
                  flex: 1,
                  marginRight: 8,
                }}
              >
                {proj.project_name}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: statusColor,
                  background: statusColor + "15",
                  padding: "3px 8px",
                  borderRadius: 99,
                  flexShrink: 0,
                }}
              >
                {statusLabel}
              </span>
            </div>
            {proj.short_desc && (
              <div style={{ fontSize: 12, color: "#666", marginBottom: 8, lineHeight: 1.4 }}>
                {proj.short_desc}
              </div>
            )}
            <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>
              €{funded.toLocaleString("de-DE")} von €{goal.toLocaleString("de-DE")} finanziert
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 99,
                background: "rgba(0,0,0,0.08)",
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 99,
                  width: `${pct}%`,
                  background: "linear-gradient(90deg,#0DC4B5,#09A89D)",
                }}
              />
            </div>
            {proj.status === "approved" && (
              <button
                onClick={() => onUpdateClick(proj)}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 12,
                  border: "1.5px dashed #0DC4B5",
                  background: "transparent",
                  color: "#0DC4B5",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                + Update hinzufügen
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
