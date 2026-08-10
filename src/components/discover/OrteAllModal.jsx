import { createPortal } from "react-dom";
import { HUILogo } from "../brand/HUILogo.jsx";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { getPlaceImage } from "../../lib/placeImage.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";
import { formatNumberDE } from "../../lib/formatters.js";

const T = {
  teal:"rgba(14,196,184,1)", white:"#FFFFFF", ink:"rgba(26,26,46,0.92)",
  bg:"#F2F4F8", border:"rgba(22,215,197,0.14)", cardShadow:"0 2px 12px rgba(0,0,0,0.07)",
  px:16, inkSoft:"rgba(26,26,46,0.55)", inkFaint:"rgba(26,26,46,0.35)",
  tealSoft:"rgba(14,196,184,0.12)", tealDeep:"rgba(0,150,136,1)"
};

function PlaceCard({ place, onPress }) {
  const [sightUrl, setSightUrl] = useState(null);
  const [imgErr, setImgErr]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPlaceImage(place.place_key).then(url => { if (!cancelled) setSightUrl(url); });
    return () => { cancelled = true; };
  }, [place.place_key]);

  const cover = (!imgErr && sightUrl) ? sightUrl : null;

  return (
    <div onClick={() => onPress?.(place.place_key)} style={{
      background:T.white, borderRadius:16, overflow:"hidden",
      boxShadow:T.cardShadow, border:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column", cursor:"pointer",
      transition:"transform .14s ease",
    }}>
      <div style={{ height:120, background:cover ? "#1A1A18" : T.tealSoft, position:"relative", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={cover} alt={place.place_key} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <HUILogo size={44} style={{opacity:0.55}} />
        )}
        <div style={{
          position:"absolute", top:6, right:6,
          background:"rgba(255,255,255,0.92)", borderRadius:99,
          fontSize:10, fontWeight: 600, color:T.tealDeep, padding:"2px 9px",
          backdropFilter:"blur(4px)"
        }}>{place.total_count}</div>
      </div>
      <div style={{ padding:"8px 10px 10px", display:"flex", flexDirection:"column", flex:1 }}>
        <div style={{ fontSize:13.5, fontWeight: 600, color:T.ink, marginBottom:5, letterSpacing:"-0.02em" }}>{place.place_key}</div>
        <div style={{ marginTop:"auto", display:"flex", alignItems:"center", gap:7, fontSize:10.5, fontWeight:600 }}>
          {place.people_count > 0 && (
            <span style={{ color:T.tealDeep, display:"flex", alignItems:"center", gap:2 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:T.teal, display:"inline-block" }}/>
              {place.people_count} {place.people_count === 1 ? "Person" : "Personen"}
            </span>
          )}
          {place.works_count > 0 && (
            <span style={{ color:T.inkSoft, display:"flex", alignItems:"center", gap:2 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#F5A623", display:"inline-block" }}/>
              {place.works_count} Werk{place.works_count > 1 ? "e" : ""}
            </span>
          )}
          {place.experiences_count > 0 && (
            <span style={{ color:T.inkSoft, display:"flex", alignItems:"center", gap:2 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#FF6F61", display:"inline-block" }}/>
              {place.experiences_count} Erlebnis{place.experiences_count > 1 ? "se" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ item, onPressPerson, onPressWork, onPressExperience }) {
  const [imgErr, setImgErr] = useState(false);
  const isPerson = item.item_type === "person";
  const isWork   = item.item_type === "work";
  const isExp    = item.item_type === "experience";

  const typeBadge = isPerson ? { bg:"rgba(14,196,184,0.12)", text:T.tealDeep, label:"Person" }
    : isWork ? { bg:"rgba(245,166,35,0.12)", text:"#C8860D", label:"Werk" }
    : { bg:"rgba(255,111,97,0.12)", text:"#E04E3E", label:"Erlebnis" };

  const handleClick = () => {
    if (isPerson)     onPressPerson?.(item.id);
    else if (isWork)  onPressWork?.(item.id);
    else if (isExp)   onPressExperience?.(item);
  };

  return (
    <div onClick={handleClick} style={{
      display:"flex", gap:10, padding:"10px 12px",
      borderBottom:`1px solid ${T.border}`, cursor:"pointer",
      transition:"background .12s",
    }} onMouseEnter={e => e.currentTarget.style.background="rgba(14,196,184,0.04)"}
      onMouseLeave={e => e.currentTarget.style.background="transparent"}>
      <div style={{
        width:48, height:48, borderRadius:10, overflow:"hidden", flexShrink:0,
        background:T.tealSoft, display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {!imgErr && item.cover_url ? (
          <img src={item.cover_url} alt="" onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        ) : (
          <span style={{ fontSize:18, opacity:0.5 }}>
            {isPerson ? "👤" : isWork ? "🎨" : "🎉"}
          </span>
        )}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13.5, fontWeight: 600, color:T.ink, marginBottom:2,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {item.title}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{ fontSize:10, fontWeight: 600, color:typeBadge.text, background:typeBadge.bg, borderRadius:99, padding:"1px 7px" }}>
            {typeBadge.label}
          </span>
          {item.location && (
            <span style={{ fontSize:10.5, color:T.inkFaint, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160 }}>
              📍 {item.location}
            </span>
          )}
          {isWork && item.price != null && Number(item.price) > 0 && (
            <span style={{ fontSize:10.5, color:T.tealDeep, fontWeight: 600 }}>
              {formatNumberDE(Number(item.price))} €
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrteAllModal({ isOpen, onClose, initialPlace, onPressPerson, onPressWork, onPressExperience }) {
  useWizardBodyLock(isOpen);
  useModalRegistration(isOpen, onClose, "OrteAllModal");
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState("active");
  const [places, setPlaces]       = useState([]);
  const [loading, setLoading]     = useState(true);

  // Detail-View State
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [detailItems, setDetailItems]       = useState([]);
  const [detailLoading, setDetailLoading]   = useState(false);

  // Wenn initialPlace gesetzt (z.B. Klick auf Teaser-Karte), direkt Detail öffnen
  useEffect(() => {
    if (isOpen && initialPlace) {
      setSelectedPlace(initialPlace);
      setSearch("");
    } else if (isOpen && !initialPlace) {
      setSelectedPlace(null);
    }
  }, [isOpen, initialPlace]);

  // Places laden
  const loadPlaces = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("rpc_discover_places", {
      p_search: search.trim() || null,
      p_sort: sort,
      p_limit: 50,
      p_offset: 0,
    });
    setPlaces(data || []);
    setLoading(false);
  }, [search, sort]);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedPlace) return; // Im Detail-View keine Places neu laden
    loadPlaces();
  }, [isOpen, selectedPlace, loadPlaces]);

  // Detail laden
  useEffect(() => {
    if (!selectedPlace) { setDetailItems([]); return; }
    let cancelled = false;
    setDetailLoading(true);
    supabase.rpc("rpc_discover_place_detail", { p_place: selectedPlace, p_limit: 30 })
      .then(({ data }) => { if (!cancelled) { setDetailItems(data || []); setDetailLoading(false); } });
    return () => { cancelled = true; };
  }, [selectedPlace]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showDetail = !!selectedPlace;

  return createPortal(
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:10500, background:"rgba(0,0,0,0.45)",
      display:"flex", alignItems:"flex-start", justifyContent:"center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        marginTop:"max(var(--hui-safe-top, 0px), env(safe-area-inset-top,44px))", maxWidth:480, width:"100%",
        height:"calc(100dvh - max(var(--hui-safe-top, 0px), env(safe-area-inset-top,44px)))",
        background:T.bg, borderRadius:"20px 20px 0 0",
        display:"flex", flexDirection:"column", overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{ padding:"16px 16px 10px", background:T.white, borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {showDetail && (
                <button onClick={() => { setSelectedPlace(null); setDetailItems([]); }}
                  style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:T.tealDeep, padding:"0 4px 0 0", lineHeight:1 }}>
                  ‹
                </button>
              )}
              <div>
                <div style={{ fontSize:17, fontWeight: 600, color:T.ink }}>
                  {showDetail ? selectedPlace : "Orte entdecken"}
                </div>
                <div style={{ fontSize:11.5, color:T.inkFaint }}>
                  {showDetail
                    ? `${detailItems.length} ${detailItems.length === 1 ? "Eintrag" : "Einträge"} in ${selectedPlace}`
                    : "Echte Orte aus HUI-Profilen, Werken & Erlebnissen"}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:T.inkSoft, padding:4 }}>✕</button>
          </div>
          {!showDetail && (
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Ort suchen…"
              style={{ width:"100%", padding:"9px 14px", borderRadius:12, border:`1px solid ${T.border}`,
                background:"#f8fafc", fontSize:14, color:T.ink, outline:"none", boxSizing:"border-box" }}/>
          )}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding: showDetail ? "0" : "12px 12px 0" }}>
          {showDetail ? (
            // ── Detail-View: alle Einträge für den ausgewählten Ort ──
            detailLoading ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:T.inkFaint, fontSize:14 }}>
                Lade Einträge…
              </div>
            ) : detailItems.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:T.inkFaint }}>
                <div style={{ fontSize:28, marginBottom:10 }}>📍</div>
                <div style={{ fontSize:15, fontWeight:600 }}>Keine Einträge in {selectedPlace}</div>
              </div>
            ) : (
              <div style={{ background:T.white, borderRadius:0 }}>
                {detailItems.map((item, i) => (
                  <DetailItem key={`${item.item_type}-${item.id}-${i}`}
                    item={item}
                    onPressPerson={onPressPerson}
                    onPressWork={onPressWork}
                    onPressExperience={onPressExperience}
                  />
                ))}
              </div>
            )
          ) : (
            // ── Places-List-View ──
            loading ? (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {Array.from({length:6}).map((_,i) => (
                  <div key={i} style={{ background:T.white, borderRadius:14, overflow:"hidden", boxShadow:T.cardShadow, border:`1px solid ${T.border}` }}>
                    <div style={{ height:80, background:T.tealSoft, animation:"dp-shim 1.4s ease-in-out infinite" }}/>
                    <div style={{ padding:"8px 10px 10px" }}>
                      <div style={{ height:12, width:"60%", background:"rgba(26,53,48,0.06)", borderRadius:6, marginBottom:6 }}/>
                      <div style={{ height:9, width:"40%", background:"rgba(26,53,48,0.04)", borderRadius:6 }}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : places.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:T.inkFaint }}>
                <div style={{ fontSize:28, marginBottom:10 }}>📍</div>
                <div style={{ fontSize:15, fontWeight:600 }}>Kein Ort gefunden</div>
                <div style={{ fontSize:12, marginTop:4 }}>Versuche eine andere Suche.</div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {places.map(p => (
                  <PlaceCard key={p.place_key} place={p} onPress={(key) => setSelectedPlace(key)} />
                ))}
              </div>
            )
          )}

          {/* Bottom-Spacer */}
          <div style={{ height:"calc(88px + env(safe-area-inset-bottom, 0px))", flexShrink:0 }}/>
        </div>
      </div>
    </div>,
    document.body
  );
}
