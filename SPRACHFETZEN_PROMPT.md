# HUI i18n — Sprachfetzen Fix Prompt

## Wenn du einen deutschen/englischen Text in der App findest:

Sende Base44 diesen Prompt mit ausgefüllten Feldern:

---
SPRACHFETZEN FIX:
- Screen: [NAME]
- Text: "[TEXT]"  
- Sprache aktiv: [ES/TR/SQ/FR/IT/PT]

VORGEHEN:
1. grep -rn "[TEXT]" src/ --include="*.jsx" --include="*.js" | grep -v "i18n/\|//"
2. Key in ALLE 8 Sprachen eintragen (DE/EN/FR/ES/IT/TR/PT/SQ)
3. t() einbauen — NIEMALS auf Modul-Ebene
4. AST-Scan nach Änderung
5. npm run build → 0 Fehler
6. git push + Version bump
---

## Absolute Regeln (kein White Screen):
- t() NIEMALS außerhalb einer React-Komponente
- Konstanten-Arrays → const getFn = (t) => [...]
- useTranslation immer importieren
- Build muss 0 Fehler zeigen vor Push
