import React, { useState } from "react";
import { T, MEDIUM_COLOR, TALENT_LOCATION_LABEL } from "../tokens.js";
import { HUIImpactIcon } from "../../../../design/icons/HuiSystemIcons.jsx";
import { CARD_RADIUS, CardBadge, CardTitle, CardLocationRow } from "../components/CardPrimitives.jsx";

export function TalentCard({ talent, delay=0, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const cover  = (!imgErr && talent.cover) ? talent.cover : null;
  const medCol = MEDIUM_COLOR[talent.category] || { bg:T.tealSoft, text:T.teal };
  const priceStr = talent.price_per_hour != null
    ? parseFloat(talent.price_per_hour).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €/Std"
    : talent.price_per_session != null
      ? parseFloat(talent.price_per_session).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €/Termin"
      : null;
  const locationLabel = TALENT_LOCATION_LABEL[talent.location_type] || null;

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(talent)} style={{
      width:165, flexShrink:0,
      borderRadius:CARD_RADIUS, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      display:"flex", flexDirection:"column",
    }}>
      {/* Cover */}
      <div style={{ width:"100%", height:120, position:"relative", overflow:"hidden", background:cover ? "#1A1A18" : medCol.bg }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={cover} alt={talent.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6 }}>
            <HUIImpactIcon size={32} style={{opacity:0.3, color:"rgba(14,196,184,0.5)"}} />
          </div>
        )}
        {/* Kategorie-Badge oben links */}
        {talent.category && (
          <CardBadge pos="left" bg={medCol.bg} color={medCol.text} cover={cover}>
            {talent.category}
          </CardBadge>
        )}
      </div>

      {/* Info — flex-column damit Preis immer unten sitzt */}
      <div style={{ padding:"10px 11px 12px", display:"flex", flexDirection:"column", flexGrow:1 }}>
        {/* Titel */}
        <CardTitle>{talent.title}</CardTitle>

        {/* Anbieter */}
        <div style={{ fontSize:10.5, color:T.inkFaint, fontWeight:400, marginBottom:6 }}>
          von {talent.author}
        </div>

        {/* Standort/Ort — nimmt Platz ein oder nicht, Preis bleibt unten */}
        <div style={{ minHeight:20 }}>
          <CardLocationRow location={locationLabel} distanceKm={talent.distanceKm}/>
        </div>

        {/* Preis — immer am unteren Rand */}
        <div style={{ marginTop:"auto", paddingTop:4, display:"flex", alignItems:"center" }}>
          {priceStr ? (
            <div style={{ fontSize:14, fontWeight:800, color:T.teal, letterSpacing:"-0.02em" }}>
              {priceStr}
            </div>
          ) : (
            <div style={{ fontSize:10.5, color:T.inkFaint, fontStyle:"italic" }}>Preis auf Anfrage</div>
          )}
        </div>
      </div>
    </div>
  );
}
