#!/bin/bash
# scripts/auto-release.sh — Full auto-release (patch bump)
# Wird für schnelle Patch-Releases verwendet.
# Für minor/major: bash release.sh minor|major
set -euo pipefail
bash "$(dirname "${BASH_SOURCE[0]}")/release.sh" patch
