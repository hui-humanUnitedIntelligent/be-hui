// src/components/discover/TalentSection.jsx
// TalentCard + LocationRadiusRow + TalenteSection — extracted from DiscoverPage.jsx.
import React, { useState } from "react";
import { T, safeStr, safeNum, safeArr, CARD_RADIUS, MEDIUM_COLOR, TALENT_LOCATION_LABEL } from "./constants.js";
import { Skel, SectionHead, CardBadge, CardTitle, CardLocationRow } from "./atoms.jsx";
import { HUILogo } from "../brand/HUILogo.jsx";
import { HUITalentIcon, HUILocationIcon, HUIAnsichtIcon } from "../../design/icons/HuiSystemIcons.jsx";
import { optimizeCard } from "../../lib/perfUtils.js";
import { formatNumberDE } from "../../lib/formatters.js";
import { radiusLabel } from "../../hooks/useRadiusFilter.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { CAT_KEY_MAP, translateCategory } from "../../lib/categoryMaps.js";

export function TalentCard({ talent, delay=0, onPress, onAuthorPress }) {
  const { t } = useTranslation();
  const [imgErr, setImgErr] = useState(false);
  const cover  = (!imgErr && talent.cover) ? talent.cover : null;
  const medCol = MEDIUM_COLOR[talent.category] || { bg:T.tealSoft, text:T.teal };
  const priceStr = talent.price_per_hour != null
    ?formatNumberDE(parseFloat(talent.price_per_hour), { minimumFractionDigits:0 }) + ` €/${t("common.perHour")}`
    : talent.price_per_session != null
      ?formatNumberDE(parseFloat(talent.price_per_session), { minimumFractionDigits:0 }) + ` €/${t("common.perSession")}`
      : null;
  const locationLabel = TALENT_LOCATION_LABEL[talent.location_type] || null;

  return (
    <div className="dp-press dp-in dp-card-hover" onClick={() => onPress?.(talent)} style={{
      width:165, flexShrink:0,
      borderRadius:CARD_RADIUS, overflow:"hidden",
      background:T.white, boxShadow:T.cardShadow,
      border:`1px solid ${T.border}`,
      animationDelay:`${delay}ms`,
      touchAction:"manipulation",
      WebkitTapHighlightColor:"transparent",
      display:"flex", flexDirection:"column",
    }}>
      {/* Cover */}
      <div style={{ width:"100%", height:120, position:"relative", overflow:"hidden", background:cover ? "#1A1A18" : medCol.bg }}>
        {cover ? (
          <img loading="lazy" decoding="async" src={optimizeCard(cover)} alt={talent.title} onError={() => setImgErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        ) : (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <HUILogo size={40} style={{opacity:0.55}} />
          </div>
        )}
        {/* Kategorie-Badge oben links */}
        {talent.category && (
          <CardBadge pos="left" bg={medCol.bg} color={medCol.text} cover={cover}>
            {translateCategory(talent.category, CAT_KEY_MAP, t)}
          </CardBadge>
        )}
      </div>

      {/* Info — flex-column damit Preis immer unten sitzt */}
      <div style={{ padding:"10px 11px 12px", display:"flex", flexDirection:"column", flexGrow:1 }}>
        {/* Titel */}
        <CardTitle>{talent.title}</CardTitle>

        {/* Anbieter */}
        <div style={{ fontSize:10.5, color:T.inkFaint, fontWeight:400, marginBottom:6 }}>
          von{" "}
          <span style={{ textDecoration:"none" }}>{talent.author}</span>
        </div>

        {/* Standort/Ort — nimmt Platz ein oder nicht, Preis bleibt unten */}
        <div style={{ minHeight:20 }}>
          <CardLocationRow location={locationLabel} distanceKm={talent.distanceKm}/>
        </div>

        {/* Preis — immer am unteren Rand */}
        <div style={{ marginTop:"auto", paddingTop:4 }}>
          <div style={{ display:"flex", alignItems:"center", marginBottom:6 }}>
            {priceStr ? (
              <div style={{ fontSize:14, fontWeight: 600, color:T.teal, letterSpacing:"-0.02em" }}>
                {priceStr}
              </div>
            ) : (
              <div style={{ fontSize:10.5, color:T.inkFaint, fontStyle:"italic" }}>Preis auf Anfrage</div>
            )}
          </div>
          {/* Views */}
          <div className="dp-engage">
            <span style={{display:"flex",alignItems:"center",gap:2}}><HUIAnsichtIcon size={12}/>{talent.views ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LocationRadiusRow({
  locQuery="", onLocQueryChange, locSuggest=[], locSearching, locActive,
  onPickLoc, onClearLoc, radiusKm, radiusStages, onRadiusChange, hiddenNoCoordsCount=0,
}) {
  const { t } = useTranslation();
  return (
    <div style={{ padding:`0 ${T.px}px`, marginBottom:10 }}>
      {locActive ? (
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px",
            borderRadius:99, background:T.tealSoft || "rgba(14,196,184,0.1)", border:`1px solid ${T.border}` }}>
            <HUILocationIcon size={12} style={{flexShrink:0}} />
            <span style={{ fontSize:11.5, fontWeight:600, color:T.ink,
              maxWidth:180, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
              {locActive.label}
            </span>
            <button onClick={onClearLoc} style={{ background:"none", border:"none", cursor:"pointer",
              color:T.inkFaint, fontSize:14, lineHeight:1, padding:"0 2px" }}>×</button>
          </div>
          <div style={{ display:"flex", gap:5, overflowX:"auto", WebkitOverflowScrolling:"touch", scrollbarWidth:"none" }}>
            {(radiusStages || [10,25,50,100]).map(stage => (
              <button key={String(stage)} onClick={() => onRadiusChange(stage)}
                style={{ flexShrink:0, padding:"5px 10px", borderRadius:99, fontSize:10.5, fontWeight: 600,
                  cursor:"pointer", border: radiusKm===stage ? "none" : `1px solid ${T.border}`,
                  background: radiusKm===stage ? T.ink : "none",
                  color: radiusKm===stage ? "#fff" : T.inkFaint, whiteSpace:"nowrap" }}>
                {radiusLabel(stage)}
              </button>
            ))}
          </div>
          {hiddenNoCoordsCount > 0 && (
            <span style={{ fontSize:10, color:T.inkFaint }}>
              {hiddenNoCoordsCount} Eintrag{hiddenNoCoordsCount>1?"e":""} ohne Standortangabe ausgeblendet
            </span>
          )}
        </div>
      ) : (
        <div style={{ position:"relative", maxWidth:320 }}>
          <input value={locQuery} onChange={e => onLocQueryChange(e.target.value)}
            placeholder={t("discover.standortPlaceholder")}
            style={{ width:"100%", padding:"8px 12px", borderRadius:99,
              border:`1px solid ${T.border}`, outline:"none", fontSize:12,
              color:T.ink, fontFamily:"inherit", boxSizing:"border-box", background:T.white }}/>
          {(locSearching || locSuggest.length > 0) && locQuery.trim().length >= 2 && (
            <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:5,
              borderRadius:12, border:`1px solid ${T.border}`, background:T.white,
              boxShadow:T.cardShadow, overflow:"hidden" }}>
              {locSearching && <div style={{ padding:"8px 10px", fontSize:11, color:T.inkFaint }}>Suche…</div>}
              {!locSearching && locSuggest.map((s,i) => (
                <button key={i} onClick={() => onPickLoc(s)}
                  style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 10px",
                    background:"none", border:"none", borderTop: i>0 ? `1px solid ${T.border}` : "none",
                    fontSize:11.5, color:T.ink, cursor:"pointer", fontFamily:"inherit" }}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TalenteSection({
  talente=[], loading, delay=0, view='cards', onPress, onAuthorPress = () => {}, onSectionAction,
  locQuery, onLocQueryChange, locSuggest, locSearching, locActive,
  onPickLoc, onClearLoc, radiusKm, radiusStages, onRadiusChange, hiddenNoCoordsCount=0,
}) {
  const { t } = useTranslation();
  return (
    <div className="dp-in" style={{ marginTop:24, animationDelay:`${delay}ms` }}>
      <div data-dp-talente/>
      <SectionHead
        title={t("discover.talente")}
        sub={t("discover.talenteSub")}
        action={t("discover.alleTalente")}
        onAction={onSectionAction}
        delay={delay}
      />

      {/* ── Umkreissuche ── */}
      <div style={{ padding:`0 ${T.px}px`, marginBottom:10 }}>
        {locActive ? (
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px",
              borderRadius:99, background:T.tealSoft || "rgba(14,196,184,0.1)", border:`1px solid ${T.border}` }}>
              <HUILocationIcon size={12} style={{flexShrink:0}} />
              <span style={{ fontSize:11.5, fontWeight:600, color:T.ink,
                maxWidth:180, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                {locActive.label}
              </span>
              <button onClick={onClearLoc} style={{ background:"none", border:"none", cursor:"pointer",
                color:T.inkFaint, fontSize:14, lineHeight:1, padding:"0 2px" }}>×</button>
            </div>
            {/* Umkreissuche-Vereinheitlichung (2026-07-06): keine eigene
                Werteliste mehr -- radiusStages kommt ausschliesslich aus
                RADIUS_OPTIONS (src/context/RadiusContext.jsx), radiusKm/
                onRadiusChange sind derselbe globale Zustand wie in der
                Hauptsuche. radiusLabel() ist dieselbe Formatierungsfunktion
                wie in SearchCommandCenter -- kein zweiter "Weltweit"-String. */}
            <div style={{ display:"flex", gap:5, overflowX:"auto", WebkitOverflowScrolling:"touch", scrollbarWidth:"none" }}>
              {radiusStages.map(stage => (
                <button key={String(stage)} onClick={() => onRadiusChange(stage)}
                  style={{ flexShrink:0, padding:"5px 10px", borderRadius:99, fontSize:10.5, fontWeight: 600,
                    cursor:"pointer", border: radiusKm===stage ? "none" : `1px solid ${T.border}`,
                    background: radiusKm===stage ? T.ink : "none",
                    color: radiusKm===stage ? "#fff" : T.inkFaint, whiteSpace:"nowrap" }}>
                  {radiusLabel(stage)}
                </button>
              ))}
            </div>
            {hiddenNoCoordsCount > 0 && (
              <span style={{ fontSize:10, color:T.inkFaint }}>
                {hiddenNoCoordsCount} Angebot{hiddenNoCoordsCount>1?"e":""} ohne Standortangabe ausgeblendet
              </span>
            )}
          </div>
        ) : (
          <div style={{ position:"relative", maxWidth:320 }}>
            <input value={locQuery} onChange={e => onLocQueryChange(e.target.value)}
              placeholder={t("discover.standortPlaceholder")}
              style={{ width:"100%", padding:"8px 12px", borderRadius:99,
                border:`1px solid ${T.border}`, outline:"none", fontSize:12,
                color:T.ink, fontFamily:"inherit", boxSizing:"border-box", background:T.white }}/>
            {(locSearching || locSuggest.length > 0) && locQuery.trim().length >= 2 && (
              <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:5,
                borderRadius:12, border:`1px solid ${T.border}`, background:T.white,
                boxShadow:T.cardShadow, overflow:"hidden" }}>
                {locSearching && <div style={{ padding:"8px 10px", fontSize:11, color:T.inkFaint }}>Suche…</div>}
                {!locSearching && locSuggest.map((s,i) => (
                  <button key={i} onClick={() => onPickLoc(s)}
                    style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 10px",
                      background:"none", border:"none", borderTop: i>0 ? `1px solid ${T.border}` : "none",
                      fontSize:11.5, color:T.ink, cursor:"pointer", fontFamily:"inherit" }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {view === "cards" ? (
        <div className="dp-hscroll" style={{ display:"flex", gap:10, paddingLeft:T.px, paddingRight:T.px, paddingBottom:4 }}>
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} style={{ width:165, flexShrink:0, borderRadius:16, overflow:"hidden", background:T.white, boxShadow:T.cardShadow }}>
                  <Skel w="100%" h={120} r={0} mb={0}/>
                  <div style={{ padding:"10px 11px" }}><Skel w="80%" h={12} r={6} mb={6}/><Skel w="50%" h={10} r={6}/></div>
                </div>
              ))
            : talente.length === 0
            ? <div style={{ paddingLeft:T.px, fontSize:12.5, color:T.inkFaint, fontStyle:'italic', opacity:0.75 }}>{t("tal.emptyNearby")}</div>
            : talente.map((t, i) => <TalentCardM key={t.id} talent={t} delay={i*35+delay} onPress={onPress} onAuthorPress={onAuthorPress} />)
          }
        </div>
      ) : (
        <div className="dp-list-section dp-toggle-in">
          {loading
            ? Array.from({length:4}).map((_,i) => (
                <div key={i} className="dp-list-card"><Skel w={58} h={58} r={12}/><div style={{flex:1}}><Skel w="75%" h={12} r={6} mb={6}/><Skel w="45%" h={10} r={5}/></div></div>
              ))
            : talente.map((t) => {
                const medCol = MEDIUM_COLOR[t.category] || { bg:T.tealSoft, text:T.teal };
                const priceStr = t.price_per_hour != null
                  ?formatNumberDE(parseFloat(t.price_per_hour), { minimumFractionDigits:0 }) + ` €/${t("common.perHour")}`
                  : t.price_per_session != null
                    ?formatNumberDE(parseFloat(t.price_per_session), { minimumFractionDigits:0 }) + ` €/${t("common.perSession")}`
                    : null;
                return (
                  <div key={t.id} className="dp-list-card" onClick={() => onPress?.(t)} role="button" tabIndex={0}>
                    {t.cover
                      ? <img loading="lazy" decoding="async" src={t.cover} alt={t.title} className="dp-list-thumb" onError={e => e.target.style.display='none'} style={{ objectFit:"cover" }}/>
                      : <div className="dp-list-thumb-placeholder" style={{display:"flex",alignItems:"center",justifyContent:"center"}}><HUILogo size={24} style={{opacity:0.5}}/></div>
                    }
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:4, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{t.title}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        {t.category && (
                          <span style={{ fontSize:10.5, background:medCol.bg, color:medCol.text, borderRadius:99, padding:"2px 8px", fontWeight:600 }}>{t.category}</span>
                        )}
                        {priceStr && (
                          <span style={{ fontSize:12, fontWeight: 600, color:T.teal }}>{priceStr}</span>
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
// 5. WERKE ENTDECKEN
// ════════════════════════════════════════════════════════════════
// SEED_WERKE entfernt — war Dead Code (nie referenziert).


const TalentCardM = React.memo(TalentCard);
