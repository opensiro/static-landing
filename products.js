/* OpenSiro article navigation, pipeline replay, and measured cost playback. */
(function () {
  'use strict';

  // Keep explanations above their terms, including at narrow viewport edges.
  var openTerm = null;
  var termCloseTimer = null;
  function closeTerm() {
    clearTimeout(termCloseTimer);
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
    button.addEventListener('pointerenter', function (event) { if (event.pointerType !== 'touch') showTerm(button, tip); });
    function scheduleClose() {
      if (document.activeElement !== button) termCloseTimer = setTimeout(closeTerm, 160);
    }
    button.addEventListener('pointerleave', scheduleClose);
    tip.addEventListener('pointerenter', function () { clearTimeout(termCloseTimer); });
    tip.addEventListener('pointerleave', scheduleClose);
    button.addEventListener('focus', function () { showTerm(button, tip); });
    button.addEventListener('blur', closeTerm);
    button.addEventListener('click', function () { showTerm(button, tip); });
  });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeTerm(); });
  document.addEventListener('pointerdown', function (event) {
    if (openTerm && !openTerm.button.contains(event.target) && !openTerm.tip.contains(event.target)) closeTerm();
  });
  window.addEventListener('scroll', closeTerm, { passive: true });
  window.addEventListener('resize', closeTerm);

  var costSystem = document.querySelector('[data-cost-system]');
  if (costSystem) {
    var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var tokenMeter = costSystem.querySelector('[data-token-meter]');
    var costMeter = costSystem.querySelector('[data-cost-meter]');
    var llmPath = costSystem.querySelector('.os-cost-path-llm');
    var slmPath = costSystem.querySelector('.os-cost-path-slm');
    var deltaCells = Array.prototype.slice.call(costSystem.querySelectorAll('.os-delta-stack span'));
    var measuredTokens = 735200000;
    var measuredCost = 2059.19;
    var playbackLength = 16000;
    var playbackPause = 2600;
    var playbackStart = performance.now();
    var costVisible = false;
    var costFrame = null;
    var examples = [
      { deltas: ['+7.2', '+3.8', '+5.1', '+1.9', '+4.4'], fail: false },
      { deltas: ['+2.1', '−0.8', '+1.4', '−1.2', '+0.6'], fail: true },
      { deltas: ['+4.6', '+2.8', '+3.3', '+1.1', '+2.4'], fail: false }
    ];
    var lastExample = -1;
    var integerFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
    var moneyFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function showExample(index) {
      if (index === lastExample) return;
      lastExample = index;
      var example = examples[index];
      deltaCells.forEach(function (cell, cellIndex) {
        cell.textContent = example.deltas[cellIndex];
        cell.classList.toggle('is-negative', example.deltas[cellIndex].charAt(0) === '−');
      });
      slmPath.classList.toggle('is-fail', example.fail);
    }

    function setMeters(progress) {
      var eased = 1 - Math.pow(1 - progress, 3);
      tokenMeter.textContent = integerFormat.format(Math.round(measuredTokens * eased));
      costMeter.textContent = '$' + moneyFormat.format(measuredCost * eased);
      llmPath.style.setProperty('--meter-progress', (progress * 100).toFixed(2) + '%');
    }

    function drawCostPlayback(now) {
      costFrame = null;
      if (!costVisible || document.hidden) return;
      if (motionPreference.matches) {
        showExample(0);
        setMeters(1);
        return;
      }
      var elapsed = (now - playbackStart) % (playbackLength + playbackPause);
      var progress = Math.min(elapsed / playbackLength, 1);
      setMeters(progress);
      showExample(Math.floor((now - playbackStart) / 5400) % examples.length);
      costFrame = requestAnimationFrame(drawCostPlayback);
    }

    function syncCostMotion() {
      costSystem.classList.add('is-active');
      costSystem.classList.toggle('is-paused', !costVisible || document.hidden || motionPreference.matches);
      if (costVisible && !document.hidden && costFrame === null) costFrame = requestAnimationFrame(drawCostPlayback);
      if ((!costVisible || document.hidden) && costFrame !== null) {
        cancelAnimationFrame(costFrame);
        costFrame = null;
      }
    }

    new IntersectionObserver(function (entries) {
      costVisible = entries[0].isIntersecting;
      if (costVisible) playbackStart = performance.now();
      syncCostMotion();
    }, { threshold: .08 }).observe(costSystem);
    document.addEventListener('visibilitychange', syncCostMotion);
    motionPreference.addEventListener('change', syncCostMotion);
    showExample(0);
    setMeters(motionPreference.matches ? 1 : 0);
  }

  var nav = document.querySelector('.os-section-nav');
  if (nav) {
    var scroll = nav.querySelector('.os-section-nav-scroll');
    var links = Array.prototype.slice.call(nav.querySelectorAll('[data-os-section]'));
    var glider = nav.querySelector('.os-section-glider');
    var sections = links.map(function (link) { return document.getElementById(link.dataset.osSection); });
    var active = -1;
    var frame = null;
    function place(index, reveal) {
      var link = links[index];
      if (!link || !glider) return;
      glider.style.width = link.offsetWidth + 'px';
      glider.style.setProperty('--os-glider-x', link.offsetLeft + 'px');
      if (reveal) link.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    function select(index, reveal) {
      if (index === active) return;
      active = index;
      links.forEach(function (link, i) {
        link.classList.toggle('is-active', i === index);
        if (i === index) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      place(index, reveal);
    }
    function sync() {
      frame = null;
      var marker = window.innerHeight * .36;
      var index = 0;
      sections.forEach(function (section, i) { if (section && section.getBoundingClientRect().top <= marker) index = i; });
      select(index, true);
    }
    links.forEach(function (link, index) { link.addEventListener('click', function () { select(index, false); }); });
    window.addEventListener('scroll', function () { if (frame === null) frame = requestAnimationFrame(sync); }, { passive: true });
    window.addEventListener('resize', function () { place(active, true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(active, false); });
    sync();
  }

  var pipeline = document.querySelector('[data-pipeline]');
  var replay = document.querySelector('.os-replay');
  function runPipeline() {
    if (!pipeline) return;
    pipeline.classList.remove('is-running');
    void pipeline.offsetWidth;
    pipeline.classList.add('is-running');
  }
  if (replay) replay.addEventListener('click', runPipeline);
  runPipeline();

})();
