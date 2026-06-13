// MerkenSection — Gespeicherte Inhalte im Mein-HUI-Profil
// MERKEN.1B: verschoben aus CreatorDashboard (dead) → MyBasisProfile (produktiv)
// Keine neue Logik — wiederverwendet: useSavedPosts, saved_posts Tabelle
import React from "react";
import { useAuth }       from "../../lib/AuthContext.jsx";
import { useSavedPosts } from "../../lib/useReactions.jsx";
import { supabase }      from "../../lib/supabaseClient.js";

const T = {
  teal:   "#16D7C5",
  coral:  "#FF8A6B",
  ink:    "#1A1A2E",
  muted:  "rgba(26,26,46,0.40)",
  soft:   "rgba(26,26,46,0.55)",
  card:   "#FFFFFF",
  border: "rgba(26,26,46,0.08)",
  shadow: "0 2px 8px rgba(26,26,46,0.06)",
  r:      14,
};

export default function MerkenSection({ onOpenProfile }) {
  const { user }          = useAuth();
  const { toggleSave }    = useSavedPosts();
  const [items,   setItems]   = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("saved_posts")
      .select("post_id, post_type, post_data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [user?.id]);

  const handleRemove = async (postId) => {
    await toggleSave(postId);
    setItems(prev => prev.filter(i => i.post_id !== postId));
  };

  const TYPE_LABEL = { work: "Werk", experience: "Erlebnis", post: "Beitrag", beitrag: "Beitrag" };
  const getLabel   = (type) => TYPE_LABEL[type] || "Inhalt";
  const getCover   = (item) => { const d = item.post_data || {}; return d.cover_url || d.cover || d.src || d.image || d.avatar_url || null; };
  const getTitle   = (item) => { const d = item.post_data || {}; return d.title || d.caption || d.name || "Gespeicherter Inhalt"; };
  const getCreator = (item) => { const d = item.post_data || {}; return d.author_name || d.creator_name || d.display_name || d.username || null; };
  const formatDate = (iso)  => { if (!iso) return ""; const d = new Date(iso); return d.toLocaleDateString("de-DE", { day:"numeric", month:"short", year:"numeric" }); };

  if (loading) {
    return (
      <div style={{ padding:"32px 0", textAlign:"center", color:T.muted, fontSize:14 }}>
        Lädt…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{
        padding:"40px 20px", textAlign:"center",
        display:"flex", flexDirection:"column", alignItems:"center", gap:12,
      }}>
        <div style={{ fontSize:36 }}>📌</div>
        <div style={{ fontSize:16, fontWeight:700, color:T.ink, letterSpacing:"-0.02em" }}>
          Noch nichts gemerkt
        </div>
        <div style={{ fontSize:13, color:T.soft, maxWidth:260, lineHeight:1.6 }}>
          Speichere Werke, Erlebnisse oder Beiträge und finde sie hier jederzeit wieder.
        </div>
        {onOpenProfile && (
          <button
            onClick={() => onOpenProfile("discover")}
            style={{
              marginTop:8, padding:"10px 20px", borderRadius:T.r,
              background:`linear-gradient(135deg,${T.teal},${T.coral})`,
              color:"#fff", fontSize:13, fontWeight:700,
              border:"none", cursor:"pointer", touchAction:"manipulation",
            }}
          >
            Entdecken öffnen
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {items.map((item, idx) => {
        const cover   = getCover(item);
        const title   = getTitle(item);
        const creator = getCreator(item);
        const label   = getLabel(item.post_type);
        const date    = formatDate(item.created_at);

        return (
          <div
            key={item.post_id}
            style={{
              background: T.card,
              borderRadius: T.r,
              border: `1px solid ${T.border}`,
              boxShadow: T.shadow,
              display:"flex", gap:12, alignItems:"center",
              padding:"12px 14px",
            }}
          >
            {/* Cover */}
            <div style={{
              width:50, height:50, borderRadius:12, flexShrink:0,
              background: cover ? "transparent" : `linear-gradient(135deg,${T.teal}22,${T.coral}18)`,
              overflow:"hidden",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              {cover
                ? <img src={cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}
                    onError={e => { e.target.style.display="none"; }} />
                : <span style={{ fontSize:20 }}>
                    {item.post_type === "experience" ? "📅" : item.post_type === "work" ? "🎨" : "🌿"}
                  </span>
              }
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{
                fontSize:13, fontWeight:700, color:T.ink,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>{title}</div>
              <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:3 }}>
                <span style={{
                  fontSize:10.5, fontWeight:700, color:T.teal,
                  background:`${T.teal}15`, borderRadius:6, padding:"1px 6px",
                }}>{label}</span>
                {creator && (
                  <span style={{
                    fontSize:11, color:T.muted,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                  }}>{creator}</span>
                )}
              </div>
              {date && <div style={{ fontSize:10.5, color:T.muted, marginTop:2 }}>{date}</div>}
            </div>

            {/* Aktionen */}
            <div style={{ display:"flex", flexDirection:"column", gap:6, flexShrink:0 }}>
              {item.post_data?.user_id && (
                <button
                  onClick={() => onOpenProfile?.(item.post_data.user_id)}
                  style={{
                    padding:"5px 10px", borderRadius:10,
                    background:`${T.teal}15`, border:`1px solid ${T.teal}30`,
                    color:T.teal, fontSize:11, fontWeight:700, cursor:"pointer",
                    whiteSpace:"nowrap", touchAction:"manipulation",
                  }}
                >Öffnen</button>
              )}
              <button
                onClick={() => handleRemove(item.post_id)}
                style={{
                  padding:"5px 10px", borderRadius:10,
                  background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)",
                  color:"#EF4444", fontSize:11, fontWeight:700, cursor:"pointer",
                  whiteSpace:"nowrap", touchAction:"manipulation",
                }}
              >Entfernen</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
