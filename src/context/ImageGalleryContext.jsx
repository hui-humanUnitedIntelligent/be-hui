// src/context/ImageGalleryContext.jsx
// ══════════════════════════════════════════════════════════════════
// ImageGalleryContext — EIN geteilter Oeffnen-Mechanismus fuer JEDES
// Bild in der App (Feed, Profile, Impact-Updates, Support-Tickets,
// Chat, Studio). Analog zu ContentPreviewContext.
//
// Nutzung:
//   const { openGallery } = useImageGallery();
//   openGallery(["url1","url2"], 0);   // Startindex optional
//   openGallery("url1");               // Einzelbild ebenfalls erlaubt
//
// Legacy/Deep-Nesting ohne Context-Zugriff:
//   window.__HUI_OPEN_GALLERY__?.(images, startIndex);
// ══════════════════════════════════════════════════════════════════
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import ImageGalleryModal from "../components/shared/ImageGalleryModal.jsx";
import { useModalRegistration } from "../hooks/useModalRegistration.js";

const ImageGalleryContext = createContext(null);

export function ImageGalleryProvider({ children }) {
  const [state, setState] = useState(null);

  const openGallery = useCallback((images, startIndex = 0) => {
    const list = (Array.isArray(images) ? images : [images]).filter(Boolean);
    if (!list.length) return;
    const safeIndex = Math.min(Math.max(startIndex, 0), list.length - 1);
    setState({ images: list, startIndex: safeIndex });
  }, []);

  const closeGallery = useCallback(() => setState(null), []);

  useModalRegistration(!!state, closeGallery, "ImageGallery");

  useEffect(() => {
    window.__HUI_OPEN_GALLERY__ = openGallery;
    return () => { delete window.__HUI_OPEN_GALLERY__; };
  }, [openGallery]);

  const value = useMemo(() => ({ openGallery, closeGallery }), [openGallery, closeGallery]);

  return (
    <ImageGalleryContext.Provider value={value}>
      {children}
      {state && (
        <ImageGalleryModal
          images={state.images}
          startIndex={state.startIndex}
          onClose={closeGallery}
        />
      )}
    </ImageGalleryContext.Provider>
  );
}

export function useImageGallery() {
  const ctx = useContext(ImageGalleryContext);
  if (!ctx) {
    return {
      openGallery: (images, startIndex) => window.__HUI_OPEN_GALLERY__?.(images, startIndex),
      closeGallery: () => {},
    };
  }
  return ctx;
}
