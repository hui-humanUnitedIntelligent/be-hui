// chat-center/ConversationRoom.jsx v2
// Cinematic conversation room — vollständig orchestriert
// ChatAtmosphere + ChatHeader + ChatMessages + ChatInput

import React, { useState, useCallback } from "react";
import ChatAtmosphere from "./ChatAtmosphere.jsx";
import ChatHeader     from "./ChatHeader.jsx";
import ChatMessages   from "./ChatMessages.jsx";
import ChatInput      from "./ChatInput.jsx";
import { useChatThread } from "../../lib/chatContext.js";
import { useAuth }       from "../../lib/AuthContext.jsx";

const CSS = `
  .hui-scroll{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}
  .hui-scroll::-webkit-scrollbar{display:none;}
`;

// Repräsentative Mock-Nachrichten wenn kein Supabase-Chat vorhanden
function getMockMsgs(conv) {
  const base = Date.now() - 3600000;
  return [
    { id:1, text:"Hey! Sch\u00f6n von dir zu h\u00f6ren \uD83D\uDE0A\nDanke f\u00fcr dein Interesse an meinem Workshop.", own:false, created_at:new Date(base).toISOString(), sender_name: conv?.name },
    { id:2, text:"Hallo Leon! Ich freue mich schon sehr darauf. Kannst du mir noch sagen, was ich mitbringen sollte?", own:true, created_at:new Date(base+900000).toISOString(), read:true },
    { id:3, text:"Gerne! Alles, was dich inspiriert \u2013 und wenn du ein Instrument hast, bring es mit. Ansonsten ist alles da im Atelier.", own:false, created_at:new Date(base+1020000).toISOString(), sender_name: conv?.name, reaction:"\u2764\uFE0F 1" },
    { id:4, text:"Perfekt, danke dir! \uD83C\uDF89\uD83D\uDC4B", own:true, created_at:new Date(base+1200000).toISOString(), read:true },
    { id:5, text:"Ich freue mich auf unser Treffen! \uD83C\uDF3F\u2728", own:false, created_at:new Date(base+3540000).toISOString(), sender_name: conv?.name },
  ];
}

export default function ConversationRoom({ conv, onBack, onOpenProfile }) {
  const { user } = useAuth();
  const chatId = conv?.id;

  // Echte Supabase Messages wenn Chat-ID vorhanden
  const { messages: liveMessages, sendMessage, loading } =
    (typeof chatId === "string" || typeof chatId === "number")
      ? useChatThread(chatId)
      : { messages:[], sendMessage:null, loading:false };

  // Echter Chat: live messages oder leerer State (kein Mock)
  // Fake-ID (direct_xyz): Mock als Platzhalter bis Chat erstellt ist
  const isFakeId = typeof chatId === "string" && chatId.startsWith("direct_");
  const normalizedLive = (liveMessages||[]).filter(m=>m&&m.id).map(m => ({
    ...m,
    own: m.sender_id === user?.id,
    avatar: conv?.avatar_url,
    sender_name: conv?.name,
  }));
  const messages = normalizedLive.length > 0
    ? normalizedLive
    : (isFakeId && !loading)
      ? getMockMsgs(conv)   // nur bei fake-ID als UX-Platzhalter
      : [];                 // echter Chat — echter leerer State

  const [typing,  setTyping]  = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async (text) => {
    if (!text?.trim() || sending) return;
    console.log("[HUI_CHAT] sending message, chatId:", chatId);
    setSending(true);
    try {
      if (sendMessage) {
        const result = await sendMessage({ text, msgType: "text" });
        if (result?.error) {
          console.warn("[HUI_CHAT] send failed:", result.error);
        } else {
          console.log("[HUI_MESSAGE] message persisted ✓");
        }
      }
    } finally {
      setSending(false);
      setTyping(false);
    }
  }, [sendMessage, chatId, sending]);

  return (
    <div style={{
      position:"absolute", inset:0, zIndex:3,
      display:"flex", flexDirection:"column",
      // overflow-x hidden, overflow-y visible → ChatInput bleibt sichtbar
      overflowX:"hidden", overflowY:"hidden",
      fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
    }}>
      <style>{CSS}</style>

      {/* Atmosphärischer Hintergrund */}
      <ChatAtmosphere dark={false}/>

      {/* Header */}
      <ChatHeader conv={conv} onBack={onBack} onOpenProfile={onOpenProfile}/>

      {/* Nachrichten */}
      <ChatMessages
        messages={messages}
        typing={typing}
        event={null}
      />

      {/* Composer — sticky bottom, safe-area aware */}
      <div style={{
        position:"relative",
        zIndex:10,
        flexShrink:0,
        width:"100%",
      }}>
        <ChatInput onSend={handleSend} sending={sending}/>
      </div>
    </div>
  );
}
