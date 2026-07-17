import { createPortal } from "react-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";

const T = {
  teal:       "rgba(14,196,184,1)",
  tealDeep:   "rgba(0,150,136,1)",
  tealSoft:   "rgba(14,196,184,0.09)",
  tealMid:    "rgba(14,196,184,0.22)",
  white:      "#FFFFFF",
  bg:         "#F5F6F8",
  ink:        "#1A1A2E",
  inkSoft:    "rgba(26,26,46,0.52)",
  inkFaint:   "rgba(26,26,46,0.32)",
  border:     "rgba(26,26,46,0.08)",
  borderTeal: "rgba(14,196,184,0.22)",
  // Cards: weicher Schatten, eleganter
  cardShadow: "0 1px 6px rgba(26,26,46,0.07), 0 4px 20px rgba(26,26,46,0.04)",
  cardRadius: 14,
};
const PAGE_SIZE = 20;
// Rang-Indikatoren: subtil, kein lauter Rand mehr
const RANK_BADGE = {
  1: { bg:"linear-gradient(135deg,#F59E0B,#D97706)", label:"🥇 Platz 1" },
  2: { bg:"linear-gradient(135deg,#94A3B8,#64748B)", label:"🥈 Platz 2" },
  3: { bg:"linear-gradient(135deg,#A16207,#92400E)", label:"🥉 Platz 3" },
};

function ProjektCardItem({ p, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const prog = p.funding_goal > 0
    ? Math.min(100, Math.round((p.current_amount_eur || 0) / p.funding_goal * 100))
    : 0;
  const rankBadge = RANK_BADGE[p.rank];

  return (
    <div
      onClick={() => onPress?.(p)}
      style={{
        background: T.white,
        borderRadius: T.cardRadius,
        overflow: "hidden",
        boxShadow: T.cardShadow,
        border: `1px solid ${T.border}`,
        marginBottom: 10,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.18s",
      }}
    >
      {/* ── Bild-Bereich — größer (140px) für mehr Präsenz ── */}
      <div style={{
        height: 140,
        background: `linear-gradient(145deg, rgba(14,196,184,0.06) 0%, rgba(14,196,184,0.12) 100%)`,
        position: "relative",
        overflow: "hidden",
      }}>
        {!imgErr && p.cover_url
          ? <img
              loading="lazy"
              decoding="async"
              src={p.cover_url}
              alt={p.project_name}
              onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
            />
          : <div style={{
              width:"100%", height:"100%",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:36, opacity:0.5,
            }}>💚</div>
        }

        {/* Dezenter Gradient über dem Bild für bessere Text-Lesbarkeit */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.28) 100%)",
          pointerEvents:"none",
        }}/>

        {/* Rang-Badge — subtil, oben rechts */}
        {rankBadge && (
          <div style={{
            position:"absolute", top:10, right:10,
            background: rankBadge.bg,
            borderRadius: 8,
            fontSize: 10, fontWeight: 700, color:"#fff",
            padding: "3px 9px",
            letterSpacing: "0.02em",
            boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
          }}>
            {rankBadge.label}
          </div>
        )}

        {/* Kategorie-Tag — unten links, dezent */}
        {p.category && (
          <div style={{
            position:"absolute", bottom:10, left:10,
            background:"rgba(255,255,255,0.88)",
            backdropFilter:"blur(6px)",
            WebkitBackdropFilter:"blur(6px)",
            color: T.tealDeep,
            borderRadius: 6,
            fontSize: 9.5, fontWeight: 700,
            padding: "2px 8px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}>
            {p.category}
          </div>
        )}
      </div>

      {/* ── Content-Bereich ── */}
      <div style={{ padding: "14px 14px 12px" }}>
        {/* Projekt-Name */}
        <div style={{
          fontSize: 15, fontWeight: 700,
          color: T.ink, lineHeight: 1.35,
          marginBottom: 5,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          letterSpacing: "-0.01em",
        }}>
          {p.project_name}
        </div>

        {/* Beschreibung — kürzer, ruhiger */}
        {p.short_desc && (
          <div style={{
            fontSize: 12, color: T.inkSoft,
            lineHeight: 1.55, marginBottom: 12,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}>
            {p.short_desc}
          </div>
        )}

        {/* ── Stimmen + Betrag ── */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: p.funding_goal > 0 ? 8 : 0,
        }}>
          {/* Stimmen */}
          <span style={{
            display:"flex", alignItems:"center", gap:4,
            fontSize: 11.5, color: T.inkFaint, fontWeight: 500,
          }}>
            <span style={{ fontSize:12, opacity:0.7 }}>♡</span>
            {p.vote_count || 0} Stimmen
          </span>

          {/* Betrag */}
          {p.funding_goal > 0 && (
            <span style={{
              fontSize: 11, color: T.inkFaint, fontWeight: 500,
              fontVariantNumeric: "tabular-nums",
            }}>
              <span style={{ color: T.tealDeep, fontWeight: 600 }}>
                {(p.current_amount_eur || 0).toLocaleString("de-DE", { maximumFractionDigits:0 })} €
              </span>
              {" / "}
              {p.funding_goal.toLocaleString("de-DE")} €
            </span>
          )}
        </div>

        {/* ── Fortschrittsbalken — dünn, clean ── */}
        {p.funding_goal > 0 && (
          <div style={{
            height: 3,
            borderRadius: 99,
            background: "rgba(26,26,46,0.07)",
            overflow: "hidden",
          }}>
            <div style={{
              width: `${prog}%`,
              height: "100%",
              background: prog >= 100
                ? "linear-gradient(90deg,#10B981,#059669)"
                : `linear-gradient(90deg,${T.teal},${T.tealDeep})`,
              borderRadius: 99,
              transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
            }}/>
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
      // rpc_get_impact_ranking liefert alle approved-Projekte mit:
      // id, project_name, short_desc, cover_url, funding_goal,
      // current_amount_eur, vote_count, rank, share_pct, is_completed, category
      const { data, error } = await supabase.rpc("rpc_get_impact_ranking");
      if (error || !data) { setHasMore(false); return; }

      // Client-seitiges Filtern (RPC gibt alle zurück, keine Pagination nötig)
      let filtered = data;

      // Suchfilter
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        filtered = filtered.filter(p =>
          (p.project_name || "").toLowerCase().includes(q) ||
          (p.category     || "").toLowerCase().includes(q) ||
          (p.short_desc   || "").toLowerCase().includes(q)
        );
      }

      // Rank-Filter
      if (filterRank === "top3")     filtered = filtered.filter(p => p.rank && p.rank <= 3);
      if (filterRank === "weitere")  filtered = filtered.filter(p => !p.rank || p.rank > 3);

      setItems(filtered);
      setHasMore(false); // RPC gibt alles auf einmal zurück
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
        background:"#F4F5F7", borderRadius:"20px 20px 0 0",
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
                padding:"5px 14px", borderRadius:99,
                border: filterRank===f.key ? `1.5px solid ${T.tealMid}` : `1px solid ${T.border}`,
                background: filterRank===f.key ? T.tealSoft : "rgba(255,255,255,0.7)",
                color: filterRank===f.key ? T.tealDeep : T.inkSoft,
                fontSize:12.5, fontWeight: filterRank===f.key ? 700 : 500,
                whiteSpace:"nowrap", cursor:"pointer", fontFamily:"inherit",
                transition:"all 0.15s",
              }}>{f.label}</button>
            ))}
          </div>
        </div>
        <div ref={scrollRef} onScroll={onScroll}
          style={{ flex:1, overflowY:"auto", padding:"12px 12px 0" }}>
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

          {/* Bottom-Spacer: Navbar + safe-area (iOS Safari ignoriert paddingBottom bei scroll) */}
          <div style={{ height:"calc(88px + env(safe-area-inset-bottom, 0px))", flexShrink:0 }}/>
        </div>
      </div>
    </div>,
    document.body
  );
}
