// src/lib/mockData.js
// Status: AKTIV — wird als Fallback in FeedCards.jsx + HomeFeed.jsx verwendet
// Kontext: Zeigt Demo-Daten wenn Supabase leer ist oder Verbindung fehlt
// Phase 3D.1: Dokumentiert als legitimer Fallback, kein Legacy

// Wird von mehreren Komponenten verwendet als Fallback bis Supabase-Daten geladen sind

const mockWirkerProfiles = {
  "Lars M.": {
    name: "Lars M.", fullName: "Lars Müller",
    talent: "Keramik-Künstler",
    location: "München", distance: "0 km",
    hourlyRate: "ab 45 €/h",
    memberSince: "März 2024",
    bookings: 41,
    followers: 218,
    recommendations: 34,
    impactEur: 47.25,
    bio: "Ich forme aus Ton Dinge, die bleiben. Handgemachte Keramik und Workshops – jedes Stück ein Unikat, jeder Workshop ein echtes Erlebnis.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    header: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=300&fit=crop",
    skills: ["Keramik", "Töpfern", "Workshops", "Handgemacht", "Unikate"],
    werke: [
      { title: "Handgemachte Schale", price: "55 €", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=80", likes: 89, type: "Werk" },
      { title: "Keramik-Workshop", price: "75 €/Person", img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&q=80", likes: 64, type: "Dienstleistung" },
      { title: "Tassen-Set (2er)", price: "69 €", img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&q=80", likes: 112, type: "Werk" },
    ],
    empfehlungen: [
      { name: "Anna K.", text: "Lars ist ein unglaublich talentierter Keramiker. Der Workshop war das Highlight meines Jahres!", datum: "Apr 2026", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop" },
      { name: "Marc B.", text: "Die Schale ist ein echtes Kunstwerk. Schnelle Lieferung, tolle Verpackung — sehr empfehlenswert!", datum: "Mär 2026", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop" },
    ],
  },
  "Sofia M.": {
    name: "Sofia M.", fullName: "Sofia Mayer",
    img: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop",
    header: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&h=300&fit=crop",
    talent: "Keramik-Künstlerin", location: "München", distance: "12 km",
    memberSince: "März 2024", recommendations: 34, followers: 218, bookings: 41,
    impactEur: "124", hourlyRate: "45 €/Std.", pricePerHour: 45,
    bio: "Ich forme aus Ton Dinge, die bleiben. Jedes Stück entsteht mit Bedacht, mit Liebe und mit den Händen. Meine Werkstatt in München-Schwabing ist mein zweites Zuhause.",
    skills: ["Töpfern", "Glasuren", "Raku-Brennen", "Workshops", "Auftragsarbeiten"],
    werke: [
      { title: "Keramik-Tasse", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&h=300&fit=crop", price: "38 €", shipping: "4,50 €", shippingNote: "Versand innerhalb Deutschlands" },
      { title: "Vase Handgedreht", img: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=300&h=300&fit=crop", price: "65 €", shipping: "5,90 €", shippingNote: "Versand innerhalb Deutschlands" },
      { title: "Schüssel-Set", img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=300&h=300&fit=crop", price: "89 €", shipping: "7,90 €", shippingNote: "Versand innerhalb Deutschlands" },
      { title: "Töpfer-Workshop", img: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&h=300&fit=crop", price: "75 €", shipping: "0 €", shippingNote: "Vor Ort in München" },
    ],
  },
  "Marcus B.": {
    name: "Marcus B.", fullName: "Marcus Braun",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    header: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=300&fit=crop",
    talent: "Fotograf & Videograf", location: "Berlin", distance: "38 km",
    memberSince: "Januar 2024", recommendations: 47, followers: 512, bookings: 89,
    impactEur: "312", hourlyRate: "90 €/Std.", pricePerHour: 90,
    bio: "Ich halte Momente fest, die sonst verschwinden. Portraits, Events, Imagefilme – ich bringe deine Geschichte ans Licht. Mit Kamera und Herz seit 12 Jahren.",
    skills: ["Portrait", "Eventfotografie", "Imagefilm", "Drohne", "Retusche", "Social Media Content"],
    werke: [
      { title: "Portrait-Shooting", img: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=300&h=300&fit=crop", price: "180 €", shipping: "0 €", shippingNote: "Digitale Lieferung per Download" },
      { title: "Event-Paket", img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=300&fit=crop", price: "450 €", shipping: "0 €", shippingNote: "Digitale Lieferung per Download" },
      { title: "Imagefilm (1 Min)", img: "https://images.unsplash.com/photo-1536240478700-b869ad10e2ab?w=300&h=300&fit=crop", price: "890 €", shipping: "0 €", shippingNote: "Digitale Lieferung per Download" },
    ],
  },
  "Maria L.": {
    name: "Maria L.", fullName: "Maria Langner",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    header: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=300&fit=crop",
    talent: "Yoga & Achtsamkeits-Coach", location: "Zürich", distance: "Weltweit",
    memberSince: "Februar 2024", recommendations: 93, followers: 847, bookings: 156,
    impactEur: "567", hourlyRate: "70 €/Std.", pricePerHour: 70,
    bio: "Yoga ist für mich kein Sport – es ist eine Haltung zum Leben. Ich begleite Menschen auf ihrem Weg zu mehr Ruhe, Kraft und Klarheit. Online und in Zürich.",
    skills: ["Hatha Yoga", "Vinyasa", "Meditation", "Atemarbeit", "Online-Coaching", "Retreats"],
    werke: [
      { title: "Einzel-Yoga-Session", img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=300&h=300&fit=crop", price: "70 €", shipping: "0 €", shippingNote: "Online per Video-Call" },
      { title: "4er-Paket Yoga", img: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=300&h=300&fit=crop", price: "250 €", shipping: "0 €", shippingNote: "Online per Video-Call" },
      { title: "Achtsamkeits-Workshop", img: "https://images.unsplash.com/photo-1447452001602-7090c7ab2db3?w=300&h=300&fit=crop", price: "120 €", shipping: "0 €", shippingNote: "Online per Video-Call" },
    ],
  },
  "Tom H.": {
    name: "Tom H.", fullName: "Tom Hartmann",
    talent: "Leder-Handwerker",
    location: "München", distance: "3 km",
    hourlyRate: "ab 55 €/h",
    memberSince: "Januar 2024",
    bookings: 28,
    followers: 142,
    recommendations: 19,
    impactEur: 28.50,
    bio: "Handgefertigte Lederwaren mit Seele – von der Brieftasche bis zum Rucksack. Jedes Stück entsteht in meinem kleinen Münchner Atelier.",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    header: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=300&fit=crop",
    skills: ["Leder", "Handwerk", "Taschen", "Gürtel", "Maßanfertigung"],
    werke: [
      { title: "Leder-Rucksack", price: "195 €", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop", shipping: "6,99 €", likes: 203 },
      { title: "Geldbörse handgenäht", price: "65 €", img: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop", shipping: "3,99 €", likes: 88 },
    ],
    services: [
      { title: "Leder-Workshop", duration: "3h", price: "165 €/Std.", icon: "🛠" },
      { title: "Maßanfertigung", duration: "flexibel", price: "55 €/Std.", icon: "✂️" },
    ],
    pricePerHour: 55,
  },
  "Lena K.": {
    name: "Lena K.", fullName: "Lena Kraus",
    talent: "Aquarell-Illustratorin",
    location: "München", distance: "5 km",
    hourlyRate: "ab 60 €/h",
    memberSince: "Februar 2024",
    bookings: 35,
    followers: 187,
    recommendations: 27,
    impactEur: 35.00,
    bio: "Ich male mit Aquarell – Portraits, Illustrationen, Buchcover. Farbe ist meine Sprache.",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    header: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=800&h=300&fit=crop",
    skills: ["Aquarell", "Illustration", "Portrait", "Buchcover", "Digitale Kunst"],
    werke: [
      { title: "Aquarell-Portrait", price: "120 €", img: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=300&h=300&fit=crop", shipping: "3,99 €", likes: 89 },
      { title: "Buchcover-Illustration", price: "180 €", img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=300&fit=crop", shipping: "0 €", likes: 156 },
    ],
    services: [
      { title: "Illustration-Auftrag", duration: "2h", price: "120 €/Std.", icon: "🎨" },
      { title: "Portrait-Session", duration: "1,5h", price: "60 €/Std.", icon: "🖌" },
    ],
    pricePerHour: 60,
  }
};

export const mockWirkerProfiles_data = mockWirkerProfiles;

export const mockChats = [
  {
    id: 1, wirkerName: "Lars M.", wirkerImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop",
    lastMsg: "Danke für deine Buchung! Ich freue mich auf unser Treffen.", lastTime: "12:34", unread: 1,
    msgs: [
      { id: 1, from: "wirker", text: "Hallo! Ich habe deine Buchungsanfrage erhalten.", time: "12:30" },
      { id: 2, from: "me", text: "Super, freue mich schon!", time: "12:32" },
      { id: 3, from: "wirker", text: "Danke für deine Buchung! Ich freue mich auf unser Treffen.", time: "12:34" },
    ]
  },
  {
    id: 2, wirkerName: "Sophie L.", wirkerImg: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop",
    lastMsg: "Dein Yoga-Kurs ist bestätigt für Freitag 18:00 Uhr.", lastTime: "Gestern", unread: 0,
    msgs: [
      { id: 1, from: "wirker", text: "Dein Yoga-Kurs ist bestätigt für Freitag 18:00 Uhr.", time: "Gestern" },
    ]
  },
  {
    id: 3, wirkerName: "Ben K.", wirkerImg: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop",
    lastMsg: "Das Foto-Shooting war toll! Hier sind die ersten Ergebnisse.", lastTime: "Mo", unread: 0,
    msgs: [
      { id: 1, from: "wirker", text: "Das Foto-Shooting war toll! Hier sind die ersten Ergebnisse.", time: "Mo" },
    ]
  },
];

export default mockWirkerProfiles;