/* ═══════════════════════════════════════════════════════════════
   Ambient fabric.

   A slowly drifting loss surface, drawn as contours by marching
   squares, with a descent path that follows the gradient downhill
   and respawns when it settles. It sits behind the whole page and
   re-tints when the ground flips between ink and bone.

   Canvas, ~16 fps, no dependencies.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var canvas = document.getElementById('fabric');
  if (!canvas) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext('2d');

  var W = 0, H = 0, dpr = 1;
  var COLS = 0, ROWS = 0, CELL = 0;
  var field = null;

  /* the surface: a handful of drifting basins plus one saddle */
  var basins = [];
  function seedBasins() {
    basins = [];
    var n = 5;
    for (var i = 0; i < n; i++) {
      basins.push({
        x:  0.15 + Math.random() * 0.70,
        y:  0.15 + Math.random() * 0.70,
        a: (i % 2 ? -1 : 1) * (0.55 + Math.random() * 0.75),
        s:  0.10 + Math.random() * 0.16,
        px: (Math.random() - 0.5) * 0.010,
        py: (Math.random() - 0.5) * 0.010,
        ph: Math.random() * Math.PI * 2
      });
    }
  }
  seedBasins();

  function surface(x, y, t) {
    var v = 0;
    for (var i = 0; i < basins.length; i++) {
      var b = basins[i];
      var bx = b.x + Math.sin(t * b.px * 60 + b.ph) * 0.13;
      var by = b.y + Math.cos(t * b.py * 60 + b.ph) * 0.13;
      var dx = (x - bx) / b.s, dy = (y - by) / b.s;
      v += b.a * Math.exp(-(dx * dx + dy * dy) * 0.5);
    }
    // gentle saddle so the field always has somewhere to fall
    v += (x - 0.5) * (y - 0.5) * 0.85;
    return v;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(window.innerWidth, 1);
    H = Math.max(window.innerHeight, 1);
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    CELL = W < 700 ? 30 : 24;
    COLS = Math.ceil(W / CELL) + 1;
    ROWS = Math.ceil(H / CELL) + 1;
    field = new Float32Array(COLS * ROWS);
  }

  function sample(t) {
    for (var j = 0; j < ROWS; j++) {
      for (var i = 0; i < COLS; i++) {
        field[j * COLS + i] = surface((i * CELL) / W, (j * CELL) / H, t);
      }
    }
  }

  /* marching squares — one iso level, appended to the current path */
  function isoline(level) {
    var i, j, a, b, c, d, code;
    for (j = 0; j < ROWS - 1; j++) {
      for (i = 0; i < COLS - 1; i++) {
        a = field[j * COLS + i];
        b = field[j * COLS + i + 1];
        c = field[(j + 1) * COLS + i + 1];
        d = field[(j + 1) * COLS + i];

        code = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
        if (code === 0 || code === 15) continue;

        var x0 = i * CELL, y0 = j * CELL, x1 = x0 + CELL, y1 = y0 + CELL;
        var T = function (p, q) { return (level - p) / (q - p || 1e-6); };

        var top    = [x0 + CELL * T(a, b), y0];
        var right  = [x1, y0 + CELL * T(b, c)];
        var bottom = [x0 + CELL * T(d, c), y1];
        var left   = [x0, y0 + CELL * T(a, d)];

        var seg = null;
        switch (code) {
          case 1: case 14: seg = [left, bottom]; break;
          case 2: case 13: seg = [bottom, right]; break;
          case 3: case 12: seg = [left, right]; break;
          case 4: case 11: seg = [top, right]; break;
          case 6: case 9:  seg = [top, bottom]; break;
          case 7: case 8:  seg = [left, top]; break;
          case 5:          seg = [left, top]; break;
          case 10:         seg = [top, right]; break;
        }
        if (!seg) continue;
        ctx.moveTo(seg[0][0], seg[0][1]);
        ctx.lineTo(seg[1][0], seg[1][1]);
        if (code === 5) { ctx.moveTo(bottom[0], bottom[1]); ctx.lineTo(right[0], right[1]); }
        if (code === 10){ ctx.moveTo(left[0], left[1]);     ctx.lineTo(bottom[0], bottom[1]); }
      }
    }
  }

  /* a marker that walks downhill and leaves a fading trail */
  var walker = null;
  function spawnWalker() {
    walker = { x: 0.12 + Math.random() * 0.76, y: 0.12 + Math.random() * 0.76, trail: [], age: 0 };
  }
  spawnWalker();

  function stepWalker(t) {
    if (!walker) return;
    var e = 0.008;
    var gx = (surface(walker.x + e, walker.y, t) - surface(walker.x - e, walker.y, t)) / (2 * e);
    var gy = (surface(walker.x, walker.y + e, t) - surface(walker.x, walker.y - e, t)) / (2 * e);
    var step = 0.0022;
    walker.x -= gx * step;
    walker.y -= gy * step;
    walker.age++;

    var mag = Math.sqrt(gx * gx + gy * gy);
    walker.trail.push([walker.x, walker.y]);
    if (walker.trail.length > 62) walker.trail.shift();

    var out = walker.x < 0.03 || walker.x > 0.97 || walker.y < 0.03 || walker.y > 0.97;
    if (out || mag < 0.05 || walker.age > 620) spawnWalker();
  }

  /* theme */
  function tone() {
    var bone = document.documentElement.classList.contains('is-bone');
    var css = getComputedStyle(document.documentElement);
    var acc = (css.getPropertyValue('--fabric-accent') || '').trim() || (bone ? '#2F6A8C' : '#5A97BA');
    return {
      base:   bone ? 'rgba(23,23,15,.085)'  : 'rgba(237,234,228,.075)',
      strong: bone ? 'rgba(23,23,15,.16)'   : 'rgba(237,234,228,.14)',
      accent: acc,
      walker: bone ? 'rgba(23,23,15,.34)'   : 'rgba(237,234,228,.34)'
    };
  }

  function hexToRgba(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  var LEVELS = [-1.5, -1.05, -0.7, -0.4, -0.16, 0.02, 0.2, 0.44, 0.75, 1.15];

  function draw(t) {
    sample(t);
    ctx.clearRect(0, 0, W, H);
    var c = tone();

    for (var L = 0; L < LEVELS.length; L++) {
      var mid = Math.abs(LEVELS[L]) < 0.25;          // the level nearest the basin floor
      ctx.beginPath();
      isoline(LEVELS[L]);
      ctx.lineWidth = mid ? 1.15 : 1;
      ctx.strokeStyle = mid ? hexToRgba(c.accent, 0.22) : (L % 3 === 0 ? c.strong : c.base);
      ctx.stroke();
    }

    if (walker && walker.trail.length > 2) {
      ctx.beginPath();
      for (var i = 0; i < walker.trail.length; i++) {
        var px = walker.trail[i][0] * W, py = walker.trail[i][1] * H;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.strokeStyle = hexToRgba(c.accent, 0.42);
      ctx.lineWidth = 1.3;
      ctx.stroke();

      var hx = walker.x * W, hy = walker.y * H;
      ctx.beginPath();
      ctx.arc(hx, hy, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = c.walker;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx, hy, 7, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba(c.accent, 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /* ── run ── */
  resize();

  if (reduced) {
    draw(4.2);
  } else {
    var t0 = performance.now();
    var lastDraw = 0;
    (function loop(now) {
      requestAnimationFrame(loop);
      if (document.hidden) return;
      if (now - lastDraw < 62) return;          // ~16 fps is plenty for something this slow
      lastDraw = now;
      var t = (now - t0) / 1000;
      stepWalker(t);
      draw(t);
    })(t0);
  }

  var frt;
  window.addEventListener('resize', function () {
    window.clearTimeout(frt);
    frt = window.setTimeout(function () { resize(); if (reduced) draw(4.2); }, 180);
  });

})();
