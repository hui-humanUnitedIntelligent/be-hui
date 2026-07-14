// src/feed/cards/FeedRouter.jsx — HUI FEED ROUTER (Phase 1)
import { HUIImpactIcon } from '../../design/icons/HuiSystemIcons.jsx';
import React, { useMemo, useCallback, memo } from "react";
import { toFeedItem } from "../../system/feed/unifiedNormalizer.js";
import { profMark } from "./feedCardProfiler.js";

// Eager imports: kein Suspense-Fallback beim ersten Paint (lazy chunk blockierte Text/Avatar)
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

function feedRouterPropsAreEqual(prev, next) {
  if (prev.onProfile !== next.onProfile) return false;
  if (prev.onReaction !== next.onReaction) return false;
  if (prev.onBook !== next.onBook) return false;
  if (prev.onDetail !== next.onDetail) return false;
  if (prev.onShare !== next.onShare) return false;
  const a = prev.item, b = next.item;
  if (!a || !b) return a === b;
  if (a.id !== b.id || a.type !== b.type) return false;
  const ar = a._reactions || {}, br = b._reactions || {};
  return (
    a.author === b.author &&
    a.media === b.media &&
    a.title === b.title &&
    a.text === b.text &&
    ar.inspired === br.inspired &&
    ar.touched === br.touched &&
    ar.saved === br.saved
  );
}

const FeedRouter = memo(function FeedRouter({ item: rawItem, onProfile, onReaction, onBook, onDetail, onShare, itemReactions }) {
  const item = useMemo(() => {
    if (!rawItem?.id) return null;
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

  if (item.id) profMark(item.id, "data");

  const type       = item.type || "moment";
  const authorName = item.author?.name || "Human";
  const text       = item.text || item.title || "";

  const _rawAuthorId = (
    item?.author?.id
    || item?.author?.user_id
    || rawItem?.user_id
    || rawItem?.creator_id
    || rawItem?.author_id
    || null
  );
  const authorId   = (_rawAuthorId && _rawAuthorId.trim().length > 8) ? _rawAuthorId.trim() : null;
  const hasValidId = !!authorId;

  const handleProfile = useCallback(() => {
    if (!hasValidId) {
      console.warn("🔴 STEP 2 — FeedRouter: kein authorId", {
        "item.author": item?.author,
        "rawItem.user_id": rawItem?.user_id,
        _rawAuthorId,
        hasValidId,
      });
      return;
    }
    onProfile?.(authorId);
  }, [hasValidId, authorId, onProfile, item?.author, rawItem?.user_id, _rawAuthorId]);

  const handleReaction = useCallback((t) => onReaction?.(t), [onReaction]);
  const handleShare    = useCallback(() => onShare?.(rawItem), [onShare, rawItem]);
  const handleBook     = useCallback(() => onBook?.(rawItem), [onBook, rawItem]);
  const handleDetail   = useCallback(() => onDetail?.(item), [onDetail, item]);
  const handleBuyWerk  = useCallback(() => onBook?.(rawItem), [onBook, rawItem]);

  const shared = useMemo(() => ({
    item,
    onProfile: handleProfile,
    onReaction: handleReaction,
    onShare: handleShare,
  }), [item, hasValidId, handleProfile, handleReaction, handleShare]);

  return (
    <CardErrorBoundary itemId={item.id} itemType={type} authorName={authorName} text={text}>
      {type === "experience" ? <ExperienceContent {...shared} onBook={handleBook}/> :
       type === "work"       ? <WorkContent {...shared} onDetail={handleDetail} onBuyWerk={onBook ? handleBuyWerk : undefined}/> :
       type === "event"      ? <EventContent {...shared}/> :
                               <MomentContent {...shared}/>}
    </CardErrorBoundary>
  );
}, feedRouterPropsAreEqual);

export default FeedRouter;
export { toFeedItem as resolveType };
