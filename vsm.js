/* VSMLite — role diorama and autonomy horizon. */
(function () {
  'use strict';

  var systems = {
    s1: { code:'S1 / OPERATION', title:'Do the work', thesis:'Turn missions into outcomes.', role:'S1', label:'S1 units execute work' },
    s2: { code:'S2 / COORDINATION', title:'Prevent collisions', thesis:'Synchronize autonomous peers.', role:'S2', label:'S2 routes signals between S1 units' },
    s3: { code:'S3 / INSIDE + NOW', title:'Tune the system', thesis:'Read metrics. Reallocate capacity.', role:'S3', label:'S3 studies metrics while S1 units operate' },
    s3x:{ code:'S3* / AUDIT', title:'Check reality', thesis:'Sample work outside self-reporting.', role:'S3*', label:'S3 star independently inspects S1 units' },
    s4: { code:'S4 / OUTSIDE + NEXT', title:'Read the outside', thesis:'Only needed when the environment moves.', role:'S4', label:'S4 reads a changing external environment' },
    s5: { code:'S5 / IDENTITY', title:'Hold the boundary', thesis:'Keep adaptation legitimate.', role:'S5', label:'S5 protects the organizational boundary' }
  };

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-system]'));
  var panel = document.getElementById('system-panel');
  if (tabs.length && panel) {
    var code = panel.querySelector('[data-system-code]');
    var title = panel.querySelector('[data-system-title]');
    var thesis = panel.querySelector('[data-system-thesis]');
    var diagram = panel.querySelector('[data-system-diagram]');
    var leadRole = diagram.querySelector('[data-lead-role]');

    function select(tab, moveFocus) {
      var key = tab.getAttribute('data-system');
      var item = systems[key];
      if (!item) return;
      tabs.forEach(function (candidate) {
        var selected = candidate === tab;
        candidate.setAttribute('aria-selected', selected ? 'true' : 'false');
        candidate.tabIndex = selected ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', tab.id);
      code.textContent = item.code;
      title.textContent = item.title;
      thesis.textContent = item.thesis;
      leadRole.textContent = item.role;
      diagram.className = 'system-diagram role-' + key;
      diagram.setAttribute('aria-label', item.label);
      if (moveFocus) tab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (event) {
        var next = index;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        select(tabs[next], true);
      });
    });
  }

  var figure = document.querySelector('[data-autonomy-figure]');
  var roles = Array.prototype.slice.call(document.querySelectorAll('[data-autonomy-roles] li'));
  var toggle = document.querySelector('[data-autonomy-toggle]');
  var replay = document.querySelector('[data-autonomy-replay]');
  if (!figure || !roles.length || !toggle || !replay) return;

  var states = [
    'S1 keeps work moving',
    'S2 absorbs coordination noise',
    'S3 corrects resource drift',
    'S3* catches hidden failure',
    'S4 adapts before the environment wins',
    'S5 preserves purpose through change'
  ];
  var state = figure.querySelector('[data-autonomy-state]');
  var horizon = figure.querySelector('[data-autonomy-horizon]');
  var horizons = ['< 1 DAY','DAYS → WEEKS','WEEKS','WEEKS +','MONTHS *','OPEN-ENDED *'];
  var duration = 14000;
  var frame = null;
  var startedAt = 0;
  var elapsed = 0;
  var paused = false;
  var visible = false;
  var complete = false;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function setProgress(progress) {
    var bounded = Math.max(0, Math.min(1, progress));
    var stage = Math.min(5, Math.floor(bounded * 6));
    figure.style.setProperty('--autonomy-progress', (bounded * 100).toFixed(2) + '%');
    figure.setAttribute('data-stage', String(stage));
    state.textContent = states[stage];
    if (horizon) horizon.textContent = horizons[stage];
    roles.forEach(function (item, index) {
      item.classList.toggle('is-active', index === stage);
      item.classList.toggle('is-complete', index < stage);
    });
  }

  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }

  function draw(now) {
    frame = null;
    if (!startedAt) startedAt = now - elapsed;
    elapsed = now - startedAt;
    var progress = elapsed / duration;
    setProgress(progress);
    if (progress >= 1) {
      complete = true;
      toggle.textContent = 'Complete';
      toggle.disabled = true;
      return;
    }
    if (!paused && visible && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function start() {
    if (reduceMotion.matches || paused || complete || !visible || document.hidden || frame !== null) return;
    frame = requestAnimationFrame(draw);
  }

  function reset() {
    stop();
    startedAt = 0;
    elapsed = 0;
    paused = false;
    complete = false;
    toggle.disabled = false;
    toggle.textContent = 'Pause';
    toggle.setAttribute('aria-label', 'Pause autonomy animation');
    setProgress(0);
    start();
  }

  toggle.addEventListener('click', function () {
    if (complete) return;
    paused = !paused;
    toggle.textContent = paused ? 'Resume' : 'Pause';
    toggle.setAttribute('aria-label', paused ? 'Resume autonomy animation' : 'Pause autonomy animation');
    if (paused) stop();
    else {
      startedAt = performance.now() - elapsed;
      start();
    }
  });
  replay.addEventListener('click', reset);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else {
      startedAt = performance.now() - elapsed;
      start();
    }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    }, { threshold:.2 }).observe(figure);
  } else {
    visible = true;
  }

  if (reduceMotion.matches) {
    setProgress(1);
    complete = true;
    toggle.textContent = 'Motion off';
    toggle.disabled = true;
  } else {
    setProgress(0);
    start();
  }
})();
