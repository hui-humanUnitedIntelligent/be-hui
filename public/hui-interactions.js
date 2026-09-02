/* ═══════════════════════════════════════════════════
   HUI Interactions JS — pre-launch experience
   Subtle, elegant interactions for landing + subpages
   ═══════════════════════════════════════════════════ */
(function(){
  'use strict';

  // ═══ i18n helper ═══
  function t(key){
    if(window.HUI_i18n && typeof window.HUI_i18n.t === 'function') return window.HUI_i18n.t(key);
    return key;
  }

  function getLang(){
    if(window.HUI_i18n && typeof window.HUI_i18n.getLang === 'function') return window.HUI_i18n.getLang();
    return 'de';
  }

  document.addEventListener('DOMContentLoaded', function(){

    // ═══ 1. "Was wäre, wenn?" interactive reveals ═══
    var visionItems = document.querySelectorAll('.vision-item');
    visionItems.forEach(function(item){
      var revealId = item.getAttribute('data-vision-reveal');
      var revealEl = revealId ? document.getElementById(revealId) : null;
      if(!revealEl) return;

      var isActive = false;

      function toggle(){
        isActive = !isActive;
        item.classList.toggle('active', isActive);
        revealEl.classList.toggle('show', isActive);
      }

      // Click/tap for all devices
      item.addEventListener('click', function(e){
        e.preventDefault();
        // Close other reveals
        visionItems.forEach(function(other){
          if(other !== item){
            other.classList.remove('active');
            var otherId = other.getAttribute('data-vision-reveal');
            var otherEl = otherId ? document.getElementById(otherId) : null;
            if(otherEl) otherEl.classList.remove('show');
          }
        });
        toggle();
      });

      // Keyboard accessibility
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); item.click(); }
      });
    });

    // ═══ 2. "Was bringst du mit?" interaction ═══
    var bringChips = document.querySelectorAll('.bring-chip');
    var bringResponse = document.getElementById('bringResponse');
    var bringResponseText = document.getElementById('bringResponseText');
    var bringCta = document.getElementById('bringCta');

    bringChips.forEach(function(chip){
      chip.addEventListener('click', function(){
        var value = chip.getAttribute('data-bring');
        var responseKey = 'bring.response.' + value;
        var ctaKey = 'bring.cta.' + value;
        var ctaLink = chip.getAttribute('data-cta-link') || '';
        var trackLabel = chip.getAttribute('data-track') || ('HUI Entry – ' + value);

        // Deselect others
        bringChips.forEach(function(c){ c.classList.remove('selected'); });
        chip.classList.add('selected');

        // Track selection via Plausible
        if(typeof window.huiTrack === 'function'){
          window.huiTrack(trackLabel, { section: 'was-bringst-du-mit', selection: value });
        }

        // Show response
        if(bringResponse && bringResponseText){
          bringResponseText.textContent = t(responseKey);
          bringResponse.classList.add('show');
        }

        // Show CTA with tracking
        if(bringCta){
          var ctaText = t(ctaKey);
          var ctaLinkEl = bringCta.querySelector('a');
          if(ctaLinkEl){
            ctaLinkEl.textContent = ctaText;
            if(ctaLink){
              ctaLinkEl.href = ctaLink;
              ctaLinkEl.classList.remove('bald');
            } else {
              ctaLinkEl.href = '#';
              ctaLinkEl.classList.add('bald');
            }
            // Track CTA click
            ctaLinkEl.onclick = function(e){
              e.preventDefault();
              if(typeof window.huiTrack === 'function'){
                window.huiTrack(trackLabel + ' – CTA', { section: 'was-bringst-du-mit', selection: value, target: ctaLink || 'bald' });
              }
            };
          }
          bringCta.classList.add('show');
        }
      });
    });

    // ═══ 3. Subpage micro-interactions (talente + ideen) ═══
    var interactChips = document.querySelectorAll('.hui-interact-chip');
    interactChips.forEach(function(chip){
      chip.addEventListener('click', function(){
        var group = chip.closest('.hui-interact');
        if(!group) return;

        var value = chip.getAttribute('data-value');
        var responseEl = group.querySelector('.hui-interact-response');
        var responseTextEl = group.querySelector('.hui-interact-response-text');
        var responseKey = group.getAttribute('data-response-prefix') + '.' + value;
        var ctaLink = chip.getAttribute('data-cta-link') || '';
        var trackLabel = chip.getAttribute('data-track') || '';
        var ctaEl = group.querySelector('.hui-interact-cta');
        var prefix = group.getAttribute('data-response-prefix') || '';
        var ctaPrefix = prefix.replace('.response', '.cta');

        // Deselect others in group
        group.querySelectorAll('.hui-interact-chip').forEach(function(c){
          c.classList.remove('selected');
        });
        chip.classList.add('selected');

        // Track selection via Plausible
        if(trackLabel && typeof window.huiTrack === 'function'){
          window.huiTrack(trackLabel, { section: 'was-kannst-du', selection: value });
        }

        // Show response
        if(responseEl && responseTextEl){
          responseTextEl.textContent = t(responseKey);
          responseEl.classList.add('show');
        }

        // Show CTA with tracking
        if(ctaEl){
          var ctaText = t(ctaPrefix + '.' + value);
          var ctaLinkEl = ctaEl.querySelector('a');
          if(ctaLinkEl){
            ctaLinkEl.textContent = ctaText;
            if(ctaLink){
              ctaLinkEl.href = ctaLink;
              ctaLinkEl.classList.remove('bald');
            } else {
              ctaLinkEl.href = '#';
              ctaLinkEl.classList.add('bald');
            }
            ctaLinkEl.onclick = function(e){
              e.preventDefault();
              if(trackLabel && typeof window.huiTrack === 'function'){
                window.huiTrack(trackLabel + ' \u2013 CTA', { section: 'was-bringst-du-mit', selection: value, target: ctaLink || 'bald' });
              }
            };
          }
          ctaEl.classList.add('show');
        }
      });
    });

    // ═══ 4. Timeline reveal animation ═══
    var timelineItems = document.querySelectorAll('.hui-timeline-item');
    if(timelineItems.length > 0){
      if('IntersectionObserver' in window){
        var tio = new IntersectionObserver(function(entries){
          entries.forEach(function(e, i){
            if(e.isIntersecting){
              setTimeout(function(){ e.target.classList.add('visible'); }, i * 120);
              tio.unobserve(e.target);
            }
          });
        }, {threshold: .2, rootMargin: '0px 0px -40px 0px'});
        timelineItems.forEach(function(item){ tio.observe(item); });
      } else {
        timelineItems.forEach(function(item){ item.classList.add('visible'); });
      }
    }

    // ═══ 5. Action card click navigation ═══
    var actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(function(card){
      var link = card.getAttribute('data-link');
      if(!link) return;

      card.addEventListener('click', function(){
        // Check if it's a coming-soon link
        if(card.hasAttribute('data-coming-soon')){
          // Show coming-soon toast
          var toast = document.getElementById('csToast');
          if(toast){
            toast.classList.add('show');
            setTimeout(function(){ toast.classList.remove('show'); }, 4000);
          }
        } else {
          window.location.href = link;
        }
      });
    });

  });
})();
