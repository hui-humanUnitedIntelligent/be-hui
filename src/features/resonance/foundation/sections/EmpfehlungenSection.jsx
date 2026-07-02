// Empfehlungen — Von mir ausgesprochene Empfehlungen
// Produktive Komponente: MyRecommendationsContent (aus HuiStudio extrahiert)

import React from "react";
import { useAuth } from "../../../../lib/AuthContext.jsx";
import MyRecommendationsContent from "../components/MyRecommendationsContent.jsx";
import ResonanceSectionShell from "../ResonanceSectionShell.jsx";

export default function EmpfehlungenSection() {
  const { user, profile } = useAuth();
  const userId = user?.id || profile?.id;

  return (
    <ResonanceSectionShell
      title="Empfehlungen"
      tagline="Von mir ausgesprochene Empfehlungen"
      icon="⭐"
    >
      <MyRecommendationsContent userId={userId} embedded />
    </ResonanceSectionShell>
  );
}
