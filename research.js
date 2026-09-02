/* The animation assets contain the supplied answers. This is a visual replay,
   not an evaluator or a recording of a model's reasoning. */
(function () {
  'use strict';
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-sample]'));
  if (!cards.length) return;

  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var observer = null;

  function animations(card) {
    var svg = card.querySelector('svg');
    return svg && svg.getAnimations ? svg.getAnimations({ subtree: true }) : [];
  }

  function play(card) {
    card.classList.add('sample-running');
    if (motion.matches) return;
    animations(card).forEach(function (animation) {
      animation.currentTime = 0;
      animation.play();
    });
  }

  cards.forEach(function (card) {
    var button = card.querySelector('.sample-replay');
    button.hidden = motion.matches;
    button.addEventListener('click', function () { play(card); });
  });

  function updateMotion() {
    if (observer) observer.disconnect();
    cards.forEach(function (card) {
      card.querySelector('.sample-replay').hidden = motion.matches;
    });
    if (motion.matches) return;
    if (!('IntersectionObserver' in window)) {
      cards.forEach(play);
      return;
    }
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          animations(entry.target).forEach(function (animation) { animation.pause(); });
        } else if (!entry.target.classList.contains('sample-running')) {
          play(entry.target);
        } else {
          animations(entry.target).forEach(function (animation) {
            if (animation.playState === 'paused' && animation.currentTime < animation.effect.getComputedTiming().endTime) animation.play();
          });
        }
      });
    }, { threshold: 0.15 });
    cards.forEach(function (card) { observer.observe(card); });
  }

  updateMotion();
  motion.addEventListener('change', updateMotion);
})();
