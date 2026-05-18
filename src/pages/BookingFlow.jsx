// src/pages/BookingFlow.jsx
// ═══════════════════════════════════════════════════════════════
// WICHTIG: BookingFlow lebt in src/components/BookingFlow.jsx
// Diese Datei ist ein sicherer Re-Export + Redirect-Fallback.
// Direkter Zugriff via /BookingFlow → Navigate to /Home
// ═══════════════════════════════════════════════════════════════

// Re-export der echten Komponente (Failsafe für alte Imports)
export { default } from '../components/BookingFlow';
export { default as BookingFlow } from '../components/BookingFlow';
