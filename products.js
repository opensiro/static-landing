/* Interactive examples only. No benchmark execution or remote requests. */
(function () {
  'use strict';
  var controls = document.getElementById('os-scenario-controls');
  if (!controls) return;

  var candidates = 100;
  // Rounded published reference; this is not a measurement of a small model.
  var fullTokens = 735200000;
  var taskCount = document.getElementById('os-task-count');
  var tokensPerTask = document.getElementById('os-tokens-task');
  var finalists = document.getElementById('os-finalists');
  var number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
  function compact(value) {
    if (value >= 1e9) return number.format(value / 1e9) + 'B';
    if (value >= 1e6) return number.format(value / 1e6) + 'M';
    if (value >= 1e3) return number.format(value / 1e3) + 'K';
    return number.format(value);
  }
  function renderBudget() {
    var tasks = Number(taskCount.value);
    var perTask = Number(tokensPerTask.value);
    var count = Number(finalists.value);
    var proxy = tasks * perTask;
    var screened = candidates * proxy;
    var full = count * fullTokens;
    var total = screened + full;
    var baseline = candidates * fullTokens;
    var percent = total / baseline * 100;
    document.getElementById('os-task-count-value').textContent = number.format(tasks);
    document.getElementById('os-tokens-task-value').textContent = compact(perTask);
    document.getElementById('os-finalists-value').textContent = number.format(count);
    document.getElementById('os-total-tokens').textContent = compact(total);
    document.getElementById('os-proxy-formula').textContent = candidates + ' × ' + compact(proxy) + ' proxy tokens = ' + compact(screened);
    document.getElementById('os-full-formula').textContent = count + ' × ' + compact(fullTokens) + ' full-evaluation tokens = ' + compact(full);
    // Keep both bars on a shared linear scale, even when screening costs more.
    var scale = Math.max(baseline, total);
    document.querySelector('.os-scenario-grid > article:first-child .os-bar').style.width = (baseline / scale * 100) + '%';
    document.getElementById('os-scenario-bar').style.width = (total / scale * 100) + '%';
    var message = percent.toFixed(2) + '% of the counterfactual token volume.';
    if (count === 0) message += ' No full validation in this scenario.';
    if (total > baseline) message += ' Screening adds token overhead in this scenario.';
    document.getElementById('os-scenario-percent').textContent = message;
  }
  controls.hidden = false;
  controls.addEventListener('input', renderBudget);
  controls.addEventListener('submit', function (event) { event.preventDefault(); });
  controls.addEventListener('reset', function () {
    // The reset event fires before native controls restore their defaults.
    window.setTimeout(renderBudget, 0);
  });
  renderBudget();

  var examples = {
    planning: {
      tag: 'planning.prerequisite-order', title: 'Respect the order of dependent steps.',
      change: 'A planner now tracks prerequisites before scheduling tool calls.',
      fixture: 'A small project requires a generated configuration before its build can succeed. Both steps and their dependency are stated in the task.',
      signal: 'Does the agent create and verify the configuration before starting the build, without skipping the prerequisite?'
    },
    tools: {
      tag: 'tool-use.argument-validation', title: 'Send the right arguments to the tool.',
      change: 'The harness validates tool arguments against the available schema.',
      fixture: 'A local lookup tool expects a file path and a format enum. A plausible but invalid call receives a structured validation error.',
      signal: 'Does the agent use the schema and error to issue a valid call and extract the requested result?'
    },
    context: {
      tag: 'context-management.constraint-retention', title: 'Keep a constraint through compaction.',
      change: 'Context compaction now preserves task constraints and unresolved state.',
      fixture: 'An early instruction protects a configuration file. Later logs add irrelevant detail until the harness compacts its context.',
      signal: 'After compaction, does the agent finish the task while preserving the protected file and the original constraint?'
    },
    recovery: {
      tag: 'recovery.failed-command', title: 'Recover after a failed command.',
      change: 'A retry policy now reads the error and checks state before trying again.',
      fixture: 'A build command fails because the current directory is wrong. The error identifies the missing project file; the correct project is available nearby.',
      signal: 'Does the agent inspect its location, find the project, and finish without repeating the same failed command?'
    },
    dependencies: {
      tag: 'dependency-management.version-conflict', title: 'Resolve a dependency conflict locally.',
      change: 'Dependency setup now inspects version constraints before installing packages.',
      fixture: 'An offline fixture contains compatible and incompatible package versions. The project declares the version it requires.',
      signal: 'Does the agent choose the compatible local package, preserve the environment, and pass the verification step?'
    }
  };
  var buttons = document.querySelectorAll('[data-capability]');
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var example = examples[button.dataset.capability];
      if (!example) return;
      buttons.forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
      ['tag', 'title', 'change', 'fixture', 'signal'].forEach(function (key) {
        document.getElementById('os-task-' + key).textContent = example[key];
      });
    });
  });
})();
