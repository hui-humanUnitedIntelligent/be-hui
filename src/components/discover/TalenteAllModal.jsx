import { createPortal } from "react-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { useProfileLauncher } from '../home/profile/ProfileLauncher.jsx';

const T = {
  teal:"rgba(14,196,184,1)", white:"#FFFFFF", ink:"rgba(26,26,46,0.92)",
  bg:"#F2F4F8", border:"rgba(22,215,197,0.14)", cardShadow:"0 2px 12px rgba(0,0,0,0.07)",
  px:16, inkSoft:"rgba(26,26,46,0.55)", inkFaint:"rgba(26,26,46,0.35)",
  tealSoft:"rgba(14,196,184,0.12)", tealDeep:"rgba(0,150,136,1)"
};
const PAGE_SIZE = 20;
const LOC_LABELS = { vor_ort:"Vor Ort", online:"Online", beides:"Vor Ort & Online" };

function TalentCardItem({ t, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const { openCreatorProfile } = useProfileLauncher();
  const cover = Array.isArray(t.images) && t.images[0]?.url ? t.images[0].url : null;
  const price = t.price_per_session != null
    ? `${Number(t.price_per_session).toLocaleString("de-DE")} €/Sitzung`
    : t.price_per_hour != null
    ? `${Number(t.price_per_hour).toLocaleString("de-DE")} €/Std`
    : null;
  const locLabel = LOC_LABELS[t.location_type] || t.location_type || "";
  return (
    <div onClick={() => onPress?.(t)} style={{
      background:T.white, borderRadius:16, overflow:"hidden",
      boxShadow:T.cardShadow, border:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", cursor:"pointer",
    }}>
      <div style={{ width:"100%", height:130, background:T.tealSoft, position:"relative", overflow:"hidden" }}>
        {!imgErr && cover
          ? <img loading="lazy" decoding="async" src={cover} alt={t.title}
              onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>⭐</div>
        }
        {t.category && (
          <div style={{
            position:"absolute", top:8, left:8,
            background:T.teal, color:"#fff", borderRadius:99,
            fontSize:9.5, fontWeight:700, padding:"2px 8px"
          }}>{t.category}</div>
        )}
      </div>
      <div style={{ padding:"10px 10px 8px", display:"flex", flexDirection:"column", flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:2,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {t.title}
        </div>
        {t._author && t.user_id && (
          <button
            onClick={(e) => { e.stopPropagation(); openCreatorProfile(t.user_id); }}
            style={{ fontSize:11, color:T.inkFaint, marginBottom:4, background:"none", border:"none",
              padding:0, cursor:"pointer", textAlign:"left", WebkitTapHighlightColor:"transparent" }}
          >{t._author}</button>
        )}
        {t._author && !t.user_id && <div style={{ fontSize:11, color:T.inkFaint, marginBottom:4 }}>{t._author}</div>}
        {locLabel && (
          <div style={{ fontSize:10.5, color:T.inkSoft, marginBottom:4 }}>📍 {locLabel}</div>
        )}
        {price && (
          <div style={{ marginTop:"auto", fontSize:13, fontWeight:700, color:T.tealDeep }}>{price}</div>
        )}
      </div>
    </div>
  );
}

export default function TalenteAllModal({ isOpen, onClose, onPressTalent }) {
  useWizardBodyLock(isOpen);
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [hasMore, setHasMore]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterLoc, setFilterLoc] = useState("alle");
  const [page, setPage]         = useState(0);
  const scrollRef               = useRef(null);
  const searchTimer             = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;
    setItems([]); setPage(0); setHasMore(true);
  }, [debouncedSearch, filterLoc, isOpen]);

  const load = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      let q = supabase.from("talents")
        .select("id,title,description,category,images,price_per_hour,price_per_session,currency,location_type,location_address,user_id,created_at")
        .eq("status","approved")
        .order("created_at",{ ascending:false })
        .range(pageNum * PAGE_SIZE, (pageNum+1) * PAGE_SIZE - 1);

      if (debouncedSearch) {
        q = q.or(`title.ilike.%${debouncedSearch}%,category.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%`);
      }
      if (filterLoc !== "alle") q = q.eq("location_type", filterLoc);

      const { data } = await q;
      if (!data || data.length === 0) { setHasMore(false); return; }

      // Provider-Namen batch laden
      const ids = [...new Set(data.map(t => t.user_id).filter(Boolean))];
      let pMap = {};
      if (ids.length > 0) {
        const { data: provs } = await supabase.from("profiles")
          .select("id,display_name,username").in("id", ids);
        pMap = Object.fromEntries((provs||[]).map(p => [p.id, p.display_name || p.username || "HUI Talent"]));
      }

      const enriched = data.map(t => ({ ...t, _author: pMap[t.user_id] || "HUI Talent" }));
      setItems(prev => pageNum === 0 ? enriched : [...prev, ...enriched]);
      if (data.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterLoc, loading]);

  useEffect(() => {
    if (!isOpen) return;
    load(0);
  }, [debouncedSearch, filterLoc, isOpen]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      const next = page + 1; setPage(next); load(next);
    }
  }, [loading, hasMore, page, load]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const LOC_FILTERS = [
    { key:"alle", label:"Alle" },
    { key:"vor_ort", label:"Vor Ort" },
    { key:"online", label:"Online" },
    { key:"beides", label:"Vor Ort & Online" },
  ];

  return createPortal(
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:10500, background:"rgba(0,0,0,0.45)",
      display:"flex", alignItems:"flex-start", justifyContent:"center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        marginTop:"env(safe-area-inset-top,44px)", maxWidth:480, width:"100%",
        height:"calc(100dvh - env(safe-area-inset-top,44px))",
        background:T.bg, borderRadius:"20px 20px 0 0",
        display:"flex", flexDirection:"column", overflow:"hidden",
      }}>
        <div style={{ padding:"16px 16px 8px", background:T.white, borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:T.ink }}>Talente entdecken</div>
              <div style={{ fontSize:11.5, color:T.inkFaint }}>Dienstleistungen & Angebote von HUI Talenten</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:T.inkSoft, padding:4 }}>✕</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Talente suchen…"
            style={{ width:"100%", padding:"9px 14px", borderRadius:12, border:`1px solid ${T.border}`,
              background:"#f8fafc", fontSize:14, color:T.ink, outline:"none", boxSizing:"border-box" }}/>
          <div style={{ display:"flex", gap:6, marginTop:8, overflowX:"auto", paddingBottom:4 }}>
            {LOC_FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilterLoc(f.key)} style={{
                padding:"5px 12px", borderRadius:99, border:`1.5px solid ${filterLoc===f.key ? T.teal : T.border}`,
                background: filterLoc===f.key ? T.tealSoft : "transparent",
                color: filterLoc===f.key ? T.tealDeep : T.inkSoft,
                fontSize:12, fontWeight:filterLoc===f.key ? 700 : 400,
                whiteSpace:"nowrap", cursor:"pointer",
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} onScroll={onScroll}
          style={{ flex:1, overflowY:"auto", padding:"12px 12px 0" }}>
          {items.length === 0 && loading && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[1,2,3,4].map(i => <div key={i} style={{ borderRadius:16, height:200, background:"rgba(0,0,0,0.06)" }}/>)}
            </div>
          )}
          {items.length === 0 && !loading && (
            <div style={{ textAlign:"center", padding:"40px 20px", color:T.inkFaint }}>
              <div style={{ fontSize:32, marginBottom:12 }}>⭐</div>
              <div style={{ fontSize:15, fontWeight:600 }}>Keine Talente gefunden</div>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {items.map(t => <TalentCardItem key={t.id} t={t} onPress={onPressTalent}/>)}
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
