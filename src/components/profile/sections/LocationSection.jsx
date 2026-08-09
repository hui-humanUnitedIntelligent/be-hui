// src/components/profile/sections/LocationSection.jsx
// ══════════════════════════════════════════════════════════════════════
// LOCATION SECTION — Standorte (mehrere möglich)
// Owner: Standorte hinzufügen (mit Autovervollständigung) + löschen
// Visitor: Read-only Liste. Empty-State statt null.
// Daten: profile_locations (Standort-DB.md 20260706), Migration 066
// ══════════════════════════════════════════════════════════════════════
import { HUILocationIcon } from '../../../design/icons/HuiSystemIcons.jsx';
import React, { useState, useRef, useEffect } from "react";
import { useProfileLocations } from "../../../hooks/useProfileLocations.js";
import { searchPlaces } from "../../../lib/geocoding.js";

const T = {
  bgCard:"#FFFFFF", ink:"#1A1A18", inkSoft:"#4A4A45", inkFaint:"#8C8C85",
  teal:"#0EC4B8", tealMid:"rgba(14,196,184,0.22)", tealSoft:"rgba(14,196,184,0.08)",
  coral:"#FF6B6B",
  border:"rgba(26,26,24,0.08)", r12:12, r16:16, r99:99, px:16,
  card:"0 1px 3px rgba(0,0,0,0.04),0 4px 20px rgba(0,0,0,0.06)",
};

export function LocationSection({
  profile  = null,
  isOwner  = false,
  loading  = false,
}) {
  const profileId = profile?.id || null;
  const { locations, loading: locLoading, addLocation, deleteLocation } = useProfileLocations(profileId);

  const [adding, setAdding]   = useState(false);
  const [query, setQuery]     = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!adding || query.trim().length < 2) { setSuggestions([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchPlaces(query);
      setSuggestions(res);
      setSearching(false);
    }, 450);
    return () => clearTimeout(debounceRef.current);
  }, [query, adding]);

  const handlePick = async (place) => {
    setSaving(true); setErr("");
    const res = await addLocation({ label: place.label, lat: place.lat, lng: place.lng });
    setSaving(false);
    if (!res.ok) { setErr(res.error || "Konnte Standort nicht speichern."); return; }
    setAdding(false); setQuery(""); setSuggestions([]);
  };

  const handleDelete = async (id) => {
    setSaving(true);
    await deleteLocation(id);
    setSaving(false);
    setConfirmDelete(null);
  };

  const isLoading = loading || locLoading;

  if (isLoading) return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{ height:72, borderRadius:T.r16, border:`1px solid ${T.border}`,
        background:"linear-gradient(90deg,#ede9e2 25%,#f7f5f0 50%,#ede9e2 75%)",
        backgroundSize:"200% 100%", animation:"ps-shimmer 1.4s ease-in-out infinite" }}/>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <style>{`@keyframes ps-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.ls-press{-webkit-tap-highlight-color:transparent;transition:opacity .12s ease}.ls-press:active{opacity:.65}`}</style>
      <div style={{ background:T.bgCard, borderRadius:T.r16,
        border:`1px solid ${adding ? T.tealMid : T.border}`,
        padding:"14px", boxShadow:T.card, transition:"border-color .2s ease" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:800, color:T.ink }}>Standort{locations.length > 1 ? "e" : ""}</div>
          {isOwner && !adding && (
            <button onClick={() => { setAdding(true); setErr(""); }} className="ls-press"
              style={{ background:"none", border:"none", padding:0, fontSize:11,
                color:T.teal, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              + Hinzufügen
            </button>
          )}
        </div>

        {/* ── Liste bestehender Standorte ── */}
        {locations.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom: adding ? 10 : 0 }}>
            {locations.map(loc => (
              <div key={loc.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 8px",
                borderRadius:T.r12, background:"rgba(26,26,24,0.03)", border:`1px solid ${T.border}` }}>
                <HUILocationIcon size={14} style={{flexShrink:0, color:"rgba(14,196,184,0.6)"}} />
                <span style={{ fontSize:11.5, color:T.ink, fontWeight:500, flex:1, minWidth:0,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {loc.label}
                </span>
                {loc.is_primary && locations.length > 1 && (
                  <span style={{ fontSize:9, fontWeight:700, color:T.teal, background:T.tealSoft,
                    padding:"2px 6px", borderRadius:T.r99, flexShrink:0 }}>Primär</span>
                )}
                {isOwner && (
                  confirmDelete === loc.id ? (
                    <div style={{ display:"flex", gap:4, flexShrink:0 }}>
                      <button onClick={() => handleDelete(loc.id)} disabled={saving} className="ls-press"
                        style={{ background:T.coral, border:"none", borderRadius:T.r99, color:"#fff",
                          fontSize:10, fontWeight:700, padding:"3px 8px", cursor:"pointer", fontFamily:"inherit" }}>
                        Löschen
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="ls-press"
                        style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:T.r99,
                          color:T.inkSoft, fontSize:10, padding:"3px 8px", cursor:"pointer", fontFamily:"inherit" }}>
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(loc.id)} className="ls-press"
                      style={{ background:"none", border:"none", color:T.inkFaint, fontSize:15,
                        cursor:"pointer", flexShrink:0, padding:"0 2px", lineHeight:1 }}>
                      ×
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Empty-State ── */}
        {locations.length === 0 && !adding && (
          isOwner ? (
            <button onClick={() => { setAdding(true); setErr(""); }} className="ls-press"
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 8px",
                borderRadius:T.r12, background:"rgba(26,26,24,0.03)", border:`1px solid ${T.border}`,
                cursor:"pointer", width:"100%", fontFamily:"inherit" }}>
              <HUILocationIcon size={14} style={{flexShrink:0, color:"rgba(14,196,184,0.6)"}} />
              <span style={{ fontSize:11.5, color:T.inkFaint }}>Standort hinzufügen</span>
            </button>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 8px",
              borderRadius:T.r12, background:"rgba(26,26,24,0.03)", border:`1px solid ${T.border}` }}>
              <HUILocationIcon size={14} style={{flexShrink:0, color:"rgba(14,196,184,0.6)"}} />
              <span style={{ fontSize:11.5, color:T.inkFaint }}>Standort nicht angegeben</span>
            </div>
          )
        )}

        {/* ── Hinzufügen: Autocomplete-Eingabe ── */}
        {adding && (
          <div style={{ position:"relative" }}>
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="z.B. Berlin, Deutschland"
              style={{ width:"100%", padding:"8px 10px", borderRadius:T.r12,
                border:`1.5px solid ${T.teal}`, outline:"none",
                fontSize:12, color:T.ink, fontFamily:"inherit", boxSizing:"border-box" }}/>

            {(searching || suggestions.length > 0) && (
              <div style={{ marginTop:4, borderRadius:T.r12, border:`1px solid ${T.border}`,
                background:T.bgCard, boxShadow:T.card, overflow:"hidden" }}>
                {searching && (
                  <div style={{ padding:"8px 10px", fontSize:11, color:T.inkFaint }}>Suche…</div>
                )}
                {!searching && suggestions.map((s, i) => (
                  <button key={i} onClick={() => handlePick(s)} disabled={saving} className="ls-press"
                    style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 10px",
                      background:"none", border:"none", borderTop: i>0 ? `1px solid ${T.border}` : "none",
                      fontSize:11.5, color:T.ink, cursor: saving ? "default" : "pointer", fontFamily:"inherit" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {err && (
              <div style={{ marginTop:6, fontSize:11, color:T.coral }}>{err}</div>
            )}

            <div style={{ display:"flex", gap:6, marginTop:8 }}>
              <button onClick={() => { setAdding(false); setQuery(""); setSuggestions([]); setErr(""); }}
                style={{ flex:1, padding:"7px", borderRadius:T.r99,
                  border:`1px solid ${T.border}`, background:"none",
                  fontSize:11, color:T.inkSoft, cursor:"pointer", fontFamily:"inherit" }}>
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default LocationSection;
