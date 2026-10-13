document.addEventListener('DOMContentLoaded', function () {
  /* ── 中英文切换 ── */
  (function () {
    var btn = document.getElementById('lang-toggle');
    if (!btn) return;
    var lang = localStorage.getItem('site-lang') || 'zh';
    var setLang = function (l) {
      lang = l;
      localStorage.setItem('site-lang', l);
      btn.textContent = l === 'en' ? 'EN' : '中';
      document.documentElement.classList.toggle('lang-en', l === 'en');
      document.body.classList.toggle('lang-en', l === 'en');
      /* update search placeholders */
      document.querySelectorAll('[data-placeholder-zh]').forEach(function (el) {
        el.placeholder = l === 'en' ? el.getAttribute('data-placeholder-en') : el.getAttribute('data-placeholder-zh');
      });
    };
    setLang(lang);
    btn.addEventListener('click', function () {
      setLang(lang === 'zh' ? 'en' : 'zh');
    });
  })();
  /* keep --header-h in sync with the real (variable-height) header,
     so the sticky page-subbar/subnav-wrap never gap or overlap it */
  var headerEl = document.querySelector('.site-header');
  var headerMeasureFrame = null;
  var setHeaderH = function () {
    if (headerEl) document.documentElement.style.setProperty('--header-h', headerEl.getBoundingClientRect().height + 'px');
  };
  var syncHeaderH = function () {
    if (headerMeasureFrame) window.cancelAnimationFrame(headerMeasureFrame);
    headerMeasureFrame = window.requestAnimationFrame(function () {
      setHeaderH();
      headerMeasureFrame = null;
    });
  };
  setHeaderH();
  window.addEventListener('resize', syncHeaderH);
  window.addEventListener('load', syncHeaderH);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeaderH);
  if (headerEl) headerEl.addEventListener('transitionend', syncHeaderH);

  document.documentElement.classList.add('reveal-ready');

var setScrolledHeader = function () {
    if (!headerEl) return;
    var wasScrolled = headerEl.classList.contains('is-scrolled');
    var shouldScroll = wasScrolled ? window.scrollY > 0 : window.scrollY > 24;
    if (shouldScroll === wasScrolled) return;
    headerEl.classList.toggle('is-scrolled', shouldScroll);
  };
  setScrolledHeader();
  window.addEventListener('scroll', setScrolledHeader, { passive: true });

  /* mobile nav toggle */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
      document.body.classList.toggle('nav-open', nav.classList.contains('open'));
      syncHeaderH();
    });
nav.querySelectorAll('.main-nav a, .mega a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-open');
      });
    });
  }

  /* faculty tabs */
  var facTabs = document.querySelectorAll('.fac-tab');
  facTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-target');
      document.querySelectorAll('.fac-tab').forEach(function (t) { t.classList.remove('is-active'); });
      document.querySelectorAll('.fac-panel').forEach(function (p) { p.classList.remove('is-active'); });
      tab.classList.add('is-active');
      var panel = document.getElementById(target);
      if (panel) panel.classList.add('is-active');
    });
  });

  /* drone-service tabs (reuses fac-tab pattern with data-target) handled above generically */

  /* subnav scroll-spy: highlight pill matching the section in view */
  var subnavLinks = document.querySelectorAll('.subnav a[href^="#"]');
  if (subnavLinks.length) {
    var sections = [];
    subnavLinks.forEach(function (l) {
      var id = l.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) sections.push({ id: id, el: el, link: l });
    });
    var setActive = function (id) {
      subnavLinks.forEach(function (l) { l.classList.remove('is-active'); });
      sections.forEach(function (s) { if (s.id === id) s.link.classList.add('is-active'); });
    };
    if (sections.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      }, { rootMargin: '-160px 0px -60% 0px', threshold: 0.01 });
      sections.forEach(function (s) { observer.observe(s.el); });
    }
  }

  /* subtle starfield in hero, drawn once, respects reduced motion */
  var starsEl = document.querySelector('.hero-stars');
  if (starsEl) {
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('aria-hidden', 'true');
    var count = window.innerWidth < 700 ? 60 : 130;
    for (var i = 0; i < count; i++) {
      var c = document.createElementNS(svgNS, 'circle');
      c.setAttribute('cx', Math.random() * 100 + '%');
      c.setAttribute('cy', Math.random() * 70 + '%');
      c.setAttribute('r', (Math.random() * 1.1 + 0.3).toFixed(2));
      c.setAttribute('fill', '#fff');
      c.setAttribute('opacity', (Math.random() * 0.6 + 0.15).toFixed(2));
      svg.appendChild(c);
    }
    starsEl.appendChild(svg);
  }

  var revealItems = document.querySelectorAll([
    '.intro-section',
    '.pillar-feature',
    '.pillars-rows .feat-row',
    '.feature-band',
    '.split-feed',
    '.links-strip',
    '.section',
    '.page-hero',
    '.cta-band'
  ].join(','));
  if ('IntersectionObserver' in window && revealItems.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -72px 0px' });
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  }

  var heroVideo = document.querySelector('.hero-video');
  var hero = document.querySelector('.hero');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroVideo && hero && !reduceMotion) {
    var ticking = false;
    var updateHeroParallax = function () {
      var rect = hero.getBoundingClientRect();
      var progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
      heroVideo.style.transform = 'scale(1.035) translateY(' + (progress * 38) + 'px)';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeroParallax);
        ticking = true;
      }
    }, { passive: true });
    updateHeroParallax();
  }

  var zoomImages = document.querySelectorAll('.detail-image-card img');
  if (zoomImages.length) {
    var lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', '查看大图');
    lightbox.innerHTML = '<button type="button" aria-label="关闭大图">&times;</button><img alt="">';
    document.body.appendChild(lightbox);

    var lightboxImg = lightbox.querySelector('img');
    var closeButton = lightbox.querySelector('button');
    var closeLightbox = function () {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
      window.setTimeout(function () {
        if (!lightbox.classList.contains('is-open')) {
          lightboxImg.removeAttribute('src');
        }
      }, 220);
    };

    zoomImages.forEach(function (img) {
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', '点击查看大图');
      var openLightbox = function () {
        lightboxImg.src = img.currentSrc || img.src;
        lightboxImg.alt = img.alt || '';
        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        closeButton.focus();
      };
      img.addEventListener('click', openLightbox);
      img.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox();
        }
      });
    });

    closeButton.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
      }
    });
  }
});



