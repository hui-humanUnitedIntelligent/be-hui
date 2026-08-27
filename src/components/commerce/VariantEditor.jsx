// src/components/commerce/VariantEditor.jsx
// VARIANTS-001: Reusable variant editor for works, experiences, talents
// Additive — only shows when user explicitly adds variants
import React, { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation.js";

const TEAL = "#16D7C5";
const CORAL = "#FF8A6B";
const INK = "#1A1A2E";
const BORDER = "rgba(26,26,46,0.08)";
const BG_SOFT = "rgba(22,215,197,0.04)";

export default function VariantEditor({ variants = [], onChange = () => {} }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  function addVariant() {
    const newVariant = {
      id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: "",
      stock_total: 1,
      stock_available: 1,
      price: null,
      description: "",
    };
    onChange([...variants, newVariant]);
  }

  function updateVariant(idx, field, value) {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "stock_total") {
      updated[idx].stock_available = Math.min(updated[idx].stock_available || 0, parseInt(value) || 0);
      if (!updated[idx].stock_available) updated[idx].stock_available = parseInt(value) || 0;
    }
    onChange(updated);
  }

  function removeVariant(idx) {
    const { t } = useTranslation();
    onChange(variants.filter((_, i) => i !== idx));
  }

  // Only render the toggle if no variants yet
  if (!expanded && variants.length === 0) {
    return (
      <button
        type="button"
        onClick={() => { setExpanded(true); addVariant(); }}
        style={{
          width: "100%", padding: "14px 16px", borderRadius: 14,
          border: `1.5px dashed ${TEAL}55`, background: BG_SOFT,
          color: TEAL, fontSize: 14, fontWeight: 600, cursor: "pointer",
          fontFamily: "inherit", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, marginTop: 12,
        }}
      >
        <span style={{ fontSize: 18 }}>＋</span> {t("variant.add")}
      </button>
    );
  }

  if (!expanded) return null;

  return (
    <div style={{
      background: BG_SOFT, borderRadius: 16, padding: "16px",
      border: `1px solid ${TEAL}33`, marginTop: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: INK }}>
          Varianten ({variants.length})
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={addVariant}
            style={{
              padding: "6px 14px", borderRadius: 10, border: "none",
              background: TEAL, color: "#fff", fontSize: 13,
              fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >＋ Variante</button>
          {variants.length === 0 && (
            <button
              type="button"
              onClick={() => setExpanded(false)}
              style={{
                padding: "6px 14px", borderRadius: 10,
                border: `1px solid ${BORDER}`, background: "transparent",
                color: INK, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}
            >Abbrechen</button>
          )}
        </div>
      </div>

      <div style={{ fontSize: 12, color: "rgba(26,26,46,0.5)", marginBottom: 14, lineHeight: 1.5 }}>
        Jede Variante hat eigenen Bestand und Preis. Käufer wählen beim Kauf.
      </div>

      {variants.map((v, idx) => (
        <div key={v.id} style={{
          background: "#FDFCFA", borderRadius: 12, padding: "14px",
          marginBottom: 10, border: `1px solid ${BORDER}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>
              Variante {idx + 1}
            </div>
            <button
              type="button"
              onClick={() => removeVariant(idx)}
              style={{
                padding: "4px 10px", borderRadius: 8, border: "none",
                background: "rgba(255,100,100,0.08)", color: "#e05050",
                fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}
            >✕ Entfernen</button>
          </div>

          {/* Name */}
          <input
            type="text"
            name={`variant-name-${v.id}`}
            autoComplete="off"
            placeholder={t("variant.namePlaceholder")}
            value={v.name}
            onChange={(e) => updateVariant(idx, "name", e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: `1px solid ${BORDER}`, background: "#fff",
              fontSize: 14, fontFamily: "inherit", marginBottom: 8,
              boxSizing: "border-box",
            }}
          />

          {/* Stock + Price row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="number"
              name={`variant-stock-${v.id}`}
              inputMode="numeric"
              placeholder="Bestand"
              min="1"
              value={v.stock_total}
              onChange={(e) => updateVariant(idx, "stock_total", e.target.value)}
              style={{
                flex: 1, padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${BORDER}`, background: "#fff",
                fontSize: 14, fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
            <input
              type="number"
              name={`variant-price-${v.id}`}
              inputMode="decimal"
              placeholder="Preis (optional)"
              min="0"
              step="0.01"
              value={v.price ?? ""}
              onChange={(e) => updateVariant(idx, "price", e.target.value ? parseFloat(e.target.value) : null)}
              style={{
                flex: 1, padding: "10px 12px", borderRadius: 10,
                border: `1px solid ${BORDER}`, background: "#fff",
                fontSize: 14, fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Description */}
          <input
            type="text"
            name={`variant-desc-${v.id}`}
            autoComplete="off"
            placeholder="Beschreibung (optional)"
            value={v.description}
            onChange={(e) => updateVariant(idx, "description", e.target.value)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: `1px solid ${BORDER}`, background: "#fff",
              fontSize: 14, fontFamily: "inherit", boxSizing: "border-box",
            }}
          />
        </div>
      ))}

      {variants.length === 0 && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          style={{
            width: "100%", padding: "10px", borderRadius: 10,
            border: `1px solid ${BORDER}`, background: "transparent",
            color: INK, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}
        >{t("variant.empty")}</button>
      )}
    </div>
  );
}
