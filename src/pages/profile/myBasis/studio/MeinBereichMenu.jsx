import React, { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient.js";
import { useHome } from "../../../../components/home/HomeShell.jsx";
import { T } from "../tokens.js";
import {
  HUIResonanzIcon, HUITalentIcon, HUIWerkeIcon, HUIErlebnisIcon,
  HUIAmbassadorIcon, HUIEmpfehlungIcon, HUIImpactIcon, HUIFinanzIcon,
  HUIStimmeIcon, HUIProjektIcon, HUIEinAusIcon, HUIKalenderIcon,
  HUIVerkaufIcon, HUIStatistikIcon,
} from "../../../../design/icons/HuiSystemIcons.jsx";
import ProfilBearbeitenModal from "../../../../components/studio/ProfilBearbeitenModal.jsx";
import { MeinBereichDrawer } from "./MeinBereichDrawer.jsx";
import { MeinBereichChooserRow } from "./MeinBereichChooserRow.jsx";
import { MeinBereichTile } from "./MeinBereichTile.jsx";
import { TalentAngeboteSection } from "../sections/TalentAngeboteSection.jsx";
import { MeineWerkeSection } from "../sections/MeineWerkeSection.jsx";
import { ErlebnisseSection } from "../sections/ErlebnisseSection.jsx";
import { ImpactProjekteTab } from "../sections/ImpactProjekteTab.jsx";

const AmbassadorStudioSection = React.lazy(() => import("../../../../components/ambassador/AmbassadorStudioSection.jsx"));
const MyRecommendationsModal   = React.lazy(() => import("../../../../components/studio/MyRecommendationsModal.jsx"));
const ImpactStimmenModal       = React.lazy(() => import("../../../../components/studio/ImpactStimmenModal.jsx"));
const MeineProjekteModal       = React.lazy(() => import("../../../../components/studio/MeineProjekteModal.jsx"));
const ImpactUpdateSheet       = React.lazy(() => import("../../../../components/studio/ImpactUpdateSheet.jsx"));
const EinAusgabenModal         = React.lazy(() => import("../../../../components/studio/EinAusgabenModal.jsx"));
const MeineVerkaeufeModal      = React.lazy(() => import("../../../../components/studio/MeineVerkaeufeModal.jsx"));
const MeineBuchungenModal      = React.lazy(() => import("../../../../components/studio/MeineBuchungenModal.jsx"));
const StatistikenModal         = React.lazy(() => import("../../../../components/studio/StatistikenModal.jsx"));

export function MeinBereichMenu({
  profile, isTalent,
  talents, works, experiences,
  onTalentWizard, onDeleteTalent,
  onWerkWizard, onDeleteWerk,
  onErlebnisWizard, onDeleteErlebnis,
  onOpenResonanz = () => {},
  onProfileUpdate = () => {},
}) {
  const { switchTab } = useHome();
  const [activeDrawer, setActiveDrawer] = useState(null); // talente|werke|erlebnisse|ambassador|empfehlungen|impact|finanzen
  const [impactDetail, setImpactDetail] = useState(null); // stimmen|projekte
  const [financeDetail, setFinanceDetail] = useState(null); // ein_aus|verkaeufe|buchungen|statistiken
  const [activeTab, setActiveTab] = useState("erlebnisse"); // erlebnisse | impact
  const [showUpdateSheet, setShowUpdateSheet] = useState(false);
  const [updateTargetProject, setUpdateTargetProject] = useState(null);
  const [showProfilEdit, setShowProfilEdit] = useState(false);

  const close = () => setActiveDrawer(null);

  return (
    <div style={{ padding:`0 ${T.px}px` }}>
      <div style={{
        background:T.bgCard, borderRadius:T.r20,
        border:`1px solid ${T.border}`, boxShadow:T.card,
        padding:"18px 18px 20px",
      }}>
        <div style={{ fontSize:15, fontWeight:800, color:T.ink, marginBottom:14, letterSpacing:"-0.01em" }}>
          Mein Bereich
        </div>

        <button
          onClick={() => setShowProfilEdit(true)}
          className="mbp-press-light"
          style={{
            width:"100%", padding:"13px", borderRadius:T.r99,
            background:T.tealSoft, border:`1px solid ${T.tealMid}`,
            color:T.teal, fontSize:14, fontWeight:800, cursor:"pointer",
            fontFamily:"inherit", marginBottom:18,
            WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
          }}
        >
          Profil bearbeiten
        </button>

        <div style={{
          display:"grid", gridTemplateColumns:"repeat(4, 1fr)",
          rowGap:18, columnGap:4,
        }}>
          <MeinBereichTile icon={<HUIResonanzIcon size={22}/>} label="Meine Resonanz" onPress={onOpenResonanz} />
          {isTalent && (
            <MeinBereichTile icon={<HUITalentIcon size={22}/>} label="Talent-Angebote" onPress={() => setActiveDrawer("talente")} />
          )}
          {isTalent && (
            <MeinBereichTile icon={<HUIWerkeIcon size={22}/>} label="Meine Werke" onPress={() => setActiveDrawer("werke")} />
          )}
          {isTalent && (
            <MeinBereichTile icon={<HUIErlebnisIcon size={22}/>} label="Erlebnisse & Projekte" onPress={() => setActiveDrawer("erlebnisse")} />
          )}
          <MeinBereichTile icon={<HUIAmbassadorIcon size={22}/>} label="Ambassador-Bereich" onPress={() => setActiveDrawer("ambassador")} />
          <MeinBereichTile icon={<HUIEmpfehlungIcon size={22}/>} label="Meine Empfehlungen" onPress={() => setActiveDrawer("empfehlungen")} />
          <MeinBereichTile icon={<HUIImpactIcon size={22}/>} label="Impact & Stimmen" onPress={() => setActiveDrawer("impact")} />
          <MeinBereichTile icon={<HUIFinanzIcon size={22}/>} label="Finanzabteilung" onPress={() => setActiveDrawer("finanzen")} />
        </div>
      </div>

      {/* ── Talent-Angebote ─────────────────────────────────── */}
      {activeDrawer === "talente" && (
        <MeinBereichDrawer title="Talent-Angebote" icon={<HUITalentIcon size={18}/>} onClose={close} footer={false}>
          <TalentAngeboteSection
            talents={talents}
            onTalentWizard={onTalentWizard}
            onDeleteTalent={onDeleteTalent}
          />
        </MeinBereichDrawer>
      )}

      {/* ── Meine Werke ──────────────────────────────────────── */}
      {activeDrawer === "werke" && (
        <MeinBereichDrawer title="Meine Werke" icon={<HUIWerkeIcon size={18}/>} onClose={close} footer={false}>
          <MeineWerkeSection
            works={works}
            onWerkWizard={onWerkWizard}
            onDeleteWerk={onDeleteWerk}
          />
        </MeinBereichDrawer>
      )}

      {/* ── Erlebnisse & Projekte ────────────────────────────── */}
      {activeDrawer === "erlebnisse" && (
        <MeinBereichDrawer title="Erlebnisse & Projekte" icon={<HUIErlebnisIcon size={18}/>} onClose={close} footer={false}>
          {/* Tab-Switcher */}
          <div style={{ display:"flex", gap:0, margin:"0 20px 16px", background:"rgba(0,0,0,0.05)", borderRadius:12, padding:4 }}>
            {[["erlebnisse","Erlebnisse"],["impact","Impact Projekte"]].map(([key,label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{
                flex:1, padding:"8px 4px", borderRadius:10, border:"none",
                background: activeTab===key ? "white" : "transparent",
                color: activeTab===key ? "#0DC4B5" : "#666",
                fontSize:13, fontWeight: activeTab===key ? 800 : 600,
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
                  <React.Suspense fallback={null}>
            <ImpactUpdateSheet
              project={updateTargetProject}
              currentUser={profile}
              onClose={() => { setShowUpdateSheet(false); setUpdateTargetProject(null); }}
              onSuccess={() => { /* optional: refetch */ }}
            />
                  </React.Suspense>
          )}
        </MeinBereichDrawer>
      )}

      {/* ── Ambassador-Bereich ───────────────────────────────── */}
      {activeDrawer === "ambassador" && (
              <React.Suspense fallback={null}>
        <MeinBereichDrawer title="Ambassador-Bereich" icon={<HUIAmbassadorIcon size={18}/>} onClose={close} footer={false}>
          <AmbassadorStudioSection profile={profile} />
        </MeinBereichDrawer>
              </React.Suspense>
      )}

      {/* ── Meine Empfehlungen (bereits eigenstaendiger Drawer) ─ */}
      {activeDrawer === "empfehlungen" && (
              <React.Suspense fallback={null}>
        <MyRecommendationsModal userId={profile?.id} onClose={close} />
              </React.Suspense>
      )}

      {/* ── Impact & Stimmen (Chooser + Detail-Drawer) ──────── */}
      {activeDrawer === "impact" && !impactDetail && (
        <MeinBereichDrawer title="Impact & Stimmen" icon={<HUIImpactIcon size={18}/>} onClose={close} footer={false}>
          <MeinBereichChooserRow
            icon={<HUIStimmeIcon size={18}/>} label="Impact-Stimmen"
            desc={isTalent ? "2 Stimmen / Monat" : "1 Stimme / Monat"}
            onPress={() => setImpactDetail("stimmen")}
          />
          <MeinBereichChooserRow
            icon={<HUIProjektIcon size={18}/>} label="Meine unterstützten Projekte"
            onPress={() => setImpactDetail("projekte")}
          />
        </MeinBereichDrawer>
      )}
      {activeDrawer === "impact" && impactDetail === "stimmen" && (
              <React.Suspense fallback={null}>
        <ImpactStimmenModal
          profile={profile}
          onClose={() => setImpactDetail(null)}
          switchTab={switchTab}
        />
              </React.Suspense>
      )}
      {activeDrawer === "impact" && impactDetail === "projekte" && (
              <React.Suspense fallback={null}>
        <MeineProjekteModal
          profile={profile}
          onClose={() => setImpactDetail(null)}
          switchTab={switchTab}
        />
              </React.Suspense>
      )}

      {/* ── Finanzabteilung (Chooser + Detail-Drawer) ───────── */}
      {activeDrawer === "finanzen" && !financeDetail && (
        <MeinBereichDrawer title="Finanzabteilung" icon={<HUIFinanzIcon size={18}/>} onClose={close} footer={false}>
          <MeinBereichChooserRow icon={<HUIEinAusIcon size={18}/>} label="Ein-/Ausgaben Übersicht" onPress={() => setFinanceDetail("ein_aus")} />
          <MeinBereichChooserRow icon={<HUIVerkaufIcon size={18}/>} label="Meine Verkäufe" onPress={() => setFinanceDetail("verkaeufe")} />
          <MeinBereichChooserRow icon={<HUIKalenderIcon size={18}/>} label="Meine Buchungen" onPress={() => setFinanceDetail("buchungen")} />
          <MeinBereichChooserRow icon={<HUIStatistikIcon size={18}/>} label="Statistiken" onPress={() => setFinanceDetail("statistiken")} />
        </MeinBereichDrawer>
      )}
      {activeDrawer === "finanzen" && financeDetail === "ein_aus" && (
              <React.Suspense fallback={null}>
        <EinAusgabenModal profile={profile} onClose={() => setFinanceDetail(null)} />
              </React.Suspense>
      )}
      {activeDrawer === "finanzen" && financeDetail === "verkaeufe" && (
              <React.Suspense fallback={null}>
        <MeineVerkaeufeModal profile={profile} onClose={() => setFinanceDetail(null)} />
              </React.Suspense>
      )}
      {activeDrawer === "finanzen" && financeDetail === "buchungen" && (
              <React.Suspense fallback={null}>
        <MeineBuchungenModal profile={profile} onClose={() => setFinanceDetail(null)} />
              </React.Suspense>
      )}
      {activeDrawer === "finanzen" && financeDetail === "statistiken" && (
              <React.Suspense fallback={null}>
        <StatistikenModal profile={profile} onClose={() => setFinanceDetail(null)} />
              </React.Suspense>
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
