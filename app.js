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

  /* ----------------------------------------------------------- mobile nav */
  var mobileNav = $('#mobileNav');
  var menuBtn = $('#menuBtn');

  function openNav() {
    if (!mobileNav) return;
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      mobileNav.classList.contains('open') ? closeNav() : openNav();
    });
  }
  $all('[data-close-nav]').forEach(function (el) {
    el.addEventListener('click', closeNav);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });
})();
