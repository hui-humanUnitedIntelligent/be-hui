/* ═══════════════════════════════════════════════════
   HUI Stories — zentrale Datenstruktur der Video-Geschichten
   für die Entdecken-Seite (/entdecken)

   WIE NEUE GESCHICHTEN ERGÄNZT WERDEN:
   1. Neuen Eintrag in dieses Array aufnehmen (id, Video-ID etc.)
   2. In entdecken.html eine Karte mit data-story="<id>" ergänzen
   3. i18n-Keys disc.story.<id>.* in i18n.js (DE + EN) hinzufügen

   Nur echte, tatsächlich existierende YouTube-Videos hinterlegen.
   Keine Platzhalter, keine erfundenen IDs.
   ═══════════════════════════════════════════════════ */

(function(){
  'use strict';

  window.HUI_STORIES = {

    // Offizieller HUI-YouTube-Kanal (einziger externer Video-Zielort)
    channel: {
      name: 'HUI-Human United Intelligence',
      handle: '@be-HUI',
      url: 'https://www.youtube.com/@be-HUI'
    },

    stories: [
      {
        id: 'nicole-wildwiesenwissen',
        title: 'Nicole von WildWiesenWissen – Die Natur wieder mit anderen Augen sehen',
        youtubeVideoId: 'GmaFnRdc2fo',
        youtubeUrl: 'https://www.youtube.com/watch?v=GmaFnRdc2fo',
        embedUrl: 'https://www.youtube-nocookie.com/embed/GmaFnRdc2fo',
        person: 'Nicole',
        role: 'Naturvermittlerin',
        category: 'Talent',
        project: 'WildWiesenWissen',
        description: 'Nicole ist Naturvermittlerin. Im Gespräch mit HUI-Botschafter Tilo erzählt sie, was WildWiesenWissen verbindet — und wie wir die Natur direkt vor unserer Haustür wieder mit anderen Augen sehen können.',
        thumbnail: '/assets/story-nicole-thumb.webp',
        duration: '9:06',
        publishedAt: '2026-09-11',
        featured: true
      },
      {
        id: 'kay-dance4vision',
        title: 'HUI Botschafter Tilo – im Gespräch mit Projektleiter Kay von @Dance4Vision',
        youtubeVideoId: 't8aHoQKBZ9k',
        youtubeUrl: 'https://www.youtube.com/watch?v=t8aHoQKBZ9k',
        embedUrl: 'https://www.youtube-nocookie.com/embed/t8aHoQKBZ9k',
        person: 'Kay',
        role: 'Projektleiter',
        category: 'Talent',
        project: 'Dance4Vision',
        description: 'Kay leitet Dance4Vision, ein Projekt von 4VisionGlobal, das Menschen durch Tanz, Bewegung und gemeinsames Erleben verbindet. Im Gespräch mit HUI-Botschafter Tilo geht es um sein Talent, seine Erfahrungen — und darum, was entsteht, wenn Fähigkeiten sichtbar werden.',
        thumbnail: '/assets/story-kay-thumb.webp',
        duration: '10:14',
        publishedAt: '2026-09-11',
        featured: true
      }
    ]
  };
})();
