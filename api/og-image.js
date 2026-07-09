// api/og-image.js — HUI OpenGraph Image Proxy (2026-07-09)
// Liefert öffentlich erreichbare, HTTPS-absolut URLs für Social-Crawler.
// Alle Bilder werden auf 1200×630 normalisiert (WhatsApp/Telegram/Discord-konform).

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import {
  resolveSourceImage,
  APP_ORIGIN,
} from "./_og-shared.js";

const require = createRequire(import.meta.url);

const OG_WIDTH  = 1200;
const OG_HEIGHT = 630;

const DEFAULT_IMAGE_CANDIDATES = [
  path.join(process.cwd(), "public", "og-default.png"),
  path.join(process.cwd(), "public", "hui-og-image.png"),
  path.join(process.cwd(), "public", "hui-logo.jpg"),
];

let sharpModule = null;
let sharpLoadAttempted = false;

function getSharp() {
  if (sharpLoadAttempted) return sharpModule;
  sharpLoadAttempted = true;
  try {
    sharpModule = require("sharp");
  } catch {
    sharpModule = null;
  }
  return sharpModule;
}

function detectImageContentType(buffer) {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return "image/jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return "image/png";
  return "application/octet-stream";
}

function readDefaultBuffer() {
  for (const p of DEFAULT_IMAGE_CANDIDATES) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p);
    } catch { /* next */ }
  }
  return null;
}

async function processToOgSize(inputBuffer) {
  const sharp = getSharp();
  if (sharp) {
    const buffer = await sharp(inputBuffer)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: "cover", position: "centre" })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    return { buffer, contentType: "image/jpeg" };
  }
  return { buffer: inputBuffer, contentType: detectImageContentType(inputBuffer) };
}

async function fetchImageBuffer(url) {
  const headers = { Accept: "image/*", "User-Agent": "HUI-OG-Image/1.0" };

  const res = await fetch(url, { headers, redirect: "follow" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);

  const ct = res.headers.get("content-type") || "";
  if (!ct.startsWith("image/")) throw new Error(`not an image: ${ct}`);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100) throw new Error("image too small");
  return buf;
}

function setImageHeaders(res, contentType, maxAge = 86400) {
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=604800`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

async function serveDefault(res) {
  const raw = readDefaultBuffer();
  if (!raw) {
    res.status(404).setHeader("Content-Type", "text/plain").end("Default OG image not found");
    return;
  }
  const { buffer, contentType } = await processToOgSize(raw);
  setImageHeaders(res, contentType, 604800);
  res.status(200).send(buffer);
}

function parsePath(reqUrl) {
  const url = new URL(reqUrl, "https://placeholder");
  const raw = url.pathname.replace(/^\/api\/og-image\/?/, "");
  const segments = raw.split("/").filter(Boolean).map(s => {
    try { return decodeURIComponent(s); } catch { return s; }
  });
  return segments;
}

export default async function handler(req, res) {
  try {
    const segments = parsePath(req.url || "");

    // /api/og-image/default
    if (segments.length === 0 || segments[0] === "default") {
      await serveDefault(res);
      return;
    }

    const [type, ...idParts] = segments;
    const id = idParts.join("/");
    if (!type || !id) {
      await serveDefault(res);
      return;
    }

    const sourceUrl = await resolveSourceImage(type, id);

    if (!sourceUrl) {
      await serveDefault(res);
      return;
    }

    const raw = await fetchImageBuffer(sourceUrl);
    const { buffer, contentType } = await processToOgSize(raw);
    setImageHeaders(res, contentType);
    res.status(200).send(buffer);

  } catch (err) {
    console.error("[HUI OG-IMAGE]", err?.message, APP_ORIGIN);
    try {
      await serveDefault(res);
    } catch {
      res.status(500).setHeader("Content-Type", "text/plain").end("OG image error");
    }
  }
}
