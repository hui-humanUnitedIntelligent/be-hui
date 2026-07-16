import React from "react";
import { createPortal } from "react-dom";
const LazyTalentOnboarding = React.lazy(() => import('../../../../components/TalentOnboarding.jsx'));

export function TalentOnboardingModal({ onClose = () => {}, onSuccess = () => {} }) {
  return createPortal(
    <React.Suspense fallback={null}>
      <LazyTalentOnboarding
        onClose={onClose}
        onActivate={onSuccess}
      />
    </React.Suspense>,
    document.body
  );
}
