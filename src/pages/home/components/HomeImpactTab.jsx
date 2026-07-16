import React, { Suspense } from "react";
import { SAFE_MODE } from "../../../config/safeMode.js";
import { SafeRender } from "../../../config/SafeRender.jsx";
import { ImpactPage } from "../utils/lazyImports.js";
import { TabOpenFallback } from "../utils/suspenseFallbacks.jsx";

export function HomeImpactTab({ tabRef, keepImpact, currentUser }) {
  return (
    <div ref={tabRef} style={keepImpact}>
      <Suspense fallback={<TabOpenFallback label="Impact-Raum öffnet sich…" />}>
        <SafeRender flag="impactPage" label="ImpactPage">
          <ImpactPage currentUser={currentUser} />
        </SafeRender>
      </Suspense>
    </div>
  );
}
