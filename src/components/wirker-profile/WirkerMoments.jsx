// WirkerMoments.jsx — Phase 24 FINAL
// Editorial moments + community — two-column layout matching mockup
import React, { useState, useRef, useEffect } from "react";

const safeArr = v => Array.isArray(v)?v:[];

const SEED_MOMENTS = [
  {id:"m1",time:"2 Std. zuvor",caption:"Neues Werk in Arbeit - Fragments of Light",reactions:48,
   img:"https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=280&q=75"},
  {id:"m2",time:"Gestern",caption:"Ein stiller Morgen im Atelier. So entstehen neue Ideen.",reactions:38,
   img:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=280&q=75"},
  {id:"m3",time:"2 Tage zuvor",caption:"Inspiration pur: Dankbar fur diese Momente in der Natur.",reactions:52,
   img:"https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=280&q=75"},
  {id:"m4",time:"3 Tage zuvor",caption:"Wundervoller Musikabend mit so talen Menschen.",reactions:41,
   img:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=280&q=75"},
];

const SEED_COMMUNITY = [
  {id:"c1",name:"Mara",   role:"Unterstutzt dich",  status:"Aktiv",av:"https://i.pravatar.cc/36?img=1"},
  {id:"c2",name:"Jonas",  role:"War im Workshop",   status:"Aktiv",av:"https://i.pravatar.cc/36?img=3"},
  {id:"c3",name:"Lina",   role:"Resoniert mit dir", status:"Aktiv",av:"https://i.pravatar.cc/36?img=5"},
  {id:"c4",name:"Tobias", role:"Plant Buchung",     status:"Aktiv",av:"https://i.pravatar.cc/36?img=8"},
];

function MomentCard({ m }) {
  const [pressed,setPressed]=useState(false);
  return (
    <div
      onPointerDown={()=>setPressed(true)}
      onPointerUp={()=>setPressed(false)}
      onPointerLeave={()=>setPressed(false)}
      style={{
        flexShrink:0,width:154,borderRadius:16,overflow:"hidden",
        background:"white",boxShadow:"0 3px 14px rgba(0,0,0,.07)",
        cursor:"pointer",border:"1px solid rgba(0,0,0,.04)",
        transform:pressed?"scale(.97)":"scale(1)",
        transition:"transform .15s ease",touchAction:"manipulation",
      }}
    >
      <div style={{height:118,overflow:"hidden",position:"relative",background:"#e8e3dd"}}>
        <img src={m.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}
          onError={e=>{e.target.style.display="none";}}/>
        <div style={{
          position:"absolute",inset:0,
          background:"linear-gradient(to top,rgba(0,0,0,.30),transparent 50%)",
        }}/>
        <div style={{
          position:"absolute",bottom:6,left:8,
          fontSize:8,color:"rgba(255,255,255,.85)",fontWeight:600,
          textShadow:"0 1px 3px rgba(0,0,0,.5)",
        }}>{m.time}</div>
      </div>
      <div style={{padding:"9px 10px 11px"}}>
        <div style={{
          fontSize:10,color:"#333",lineHeight:1.4,fontWeight:500,
          display:"-webkit-box",WebkitLineClamp:2,
          WebkitBoxOrient:"vertical",overflow:"hidden",
        }}>{m.caption}</div>
        <div style={{display:"flex",alignItems:"center",gap:4,marginTop:7,fontSize:9,color:"#999"}}>
          <span>💛</span>
          <span style={{fontWeight:600}}>{m.reactions}</span>
          <span>Resonanzen</span>
        </div>
      </div>
    </div>
  );
}

function CommunityRow({ member }) {
  return (
    <div style={{
      display:"flex",alignItems:"center",gap:9,
      padding:"7px 0",borderBottom:"1px solid rgba(0,0,0,.04)",
    }}>
      <img src={member.av} alt={member.name}
        style={{width:32,height:32,borderRadius:"50%",objectFit:"cover",flexShrink:0,background:"#e0dbd4"}}
        onError={e=>{e.target.style.display="none";}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:700,color:"#1A1A1A",letterSpacing:"-.015em"}}>{member.name}</div>
        <div style={{fontSize:10,color:"#888",fontWeight:500}}>{member.role}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#22C55E",fontWeight:700}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:"#22C55E"}}/>
        {member.status}
      </div>
    </div>
  );
}

export default function WirkerMoments({ moments, community, onSeeAll, onSeeAllCommunity }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    const obs=new IntersectionObserver(
      ([e])=>{if(e.isIntersecting){setVisible(true);obs.disconnect();}},{threshold:.05}
    );
    obs.observe(el);
    return()=>obs.disconnect();
  },[]);

  const items   = safeArr(moments).length   ? safeArr(moments)   : SEED_MOMENTS;
  const members = safeArr(community).length ? safeArr(community) : SEED_COMMUNITY;

  return (
    <div ref={ref} style={{
      width:"100%",background:"white",
      padding:"20px 0 20px",
      opacity:visible?1:0,transform:visible?"none":"translateY(14px)",
      transition:"opacity .7s ease,transform .7s ease",
    }}>
      {/* TOP: Moments scroll — full width */}
      <div>
        <div style={{
          padding:"0 18px 14px",
          display:"flex",justifyContent:"space-between",alignItems:"baseline",
        }}>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#1A1A1A",letterSpacing:"-.025em"}}>Aktuelle Momente</div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>Neues aus meinem Universum.</div>
          </div>
          <span onClick={onSeeAll}
            style={{fontSize:11,color:"#0DC4B5",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
            Alle Momente →
          </span>
        </div>
        <div style={{
          display:"flex",gap:11,overflowX:"auto",scrollbarWidth:"none",
          padding:"3px 18px 6px",WebkitOverflowScrolling:"touch",
        }}>
          {items.map(m=><MomentCard key={m.id} m={m}/>)}
          <div style={{flexShrink:0,width:4}}/>
        </div>
      </div>

      {/* BOTTOM: Community — below moments */}
      <div style={{padding:"20px 18px 4px"}}>
        <div style={{
          display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4,
        }}>
          <div style={{fontSize:15,fontWeight:800,color:"#1A1A1A",letterSpacing:"-.025em"}}>
            Deine Community
          </div>
          <span onClick={onSeeAllCommunity}
            style={{fontSize:11,color:"#0DC4B5",fontWeight:700,cursor:"pointer"}}>
            Alle anzeigen →
          </span>
        </div>
        <div style={{fontSize:11,color:"#888",marginBottom:12}}>
          Menschen, die mit dir resonieren.
        </div>
        <div style={{
          background:"#F9F7F4",borderRadius:16,padding:"4px 14px",
          border:"1px solid rgba(0,0,0,.04)",
          boxShadow:"0 2px 10px rgba(0,0,0,.04)",
        }}>
          {members.map(m=><CommunityRow key={m.id} member={m}/>)}
        </div>
      </div>
    </div>
  );
}
