#!/usr/bin/env python3
"""
Injiziert <link rel="modulepreload"> für kritische Chunks nach jedem Build.
Läuft nach: npm run build
"""
import os
import re
import glob

WWW = "www"
ASSETS = os.path.join(WWW, "assets")
INDEX = os.path.join(WWW, "index.html")

# Kritische Chunks die VOR dem ersten User-Interakt geladen werden sollen
CRITICAL_PATTERNS = [
    "BasisProfilePage-*.js",
    "OrbSignatur-*.js",
    "ProfileHeader-*.js",
    "TalentProfilePage-*.js",
]

# Stripe NICHT preloaden
EXCLUDE = ["stripe", "Stripe"]

def find_chunk(pattern):
    matches = glob.glob(os.path.join(ASSETS, pattern))
    if matches:
        return os.path.basename(matches[0])
    return None

def main():
    with open(INDEX, "r") as f:
        html = f.read()

    # Bestehende auto-injected preloads (unser Marker) entfernen
    html = re.sub(r'\s*<!-- HUI-PRELOAD-START -->.*?<!-- HUI-PRELOAD-END -->', '', html, flags=re.DOTALL)

    # Neue Preloads bauen
    preloads = []
    for pattern in CRITICAL_PATTERNS:
        chunk = find_chunk(pattern)
        if chunk:
            preloads.append(f'  <link rel="modulepreload" crossorigin href="./assets/{chunk}">')
            print(f"  ✓ Preload: {chunk}")
        else:
            print(f"  ✗ Nicht gefunden: {pattern}")

    if preloads:
        block = "\n    <!-- HUI-PRELOAD-START -->\n" + "\n".join(preloads) + "\n    <!-- HUI-PRELOAD-END -->"
        # Direkt nach <head> einfügen
        html = html.replace("</head>", block + "\n  </head>")

    with open(INDEX, "w") as f:
        f.write(html)
    print(f"✅ {len(preloads)} Preload-Tags in index.html injiziert")

if __name__ == "__main__":
    main()
