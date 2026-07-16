import React, { useState } from "react";
import { T } from "../tokens.js";
import { HUIKalenderIcon } from "../../../../design/icons/HuiSystemIcons.jsx";
import { CARD_RADIUS, CardBadge, CardTitle, CardLocationRow } from "../components/CardPrimitives.jsx";

export function ErlebnisCard({ erlebnis, delay=0, onPress }) {
  const [imgErr, setImgErr] = useState(false);
  const cover = (!imgErr && erlebnis.cover) ? erlebnis.cover : null;

  // Status-Farben
  const STATUS_DOT = {
    "Aktiv":        "#16A34A",
    "Geplant":      "#D97706",
    "Abgeschlossen":"rgba(26,26,46,0.35)",
  };
  const statusDot   = STATUS_DOT[erlebnis.statusLabel] || T.inkFaint;
  const statusColor = erlebnis.statusColor || T.inkFaint;

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(erlebnis)} style={{
      width:165, flexShrink:0,
      borderRadius:CARD_RADIUS, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
    }}>
      {/* Cover */}
      <div style={{ width:"100%", height:120, position:"relative", overflow:"hidden", background:cover ? "#1A1A18" : T.tealSoft }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={cover} alt={erlebnis.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", opacity:0.88 }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <HUIKalenderIcon size={36} style={{opacity:0.35, color:"rgba(14,196,184,0.5)"}} />
          </div>
        )}

        {/* Datum-Block oben links — nur wenn Datum vorhanden */}
        {erlebnis.date && (
          <div style={{
            position:"absolute", top:8, left:8,
            background:"rgba(255,255,255,0.94)", backdropFilter:"blur(8px)",
            borderRadius:10, padding:"5px 9px", textAlign:"center", minWidth:36,
          }}>
            <div style={{ fontSize:16, fontWeight:900, color:T.ink, lineHeight:1 }}>
              {erlebnis.date}
            </div>
            {erlebnis.month && (
              <div style={{ fontSize:8.5, fontWeight:700, color:T.inkSoft, textTransform:"uppercase", letterSpacing:".04em", marginTop:1 }}>
                {erlebnis.month}
              </div>
            )}
          </div>
        )}

        {/* Typ-Badge oben rechts */}
        {erlebnis.typeLabel && (
          <CardBadge pos="right" bg="rgba(14,196,184,0.15)" color={T.teal} cover={cover}>
            {erlebnis.typeLabel}
          </CardBadge>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:"10px 11px 12px" }}>
        {/* Titel */}
        <CardTitle>{erlebnis.title}</CardTitle>

        {/* Standort */}
        <CardLocationRow location={erlebnis.location} distanceKm={erlebnis.distanceKm}/>

        {/* Dauer falls vorhanden */}
        {erlebnis.time && (
          <div style={{ fontSize:10.5, color:T.teal, fontWeight:600, marginBottom:4 }}>
            {erlebnis.time}
          </div>
        )}

        {/* Status-Dot */}
        {erlebnis.statusLabel && (
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{
              width:6, height:6, borderRadius:"50%",
              background:statusDot, flexShrink:0, display:"inline-block",
            }}/>
            <span style={{ fontSize:10.5, fontWeight:600, color:statusColor }}>
              {erlebnis.statusLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

