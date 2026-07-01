import React from "react";
import { C } from "./tokens.js";
import { formatGermanDate, formatTime } from "./utils.js";

function InfoCell({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ padding: "14px 16px", background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: C.muted,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{value}</div>
    </div>
  );
}

export function WorkTypeSection({ item }) {
  const cells = [];

  if (item.shipping_available === true) {
    cells.push(<InfoCell key="shipping" label="Versand" value="Verfügbar" />);
  }
  if (item.pickup_available === true) {
    cells.push(<InfoCell key="pickup" label="Abholung" value="Möglich" />);
  }
  if (item.for_sale === false) {
    cells.push(<InfoCell key="sold" label="Lagerbestand" value="Verkauft" />);
  } else if (item.stock_quantity != null) {
    cells.push(<InfoCell key="stock" label="Lagerbestand" value={String(item.stock_quantity)} />);
  }
  if (item.variant_label || item.medium) {
    cells.push(<InfoCell key="variant" label="Varianten" value={item.variant_label || item.medium} />);
  }

  if (cells.length === 0) return null;

  return (
    <div style={{ margin: "12px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{cells}</div>
  );
}

export function ExperienceTypeSection({ item }) {
  const participantLimit = item.participant_limit ?? item.max_participants;
  const timeValue =
    (Array.isArray(item.avail_times) && item.avail_times[0] && formatTime(item.avail_times[0])) ||
    (item.duration ? String(item.duration) : null);

  const fields = [
    { label: "Datum", value: formatGermanDate(item.date, { day: "numeric", month: "long", year: "numeric" }) },
    { label: "Uhrzeit", value: timeValue },
    { label: "Teilnehmer", value: participantLimit != null ? `max. ${participantLimit}` : null },
    { label: "Treffpunkt", value: item.location_text || (item.format === "online" ? "Online" : null) },
  ].filter((f) => f.value);

  if (fields.length === 0) return null;

  return (
    <div style={{ margin: "12px 20px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {fields.map((f) => (
        <InfoCell key={f.label} label={f.label} value={f.value} />
      ))}
    </div>
  );
}

export function ContentTypeSection({ contentType, item }) {
  if (contentType === "work") return <WorkTypeSection item={item} />;
  if (contentType === "experience") return <ExperienceTypeSection item={item} />;
  return null;
}
