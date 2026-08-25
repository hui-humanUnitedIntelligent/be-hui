// src/components/discover/PeopleSection.jsx
// PersonCard + PeopleSection — extracted from DiscoverPage.jsx. No logic changes.
import React, { useState } from "react";
import { T, fmtImpact } from "./constants.js";
import { Skel, SectionHead } from "./atoms.jsx";
import { HUIProfilIcon, HUILocationIcon } from "../../design/icons/HuiSystemIcons.jsx";
import { formatPresence } from "../../lib/usePresence.js";
import { optimizeAvatar } from "../../lib/perfUtils.js";

export function PersonCard({ person = {}, onPress = () => {}, delay=0, followers=0, likes=0 }) {
  const [imgErr, setImgErr] = useState(false);
  const av = (!imgErr && person.avatar) ? person.avatar : null;
  const presence = formatPresence(person.last_seen_at);

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(person)} style={{
      width:135, flexShrink:0,
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"14px 10px 12px",
      background:T.white,
      borderRadius:20,
      boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      position:"relative",
    }}>
      {/* Avatar + Online-Dot */}
      <div style={{ position:"relative", marginBottom:10 }}>
        <div style={{
          width:72, height:72, borderRadius:"50%", overflow:"hidden",
          border:`2.5px solid ${T.white}`,
          boxShadow:`0 0 0 2.5px rgba(14,196,184,0.30), 0 4px 14px rgba(26,53,48,0.12)`,
          background:av ? "transparent" : T.tealSoft,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {av ? (
            <img loading="lazy" decoding="async" src={optimizeAvatar(av)} alt={person.name} onError={() => setImgErr(true)}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
          ) : (
            <HUIProfilIcon size={26} style={{opacity:0.4, color:"rgba(14,196,184,0.6)"}} />
          )}
        </div>
        {/* Online-Status Dot */}
        <div style={{
          position:"absolute", bottom:2, right:2,
          width:14, height:14, borderRadius:"50%",
          background: presence?.online ? "#22c55e" : presence ? "rgba(200,200,200,0.9)" : "rgba(200,200,200,0.9)",
          border:"2px solid white",
          boxShadow: presence?.online ? "0 0 0 2px rgba(34,197,94,0.25)" : "none",
        }} className={presence?.online ? "dp-online-pulse" : ""}/>
      </div>

      {/* Name — fixe Höhe für 2 Zeilen, garantiert gleiche Kartenhöhe */}
      <div style={{
        fontSize:12.5, fontWeight: 600, color:T.ink, textAlign:"center",
        letterSpacing:"-0.02em", lineHeight:1.25, marginBottom:3,
        minHeight:31.25, width:"100%",
        overflow:"hidden", display:"-webkit-box",
        WebkitLineClamp:2, WebkitBoxOrient:"vertical",
      }}>
        {person.name}
      </div>

      {/* Bio — immer 2 Zeilen Platz reserviert, auch wenn leer */}
      <div style={{
        fontSize:10.5, color:T.inkSoft, textAlign:"center", lineHeight:1.4,
        marginBottom:6, fontWeight:400, minHeight:29.4, width:"100%",
        overflow:"hidden", display:"-webkit-box",
        WebkitLineClamp:2, WebkitBoxOrient:"vertical",
      }}>
        {person.bio || ""}
      </div>

      {/* Ort — immer 1 Zeile Platz reserviert, auch wenn leer */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"center", gap:3,
        fontSize:10, color:T.inkFaint, marginBottom:8, minHeight:13, width:"100%",
      }}>
        {person.location && (
          <>
            <HUILocationIcon size={9} style={{flexShrink:0}} />
            <span style={{ fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{person.location}</span>
          </>
        )}
      </div>

      {/* Follower + Likes — immer nebeneinander in 1 Zeile, IMMER am unteren Kartenrand
          (marginTop:auto schiebt die Zeile nach unten; da .dp-hscroll ein Flex-Row mit
          Default-align-items:stretch ist, haben alle Karten in der Reihe bereits dieselbe
          Höhe — die Badges docken so bei jeder Karte exakt an der gleichen Y-Position an,
          unabhängig davon ob Bio/Ort kürzer sind) */}
      <div style={{ display:"flex", gap:4, flexWrap:"nowrap", justifyContent:"center", marginTop:"auto", paddingTop:4, width:"100%" }}>
        <div style={{
          display:"flex", alignItems:"center", gap:3,
          background:"rgba(14,196,184,0.08)", borderRadius:99, padding:"3px 8px",
          border:"1px solid rgba(14,196,184,0.12)",
        }}>
          <span style={{ fontSize:10 }}>👥</span>
          <span style={{ fontSize:10.5, fontWeight: 600, color:T.tealDeep }}>{followers}</span>
        </div>
        <div style={{
          display:"flex", alignItems:"center", gap:3,
          background:"rgba(239,68,68,0.08)", borderRadius:99, padding:"3px 8px",
          border:"1px solid rgba(239,68,68,0.12)",
        }}>
          <span style={{ fontSize:10 }}>❤️</span>
          <span style={{ fontSize:10.5, fontWeight: 600, color:"#e04050" }}>{likes}</span>
        </div>
      </div>
    </div>
  );
}

export function PeopleSection({ people, onPersonPress, loading, delay=0, view='cards', onSectionAction }) {
  return (
    <div className="dp-in" style={{ animationDelay:`${delay}ms`, marginTop:10 }}>
      <div data-dp-people/>
      <SectionHead
        title="Inspirierende Menschen"
        sub="Entdecke wundervolle Menschen auf HUI."
        action="Alle anzeigen"
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{
          display:"flex", gap:10,
          paddingLeft:T.px, paddingRight:T.px, paddingBottom:4,
        }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:130, flexShrink:0, borderRadius:20, overflow:"hidden", background:T.white, boxShadow:T.cardShadow, padding:"14px 10px" }}>
                  <Skel w={72} h={72} r={99} mb={10} />
                  <Skel w="80%" h={12} r={8} mb={6} />
                  <Skel w="60%" h={10} r={6} mb={8} />
                  <Skel w="70%" h={10} r={6} />
                </div>
              ))
            : people.length === 0
            ? <div style={{ paddingLeft:T.px, fontSize:12.5, color:T.inkFaint, fontStyle:'italic', opacity:0.75 }}>Noch keine Mitglieder gefunden.</div>
            : people.map((p, i) => (
                <PersonCard key={p.id} person={p} onPress={onPersonPress} delay={0} followers={p.followers || 0} likes={p.likes || 0} />
              ))
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12} /><div style={{flex:1}}><Skel w="70%" h={13} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div></div>
              ))
            : people.map((p, i) => (
                <div key={p.id} className="dp-list-card" onClick={() => onPersonPress?.(p)} role="button" tabIndex={0}>
                  {p.avatar
                    ? <img loading="lazy" decoding="async" src={optimizeAvatar(p.avatar)} alt={p.name} className="dp-list-thumb" onError={e => e.target.style.display='none'}/>
                    : <div className="dp-list-thumb-placeholder" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><HUIProfilIcon size={24} style={{opacity:0.35, color:"rgba(14,196,184,0.5)"}}/></div>
                  }
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={{ fontSize:13.5, fontWeight: 600, color:T.ink, marginBottom:3, letterSpacing:"-0.02em" }}>{p.name}</div>
                    <div style={{ fontSize:11.5, color:T.inkSoft, marginBottom:5, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{p.bio}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {p.location && <span style={{ fontSize:11, color:T.inkFaint, display:"flex", alignItems:"center", gap:2 }}><HUILocationIcon size={11}/>{p.location}</span>}
                      <span style={{ fontSize:11, color:T.teal, fontWeight:600 }}>⚡ {fmtImpact(p.impact)}</span>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. MOMENTE AUS DEINER NÄHE
// ════════════════════════════════════════════════════════════════
// SEED_MOMENTE entfernt — war Dead Code (nie referenziert).

