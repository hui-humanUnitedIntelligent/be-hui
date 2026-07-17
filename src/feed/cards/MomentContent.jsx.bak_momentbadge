import React from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";

// OPEN.1 (2026-07-08): Momente/Beitraege hatten appweit KEINEN Tap-Handler
// auf der Karte (nur Aktions-Icons darunter) -- jetzt oeffnet die Karte
// die geteilte Vorschau (Titelbild/Text/Autor/Datum/Resonanz/Kommentare).
export default function MomentContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;
  const text = item.text || item.title || "";
  const { open } = useContentPreview();

  return (
    <BaseFeedCard item={item} onProfile={onProfile} onReaction={onReaction} onShare={onShare}
      onCardClick={() => open(item)}>
      {text ? (
        <p style={{
          margin:0, fontSize:16, lineHeight:1.6,
          color:"rgba(26,26,46,0.82)", fontWeight:400,
          letterSpacing:"-0.01em",
        }}>{text}</p>
      ) : null}
    </BaseFeedCard>
  );
}
