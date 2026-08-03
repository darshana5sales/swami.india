/* ==========================================================================
   THE DIPLOMAT — BUILDING & FLOOR-PLATE EXPLORER
   diplomat.js — an isometric massing of the building, the real typical
   floor plate, and a sheet for any residence. No dependencies.

   EVERY FIGURE BELOW COMES FROM "THE DIPLOMAT BROCHURE V3.pdf".
   Unit positions, quantities, built/balcony areas and room dimensions are
   transcribed from the unit-type pages; the locator diagram on those pages
   is what fixes each unit number to its place on the plate.

   The brochure carries no prices and no stock list, so this module never
   states either — price stays behind the site's existing enquiry gate.
   ========================================================================== */

(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn, false); }

  /* ======================================================================
     DATA — transcribed from the brochure
     ====================================================================== */

  var TYPES = {
    'P1A': {
      name: '1 Bedroom Premium', variant: 'Type A', bed: 1, bath: 1,
      built: 62.14, balcony: 19.00, total: 81.14, qty: 16,
      rooms: [['Bedroom', '3.60 × 4.90 m'], ['Living / Dining', '3.70 × 6.70 m'],
              ['Kitchen', '1.80 × 4.90 m'], ['Toilet', '2.90 × 1.60 m']]
    },
    'P1B': {
      name: '1 Bedroom Premium', variant: 'Type B', bed: 1, bath: 1,
      built: 63.80, balcony: 19.00, total: 82.80, qty: 8,
      rooms: [['Bedroom', '3.50 × 4.89 m'], ['Living / Dining', '3.50 × 6.70 m'],
              ['Kitchen', '1.80 × 4.65 m'], ['Toilet', '3.60 × 1.60 m']]
    },
    'E1A': {
      name: '1 Bedroom Executive', variant: 'Type A', bed: 1, bath: 1,
      built: 39.40, balcony: 23.70, total: 63.10, qty: 8,
      rooms: [['Bedroom', '3.12 × 3.67 m'], ['Living / Kitchen', '3.30 × 3.70 m'],
              ['Toilet', '2.09 × 2.18 m']]
    },
    'E1B': {
      name: '1 Bedroom Executive', variant: 'Type B', bed: 1, bath: 1,
      built: 44.10, balcony: 23.10, total: 67.20, qty: 8,
      rooms: [['Bedroom', '3.70 × 4.45 m'], ['Living / Kitchen', '3.70 × 5.03 m'],
              ['Toilet', '1.69 × 3.69 m']]
    },
    'E1C': {
      name: '1 Bedroom Executive', variant: 'Type C', bed: 1, bath: 1,
      built: 42.60, balcony: 22.90, total: 65.50, qty: 8,
      rooms: [['Bedroom', '3.30 × 3.35 m'], ['Living / Kitchen', '4.54 × 3.20 m'],
              ['Toilet', '2.51 × 1.68 m'], ['Lobby', '1.60 × 1.80 m']]
    },
    'A2': {
      name: '2 Bedroom Apartment', variant: '', bed: 2, bath: 2,
      built: 90.80, balcony: 26.30, total: 117.10, qty: 32,
      rooms: [['Living / Dining', '3.70 × 7.30 m'], ['Bedroom 1', '3.65 × 5.40 m'],
              ['Bedroom 2', '3.48 × 3.70 m'], ['Kitchen', '1.80 × 4.95 m'],
              ['Toilet 1', '2.35 × 2.15 m'], ['Toilet 2', '1.80 × 1.85 m']]
    },
    'A3': {
      name: '3 Bedroom Apartment', variant: '', bed: 3, bath: 3,
      built: 117.00, balcony: 47.80, total: 164.80, qty: 8,
      rooms: [['Living / Dining', '3.70 × 6.70 m'], ['Bedroom 1', '5.05 × 2.80 m'],
              ['Bedroom 2', '4.23 × 3.70 m'], ['Bedroom 3', '3.38 × 4.90 m'],
              ['Kitchen', '1.80 × 4.90 m'], ['Toilet 1', '3.38 × 1.60 m'],
              ['Toilet 2', '1.50 × 2.60 m'], ['Toilet 3', '1.80 × 1.70 m']]
    }
  };

  /* The typical plate. x/w are laid out to match the brochure's locator
     diagram: 103 is the angled unit at the west end, 102 the deep 3-bed
     below it, 108/109 the curved units at the east end. */
  var PLATE = [
    // row 0 = north side
    { n: 1, row: 1, t: 'P1A', x: 296, w: 150 },
    { n: 2, row: 1, t: 'A3',  x: 60,  w: 230, cap: 'W' },
    { n: 3, row: 0, t: 'E1A', x: 60,  w: 118, skew: 1 },
    { n: 4, row: 0, t: 'A2',  x: 184, w: 168 },
    { n: 5, row: 0, t: 'A2',  x: 358, w: 168 },
    { n: 6, row: 0, t: 'A2',  x: 532, w: 168 },
    { n: 7, row: 0, t: 'A2',  x: 706, w: 168 },
    { n: 8, row: 0, t: 'E1B', x: 880, w: 150, cap: 'E' },
    { n: 9, row: 1, t: 'E1C', x: 880, w: 150, cap: 'E' },
    { n: 10, row: 1, t: 'P1A', x: 724, w: 150 },
    { n: 11, row: 1, t: 'P1B', x: 452, w: 266 }
  ];

  /* THERE ARE NO TOWERS. The brochure's "TYPICAL FLOOR PLAN (1ST TO 8TH
     FLOOR)" is one continuous plate — a single passage, two lifts and two
     stairs serving all eleven homes. Floor 9 is a separate penthouse plate
     of four homes. 88 + 4 = the published 92. Any A/B tower split would be
     invented, so the model has floor → unit and nothing between. */
  var PENT = [
    { n: 2, t: 'PH3B', x: 60,  w: 430, row: 0 },
    { n: 1, t: 'PH3A', x: 60,  w: 430, row: 1, cap: 'W' },
    { n: 4, t: 'PH1',  x: 512, w: 168, row: 1 },
    { n: 3, t: 'PH4',  x: 700, w: 330, row: 0, span: 1, cap: 'E' }
  ];

  TYPES.PH3A = { name: '3 Bedroom Penthouse', variant: 'Type A', bed: 3, bath: 3, qty: 1, rooms: [] };
  TYPES.PH3B = { name: '3 Bedroom Penthouse', variant: 'Type B', bed: 3, bath: 3, qty: 1, rooms: [] };
  TYPES.PH4  = { name: '4 Bedroom Penthouse', variant: '',       bed: 4, bath: 4, qty: 1, rooms: [] };
  TYPES.PH1  = { name: '1 Bedroom Penthouse', variant: '',       bed: 1, bath: 1, qty: 1, rooms: [] };

  var FLOORS = 9;          // 1–8 apartments, 9 penthouses
  var PENT_FLOOR = 9;

  function plateFor(f) { return f === PENT_FLOOR ? PENT : PLATE; }

  var state = { floor: 1, unit: null };

  /* ======================================================================
     BUILDING — isometric massing of the two curved wings
     ====================================================================== */

  /* True isometric, scaled so the whole L-shaped footprint plus eight
     floors of extrusion fits the 1040 × 560 viewBox without clipping. */
  var ISO = { ox: 470, oy: 528, s: 0.68 };
  function iso(x, y, z) {
    return [
      ISO.ox + (x - y) * 0.866 * ISO.s,
      ISO.oy - (x + y) * 0.5 * ISO.s - z * ISO.s
    ];
  }
  function facePath(pts) {
    return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + 'Z';
  }

  function renderBuilding() {
    var svg = $('#dipBuilding');
    if (!svg) return;

    var FH = 22;              // drawn height of one residential floor
    var POD = 30;             // ground + mezzanine commercial podium
    var s = '';

    // site plate
    var g = [iso(-60, -60, 0), iso(680, -60, 0), iso(680, 470, 0), iso(-60, 470, 0)];
    s += '<path class="dm-ground" d="' + facePath(g) + '"/>';

    // Podium — ground and mezzanine are commercial (retail, restaurants,
    // pharmacy), which is why the residential count starts at floor 1.
    s += wing(0, 0, 620, 150, 0, POD, 'dm-pod', null);
    s += wing(0, 150, 190, 280, 0, POD, 'dm-pod', null);

    // Wing A runs east–west; Wing B is the triangular-ended arm running
    // south. Drawn bottom-up so upper floors paint over lower ones.
    for (var f = 1; f <= PENT_FLOOR - 1; f++) {
      var z0 = POD + (f - 1) * FH;
      var cls = (f === state.floor) ? 'dm-slab is-on' : 'dm-slab';
      s += wing(0, 0, 620, 150, z0, FH - 3, cls, f);
      s += wing(0, 150, 190, 280, z0, FH - 3, cls, f);
    }

    // Floor 9 — the penthouse level, set back from the floors below.
    var zp = POD + (PENT_FLOOR - 1) * FH;
    var pc = (state.floor === PENT_FLOOR) ? 'dm-pent is-on' : 'dm-pent';
    s += wing(24, 16, 570, 118, zp, FH + 2, pc, PENT_FLOOR);
    s += wing(16, 150, 154, 246, zp, FH + 2, pc, PENT_FLOOR);

    svg.innerHTML = s;
  }

  // one extruded box in iso, returned as three faces
  function wing(x, y, w, d, z, h, cls, floor) {
    var a = iso(x, y, z + h),       b = iso(x + w, y, z + h);
    var c = iso(x + w, y + d, z + h), e = iso(x, y + d, z + h);
    var a0 = iso(x, y, z),          b0 = iso(x + w, y, z);
    var c0 = iso(x + w, y + d, z);
    var attr = floor ? ' data-floor="' + floor + '" tabindex="0" role="button" aria-label="Floor ' + floor + '"' : '';
    var g = '<g class="' + cls + '"' + attr + '>';
    g += '<path class="dm-top"  d="' + facePath([a, b, c, e]) + '"/>';
    g += '<path class="dm-left" d="' + facePath([a, a0, b0, b]) + '"/>';
    g += '<path class="dm-right" d="' + facePath([b, b0, c0, c]) + '"/>';
    g += '</g>';
    return g;
  }

  /* ======================================================================
     FLOOR PLATE — the real 11-unit typical plate
     ====================================================================== */

  function renderPlate() {
    var svg = $('#dipPlate');
    if (!svg) return;
    var s = '';
    var Y = [70, 250];      // north row, south row
    var H = 150;

    // plate outline
    s += '<path class="pl-shell" d="M96 56 H1006 a58 58 0 0 1 0 108 v232 a58 58 0 0 1 -58 58 H150 a58 58 0 0 1 -58 -58 V180Z" />';
    // corridor — label sits west of the core so the two never collide
    s += '<rect class="pl-corr" x="120" y="226" width="890" height="24" rx="12"/>';
    s += '<text class="pl-lbl" x="286" y="243">CORRIDOR</text>';
    // lift and stair core
    s += '<rect class="pl-core" x="470" y="196" width="86" height="84" rx="6"/>';
    s += '<text class="pl-lbl" x="513" y="243">CORE</text>';

    plateFor(state.floor).forEach(function (u) {
      var t = TYPES[u.t];
      var num = state.floor * 100 + u.n;
      var y = Y[u.row];
      var x = u.x, w = u.w;
      var H = u.span ? 330 : 150;      // penthouse 903 runs the full depth
      var d = '';
      if (u.skew) {
        // 103 sits on the angled west end
        d = 'M' + (x + 34) + ' ' + y + ' H' + (x + w) + ' V' + (y + H) + ' H' + x + ' Z';
      } else if (u.cap === 'W') {
        d = 'M' + (x + 40) + ' ' + y + ' H' + (x + w) + ' V' + (y + H) + ' H' + (x + 26) +
            ' a40 40 0 0 1 -40 -40 V' + (y + 40) + ' a40 40 0 0 1 40 -40 Z';
      } else if (u.cap === 'E') {
        d = 'M' + x + ' ' + y + ' H' + (x + w - 34) + ' a40 40 0 0 1 40 40 V' + (y + H - 40) +
            ' a40 40 0 0 1 -40 40 H' + x + ' Z';
      } else {
        d = 'M' + x + ' ' + y + ' H' + (x + w) + ' V' + (y + H) + ' H' + x + ' Z';
      }
      s += '<g class="pl-unit t-' + u.t + '" data-unit="' + u.n + '" tabindex="0" role="button" ' +
           'aria-label="Residence ' + num + ' — ' + t.name + (t.variant ? ' ' + t.variant : '') + ', ' + t.total + ' square metres">';
      s += '<path class="pl-fill" d="' + d + '"/>';
      // Penthouse areas are not published on the type pages, so the plate
      // names the home rather than quoting a figure we do not have.
      var sub = t.total ? (t.bed + ' BED · ' + t.total.toFixed(2) + ' m²')
                        : (t.bed + ' BED PENTHOUSE');
      s += '<text class="pl-no" x="' + (x + w / 2) + '" y="' + (y + H / 2 - 6) + '">' + num + '</text>';
      s += '<text class="pl-ty" x="' + (x + w / 2) + '" y="' + (y + H / 2 + 18) + '">' + sub + '</text>';
      s += '</g>';
    });

    svg.innerHTML = s;
    var t = $('#dipFloorTag');
    if (t) t.textContent = (state.floor === PENT_FLOOR ? 'Floor 9 · Penthouses' : 'Floor ' + state.floor);

    // The legend follows the plate — the penthouse level has its own mix.
    var key = $('#dipKey');
    if (key) {
      key.innerHTML = (state.floor === PENT_FLOOR)
        ? '<li><i class="k-ph3"></i>3 Bed Penthouse</li>' +
          '<li><i class="k-ph4"></i>4 Bed Penthouse</li>' +
          '<li><i class="k-ph1"></i>1 Bed Penthouse</li>'
        : '<li><i class="k-e"></i>1 Bed Executive</li>' +
          '<li><i class="k-p"></i>1 Bed Premium</li>' +
          '<li><i class="k-2"></i>2 Bedroom</li>' +
          '<li><i class="k-3"></i>3 Bedroom</li>';
    }
  }

  /* ======================================================================
     UNIT SHEET
     ====================================================================== */

  function openUnit(n) {
    var u = null;
    plateFor(state.floor).forEach(function (p) { if (p.n === n) u = p; });
    if (!u) return;
    var t = TYPES[u.t];
    var num = state.floor * 100 + u.n;
    state.unit = n;

    $('#dipUnitNo').textContent = num;
    $('#dipUnitType').textContent = t.name + (t.variant ? ' · ' + t.variant : '');

    var facts = '';
    if (t.total) {
      facts += row('Built-up area', t.built.toFixed(2) + ' m²');
      facts += row('Balcony area', t.balcony.toFixed(2) + ' m²');
      facts += row('Total area', '<b>' + t.total.toFixed(2) + ' m²</b>');
    } else {
      facts += row('Areas', 'Confirmed on enquiry');
    }
    facts += row('Bedrooms', t.bed);
    facts += row('Bathrooms', t.bath);
    facts += row('Floor', state.floor === PENT_FLOOR ? '9 · Penthouse level' : state.floor + ' of 8');
    facts += row('Homes of this type', t.qty + ' in the building');
    $('#dipUnitFacts').innerHTML = facts;

    $('#dipUnitRooms').innerHTML = t.rooms.length
      ? t.rooms.map(function (r) { return '<li><span>' + r[0] + '</span><b>' + r[1] + '</b></li>'; }).join('')
      : '<li><span>Room dimensions available from our sales team</span></li>';

    var sheet = $('#dipSheet');
    sheet.hidden = false;
    requestAnimationFrame(function () { sheet.classList.add('is-open'); });
    document.body.classList.add('is-locked');
    $('#dipSheetClose').focus({ preventScroll: true });
  }
  function row(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }

  function closeUnit() {
    var sheet = $('#dipSheet');
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(function () { sheet.hidden = true; }, 320);
  }

  /* ======================================================================
     BOOT
     ====================================================================== */

  function selectFloor(f) {
    state.floor = Math.min(FLOORS, Math.max(1, f));
    renderBuilding();
    renderPlate();
    $$('.dm-fbtn').forEach(function (b) {
      var on = +b.getAttribute('data-f') === state.floor;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function boot() {
    if (!$('#dipBuilding')) return;

    // floor buttons
    var rail = $('#dipFloors');
    if (rail) {
      var h = '';
      for (var f = FLOORS; f >= 1; f--) {
        var isP = (f === PENT_FLOOR);
        h += '<button class="dm-fbtn' + (isP ? ' is-pent' : '') + '" type="button" data-f="' + f + '" ' +
             'aria-pressed="false" title="' + (isP ? 'Penthouse level' : 'Floor ' + f) + '">' +
             (isP ? 'PH' : f) + '</button>';
      }
      rail.innerHTML = h;
    }

    selectFloor(1);

    on($('#dipBuilding'), 'click', function (e) {
      var g = e.target.closest('[data-floor]');
      if (g && g.getAttribute('data-floor') !== 'P') selectFloor(+g.getAttribute('data-floor'));
    });
    on($('#dipBuilding'), 'keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var g = e.target.closest('[data-floor]');
      if (g && g.getAttribute('data-floor') !== 'P') { e.preventDefault(); selectFloor(+g.getAttribute('data-floor')); }
    });
    on(rail, 'click', function (e) {
      var b = e.target.closest('.dm-fbtn');
      if (b) selectFloor(+b.getAttribute('data-f'));
    });
    on($('#dipPlate'), 'click', function (e) {
      var g = e.target.closest('[data-unit]');
      if (g) openUnit(+g.getAttribute('data-unit'));
    });
    on($('#dipPlate'), 'keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var g = e.target.closest('[data-unit]');
      if (g) { e.preventDefault(); openUnit(+g.getAttribute('data-unit')); }
    });

    on($('#dipSheetClose'), 'click', closeUnit);
    on($('#dipSheet'), 'click', function (e) { if (e.target === $('#dipSheet')) closeUnit(); });
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape') closeUnit();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
