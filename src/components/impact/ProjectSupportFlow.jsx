// src/components/impact/ProjectSupportFlow.jsx
// ═══════════════════════════════════════════════════════════════════
// PROJECT-DIRECT-SUPPORT-001 (2026-09-15, Michael-Spec "Projekt Direkt
// Unterstützung — Stripe Direct Funding Hub")
//
// Vollständiger Flow in EINEM Portal-Sheet (4 Phasen):
//   select  → 2er-Reihe genehmigter Projekte (wie "Inspirierende Menschen")
//   amount  → Projekt-Kopf (Cover, Name, Kurzinfo, Fortschrittsbalken)
//             + Betrag-Auswahl (10/20/50/100€ + eigener Betrag)
//             + Live-Gebühren-Zusammenfassung (Stripe 2,9% + 0,30€)
//   payment → StripePaymentStep (Stripe Elements, Muster aus SupportFlow)
//   success → Danke-Screen + Toast
//
// Architektur (Charta — Erweitern statt Neubau):
//   - Zahlung: Edge Function create-project-support-payment (server-seitiger
//     PaymentIntent, identisches Sicherheits-Muster wie create-support-payment
//     für Talent-Unterstützung) — KEIN Stripe-Secret im Client.
//   - UI: StripePaymentStep Wiederverwendung (geteilt mit UnterstutzenFlow,
//     SupportFlow, Buchungs-Flows).
//   - Portal-Pflicht: createPortal → document.body, zIndex 10600 (>= 10500,
//     über dem ApprovedProjectDetail-Overlay, footer-navbar-zindex.md).
//   - Keyboard-Sicherheit (STRIPESHEET-KBD-FIX-Regel): data-hui-kbd-self-managed
//     + Backdrop paddingBottom var(--hui-keyboard-inset) + Panel-maxHeight
//     calc(… − var(--hui-keyboard-inset)) — Kartennummer-Zeile bleibt auf
//     iOS über der Tastatur erreichbar.
//   - Wortlaut: NIEMALS "Spende" — ausschließlich "unterstützen".
//   - Bild-Platzhalter: HUILogo (bild-platzhalter-regel.md), kein Emoji.
// ═══════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "../../hooks/useTranslation.js";
import { supabase } from "../../lib/supabaseClient.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { toast } from "../../lib/useToast.jsx";
import StripePaymentStep from "../commerce/StripePaymentStep.jsx";
import { HUILogo } from "../brand/HUILogo.jsx";
import { useSheetDrag } from "../../hooks/useSheetDrag.js";
import { useModalRegistration } from "../../hooks/useModalRegistration.js";

const T = {
  page:  "#FAFAF8",
  ink:   "#1A1A2E",
  soft:  "#55556B",
  teal:  "#0DC4B5",
  tealDark: "#0AA89D",
  coral: "#F47355",
  border:"rgba(26,26,46,0.08)",
};

const QUICK_AMOUNTS = [10, 20, 50, 100];

// Stripe-Standardgebühr EU: 2,9% + 0,30 € — MUSS mit der Edge Function
// (create-project-support-payment/index.ts calcStripeFee) übereinstimmen.
// Nur für die Live-Anzeige vor der Zahlung; nach dem Server-Call gelten
// die vom Server berechneten Werte (feeEur/netEur).
function calcFeePreview(gross) {
  const fee = +(gross * 0.029 + 0.30).toFixed(2);
  return { fee, net: +(gross - fee).toFixed(2) };
}

function fmtEur(n) {
  return Number(n).toFixed(2).replace(".", ",");
}

/* ── Projekt-Kopf: Cover + Name + Kurzinfo + Fortschrittsbalken ── */
function ProjectKopf({ project }) {
  const [imgErr, setImgErr] = useState(false);
  const goal = Number(project.funding_goal) || 0;
  const funded = Number(project.current_amount_eur) || 0;
  const pct = goal > 0 ? Math.min(100, Math.round(funded / goal * 100)) : 0;
  const rawImg = project.cover_url || (project.media_urls && project.media_urls[0]) || null;
  const img = (!imgErr && rawImg) ? rawImg : null;

  return (
    <div style={{ display:"flex", gap:12, alignItems:"center" }}>
      <div style={{
        width:72, height:72, borderRadius:14, overflow:"hidden",
        background:"#fff", border:`1px solid ${T.border}`, flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {img ? (
          <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}
               onError={() => setImgErr(true)} />
        ) : (
          <HUILogo size={28} style={{ opacity:0.5 }} />
        )}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:15, fontWeight:700, color:T.ink, lineHeight:1.25,
          overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box",
          WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
          {project.project_name}
        </div>
        {project.short_desc ? (
          <div style={{ fontSize:12, color:T.soft, marginTop:2, lineHeight:1.35,
            overflow:"hidden", textOverflow:"ellipsis", display:"-webkit-box",
            WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
            {project.short_desc}
          </div>
        ) : null}
        {goal > 0 ? (
          <>
            <div style={{ height:6, borderRadius:99, background:"rgba(0,0,0,0.08)",
              overflow:"hidden", marginTop:8, marginBottom:4 }}>
              <div style={{ height:"100%", borderRadius:99, width:`${pct}%`,
                background:`linear-gradient(90deg,${T.teal},${T.tealDark})` }} />
            </div>
            <div style={{ fontSize:11, color:T.soft, fontWeight:600 }}>
              {fmtEur(funded)} € / {fmtEur(goal)} € · {pct}%
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ══ Hauptkomponente ══════════════════════════════════════════════ */
export default function ProjectSupportFlow({
  open,
  onClose,
  projects = [],          // genehmigte, offene Projekte (für Grid-Phase)
  initialProject = null,   // Detail-Einstieg: Grid überspringen
  onSupported,             // Callback nach Erfolg (z.B. Fortschritt refreshen)
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [phase, setPhase] = useState(initialProject ? "amount" : "select");
  const [project, setProject] = useState(initialProject || null);
  const [amount, setAmount] = useState(20);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [clientSecret, setClientSecret] = useState(null);
  const [publishableKey, setPublishableKey] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [netEur, setNetEur] = useState(0);

  const { dragHandlers, sheetTransform, sheetTransition } = useSheetDrag(onClose);
  useModalRegistration(open, onClose, "ProjectSupportFlow");

  if (!open) return null;

  const finalAmount = custom ? parseFloat(String(custom).replace(",", ".")) : amount;
  const valid = !!(finalAmount && finalAmount >= 1 && finalAmount <= 5000);
  const preview = valid ? calcFeePreview(finalAmount) : null;

  function handleClose() {
    setPhase(initialProject ? "amount" : "select");
    setProject(initialProject || null);
    setCustom("");
    setAmount(20);
    setErrMsg("");
    setClientSecret(null);
    onClose?.();
  }

  async function handlePay() {
    if (!user?.id)    { setErrMsg(t("impact.support.loginHint")); setPhase("error"); return; }
    if (!project?.id){ setErrMsg(t("impact.support.error"));      setPhase("error"); return; }
    if (!valid)       { setErrMsg(t("impact.support.minAmount")); return; }

    setLoading(true);
    setErrMsg("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) { setErrMsg(t("impact.support.sessionExpired")); setPhase("error"); return; }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/create-project-support-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
        },
        body: JSON.stringify({ project_id: project.id, amount_eur: finalAmount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrMsg(data?.error || t("impact.support.error"));
        setPhase("error");
        return;
      }
      setClientSecret(data.clientSecret);
      setPublishableKey(data.publishableKey);
      setPaymentIntentId(data.paymentIntentId);
      setNetEur(Number(data.netEur) || preview?.net || 0);
      setPhase("payment");
    } catch {
      setErrMsg(t("impact.support.error"));
      setPhase("error");
    } finally {
      setLoading(false);
    }
  }

  function handleStripeSuccess() {
    // Toast: "Vielen Dank! {amount} € unterstützen jetzt {projectName}" — kein "Spende"
    toast.success(t("impact.support.success", {
      amount: fmtEur(netEur), projectName: project?.project_name || "",
    }), { duration: 4000 });
    onSupported?.(project, netEur);
    handleClose();
  }

  const Z = 10600; // über ApprovedProjectDetail, über BottomNav (10500-Regel)

  const panelBase = {
    background: T.page,
    borderRadius: "22px 22px 0 0",
    width: "100%",
    maxWidth: 560,
    maxHeight: "calc(88dvh - var(--hui-keyboard-inset, 0px))",
    display: "flex",
    flexDirection: "column",
    transform: sheetTransform,
    transition: sheetTransition,
    boxShadow: "0 -8px 40px rgba(20,20,34,0.14)",
  };

  return createPortal(
    <>
      {/* Backdrop — keyboard-bewusst (STRIPESHEET-KBD-Regel) */}
      <div
        data-hui-kbd-self-managed
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        style={{
          position: "fixed", inset: 0, zIndex: Z,
          background: "rgba(20,20,34,0.45)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          paddingBottom: "var(--hui-keyboard-inset, 0px)",
          animation: "psf-in 0.22s ease both",
        }}
      >
        <style>{`
          @keyframes psf-in { from{opacity:0} to{opacity:1} }
          @keyframes psf-rise { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
          .psf-tap { cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
          .psf-tap:active { opacity:0.8; }
        `}</style>

        <div style={panelBase} {...dragHandlers}>

          {/* Kopfzeile (Drag-Handle) */}
          <div style={{ padding:"10px 20px 0", display:"flex", justifyContent:"center" }}>
            <div style={{ width:44, height:5, borderRadius:99, background:"rgba(0,0,0,0.14)" }} />
          </div>
          <div style={{ padding:"8px 20px 12px", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:16, fontWeight:800, color:T.ink, flex:1 }}>
              {phase === "select" ? t("impact.selectProject.title")
                : phase === "payment" ? t("impact.selectAmount.button")
                : t("impact.directSupport.title")}
            </div>
            <button type="button" className="psf-tap" aria-label={t("common.close")}
              onClick={handleClose}
              style={{ width:32, height:32, borderRadius:99, border:"none",
                background:"rgba(0,0,0,0.05)", fontSize:16, color:T.soft,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
              ✕
            </button>
          </div>

          <div style={{ overflowY:"auto", padding:"4px 20px 24px",
            paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}>

            {/* ── Phase: Projektauswahl (2er-Reihe) ─────────────── */}
            {phase === "select" && (
              projects.length === 0 ? (
                <div style={{ textAlign:"center", color:T.soft, fontSize:13, padding:"24px 0" }}>
                  {t("impact.support.noProjects")}
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {projects.map(p => (
                    <div key={p.id} style={{
                      background:"#fff", borderRadius:16, border:`1px solid ${T.border}`,
                      overflow:"hidden", display:"flex", flexDirection:"column",
                      animation: "psf-rise 0.3s ease both",
                    }}>
                      <ProjectKopf project={p} />
                      <button type="button" className="psf-tap"
                        onClick={() => { setProject(p); setPhase("amount"); }}
                        style={{ margin:10, padding:"9px 8px", borderRadius:12,
                          border:"none", background:T.teal, color:"#fff",
                          fontSize:12, fontWeight:700, width:"calc(100% - 20px)" }}>
                        {t("impact.support.support")}
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Phase: Betrag ─────────────────────────────────── */}
            {phase === "amount" && project && (
              <div style={{ animation: "psf-rise 0.3s ease both" }}>
                {phase !== "select" && <ProjectKopf project={project} />}

                <div style={{ fontSize:13, fontWeight:700, color:T.ink, margin:"18px 0 10px" }}>
                  {t("impact.selectAmount.title")}
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                  {QUICK_AMOUNTS.map(v => (
                    <button key={v} type="button" className="psf-tap"
                      onClick={() => { setAmount(v); setCustom(""); }}
                      style={{
                        padding:"12px 0", borderRadius:12, fontSize:14, fontWeight:700,
                        border: (!custom && amount === v) ? `2px solid ${T.teal}` : `1px solid ${T.border}`,
                        background: (!custom && amount === v) ? "rgba(13,196,181,0.08)" : "#fff",
                        color: (!custom && amount === v) ? T.tealDark : T.ink,
                      }}>
                      {v} €
                    </button>
                  ))}
                </div>

                <div style={{ fontSize:12, color:T.soft, margin:"14px 0 6px", fontWeight:600 }}>
                  {t("impact.selectAmount.custom")}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8,
                  border:`1px solid ${T.border}`, borderRadius:12, background:"#fff", padding:"10px 14px" }}>
                  <input
                    type="decimal" inputMode="decimal"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value.replace(/[^0-9.,]/g, "").slice(0, 7))}
                    placeholder="0,00"
                    aria-label={t("impact.selectAmount.custom")}
                    style={{ flex:1, border:"none", outline:"none", fontSize:15, color:T.ink, background:"transparent" }}
                  />
                  <span style={{ fontSize:14, fontWeight:700, color:T.soft }}>EUR</span>
                </div>

                {/* Zusammenfassung */}
                {preview && (
                  <div style={{ marginTop:16, background:"rgba(13,196,181,0.06)",
                    borderRadius:14, padding:14, border:"1px solid rgba(13,196,181,0.14)" }}>
                    <div style={{ fontSize:11, color:T.soft, fontWeight:700,
                      textTransform:"uppercase", marginBottom:8 }}>
                      {t("impact.selectAmount.summary")}
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:T.ink, marginBottom:4 }}>
                      <span>{t("impact.selectAmount.gross")}</span>
                      <span style={{ fontWeight:600 }}>{fmtEur(finalAmount)} €</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:T.soft, marginBottom:4 }}>
                      <span>− {t("impact.selectAmount.fee")}</span>
                      <span>{fmtEur(preview.fee)} €</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:14, fontWeight:700, color:T.tealDark }}>
                      <span>{t("impact.selectAmount.net")}</span>
                      <span>{fmtEur(preview.net)} €</span>
                    </div>
                  </div>
                )}

                <button type="button" className="psf-tap" disabled={!valid || loading}
                  onClick={handlePay}
                  style={{ marginTop:16, width:"100%", padding:"14px 0", borderRadius:14,
                    border:"none", background: (!valid || loading) ? "rgba(13,196,181,0.35)" : T.teal,
                    color:"#fff", fontSize:15, fontWeight:800,
                    display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {loading ? t("impact.support.preparing") : t("impact.selectAmount.button")}
                </button>
                {!valid && custom !== "" ? (
                  <div style={{ fontSize:11, color:T.coral, marginTop:6, textAlign:"center" }}>
                    {t("impact.support.minAmount")}
                  </div>
                ) : null}
              </div>
            )}

            {/* ── Phase: Stripe Payment (Elements) ───────────────── */}
            {phase === "payment" && clientSecret && (
              <StripePaymentStep
                total={finalAmount}
                impact={0}
                clientSecret={clientSecret}
                publishableKey={publishableKey}
                orderId={paymentIntentId}
                hideHeader
                onSuccess={handleStripeSuccess}
                onError={() => { setErrMsg(t("impact.support.error")); setPhase("error"); }}
                onBack={() => setPhase("amount")}
              />
            )}

            {/* ── Phase: Fehler ──────────────────────────────────── */}
            {phase === "error" && (
              <div style={{ textAlign:"center", padding:"24px 8px", animation: "psf-rise 0.3s ease both" }}>
                <div style={{ fontSize:14, color:T.coral, fontWeight:700, marginBottom:4 }}>✕</div>
                <div style={{ fontSize:13, color:T.ink, marginBottom:18, lineHeight:1.5 }}>{errMsg || t("impact.support.error")}</div>
                <button type="button" className="psf-tap" onClick={() => setPhase("amount")}
                  style={{ padding:"12px 28px", borderRadius:14, border:"none",
                    background:T.teal, color:"#fff", fontSize:14, fontWeight:700 }}>
                  {t("impact.support.retry")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
