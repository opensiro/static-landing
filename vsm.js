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
      if (roleSceneLabel) roleSceneLabel.textContent = item.code;
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

  // OSM §6–7: discrete snapshots of functions transferred from parent to child.
  var maturity = document.querySelector('[data-osm-maturity]');
  if (!maturity) return;
  var phases = ['INTENT', 'OPERATIONS', 'COORDINATION', 'REGULATION', 'VERIFICATION', 'ADAPTATION', 'IDENTITY'];
  var headlines = [
    'The parent carries the missing functions.',
    'The system does the work. The parent holds it together.',
    'Coordination moves inside the system.',
    'Day-to-day regulation no longer depends on the parent.',
    'The system can inspect its own work independently.',
    'The system can respond to a changing environment.',
    'The organization owns the full set of viable functions.'
  ];
  var descriptions = [
    'A new organization starts inside an existing viable system. The human provides the support it cannot yet provide for itself.',
    'Operational units take responsibility for delivery. Coordination, regulation and the remaining functions are still supported by the parent.',
    'Units coordinate with one another. The parent no longer needs to mediate every interaction.',
    'Resources and internal optimization are managed locally. The parent supplies the functions still missing.',
    'Independent observation reduces reliance on the human to discover hidden problems.',
    'Strategic adaptation moves inside when the external environment is changing. Identity and autonomy boundaries are still supported by the parent.',
    'Policy and identity resolve internal trade-offs. The system can sustain itself within its autonomy boundaries; parent compensation is no longer required.'
  ];
  var range = document.getElementById('osm-maturity-range');
  var stops = Array.prototype.slice.call(maturity.querySelectorAll('[data-osm-level]'));
  function setMaturity(level) {
    level = Math.max(0, Math.min(6, Number(level) || 0));
    maturity.setAttribute('data-level', String(level));
    maturity.querySelector('[data-osm-parent-count]').firstChild.nodeValue = String(6 - level);
    maturity.querySelector('[data-osm-child-count]').firstChild.nodeValue = String(level);
    range.value = String(level);
    range.setAttribute('aria-valuetext', phases[level] + '. ' + headlines[level]);
    maturity.querySelector('[data-osm-phase]').textContent = '0' + level + ' / ' + phases[level];
    maturity.querySelector('[data-osm-headline]').textContent = headlines[level];
    maturity.querySelector('[data-osm-description]').textContent = descriptions[level];
    maturity.querySelector('[data-osm-parent-title]').textContent = level === 6 ? 'Support can recede.' : level === 0 ? 'Holds the whole.' : 'Hands over responsibility.';
    maturity.querySelector('[data-osm-child-title]').textContent = level === 6 ? 'Sustains itself.' : level === 0 ? 'Begins with intent.' : 'Owns more of its life.';
    maturity.querySelector('[data-osm-support]').textContent = level === 0 ? 'FULL SUPPORT' : level === 6 ? 'NO COMPENSATION NEEDED' : 'LESS SUPPORT';
    ['parent', 'child'].forEach(function (side) {
      var functions = maturity.querySelectorAll('[data-osm-' + side + '] [data-osm-function]');
      Array.prototype.forEach.call(functions, function (item, index) {
        item.classList.toggle('is-owned', side === 'parent' ? index >= level : index < level);
      });
    });
    Array.prototype.forEach.call(maturity.querySelectorAll('[data-osm-wire]'), function (wire, index) {
      wire.classList.toggle('is-released', index < level);
    });
    stops.forEach(function (button) {
      button.setAttribute('aria-pressed', String(Number(button.getAttribute('data-osm-level')) === level));
    });
  }
  range.addEventListener('input', function () { setMaturity(range.value); });
  stops.forEach(function (button) {
    button.addEventListener('click', function () { setMaturity(button.getAttribute('data-osm-level')); });
  });
  setMaturity(0);
})();
