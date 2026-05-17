// src/hooks/useHomeOverlays.js
// HUI — Home Overlay State Manager — Phase 5B
// ═══════════════════════════════════════════════════════════════
//
// ZWECK:
// Home.jsx hatte 22 show*-States für Overlay-Sichtbarkeit.
// Dieser Hook konsolidiert alle in einem einzigen Objekt,
// reduziert Re-Renders und macht die Verantwortlichkeit klar.
//
// USAGE:
//   const { overlays, showOverlay, hideOverlay, hideAll } = useHomeOverlays();
//   overlays.wirker          → WirkerProfilePage
//   overlays.chat            → ChatPage
//   overlays.werkDetail      → WerkDetail Sheet
//   overlays.werkCheckout    → WerkCheckout Sheet
//   overlays.werkeKorb       → Warenkorb
//   overlays.storyComposer   → StoryComposer
//   overlays.werkPublisher   → WerkPublisher
//   overlays.experienceCreator → ExperienceCreator
//   overlays.match           → HuiMatchOverlay
//   overlays.map             → LiveMapPage
//   overlays.chat            → ChatPage
//   overlays.notifs          → NotificationCenter
//   overlays.membership      → HuiMembershipFlow
//   overlays.createFlow      → CreateFlow
//   overlays.plusSheet       → HuiPlusSheet
//   overlays.talentFlow      → TalentOnboarding
//   overlays.createSheet     → wirker create menu
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react';

const INITIAL = {
  wirker:           null,   // { wirker object } oder null
  werkDetail:       null,
  werkCheckout:     null,
  werkeKorb:        false,
  storyComposer:    false,
  activeStory:      null,
  werkPublisher:    false,
  experienceCreator:false,
  match:            false,
  activeMood:       null,
  map:              false,
  chat:             false,
  notifs:           false,
  membership:       false,
  createFlow:       false,
  plusSheet:        false,
  createType:       null,
  talentFlow:       false,
  createSheet:      false,
};

export function useHomeOverlays() {
  const [overlays, setOverlays] = useState(INITIAL);

  // Öffne ein Overlay (mit optionalem Payload)
  const showOverlay = useCallback((key, value = true) => {
    setOverlays(prev => ({ ...prev, [key]: value }));
  }, []);

  // Schließe ein einzelnes Overlay
  const hideOverlay = useCallback((key) => {
    setOverlays(prev => ({ ...prev, [key]: key in INITIAL ? INITIAL[key] : false }));
  }, []);

  // Schließe alle Overlays (z.B. bei Tab-Wechsel)
  const hideAll = useCallback(() => {
    setOverlays(INITIAL);
  }, []);

  // Story Composer via CustomEvent (bestehende API bleibt erhalten)
  useEffect(() => {
    const handler = () => setOverlays(prev => ({ ...prev, storyComposer: true }));
    document.addEventListener('hui:open-story-composer', handler);
    return () => document.removeEventListener('hui:open-story-composer', handler);
  }, []);

  return { overlays, showOverlay, hideOverlay, hideAll };
}
