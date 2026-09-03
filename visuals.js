/* ═══════════════════════════════════════════════════════════════
   Live project visuals.
   Four small simulations, one per system. Each shows the mechanism
   the card describes rather than decorating it. Canvas + rAF, no
   dependencies. Only the visual in view runs.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var INK   = '#0C0C10';
  var LINE  = 'rgba(237,234,228,.10)';
  var LINE2 = 'rgba(237,234,228,.20)';
  var PAPER = '#EDEAE4';
  var DIM   = 'rgba(237,234,228,.42)';
  var GOLD  = '#CBB392';

  var SPECTRUM = {
    red:'#D2685E', orange:'#D7924A', yellow:'#CDBA5B',
    green:'#6BA26B', blue:'#5A97BA', indigo:'#6A6DAE', violet:'#9268A8'
  };

  var clamp = function (v,a,b){ return v<a?a:v>b?b:v; };
  var lerp  = function (a,b,t){ return a+(b-a)*t; };
  var ease  = function (t){ return t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; };
  var easeOut = function (t){ return 1-Math.pow(1-t,3); };

  function label(ctx, text, x, y, size, color, spacing) {
    ctx.save();
    ctx.font = '400 ' + (size||9) + 'px "Plex Mono", ui-monospace, Menlo, monospace';
    ctx.fillStyle = color || DIM;
    ctx.textBaseline = 'top';
    var sp = spacing === undefined ? 1.6 : spacing;
    var cx = x;
    for (var i = 0; i < text.length; i++) {
      ctx.fillText(text[i], cx, y);
      cx += ctx.measureText(text[i]).width + sp;
    }
    ctx.restore();
  }

  function labelWidth(ctx, text, size, spacing) {
    ctx.save();
    ctx.font = '400 ' + (size||9) + 'px "Plex Mono", ui-monospace, Menlo, monospace';
    var sp = spacing === undefined ? 1.6 : spacing, w = 0;
    for (var i=0;i<text.length;i++) w += ctx.measureText(text[i]).width + sp;
    ctx.restore();
    return w;
  }

  /* ═══════════════ 01 · POACHING DETECTION ═══════════════
     Sensor sits dark and cheap until motion wakes it; YOLO runs only
     then; a clustering filter throws away the blips that aren't animals
     or people; a positive detection banks a 20-second clip.            */

  /* a hand-drawn line: one quadratic with the control point nudged off the
     chord, so nothing is mechanically straight */
  function sketch(ctx, x1, y1, x2, y2, bend) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx*dx + dy*dy) || 1;
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx - dy/len * bend, my + dx/len * bend, x2, y2);
  }

  /* An original stick figure — round head, wobbly limbs, a proper walk
     cycle, and a startled beat when the model locks on. */
  function walker(ctx, x, groundY, sc, phase, startle, color, wob) {
    var bob   = Math.cos(phase * 2) * sc * 0.05 * (1 - startle);
    var hipY  = groundY - sc * 0.74 + bob;
    var shY   = groundY - sc * 1.28 + bob;
    var headY = groundY - sc * 1.56 + bob - startle * sc * 0.06;
    var headR = sc * 0.17;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(sc * 0.055, 1.4);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    /* head */
    ctx.beginPath();
    ctx.arc(x + wob(1) , headY, headR, 0, Math.PI * 2);
    ctx.stroke();

    /* spine */
    ctx.beginPath();
    sketch(ctx, x, headY + headR, x + wob(2), hipY, sc * 0.03);
    ctx.stroke();

    /* legs — swing, with a knee that bends on the forward stroke */
    var legSwing = startle > 0.5 ? 0.22 : Math.sin(phase) * 0.55;
    [legSwing, -legSwing].forEach(function (a, i) {
      var kneeX = x + Math.sin(a) * sc * 0.38;
      var kneeY = hipY + Math.cos(a) * sc * 0.38;
      var bend  = a > 0 ? 0.34 : -0.08;
      var footX = kneeX + Math.sin(a + bend) * sc * 0.40;
      var footY = Math.min(kneeY + Math.cos(a + bend) * sc * 0.40, groundY);
      ctx.beginPath();
      sketch(ctx, x, hipY, kneeX, kneeY, sc * 0.02 * (i ? 1 : -1));
      sketch(ctx, kneeX, kneeY, footX, footY, sc * 0.02);
      ctx.stroke();
      /* foot */
      ctx.beginPath();
      ctx.moveTo(footX - sc * 0.02, footY);
      ctx.lineTo(footX + sc * 0.13, footY + wob(3 + i));
      ctx.stroke();
    });

    /* arms — counter-swing, then straight up when startled */
    var armSwing = Math.sin(phase + Math.PI) * 0.5;
    [armSwing, -armSwing].forEach(function (a, i) {
      var ang = startle > 0 ? lerp(a, (i ? -2.55 : 2.55), startle) : a;
      var elbX = x + Math.sin(ang) * sc * 0.34;
      var elbY = shY + Math.cos(ang) * sc * 0.34;
      var fore = ang + (startle > 0 ? 0 : (i ? 0.24 : -0.18));
      var hndX = elbX + Math.sin(fore) * sc * 0.32;
      var hndY = elbY + Math.cos(fore) * sc * 0.32;
      ctx.beginPath();
      sketch(ctx, x, shY, elbX, elbY, sc * 0.02 * (i ? -1 : 1));
      sketch(ctx, elbX, elbY, hndX, hndY, sc * 0.02);
      ctx.stroke();
    });

    /* face — two dots, and a mouth that goes round when startled */
    ctx.fillStyle = color;
    [-1, 1].forEach(function (sgn) {
      ctx.beginPath();
      ctx.arc(x + sgn * headR * 0.36 + wob(5), headY - headR * 0.12,
              Math.max(sc * 0.022, 1), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.beginPath();
    if (startle > 0.4) {
      ctx.arc(x, headY + headR * 0.34, headR * 0.24, 0, Math.PI * 2);
    } else {
      ctx.arc(x, headY + headR * 0.12, headR * 0.42, 0.35 * Math.PI, 0.65 * Math.PI);
    }
    ctx.stroke();

    /* the beat: an exclamation pops over the head */
    if (startle > 0.35) {
      var ex = x + headR * 1.5, ey = headY - headR * 1.45;
      ctx.save();
      ctx.globalAlpha = clamp((startle - 0.35) / 0.35, 0, 1);
      ctx.lineWidth = Math.max(sc * 0.06, 1.6);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + sc * 0.02, ey + sc * 0.20);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ex + sc * 0.03, ey + sc * 0.30, Math.max(sc * 0.028, 1.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  /* the blips the clustering filter throws away — small four-legged things */
  function critter(ctx, x, y, sc, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(sc * 0.07, 1.2);
    ctx.lineCap = 'round';
    ctx.beginPath();
    sketch(ctx, x - sc * 0.34, y, x + sc * 0.30, y - sc * 0.05, sc * 0.05);   // back
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + sc * 0.40, y - sc * 0.14, sc * 0.13, 0, Math.PI * 2);          // head
    ctx.stroke();
    [-0.26, -0.06, 0.10, 0.24].forEach(function (o, i) {
      ctx.beginPath();
      sketch(ctx, x + sc * o, y + (i > 1 ? -sc * 0.03 : 0), x + sc * (o - 0.03), y + sc * 0.34, sc * 0.02);
      ctx.stroke();
    });
    ctx.beginPath();
    sketch(ctx, x - sc * 0.34, y, x - sc * 0.52, y - sc * 0.22, sc * 0.06);    // tail
    ctx.stroke();
    ctx.restore();
  }

  var poaching = {
    init: function (s) {
      s.t = 0;
      s.x = -0.16;          // walker position, 0..1 across the frame
      s.step = 0;           // walk cycle phase
      s.conf = 0;
      s.clip = 0;
      s.sensor = [];
      for (var i = 0; i < 52; i++) s.sensor.push(0.07 + Math.random() * 0.06);
      s.decoys = [{ x: 0.20, y: 0.42 }, { x: 0.74, y: 0.30 }];
    },

    // 0 armed · 1 motion · 2 inference · 3 filter · 4 capture
    phase: function (t) {
      var c = t % 11.2;
      if (c < 1.6) return { i:0, p:c/1.6,       c:c, label:'Armed — sensor only' };
      if (c < 3.2) return { i:1, p:(c-1.6)/1.6, c:c, label:'Motion — waking' };
      if (c < 6.0) return { i:2, p:(c-3.2)/2.8, c:c, label:'YOLOv11 — inference' };
      if (c < 7.9) return { i:3, p:(c-6.0)/1.9, c:c, label:'Cluster filter' };
      return         { i:4, p:(c-7.9)/3.3,      c:c, label:'Capture — 20 s clip' };
    },

    frame: function (s, dt) {
      var ctx = s.ctx, w = s.w, h = s.h;
      s.t += dt;
      var ph = poaching.phase(s.t);
      var footer = 46;
      var fieldH = h - footer;
      var u = Math.min(w, fieldH);

      /* the startled beat, held briefly once the brackets lock on */
      var startle = 0;
      if (ph.c > 4.7 && ph.c < 6.0) startle = Math.min((ph.c - 4.7) / 0.28, 1) * Math.min((6.0 - ph.c) / 0.4, 1);
      startle = clamp(startle, 0, 1);

      /* walking */
      if (ph.i >= 1) {
        var speed = 0.052 * (1 - startle);
        s.x += dt * speed;
        s.step += dt * speed * 78;
        if (s.x > 1.18) { s.x = -0.16; }
      }

      var wob = function (k) { return Math.sin(s.t * 5.5 + k * 12.9898) * Math.max(u * 0.004, 0.6); };

      ctx.clearRect(0, 0, w, h);
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#0C0F15'); g.addColorStop(1, '#080A0D');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      /* terrain */
      ctx.save();
      for (var k = 0; k < 7; k++) {
        ctx.strokeStyle = 'rgba(90,151,186,' + (0.19 - k * 0.017).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var x = 0; x <= w; x += 6) {
          var yy = fieldH * (0.20 + k * 0.11) + Math.sin(x * 0.013 + k * 1.7) * 8 + Math.sin(x * 0.005 + k) * 12;
          x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
      ctx.restore();

      /* sensor grid */
      ctx.save();
      ctx.strokeStyle = 'rgba(237,234,228,.04)'; ctx.lineWidth = 1;
      for (var gx = 0; gx < w; gx += Math.round(u / 7)) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, fieldH); ctx.stroke(); }
      for (var gy = 0; gy < fieldH; gy += Math.round(u / 7)) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
      ctx.restore();

      var groundY = fieldH * 0.80;
      var sc = clamp(u * 0.30, 38, 98);

      /* ground line the figure walks on */
      ctx.strokeStyle = 'rgba(237,234,228,.10)';
      ctx.beginPath(); ctx.moveTo(0, groundY + 0.5); ctx.lineTo(w, groundY + 0.5); ctx.stroke();

      /* idle: the node is asleep, not dead */
      if (ph.i === 0) {
        var pulse = (Math.sin(s.t * 2.2) + 1) / 2;
        ctx.strokeStyle = 'rgba(203,179,146,' + (0.10 + pulse * 0.16).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w / 2, fieldH / 2, u * 0.10 + pulse * u * 0.06, 0, Math.PI * 2);
        ctx.stroke();
      }

      var sx = s.x * w;

      /* inference sweep */
      if (ph.i === 2) {
        var sweepY = ph.p * fieldH;
        var sg = ctx.createLinearGradient(0, sweepY - 32, 0, sweepY + 4);
        sg.addColorStop(0, 'rgba(107,162,107,0)');
        sg.addColorStop(1, 'rgba(107,162,107,.26)');
        ctx.fillStyle = sg; ctx.fillRect(0, sweepY - 32, w, 36);
        ctx.fillStyle = 'rgba(107,162,107,.7)'; ctx.fillRect(0, sweepY, w, 1);
      }

      /* the walker */
      if (ph.i >= 1) {
        walker(ctx, sx, groundY, sc, s.step, startle, 'rgba(240,232,214,.95)', wob);
      }

      /* detection brackets */
      if (ph.i >= 2) {
        var grow = ph.i === 2 ? easeOut(clamp(ph.p * 1.8, 0, 1)) : 1;
        var bw = lerp(sc * 1.95, sc * 1.38, grow);
        var bh = lerp(sc * 2.40, sc * 1.96, grow);
        var alpha = ph.i === 2 ? clamp(ph.p * 3.4, 0, 1) : 1;
        var x0 = sx - bw / 2, y0 = groundY - bh - sc * 0.02, arm = Math.max(bw * 0.26, 9);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = SPECTRUM.green; ctx.lineWidth = 1.6;
        [[x0,y0,1,1],[x0+bw,y0,-1,1],[x0,y0+bh,1,-1],[x0+bw,y0+bh,-1,-1]].forEach(function (c) {
          ctx.beginPath();
          ctx.moveTo(c[0] + c[2] * arm, c[1]);
          ctx.lineTo(c[0], c[1]);
          ctx.lineTo(c[0], c[1] + c[3] * arm);
          ctx.stroke();
        });
        s.conf = ph.i === 2 ? lerp(0.41, 0.94, easeOut(clamp(ph.p * 1.4, 0, 1))) : 0.94;
        label(ctx, 'PERSON ' + (s.conf * 100).toFixed(0) + '%', x0, y0 - 14, 9, SPECTRUM.green);
        ctx.restore();
      }

      /* the filter throwing away what isn't a person */
      if (ph.i === 3) {
        s.decoys.forEach(function (d, i) {
          var local = clamp(ph.p * 2 - i * 0.3, 0, 1);
          if (local <= 0) return;
          var dx = d.x * w, dy = d.y * fieldH;
          var q = Math.max(u * 0.075, 16);
          ctx.save();
          ctx.globalAlpha = local < 0.72 ? 1 : 1 - (local - 0.72) / 0.28;
          critter(ctx, dx, dy, q, 'rgba(237,234,228,.55)');
          ctx.strokeStyle = 'rgba(210,104,94,.85)'; ctx.lineWidth = 1.2;
          ctx.strokeRect(dx - q * 0.72, dy - q * 0.58, q * 1.5, q * 1.06);
          if (local > 0.35) {
            ctx.beginPath();
            ctx.moveTo(dx - q * 0.5, dy - q * 0.4); ctx.lineTo(dx + q * 0.6, dy + q * 0.4);
            ctx.stroke();
            label(ctx, 'NOT A PERSON', dx + q * 0.86, dy - 5, 8, 'rgba(210,104,94,.9)');
          }
          ctx.restore();
        });
      }

      /* sensor trace */
      var by = h - 32, bh2 = 20;
      s.sensor.shift();
      s.sensor.push(ph.i === 0 ? 0.06 + Math.random() * 0.06
                  : ph.i === 1 ? 0.45 + Math.random() * 0.55
                  : 0.22 + Math.random() * 0.34);
      var step = (w - 32) / s.sensor.length;
      for (var i2 = 0; i2 < s.sensor.length; i2++) {
        var vv = s.sensor[i2];
        ctx.fillStyle = vv > 0.3 ? 'rgba(205,186,91,.85)' : 'rgba(237,234,228,.20)';
        ctx.fillRect(16 + i2 * step, by + bh2 - vv * bh2, Math.max(step - 1.6, 1), Math.max(vv * bh2, 1));
      }
      ctx.strokeStyle = LINE; ctx.beginPath();
      ctx.moveTo(16, by + bh2 + 0.5); ctx.lineTo(w - 16, by + bh2 + 0.5); ctx.stroke();

      label(ctx, ph.label.toUpperCase(), 16, 14, 9, ph.i === 0 ? DIM : SPECTRUM.yellow);

      if (ph.i === 4) {
        s.clip = clamp(ph.p, 0, 1);
        var cw = 74, cx0 = w - 16 - cw;
        ctx.fillStyle = 'rgba(237,234,228,.14)'; ctx.fillRect(cx0, 19, cw, 2);
        ctx.fillStyle = SPECTRUM.red; ctx.fillRect(cx0, 19, cw * s.clip, 2);
        label(ctx, (s.clip * 20).toFixed(0) + ' / 20 S', cx0, 25, 8, DIM);
        ctx.beginPath(); ctx.arc(cx0 - 11, 20, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = (s.t * 3 | 0) % 2 ? SPECTRUM.red : 'rgba(210,104,94,.25)';
        ctx.fill();
      } else {
        var pw = labelWidth(ctx, 'RASPBERRY PI 3B', 8);
        label(ctx, 'RASPBERRY PI 3B', w - 16 - pw, 16, 8, 'rgba(237,234,228,.34)');
      }

      ctx.strokeStyle = LINE; ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
    }
  };

  /* ═══════════════ 02 · ADAPTIVE TRAFFIC SIGNAL ═══════════════
     One intersection, arrivals on four approaches. The fixed-time
     controller flips on a metronome; the learned policy flips when the
     queue says so. The trace underneath is what that difference costs. */

  var traffic = {
    init: function (s) {
      s.t = 0;
      s.qF = [7,5,7,5];
      s.qA = [5,3,5,3];
      s.phaseF = 0; s.phaseA = 0;
      s.timerF = 0; s.timerA = 0;
      s.hist = [];
      for (var i=0;i<150;i++) s.hist.push([8.2 + Math.sin(i*0.13)*1.3, 4.0 + Math.sin(i*0.19)*0.8]);
      s.arrivals = [1.9,0.55,1.8,0.5];   // asymmetric demand is the whole point
      s._acc = 0;
    },

    frame: function (s, dt) {
      var ctx = s.ctx, w = s.w, h = s.h;
      s.t += dt;
      dt = Math.min(dt, 0.05);
      var i;

      /* ── simulate ── */
      for (i=0;i<4;i++) if (Math.random() < s.arrivals[i]*dt*2.0) { s.qF[i]++; s.qA[i]++; }

      s.timerF += dt;
      if (s.timerF > 3.2) { s.timerF = 0; s.phaseF ^= 1; }

      s.timerA += dt;
      var servedA  = s.phaseA === 0 ? s.qA[0]+s.qA[2] : s.qA[1]+s.qA[3];
      var waitingA = s.phaseA === 0 ? s.qA[1]+s.qA[3] : s.qA[0]+s.qA[2];
      if (s.timerA > 1.0 && (servedA < 1.2 || waitingA > servedA*1.5 || s.timerA > 5.5)) {
        s.timerA = 0; s.phaseA ^= 1;
      }

      var dis = 4.6*dt;
      for (i=0;i<4;i++) {
        var ax = (i===0||i===2) ? 0 : 1;
        if (ax === s.phaseF && s.qF[i] > 0) s.qF[i] = Math.max(0, s.qF[i]-dis);
        if (ax === s.phaseA && s.qA[i] > 0) s.qA[i] = Math.max(0, s.qA[i]-dis);
        s.qF[i] = Math.min(s.qF[i], 22); s.qA[i] = Math.min(s.qA[i], 22);
      }

      var avgF = (s.qF[0]+s.qF[1]+s.qF[2]+s.qF[3])/4;
      var avgA = (s.qA[0]+s.qA[1]+s.qA[2]+s.qA[3])/4;
      s._acc += dt;
      if (s._acc > 0.08) { s._acc = 0; s.hist.push([avgF, avgA]); if (s.hist.length>150) s.hist.shift(); }

      /* ── render ── */
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = '#0A0B0F'; ctx.fillRect(0,0,w,h);

      var chartH = 82;
      var fieldH = h - chartH;
      var u = Math.min(w, fieldH);
      var road = clamp(u*0.15, 26, 52);
      var jx = w*0.5, jy = fieldH*0.50;

      ctx.fillStyle = 'rgba(237,234,228,.055)';
      ctx.fillRect(0, jy-road/2, w, road);
      ctx.fillRect(jx-road/2, 0, road, fieldH);

      ctx.strokeStyle = 'rgba(237,234,228,.13)'; ctx.lineWidth = 1;
      ctx.setLineDash([5,8]);
      ctx.beginPath();
      ctx.moveTo(0, jy); ctx.lineTo(w, jy);
      ctx.moveTo(jx, 0); ctx.lineTo(jx, fieldH);
      ctx.stroke();
      ctx.setLineDash([]);

      /* junction box */
      ctx.strokeStyle = 'rgba(237,234,228,.10)';
      ctx.strokeRect(jx-road/2, jy-road/2, road, road);

      var lane = road*0.26;
      var dirs = [
        { dx: 0, dy:-1, ox:-lane, oy:0 },
        { dx: 1, dy: 0, ox:0, oy:-lane },
        { dx: 0, dy: 1, ox: lane, oy:0 },
        { dx:-1, dy: 0, ox:0, oy: lane }
      ];
      var carL = Math.max(road*0.30, 9), carW = Math.max(road*0.19, 5);
      var gap  = carL + Math.max(road*0.13, 4);

      for (i=0;i<4;i++) {
        var d = dirs[i], ax2 = (i===0||i===2)?0:1, green = ax2 === s.phaseA;
        var n = Math.round(s.qA[i]);
        for (var c=0;c<n;c++) {
          var px = jx + d.dx*(road/2 + carL*0.7 + c*gap) + d.ox;
          var py = jy + d.dy*(road/2 + carL*0.7 + c*gap) + d.oy;
          if (px < -20 || px > w+20 || py < -20 || py > fieldH+20) continue;
          ctx.fillStyle = green
            ? (c < 2 ? 'rgba(205,186,91,.95)' : 'rgba(205,186,91,.55)')
            : 'rgba(237,234,228,.40)';
          var vw = d.dx ? carL : carW, vh = d.dx ? carW : carL;
          ctx.fillRect(px-vw/2, py-vh/2, vw, vh);
        }
      }

      /* signal heads on the two axes */
      var off = road/2 + 9;
      [[jx-off, jy-off, 0],[jx+off, jy-off, 1]].forEach(function(L){
        var on = L[2] === s.phaseA;
        ctx.beginPath(); ctx.arc(L[0], L[1], 4, 0, Math.PI*2);
        ctx.fillStyle = on ? SPECTRUM.green : 'rgba(210,104,94,.6)';
        ctx.fill();
        if (on) {
          ctx.beginPath(); ctx.arc(L[0], L[1], 8, 0, Math.PI*2);
          ctx.strokeStyle = 'rgba(107,162,107,.35)'; ctx.lineWidth = 1; ctx.stroke();
        }
      });

      label(ctx, 'LEARNED POLICY — DQN', 16, 14, 9, SPECTRUM.yellow);
      var stw = labelWidth(ctx, '117-STATE OBSERVATION', 8);
      label(ctx, '117-STATE OBSERVATION', w-16-stw, 15, 8, 'rgba(237,234,228,.34)');

      /* comparison trace */
      var cy = fieldH + 12, ch = chartH - 40;
      ctx.strokeStyle = 'rgba(237,234,228,.07)';
      for (var gl=0; gl<=2; gl++){
        ctx.beginPath();
        ctx.moveTo(16, cy + ch*gl/2 + .5); ctx.lineTo(w-16, cy + ch*gl/2 + .5); ctx.stroke();
      }

      var stepX = (w-32)/149, maxQ = 13;
      [[0,'rgba(210,104,94,.80)',1.2],[1,SPECTRUM.green,1.9]].forEach(function(cfg){
        ctx.beginPath();
        for (var q=0;q<s.hist.length;q++){
          var vx = 16 + q*stepX;
          var vy = cy + ch - clamp(s.hist[q][cfg[0]]/maxQ,0,1)*ch;
          q===0 ? ctx.moveTo(vx,vy) : ctx.lineTo(vx,vy);
        }
        ctx.strokeStyle = cfg[1]; ctx.lineWidth = cfg[2]; ctx.stroke();
      });

      label(ctx, 'FIXED-TIME', 16, cy+ch+9, 8, 'rgba(210,104,94,.85)');
      label(ctx, 'ADAPTIVE', 16 + labelWidth(ctx,'FIXED-TIME',8) + 16, cy+ch+9, 8, SPECTRUM.green);
      var qt = 'AVG QUEUE  ' + avgA.toFixed(1) + '  VS  ' + avgF.toFixed(1);
      label(ctx, qt, w-16-labelWidth(ctx,qt,8), cy+ch+9, 8, DIM);

      ctx.strokeStyle = LINE; ctx.lineWidth = 1;
      ctx.strokeRect(.5,.5,w-1,h-1);
    }
  };

  /* ═══════════════ 04 · FACIAL EMOTION RECOGNITION ═══════════════
     A landmark mesh, deliberately geometric rather than photographic:
     brows, lids and mouth are driven by three expression weights, and
     the meter underneath is those same weights.                       */

  var face = {
    init: function (s) {
      s.t = 0;
      s.cur = [1,0,0];        // neutral, happy, surprise
      s.target = [1,0,0];
      s.next = 2.4;
      s.names = ['NEUTRAL','HAPPY','SURPRISE'];
      s.hues = [SPECTRUM.blue, SPECTRUM.orange, SPECTRUM.violet];
    },

    frame: function (s, dt) {
      var ctx = s.ctx, w = s.w, h = s.h;
      s.t += dt;

      if (s.t > s.next) {
        s.next = s.t + 2.4 + Math.random()*1.6;
        var pick = Math.floor(Math.random()*3);
        s.target = [0.08,0.08,0.08];
        s.target[pick] = 0.84 + Math.random()*0.12;
      }
      for (var i=0;i<3;i++) s.cur[i] = lerp(s.cur[i], s.target[i], Math.min(dt*2.6,1));

      var happy = s.cur[1], surp = s.cur[2];

      ctx.clearRect(0,0,w,h);
      ctx.fillStyle = '#0A0A0E'; ctx.fillRect(0,0,w,h);
      ctx.strokeStyle = LINE; ctx.strokeRect(.5,.5,w-1,h-1);

      var meterH = 54;
      var cx = w/2, cy = (h-meterH)/2 + 4;
      var R = Math.min(w*0.20, (h-meterH)*0.36);

      var pts = [];
      function dot(x,y,strong){ pts.push([x,y,strong]); }

      /* jaw + skull outline */
      var oval = [];
      for (var a=0;a<26;a++){
        var th = (a/26)*Math.PI*2 - Math.PI/2;
        var rx = R*0.80, ry = R*1.06;
        var ox = cx + Math.cos(th)*rx;
        var oy = cy + Math.sin(th)*ry * (Math.sin(th) > 0 ? 1.06 : 0.94);
        oval.push([ox,oy]);
      }
      ctx.beginPath();
      oval.forEach(function(p,i2){ i2===0?ctx.moveTo(p[0],p[1]):ctx.lineTo(p[0],p[1]); });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(237,234,228,.20)'; ctx.lineWidth = 1; ctx.stroke();
      oval.forEach(function(p,i2){ if (i2%2===0) dot(p[0],p[1],0); });

      /* mesh chords — the "landmark graph" look */
      ctx.save();
      ctx.strokeStyle = 'rgba(90,151,186,.10)'; ctx.lineWidth = 1;
      for (var m=0;m<oval.length;m+=2){
        ctx.beginPath();
        ctx.moveTo(oval[m][0], oval[m][1]);
        ctx.lineTo(oval[(m+9)%oval.length][0], oval[(m+9)%oval.length][1]);
        ctx.stroke();
      }
      ctx.restore();

      /* eyes — lids open with surprise, narrow with a smile */
      var eyeY = cy - R*0.16;
      var open = lerp(R*0.15, R*0.26, surp) * lerp(1, 0.62, happy);
      [-1,1].forEach(function(sgn){
        var ex = cx + sgn*R*0.36;
        ctx.beginPath();
        for (var e=0;e<=12;e++){
          var u = e/12, ang = Math.PI*u;
          var px = ex + Math.cos(Math.PI-ang)*R*0.26;
          var py = eyeY - Math.sin(ang)*open;
          e===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
        }
        for (var e2=12;e2>=0;e2--){
          var u2 = e2/12, ang2 = Math.PI*u2;
          var px2 = ex + Math.cos(Math.PI-ang2)*R*0.26;
          var py2 = eyeY + Math.sin(ang2)*open*lerp(1,0.45,happy);
          ctx.lineTo(px2,py2);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(237,234,228,.42)'; ctx.stroke();
        dot(ex - R*0.26, eyeY, 1); dot(ex + R*0.26, eyeY, 1);
        dot(ex, eyeY - open, 1);   dot(ex, eyeY + open*lerp(1,0.45,happy), 1);

        /* brow */
        var browLift = surp*R*0.16 - happy*R*0.02;
        ctx.beginPath();
        for (var b=0;b<=8;b++){
          var bu = b/8;
          var bx = ex + lerp(-R*0.30, R*0.30, bu);
          var by = eyeY - R*0.30 - browLift - Math.sin(bu*Math.PI)*R*0.05*(1+surp*0.7);
          b===0?ctx.moveTo(bx,by):ctx.lineTo(bx,by);
        }
        ctx.strokeStyle = 'rgba(237,234,228,.34)'; ctx.stroke();
      });

      /* nose */
      ctx.beginPath();
      ctx.moveTo(cx, cy - R*0.06);
      ctx.lineTo(cx - R*0.09, cy + R*0.20);
      ctx.lineTo(cx + R*0.06, cy + R*0.22);
      ctx.strokeStyle = 'rgba(237,234,228,.22)'; ctx.stroke();
      dot(cx, cy - R*0.06, 1); dot(cx - R*0.09, cy + R*0.20, 1);

      /* mouth — curve from smile weight, opening from surprise */
      var my = cy + R*0.52;
      var half = lerp(R*0.30, R*0.20, surp) * lerp(1, 1.18, happy);
      var curve = happy*R*0.26 - surp*R*0.04;
      var gapM  = surp*R*0.20;
      ctx.beginPath();
      for (var mm=0;mm<=16;mm++){
        var mu = mm/16;
        var mx = cx + lerp(-half, half, mu);
        var myy = my - Math.sin(mu*Math.PI)*curve - gapM*0.5*Math.sin(mu*Math.PI);
        mm===0?ctx.moveTo(mx,myy):ctx.lineTo(mx,myy);
      }
      if (gapM > 1) {
        for (var mm2=16;mm2>=0;mm2--){
          var mu2 = mm2/16;
          var mx2 = cx + lerp(-half, half, mu2);
          var my2 = my - Math.sin(mu2*Math.PI)*curve + gapM*0.9*Math.sin(mu2*Math.PI);
          ctx.lineTo(mx2,my2);
        }
        ctx.closePath();
      }
      ctx.strokeStyle = 'rgba(237,234,228,.55)'; ctx.lineWidth = 1.2; ctx.stroke();
      dot(cx-half, my, 1); dot(cx+half, my, 1); dot(cx, my-curve-gapM*0.5, 1);

      /* landmark dots last, over everything */
      pts.forEach(function(p){
        ctx.beginPath();
        ctx.arc(p[0], p[1], p[2] ? 1.7 : 1.1, 0, Math.PI*2);
        ctx.fillStyle = p[2] ? 'rgba(203,179,146,.9)' : 'rgba(237,234,228,.30)';
        ctx.fill();
      });

      label(ctx, 'LANDMARK MESH — 68 PT', 16, 14, 9, SPECTRUM.orange);
      var fps = labelWidth(ctx, 'REAL-TIME', 8);
      label(ctx, 'REAL-TIME', w-16-fps, 15, 8, 'rgba(237,234,228,.28)');

      /* classifier meter */
      var mY = h - meterH + 12, barW = (w-32-24)/3;
      for (var q=0;q<3;q++){
        var bx0 = 16 + q*(barW+12);
        ctx.fillStyle = 'rgba(237,234,228,.09)';
        ctx.fillRect(bx0, mY+14, barW, 3);
        ctx.fillStyle = s.hues[q];
        ctx.fillRect(bx0, mY+14, barW*clamp(s.cur[q],0,1), 3);
        label(ctx, s.names[q], bx0, mY, 8, s.cur[q] > .5 ? PAPER : DIM);
        var pv = (s.cur[q]*100).toFixed(0)+'%';
        label(ctx, pv, bx0+barW-labelWidth(ctx,pv,8), mY, 8, DIM);
      }
    }
  };

  /* ═══════════════ 03 · MEDVIGIL (DOM, not canvas) ═══════════════
     Free-text in, structured context out. The point of the card is the
     mapping, so the mapping is what animates.                          */

  var MED_SAMPLES = [
    {
      text: 'tightness in chest since tuesday, worse on stairs, gets better sitting down',
      fields: [
        ['Reported',  'Chest tightness'],
        ['Onset',     '4 days'],
        ['Aggravator','Exertion — stairs'],
        ['Priority',  'Escalate']
      ]
    },
    {
      text: 'headache most mornings for two weeks, screen work all day, no fever',
      fields: [
        ['Reported',  'Morning headache'],
        ['Onset',     '14 days'],
        ['Aggravator','Prolonged screen use'],
        ['Priority',  'Routine']
      ]
    },
    {
      text: 'wrist hurts after typing, some numbness in the first two fingers',
      fields: [
        ['Reported',  'Wrist pain, numbness'],
        ['Onset',     'Recurrent'],
        ['Aggravator','Repetitive typing'],
        ['Priority',  'Review']
      ]
    }
  ];

  function medvigil(root) {
    var input  = root.querySelector('[data-med-input]');
    var caret  = root.querySelector('[data-med-caret]');
    var rows   = Array.prototype.slice.call(root.querySelectorAll('[data-med-row]'));
    var idx = 0, raf = null, running = false;

    function run() {
      if (!running) return;
      var sample = MED_SAMPLES[idx % MED_SAMPLES.length];
      idx++;
      rows.forEach(function (r) { r.classList.remove('is-on'); });
      input.textContent = '';
      caret.style.opacity = '1';

      var i = 0;
      (function type() {
        if (!running) return;
        if (i <= sample.text.length) {
          input.textContent = sample.text.slice(0, i);
          i++;
          raf = window.setTimeout(type, 22 + Math.random()*26);
        } else {
          caret.style.opacity = '0';
          sample.fields.forEach(function (f, n) {
            window.setTimeout(function () {
              if (!running) return;
              rows[n].querySelector('[data-med-key]').textContent = f[0];
              rows[n].querySelector('[data-med-val]').textContent = f[1];
              rows[n].classList.add('is-on');
            }, 260 + n*230);
          });
          raf = window.setTimeout(run, 260 + sample.fields.length*230 + 2600);
        }
      })();
    }

    return {
      start: function () { if (running) return; running = true; run(); },
      stop:  function () { running = false; window.clearTimeout(raf); },
      still: function () {
        var sample = MED_SAMPLES[0];
        input.textContent = sample.text;
        caret.style.opacity = '0';
        sample.fields.forEach(function (f, n) {
          rows[n].querySelector('[data-med-key]').textContent = f[0];
          rows[n].querySelector('[data-med-val]').textContent = f[1];
          rows[n].classList.add('is-on');
        });
      }
    };
  }

  /* ═══════════════ runner ═══════════════ */

  var REGISTRY = { poaching: poaching, traffic: traffic, face: face };

  function mountCanvas(canvas, name) {
    var def = REGISTRY[name];
    if (!def) return null;
    var ctx = canvas.getContext('2d', { alpha: false });
    var s = { ctx: ctx, w: 0, h: 0, t: 0 };

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      s.w = Math.max(Math.round(r.width), 1);
      s.h = Math.max(Math.round(r.height), 1);
      canvas.width  = Math.round(s.w * dpr);
      canvas.height = Math.round(s.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    def.init(s);

    var raf = null, last = 0, running = false;
    function loop(now) {
      if (!running) return;
      var dt = last ? Math.min((now - last) / 1000, 0.08) : 0.016;
      last = now;
      def.frame(s, dt);
      raf = requestAnimationFrame(loop);
    }

    return {
      resize: function () { resize(); def.frame(s, 0.016); },
      start: function () {
        if (running) return;
        running = true; last = 0;
        raf = requestAnimationFrame(loop);
      },
      stop: function () { running = false; if (raf) cancelAnimationFrame(raf); },
      still: function () {
        // advance a few seconds of simulation, then draw one frame
        for (var i = 0; i < 90; i++) def.frame(s, 0.033);
      }
    };
  }

  var mounted = [];

  Array.prototype.forEach.call(document.querySelectorAll('[data-viz]'), function (el) {
    var name = el.getAttribute('data-viz');
    var inst = name === 'medvigil' ? medvigil(el) : mountCanvas(el, name);
    if (!inst) return;
    mounted.push({ el: el, inst: inst });
    if (reduced) { inst.still && inst.still(); }
  });

  if (!reduced && 'IntersectionObserver' in window) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var m = mounted.filter(function (x) { return x.el === e.target; })[0];
        if (!m) return;
        e.isIntersecting ? m.inst.start() : m.inst.stop();
      });
    }, { rootMargin: '120px', threshold: 0.01 });
    mounted.forEach(function (m) { vo.observe(m.el); });
  } else if (!reduced) {
    mounted.forEach(function (m) { m.inst.start(); });
  }

  var vrt;
  window.addEventListener('resize', function () {
    window.clearTimeout(vrt);
    vrt = window.setTimeout(function () {
      mounted.forEach(function (m) { m.inst.resize && m.inst.resize(); });
    }, 160);
  });

  document.addEventListener('visibilitychange', function () {
    if (reduced) return;
    mounted.forEach(function (m) {
      document.hidden ? m.inst.stop() : m.inst.start();
    });
  });

})();
