// src/components/discover/DiscoverFilterSheet.jsx
// ════════════════════════════════════════════════════════════════════
// DISCOVER-FILTER-SHEET (2026-09-09, Michaels 4-Punkte Liste Punkt 1):
// Modernes Filter-Bottom-Sheet für den Entdecken-Tab mit zwei Sektionen:
//   1. REGION — nutzt den globalen RadiusContext (useRadiusFilter, SSOT):
//      Weltweit/Umkreis-Stufen + GPS-Standort + manuelle Ortssuche
//      (LocationAutocompleteInput). Gleiche Semantik wie die RadiusRow im
//      SearchCommandCenter — der STATE lebt weiterhin EINMAL im Context.
//   2. SPRACHE — "Nur meine Sprache" / "Alle Sprachen" (MULTILANG-CONTENT-001).
//      Der State (showAllLangs) bleibt in DiscoverPage (langFilterRef +
//      Cache-Invalidierung unangetastet) — dieses Sheet ist reine UI.
//
// Pflicht-Muster (footer-navbar-zindex-Regel): createPortal(document.body)
// + zIndex >= 10500 + useWizardBodyLock().
// ════════════════════════════════════════════════════════════════════
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useRadiusFilter, radiusLabel } from "../../hooks/useRadiusFilter.js";
import { useWizardBodyLock } from "../../lib/wizardBodyLock.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { HUILocationIcon } from "../../design/icons/HuiSystemIcons.jsx";
import LocationAutocompleteInput from "../shared/LocationAutocompleteInput.jsx";

const T = {
  teal:   "#0EC4B8",
  tealSoft: "rgba(14,196,184,0.10)",
  tealMid:  "rgba(14,196,184,0.16)",
  ink:    "#1A3530",
  inkSoft: "rgba(26,53,48,0.55)",
  inkFaint: "rgba(26,53,48,0.32)",
  border: "rgba(26,53,48,0.08)",
};

const LANG_NATIVE = {
  de: "Deutsch", en: "English", es: "Español", fr: "Français",
  it: "Italiano", pt: "Português", sq: "Shqip", tr: "Türkçe",
};

function SectionHead({ children }) {
  return (
    <div style={{
      fontSize:11, fontWeight:700, letterSpacing:"0.08em",
      color:T.inkFaint, textTransform:"uppercase", marginBottom:10,
    }}>{children}</div>
  );
}

export default function DiscoverFilterSheet({
  open, onClose,
  showAllLangs, onToggleShowAllLangs, appLang = "de",
}) {
  const { t } = useTranslation();
  const radius = useRadiusFilter();
  const [manualOpen, setManualOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState("");

  useWizardBodyLock(open);

  if (!open) return null;

  const hasActiveFilter =
    !radius.isWorldwide || !!radius.geo || showAllLangs;

  // Gleiche Nicht-Blockier-Semantik wie SearchCommandCenter/RadiusRow:
  // Radius sofort setzen, GPS laeuft nebenlaeufig hinterher.
  const handlePickRadius = (stage) => {
    radius.setRadiusKm(stage);
    if (stage !== "world" && !radius.geo) {
      radius.requestBrowserLocation().then(g => { if (!g) setManualOpen(true); });
    }
  };

  const handleLocationChipTap = async () => {
    if (radius.geo) { radius.clearLocation(); return; }
    const g = await radius.requestBrowserLocation();
    if (!g) setManualOpen(true);
  };

  const handleReset = () => {
    radius.setRadiusKm("world");
    radius.clearLocation();
    setManualOpen(false);
    setManualQuery("");
    if (showAllLangs) onToggleShowAllLangs?.();
  };

  return createPortal(
    <div style={{
      position:"fixed", inset:0, zIndex:10500,
      display:"flex", flexDirection:"column", justifyContent:"flex-end",
      background:"rgba(26,53,48,0.45)",
      animation:"dfs-fade .18s ease both",
      WebkitTapHighlightColor:"transparent",
    }}
    onClick={onClose}>
      <style>{`
        @keyframes dfs-fade { from{opacity:0;}to{opacity:1;} }
        @keyframes dfs-in { from{transform:translateY(60px);opacity:0.4;}to{transform:translateY(0);opacity:1;} }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:"#FFFFFF", borderTopLeftRadius:24, borderTopRightRadius:24,
          maxHeight:"82dvh", display:"flex", flexDirection:"column",
          animation:"dfs-in .22s cubic-bezier(.22,1,.36,1) both",
          boxShadow:"0 -10px 40px rgba(26,53,48,0.18)",
          paddingBottom:"calc(88px + env(safe-area-inset-bottom, 0px))", // Navbar-Freiraum
        }}>

        {/* Grabber */}
        <div style={{ display:"flex", justifyContent:"center", padding:"8px 0 2px", flexShrink:0 }}
          onClick={onClose}>
          <div style={{ width:40, height:4, borderRadius:99, background:"rgba(26,53,48,0.12)" }}/>
        </div>

        {/* Kopf: Titel + Reset + Close */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 20px 12px", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:17, fontWeight:600, color:T.ink, letterSpacing:"-0.02em" }}>
              {t("discover.filterSheetTitle")}
            </span>
            {hasActiveFilter && (
              <button onClick={handleReset} style={{
                fontSize:11.5, fontWeight:600, color:T.teal, background:T.tealSoft,
                border:`1px solid rgba(14,196,184,0.30)`, borderRadius:99,
                padding:"3px 10px", cursor:"pointer", fontFamily:"inherit",
                WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
              }}>{t("discover.filterReset")}</button>
            )}
          </div>
          <button onClick={onClose} style={{
            width:30, height:30, borderRadius:"50%", border:"none", cursor:"pointer",
            background:"rgba(26,53,48,0.05)", color:T.inkSoft, fontSize:16,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"inherit", WebkitTapHighlightColor:"transparent",
          }}>×</button>
        </div>

        <div style={{ overflowY:"auto", overscrollBehavior:"contain", padding:"0 20px" }}>

          {/* ══ 1. REGION ════════════════════════════════════════ */}
          <div style={{ marginBottom:22 }}>
            <SectionHead>{t("discover.filterRegion")}</SectionHead>

            {/* Stufen: Weltweit zuerst (UMKREISSUCHE-DEFAULT-FIX) */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {radius.stages.map(stage => {
                const active = radius.radiusKm === stage;
                const isWorld = stage === "world";
                return (
                  <button key={String(stage)} onClick={() => handlePickRadius(stage)} style={{
                    padding:"8px 14px", borderRadius:99, cursor:"pointer",
                    fontSize:12, fontWeight:600, letterSpacing:"-0.01em", fontFamily:"inherit",
                    background: active ? T.teal : (isWorld ? T.tealSoft : "rgba(26,53,48,0.035)"),
                    border:`1px solid ${active ? T.teal : (isWorld ? "rgba(14,196,184,0.25)" : "rgba(26,53,48,0.08)")}`,
                    color: active ? "#fff" : T.inkSoft,
                    boxShadow: active ? "0 3px 10px rgba(14,196,184,0.26)" : "none",
                    transition:"background .18s ease, color .18s ease, border-color .18s ease",
                    whiteSpace:"nowrap",
                    WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
                  }}>{radiusLabel(stage)}</button>
                );
              })}
            </div>

            {/* Standort: GPS-Chip + manuelle Ortssuche */}
            <div style={{ display:"flex", gap:7, marginTop:10, flexWrap:"wrap", alignItems:"center" }}>
              <button onClick={handleLocationChipTap} style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"8px 14px", borderRadius:99, cursor:"pointer",
                fontSize:12, fontWeight:600, fontFamily:"inherit",
                background: radius.geo ? T.tealMid : "rgba(26,53,48,0.035)",
                border:`1px solid ${radius.geo ? "rgba(14,196,184,0.35)" : "rgba(26,53,48,0.08)"}`,
                color: radius.geo ? T.teal : T.inkSoft,
                maxWidth:220, whiteSpace:"nowrap",
                WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
              }}>
                <HUILocationIcon size={12} style={{flexShrink:0, opacity:0.7}}/>
                <span style={{ overflow:"hidden", textOverflow:"ellipsis" }}>
                  {radius.status === "requesting"
                    ? t("discover.searching")
                    : (radius.geo ? radius.geo.label : t("discover.standortChip"))}
                </span>
              </button>
              {!radius.geo && !manualOpen && (
                <button onClick={() => setManualOpen(true)} style={{
                  padding:"8px 14px", borderRadius:99, cursor:"pointer",
                  fontSize:12, fontWeight:600, fontFamily:"inherit",
                  background:"rgba(26,53,48,0.035)",
                  border:"1px solid rgba(26,53,48,0.08)", color:T.inkSoft,
                  WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
                }}>{t("discover.filterPlaceSearch")}</button>
              )}
            </div>
            {manualOpen && (
              <div style={{ display:"flex", gap:6, marginTop:10, animation:"dfs-fade .18s ease both" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <LocationAutocompleteInput
                    value={manualQuery}
                    onChange={setManualQuery}
                    onPick={(place) => {
                      radius.setGeo({ lat: place.lat, lng: place.lng,
                        label: place.label?.split(",")[0] || place.label, source: "manual" });
                      setManualOpen(false); setManualQuery("");
                    }}
                    placeholder={t("discover.standortPlaceholder")}
                    style={{
                      width:"100%", boxSizing:"border-box",
                      border:"1px solid rgba(26,53,48,0.09)", borderRadius:99,
                      padding:"8px 14px", fontSize:12, outline:"none",
                      background:"rgba(26,53,48,0.02)", color:T.ink, fontFamily:"inherit",
                    }}
                  />
                </div>
                <button onClick={() => setManualOpen(false)} style={{
                  flexShrink:0, background:"rgba(26,53,48,0.05)", color:T.inkSoft,
                  border:"none", borderRadius:99, padding:"8px 15px",
                  fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                }}>{t("discover.filterCancel")}</button>
              </div>
            )}
          </div>

          {/* ══ 2. SPRACHE ═══════════════════════════════════════ */}
          <div style={{ marginBottom:8 }}>
            <SectionHead>{t("discover.filterLanguage")}</SectionHead>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {/* Option: Nur meine Sprache */}
              <button onClick={() => { if (showAllLangs) onToggleShowAllLangs?.(); }} style={{
                display:"flex", alignItems:"center", gap:12, textAlign:"left",
                padding:"13px 15px", borderRadius:16, cursor:"pointer", fontFamily:"inherit",
                background: !showAllLangs ? T.tealSoft : "rgba(26,53,48,0.02)",
                border:`1.5px solid ${!showAllLangs ? "rgba(14,196,184,0.40)" : "rgba(26,53,48,0.07)"}`,
                transition:"background .18s ease, border-color .18s ease",
                WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
              }}>
                <span style={{
                  width:19, height:19, borderRadius:"50%", flexShrink:0,
                  border:`2px solid ${!showAllLangs ? T.teal : "rgba(26,53,48,0.18)"}`,
                  background: !showAllLangs ? T.teal : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {!showAllLangs && <span style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}
                </span>
                <span style={{ flex:1, minWidth:0 }}>
                  <span style={{ display:"block", fontSize:13.5, fontWeight:600, color:T.ink }}>
                    {t("discover.langFilterOn")}
                  </span>
                  <span style={{ display:"block", fontSize:11.5, color:T.inkFaint, marginTop:1 }}>
                    {LANG_NATIVE[appLang] || appLang}
                  </span>
                </span>
              </button>
              {/* Option: Alle Sprachen */}
              <button onClick={() => { if (!showAllLangs) onToggleShowAllLangs?.(); }} style={{
                display:"flex", alignItems:"center", gap:12, textAlign:"left",
                padding:"13px 15px", borderRadius:16, cursor:"pointer", fontFamily:"inherit",
                background: showAllLangs ? T.tealSoft : "rgba(26,53,48,0.02)",
                border:`1.5px solid ${showAllLangs ? "rgba(14,196,184,0.40)" : "rgba(26,53,48,0.07)"}`,
                transition:"background .18s ease, border-color .18s ease",
                WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
              }}>
                <span style={{
                  width:19, height:19, borderRadius:"50%", flexShrink:0,
                  border:`2px solid ${showAllLangs ? T.teal : "rgba(26,53,48,0.18)"}`,
                  background: showAllLangs ? T.teal : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  {showAllLangs && <span style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }}/>}
                </span>
                <span style={{ flex:1, minWidth:0 }}>
                  <span style={{ display:"block", fontSize:13.5, fontWeight:600, color:T.ink }}>
                    {t("discover.langFilter")}
                  </span>
                  <span style={{ display:"block", fontSize:11.5, color:T.inkFaint, marginTop:1 }}>
                    {t("discover.langFilterAllSub")}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Fuss: Fertig */}
        <div style={{ padding:"14px 20px 4px", flexShrink:0 }}>
          <button onClick={onClose} style={{
            width:"100%", padding:"13px 0", borderRadius:14, border:"none", cursor:"pointer",
            background:`linear-gradient(135deg,#16D7C5,#0FB8AA)`, color:"#fff",
            fontSize:14, fontWeight:700, fontFamily:"inherit", letterSpacing:"-0.01em",
            boxShadow:"0 4px 14px rgba(22,215,197,0.30)",
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
          }}>{t("discover.filterDone")}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
