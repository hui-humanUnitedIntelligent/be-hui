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
const TYPE_MAP = { workshop:"Workshop", event:"Event", ausstellung:"Ausstellung",
  projekt:"Projekt", kurs:"Kurs", online:"Online" };

function mapExp(e) {
  const d = e.date ? new Date(e.date) : null;
  const now = new Date();
  let statusLabel = "Aktiv"; let statusColor = "#16A34A";
  if (d && d > now) { statusLabel = "Geplant"; statusColor = "#D97706"; }
  if (d && d < now) { statusLabel = "Abgeschlossen"; statusColor = "rgba(26,26,46,0.38)"; }
  const typeRaw = e.experience_type || e.category || "";
  const typeLabel = TYPE_MAP[typeRaw.toLowerCase()] || typeRaw || "Erlebnis";
  const dayNum  = d ? String(d.getDate()).padStart(2,"0") : null;
  const monthSh = d ? d.toLocaleString("de",{month:"short"}).toUpperCase() : null;
  return { ...e, dayNum, monthSh, statusLabel, statusColor, typeLabel };
}

function ErlebnisCardItem({ e: ev, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div onClick={() => onPress?.(ev)} style={{
      background:T.white, borderRadius:16, overflow:"hidden",
      boxShadow:T.cardShadow, border:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", cursor:"pointer",
    }}>
      <div style={{ width:"100%", height:130, background:T.tealSoft, position:"relative", overflow:"hidden" }}>
        {!imgErr && ev.cover_url
          ? <img loading="lazy" decoding="async" src={ev.cover_url} alt={ev.title}
              onError={() => setImgErr(true)} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>🌟</div>
        }
        {ev.dayNum && (
          <div style={{
            position:"absolute", top:8, left:8, background:"rgba(255,255,255,0.92)",
            borderRadius:10, padding:"4px 8px", textAlign:"center",
            backdropFilter:"blur(4px)"
          }}>
            <div style={{ fontSize:15, fontWeight:800, color:T.ink, lineHeight:1 }}>{ev.dayNum}</div>
            <div style={{ fontSize:8.5, fontWeight:700, color:T.inkSoft, letterSpacing:".04em" }}>{ev.monthSh}</div>
          </div>
        )}
        {ev.typeLabel && (
          <div style={{
            position:"absolute", top:8, right:8, background:T.teal, color:"#fff",
            borderRadius:99, fontSize:9.5, fontWeight:700, padding:"2px 8px"
          }}>{ev.typeLabel}</div>
        )}
      </div>
      <div style={{ padding:"10px 10px 8px", display:"flex", flexDirection:"column", flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:3,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {ev.title}
        </div>
        {ev.location_text && (
          <div style={{ fontSize:10.5, color:T.inkSoft, marginBottom:4, display:"flex", gap:3, alignItems:"center" }}>
            <span>📍</span><span style={{ overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{ev.location_text}</span>
          </div>
        )}
        <div style={{ marginTop:"auto", display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:ev.statusColor, flexShrink:0 }}/>
          <span style={{ fontSize:11, color:ev.statusColor, fontWeight:600 }}>{ev.statusLabel}</span>
        </div>
      </div>
    </div>
  );
}

export default function ErlebnisseAllModal({ isOpen, onClose, onPressItem }) {
  useWizardBodyLock(isOpen);
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [hasMore, setHasMore]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFS]     = useState("alle");
  const [filterType, setFT]       = useState("alle");
  const [page, setPage]           = useState(0);
  const scrollRef                 = useRef(null);
  const searchTimer               = useRef(null);
  const [debouncedSearch, setDS]  = useState("");

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDS(search), 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;
    setItems([]); setPage(0); setHasMore(true);
  }, [debouncedSearch, filterStatus, filterType, isOpen]);

  const load = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      let q = supabase.from("experiences")
        .select("id,title,cover_url,date,duration,location_text,max_participants,status,approval_status,category,experience_type,format,created_at")
        .eq("status","published").eq("approval_status","approved")
        .order("created_at",{ ascending:false })
        .range(pageNum * PAGE_SIZE, (pageNum+1) * PAGE_SIZE - 1);

      if (debouncedSearch) {
        q = q.or(`title.ilike.%${debouncedSearch}%,category.ilike.%${debouncedSearch}%`);
      }
      if (filterType !== "alle") q = q.eq("experience_type", filterType);

      const { data } = await q;
      if (!data || data.length === 0) { setHasMore(false); return; }

      let mapped = data.map(mapExp);
      // Clientseitiger Status-Filter (abgeschlossen/geplant aus Datum)
      if (filterStatus === "geplant") mapped = mapped.filter(e => e.statusLabel === "Geplant");
      if (filterStatus === "abgeschlossen") mapped = mapped.filter(e => e.statusLabel === "Abgeschlossen");

      setItems(prev => pageNum === 0 ? mapped : [...prev, ...mapped]);
      if (data.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterStatus, filterType, loading]);

  useEffect(() => {
    if (!isOpen) return;
    load(0);
  }, [debouncedSearch, filterStatus, filterType, isOpen]);

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

  const STATUS_F = [
    {key:"alle",label:"Alle"},{key:"geplant",label:"Geplant"},{key:"abgeschlossen",label:"Abgeschlossen"}
  ];
  const TYPE_F = [
    {key:"alle",label:"Alle"},{key:"workshop",label:"Workshop"},{key:"event",label:"Event"},
    {key:"kurs",label:"Kurs"},{key:"ausstellung",label:"Ausstellung"},
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
              <div style={{ fontSize:17, fontWeight:800, color:T.ink }}>Erlebnisse für dich</div>
              <div style={{ fontSize:11.5, color:T.inkFaint }}>Workshops, Treffen, Kurse & mehr</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:T.inkSoft, padding:4 }}>✕</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Erlebnisse suchen…"
            style={{ width:"100%", padding:"9px 14px", borderRadius:12, border:`1px solid ${T.border}`,
              background:"#f8fafc", fontSize:14, color:T.ink, outline:"none", boxSizing:"border-box" }}/>
          <div style={{ display:"flex", gap:5, marginTop:8, overflowX:"auto", paddingBottom:2 }}>
            {TYPE_F.map(f => (
              <button key={f.key} onClick={() => setFT(f.key)} style={{
                padding:"4px 10px", borderRadius:99, border:`1.5px solid ${filterType===f.key ? T.teal : T.border}`,
                background:filterType===f.key ? T.tealSoft : "transparent",
                color:filterType===f.key ? T.tealDeep : T.inkSoft,
                fontSize:11.5, fontWeight:filterType===f.key ? 700 : 400,
                whiteSpace:"nowrap", cursor:"pointer",
              }}>{f.label}</button>
            ))}
          </div>
          <div style={{ display:"flex", gap:5, marginTop:5, overflowX:"auto", paddingBottom:4 }}>
            {STATUS_F.map(f => (
              <button key={f.key} onClick={() => setFS(f.key)} style={{
                padding:"4px 10px", borderRadius:99, border:`1.5px solid ${filterStatus===f.key ? "#D97706" : T.border}`,
                background:filterStatus===f.key ? "rgba(217,119,6,0.1)" : "transparent",
                color:filterStatus===f.key ? "#D97706" : T.inkSoft,
                fontSize:11.5, fontWeight:filterStatus===f.key ? 700 : 400,
                whiteSpace:"nowrap", cursor:"pointer",
              }}>{f.label}</button>
            ))}
          </div>
        </div>
        <div ref={scrollRef} onScroll={onScroll}
          style={{ flex:1, overflowY:"auto", padding:12, paddingBottom:88 }}>
          {items.length === 0 && loading && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[1,2,3,4].map(i => <div key={i} style={{ borderRadius:16, height:200, background:"rgba(0,0,0,0.06)" }}/>)}
            </div>
          )}
          {items.length === 0 && !loading && (
            <div style={{ textAlign:"center", padding:"40px 20px", color:T.inkFaint }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🌟</div>
              <div style={{ fontSize:15, fontWeight:600 }}>Keine Erlebnisse gefunden</div>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {items.map(e => <ErlebnisCardItem key={e.id} e={e} onPress={onPressItem}/>)}
          </div>
          {loading && items.length > 0 && (
            <div style={{ textAlign:"center", padding:16, color:T.inkFaint, fontSize:13 }}>Lade weitere…</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
