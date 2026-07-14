// src/feed/cards/FeedRouter.jsx — HUI FEED ROUTER (Phase 1)
import { HUIImpactIcon } from '../../design/icons/HuiSystemIcons.jsx';
import React from "react";
import { toFeedItem } from "../../system/feed/unifiedNormalizer.js";
import MomentContent     from "./MomentContent.jsx";
import ExperienceContent from "./ExperienceContent.jsx";
import WorkContent       from "./WorkContent.jsx";
import EventContent      from "./EventContent.jsx";

class CardErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { crashed:false }; }
  static getDerivedStateFromError() { return { crashed:true }; }
  componentDidCatch(err) { console.error("[HUI_CARD_CRASH]", this.props.itemId, this.props.itemType, err?.message); }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{margin:"0 12px 14px",padding:"14px 16px",borderRadius:28,
          background:"rgba(249,247,244,0.9)",border:"1px solid rgba(26,26,46,0.06)",
          boxShadow:"0 2px 16px rgba(26,26,46,0.07)",display:"flex",alignItems:"center",gap:10}}>
          <HUIImpactIcon size={20} style={{opacity:0.5, color:"rgba(14,196,184,0.6)"}} />
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#1A1A2E"}}>{this.props.authorName||"Human"}</div>
            {this.props.text && (
              <div style={{fontSize:13,color:"rgba(26,26,46,0.6)",marginTop:3,lineHeight:1.5}}>
                {String(this.props.text).slice(0,120)}
              </div>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function FeedRouter({ item: rawItem, onProfile, onReaction, onBook, onDetail, onShare, itemReactions }) {
  const item = React.useMemo(() => {
    if (!rawItem?.id) return null;
    // Already unified shape? (has author object)
    if (rawItem.author && typeof rawItem.author === "object" && rawItem.createdAt !== undefined) {
      return { ...rawItem, _reactions: itemReactions || rawItem._reactions || {} };
    }
    const n = toFeedItem(rawItem);
    if (!n) return null;
    return { ...n, _reactions: itemReactions || {} };
  }, [rawItem, itemReactions]);

  if (!item) {
    console.warn("[FEED_ITEM_INVALID] FeedRouter got null item from", rawItem);
    return null;
  }

  const type       = item.type || "moment";
  const authorName = item.author?.name || "Human";
  const text       = item.text || item.title || "";

  // ── AUTHOR ID: aus ALLEN möglichen Quellen extrahieren ──────
  // Priorität: normalisiertes item.author.id > rawItem DB-Felder
  const _rawAuthorId = (
    item?.author?.id
    || item?.author?.user_id
    || rawItem?.user_id
    || rawItem?.creator_id
    || rawItem?.author_id
    || null
  );
  // UUID ist mind. 32 Zeichen — leere Strings und kurze Fallbacks ablehnen
  const authorId   = (_rawAuthorId && _rawAuthorId.trim().length > 8) ? _rawAuthorId.trim() : null;
  const hasValidId = !!authorId;

  const shared = {
    item,
    onProfile: hasValidId
      ? () => onProfile?.(authorId)
      : (() => {
          console.warn("🔴 STEP 2 — FeedRouter: kein authorId", {
            "item.author": item?.author,
            "rawItem.user_id": rawItem?.user_id,
            _rawAuthorId,
            hasValidId,
          });
          return null;
        })(),
    onReaction: (t) => onReaction?.(t),
    onShare:    () => onShare?.(rawItem),
  };

  return (
    <CardErrorBoundary itemId={item.id} itemType={type} authorName={authorName} text={text}>
      {type === "experience" ? <ExperienceContent {...shared} onBook={()=>onBook?.(rawItem)}/> :
       type === "work"       ? <WorkContent {...shared} onDetail={()=>onDetail?.(item)} onBuyWerk={onBook ? ()=>onBook(rawItem) : undefined}/> :
       type === "event"      ? <EventContent {...shared}/> :
                               <MomentContent {...shared}/>}
    </CardErrorBoundary>
  );
}

export { toFeedItem as resolveType };
