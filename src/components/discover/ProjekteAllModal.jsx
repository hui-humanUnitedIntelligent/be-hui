import { createPortal } from "react-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";

const T = {
  teal:"rgba(14,196,184,1)", white:"#FFFFFF", ink:"rgba(26,26,46,0.92)",
  bg:"#F2F4F8", border:"rgba(22,215,197,0.14)", cardShadow:"0 2px 12px rgba(0,0,0,0.07)",
  px:16, inkSoft:"rgba(26,26,46,0.55)", inkFaint:"rgba(26,26,46,0.35)",
  tealSoft:"rgba(14,196,184,0.12)", tealDeep:"rgba(0,150,136,1)"
};
const PAGE_SIZE = 20;
const RANK_BORDER = { 1:"2px solid #D97706", 2:"2px solid #71717A", 3:"2px solid #B45309" };
const RANK_EMOJI  = { 1:"🥇", 2:"🥈", 3:"🥉" };

function ProjektCardItem({ p, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const prog = p.funding_goal > 0
    ? Math.min(100, Math.round((p.current_amount_eur || 0) / p.funding_goal * 100))
    : 0;
  const border = RANK_BORDER[p.rank] || `1px solid ${T.border}`;
  return (
    <div onClick={() => onPress?.(p)} style={{
      background:T.white, borderRadius:16, overflow:"hidden",
      boxShadow:T.cardShadow, border, marginBottom:10, cursor:"pointer",
      display:"flex", flexDirection:"column",
    }}>
      <div style={{ height:100, background:T.tealSoft, position:"relative", overflow:"hidden" }}>
        {!imgErr && p.cover_url
          ? <img loading="lazy" decoding="async" src={p.cover_url} alt={p.name}
              onError={() => setImgErr(true)} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>💚</div>
        }
        {p.rank && RANK_EMOJI[p.rank] && (
          <div style={{
            position:"absolute", top:8, right:8,
            background:"rgba(0,0,0,0.55)", borderRadius:99,
            fontSize:14, padding:"3px 8px", backdropFilter:"blur(4px)"
          }}>{RANK_EMOJI[p.rank]} #{p.rank}</div>
        )}
        {p.category && (
          <div style={{
            position:"absolute", top:8, left:8,
            background:T.teal, color:"#fff", borderRadius:99,
            fontSize:9.5, fontWeight:700, padding:"2px 8px"
          }}>{p.category}</div>
        )}
      </div>
      <div style={{ padding:"10px 10px 10px" }}>
        <div style={{ fontSize:14, fontWeight:800, color:T.ink, marginBottom:4,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {p.name}
        </div>
        {p.description && (
          <div style={{ fontSize:11.5, color:T.inkSoft, marginBottom:8,
            overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
            {p.description}
          </div>
        )}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <span style={{ fontSize:11, color:T.inkFaint }}>♡ {p.vote_count || 0} Stimmen</span>
          {p.funding_goal > 0 && (
            <span style={{ fontSize:11, color:T.inkFaint }}>
              {(p.current_amount_eur||0).toLocaleString("de-DE")} / {p.funding_goal.toLocaleString("de-DE")} €
            </span>
          )}
        </div>
        {p.funding_goal > 0 && (
          <div style={{ height:5, borderRadius:99, background:"rgba(0,0,0,0.08)", overflow:"hidden" }}>
            <div style={{ width:`${prog}%`, height:"100%", background:T.teal, borderRadius:99, transition:"width .3s" }}/>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjekteAllModal({ isOpen, onClose, onPressItem }) {
  useWizardBodyLock(isOpen);
  const [items, setItems]        = useState([]);
  const [loading, setLoading]    = useState(false);
  const [hasMore, setHasMore]    = useState(true);
  const [search, setSearch]      = useState("");
  const [filterRank, setFR]      = useState("alle");
  const [page, setPage]          = useState(0);
  const scrollRef                = useRef(null);
  const searchTimer              = useRef(null);
  const [debouncedSearch, setDS] = useState("");

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDS(search), 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;
    setItems([]); setPage(0); setHasMore(true);
  }, [debouncedSearch, filterRank, isOpen]);

  const load = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      let q = supabase.from("impact_applications")
        .select("id,name,category,description,cover_url,created_at,vote_count,rank,status,funding_goal,current_amount_eur")
        .eq("status","approved")
        .order("created_at",{ ascending:false })
        .range(pageNum * PAGE_SIZE, (pageNum+1) * PAGE_SIZE - 1);

      if (debouncedSearch) {
        q = q.or(`name.ilike.%${debouncedSearch}%,category.ilike.%${debouncedSearch}%`);
      }

      const { data } = await q;
      if (!data || data.length === 0) { setHasMore(false); return; }

      let filtered = data;
      if (filterRank === "top3") filtered = data.filter(p => p.rank && p.rank <= 3);
      if (filterRank === "weitere") filtered = data.filter(p => !p.rank || p.rank > 3);

      setItems(prev => pageNum === 0 ? filtered : [...prev, ...filtered]);
      if (data.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterRank, loading]);

  useEffect(() => {
    if (!isOpen) return;
    load(0);
  }, [debouncedSearch, filterRank, isOpen]);

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

  const RANK_F = [
    {key:"alle",label:"Alle"},{key:"top3",label:"Top 3"},{key:"weitere",label:"Weitere"}
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
              <div style={{ fontSize:17, fontWeight:800, color:T.ink }}>Projekte & Initiativen</div>
              <div style={{ fontSize:11.5, color:T.inkFaint }}>Gemeinsam echte Wirkung schaffen</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:T.inkSoft, padding:4 }}>✕</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Projekte suchen…"
            style={{ width:"100%", padding:"9px 14px", borderRadius:12, border:`1px solid ${T.border}`,
              background:"#f8fafc", fontSize:14, color:T.ink, outline:"none", boxSizing:"border-box" }}/>
          <div style={{ display:"flex", gap:6, marginTop:8, overflowX:"auto", paddingBottom:4 }}>
            {RANK_F.map(f => (
              <button key={f.key} onClick={() => setFR(f.key)} style={{
                padding:"5px 12px", borderRadius:99, border:`1.5px solid ${filterRank===f.key ? T.teal : T.border}`,
                background:filterRank===f.key ? T.tealSoft : "transparent",
                color:filterRank===f.key ? T.tealDeep : T.inkSoft,
                fontSize:12, fontWeight:filterRank===f.key ? 700 : 400,
                whiteSpace:"nowrap", cursor:"pointer",
              }}>{f.label}</button>
            ))}
          </div>
        </div>
        <div ref={scrollRef} onScroll={onScroll}
          style={{ flex:1, overflowY:"auto", padding:12, paddingBottom:88 }}>
          {items.length === 0 && loading && (
            [1,2,3].map(i => <div key={i} style={{ borderRadius:16, height:200, background:"rgba(0,0,0,0.06)", marginBottom:10 }}/>)
          )}
          {items.length === 0 && !loading && (
            <div style={{ textAlign:"center", padding:"40px 20px", color:T.inkFaint }}>
              <div style={{ fontSize:32, marginBottom:12 }}>💚</div>
              <div style={{ fontSize:15, fontWeight:600 }}>Keine Projekte gefunden</div>
            </div>
          )}
          {items.map(p => <ProjektCardItem key={p.id} p={p} onPress={onPressItem}/>)}
          {loading && items.length > 0 && (
            <div style={{ textAlign:"center", padding:16, color:T.inkFaint, fontSize:13 }}>Lade weitere…</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
