/* ==========================================================================
   SWAMI INDIA INTERNATIONAL — "ATLANTIC LINE"
   main.js — every interaction on the homepage. No dependencies.

   MODULES
   01  Utilities
   02  Split text
   03  Reveal on scroll
   04  Counters
   05  Parallax
   06  Preloader
   07  Navigation, progress bar & menu
   08  Hero slider
   09  Marquee
   10  Developments hover index
   11  Testimonial slider
   12  Lightbox
   13  Custom cursor
   14  Magnetic buttons
   15  Forms & misc
   16  Boot

   Motion policy: every animated module checks REDUCED and either degrades
   to an instant final state or opts out entirely.
   ========================================================================== */

(function () {
  'use strict';

  /* ======================================================================
     01 · UTILITIES
     ====================================================================== */

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CAN_HOVER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function on(el, evt, fn, opts) { if (el) el.addEventListener(evt, fn, opts || false); }

  function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* rAF-throttled scroll subscription. One listener for the whole page. */
  var scrollSubs = [];
  var ticking = false;
  function onScroll(fn) { scrollSubs.push(fn); }
  function flushScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    for (var i = 0; i < scrollSubs.length; i++) scrollSubs[i](y);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(flushScroll); }
  }, { passive: true });
  window.addEventListener('resize', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(flushScroll); }
  }, { passive: true });


  /* ======================================================================
     02 · SPLIT TEXT
     Wraps lines/words in a masked span so they can slide up from a clip.
     Splitting is done on source newlines (lines) or spaces (words) — no
     measurement, so a late-loading webfont can never cause a re-layout bug.
     ====================================================================== */

  function splitText() {
    $$('[data-split]').forEach(function (el) {
      var mode = el.getAttribute('data-split');
      var parts = [];

      if (mode === 'lines') {
        el.textContent.replace(/^\s+|\s+$/g, '').split('\n').forEach(function (s) {
          s = s.trim();
          if (s) parts.push({ t: s, em: false });
        });
      } else {
        /* Walk child nodes so inline emphasis (<em>/<strong>) survives the
           split — those words get .word--em for the gold accent. */
        (function walk(node, em) {
          Array.prototype.forEach.call(node.childNodes, function (n) {
            if (n.nodeType === 3) {
              n.textContent.split(/\s+/).forEach(function (w) {
                if (w) parts.push({ t: w, em: em });
              });
            } else if (n.nodeType === 1) {
              walk(n, em || /^(EM|STRONG|B|I)$/.test(n.tagName));
            }
          });
        })(el, false);
      }

      // Preserve the accessible text; the visual pieces are decorative.
      el.setAttribute('aria-label', parts.map(function (p) { return p.t; }).join(' '));

      var frag = document.createDocumentFragment();
      parts.forEach(function (part, i) {
        var outer = document.createElement('span');
        outer.className = (mode === 'lines' ? 'line' : 'word') + (part.em ? ' word--em' : '');
        outer.setAttribute('aria-hidden', 'true');

        var inner = document.createElement('span');
        inner.className = mode === 'lines' ? 'line__i' : 'word__i';
        inner.textContent = part.t;
        inner.style.setProperty('--wd', (i * (mode === 'lines' ? 110 : 42)) + 'ms');

        outer.appendChild(inner);
        frag.appendChild(outer);
      });

      el.textContent = '';
      el.appendChild(frag);
      el.classList.add('is-split');
    });
  }


  /* ======================================================================
     03 · REVEAL ON SCROLL
     ====================================================================== */

  function initReveal() {
    var targets = $$('[data-reveal], [data-split]');

    // Index children of staggered groups so CSS can offset each one.
    $$('[data-reveal="stagger"]').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--i', i);
      });
    });

    // Custom per-element delay.
    targets.forEach(function (el) {
      var d = el.getAttribute('data-reveal-delay');
      if (d) el.style.setProperty('--rd', d + 'ms');
    });

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var pending = targets.slice();
    var io;

    function reveal(el) {
      if (el.classList.contains('is-in')) return;
      el.classList.add('is-in');          // reveal once — replaying feels cheap
      if (io) io.unobserve(el);
      var i = pending.indexOf(el);
      if (i > -1) pending.splice(i, 1);
    }

    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) reveal(entry.target);
      });
    }, {
      // Fire slightly before the element reaches the fold so the motion
      // has finished by the time it is fully in view.
      rootMargin: '0px 0px -10% 0px',
      threshold: 0
    });

    targets.forEach(function (el) { io.observe(el); });

    /* Safety net.
       IntersectionObserver callbacks are delivered on the main thread, so a
       fast flick-scroll — or a frame budget briefly eaten by the compositor —
       can let a section slide past before its callback lands, leaving it
       permanently blank. A visitor must never see an empty gallery, so on
       every scroll frame we force-reveal anything the fold has already
       cleared. The list drains to empty and the check then costs nothing. */
    function catchUp() {
      if (!pending.length) return;
      var line = window.innerHeight * 0.9;
      for (var i = pending.length - 1; i >= 0; i--) {
        if (pending[i].getBoundingClientRect().top < line) reveal(pending[i]);
      }
    }
    onScroll(catchUp);
    catchUp();
  }


  /* ======================================================================
     04 · COUNTERS
     ====================================================================== */

  function initCounters() {
    var nodes = $$('[data-count]');
    if (!nodes.length) return;

    function run(el) {
      var end = parseFloat(el.getAttribute('data-count')) || 0;
      var dur = parseInt(el.getAttribute('data-count-dur'), 10) || 1600;
      var raw = el.hasAttribute('data-count-raw');   // years: no thousands separator

      if (REDUCED) { el.textContent = raw ? end : end.toLocaleString('en-US'); return; }

      var start = performance.now();
      (function step(now) {
        var t = clamp((now - start) / dur, 0, 1);
        // easeOutExpo — fast climb, long graceful settle
        var eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        var val = Math.round(end * eased);
        el.textContent = raw ? val : val.toLocaleString('en-US');
        if (t < 1) requestAnimationFrame(step);
      })(start);
    }

    if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.5 });

    nodes.forEach(function (el) { io.observe(el); });
  }


  /* ======================================================================
     05 · PARALLAX
     Transform-only, driven off the shared rAF scroll loop.
     ====================================================================== */

  function initParallax() {
    if (REDUCED) return;

    var items = $$('[data-parallax]').map(function (el) {
      return {
        el: el,
        speed: parseFloat(el.getAttribute('data-parallax')) || 0,
        scale: parseFloat(el.getAttribute('data-parallax-scale')) || 1
      };
    });
    if (!items.length) return;

    function update() {
      var vh = window.innerHeight;
      items.forEach(function (it) {
        var rect = it.el.getBoundingClientRect();
        // Skip anything comfortably offscreen.
        if (rect.bottom < -vh * 0.4 || rect.top > vh * 1.4) return;
        // Distance of the element's centre from the viewport centre.
        var offset = (rect.top + rect.height / 2) - vh / 2;
        var y = offset * it.speed;
        it.el.style.transform =
          'translate3d(0,' + y.toFixed(2) + 'px,0)' +
          (it.scale !== 1 ? ' scale(' + it.scale + ')' : '');
      });
    }

    onScroll(update);
    update();
  }


  /* ======================================================================
     06 · PRELOADER
     Progress eases toward 88% while assets load, then completes once
     `load` fires (or a 3s ceiling, so a slow image never traps the page).
     ====================================================================== */

  function initPreloader(done) {
    var el = $('#preloader');
    var fill = $('#preloaderFill');
    var count = $('#preloaderCount');

    if (!el) { done(); return; }

    document.body.classList.add('is-locked');

    // Reduced motion: no theatre, just get out of the way.
    if (REDUCED) {
      el.classList.add('is-done', 'is-hidden');
      document.body.classList.remove('is-locked');
      done();
      return;
    }

    var assetsReady = false;
    var started = performance.now();
    var MIN_MS = 1100;          // never flash by faster than this
    var CEILING_MS = 3000;      // never hold longer than this

    on(window, 'load', function () { assetsReady = true; });
    setTimeout(function () { assetsReady = true; }, CEILING_MS);

    var p = 0;
    var finished = false;

    (function loop(now) {
      var elapsed = now - started;
      var canFinish = assetsReady && elapsed >= MIN_MS;
      var target = canFinish ? 100 : 88;

      p = lerp(p, target, 0.07);
      if (canFinish && target - p < 0.5) p = 100;

      var shown = Math.round(p);
      if (fill) fill.style.width = shown + '%';
      if (count) count.textContent = shown;

      if (p >= 100) { finish(); return; }
      requestAnimationFrame(loop);
    })(started);

    function finish() {
      if (finished) return;
      finished = true;
      el.classList.add('is-done');
      document.body.classList.remove('is-locked');
      done();
      setTimeout(function () { el.classList.add('is-hidden'); }, 1500);
    }
  }


  /* ======================================================================
     07 · NAVIGATION, PROGRESS BAR & MENU
     ====================================================================== */

  function initNav() {
    var nav = $('#nav');
    var bar = $('#progressBar');
    var lastY = 0;

    onScroll(function (y) {
      // Reading progress
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? clamp(y / max, 0, 1) * 100 : 0) + '%';
      }

      if (!nav) return;

      // Frosted state once we leave the hero
      nav.classList.toggle('is-stuck', y > window.innerHeight * 0.6);

      // Hide going down, reveal going up — but never over the hero.
      var goingDown = y > lastY && y > window.innerHeight;
      nav.classList.toggle('is-hidden', goingDown && !document.body.classList.contains('is-locked'));
      lastY = y;
    });

    // --- Active section link -------------------------------------------
    var links = $$('[data-nav-link]');
    var sections = links
      .map(function (a) { return $(a.getAttribute('href')); })
      .filter(Boolean);

    if (sections.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (a) {
            a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(function (s) { io.observe(s); });
    }

    // --- Menu overlay ---------------------------------------------------
    var burger = $('#burger');
    var menu = $('#menu');
    if (!burger || !menu) return;

    var lastFocus = null;

    function openMenu() {
      lastFocus = document.activeElement;
      menu.hidden = false;
      // Next frame, so the clip-path transition has a starting value.
      requestAnimationFrame(function () {
        menu.classList.add('is-open');
        burger.setAttribute('aria-expanded', 'true');
        burger.setAttribute('aria-label', 'Close menu');
        document.body.classList.add('is-locked', 'menu-open');
        nav.classList.remove('is-hidden');
        var first = $('a', menu);
        if (first) first.focus({ preventScroll: true });
      });
    }

    function closeMenu() {
      menu.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('is-locked', 'menu-open');
      setTimeout(function () { menu.hidden = true; }, 700);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }

    on(burger, 'click', function () {
      menu.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    $$('a', menu).forEach(function (a) { on(a, 'click', closeMenu); });

    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
    });

    // Keep focus inside the overlay while it is open.
    on(menu, 'keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = $$('a, button', menu).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }


  /* ======================================================================
     08 · HERO SLIDER
     ====================================================================== */

  function initHero() {
    var slides = $$('[data-hero-slide]');
    var buttons = $$('[data-hero-go]');
    if (slides.length < 2) return;

    var index = 0;
    var timer = null;
    var DURATION = 6000;   // must match --idxFill in CSS (6s)

    function go(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === index); });
      buttons.forEach(function (b, n) {
        var active = n === index;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-current', active ? 'true' : 'false');
      });
      restart();
    }

    function restart() {
      clearInterval(timer);
      if (REDUCED) return;
      timer = setInterval(function () { go(index + 1); }, DURATION);
    }

    buttons.forEach(function (b, n) { on(b, 'click', function () { go(n); }); });

    // Don't burn cycles animating a hidden tab.
    on(document, 'visibilitychange', function () {
      document.hidden ? clearInterval(timer) : restart();
    });

    go(0);
  }


  /* ======================================================================
     09 · MARQUEE
     Clones the content until the track is at least twice the viewport,
     then animates a -50% translate for a seamless loop.
     ====================================================================== */

  function initMarquee() {
    $$('[data-marquee]').forEach(function (track) {
      var set = track.firstElementChild;
      if (!set) return;

      var container = track.parentElement;
      var guard = 0;

      // Fill the visible width at least twice over.
      while (track.scrollWidth < container.offsetWidth * 2 && guard < 20) {
        track.appendChild(set.cloneNode(true));
        guard++;
      }

      // Duplicate the whole run once more so -50% lands on an identical frame.
      var half = track.scrollWidth;
      Array.prototype.slice.call(track.children).forEach(function (child) {
        track.appendChild(child.cloneNode(true));
      });

      if (REDUCED) return;

      var speed = parseFloat(track.getAttribute('data-marquee-speed')) || 50; // px/sec
      var duration = half / speed;

      track.style.animation = 'marquee ' + duration.toFixed(1) + 's linear infinite';
      if (track.getAttribute('data-marquee-reverse')) {
        track.style.animationDirection = 'reverse';
      }
    });
  }


  /* ======================================================================
     10 · DEVELOPMENTS HOVER INDEX
     Desktop only. A single preview element follows the pointer with a
     lerp, and the hovered row's image crossfades into place.
     ====================================================================== */

  function initDevIndex() {
    var index = $('[data-dev-index]');
    var preview = $('[data-dev-preview]');
    if (!index || !preview) return;
    if (!CAN_HOVER || REDUCED) return;
    if (!window.matchMedia('(min-width: 1024px)').matches) return;

    var figures = $$('figure', preview);
    var rows = $$('[data-dev-row]', index);

    var target = { x: 0, y: 0 };
    var current = { x: 0, y: 0 };
    var active = false;
    var raf = null;

    function render() {
      current.x = lerp(current.x, target.x, 0.12);
      current.y = lerp(current.y, target.y, 0.12);
      preview.style.transform =
        'translate3d(' + current.x.toFixed(1) + 'px,' + current.y.toFixed(1) + 'px,0)';
      if (active) raf = requestAnimationFrame(render);
      else raf = null;
    }

    on(index, 'mousemove', function (e) {
      var w = preview.offsetWidth;
      var h = preview.offsetHeight;
      // Offset to the right of the pointer, then clamp inside the viewport.
      target.x = clamp(e.clientX + 40, 12, window.innerWidth - w - 12);
      target.y = clamp(e.clientY - h / 2, 12, window.innerHeight - h - 12);
    });

    rows.forEach(function (row, i) {
      on(row, 'mouseenter', function () {
        active = true;
        index.classList.add('is-previewing');
        rows.forEach(function (r) { r.classList.remove('is-hovered'); });
        row.classList.add('is-hovered');
        figures.forEach(function (f, n) { f.classList.toggle('is-active', n === i); });

        // Seed the position so the preview doesn't fly in from 0,0.
        if (current.x === 0 && current.y === 0) {
          current.x = target.x;
          current.y = target.y;
        }
        if (!raf) raf = requestAnimationFrame(render);
      });
    });

    on(index, 'mouseleave', function () {
      active = false;
      index.classList.remove('is-previewing');
      rows.forEach(function (r) { r.classList.remove('is-hovered'); });
      figures.forEach(function (f) { f.classList.remove('is-active'); });
    });
  }


  /* ======================================================================
     11 · TESTIMONIAL SLIDER
     ====================================================================== */

  function initSlider() {
    var root = $('[data-slider]');
    if (!root) return;

    var track = $('[data-slider-track]', root);
    var slides = $$('[data-slide]', root);
    var dotsWrap = $('[data-slider-dots]', root);
    var prev = $('[data-slider-prev]', root);
    var next = $('[data-slider-next]', root);
    if (!track || !slides.length) return;

    var index = 0;
    var maxIndex = 0;
    var timer = null;
    var AUTOPLAY = 6500;

    function metrics() {
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      var w = slides[0].getBoundingClientRect().width;
      var step = w + gap;
      var perView = Math.max(1, Math.round((root.clientWidth + gap) / step));
      maxIndex = Math.max(0, slides.length - perView);
      return step;
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      for (var i = 0; i <= maxIndex; i++) {
        (function (i) {
          var b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-label', 'Testimonial group ' + (i + 1));
          on(b, 'click', function () { go(i); resetAuto(); });
          dotsWrap.appendChild(b);
        })(i);
      }
    }

    function paint() {
      if (!dotsWrap) return;
      Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
        d.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
    }

    function go(i) {
      var step = metrics();
      index = clamp(i, 0, maxIndex);
      track.style.transform = 'translate3d(' + (-index * step) + 'px,0,0)';
      paint();
    }

    function resetAuto() {
      clearInterval(timer);
      if (REDUCED) return;
      timer = setInterval(function () {
        go(index >= maxIndex ? 0 : index + 1);
      }, AUTOPLAY);
    }

    on(prev, 'click', function () { go(index - 1); resetAuto(); });
    on(next, 'click', function () { go(index + 1); resetAuto(); });

    on(root, 'mouseenter', function () { clearInterval(timer); });
    on(root, 'mouseleave', resetAuto);
    on(root, 'focusin', function () { clearInterval(timer); });
    on(root, 'focusout', resetAuto);

    // Keyboard
    on(root, 'keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(index - 1); resetAuto(); }
      if (e.key === 'ArrowRight') { go(index + 1); resetAuto(); }
    });

    // Swipe
    var startX = null;
    on(root, 'touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    on(root, 'touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 48) { go(dx < 0 ? index + 1 : index - 1); resetAuto(); }
      startX = null;
    }, { passive: true });

    on(document, 'visibilitychange', function () {
      document.hidden ? clearInterval(timer) : resetAuto();
    });

    // Recalculate on resize — perView changes at breakpoints.
    var rt;
    on(window, 'resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        metrics();
        buildDots();
        go(Math.min(index, maxIndex));
      }, 160);
    });

    metrics();
    buildDots();
    go(0);
    resetAuto();
  }


  /* ======================================================================
     12 · LIGHTBOX
     ====================================================================== */

  function initLightbox() {
    /* A page can carry several galleries — the project pages have one per
       plan section. Every [data-lightbox-group] is wired, and opening a
       figure loads that group's images so prev/next stays inside the set
       the visitor clicked. */
    var groups = $$('[data-lightbox-group]');
    var box = $('#lightbox');
    if (!groups.length || !box) return;

    var img = $('#lightboxImg');
    var cap = $('#lightboxCap');
    var counter = $('#lightboxCount');
    var closeBtn = $('[data-lb-close]', box);

    function readGroup(group) {
      return $$('figure', group).map(function (fig) {
        var i = $('img', fig);
        var c = $('figcaption', fig);
        return {
          src: i ? (i.getAttribute('data-full') || i.src) : '',
          alt: i ? i.alt : '',
          caption: c ? c.textContent.replace(/\s+/g, ' ').trim() : ''
        };
      });
    }

    var items = [];
    var index = 0;
    var lastFocus = null;

    function show(i) {
      index = (i + items.length) % items.length;
      var it = items[index];
      img.src = it.src;
      img.alt = it.alt;
      if (cap) cap.textContent = it.caption;
      if (counter) counter.textContent = (index + 1) + ' / ' + items.length;
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.hidden = false;
      requestAnimationFrame(function () { box.classList.add('is-open'); });
      document.body.classList.add('is-locked');
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    function close() {
      box.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      setTimeout(function () { box.hidden = true; img.src = ''; }, 400);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }

    groups.forEach(function (group) {
      $$('figure', group).forEach(function (fig, i) {
        fig.setAttribute('role', 'button');
        fig.setAttribute('tabindex', '0');
        fig.setAttribute('aria-label', 'Open image ' + (i + 1) + ' in viewer');
        var openThis = function () { items = readGroup(group); open(i); };
        on(fig, 'click', openThis);
        on(fig, 'keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openThis(); }
        });
      });
    });

    on(closeBtn, 'click', close);
    on($('[data-lb-prev]', box), 'click', function () { show(index - 1); });
    on($('[data-lb-next]', box), 'click', function () { show(index + 1); });

    // Click the backdrop (but not the image) to dismiss.
    on(box, 'click', function (e) { if (e.target === box) close(); });

    on(document, 'keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });

    // Swipe between images on touch.
    var sx = null;
    on(box, 'touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    on(box, 'touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 48) show(dx < 0 ? index + 1 : index - 1);
      sx = null;
    }, { passive: true });
  }


  /* ======================================================================
     13 · CUSTOM CURSOR
     ====================================================================== */

  function initCursor() {
    if (!CAN_HOVER || REDUCED) return;

    var cur = $('#cursor');
    if (!cur) return;

    var dot = $('.cursor__dot', cur);
    var ring = $('.cursor__ring', cur);
    var label = $('.cursor__label', cur);
    cur.classList.add('is-on');

    var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var d = { x: mouse.x, y: mouse.y };
    var r = { x: mouse.x, y: mouse.y };

    on(window, 'mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

    (function frame() {
      d.x = lerp(d.x, mouse.x, 0.55);
      d.y = lerp(d.y, mouse.y, 0.55);
      // The ring trails the dot — that lag is what reads as "weight".
      r.x = lerp(r.x, mouse.x, 0.16);
      r.y = lerp(r.y, mouse.y, 0.16);

      dot.style.transform = 'translate3d(' + d.x + 'px,' + d.y + 'px,0) translate(-50%,-50%)';
      ring.style.transform = 'translate3d(' + r.x + 'px,' + r.y + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(frame);
    })();

    // Hover states, delegated so it survives DOM changes.
    on(document, 'mouseover', function (e) {
      var labelled = e.target.closest('[data-cursor]');
      if (labelled) {
        cur.classList.add('is-label');
        cur.classList.remove('is-hover');
        if (label) label.textContent = labelled.getAttribute('data-cursor');
        return;
      }
      cur.classList.remove('is-label');
      cur.classList.toggle('is-hover',
        !!e.target.closest('a, button, [role="button"], input, select, textarea'));
    });

    // Hide when the pointer leaves the document entirely.
    on(document, 'mouseleave', function () { cur.style.opacity = '0'; });
    on(document, 'mouseenter', function () { cur.style.opacity = '1'; });
  }


  /* ======================================================================
     14 · MAGNETIC BUTTONS
     ====================================================================== */

  function initMagnetic() {
    if (!CAN_HOVER || REDUCED) return;

    $$('[data-magnetic]').forEach(function (el) {
      var STRENGTH = 0.28;
      var RANGE = 90;

      on(el, 'mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var dist = Math.hypot(dx, dy);
        if (dist > RANGE + Math.max(rect.width, rect.height) / 2) return;
        el.style.transform =
          'translate3d(' + (dx * STRENGTH) + 'px,' + (dy * STRENGTH) + 'px,0)';
      });

      on(el, 'mouseleave', function () { el.style.transform = ''; });
    });
  }


  /* ======================================================================
     15 · FORMS & MISC
     ====================================================================== */

  /* ======================================================================
     15a · GATED PRICES
     Any element with data-price shows a locked placeholder until the
     visitor has made one enquiry (same flag the availability explorer
     uses). Markup ships locked, so the real figure never flashes.
     ====================================================================== */

  var revealPrices = null;

  function priceUnlocked() {
    try {
      return localStorage.getItem('swamiPriceUnlocked') === '1' ||
        sessionStorage.getItem('swamiPriceUnlocked') === '1';
    } catch (e) { return false; }
  }

  function initPriceGate() {
    var els = $$('[data-price]');
    if (!els.length) return;

    function reveal() {
      els.forEach(function (el) {
        el.textContent = el.getAttribute('data-price');
        el.classList.add('is-open');
        var lock = el.parentElement && el.parentElement.querySelector('.gprice-lock');
        if (lock) lock.remove();
      });
    }

    if (priceUnlocked()) { reveal(); return; }
    els.forEach(function (el) {
      el.setAttribute('aria-label', 'Price hidden — enquire once to reveal');
    });
    revealPrices = reveal;   // the enquiry form calls this on submit
  }

  /* ======================================================================
     15b · BACK TO TOP
     Injected from JS so every page that loads main.js gets it for free.
     ====================================================================== */

  function initToTop() {
    var btn = document.createElement('button');
    btn.className = 'totop';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
      '<path d="M10 16V4m0 0 5 5m-5-5-5 5" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.appendChild(btn);

    on(btn, 'click', function () {
      window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    });

    onScroll(function (y) {
      btn.classList.toggle('is-on', y > window.innerHeight * 1.2);
    });
  }

  function initMisc() {
    // Current year in the footer
    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();

    // Demo submit handling. In WordPress, remove this and let the form
    // POST to Contact Form 7 / WPForms / admin-post.php instead.
    // Forms marked data-native manage their own submit (price gate etc.).
    $$('form:not([data-native])').forEach(function (form) {
      on(form, 'submit', function (e) {
        e.preventDefault();
        /* An enquiry here counts as the one enquiry that unlocks pricing
           on the availability / floor-plans pages — and on this one. */
        try { localStorage.setItem('swamiPriceUnlocked', '1'); } catch (err) { /* private mode */ }
        if (revealPrices) { revealPrices(); revealPrices = null; }
        var btn = $('button[type="submit"]', form) || $('button', form);
        if (!btn) return;
        var original = btn.innerHTML;
        btn.innerHTML = '<span>Thank you — we will be in touch</span>';
        btn.disabled = true;
        setTimeout(function () {
          btn.innerHTML = original;
          btn.disabled = false;
          form.reset();
        }, 3200);
      });
    });

    // Give the eyebrow rules a draw-in when their section reveals.
    // (Handled purely in CSS via .is-in — nothing to do here.)
  }


  /* ======================================================================
     16 · BOOT
     ====================================================================== */

  function boot() {
    // Guard each module: one failure must never take down the page.
    function safe(name, fn) {
      try { fn(); } catch (err) {
        if (window.console) console.warn('[swami] ' + name + ' failed:', err);
      }
    }

    safe('splitText', splitText);

    safe('preloader', function () {
      initPreloader(function () {
        safe('reveal', initReveal);
        safe('counters', initCounters);
        safe('hero', initHero);
      });
    });

    safe('nav', initNav);
    safe('parallax', initParallax);
    safe('marquee', initMarquee);
    safe('devIndex', initDevIndex);
    safe('slider', initSlider);
    safe('lightbox', initLightbox);
    safe('cursor', initCursor);
    safe('magnetic', initMagnetic);
    safe('toTop', initToTop);
    safe('priceGate', initPriceGate);
    safe('misc', initMisc);

    // Failsafe: if anything above stalled, make sure nothing stays invisible.
    setTimeout(function () {
      var pre = $('#preloader');
      if (pre && !pre.classList.contains('is-done')) {
        pre.classList.add('is-done', 'is-hidden');
        document.body.classList.remove('is-locked');
      }
      $$('[data-reveal], [data-split]').forEach(function (el) {
        if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add('is-in');
        }
      });
    }, 6000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
