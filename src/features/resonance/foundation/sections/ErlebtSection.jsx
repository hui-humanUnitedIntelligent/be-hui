// Erlebt — Buchungen, Käufe, besuchte Erlebnisse, unterstützte Projekte
// Produktive Komponente: MeineResonanz (embedded, gefiltert)

import React from "react";
import { useNavigate } from "react-router-dom";
import MeineResonanz from "../../../../pages/studio/MeineResonanz.jsx";
import ResonanceSectionShell from "../ResonanceSectionShell.jsx";

const ERLEBT_TYPES = ["buchung", "werk", "erlebnis", "support", "impact"];

export default function ErlebtSection() {
  const navigate = useNavigate();

  function handleNavigate(type, navId) {
    if (type === "impact")    navigate("/impact");
    else if (type === "werk") navigate(`/work/${navId}`);
    else if (type === "erlebnis") navigate("/Home", { state: { highlightExperience: navId } });
    else if (type === "buchung")  navigate("/Home");
    else if (type === "support")  navigate("/impact");
  }

  return (
    <ResonanceSectionShell
      title="Erlebt"
      tagline="Buchungen, Käufe, besuchte Erlebnisse, unterstützte Projekte"
      icon="🌿"
    >
      <MeineResonanz
        embedded
        allowedTypes={ERLEBT_TYPES}
        defaultFilter="all"
        emptyTitle="Noch nichts erlebt"
        emptyBody="Sobald du etwas buchst, kaufst oder unterstützt, erscheint es hier als Teil deiner Geschichte."
        onNavigate={handleNavigate}
      />
    </ResonanceSectionShell>
  );
}
