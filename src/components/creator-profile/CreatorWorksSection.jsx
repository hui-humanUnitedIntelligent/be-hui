// components/creator-profile/CreatorWorksSection.jsx
// Werke / Aktivitäts-Tab content

import React from "react";

const C = { teal:"#16D7C5", coral:"#FF8A6B", ink:"#1A1A1A", ink2:"#3A3A3A", muted:"rgba(80,80,80,0.55)", cream:"#F9F7F4" };

function ActivityCard({ item }) {
  const coverBg = item.cover_url
    ? `url(${item.cover_url}) center/cover no-repeat`
    : `linear-gradient(135deg,${C.teal}20,${C.coral}15)`;

  const timeLabel = item.time_label || item.when || "Bald";
  const participants = item.participants || item.bookings || 0;

  return (
    <div style={{
      display:"flex", gap:14, alignItems:"center",
      padding:"14px 16px",
      background:"white",
      borderRadius:18,
      boxShadow:"0 2px 10px rgba(0,0,0,0.05)",
      marginBottom:10,
    }}>
      <div style={{
        width:68, height:68, borderRadius:14, flexShrink:0,
        background:coverBg,
        boxShadow:"0 2px 8px rgba(0,0,0,0.10)",
      }}/>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          display:"flex", alignItems:"flex-start",
          justifyContent:"space-between", gap:8,
        }}>
          <span style={{
            fontSize:15, fontWeight:700, color:C.ink,
            lineHeight:1.3, flex:1,
          }}>{item.title || "Neues Werk"}</span>
          <span style={{
            fontSize:11, fontWeight:600, color:C.teal,
            background:`rgba(22,215,197,0.10)`,
            padding:"3px 8px", borderRadius:99, flexShrink:0,
          }}>{timeLabel}</span>
        </div>
        <div style={{
          fontSize:12.5, color:C.muted, marginTop:4, marginBottom:6,
        }}>
          {item.when_full || "Heute · 18:00"} · {item.location_label || "München"}
        </div>
        {participants > 0 && (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ display:"flex" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width:22, height:22, borderRadius:"50%",
                  background:`linear-gradient(135deg,#16D7C5${i===0?"":"80"},#FF8A6B${i===2?"":"80"})`,
                  border:"2px solid white",
                  marginLeft: i > 0 ? -7 : 0,
                }}/>
              ))}
            </div>
            <span style={{ fontSize:12, color:C.muted }}>{participants} Teilnehmer</span>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkCard({ work }) {
  const coverBg = work.cover_url
    ? `url(${work.cover_url}) center/cover no-repeat`
    : `linear-gradient(135deg,${C.teal}18,${C.coral}12)`;
  return (
    <div style={{
      width:160, flexShrink:0,
      borderRadius:18, overflow:"hidden",
      boxShadow:"0 4px 16px rgba(0,0,0,0.08)",
      background:"white",
    }}>
      <div style={{ height:130, background:coverBg }}/>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:C.ink, marginBottom:3 }}>
          {work.title || "Keramik Schale"}
        </div>
        {work.price && (
          <div style={{ fontSize:12, color:C.teal, fontWeight:700 }}>
            €{work.price}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreatorWorksSection({ activeTab, works, experiences, activities }) {
  const mockActivities = [
    { id:1, title:"Keramik Workshop", when_full:"Heute · 18:00", location_label:"München", time_label:"Morgen", participants:8, cover_url:null },
    { id:2, title:"Töpferkurs für Anfänger", when_full:"Fr · 15:00", location_label:"München", time_label:"Diese Woche", participants:5, cover_url:null },
  ];
  const mockWorks = [
    { id:1, title:"Keramik Schale", price:89 },
    { id:2, title:"Ton Vase", price:120 },
    { id:3, title:"Wandobjekt", price:240 },
  ];

  if (activeTab === "bewegung") {
    const items = (activities?.length ? activities : mockActivities);
    return (
      <div style={{ padding:"0 20px" }}>
        {(items||[]).filter(item=>item&&item.id).map(item => <ActivityCard key={item.id} item={item}/>)}
      </div>
    );
  }

  if (activeTab === "werke") {
    const items = works?.length ? works : mockWorks;
    return (
      <div className="hui-scroll" style={{
        display:"flex", gap:14, overflowX:"auto",
        padding:"0 20px 20px", WebkitOverflowScrolling:"touch",
      }}>
        {(items||[]).filter(w=>w&&w.id).map(w => <WorkCard key={w.id} work={w}/>)}
      </div>
    );
  }

  if (activeTab === "erlebnisse") {
    const items = experiences?.length ? experiences : mockActivities;
    return (
      <div style={{ padding:"0 20px" }}>
        {(items||[]).filter(item=>item&&item.id).map(item => <ActivityCard key={item.id} item={item}/>)}
      </div>
    );
  }

  return (
    <div style={{
      padding:"40px 20px", textAlign:"center",
      color:"rgba(80,80,80,0.4)", fontSize:13,
    }}>
      <div style={{ fontSize:32, marginBottom:8 }}>✦</div>
      Dieser Bereich entfaltet sich bald
    </div>
  );
}
