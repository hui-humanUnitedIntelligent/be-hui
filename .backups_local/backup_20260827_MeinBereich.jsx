// src/components/profile/my-basis/MeinBereich.jsx
// MeinBereichDrawer, MeinBereichChooserRow, MeinBereichTile, MeinBereichMenu
// Extracted from MyBasisProfile.jsx — no logic changes.
import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient.js";
import {
  HUIResonanzIcon, HUITalentIcon, HUIWerkeIcon, HUIErlebnisIcon,
  HUIEmpfehlungIcon, HUIImpactIcon, HUIFinanzIcon,
  HUIStimmeIcon, HUIProjektIcon, HUIFotoIcon,
} from "../../../design/icons/HuiSystemIcons.jsx";
import MyRecommendationsModal from "../../studio/MyRecommendationsModal.jsx";
import ImpactStimmenModal from "../../studio/ImpactStimmenModal.jsx";
import MeineProjekteModal from "../../studio/MeineProjekteModal.jsx";
import FinanzuebersichtModal from "../../studio/FinanzuebersichtModal.jsx";
import ImpactUpdateSheet from "../../studio/ImpactUpdateSheet.jsx";
import { useModalRegistration } from "../../../hooks/useModalRegistration.js";
// BUGFIX (2026-08-25, Michael-Report "PROFIL CRASH: useHome is not defined"):
// Beim MyBasisProfile-Refactor (3449→1006 Zeilen, 10 Dateien extrahiert,
// siehe Memory #Refactor 2026-08-25) wurde useHome() in diese Datei
// mitverschoben, der Import aber vergessen -- Crash bei jedem Profil-Öffnen.
import { useHome } from "../../home/HomeShell.jsx";
import { useNotifications } from "../../../lib/useNotifications.jsx";
import { RecommendationsSection } from "../sections/RecommendationsSection.jsx";
import ProfilBearbeitenModal from "../../studio/ProfilBearbeitenModal.jsx";
import { TalentAngeboteSection, MeineWerkeSection, ErlebnisseSection } from "./ContentSections.jsx";
import { ImpactProjekteTab } from "./ImpactProjekteTab.jsx";
import { MeinMomenteDrawerContent } from "./MeinMomenteDrawerContent.jsx";
import { createPortal } from "react-dom";
import { T } from "./constants.js";
import { useTranslation } from "../../../hooks/useTranslation.js";

export function MeinBereichDrawer({ title, icon, subtitle, onClose, children, footer = true }) {
  const { t } = useTranslation();
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:10500,
        background:"rgba(26,26,24,0.55)",
        display:"flex", alignItems:"flex-end", justifyContent:"center",
        fontFamily:"Inter,sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:480,
          background:"#F7F5F0", borderRadius:"24px 24px 0 0",
          maxHeight:"90vh", display:"flex", flexDirection:"column",
          boxShadow:"0 -4px 32px rgba(26,26,24,0.20)",
        }}
      >
        {/* Handle */}
        <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 4px", flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:99, background:"rgba(26,26,24,0.12)" }} />
        </div>
        {/* Header: Icon + Titel nebeneinander, Subtitle darunter, dann Trennlinie */}
        <div style={{
          padding:"8px 20px 14px", flexShrink:0,
          borderBottom:"1px solid rgba(26,26,24,0.08)",
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            {/* Icon + Titel in einer Zeile */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ display:"flex", alignItems:"center", color:"rgba(14,196,184,0.9)", flexShrink:0 }}>{icon}</span>
              <span style={{ fontSize:17, fontWeight: 600, color:"#1A1A18", letterSpacing:"-0.02em" }}>{title}</span>
            </div>
            <button onClick={onClose} style={{
              background:"rgba(26,26,24,0.07)", border:"none", cursor:"pointer",
              borderRadius:"50%", width:32, height:32,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:16, color:"rgba(26,26,24,0.52)",
            }}>✕</button>
          </div>
          {/* Subtitle direkt unter dem Titel, über der Trennlinie */}
          {subtitle && (
            <div style={{ fontSize:12, color:"#8C8C85", marginTop:4, paddingLeft:0 }}>{subtitle}</div>
          )}
        </div>
        {/* Inhalt scrollbar */}
        {/* SYSTEM-NAVBAR-SAFETY-FIX (2026-08-11): mind. 50px + Safe-Area-Inset
            Abstand zur System-UI-Navigationsleiste (Android Gesten-/Softkeys) */}
        <div style={{
          flex:1, overflowY:"auto", WebkitOverflowScrolling:"touch", willChange:"transform", overscrollBehavior:"contain",
          scrollbarWidth:"none", padding: footer ? undefined : "0 0 calc(50px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))",
        }}>
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div style={{ padding:"12px 20px calc(50px + max(var(--hui-safe-bottom, 0px), env(safe-area-inset-bottom, 0px), 0px))", borderTop:"1px solid rgba(26,26,24,0.08)", flexShrink:0 }}>
            <button onClick={onClose} style={{
              width:"100%", padding:"13px", borderRadius:14, border:"none",
              cursor:"pointer", background:"rgba(26,26,24,0.08)",
              color:"rgba(26,26,24,0.52)", fontSize:14, fontWeight: 600,
              fontFamily:"inherit", WebkitTapHighlightColor:"transparent",
            }}>{t("meinBereich.schliessen")}</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function MeinBereichChooserRow({ icon, label, desc, onPress }) {
  return (
    <button onClick={onPress} className="mbp-press-light" style={{
      width:"100%", display:"flex", alignItems:"center", gap:14,
      padding:"15px 20px", background:"none", border:"none", cursor:"pointer",
      fontFamily:"inherit", textAlign:"left", borderBottom:"1px solid rgba(26,26,24,0.06)",
      WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
    }}>
      <span style={{
        width:38, height:38, borderRadius:11, flexShrink:0,
        background:"rgba(14,196,184,0.10)",
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"rgba(14,196,184,0.85)",
      }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight: 600, color:"#1A1A18" }}>{label}</div>
        {desc && <div style={{ fontSize:12, color:"rgba(26,26,24,0.5)", marginTop:1 }}>{desc}</div>}
      </div>
      <span style={{ color:"rgba(26,26,24,0.32)", fontSize:17 }}>›</span>
    </button>
  );
}

// MEIN-BEREICH-UPDATE-DOT (2026-08-15, Michael-Request): "wenn ein Update
// vom SADB kommt wie z.b ein Werk wurde freigegeben. oder du tätigst eine
// Buchung und bekommst einen Beleg. dann soll 'Mein Bereich' einen roten
// Punkt oben rechts vom Kreis am Kreisrand angezeigt werden". showDot ist
// additiv/optional (Default false) -- bestehende Aufrufer ohne den Prop
// verhalten sich unveraendert.
export function MeinBereichTile({ icon, label, onPress, showDot = false }) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onPress}
      aria-label={showDot ? `${label} — ${t("meinBereich.neuesUpdate")}` : label}
      className="mbp-press-light"
      style={{
        display:"flex", flexDirection:"column", alignItems:"center", gap:8,
        background:"none", border:"none", cursor:"pointer", fontFamily:"inherit",
        padding:"4px 2px", WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
      }}
    >
      <span style={{ position:"relative", flexShrink:0 }}>
        <span style={{
          width:52, height:52, borderRadius:"50%",
          background:"rgba(14,196,184,0.10)", border:"1px solid rgba(14,196,184,0.22)",
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0, color:"rgba(14,196,184,0.85)",
        }}>{icon}</span>
        {showDot && (
          <span style={{
            position:"absolute", top:-2, right:-2,
            width:11, height:11, borderRadius:"50%",
            background:"#EF4444", border:"2px solid #FFFFFF",
            boxShadow:"0 1px 3px rgba(239,68,68,0.45)",
          }} aria-hidden="true"/>
        )}
      </span>
      <span style={{
        fontSize:11, fontWeight:600, color:"rgba(26,26,24,0.75)",
        textAlign:"center", lineHeight:1.3, maxWidth:72,
        wordBreak:"normal", overflowWrap:"anywhere", hyphens:"auto",
        whiteSpace:"normal",
      }}>{label}</span>
    </button>
  );
}

export function MeinBereichMenu({
  profile, isTalent,
  talents, works, experiences, recommendations = [],
  onTalentWizard, onDeleteTalent,
  onWerkWizard, onDeleteWerk,
  onErlebnisWizard, onDeleteErlebnis,
  onOpenResonanz = () => {},
  onOpenMomentSheet: onOpenMomentSheetProp = null,
  onProfileUpdate = () => {},
}) {
  const { switchTab } = useHome();
  const { t } = useTranslation();
  const [activeDrawer, setActiveDrawer] = useState(null); // talente|werke|erlebnisse|momente|empfehlungen|impact|finanzen

  // MEIN-BEREICH-UPDATE-DOT (2026-08-15, Michael-Request) -- SSOT ist die
  // bestehende notifications-Tabelle + is_read (siehe Memory #637/#877,
  // exakt dasselbe Feld, das schon den Resonanzzentrum-Glocken-Badge
  // fuellt). Kein neues Feld/keine neue Tabelle noetig -- nur eine neue
  // GRUPPIERUNG der bereits vorhandenen Daten nach Kachel. useNotifications()
  // ist mehrfach-mount-sicher (Realtime-Channel-Dedupe ueber Topic-Name),
  // daher unbedenklich hier zusaetzlich aufgerufen (Resonanzzentrum-Panel
  // selbst ruft den Hook ebenfalls separat auf).
  const { items: notifItems, markRead: markNotifRead } = useNotifications();

  // type -> Kachel-Zuordnung. Nur "wichtige" SADB-Updates (Freigabe-
  // Entscheidungen + Buchungs-/Kaufbelege) loesen den Punkt aus -- bewusst
  // NICHT jede Interaktion (Kommentar/Like/Follower), die bleiben
  // ausschliesslich im Resonanzzentrum sichtbar (kein zweiter Kanal fuer
  // dieselbe Info, sonst zwei widersprechende Signale).
  const TILE_NOTIF_TYPES = {
    werke:        ["work_approved", "work_rejected"],
    talente:      ["talent_approved", "talent_rejected"],
    erlebnisse:   ["experience_approved", "experience_rejected", "project_approved", "project_rejected", "impact_project_approved", "impact_project_rejected", "impact_project_submitted"],
    // FINANZ-DOT-FIX (2026-08-16): "experience_booking_paid" (Verkäufer, Neue
    // Buchung) + "experience_booking_confirmed" (Käufer, Buchung bestätigt)
    // fehlten hier -- Erlebnis-Buchungen loesten dadurch NIE den roten Punkt
    // aus, obwohl exakt dieselben Typen bereits im NotificationPanel/
    // NotificationButton/useNotifications.jsx bekannt sind (siehe dort).
    // Werk-Kauf (new_order/order_confirmed) und Talent-Buchung
    // (talent_booking_paid/talent_booking_confirmed) waren bereits korrekt.
    finanzen:     ["order_confirmed", "new_order", "order", "talent_booking_paid", "talent_booking_confirmed", "experience_booking_paid", "experience_booking_confirmed", "support_received", "support_succeeded"],
  };
  const unreadNotifTypes = new Set((notifItems || []).filter(n => !n.is_read).map(n => n.type));
  const hasTileDot = (tileKey) => (TILE_NOTIF_TYPES[tileKey] || []).some(t => unreadNotifTypes.has(t));

  // Beim Oeffnen der Kachel: alle zugehoerigen Notifications als gelesen
  // markieren -- der Punkt verschwindet, sobald der Nutzer den Bereich
  // gesehen hat (gleiches Prinzip wie das Oeffnen des Resonanzzentrums).
  const openDrawerAndClearDot = (tileKey, drawerKey, extra) => {
    const types = TILE_NOTIF_TYPES[tileKey] || [];
    (notifItems || []).forEach(n => {
      if (!n.is_read && types.includes(n.type)) markNotifRead(n.id);
    });
    if (extra) extra();
    setActiveDrawer(drawerKey);
  };

  // PRELOAD: Wenn ein Drawer geöffnet wird, sofort die zugehörigen Wizard-Chunks
  // preloaden, damit der "Hinzufügen"-Button instant reagiert.
  useEffect(() => {
    if (activeDrawer === "werke") {
      import("../../works/WerkWizard.jsx").catch(() => {});
    } else if (activeDrawer === "erlebnisse") {
      import("../../experiences/ExperienceWizard.jsx").catch(() => {});
    } else if (activeDrawer === "talente") {
      import("../../talents/TalentAngebotWizard.jsx").catch(() => {});
    }
  }, [activeDrawer]);
  // openMomentSheet: delegiert immer an Parent (onOpenMomentSheetProp)
  // Falls kein Prop: fallback auf leere Funktion (sollte nie passieren)
  const openMomentSheet = onOpenMomentSheetProp ?? (() => {
    console.warn("[MeinBereichMenu] openMomentSheet aufgerufen ohne Parent-Prop");
  });
  const [impactDetail, setImpactDetail] = useState(null); // stimmen|projekte
  const [empfehlungDetail, setEmpfehlungDetail] = useState(null); // incoming|outgoing
  const [showFinanzModal, setShowFinanzModal] = useState(false); // Finanzübersicht Modal
  const [activeTab, setActiveTab] = useState("erlebnisse"); // erlebnisse | impact
  const [showUpdateSheet, setShowUpdateSheet] = useState(false);
  const [updateTargetProject, setUpdateTargetProject] = useState(null);
  const [showProfilEdit, setShowProfilEdit] = useState(false);

  // ── Back-Button: MeinBereichMenu Sub-Modals registrieren ────────
  // BACK-BUTTON-FIX (2026-08-11): MeinBereichDrawer muss registriert werden
  // — sonst faellt die Zuruecktaste durch zum Tab-Wechsel, waehrend der Drawer
  // noch sichtbar ist (=> weisser Bildschirm).
  useModalRegistration(!!activeDrawer, () => setActiveDrawer(null), "MeinBereichDrawer");
  useModalRegistration(!!impactDetail, () => setImpactDetail(null), "MeinBereichMenu-ImpactDetail");
  useModalRegistration(showFinanzModal, () => setShowFinanzModal(false), "MeinBereichMenu-FinanzModal");
  useModalRegistration(showUpdateSheet, () => setShowUpdateSheet(false), "MeinBereichMenu-UpdateSheet");
  useModalRegistration(showProfilEdit, () => setShowProfilEdit(false), "MeinBereichMenu-ProfilEdit");

  const close = () => setActiveDrawer(null);

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      {/* Titel außerhalb der Kachel */}
      <div style={{ fontSize:15, fontWeight: 600, color:T.ink, marginBottom:10, letterSpacing:"-0.01em" }}>
        {t("meinBereich.titel")}
      </div>

      <div style={{
        background:T.bgCard, borderRadius:T.r20,
        border:`1px solid ${T.border}`, boxShadow:T.card,
        padding:"18px 18px 20px",
      }}>
        <div style={{
          display:"grid", gridTemplateColumns:"repeat(4, 1fr)",
          rowGap:18, columnGap:4,
        }}>
          {isTalent && (
            <MeinBereichTile icon={<HUIWerkeIcon size={22}/>} label={t("meinBereich.meineWerke")} showDot={hasTileDot("werke")} onPress={() => openDrawerAndClearDot("werke", "werke")} />
          )}
          {isTalent && (
            <MeinBereichTile icon={<HUITalentIcon size={22}/>} label={t("meinBereich.talentAngebote")} showDot={hasTileDot("talente")} onPress={() => openDrawerAndClearDot("talente", "talente")} />
          )}
          {isTalent && (
            <MeinBereichTile icon={<HUIErlebnisIcon size={22}/>} label={t("meinBereich.erlebnisseProjekte")} showDot={hasTileDot("erlebnisse")} onPress={() => openDrawerAndClearDot("erlebnisse", "erlebnisse")} />
          )}
          <MeinBereichTile icon={<HUIFotoIcon size={22}/>} label={t("meinBereich.meineMomente")} onPress={() => setActiveDrawer("momente")} />
          <MeinBereichTile icon={<HUIImpactIcon size={22}/>} label={t("meinBereich.impactStimmen")} onPress={() => setActiveDrawer("impact")} />
          <MeinBereichTile icon={<HUIFinanzIcon size={22}/>} label={t("meinBereich.kaufeVerkaufe")} showDot={hasTileDot("finanzen")} onPress={() => openDrawerAndClearDot("finanzen", null, () => setShowFinanzModal(true))} />
          <MeinBereichTile icon={<HUIResonanzIcon size={22}/>} label={t("meinBereich.meineResonanz")} onPress={onOpenResonanz} />
          <MeinBereichTile icon={<HUIEmpfehlungIcon size={22}/>} label={t("meinBereich.empfehlungen")} onPress={() => setActiveDrawer("empfehlungen")} />
        </div>
      </div>

      {/* ── Talent-Angebote ─────────────────────────────────── */}
      {activeDrawer === "talente" && (
        <MeinBereichDrawer title={t("meinBereich.talentAngebote")} icon={<HUITalentIcon size={18}/>} subtitle={t("meinBereich.talentAngeboteSub")} onClose={close} footer={false}>
          <TalentAngeboteSection
            talents={talents}
            onTalentWizard={onTalentWizard}
            onDeleteTalent={onDeleteTalent}
          />
        </MeinBereichDrawer>
      )}

      {/* ── Meine Werke ──────────────────────────────────────── */}
      {activeDrawer === "werke" && (
        <MeinBereichDrawer title={t("meinBereich.meineWerke")} icon={<HUIWerkeIcon size={18}/>} subtitle={t("meinBereich.meineWerkeSub")} onClose={close} footer={false}>
          <MeineWerkeSection
            works={works}
            onWerkWizard={onWerkWizard}
            onDeleteWerk={onDeleteWerk}
          />
        </MeinBereichDrawer>
      )}

      {/* ── Erlebnisse & Projekte ────────────────────────────── */}
      {activeDrawer === "erlebnisse" && (
        <MeinBereichDrawer title={t("meinBereich.erlebnisseProjekte")} icon={<HUIErlebnisIcon size={18}/>} subtitle={t("meinBereich.erlebnisseProjekteSub")} onClose={close} footer={false}>
          {/* Tab-Switcher */}
          <div style={{ display:"flex", gap:0, margin:"0 20px 16px", background:"rgba(0,0,0,0.05)", borderRadius:12, padding:4 }}>
            {[["erlebnisse",t("meinBereich.tabErlebnisse")],["impact",t("meinBereich.tabImpactProjekte")]].map(([key,label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                flex:1, padding:"8px 4px", borderRadius:10, border:"none",
                background: activeTab===key ? "white" : "transparent",
                color: activeTab===key ? "#0DC4B5" : "#666",
                fontSize:13, fontWeight: activeTab===key ? 600 : 600,
                cursor:"pointer", fontFamily:"inherit",
                boxShadow: activeTab===key ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                transition:"all 0.2s"
              }}>{label}</button>
            ))}
          </div>

          {activeTab === "erlebnisse" ? (
            <ErlebnisseSection
              experiences={experiences}
              onErlebnisWizard={onErlebnisWizard}
              onDeleteErlebnis={onDeleteErlebnis}
            />
          ) : (
            <ImpactProjekteTab
              profile={profile}
              supabase={supabase}
              onUpdateClick={(proj) => { setUpdateTargetProject(proj); setShowUpdateSheet(true); }}
            />
          )}

          {showUpdateSheet && updateTargetProject && (
        <ImpactUpdateSheet
                project={updateTargetProject}
                currentUser={profile}
                onClose={() => { setShowUpdateSheet(false); setUpdateTargetProject(null); }}
                onSuccess={() => { window.dispatchEvent(new Event("hui:impact-update-added")); }}
              />
        )}
        </MeinBereichDrawer>
      )}

      {/* ── Meine Momente ───────────────────────────────────── */}
      {activeDrawer === "momente" && (
        <MeinBereichDrawer title={t("meinBereich.meineMomente")} icon={<HUIFotoIcon size={18}/>} subtitle={t("meinBereich.meineMomenteSub")} onClose={close} footer={false}>
          <MeinMomenteDrawerContent
            profile={profile}
            onOpenMomentSheet={() => {
              close();
              openMomentSheet();
            }}
          />
        </MeinBereichDrawer>
      )}

      {/* HuiMomentSheet — wird AUSSCHLIESSLICH über MyBasisProfile-Portal geöffnet
          (onOpenMomentSheetProp = MyBasisProfile.setShowMomentSheet).
          Kein eigenes internes Portal → kein redundanter lazy-Load-Hänger */}
{/* ── Empfehlungen — Chooser: Kundenstimmen + Meine Empfehlungen ─ */}
      {activeDrawer === "empfehlungen" && !empfehlungDetail && (
        <MeinBereichDrawer title={t("meinBereich.empfehlungen")} icon={<HUIEmpfehlungIcon size={18}/>} subtitle={t("meinBereich.empfehlungenSub")} onClose={close} footer={false}>
          <MeinBereichChooserRow
            icon={<HUIEmpfehlungIcon size={18}/>} label={t("meinBereich.kundenstimmen")}
            desc={t("meinBereich.kundenstimmenDesc")}
            onPress={() => setEmpfehlungDetail("incoming")}
          />
          <MeinBereichChooserRow
            icon={<HUIEmpfehlungIcon size={18}/>} label={t("meinBereich.meineEmpfehlungen")}
            desc={t("meinBereich.meineEmpfehlungenDesc")}
            onPress={() => setEmpfehlungDetail("outgoing")}
          />
        </MeinBereichDrawer>
      )}
      {activeDrawer === "empfehlungen" && empfehlungDetail === "incoming" && (
        <MeinBereichDrawer title={t("meinBereich.kundenstimmen")} icon={<HUIEmpfehlungIcon size={18}/>} subtitle={t("meinBereich.kundenstimmenSub")} onClose={() => setEmpfehlungDetail(null)} footer={false}>
          <RecommendationsSection
            recommendations={recommendations}
            isOwner={true}
            profileOwnerId={profile?.id || ""}
            profileOwnerName={profile?.display_name || profile?.nickname || ""}
          />
        </MeinBereichDrawer>
      )}
      {activeDrawer === "empfehlungen" && empfehlungDetail === "outgoing" && (
        <MyRecommendationsModal userId={profile?.id} onClose={() => setEmpfehlungDetail(null)} />
      )}

      {/* ── Impact & Stimmen (Chooser + Detail-Drawer) ──────── */}
      {activeDrawer === "impact" && !impactDetail && (
        <MeinBereichDrawer title={t("meinBereich.impactStimmen")} icon={<HUIImpactIcon size={18}/>} subtitle={t("meinBereich.impactStimmenSub")} onClose={close} footer={false}>
          <MeinBereichChooserRow
            icon={<HUIStimmeIcon size={18}/>} label={t("meinBereich.impactStimmenLabel")}
            desc={isTalent ? t("meinBereich.impactStimmenTalentDesc") : t("meinBereich.impactStimmenBasisDesc")}
            onPress={() => setImpactDetail("stimmen")}
          />
          <MeinBereichChooserRow
            icon={<HUIProjektIcon size={18}/>} label={t("meinBereich.unterstuetzteProjekte")}
            onPress={() => setImpactDetail("projekte")}
          />
        </MeinBereichDrawer>
      )}
      {activeDrawer === "impact" && impactDetail === "stimmen" && (
        <ImpactStimmenModal
            profile={profile}
            onClose={() => setImpactDetail(null)}
            switchTab={switchTab}
          />
        )}
      {activeDrawer === "impact" && impactDetail === "projekte" && (
        <MeineProjekteModal
            profile={profile}
            onClose={() => setImpactDetail(null)}
            switchTab={switchTab}
          />
        )}

      {/* ── Finanzübersicht (neues Unified-Modal) ───────── */}
      {showFinanzModal && (
        <FinanzuebersichtModal profile={profile} onClose={() => setShowFinanzModal(false)} />
      )}

      {/* ── Profil bearbeiten ───────────────────────────────── */}
      {showProfilEdit && (
        <ProfilBearbeitenModal
            profile={profile}
            onClose={() => setShowProfilEdit(false)}
            onProfileUpdate={onProfileUpdate}
          />
        )}
    </div>
  );
}


