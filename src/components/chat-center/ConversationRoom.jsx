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

// Mock Event Preview für Demo
const MOCK_EVENT = {
  title:"Klangreise \u2013 Live im Atelier",
  when_full:"24. Mai \u00b7 18:00",
  location_label:"Berlin",
  cover_url: null,
};

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

  // Fallback: Mock-Nachrichten wenn noch keine echten da
  const messages = liveMessages?.length > 0
    ? (liveMessages||[]).filter(m=>m&&m.id).map(m => ({
        ...m,
        own: m.sender_id === user?.id,
        avatar: conv?.avatar_url,
        sender_name: conv?.name,
      }))
    : getMockMsgs(conv);

  const [typing, setTyping] = useState(false);

  const handleSend = useCallback(async (text) => {
    if (sendMessage) {
      await sendMessage({ text, type:"text" });
    }
    // Typing simulation für Demo
    setTyping(false);
  }, [sendMessage]);

  return (
    <div style={{
      position:"absolute", inset:0, zIndex:3,
      display:"flex", flexDirection:"column",
      overflow:"hidden",
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
        event={MOCK_EVENT}
      />

      {/* Input */}
      <ChatInput onSend={handleSend}/>
    </div>
  );
}
