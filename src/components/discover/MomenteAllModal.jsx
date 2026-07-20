import { createPortal } from "react-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { useProfileLauncher } from "../home/profile/ProfileLauncher.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";

const T = {
  teal:"rgba(14,196,184,1)", white:"#FFFFFF", ink:"rgba(26,26,46,0.92)",
  bg:"#F2F4F8", border:"rgba(22,215,197,0.14)", cardShadow:"0 2px 12px rgba(0,0,0,0.07)",
  px:16, inkSoft:"rgba(26,26,46,0.55)", inkFaint:"rgba(26,26,46,0.35)",
  tealSoft:"rgba(14,196,184,0.12)", tealDeep:"rgba(0,150,136,1)"
};
const PAGE_SIZE = 20;
const timeAgo = (iso) => {
  if (!iso) return "";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "heute";
  if (d === 1) return "gestern";
  if (d < 7) return `vor ${d} Tagen`;
  if (d < 30) return `vor ${Math.floor(d/7)} Wo.`;
  return `vor ${Math.floor(d/30)} Mon.`;
};

function MomentCardItem({ m, onPress, onOpenProfile }) {
  const [imgErr, setImgErr] = useState(false);
  const likes = 4 + (m.id?.charCodeAt(m.id.length-1) % 30 || 0);
  return (
    <div
      onClick={() => onPress?.(m)}
      style={{
        background:T.white, borderRadius:18, overflow:"hidden",
        boxShadow:T.cardShadow, border:`1px solid ${T.border}`,
        display:"flex", flexDirection:"column",
        cursor:"pointer", WebkitTapHighlightColor:"transparent",
      }}
    >
      <div style={{ width:"100%", height:130, background:T.tealSoft, position:"relative", overflow:"hidden" }}>
        {!imgErr && m.src
          ? <img loading="lazy" decoding="async" src={m.src} alt={m.caption}
              onError={() => setImgErr(true)} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>📸</div>
        }
        {m.created_at && (
          <div style={{
            position:"absolute", top:8, left:8,
            background:"rgba(0,0,0,0.52)", borderRadius:99,
            fontSize:9.5, color:"#fff", fontWeight:600, padding:"2px 8px",
            backdropFilter:"blur(4px)"
          }}>{timeAgo(m.created_at)}</div>
        )}
      </div>
      <div style={{ padding:"10px 10px 8px", display:"flex", flexDirection:"column", flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:4,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {m.caption || "Ein Moment"}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); if (m.user_id && onOpenProfile) onOpenProfile(m.user_id); }}
          style={{ display:"flex", alignItems:"center", gap:5, marginTop:"auto", background:"none",
            border:"none", padding:0, cursor: m.user_id ? "pointer" : "default",
            WebkitTapHighlightColor:"transparent" }}
        >
          <div style={{ width:22, height:22, borderRadius:"50%", background:T.tealSoft,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:11 }}>
            {m._initials || "H"}
          </div>
          <span style={{ fontSize:11, color:T.inkFaint }}>{m._name || "HUI Mitglied"}</span>
        </button>
        <div style={{ display:"flex", gap:10, marginTop:6 }}>
          <span style={{ fontSize:11, color:T.inkFaint }}>♡ {likes}</span>
          <span style={{ fontSize:11, color:T.inkFaint }}>◎ {Math.floor(likes/4)}</span>
        </div>
      </div>
    </div>
  );
}

export default function MomenteAllModal({ isOpen, onClose, onPressItem }) {
  const { openCreatorProfile } = useProfileLauncher();
  const { open: openPreview } = useContentPreview();
  useWizardBodyLock(isOpen);
  const [items, setItems]        = useState([]);
  const [loading, setLoading]    = useState(false);
  const [hasMore, setHasMore]    = useState(true);
  const [search, setSearch]      = useState("");
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
  }, [debouncedSearch, isOpen]);

  const load = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      let q = supabase.from("beitraege")
        .select("id,src,type,caption,created_at,user_id")
        .order("created_at",{ ascending:false })
        .range(pageNum * PAGE_SIZE, (pageNum+1) * PAGE_SIZE - 1);

      if (debouncedSearch) q = q.ilike("caption", `%${debouncedSearch}%`);

      const { data } = await q;
      if (!data || data.length === 0) { setHasMore(false); return; }

      // Namen batch laden
      const ids = [...new Set(data.map(m => m.user_id).filter(Boolean))];
      let pMap = {};
      if (ids.length > 0) {
        const { data: provs } = await supabase.from("profiles")
          .select("id,display_name,username").in("id", ids);
        pMap = Object.fromEntries((provs||[]).map(p => [p.id, {
          name: p.display_name || p.username || "HUI Mitglied",
          initials: (p.display_name || p.username || "H")[0]?.toUpperCase()
        }]));
      }

      const enriched = data.map(m => ({
        ...m,
        _name: pMap[m.user_id]?.name || "HUI Mitglied",
        _initials: pMap[m.user_id]?.initials || "H"
      }));
      setItems(prev => pageNum === 0 ? enriched : [...prev, ...enriched]);
      if (data.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, loading]);

  useEffect(() => {
    if (!isOpen) return;
    load(0);
  }, [debouncedSearch, isOpen]);

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

  return createPortal(
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:10500, background:"rgba(0,0,0,0.45)",
      display:"flex", alignItems:"flex-start", justifyContent:"center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        marginTop:"env(safe-area-inset-top,44px)", width:"100%",
        height:"calc(100dvh - env(safe-area-inset-top,44px))",
        background:T.bg, borderRadius:"20px 20px 0 0",
        display:"flex", flexDirection:"column", overflow:"hidden",
      }}>
        <div style={{ padding:"16px 16px 8px", background:T.white, borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:T.ink }}>Momente aus deiner Nähe</div>
              <div style={{ fontSize:11.5, color:T.inkFaint }}>Echte Geschichten, gerade jetzt</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:T.inkSoft, padding:4 }}>✕</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Momente suchen…"
            style={{ width:"100%", padding:"9px 14px", borderRadius:12, border:`1px solid ${T.border}`,
              background:"#f8fafc", fontSize:14, color:T.ink, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div ref={scrollRef} onScroll={onScroll}
          style={{ flex:1, overflowY:"auto", padding:"12px 12px 0" }}>
          {items.length === 0 && loading && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[1,2,3,4].map(i => <div key={i} style={{ borderRadius:18, height:200, background:"rgba(0,0,0,0.06)" }}/>)}
            </div>
          )}
          {items.length === 0 && !loading && (
            <div style={{ textAlign:"center", padding:"40px 20px", color:T.inkFaint }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📸</div>
              <div style={{ fontSize:15, fontWeight:600 }}>Keine Momente gefunden</div>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {items.map(m => (
              <MomentCardItem
                key={m.id}
                m={m}
                onOpenProfile={openCreatorProfile}
                onPress={(moment) => {
                  onClose?.();
                  // Normalisiertes Item für ContentPreviewContext (PostFullscreenView)
                  openPreview({
                    id: moment.id,
                    type: "moment",
                    title: moment.caption || moment._name || "Moment",
                    text:  moment.caption || null,
                    media: moment.src ? [{ type: moment.type === "video" ? "video" : "image", url: moment.src }] : [],
                    author: {
                      id:   moment.user_id || "",
                      name: moment._name   || "HUI Mitglied",
                      displayName: moment._name || "HUI Mitglied",
                      avatar: null,
                    },
                    createdAt: moment.created_at || "",
                    _reactions: {},
                    _raw: moment,
                  });
                }}
              />
            ))}
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
