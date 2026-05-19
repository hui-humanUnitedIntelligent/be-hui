// components/chat-center/ConversationList.jsx
// Kategorisierte Conversation-Liste mit Mock-Daten

import React, { useState } from "react";
import ConversationCard from "./ConversationCard.jsx";

const C = { teal:"#16D7C5", ink:"#1A1A1A", muted:"rgba(80,80,80,0.5)" };

const CATEGORIES = [
  { key:"alle",       label:"Alle"          },
  { key:"resonanz",   label:"Resonanz"      },
  { key:"erlebnisse", label:"Erlebnisse"    },
  { key:"verbindung", label:"Verbindungen"  },
  { key:"community",  label:"Community"     },
];

// Repräsentative Mock-Daten
const MOCK_CONVS = [
  { id:1, name:"Mia Kern",      last_message:"Danke f\u00fcr deinen Impuls \u2014 hat mich ber\u00fchrt.",  last_at: new Date(Date.now()-120000).toISOString(),   unread:2, online:true,  category:"resonanz"   },
  { id:2, name:"Leon Velder",   last_message:"Sommer Retreat: Ich freue mich so darauf.",                  last_at: new Date(Date.now()-3600000).toISOString(),  unread:0, online:false, category:"erlebnisse" },
  { id:3, name:"Hana Mori",     last_message:"Dein Werk hat mich wirklich ber\u00fchrt heute.",             last_at: new Date(Date.now()-7200000).toISOString(),  unread:1, online:true,  category:"verbindung" },
  { id:4, name:"Urban Atelier", last_message:"Neues Projekt: Wir suchen Mitgestaltende.",                  last_at: new Date(Date.now()-86400000).toISOString(), unread:0, online:false, category:"community"  },
  { id:5, name:"Sela Park",     last_message:"K\u00f6nnen wir n\u00e4chste Woche mal sprechen?",            last_at: new Date(Date.now()-172800000).toISOString(),unread:3, online:true,  category:"resonanz"   },
  { id:6, name:"Kai Birmann",   last_message:"Workshop war wundervoll, danke dir.",                        last_at: new Date(Date.now()-259200000).toISOString(),unread:0, online:false, category:"erlebnisse" },
];

export default function ConversationList({ onOpen }) {
  const [activeCategory, setActiveCategory] = useState("alle");

  const filtered = activeCategory === "alle"
    ? MOCK_CONVS
    : MOCK_CONVS.filter(c => c.category === activeCategory);

  const totalUnread = MOCK_CONVS.reduce((s,c) => s + (c.unread||0), 0);

  return (
    <div>
      {/* Category Pills */}
      <div className="hui-scroll" style={{
        display:"flex", gap:8,
        overflowX:"auto", overflowY:"hidden",
        padding:"0 20px 18px",
        WebkitOverflowScrolling:"touch",
      }}>
        {CATEGORIES.map(cat => {
          const on = activeCategory === cat.key;
          return (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{
              flexShrink:0, padding:"7px 15px",
              borderRadius:99,
              background: on
                ? `linear-gradient(135deg,${C.teal},#11C5B7)`
                : "rgba(255,255,255,0.7)",
              border: on ? "none" : "1px solid rgba(0,0,0,0.09)",
              boxShadow: on ? "0 3px 10px rgba(22,215,197,0.25)" : "none",
              color: on ? "white" : C.muted,
              fontSize:12.5, fontWeight: on ? 700 : 500,
              cursor:"pointer",
              WebkitTapHighlightColor:"transparent",
              transition:"all 0.18s ease",
            }}>{cat.label}</button>
          );
        })}
      </div>

      {/* Conversation Cards */}
      <div style={{ padding:"0 16px" }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign:"center", padding:"56px 20px",
            color:"rgba(80,80,80,0.3)", fontSize:13,
          }}>
            <div style={{ fontSize:32, marginBottom:10 }}>\u2726</div>
            Noch keine Nachrichten in dieser Kategorie
          </div>
        ) : filtered.map(conv => (
          <ConversationCard
            key={conv.id}
            conv={conv}
            onPress={onOpen}
          />
        ))}
      </div>
    </div>
  );
}
