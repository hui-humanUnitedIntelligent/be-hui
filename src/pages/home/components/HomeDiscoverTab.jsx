import React, { Suspense } from "react";
import TalentOnboarding from "../../../components/TalentOnboarding.jsx";
import { SAFE_MODE } from "../../../config/safeMode.js";
import { SafeRender } from "../../../config/SafeRender.jsx";
import { DiscoverPage } from "../utils/lazyImports.js";
import { TabOpenFallback } from "../utils/suspenseFallbacks.jsx";

export function HomeDiscoverTab({
  tabRef,
  keepDiscover,
  showTalentFlow,
  setShowTalentFlow,
  openProfileById,
  setShowMap,
  setShowBookingFlow,
}) {
  return (
    <div ref={tabRef} style={keepDiscover}>
      {showTalentFlow && SAFE_MODE.talentFlow && (
        <TalentOnboarding
          onClose={() => setShowTalentFlow(false)}
          onActivate={() => setShowTalentFlow(false)}
        />
      )}

      <Suspense fallback={<TabOpenFallback label="Entdecken öffnet sich…" />}>
        <SafeRender flag="discoverFeed" label="DiscoverPage">
          <DiscoverPage
            onView={(id) => { if (id) openProfileById(id); }}
            onMap={() => setShowMap(true)}
            onBook={(item) => {
              setShowBookingFlow(item);
            }}
          />
        </SafeRender>
      </Suspense>
    </div>
  );
}
