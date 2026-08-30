// src/lib/categoryMaps.js — SSOT für Kategorie-Übersetzungsmappings
// ════════════════════════════════════════════════════════════════
// Mappt rohe DB-Kategorie-Werte (in der Ersteller-Sprache gespeichert)
// auf i18n-Keys, damit Kategorien in der Betrachter-Sprache angezeigt werden.
//
// CAT_KEY_MAP — Talent-Kategorien (TalentContent.jsx, 19 Werte)
// WERK_CAT_KEY_MAP — Werk-Kategorien (WerkWizard ww.kategorien, 10 Werte)
//
// Alle 8 Sprachvarianten abgedeckt: DE/EN/ES/FR/IT/PT/SQ/TR
// ════════════════════════════════════════════════════════════════

// Talent-Kategorien (aus TalentContent.jsx, jetzt hier als SSOT)
export const CAT_KEY_MAP = {
  "Malerei": "cat.malerei", "Illustration": "cat.illustration", "Fotografie": "cat.fotografie",
  "Musik": "cat.musik", "Gesang": "cat.gesang", "Handwerk": "cat.handwerk",
  "Programmierung": "cat.programmierung", "Design": "cat.design", "Bildung": "cat.bildung",
  "Theater": "cat.theater", "Coaching": "cat.coaching", "Naturführung": "cat.naturfuehrung",
  "Kochen": "cat.kochen", "Film": "cat.film", "Schreiben": "cat.schreiben",
  "Töpfern": "cat.toepfern", "Workshops": "cat.workshops", "Kunstberatung": "cat.kunstberatung",
  "Auftragskunst": "cat.auftragskunst", "Weitere Angebote": "cat.weitere",
  // EN
  "Painting": "cat.malerei", "Photography": "cat.fotografie", "Sculpture": "cat.skulptur",
  "Music": "cat.musik", "Singing": "cat.gesang", "Craft": "cat.handwerk",
  "Programming": "cat.programmierung", "Education": "cat.bildung",
  "Theater": "cat.theater", "Cooking": "cat.kochen", "Film": "cat.film",
  "Writing": "cat.schreiben", "Pottery": "cat.toepfern",
  "Workshops": "cat.workshops", "Art Consulting": "cat.kunstberatung",
  "Commissioned Art": "cat.auftragskunst", "Other offerings": "cat.weitere",
  // ES
  "Pintura": "cat.malerei", "Fotografía": "cat.fotografie", "Escultura": "cat.skulptur",
  "Música": "cat.musik", "Canto": "cat.gesang", "Artesanía": "cat.handwerk",
  "Programación": "cat.programmierung", "Diseño": "cat.design", "Educación": "cat.bildung",
  "Teatro": "cat.theater", "Cocina": "cat.kochen", "Película": "cat.film",
  "Escritura": "cat.schreiben", "Cerámica": "cat.toepfern",
  "Talleres": "cat.workshops", "Asesoría artística": "cat.kunstberatung",
  "Arte por encargo": "cat.auftragskunst", "Otras ofertas": "cat.weitere",
  // FR
  "Peinture": "cat.malerei", "Photographie": "cat.fotografie", "Sculpture": "cat.skulptur",
  "Musique": "cat.musik", "Chant": "cat.gesang", "Artisanat": "cat.handwerk",
  "Programmation": "cat.programmierung", "Éducation": "cat.bildung",
  "Théâtre": "cat.theater", "Cuisine": "cat.kochen", "Film": "cat.film",
  "Écriture": "cat.schreiben", "Poterie": "cat.toepfern",
  "Ateliers": "cat.workshops", "Conseil artistique": "cat.kunstberatung",
  "Art sur commande": "cat.auftragskunst", "Autres offres": "cat.weitere",
  // IT
  "Pittura": "cat.malerei", "Fotografia": "cat.fotografie", "Scultura": "cat.skulptur",
  "Musica": "cat.musik", "Canto": "cat.gesang", "Artigianato": "cat.handwerk",
  "Programmazione": "cat.programmierung", "Istruzione": "cat.bildung",
  "Teatro": "cat.theater", "Cucina": "cat.kochen", "Film": "cat.film",
  "Scrittura": "cat.schreiben", "Ceramica": "cat.toepfern",
  "Workshop": "cat.workshops", "Consulenza artistica": "cat.kunstberatung",
  "Arte su commissione": "cat.auftragskunst", "Altre offerte": "cat.weitere",
  // PT
  "Pintura": "cat.malerei", "Fotografia": "cat.fotografie", "Escultura": "cat.skulptur",
  "Música": "cat.musik", "Canto": "cat.gesang", "Artesanato": "cat.handwerk",
  "Programação": "cat.programmierung", "Educação": "cat.bildung",
  "Teatro": "cat.theater", "Cozinha": "cat.kochen", "Filme": "cat.film",
  "Escrita": "cat.schreiben", "Cerâmica": "cat.toepfern",
  "Oficinas": "cat.workshops", "Consultoria artística": "cat.kunstberatung",
  "Arte por encomenda": "cat.auftragskunst", "Outras ofertas": "cat.weitere",
  // SQ
  "Pikimë": "cat.malerei", "Fotografi": "cat.fotografie", "Skulpturë": "cat.skulptur",
  "Muzikë": "cat.musik", "Këndim": "cat.gesang", "Zanat": "cat.handwerk",
  "Programim": "cat.programmierung", "Edukim": "cat.bildung",
  "Teatër": "cat.theater", "Gatim": "cat.kochen", "Film": "cat.film",
  "Shkrim": "cat.schreiben", "Qeramikë": "cat.toepfern",
  "Workshop": "cat.workshops", "Këshillim arti": "cat.kunstberatung",
  "Art me porosi": "cat.auftragskunst", "Oferta të tjera": "cat.weitere",
  // TR
  "Resim": "cat.malerei", "Fotoğraf": "cat.fotografie", "Heykel": "cat.skulptur",
  "Müzik": "cat.musik", "Şarkı": "cat.gesang", "El sanatları": "cat.handwerk",
  "Programlama": "cat.programmierung", "Eğitim": "cat.bildung",
  "Tiyatro": "cat.theater", "Mutfak": "cat.kochen", "Film": "cat.film",
  "Yazı": "cat.schreiben", "Seramik": "cat.toepfern",
  "Atölye": "cat.workshops", "Sanat danışmanlığı": "cat.kunstberatung",
  "İş siparişi sanat": "cat.auftragskunst", "Diğer teklifler": "cat.weitere",
};

// Werk-Kategorien (aus WerkWizard ww.kategorien, 10 Werte × 8 Sprachen)
export const WERK_CAT_KEY_MAP = {
  // DE
  "Malerei": "cat.malerei", "Fotografie": "cat.fotografie", "Skulptur": "cat.skulptur",
  "Illustration": "cat.illustration", "Design": "cat.design", "Musik": "cat.musik",
  "Literatur": "cat.literatur", "Performance": "cat.performance",
  "Handwerk": "cat.handwerk", "Sonstiges": "cat.sonstiges",
  // EN
  "Painting": "cat.malerei", "Photography": "cat.fotografie", "Sculpture": "cat.skulptur",
  "Illustration": "cat.illustration", "Design": "cat.design", "Music": "cat.musik",
  "Literature": "cat.literatur", "Performance": "cat.performance",
  "Craft": "cat.handwerk", "Other": "cat.sonstiges",
  // ES
  "Pintura": "cat.malerei", "Fotografía": "cat.fotografie", "Escultura": "cat.skulptur",
  "Ilustración": "cat.illustration", "Diseño": "cat.design", "Música": "cat.musik",
  "Literatura": "cat.literatur", "Performance": "cat.performance",
  "Artesanía": "cat.handwerk", "Otro": "cat.sonstiges",
  // FR
  "Peinture": "cat.malerei", "Photographie": "cat.fotografie", "Sculpture": "cat.skulptur",
  "Illustration": "cat.illustration", "Design": "cat.design", "Musique": "cat.musik",
  "Littérature": "cat.literatur", "Performance": "cat.performance",
  "Artisanat": "cat.handwerk", "Autre": "cat.sonstiges",
  // IT
  "Pittura": "cat.malerei", "Fotografia": "cat.fotografie", "Scultura": "cat.skulptur",
  "Illustrazione": "cat.illustration", "Design": "cat.design", "Musica": "cat.musik",
  "Letteratura": "cat.literatur", "Performance": "cat.performance",
  "Artigianato": "cat.handwerk", "Altro": "cat.sonstiges",
  // PT
  "Pintura": "cat.malerei", "Fotografia": "cat.fotografie", "Escultura": "cat.skulptur",
  "Ilustração": "cat.illustration", "Design": "cat.design", "Música": "cat.musik",
  "Literatura": "cat.literatur", "Performance": "cat.performance",
  "Artesanato": "cat.handwerk", "Outro": "cat.sonstiges",
  // SQ
  "Pikimë": "cat.malerei", "Fotografi": "cat.fotografie", "Skulpturë": "cat.skulptur",
  "Ilustrim": "cat.illustration", "Design": "cat.design", "Muzikë": "cat.musik",
  "Letërsi": "cat.literatur", "Performance": "cat.performance",
  "Zanat": "cat.handwerk", "Tjetër": "cat.sonstiges",
  // TR
  "Resim": "cat.malerei", "Fotoğraf": "cat.fotografie", "Heykel": "cat.skulptur",
  "İllüstrasyon": "cat.illustration", "Tasarım": "cat.design", "Müzik": "cat.musik",
  "Edebiyat": "cat.literatur", "Performans": "cat.performance",
  "El sanatları": "cat.handwerk", "Diğer": "cat.sonstiges",
};

// Hilfsfunktion: Übersetzt einen Roh-Kategoriewert über eine der beiden Maps
export function translateCategory(cat, map, t) {
  if (!cat) return cat;
  const key = map[cat];
  return key ? (t(key) || cat) : cat;
}
