/**
 * useSheetDrag — Drag-to-Close für HUI Bottom-Sheets
 *
 * Wischen nach unten schließt das Sheet. 
 * Ab DRAG_THRESHOLD px wird onClose() aufgerufen, sonst federt es zurück.
 *
 * Verwendung:
 *   const { dragY, dragHandlers, sheetTransform, sheetTransition } = useSheetDrag(onClose);
 *   <div style={{ transform: sheetTransform, transition: sheetTransition }}>
 *     <div {...dragHandlers}>  ← Drag-Handle + Header-Bereich
 *       <div className="handle-bar" />
 *       <div className="sheet-title" />
 *     </div>
 *     <div className="sheet-content">  ← Inhalt scrollt normal
 *       ...
 *     </div>
 *   </div>
 *
 * @param {Function} onClose — wird aufgerufen wenn genug nach unten gewischt wurde
 * @param {object} [opts]
 * @param {number}  [opts.threshold=110]  — px ab dem geschlossen wird
 * @param {boolean} [opts.enabled=true]  — Hook ein-/ausschalten
 */
import { useState, useRef, useCallback } from "react";

const DRAG_THRESHOLD = 110;

export function useSheetDrag(onClose, opts = {}) {
  const threshold = opts.threshold ?? DRAG_THRESHOLD;
  const enabled   = opts.enabled !== false;

  const dragRef = useRef({ startY: 0, dy: 0, dragging: false });
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e) => {
    if (!enabled) return;
    if (!e.touches || !e.touches[0]) return;
    dragRef.current = { startY: e.touches[0].clientY, dy: 0, dragging: true };
    setIsDragging(true);
  }, [enabled]);

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const dy = e.touches[0].clientY - dragRef.current.startY;
    if (dy > 0) {
      dragRef.current.dy = dy;
      setDragY(dy);
      if (e.cancelable && dy > 8) {
        e.preventDefault();
      }
    } else {
      dragRef.current.dy = 0;
      setDragY(0);
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    setIsDragging(false);
    if (dragRef.current.dy > threshold) {
      onClose?.();
    } else {
      setDragY(0);
    }
    dragRef.current = { startY: 0, dy: 0, dragging: false };
  }, [onClose, threshold]);

  return {
    dragY,
    isDragging,
    dragHandlers: {
      onTouchStart: handleDragStart,
      onTouchMove:  handleDragMove,
      onTouchEnd:   handleDragEnd,
    },
    sheetTransform:  `translateY(${Math.max(0, dragY)}px)`,
    sheetTransition: isDragging ? "none" : "transform 0.25s cubic-bezier(.4,0,.2,1)",
  };
}
