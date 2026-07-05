// src/feed/cards/FeedRouter.jsx — HUI FEED ROUTER (Phase 1)
import React, { Suspense, lazy } from "react";
import { toFeedItem } from "../../system/feed/unifiedNormalizer.js";

const MomentContent     = lazy(() => import("./MomentContent.jsx"));
const ExperienceContent = lazy(() => import("./ExperienceContent.jsx"));
const WorkContent       = lazy(() => import("./WorkContent.jsx"));
const EventContent      = lazy(() => import("./EventContent.jsx"));

function CardSkeleton() {
  return (
    <div style={{margin:"0 12px 14px",borderRadius:28,background:"#fff",
      border:"1px solid rgba(26,26,46,0.06)",boxShadow:"0 2px 16px rgba(26,26,46,0.07)"}}>
      <div style={{padding:"16px 16px 0",display:"flex",gap:12,alignItems:"center"}}>
        <div style={{width:38,height:38,borderRadius:13,background:"rgba(22,215,197,0.10)"}}/>
        <div>
          <div style={{width:100,height:12,borderRadius:6,background:"rgba(26,26,46,0.07)",marginBottom:6}}/>
          <div style={{width:60,height:9,borderRadius:5,background:"rgba(26,26,46,0.05)"}}/>
        </div>
      </div>
      <div style={{padding:"12px 16px 20px"}}>
        <div style={{height:10,borderRadius:5,background:"rgba(26,26,46,0.06)",marginBottom:6}}/>
        <div style={{height:10,borderRadius:5,background:"rgba(26,26,46,0.06)",width:"75%"}}/>
      </div>
    </div>
  );
}

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
          <span style={{fontSize:20}}>🌿</span>
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
      <Suspense fallback={<CardSkeleton/>}>
        {type === "experience" ? <ExperienceContent {...shared} onBook={()=>onBook?.(rawItem)} onDetail={()=>onDetail?.(item)}/> :
         type === "work"       ? <WorkContent {...shared} onDetail={()=>onDetail?.(item)} onBuyWerk={onBook ? ()=>onBook(rawItem) : undefined}/> : /* COMMERCE-01 W-5 */
         type === "event"      ? <EventContent {...shared}/> :
                                 <MomentContent {...shared}/>}
      </Suspense>
    </CardErrorBoundary>
  );
}

export { toFeedItem as resolveType };