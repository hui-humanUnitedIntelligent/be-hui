#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# scripts/generate-ota-bundle.sh — OTA Bundle Generator (2026-08-08)
# ═══════════════════════════════════════════════════════════════
# Läuft NACH `npm run build` und erzeugt zwei Dateien in www/:
#
# 1. www/bundle.zip — ZIP des gesamten www/ Inhalts (ohne bundle.zip selbst)
# 2. www/app-version.json — Versions-Manifest für @capgo/capacitor-updater
#
# Die app-version.json wird von Vercel statisch gehostet und von der
# CapacitorUpdater-Plugin beim App-Start abgefragt. Wenn die Version
# dort neuer ist als die lokal gebündelte, lädt das Plugin das bundle.zip
# herunter und wendet es beim nächsten Start an.
#
# Format app-version.json:
# { "version": "1.4.6", "url": "https://be-hui.vercel.app/bundle.zip" }
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

WEB_DIR="${1:-www}"
if [[ ! -d "$WEB_DIR" ]]; then
  echo "[OTA] Web-Verzeichnis $WEB_DIR nicht gefunden — überspringe OTA-Bundle"
  exit 0
fi

# Version aus package.json lesen
VERSION=$(node -p "JSON.parse(require('fs').readFileSync('./package.json','utf8')).version")
echo "[OTA] Generiere OTA-Bundle für Version v$VERSION..."

# Python-Fallback: funktioniert auch wenn zip-Binary nicht installiert ist
python3 << PYEOF
import os, zipfile, json, hashlib, datetime

web_dir = "$WEB_DIR"
version = "$VERSION"

files_to_zip = []
for root, dirs, filenames in os.walk(web_dir):
    for fn in filenames:
        full = os.path.join(root, fn)
        rel = os.path.relpath(full, web_dir)
        if rel in ("bundle.zip", "app-version.json"):
            continue
        files_to_zip.append((full, rel))

files_to_zip.sort(key=lambda x: x[1])

bundle_path = os.path.join(web_dir, "bundle.zip")
with zipfile.ZipFile(bundle_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for full, rel in files_to_zip:
        zf.write(full, rel)

with open(bundle_path, "rb") as f:
    checksum = hashlib.sha256(f.read()).hexdigest()

manifest = {
    "version": version,
    "url": "https://be-hui.vercel.app/bundle.zip",
    "checksum": checksum,
    "generatedAt": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
}

with open(os.path.join(web_dir, "app-version.json"), "w") as f:
    json.dump(manifest, f, indent=2)

size_kb = os.path.getsize(bundle_path) // 1024
print(f"[OTA] + bundle.zip created ({size_kb} KB)")
print(f"[OTA] + app-version.json: v{version}")
print(json.dumps(manifest, indent=2))
PYEOF
