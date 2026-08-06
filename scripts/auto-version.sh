#!/bin/bash
# scripts/auto-version.sh — Auto-Version für Release-Builds
# Wird von auto-release.sh aufgerufen. Delegiert an version.sh.
set -euo pipefail
bash "$(dirname "${BASH_SOURCE[0]}")/version.sh" patch
