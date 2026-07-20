import { createPortal } from "react-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { useProfileLauncher } from "../home/profile/ProfileLauncher.jsx";

const T = {
  teal:"rgba(14,196,184,1)", white:"#FFFFFF", ink:"rgba(26,26,46,0.92)",
  bg:"#F2F4F8", border:"rgba(22,215,197,0.14)", cardShadow:"0 2px 12px rgba(0,0,0,0.07)",
  px:16, inkSoft:"rgba(26,26,46,0.55)", inkFaint:"rgba(26,26,46,0.35)",
  tealSoft:"rgba(14,196,184,0.12)", tealDeep:"rgba(0,150,136,1)"
};
const PAGE_SIZE = 20;
const FORMAT_LABEL = { original:"Original", druck:"Druck", digital:"Digital Art" };
const FORMAT_BADGE = { original:"#7C3AED", druck:"#0891B2", digital:"#D97706" };

function WerkCardItem({ w, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const price = w.price != null ? `${Number(w.price).toLocaleString("de-DE")} €` : null;
  const badge = FORMAT_LABEL[w.file_format] || w.category || "Werk";
  const badgeColor = FORMAT_BADGE[w.file_format] || T.teal;
  return (
    <div onClick={() => onPress?.(w)} style={{
      background:T.white, borderRadius:16, overflow:"hidden",
      boxShadow:T.cardShadow, border:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", cursor:"pointer",
    }}>
      <div style={{ width:"100%", height:130, background:T.tealSoft, position:"relative", overflow:"hidden" }}>
        {!imgErr && w.cover_url
          ? <img loading="lazy" decoding="async" src={w.cover_url} alt={w.title}
              onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>🎨</div>
        }
        <div style={{
          position:"absolute", top:8, left:8,
          background:badgeColor, color:"#fff", borderRadius:99,
          fontSize:9.5, fontWeight:700, padding:"2px 8px"
        }}>{badge}</div>
      </div>
      <div style={{ padding:"10px 10px 8px", display:"flex", flexDirection:"column", flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:2,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {w.title}
        </div>
        {w._authorName ? (
          <div
            onClick={e => { e.stopPropagation(); onAuthorPress?.(w.user_id); }}
            style={{ fontSize:11, color:T.tealDeep, fontWeight:600, marginBottom:4, cursor:"pointer",
              WebkitTapHighlightColor:"transparent" }}>
            von {w._authorName}
          </div>
        ) : (
          <div style={{ fontSize:11, color:T.inkFaint, marginBottom:4 }}>von HUI Talent</div>
        )}
        {w.location_text && (
          <div style={{ fontSize:10.5, color:T.inkSoft, display:"flex", alignItems:"center", gap:3, marginBottom:4 }}>
            <span>📍</span><span style={{ overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{w.location_text}</span>
          </div>
        )}
        {price && (
          <div style={{ marginTop:"auto", fontSize:13, fontWeight:700, color:T.tealDeep }}>{price}</div>
        )}
      </div>
    </div>
  );
}

export default function WerkeAllModal({ isOpen, onClose, onPressItem }) {
  useWizardBodyLock(isOpen);
  const { openCreatorProfile } = useProfileLauncher();
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [hasMore, setHasMore]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("alle");
  const [page, setPage]         = useState(0);
  const scrollRef                = useRef(null);
  const searchTimer              = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // Reset wenn Filter/Suche ändert
  useEffect(() => {
    if (!isOpen) return;
    setItems([]); setPage(0); setHasMore(true);
  }, [debouncedSearch, filter, isOpen]);

  // Laden
  const load = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      let q = supabase.from("works")
        .select("id,title,cover_url,category,file_format,price,location_text,user_id,created_at")
        .eq("status","published").eq("approval_status","approved").eq("visibility","public")
        .order("created_at",{ ascending:false })
        .range(pageNum * PAGE_SIZE, (pageNum+1) * PAGE_SIZE - 1);

      if (debouncedSearch) {
        q = q.or(`title.ilike.%${debouncedSearch}%,category.ilike.%${debouncedSearch}%`);
      }
      if (filter !== "alle") q = q.eq("file_format", filter);

      const { data } = await q;
      if (!data || data.length === 0) { setHasMore(false); return; }
      // Autorname nachladen
      const uids = [...new Set(data.map(w => w.user_id).filter(Boolean))];
      let nameMap = {};
      if (uids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles").select("id,display_name,username").in("id", uids);
        (profs || []).forEach(p => { nameMap[p.id] = p.display_name || p.username || null; });
      }
      const enriched = data.map(w => ({ ...w, _authorName: nameMap[w.user_id] || null }));
      setItems(prev => pageNum === 0 ? enriched : [...prev, ...enriched]);
      if (data.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter, loading]);

  useEffect(() => {
    if (!isOpen) return;
    load(0);
  }, [debouncedSearch, filter, isOpen]);

  // Infinite Scroll
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      const next = page + 1;
      setPage(next);
      load(next);
    }
  }, [loading, hasMore, page, load]);

  // Escape Key
  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const FILTERS = [
    { key:"alle", label:"Alle" },
    { key:"original", label:"Original" },
    { key:"druck", label:"Druck" },
    { key:"digital", label:"Digital Art" },
  ];

  return createPortal(
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:10500,
      background:"rgba(0,0,0,0.45)", display:"flex",
      alignItems:"flex-start", justifyContent:"center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        marginTop:"env(safe-area-inset-top,44px)",
        width:"100%",
        height:"calc(100dvh - env(safe-area-inset-top,44px))",
        background:T.bg, borderRadius:"20px 20px 0 0",
        display:"flex", flexDirection:"column", overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{ padding:"16px 16px 8px", background:T.white, borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:T.ink }}>Werke entdecken</div>
              <div style={{ fontSize:11.5, color:T.inkFaint }}>Kunst, Musik, Fotografie & mehr</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:T.inkSoft, padding:4 }}>✕</button>
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Werke suchen…"
            style={{ width:"100%", padding:"9px 14px", borderRadius:12, border:`1px solid ${T.border}`,
              background:"#f8fafc", fontSize:14, color:T.ink, outline:"none", boxSizing:"border-box" }}
          />
          <div style={{ display:"flex", gap:6, marginTop:8, overflowX:"auto", paddingBottom:4 }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding:"5px 12px", borderRadius:99, border:`1.5px solid ${filter===f.key ? T.teal : T.border}`,
                background: filter===f.key ? T.tealSoft : "transparent",
                color: filter===f.key ? T.tealDeep : T.inkSoft,
                fontSize:12, fontWeight:filter===f.key ? 700 : 400,
                whiteSpace:"nowrap", cursor:"pointer",
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        {/* Scroll */}
        <div ref={scrollRef} onScroll={onScroll}
          style={{ flex:1, overflowY:"auto", padding:"12px 12px 0" }}>
          {items.length === 0 && loading && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ borderRadius:16, height:200, background:"rgba(0,0,0,0.06)" }}/>
              ))}
            </div>
          )}
          {items.length === 0 && !loading && (
            <div style={{ textAlign:"center", padding:"40px 20px", color:T.inkFaint }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🎨</div>
              <div style={{ fontSize:15, fontWeight:600 }}>Keine Werke gefunden</div>
              <div style={{ fontSize:13, marginTop:6 }}>Versuche andere Suchbegriffe</div>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {items.map(w => <WerkCardItem key={w.id} w={w} onPress={onPressItem} onAuthorPress={w.user_id ? openCreatorProfile : null}/>)}
          </div>
          {loading && items.length > 0 && (
            <div style={{ textAlign:"center", padding:16, color:T.inkFaint, fontSize:13 }}>Lade weitere…</div>
          )}

          {/* Bottom-Spacer: Navbar + safe-area (iOS Safari ignoriert paddingBottom bei scroll) */}
          <div style={{ height:"calc(88px + env(safe-area-inset-bottom, 0px))", flexShrink:0 }}/>
        </div>
      </div>
    </div>,
    document.body
  );
}
