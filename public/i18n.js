/* ═══════════════════════════════════════════════════
   HUI i18n — Language System v2.0
   DE (default) / EN
   
   Architecture:
   - translations = { de: {...}, en: {...} }
   - Same keys in both languages (validated on init)
   - No fallback — missing key = console error
   - Coming-soon runs AFTER translations
   ═══════════════════════════════════════════════════ */

(function(){
  'use strict';

  var STORAGE_KEY = 'hui-language';
  var LANG_DE = 'de';
  var LANG_EN = 'en';

  // ═══════════════════════════════════════════════════
  // TRANSLATION DICTIONARIES
  // DE and EN must have identical key sets
  // ═══════════════════════════════════════════════════

  var DE = {
    'action.1-desc': 'Menschen, Talente, Projekte, Werke und Erlebnisse in deiner Umgebung entdecken.',
    'action.1-title': 'Entdecken',
    'action.2-desc': 'Was du kannst, erschaffst oder anbieten möchtest, sichtbar machen.',
    'action.2-title': 'Zeigen',
    'action.3-desc': 'Ideen unterstützen, Projekte begleiten und selbst etwas beitragen.',
    'action.3-title': 'Mitwirken',
    'action.4-desc': 'Menschen begegnen, Angebote nutzen, gemeinsam etwas unternehmen und neue Erfahrungen machen.',
    'action.4-title': 'Erleben',
    'action.5-desc': 'Sehen, was aus Begegnungen, Unterstützung und gemeinsamen Ideen entsteht.',
    'action.5-title': 'Bewirken',
    'action.h2': 'Bei HUI kannst du etwas bewegen.',
    'action.kicker': 'Was du tun kannst',
    'action.sub': 'Fünf Möglichkeiten, Teil von HUI zu werden.',
    'app.aria-contribute': 'Mitwirken Vorschau anzeigen',
    'app.aria-discover': 'Entdecken Vorschau anzeigen',
    'app.aria-experiences': 'Erlebnisse Vorschau anzeigen',
    'app.aria-impact': 'Wirkung Vorschau anzeigen',
    'app.aria-people': 'Menschen Vorschau anzeigen',
    'app.aria-projects': 'Projekte Vorschau anzeigen',
    'app.aria-talents': 'Talente Vorschau anzeigen',
    'app.aria-works': 'Werke Vorschau anzeigen',
    'app.art': 'Kunst',
    'app.btn': 'HUI entdecken →',
    'app.btn-coming': 'HUI entdecken · bald',
    'app.coaching': 'Coaching',
    'app.contrib1': 'Projekt unterstützen',
    'app.contrib2': 'Talent einbringen',
    'app.contrib3': 'Idee teilen',
    'app.contrib4': 'Veranstaltung mitgestalten',
    'app.craft': 'Handwerk',
    'app.cta': 'Jetzt HUI kennenlernen',
    'app.dance': 'Tanz',
    'app.discover': 'Entdecken',
    'app.discover-hUI': 'Entdecke HUI',
    'app.exp1': 'Gemeinsam kochen',
    'app.exp2': 'Live-Musik',
    'app.exp3': 'Workshop',
    'app.exp4': 'Natur erleben',
    'app.foto': 'Foto',
    'app.h2': 'Alles, was dich bewegt. An einem Ort.',
    'app.impact-encounter': 'Begegnung',
    'app.impact-idea': 'Idee',
    'app.impact-impact': 'Wirkung',
    'app.impact-person': 'Mensch',
    'app.impact-project': 'Projekt',
    'app.intro': 'HUI bringt Menschen, Talente, Projekte, Werke und Erlebnisse zusammen – und macht daraus Möglichkeiten, die du entdecken, erleben und mitgestalten kannst.',
    'app.jonas': 'Jonas',
    'app.jonas-skill': 'Musik',
    'app.kicker': 'Die HUI App',
    'app.lea': 'Lea',
    'app.lea-skill': 'Keramik',
    'app.mara': 'Mara',
    'app.mara-skill': 'Fotografie',
    'app.mitwirken-sub': 'Selbst beitragen',
    'app.mitwirken-title': 'Mitwirken',
    'app.music': 'Musik',
    'app.people': 'Menschen',
    'app.people-sub': 'Menschen entdecken',
    'app.people-title': 'Menschen',
    'app.photo': 'Fotografie',
    'app.proj1': 'Gemeinsam etwas bewegen',
    'app.proj2': 'Ein Ort für Begegnung',
    'app.proj3': 'Kreativität sichtbar machen',
    'app.projects': 'Projekte',
    'app.projects-sub': 'Ideen werden möglich',
    'app.projects-title': 'Projekte',
    'app.tagline': 'Entdecken. Verbinden. Mitmachen. Wirkung erleben.',
    'app.talents': 'Talente',
    'app.talents-sub': 'Vielfalt an Können',
    'app.talents-title': 'Talente',
    'app.tap-hint': 'Tippe auf einen Begriff',
    'app.wirkung-sub': 'Was entsteht daraus?',
    'app.wirkung-title': 'Wirkung',
    'app.works-sub': 'Geschaffen & geteilt',
    'app.works-title': 'Werke',
    'cs.close-aria': 'Schließen',
    'cs.text': 'Die HUI-App befindet sich momentan noch im Aufbau. Wir informieren dich, sobald es losgeht.',
    'cs.title': 'HUI ist bald für dich da.',
    'cta.btn1': 'HUI entdecken →',
    'cta.btn1-coming': 'HUI entdecken · bald',
    'cta.btn2': 'Mitmachen →',
    'cta.h2': 'Vielleicht beginnt deine Geschichte hier.',
    'cta.p': 'HUI entdecken oder mitmachen.',
    'eco.community': 'Gemeinschaft',
    'eco.community-desc': 'Zusammenhalt',
    'eco.companies': 'Unternehmen',
    'eco.companies-desc': 'Partner & Möglichkeiten',
    'eco.connect': 'Keine isolierten Funktionen — ein <strong>verbundenes Ökosystem</strong>, in dem alles miteinander verknüpft ist.',
    'eco.creators': 'Wirker',
    'eco.creators-desc': 'Talente & Können',
    'eco.experiences': 'Erlebnisse',
    'eco.experiences-desc': 'Momente verbinden',
    'eco.flow1': 'Was einer gibt, begegnet einem anderen.',
    'eco.flow2': 'Was entsteht, bleibt sichtbar.',
    'eco.h2': 'Die Welt von HUI',
    'eco.intro': 'HUI verbindet Menschen, Ideen und Möglichkeiten in einem lebendigen Ökosystem.',
    'eco.kicker': 'Das Ökosystem',
    'eco.people': 'Menschen',
    'eco.people-desc': 'Jeder Mensch zählt',
    'eco.projects': 'Projekte',
    'eco.projects-desc': 'Ideen werden möglich',
    'eco.works': 'Werke',
    'eco.works-desc': 'Geschaffen & geteilt',
    'footer.col1': 'HUI',
    'footer.col1-1': 'Über HUI',
    'footer.col1-2': 'Entdecken',
    'footer.col1-3': 'Wie HUI wirkt',
    'footer.col1-4': 'Mitmachen',
    'footer.col1-5': 'HUI entdecken',
    'footer.col2': 'Rechtliches',
    'footer.col2-1': 'Impressum',
    'footer.col2-2': 'Datenschutz',
    'footer.col2-3': 'Cookie-Einstellungen',
    'footer.col2-4': 'Nutzungsbedingungen',
    'footer.col2-5': 'Barrierefreiheit',
    'footer.col3': 'Kontakt & Verbindungen',
    'footer.col3-1': 'Kontakt',
    'footer.copy': '© 2026 HUI — Human United Intelligence.',
    'footer.tag': 'Human United Intelligence — Menschen. Ideen. Möglichkeiten.',
    'hero.badge': 'HUI — Human United Intelligence',
    'hero.btn-primary': 'HUI entdecken →',
    'hero.btn-primary-coming': 'HUI entdecken · bald',
    'hero.btn-secondary': 'So funktioniert HUI ↓',
    'hero.line1': 'Menschen.',
    'hero.line2': 'Ideen.',
    'hero.line3': 'Möglichkeiten.',
    'hero.scroll': 'Scrollen',
    'hero.tagline': 'Gemeinsam entsteht Wirkung.',
    'honest.h2': 'Wir fangen gerade erst an.',
    'honest.kicker': 'Ehrlich',
    'honest.p1': 'HUI ist noch jung. Viele der Geschichten, die hier einmal sichtbar werden, sind noch nicht geschrieben.',
    'honest.p2': 'Und genau das macht es spannend.',
    'honest.text': 'HUI ist noch jung. Viele der Geschichten, die hier einmal sichtbar werden, sind noch nicht geschrieben.<br><br><span class="em">Und genau das macht es spannend.',
    'how.h2': 'Eine Idee kann etwas bewegen.',
    'how.kicker': 'Wie HUI wirkt',
    'how.step1-desc': 'Menschen, Talente, Projekte, Werke und Erlebnisse entdecken.',
    'how.step1-num': '01',
    'how.step1-title': 'Entdecken',
    'how.step2-desc': 'Menschen und Ideen miteinander verbinden.',
    'how.step2-num': '02',
    'how.step2-title': 'Begegnen',
    'how.step3-desc': 'Etwas beitragen, unterstützen, erschaffen oder erleben.',
    'how.step3-num': '03',
    'how.step3-title': 'Mitwirken',
    'how.step4-desc': 'Aus Begegnungen entsteht etwas, das über die Plattform hinausgeht.',
    'how.step4-num': '04',
    'how.step4-title': 'Wirkung',
    'impact.a1': 'Talente, die sich ohne HUI vielleicht nie begegnet wären.',
    'impact.a2': 'Ideen, die durch gemeinschaftliche Unterstützung Wirklichkeit werden.',
    'impact.a3': 'Geschaffenes, das nicht in der Schublade bleibt, sondern geteilt wird.',
    'impact.a4': 'Etwas, das über die Plattform hinausgeht — ins echte Leben.',
    'impact.h2': 'Was entsteht daraus?',
    'impact.kicker': 'Wirkung',
    'impact.q1': 'Welche Menschen begegnen sich?',
    'impact.q2': 'Welche Projekte werden möglich?',
    'impact.q3': 'Welche Werke erreichen Menschen?',
    'impact.q4': 'Welche Wirkung bleibt?',
    'lang.de': 'DE',
    'lang.en': 'EN',
    'lang.switch-aria': 'Sprache wechseln',
    'legal.back': '← Zurück zur Startseite',
    'legal.back-bottom': 'Zurück zur Startseite',
    'meta.description': 'HUI verbindet Menschen, Talente, Projekte, Werke und Erlebnisse. Gemeinsam entsteht Wirkung.',
    'meta.og-description': 'Menschen. Ideen. Möglichkeiten. Gemeinsam entsteht Wirkung.',
    'meta.og-title': 'HUI — Human United Intelligence',
    'meta.title': 'HUI — Human United Intelligence',
    'nav.about': 'Über HUI',
    'nav.cta': 'HUI entdecken →',
    'nav.cta-coming': 'HUI entdecken · bald',
    'nav.discover': 'Entdecken',
    'nav.how': 'Wie HUI wirkt',
    'nav.join': 'Mitmachen',
    'nav.menu-aria': 'Menü',
    'origin.alt-4v': 'Siegel 4VisionGlobal',
    'origin.alt-liga': 'Siegel Liga der Kreativen',
    'origin.btn-4v': '4VisionGlobal entdecken →',
    'origin.btn-liga': 'Liga der Kreativen entdecken →',
    'origin.claim-1': 'Einer für Alle,<br>alle Fair(ein)t',
    'origin.claim-2': 'alle Fair(ein)t',
    'origin.closing': 'Aus einer gemeinsamen Idee wurde ein Ökosystem für Menschen, Talente, Ideen und Möglichkeiten.',
    'origin.clubs-4v': '4VisionGlobal',
    'origin.clubs-label': 'Getragen von den Vereinen',
    'origin.clubs-liga': 'Liga der Kreativen',
    'origin.h2': 'HUI begann mit einer gemeinsamen Idee.',
    'origin.kicker': 'Die Idee dahinter',
    'origin.text-1': 'HUI ist aus dem Projekt „Einer für Alle, alle Fair(ein)t" entstanden. Aus dieser Idee wuchs der Wunsch, Menschen nicht nur für ein Projekt, sondern dauerhaft zusammenzubringen.',
    'origin.text-2': 'Aus diesem Projekt entstand die Idee für HUI – Human United Intelligence.',
    'vision.answer': 'Genau dafür entsteht HUI.',
    'vision.h2': 'Was wäre, wenn …?',
    'vision.kicker': 'Eine Frage',
    'vision.q1': 'Was wäre, wenn Menschen und ihre Talente <span class="mark">sichtbar',
    'vision.q2': 'Was wäre, wenn Ideen nicht einfach <span class="mark">verschwinden',
    'vision.q3': 'Was wäre, wenn aus einer Begegnung etwas <span class="mark">entsteht',
    'vision.q4': 'Was wäre, wenn Wirkung nicht nur versprochen, sondern <span class="mark">sichtbar',
  };

  var EN = {
    'action.1-desc': 'Discover people, talents, projects, works, and experiences near you.',
    'action.1-title': 'Discover',
    'action.2-desc': 'Make your skills, creations, or offerings visible.',
    'action.2-title': 'Show',
    'action.3-desc': 'Support ideas, accompany projects, and contribute.',
    'action.3-title': 'Get involved',
    'action.4-desc': 'Meet people, use offerings, do things together, and gain new experiences.',
    'action.4-title': 'Experience',
    'action.5-desc': 'See what emerges from connections, support, and shared ideas.',
    'action.5-title': 'Create impact',
    'action.h2': 'You can make a difference with HUI.',
    'action.kicker': 'What you can do',
    'action.sub': 'Five ways to be part of HUI.',
    'app.aria-contribute': 'Show Get Involved preview',
    'app.aria-discover': 'Show Discover preview',
    'app.aria-experiences': 'Show Experiences preview',
    'app.aria-impact': 'Show Impact preview',
    'app.aria-people': 'Show People preview',
    'app.aria-projects': 'Show Projects preview',
    'app.aria-talents': 'Show Talents preview',
    'app.aria-works': 'Show Works preview',
    'app.art': 'Art',
    'app.btn': 'Discover HUI →',
    'app.btn-coming': 'Discover HUI · coming soon',
    'app.coaching': 'Coaching',
    'app.contrib1': 'Support a project',
    'app.contrib2': 'Share a talent',
    'app.contrib3': 'Share an idea',
    'app.contrib4': 'Co-create an event',
    'app.craft': 'Craft',
    'app.cta': 'Get to know HUI',
    'app.dance': 'Dance',
    'app.discover': 'Discover',
    'app.discover-hUI': 'Explore HUI',
    'app.exp1': 'Cooking together',
    'app.exp2': 'Live music',
    'app.exp3': 'Workshop',
    'app.exp4': 'Nature experiences',
    'app.foto': 'Photo',
    'app.h2': 'Everything that moves you. In one place.',
    'app.impact-encounter': 'Connection',
    'app.impact-idea': 'Idea',
    'app.impact-impact': 'Impact',
    'app.impact-person': 'Person',
    'app.impact-project': 'Project',
    'app.intro': 'HUI brings people, talents, projects, works, and experiences together — and turns them into possibilities you can discover, experience, and help shape.',
    'app.jonas': 'Jonas',
    'app.jonas-skill': 'Music',
    'app.kicker': 'The HUI App',
    'app.lea': 'Lea',
    'app.lea-skill': 'Ceramics',
    'app.mara': 'Mara',
    'app.mara-skill': 'Photography',
    'app.mitwirken-sub': 'Contribute yourself',
    'app.mitwirken-title': 'Get involved',
    'app.music': 'Music',
    'app.people': 'People',
    'app.people-sub': 'Discover people',
    'app.people-title': 'People',
    'app.photo': 'Photography',
    'app.proj1': 'Moving something together',
    'app.proj2': 'A space for connection',
    'app.proj3': 'Making creativity visible',
    'app.projects': 'Projects',
    'app.projects-sub': 'Ideas made possible',
    'app.projects-title': 'Projects',
    'app.tagline': 'Discover. Connect. Get involved. See the impact.',
    'app.talents': 'Talents',
    'app.talents-sub': 'A diversity of skills',
    'app.talents-title': 'Talents',
    'app.tap-hint': 'Tap a term',
    'app.wirkung-sub': 'What emerges from it?',
    'app.wirkung-title': 'Impact',
    'app.works-sub': 'Created & shared',
    'app.works-title': 'Works',
    'cs.close-aria': 'Close',
    'cs.text': 'The HUI app is currently being built. We’ll let you know as soon as it’s ready.',
    'cs.title': 'HUI will be here for you soon.',
    'cta.btn1': 'Discover HUI →',
    'cta.btn1-coming': 'Discover HUI · coming soon',
    'cta.btn2': 'Get involved →',
    'cta.h2': 'Perhaps your story begins here.',
    'cta.p': 'Discover HUI or get involved.',
    'eco.community': 'Community',
    'eco.community-desc': 'A shared sense of belonging',
    'eco.companies': 'Organisations',
    'eco.companies-desc': 'Partners & opportunities',
    'eco.connect': 'Not isolated features — a <strong>connected ecosystem</strong>, where everything is linked.',
    'eco.creators': 'Creators',
    'eco.creators-desc': 'Talents & skills',
    'eco.experiences': 'Experiences',
    'eco.experiences-desc': 'Moments that connect',
    'eco.flow1': 'What one person gives, another encounters.',
    'eco.flow2': 'What is created, stays visible.',
    'eco.h2': 'The world of HUI',
    'eco.intro': 'HUI connects people, ideas, and possibilities in a living ecosystem.',
    'eco.kicker': 'The ecosystem',
    'eco.people': 'People',
    'eco.people-desc': 'Every person counts',
    'eco.projects': 'Projects',
    'eco.projects-desc': 'Ideas made possible',
    'eco.works': 'Works',
    'eco.works-desc': 'Created & shared',
    'footer.col1': 'HUI',
    'footer.col1-1': 'About HUI',
    'footer.col1-2': 'Discover',
    'footer.col1-3': 'How HUI works',
    'footer.col1-4': 'Get involved',
    'footer.col1-5': 'Discover HUI',
    'footer.col2': 'Legal',
    'footer.col2-1': 'Legal Notice',
    'footer.col2-2': 'Privacy Policy',
    'footer.col2-3': 'Cookie Settings',
    'footer.col2-4': 'Terms of Use',
    'footer.col2-5': 'Accessibility',
    'footer.col3': 'Contact & Connections',
    'footer.col3-1': 'Contact',
    'footer.copy': '© 2026 HUI — Human United Intelligence.',
    'footer.tag': 'Human United Intelligence — People. Ideas. Possibilities.',
    'hero.badge': 'HUI — Human United Intelligence',
    'hero.btn-primary': 'Discover HUI →',
    'hero.btn-primary-coming': 'Discover HUI · coming soon',
    'hero.btn-secondary': 'How HUI works ↓',
    'hero.line1': 'People.',
    'hero.line2': 'Ideas.',
    'hero.line3': 'Possibilities.',
    'hero.scroll': 'Scroll',
    'hero.tagline': 'Together, we create impact.',
    'honest.h2': 'We’re just getting started.',
    'honest.kicker': 'Honest',
    'honest.p1': 'HUI is still young. Many of the stories that will one day become visible here have yet to be written.',
    'honest.p2': 'And that’s exactly what makes it exciting.',
    'honest.text': 'HUI is still young. Many of the stories that will one day become visible here have yet to be written.<br><br><span class="em">And that’s exactly what makes it exciting.</span>',
    'how.h2': 'An idea can move something.',
    'how.kicker': 'How HUI works',
    'how.step1-desc': 'Discover people, talents, projects, works, and experiences.',
    'how.step1-num': '01',
    'how.step1-title': 'Discover',
    'how.step2-desc': 'Bring people and ideas together.',
    'how.step2-num': '02',
    'how.step2-title': 'Connect',
    'how.step3-desc': 'Contribute, support, create, or experience.',
    'how.step3-num': '03',
    'how.step3-title': 'Get involved',
    'how.step4-desc': 'From connections, something emerges that goes beyond the platform.',
    'how.step4-num': '04',
    'how.step4-title': 'Impact',
    'impact.a1': 'Talents that might never have crossed paths without HUI.',
    'impact.a2': 'Ideas that become reality through collective support.',
    'impact.a3': 'Creations that don’t stay in a drawer, but get shared.',
    'impact.a4': 'Something that goes beyond the platform — into real life.',
    'impact.h2': 'What can emerge from this?',
    'impact.kicker': 'Impact',
    'impact.q1': 'Which people meet?',
    'impact.q2': 'Which projects become possible?',
    'impact.q3': 'Which works reach people?',
    'impact.q4': 'What impact lasts?',
    'lang.de': 'DE',
    'lang.en': 'EN',
    'lang.switch-aria': 'Switch language',
    'legal.back': '← Back to home',
    'legal.back-bottom': 'Back to home',
    'meta.description': 'HUI connects people, talents, projects, works, and experiences. Together, we create impact.',
    'meta.og-description': 'People. Ideas. Possibilities. Together, we create impact.',
    'meta.og-title': 'HUI — Human United Intelligence',
    'meta.title': 'HUI — Human United Intelligence',
    'nav.about': 'About HUI',
    'nav.cta': 'Discover HUI →',
    'nav.cta-coming': 'Discover HUI · coming soon',
    'nav.discover': 'Discover',
    'nav.how': 'How HUI works',
    'nav.join': 'Get involved',
    'nav.menu-aria': 'Menu',
    'origin.alt-4v': 'Seal of 4VisionGlobal',
    'origin.alt-liga': 'Seal of Liga der Kreativen',
    'origin.btn-4v': 'Discover 4VisionGlobal →',
    'origin.btn-liga': 'Discover Liga der Kreativen →',
    'origin.claim-1': 'One for all,',
    'origin.claim-2': 'all playing fair',
    'origin.closing': 'From a shared idea, an ecosystem for people, talents, ideas, and possibilities emerged.',
    'origin.clubs-4v': '4VisionGlobal',
    'origin.clubs-label': 'Supported by the associations',
    'origin.clubs-liga': 'Liga der Kreativen',
    'origin.h2': 'HUI began with a shared idea.',
    'origin.kicker': 'The idea behind it',
    'origin.text-1': 'HUI grew out of the project “Einer für Alle, alle Fair(ein)t.” From this idea came the desire to bring people together — not just for a single project, but for the long term.',
    'origin.text-2': 'From this project, the idea for HUI — Human United Intelligence was born.',
    'vision.answer': 'That’s what HUI is for.',
    'vision.h2': 'What if…?',
    'vision.kicker': 'A question',
    'vision.q1': 'What if people and their talents became <span class="mark">visible</span>?',
    'vision.q2': 'What if ideas didn\'t simply <span class="mark">disappear</span>?',
    'vision.q3': 'What if something <span class="mark">emerges</span> from an encounter?',
    'vision.q4': 'What if impact isn\'t just promised, but made <span class="mark">visible</span>?',
  };

  var T = {};
  T[LANG_DE] = DE;
  T[LANG_EN] = EN;

  // ── Key validation ──
  function validateKeys(){
    var deKeys = Object.keys(DE).sort();
    var enKeys = Object.keys(EN).sort();
    var errors = [];
    var i, j = 0;
    for(i = 0; i < deKeys.length; i++){
      if(enKeys.indexOf(deKeys[i]) === -1)
        errors.push('Missing EN key: ' + deKeys[i]);
    }
    for(i = 0; i < enKeys.length; i++){
      if(deKeys.indexOf(enKeys[i]) === -1)
        errors.push('Missing DE key: ' + enKeys[i]);
    }
    if(errors.length > 0){
      console.error('[HUI i18n] Key mismatch (' + errors.length + ' errors):');
      errors.forEach(function(e){ console.error('  ' + e); });
    }
    return errors.length === 0;
  }

  // ── Get current language ──
  function getLang(){
    var path = window.location.pathname;
    if(path.indexOf('/en/') === 0 || path === '/en') return LANG_EN;
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if(saved === LANG_EN) return LANG_EN;
    } catch(e){}
    return LANG_DE;
  }

  // ── Set language ──
  function setLang(lang){
    try { localStorage.setItem(STORAGE_KEY, lang); } catch(e){}
  }

  // ═══════════════════════════════════════════════════
  // APPLY TRANSLATIONS
  // Applies ALL translations for the given language
  // Works for BOTH DE and EN — no "DE is default" assumption
  // ═══════════════════════════════════════════════════

  function applyTranslations(lang){
    var dict = T[lang] || T[LANG_DE];

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var key = el.getAttribute('data-i18n');
      if(dict[key]) {
        el.textContent = dict[key];
      } else {
        console.error('[HUI i18n] Missing key: ' + key + ' for lang: ' + lang);
      }
    });

    // HTML content
    document.querySelectorAll('[data-i18n-html]').forEach(function(el){
      var key = el.getAttribute('data-i18n-html');
      if(dict[key]) {
        el.innerHTML = dict[key];
      } else {
        console.error('[HUI i18n] Missing key: ' + key + ' for lang: ' + lang);
      }
    });

    // aria-label
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el){
      var key = el.getAttribute('data-i18n-aria');
      if(dict[key]) {
        el.setAttribute('aria-label', dict[key]);
      }
    });

    // alt
    document.querySelectorAll('[data-i18n-alt]').forEach(function(el){
      var key = el.getAttribute('data-i18n-alt');
      if(dict[key]) {
        el.setAttribute('alt', dict[key]);
      }
    });

    // placeholder
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
      var key = el.getAttribute('data-i18n-ph');
      if(dict[key]) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // Document title
    if(dict['meta.title']) document.title = dict['meta.title'];

    // Meta description
    var metaDesc = document.querySelector('meta[name="description"]');
    if(metaDesc && dict['meta.description']) metaDesc.setAttribute('content', dict['meta.description']);

    // OG tags
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if(ogTitle && dict['meta.og-title']) ogTitle.setAttribute('content', dict['meta.og-title']);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if(ogDesc && dict['meta.og-description']) ogDesc.setAttribute('content', dict['meta.og-description']);

    // Coming-soon toast
    var toastH = document.querySelector('#csToast h4');
    if(toastH && dict['cs.title']) toastH.textContent = dict['cs.title'];
    var toastP = document.querySelector('#csToast p');
    if(toastP && dict['cs.text']) toastP.textContent = dict['cs.text'];
    var toastClose = document.getElementById('csToastClose');
    if(toastClose && dict['cs.close-aria']) toastClose.setAttribute('aria-label', dict['cs.close-aria']);

    // Apply coming-soon text AFTER translations
    applyComingSoon(lang);

    // Update footer legal links
    updateFooterLegalLinks(lang);

    // Update switcher visual state
    updateSwitcherState();

    // Update html lang attribute
    document.documentElement.setAttribute('lang', lang);
  }

  // ═══════════════════════════════════════════════════
  // COMING-SOON SYSTEM
  // Runs AFTER translations to override button text
  // ═══════════════════════════════════════════════════

  function applyComingSoon(lang){
    var suffix = (lang === LANG_EN) ? ' · coming soon' : ' · bald';
    document.querySelectorAll('.coming-soon').forEach(function(link){
      var t = link.textContent.trim();
      // Already has the correct suffix — skip
      if(lang === LANG_EN && t.indexOf('coming soon') > -1) return;
      if(lang === LANG_DE && t.indexOf('· bald') > -1) return;
      
      // Remove any existing coming-soon suffix
      t = t.replace(/\s*·\s*(coming soon|bald(?!\s)|bald\s*verf\u00fcgbar|verf\u00fcgbar)/g, '').trim();
      // Remove trailing arrow
      t = t.replace(/→$/g, '').trim();
      // Remove trailing →
      t = t.replace(/\u2192$/g, '').trim();
      
      // Append the correct suffix
      link.textContent = t + suffix;
    });
  }

  // ── Update footer legal links ──
  function updateFooterLegalLinks(lang){
    var linkMap = {
      '/impressum': '/en/imprint',
      '/datenschutz': '/en/privacy',
      '/cookie-einstellungen': '/en/cookie-settings',
      '/nutzungsbedingungen': '/en/terms',
      '/barrierefreiheit': '/en/accessibility',
      '/kontakt': '/en/contact'
    };
    var reverseMap = {
      '/en/imprint': '/impressum',
      '/en/privacy': '/datenschutz',
      '/en/cookie-settings': '/cookie-einstellungen',
      '/en/terms': '/nutzungsbedingungen',
      '/en/accessibility': '/barrierefreiheit',
      '/en/contact': '/kontakt'
    };
    var map = (lang === LANG_EN) ? linkMap : reverseMap;
    document.querySelectorAll('a.footer-link, a[href^="/impressum"], a[href^="/datenschutz"], a[href^="/cookie-einstellungen"], a[href^="/nutzungsbedingungen"], a[href^="/barrierefreiheit"], a[href^="/kontakt"], a[href^="/en/imprint"], a[href^="/en/privacy"], a[href^="/en/cookie-settings"], a[href^="/en/terms"], a[href^="/en/accessibility"], a[href^="/en/contact"]').forEach(function(link){
      var href = link.getAttribute('href');
      if(href && map[href]){
        link.setAttribute('href', map[href]);
      }
    });
  }

  // ── Update switcher visual state ──
  function updateSwitcherState(){
    var lang = getLang();
    document.querySelectorAll('.lang-switch').forEach(function(sw){
      var deBtn = sw.querySelector('[data-lang="de"]');
      var enBtn = sw.querySelector('[data-lang="en"]');
      if(deBtn) deBtn.classList.toggle('lang-active', lang === LANG_DE);
      if(enBtn) enBtn.classList.toggle('lang-active', lang === LANG_EN);
    });
  }

  // ═══════════════════════════════════════════════════
  // LANGUAGE SWITCHER
  // ═══════════════════════════════════════════════════

  var LEGAL_DE_TO_EN = {
    '/impressum': '/en/imprint',
    '/datenschutz': '/en/privacy',
    '/cookie-einstellungen': '/en/cookie-settings',
    '/nutzungsbedingungen': '/en/terms',
    '/barrierefreiheit': '/en/accessibility',
    '/kontakt': '/en/contact'
  };
  var LEGAL_EN_TO_DE = {
    '/en/imprint': '/impressum',
    '/en/privacy': '/datenschutz',
    '/en/cookie-settings': '/cookie-einstellungen',
    '/en/terms': '/nutzungsbedingungen',
    '/en/accessibility': '/barrierefreiheit',
    '/en/contact': '/kontakt'
  };

  function isLegalPage(){
    var path = window.location.pathname;
    return LEGAL_DE_TO_EN.hasOwnProperty(path) || LEGAL_EN_TO_DE.hasOwnProperty(path);
  }

  function getLegalRedirect(lang){
    var path = window.location.pathname;
    if(lang === LANG_EN && LEGAL_DE_TO_EN[path]) return LEGAL_DE_TO_EN[path];
    if(lang === LANG_DE && LEGAL_EN_TO_DE[path]) return LEGAL_EN_TO_DE[path];
    return null;
  }

  function injectSwitcher(){
    var css = document.createElement('style');
    css.textContent = `
.lang-switch{display:inline-flex;align-items:center;gap:2px;padding:3px;border-radius:999px;background:rgba(20,20,34,.04);border:1px solid rgba(20,20,34,.06);margin-left:16px;vertical-align:middle}
.lang-switch button{background:none;border:none;font-size:11px;font-weight:600;letter-spacing:.5px;padding:4px 9px;border-radius:999px;cursor:pointer;color:var(--muted,#8A8A9E);transition:color .2s,background .2s;font-family:inherit;line-height:1}
.lang-switch button.lang-active{background:var(--teal,#0DC4B5);color:#fff}
.lang-switch button:hover:not(.lang-active){color:var(--ink,#141422)}
.nav-links .lang-switch{margin-left:16px}
#drawer .lang-switch{margin:16px 20px 0;width:fit-content}
@media(max-width:768px){.nav-links .lang-switch{display:none}
#drawer .lang-switch{display:inline-flex}}`;
    document.head.appendChild(css);

    var switcherHTML = '<span class="lang-switch" role="group" aria-label="Language">' +
      '<button type="button" data-lang="de" aria-label="Deutsch">DE</button>' +
      '<button type="button" data-lang="en" aria-label="English">EN</button>' +
      '</span>';

    // Desktop nav
    var navLinks = document.querySelector('.nav-links');
    if(navLinks){
      var navSwitch = document.createElement('span');
      navSwitch.innerHTML = switcherHTML;
      navLinks.appendChild(navSwitch.firstChild);
    }

    // Mobile drawer
    var drawer = document.getElementById('drawer');
    if(drawer){
      var drawerSwitch = document.createElement('span');
      drawerSwitch.innerHTML = switcherHTML;
      drawer.appendChild(drawerSwitch.firstChild);
    }

    // Legal pages
    var legalNav = document.querySelector('.legal-nav-back');
    if(legalNav && !document.querySelector('.lang-switch')){
      var legalSwitch = document.createElement('span');
      legalSwitch.innerHTML = switcherHTML;
      legalNav.appendChild(legalSwitch.firstChild);
    }

    // Wire up clicks
    document.querySelectorAll('.lang-switch button').forEach(function(btn){
      btn.addEventListener('click', function(){
        var lang = btn.getAttribute('data-lang');
        setLang(lang);
        
        // Legal page: redirect to the other language version
        if(isLegalPage()){
          var redirect = getLegalRedirect(lang);
          if(redirect){
            window.location.href = redirect;
            return;
          }
        }
        
        // Landing page: apply translations atomically
        applyTranslations(lang);
      });
    });

    updateSwitcherState();
  }

  // ═══════════════════════════════════════════════════
  // INIT
  // Order: validate keys → inject switcher → determine language → apply
  // ═══════════════════════════════════════════════════

  function init(){
    validateKeys();
    injectSwitcher();
    var lang = getLang();
    
    if(isLegalPage()){
      // On legal pages: if saved language doesn't match current URL, redirect
      if(lang === LANG_EN){
        var redirect = getLegalRedirect(LANG_EN);
        if(redirect){
          window.location.href = redirect;
          return;
        }
      }
      // On EN legal page with DE saved: redirect to DE version
      var path = window.location.pathname;
      if(lang === LANG_DE && LEGAL_EN_TO_DE[path]){
        window.location.href = LEGAL_EN_TO_DE[path];
        return;
      }
      // Otherwise: just update switcher state (content is in the HTML)
      return;
    }
    
    // Landing page: apply translations for current language
    applyTranslations(lang);
  }

  // Wait for DOMContentLoaded + all synchronous handlers (including coming-soon JS)
  // before applying translations. This ensures coming-soon modifications happen
  // first, then i18n overrides them with the correct language.
  function runAfterReady(){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', function(){
        setTimeout(init, 0);
      });
    } else {
      setTimeout(init, 0);
    }
  }

  runAfterReady();

  // Expose for debugging
  window.HUI_i18n = { getLang: getLang, setLang: setLang, apply: applyTranslations, validate: validateKeys };
})();
