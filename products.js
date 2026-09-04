/* Accessible inline explanations used on products.html. */
(function () {
  'use strict';

  var openTerm = null;
  var closeTimer = null;

  function closeTerm() {
    clearTimeout(closeTimer);
    if (!openTerm) return;
    openTerm.tip.hidden = true;
    openTerm = null;
  }

  function showTerm(button, tip) {
    closeTerm();
    tip.hidden = false;
    var rect = button.getBoundingClientRect();
    var viewportWidth = document.documentElement.clientWidth;
    tip.style.maxWidth = (viewportWidth - 24) + 'px';
    var width = tip.offsetWidth;
    tip.style.left = Math.max(12, Math.min(rect.left, viewportWidth - width - 12)) + 'px';
    tip.style.top = Math.max(8, rect.top - tip.offsetHeight - 10) + 'px';
    openTerm = { button: button, tip: tip };
  }

  document.querySelectorAll('.os-term-trigger').forEach(function (button) {
    var tip = document.getElementById(button.getAttribute('aria-describedby'));
    if (!tip) return;
    document.body.appendChild(tip);
    button.addEventListener('pointerenter', function (event) {
      if (event.pointerType !== 'touch') showTerm(button, tip);
    });
    function scheduleClose() {
      if (document.activeElement !== button) closeTimer = setTimeout(closeTerm, 160);
    }
    button.addEventListener('pointerleave', scheduleClose);
    tip.addEventListener('pointerenter', function () { clearTimeout(closeTimer); });
    tip.addEventListener('pointerleave', scheduleClose);
    button.addEventListener('focus', function () { showTerm(button, tip); });
    button.addEventListener('blur', closeTerm);
    button.addEventListener('click', function () { showTerm(button, tip); });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeTerm();
  });
  document.addEventListener('pointerdown', function (event) {
    if (openTerm && !openTerm.button.contains(event.target) && !openTerm.tip.contains(event.target)) closeTerm();
  });
  window.addEventListener('scroll', closeTerm, { passive: true });
  window.addEventListener('resize', closeTerm);
})();
