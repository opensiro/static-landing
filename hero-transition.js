/* Enhance navigation between the two hero pages, without intercepting links. */
(function () {
  'use strict';
  function heroPage(url) {
    if (!url) return false;
    var target = new URL(url, location.href);
    var base = new URL('.', location.href);
    return target.origin === base.origin && !target.hash &&
      ['', 'index.html', 'products.html'].some(function (file) { return target.pathname === base.pathname + file; });
  }
  function skip(event, from, to) {
    if (!event.viewTransition) return;
    if (!heroPage(from) || !heroPage(to) || window.scrollY > 8 ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      event.viewTransition.skipTransition();
    }
  }
  window.addEventListener('pageswap', function (event) {
    skip(event, location.href, event.activation && event.activation.entry.url);
  });
  window.addEventListener('pagereveal', function (event) {
    var activation = window.navigation && window.navigation.activation;
    skip(event, activation && activation.from && activation.from.url, location.href);
  });
})();
