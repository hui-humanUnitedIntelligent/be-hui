import React, { useCallback, memo } from "react";
import BaseFeedCard from "./BaseFeedCard.jsx";
import { useContentPreview } from "../../context/ContentPreviewContext.jsx";

const MomentContent = memo(function MomentContent({ item, onProfile, onReaction, onShare }) {
  if (!item) return null;
  const text = item.text || item.title || "";
  const { open } = useContentPreview();
  const handleCardClick = useCallback(() => open(item), [open, item]);

  return (
    <BaseFeedCard item={item} onProfile={onProfile} onReaction={onReaction} onShare={onShare}
      onCardClick={handleCardClick}>
      {text ? (
        <p style={{
          margin:0, fontSize:16, lineHeight:1.6,
          color:"rgba(26,26,46,0.82)", fontWeight:400,
          letterSpacing:"-0.01em",
        }}>{text}</p>
      ) : null}
    </BaseFeedCard>
  );
});

export default MomentContent;
