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

  // Profile öffnen: author aus dem Item extrahieren, nicht rawItem (Feed-Shape)
  // rawItem hat type/author/media — kein direkter Profile-Object
  const authorObj = item.author || rawItem.author || null;
  const profileData = authorObj
    ? { id: authorObj.id, user_id: authorObj.id, display_name: authorObj.name,
        avatar_url: authorObj.avatar, username: authorObj.username,
        is_verified: authorObj.verified, memberType: authorObj.membershipType,
        talent: authorObj.talent, _raw: authorObj }
    : rawItem;

  // Guard: profileData nur übergeben wenn eine echte id vorhanden ist
  // Leere id ("") → kein Profil-Klick möglich (kein Crash)
  const hasValidProfile = !!(authorObj?.id && typeof authorObj.id === "string" && authorObj.id.trim().length > 0);
  const safeProfileCall = hasValidProfile
    ? () => onProfile?.(profileData)
    : null; // null = Button disabled, kein Crash

  const shared = {
    item,
    onProfile: safeProfileCall,
    onReaction: (t) => onReaction?.(t),
    onShare:    () => onShare?.(rawItem),
  };

  console.log("[HUI_ROUTE]", { id: item.id, type, author: authorName, hasMedia: (item.media||[]).length > 0 });

  return (
    <CardErrorBoundary itemId={item.id} itemType={type} authorName={authorName} text={text}>
      <Suspense fallback={<CardSkeleton/>}>
        {type === "experience" ? <ExperienceContent {...shared} onBook={()=>onBook?.(rawItem)}/> :
         type === "work"       ? <WorkContent {...shared} onDetail={()=>onDetail?.(rawItem)}/> :
         type === "event"      ? <EventContent {...shared}/> :
                                 <MomentContent {...shared}/>}
      </Suspense>
    </CardErrorBoundary>
  );
}

export { toFeedItem as resolveType };
