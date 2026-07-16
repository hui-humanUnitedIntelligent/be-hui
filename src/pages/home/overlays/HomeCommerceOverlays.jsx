import React from "react";
import WerkeKorb, { WerkeKorbButton } from "../../../components/commerce/WerkeKorb.jsx";
import UnterstutzenFlow from "../../../components/commerce/UnterstutzenFlow.jsx";
import WerkKaufFlow from "../../../components/commerce/WerkKaufFlow.jsx";
import ExperienceBookingFlow from "../../../components/commerce/ExperienceBookingFlow.jsx";
import ProfileLauncher from "../../../components/home/profile/ProfileLauncher.jsx";
import { SAFE_MODE } from "../../../config/safeMode.js";
import { clearCartAfterSuccess } from "../../../components/commerce/commerceUtils.js";

export function HomeCommerceOverlays({
  cart,
  setCart,
  showWerkeKorb,
  setShowWerkeKorb,
  showUnterstutzenFlow,
  setShowUnterstutzenFlow,
  showWerkCheckout,
  setShowWerkCheckout,
  showBookingFlow,
  setShowBookingFlow,
  handleTab,
  closeContentPreview,
  clearCartPersist,
}) {
  return (
    <>
      {SAFE_MODE.werkFlow && (
        <WerkeKorbButton
          count={cart.length}
          onOpen={() => setShowWerkeKorb(true)}
        />
      )}

      {showWerkeKorb && SAFE_MODE.werkFlow && (
        <WerkeKorb
          items={cart}
          onClose={() => setShowWerkeKorb(false)}
          onRemove={(item) => setCart(prev => prev.filter(x => x.id !== item.id))}
          onUnterstuetzen={async () => {
            setShowUnterstutzenFlow(true);
            setShowWerkeKorb(false);
          }}
          onDiscover={() => { setShowWerkeKorb(false); handleTab("discover"); }}
          onChat={null}
        />
      )}

      {showUnterstutzenFlow && SAFE_MODE.werkFlow && (
        <UnterstutzenFlow
          items={cart}
          onClose={() => { setShowUnterstutzenFlow(false); closeContentPreview(); }}
          onUnterstuetzen={async () => {
            // P1: Mock-Timeout entfernt — Stripe übernimmt Payment
          }}
          onClearCart={() => { clearCartAfterSuccess(setCart); clearCartPersist?.(); }}
          onDiscover={() => { setShowUnterstutzenFlow(false); handleTab("discover"); }}
          onResonanzCenter={() => setShowUnterstutzenFlow(false)}
        />
      )}

      <ProfileLauncher />

      {showWerkCheckout && (
        <WerkKaufFlow
          werk={showWerkCheckout}
          onClose={() => setShowWerkCheckout(null)}
        />
      )}

      {showBookingFlow && (
        <ExperienceBookingFlow
          experience={showBookingFlow}
          onClose={() => setShowBookingFlow(null)}
        />
      )}
    </>
  );
}
