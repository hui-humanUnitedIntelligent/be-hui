// src/components/discover/MomenteSection.jsx
// MomentCard + MomenteSection — extracted from DiscoverPage.jsx. No logic changes.
import React, { useState } from "react";
import { T, timeAgo, CARD_RADIUS } from "./constants.js";
import { Skel, SectionHead, CardBadge, CardTitle, CardLocationRow } from "./atoms.jsx";
import { HUILogo } from "../brand/HUILogo.jsx";
import { HUIAnsichtIcon, HUILocationIcon } from "../../design/icons/HuiSystemIcons.jsx";
import { HUIHeartIcon, HUIChatIcon } from "../../design/icons/HuiInteractionIcons.jsx";
import { optimizeCard } from "../../lib/perfUtils.js";
import { useTranslation } from "../../hooks/useTranslation.js";

export function MomentCard({ moment, delay=0, onPress, onAuthorPress }) {
  const [imgErr, setImgErr] = useState(false);
  // VIDEO-THUMBNAIL-001 (2026-08-31): thumbnail_url (extrahierter Frame)
  // hat Priorität über das Video selbst.
  const cover = (!imgErr && (moment.thumbnail_url || moment.src || moment.media_url)) ? (moment.thumbnail_url || moment.src || moment.media_url) : null;

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(moment)} style={{
      width:165, flexShrink:0,
      borderRadius:CARD_RADIUS, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      display:"flex", flexDirection:"column",
    }}>
      {/* Cover — identische Höhe wie WerkCard/ErlebnisCard */}
      <div style={{ width:"100%", height:120, flexShrink:0, position:"relative", overflow:"hidden",
        background: cover ? "#1A1A18" : `linear-gradient(135deg,${T.tealSoft},${T.coralSoft})` }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={optimizeCard(cover)} alt={moment.caption || "Moment"}
            onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <HUILogo size={44} style={{opacity:0.5}} />
          </div>
        )}

        {/* MOMENT-Badge oben links — identisch zu WERK/ERLEBNIS */}
        <CardBadge pos="left" bg="rgba(244,115,85,0.15)" color={T.coral} cover={cover}>
          MOMENT
        </CardBadge>

        {/* Live-Badge oben rechts (optional) */}
        {moment.isLive && (
          <CardBadge pos="right" bg="rgba(232,87,58,0.92)" color="#fff" cover={false}>
            <span style={{ display:"flex", alignItems:"center", gap:3 }}>
              <span className="dp-live-dot" style={{ width:5,height:5,borderRadius:"50%",background:"white",display:"inline-block" }}/>
              Live
            </span>
          </CardBadge>
        )}
      </div>

      {/* Info — flexGrow:1, flex-column für marginTop:auto */}
      <div style={{ padding:"10px 11px 12px", flexGrow:1, display:"flex", flexDirection:"column" }}>
        {/* Titel (caption) — identisch zu CardTitle */}
        <CardTitle>{moment.caption || moment.subject || "Moment"}</CardTitle>

        {/* Autor */}
        <div style={{ fontSize:10.5, color:T.inkFaint, fontWeight:400, marginBottom:6 }}>
          von{" "}
          <span style={{ textDecoration:"none" }}>{moment.name}</span>
        </div>

        {/* Standort (falls vorhanden) */}
        <div style={{ minHeight:moment.location ? "auto" : 0 }}>
          {moment.location && <CardLocationRow location={moment.location}/>}
        </div>

        {/* Engagement Row — immer am unteren Rand */}
        <div className="dp-engage" style={{ marginTop:"auto", paddingTop:4 }}>
          <span><HUIHeartIcon size={12} /> {moment.likes ?? 0}</span>
          <span><HUIChatIcon size={12} /> {moment.comments ?? 0}</span>
          <span style={{display:"flex",alignItems:"center",gap:2}}><HUIAnsichtIcon size={12}/>{moment.views ?? 0}</span>
        </div>
      </div>
    </div>
  );
}

export function MomenteSection({ momente=[], loading, delay=0, view='cards', onPress, onAuthorPress = () => {}, onSectionAction }) {
  const { t } = useTranslation();
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-momente/>
      <SectionHead
        title={t("discover.momente")}
        sub={t("discover.stories")}
        action={t("discover.showAll")}
        onAction={onSectionAction}
        delay={delay}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:175, flexShrink:0, borderRadius:18, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={130} r={0} mb={0}/>
                  <div style={{ padding:"10px 10px" }}><Skel w="80%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={6}/></div>
                </div>
              ))
            : momente.length === 0
            ? <div style={{ paddingLeft:T.px, fontSize:12.5, color:T.inkFaint, fontStyle:'italic', opacity:0.75 }}>{t("mom.emptyNearby")}</div>
            : momente.map((m, i) => <MomentCard key={m.id} moment={m} delay={i*35+delay} onPress={onPress} onAuthorPress={onAuthorPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="45%" h={10} r={5}/></div></div>
              ))
            : momente.map((m) => (
                <div key={m.id} className="dp-list-card" onClick={() => onPress?.(m)} style={{cursor:"pointer"}} role="button" tabIndex={0}>
                  {m.src
                    ? <img loading="lazy" decoding="async" src={m.thumbnail_url || m.src} alt={m.caption} className="dp-list-thumb" onError={e => e.target.style.display='none'} style={{ objectFit:"cover" }}/>
                    : <div className="dp-list-thumb-placeholder" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><HUILogo size={34} style={{opacity:0.5}}/></div>
                  }
                  <div style={{ flex:1, overflow:"hidden" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", lineHeight:1.35 }}>{m.caption}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span
                        style={{ fontSize:11, fontWeight:600, color:T.inkSoft }}
                      >{m.name}</span>
                      {m.location && <span style={{ fontSize:11, color:T.inkFaint, display:"flex", alignItems:"center", gap:2 }}><HUILocationIcon size={11}/>{m.location}</span>}
                      <span style={{ fontSize:10.5, color:T.inkFaint }}>{timeAgo(m.created_at)}</span>
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
// 4b. TALENTE ENTDECKEN (TALENT-DISCOVERY-001, 2026-07-05)
// Zeigt freigegebene Dienstleistungen aus der "talents"-Tabelle
// (TALENT-OFFERS-001/TALENT-SERVICES-001). Gleiches Karten-Layout wie
// "Werke entdecken" (WerkCard/WerkeSection), bewusst als eigene, additive
// Komponente — kein Umbau der bestehenden Werke-Sektion.
// ════════════════════════════════════════════════════════════════
// SEED_TALENTE entfernt — war Dead Code (nie referenziert).


// ── Gemeinsame Card-Bausteine (Werk/Erlebnis/Talent) ──────────────
// SUCHKARTEN-VEREINHEITLICHUNG 2026-07-09: TalentCard/WerkCard/ErlebnisCard
// nutzten fast identische, aber leicht abweichende Werte (Eckenradius,
// Titel-/Standort-Abstaende). Auf gemeinsame Bausteine gezogen, damit alle
// drei Discover-Karten wie eine Familie wirken -- Inhalte pro Typ bleiben
// bewusst unterschiedlich (Preis/Status/Datum sind echte Domaenen-Unterschiede,
// keine Inkonsistenz).

