import React from "react";
import { StoryViewer } from "../../../components/StoryBar.jsx";
import ContentTypeSelector from "../../../content/ContentTypeSelector.jsx";
import InvitationFlow from "../../../content/invitation/InvitationFlow.jsx";
import { SAFE_MODE } from "../../../config/safeMode.js";
import { SafeRender } from "../../../config/SafeRender.jsx";
import { routeContentTypeSelection } from "../handlers/contentTypeRouting.js";

export function HomeContentOverlays({
  showContentSelector,
  setShowContentSelector,
  isTalent,
  setShowTeilen,
  setShowExperienceCreator,
  setShowWerkPublisher,
  setShowInvitationFlow,
  showInvitationFlow,
  activeStory,
  setActiveStory,
}) {
  return (
    <>
      {showContentSelector && isTalent && (
        <ContentTypeSelector
          visible={showContentSelector}
          onClose={() => setShowContentSelector(false)}
          onSelect={(type) => {
            routeContentTypeSelection(type, {
              setShowContentSelector,
              setShowTeilen,
              setShowExperienceCreator,
              setShowWerkPublisher,
              setShowInvitationFlow,
            });
          }}
        />
      )}

      {showInvitationFlow && (
        <InvitationFlow
          visible={showInvitationFlow}
          onClose={() => setShowInvitationFlow(false)}
        />
      )}

      {activeStory && SAFE_MODE.storyViewer && (
        <SafeRender flag="storyViewer" label="StoryViewer">
          <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />
        </SafeRender>
      )}
    </>
  );
}
