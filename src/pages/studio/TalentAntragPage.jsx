// ══════════════════════════════════════════════════════════════════════════════
// TalentAntragPage.jsx — HUI V7.5 — Talent-Antrag (Desktop Studio)
// ══════════════════════════════════════════════════════════════════════════════
//
// Der Talent-Antrag ist keine Bewerbung um einen Status.
// Er ist ein Angebot, Verantwortung für die Gemeinschaft zu übernehmen.
// Die gesamte Sprache, UI und der Ablauf transportieren diesen Gedanken.
//
// Der Antrag fühlt sich menschlich, wertschätzend und ruhig an.
// Nicht wie ein Formular. Nicht wie ein Freischaltprozess.
// Sondern wie der Beginn einer gemeinsamen Reise.
//
// ABLAUF:
//   1. Mitglied liest, was es bedeutet, Verantwortung zu tragen
//   2. Mitglied schreibt: Was möchte es einbringen? Welche Erfahrungen prägen es?
//   3. Mitglied schreibt: Was möchte es in der Gemeinschaft bewirken?
//   4. Absenden → Notification an alle Team-Mitglieder (type: talent_application)
//   5. Team prüft im Entwicklungszentrum → Freigaben → vergibt Verantwortung
//
// ARL-01: is_talent wird NIEMALS hier gesetzt. Nur im Entwicklungszentrum.
//
// ══════════════════════════════════════════════════════════════════════════════
// ARCHITEKTURREGELN
// ══════════════════════════════════════════════════════════════════════════════
//
// ARL-03: TALENT-ANTRAG ALS BEZIEHUNGSBEGINN
//   Ein Talent-Antrag beschreibt den Wunsch, Verantwortung zu übernehmen.
//   Er ist kein Test und keine Bewerbung um einen Rang.
//   Die Sprache bleibt langfristig konsistent: Angebot, Beitrag, Gemeinschaft.
//   Nie: Prüfung, Bewertung, Qualifikation, Ranking.
//
// ARL-04: ANTRAG ALS TEIL DER PERSÖNLICHEN REISE (V8-EVOLUTION, nicht V7.5)
//   Der Antrag bleibt langfristig Bestandteil der persönlichen Reise.
//   Auch wenn er angenommen oder abgelehnt wurde, gehört er zur Geschichte
//   des Menschen. Er soll in der persönlichen Resonanz bzw. Timeline sichtbar sein.
//   Dies ist ausdrücklich eine V8-Evolution und keine Aufgabe für V7.5.
//   In V7.5 wird der Antrag als Notification gespeichert und nach Bearbeitung
//   als gelesen markiert. Die Timeline-Integration folgt in V8.
// ══════════════════════════════════════════════════════════════════════════════
//
// DATEN: Supabase (notifications, profiles)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import { isProfileTalent } from '../../lib/profileUtils.js';
import { HUI } from "../../design/hui.design.js";
import { useTranslation } from "../../hooks/useTranslation.js";

const C = {
  cream: HUI.COLOR.creamStudio, white: HUI.COLOR.white, ink: HUI.COLOR.inkStudio,
  muted: 'rgba(80,80,80,0.55)', teal: HUI.COLOR.tealStudio, coral: HUI.COLOR.coralStudio,
  border: 'rgba(0,0,0,0.06)',
};

export default function TalentAntragPage() {
  const { t } = useTranslation();
  const { profile, user } = useAuth();
  const [beitrag, setBeitrag] = useState('');
  const [erfahrungen, setErfahrungen] = useState('');
  const [vision, setVision] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Prüfen, ob bereits ein Antrag offen ist
  useEffect(() => {
    async function checkExisting() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('actor_id', user.id)
        .eq('type', 'talent_application')
        .eq('is_read', false)
        .limit(1);
      if (data && data.length > 0) setAlreadyApplied(true);
    }
    checkExisting();
  }, [user?.id]);

  // Bereits Talent → keine Bewerbung nötig
  if (isProfileTalent(profile)) {
    return (
      <div style={{
        padding: '40px 32px', maxWidth: 680,
        fontFamily: "Inter, sans-serif",
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
          {t("tap.bereitsVerantwortung")}
        </h2>
        <p style={{ fontSize: 15, color: C.muted }}>
          Du bist bereits ein Talent bei HUI. Dein Studio steht dir offen.
        </p>
      </div>
    );
  }

  // Bereits beantragt → Wartestatus
  if (alreadyApplied || submitted) {
    return (
      <div style={{
        padding: '40px 32px', maxWidth: 680,
        fontFamily: "Inter, sans-serif",
      }}>
        <div style={{
          padding: '32px', borderRadius: 16, background: C.white, border: `1px solid ${C.border}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 15, color: C.ink, fontWeight: 600, marginBottom: 12 }}>
            Dein Angebot ist angekommen.
          </div>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 0 }}>
            {t("tap.teamPraeft")}
            Wir nehmen uns die Zeit, die jeder Mensch verdient.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit() {
    if (!user?.id || !beitrag.trim()) return;
    setSubmitting(true);

    // Alle Team-Mitglieder finden
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'superadmin']);

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        user_id: admin.id,
        actor_id: user.id,
        type: 'talent_application',
        title: 'Neues Angebot: Verantwortung als Talent',
        body: `${profile?.display_name || profile?.username || t("tap.einMitglied")} möchte Verantwortung übernehmen.\n\nWas ich einbringen möchte: ${beitrag.trim()}\n\nWas mich geprägt hat: ${erfahrungen.trim() || '—'}\n\nWas ich bewirken möchte: ${vision.trim() || '—'}`,
        is_read: false,
        created_at: new Date().toISOString(),
        metadata: {
          applicant_id: user.id,
          applicant_name: profile?.display_name || profile?.username,
          beitrag: beitrag.trim(),
          erfahrungen: erfahrungen.trim(),
          vision: vision.trim(),
        },
      }));

      await supabase.from('notifications').insert(notifications);
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  const canSubmit = beitrag.trim().length >= 10;

  return (
    <div style={{
      padding: '40px 32px', maxWidth: 680,
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Einleitung */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 26, fontWeight: 600, color: C.ink, marginBottom: 12, lineHeight: 1.3 }}>
          {t("tap.verantwortung")}
        </h2>
        <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 0 }}>
          Ein Talent bei HUI zu sein, bedeutet nicht, einen Status zu erhalten.
          {t("tap.verantwortungGemeinschaft")}
          {t("tap.fuerMenschen")}
          {t("tap.wirkungEntsteht")}
        </p>
      </div>

      {/* Was bedeutet es? */}
      <div style={{
        padding: '20px', borderRadius: 16, background: C.white,
        border: `1px solid ${C.border}`, marginBottom: 40,
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
          Was es bedeutet
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: C.muted, lineHeight: 1.8 }}>
          <li>{t("tap.gestaltest")}</li>
          <li>{t("tap.zeigstDich")}</li>
          <li>{t("tap.begleitest")}</li>
          <li>{t("tap.traegstBei")}</li>
        </ul>
      </div>

      {/* Frage 1: Was möchtest du einbringen? */}
      <QuestionBlock
        number="01"
        title={t("tap.q1Title")}
        hint={t("tap.q1Desc")}
        value={beitrag}
        onChange={setBeitrag}
        placeholder={t("tap.q1Ph")}
        required
      />

      {/* Frage 2: Welche Erfahrungen haben dich geprägt? */}
      <QuestionBlock
        number="02"
        title={t("tap.q2Title")}
        hint={t("tap.q2Desc")}
        value={erfahrungen}
        onChange={setErfahrungen}
        placeholder="Mein Weg begann…"
      />

      {/* Frage 3: Was möchtest du bewirken? */}
      <QuestionBlock
        number="03"
        title={t("tap.q3Title")}
        hint={t("tap.q3Desc")}
        value={vision}
        onChange={setVision}
        placeholder="Ich stelle mir eine Gemeinschaft vor, in der…"
      />

      {/* Absenden */}
      <div style={{ marginTop: 40 }}>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          style={{
            padding: '14px 32px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: canSubmit && !submitting ? C.teal : `${C.muted}20`,
            color: canSubmit && !submitting ? '#fff' : C.muted,
            fontSize: 15, fontWeight: 600,
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Wird gesendet…' : 'Angebot absenden'}
        </button>
        {!canSubmit && (
          <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
            {t("tap.min10zeichen")}
          </p>
        )}
        <p style={{ fontSize: 13, color: C.muted, marginTop: 16, lineHeight: 1.6 }}>
          {t("tap.nachAbsenden")}
          {t("tap.entscheidung")}
        </p>
      </div>
    </div>
  );
}

function QuestionBlock({ number, title, hint, value, onChange, placeholder, required }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.teal, letterSpacing: 1 }}>
          {number}
        </span>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: C.ink, margin: 0 }}>
          {title}
          {required && <span style={{ color: C.coral, marginLeft: 4 }}>*</span>}
        </h3>
      </div>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 12, marginLeft: 28 }}>
        {hint}
      </p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', minHeight: 100, padding: '16px', borderRadius: 12,
          border: `1px solid ${C.border}`, background: C.white,
          fontSize: 15, color: C.ink, outline: 'none',
          boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6,
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}
