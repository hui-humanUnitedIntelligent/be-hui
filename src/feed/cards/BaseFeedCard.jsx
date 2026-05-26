// src/feed/cards/BaseFeedCard.jsx — HUI UNIFIED CARD FOUNDATION (Phase 1)
import React, { useState } from "react";

const T = {
  bgCard:"#FFFFFF", ink:"#1A1A2E", ink3:"rgba(26,26,46,0.35)",
  teal:"#16D7C5", tealSoft:"rgba(22,215,197,0.10)", tealLine:"rgba(22,215,197,0.18)",
  coral:"#FF8A6B", shadow:"0 2px 16px rgba(26,26,46,0.07)",
  border:"rgba(26,26,46,0.06)", r:28, rMedia:22, rAvatar:13, p:16, gap:12, mediaH:280,
};

function CardAvatar({ src, name, size }) {
  const sz = size || 38;
  const [err, setErr] = useState(false);
  const letter = ((name || "H")[0] || "H").toUpperCase();
  return (
    <div style={{
      width:sz, height:sz, borderRadius:T.rAvatar, flexShrink:0,
      overflow:"hidden", background:T.tealSoft, border:"1.5px solid "+T.tealLine,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:sz*0.38, fontWeight:700, color:T.teal,
    }}>
      {src && !err
        ? <img src={src} alt={name||""} onError={()=>setErr(true)}
            style={{width:"100%",height:"100%",objectFit:"cover"}} />
        : letter}
    </div>
  );
}

export function FeedCardHeader({ author, time, badge, onProfile }) {
  const name   = (author&&(author.name||author.displayName))||"Human";
  const uname  = (author&&author.username)||null;
  const avatar = (author&&author.avatar)||null;
  const ver    = (author&&author.verified)||false;
  return (
    <div style={{display:"flex",alignItems:"center",gap:T.gap,padding:T.p+"px "+T.p+"px 0"}}>
      <button onClick={onProfile} style={{background:"none",border:"none",padding:0,cursor:"pointer",flexShrink:0}}>
        <CardAvatar src={avatar} name={name} size={38}/>
      </button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <span style={{fontSize:13.5,fontWeight:700,color:T.ink,letterSpacing:-0.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
          {ver && <span style={{fontSize:11,color:T.teal}}>✦</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:1}}>
          {uname && <span style={{fontSize:11,color:T.ink3}}>{"@"+uname}</span>}
          {uname && time && <span style={{fontSize:11,color:T.ink3}}>·</span>}
          {time  && <span style={{fontSize:11,color:T.ink3}}>{time}</span>}
        </div>
      </div>
      {badge && (
        <div style={{padding:"3px 9px",borderRadius:20,background:badge.bg||T.tealSoft,
          border:"1px solid "+(badge.border||T.tealLine),fontSize:10,fontWeight:700,
          color:badge.color||T.teal,flexShrink:0,letterSpacing:0.3}}>
          {badge.label}
        </div>
      )}
    </div>
  );
}

export function FeedMedia({ media, alt }) {
  const [err, setErr] = useState(false);
  let url = null;
  if (Array.isArray(media) && media.length>0) {
    const f = media[0];
    url = (f&&f.url) ? f.url : (typeof f==="string" ? f : null);
  } else if (typeof media==="string" && media.length>0) { url=media; }
  if (!url||err) return null;
  return (
    <div style={{margin:"14px "+T.p+"px 0",height:T.mediaH,borderRadius:T.rMedia,overflow:"hidden",background:"#F0EFED",flexShrink:0}}>
      <img src={url} alt={alt||""} onError={()=>setErr(true)}
        style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
    </div>
  );
}

function ActionBtn({ icon, label, count, active, onClick, activeColor }) {
  const [pressed, setPressed] = useState(false);
  const col = active ? (activeColor||T.teal) : T.ink3;
  return (
    <button onClick={onClick}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)}
      onTouchStart={()=>setPressed(true)} onTouchEnd={()=>setPressed(false)}
      style={{background:"none",border:"none",padding:"6px 10px",cursor:"pointer",
        display:"flex",alignItems:"center",gap:5,borderRadius:10,
        opacity:pressed?0.6:1,touchAction:"manipulation",transition:"opacity 0.12s"}}>
      <span style={{fontSize:16,lineHeight:1,color:col}}>{icon}</span>
      {(count!=null||label) && (
        <span style={{fontSize:12,color:col,fontWeight:active?700:400}}>
          {count!=null?count:label}
        </span>
      )}
    </button>
  );
}

export function FeedActions({ reactions, onReaction, onShare, extraActions }) {
  const r = reactions||{};
  return (
    <div style={{display:"flex",alignItems:"center",padding:"10px "+(T.p-4)+"px",borderTop:"1px solid "+T.border,marginTop:14,gap:2}}>
      <ActionBtn icon="✦" count={r.inspireCount||null} active={r.inspired} activeColor={T.teal} onClick={()=>onReaction&&onReaction("inspire")}/>
      <ActionBtn icon="🤍" count={r.touchCount||null}  active={r.touched}  activeColor={T.coral} onClick={()=>onReaction&&onReaction("touch")}/>
      <ActionBtn icon="⊕" active={r.saved} activeColor="#8B5CF6" onClick={()=>onReaction&&onReaction("save")}/>
      <div style={{flex:1}}/>
      {extraActions||null}
      <ActionBtn icon="↗" onClick={onShare}/>
    </div>
  );
}

export default function BaseFeedCard({ item, onProfile, onReaction, onShare, badge, children, extraActions }) {
  if (!item||!item.id) return null;
  const reactions = item._reactions||{};
  return (
    <article style={{
      background:T.bgCard, borderRadius:T.r,
      marginBottom:14, marginLeft:12, marginRight:12,
      boxShadow:T.shadow, border:"1px solid "+T.border, overflow:"hidden",
    }}>
      <FeedCardHeader author={item.author} time={item.createdAt} badge={badge} onProfile={onProfile}/>
      <div style={{padding:"12px "+T.p+"px 0"}}>{children}</div>
      <FeedMedia media={item.media} alt={item.title||item.text}/>
      <FeedActions reactions={reactions} onReaction={onReaction} onShare={onShare} extraActions={extraActions}/>
    </article>
  );
}
