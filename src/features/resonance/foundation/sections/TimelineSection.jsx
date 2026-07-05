// Timeline — Alles, was mich bewegt hat
// Produktive Komponente: MeineResonanz (embedded)

import React from "react";
import { useNavigate } from "react-router-dom";
import MeineResonanz from "../../../../pages/studio/MeineResonanz.jsx";
import ResonanceSectionShell from "../ResonanceSectionShell.jsx";

export default function TimelineSection() {
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
      title="Timeline"
      tagline="Alles, was mich bewegt hat"
      icon="✨"
    >
      <MeineResonanz
        embedded
        onNavigate={handleNavigate}
      />
    </ResonanceSectionShell>
  );
}
