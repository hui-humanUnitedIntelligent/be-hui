/* ═══════════════════════════════════════════════════
   HUI i18n — Language System
   DE (default) / EN
   ═══════════════════════════════════════════════════ */

(function(){
  'use strict';

  var STORAGE_KEY = 'hui-language';
  var LANG_DE = 'de';
  var LANG_EN = 'en';

  // ── Get current language ──
  function getLang(){
    // Check URL for /en/ prefix first
    var path = window.location.pathname;
    if(path.indexOf('/en/') === 0 || path === '/en') return LANG_EN;
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if(saved === LANG_EN) return LANG_EN;
    } catch(e){}
    return LANG_DE; // default
  }

  // ── Set language ──
  function setLang(lang){
    try { localStorage.setItem(STORAGE_KEY, lang); } catch(e){}
  }

  // ═══════════════════════════════════════════════════
  // TRANSLATION DICTIONARY
  // ═══════════════════════════════════════════════════

  var EN = {
    // ── Meta ──
    'meta.title': 'HUI — Human United Intelligence',
    'meta.description': 'HUI connects people, talents, projects, works, and experiences. Together, we create impact.',
    'meta.og-title': 'HUI — Human United Intelligence',
    'meta.og-description': 'People. Ideas. Possibilities. Together, we create impact.',

    // ── Nav ──
    'nav.about': 'About HUI',
    'nav.discover': 'Discover',
    'nav.how': 'How HUI works',
    'nav.join': 'Get involved',
    'nav.cta': 'Discover HUI →',
    'nav.cta-coming': 'Discover HUI · coming soon',
    'nav.menu-aria': 'Menu',

    // ── Hero ──
    'hero.badge': 'HUI — Human United Intelligence',
    'hero.line1': 'People.',
    'hero.line2': 'Ideas.',
    'hero.line3': 'Possibilities.',
    'hero.tagline': 'Together, we create impact.',
    'hero.btn-primary': 'Discover HUI →',
    'hero.btn-primary-coming': 'Discover HUI · coming soon',
    'hero.btn-secondary': 'How HUI works ↓',
    'hero.scroll': 'Scroll',

    // ── Section 1: A Question ──
    'vision.kicker': 'A question',
    'vision.h2': 'What if…?',
    'vision.q1': 'What if people and their talents became <span class="mark">visible</span>?',
    'vision.q2': 'What if ideas didn\'t simply <span class="mark">disappear</span>?',
    'vision.q3': 'What if something <span class="mark">emerges</span> from an encounter?',
    'vision.q4': 'What if impact isn\'t just promised, but made <span class="mark">visible</span>?',
    'vision.answer': 'That’s what HUI is for.',

    // ── Section 2: Ecosystem ──
    'eco.kicker': 'The ecosystem',
    'eco.h2': 'The world of HUI',
    'eco.intro': 'HUI connects people, ideas, and possibilities in a living ecosystem.',
    'eco.people': 'People',
    'eco.people-desc': 'Every person counts',
    'eco.creators': 'Creators',
    'eco.creators-desc': 'Talents & skills',
    'eco.projects': 'Projects',
    'eco.projects-desc': 'Ideas made possible',
    'eco.works': 'Works',
    'eco.works-desc': 'Created & shared',
    'eco.experiences': 'Experiences',
    'eco.experiences-desc': 'Moments that connect',
    'eco.companies': 'Organisations',
    'eco.companies-desc': 'Partners & opportunities',
    'eco.community': 'Community',
    'eco.community-desc': 'A shared sense of belonging',
    'eco.connect': 'Not isolated features — a <strong>connected ecosystem</strong>, where everything is linked.',
    'eco.flow1': 'What one person gives, another encounters.',
    'eco.flow2': 'What is created, stays visible.',

    // ── HUI App Section ──
    'app.kicker': 'The HUI App',
    'app.h2': 'Everything that moves you. In one place.',
    'app.intro': 'HUI brings people, talents, projects, works, and experiences together — and turns them into possibilities you can discover, experience, and help shape.',
    'app.tagline': 'Discover. Connect. Get involved. See the impact.',
    'app.discover': 'Discover',
    'app.people': 'People',
    'app.talents': 'Talents',
    'app.projects': 'Projects',
    'app.discover-hUI': 'Explore HUI',
    'app.tap-hint': 'Tap a term',
    'app.people-title': 'People',
    'app.people-sub': 'Discover people',
    'app.mara': 'Mara',
    'app.mara-skill': 'Photography',
    'app.jonas': 'Jonas',
    'app.jonas-skill': 'Music',
    'app.lea': 'Lea',
    'app.lea-skill': 'Ceramics',
    'app.talents-title': 'Talents',
    'app.talents-sub': 'A diversity of skills',
    'app.music': 'Music',
    'app.photo': 'Photography',
    'app.craft': 'Craft',
    'app.coaching': 'Coaching',
    'app.dance': 'Dance',
    'app.projects-title': 'Projects',
    'app.projects-sub': 'Ideas made possible',
    'app.proj1': 'Moving something together',
    'app.proj2': 'A space for connection',
    'app.proj3': 'Making creativity visible',
    'app.works-title': 'Works',
    'app.works-sub': 'Created & shared',
    'app.foto': 'Photo',
    'app.art': 'Art',
    'app.erlebnisse-title': 'Experiences',
    'app.erlebnisse-sub': 'Moments that connect',
    'app.exp1': 'Cooking together',
    'app.exp2': 'Live music',
    'app.exp3': 'Workshop',
    'app.exp4': 'Nature experiences',
    'app.mitwirken-title': 'Get involved',
    'app.mitwirken-sub': 'Contribute yourself',
    'app.contrib1': 'Support a project',
    'app.contrib2': 'Share a talent',
    'app.contrib3': 'Share an idea',
    'app.contrib4': 'Co-create an event',
    'app.wirkung-title': 'Impact',
    'app.wirkung-sub': 'What emerges from it?',
    'app.impact-person': 'Person',
    'app.impact-encounter': 'Connection',
    'app.impact-idea': 'Idea',
    'app.impact-project': 'Project',
    'app.impact-impact': 'Impact',
    'app.impact-works': 'Works',
    'app.impact-experiences': 'Experiences',
    'app.impact-contribute': 'Get involved',
    'app.impact-impact2': 'Impact',
    'app.btn': 'Discover HUI →',
    'app.btn-coming': 'Discover HUI · coming soon',
    'app.cta': 'Get to know HUI',
    'app.aria-discover': 'Show Discover preview',
    'app.aria-people': 'Show People preview',
    'app.aria-talents': 'Show Talents preview',
    'app.aria-projects': 'Show Projects preview',
    'app.aria-works': 'Show Works preview',
    'app.aria-experiences': 'Show Experiences preview',
    'app.aria-contribute': 'Show Get Involved preview',
    'app.aria-impact': 'Show Impact preview',

    // ── Section 3: How HUI works ──
    'how.kicker': 'How HUI works',
    'how.h2': 'An idea can move something.',
    'how.step1-num': '01',
    'how.step1-title': 'Discover',
    'how.step1-desc': 'Discover people, talents, projects, works, and experiences.',
    'how.step2-num': '02',
    'how.step2-title': 'Connect',
    'how.step2-desc': 'Bring people and ideas together.',
    'how.step3-num': '03',
    'how.step3-title': 'Get involved',
    'how.step3-desc': 'Contribute, support, create, or experience.',
    'how.step4-num': '04',
    'how.step4-title': 'Impact',
    'how.step4-desc': 'From connections, something emerges that goes beyond the platform.',

    // ── Section 4: What you can do ──
    'action.kicker': 'What you can do',
    'action.h2': 'You can make a difference with HUI.',
    'action.sub': 'Five ways to be part of HUI.',
    'action.1-title': 'Discover',
    'action.1-desc': 'Discover people, talents, projects, works, and experiences near you.',
    'action.2-title': 'Show',
    'action.2-desc': 'Make your skills, creations, or offerings visible.',
    'action.3-title': 'Get involved',
    'action.3-desc': 'Support ideas, accompany projects, and contribute.',
    'action.4-title': 'Experience',
    'action.4-desc': 'Meet people, use offerings, do things together, and gain new experiences.',
    'action.5-title': 'Create impact',
    'action.5-desc': 'See what emerges from connections, support, and shared ideas.',

    // ── Herkunft ──
    'origin.btn-4v': 'Discover 4VisionGlobal →',
    'origin.kicker': 'The idea behind it',
    'origin.h2': 'HUI began with a shared idea.',
    'origin.claim-1': 'One for all,',
    'origin.claim-2': 'all playing fair',
    'origin.text-1': 'HUI grew out of the project “Einer für Alle, alle Fair(ein)t.” From this idea came the desire to bring people together — not just for a single project, but for the long term.',
    'origin.text-2': 'From this project, the idea for HUI — Human United Intelligence was born.',
    'origin.btn-liga': 'Discover Liga der Kreativen →',
    'origin.clubs-label': 'Supported by the associations',
    'origin.clubs-4v': '4VisionGlobal',
    'origin.clubs-liga': 'Liga der Kreativen',
    'origin.closing': 'From a shared idea, an ecosystem for people, talents, ideas, and possibilities emerged.',
    'origin.alt-4v': 'Seal of 4VisionGlobal',
    'origin.alt-liga': 'Seal of Liga der Kreativen',

    // ── Section 5: Honesty ──
    'honest.kicker': 'Honest',
    'honest.h2': 'We’re just getting started.',
    'honest.p1': 'HUI is still young. Many of the stories that will one day become visible here have yet to be written.',
    'honest.p2': 'And that’s exactly what makes it exciting.',
    'honest.text': 'HUI is still young. Many of the stories that will one day become visible here have yet to be written.<br><br><span class="em">And that’s exactly what makes it exciting.</span>',

    // ── Section 6: Impact ──
    'impact.kicker': 'Impact',
    'impact.h2': 'What can emerge from this?',
    'impact.q1': 'Which people meet?',
    'impact.a1': 'Talents that might never have crossed paths without HUI.',
    'impact.q2': 'Which projects become possible?',
    'impact.a2': 'Ideas that become reality through collective support.',
    'impact.q3': 'Which works reach people?',
    'impact.a3': 'Creations that don’t stay in a drawer, but get shared.',
    'impact.q4': 'What impact lasts?',
    'impact.a4': 'Something that goes beyond the platform — into real life.',

    // ── CTA ──
    'cta.h2': 'Perhaps your story begins here.',
    'cta.p': 'Discover HUI or get involved.',
    'cta.btn1': 'Discover HUI →',
    'cta.btn1-coming': 'Discover HUI · coming soon',
    'cta.btn2': 'Get involved →',

    // ── Footer ──
    'footer.tag': 'Human United Intelligence — People. Ideas. Possibilities.',
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

    // ── Coming Soon Toast ──
    'cs.title': 'HUI will be here for you soon.',
    'cs.text': 'The HUI app is currently being built. We’ll let you know as soon as it’s ready.',
    'cs.close-aria': 'Close',
    'cs.webapp': 'Web-App · available soon',

    // ── Legal page back link ──
    'legal.back': '← Back to home',
    'legal.back-bottom': 'Back to home',

    // ── Legal: Impressum ──
    'imprint.title': 'Legal Notice — HUI',
    'imprint.legal': 'Legal',
    'imprint.h1': 'Legal Notice',
    'imprint.law-ref': 'Information pursuant to § 25 of the Austrian Media Act and § 5 of the E-Commerce Act',
    'imprint.association': 'Association',
    'imprint.legal-form': 'Legal form',
    'imprint.legal-form-val': 'Association (Verein)',
    'imprint.registered-office': 'Registered office',
    'imprint.delivery-address': 'Delivery address / Branch office',
    'imprint.zvr': 'ZVR number',
    'imprint.zvr-reg': 'Central Register of Associations, Austria',
    'imprint.authority': 'Supervisory authority',
    'imprint.authority-val': 'Vienna Police Directorate',
    'imprint.authority-dept': 'Department for Association, Assembly, and Media Law Affairs',
    'imprint.email': 'Email',
    'imprint.board': 'Authorised board members',
    'imprint.president': 'President',
    'imprint.vice-president': 'Vice President',
    'imprint.representation-rules': 'Representation rules',
    'imprint.representation-note': 'The representation rules are based on a register extract dated 15 September 2022. A more recent extract is not currently available.',
    'imprint.reparation-rule-text': 'The President or a Vice President represents the association in and out of court and is authorised to sign on its behalf. Written declarations require the signature of the President or a Vice President to be valid. Financial transactions (disposal of assets) require the signature of the President and/or a Vice President to be valid.',
    'imprint.content-resp': 'Responsible for content',
    'imprint.content-resp-text': 'Responsible for the content of this website pursuant to § 25 of the Austrian Media Act:',
    'imprint.content-resp-org': '4VisionGlobal — Institute for connecting people to support their strengths and visions',
    'imprint.content-resp-addr': 'Lederergasse 28–20, 1080 Vienna, Austria',
    'imprint.content-resp-rep': 'represented by the board (Lars Gutknecht, President)',
    'imprint.hui-title': 'HUI and the supporting associations',
    'imprint.hui-text-1': 'HUI — Human United Intelligence emerged from the project “Einer für Alle, alle Fair(ein)t.” This project is a shared vision of',
    'imprint.hui-text-2': 'and',
    'imprint.hui-text-3': 'From this shared idea, HUI — Human United Intelligence was born.',
    'imprint.dispute-title': 'Out-of-court dispute resolution',
    'imprint.dispute-text-1': 'The European Online Dispute Resolution platform (ODR platform) was discontinued on 20 July 2025 and is no longer available.',
    'imprint.dispute-contact': 'If you have any questions or concerns, please contact:',
    'imprint.source-note': 'The information presented on this page corresponds to the officially published information of 4VisionGlobal (as of: 4visionglobal.com/en/imprint).',

    // ── Legal: Datenschutz ──
    'privacy.title': 'Privacy Policy — HUI',
    'privacy.h1': 'Privacy Policy',
    'privacy.intro': 'Information on the processing of personal data on be-hui.com in accordance with the GDPR.',
    'privacy.s1': '1. Controller',
    'privacy.s1-text': 'Responsible for data processing on this website within the meaning of the General Data Protection Regulation (GDPR) is:',
    'privacy.s1-association': 'Association',
    'privacy.s1-address': 'Address',
    'privacy.s1-rep': 'Represented by',
    'privacy.s1-rep-val': 'The board: Lars Gutknecht (President), Sascha Gladbach (Vice President), Tilo Juncken (Vice President)',
    'privacy.s2': '2. Purpose of this website',
    'privacy.s2-text-1': 'The website be-hui.com serves to provide public information about HUI — Human United Intelligence. It informs about the idea, origins, how it works, and the vision of HUI.',
    'privacy.s2-text-2': 'The HUI app is currently still under development and is not yet available for public release. Registration, login, or use of app features is therefore not possible on the public website at this time.',
    'privacy.s3': '3. Hosting',
    'privacy.s3-text': 'This website is hosted by Vercel Inc. Vercel provides the technical infrastructure for operating the website.',
    'privacy.s3-provider': 'Provider:',
    'privacy.s3-data': 'Data processed:',
    'privacy.s3-data-text': 'For technical reasons, access data is processed in server log files with every access to the website (IP address, date and time of access, requested URL, browser type and version, referrer URL). This processing is carried out by Vercel as a data processor.',
    'privacy.s3-purpose': 'Purpose:',
    'privacy.s3-purpose-text': 'Provision of the website, ensuring the security and stability of the infrastructure, error diagnosis.',
    'privacy.s3-legal': 'Legal basis:',
    'privacy.s3-legal-text': 'Art. 6(1)(f) GDPR (legitimate interest in the technical provision and security of the website).',
    'privacy.s3-retention': 'Retention period:',
    'privacy.s3-retention-text': 'Server log files are stored for a limited period and then deleted. The exact retention period follows Vercel’s guidelines.',
    'privacy.s3-transfer': 'Data transfer to third countries:',
    'privacy.s3-transfer-text': 'Vercel Inc. is a US-based company. A transfer of personal data to the USA cannot be excluded. Vercel offers a Data Processing Addendum (DPA) and uses Standard Contractual Clauses (SCCs) for data transfers. Further information at',
    'privacy.s4': '4. Technical access data / Server log files',
    'privacy.s4-text': 'When you access the website, the hosting provider (Vercel) automatically processes the following data:',
    'privacy.s4-1': 'IP address of the accessing device',
    'privacy.s4-2': 'Date and time of access',
    'privacy.s4-3': 'Requested URL',
    'privacy.s4-4': 'Browser type and version',
    'privacy.s4-5': 'Referrer URL (if available)',
    'privacy.s4-note': 'This data is not combined with other data sources and serves exclusively the technical operation of the website.',
    'privacy.s5': '5. Cookies',
    'privacy.s5-text-1': 'The public HUI website does not use cookies. No tracking cookies, marketing cookies, or analytics cookies are set.',
    'privacy.s5-text-2': 'Technically necessary cookies are not required for the public website. The hosting provider (Vercel) processes access data in server log files (see Section 3), but not via cookies in the browser.',
    'privacy.s6': '6. Contact',
    'privacy.s6-text-1': 'No contact form is currently available on the public website. Contact is made via the published email addresses of the supporting associations.',
    'privacy.s6-text-2': 'If you contact us by email, your details (name, email address, subject, and message) will be processed for the purpose of handling your enquiry.',
    'privacy.s6-legal': 'Legal basis:',
    'privacy.s6-legal-text': 'Art. 6(1)(f) GDPR (legitimate interest in responding to enquiries).',
    'privacy.s6-retention': 'Retention period:',
    'privacy.s6-retention-text': 'The data is stored for the duration of the correspondence and then deleted, unless statutory retention obligations apply.',
    'privacy.s7': '7. External services',
    'privacy.s7-text': 'The following external services are used on the public HUI website:',
    'privacy.s7-fonts': 'Fonts:',
    'privacy.s7-fonts-text': 'The Inter font family is loaded locally from the server. No data is transmitted to external font providers (such as Google Fonts).',
    'privacy.s7-images': 'Images:',
    'privacy.s8': '8. Analytics / Tracking',
    'privacy.s8-text': 'The public HUI website does not use analytics or tracking tools. No user behaviour is analysed.',
    'privacy.s9': '9. Links to external websites',
    'privacy.s9-text': 'This website contains links to external websites (e.g. 4VisionGlobal, Liga der Kreativen). HUI has no influence on the content of these sites and is not responsible for them.',
    'privacy.s10': '10. Rights of the data subject',
    'privacy.s10-text': 'You have the following rights under the GDPR:',
    'privacy.s10-1': 'Right of access (Art. 15 GDPR)',
    'privacy.s10-2': 'Right to rectification (Art. 16 GDPR)',
    'privacy.s10-3': 'Right to erasure (Art. 17 GDPR)',
    'privacy.s10-4': 'Right to restriction of processing (Art. 18 GDPR)',
    'privacy.s10-5': 'Right to data portability (Art. 20 GDPR)',
    'privacy.s10-6': 'Right to object (Art. 21 GDPR)',
    'privacy.s10-note': 'To exercise your rights, please contact the email address stated in Section 1.',
    'privacy.s11': '11. Right to lodge a complaint',
    'privacy.s11-text': 'You have the right to lodge a complaint with the Austrian Data Protection Authority (Datenschutzbehörde) if you believe that the processing of your personal data is unlawful.',
    'privacy.s12': '12. Data security',
    'privacy.s12-text': 'We take appropriate technical and organisational measures to protect personal data from unauthorised access, loss, or destruction. This includes encryption (HTTPS/TLS) for data transmission.',
    'privacy.s13': '13. Retention periods',
    'privacy.s13-text': 'Personal data is stored only for as long as is necessary to fulfil the purposes stated in this privacy policy. After that, the data is deleted unless statutory retention obligations require continued storage.',
    'privacy.s14': '14. Contact for data protection questions',
    'privacy.s14-text': 'For questions regarding data protection, please contact:',
    'privacy.s14-title': 'Data protection contact',

    // ── Legal: Cookie-Einstellungen ──
    'cookie.title': 'Cookie Settings — HUI',
    'cookie.legal': 'Legal',
    'cookie.h1': 'Cookie Settings',
    'cookie.intro': 'HUI is transparent: the public website does not use cookies.',
    'cookie.current': 'Current status',
    'cookie.current-text': 'The public HUI website uses',
    'cookie.current-no': 'no cookies',
    'cookie.why': 'Why no cookies?',
    'cookie.why-text-1': 'HUI values transparency and data protection. The public website is designed to work entirely without cookies. Fonts and images are loaded locally — there is no integration of external font providers or CDNs that could set cookies.',
    'cookie.why-text-2': 'The hosting provider (Vercel) processes access data in server log files (IP address, timestamp, requested URL). This processing takes place server-side and not via cookies in the browser.',
    'cookie.details': 'Detailed overview',
    'cookie.necessary': 'Necessary cookies',
    'cookie.necessary-text': 'Not used — the website works fully without cookies.',
    'cookie.preference': 'Preference cookies',
    'cookie.preference-text': 'Not used.',
    'cookie.statistics': 'Statistics cookies',
    'cookie.statistics-text': 'Not used — no analytics tool is deployed.',
    'cookie.marketing': 'Marketing cookies',
    'cookie.marketing-text': 'Not used — no tracking or retargeting is deployed.',
    'cookie.fonts': 'External fonts',
    'cookie.fonts-text': 'Not used — all fonts are hosted locally.',
    'cookie.cdn': 'External CDNs',
    'cookie.cdn-text': 'Not used — all scripts and images are hosted locally.',
    'cookie.future': 'Prepared for the future',
    'cookie.future-text-1': 'This page is technically prepared for future consent management. If cookies are added as part of the app launch or future features, a central consent management system will be available here, allowing you to adjust your settings at any time.',
    'cookie.future-text-2': 'Cookies requiring consent will only be used once a corresponding consent system is implemented. Until then, no cookies remain active.',
    'cookie.rights': 'Your rights',
    'cookie.rights-text-1': 'Since no cookies are used, revoking consent is currently not necessary. If consent-based cookies are added in the future, you can revoke your consent at any time.',
    'cookie.rights-text-2': 'Further information can be found in our',
    'cookie.rights-link': 'Privacy Policy',
    'cookie.rights-text-3': 'This page will be updated as soon as the cookie situation changes. No changes are currently foreseeable.',

    // ── Legal: Nutzungsbedingungen ──
    'terms.title': 'Terms of Use — HUI',
    'terms.legal': 'Legal',
    'terms.h1': 'Terms of Use',
    'terms.intro': 'These terms govern the use of the public HUI website. The HUI app is regulated separately.',
    'terms.s1': '1. Scope',
    'terms.s1-text-1': 'These terms of use govern the use of the public website be-hui.com and all associated content.',
    'terms.s1-text-2': 'The HUI app (web app and mobile app) is currently still under development and is not yet available for public release. Separate terms of use for the HUI app will be published prior to launch.',
    'terms.s2': '2. Distinction: Website and app',
    'terms.s2-text-1': 'The HUI website (be-hui.com) is a public information offering. It includes:',
    'terms.s2-1': 'Information about HUI — Human United Intelligence',
    'terms.s2-2': 'The origins of HUI and the supporting associations',
    'terms.s2-3': 'How HUI works and the vision of HUI',
    'terms.s2-4': 'Legal and informational pages (Legal Notice, Privacy Policy, etc.)',
    'terms.s2-text-2': 'The HUI app, on the other hand, is an interactive platform currently in development.',
    'terms.s3': '3. Use of content',
    'terms.s3-text-1': 'The content of the public website is provided for information purposes. You may view, download, and print content for personal, non-commercial use.',
    'terms.s3-text-2': 'Reproduction, distribution, or commercial use of the content requires the prior written consent of 4VisionGlobal.',
    'terms.s4': '4. Liability',
    'terms.s4-text-1': 'Despite careful content review, no liability is assumed for the accuracy, completeness, or timeliness of the information provided.',
    'terms.s4-text-2': 'Liability for damages arising from the use of the website is excluded, unless caused by intent or gross negligence.',
    'terms.s5': '5. External links',
    'terms.s5-text': 'The website contains links to external websites. HUI is not responsible for the content of these external sites and does not adopt them as its own.',
    'terms.s6': '6. Changes to the website',
    'terms.s6-text': 'HUI reserves the right to change, supplement, or remove content on the website at any time without prior notice.',
    'terms.s7': '7. Applicable law',
    'terms.s7-text': 'Austrian law applies, to the extent permitted by mandatory consumer protection provisions.',

    // ── Legal: Barrierefreiheit ──
    'a11y.title': 'Accessibility — HUI',
    'a11y.legal': 'Legal',
    'a11y.h1': 'Accessibility',
    'a11y.intro': 'HUI is committed to making its website accessible to all people.',
    'a11y.s1': 'Current status',
    'a11y.s1-text': 'The public HUI website is currently being reviewed for compliance with the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA. We are continuously working to improve the accessibility of the website.',
    'a11y.s2': 'Measures taken',
    'a11y.s2-1': 'Semantic HTML structure',
    'a11y.s2-2': 'Sufficient colour contrasts',
    'a11y.s2-3': 'Keyboard navigability',
    'a11y.s2-4': 'Descriptive alt texts for images',
    'a11y.s2-5': 'Clear and readable typography',
    'a11y.s3': 'Known limitations',
    'a11y.s3-text-1': 'Some content may not yet be fully accessible. The HUI app is currently in development and will be designed to be accessible from the start.',
    'a11y.s3-text-2': 'If you encounter accessibility barriers, please let us know. We will endeavour to provide the content in an accessible format.',
    'a11y.s4': 'Contact',
    'a11y.s4-text': 'For accessibility questions or feedback, please contact:',
    'a11y.s5': 'Further development',
    'a11y.s5-text': 'Accessibility is an ongoing process. This page will be updated as progress is made.',

    // ── Legal: Kontakt ──
    'contact.title': 'Contact — HUI',
    'contact.legal': 'Legal',
    'contact.h1': 'Contact',
    'contact.intro': 'HUI is a joint project of 4VisionGlobal and Liga der Kreativen. We look forward to hearing from you.',
    'contact.org1-title': '4VisionGlobal',
    'contact.org1-sub': 'Institute for connecting people to support their strengths and visions',
    'contact.org1-email': 'Email',
    'contact.org1-web': 'Website',
    'contact.org2-title': 'Liga der Kreativen',
    'contact.org2-sub': 'Austrian association of creative professionals',
    'contact.org2-email': 'Email',
    'contact.org2-web': 'Website',
    'contact.note': 'Please note: The HUI app is currently in development. There is no app support available at this time.',

    // ── Language Switcher ──
    'lang.switch-aria': 'Switch language',
    'lang.de': 'DE',
    'lang.en': 'EN'
  };

  // ═══════════════════════════════════════════════════
  // APPLY TRANSLATIONS
  // ═══════════════════════════════════════════════════

  function applyTranslations(lang){
    if(lang === LANG_DE) return; // German is default in HTML

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var key = el.getAttribute('data-i18n');
      if(EN[key]) el.textContent = EN[key];
    });

    // HTML content (for elements with links inside)
    document.querySelectorAll('[data-i18n-html]').forEach(function(el){
      var key = el.getAttribute('data-i18n-html');
      if(EN[key]) el.innerHTML = EN[key];
    });

    // Attributes: aria-label
    document.querySelectorAll('[data-i18n-aria]').forEach(function(el){
      var key = el.getAttribute('data-i18n-aria');
      if(EN[key]) el.setAttribute('aria-label', EN[key]);
    });

    // Attributes: alt
    document.querySelectorAll('[data-i18n-alt]').forEach(function(el){
      var key = el.getAttribute('data-i18n-alt');
      if(EN[key]) el.setAttribute('alt', EN[key]);
    });

    // Attributes: placeholder
    document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
      var key = el.getAttribute('data-i18n-ph');
      if(EN[key]) el.setAttribute('placeholder', EN[key]);
    });

    // Document title
    if(EN['meta.title']) document.title = EN['meta.title'];

    // Meta description
    var metaDesc = document.querySelector('meta[name="description"]');
    if(metaDesc && EN['meta.description']) metaDesc.setAttribute('content', EN['meta.description']);

    // OG tags
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if(ogTitle && EN['meta.og-title']) ogTitle.setAttribute('content', EN['meta.og-title']);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if(ogDesc && EN['meta.og-description']) ogDesc.setAttribute('content', EN['meta.og-description']);

    // Coming-soon links: re-apply "coming soon" for EN
    // The coming-soon JS may have already changed "→" to "· bald",
    // and data-i18n translation may have changed it back to "→".
    // So we need to handle all cases.
    document.querySelectorAll('.coming-soon').forEach(function(link){
      var t = link.textContent.trim();
      // Already has "coming soon" — done
      if(t.indexOf('coming soon') > -1) return;
      // Has "bald" (German coming-soon text still present)
      if(t.indexOf('bald') > -1){
        // Special case: "Web-App · bald verfügbar"
        if(t.indexOf('verf\u00fcgbar') > -1 || t.indexOf('verfügbar') > -1){
          link.textContent = 'Web App · coming soon';
        } else {
          link.textContent = t.replace(/· bald/g, '· coming soon').replace(/bald/g, 'coming soon');
        }
      }
      // Has "→" (i18n translation includes arrow) — replace with "· coming soon"
      else if(t.indexOf('→') > -1){
        link.textContent = t.replace(/→/g, '· coming soon');
      }
      // Has neither — i18n translation removed "· bald" but no arrow — append "· coming soon"
      else {
        link.textContent = t + ' · coming soon';
      }
    });

    // Coming-soon toast
    var toastH = document.querySelector('#csToast h4');
    if(toastH && EN['cs.title']) toastH.textContent = EN['cs.title'];
    var toastP = document.querySelector('#csToast p');
    if(toastP && EN['cs.text']) toastP.textContent = EN['cs.text'];
    var toastClose = document.getElementById('csToastClose');
    if(toastClose && EN['cs.close-aria']) toastClose.setAttribute('aria-label', EN['cs.close-aria']);

    // Legal page: update legal links in footer/nav
    updateLegalLinks();

    // Update language switcher active state
    updateSwitcherState();
  }

  // ── Update legal page links for EN ──
  function updateLegalLinks(){
    var lang = getLang();
    var legalLinkMap = {
      '/impressum': '/impressum',
      '/datenschutz': '/datenschutz',
      '/cookie-einstellungen': '/cookie-einstellungen',
      '/nutzungsbedingungen': '/nutzungsbedingungen',
      '/barrierefreiheit': '/barrierefreiheit',
      '/kontakt': '/kontakt'
    };
    // No URL changes — the JS translation system handles everything
    // Links stay the same; content is translated
  }

  // ── Update footer legal links to /en/ versions ──
  function updateFooterLegalLinks(){
    var linkMap = {
      '/impressum': '/en/imprint',
      '/datenschutz': '/en/privacy',
      '/cookie-einstellungen': '/en/cookie-settings',
      '/nutzungsbedingungen': '/en/terms',
      '/barrierefreiheit': '/en/accessibility',
      '/kontakt': '/en/contact'
    };
    document.querySelectorAll('a.footer-link, a[href^="/impressum"], a[href^="/datenschutz"], a[href^="/cookie-einstellungen"], a[href^="/nutzungsbedingungen"], a[href^="/barrierefreiheit"], a[href^="/kontakt"]').forEach(function(link){
      var href = link.getAttribute('href');
      if(href && linkMap[href]){
        link.setAttribute('href', linkMap[href]);
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

  // ── Legal page redirect map ──
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
    // CSS for the language switcher
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

    // Build switcher HTML
    var switcherHTML = '<span class="lang-switch" role="group" aria-label="Language">' +
      '<button type="button" data-lang="de" aria-label="Deutsch">DE</button>' +
      '<button type="button" data-lang="en" aria-label="English">EN</button>' +
      '</span>';

    // Inject into nav-links (desktop)
    var navLinks = document.querySelector('.nav-links');
    if(navLinks){
      var navSwitch = document.createElement('span');
      navSwitch.innerHTML = switcherHTML;
      navSwitch.className = 'nav-lang-wrap';
      navLinks.appendChild(navSwitch.firstChild);
    }

    // Inject into drawer (mobile)
    var drawer = document.getElementById('drawer');
    if(drawer){
      var drawerSwitch = document.createElement('span');
      drawerSwitch.innerHTML = switcherHTML;
      drawer.appendChild(drawerSwitch.firstChild);
    }

    // Also inject into legal pages (they have their own nav)
    var legalNav = document.querySelector('.legal-back');
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
        // Landing page: JS text swap
        if(lang === LANG_DE){
          location.reload();
        } else {
          applyTranslations(LANG_EN);
          // Update footer legal links to /en/ versions
          updateFooterLegalLinks();
        }
      });
    });

    updateSwitcherState();
  }

  // ═══════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════

  function init(){
    injectSwitcher();
    var lang = getLang();
    if(lang === LANG_EN){
      // On landing page: apply JS translations
      if(!isLegalPage()){
        applyTranslations(LANG_EN);
        updateFooterLegalLinks();
      }
      // On English legal pages: content is already English (from the HTML file)
      // On German legal pages with EN saved: redirect to English version
      if(isLegalPage()){
        var redirect = getLegalRedirect(LANG_EN);
        if(redirect){
          window.location.href = redirect;
          return;
        }
      }
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.HUI_i18n = { getLang: getLang, setLang: setLang, apply: applyTranslations };
})();
