import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";

const T = {
  teal:"rgba(14,196,184,1)", white:"#FFFFFF", ink:"rgba(26,26,46,0.92)",
  bg:"#F2F4F8", border:"rgba(22,215,197,0.14)", cardShadow:"0 2px 12px rgba(0,0,0,0.07)",
  px:16, inkSoft:"rgba(26,26,46,0.55)", inkFaint:"rgba(26,26,46,0.35)",
  tealSoft:"rgba(14,196,184,0.12)", tealDeep:"rgba(0,150,136,1)"
};

const SEED_ORTE = [
  { id:"o1", name:"Waldlichtung",     city:"München",   dist:"0,3 km", cover:"", actives:8,  nextEvent:"übermorgen" },
  { id:"o2", name:"Community Garten", city:"Hamburg",   dist:"1,2 km", cover:"", actives:12, nextEvent:"" },
  { id:"o3", name:"Atelier Raum",     city:"Berlin",    dist:"2,7 km", cover:"", actives:9,  nextEvent:"" },
  { id:"o4", name:"Meditationsraum",  city:"Freiburg",  dist:"3,1 km", cover:"", actives:0,  nextEvent:"morgen" },
  { id:"o5", name:"HUI Studio",       city:"Köln",      dist:"4,5 km", cover:"", actives:5,  nextEvent:"" },
  { id:"o6", name:"Kreativwerkstatt", city:"Stuttgart", dist:"5,8 km", cover:"", actives:3,  nextEvent:"nächste Woche" },
];

function OrtCardItem({ ort }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div style={{
      background:T.white, borderRadius:14, overflow:"hidden",
      boxShadow:T.cardShadow, border:`1px solid ${T.border}`,
      display:"flex", flexDirection:"column",
    }}>
      <div style={{ height:90, background:T.tealSoft, position:"relative", overflow:"hidden" }}>
        {!imgErr && ort.cover
          ? <img loading="lazy" decoding="async" src={ort.cover} alt={ort.name}
              onError={() => setImgErr(true)} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>🌿</div>
        }
        {ort.dist !== "—" && ort.dist && (
          <div style={{
            position:"absolute", top:6, left:6,
            background:"rgba(255,255,255,0.9)", borderRadius:99,
            fontSize:9.5, fontWeight:700, color:T.tealDeep, padding:"2px 8px",
            backdropFilter:"blur(4px)"
          }}>{ort.dist}</div>
        )}
      </div>
      <div style={{ padding:"8px 10px 10px", display:"flex", flexDirection:"column", flex:1 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:2 }}>{ort.name}</div>
        <div style={{ fontSize:11, color:T.inkFaint, display:"flex", alignItems:"center", gap:3, marginBottom:4 }}>
          <span>📍</span><span>{ort.city}</span>
        </div>
        <div style={{ marginTop:"auto", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background: ort.actives > 0 ? "#16A34A" : "#ccc" }}/>
            <span style={{ fontSize:11, color: ort.actives > 0 ? "#16A34A" : T.inkFaint, fontWeight:600 }}>
              {ort.actives} aktiv
            </span>
          </div>
          {ort.nextEvent && (
            <span style={{
              fontSize:10, color:T.tealDeep, background:T.tealSoft,
              borderRadius:99, padding:"2px 7px", fontWeight:600
            }}>📅 {ort.nextEvent}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrteAllModal({ isOpen, onClose }) {
  useWizardBodyLock(isOpen);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = SEED_ORTE.filter(o =>
    !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.city.toLowerCase().includes(search.toLowerCase())
  );

  return createPortal(
    <div onClick={onClose} style={{
      position:"fixed", inset:0, zIndex:10500, background:"rgba(0,0,0,0.45)",
      display:"flex", alignItems:"flex-start", justifyContent:"center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        marginTop:"env(safe-area-inset-top,44px)", maxWidth:480, width:"100%",
        height:"calc(100dvh - env(safe-area-inset-top,44px))",
        background:T.bg, borderRadius:"20px 20px 0 0",
        display:"flex", flexDirection:"column", overflow:"hidden",
      }}>
        <div style={{ padding:"16px 16px 8px", background:T.white, borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:T.ink }}>Orte entdecken</div>
              <div style={{ fontSize:11.5, color:T.inkFaint }}>Besondere HUI-Räume, Parks & Begegnungsorte</div>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", fontSize:22, cursor:"pointer", color:T.inkSoft, padding:4 }}>✕</button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Orte suchen…"
            style={{ width:"100%", padding:"9px 14px", borderRadius:12, border:`1px solid ${T.border}`,
              background:"#f8fafc", fontSize:14, color:T.ink, outline:"none", boxSizing:"border-box" }}/>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px 12px 0" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 20px", color:T.inkFaint }}>
              <div style={{ fontSize:32, marginBottom:12 }}>🌿</div>
              <div style={{ fontSize:15, fontWeight:600 }}>Kein Ort gefunden</div>
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {filtered.map(o => <OrtCardItem key={o.id} ort={o}/>)}
          </div>

          {/* Bottom-Spacer: Navbar + safe-area (iOS Safari ignoriert paddingBottom bei scroll) */}
          <div style={{ height:"calc(88px + env(safe-area-inset-bottom, 0px))", flexShrink:0 }}/>
        </div>
      </div>
    </div>,
    document.body
  );
}
