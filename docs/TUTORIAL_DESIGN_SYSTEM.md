# HUI Tutorial Design System
**Gültig ab:** 2026-08-11
**Verbindlich für:** ALLE Tutorials in der HUI-App

## Geltungsbereich

Diese Regeln gelten für jedes Tutorial in HUI:
- Basis-Tutorial (7 Schritte)
- Fortgeschrittenes Tutorial (11 Schritte)
- Zukünftige: Werke, Talente, Erlebnisse, Impact, Profil, Orb

## Design-Konstanten (SSOT)

```
FOX_SIZE        = 52     // Feste Fuchs-Größe — unverzerrt auf allen Geräten
FOX_MARGIN      = 20     // Mindestabstand Fuchs zu Bildschirmrand
FOX_BUBBLE_GAP  = 10     // Abstand Sprechblase ↔ Fuchs
BTN_WIDTH       = 132    // Kompakte Weiter-Button-Breite (~20-25% auf 375px)
BTN_HEIGHT      = 44     // Feste Button-Höhe
BTN_BOTTOM      = 100    // Button schwebt über Navbar (72px Nav + 28px Luft)
BUBBLE_MAX_W    = 260    // Max Breite der Sprechblase
SPOT_PAD        = 10     // Spotlight Innenabstand
OVERLAY_ALPHA   = 0.6    // Overlay-Transparenz (leicht grau)
```

## 1. Fuchs-Design

- **Feste Größe**: 52px in Tutorial-Schritten, 64px in Dialogen
- **Nie verzerrt**: `flexShrink: 0`, `display: block` auf dem SVG
- **Nie an Bildschirmrand**: Mindestabstand 20px (FOX_MARGIN) zu allen Rändern
- **Abstand zu Text**: Sprechblase hat 10px (FOX_BUBBLE_GAP) Abstand zum Fuchs
- **Position**: Automatisch berechnet — oben bei `placement: "top"`, unten bei `placement: "bottom"`, zentriert bei `placement: "center"`

## 2. Weiter-Button

- **Kompakt**: 132px breit, 44px hoch (~20-25% der Bildschirmbreite)
- **Zentriert unten schwebend**: `left: 50%`, `transform: translateX(-50%)`
- **Über Navbar**: `bottom: 100px + env(safe-area-inset-bottom)`
- **Getrennt vom Fuchs**: Separates `position: fixed` Element, niemals im selben Container
- **Verdeckt nie Spotlight**: Da eigenständig positioniert und Fuchs-Position Button-Zone respektiert

## 3. Spotlight-Bereiche

- **Vollständig sichtbar**: Box-shadow Technik (`0 0 0 9999px rgba(0,0,0,0.6)`)
- **Pulsierender Ring**: 2px Border, `huiSpotlightPulse` Animation
- **Keine Überdeckung**: Fuchs, Text und Button sind SEPARATE Fixed-Elemente und überlappen nie das Spotlight
- **Pointer-Richtung**: 
  - `placement: "top"` → Sprechblase zeigt nach unten (Fuchs oben, Spotlight unten)
  - `placement: "bottom"` → Sprechblase zeigt nach oben (Fuchs unten, Spotlight oben)
  - `placement: "center"` → Kein Pointer (dunkler Overlay, Fuchs zentriert)

## 4. Fuchs-Positionierung

Die Fuchs-Position wird automatisch berechnet:

### placement: "top" (Fuchs über Spotlight)
```
[Fuchs + Sprechblase]    ← top: spotlight.top - 190
   ↓ (Pointer nach unten)
[████ Spotlight ████]
```

### placement: "bottom" (Fuchs unter Spotlight)
```
[████ Spotlight ████]
   ↑ (Pointer nach oben)
[Fuchs + Sprechblase]    ← top: spotlight.bottom + 18 (aber max. über Button-Zone)
```

### placement: "center" (kein Spotlight)
```
      [Fuchs + Sprechblase]    ← zentriert, oberhalb Button-Zone
         [Weiter-Button]       ← unten schwebend
```

## 5. Weiter-Button Position

Immer am gleichen Ort, unabhängig von Tutorial-Typ:
- Horizontal: Bildschirmmitte (`left: 50%`, `translateX(-50%)`)
- Vertikal: `bottom: calc(100px + env(safe-area-inset-bottom, 0px))`
- Breite: 132px fix
- Höhe: 44px fix
- Radius: 22px (pill-shaped)
- Hintergrund: `linear-gradient(135deg, #16D7C5, #0DC4B5)`

## 6. Overlay

- Farbe: `rgba(0,0,0,0.6)` (leicht grau, transparent)
- Bei Dialogen: `backdropFilter: blur(2px)` zusätzlich
- Bei Spotlight: Box-shadow auf transparentem Rechteck
- Bei keinem Spotlight: Vollflächiger dunkler Overlay

## 7. Schrift

- Alle Texte: `fontFamily: "Inter, sans-serif"` (Pflichtregel)
- Sprechblasen-Text: 14px, fontWeight 500, lineHeight 1.5
- Label: 12px, fontWeight 700, uppercase, letterSpacing 1.5
- Counter: 11px, fontWeight 600
- Button: 14px, fontWeight 600

## Implementierung

Die zentrale Komponente ist `src/components/onboarding/OnboardingTutorial.jsx`.
Alle Design-Konstanten sind am Datei-Anfang definiert und als SSOT zu betrachten.

**Keine bestehenden UI-Elemente werden durch Tutorials verändert oder entfernt.**
