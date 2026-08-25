// src/components/discover/OrtSection.jsx
// OrteSection + OrtCard — extracted from DiscoverPage.jsx.
import React from "react";
import { T, safeStr } from "./constants.js";
import { Skel, SectionHead } from "./atoms.jsx";
import { HUILogo } from "../brand/HUILogo.jsx";
import { HUILocationIcon } from "../../design/icons/HuiSystemIcons.jsx";
import { getPlaceImage } from "../../lib/placeImage.js";

export function OrteSection({ orte=[], loading, onSectionAction, onPressOrt, delay=0 }) {
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <SectionHead
        title="Orte entdecken"
        sub="Echte Orte aus HUI-Profilen, Werken & Erlebnissen."
        action="Alle Orte"
        onAction={onSectionAction}
        delay={delay}
      />
      <div className="dp-hscroll" style={{ display:"flex", gap:8, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
        {loading
          ? Array.from({length:4}).map((_,i) => (
              <div key={i} style={{ width:165, flexShrink:0, borderRadius:CARD_RADIUS, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                <Skel w="100%" h={120} r={0} />
                <div style={{ padding:"10px 11px 12px" }}>
                  <Skel w="80%" h={12} r={6} mb={6} />
                  <Skel w="50%" h={9} r={6} />
                </div>
              </div>
            ))
          : orte.length === 0
          ? <div style={{ paddingLeft:T.px, fontSize:12.5, color:T.inkFaint, fontStyle:'italic', opacity:0.75 }}>Noch keine Orte gefunden.</div>
          : orte.map((ort, i) => <OrtCard key={ort.place_key} ort={ort} delay={i*30+delay} onPress={() => onPressOrt?.(ort.place_key)} />)
        }
      </div>
    </div>
  );
}

export function OrtCard({ ort, delay=0, onPress }) {
  const [sightUrl, setSightUrl] = useState(null);
  const [imgErr, setImgErr]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPlaceImage(ort.place_key).then(url => { if (!cancelled) setSightUrl(url); });
    return () => { cancelled = true; };
  }, [ort.place_key]);

  const cover = (!imgErr && sightUrl) ? sightUrl : null;

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={onPress} style={{
      width:165, flexShrink:0,
      borderRadius:CARD_RADIUS, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      display:"flex", flexDirection:"column",
    }}>
      <div style={{ width:"100%", height:120, flexShrink:0, overflow:"hidden", position:"relative", background:cover ? "#1A1A18" : T.tealSoft, display:"flex", alignItems:"center", justifyContent:"center" }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={optimizeCard(cover)} alt={ort.place_key} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <HUILogo size={40} style={{opacity:0.55}} />
        )}
        <div style={{
          position:"absolute", top:6, right:6,
          background:"rgba(255,255,255,0.90)", backdropFilter:"blur(6px)",
          borderRadius:99, padding:"1px 7px",
          fontSize:9.5, fontWeight: 600, color:T.tealDeep,
        }}>
          {ort.total_count}
        </div>
      </div>
      <div style={{ padding:"10px 11px 12px", display:"flex", flexDirection:"column", flexGrow:1 }}>
        <div style={{ fontSize:13, fontWeight: 600, color:T.ink, marginBottom:5, lineHeight:1.25,
          overflow:"hidden", display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical" }}>
          {ort.place_key}
        </div>
        <div style={{ marginTop:"auto", display:"flex", alignItems:"center", gap:6, fontSize:10, color:T.inkFaint, fontWeight:600, flexWrap:"wrap" }}>
          {ort.people_count > 0 && <span>👥 {ort.people_count}</span>}
          {ort.works_count > 0 && <span>🎨 {ort.works_count}</span>}
          {ort.experiences_count > 0 && <span>🎉 {ort.experiences_count}</span>}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
/**
 * Gemeinsamer Umkreisfilter fuer Werke/Erlebnisse -- gleiche Logik wie der
 * bestehende Talente-Filter (siehe displayTalente unten), aber als kleine
 * Hilfsfunktion statt ein drittes Mal ausgeschrieben. isOnlineFn entscheidet,
 * ob ein Eintrag standortunabhaengig ist (bleibt dann immer sichtbar).
 */
