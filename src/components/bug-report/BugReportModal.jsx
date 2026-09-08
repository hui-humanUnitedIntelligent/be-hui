// BugReportModal.jsx — Fehlermeldungs-Modal (2026-08-19)
// Vollständiges Fehlermeldungs-System mit:
// - Textfeld (Pflicht)
// - Bild/Video Upload (max 10, JPG/PNG/MP4)
// - "Fehler absenden" Button
// - Danke-Meldung nach Absenden
// - Speichert in bug_reports Tabelle + uploads in Supabase Storage
// Additiv — keine bestehenden Funktionen werden berührt.
import React, { useState, useRef, useCallback } from "react";
import { toSafeUploadBody } from "../../lib/uploadBody.js";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "../../lib/uploadUtils.js";
import { createPortal } from "react-dom";
import { Capacitor } from "@capacitor/core";
import { supabase } from "../../lib/supabaseClient.js";
import { APP_VERSION } from "../../version.js";
import BugIcon from "./BugIcon.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { useKeyboardInset } from "../../hooks/useKeyboardInset.js";

// ── IOS-RESILIENZ (2026-09-08, iOS-BUG-002) ─────────────────────────────
// Beweislage 08.09.: DB-Inserts funktionieren auf iOS (img_diag-Reports kamen
// durch), aber Storage-Uploads scheiterten auf einem iPhone mit
// "EXC:Load failed" — es existierte NULL bug_reports von iOS, obwohl Tester
// aktiv waren. Der bisherige Flow brach bei Anhang-Fehlern GESAMT ab →
// Tester verlor die ganze Meldung.
// iOS-only: (a) Anhang-Uploads werden einzeln try/catch'd — ein fehlgeschlagener
// Upload verhindert NIE mehr das Absenden des Text-Reports (Warnung statt
// Gesamtfehler). (b) Diagnostik 1×/Session: Modal-Öffnung wird geloggt →
// beweist serverseitig, ob das Modal auf iOS überhaupt öffnet.
// Android-Pfad: unverändert (strikte Fehlerbehandlung bleibt exklusiv aktiv).
const IS_IOS = typeof window !== "undefined" && Capacitor.getPlatform?.() === "ios";

let iosModalLogged = false;
function logIosModalOpen() {
  if (iosModalLogged) return;
  iosModalLogged = true;
  try {
    import("../../lib/errorReporter.js").then(({ reportError }) => {
      reportError("ios_diag", { message: "BUG-MODAL-OPEN: Modal geöffnet (iOS)", component: "BugReportModal" });
    });
  } catch (err) { console.debug("[BugReport] iOS-Modal-Diagnostik nicht verfügbar:", err); }
}

const MAX_FILES = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "video/mp4"];
// UNIVERSELLER UPLOAD (2026-08-20): Limits aus dem SSOT (uploadUtils.js).
// 2026-09-08: 10MB Bilder / 50MB Videos (Michael-Vorgabe — Limits erhöht).
const MAX_FILE_SIZE_IMAGE = MAX_IMAGE_BYTES;
const MAX_FILE_SIZE_VIDEO = MAX_VIDEO_BYTES;
const MAX_FILE_SIZE = MAX_FILE_SIZE_VIDEO; // kompatibel mit bestehendem Code

export default function BugReportModal({ open = false, onClose = () => {}, user = null }) {
  const { t } = useTranslation();
  // IOS-JITTER-FIX v3 (siehe Kommentarblock bei sheetStyle unten) — JS-Wert
  // des Tastatur-Insets fuer die dynamische Padding-Reduktion auf iOS.
  const kbdInset = useKeyboardInset();
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [attachmentWarning, setAttachmentWarning] = useState(null);
  const fileInputRef = useRef(null);

  const getDeviceInfo = useCallback(async () => {
    let deviceModel = "Unbekannt";
    let deviceOS = "Unbekannt";

    try {
      if (window.Capacitor && window.Capacitor.isNativePlatform?.()) {
        // Try @capacitor/device if available
        const Device = window.Capacitor.Plugins?.Device;
        if (Device) {
          const info = await Device.getInfo?.();
          deviceModel = info?.model || "Unbekannt";
          deviceOS = `${info?.platform || "unknown"} ${info?.osVersion || ""}`.trim();
        }
      }
    } catch (e) {
      // Fallback
    }

    if (deviceModel === "Unbekannt") {
      const ua = navigator.userAgent;
      if (/Android/i.test(ua)) deviceModel = "Android Device";
      else if (/iPhone|iPad/i.test(ua)) deviceModel = "iOS Device";
      else deviceModel = "Web Browser";
      deviceOS = ua.substring(0, 120);
    }

    return { deviceModel, deviceOS };
  }, []);

  const handleFileSelect = useCallback((e) => {
    setError(null);
    const selected = Array.from(e.target.files || []);
    const valid = [];
    for (const f of selected) {
      if (files.length + valid.length >= MAX_FILES) break;
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError(`Datei "${f.name}" ist kein erlaubter Typ (nur JPG, PNG, MP4)`);
        continue;
      }
      const fMax = f.type.startsWith("video") ? MAX_FILE_SIZE_VIDEO : MAX_FILE_SIZE_IMAGE;
      if (f.size > fMax) {
        setError(`Datei "${f.name}" ist zu groß (max 50MB)`);
        continue;
      }
      valid.push(f);
    }
    setFiles(prev => [...prev, ...valid].slice(0, MAX_FILES));
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [files.length]);

  const removeFile = useCallback((idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const uploadFile = useCallback(async (file, reportId) => {
    const ext = file.name.split(".").pop();
    const path = `bug-reports/${reportId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    // HEADER-CACHE-FIX NACHTRAG (2026-09-06): diese Stelle wurde bei der
    // Vereinheitlichung (c8d98fb2) übersehen — hatte noch das alte
    // cacheControl:'3600'. Jetzt SSOT-Wert wie alle anderen Upload-Stellen.
    const { error: upErr } = await supabase.storage
      .from("media")
      .upload(path, await toSafeUploadBody(file), {
        contentType: file.type || "application/octet-stream",
        cacheControl: "public, max-age=31536000, immutable",
        upsert: false,
      });
    if (upErr) throw upErr;
    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
    return { name: file.name, url: publicUrl, type: file.type, size: file.size };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!description.trim()) {
      setError(t('bug.errorEmpty'));
      return;
    }
    if (!user?.id) {
      setError(t('bug.errorAuth'));
      return;
    }

    setUploading(true);
    setError(null);
    setAttachmentWarning(null);

    try {
      const { deviceModel, deviceOS } = await getDeviceInfo();

      // Fallback (2026-08-19 v2): falls authProfile beim Öffnen des Modals noch
      // nicht vollständig geladen war (user.email fehlt) — Auth-Session als
      // zweite Quelle nachziehen, damit E-Mail nie leer bleibt wenn vermeidbar.
      let fallbackEmail = null;
      if (!user.email) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          fallbackEmail = authUser?.email || null;
        } catch (_) { /* nicht kritisch — bleibt null */ }
      }

      // 1. Insert bug report
      const { data: report, error: dbErr } = await supabase
        .from("bug_reports")
        .insert({
          user_id: user.id,
          username: user.display_name || user.username || user.email?.split("@")[0] || fallbackEmail?.split("@")[0] || "Unbekannt",
          email: user.email || fallbackEmail || null,
          device_model: deviceModel,
          device_os: deviceOS,
          app_version: APP_VERSION,
          description: description.trim(),
          status: "offen",
          category: "Fehlermeldung",
          source: t("bug.title"),
        })
        .select("id")
        .single();

      if (dbErr) throw dbErr;
      if (!report?.id) throw new Error("Keine Report-ID erhalten");

      // 2. Upload files (if any)
      // iOS-RESILIENZ (2026-09-08): Nur auf iOS pro Datei try/catch — ein
      // fehlgeschlagener Anhang-Upload bricht das Absenden NICHT mehr ab.
      // Bewiesener Fall: "EXC:Load failed" auf iPhone (18.7) am 08.09. —
      // ohne diesen Zweig wäre der gesamte Report verloren gegangen.
      // Android: striktes Verhalten unverändert (iOS-Zweig greift dort nie).
      const attachments = [];
      if (IS_IOS) {
        let failedCount = 0;
        for (const f of files) {
          try {
            const att = await uploadFile(f, report.id);
            attachments.push(att);
          } catch (fileErr) {
            failedCount++;
            console.error("[BugReport][iOS] attachment upload failed:", fileErr);
          }
        }
        if (failedCount > 0) {
          setAttachmentWarning(t('bug.errorPartial'));
        }
      } else {
        for (const f of files) {
          const att = await uploadFile(f, report.id);
          attachments.push(att);
        }
      }

      // 3. Update report with attachments
      // BUGFIX (2026-08-19): RLS hatte keine UPDATE-Policy für bug_reports →
      // Update wurde lautlos verworfen (0 Zeilen, kein Fehler), Bilder landeten
      // nur in Storage, nie in der DB-Spalte → "Bilder nicht sichtbar" im SADB.
      // Policy bug_reports_update_own jetzt vorhanden. Trotzdem defensiv prüfen:
      // .select().maybeSingle() macht ein RLS-Silent-Fail sichtbar (data===null).
      if (attachments.length > 0) {
        const { data: updData, error: updErr } = await supabase
          .from("bug_reports")
          .update({ attachments })
          .eq("id", report.id)
          .select("id")
          .maybeSingle();
        if (updErr || !updData) {
          console.error("[BugReport] attachments update failed:", updErr || "kein Zeilen-Match (RLS?)");
          setAttachmentWarning(
            t('bug.errorPartial')
          );
        }
      }

      // 4. Log event
      await supabase.rpc("rpc_log_bug_report_event", {
        p_event_type: "bug_report_created",
        p_bug_report_id: report.id,
        p_actor_id: user.id,
        p_actor_type: "user",
        p_payload: { attachments_count: attachments.length },
      });

      setSubmitted(true);
    } catch (e) {
      console.error("[BugReport] Submit failed:", e);
      setError(e?.message || t('bug.errorSubmit'));
    } finally {
      setUploading(false);
    }
  }, [description, user, files, getDeviceInfo, uploadFile]);

  const handleClose = useCallback(() => {
    setDescription("");
    setFiles([]);
    setError(null);
    setAttachmentWarning(null);
    setSubmitted(false);
    setUploading(false);
    onClose();
  }, [onClose]);

  if (!open) return null;
  if (IS_IOS) logIosModalOpen(); // iOS-Diagnostik (Android: unverändert)

  // ── IOS-BUG-4b-FIX (2026-09-08): Textfeld sprang beim Tastatur-Öffnen
  // abrupt nach oben statt sich sanft zu bewegen (Michael-Report,
  // Screenshot). ROOT CAUSE: Dieses Modal war NICHT self-managed →
  // ZWEI Mechanismen griffen gleichzeitig unkoordiniert ein: (1) der
  // globale Handler schob den äusseren Backdrop per paddingBottom hoch
  // (das Full-Overlay-Padding — an sich seit v2.1.563 iOS-glatt), UND
  // (2) globalKeyboardHandler.onFocusIn löste ZUSÄTZLICH ein natives
  // el.scrollIntoView({behavior:"smooth"}) auf dem Textfeld aus, welches
  // den NÄCHSTEN scrollbaren Vorfahren (hier: das eigene innere Sheet-
  // Panel mit overflowY:"auto") separat verschob — zwei konkurrierende
  // Layout-Verschiebungen gegeneinander = sichtbarer Sprung. Exakt das
  // bereits bewiesene Konfliktmuster aus SCROLL-DRAG-FIX (2026-08-17,
  // ConversationRoom) — dort bereits über data-hui-kbd-self-managed
  // gelöst (scrollFieldIntoView() überspringt Felder in einem solchen
  // Container explizit, siehe globalKeyboardHandler.js).
  // FIX (NUR iOS, Android unverändert): Backdrop bekommt auf iOS
  // data-hui-kbd-self-managed → globaler Handler fasst weder den
  // Wrapper an (kein zweites paddingBottom) noch die scrollIntoView-
  // Konkurrenz (Textfeld liegt jetzt "in einem self-managed Container").
  // Eigenes paddingBottom folgt direkt der SSOT-CSS-Variable
  // --hui-keyboard-inset (vom globalen Handler weiterhin aktuell
  // gehalten), ohne Transition (identische Begründung wie
  // IOS-KEYBOARD-SMOOTH-FIX: visualViewport feuert pro Frame → jede
  // Transition würde pro Frame neu starten = ruckeln statt 1:1 folgen).
  // Android: weder das Attribut noch die Inline-Styles werden gesetzt —
  // der globale Handler behandelt das Modal exakt wie bisher.
  // Nur auf iOS: eigenes paddingBottom (SSOT-CSS-Var), keine Transition
  // (Begründung siehe Kommentarblock oben), + Opt-out aus dem globalen
  // Handler (Padding UND scrollIntoView-Konkurrenz). Android: leeres Objekt
  // → weder Attribut noch Style-Override, globaler Handler unverändert aktiv.
  // IOS-JITTER-FIX v2 (2026-09-08, Michael-Report "Immernoch zuckend" auf
  // v2.1.565): Die 4b-Entflechtung (self-managed, nur EIN Mechanismus) war
  // richtig, aber "transition:none" machte das Auf-Folgen der Tastatur zu
  // DISKRETEN STUFEN: visualViewport feuert auf iOS 30-60×/s mit kleinen
  // Zwischenhöhen -> jede Stufe = ein Layout-Sprung des Backdrops
  // ("Zucken"). Fix: kurze Retargeting-Transition — WebKit startet bei
  // Zielwechsel NICHT von null neu, sondern interpoliert vom AKTUELLEN
  // interpolierten Wert zum neuen Ziel (Chase) -> die Stufen werden zu
  // einer weichen Aufwärtsbewegung geglättet, die der Tastaturkurve
  // ~60-100ms nachläuft. Beim Schließen animiert das Padding genauso
  // weich zurück. Der frühere "Easing-Restart"-Stotterer (vor 2.1.563)
  // war das ZUSAMMENSPIEL mit scrollIntoView-Konkurrenz — die ist seit
  // 4b entflechtet; die Transition allein ist stabil.
  const iosKbdStyle = IS_IOS
    ? {
        paddingBottom: "calc(var(--hui-keyboard-inset, 0px) + env(safe-area-inset-bottom, 0px))",
        transition: "padding-bottom 0.16s ease-out",
      }
    : {};

  // ── IOS-JITTER-FIX v3 (2026-09-08, Michael-Report "Kein fix" auf v2.1.566,
  // 09:01) ──────────────────────────────────────────────────────────────
  // v1 (transition:none) UND v2 (transition:0.16s) waren beide wirkungslos,
  // weil beide am FALSCHEN Mechanismus drehten. ROOT CAUSE gefunden durch
  // Vergleich mit der bereits PROVEN-WORKING ConversationRoom-Struktur
  // (SCROLL-DRAG-FIX, 2026-08-17): Dort liegt das Eingabefeld (ChatInput)
  // NIEMALS innerhalb eines overflowY:"auto"-Vorfahren — es sitzt als
  // eigenstaendiges flexShrink:0-Element UNTER dem separat scrollenden
  // Nachrichten-Bereich. BugReportModal dagegen hatte Header+Textarea+
  // Upload+Button ALLE zusammen in EINEM Div mit overflowY:"auto" +
  // maxHeight:"85vh". iOS/WebKit scrollt bei Fokus eines Feldes automatisch
  // den naechstgelegenen SCROLLBAREN VORFAHREN, um den Cursor sichtbar zu
  // halten — das ist native WebKit-Logik, komplett unabhaengig von unserem
  // eigenen JS/CSS (weder von der scrollIntoView-Konkurrenz aus Bug 4b, die
  // bereits entflechtet ist, noch von der padding-bottom-Transition aus v1/
  // v2). Diese native Auto-Scroll-Bewegung lief UNKOORDINIERT parallel zur
  // eigenen padding-bottom-Bewegung des Backdrops -> Doppelbewegung = das
  // beobachtete Zucken, unabhaengig davon ob unsere eigene Transition an
  // oder aus war (deshalb wirkten v1 UND v2 nicht).
  //
  // FIX (nur iOS): Kopf + Textfeld liegen jetzt NIE in einem overflow:auto-
  // Vorfahren (kein WebKit-Autoscroll-Ziel dafuer moeglich). Nur der von
  // Natur aus kleine Upload-Dateien-Bereich (Button+Dateiliste) bekommt
  // eine eigene, kleine, gedeckelte Scrollbox (maxHeight 160px) — er
  // enthaelt nie das fokussierte Textfeld, kann also nie von WebKit als
  // Autoscroll-Ziel fuer die Tastatur-Sichtbarkeit gewaehlt werden. Das
  // aeussere Sheet bleibt zusaetzlich als Sicherheitsnetz overflowY:"auto"
  // mit generoesem, tastaturabhaengigem maxHeight — im UEBLICHEN Fall
  // (0-3 Dateien) ist der Inhalt kleiner als dieses Limit, wodurch dessen
  // overflow in der PRAXIS nie tatsaechlich scrollt (scrollHeight<=
  // clientHeight) und WebKit dort ebenfalls nichts zum Autoscrollen hat.
  //
  // Zusaetzlich: Die feste 88px-Navbar-Clearance im Sheet-Padding (siehe
  // Navbar-Abstandsregel) ist nur relevant wenn die Bottom-Navbar sichtbar
  // ist. Bei offener Tastatur ist sie bereits global ausgeblendet
  // (body.hui-keyboard-open [data-hui-bottom-navigation], translateY150%)
  // — daher auf iOS bei offener Tastatur auf 20px reduziert. Das senkt die
  // Gesamthoehe des Inhalts spuerbar und verkleinert damit zusaetzlich die
  // Wahrscheinlichkeit, dass das aeussere Sheet ueberhaupt scrollen muss.
  //
  // Android: strukturell 1:1 unveraendert — weiterhin EIN Div mit
  // overflowY:"auto" + maxHeight:"85vh" + fixem 88px-Padding, exakt wie vor
  // diesem Fix (kein neuer Code-Pfad, reiner IS_IOS-Zweig).
  const sheetPaddingBottom = (IS_IOS && kbdInset > 0)
    ? "calc(20px + env(safe-area-inset-bottom, 0px))"
    : "calc(88px + env(safe-area-inset-bottom, 0px))";

  const sheetStyle = IS_IOS
    ? {
        width: "100%", maxWidth: 500,
        maxHeight: "calc(94dvh - var(--hui-keyboard-inset, 0px))",
        overflowY: "auto",
        background: "#FAF7F2", borderRadius: "20px 20px 0 0",
        padding: `20px 20px ${sheetPaddingBottom}`,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
        animation: "huiSlideUp 0.3s ease",
      }
    : {
        width: "100%", maxWidth: 500,
        maxHeight: "85vh", overflowY: "auto",
        background: "#FAF7F2", borderRadius: "20px 20px 0 0",
        padding: "20px 20px calc(88px + env(safe-area-inset-bottom, 0px))",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
        animation: "huiSlideUp 0.3s ease",
      };

  // Upload-Dateien-Bereich: eigene kleine Scrollbox NUR auf iOS (siehe
  // Begruendung oben) — enthaelt bewusst nie das Textfeld. Android:
  // unveraendert (nur marginBottom, kein eigenes Scrollen).
  const uploadAreaStyle = IS_IOS
    ? { marginBottom: 16, maxHeight: 160, overflowY: "auto", WebkitOverflowScrolling: "touch" }
    : { marginBottom: 16 };

  return createPortal(
    <div
      onClick={handleClose}
      {...(IS_IOS ? { "data-hui-kbd-self-managed": "" } : {})}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10500,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "huiFadeIn 0.2s ease",
        ...iosKbdStyle,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={sheetStyle}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "rgba(91,107,125,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <BugIcon size={24} color="#5B6B7D" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1a1a2e", fontFamily: "Inter, sans-serif" }}>
              {t('bug.report')}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(20,20,34,0.5)", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}>
              {t('bug.body')}
            </p>
          </div>
          <button
            onClick={handleClose}
            aria-label={t("common.close")}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "none", background: "rgba(0,0,0,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0, fontSize: 16, color: "#666",
            }}
          >✕</button>
        </div>

        {submitted ? (
          /* Danke-Meldung */
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(22,215,197,0.12)",
              margin: "0 auto 16px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M8 16 L14 22 L24 10" stroke="#16D7C5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e", fontFamily: "Inter, sans-serif", margin: "0 0 4px" }}>
              {t('bug.success')}
            </p>
            {attachmentWarning && (
              <div style={{
                marginTop: 14, padding: "10px 14px", borderRadius: 10,
                background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)",
                fontSize: 12.5, color: "#8a5a10", fontFamily: "Inter, sans-serif",
                lineHeight: 1.5, textAlign: "left",
              }}>
                {attachmentWarning}
              </div>
            )}
            <button
              onClick={handleClose}
              style={{
                marginTop: 20, padding: "12px 32px", borderRadius: 22,
                background: "#16D7C5", border: "none", color: "#fff",
                fontSize: 14, fontWeight: 600, fontFamily: "Inter, sans-serif",
                cursor: "pointer",
              }}
            >{t("common.close")}</button>
          </div>
        ) : (
          /* Form */
          <>
            {/* A) Textfeld */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: "#1a1a2e", fontFamily: "Inter, sans-serif", marginBottom: 8,
              }}>
                {t('bug.label')} <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t("bug.placeholder")}
                rows={5}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: "1.5px solid rgba(0,0,0,0.10)",
                  background: "#fff",
                  fontSize: 14, fontFamily: "Inter, sans-serif",
                  color: "#1a1a2e", resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#16D7C5"}
                onBlur={e => e.target.style.borderColor = "rgba(0,0,0,0.10)"}
              />
            </div>

            {/* B) Upload-Bereich */}
            <div style={uploadAreaStyle}>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: "#1a1a2e", fontFamily: "Inter, sans-serif", marginBottom: 8,
              }}>
                {t('bug.mediaLabel')}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,video/mp4"
                multiple
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={files.length >= MAX_FILES}
                style={{
                  width: "100%", padding: "14px", borderRadius: 12,
                  border: "2px dashed rgba(0,0,0,0.15)",
                  background: "rgba(255,255,255,0.6)",
                  fontSize: 13, fontFamily: "Inter, sans-serif",
                  color: files.length >= MAX_FILES ? "rgba(20,20,34,0.3)" : "rgba(20,20,34,0.5)",
                  cursor: files.length >= MAX_FILES ? "not-allowed" : "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                }}
              >
                <span style={{ fontSize: 22 }}>📷</span>
                <span>{files.length >= MAX_FILES ? t('bug.maxReached') : t('bug.upload')}</span>
              </button>

              {/* File List */}
              {files.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 12px", borderRadius: 10,
                      background: "rgba(255,255,255,0.8)",
                      border: "1px solid rgba(0,0,0,0.06)",
                    }}>
                      <span style={{ fontSize: 18 }}>{f.type.startsWith("video") ? "🎬" : "🖼️"}</span>
                      <span style={{
                        flex: 1, fontSize: 12, fontFamily: "Inter, sans-serif",
                        color: "rgba(20,20,34,0.7)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{f.name}</span>
                      <span style={{ fontSize: 11, color: "rgba(20,20,34,0.4)", fontFamily: "Inter, sans-serif" }}>
                        {(f.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        onClick={() => removeFile(i)}
                        style={{
                          width: 24, height: 24, borderRadius: "50%",
                          border: "none", background: "rgba(239,68,68,0.1)",
                          color: "#EF4444", fontSize: 12, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 11, color: "rgba(20,20,34,0.35)", fontFamily: "Inter, sans-serif", margin: "4px 0 0" }}>
                {t('bug.mediaInfo')} · {files.length}/{MAX_FILES}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                marginBottom: 12, padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                fontSize: 13, color: "#EF4444", fontFamily: "Inter, sans-serif",
              }}>
                {error}
              </div>
            )}

            {/* C) Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!description.trim() || uploading}
              style={{
                width: "100%", padding: "14px", borderRadius: 22,
                background: !description.trim() || uploading ? "rgba(91,107,125,0.2)" : "#16D7C5",
                border: "none", color: "#fff",
                fontSize: 15, fontWeight: 600, fontFamily: "Inter, sans-serif",
                cursor: !description.trim() || uploading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.2s ease",
              }}
            >
              {uploading ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "hui-spin 0.7s linear infinite",
                  }} />
                  {t('bug.sending')}
                </>
              ) : t('bug.submit')}
            </button>
          </>
        )}
      </div>
      <style>{`
        @keyframes huiSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
