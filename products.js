/* OpenSiro article navigation, pipeline replay, and illustrative economics. */
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

  var commitDemo = document.querySelector('.os-commit-demo');
  if (commitDemo) {
    var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var demoVisible = false;
    function syncCommitMotion() {
      commitDemo.classList.toggle('is-animated', !motionPreference.matches);
      commitDemo.classList.toggle('is-paused', !demoVisible || document.hidden);
    }
    new IntersectionObserver(function (entries) {
      demoVisible = entries[0].isIntersecting;
      syncCommitMotion();
    }).observe(commitDemo);
    document.addEventListener('visibilitychange', syncCommitMotion);
    motionPreference.addEventListener('change', syncCommitMotion);
    syncCommitMotion();
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

  var controls = document.getElementById('os-cost-controls');
  if (!controls) return;
  var fullTokens = 735200000;
  var matrixSize = 5;
  var commits = document.getElementById('os-commits');
  var tasks = document.getElementById('os-tasks');
  var tokens = document.getElementById('os-tokens');
  var promoted = document.getElementById('os-promoted');
  var formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
  function compact(value) {
    if (value >= 1e9) return formatter.format(value / 1e9) + 'B';
    if (value >= 1e6) return formatter.format(value / 1e6) + 'M';
    if (value >= 1e3) return formatter.format(value / 1e3) + 'K';
    return formatter.format(value);
  }
  function render() {
    var commitCount = Number(commits.value);
    var taskCount = Number(tasks.value);
    var tokenCount = Number(tokens.value);
    var promotedCount = Math.min(Number(promoted.value), commitCount);
    promoted.max = commitCount;
    if (Number(promoted.value) !== promotedCount) promoted.value = promotedCount;
    var screening = commitCount * matrixSize * taskCount * tokenCount;
    var frontier = promotedCount * fullTokens;
    var baseline = commitCount * fullTokens;
    var avoided = commitCount ? (commitCount - promotedCount) / commitCount * 100 : 0;
    document.getElementById('os-commits-value').textContent = formatter.format(commitCount);
    document.getElementById('os-tasks-value').textContent = formatter.format(taskCount);
    document.getElementById('os-tokens-value').textContent = compact(tokenCount);
    document.getElementById('os-promoted-value').textContent = formatter.format(promotedCount);
    document.getElementById('os-baseline').textContent = compact(baseline);
    document.getElementById('os-screened').textContent = compact(screening + frontier);
    document.getElementById('os-screened-formula').textContent = compact(screening) + ' screening + ' + compact(frontier) + ' frontier';
    document.getElementById('os-avoided').textContent = formatter.format(avoided) + '%';
    document.getElementById('os-gate-copy').textContent = promotedCount + ' of ' + commitCount + ' commits promoted';
  }
  controls.addEventListener('input', render);
  render();
})();
