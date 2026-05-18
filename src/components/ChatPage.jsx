// ChatPage.jsx — HUI Chat Intelligence v2.0
// Phase 3B: Ruhige kreative Creator-Kommunikation

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../lib/AuthContext";
import { AMBIENT_CSS, TRANSITIONS, getSoftStatus } from "../lib/journeyContext";
import { useDraftPersist, useScrollMemory, usePresence, getPresenceLabel } from "../lib/sessionHooks";
import {
  useChatList, useChatThread, useChatContext,
  CHAT_TYPES, MSG_TYPES, formatChatTime, formatMsgDate,
} from "../lib/chatContext";
import { BOOKING_STATUS } from "../lib/bookingContext";
import { useChatThread, useChatContext, useChatList } from "../lib/chatContext";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  tealGlow:"rgba(22,215,197,0.15)", coral:"#FF8A6B",
  cream:"#F9F7F4", creamWarm:"#FEFCFA", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", muted:"#888", muted2:"#C8C8C8",
  border:"rgba(0,0,0,0.07)", borderLight:"rgba(0,0,0,0.04)",
};

const CSS = `
${AMBIENT_CSS}
  @keyframes msgSlideIn{from{opacity:0;transform:translateY(10px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes cpPulse{0%,100%{opacity:1}50%{opacity:.35}}
  @keyframes cpShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes cpFadeIn{from{opacity:0}to{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .cp-scroll::-webkit-scrollbar{display:none}
  .cp-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .cp-tap{-webkit-tap-highlight-color:transparent;transition:transform .15s cubic-bezier(.34,1.4,.64,1),opacity .12s;cursor:pointer}
  .cp-tap:active{transform:scale(.95);opacity:.75}
  .msg-bubble{animation:msgSlideIn .22s cubic-bezier(.34,1.1,.64,1) both}
  .cp-skeleton{background:linear-gradient(90deg,rgba(0,0,0,.06) 25%,rgba(0,0,0,.03) 37%,rgba(0,0,0,.06) 63%);background-size:400% 100%;animation:cpShimmer 1.4s ease infinite;border-radius:10px}
  .cp-input{border:none;background:transparent;font-family:inherit;resize:none;width:100%;outline:none}
  .cp-input::placeholder{color:rgba(0,0,0,.32)}
`;

function Avatar({ url, name, size=40, online=false }) {
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      {url ? (
        <img src={url} alt={name||"?"} style={{ width:size, height:size,
          borderRadius:"50%", objectFit:"cover", display:"block" }}
          onError={e=>{e.target.style.display="none"}} />
      ) : (
        <div style={{ width:size, height:size, borderRadius:"50%",
          background:`linear-gradient(135deg,${C.teal}44,${C.coral}44)`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:800, fontSize:size*.38, color:C.teal }}>
          {(name||"?")[0].toUpperCase()}
        </div>
      )}
      {online && (
        <div style={{ position:"absolute", bottom:1, right:1,
          width:9, height:9, borderRadius:"50%", background:"#10B981",
          border:`2px solid ${C.creamWarm}`,
          boxShadow:"0 0 5px rgba(16,185,129,0.5)" }} />
      )}
    </div>
  );
}

function SystemBubble({ msg }) {
  const icon = MSG_TYPES[msg.msg_type]?.icon || "i";
  const ctxRef = msg.context_ref;
  return (
    <div style={{ display:"flex", justifyContent:"center", margin:"10px 0" }}>
      <div style={{ display:"inline-flex", alignItems:"center", gap:6,
        background:"rgba(22,215,197,0.08)", border:"1px solid rgba(22,215,197,0.18)",
        borderRadius:50, padding:"5px 12px", fontSize:12, color:C.ink2, fontWeight:500 }}>
        <span>{icon}</span>
        <span>{msg.text}</span>
        {ctxRef?.status && (
          <span style={{ fontSize:10, fontWeight:700,
            color:BOOKING_STATUS[ctxRef.status]?.color||C.teal }}>
            {BOOKING_STATUS[ctxRef.status]?.label}
          </span>
        )}
      </div>
    </div>
  );
}

function SharedContextCard({ contextRef, onTap }) {
  if (!contextRef) return null;
  return (
    <div className="cp-tap" onClick={()=>onTap?.(contextRef)}
      style={{ marginTop:6, background:C.creamWarm,
        border:`1px solid ${C.border}`, borderRadius:14,
        overflow:"hidden", maxWidth:220 }}>
      {contextRef.thumbnail && (
        <img src={contextRef.thumbnail} alt={contextRef.title}
          style={{ width:"100%", height:90, objectFit:"cover", display:"block" }} />
      )}
      <div style={{ padding:"8px 10px" }}>
        <div style={{ fontSize:10, fontWeight:700, color:C.teal, marginBottom:2,
          textTransform:"uppercase", letterSpacing:.8 }}>
          {contextRef.type==="work" ? "Werk" : "Erlebnis"}
        </div>
        <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>{contextRef.title}</div>
        {contextRef.price && (
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{contextRef.price}</div>
        )}
      </div>
    </div>
  );
}

// ── Chat Thread ───────────────────────────────────────────────
function ChatThread({ chat, onBack, onViewWork }) {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage } = useChatThread(chat.id);
  const { booking, contextLabel } = useChatContext(chat);
  const presenceStatus = usePresence(chat.other_profile?.id);
  const presenceInfo   = getPresenceLabel(presenceStatus);
  const { ref: scrollRef } = useScrollMemory(`chat-${chat.id}`);
  const bottomRef = useRef(null);

  const [draft, setDraftState] = useDraftPersist(`chat-input-${chat.id}`, { text:"" });
  const [input, setInputState] = useState(draft.text||"");
  const [showMore, setShowMore] = useState(false);

  const setInput = useCallback((val) => {
    setInputState(val);
    setDraftState({ text:val });
  }, [setDraftState]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, 60);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const txt = input.trim();
    if (!txt || sending) return;
    setInputState("");
    setDraftState({ text:"" });
    await sendMessage({ text:txt });
  }, [input, sending, sendMessage, setDraftState]);

  const bookingBadge = booking ? {
    label: BOOKING_STATUS[booking.status]?.softText || BOOKING_STATUS[booking.status]?.label,
    color: BOOKING_STATUS[booking.status]?.color,
    emoji: BOOKING_STATUS[booking.status]?.emoji,
  } : null;

  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;
    messages.forEach(msg => {
      const msgDate = formatMsgDate(msg.created_at);
      if (msgDate !== currentDate) {
        groups.push({ type:"date", label:msgDate, key:`date-${msgDate}` });
        currentDate = msgDate;
      }
      groups.push({ type:"msg", msg, key:msg.id });
    });
    return groups;
  }, [messages]);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500,
      background:C.cream, display:"flex", flexDirection:"column" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 16px 12px",
        background:C.card, borderBottom:`1px solid ${C.border}`,
        boxShadow:"0 1px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button className="cp-tap" onClick={onBack}
            style={{ width:36, height:36, background:"rgba(0,0,0,0.05)",
              border:"none", borderRadius:"50%", fontSize:17,
              display:"flex", alignItems:"center", justifyContent:"center",
              color:C.ink2 }}>←</button>
          <Avatar url={chat.other_profile?.avatar_url}
            name={chat.other_profile?.display_name} size={38}
            online={presenceStatus==="online"} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:15, color:C.ink,
              display:"flex", alignItems:"center", gap:6 }}>
              {chat.other_profile?.display_name||"Unbekannt"}
              {presenceInfo.dot && (
                <span style={{ fontSize:10, fontWeight:500, color:presenceInfo.color }}>
                  {presenceInfo.text}
                </span>
              )}
            </div>
            {(contextLabel||bookingBadge) && (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:1 }}>
                {contextLabel && (
                  <div style={{ fontSize:11, color:C.teal, fontWeight:600 }}>
                    {CHAT_TYPES[chat.chat_type]?.icon} {contextLabel}
                  </div>
                )}
                {bookingBadge && (
                  <div style={{ fontSize:10, fontWeight:700, color:bookingBadge.color,
                    background:`${bookingBadge.color}18`, borderRadius:50, padding:"1px 7px" }}>
                    {bookingBadge.emoji} {bookingBadge.label}
                  </div>
                )}
              </div>
            )}
          </div>
          <button className="cp-tap" onClick={()=>setShowMore(!showMore)}
            style={{ width:34, height:34, background:"none", border:"none",
              fontSize:20, color:C.muted, display:"flex",
              alignItems:"center", justifyContent:"center" }}>···</button>
        </div>
      </div>

      {/* More Options */}
      {showMore && (
        <div style={{ position:"fixed", inset:0, zIndex:600 }}
          onClick={()=>setShowMore(false)}>
          <div style={{ position:"absolute", top:120, right:16, background:C.card,
            borderRadius:16, boxShadow:"0 8px 32px rgba(0,0,0,0.14)",
            overflow:"hidden", minWidth:180 }}
            onClick={e=>e.stopPropagation()}>
            {[
              { label:"Archivieren",    icon:"📁", red:false },
              { label:"Stummschalten",  icon:"🔕", red:false },
              { label:"Profil ansehen", icon:"👤", red:false },
              { label:"Melden",         icon:"🚩", red:true,
                action:()=>window.open("mailto:support@behui.app?subject=Chat+melden","_blank") },
            ].map((item,i)=>(
              <button key={i} className="cp-tap"
                onClick={()=>{ item.action?.(); setShowMore(false); }}
                style={{ width:"100%", padding:"13px 16px", background:"none",
                  border:"none",
                  borderBottom:i<3?`1px solid ${C.borderLight}`:"none",
                  display:"flex", alignItems:"center", gap:10,
                  textAlign:"left", fontFamily:"inherit", cursor:"pointer" }}>
                <span style={{ fontSize:16 }}>{item.icon}</span>
                <span style={{ fontSize:14, fontWeight:600,
                  color:item.red?"#EF4444":C.ink }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="cp-scroll"
        style={{ flex:1, overflowY:"auto", padding:"8px 16px 8px" }}>
        {loading ? (
          <div style={{ padding:"20px 0" }}>
            {[80,60,90,55,70].map((w,i)=>(
              <div key={i} style={{ display:"flex",
                justifyContent:i%2===0?"flex-start":"flex-end", marginBottom:10 }}>
                <div className="cp-skeleton"
                  style={{ width:`${w}%`, height:42, borderRadius:18 }} />
              </div>
            ))}
          </div>
        ) : messages.length===0 ? (
          <div style={{ textAlign:"center", padding:"48px 24px",
            animation:"cpFadeIn .4s ease both" }}>
            <div style={{ fontSize:48, marginBottom:16,
              filter:"drop-shadow(0 4px 12px rgba(22,215,197,0.25))" }}>
              {chat.chat_type==="booking"?"📋":chat.chat_type==="collaboration"?"🤝":"💬"}
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:C.ink, marginBottom:6 }}>
              {chat.chat_type==="booking"?"Buchungsgespräch gestartet":"Verbindung hergestellt"}
            </div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>
              Schreib die erste Nachricht —<br/>der Anfang von etwas Schönem.
            </div>
          </div>
        ) : (
          groupedMessages.map(item => {
            if (item.type==="date") return (
              <div key={item.key} style={{ textAlign:"center", fontSize:11,
                color:C.muted2, fontWeight:600, margin:"16px 0 10px" }}>
                <span style={{ background:C.cream, padding:"0 10px" }}>
                  {item.label}
                </span>
              </div>
            );
            const m = item.msg;
            const isMe = m.sender_id===user.id;
            const isSystem = ["system_message","booking_update","availability_update"]
              .includes(m.msg_type);
            if (isSystem) return <SystemBubble key={item.key} msg={m} />;
            return (
              <div key={item.key} className="msg-bubble"
                style={{ display:"flex",
                  justifyContent:isMe?"flex-end":"flex-start", marginBottom:4 }}>
                {!isMe && (
                  <div style={{ width:28, alignSelf:"flex-end",
                    marginRight:6, flexShrink:0 }}>
                    <Avatar url={chat.other_profile?.avatar_url}
                      name={chat.other_profile?.display_name} size={26} />
                  </div>
                )}
                <div style={{ maxWidth:"76%" }}>
                  {m.text && (
                    <div style={{ padding:"10px 14px",
                      borderRadius:isMe?"18px 18px 4px 18px":"4px 18px 18px 18px",
                      background:isMe
                        ?`linear-gradient(135deg,${C.teal},${C.teal2})`:C.card,
                      border:isMe?"none":`1px solid ${C.border}`,
                      boxShadow:isMe?`0 3px 14px ${C.tealGlow}`:"0 1px 8px rgba(0,0,0,.05)" }}>
                      <div style={{ fontSize:14, color:isMe?"white":C.ink,
                        lineHeight:1.55, wordBreak:"break-word" }}>{m.text}</div>
                    </div>
                  )}
                  {m.context_ref && (
                    <SharedContextCard contextRef={m.context_ref}
                      onTap={(ref)=>onViewWork?.(ref)} />
                  )}
                  <div style={{ fontSize:10, color:C.muted2,
                    textAlign:isMe?"right":"left", marginTop:3, paddingLeft:2 }}>
                    {new Date(m.created_at).toLocaleTimeString("de-DE",
                      { hour:"2-digit", minute:"2-digit" })}
                    {isMe && (
                      <span style={{ marginLeft:4,
                        color:m.read?C.teal:C.muted2,
                        fontWeight:m.read?700:400 }}>
                        {m._optimistic?"…":m.read?"✓✓":"✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} style={{ height:1 }} />
      </div>

      {/* Input */}
      <div style={{ padding:"8px 12px max(20px,env(safe-area-inset-bottom,20px))",
        background:C.card, borderTop:`1px solid ${C.border}`,
        display:"flex", gap:8, alignItems:"flex-end",
        boxShadow:"0 -1px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ flex:1, background:C.cream, borderRadius:22,
          border:`1px solid ${C.border}`,
          display:"flex", alignItems:"flex-end",
          padding:"6px 14px 6px 16px", gap:8 }}>
          <textarea className="cp-input"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
            placeholder="Schreib etwas…"
            rows={1}
            style={{ fontSize:14, color:C.ink, lineHeight:1.5,
              maxHeight:100, overflowY:"auto",
              paddingTop:5, paddingBottom:5 }}
          />
        </div>
        <button className="cp-tap" onClick={handleSend}
          disabled={!input.trim()||sending}
          style={{ width:44, height:44, flexShrink:0,
            background:input.trim()
              ?`linear-gradient(135deg,${C.teal},${C.teal2})`:"rgba(0,0,0,0.08)",
            border:"none", borderRadius:"50%",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, transition:"all .2s",
            boxShadow:input.trim()?`0 4px 14px ${C.tealGlow}`:"none" }}>
          {sending?(
            <div style={{ width:16, height:16, borderRadius:"50%",
              border:"2px solid rgba(255,255,255,.4)", borderTopColor:"white",
              animation:"spin .7s linear infinite" }}/>
          ):"↑"}
        </button>
      </div>
    </div>
  );
}

// ── Chat List ────────────────────────────────────────────────
export default function ChatPage({ onClose }) {
  const { chats, loading, unreadTotal, markChatRead } = useChatList();
  const [active, setActive] = useState(null);

  const handleOpen = useCallback((chat) => {
    markChatRead(chat.id);
    setActive(chat);
  }, [markChatRead]);

  if (active) return (
    <ChatThread chat={active} onBack={()=>setActive(null)} onViewWork={()=>{}} />
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:C.cream, display:"flex", flexDirection:"column" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px",
        background:C.card, borderBottom:`1px solid ${C.border}`,
        boxShadow:"0 1px 12px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {onClose && (
            <button className="cp-tap" onClick={onClose}
              style={{ width:36, height:36, background:"rgba(0,0,0,0.05)",
                border:"none", borderRadius:"50%", fontSize:17,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:C.ink2 }}>←</button>
          )}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:900, color:C.ink,
              letterSpacing:-.4 }}>Nachrichten</div>
            <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>
              {unreadTotal>0?`${unreadTotal} ungelesen`:"Alles gelesen ✓"}
            </div>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="cp-scroll" style={{ flex:1, overflowY:"auto" }}>
        {loading ? (
          <div style={{ padding:"8px 0" }}>
            {[1,2,3].map(i=>(
              <div key={i} style={{ display:"flex", gap:12, padding:"14px 20px",
                borderBottom:`1px solid ${C.borderLight}` }}>
                <div className="cp-skeleton"
                  style={{ width:52, height:52, borderRadius:"50%", flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div className="cp-skeleton"
                    style={{ height:14, width:"50%", marginBottom:8 }} />
                  <div className="cp-skeleton" style={{ height:11, width:"75%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : chats.length===0 ? (
          <div style={{ textAlign:"center", padding:"64px 32px",
            animation:"cpFadeIn .4s ease both" }}>
            <div style={{ fontSize:52, marginBottom:16,
              filter:"drop-shadow(0 4px 16px rgba(22,215,197,0.2))" }}>💬</div>
            <div style={{ fontSize:17, fontWeight:800, color:C.ink, marginBottom:8 }}>
              Noch keine Gespräche
            </div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.7 }}>
              Chats entstehen wenn du<br/>eine Anfrage an einen Creator stellst.
            </div>
          </div>
        ) : (
          <div style={{ padding:"4px 0" }}>
            {chats.map(c => {
              const typeInfo = CHAT_TYPES[c.chat_type]||CHAT_TYPES.direct;
              const lastType = MSG_TYPES[c.last_message_type];
              const preview  = lastType?.label
                ? `${lastType.icon} ${lastType.label}` : c.last_message;
              return (
                <div key={c.id} className="cp-tap" onClick={()=>handleOpen(c)}
                  style={{ display:"flex", gap:12, padding:"14px 20px",
                    borderBottom:`1px solid ${C.borderLight}`,
                    background:c.unread>0
                      ?`linear-gradient(135deg,${C.teal}05,transparent)`:"transparent",
                    position:"relative" }}>
                  {c.is_pinned && (
                    <div style={{ position:"absolute", top:8, right:20,
                      fontSize:10, color:C.muted2 }}>📌</div>
                  )}
                  <div style={{ position:"relative", flexShrink:0 }}>
                    <Avatar url={c.other_profile?.avatar_url}
                      name={c.other_profile?.display_name} size={52} />
                    <div style={{ position:"absolute", bottom:-2, right:-4,
                      width:20, height:20, borderRadius:"50%",
                      background:typeInfo.color+"22",
                      border:`1.5px solid ${C.creamWarm}`,
                      display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:10 }}>
                      {typeInfo.icon}
                    </div>
                    {c.unread>0 && (
                      <div style={{ position:"absolute", top:-3, right:-6,
                        minWidth:18, height:18, borderRadius:9,
                        background:`linear-gradient(135deg,${C.coral},#FF5F5F)`,
                        border:`2px solid ${C.creamWarm}`,
                        display:"flex", alignItems:"center",
                        justifyContent:"center",
                        fontSize:10, fontWeight:800, color:"white",
                        padding:"0 4px" }}>
                        {c.unread>9?"9+":c.unread}
                      </div>
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"baseline", marginBottom:2 }}>
                      <div style={{ fontWeight:c.unread>0?800:600,
                        fontSize:15, color:C.ink }}>
                        {c.other_profile?.display_name||"Unbekannt"}
                      </div>
                      <div style={{ fontSize:11, color:C.muted2,
                        flexShrink:0, marginLeft:8 }}>
                        {formatChatTime(c.last_message_at)}
                      </div>
                    </div>
                    {(c.context_title||c.booking_title) && (
                      <div style={{ fontSize:10, color:typeInfo.color,
                        fontWeight:700, marginBottom:2, letterSpacing:.3 }}>
                        {typeInfo.icon} {c.context_title||c.booking_title}
                      </div>
                    )}
                    <div style={{ fontSize:13,
                      color:c.unread>0?C.ink2:C.muted,
                      fontWeight:c.unread>0?600:400,
                      overflow:"hidden", textOverflow:"ellipsis",
                      whiteSpace:"nowrap" }}>
                      {preview||"Noch keine Nachricht"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}