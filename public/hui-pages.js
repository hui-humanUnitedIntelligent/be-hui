/* ═══════════════════════════════════════════════════
   HUI Pages JS — shared functionality for subpages
   Sidebar, nav, drawer, coming-soon, reveal
   ═══════════════════════════════════════════════════ */
(function(){
  'use strict';

  // ═══ APP PUBLIC ACCESS ═══
  var APP_PUBLIC_ACCESS=false;
  window.APP_PUBLIC_ACCESS=APP_PUBLIC_ACCESS;

  document.addEventListener('DOMContentLoaded',function(){
    // ═══ NAV SCROLL SHADOW ═══
    var nav=document.getElementById('nav');
    if(nav){
      window.addEventListener('scroll',function(){
        nav.classList.toggle('scrolled',window.scrollY>20);
      },{passive:true});
    }

    // ═══ MOBILE DRAWER ═══
    var ham=document.getElementById('hamBtn');
    var drawer=document.getElementById('drawer');
    var backdrop=document.getElementById('backdrop');
    if(ham&&drawer&&backdrop){
      function toggleDrawer(open){
        drawer.classList.toggle('open',open);
        backdrop.classList.toggle('open',open);
      }
      ham.addEventListener('click',function(){toggleDrawer(!drawer.classList.contains('open'))});
      backdrop.addEventListener('click',function(){toggleDrawer(false)});
      drawer.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){toggleDrawer(false)})});
    }

    // ═══ REVEAL ANIMATIONS ═══
    document.documentElement.classList.add('has-js');
    var prefersReduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if(prefersReduced){
      document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('visible')});
    }else{
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },{threshold:.15,rootMargin:'0px 0px -40px 0px'});
      document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
    }

    // ═══ COMING SOON ═══
    if(!APP_PUBLIC_ACCESS){
      var links=document.querySelectorAll('a[href^="/app/"]');
      links.forEach(function(link){
        link.setAttribute('data-original-href',link.getAttribute('href'));
        link.removeAttribute('href');
        link.classList.add('coming-soon');
      });
      var toast=document.getElementById('csToast');
      var closeBtn=document.getElementById('csToastClose');
      var timer=null;
      function showCSToast(){
        if(toast){toast.classList.add('show');clearTimeout(timer);timer=setTimeout(function(){toast.classList.remove('show');},5000);}
      }
      if(closeBtn){
        closeBtn.addEventListener('click',function(){toast.classList.remove('show');clearTimeout(timer);});
      }
      document.addEventListener('keydown',function(e){
        if(e.key==='Escape'){if(toast)toast.classList.remove('show');clearTimeout(timer);}
      });
    }

    // ═══ HUI SIDEBAR ═══
    var tab=document.getElementById('huiTab');
    var sidebar=document.getElementById('huiSidebar');
    var sbBackdrop=document.getElementById('huiSidebarBackdrop');
    var closeBtn=document.getElementById('huiSidebarClose');
    var sbToast=document.getElementById('huiSidebarToast');
    var sbToastText=document.getElementById('huiSidebarToastText');
    var sbToastTimer=null;
    var body=document.body;
    var prevFocus=null;
    var reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    if(!tab||!sidebar) return;

    function open(){
      prevFocus=document.activeElement;
      sidebar.classList.add('open');
      if(sbBackdrop) sbBackdrop.classList.add('open');
      tab.classList.add('sidebar-open');
      tab.setAttribute('aria-expanded','true');
      sidebar.setAttribute('aria-hidden','false');
      body.style.overflow='hidden';
      setTimeout(function(){if(closeBtn) closeBtn.focus()},reduced?0:350);
    }
    function close(){
      sidebar.classList.remove('open');
      if(sbBackdrop) sbBackdrop.classList.remove('open');
      tab.classList.remove('sidebar-open');
      tab.setAttribute('aria-expanded','false');
      sidebar.setAttribute('aria-hidden','true');
      body.style.overflow='';
      if(prevFocus&&prevFocus.focus)prevFocus.focus();
    }
    function isOpen(){return sidebar.classList.contains('open')}

    function showToast(msg){
      if(!sbToast) return;
      sbToastText.textContent=msg;
      sbToast.classList.add('show');
      clearTimeout(sbToastTimer);
      sbToastTimer=setTimeout(function(){sbToast.classList.remove('show');},3500);
    }

    var toastGeneral='Dieser Bereich entsteht gerade.';
    var toastLaunch='Kommt mit dem Start von HUI.';
    window.HUI_SIDEBAR_TOAST={set:function(g,l){toastGeneral=g||toastGeneral;toastLaunch=l||toastLaunch}};

    tab.addEventListener('click',open);
    if(closeBtn) closeBtn.addEventListener('click',close);
    if(sbBackdrop) sbBackdrop.addEventListener('click',close);

    document.addEventListener('keydown',function(e){
      if(e.key==='Escape'&&isOpen()){close();e.preventDefault()}
    });

    // Focus trap
    sidebar.addEventListener('keydown',function(e){
      if(e.key!=='Tab'||!isOpen())return;
      var f=sidebar.querySelectorAll('a[href],button,input,[tabindex]:not([tabindex="-1"])');
      var visible=Array.prototype.filter.call(f,function(el){return el.offsetParent!==null||el===closeBtn});
      if(visible.length===0)return;
      var first=visible[0],last=visible[visible.length-1];
      if(e.shiftKey&&document.activeElement===first){last.focus();e.preventDefault()}
      else if(!e.shiftKey&&document.activeElement===last){first.focus();e.preventDefault()}
    });

    // Pre-launch items
    document.querySelectorAll('[data-pre-launch]').forEach(function(item){
      item.addEventListener('click',function(e){
        e.preventDefault();
        var type=item.getAttribute('data-pre-launch');
        showToast(type==='launch'?toastLaunch:toastGeneral);
      });
    });

    // Close sidebar on nav link click (for anchor links)
    sidebar.querySelectorAll('a[href^="#"]').forEach(function(link){
      if(!link.hasAttribute('data-pre-launch')){
        link.addEventListener('click',function(){close()});
      }
    });
  });
})();
