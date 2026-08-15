// src/lib/useUsernameCheck.jsx — Phase 4A
// ══════════════════════════════════════════════════════════════
// Live username availability check.
// Uses DB function username_available() for authoritative check.
// Debounced 500ms. Returns status: idle | checking | ok | taken | invalid
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient.js";

const RESERVED = new Set([
  "admin","hui","support","official","help","team","bot",
  "system","moderator","mod","staff","press","media",
  "contact","info","security","abuse","root","superuser","ops",
]);

export function validateUsername(raw) {
  const v = (raw || "").toLowerCase().trim();
  if (!v)              return { ok: false, hint: "" };
  if (v.length < 3)   return { ok: false, hint: "Mindestens 3 Zeichen" };
  if (v.length > 30)  return { ok: false, hint: "Maximal 30 Zeichen" };
  if (!/^[a-z0-9_.]+$/.test(v))
                       return { ok: false, hint: "Nur Buchstaben, Zahlen, _ und ." };
  if (RESERVED.has(v)) return { ok: false, hint: "Dieser Name ist reserviert" };
  return { ok: true, hint: "", normalized: v };
}

export function useUsernameCheck(raw) {
  const [status, setStatus] = useState("idle"); // idle|checking|ok|taken|invalid
  const [hint,   setHint]   = useState("");
  const timerRef = useRef(null);
  const abortRef = useRef(false);

  useEffect(() => {
    clearTimeout(timerRef.current);
    abortRef.current = true;

    const { ok, hint: h, normalized } = validateUsername(raw);
    if (!ok) {
      setStatus(raw ? "invalid" : "idle");
      setHint(h);
      return;
    }

    setStatus("checking");
    setHint("");
    abortRef.current = false;

    timerRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("username_available", {
          p_username: normalized,
        });
        if (abortRef.current) return;
        if (error) { setStatus("idle"); return; }
        if (data === true)  { setStatus("ok");    setHint("✓ Verfügbar"); }
        else                { setStatus("taken");  setHint("Bereits vergeben"); }
      } catch { if (!abortRef.current) setStatus("idle"); }
    }, 500);

    return () => { abortRef.current = true; clearTimeout(timerRef.current); };
  }, [raw]);

  return { status, hint };
}

// ── UsernameInput component ───────────────────────────────────
export function UsernameInput({ value, onChange, dark = false, placeholder = "deinname" }) {
  const { status, hint } = useUsernameCheck(value);

  const border = status === "ok"      ? "#22C55E"
               : status === "taken"   ? "#EF4444"
               : status === "invalid" ? "#F59E0B"
               : dark ? "rgba(255,255,255,0.20)" : "rgba(26,26,46,0.15)";

  const hintColor = status === "ok"    ? "#22C55E"
                  : status === "taken" ? "#EF4444"
                  : "#F59E0B";

  return (
    <div>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 14, top: "50%",
          transform: "translateY(-50%)",
          fontSize: 14, color: dark ? "rgba(255,255,255,0.4)" : "rgba(26,26,46,0.35)",
          pointerEvents: "none", userSelect: "none",
        }}>@</span>
        <input
          value={value}
          onChange={e => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g,""))}
          placeholder={placeholder}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          style={{
            width: "100%",
            padding: "14px 44px 14px 30px",
            background: dark ? "rgba(255,255,255,0.09)" : "rgba(26,26,46,0.04)",
            border: `1.5px solid ${border}`,
            borderRadius: 14,
            fontSize: 15,
            color: dark ? "#fff" : "#1A1A2E",
            outline: "none",
            transition: "border-color 0.2s ease",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
        {/* Status icon */}
        <div style={{
          position: "absolute", right: 14, top: "50%",
          transform: "translateY(-50%)",
          fontSize: 14, lineHeight: 1,
          opacity: status === "idle" ? 0 : 1,
          transition: "opacity 0.2s",
        }}>
          {status === "checking" ? "⌛" :
           status === "ok"       ? "✓"  :
           status === "taken"    ? "✗"  : "!"}
        </div>
      </div>
      {hint && (
        <div style={{
          fontSize: 12, marginTop: 5, marginLeft: 4,
          color: status === "ok" ? hintColor : hintColor,
          transition: "color 0.2s",
        }}>{hint}</div>
      )}
    </div>
  );
}
