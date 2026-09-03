/* ═══════════════════════════════════════════════════════════════
   Chanchreek Jain — Portfolio
   Vanilla scroll engine. No dependencies.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp  = function (a, b, t) { return a + (b - a) * t; };
  // maps v from [a,b] onto [0,1]
  var range = function (v, a, b) { return clamp((v - a) / (b - a), 0, 1); };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* ───────────────────────────── year ───────────────────────────── */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ───────────────────────────── hero letter split ───────────────────────────── */
  $$('[data-split]').forEach(function (el) {
    var text = el.textContent.trim();
    var frag = document.createDocumentFragment();
    for (var i = 0; i < text.length; i++) {
      var span = document.createElement('span');
      span.className = 'ch';
      span.style.setProperty('--ci', i);
      span.textContent = text[i] === ' ' ? ' ' : text[i];
      frag.appendChild(span);
    }
    el.textContent = '';
    el.appendChild(frag);
  });

  /* the refraction layer is a mute copy of the name, clipped to a spectrum */
  var heroName = $('#heroName'), heroPrism = $('#heroPrism');
  if (heroName && heroPrism) {
    var clone = document.createElement('div');
    clone.className = 'hero__name';
    clone.innerHTML = heroName.innerHTML;
    heroPrism.appendChild(clone);
  }

  /* ───────────────────────────── logo wall ─────────────────────────────
     Each cell shows a real mark if its file exists in assets/logos/, and
     falls back to the wordmark when it doesn't. Nothing to configure. */
  $$('.wall__cell').forEach(function (cell) {
    var img = cell.querySelector('.wall__logo');
    if (!img) return;
    var ok = function () {
      if (img.naturalWidth > 0) cell.classList.add('has-logo');
      else img.remove();
    };
    var fail = function () { img.remove(); };
    if (img.complete) { ok(); }
    else { img.addEventListener('load', ok); img.addEventListener('error', fail); }
  });

  /* ───────────────────────────── loader ───────────────────────────── */
  var loader   = $('#loader');
  var beamFill = $('#beamFill');
  var beamCount= $('#beamCount');

  function finishLoad() {
    document.documentElement.classList.add('is-ready');
    if (!loader) return;
    loader.classList.add('is-done');
    window.setTimeout(function () {
      loader.classList.add('is-gone');
      window.setTimeout(function () { loader.style.display = 'none'; }, 1100);
    }, 620);
  }

  if (loader && !reduced) {
    var pct = 0;
    var settled = false;
    var ready = false;

    var assetsReady = function () { ready = true; };
    if (document.readyState === 'complete') assetsReady();
    else window.addEventListener('load', assetsReady);
    // never hold the page hostage to a slow font or image
    window.setTimeout(assetsReady, 4200);

    var tick = window.setInterval(function () {
      var ceiling = ready ? 100 : 88;
      var step = ready ? 9 : (pct < 55 ? 6 : pct < 78 ? 2.4 : 0.7);
      pct = Math.min(ceiling, pct + Math.random() * step);
      beamFill.style.width = pct.toFixed(1) + '%';
      beamCount.textContent = String(Math.floor(pct));
      if (pct >= 99.5 && !settled) {
        settled = true;
        window.clearInterval(tick);
        beamFill.style.width = '100%';
        beamCount.textContent = '100';
        window.setTimeout(finishLoad, 420);
      }
    }, 90);
  } else {
    if (loader) loader.style.display = 'none';
    document.documentElement.classList.add('is-ready');
  }

  /* ───────────────────────────── reveal on scroll ───────────────────────────── */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var siblings = $$('.reveal', e.target.parentElement);
        var idx = siblings.indexOf(e.target);
        e.target.style.setProperty('--d', (idx > 0 ? Math.min(idx, 6) * 70 : 0) + 'ms');
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ───────────────────────────── overlay menu ───────────────────────────── */
  var nav = $('#nav');
  var menu = $('#menu');
  var trigger = $('#navTrigger');
  var menuLinks = $$('.menu__list a');
  menuLinks.forEach(function (a, i) { a.style.setProperty('--i', i); });

  function setMenu(open) {
    if (!menu || !trigger) return;
    menu.classList.toggle('is-open', open);
    if (nav) nav.classList.toggle('is-menu-open', open);
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    document.documentElement.classList.toggle('is-locked', open);
    if (open) { menu.removeAttribute('inert'); }
    else { menu.setAttribute('inert', ''); }
  }
  if (trigger) {
    trigger.addEventListener('click', function () {
      setMenu(trigger.getAttribute('aria-expanded') !== 'true');
    });
  }
  menuLinks.forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu && menu.classList.contains('is-open')) {
      setMenu(false);
      trigger.focus();
    }
  });

  /* ───────────────────────────── scroll-driven state ───────────────────────────── */
  var railFill   = $('#railFill');
  var panel      = $('#expandPanel');
  var expandSec  = $('#statement');
  var gallery    = $('#systems');
  var track      = $('#galleryTrack');
  var galIndex   = $('#galleryIndex');
  var tlFill     = $('#timelineFill');
  var timeline   = $('.timeline');
  var navAnchors = $$('.nav__links a');
  var corner = $('#corner');
  var footEl = $('.foot');
  var boneSections = $$('[data-ground="bone"]').map(function (el) {
    return { el: el, from: parseFloat(el.getAttribute('data-ground-from')) || 0 };
  });
  var isBone = false;

  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var docH = 0;
  var maxShift = 0;
  var stacked = false;

  function measure() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    docH = Math.max(document.body.scrollHeight - vh, 1);
    stacked = vw <= 900 || reduced;
    if (track && !stacked) {
      maxShift = Math.max(track.scrollWidth - vw, 0);
    } else {
      maxShift = 0;
      if (track) track.style.transform = '';
    }
  }

  // smoothed values so nothing snaps
  var sm = { shift: 0, rail: 0 };
  var lastY = -1;
  var lastIdx = -1;

  function frame() {
    var y = window.pageYOffset || document.documentElement.scrollTop;

    /* — nav — */
    if (nav) nav.classList.toggle('is-stuck', y > 40);

    /* — top rail — */
    var p = clamp(y / docH, 0, 1);
    sm.rail = lerp(sm.rail, p, 0.16);
    if (railFill) railFill.style.width = (sm.rail * 100).toFixed(2) + '%';

    /* — expanding statement panel — */
    if (panel && expandSec && !reduced) {
      var r = expandSec.getBoundingClientRect();
      var travel = Math.max(expandSec.offsetHeight - vh, 1);
      var ep = clamp(-r.top / travel, 0, 1);

      var grow = easeInOut(range(ep, 0.02, 0.52));
      var w = lerp(stacked ? 84 : 46, 100, grow);
      var h = lerp(stacked ? 46 : 44, 100, grow);
      var rad = lerp(14, 0, grow);
      panel.style.setProperty('--w', w.toFixed(2) + 'vw');
      panel.style.setProperty('--h', h.toFixed(2) + 'svh');
      panel.style.setProperty('--r', rad.toFixed(1) + 'px');
      panel.style.setProperty('--o', easeOut(range(ep, 0.16, 0.46)).toFixed(3));
      panel.style.setProperty('--sp', (range(ep, 0.30, 0.62) * 0.8).toFixed(3));
    }

    /* — horizontal systems gallery — */
    if (track && gallery && !stacked) {
      var gr = gallery.getBoundingClientRect();
      var gTravel = Math.max(gallery.offsetHeight - vh, 1);
      var gp = clamp(-gr.top / gTravel, 0, 1);
      // lead-in / lead-out so the first and last card breathe
      var eased = range(gp, 0.06, 0.94);
      var targetShift = -eased * maxShift;
      sm.shift = lerp(sm.shift, targetShift, 0.11);
      track.style.transform = 'translate3d(' + sm.shift.toFixed(2) + 'px,0,0)';

      if (galIndex) {
        var idx = clamp(Math.round(eased * 3) + 1, 1, 4);
        if (idx !== lastIdx) {
          galIndex.textContent = '0' + idx;
          lastIdx = idx;
        }
      }
    }

    /* — timeline rail — */
    if (tlFill && timeline) {
      var tr = timeline.getBoundingClientRect();
      var tp = clamp((vh * 0.72 - tr.top) / Math.max(tr.height, 1), 0, 1);
      tlFill.style.height = (tp * 100).toFixed(2) + '%';
    }

    /* — ground flip: ink ⇄ bone — */
    var probe = vh * 0.10;
    var bone = false;
    for (var bi = 0; bi < boneSections.length; bi++) {
      var bs = boneSections[bi];
      var br = bs.el.getBoundingClientRect();
      if (br.bottom <= probe || br.top > probe) continue;
      if (bs.from > 0) {
        // a section can ask for the flip partway through its own travel
        var bTravel = Math.max(bs.el.offsetHeight - vh, 1);
        if (clamp(-br.top / bTravel, 0, 1) < bs.from) continue;
      }
      bone = true; break;
    }
    if (bone !== isBone) {
      isBone = bone;
      document.documentElement.classList.toggle('is-bone', bone);
    }

    /* — sticky corner mark — */
    if (corner) {
      corner.classList.toggle('is-on', y > vh * 0.7);
      var mute = false;
      // step out of the pinned gallery's way
      if (gallery && !stacked) {
        var cgr = gallery.getBoundingClientRect();
        mute = cgr.top < vh * 0.5 && cgr.bottom > vh * 0.5;
      }
      // and out of the footer's, which already carries the name
      if (!mute && footEl) {
        mute = footEl.getBoundingClientRect().top < vh;
      }
      corner.classList.toggle('is-muted', mute);
    }

    /* — active nav link — */
    if (y !== lastY) {
      lastY = y;
      var current = null;
      navAnchors.forEach(function (a) {
        var sec = document.querySelector(a.getAttribute('href'));
        if (!sec) return;
        var sr = sec.getBoundingClientRect();
        if (sr.top <= vh * 0.42 && sr.bottom > vh * 0.42) current = a;
      });
      navAnchors.forEach(function (a) { a.classList.toggle('is-active', a === current); });
    }

    requestAnimationFrame(frame);
  }

  measure();
  requestAnimationFrame(frame);

  var rt;
  window.addEventListener('resize', function () {
    window.clearTimeout(rt);
    rt = window.setTimeout(measure, 140);
  });
  window.addEventListener('orientationchange', function () { window.setTimeout(measure, 240); });
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  /* ───────────────────────────── custom cursor ───────────────────────────── */
  var cursor = $('#cursor');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (cursor && fine && !reduced) {
    var dot  = $('.cursor__dot', cursor);
    var ring = $('.cursor__ring', cursor);
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    var shown = false;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; cursor.style.opacity = '1'; }
    }, { passive: true });

    document.addEventListener('mouseleave', function () { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { cursor.style.opacity = '1'; });

    var hotSel = 'a, button, .cap, .slide, .cred';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(hotSel)) cursor.classList.add('is-hot');
    }, { passive: true });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(hotSel)) cursor.classList.remove('is-hot');
    }, { passive: true });

    cursor.style.opacity = '0';
    cursor.style.transition = 'opacity .3s ease';

    (function cursorFrame() {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      dot.style.transform  = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
      ring.style.transform = 'translate(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px) translate(-50%,-50%)';
      requestAnimationFrame(cursorFrame);
    })();
  }

  /* ───────────────────────────── keyboard: skip the pinned gallery ───────────────────────────── */
  // Tabbing into an off-screen card would otherwise fight the scroll pin.
  $$('.slide a, .slide button').forEach(function (el) {
    el.addEventListener('focus', function () {
      if (gallery && window.innerWidth > 900) {
        gallery.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    });
  });

})();
