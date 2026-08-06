#!/bin/bash
# scripts/auto-version.sh — Auto-Version für Release-Builds
# Wird von auto-release.sh aufgerufen.
# Erhöht patch-Version automatisch und synct alle Dateien.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Delegate to version.sh with patch bump
bash "${SCRIPT_DIR}/version.sh" patch
