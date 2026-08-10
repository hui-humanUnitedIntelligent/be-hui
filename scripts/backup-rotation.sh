#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# scripts/backup-rotation.sh — HUI Backup-Retention-Policy
# ═══════════════════════════════════════════════════════════════
# Regel: Behalte die aktuelle Version + mindestens 2 Backups.
# Wenn ein neues Backup hinzukommt und es mehr als 2 Backups sind,
# wird das älteste gelöscht.
#
# LOGIK:
#   Neue Version kommt dazu → behalte max 2 Backups → lösche ältestes
#   Aktuelle Version + 2 Backups = 3 Dateien total (max)
#
# AUFRUF:
#   bash scripts/backup-rotation.sh <file_or_dir>
#   bash scripts/backup-rotation.sh  (rotiert alle backup_* Dateien im Repo)
# ═══════════════════════════════════════════════════════════════

MAX_BACKUPS=2

# Wenn ein Argument übergeben wird, rotiere nur diese Datei/Verzeichnis
if [ -n "$1" ]; then
    TARGET="$1"
    BASENAME=$(basename "$TARGET")
    DIRNAME=$(dirname "$TARGET")
    
    # Finde alle Backups für diese Datei (backup_*_<basename> oder backup_*_<basename>.bak)
    mapfile -t BACKUPS < <(find "$DIRNAME" -maxdepth 1 -name "backup_*_${BASENAME}*" -o -name "backup_*_${BASENAME%.bak}*" 2>/dev/null | sort)
    
    COUNT=${#BACKUPS[@]}
    
    if [ $COUNT -le $MAX_BACKUPS ]; then
        echo "[BACKUP-ROTATION] $COUNT Backups für $BASENAME — kein Cleanup nötig (max $MAX_BACKUPS)"
        exit 0
    fi
    
    echo "[BACKUP-ROTATION] $COUNT Backups für $BASENAME — behalte die neuesten $MAX_BACKUPS:"
    
    # Lösche die ältesten (Anzahl - MAX_BACKUPS)
    TO_DELETE=$((COUNT - MAX_BACKUPS))
    for ((i=0; i<TO_DELETE; i++)); do
        echo "  → Lösche: ${BACKUPS[$i]}"
        rm -f "${BACKUPS[$i]}"
    done
    
    echo "[BACKUP-ROTATION] ✅ $TO_DELETE alte(s) Backup(s) gelöscht, $MAX_BACKUPS verbleiben."
    exit 0
fi

# Ohne Argument: rotiere ALLE backup_* Dateien im gesamten Repo
echo "[BACKUP-ROTATION] Globale Rotation aller backup_* Dateien..."

# Sammle alle Backup-Dateien, gruppiert nach Original-Dateiname
# Format: backup_YYYYMMDD_Filename.bak oder backup_YYYYMMDD_Filename
find . -maxdepth 3 -name "backup_*" -type f 2>/dev/null | while read -r FILE; do
    # Extrahiere den Original-Dateinamen (alles nach backup_YYYYMMDD_)
    ORIG=$(echo "$FILE" | sed 's/.*backup_[0-9]*_//')
    
    if [ -z "$ORIG" ]; then continue; fi
    
    # Finde alle Backups mit dem gleichen Original-Namen
    DIR=$(dirname "$FILE")
    mapfile -t GROUP < <(find "$DIR" -maxdepth 1 -name "backup_*_${ORIG}" 2>/dev/null | sort)
    
    COUNT=${#GROUP[@]}
    if [ $COUNT -gt $MAX_BACKUPS ]; then
        TO_DELETE=$((COUNT - MAX_BACKUPS))
        echo "  [$ORIG] $COUNT Backups → lösche $TO_DELETE älteste(s)"
        for ((i=0; i<TO_DELETE; i++)); do
            rm -f "${GROUP[$i]}"
            echo "    ✗ ${GROUP[$i]}"
        done
    fi
done

echo "[BACKUP-ROTATION] ✅ Fertig. Max $MAX_BACKUPS Backups pro Datei behalten."
