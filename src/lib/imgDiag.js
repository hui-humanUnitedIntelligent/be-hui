// src/lib/imgDiag.js
// ══════════════════════════════════════════════════════════════════════
// IMG-DIAG-001 (2026-09-04) — Einmaliger Geräte-Image-/Upload-Probe
// ══════════════════════════════════════════════════════════════════════
// KONTEXT (Foto-Bug 2026-09-04): Auf Michaels Android-Gerät (Xiaomi
// 24090RA29G, HyperOS/Android 16, App v2.1.541) zeigten Cover/Avatar im
// Profil das Broken-Image-Glyph, und Uploads kamen nicht im Supabase
// Storage an — obwohl (serverseitig verifiziert): Transform-URL und
// Raw-URL 200/valid liefern (auch mit Android-WebView-User-Agent,
// HTTP/1.1, HEAD), RLS in Ordnung, Buckets öffentlich, IDENTITY_CONTRACT
// -Select als auth Nutzer funktioniert. Der Fehler liegt damit
// nachweislich GERÄTESEITIG — aber die genaue Schicht (WebView-Netzwerk
// vs. CapacitorHttp-Blob-Handling vs. lokale-State) ist ohne Vor-Ort-
// Messung nicht unterscheidbar.
//
// DIESES MODUL misst genau das, EINMAL pro App-Version, nur auf nativen
// Geräten, ohne Nutzer-Interaktion:
//   P1  <img> -Laden der eigenen Cover-Transform-URL   (WebView-Netzwerk)
//   P2  <img> -Laden der eigenen Cover-Raw-URL         (WebView-Netzwerk)
//   P3  <img> -Laden eines lokalen Bundles-Assets      (lokale Assets)
//   P4  fetch() derselben Transform-URL                (CapacitorHttp/native)
//   P5  Storage-Upload eines 212-Byte-Test-JPEGs + sofortiges Remove
//       (echter Upload-Pfad, eigener User-Ordner, danach gelöscht)
//
// Ergebnis → system_error_reports (error_type='img_diag') über den
// bestehenden errorReporter (anon INSERT, RLS erlaubt). Auswertung:
//   P1/P2 fail + P4 ok   → WebView-Netzwerkstörung (DNS/IPv6/TLS) →
//                          IMG-FALLBACK-001 fängt das ab (Raw/SVG-Stufe)
//   P4 fail              → native fetch-Schicht gestört
//   P5 fail              → Upload-Pfad: Fehlermeldung im Report zeigt die Ursache
//   alles ok             → Bug ist NICHT Netzwerk/Upload → Frontend-State
//
// WICHTIG: Reine Diagnose — keine UI, keine Nebeneffekte außer dem
// 212-Byte-Testobjekt, das sofort wieder gelöscht wird.
// ══════════════════════════════════════════════════════════════════════

import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabaseClient.js";
import { reportError } from "./errorReporter.js";
import { optimizeCover } from "./perfUtils.js";
import { APP_VERSION } from "../version.js";

const GUARD_KEY = "hui_imgdiag_v1";
const PROBE_TIMEOUT_MS = 15_000;

// 212-Byte 1x1-Graustufen-JPEG für den Upload-Test (oben dokumentiert)
const TINY_JPEG_B64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=";

function b64ToUint8(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ── P1-P3: <img>-Probe via Image() ────────────────────────────────────
function probeImage(url) {
  return new Promise((resolve) => {
    if (!url) return resolve("skip");
    const t0 = Date.now();
    let settled = false;
    const done = (result) => {
      if (!settled) { settled = true; resolve(result + "(" + (Date.now() - t0) + "ms)"); }
    };
    const img = new Image();
    const timer = setTimeout(() => { img.src = ""; done("TIMEOUT"); }, PROBE_TIMEOUT_MS);
    img.onload  = () => { clearTimeout(timer); done("OK"); };
    img.onerror = () => { clearTimeout(timer); done("FAIL"); };
    img.src = url;
  });
}

// ── P4: fetch()-Probe (läuft auf nativ über CapacitorHttp) ───────────
async function probeFetch(url) {
  if (!url) return "skip";
  try {
    const t0 = Date.now();
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    return "HTTP" + res.status + "(" + (Date.now() - t0) + "ms)";
  } catch (e) {
    return "ERR:" + String(e && e.message ? e.message : "unknown").substring(0, 120);
  }
}

// ── P5: Echter Storage-Upload + Remove (eigener User-Ordner) ─────────
async function probeUpload(userId) {
  const path = "covers/" + userId + "/diag_" + Date.now() + ".jpg";
  try {
    const { error } = await supabase.storage
      .from("media")
      .upload(path, b64ToUint8(TINY_JPEG_B64), { contentType: "image/jpeg", upsert: true });
    if (error) return "FAIL:" + String(error.message || "unknown").substring(0, 150);
    try { await supabase.storage.from("media").remove([path]); } catch (_) {}
    return "OK";
  } catch (e) {
    return "EXC:" + String(e && e.message ? e.message : "unknown").substring(0, 150);
  }
}

// ── Hauptfunktion — einmal pro App-Version pro Gerät ─────────────────
export async function runImgDiagOnce(userId) {
  try {
    // Nur native Apps — im Web ist der Fehler nicht reproduzierbar und
    // der Report wäre nur Rauschen.
    if (!Capacitor.isNativePlatform || !Capacitor.isNativePlatform()) return;

    // Guard: einmal pro Version (Version im Key, damit ein Fix-Deploy
    // eine erneute Messung auslöst).
    const key = GUARD_KEY + "_" + APP_VERSION;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, String(Date.now()));
    } catch { return; /* localStorage kaputt → nicht endlos rennen */ }

    // Eigenes Profil laden (header_img = das Cover, das im Bug-Report
    // kaputt war; avatar_url analog).
    const { data: prof } = await supabase
      .from("profiles")
      .select("header_img,avatar_url")
      .eq("id", userId)
      .maybeSingle();

    const rawCover = (prof && prof.header_img) || null;
    const transformCover = rawCover ? optimizeCover(rawCover) : null;

    const p1 = probeImage(transformCover);                     // P1 Transform via <img>
    const p2 = probeImage(rawCover);                           // P2 Raw via <img>
    const p3 = probeImage("/assets/brand/fallback-avatar.svg"); // P3 lokales Asset
    const p4 = probeFetch(transformCover);                     // P4 Transform via fetch
    const p5 = probeUpload(userId);                            // P5 Storage-Upload
    const [r1, r2, r3, r4, r5] = await Promise.all([p1, p2, p3, p4, p5]);

    const msg = JSON.stringify({
      v: APP_VERSION,
      platform: (Capacitor.getPlatform ? Capacitor.getPlatform() : "native"),
      hasCover: !!rawCover,
      hasAvatar: !!(prof && prof.avatar_url),
      p1_img_transform: r1,
      p2_img_raw: r2,
      p3_img_local: r3,
      p4_fetch: r4,
      p5_upload: r5,
      ua: String(navigator.userAgent || "").substring(0, 180),
    });

    reportError("img_diag", {
      message: "IMG-DIAG " + msg,
      route: "/img-diag",
      component: "ImgProbe",
      priority: "HIGH",
    });
  } catch (e) {
    // Diagnose darf NIEMALS die App beeinflussen
    console.warn("[imgDiag] Probe fehlgeschlagen:", e && e.message);
  }
}
