// src/components/auth/NutzungsbedingungenModal.jsx
// In-App Anzeige der HUI-App-Nutzungsbedingungen.
// Wird vom Login-Screen aus geöffnet (klickbarer "Nutzungsbedingungen"-Link).
// Entworfen 2026-08-15 — rechtliche Pruefung durch Trägervereine steht aus.

import React from "react";
import { createPortal } from "react-dom";

const T = {
  teal: "#0DC4B5",
  teal2: "#0FC4B2",
  dark: "#0A1F1C",
  darkCard: "#0F2A26",
  white: "#FFFFFF",
  muted: "rgba(255,255,255,0.55)",
  muted2: "rgba(255,255,255,0.35)",
  border: "rgba(255,255,255,0.08)",
};

const SECTIONS = [
  {
    title: "1. Geltungsbereich",
    body: [
      "Diese Nutzungsbedingungen gelten für die Nutzung der HUI-App (Web-App und mobile App), einschließlich aller darin verfügbaren Funktionen wie Registrierung, Profilverwaltung, Erstellung und Kauf von Werken, Buchung von Talenten und Erlebnissen, Kommunikation, Abstimmungen und Zahlungsverkehr.",
      "Durch die Registrierung und Nutzung der HUI-App erklärt der Nutzer sein Einverständnis mit diesen Bedingungen.",
    ],
  },
  {
    title: "2. Registrierung und Konto",
    subs: [
      { h: "2.1 Voraussetzungen", items: [
        "Die Registrierung erfordert eine gültige E-Mail-Adresse und ein selbst gewähltes Passwort.",
        "Der Nutzer muss bei der Registrierung wahrheitsgemäße Angaben machen.",
        "Ein Konto ist personenbezogen und darf nicht auf Dritte übertragen werden.",
        "Minderjährige bedürfen der Zustimmung ihres gesetzlichen Vertreters.",
      ]},
      { h: "2.2 Konto-Sicherheit", items: [
        "Der Nutzer ist für die Sicherheit seiner Zugangsdaten selbst verantwortlich.",
        "Bei Verdacht auf Missbrauch ist HUI unverzüglich zu informieren.",
        "HUI behält sich vor, Konten bei Missbrauch zu sperren.",
      ]},
      { h: "2.3 Mitgliedschafts-Typen", items: [
        "Basis-Nutzer: Grundlegende Funktionen (Entdecken, Profil, Inhalte erstellen, Kaufen, Buchen).",
        "Talent/Wirker: Erweiterte Funktionen (Angebote erstellen, Buchungen annehmen, Verkäufe).",
        "Ambassador: Empfehlungsprogramm mit Vergütung bei erfolgreicher Vermittlung.",
        "Mitgliedschaft: Optionale kostenpflichtige Mitgliedschaft mit erweiterten Funktionen.",
      ]},
    ],
  },
  {
    title: "3. Profile und Inhalte",
    subs: [
      { h: "3.1 Profil", items: [
        "Jeder Nutzer erstellt ein Profil, das öffentlich sichtbar ist.",
        "Der Nutzer bestimmt selbst, welche Informationen er teilt.",
        "Profile können öffentlich aufgerufen und geteilt werden.",
      ]},
      { h: "3.2 Inhalte erstellen", items: [
        "Werke: Selbsterschaffene Werke (Kunst, Musik, Handwerk, Fotografie) — kostenlos oder kostenpflichtig.",
        "Talente: Dienstleistungen und Angebote (Kurse, Coaching, Workshops, Auftritte).",
        "Erlebnisse: Veranstaltungen und gemeinsame Erlebnisse.",
        "Momente: Kurze Eindrücke und Updates im Feed.",
        "Projekte: Gemeinschaftliche Projekte, die Unterstützung suchen.",
      ]},
      { h: "3.3 Verantwortung für Inhalte", items: [
        "Der Nutzer ist allein verantwortlich für die Inhalte, die er erstellt und teilt.",
        "Der Nutzer sichert zu, dass er die erforderlichen Rechte besitzt (Urheberrecht, Bildrechte, Musikrechte).",
        "Inhalte dürfen nicht gegen geltendes Recht verstoßen.",
        "HUI behält sich vor, Inhalte zu entfernen, die gegen diese Bedingungen verstoßen.",
      ]},
      { h: "3.4 Nutzungsrechte", items: [
        "Der Nutzer räumt HUI ein nicht-exklusives Recht ein, Inhalte innerhalb der HUI-Plattform anzuzeigen und zugänglich zu machen.",
        "Das Urheberrecht verbleibt beim Nutzer.",
      ]},
    ],
  },
  {
    title: "4. Käufe und Zahlungsverkehr",
    subs: [
      { h: "4.1 Werke kaufen", items: [
        "Werke können kostenlos oder kostenpflichtig angeboten werden.",
        "Zahlungen erfolgen über den Zahlungsdienstleister Stripe.",
        "HUI erhebt eine Plattformgebühr von 20 % des Kaufpreises (Balanced-Growth-Modell) — der Talent/Wirker erhält 80 %.",
        "Die Plattformgebühr wird aufgeteilt: 50 % Unternehmen, 30 % Impact-Fonds, 20 % Innovationsfonds.",
      ]},
      { h: "4.2 Escrow-System (Sicherungs-System)", items: [
        "Bei kostenpflichtigen Käufen wird die Zahlung zunächst sichergestellt.",
        "Der Betrag wird erst ausgezahlt, wenn der Käufer den Erhalt bestätigt.",
        "Automatische Bestätigung nach 14 Tagen, sofern kein Einspruch erhoben wurde.",
        "Bei Streitfällen kann ein Escrow-Dispute eröffnet werden.",
      ]},
      { h: "4.3 Buchungen", items: [
        "Talente und Erlebnisse können gebucht werden.",
        "Die Zahlungsabwicklung erfolgt über Stripe.",
        "Stornierungsbedingungen werden beim Angebot ausgewiesen.",
      ]},
      { h: "4.4 Ambassador-Vergütung", items: [
        "Ambassador erhalten eine Provision aus dem Unternehmensanteil der Plattformgebühr (5 % bis 20 %, gestaffelt nach Empfehlungs-Anzahl).",
        "Die Auszahlung erfolgt über Stripe Connect nach Freigabe.",
      ]},
      { h: "4.5 Mitgliedschaft", items: [
        "Eine optionale HUI-Mitgliedschaft kann kostenpflichtig abgeschlossen werden.",
        "Die Mitgliedschaft kann monatlich gekündigt werden.",
      ]},
    ],
  },
  {
    title: "5. Impact-Voting",
    items: [
      "Nutzer können für Projekte abstimmen, die Impact-Fonds erhalten sollen.",
      "Stimmgewichtung: 1 Stimme für Basis-Nutzer, 2 Stimmen für Talent-Nutzer.",
      "Verteilung erfolgt monatlich (50/30/20 auf die Top-3-Projekte).",
      "Monatliche Reset am 1. des Monats. Vorherige Ergebnisse werden archiviert.",
      "Stimmmanipulation ist untersagt.",
    ],
  },
  {
    title: "6. Kommunikation und Chat",
    subs: [
      { h: "6.1 Chat", items: [
        "Nutzer können über den integrierten Chat kommunizieren.",
        "Textnachrichten, Bilder und Sprachnachrichten können gesendet werden.",
        "Chat-Inhalte sind nur zwischen den beteiligten Nutzern sichtbar.",
      ]},
      { h: "6.2 Kommentarfunktion", items: [
        "Nutzer können Inhalte kommentieren. Kommentare sind öffentlich sichtbar.",
        "Der Inhaltsersteller kann Kommentare auf seinen Inhalten löschen.",
      ]},
      { h: "6.3 Interaktionen", items: [
        "Nutzer können Inhalte liken, inspiriert sein, speichern und teilen.",
        "Diese Interaktionen sind öffentlich sichtbar.",
      ]},
    ],
  },
  {
    title: "7. Benachrichtigungen",
    items: [
      "HUI sendet Push-Benachrichtigungen bei relevanten Ereignissen.",
      "Der Nutzer kann Benachrichtigungen in den Einstellungen verwalten.",
      "Das Resonanzzentrum bietet eine zentrale Übersicht.",
    ],
  },
  {
    title: "8. Pflichten des Nutzers",
    items: [
      "Wahrheitsgemäße Angaben machen, keine falschen Identitäten annehmen.",
      "Keine Inhalte teilen, die gegen geltendes Recht verstoßen.",
      "Keine automatisierten Systeme (Bots, Scraper) einsetzen.",
      "Keine Inhalte anderer Nutzer ohne deren Zustimmung kopieren.",
      "Das Escrow-System nicht missbrauchen.",
      "Keine Telefonnummern oder sensible Daten im öffentlichen Profil veröffentlichen (DSGVO).",
    ],
  },
  {
    title: "9. Haftung",
    subs: [
      { h: "9.1 Haftung von HUI", items: [
        "HUI haftet nur bei Vorsatz oder grober Fahrlässigkeit.",
        "HUI ist nicht Vertragspartner bei Käufen zwischen Nutzern — HUI stellt die Plattform zur Verfügung.",
        "HUI übernimmt keine Gewähr für Richtigkeit und Aktualität von Nutzer-Inhalten.",
        "HUI haftet nicht für Zahlungen über den externen Dienstleister Stripe.",
      ]},
      { h: "9.2 Haftung des Nutzers", items: [
        "Der Nutzer haftet für seine erstellten Inhalte und Aussagen.",
        "Bei missbräuchlicher Nutzung des Kontos haftet der Kontoinhaber.",
      ]},
    ],
  },
  {
    title: "10. Datenschutz",
    items: [
      "Die Verarbeitung personenbezogener Daten erfolgt gemäß der Datenschutzerklärung von HUI.",
      "HUI speichert keine Telefonnummern. Die DSGVO-konforme Verarbeitung wird erzwungen.",
      "Datenschutzerklärung einsehbar in der App und auf be-hui.com/datenschutz.",
    ],
  },
  {
    title: "11. Änderungen der Nutzungsbedingungen",
    items: [
      "HUI behält sich vor, diese Bedingungen bei berechtigtem Interesse zu ändern.",
      "Wesentliche Änderungen werden in der App angekündigt.",
      "Durch fortgesetzte Nutzung erklärt der Nutzer sein Einverständnis.",
    ],
  },
  {
    title: "12. Beendigung",
    items: [
      "Der Nutzer kann sein Konto jederzeit löschen.",
      "Bei Verstoß kann HUI das Konto sperren.",
      "Bei Kontolöschung werden erstellte Inhalte entfernt. Abgeschlossene Transaktionen bleiben unberührt.",
    ],
  },
  {
    title: "13. Anwendbares Recht",
    items: ["Es gilt österreichisches Recht, soweit nicht zwingende gesetzliche Bestimmungen einer anderen Rechtsordnung entgegenstehen."],
  },
  {
    title: "14. Kontakt",
    items: [
      "HUI — Human United Intelligence",
      "Getragen durch 4VisionGlobal und Liga der Kreativen",
      "Kontakt über die Support-Funktion in der App oder be-hui.com/kontakt",
    ],
  },
];

export default function NutzungsbedingungenModal({ open = false, onClose = () => {} }) {
  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10500,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "92%",
          maxWidth: 460,
          maxHeight: "85vh",
          background: T.dark,
          borderRadius: 20,
          border: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "20px 20px 14px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, color: T.white, letterSpacing: -0.3 }}>
              Nutzungsbedingungen
            </div>
            <div style={{ fontSize: 11, color: T.muted2, marginTop: 2 }}>
              HUI-App · Stand August 2026
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: 10,
              width: 36, height: 36,
              color: T.muted,
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{
          overflowY: "auto",
          padding: "16px 20px 24px",
          WebkitOverflowScrolling: "touch",
          flex: 1,
        }}>
          <div style={{ fontSize: 12, color: T.muted2, marginBottom: 16, lineHeight: 1.5 }}>
            Diese Nutzungsbedingungen regeln die Nutzung der HUI-App. Die Bedingungen der öffentlichen Website (be-hui.com) gelten gesondert.
          </div>

          {SECTIONS.map((sec, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.teal2, marginBottom: 8 }}>
                {sec.title}
              </div>
              {sec.items?.map((item, j) => (
                <div key={j} style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.6, marginBottom: 4, paddingLeft: 10 }}>
                  • {item}
                </div>
              ))}
              {sec.subs?.map((sub, k) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 4 }}>
                    {sub.h}
                  </div>
                  {sub.items?.map((item, l) => (
                    <div key={l} style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, marginBottom: 3, paddingLeft: 10 }}>
                      • {item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}

          <div style={{
            fontSize: 11, color: T.muted2, textAlign: "center",
            paddingTop: 16, borderTop: `1px solid ${T.border}`,
            lineHeight: 1.5,
          }}>
            © 2026 HUI — Human United Intelligence<br/>
            Entwurf — zur rechtlichen Prüfung durch die Trägervereine
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
