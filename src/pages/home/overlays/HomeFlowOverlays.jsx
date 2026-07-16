import React, { Suspense } from "react";
import ConnectionCreatePage from "../../../components/connection-create/ConnectionCreatePage.jsx";
import ChatCenterOverlay from "../../../components/chat-center/ChatCenterOverlay.jsx";
import { SAFE_MODE } from "../../../config/safeMode.js";
import { SafeRender } from "../../../config/SafeRender.jsx";
import { cleanupOrbEnvironment } from "../../../lib/cleanup/cleanupOrbEnvironment.js";
import MeinHUI from "../../MeinHUI.jsx";
import {
  TeilenFlow,
  LiveMapPage,
  HuiMatchOverlay,
  HuiMembershipFlow,
  CreatorDashboard,
  HuiCreateFlow,
  StoryComposer,
  WorkFlow,
  ExperienceFlow,
  ImpactFlow,
} from "../utils/lazyImports.js";
import { FullScreenSpinnerFallback } from "../utils/suspenseFallbacks.jsx";

export function HomeFlowOverlays({
  showConnect,
  setShowConnect,
  showTeilen,
  setShowTeilen,
  showChat,
  setShowChat,
  chatRecipient,
  setChatRecipient,
  flow,
  markChatRead,
  openProfileById,
  handleTab,
  showMap,
  setShowMap,
  showMatch,
  setShowMatch,
  setActiveMood,
  showPlusSheet,
  meinHuiClosing,
  authProfile,
  closeMeinHuiCinematic,
  showStoryComposer,
  setShowStoryComposer,
  showWerkPublisher,
  setShowWerkPublisher,
  showExperienceCreator,
  setShowExperienceCreator,
  canCreate,
  showMembership,
  setShowMembership,
  showCreatorDash,
  setShowCreatorDash,
  showCreateFlow,
  setShowCreateFlow,
  showImpactFlow,
  setShowImpactFlow,
}) {
  return (
    <>
      {showConnect && SAFE_MODE.connectFlow && (
        <SafeRender flag="connectFlow" label="ConnectionCreatePage">
          <ConnectionCreatePage
            onClose={() => {
              setShowConnect(false);
            }}
            onPublish={() => {
              setShowConnect(false);
            }}
          />
        </SafeRender>
      )}

      <TeilenFlow
        visible={showTeilen}
        onClose={() => {
          setShowTeilen(false);
        }}
        onPublished={() => {
          setShowTeilen(false);
        }}
      />

      {showChat && SAFE_MODE.chatCenter && (
        <SafeRender flag="chatCenter" label="ChatCenterOverlay">
          <ChatCenterOverlay
            onClose={() => {
              setShowChat(false);
              setChatRecipient(null);
              const returnProfile = flow.getReturnProfile();
              if (returnProfile) {
                flow.clearReturnProfile();
                const retId = returnProfile?.id || returnProfile?.user_id;
                if (retId) { setTimeout(() => openProfileById(retId), 50); }
              }
            }}
            onMarkRead={markChatRead}
            initialRecipient={chatRecipient}
            onDiscoverClose={() => {
              setShowChat(false);
              setChatRecipient(null);
              flow.clearReturnProfile();
              handleTab("discover");
            }}
          />
        </SafeRender>
      )}

      <Suspense fallback={<FullScreenSpinnerFallback />}>
        {showMap && SAFE_MODE.liveMap && (
          <SafeRender flag="liveMap" label="LiveMapPage">
            <LiveMapPage
              onView={w => { const id = w?.id || w?.user_id; if (id) openProfileById(id); setShowMap(false); }}
              onMatch={() => { setShowMatch(true); setShowMap(false); }}
              onClose={() => setShowMap(false)}
            />
          </SafeRender>
        )}
        {showMatch && SAFE_MODE.matchOverlay && (
          <SafeRender flag="matchOverlay" label="HuiMatchOverlay">
            <HuiMatchOverlay
              onClose={() => setShowMatch(false)}
              onMoodSelect={(m) => { setActiveMood(m); setShowMatch(false); }}
              onView={w => { const id = w?.id || w?.user_id; if (id) openProfileById(id); setShowMatch(false); }}
            />
          </SafeRender>
        )}
        <MeinHUI
          visible={showPlusSheet}
          closing={meinHuiClosing}
          profile={authProfile}
          onClose={closeMeinHuiCinematic}
          onNotif={closeMeinHuiCinematic}
          onSettings={closeMeinHuiCinematic}
        />
        {showStoryComposer && SAFE_MODE.storyComposer && canCreate && (
          <SafeRender flag="storyComposer" label="StoryComposer">
            <StoryComposer
              onClose={() => setShowStoryComposer(false)}
              onPublished={() => setShowStoryComposer(false)}
            />
          </SafeRender>
        )}
        {showWerkPublisher && SAFE_MODE.werkFlow && canCreate && (
          <SafeRender flag="werkFlow" label="WorkFlow">
            <WorkFlow
              onClose={() => setShowWerkPublisher(false)}
              onPublished={() => setShowWerkPublisher(false)}
            />
          </SafeRender>
        )}
        {showExperienceCreator && SAFE_MODE.experienceFlow && canCreate && (
          <SafeRender flag="experienceFlow" label="ExperienceFlow">
            <ExperienceFlow
              onClose={() => setShowExperienceCreator(false)}
            />
          </SafeRender>
        )}
        {showMembership && SAFE_MODE.membership && (
          <SafeRender flag="membership" label="HuiMembershipFlow">
            <HuiMembershipFlow
              onClose={() => {
                try { cleanupOrbEnvironment({ reason: "membership-close" }); } catch { /* silent */ }
                setShowMembership(false);
              }}
              onComplete={() => {
                try { cleanupOrbEnvironment({ reason: "membership-complete" }); } catch { /* silent */ }
                setShowMembership(false);
              }}
            />
          </SafeRender>
        )}
        {showCreatorDash && (
          <React.Suspense fallback={null}>
            <CreatorDashboard
              visible={showCreatorDash}
              onClose={() => setShowCreatorDash(false)}
              onOpenProfile={(id) => {
                setShowCreatorDash(false);
                if (id === "discover") { handleTab("discover"); }
                else if (id) { openProfileById(id); }
              }}
            />
          </React.Suspense>
        )}
        {showCreateFlow && SAFE_MODE.createFlow && (
          <SafeRender flag="createFlow" label="HuiCreateFlow">
            <HuiCreateFlow onClose={() => setShowCreateFlow(false)} />
          </SafeRender>
        )}
        {showImpactFlow && SAFE_MODE.impactFlow && (
          <SafeRender flag="impactFlow" label="ImpactFlow">
            <ImpactFlow
              onClose={() => setShowImpactFlow(false)}
            />
          </SafeRender>
        )}
      </Suspense>
    </>
  );
}
