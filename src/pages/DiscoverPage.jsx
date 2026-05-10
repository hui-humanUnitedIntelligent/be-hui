// DiscoverPage.jsx — HUI Production Ready
// Echte Supabase-Daten: works, stories, profiles, media
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", coralPale:"#FFF2EE",
  gold:"#F5A623", goldPale:"#FFFBEB",
  cream:"#F9F6F2", warm:"#FFF9F4",
  card:"#FFFFFF", ink:"#1A1A1A",
  muted:"#888", muted2:"#BBB", border:"rgba(0,0,0,0.06)",
};

const CSS = `
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  .dp-scroll::-webkit-scrollbar{display:none}
  .dp-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .dp-tap{transition:transform .18s cubic-bezier(.34,1.4,.64,1);-webkit-tap-highlight-color:transparent}
  .dp-tap:active{transform:scale(.965)}
  .shimmer{background:linear-gradient(90deg,#f0ece6 25%,#faf8f5 50%,#f0ece6 75%);
    background-size:400px 100%;animation:shimmer 1.4s infinite}
`;

const CATS = ["Alle","Werke","Stories","Experiences","Handwerk","Coaching"];

// ── Supabase Storage URL helper ─────────────────────────────────────
function storageUrl(bucket, path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

// ── Skeleton Card ───────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ borderRadius:20, overflow:"hidden", background:C.card,
      boxShadow:"0 1px 8px rgba(0,0,0,0.05)" }}>
      <div className="shimmer" style={{ width:"100%", aspectRatio:"4/3" }}/>
      <div style={{ padding:"14px 16px" }}>
        <div className="shimmer" style={{ height:14, borderRadius:8,
          width:"70%", marginBottom:8 }}/>
        <div className="shimmer" style={{ height:11, borderRadius:8, width:"45%" }}/>
      </div>
    </div>
  );
}

// ── Story Circle ────────────────────────────────────────────────────
function StoryCircle({ story, onPress }) {
  const imgUrl = story.media?.storage_path
    ? storageUrl(story.media.storage_bucket || "stories", story.media.storage_path)
    : null;
  const name = story.profile?.display_name || story.profile?.full_name || "Anonym";

  return (
    <div onClick={() => onPress?.(story)}
      className="dp-tap"
      style={{ display:"flex", flexDirection:"column",
        alignItems:"center", gap:6, flexShrink:0, cursor:"pointer" }}>
      <div style={{ width:66, height:66, borderRadius:"50%", padding:2.5,
        background:`linear-gradient(135deg,${C.teal},${C.coral})` }}>
        <div style={{ width:"100%", height:"100%", borderRadius:"50%",
          overflow:"hidden", border:"2.5px solid white", background:C.cream }}>
          {imgUrl
            ? <img src={imgUrl} alt="" style={{ width:"100%", height:"100%",
                objectFit:"cover" }}/>
            : <div style={{ width:"100%", height:"100%", display:"flex",
                alignItems:"center", justifyContent:"center", fontSize:22 }}>📸</div>
          }
        </div>
      </div>
      <span style={{ fontSize:10.5, fontWeight:700, color:C.ink,
        maxWidth:68, textAlign:"center", overflow:"hidden",
        textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {name.split(" ")[0]}
      </span>
    </div>
  );
}

// ── Work Card ───────────────────────────────────────────────────────
function WorkCard({ work, idx, onPress }) {
  const imgUrl = work.images?.[0]
    ? storageUrl("works", work.images[0])
    : work.cover_url || null;

  const creatorName = work.profile?.display_name
    || work.profile?.full_name || "Unbekannt";

  const avatarUrl = work.profile?.avatar_url
    ? storageUrl("avatars", work.profile.avatar_url)
    : null;

  return (
    <div className="dp-tap"
      onClick={() => onPress?.(work)}
      style={{ borderRadius:20, overflow:"hidden", background:C.card,
        boxShadow:"0 2px 12px rgba(0,0,0,0.07)", cursor:"pointer",
        animation:`fadeUp 0.4s ${idx * 0.07}s both` }}>
      {/* Image */}
      <div style={{ position:"relative", aspectRatio:"4/3", background:C.cream }}>
        {imgUrl
          ? <img src={imgUrl} alt={work.title}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
          : <div style={{ width:"100%", height:"100%", display:"flex",
              alignItems:"center", justifyContent:"center",
              fontSize:36, color:C.muted2 }}>🎨</div>
        }
        {/* Category badge */}
        {work.category && (
          <div style={{ position:"absolute", top:10, left:10,
            background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)",
            borderRadius:20, padding:"4px 10px" }}>
            <span style={{ fontSize:10, fontWeight:800,
              color:"white", letterSpacing:0.5 }}>
              {work.category.toUpperCase()}
            </span>
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding:"13px 15px 15px" }}>
        <div style={{ fontWeight:800, fontSize:14, color:C.ink,
          lineHeight:1.3, marginBottom:6 }}>
          {work.title}
        </div>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:22, height:22, borderRadius:"50%",
              overflow:"hidden", background:C.cream, flexShrink:0 }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width:"100%",
                    height:"100%", objectFit:"cover" }}/>
                : <div style={{ width:"100%", height:"100%", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    fontSize:10, background:`${C.teal}20` }}>
                    {creatorName[0]}
                  </div>
              }
            </div>
            <span style={{ fontSize:11, color:C.muted,
              fontWeight:600 }}>{creatorName}</span>
          </div>
          {work.price != null && (
            <span style={{ fontSize:13, fontWeight:900, color:C.teal }}>
              € {Number(work.price).toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Big Highlight Card (erste Karte groß) ───────────────────────────
function HeroCard({ item, onPress }) {
  if (!item) return null;
  const imgUrl = item.images?.[0]
    ? storageUrl("works", item.images[0])
    : item.cover_url || null;

  const creatorName = item.profile?.display_name
    || item.profile?.full_name || "Unbekannt";

  return (
    <div className="dp-tap" onClick={() => onPress?.(item)}
      style={{ borderRadius:24, overflow:"hidden", cursor:"pointer",
        position:"relative", height:260,
        boxShadow:"0 4px 20px rgba(0,0,0,0.12)",
        animation:"fadeUp 0.4s both" }}>
      {imgUrl
        ? <img src={imgUrl} alt={item.title}
            style={{ position:"absolute", inset:0, width:"100%",
              height:"100%", objectFit:"cover" }}/>
        : <div style={{ position:"absolute", inset:0,
            background:`linear-gradient(135deg,${C.teal},${C.coral})` }}/>
      }
      <div style={{ position:"absolute", inset:0,
        background:"linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.72) 100%)" }}/>
      <div style={{ position:"absolute", bottom:22, left:22, right:22 }}>
        {item.category && (
          <div style={{ display:"inline-block", background:`${C.teal}CC`,
            borderRadius:20, padding:"3px 10px", marginBottom:8 }}>
            <span style={{ fontSize:10, fontWeight:800, color:"white",
              letterSpacing:0.8 }}>{item.category.toUpperCase()}</span>
          </div>
        )}
        <div style={{ fontWeight:900, fontSize:20, color:"white",
          letterSpacing:-0.4, lineHeight:1.2 }}>{item.title}</div>
        <div style={{ display:"flex", alignItems:"center",
          justifyContent:"space-between", marginTop:8 }}>
          <span style={{ fontSize:13, color:"rgba(255,255,255,0.75)",
            fontWeight:600 }}>{creatorName}</span>
          {item.price != null && (
            <span style={{ fontSize:16, fontWeight:900, color:C.teal }}>
              € {Number(item.price).toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <div style={{ textAlign:"center", padding:"80px 40px",
      animation:"fadeUp 0.4s both" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🌿</div>
      <div style={{ fontWeight:800, fontSize:16, color:C.ink,
        marginBottom:8 }}>Noch keine Inhalte</div>
      <div style={{ fontSize:14, color:C.muted, lineHeight:1.6 }}>
        {message || "Sei der erste der etwas veröffentlicht."}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────
export default function DiscoverPage({ onMap, refreshSignal }) {
  const [cat, setCat] = useState("Alle");
  const [works, setWorks] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load echte Daten aus Supabase
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel: works + stories
      const [worksRes, storiesRes] = await Promise.all([
        supabase
          .from("works")
          .select(`
            id, title, category, price, cover_url, images,
            description, status, created_at,
            profile:user_id (
              display_name, full_name, avatar_url
            )
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(30),

        supabase
          .from("stories")
          .select(`
            id, caption, expires_at, is_highlight, created_at,
            media:media_id (
              storage_path, storage_bucket, type, thumbnail_path
            ),
            profile:user_id (
              display_name, full_name, avatar_url
            )
          `)
          .or(`expires_at.gt.${new Date().toISOString()},is_highlight.eq.true`)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (worksRes.error) throw worksRes.error;
      if (storiesRes.error) throw storiesRes.error;

      setWorks(worksRes.data || []);
      setStories(storiesRes.data || []);
    } catch (e) {
      console.error("Feed load error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadData(); }, [loadData]);

  // Refresh wenn Story hochgeladen (refreshSignal von außen)
  useEffect(() => {
    if (refreshSignal) loadData();
  }, [refreshSignal, loadData]);

  // Filter
  const filteredWorks = cat === "Alle" || cat === "Werke"
    ? works
    : works.filter(w =>
        w.category?.toLowerCase() === cat.toLowerCase()
      );

  const showStories = cat === "Alle" || cat === "Stories";

  return (
    <>
      <style>{CSS}</style>
      <div className="dp-scroll"
        style={{ background:C.cream, paddingBottom:110,
          overflowY:"auto", height:"100dvh" }}>

        {/* ── HEADER ── */}
        <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 20px 0" }}>
          <div style={{ display:"flex", alignItems:"flex-start",
            justifyContent:"space-between", marginBottom:6 }}>
            <div>
              <div style={{ fontWeight:900, fontSize:24, color:C.ink,
                letterSpacing:-0.6, lineHeight:1.1 }}>Entdecken</div>
              <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
                Echte Menschen. Echte Werke.
              </div>
            </div>
            <button onClick={onMap} className="dp-tap"
              style={{ width:44, height:44, borderRadius:16,
                background:`linear-gradient(135deg,${C.teal}22,${C.coral}14)`,
                border:`1.5px solid ${C.teal}44`,
                cursor:"pointer", fontSize:20,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
              🗺
            </button>
          </div>

          {/* Category chips */}
          <div className="dp-scroll"
            style={{ display:"flex", gap:8, overflowX:"auto",
              paddingBottom:4, margin:"16px 0 20px" }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} className="dp-tap"
                style={{ padding:"8px 18px", whiteSpace:"nowrap",
                  background: cat===c
                    ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                    : C.card,
                  border:`1.5px solid ${cat===c ? "transparent" : C.border}`,
                  borderRadius:999, fontSize:12,
                  fontWeight: cat===c ? 800 : 500,
                  color: cat===c ? "white" : C.muted,
                  cursor:"pointer", fontFamily:"inherit",
                  boxShadow: cat===c ? `0 2px 10px ${C.tealGlow}` : "none",
                  transition:"all 0.2s" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div style={{ margin:"0 20px 20px",
            padding:"14px 18px", borderRadius:16,
            background:"#FFF2EE", border:`1px solid ${C.coral}30` }}>
            <span style={{ fontSize:13, color:C.coral, fontWeight:700 }}>
              ⚠ {error}
            </span>
            <button onClick={loadData}
              style={{ marginLeft:12, fontSize:12, color:C.teal,
                fontWeight:700, background:"none", border:"none",
                cursor:"pointer" }}>
              Nochmals versuchen
            </button>
          </div>
        )}

        {/* ── LOADING ── */}
        {loading && (
          <div style={{ padding:"0 20px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
              gap:14, marginBottom:20 }}>
              {[0,1,2,3].map(i => <SkeletonCard key={i}/>)}
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        {!loading && !error && (
          <>
            {/* Story Bar */}
            {showStories && stories.length > 0 && (
              <div style={{ marginBottom:24 }}>
                <div style={{ padding:"0 20px", marginBottom:12 }}>
                  <span style={{ fontSize:11, fontWeight:800,
                    color:C.teal, letterSpacing:1.5,
                    textTransform:"uppercase" }}>Stories</span>
                </div>
                <div className="dp-scroll"
                  style={{ display:"flex", gap:14, overflowX:"auto",
                    padding:"0 20px", scrollSnapType:"x mandatory" }}>
                  {stories.map(s => (
                    <StoryCircle key={s.id} story={s} />
                  ))}
                </div>
              </div>
            )}

            {/* Hero card — erstes Werk groß */}
            {(cat === "Alle" || cat === "Werke") && filteredWorks.length > 0 && (
              <div style={{ padding:"0 20px 20px" }}>
                <div style={{ fontSize:11, fontWeight:800, color:C.teal,
                  letterSpacing:1.5, textTransform:"uppercase",
                  marginBottom:12 }}>Neu & Beliebt</div>
                <HeroCard item={filteredWorks[0]} />
              </div>
            )}

            {/* Grid — restliche Werke */}
            {filteredWorks.length > 0 && (
              <div style={{ padding:"0 20px" }}>
                {filteredWorks.length > 1 && (
                  <div style={{ fontSize:11, fontWeight:800, color:C.muted,
                    letterSpacing:1.2, textTransform:"uppercase",
                    marginBottom:12 }}>Alle Werke</div>
                )}
                <div style={{ display:"grid",
                  gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  {filteredWorks.slice(1).map((w, i) => (
                    <WorkCard key={w.id} work={w} idx={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty */}
            {filteredWorks.length === 0 && stories.length === 0 && (
              <EmptyState message="Sei der erste der etwas veröffentlicht." />
            )}
            {filteredWorks.length === 0 && cat !== "Alle" && cat !== "Stories" && (
              <EmptyState message={`Noch keine ${cat} vorhanden.`} />
            )}
          </>
        )}
      </div>
    </>
  );
}
