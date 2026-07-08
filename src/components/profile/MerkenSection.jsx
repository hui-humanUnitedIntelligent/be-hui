// MerkenSection — Gespeicherte Inhalte im Mein-HUI-Profil
// MERKEN.1B: verschoben aus CreatorDashboard (dead) → MyBasisProfile (produktiv)
// MERKLISTE.1 (2026-07-08): Filter-Tabs + Realtime-Sync + typgerechte
// Detailseiten-Navigation. Weiterhin keine neue Tabelle/Logik --
// wiederverwendet saved_posts (siehe hui_060_...sql).
//
// MERKEN.3-FIX (2026-07-08): ruft useSavedPosts() bewusst NICHT mehr auf.
// Grund: useSavedPosts() oeffnet seit MERKEN.3 selbst einen Realtime-Channel
// (`saved_posts_count:<uid>`) fuer den Profil-Badge. Wenn MerkenSection
// (hier) UND MyBasisProfile.jsx (Badge) gleichzeitig gemountet sind, riefen
// beide useSavedPosts() auf -- gleicher Nutzer, gleicher Topic-Name.
// supabase.channel(topic) gibt bei bereits existierendem Topic denselben,
// schon subscribten Channel zurueck (siehe RealtimeClient.channel() Quelle),
// die zweite Hook-Instanz versuchte dann .on('postgres_changes', ...) auf
// einem bereits subscribten Channel zu registrieren -> harter Crash
// "cannot add `postgres_changes` callbacks ... after `subscribe()`".
// Fix an der Ursache: nur noch EINE Stelle (MyBasisProfile.jsx) instanziiert
// useSavedPosts(). MerkenSection entfernt Eintraege ueber eine eigene,
// direkte Mutation (kein Toggle noetig -- hier wird nie hinzugefuegt,
// nur entfernt) und behaelt seinen unabhaengigen `saved_posts:<uid>`-Channel
// fuer die Item-Liste (anderer Topic-Name, andere Funktion: volle
// Snapshot-Objekte statt nur IDs/Count -- keine Kollision, keine Dopplung).
import React from "react";
import { useAuth }       from "../../lib/AuthContext.jsx";
import { supabase }      from "../../lib/supabaseClient.js";
import { HUIBookmarkIcon } from "../../design/icons/HuiInteractionIcons.jsx";
import { toast }         from "../../lib/useToast.jsx";

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

// content_type -> Anzeige. wirker/project bewusst schon vorbereitet
// (Auftrag: "optional vorbereiten"), auch wenn noch keine UI diese Typen
// aktiv speichert -- MerkenSection muss sie nur sauber darstellen koennen.
const TYPE_LABEL = {
  work: "Werk", experience: "Erlebnis", post: "Beitrag", beitrag: "Beitrag",
  event: "Veranstaltung", wirker: "Wirker", project: "Projekt",
};
const TYPE_ICON = {
  work: "🎨", experience: "📅", event: "📅", wirker: "👤", project: "🌱",
};

// Filter-Tabs (Auftrag: Alle / Beiträge / Werke / Erlebnisse / Projekte)
const FILTERS = [
  { key: "all",        label: "Alle",       types: null },
  { key: "post",       label: "Beiträge",   types: ["post", "beitrag"] },
  { key: "work",       label: "Werke",      types: ["work"] },
  { key: "experience", label: "Erlebnisse", types: ["experience", "event"] },
  { key: "project",    label: "Projekte",   types: ["project"] },
];

export default function MerkenSection({ onOpenProfile, onOpenDiscover, onOpenContent }) {
  const { user }          = useAuth();
  const [items,    setItems]    = React.useState([]);
  const [loading,  setLoading]  = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState("all");

  const fetchItems = React.useCallback(() => {
    if (!user?.id) return;
    return supabase
      .from("saved_posts")
      .select("id, post_id, post_type, post_data, saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, [user?.id]);

  React.useEffect(() => { fetchItems(); }, [fetchItems]);

  // MERKLISTE.1 — Realtime: sobald irgendwo (Feed, Detailseite, hier selbst)
  // gemerkt/entfernt wird, aktualisiert sich diese Liste ohne manuellen
  // Reload. Setzt voraus, dass saved_posts in der supabase_realtime
  // Publication ist (Migration 069) -- ohne Migration bleibt es beim
  // bisherigen Verhalten (Liste laedt beim Oeffnen frisch).
  // MERKEN.3-DELETE-FIX (2026-07-08): Supabase liefert bei DELETE auf
  // RLS-Tabellen im old-Record nur die Primary-Key-Spalte (id) --
  // dokumentiertes Verhalten, keine Migration umgeht das. Items tragen
  // daher jetzt "id" mit (siehe select oben), Abgleich beim Entfernen
  // erfolgt ueber i.id statt i.post_id. Gleicher Channel, gleicher Filter,
  // keine neue Datenquelle -- nur korrektes Feld zum Abgleich.
  React.useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`saved_posts:${user.id}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "saved_posts", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new;
          if (!row) return;
          setItems(prev => prev.some(i => i.id === row.id) ? prev : [row, ...prev]);
        })
      .on("postgres_changes",
        { event: "DELETE", schema: "public", table: "saved_posts", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const rowId = payload.old?.id;
          if (!rowId) return;
          setItems(prev => prev.filter(i => i.id !== rowId));
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const handleRemove = async (postId) => {
    if (!user?.id) return;
    // Optimistic zuerst (fuehlt sich sofort an), DB-Write danach.
    // Direkte Mutation statt useSavedPosts().toggleSave -- hier wird nie
    // hinzugefuegt, nur entfernt, und der Hook wuerde eine zweite,
    // kollidierende Realtime-Subscription oeffnen (siehe Datei-Kopf).
    setItems(prev => prev.filter(i => i.post_id !== postId));
    try {
      await supabase.from("saved_posts").delete()
        .eq("user_id", user.id).eq("post_id", postId);
      await supabase.from("post_reactions").delete()
        .eq("user_id", user.id).eq("post_id", postId).eq("type", "save");
    } catch { /* Realtime/Reload gleicht ab, falls das je fehlschlaegt */ }
    toast.info("Aus Merkliste entfernt", { duration: 1800 });
  };

  const handleOpen = (item) => {
    if (onOpenContent) { onOpenContent(item); return; }
    // Fallback (falls Parent noch nicht aktualisiert ist): Autor-Profil
    if (item.post_data?.user_id) onOpenProfile?.(item.post_data.user_id);
  };

  const getLabel   = (type) => TYPE_LABEL[type] || "Inhalt";
  const getCover   = (item) => { const d = item.post_data || {}; return d.cover_url || d.cover || d.src || d.image || d.avatar_url || null; };
  const getTitle   = (item) => { const d = item.post_data || {}; return d.title || d.caption || d.name || "Gespeicherter Inhalt"; };
  const getCreator = (item) => { const d = item.post_data || {}; return d.author_name || d.creator_name || d.display_name || d.username || null; };
  const formatDate = (iso)  => { if (!iso) return ""; const d = new Date(iso); return d.toLocaleDateString("de-DE", { day:"numeric", month:"short", year:"numeric" }); };

  const filtered = React.useMemo(() => {
    const f = FILTERS.find(f => f.key === activeFilter);
    if (!f || !f.types) return items;
    return items.filter(i => f.types.includes(i.post_type));
  }, [items, activeFilter]);

  // Filter-Tabs nur zeigen, wenn ueberhaupt gespeicherte Inhalte existieren
  // (Auftrag: Empty-State bleibt unveraendert, bis der erste Inhalt da ist)
  const showFilters = items.length > 0;

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
        <div style={{ display:"flex", color:T.muted }}><HUIBookmarkIcon size={36} /></div>
        <div style={{ fontSize:16, fontWeight:700, color:T.ink, letterSpacing:"-0.02em" }}>
          Noch nichts gemerkt
        </div>
        <div style={{ fontSize:13, color:T.soft, maxWidth:260, lineHeight:1.6 }}>
          Speichere Werke, Erlebnisse oder Beiträge und finde sie hier jederzeit wieder.
        </div>
        {onOpenDiscover && (
          <button
            onClick={() => onOpenDiscover()}
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
      {showFilters && (
        <div style={{
          display:"flex", gap:6, overflowX:"auto", paddingBottom:2,
          WebkitOverflowScrolling:"touch", scrollbarWidth:"none",
        }}>
          {FILTERS.map(f => {
            const active = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  flexShrink:0, padding:"6px 14px", borderRadius:20,
                  background: active ? T.teal : "rgba(26,26,46,0.05)",
                  border: `1px solid ${active ? T.teal : T.border}`,
                  color: active ? "#fff" : T.soft,
                  fontSize:12.5, fontWeight:700, cursor:"pointer",
                  touchAction:"manipulation", whiteSpace:"nowrap",
                }}
              >{f.label}</button>
            );
          })}
        </div>
      )}

      {filtered.map((item) => {
        const cover   = getCover(item);
        const title   = getTitle(item);
        const creator = getCreator(item);
        const label   = getLabel(item.post_type);
        const date    = formatDate(item.saved_at);

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
            {/* Cover — Tap oeffnet die jeweilige Detailseite (kein Kopie-Screen) */}
            <div
              onClick={() => handleOpen(item)}
              style={{
                width:50, height:50, borderRadius:12, flexShrink:0,
                background: cover ? "transparent" : `linear-gradient(135deg,${T.teal}22,${T.coral}18)`,
                overflow:"hidden", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
              {cover
                ? <img src={cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}
                    onError={e => { e.target.style.display="none"; }} />
                : <span style={{ fontSize:20 }}>{TYPE_ICON[item.post_type] || "🌿"}</span>
              }
            </div>

            {/* Info */}
            <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={() => handleOpen(item)}>
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
              <button
                onClick={() => handleOpen(item)}
                style={{
                  padding:"5px 10px", borderRadius:10,
                  background:`${T.teal}15`, border:`1px solid ${T.teal}30`,
                  color:T.teal, fontSize:11, fontWeight:700, cursor:"pointer",
                  whiteSpace:"nowrap", touchAction:"manipulation",
                }}
              >Öffnen</button>
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
