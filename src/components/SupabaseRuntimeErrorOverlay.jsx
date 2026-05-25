import React from "react";
import { SUPABASE_RUNTIME_ERROR_EVENT } from "../lib/supabaseDiagnostics.js";

const panel = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483647,
  background: "rgba(17,24,39,0.78)",
  backdropFilter: "blur(10px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',Inter,sans-serif",
};

function JsonBlock({ label, value }) {
  if (value == null) return null;
  return (
    <section style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: "#FCA5A5", marginBottom: 6, letterSpacing: ".08em" }}>
        {label}
      </div>
      <pre style={{
        margin: 0,
        padding: 10,
        maxHeight: 180,
        overflow: "auto",
        borderRadius: 10,
        background: "rgba(15,23,42,0.92)",
        color: "#E5E7EB",
        fontSize: 11,
        lineHeight: 1.45,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

export default function SupabaseRuntimeErrorOverlay() {
  const [report, setReport] = React.useState(() =>
    typeof window !== "undefined" ? window.__HUI_SUPABASE_LAST_ERROR__ || null : null
  );

  React.useEffect(() => {
    const onError = (event) => setReport(event.detail || null);
    window.addEventListener(SUPABASE_RUNTIME_ERROR_EVENT, onError);
    return () => window.removeEventListener(SUPABASE_RUNTIME_ERROR_EVENT, onError);
  }, []);

  if (!report) return null;

  const copy = () => {
    navigator.clipboard?.writeText(JSON.stringify(report, null, 2)).catch(() => {});
  };

  return (
    <div style={panel} role="alert" aria-live="assertive">
      <div style={{
        width: "min(720px, 100%)",
        maxHeight: "88vh",
        overflow: "auto",
        background: "#FEF2F2",
        border: "1px solid rgba(239,68,68,0.38)",
        borderRadius: 20,
        boxShadow: "0 24px 90px rgba(0,0,0,0.45)",
        padding: 18,
        color: "#7F1D1D",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".12em", color: "#DC2626" }}>
              RUNTIME ERROR OVERLAY
            </div>
            <h1 style={{ margin: "6px 0 4px", fontSize: 22, lineHeight: 1.1, color: "#991B1B" }}>
              {report.title || "SUPABASE INSERT FAILED"}
            </h1>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              {report.error?.message || "Unbekannter Supabase-Fehler"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReport(null)}
            style={{
              border: "none",
              background: "rgba(127,29,29,0.10)",
              color: "#7F1D1D",
              borderRadius: 999,
              width: 34,
              height: 34,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            x
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 8,
          marginTop: 14,
        }}>
          {[
            ["source", report.source],
            ["operation", report.operation],
            ["table", report.table],
            ["bucket", report.bucket],
            ["code", report.error?.code],
            ["auth uid", report.authUid],
          ].map(([label, value]) => (
            <div key={label} style={{
              background: "rgba(255,255,255,0.72)",
              border: "1px solid rgba(239,68,68,0.18)",
              borderRadius: 10,
              padding: "8px 10px",
            }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#B91C1C", textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: 12, color: "#7F1D1D", wordBreak: "break-word" }}>{value ?? "null"}</div>
            </div>
          ))}
        </div>

        <JsonBlock label="SUPABASE ERROR" value={report.error} />
        <JsonBlock label="FAILING PAYLOAD" value={report.payload} />
        <JsonBlock label="CURRENT SESSION STATE" value={report.sessionState} />
        <JsonBlock label="SUPABASE CLIENT CONFIG" value={report.clientConfig} />
        <JsonBlock label="RAW RESULT / EXTRA" value={{ result: report.result, extra: report.extra }} />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button type="button" onClick={copy} style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(127,29,29,0.18)",
            background: "white",
            color: "#991B1B",
            fontWeight: 800,
            cursor: "pointer",
          }}>
            Diagnose kopieren
          </button>
        </div>
      </div>
    </div>
  );
}
