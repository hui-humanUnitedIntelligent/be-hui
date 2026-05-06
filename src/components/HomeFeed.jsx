import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import mockWirkerProfiles from "../lib/mockData";

const C = {
  coral:  "#FF6B5B",
  teal:   "#2ABFAC",
  gold:   "#F5A623",
  purple: "#A78BFA",
  ink:    "#1A1A2E",
  muted:  "#6B7280",
  surface:"#F8F7F5",
  card:   "#FFFFFF",
};

// ── Mock Feed Items ───────────────────────────────────────────
const MOCK_FEED = [
  { id:"f1", type:"wirker", wirker: Object.values(mockWirkerProfiles)[2] },
  { id:"f2", type:"werk",
    title:"Handgedrehte Vase", price:"65 €", img:"https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&q=80",
    creator:"Sofia M.", creatorImg:"https://images.unsplash.com/photo-1494790108755-2616b612b786?w=60&q=80",
    likes:112, saved:false, tags:["Keramik","Unikat","Handgemacht"] },
  { id:"f3", type:"video",
    src:"https://www.w3schools.com/html/mov_bbb.mp4",
    thumb:"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600&q=80",
    creator:"Marcus B.", creatorImg:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80",
    caption:"Behind the scenes — Imagefilm-Dreh in Berlin 📸", likes:234 },
  { id:"f4", type:"wirker", wirker: Object.values(mockWirkerProfiles)[3] },
  { id:"f5", type:"werk",
    title:"Leder-Rucksack", price:"195 €", img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80",
    creator:"Tom H.", creatorImg:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&q=80",
    likes:203, saved:false, tags:["Handwerk","Leder","Maßanfertigung"] },
  { id:"f6", type:"foto",
    img:"https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80",
    creator:"Maria L.", creatorImg:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&q=80",
    caption:"Morgen-Yoga am See 🌅 — Die Stille gehört uns.", likes:87 },
  { id:"f7", type:"wirker", wirker: Object.values(mockWirkerProfiles)[0] },
];

// ── Komponenten ───────────────────────────────────────────────

function AvatarCircle({ src, name, size=40 }) {
  const initials = (name||"").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", overflow:"hidden", flexShrink:0,
      background:`linear-gradient(135deg, ${C.coral}80, ${C.teal}80)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.35, fontWeight:800, color:"white" }}>
      {src
        ? <img src={src} alt={name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>e.target.style.display="none"} />
        : initials }
    </div>
  );
}

function HeartButton({ liked, onToggle, count }) {
  const [anim, setAnim] = useState(false);
  function handle() {
    setAnim(true);
    setTimeout(()=>setAnim(false), 400);
    onToggle();
  }
  return (
    <button onClick={handle} style={{ background:"none", border:"none", cursor:"pointer",
      display:"flex", alignItems:"center", gap:4, padding:0 }}>
      <span style={{ fontSize:20, transition:"transform 0.2s",
        transform: anim ? "scale(1.4)" : "scale(1)",
        filter: liked ? "none" : "grayscale(1) opacity(0.5)" }}>
        {liked ? "❤️" : "🤍"}
      </span>
      {count != null && <span style={{ fontSize:12, fontWeight:600, color: liked ? C.coral : C.muted }}>{count}</span>}
    </button>
  );
}

// Wirker-Karte im Feed
function WirkerCard({ wirker, onView, onBook }) {
  const [liked, setLiked] = useState(false);
  const typeColor = wirker.talentType === "beides" ? C.purple : wirker.talentType === "werke" ? C.gold : C.teal;
  const typeLabel = wirker.talentType === "werke" ? "🎨 Werke" : wirker.talentType === "beides" ? "🤝🎨 Beides" : "🤝 Wirker";

  return (
    <div className="hui-card hui-fade-in" style={{ margin:"0 16px 16px", overflow:"hidden" }}
      onClick={()=>onView(wirker.name)}>
      {/* Header Bild */}
      <div style={{ height:160, overflow:"hidden", position:"relative",
        background:`linear-gradient(135deg, ${typeColor}30, ${C.coral}15)` }}>
        {wirker.header && <img src={wirker.header} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom, transparent 40%, rgba(26,26,46,0.7))" }} />
        {/* Typ-Badge */}
        <div style={{ position:"absolute", top:12, right:12,
          background:"rgba(0,0,0,0.45)", backdropFilter:"blur(8px)",
          borderRadius:20, padding:"4px 10px", fontSize:11, fontWeight:700, color:"white" }}>
          {typeLabel}
        </div>
        {/* Avatar über Kante */}
        <div style={{ position:"absolute", bottom:-28, left:16 }}>
          <div style={{ width:56, height:56, borderRadius:"50%", border:"3px solid white",
            overflow:"hidden", boxShadow:`0 2px 12px rgba(0,0,0,0.2)` }}>
            <img src={wirker.img} alt={wirker.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}
              onError={e=>{ e.target.style.display="none"; }} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"36px 16px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div>
            <div style={{ fontWeight:900, fontSize:16, color:C.ink, marginBottom:2 }}>{wirker.fullName||wirker.name}</div>
            <div style={{ fontSize:12, fontWeight:700, color:typeColor }}>{wirker.talent}</div>
            {wirker.location && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>📍 {wirker.location}</div>}
          </div>
          <HeartButton liked={liked} onToggle={()=>setLiked(!liked)} />
        </div>

        {wirker.bio && (
          <div style={{ fontSize:13, color:"#555", lineHeight:1.6, marginBottom:12,
            display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {wirker.bio}
          </div>
        )}

        {/* Stats */}
        <div style={{ display:"flex", gap:14, marginBottom:14 }}>
          {[[wirker.recommendations,"⭐ Empf."],[wirker.followers,"👥 Follower"],[`${wirker.impactEur||0} €`,"🌱 Impact"]].map(([v,l])=>(
            <div key={l} style={{ fontSize:11, color:C.muted }}>
              <span style={{ fontWeight:800, color:C.ink, fontSize:13, marginRight:2 }}>{v}</span>{l}
            </div>
          ))}
        </div>

        {/* Skills */}
        {wirker.skills?.length > 0 && (
          <div style={{ display:"flex", gap:6, flexWrap:"nowrap", overflow:"hidden", marginBottom:14 }}>
            {wirker.skills.slice(0,4).map((s,i)=>(
              <span key={i} style={{ background:`${typeColor}12`, color:typeColor,
                borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600, whiteSpace:"nowrap" }}>{s}</span>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div style={{ display:"flex", gap:8 }}>
          {(wirker.talentType === "wirker" || !wirker.talentType || wirker.talentType === "beides") && (
            <button className="hui-btn-primary" onClick={e=>{e.stopPropagation();onBook(wirker);}}
              style={{ flex:2, padding:"12px 8px", fontSize:13 }}>
              📅 Buchen {wirker.pricePerHour ? `· ab ${wirker.pricePerHour} €` : ""}
            </button>
          )}
          <button onClick={e=>{e.stopPropagation();onView(wirker.name);}}
            style={{ flex:1, background:`${typeColor}12`, color:typeColor, border:`1.5px solid ${typeColor}30`,
              borderRadius:16, padding:"12px 8px", fontSize:13, fontWeight:700, cursor:"pointer" }}>
            Profil →
          </button>
        </div>
      </div>
    </div>
  );
}

// Werk-Karte
function WerkCard({ item, onAddToCart }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes||0);
  const [added, setAdded] = useState(false);

  function handleLike() {
    setLiked(p=>!p);
    setLikes(p=>liked ? p-1 : p+1);
  }

  function handleCart(e) {
    e.stopPropagation();
    setAdded(true);
    setTimeout(()=>setAdded(false), 2000);
    if(onAddToCart) onAddToCart(item);
  }

  return (
    <div className="hui-card hui-fade-in" style={{ margin:"0 16px 16px", overflow:"hidden" }}>
      {/* Bild */}
      <div style={{ height:260, overflow:"hidden", position:"relative" }}>
        <img src={item.img} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover",
          transition:"transform 0.3s" }} />
        {/* Werk-Label */}
        <div style={{ position:"absolute", top:12, left:12,
          background:`${C.gold}EE`, borderRadius:20, padding:"4px 12px",
          fontSize:11, fontWeight:800, color:"#92400E" }}>
          🎨 Werk
        </div>
        {/* Preis */}
        <div style={{ position:"absolute", bottom:12, right:12,
          background:"rgba(26,26,46,0.85)", backdropFilter:"blur(8px)",
          borderRadius:12, padding:"6px 14px", fontSize:16, fontWeight:900, color:"white" }}>
          {item.price}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"14px 16px" }}>
        {/* Creator */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <AvatarCircle src={item.creatorImg} name={item.creator} size={32} />
          <span style={{ fontSize:13, fontWeight:700, color:C.ink }}>{item.creator}</span>
        </div>

        <div style={{ fontWeight:800, fontSize:17, color:C.ink, marginBottom:6 }}>{item.title}</div>

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            {item.tags.map((t,i)=>(
              <span key={i} style={{ background:`${C.gold}15`, color:"#92400E",
                borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:600 }}>{t}</span>
            ))}
          </div>
        )}

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <HeartButton liked={liked} onToggle={handleLike} count={likes} />
          <button onClick={handleCart} className="hui-btn-primary"
            style={{ padding:"10px 18px", fontSize:13,
              background: added ? `linear-gradient(135deg, ${C.teal}, #10B981)` : undefined }}>
            {added ? "✓ Im Warenkorb" : "🛒 In den Warenkorb"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Foto-Karte
function FotoCard({ item }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes||0);
  return (
    <div className="hui-card hui-fade-in" style={{ margin:"0 16px 16px", overflow:"hidden" }}>
      <div style={{ position:"relative" }}>
        <img src={item.img} alt="" style={{ width:"100%", display:"block",
          maxHeight:400, objectFit:"cover" }} />
        <div className="hui-video-overlay" style={{ position:"absolute", inset:0 }} />
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <AvatarCircle src={item.creatorImg} name={item.creator} size={30} />
            <span style={{ fontSize:13, fontWeight:700, color:"white" }}>{item.creator}</span>
          </div>
          {item.caption && (
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.9)", lineHeight:1.5 }}>{item.caption}</div>
          )}
        </div>
      </div>
      <div style={{ padding:"10px 16px", display:"flex", alignItems:"center", gap:16 }}>
        <HeartButton liked={liked} onToggle={()=>{setLiked(p=>!p);setLikes(p=>liked?p-1:p+1);}} count={likes} />
        <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>💬</button>
        <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted, marginLeft:"auto" }}>↗️</button>
      </div>
    </div>
  );
}

// Video-Karte
function VideoCard({ item }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(item.likes||0);
  const [muted, setMuted] = useState(true);

  function togglePlay() {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play().catch(()=>{}); setPlaying(true); }
  }

  return (
    <div className="hui-card hui-fade-in" style={{ margin:"0 16px 16px", overflow:"hidden" }}>
      <div style={{ position:"relative", background:"#000", minHeight:280 }} onClick={togglePlay}>
        {item.thumb && !playing && (
          <img src={item.thumb} alt="" style={{ width:"100%", height:340, objectFit:"cover", display:"block" }} />
        )}
        <video ref={videoRef} src={item.src} muted={muted} playsInline loop
          style={{ width:"100%", height:playing ? "auto" : 0, display:"block", maxHeight:400 }} />
        {/* Overlay */}
        <div className="hui-video-overlay" style={{ position:"absolute", inset:0 }} />
        {/* Play-Button */}
        {!playing && (
          <div style={{ position:"absolute", top:"50%", left:"50%",
            transform:"translate(-50%,-50%)",
            width:56, height:56, borderRadius:"50%",
            background:"rgba(255,255,255,0.9)", backdropFilter:"blur(8px)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22 }}>▶️</div>
        )}
        {/* Video-Badge */}
        <div style={{ position:"absolute", top:12, left:12,
          background:`${C.coral}EE`, borderRadius:20, padding:"4px 12px",
          fontSize:11, fontWeight:800, color:"white" }}>🎬 Video</div>
        {/* Mute-Button */}
        <button onClick={e=>{e.stopPropagation();setMuted(p=>!p);}}
          style={{ position:"absolute", top:12, right:12,
            background:"rgba(0,0,0,0.45)", backdropFilter:"blur(6px)",
            border:"none", borderRadius:"50%", width:32, height:32,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, cursor:"pointer" }}>
          {muted ? "🔇" : "🔊"}
        </button>
        {/* Creator + Caption */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <AvatarCircle src={item.creatorImg} name={item.creator} size={30} />
            <span style={{ fontSize:13, fontWeight:700, color:"white" }}>{item.creator}</span>
          </div>
          {item.caption && (
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.9)", lineHeight:1.5 }}>{item.caption}</div>
          )}
        </div>
      </div>
      <div style={{ padding:"10px 16px", display:"flex", alignItems:"center", gap:16 }}>
        <HeartButton liked={liked} onToggle={()=>{setLiked(p=>!p);setLikes(p=>liked?p-1:p+1);}} count={likes} />
        <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted }}>💬</button>
        <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:C.muted, marginLeft:"auto" }}>↗️</button>
      </div>
    </div>
  );
}

// Stories-Leiste
function StoriesBar({ onViewWirker }) {
  const wirkers = Object.values(mockWirkerProfiles).slice(0, 8);
  return (
    <div style={{ padding:"16px 0 8px" }}>
      <div className="scrollbar-hide" style={{ display:"flex", gap:12, overflowX:"auto", padding:"0 16px" }}>
        {wirkers.map((w, i) => (
          <div key={i} onClick={()=>onViewWirker(w.name)}
            style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer", flexShrink:0 }}>
            {/* Ring */}
            <div style={{ padding:2, borderRadius:"50%",
              background: i < 3 ? `linear-gradient(135deg, ${C.coral}, ${C.teal})` : `${C.border}`,
              boxShadow: i < 3 ? `0 0 0 1px white inset` : "none" }}>
              <div style={{ padding:2, borderRadius:"50%", background:"white" }}>
                <AvatarCircle src={w.img} name={w.name} size={48} />
              </div>
            </div>
            <span style={{ fontSize:10, fontWeight:600, color:C.ink, maxWidth:52,
              textAlign:"center", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {w.name.split(" ")[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Werbebanner für neue Talente
function DiscoverBanner({ onExplore }) {
  return (
    <div onClick={onExplore} style={{ margin:"0 16px 16px", borderRadius:20, overflow:"hidden",
      background:`linear-gradient(135deg, ${C.coral}15, ${C.teal}10)`,
      border:`1.5px solid ${C.teal}25`, cursor:"pointer", padding:"20px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ fontSize:40 }}>🌟</div>
        <div>
          <div style={{ fontWeight:900, fontSize:16, color:C.ink, marginBottom:3 }}>Entdecke neue Talente</div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>
            Über 1.200 Wirker in deiner Nähe —<br/>jede Buchung fördert echte Projekte.
          </div>
        </div>
        <div style={{ marginLeft:"auto", fontSize:20 }}>→</div>
      </div>
    </div>
  );
}

// ── Haupt-HomeFeed Komponente ────────────────────────────────
export default function HomeFeed({ onViewWirker, onBook, onAddToCart, currentUser }) {
  const [feed, setFeed] = useState(MOCK_FEED);
  const [loading, setLoading] = useState(true);
  const [dbLoaded, setDbLoaded] = useState(false);

  useEffect(() => {
    async function loadFeed() {
      try {
        // Echte Wirker aus DB
        const { data: wirkerData } = await supabase
          .from("profiles")
          .select("*, works(*), experiences(*)")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(20);

        // Echte Posts (Beiträge)
        const { data: postsData } = await supabase
          .from("posts")
          .select("*, profiles(full_name, profile_image_url)")
          .order("created_at", { ascending: false })
          .limit(15);

        const liveFeed = [];

        if (postsData?.length) {
          postsData.forEach(p => {
            const isVideo = p.type === "video";
            liveFeed.push({
              id: "p_" + p.id,
              type: isVideo ? "video" : "foto",
              src: isVideo ? p.media_urls?.[0] : undefined,
              img: isVideo ? undefined : p.media_urls?.[0],
              thumb: p.media_urls?.[0],
              creator: p.profiles?.full_name || "HUI Wirker",
              creatorImg: p.profiles?.profile_image_url,
              caption: p.caption || "",
              likes: 0,
            });
          });
        }

        if (wirkerData?.length) {
          wirkerData.forEach(w => {
            liveFeed.push({
              id: "w_" + w.id,
              type: "wirker",
              wirker: {
                name: w.id,
                fullName: w.name,
                talent: w.talent || "",
                location: w.location || "",
                bio: w.bio || "",
                img: w.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(w.name)}&background=2ABFAC&color=fff`,
                header: w.header_image_url,
                skills: w.skills || [],
                recommendations: w.recommendations_count || 0,
                followers: w.followers_count || 0,
                impactEur: 0,
                pricePerHour: w.experiences?.[0]?.price || 0,
                talentType: w.user_type?.toLowerCase() || "talent",
              }
            });
          });
        }

        if (liveFeed.length > 0) {
          // Live-Daten zuerst, dann Mock-Fallback
          const combined = [...liveFeed, ...MOCK_FEED.slice(0, 4)];
          setFeed(combined);
          setDbLoaded(true);
        }
      } catch(e) {
        console.log("Feed DB load:", e.message);
      }
      setLoading(false);
    }
    loadFeed();
  }, []);

  const renderItem = useCallback((item, index) => {
    if (item.type === "wirker") return <WirkerCard key={item.id||index} wirker={item.wirker} onView={onViewWirker} onBook={onBook} />;
    if (item.type === "werk")   return <WerkCard   key={item.id||index} item={item} onAddToCart={onAddToCart} />;
    if (item.type === "video")  return <VideoCard  key={item.id||index} item={item} />;
    if (item.type === "foto")   return <FotoCard   key={item.id||index} item={item} />;
    return null;
  }, [onViewWirker, onBook, onAddToCart]);

  return (
    <div style={{ paddingBottom: 90 }}>
      {/* Stories */}
      <StoriesBar onViewWirker={onViewWirker} />

      {/* Divider */}
      <div style={{ height:1, background:C.border, margin:"4px 16px 12px" }} />

      {/* Loading Shimmer */}
      {loading && (
        <div style={{ padding:"0 16px" }}>
          {[1,2,3].map(i => (
            <div key={i} className="hui-shimmer" style={{ height:320, borderRadius:20, marginBottom:16 }} />
          ))}
        </div>
      )}

      {/* Feed */}
      {!loading && (
        <>
          {feed.slice(0,2).map((item,i) => renderItem(item, i))}
          <DiscoverBanner onExplore={()=>onViewWirker && onViewWirker(null)} />
          {feed.slice(2).map((item,i) => renderItem(item, i+2))}
        </>
      )}

      {/* Ende */}
      {!loading && (
        <div style={{ textAlign:"center", padding:"24px 16px 8px" }}>
          <div style={{ fontSize:24, marginBottom:6 }}>🌱</div>
          <div style={{ fontSize:13, color:C.muted }}>Du hast alles gesehen!</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Jeden Tag neue Talente & Werke.</div>
        </div>
      )}
    </div>
  );
}
