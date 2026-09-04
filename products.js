/* OpenSiro article navigation, accessible terms, and synchronized run playback. */
(function () {
  'use strict';

  /* Inline explanations are shared with products.html. */
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
    button.addEventListener('pointerenter', function (event) {
      if (event.pointerType !== 'touch') showTerm(button, tip);
    });
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

  /* Both benchmark designs share one start signal and phase clock. */
  var costSystem = document.querySelector('[data-cost-system]');
  if (costSystem) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var replay = document.querySelector('[data-run-replay]');
    var toggle = document.querySelector('[data-run-toggle]');
    var clock = costSystem.querySelector('[data-run-clock]');
    var stage = costSystem.querySelector('[data-run-stage]');
    var slmPanel = costSystem.querySelector('[data-run-panel="slm"]');
    var llmPanel = costSystem.querySelector('[data-run-panel="llm"]');
    var commitCard = costSystem.querySelector('[data-commit-active]');
    var commitState = costSystem.querySelector('[data-commit-state]');
    var commitProgress = costSystem.querySelector('[data-commit-progress]');
    var slmRunState = costSystem.querySelector('[data-slm-run-state]');
    var llmRunState = costSystem.querySelector('[data-llm-run-state]');
    var modelLanes = Array.prototype.slice.call(costSystem.querySelectorAll('.os-model-lane'));
    var modelBars = Array.prototype.slice.call(costSystem.querySelectorAll('[data-model-progress]'));
    var llmBar = costSystem.querySelector('[data-llm-progress]');
    var llmPercent = costSystem.querySelector('[data-llm-percent]');
    var slmTokenMeter = costSystem.querySelector('[data-slm-token-meter]');
    var slmCostMeter = costSystem.querySelector('[data-slm-cost-meter]');
    var slmTimeMeter = costSystem.querySelector('[data-slm-time-meter]');
    var llmTokenMeter = costSystem.querySelector('[data-llm-token-meter]');
    var llmCostMeter = costSystem.querySelector('[data-llm-cost-meter]');
    var llmTimeMeter = costSystem.querySelector('[data-llm-time-meter]');
    var playbackLength = 18000;
    var playbackPause = 3600;
    var playbackStart = performance.now();
    var isVisible = false;
    var isPaused = false;
    var pausedElapsed = 0;
    var animationFrame = null;
    var llmTokens = 735197348;
    var llmCost = 2059.19;
    var referenceTrials = 445;
    var candidateTasks = 20;
    var referenceSecondsPerTrial = 482.6;
    var inputPerModel = (336797311 + 392433664) * candidateTasks / referenceTrials;
    var outputPerModel = 5966373 * candidateTasks / referenceTrials;
    var slmTokens = (inputPerModel + outputPerModel) * modelLanes.length;
    var slmCost = modelLanes.reduce(function (sum, lane) {
      var estimate = inputPerModel * Number(lane.dataset.inputRate) / 1000000 + outputPerModel * Number(lane.dataset.outputRate) / 1000000;
      lane.querySelector('[data-model-cost]').textContent = estimate === 0 ? 'Free' : money(estimate);
      return sum + estimate;
    }, 0);
    var slmMinutes = candidateTasks * referenceSecondsPerTrial / 60;
    var llmMinutes = referenceTrials * referenceSecondsPerTrial / 60;

    function clamp(value) { return Math.max(0, Math.min(1, value)); }
    function ease(value) { return 1 - Math.pow(1 - clamp(value), 3); }
    function compactTokens(value) {
      if (value < 1000000) return Math.round(value).toLocaleString('en-US');
      return (value / 1000000).toFixed(1) + 'M';
    }
    function money(value) {
      return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    function duration(totalMinutes) {
      var rounded = Math.round(totalMinutes);
      var hours = Math.floor(rounded / 60);
      var minutes = rounded % 60;
      return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
    }
    function runClock(progress) {
      var seconds = Math.round(progress * playbackLength / 1000);
      return '00:' + String(seconds).padStart(2, '0');
    }
    function setText(element, value) {
      if (element && element.textContent !== value) element.textContent = value;
    }

    function setProgress(progress) {
      var slmProgress = ease((progress - .13) / .49);
      var frontierProgress = ease((progress - .13) / .77);

      modelBars.forEach(function (bar) {
        bar.style.width = (slmProgress * 100).toFixed(2) + '%';
      });
      llmBar.style.width = (frontierProgress * 100).toFixed(2) + '%';
      llmPercent.textContent = Math.round(frontierProgress * 100) + '%';

      slmTokenMeter.textContent = compactTokens(slmTokens * slmProgress);
      slmCostMeter.textContent = money(slmCost * slmProgress);
      slmTimeMeter.textContent = duration(slmMinutes * slmProgress);
      llmTokenMeter.textContent = compactTokens(llmTokens * frontierProgress);
      llmCostMeter.textContent = money(llmCost * frontierProgress);
      llmTimeMeter.textContent = duration(llmMinutes * frontierProgress);
      clock.textContent = runClock(progress);

      slmPanel.classList.toggle('is-active', progress >= .06 && progress < .62);
      llmPanel.classList.toggle('is-active', progress >= .06 && progress < .90);
      slmPanel.classList.toggle('is-complete', progress >= .62);
      llmPanel.classList.toggle('is-complete', progress >= .90);
      costSystem.classList.toggle('is-complete', progress >= .90);
      commitCard.classList.toggle('is-running', progress >= .06 && progress < .62);
      commitCard.classList.toggle('is-complete', progress >= .62);
      commitProgress.style.width = (slmProgress * 100).toFixed(2) + '%';
      setText(commitState, progress < .06 ? 'queued' : progress < .13 ? 'dispatched' : progress < .62 ? 'running' : 'evidence saved');
      setText(slmRunState, progress < .13 ? 'queued' : progress < .62 ? 'running' : 'evidence');
      setText(llmRunState, progress < .13 ? 'queued' : progress < .90 ? 'running' : 'complete');
      if (progress < .06) setText(stage, 'Commit + hypothesis queued');
      else if (progress < .13) setText(stage, 'Dispatching both runs');
      else if (progress < .62) setText(stage, 'Flash / Small + LLM running');
      else if (progress < .90) setText(stage, 'Sandbox evidence ready · baseline running');
      else setText(stage, 'Comparison complete');
    }

    function draw(now) {
      animationFrame = null;
      if (!isVisible || isPaused || document.hidden || reduceMotion.matches) return;
      var elapsed = now - playbackStart;
      var cycle = playbackLength + playbackPause;
      if (elapsed >= cycle) {
        playbackStart = now;
        elapsed = 0;
      }
      setProgress(Math.min(elapsed / playbackLength, 1));
      animationFrame = requestAnimationFrame(draw);
    }

    function startPlayback(restart) {
      if (reduceMotion.matches) {
        setProgress(1);
        stage.textContent = 'Comparison complete · motion reduced';
        return;
      }
      if (isPaused) return;
      if (restart) playbackStart = performance.now();
      if (isVisible && !document.hidden && animationFrame === null) animationFrame = requestAnimationFrame(draw);
    }

    function stopPlayback() {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    if (replay) replay.addEventListener('click', function () {
      isPaused = false;
      if (toggle && !reduceMotion.matches) {
        toggle.textContent = 'Pause';
        toggle.setAttribute('aria-label', 'Pause benchmark animation');
      }
      setProgress(reduceMotion.matches ? 1 : 0);
      startPlayback(true);
    });
    if (toggle) toggle.addEventListener('click', function () {
      if (reduceMotion.matches) return;
      isPaused = !isPaused;
      toggle.textContent = isPaused ? 'Resume' : 'Pause';
      toggle.setAttribute('aria-label', isPaused ? 'Resume benchmark animation' : 'Pause benchmark animation');
      if (isPaused) {
        pausedElapsed = performance.now() - playbackStart;
        stopPlayback();
      } else {
        playbackStart = performance.now() - pausedElapsed;
        startPlayback(false);
      }
    });

    new IntersectionObserver(function (entries) {
      isVisible = entries[0].isIntersecting;
      if (isVisible) startPlayback(true);
      else stopPlayback();
    }, { threshold: .06 }).observe(costSystem);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopPlayback();
      else startPlayback(true);
    });
    function motionChanged() {
      stopPlayback();
      isPaused = false;
      if (toggle) {
        toggle.disabled = reduceMotion.matches;
        toggle.textContent = reduceMotion.matches ? 'Motion reduced' : 'Pause';
        toggle.setAttribute('aria-label', reduceMotion.matches ? 'Animation disabled by reduced motion preference' : 'Pause benchmark animation');
      }
      startPlayback(true);
    }
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', motionChanged);
    else reduceMotion.addListener(motionChanged);
    setProgress(reduceMotion.matches ? 1 : 0);
    motionChanged();
  }

  /* Fixed horizontal contents glider. */
  var nav = document.querySelector('.os-section-nav');
  if (nav) {
    var navScroll = nav.querySelector('.os-section-nav-scroll');
    var links = Array.prototype.slice.call(nav.querySelectorAll('[data-os-section]'));
    var glider = nav.querySelector('.os-section-glider');
    var sections = links.map(function (link) { return document.getElementById(link.dataset.osSection); });
    var active = -1;
    var navFrame = null;
    var navReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function place(index, reveal) {
      var link = links[index];
      if (!link || !glider) return;
      glider.style.width = link.offsetWidth + 'px';
      glider.style.setProperty('--os-glider-x', link.offsetLeft + 'px');
      if (reveal && navScroll) {
        var target = link.offsetLeft - (navScroll.clientWidth - link.offsetWidth) / 2;
        navScroll.scrollTo({ left: Math.max(0, target), behavior: navReduceMotion.matches ? 'auto' : 'smooth' });
      }
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

    function syncNavigation() {
      navFrame = null;
      var marker = window.innerHeight * .34;
      var index = 0;
      sections.forEach(function (section, i) {
        if (section && section.getBoundingClientRect().top <= marker) index = i;
      });
      select(index, true);
    }

    links.forEach(function (link, index) {
      link.addEventListener('click', function () { select(index, false); });
    });
    window.addEventListener('scroll', function () {
      if (navFrame === null) navFrame = requestAnimationFrame(syncNavigation);
    }, { passive: true });
    window.addEventListener('resize', function () { place(active, true); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(active, false); });
    syncNavigation();
  }
})();
