export const CONTENT_TYPES = Object.freeze({
  work: "work",
  experience: "experience",
});

export const CONTENT_DETAIL_CONFIG = Object.freeze({
  work: {
    table: "works",
    typeLabel: "Werk",
    placeholderEmoji: "🎨",
    notFoundTitle: "Werk nicht gefunden",
    notFoundBody: "Dieses Werk existiert nicht mehr oder wurde entfernt.",
    defaultTitle: "Unbekanntes Werk",
    relatedTitle: "Ähnliche Werke",
    detailPath: (id) => `/work/${id}`,
    supportsSocial: true,
    commerce: {
      secondaryLabel: "In den Korb",
      primaryLabel: "Jetzt kaufen ✦",
    },
    select:
      "id,title,description,cover_url,media_url,price,category,tags,status,approval_status,user_id,creator_id,likes_count,created_at,images,caption,location_text,for_sale,medium",
  },
  experience: {
    table: "experiences",
    typeLabel: "Erlebnis",
    placeholderEmoji: "📅",
    notFoundTitle: "Erlebnis nicht gefunden",
    notFoundBody: "Dieses Erlebnis existiert nicht mehr oder wurde entfernt.",
    defaultTitle: "Unbekanntes Erlebnis",
    relatedTitle: "Ähnliche Erlebnisse",
    detailPath: (id) => `/experience/${id}`,
    supportsSocial: false,
    commerce: {
      secondaryLabel: "In den Korb",
      primaryLabel: "Erlebnis buchen ✦",
    },
    select:
      "id,title,description,cover_url,media_url,price,category,status,user_id,created_at,images,location_text,date,duration,max_participants,participant_limit,avail_times,format,booking_mode,experience_type,pricing_type",
  },
});

export function resolveContentType(value) {
  if (value === CONTENT_TYPES.experience) return CONTENT_TYPES.experience;
  return CONTENT_TYPES.work;
}
