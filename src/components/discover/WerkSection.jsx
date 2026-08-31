// src/components/discover/WerkSection.jsx
// WerkCard + WerkeSection — extracted from DiscoverPage.jsx.
import React, { useState } from "react";
import { T, CARD_RADIUS, MEDIUM_COLOR } from "./constants.js";
import { Skel, SectionHead, CardBadge, CardTitle, CardLocationRow } from "./atoms.jsx";
import { HUILogo } from "../brand/HUILogo.jsx";
import { HUILocationIcon, HUIAnsichtIcon } from "../../design/icons/HuiSystemIcons.jsx";
import { optimizeCard } from "../../lib/perfUtils.js";
import { HUIHeartIcon } from "../../design/icons/HuiInteractionIcons.jsx";
import { formatNumberDE } from "../../lib/formatters.js";
import { LocationRadiusRow } from "./TalentSection.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

export function WerkCard({ werk, delay=0, onPress, onAuthorPress, saleStatus }) {
  const { t } = useTranslation();
  const [imgErr, setImgErr] = useState(false);
  const cover  = (!imgErr && werk.cover) ? werk.cover : null;
  const medCol = MEDIUM_COLOR[werk.medium] || { bg:T.tealSoft, text:T.teal };
  const priceStr = werk.price != null
    ?formatNumberDE(parseFloat(werk.price), { minimumFractionDigits:0 }) + " €"
    : null;
  // WORK-SALE-STATUS-001 (2026-08-31): Werk bleibt im Entdecken-Feed sichtbar
  // (Michael: "nicht aus dem Entdecken löschen"), wird aber korrekt als
  // verkauft/reserviert markiert statt normal kaufbar zu wirken. Gleiche
  // SSOT-RPC + gleiches Badge-Muster wie WerkeAllModal.jsx / WorksSection.jsx.
  const ss = saleStatus?.[werk.id];
  const isSold = ss === "verkauft";
  const isReserved = ss === "reserviert";

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(werk)} style={{
      width:165, flexShrink:0,
      borderRadius:CARD_RADIUS, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      display:"flex", flexDirection:"column",
    }}>
      {/* Cover — feste Höhe, nie gestaucht */}
      <div style={{ width:"100%", height:120, flexShrink:0, position:"relative", overflow:"hidden", background:cover ? "#1A1A18" : medCol.bg }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={optimizeCard(cover)} alt={werk.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block",
              filter: isSold ? "grayscale(0.55) brightness(0.85)" : "none" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <HUILogo size={40} style={{opacity:0.55}} />
          </div>
        )}
        {/* Kategorie-Badge oben links */}
        {werk.medium && (
          <CardBadge pos="left" bg={medCol.bg} color={medCol.text} cover={cover}>
            {werk.medium}
          </CardBadge>
        )}
        {/* Verkauft/Reserviert-Badge unten links — Werk bleibt sichtbar, aber korrekt markiert */}
        {(isSold || isReserved) && (
          <div style={{
            position:"absolute", bottom:6, left:6,
            background: isSold ? "rgba(26,26,46,0.82)" : "rgba(245,166,35,0.88)",
            color:"#fff", borderRadius:99,
            fontSize:9.5, fontWeight:700, padding:"2px 8px",
            backdropFilter:"blur(4px)",
          }}>{isSold ? t("common.sold") : t("common.reserved")}</div>
        )}
      </div>

      {/* Info — flexGrow:1 füllt den Rest, flex-column für marginTop:auto */}
      <div style={{ padding:"10px 11px 12px", flexGrow:1, display:"flex", flexDirection:"column" }}>
        {/* Titel */}
        <CardTitle>{werk.title}</CardTitle>

        {/* Autor */}
        <div style={{ fontSize:10.5, color:T.inkFaint, fontWeight:400, marginBottom:6 }}>
          von{" "}
          <span style={{ textDecoration:"none" }}>{werk.author}</span>
        </div>

        {/* Standort — reservierter Platz damit Preis nicht springt */}
        <div style={{ minHeight:20 }}>
          <CardLocationRow location={werk.location} distanceKm={werk.distanceKm}/>
        </div>

        {/* Preis — immer am unteren Rand, unabhängig vom Ort */}
        <div style={{ marginTop:"auto", paddingTop:4 }}>
          <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
            {priceStr ? (
              <div style={{ fontSize:14, fontWeight: 600, color:T.teal, letterSpacing:"-0.02em" }}>
                {priceStr}
              </div>
            ) : (
              <div style={{ fontSize:10.5, color:T.inkFaint, fontStyle:"italic" }}>Nicht zum Verkauf</div>
            )}
          </div>
          {/* Likes + Views */}
          <div className="dp-engage">
            <span><HUIHeartIcon size={12} /> {werk.likes ?? 0}</span>
            <span style={{display:"flex",alignItems:"center",gap:2}}><HUIAnsichtIcon size={12}/>{werk.views ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Umkreissuche-Zeile fuer Werke/Erlebnisse -- identisches UI-Muster wie in
 * TalenteSection (siehe dort), nutzt aber denselben globalen radius-Zustand
 * (radiusKm/radiusStages/onRadiusChange kommen 1:1 aus useRadiusFilter()).
 * Bewusst als eigene kleine Komponente statt TalenteSection zu refactorn --
 * geringeres Konfliktrisiko mit der parallel laufenden Radius-Vereinheit-
 * lichungs-Session, gleiches Verhalten.
 */
export function WerkeSection({
  werke=[], saleStatus={}, loading, delay=0, view='cards', onPress, onAuthorPress = () => {}, onSectionAction,
  locQuery, onLocQueryChange, locSuggest, locSearching, locActive,
  onPickLoc, onClearLoc, radiusKm, radiusStages, onRadiusChange, hiddenNoCoordsCount=0,
}) {
  const { t } = useTranslation();
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-werke/>
      <SectionHead
        title={t("discover.werke")}
        sub={t("discover.werkeSub")}
        action={t("discover.alleWerke")}
        onAction={onSectionAction}
        delay={delay}
      />
      <LocationRadiusRow
        locQuery={locQuery} onLocQueryChange={onLocQueryChange}
        locSuggest={locSuggest} locSearching={locSearching} locActive={locActive}
        onPickLoc={onPickLoc} onClearLoc={onClearLoc}
        radiusKm={radiusKm} radiusStages={radiusStages} onRadiusChange={onRadiusChange}
        hiddenNoCoordsCount={hiddenNoCoordsCount}
      />
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:145, flexShrink:0, borderRadius:16, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={100} r={0} mb={0}/>
                  <div style={{ padding:"9px 10px" }}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={5}/></div>
                </div>
              ))
            : werke.length === 0
            ? <div style={{ paddingLeft:T.px, fontSize:12.5, color:T.inkFaint, fontStyle:'italic', opacity:0.75 }}>{t("werk.emptyNearby")}</div>
            : werke.map((w, i) => <WerkCardM key={w.id} werk={w} delay={i*35+delay} onPress={onPress} onAuthorPress={onAuthorPress} saleStatus={saleStatus} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="70%" h={12} r={6} mb={6}/><Skel w="40%" h={10} r={5}/></div></div>
              ))
            : werke.map((w) => {
                const medCol = MEDIUM_COLOR[w.medium] || { bg:T.tealSoft, text:T.teal };
                const priceStr = w.price != null
                  ?formatNumberDE(parseFloat(w.price), { minimumFractionDigits:0 }) + " €"
                  : null;
                const listSs = saleStatus?.[w.id];
                const listIsSold = listSs === "verkauft";
                return (
                  <div key={w.id} className="dp-list-card" onClick={() => onPress?.(w)} style={{cursor:"pointer"}} role="button" tabIndex={0}>
                    <div className="dp-list-thumb-placeholder" style={{ background: w.cover ? "#1A1A18" : medCol.bg }}>
                      {w.cover
                        ? <img loading="lazy" decoding="async" src={w.cover} alt={w.title} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12,
                            filter: listIsSold ? "grayscale(0.55) brightness(0.85)" : "none" }} onError={e => e.currentTarget.style.display="none"}/>
                        : <HUILogo size={20} style={{opacity:0.5}} />
                      }
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13.5, fontWeight: 600, color:T.ink, marginBottom:2, letterSpacing:"-0.02em",
                        overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{w.title}</div>
                      <div style={{ fontSize:11.5, color:T.inkFaint, marginBottom:4 }}>von {w.author}</div>
                      {w.location && (
                        <div style={{ fontSize:10.5, color:T.inkFaint, marginBottom:4, display:"flex", alignItems:"center", gap:3 }}>
                          <HUILocationIcon size={9} style={{flexShrink:0}} />
                          <span style={{ overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{w.location}</span>
                        </div>
                      )}
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        {w.medium && (
                          <span style={{ fontSize:10.5, background:medCol.bg, color:medCol.text, borderRadius:99, padding:"2px 8px", fontWeight:600 }}>{w.medium}</span>
                        )}
                        {priceStr && (
                          <span style={{ fontSize:12, fontWeight: 600, color:T.teal }}>{priceStr}</span>
                        )}
                        {(listSs === "verkauft" || listSs === "reserviert") && (
                          <span style={{ fontSize:10.5, background: listIsSold ? "rgba(26,26,46,0.82)" : "rgba(245,166,35,0.88)", color:"#fff", borderRadius:99, padding:"2px 8px", fontWeight:700 }}>
                            {listIsSold ? t("common.sold") : t("common.reserved")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 6. ERLEBNISSE FÜR DICH
// ════════════════════════════════════════════════════════════════
// SEED_ERLEBNISSE entfernt — war Dead Code (nie referenziert).

const WerkCardM = React.memo(WerkCard);
