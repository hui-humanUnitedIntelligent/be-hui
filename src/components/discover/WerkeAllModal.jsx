import { createPortal } from "react-dom";
import { useTranslation } from "../../hooks/useTranslation.js";
import { HUILogo } from "../brand/HUILogo.jsx";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { formatNumberDE } from "../../lib/formatters.js";
import { WERK_CAT_KEY_MAP, translateCategory } from "../../lib/categoryMaps.js";

const T = {
  teal:"rgba(14,196,184,1)", white:"#FFFFFF", ink:"rgba(26,26,46,0.92)",
  bg:"#F2F4F8", border:"rgba(22,215,197,0.14)", cardShadow:"0 2px 12px rgba(0,0,0,0.07)",
  px:16, inkSoft:"rgba(26,26,46,0.55)", inkFaint:"rgba(26,26,46,0.35)",
  tealSoft:"rgba(14,196,184,0.12)", tealDeep:"rgba(0,150,136,1)"
};
const PAGE_SIZE = 20;
const SORT_OPTIONS = [
  { key:"popular", label:"common.popular",  icon:"✨" },
  { key:"newest",  label:"common.newest",  icon:"🕐" },
  { key:"alpha",   label:"A–Z", icon:"🔤" },
];
const FORMAT_KEY = { original:"discover.fileFormatOriginal", druck:"discover.fileFormatDruck", digital:"discover.fileFormatDigital" };
const FORMAT_BADGE = { original:"#7C3AED", druck:"#0891B2", digital:"#D97706" };

function WerkCardItem({ w, onPress, saleStatus }) {
  const { t } = useTranslation();
  const [imgErr, setImgErr] = useState(false);
  const price = w.price != null ? `${formatNumberDE(Number(w.price))} €` : null;
  const badge = w.file_format || w.category || null;
  const badgeColor = FORMAT_BADGE[w.file_format] || T.teal;
  const ss = saleStatus?.[w.id];
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
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}><HUILogo size={36} style={{opacity:0.5}} /></div>
        }
        <div style={{
          position:"absolute", top:8, left:8,
          background:badgeColor, color:"#fff", borderRadius:99,
          fontSize:9.5, fontWeight: 600, padding:"2px 8px"
        }}>{badge ? (FORMAT_KEY[badge] ? t(FORMAT_KEY[badge]) : (WERK_CAT_KEY_MAP[badge] ? translateCategory(badge, WERK_CAT_KEY_MAP, t) : badge)) : ""}</div>
        {ss && (
          <div style={{
            position:"absolute", bottom:8, left:8,
            background: ss === "verkauft" ? "rgba(26,26,46,0.82)" : "rgba(245,166,35,0.88)",
            color:"#fff", borderRadius:99,
            fontSize:9, fontWeight:700, padding:"2px 8px",
            backdropFilter:"blur(4px)",
          }}>{ss === "verkauft" ? t("common.sold") : t("common.reserved")}</div>
        )}
      </div>
      <div style={{ padding:"10px 10px 8px", display:"flex", flexDirection:"column", flex:1 }}>
        <div style={{ fontSize:13, fontWeight: 600, color:T.ink, marginBottom:2,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {w.title}
        </div>
        {w._authorName ? (
          <div
            style={{ fontSize:11, color:T.tealDeep, fontWeight:600, marginBottom:4 }}>
            {t("common.by")} {w._authorName}
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
          <div style={{ marginTop:"auto", fontSize:13, fontWeight: 600, color:T.tealDeep }}>{price}</div>
        )}
      </div>
    </div>
  );
}

export default function WerkeAllModal({ isOpen, onClose, onPressItem }) {
  const { t } = useTranslation();
  useWizardBodyLock(isOpen);
  useModalRegistration(isOpen, onClose, "WerkeAllModal");
  // openCreatorProfile entfernt (2026-07-29) — Autor-Namen nicht mehr klickbar
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [hasMore, setHasMore]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("alle");
  const [sort, setSort]           = useState("popular"); // popular | newest | alpha
  const [page, setPage]         = useState(0);
  const scrollRef                = useRef(null);
  const searchTimer              = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [saleStatusMap, setSaleStatusMap] = useState({}); // WORK-SALE-STATUS-001

  // Debounce
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // Reset wenn Filter/Suche ändert
  useEffect(() => {
    if (!isOpen) return;
    setItems([]); setPage(0); setHasMore(true); setSaleStatusMap({});
  }, [debouncedSearch, filter, sort, isOpen]);

  // Laden
  const load = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      let q = supabase.from("works")
        .select("id,title,cover_url,category,file_format,price,location_text,user_id,created_at,likes_count")
        .eq("status","published").eq("approval_status","approved").eq("visibility","public")
        .order(sort === "alpha" ? "title" : sort === "popular" ? "likes_count" : "created_at",
                { ascending: sort === "alpha" })
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

      // WORK-SALE-STATUS-001: Sale-Status batch-fetch (non-blocking)
      const newIds = data.map(w => w.id).filter(Boolean);
      if (newIds.length > 0) {
        supabase
          .rpc("rpc_get_works_sale_status", { p_work_ids: newIds })
          .then(({ data: statusRows }) => {
            const updates = {};
            (statusRows || []).forEach(r => {
              if (r.sale_status) updates[r.work_id] = r.sale_status;
            });
            setSaleStatusMap(prev => ({ ...prev, ...updates }));
          })
          .catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter, sort, loading]);

  useEffect(() => {
    if (!isOpen) return;
    load(0);
  }, [debouncedSearch, filter, sort, isOpen]);

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
    { key:"alle", label:t("common.all") },
    { key:"original", label:t("discover.fileFormatOriginal") },
    { key:"druck", label:t("discover.fileFormatDruck") },
    { key:"digital", label:t("discover.fileFormatDigital") },
  ];

  return createPortal(
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:10500,
      background:"rgba(0,0,0,0.45)", display:"flex",
      alignItems:"flex-start", justifyContent:"center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        marginTop:"max(var(--hui-safe-top, 0px), env(safe-area-inset-top,44px))",
        width:"100%",
        height:"calc(100dvh - max(var(--hui-safe-top, 0px), env(safe-area-inset-top,44px)))",
        background:T.bg, borderRadius:"20px 20px 0 0",
        display:"flex", flexDirection:"column", overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{ padding:"16px 16px 8px", background:T.white, borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:17, fontWeight: 600, color:T.ink }}>{t("discover.werke")}</div>
              <div style={{ fontSize:11.5, color:T.inkFaint }}>{t("discover.werkeSub")}</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:T.inkSoft, padding:4 }}>✕</button>
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t("discover.werkeSearchPlaceholder")}
            style={{ width:"100%", padding:"9px 14px", borderRadius:12, border:`1px solid ${T.border}`,
              background:"#f8fafc", fontSize:14, color:T.ink, outline:"none", boxSizing:"border-box", marginBottom:10 }}
          />
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:6 }}>
            {SORT_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => setSort(opt.key)} style={{
                flexShrink:0, padding:"6px 12px", borderRadius:99, fontSize:12, fontWeight: 600,
                border:`1px solid ${sort === opt.key ? T.teal : T.border}`,
                background: sort === opt.key ? "rgba(14,196,184,0.12)" : T.white,
                color: sort === opt.key ? T.tealDeep : T.inkSoft,
                cursor:"pointer", whiteSpace:"nowrap",
              }}>
                {opt.icon} {t(opt.label)}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:6, marginTop:8, overflowX:"auto", paddingBottom:4 }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding:"5px 12px", borderRadius:99, border:`1.5px solid ${filter===f.key ? T.teal : T.border}`,
                background: filter===f.key ? T.tealSoft : "transparent",
                color: filter===f.key ? T.tealDeep : T.inkSoft,
                fontSize:12, fontWeight:filter===f.key ? 600 : 400,
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
              <div style={{ fontSize:15, fontWeight:600 }}>{t("discover.noWerkeFound")}</div>
              <div style={{ fontSize:13, marginTop:6 }}>{t("common.tryOtherSearch")}</div>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {items.map(w => <WerkCardItem key={w.id} w={w} onPress={onPressItem} onAuthorPress={null} saleStatus={saleStatusMap}/>)}
          </div>
          {loading && items.length > 0 && (
            <div style={{ textAlign:"center", padding:16, color:T.inkFaint, fontSize:13 }}>{t("common.loadingMore")}</div>
          )}

          {/* Bottom-Spacer: Navbar + safe-area (iOS Safari ignoriert paddingBottom bei scroll) */}
          <div style={{ height:"calc(88px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px)))", flexShrink:0 }}/>
        </div>
      </div>
    </div>,
    document.body
  );
}
