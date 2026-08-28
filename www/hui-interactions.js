/* ═══════════════════════════════════════════════════
   HUI Interactions JS — pre-launch experience
   Subtle, elegant interactions for landing + subpages
   ═══════════════════════════════════════════════════ */
(function(){
  'use strict';

  // ═══ i18n helper ═══
  function t(key){
    if(typeof window.t === 'function') return window.t(key);
    // fallback: check DE dict
    if(typeof window.DE !== 'undefined' && window.DE[key]) return window.DE[key];
    if(typeof window.EN !== 'undefined' && window.EN[key]) return window.EN[key];
    return key;
  }

  function getLang(){
    if(typeof window.currentLang !== 'undefined') return window.currentLang;
    var path = window.location.pathname;
    if(path.indexOf('/en/') === 0) return 'en';
    var stored = '';
    try{ stored = localStorage.getItem('hui-lang') || ''; }catch(e){}
    return stored === 'en' ? 'en' : 'de';
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
        var ctaLink = chip.getAttribute('data-cta-link') || '/von-anfang-an-dabei';

        // Deselect others
        bringChips.forEach(function(c){ c.classList.remove('selected'); });
        chip.classList.add('selected');

        // Show response
        if(bringResponse && bringResponseText){
          bringResponseText.textContent = t(responseKey);
          bringResponse.classList.add('show');
        }

        // Show CTA
        if(bringCta){
          var ctaText = t(ctaKey);
          var ctaLinkEl = bringCta.querySelector('a');
          if(ctaLinkEl){
            ctaLinkEl.textContent = ctaText;
            ctaLinkEl.href = ctaLink;
          }
          bringCta.classList.add('show');
        }
      });
    });

    // ═══ 3. Subpage micro-interactions ═══
    var interactChips = document.querySelectorAll('.hui-interact-chip');
    interactChips.forEach(function(chip){
      chip.addEventListener('click', function(){
        var group = chip.closest('.hui-interact');
        if(!group) return;

        var value = chip.getAttribute('data-value');
        var responseEl = group.querySelector('.hui-interact-response');
        var responseTextEl = group.querySelector('.hui-interact-response-text');
        var responseKey = group.getAttribute('data-response-prefix') + '.' + value;

        // Deselect others in group
        group.querySelectorAll('.hui-interact-chip').forEach(function(c){
          c.classList.remove('selected');
        });
        chip.classList.add('selected');

        if(responseEl && responseTextEl){
          responseTextEl.textContent = t(responseKey);
          responseEl.classList.add('show');
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
