import { ResonanzzentrumPanel } from "./ResonanzzentrumPanel.jsx";

// Legacy-Export für alte NotificationInbox-Aufrufe (Backwards Compat)
export function NotificationInbox({ onClose }) {
  return <ResonanzzentrumPanel onClose={onClose} />;
}
