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

  /* Curling stems are sampled onto a pixel grid. Branch timing follows the
     stem junction; buds appear at the tips before their petals unfold. */
  function buildGrowingVine(container, variant) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 256 768');
    svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var pixels = new Map();
    function pixel(x, y, delay) {
      if (x < 0 || x >= 64 || y < 0 || y >= 192) return;
      var key = x + ',' + y;
      if (!pixels.has(key) || delay < pixels.get(key).delay) pixels.set(key, { x: x, y: y, delay: delay });
    }
    function element(tag, attrs, parent) {
      var node = document.createElementNS(ns, tag);
      Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
      if (parent) parent.appendChild(node);
      return node;
    }
    function timed(node, delay) { node.style.setProperty('--grow-at', delay.toFixed(3) + 's'); }
    function bezier(points, t) {
      var s = 1 - t;
      return [0, 1].map(function (axis) {
        return s * s * s * points[0][axis] + 3 * s * s * t * points[1][axis]
          + 3 * s * t * t * points[2][axis] + t * t * t * points[3][axis];
      });
    }
    function trace(pointAt, start, duration) {
      var previous = pointAt(0);
      for (var step = 0; step <= 160; step++) {
        var point = pointAt(step / 160);
        var distance = Math.ceil(Math.max(Math.abs(point[0] - previous[0]), Math.abs(point[1] - previous[1]))) || 1;
        for (var join = 0; join <= distance; join++) {
          pixel(Math.round(previous[0] + (point[0] - previous[0]) * join / distance),
            Math.round(previous[1] + (point[1] - previous[1]) * join / distance), start + duration * step / 160);
        }
        previous = point;
      }
      return previous;
    }
    var ornaments = element('g', { 'class': 'vine-ornaments' });
    function leaf(point, direction, delay) {
      var anchor = element('g', { transform: 'translate(' + Math.round(point[0]) * 4 + ' ' + Math.round(point[1]) * 4 + ') scale(' + direction + ' 1)' }, ornaments);
      timed(element('path', { 'class': 'vine-leaf', d: 'M0 0h8v-4h8v-4h8v-8h-8v4H8v4H4v4H0Z' }, anchor), delay);
    }
    function flower(point, delay) {
      var anchor = element('g', { 'class': 'vine-flower', transform: 'translate(' + Math.round(point[0]) * 4 + ' ' + Math.round(point[1]) * 4 + ')' }, ornaments);
      for (var petal = 0; petal < 6; petal++) {
        var rotation = element('g', { transform: 'rotate(' + (petal * 60 + variant * 15) + ')' }, anchor);
        timed(element('path', { 'class': 'vine-petal', d: 'M-4-4h8v-4h4v-12H4v-4H-4v4H-8v12h4Z' }, rotation), delay + .2 + petal * .025);
      }
      timed(element('path', { 'class': 'vine-bud', d: 'M-4-8h8v4h4v8H4v4H-4V4H-8V-4h4Z' }, anchor), delay);
      timed(element('rect', { 'class': 'vine-flower-center', x: -3, y: -3, width: 6, height: 6 }, anchor), delay + .48);
    }
    var curves = [
      [[31, 188], [50, 178], [48, 151], [18, 147]],
      [[18, 147], [0, 144], [6, 118], [43, 108]],
      [[43, 108], [62, 100], [57, 75], [17, 66]],
      [[17, 66], [0, 55], [14, 21], [31, 16]]
    ];
    curves.forEach(function (curve, index) {
      var start = .18 + variant * .28 + index * .72;
      var end = trace(function (t) { return bezier(curve, t); }, start, .72);
      leaf(bezier(curve, .48), index % 2 ? -1 : 1, start + .5);
      if (index < 3) {
        var direction = index % 2 ? -1 : 1;
        var radius = 11 + variant;
        var tip = trace(function (t) {
          var angle = Math.PI + t * Math.PI * 1.8;
          var r = radius * (1 - .76 * t);
          return [end[0] + direction * radius + direction * r * Math.cos(angle), end[1] + r * Math.sin(angle)];
        }, start + .72, .64);
        flower(tip, start + 1.4);
      } else {
        flower(end, start + .78);
      }
    });
    pixels.forEach(function (part) {
      var rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', part.x * 4);
      rect.setAttribute('y', part.y * 4);
      rect.setAttribute('width', 4);
      rect.setAttribute('height', 4);
      rect.setAttribute('class', 'vine-pixel');
      rect.style.setProperty('--grow-at', part.delay.toFixed(3) + 's');
      svg.appendChild(rect);
    });
    svg.appendChild(ornaments);
    container.appendChild(svg);
  }
  $all('.vine-growing').forEach(function (vine, index) { buildGrowingVine(vine, index % 2); });
  var vineHeroes = $all('.hero').filter(function (hero) { return $('.vine-growing', hero); });
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  vineHeroes.forEach(function (hero) {
    var parts = $all('.vine-growing [style]', hero).map(function (node) {
      return { node: node, at: parseFloat(node.style.getPropertyValue('--grow-at')) * 1000 };
    }).sort(function (a, b) { return a.at - b.at; });
    var elapsed = 0;
    var next = 0;
    var lastTime = null;
    var frame = null;
    var inView = false;
    hero.classList.add('vines-ready');
    parts.forEach(function (part) { part.node.setAttribute('visibility', 'hidden'); });

    function reveal(part, animate) {
      part.node.removeAttribute('visibility');
      if (animate && (part.node.classList.contains('vine-petal') || part.node.classList.contains('vine-bud') || part.node.classList.contains('vine-leaf'))) {
        part.node.classList.add('vine-unfolding');
      } else {
        part.node.classList.remove('vine-unfolding');
      }
    }
    function tick(now) {
      if (lastTime !== null) elapsed += now - lastTime;
      lastTime = now;
      while (next < parts.length && parts[next].at <= elapsed) reveal(parts[next++], true);
      frame = next < parts.length ? requestAnimationFrame(tick) : null;
    }
    function sync() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
      var playing = inView && !document.hidden;
      hero.classList.toggle('vines-in-view', playing);
      if (reducedMotion.matches) {
        parts.forEach(function (part) { reveal(part, false); });
        next = parts.length;
      } else if (playing && next < parts.length) {
        frame = requestAnimationFrame(tick);
      }
    }
    if ('IntersectionObserver' in window) {
      var vineObserver = new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        sync();
      });
      vineObserver.observe(hero);
    } else { inView = true; }
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);
    sync();
  });

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
