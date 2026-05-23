// WirkerIdentity.jsx — Phase 24 FINAL
// Identity strip: avatar floats over hero, actions row
import React from "react";

const S = (v, fb = "") => (v && typeof v === "string" ? v : fb);

export default function WirkerIdentity({ profile = {}, followed, followLoading, onFollow, onChat, onShare }) {
  const name      = S(profile?.display_name || profile?.name, "Creator");
  const location  = S(profile?.location, "");
  const type      = S(profile?.type || profile?.talent, "Creator");
  const verified  = !!profile?.verified;
  const presence  = S(profile?.presence_status, "Gerade im Atelier");
  const avatar    = S(profile?.img, `https://i.pravatar.cc/80?u=${profile?.id || "hui"}`);

  return (
    <div style={{
      width:"100%", background:"white",
      borderBottom:"1px solid rgba(0,0,0,0.06)",
      padding:"0 18px 14px",
    }}>
      {/* Avatar row — overlaps hero */}
      <div style={{
        display:"flex", alignItems:"flex-end", gap:12,
        marginTop:-34, marginBottom:10,
      }}>
        <div style={{position:"relative",flexShrink:0}}>
          <img src={avatar} alt={name}
            onError={e=>{e.target.src=`https://i.pravatar.cc/80?u=${name}`;}}
            style={{
              width:68,height:68,borderRadius:"50%",
              border:"3.5px solid white",objectFit:"cover",
              boxShadow:"0 4px 14px rgba(0,0,0,.14)",
              background:"#f0ede8",
            }} />
          <div style={{
            position:"absolute",bottom:3,right:3,
            width:13,height:13,borderRadius:"50%",
            background:"#22C55E",border:"2px solid white",
          }}/>
        </div>

        <div style={{flex:1,paddingBottom:2}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:16,fontWeight:800,color:"#1A1A1A",letterSpacing:"-.025em"}}>{name}</span>
            {verified && (
              <span style={{
                background:"#0DC4B5",color:"white",
                fontSize:9,fontWeight:800,borderRadius:99,padding:"2px 6px",
              }}>✓</span>
            )}
          </div>
          <div style={{fontSize:11,color:"#888",fontWeight:500,marginTop:2}}>
            {type}{location ? ` · ${location}` : ""}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,marginTop:4}}>
            <div style={{
              width:7,height:7,borderRadius:"50%",background:"#22C55E",
              animation:"pulse 2s infinite",
            }}/>
            <span style={{fontSize:11,color:"#0DC4B5",fontWeight:600}}>{presence}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{display:"flex",gap:7,alignItems:"center"}}>
        <button onClick={onShare} style={{
          background:"#0DC4B5",border:"none",borderRadius:99,
          padding:"9px 20px",color:"white",fontSize:13,fontWeight:700,
          cursor:"pointer",flex:1,
          boxShadow:"0 3px 14px rgba(13,196,181,.28)",
          touchAction:"manipulation",
        }}>Teilen</button>

        <button onClick={onChat} style={{
          background:"rgba(13,196,181,.08)",border:"1.5px solid rgba(13,196,181,.22)",
          borderRadius:99,width:38,height:38,
          display:"flex",alignItems:"center",justifyContent:"center",
          cursor:"pointer",fontSize:15,touchAction:"manipulation",
        }}>✉️</button>

        <button style={{
          background:"rgba(0,0,0,.04)",border:"1.5px solid rgba(0,0,0,.09)",
          borderRadius:99,width:38,height:38,
          display:"flex",alignItems:"center",justifyContent:"center",
          cursor:"pointer",fontSize:15,touchAction:"manipulation",
        }}>🔖</button>

        <button onClick={onFollow} disabled={!!followLoading} style={{
          background: followed?"rgba(0,0,0,.05)":"rgba(13,196,181,.08)",
          border:`1.5px solid ${followed?"rgba(0,0,0,.10)":"rgba(13,196,181,.28)"}`,
          borderRadius:99,padding:"8px 13px",
          color:followed?"#888":"#0DC4B5",
          fontSize:11,fontWeight:700,
          cursor:followLoading?"default":"pointer",
          opacity:followLoading?.5:1,
          touchAction:"manipulation",
        }}>{followed?"Gefolgt":"Folgen"}</button>
      </div>
    </div>
  );
}
