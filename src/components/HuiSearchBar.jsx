// HuiSearchBar.jsx — HUI Smart Search v2
// Rotierende, emotionale Placeholder — keine technische Suchmaschine

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { normalizeProfileInput, PROFILE_FIELDS } from '../lib/perfUtils';

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.22)",
  coral:"#FF8A6B", gold:"#F5A623",
  cream:"#F9F6F2", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A",
  muted:"#888", muted2:"#BBB",
  border:"rgba(0,0,0,0.07)",
};

const PLACEHOLDERS = [
  "Was bewegt dich heute?",
  "Finde Menschen, Werke oder Erlebnisse",
  "Wonach suchst du gerade?",
  "Entdecke Talente in deiner Nähe",
  "Suche nach Skills, Orten oder Ideen…",
  "Welche Geschichte willst du entdecken?",
];

const CSS = `
  @keyframes fadeSlideIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  @keyframes resultsIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  .hsb-scroll::-webkit-scrollbar{display:none}
  .hsb-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .hsb-tap{-webkit-tap-highlight-color:transparent;cursor:pointer;border:none;background:none;font-family:inherit}
  .hsb-tap:active{transform:scale(0.95)!important}
`;

export default function HuiSearchBar({ onMatchClick, onKarteClick }) {
  const [phIdx,     setPhIdx]     = useState(0);
  const [phVisible, setPhVisible] = useState(true);
  const [query,     setQuery]     = useState("");
  const [focused,   setFocused]   = useState(false);
  const [results,   setResults]   = useState(null); // null=idle
  const [loading,   setLoading]   = useState(false);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);

  // Rotate placeholder every 3.5s
  useEffect(() => {
    const t = setInterval(() => {
      setPhVisible(false);
      setTimeout(() => {
        setPhIdx(i => (i + 1) % PLACEHOLDERS.length);
        setPhVisible(true);
      }, 280);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  // Debounced full-text search across Supabase
  useEffect(() => {
    if (!query.trim()) { setResults(null); setLoading(false); return; }
    clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const q = query.trim().toLowerCase();
        const [profileRes, workRes, expRes] = await Promise.all([
          supabase.from("profiles")
            .select(PROFILE_FIELDS)
            .eq("has_talent_profile",true)
            .or(`display_name.ilike.%${q}%,bio.ilike.%${q}%,location.ilike.%${q}%`)
            .limit(6),
          supabase.from("works")
            .select("id,title,cover_url,price,description")
            .eq("status","published")
            .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
            .limit(5),
          supabase.from("experiences")
            .select("id,title,cover_url,price,description,location")
            .eq("status","published")
            .or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`)
            .limit(5),
        ]);
        const merged = [
          // normalizeProfileInput: Feldnamen angleichen für WirkerProfilePage routing
          ...(profileRes.data||[]).map(p=>({...normalizeProfileInput(p),_type:"talent",type:"wirker"})),
          ...(workRes.data||[]).map(w=>({...w,_type:"werk",type:"werk"})),
          ...(expRes.data||[]).map(e=>({...e,_type:"erlebnis",type:"erlebnis"})),
        ];
        setResults(merged);
      } catch(e) {
        setResults([]);
      }
      setLoading(false);
    }, 420);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function clearSearch() {
    setQuery("");
    setResults(null);
    inputRef.current?.blur();
    setFocused(false);
  }

  const TYPE_COLOR = { talent:C.teal, werk:C.gold, erlebnis:C.coral };
  const TYPE_LABEL = { talent:"Talent", werk:"Werk", erlebnis:"Erlebnis" };

  return (
    <>
      <style>{CSS}</style>
      <div style={{ padding:"8px 12px 6px",
        background:"rgba(249,247,244,0.94)",
        backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
        borderBottom:`1px solid ${C.border}`,
        position:"sticky",top:0,zIndex:50 }}>

        <div style={{ display:"flex",alignItems:"center",gap:8 }}>

          {/* Search input */}
          <div style={{ flex:1,position:"relative",
            display:"flex",alignItems:"center" }}>
            {/* Search icon */}
            <div style={{ position:"absolute",left:12,
              pointerEvents:"none",zIndex:1,
              display:"flex",alignItems:"center" }}>
              {loading
                ? <div style={{ width:14,height:14,borderRadius:"50%",
                    border:`2px solid ${C.teal}`,borderTopColor:"transparent",
                    animation:"spin .7s linear infinite" }}/>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={focused ? C.teal : C.muted2}
                    strokeWidth="2.2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
              }
            </div>

            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(()=>setFocused(false), 200)}
              style={{ width:"100%",boxSizing:"border-box",
                padding:"11px 36px 11px 34px",
                borderRadius:50,
                background: focused
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(0,0,0,0.055)",
                border:`1.5px solid ${focused ? C.teal+"66" : "transparent"}`,
                outline:"none",fontSize:14,color:C.ink,
                fontFamily:"inherit",
                boxShadow: focused ? `0 0 0 3px ${C.tealGlow}` : "none",
                transition:"all .22s cubic-bezier(.34,1.2,.64,1)" }}
            />

            {/* Animated placeholder — only when no query */}
            {!query && (
              <div style={{ position:"absolute",left:34,right:36,
                pointerEvents:"none",
                fontSize:13,color:C.muted,
                overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",
                opacity: phVisible ? 1 : 0,
                transform: phVisible ? "translateY(0)" : "translateY(-3px)",
                transition:"opacity .25s ease, transform .25s ease" }}>
                {PLACEHOLDERS[phIdx]}
              </div>
            )}

            {/* Clear button */}
            {query && (
              <button className="hsb-tap" onClick={clearSearch}
                style={{ position:"absolute",right:10,
                  width:20,height:20,borderRadius:"50%",
                  background:"rgba(0,0,0,0.12)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:9,color:C.muted,fontWeight:900,
                  transition:"transform .15s" }}>
                ✕
              </button>
            )}
          </div>

          {/* HUI Match Button */}
          <button className="hsb-tap" onClick={onMatchClick}
            style={{ width:38,height:38,borderRadius:50,flexShrink:0,
              background:`linear-gradient(135deg,${C.coral},${C.gold})`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:16,
              boxShadow:"0 2px 10px rgba(255,138,107,0.35)",
              transition:"transform .18s, box-shadow .18s" }}
            title="HUI Match">
            ✨
          </button>

          {/* Karte Button — HUI SVG Icon */}
          <button className="hsb-tap" onClick={onKarteClick}
            style={{ width:38,height:38,borderRadius:50,flexShrink:0,
              background:`linear-gradient(135deg,${C.teal}18,${C.teal}0A)`,
              border:`1.5px solid ${C.teal}40`,
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:`0 2px 8px ${C.tealGlow}`,
              transition:"transform .18s, box-shadow .18s" }}
            title="Karte">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="map-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor={C.teal}/>
                  <stop offset="100%" stopColor={C.teal2}/>
                </linearGradient>
              </defs>
              {/* Pin */}
              <path d="M12 2C8.69 2 6 4.69 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.31-2.69-6-6-6z"
                fill={`${C.teal}22`} stroke="url(#map-grad)" strokeWidth="1.6" strokeLinejoin="round"/>
              <circle cx="12" cy="8" r="2.2"
                fill="url(#map-grad)"/>
              {/* Ground ring */}
              <ellipse cx="12" cy="21" rx="4" ry="1.2"
                fill={`${C.teal}30`}/>
            </svg>
          </button>
        </div>

        {/* ── Inline Search Results Dropdown ── */}
        {focused && results !== null && query.trim() && (
          <div className="hsb-scroll"
            style={{ marginTop:8,
              background:C.card,
              borderRadius:18,
              maxHeight:320,overflowY:"auto",
              boxShadow:"0 8px 32px rgba(0,0,0,0.12)",
              border:`1px solid ${C.border}`,
              animation:"resultsIn .25s ease both" }}>

            {results.length === 0 ? (
              <div style={{ padding:"20px 16px",textAlign:"center" }}>
                <div style={{ fontSize:22,marginBottom:6 }}>🌱</div>
                <div style={{ fontSize:13,color:C.muted }}>Keine Treffer für „{query}"</div>
                <button className="hsb-tap" onClick={onMatchClick}
                  style={{ marginTop:10,padding:"8px 18px",borderRadius:50,
                    background:`linear-gradient(135deg,${C.teal},${C.teal2})`,
                    color:"white",fontSize:12,fontWeight:700 }}>
                  HUI Match versuchen ✨
                </button>
              </div>
            ) : (
              results.map((item, i) => {
                const name  = item.display_name || item.title || "—";
                const sub   = item.bio?.slice(0,40) || item.description?.slice(0,35) || item.location || "";
                const img   = item.avatar_url || item.cover_url;
                const color = TYPE_COLOR[item._type] || C.muted;
                const label = TYPE_LABEL[item._type] || "";
                return (
                  <div key={item.id||i}
                    style={{ display:"flex",alignItems:"center",gap:12,
                      padding:"10px 14px",
                      borderBottom: i < results.length-1 ? `1px solid ${C.border}` : "none",
                      cursor:"pointer",
                      WebkitTapHighlightColor:"transparent",
                      transition:"background .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.cream}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    {/* Avatar */}
                    <div style={{ width:36,height:36,borderRadius:10,flexShrink:0,
                      overflow:"hidden",
                      background:`linear-gradient(135deg,${color}33,${color}18)`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:14,fontWeight:800,color }}>
                      {img
                        ? <img src={img} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                        : name[0]?.toUpperCase()
                      }
                    </div>
                    {/* Text */}
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontWeight:700,fontSize:13,color:C.ink,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                        {name}
                      </div>
                      {sub && (
                        <div style={{ fontSize:11,color:C.muted,marginTop:1,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                          {sub}
                        </div>
                      )}
                    </div>
                    {/* Type badge */}
                    <span style={{ fontSize:10,fontWeight:800,color,
                      background:`${color}15`,borderRadius:50,padding:"2px 8px",
                      flexShrink:0 }}>
                      {label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
}