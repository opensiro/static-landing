/* An endless, quiet garden. New growth stays attached to the existing stems;
   a slowly following viewport lets old sections leave the frame naturally. */
(function () {
  'use strict';
  var hero = document.querySelector('.home-hero');
  var host = hero && hero.querySelector('.vine-center');
  if (!host) return;
  var ns = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var controls = hero.querySelector('.vine-controls');
  var pause = hero.querySelector('.vine-pause');
  var width = 880, height = 660;
  var svg = node('svg', { viewBox: '0 0 880 660', 'aria-hidden': 'true', focusable: 'false' }, host);
  var chunks = [], drawings = [], reveals = [], seekers = [];
  var profiles = [
    { name: 'sweeping', sway: [125, 220], bend: [90, 140], radius: [28, 44], turns: [1.55, 1.95], duration: 4600, reach: 38 },
    { name: 'spring', sway: [90, 150], bend: [38, 72], radius: [16, 25], turns: [2.4, 3], duration: 4200, reach: 28 },
    { name: 'flowering', sway: [110, 175], bend: [55, 95], radius: [18, 28], turns: [1.3, 1.65], duration: 4400, reach: 25 }
  ];
  // Match the average upward growth so the tips stay in frame indefinitely.
  var cameraSpeed = 112 / (profiles.reduce(function (sum, profile) { return sum + profile.duration; }, 0) / profiles.length);
  var time = 0, camera = 0, last = null, frame = null;
  var inView = false, paused = false, stillPrepared = false, leaving = false, restoring = false;
  var storageKey = 'opensiro.hero-garden.v1';
  var shoots = [-1, 1].map(function (side) {
    return { side: side, tip: [440, 500], heading: [side * .7, -.7], visibleTip: [440, 500], next: side < 0 ? 100 : 750, count: 0, profileOffset: side < 0 ? 0 : 1 };
  });

  function node(tag, attrs, parent) {
    var el = document.createElementNS(ns, tag);
    Object.keys(attrs).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    if (parent) parent.appendChild(el);
    return el;
  }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function snap(value) { return Math.round(value / 2) * 2; }
  function commands(points) { return points.map(function (p, i) { return (i ? 'L' : 'M') + p.join(' '); }).join(''); }
  function bezier(points, t) {
    var s = 1 - t;
    return [0, 1].map(function (axis) {
      return s * s * s * points[0][axis] + 3 * s * s * t * points[1][axis]
        + 3 * s * t * t * points[2][axis] + t * t * t * points[3][axis];
    });
  }
  function path(chunk, pointAt, start, duration, shoot) {
    var points = [];
    for (var i = 0; i <= 100; i++) {
      var p = pointAt(i / 100);
      p = [snap(p[0]), snap(p[1])];
      points.push(p);
      chunk.top = Math.min(chunk.top, p[1] - 45);
    }
    var el = node('path', { 'class': 'vine-stem', d: '', fill: 'none' }, chunk.node);
    var drawing = { node: el, points: points, start: start, duration: duration, shown: 0, shoot: shoot };
    drawings.push(drawing);
    return drawing;
  }
  function draw(drawing, count) {
    drawing.node.setAttribute('d', commands(drawing.points.slice(0, count)));
    drawing.shown = count;
  }
  function reveal(el, at) {
    el.setAttribute('visibility', 'hidden');
    reveals.push({ node: el, at: at });
  }
  function leaf(parent, point, direction, at) {
    var anchor = node('g', { transform: 'translate(' + point.join(' ') + ') scale(' + direction + ' 1)' }, parent);
    reveal(node('path', { 'class': 'vine-leaf', d: 'M0 0h6v-4h8v-4h8v-8h4v-4H14v4H8v8H2v4H0Z' }, anchor), at);
  }
  function flower(chunk, point, at) {
    var scale = chunk.recipe.flowerScale;
    var anchor = node('g', { 'class': 'vine-flower', transform: 'translate(' + point.join(' ') + ') scale(' + scale.toFixed(2) + ')' }, chunk.node);
    chunk.top = Math.min(chunk.top, point[1] - 45);
    leaf(chunk.node, point, 1, at + 80);
    leaf(chunk.node, point, -1, at + 240);
    var angle = chunk.recipe.flowerAngle;
    for (var i = 0; i < 6; i++) {
      var turn = node('g', { transform: 'rotate(' + (angle + i * 60) + ')' }, anchor);
      reveal(node('path', { 'class': 'vine-petal', d: 'M-3-3h6v-4h4v-10H3v-4H-3v4H-7v10h4Z' }, turn), at + 220 + i * 45);
    }
    reveal(node('path', { 'class': 'vine-bud', d: 'M-3-6h6v3h3v6H3v3H-3V3H-6V-3h3Z' }, anchor), at);
    reveal(node('rect', { 'class': 'vine-flower-center', x: -2, y: -2, width: 4, height: 4 }, anchor), at + 500);
  }
  function settle(seeker, at) {
    var base = seeker.tip;
    var radius = seeker.chunk.recipe.radius;
    var turns = seeker.chunk.recipe.turns;
    var curve = path(seeker.chunk, function (t) {
      var angle = Math.PI + t * Math.PI * turns;
      var r = radius * (1 - .78 * t);
      return [base[0] + seeker.side * radius + seeker.side * r * Math.cos(angle), base[1] + r * Math.sin(angle)];
    }, at, 1700);
    seeker.node.setAttribute('data-seeking', 'curled');
    seeker.bud.remove();
    flower(seeker.chunk, curve.points[curve.points.length - 1], at + 1800);
  }
  function seek(now, instant) {
    seekers = seekers.filter(function (seeker) {
      if (now < seeker.start) return true;
      var age = Math.min(1100, now - seeker.start), progress = age / 1100;
      var length = seeker.chunk.profile.reach * Math.min(1, age / 650);
      var swing = Math.sin(age / 270 + seeker.phase) * 4 * Math.sin(progress * Math.PI);
      var tip = [seeker.anchor[0] + seeker.side * length + swing, seeker.anchor[1] - length * .65];
      var feeler = [seeker.anchor, [seeker.anchor[0] + seeker.side * 8, seeker.anchor[1]], [tip[0], tip[1] + 10], tip];
      var points = [];
      for (var i = 0; i <= 20; i++) points.push(bezier(feeler, i / 20).map(snap));
      seeker.tip = points[points.length - 1];
      seeker.node.setAttribute('d', commands(points));
      seeker.node.removeAttribute('visibility');
      seeker.bud.setAttribute('x', seeker.tip[0] - 1.5);
      seeker.bud.setAttribute('y', seeker.tip[1] - 1.5);
      seeker.bud.removeAttribute('visibility');
      if (age < 1100 && !instant) return true;
      settle(seeker, seeker.start + 1100);
      return false;
    });
  }
  function grow(shoot) {
    var start = shoot.tip;
    var profile = profiles[(shoot.count + shoot.profileOffset) % profiles.length];
    var sway = profile.sway[shoot.count % 2];
    var side = shoot.side;
    var end = [snap(440 + side * sway + rand(-18, 18)), snap(500 - (shoot.count + 1) * 112 + rand(-8, 8))];
    var bend = side * (shoot.count % 2 ? -1 : 1);
    // Continue the incoming tangent instead of flipping direction at a joint.
    var handle = Math.min(60, rand(profile.bend[0], profile.bend[1]) * .55);
    var outgoing = [end[0] + bend * rand(24, 46), end[1] + 44];
    var curve = [start, [start[0] + shoot.heading[0] * handle, start[1] + shoot.heading[1] * handle], outgoing, end];
    var tangentLength = Math.hypot(end[0] - outgoing[0], end[1] - outgoing[1]);
    shoot.heading = [(end[0] - outgoing[0]) / tangentLength, (end[1] - outgoing[1]) / tangentLength];
    makeChunk({ curve: curve, began: shoot.next, side: side,
      profile: (shoot.count + shoot.profileOffset) % profiles.length,
      curlSide: shoot.count % 2 ? -side : side,
      bloom: Math.floor(rand(0, 3)), phase: rand(0, Math.PI * 2),
      radius: rand(profile.radius[0], profile.radius[1]), turns: rand(profile.turns[0], profile.turns[1]),
      flowerScale: profile.name === 'flowering' ? rand(.5, .7) : rand(.55, .85), flowerAngle: rand(0, 60)
    }, shoot);
    shoot.tip = end;
    shoot.next += profile.duration;
    shoot.count++;
  }
  // Each visible section has a small, self-contained recipe. Restoring it does
  // not replay the entire history or store SVG markup in session storage.
  function makeChunk(recipe, shoot) {
    var curve = recipe.curve, began = recipe.began, profile = profiles[recipe.profile];
    var duration = profile.duration;
    var chunk = { node: node('g', { 'class': 'vine-section', 'data-vine-profile': profile.name }, svg),
      top: curve[3][1], profile: profile, recipe: recipe };
    chunk.node.style.setProperty('--garden-bloom', ['#9bafd2', '#a5abc9', '#94b3bd'][recipe.bloom]);
    chunks.push(chunk);
    path(chunk, function (t) { return bezier(curve, t); }, began, duration, shoot);
    var junction = bezier(curve, .63).map(snap);
    seekers.push({ chunk: chunk, anchor: junction, side: recipe.curlSide, start: began + duration * .63,
      phase: recipe.phase,
      node: node('path', { 'class': 'vine-stem vine-feeler', 'data-seeking': 'searching', visibility: 'hidden', d: '' }, chunk.node),
      bud: node('rect', { 'class': 'vine-tip', width: 3, height: 3, visibility: 'hidden' }, chunk.node) });
    leaf(chunk.node, bezier(curve, .36).map(snap), shoot.side, began + duration * .36 + 120);
  }
  function paint(now, instant) {
    shoots.forEach(function (shoot) {
      while (now >= shoot.next) grow(shoot);
    });
    // Include newly curled tendrils in this frame, so a restored frame is exact.
    seek(now, instant);
    drawings = drawings.filter(function (drawing) {
      if (now < drawing.start) return true;
      var progress = Math.min(1, (now - drawing.start) / drawing.duration);
      var count = Math.max(1, Math.ceil(progress * drawing.points.length));
      if (count !== drawing.shown) {
        draw(drawing, count);
      }
      if (drawing.shoot) drawing.shoot.visibleTip = drawing.points[count - 1];
      return progress < 1;
    });
    reveals = reveals.filter(function (part) {
      if (part.at > now) return true;
      part.node.removeAttribute('visibility');
      if (!instant && (!restoring || now - part.at < 700)) {
        part.node.classList.add('vine-unfolding');
        // Continue a half-open flower from the same point after navigation.
        if (restoring) part.node.style.animationDelay = ((part.at - now) / 1000) + 's';
      }
      return false;
    });
  }
  function trim() {
    chunks = chunks.filter(function (chunk) {
      if (chunk.top <= camera + height + 90) return true;
      chunk.node.remove();
      return false;
    });
  }
  function tick(now) {
    var delta = last === null ? 0 : Math.min(now - last, 80);
    last = now;
    time += delta;
    paint(time, false);
    // Let the first shoots fill the scene, then scroll at a constant speed.
    camera = -Math.max(0, time - 13000) * cameraSpeed;
    svg.setAttribute('viewBox', '0 ' + camera.toFixed(2) + ' ' + width + ' ' + height);
    trim();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    last = null;
    var playing = inView && !document.hidden && !paused && !reduced.matches && !leaving;
    hero.classList.toggle('vines-in-view', playing);
    controls.hidden = reduced.matches;
    pause.textContent = paused ? 'Resume' : 'Pause';
    pause.setAttribute('aria-label', paused ? 'Resume garden animation' : 'Pause garden animation');
    if (reduced.matches) {
      if (!stillPrepared) {
        time = Math.max(time, 12500);
        paint(time, true);
        stillPrepared = true;
      }
      // Complete currently generated sections without starting another loop.
      drawings.forEach(function (d) { draw(d, d.points.length); });
      seek(Infinity, true);
      drawings.forEach(function (d) { draw(d, d.points.length); });
      reveals.forEach(function (part) { part.node.removeAttribute('visibility'); });
      drawings = [];
      reveals = [];
    } else if (playing) { frame = requestAnimationFrame(tick); }
  }
  function save() {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ version: 1, time: time, paused: paused,
        shoots: shoots, chunks: chunks.map(function (chunk) { return chunk.recipe; }) }));
    } catch (_) { /* Storage can be unavailable; the garden still runs locally. */ }
  }
  function validSnapshot(state) {
    function number(n) { return typeof n === 'number' && Number.isFinite(n) && Math.abs(n) < 1e12; }
    function point(p) { return Array.isArray(p) && p.length === 2 && p.every(number); }
    return state && state.version === 1 && number(state.time) && state.time >= 0 &&
      typeof state.paused === 'boolean' && Array.isArray(state.shoots) && state.shoots.length === 2 &&
      state.shoots.every(function (shoot, i) {
        return shoot.side === (i ? 1 : -1) && shoot.profileOffset === i && point(shoot.tip) &&
          point(shoot.heading) && point(shoot.visibleTip) && number(shoot.next) && shoot.next >= state.time &&
          Number.isInteger(shoot.count) && shoot.count >= 0;
      }) && Array.isArray(state.chunks) && state.chunks.length <= 40 && state.chunks.every(function (chunk) {
        return chunk && Array.isArray(chunk.curve) && chunk.curve.length === 4 && chunk.curve.every(point) &&
          number(chunk.began) && chunk.began >= 0 && chunk.began <= state.time &&
          (chunk.side === -1 || chunk.side === 1) && (chunk.curlSide === -1 || chunk.curlSide === 1) &&
          Number.isInteger(chunk.profile) && chunk.profile >= 0 && chunk.profile < profiles.length &&
          Number.isInteger(chunk.bloom) && chunk.bloom >= 0 && chunk.bloom < 3 &&
          ['phase', 'radius', 'turns', 'flowerScale', 'flowerAngle'].every(function (key) { return number(chunk[key]); });
      });
  }
  function restore() {
    var state;
    try { state = JSON.parse(sessionStorage.getItem(storageKey)); } catch (_) { return; }
    if (!validSnapshot(state)) return;
    svg.replaceChildren();
    chunks = []; drawings = []; reveals = []; seekers = [];
    time = state.time; paused = state.paused; shoots = state.shoots;
    state.chunks.forEach(function (recipe) { makeChunk(recipe, shoots[recipe.side < 0 ? 0 : 1]); });
    restoring = true;
    paint(time, false);
    restoring = false;
    camera = -Math.max(0, time - 13000) * cameraSpeed;
    svg.setAttribute('viewBox', '0 ' + camera.toFixed(2) + ' ' + width + ' ' + height);
    stillPrepared = false;
    trim();
  }
  function depart() {
    leaving = true;
    sync();
    save();
  }
  function arrive() {
    // A cached document can hold an older garden than the page we just left.
    if (leaving) restore();
    leaving = false;
    sync();
  }
  restore();
  hero.classList.add('vines-ready');
  pause.addEventListener('click', function () { paused = !paused; sync(); save(); });
  window.addEventListener('pageswap', depart);
  window.addEventListener('pagehide', depart);
  window.addEventListener('pageshow', arrive);
  window.addEventListener('pagereveal', arrive);
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; sync(); }).observe(hero);
  } else { inView = true; }
  sync();
})();
