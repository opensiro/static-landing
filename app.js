/* =====================================================================
   opensiro — app.js
   Vanilla, no dependencies. Active-nav highlight + mobile nav drawer.
   Shared across index.html, products.html, research.html.
   ===================================================================== */
(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ----------------------------------------------------- active nav by page
     The .active class is baked into each page's markup (works without
     JS). This re-asserts it from location.pathname as a guard, mapping
     the current file to a data-nav value (products | research). */
  (function setActiveNav() {
    var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var current = file === '' || file === '/' || file === 'index.html'
      ? null                       // home has no Products/Research active state
      : file.replace(/\.html$/, ''); // products.html -> products
    if (!current) return;
    $all('[data-nav]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-nav') === current);
    });
  })();

  /* Grow the pixel sprites only after loading, and only while visible. */
  var vineHeroes = $all('.hero').filter(function (hero) { return $('.hero-vine', hero); });
  var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (vineHeroes.length && !motionPreference.matches) {
    vineHeroes.forEach(function (hero) { hero.classList.add('vines-pending'); });
    var vineImage = new Image();
    vineImage.onload = function () {
      vineHeroes.forEach(function (hero) {
        hero.classList.remove('vines-pending');
        hero.classList.add('vines-ready');
      });
      if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            entry.target.classList.toggle('vines-in-view', entry.isIntersecting);
          });
        });
        vineHeroes.forEach(function (hero) { observer.observe(hero); });
      } else {
        vineHeroes.forEach(function (hero) { hero.classList.add('vines-in-view'); });
      }
    };
    vineImage.onerror = function () {
      vineHeroes.forEach(function (hero) { hero.classList.remove('vines-pending'); });
    };
    vineImage.src = 'assets/pixel-vine.png';
  }

  /* ----------------------------------------------------------- mobile nav */
  var mobileNav = $('#mobileNav');
  var menuBtn = $('#menuBtn');
  var background = $all('.site-header, main, .site-footer');
  var previousOverflow = '';
  var previousInert = [];

  function navIsOpen() { return mobileNav && mobileNav.classList.contains('open'); }
  function focusableItems() {
    return $all('a[href], button:not([disabled])', mobileNav).filter(function (el) {
      return el.getClientRects().length > 0;
    });
  }

  function openNav() {
    if (!mobileNav || navIsOpen()) return;
    previousOverflow = document.body.style.overflow;
    previousInert = background.map(function (el) { return el.inert; });
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    mobileNav.setAttribute('role', 'dialog');
    mobileNav.setAttribute('aria-modal', 'true');
    mobileNav.setAttribute('aria-label', 'Navigation menu');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    background.forEach(function (el) { el.inert = true; });
    var closeButton = $('.menu-close', mobileNav);
    if (closeButton) closeButton.focus();
  }
  function closeNav() {
    if (!navIsOpen()) return;
    background.forEach(function (el, i) { el.inert = previousInert[i]; });
    if (menuBtn && menuBtn.getClientRects().length) menuBtn.focus();
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    mobileNav.removeAttribute('aria-modal');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousOverflow;
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      navIsOpen() ? closeNav() : openNav();
    });
  }
  $all('[data-close-nav]').forEach(function (el) {
    el.addEventListener('click', closeNav);
  });
  document.addEventListener('keydown', function (e) {
    if (!navIsOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); closeNav(); }
    if (e.key === 'Tab') {
      var items = focusableItems();
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 820) closeNav();
  });
})();
