/* VSMLite — accessible system browser and OSM synthesis playback. */
(function () {
  'use strict';

  var systems = {
    s1: { code:'S1 / OPERATION', title:'Do the work', thesis:'Autonomous units turn missions into outcomes.', detail:'A function—not one agent. Backend may contain API, Storage and Data units, each with its own agents.', env:'MISSION', role:'OPERATE', nodes:['API','STORAGE','DATA'], signal:'WORK → OUTCOME' },
    s2: { code:'S2 / COORDINATION', title:'Detect interference', thesis:'Watch S1 units, surface conflicts and synchronize peers.', detail:'S2 does not absorb local authority. It issues alerts and coordination signals when autonomous work starts to collide.', env:'UNIT SIGNALS', role:'ALERT + SYNC', nodes:['CONFLICT','DEPENDENCY','CAPACITY'], signal:'PEER COORDINATION / NO CENTRAL COMMAND' },
    s3: { code:'S3 / INSIDE + NOW', title:'Optimize operation', thesis:'Allocate shared resources and resolve escalations.', detail:'S3 sees the current whole: it balances budget, priority and capacity while S1 units keep operating locally.', env:'LOCAL REPORTS', role:'OPTIMIZE', nodes:['BUDGET','PRIORITY','ESCALATION'], signal:'GLOBAL VIEW → LOCAL DECISIONS' },
    s3x:{ code:'S3* / AUDIT', title:'Verify reality', thesis:'Sample operations independently of their self-reports.', detail:'S3* checks traces, evaluations and anomalies when information asymmetry makes normal reporting insufficient.', env:'REALITY SAMPLE', role:'VERIFY', nodes:['TRACES','EVALS','ANOMALIES'], signal:'EVIDENCE BYPASSES SELF-REPORT' },
    s4: { code:'S4 / OUTSIDE + NEXT', title:'Evolve the system', thesis:'Model alternatives before changing the organization.', detail:'S4 reads the environment, runs experiments and proposes new planners, routing, memory or organizational topology.', env:'ENVIRONMENT', role:'EVOLVE', nodes:['SIMULATE','COMPARE','RESTRUCTURE'], signal:'PRESENT SYSTEM ↔ POSSIBLE SYSTEM' },
    s5: { code:'S5 / IDENTITY', title:'Protect the boundary', thesis:'Define what adaptation cannot silently rewrite.', detail:'S5 holds identity, policy, security and limits—the invariants inside which autonomous evolution remains legitimate.', env:'IDENTITY', role:'CONSTRAIN', nodes:['POLICY','SECURITY','LIMITS'], signal:'AUTONOMY INSIDE A BOUNDARY' }
  };

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-system]'));
  var panel = document.getElementById('system-panel');
  if (tabs.length && panel) {
    var code = panel.querySelector('[data-system-code]');
    var title = panel.querySelector('[data-system-title]');
    var thesis = panel.querySelector('[data-system-thesis]');
    var detail = panel.querySelector('[data-system-detail]');
    var diagram = panel.querySelector('[data-system-diagram]');
    var environment = diagram.querySelector('.role-environment span');
    var role = diagram.querySelector('[data-role-label]');
    var outputs = Array.prototype.slice.call(diagram.querySelectorAll('.role-output span'));
    var signal = diagram.querySelector('[data-role-signal]');

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
      detail.textContent = item.detail;
      environment.textContent = item.env;
      role.textContent = item.role;
      outputs.forEach(function (output, index) { output.textContent = item.nodes[index]; });
      signal.textContent = item.signal;
      diagram.className = 'system-diagram role-' + key;
      diagram.setAttribute('aria-label', item.code + ': ' + item.title);
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

  var figure = document.querySelector('[data-osm-figure]');
  var timeline = Array.prototype.slice.call(document.querySelectorAll('[data-osm-timeline] li'));
  var toggle = document.querySelector('[data-osm-toggle]');
  var replay = document.querySelector('[data-osm-replay]');
  if (!figure || !timeline.length || !toggle || !replay) return;

  var stages = [
    ['Intent','Parent identifies a missing viable function','A = 0'],
    ['Operations','Candidate S1 units begin doing the work','A = .15'],
    ['Coordination','S2 emerges as interactions start to collide','A = .30'],
    ['Regulation','S3 allocates shared resources and optimizes the whole','A = .48'],
    ['Verification','S3* observes independently when asymmetry grows','A = .62'],
    ['Adaptation','S4 models the environment and alternative structures','A = .80'],
    ['Identity','S5 defines policy, identity and autonomy boundaries','A = 1']
  ];
  var stageLabel = figure.querySelector('[data-osm-stage]');
  var stageState = figure.querySelector('[data-osm-state]');
  var autonomy = figure.querySelector('[data-osm-autonomy]');
  var duration = 15000;
  var frame = null;
  var startedAt = 0;
  var elapsed = 0;
  var paused = false;
  var visible = false;
  var complete = false;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function setProgress(progress) {
    var bounded = Math.max(0, Math.min(1, progress));
    var stage = Math.min(6, Math.floor(bounded * 7));
    figure.style.setProperty('--osm-progress', (bounded * 100).toFixed(2) + '%');
    figure.setAttribute('data-stage', String(stage));
    stageLabel.textContent = stages[stage][0];
    stageState.textContent = stages[stage][1];
    autonomy.textContent = stages[stage][2];
    timeline.forEach(function (item, index) {
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
    toggle.setAttribute('aria-label', 'Pause organizational synthesis animation');
    setProgress(0);
    start();
  }

  toggle.addEventListener('click', function () {
    if (complete) return;
    paused = !paused;
    toggle.textContent = paused ? 'Resume' : 'Pause';
    toggle.setAttribute('aria-label', paused ? 'Resume organizational synthesis animation' : 'Pause organizational synthesis animation');
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
