/* VSMLite — role diorama and autonomy horizon. */
(function () {
  'use strict';

  var systems = {
    s1: { code:'S1 / OPERATION', title:'Run the operations', thesis:'Autonomous units meet their own local environments.', label:'S1 units exchange work with local environments', scene:'TOOL / WORK CASE' },
    s2: { code:'S2 / COORDINATION', title:'Dampen oscillation', thesis:'Coordinate interactions without taking over S1.', label:'S2 dampens oscillation between S1 units', scene:'RADIO / SIGNAL DESK' },
    s3: { code:'S3 / INSIDE + NOW', title:'Regulate the present', thesis:'Resources and current work across the whole.', label:'S3 controls current operations through S2 and S1', scene:'METRICS DASHBOARD' },
    s3x:{ code:'S3* / AUDIT', title:'Inspect directly', thesis:'Independent samples from operations.', label:'S3 star independently audits S1 operations', scene:'AUDIT PROBE' },
    s4: { code:'S4 / OUTSIDE + NEXT', title:'Model the future', thesis:'Essential when the outside world is changing.', label:'S4 exchanges intelligence with a dynamic environment', scene:'RADAR / TELESCOPE' },
    s5: { code:'S5 / POLICY', title:'Hold identity', thesis:'Purpose balances the present and future.', label:'S5 balances current control and future intelligence', scene:'COMPASS / POLICY' }
  };

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-system]'));
  var panel = document.getElementById('system-panel');
  if (tabs.length && panel) {
    var code = panel.querySelector('[data-system-code]');
    var title = panel.querySelector('[data-system-title]');
    var thesis = panel.querySelector('[data-system-thesis]');
    var diagram = panel.querySelector('[data-system-diagram]');
    var roleScene = panel.querySelector('[data-role-scene]');
    var roleSceneLabel = panel.querySelector('[data-role-scene-label]');

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
      diagram.className = 'model-beer role-' + key;
      diagram.setAttribute('aria-label', item.label);
      if (roleScene) roleScene.setAttribute('data-role', key);
      if (roleSceneLabel) roleSceneLabel.textContent = item.scene;
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

  // Scenarios are examples of responsibility, not levels or measured time horizons.
  var demo = document.querySelector('[data-autonomy-demo]');
  if (!demo) return;
  var scenarios = [
    ['A new task arrives.', 'The work fits an existing responsibility.', 'S1', 'Own it. Do it.', 'The responsible unit completes the task and checks its result.', 'No interruption.', 'Can review the outcome without directing each step.'],
    ['Two units need the same slot.', 'Their schedules conflict.', 'S2', 'Resolve the collision.', 'Coordination aligns the schedules so both units can keep working.', 'No interruption.', 'The teams coordinate within the agreed rules.'],
    ['One queue starts growing.', 'Another unit has capacity to spare.', 'S3', 'Rebalance the work.', 'Control reallocates available capacity within the approved resource limits.', 'No interruption.', 'No new budget or authority is needed.'],
    ['A report says “done”. It isn’t.', 'A direct sample reveals a missed check.', 'S3*', 'Find it. Feed it back.', 'Audit reports the mismatch to control; the responsible unit corrects the work.', 'No interruption.', 'The correction stays within the existing mandate.'],
    ['The outside world changes.', 'A new condition makes the current plan less useful.', 'S4', 'Sense. Test. Adapt.', 'Intelligence proposes a response; control tests it within the current policy.', 'No interruption.', 'A change beyond that policy would need a decision.'],
    ['The goal needs to change.', 'The proposed direction exceeds the agreed mandate.', 'S5', 'Make the boundary clear.', 'Policy identifies the decision that requires human authority.', 'A decision is needed.', 'Approve a new direction or keep the existing mandate.']
  ];
  var fields = ['event', 'context', 'role', 'action', 'detail', 'human', 'human-detail'];
  var choices = Array.prototype.slice.call(demo.querySelectorAll('[data-situation]'));
  function chooseScenario(index) {
    var scenario = scenarios[index];
    if (!scenario) return;
    fields.forEach(function (field, position) {
      demo.querySelector('[data-auto-' + field + ']').textContent = scenario[position];
    });
    var escalated = index === 5;
    demo.setAttribute('data-escalated', String(escalated));
    demo.querySelector('.autonomy-event-icon').textContent = ['+', '⇄', '▥', '!', '↗', '?'][index];
    demo.querySelector('[data-auto-outcome]').textContent = escalated ? '→ REQUEST A DECISION' : '↺ WORK CONTINUES';
    demo.querySelector('[data-auto-route]').textContent = escalated ? 'ESCALATE' : 'NO REQUEST';
    demo.querySelector('[data-auto-human-state]').textContent = escalated ? 'SETS THE MANDATE' : 'STAYS INFORMED';
    choices.forEach(function (button, position) {
      button.setAttribute('aria-pressed', String(position === index));
    });
  }
  choices.forEach(function (button) {
    button.addEventListener('click', function () {
      chooseScenario(Number(button.getAttribute('data-situation')));
    });
  });
  var motionButton = demo.querySelector('[data-auto-motion]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var paused = false;
  function updateMotion() {
    demo.classList.toggle('signals-paused', paused || reduceMotion.matches);
    motionButton.disabled = reduceMotion.matches;
    motionButton.textContent = reduceMotion.matches ? 'Motion off' : (paused ? 'Resume signals' : 'Pause signals');
    motionButton.setAttribute('aria-pressed', String(paused || reduceMotion.matches));
  }
  motionButton.addEventListener('click', function () { paused = !paused; updateMotion(); });
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', updateMotion);
  updateMotion();
})();
