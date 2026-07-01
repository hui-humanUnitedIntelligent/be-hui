// Dein Raum — Gespeicherte Inhalte, Favoriten, Merklisten
// Produktive Komponente: MerkenSection (saved_posts, keine Mock-Daten)

import React from "react";
import { useNavigate } from "react-router-dom";
import MerkenSection from "../../../../components/profile/MerkenSection.jsx";
import ResonanceSectionShell from "../ResonanceSectionShell.jsx";

export default function DeinRaumSection() {
  const navigate = useNavigate();

  return (
    <ResonanceSectionShell
      title="Dein Raum"
      tagline="Gespeicherte Inhalte, Favoriten, Merklisten"
      icon="🔖"
    >
      <div style={{ padding: "0 20px 24px" }}>
        <MerkenSection
          onOpenDiscover={() => navigate("/Home", { state: { tab: "discover" } })}
        />
      </div>
    </ResonanceSectionShell>
  );
}
