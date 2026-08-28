// src/components/discover/MenschenAllModal.jsx
// ══════════════════════════════════════════════════════════════════
// "Alle anzeigen" für die Menschen-Sektion (DiscoverPage → "Inspirierende
// Menschen"). Fehlte bisher komplett — der Button hat nur zur eigenen
// Sektion zurück-gescrollt (kein echtes "Alle anzeigen"). Baut auf exakt
// demselben Muster wie TalenteAllModal.jsx / MomenteAllModal.jsx /
// WerkeAllModal.jsx: Portal + zIndex 10500, Suchfeld oben, 2-spaltiges
// Grid, Pagination (20/Seite, Infinite-Scroll).
//
// Datenquelle: profiles-Tabelle, exakt derselbe Filter wie beim Teaser
// in DiscoverPage.jsx (has_talent_profile/is_member/role talent|wirker) —
// damit "Alle anzeigen" konsistent dieselbe Zielgruppe zeigt wie die
// Vorschau-Kacheln, nur vollständig + durchsuchbar.
//
// WICHTIG: Die horizontalen Teaser-Karten (PersonCard in DiscoverPage.jsx)
// zeigen "Interesse-Tags" — das sind laut Kommentar dort deterministisch
// aus dem Namen gehashte PLATZHALTER-Tags (dna_tags/skills sind nicht im
// Identity Contract v1.0 enthalten), keine echten Nutzerdaten. Diese
// Fake-Tags werden hier bewusst NICHT übernommen — nur echte Felder
// (Name, Bio, Ort, Wirkung) werden angezeigt (Pflichtregel: kein Raten).
// ══════════════════════════════════════════════════════════════════
import { createPortal } from "react-dom";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { HUIProfilIcon, HUILocationIcon } from "../../design/icons/HuiSystemIcons.jsx";

const T = {
  teal:"rgba(14,196,184,1)", white:"#FFFFFF", ink:"rgba(26,26,46,0.92)",
  bg:"#F2F4F8", border:"rgba(22,215,197,0.14)", cardShadow:"0 2px 12px rgba(0,0,0,0.07)",
  px:16, inkSoft:"rgba(26,26,46,0.55)", inkFaint:"rgba(26,26,46,0.35)",
  tealSoft:"rgba(14,196,184,0.12)", tealDeep:"rgba(0,150,136,1)"
};
const PAGE_SIZE = 20;
const SORT_OPTIONS = [
  { key:"popular",   label:"common.popular",    icon:"✨" },
  { key:"followers", label:"common.followers",   icon:"👥" },
  { key:"likes",     label:"Likes",      icon:"❤️" },
  { key:"alpha",     label:"A–Z",   icon:"🔤" },
];

function PersonCardItem({ p, onPress, followers=0, likes=0 }) {
  const [imgErr, setImgErr] = useState(false);
  const av = (!imgErr && p.avatar_url) ? p.avatar_url : null;
  const name = p.display_name || p.username || "HUI Mitglied";
  return (
    <div onClick={() => onPress?.(p)} style={{
      background:T.white, borderRadius:16, overflow:"hidden",
      boxShadow:T.cardShadow, border:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"16px 10px 12px", cursor:"pointer",
    }}>
      <div style={{
        width:64, height:64, borderRadius:"50%", overflow:"hidden", marginBottom:10,
        border:`2px solid ${T.white}`, boxShadow:`0 0 0 2px rgba(14,196,184,0.28)`,
        background:av ? "transparent" : T.tealSoft,
        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
      }}>
        {av ? (
          <img loading="lazy" decoding="async" src={av} alt={name} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <HUIProfilIcon size={24} style={{opacity:0.4, color:"rgba(14,196,184,0.6)"}} />
        )}
      </div>
      <div style={{
        fontSize:13, fontWeight: 600, color:T.ink, textAlign:"center", marginBottom:4,
        minHeight:16.25, width:"100%",
        overflow:"hidden", display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical",
      }}>
        {name}
      </div>
      {/* Bio — immer 2 Zeilen Platz reserviert, auch wenn leer */}
      <div style={{
        fontSize:11, color:T.inkSoft, textAlign:"center", marginBottom:6, lineHeight:1.4,
        minHeight:30.8, width:"100%",
        overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical",
      }}>
        {p.bio || ""}
      </div>
      {/* Ort — immer 1 Zeile Platz reserviert, auch wenn leer */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:3, fontSize:10, color:T.inkFaint, marginBottom:6, minHeight:13, width:"100%" }}>
        {p.location_label && (
          <>
            <HUILocationIcon size={9} style={{flexShrink:0}} />
            <span style={{ fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.location_label}</span>
          </>
        )}
      </div>
      {/* Follower + Likes — immer nebeneinander in 1 Zeile */}
      <div style={{ display:"flex", gap:4, flexWrap:"nowrap", justifyContent:"center", marginTop:"auto" }}>
        <div style={{
          display:"flex", alignItems:"center", gap:3,
          background:"rgba(14,196,184,0.08)", borderRadius:99, padding:"3px 8px",
          border:"1px solid rgba(14,196,184,0.12)",
        }}>
          <span style={{ fontSize:10 }}>👥</span>
          <span style={{ fontSize:10.5, fontWeight: 600, color:T.tealDeep }}>{followers}</span>
        </div>
        <div style={{
          display:"flex", alignItems:"center", gap:3,
          background:"rgba(239,68,68,0.08)", borderRadius:99, padding:"3px 8px",
          border:"1px solid rgba(239,68,68,0.12)",
        }}>
          <span style={{ fontSize:10 }}>❤️</span>
          <span style={{ fontSize:10.5, fontWeight: 600, color:"#e04050" }}>{likes}</span>
        </div>
      </div>
    </div>
  );
}

export default function MenschenAllModal({ isOpen, onClose, onPressPerson }) {
  const { t } = useTranslation();
  useWizardBodyLock(isOpen);
  useModalRegistration(isOpen, onClose, "MenschenAllModal");
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [hasMore, setHasMore]   = useState(true);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(0);
  const scrollRef               = useRef(null);
  const searchTimer             = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState("popular"); // popular | followers | likes | alpha

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;
    setItems([]); setPage(0); setHasMore(true);
  }, [debouncedSearch, sort, isOpen]);

  const load = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      // Serverseitige Sortierung + Suche via RPC (gleicher Zielgruppen-Filter
      // wie der Teaser in DiscoverPage.jsx). Client-seitiges Sortieren würde
      // bei Pagination brechen (jede Seite müsste neu einsortiert werden) —
      // daher übernimmt die DB Sortierung + Likes-Berechnung in einem Call.
      const { data } = await supabase.rpc("rpc_discover_people", {
        p_search: debouncedSearch || null,
        p_sort: sort,
        p_limit: PAGE_SIZE,
        p_offset: pageNum * PAGE_SIZE,
      });
      if (!data || data.length === 0) { setHasMore(false); return; }

      setItems(prev => pageNum === 0 ? data : [...prev, ...data]);
      if (data.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sort, loading]);

  useEffect(() => {
    if (!isOpen) return;
    load(0);
  }, [debouncedSearch, sort, isOpen]);

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
        marginTop:"max(var(--hui-safe-top, 0px), env(safe-area-inset-top,44px))", width:"100%",
        height:"calc(100dvh - max(var(--hui-safe-top, 0px), env(safe-area-inset-top,44px)))",
        background:T.bg, borderRadius:"20px 20px 0 0",
        display:"flex", flexDirection:"column", overflow:"hidden",
      }}>
        <div style={{ padding:"16px 16px 8px", background:T.white, borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:17, fontWeight: 600, color:T.ink }}>{t("discover.inspiringPeople")}</div>
              <div style={{ fontSize:11.5, color:T.inkFaint }}>{t("discover.inspiringPeopleSub")}</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:T.inkSoft, padding:4 }}>✕</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Menschen suchen…"
            style={{ width:"100%", padding:"9px 14px", borderRadius:12, border:`1px solid ${T.border}`,
              background:"#f8fafc", fontSize:14, color:T.ink, outline:"none", boxSizing:"border-box", marginBottom:10 }}/>
          <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:2 }}>
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
        </div>

        <div ref={scrollRef} onScroll={onScroll}
          style={{ flex:1, overflowY:"auto", padding:"12px 12px 0" }}>
          {items.length === 0 && loading && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[1,2,3,4].map(i => <div key={i} style={{ borderRadius:16, height:180, background:"rgba(0,0,0,0.06)" }}/>)}
            </div>
          )}
          {items.length === 0 && !loading && (
            <div style={{ textAlign:"center", padding:"40px 20px", color:T.inkFaint }}>
              <div style={{ fontSize:32, marginBottom:12 }}>👤</div>
              <div style={{ fontSize:15, fontWeight:600 }}>{t("discover.noMenschenFound")}</div>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {items.map(p => <PersonCardItem key={p.id} p={p} onPress={onPressPerson} followers={p.followers_count || 0} likes={p.total_likes || 0} />)}
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
