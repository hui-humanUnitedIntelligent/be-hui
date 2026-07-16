import React, { useState } from "react";
import { T, MEDIUM_COLOR } from "../tokens.js";
import { HUIWerkeIcon } from "../../../../design/icons/HuiSystemIcons.jsx";
import { CARD_RADIUS, CardBadge, CardTitle, CardLocationRow } from "../components/CardPrimitives.jsx";

export function WerkCard({ werk, delay=0, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const cover  = (!imgErr && werk.cover) ? werk.cover : null;
  const medCol = MEDIUM_COLOR[werk.medium] || { bg:T.tealSoft, text:T.teal };
  const priceStr = werk.price != null
    ? parseFloat(werk.price).toLocaleString("de-DE", { minimumFractionDigits:0 }) + " €"
    : null;

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(werk)} style={{
      width:165, flexShrink:0,
      borderRadius:CARD_RADIUS, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      display:"flex", flexDirection:"column",
    }}>
      {/* Cover — feste Höhe, nie gestaucht */}
      <div style={{ width:"100%", height:120, flexShrink:0, position:"relative", overflow:"hidden", background:cover ? "#1A1A18" : medCol.bg }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={cover} alt={werk.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6 }}>
            <HUIWerkeIcon size={32} style={{opacity:0.3, color:"rgba(14,196,184,0.5)"}} />
          </div>
        )}
        {/* Kategorie-Badge oben links */}
        {werk.medium && (
          <CardBadge pos="left" bg={medCol.bg} color={medCol.text} cover={cover}>
            {werk.medium}
          </CardBadge>
        )}
      </div>

      {/* Info — flexGrow:1 füllt den Rest, flex-column für marginTop:auto */}
      <div style={{ padding:"10px 11px 12px", flexGrow:1, display:"flex", flexDirection:"column" }}>
        {/* Titel */}
        <CardTitle>{werk.title}</CardTitle>

        {/* Autor */}
        <div style={{ fontSize:10.5, color:T.inkFaint, fontWeight:400, marginBottom:6 }}>
          von {werk.author}
        </div>

        {/* Standort — reservierter Platz damit Preis nicht springt */}
        <div style={{ minHeight:20 }}>
          <CardLocationRow location={werk.location} distanceKm={werk.distanceKm}/>
        </div>

        {/* Preis — immer am unteren Rand, unabhängig vom Ort */}
        <div style={{ marginTop:"auto", paddingTop:4 }}>
          <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
            {priceStr ? (
              <div style={{ fontSize:14, fontWeight:800, color:T.teal, letterSpacing:"-0.02em" }}>
                {priceStr}
              </div>
            ) : (
              <div style={{ fontSize:10.5, color:T.inkFaint, fontStyle:"italic" }}>Nicht zum Verkauf</div>
            )}
          </div>
          {/* Likes + Views */}
          <div className="dp-engage">
            <span><HUIHeartIcon size={12} /> {werk.likes ?? Math.floor(5 + (werk.id?.charCodeAt?.(werk.id.length-1)??9) % 40)}</span>
            <span style={{display:"flex",alignItems:"center",gap:2}}><HUIAnsichtIcon size={12}/>{werk.views ?? Math.floor(50 + (werk.id?.charCodeAt?.(0)??5) % 400)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Umkreissuche-Zeile fuer Werke/Erlebnisse -- identisches UI-Muster wie in
 * TalenteSection (siehe dort), nutzt aber denselben globalen radius-Zustand
 * (radiusKm/radiusStages/onRadiusChange kommen 1:1 aus useRadiusFilter()).
 * Bewusst als eigene kleine Komponente statt TalenteSection zu refactorn --
 * geringeres Konfliktrisiko mit der parallel laufenden Radius-Vereinheit-
 * lichungs-Session, gleiches Verhalten.
 */
