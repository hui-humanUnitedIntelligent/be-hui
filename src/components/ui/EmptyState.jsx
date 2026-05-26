// src/components/ui/EmptyState.jsx — Phase 4B
import React from "react";

const TEAL  = "#16D7C5";
const CORAL = "#FF8A6B";
const INK   = "#1A1A2E";

const PRESETS = {
  feed:          { icon:"✦",  title:"Noch keine Beiträge",        body:"Wenn kreative Menschen in HUI aktiv werden, erscheinen ihre Beiträge hier." },
  stories:       { icon:"○",  title:"Keine Stories",              body:"Teile einen Moment — deine Momente gehören zu dir.", cta:"Story erstellen", gradient:`linear-gradient(135deg,${TEAL}18,${CORAL}10)` },
  saves:         { icon:"🔖", title:"Noch nichts gespeichert",    body:"Drücke auf das Lesezeichen bei Beiträgen — sie warten hier auf dich." },
  notifications: { icon:"✦",  title:"Noch ruhig hier",            body:"Wenn jemand reagiert oder folgt, erfährst du es hier — ruhig und ohne Hektik." },
  followers:     { icon:"👤", title:"Noch keine Verbindungen",    body:"Wenn Menschen dir folgen, erscheinen sie hier." },
  following:     { icon:"○",  title:"Du folgst noch niemandem",   body:"Entdecke kreative Menschen und ihre Welten.", cta:"Entdecken" },
  posts:         { icon:"✦",  title:"Noch keine Beiträge",        body:"Teile deine erste Geschichte, dein Werk oder einen Moment.", cta:"Ersten Beitrag erstellen" },
  events:        { icon:"📅", title:"Keine Events",               body:"Wenn du Erlebnisse anbietest oder buchst, erscheinen sie hier." },
  search:        { icon:"○",  title:"Nichts gefunden",            body:"Versuch es mit anderen Worten oder stöbere in den Kategorien." },
  error:         { icon:"○",  title:"Konnte nicht geladen werden", body:"Etwas ist schiefgelaufen. Bitte versuche es erneut.", cta:"Erneut versuchen" },
  offline:       { icon:"○",  title:"Keine Verbindung",           body:"Du bist offline. Sobald du wieder verbunden bist, lädt alles nach." },
};

export default function EmptyState({ preset, icon, title, body, cta, onCta, compact=false, style:extStyle }) {
  const p     = PRESETS[preset] || {};
  const _icon = icon  || p.icon  || "✦";
  const _title= title || p.title || "";
  const _body = body  || p.body  || "";
  const _cta  = cta !== undefined ? cta : p.cta;
  const _grad = p.gradient || "linear-gradient(135deg,rgba(22,215,197,0.10),rgba(255,138,107,0.07))";

  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      padding:compact?"24px 16px":"48px 24px", gap:compact?10:16, textAlign:"center", ...extStyle }}>
      <div style={{
        width:compact?56:72, height:compact?56:72, borderRadius:compact?18:24,
        background:_grad, display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:compact?24:30, border:"1.5px solid rgba(22,215,197,0.12)", flexShrink:0,
      }}>{_icon}</div>
      <div style={{maxWidth:compact?200:260}}>
        {_title && <div style={{ fontSize:compact?14:16, fontWeight:700, color:INK,
          marginBottom:compact?4:6, letterSpacing:-0.2 }}>{_title}</div>}
        {_body  && <div style={{ fontSize:compact?12.5:13.5, color:"rgba(26,26,46,0.45)",
          lineHeight:1.65 }}>{_body}</div>}
      </div>
      {_cta && onCta && (
        <button onClick={onCta} style={{
          marginTop:compact?4:8, padding:compact?"9px 20px":"11px 26px", borderRadius:20,
          border:"1.5px solid rgba(22,215,197,0.30)", background:"rgba(22,215,197,0.07)",
          color:TEAL, fontSize:compact?13:14, fontWeight:700,
          cursor:"pointer", touchAction:"manipulation", transition:"all 0.15s ease",
        }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(22,215,197,0.14)";e.currentTarget.style.borderColor=TEAL;}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(22,215,197,0.07)";e.currentTarget.style.borderColor="rgba(22,215,197,0.30)";}}
        >{_cta}</button>
      )}
    </div>
  );
}

export function ImageWithFallback({ src, alt="", style:extStyle, fallbackIcon="○", onLoad:onLoadExt, onError:onErrorExt }) {
  const [state, setState] = React.useState("loading");
  React.useEffect(()=>{ setState("loading"); },[src]);

  if (!src) return (
    <div style={{...extStyle, background:"rgba(22,215,197,0.07)", display:"flex",
      alignItems:"center",justifyContent:"center", fontSize:24, color:"rgba(22,215,197,0.4)"}}>
      {fallbackIcon}
    </div>
  );

  return (
    <div style={{position:"relative",...extStyle}}>
      {state==="loading" && (
        <div style={{position:"absolute",inset:0,borderRadius:"inherit",
          background:"linear-gradient(90deg,rgba(26,26,46,0.06) 25%,rgba(26,26,46,0.10) 50%,rgba(26,26,46,0.06) 75%)",
          backgroundSize:"200% 100%",animation:"imgSkel 1.4s ease infinite"}}>
          <style>{`@keyframes imgSkel{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      )}
      {state==="error" && (
        <div style={{position:"absolute",inset:0,borderRadius:"inherit",
          background:"rgba(22,215,197,0.06)",display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:20,color:"rgba(22,215,197,0.35)"}}>
          {fallbackIcon}
        </div>
      )}
      <img src={src} alt={alt}
        onLoad={()=>{setState("loaded");onLoadExt?.();}}
        onError={()=>{setState("error");onErrorExt?.();}}
        style={{...extStyle,position:"relative",opacity:state==="loaded"?1:0,
          transition:"opacity 0.3s ease",display:"block",top:0,left:0,margin:0}}
      />
    </div>
  );
}
