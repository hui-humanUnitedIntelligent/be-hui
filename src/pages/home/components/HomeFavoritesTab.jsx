import React, { Suspense } from "react";
import { FavoritesPage } from "../utils/lazyImports.js";
import { FullScreenSpinnerFallback } from "../utils/suspenseFallbacks.jsx";

export function HomeFavoritesTab({
  tabRef,
  keepFavorites,
  currentUser,
  openProfileById,
  handleTab,
}) {
  return (
    <div ref={tabRef} style={keepFavorites}>
      <Suspense fallback={<FullScreenSpinnerFallback />}>
        <FavoritesPage
          currentUser={currentUser}
          onView={w => { const id = w?.id || w?.user_id; if (id) openProfileById(id); }}
          onImpact={() => handleTab("impact")}
          onDiscover={() => handleTab("discover")}
        />
      </Suspense>
    </div>
  );
}
