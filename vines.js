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
  var chunks = [], drawings = [], reveals = [];
  var time = 0, camera = 0, last = null, frame = null;
  var inView = false, paused = false, stillPrepared = false;
  var shoots = [-1, 1].map(function (side) {
    return { side: side, tip: [440, 500], visibleTip: [440, 500], next: side < 0 ? 100 : 750, count: 0 };
  });

  function node(tag, attrs, parent) {
    var el = document.createElementNS(ns, tag);
    Object.keys(attrs).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    if (parent) parent.appendChild(el);
    return el;
  }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function snap(value) { return Math.round(value / 2) * 2; }
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
    drawings.push({ node: el, points: points, start: start, duration: duration, shown: 0, shoot: shoot });
    return points[points.length - 1];
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
    var anchor = node('g', { 'class': 'vine-flower', transform: 'translate(' + point.join(' ') + ') scale(' + rand(.55, .9).toFixed(2) + ')' }, chunk.node);
    chunk.top = Math.min(chunk.top, point[1] - 45);
    leaf(chunk.node, point, 1, at + 80);
    leaf(chunk.node, point, -1, at + 240);
    var angle = rand(0, 60);
    for (var i = 0; i < 6; i++) {
      var turn = node('g', { transform: 'rotate(' + (angle + i * 60) + ')' }, anchor);
      reveal(node('path', { 'class': 'vine-petal', d: 'M-3-3h6v-4h4v-10H3v-4H-3v4H-7v10h4Z' }, turn), at + 220 + i * 45);
    }
    reveal(node('path', { 'class': 'vine-bud', d: 'M-3-6h6v3h3v6H3v3H-3V3H-6V-3h3Z' }, anchor), at);
    reveal(node('rect', { 'class': 'vine-flower-center', x: -2, y: -2, width: 4, height: 4 }, anchor), at + 500);
  }
  function grow(shoot) {
    var start = shoot.tip;
    var sway = shoot.count % 2 ? 100 : 215;
    var end = [snap(440 + shoot.side * sway + rand(-48, 48)), snap(start[1] - rand(90, 140))];
    var bend = shoot.side * (shoot.count % 2 ? -1 : 1);
    var curve = [start, [start[0] + bend * rand(70, 135), start[1] + rand(-20, 30)],
      [end[0] + bend * rand(40, 90), end[1] + rand(15, 60)], end];
    var duration = rand(3900, 4900);
    var began = shoot.next;
    var chunk = { node: node('g', { 'class': 'vine-section' }, svg), top: end[1] };
    chunk.node.style.setProperty('--garden-bloom', ['#9bafd2', '#a5abc9', '#94b3bd'][Math.floor(rand(0, 3))]);
    chunks.push(chunk);
    path(chunk, function (t) { return bezier(curve, t); }, began, duration, shoot);
    var junction = bezier(curve, .63).map(snap);
    var radius = rand(28, 48);
    var turns = rand(1.55, 2.05);
    var curlSide = shoot.count % 2 ? -shoot.side : shoot.side;
    var tip = path(chunk, function (t) {
      var angle = Math.PI + t * Math.PI * turns;
      var r = radius * (1 - .78 * t);
      return [junction[0] + curlSide * radius + curlSide * r * Math.cos(angle), junction[1] + r * Math.sin(angle)];
    }, began + duration * .63, 1700);
    flower(chunk, tip, began + duration * .63 + 1800);
    leaf(chunk.node, bezier(curve, .36).map(snap), shoot.side, began + duration * .36 + 120);
    shoot.tip = end;
    shoot.next += duration;
    shoot.count++;
  }
  function paint(now, instant) {
    shoots.forEach(function (shoot) {
      while (now >= shoot.next) grow(shoot);
    });
    drawings = drawings.filter(function (drawing) {
      if (now < drawing.start) return true;
      var progress = Math.min(1, (now - drawing.start) / drawing.duration);
      var count = Math.max(1, Math.ceil(progress * drawing.points.length));
      if (count !== drawing.shown) {
        drawing.node.setAttribute('d', drawing.points.slice(0, count).map(function (p, i) { return (i ? 'L' : 'M') + p.join(' '); }).join(''));
        drawing.shown = count;
      }
      if (drawing.shoot) drawing.shoot.visibleTip = drawing.points[count - 1];
      return progress < 1;
    });
    reveals = reveals.filter(function (part) {
      if (part.at > now) return true;
      part.node.removeAttribute('visibility');
      if (!instant) part.node.classList.add('vine-unfolding');
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
    var target = Math.min(0, Math.min(shoots[0].visibleTip[1], shoots[1].visibleTip[1]) - 165);
    camera += (target - camera) * Math.min(1, delta * .0015);
    svg.setAttribute('viewBox', '0 ' + camera.toFixed(2) + ' ' + width + ' ' + height);
    trim();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    last = null;
    var playing = inView && !document.hidden && !paused && !reduced.matches;
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
      drawings.forEach(function (d) { d.node.setAttribute('d', d.points.map(function (p, i) { return (i ? 'L' : 'M') + p.join(' '); }).join('')); });
      reveals.forEach(function (part) { part.node.removeAttribute('visibility'); });
      drawings = [];
      reveals = [];
    } else if (playing) { frame = requestAnimationFrame(tick); }
  }
  hero.classList.add('vines-ready');
  pause.addEventListener('click', function () { paused = !paused; sync(); });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { inView = entries[0].isIntersecting; sync(); }).observe(hero);
  } else { inView = true; }
  sync();
})();
