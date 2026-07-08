// MerkenSection — Gespeicherte Inhalte im Mein-HUI-Profil
// MERKEN.1B: verschoben aus CreatorDashboard (dead) → MyBasisProfile (produktiv)
// MERKLISTE.1 (2026-07-08): Filter-Tabs + Realtime-Sync + typgerechte
// Detailseiten-Navigation. Wiederverwendet saved_posts (siehe hui_060_...sql).
//
// MERKLISTE.2 (2026-07-08): Vorschaubild kommt NICHT mehr aus dem
// post_data-Snapshot (das war eine Kopie), sondern wird live ueber die
// bestehende post_id aus der Originaltabelle geladen (works/experiences/
// beitraege/projects/impact_projects), gebatcht pro Typ (kein N+1).
// Nutzt dieselben Normalizer (normalizeWorkRow etc.) wie der Feed, damit
// die Darstellung 1:1 identisch ist -- kein eigenes Cover-Mapping erfunden.
//
// MERKEN.3-FIX (2026-07-08): ruft useSavedPosts() bewusst NICHT mehr auf.
// Warum: der Hook oeffnet einen eigenen Channel (Badge in MyBasisProfile.jsx);
// zwei gleichzeitige Instanzen kollidierten auf demselben Topic-Namen und
// crashten. Entfernen laeuft hier ueber eine eigene direkte Mutation.
import React from "react";
import { useAuth }       from "../../lib/AuthContext.jsx";
import { supabase }      from "../../lib/supabaseClient.js";
import { HUIBookmarkIcon } from "../../design/icons/HuiInteractionIcons.jsx";
import { toast }         from "../../lib/useToast.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx"; // OPEN.2 2026-07-08 -- Merkliste oeffnet jetzt dieselbe Vorschau wie ueberall sonst, keine Direktnavigation mehr
import { normalizeWorkRow, normalizeExperienceRow, normalizeMomentRow }
                          from "../../system/feed/unifiedNormalizer.js";

// Identische Werte wie BaseFeedCard.jsx (Feed-Karten) -- Lars-Vorgabe:
// "dieselbe Formsprache wie alle anderen HUI Cards".
const T = {
  teal:   "#0DC4B5",
  coral:  "#F47355",
  ink:    "#1A1A2E",
  muted:  "rgba(26,26,46,0.40)",
  soft:   "rgba(26,26,46,0.55)",
  card:   "#FFFFFF",
  border: "rgba(26,26,46,0.07)",
  shadow: "0 2px 20px rgba(26,26,46,0.08)",
  r:      16,
  rThumb: 16,
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

export default function MerkenSection({ onOpenProfile, onOpenDiscover }) {
  const { user }          = useAuth();
  const { openRef }       = useContentPreview();
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

  // Zweck: Liste live halten, egal wo gemerkt/entfernt wird (Feed, Detail, hier).
  // Warum i.id statt i.post_id: DELETE liefert bei RLS nur die PK im old-Record.
  React.useEffect(() => {
    if (!user?.id) return;
    // Realtime-Dedupe-Schutz (2026-07-08, systemweit, siehe useProfileLocations.js):
    // existierenden Channel fuer diesen Topic wiederverwenden statt erneut zu
    // subscriben -- verhindert "cannot add postgres_changes callbacks ... after
    // subscribe()" bei gleichzeitigen Mounts fuer denselben Topic.
    const topic = `saved_posts:${user.id}`;
    const existing = supabase.getChannels().find(c => c.topic === `realtime:${topic}`);
    let channel = existing;
    let createdHere = false;
    if (!existing) {
      channel = supabase
        .channel(topic)
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
      createdHere = true;
    }
    return () => { if (createdHere) supabase.removeChannel(channel); };
  }, [user?.id]);

  // MERKLISTE.2: Live-Vorschaubilder ueber post_id, gebatcht pro Typ (kein
  // N+1 -- eine .in()-Query je Content-Tabelle, egal wie viele Items).
  // Stabiler Key statt Array-Referenz als Dependency (bekannte Lehre:
  // sonst Refetch-Loop bei jedem Re-Render).
  const itemsKey = items.map(i => `${i.post_id}:${i.post_type}`).join(",");
  const [originalCovers, setOriginalCovers] = React.useState(new Map());

  React.useEffect(() => {
    if (items.length === 0) { setOriginalCovers(new Map()); return; }
    let cancelled = false;

    const ids = { work: [], experience: [], beitrag: [], project: [] };
    for (const it of items) {
      if (it.post_type === "work") ids.work.push(it.post_id);
      else if (it.post_type === "experience" || it.post_type === "event") ids.experience.push(it.post_id);
      else if (it.post_type === "post" || it.post_type === "beitrag") ids.beitrag.push(it.post_id);
      else if (it.post_type === "project") ids.project.push(it.post_id);
    }

    (async () => {
      const map = new Map();

      if (ids.work.length) {
        // Bestaetigte Spalten (siehe useFeedStream.js-Query): cover_url,
        // media_url -- KEIN src/image_url auf works (Live-Check ergab
        // 42703 "column does not exist", nicht blind uebernehmen).
        const { data, error } = await supabase.from("works")
          .select("id,cover_url,media_url").in("id", ids.work);
        if (error) console.warn("[Merkliste] Cover-Load works:", error.message);
        (data || []).forEach(row => {
          const url = normalizeWorkRow(row)?.media?.[0]?.url;
          if (url) map.set(row.id, url);
        });
      }
      if (ids.experience.length) {
        const { data, error } = await supabase.from("experiences")
          .select("id,cover_url,media_url").in("id", ids.experience);
        if (error) console.warn("[Merkliste] Cover-Load experiences:", error.message);
        (data || []).forEach(row => {
          const url = normalizeExperienceRow(row)?.media?.[0]?.url;
          if (url) map.set(row.id, url);
        });
      }
      if (ids.beitrag.length) {
        const { data, error } = await supabase.from("beitraege")
          .select("id,src").in("id", ids.beitrag);
        if (error) console.warn("[Merkliste] Cover-Load beitraege:", error.message);
        (data || []).forEach(row => {
          const url = normalizeMomentRow(row)?.media?.[0]?.url;
          if (url) map.set(row.id, url);
        });
      }
      // "Projekt": Live-Check ergab, dass weder eine Tabelle 'projects'
      // existiert (PGRST205 -- useProfileData.js referenziert sie zwar,
      // ist aber selbst bereits ein bestehender toter Pfad, catch-
      // abgefangen, ausserhalb dieses Auftrags) noch besitzt
      // 'impact_projects' aktuell irgendeine Bildspalte (nur icon+color,
      // 42703 auf alle getesteten Bildspalten-Namen). Fuer 'project' gibt
      // es also aktuell KEIN Originalbild in der DB -- bewusst keine
      // Query hierfuer, korrekter Fallback aufs Typ-Icon (erfuellt Regel
      // 4: "nur wenn Originalinhalt kein Bild besitzt").

      if (!cancelled) setOriginalCovers(map);
    })();

    return () => { cancelled = true; };
  }, [itemsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zweck: Eintrag entfernen. Warum direkte Mutation statt toggleSave:
  // hier wird nie hinzugefuegt, siehe Datei-Kopf.
  const handleRemove = async (postId) => {
    if (!user?.id) return;
    setItems(prev => prev.filter(i => i.post_id !== postId)); // optimistic zuerst
    try {
      await supabase.from("saved_posts").delete()
        .eq("user_id", user.id).eq("post_id", postId);
      await supabase.from("post_reactions").delete()
        .eq("user_id", user.id).eq("post_id", postId).eq("type", "save");
    } catch { /* Realtime/Reload gleicht ab, falls das je fehlschlaegt */ }
    toast.info("Aus Merkliste entfernt", { duration: 1800 });
  };

  const handleOpen = (item) => {
    // OPEN.2 2026-07-08: keine Direktnavigation/Kopie mehr -- die Merkliste
    // oeffnet ab jetzt dieselbe ContentPreviewSheet wie Feed/Discover/Suche/
    // Profil. openRef laedt die aktuellen Live-Daten per (type,id), da hier
    // nur der post_data-Snapshot im Speicher liegt (siehe contentPreviewLoaders.js).
    if (item.post_id && item.post_type) {
      openRef({ type: item.post_type, id: item.post_id });
      return;
    }
    // Fallback (z.B. unbekannter/fehlender Typ): Autor-Profil
    if (item.post_data?.user_id) onOpenProfile?.(item.post_data.user_id);
  };

  const getLabel   = (type) => TYPE_LABEL[type] || "Inhalt";
  // MERKLISTE.2: kein getCover(post_data) mehr -- Bild kommt live aus
  // originalCovers (siehe Effect oben), NIE aus der gespeicherten Kopie.
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

      {filtered.map((item) => (
        <MerkenCard
          key={item.post_id}
          item={item}
          cover={originalCovers.get(item.post_id) || null}
          title={getTitle(item)}
          creator={getCreator(item)}
          label={getLabel(item.post_type)}
          date={formatDate(item.saved_at)}
          onOpen={() => handleOpen(item)}
          onRemove={() => handleRemove(item.post_id)}
        />
      ))}
    </div>
  );
}

// ── MerkenCard — "kleine Inspirationskarte" ──────────────────────────
// Visuelles Upgrade (2026-07-08): von reiner Textzeile zu einer echten
// Vorschau-Karte mit Thumbnail (88x88, radius 16, cover), Titel, Typ,
// Autor, Datum sowie Oeffnen + aktivem HUIBookmarkIcon unten rechts.
// Ganze Karte klickbar (nicht nur der Button) -- oeffnet den Original-
// inhalt. Formsprache identisch zu BaseFeedCard.jsx (r:16, gleicher
// Schatten, gleiche Teal/Coral-Werte) statt eigener Tabellen-/Listenoptik.
function MerkenCard({ item, cover, title, creator, label, date, onOpen, onRemove }) {
  const [imgErr, setImgErr] = React.useState(false);
  const showImg = cover && !imgErr;

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(); }}
      style={{
        background: T.card,
        borderRadius: T.r,
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        display:"flex", gap:14,
        padding:14,
        cursor:"pointer", touchAction:"manipulation",
        WebkitTapHighlightColor:"transparent",
      }}
    >
      {/* Vorschaubild — 88x88, radius 16, cover. Kein Bild -> hochwertiger
          HUI-Platzhalter (weicher Verlauf + Typ-Icon statt Graufeld). */}
      <div style={{
        width:88, height:88, borderRadius:T.rThumb, flexShrink:0,
        overflow:"hidden",
        background: showImg ? "transparent" : `linear-gradient(135deg, ${T.teal}22, ${T.coral}18)`,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {showImg
          ? <img src={cover} alt="" onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy" />
          : <span style={{ fontSize:32, opacity:0.85 }}>{TYPE_ICON[item.post_type] || "🌿"}</span>
        }
      </div>

      {/* Rechte Spalte: Titel/Typ/Autor/Datum oben, Aktionen unten rechts */}
      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
        <div>
          <div style={{
            fontSize:15, fontWeight:700, color:T.ink, lineHeight:1.32,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
            overflow:"hidden",
          }}>{title}</div>
          <div style={{ display:"flex", gap:6, alignItems:"center", marginTop:6, flexWrap:"wrap" }}>
            <span style={{
              fontSize:10.5, fontWeight:700, color:T.teal,
              background:`${T.teal}15`, borderRadius:6, padding:"2px 7px",
            }}>{label}</span>
            {creator && (
              <span style={{
                fontSize:12, color:T.soft, fontWeight:500,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
              }}>{creator}</span>
            )}
          </div>
          {date && <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{date}</div>}
        </div>

        {/* Unten rechts: Oeffnen + aktives HUIBookmarkIcon. stopPropagation,
            damit ein Klick hier nicht zusaetzlich die Karten-onClick ausloest. */}
        <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:8, marginTop:10 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            style={{
              padding:"6px 14px", borderRadius:10,
              background:`${T.teal}15`, border:`1px solid ${T.teal}30`,
              color:T.teal, fontSize:12, fontWeight:700, cursor:"pointer",
              whiteSpace:"nowrap", touchAction:"manipulation",
            }}
          >Öffnen</button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            aria-label="Aus Merkliste entfernen"
            style={{
              padding:"6px 10px", borderRadius:10, display:"flex",
              alignItems:"center", justifyContent:"center",
              background:"rgba(244,115,85,0.10)", border:"1px solid rgba(244,115,85,0.20)",
              color:T.coral, cursor:"pointer", touchAction:"manipulation",
            }}
          ><HUIBookmarkIcon size={19} active /></button>
        </div>
      </div>
    </div>
  );
}
