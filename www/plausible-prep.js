// ═══ Plausible Analytics — Event Tracking Helpers ═══
// Plausible is activated with the official tracking code in each page <head>.
// This file provides custom event helpers that work with window.plausible.

// Custom event helpers (ready for when Plausible is activated)
window.huiTrack = function(eventName, props) {
  if (typeof window.plausible === 'function') {
    window.plausible(eventName, props || {});
  }
  // Console log for development
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('vercel.app')) {
    console.log('[HUI Track]', eventName, props || '');
  }
};

// CTA click tracking
document.addEventListener('click', function(e) {
  var el = e.target.closest('[data-track]');
  if (el) {
    var event = el.getAttribute('data-track');
    window.huiTrack(event, {
      page: window.location.pathname,
      label: el.textContent.trim().substring(0, 50)
    });
  }
});

// Language switch tracking
document.addEventListener('click', function(e) {
  var el = e.target.closest('[data-lang-switch]');
  if (el) {
    var lang = el.getAttribute('data-lang-switch') || el.getAttribute('data-lang') || 'unknown';
    window.huiTrack('Language Switch', { from: document.documentElement.lang, to: lang });
  }
});

// External link tracking
document.addEventListener('click', function(e) {
  var el = e.target.closest('a[href^="http"]');
  if (el && !el.href.includes(window.location.hostname)) {
    window.huiTrack('External Link', { url: el.href });
  }
});
