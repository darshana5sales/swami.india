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

(function (w) {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn, false); }

  /* ======================================================================
     ►►► PRICE LIST — PLACEHOLDER FIGURES. REPLACE BEFORE LAUNCH. ◄◄◄

     The brochure publishes NO prices. These are derived from the only
     published figure — "The Diplomat from US$78,500" on the live site —
     spread across the brochure's areas at a flat US$1,250/m². They are
     therefore INDICATIVE ONLY and must be overwritten with the real
     price list before this page goes live.

     To use the real list: replace each value below. Nothing else changes;
     the figure flows straight into the unit popup once the visitor has
     filled in the enquiry form. Set a value to null and that home falls
     back to "our sales team will be in touch".
     ====================================================================== */
  var PRICES = {
    'E1A':  'US$78,500',    // 1 Bed Executive A   ·  63.10 m²
    'E1B':  'US$84,000',    // 1 Bed Executive B   ·  67.20 m²
    'E1C':  'US$81,900',    // 1 Bed Executive C   ·  65.50 m²
    'P1A':  'US$101,400',   // 1 Bed Premium A     ·  81.14 m²
    'P1B':  'US$103,500',   // 1 Bed Premium B     ·  82.80 m²
    'A2':   'US$146,400',   // 2 Bedroom           · 117.10 m²
    'A3':   'US$206,000',   // 3 Bedroom           · 164.80 m²
    'PH3A': 'US$232,900',   // 3 Bed Penthouse A   · 186.30 m²
    'PH3B': 'US$323,500',   // 3 Bed Penthouse B   · 258.80 m²
    'PH4':  'US$425,800',   // 4 Bed Penthouse     · 340.60 m²
    'PH1':  'US$78,100'     // 1 Bed Penthouse     ·  62.50 m²
  };

  /* ======================================================================
     DATA — transcribed from the brochure
     ====================================================================== */

  var TYPES = {
    'P1A': {
      name: '1 Bedroom Premium', variant: 'Type A', bed: 1, bath: 1,
      built: 62.14, balcony: 19.00, total: 81.14, qty: 16, img: 'prem-a',
      rooms: [['Bedroom', '3.60 × 4.90 m'], ['Living / Dining', '3.70 × 6.70 m'],
              ['Kitchen', '1.80 × 4.90 m'], ['Toilet', '2.90 × 1.60 m']]
    },
    'P1B': {
      name: '1 Bedroom Premium', variant: 'Type B', bed: 1, bath: 1,
      built: 63.80, balcony: 19.00, total: 82.80, qty: 8, img: 'prem-b',
      rooms: [['Bedroom', '3.50 × 4.89 m'], ['Living / Dining', '3.50 × 6.70 m'],
              ['Kitchen', '1.80 × 4.65 m'], ['Toilet', '3.60 × 1.60 m']]
    },
    'E1A': {
      name: '1 Bedroom Executive', variant: 'Type A', bed: 1, bath: 1,
      built: 39.40, balcony: 23.70, total: 63.10, qty: 8, img: 'exec-a',
      rooms: [['Bedroom', '3.12 × 3.67 m'], ['Living / Kitchen', '3.30 × 3.70 m'],
              ['Toilet', '2.09 × 2.18 m']]
    },
    'E1B': {
      name: '1 Bedroom Executive', variant: 'Type B', bed: 1, bath: 1,
      built: 44.10, balcony: 23.10, total: 67.20, qty: 8, img: 'exec-b',
      rooms: [['Bedroom', '3.70 × 4.45 m'], ['Living / Kitchen', '3.70 × 5.03 m'],
              ['Toilet', '1.69 × 3.69 m']]
    },
    'E1C': {
      name: '1 Bedroom Executive', variant: 'Type C', bed: 1, bath: 1,
      built: 42.60, balcony: 22.90, total: 65.50, qty: 8, img: 'exec-c',
      rooms: [['Bedroom', '3.30 × 3.35 m'], ['Living / Kitchen', '4.54 × 3.20 m'],
              ['Toilet', '2.51 × 1.68 m'], ['Lobby', '1.60 × 1.80 m']]
    },
    'A2': {
      name: '2 Bedroom Apartment', variant: '', bed: 2, bath: 2,
      built: 90.80, balcony: 26.30, total: 117.10, qty: 32, img: 'apt-2bed',
      rooms: [['Living / Dining', '3.70 × 7.30 m'], ['Bedroom 1', '3.65 × 5.40 m'],
              ['Bedroom 2', '3.48 × 3.70 m'], ['Kitchen', '1.80 × 4.95 m'],
              ['Toilet 1', '2.35 × 2.15 m'], ['Toilet 2', '1.80 × 1.85 m']]
    },
    'A3': {
      name: '3 Bedroom Apartment', variant: '', bed: 3, bath: 3,
      built: 117.00, balcony: 47.80, total: 164.80, qty: 8, img: 'apt-3bed',
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
  /* The key diagram on each penthouse plate fixes which is which: the
     186.30 m² plan highlights 902, the 258.80 m² plan highlights 901. */
  var PENT = [
    { n: 2, t: 'PH3A', x: 60,  w: 430, row: 0 },
    { n: 1, t: 'PH3B', x: 60,  w: 430, row: 1, cap: 'W' },
    { n: 4, t: 'PH1',  x: 512, w: 168, row: 1 },
    { n: 3, t: 'PH4',  x: 700, w: 330, row: 0, span: 1, cap: 'E' }
  ];

  TYPES.PH3A = { name: '3 Bedroom Penthouse', variant: 'Type A', bed: 3, bath: 3, qty: 1,
                 built: 113.90, balcony: 72.40, total: 186.30, img: 'ph-3bed-a', rooms: [] };
  TYPES.PH3B = { name: '3 Bedroom Penthouse', variant: 'Type B', bed: 3, bath: 4, qty: 1,
                 built: 132.30, balcony: 126.50, total: 258.80, img: 'ph-3bed-b', rooms: [] };
  TYPES.PH4  = { name: '4 Bedroom Penthouse', variant: '', bed: 4, bath: 5, qty: 1,
                 built: 179.40, balcony: 161.20, total: 340.60, img: 'ph-4bed', rooms: [] };
  TYPES.PH1  = { name: '1 Bedroom Penthouse', variant: '', bed: 1, bath: 1, qty: 1,
                 built: 43.30, balcony: 19.20, total: 62.50, img: 'ph-1bed', rooms: [] };

  var FLOORS = 9;          // 1–8 apartments, 9 penthouses
  var PENT_FLOOR = 9;

  function plateFor(f) { return f === PENT_FLOOR ? PENT : PLATE; }

  var state = { floor: 1, unit: null };

  /* ======================================================================
     BUILDING — isometric massing

     The brochure's aerial render shows two quite different masses, not the
     two matching arms this used to draw: a long slab with an eased east
     end, and a wedge-shaped wing to its west whose plan tapers to a point.
     They are joined at every level — the brochure's typical plate is one
     continuous floor with a single corridor serving all eleven homes — so
     both wings rise the same eight floors, with floor 9 set back on each.
     ====================================================================== */

  /* Footprints in plan. In this projection +x runs up-and-right on screen
     and +y up-and-left, so the corner nearest the viewer is (0, 0) and a
     wall is only in view when its edge runs with dx greater than dy. */
  var SLAB  = [[196, 0], [688, 0], [742, 48], [742, 110], [688, 158], [196, 158]];
  var LINK  = [[120, 20], [206, 20], [206, 120], [120, 120]];
  var WEDGE = [[157, 106], [123, 364], [103, 370], [-93, 140], [-84, 116], [134, 84]];

  /* The site: a wedge-shaped plot, with the pool court and the parking
     bay the render shows sitting in the crook between the two wings. */
  var SITE  = [[-130, -70], [800, -70], [800, 190], [250, 420], [-130, 300]];
  var COURT = [[-20, -56], [150, -56], [150, 30], [-20, 30]];
  var POOL  = [[440, -54], [640, -54], [640, -6], [440, -6]];
  var PARK  = [[664, -56], [782, -56], [782, 96], [664, 96]];

  /* True isometric, scaled so the plot, both wings and nine floors of
     extrusion fit the 1040 × 720 viewBox without clipping. */
  var ISO = { ox: 368, oy: 602, s: 0.80 };
  function iso(x, y, z) {
    return [
      ISO.ox + (x - y) * 0.866 * ISO.s,
      ISO.oy - (x + y) * 0.5 * ISO.s - z * ISO.s
    ];
  }
  function facePath(pts) {
    return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L') + 'Z';
  }

  /* Winding decides which walls face the viewer, so normalise it once
     rather than trusting whoever typed the footprint to go anticlockwise. */
  function ccw(poly) {
    var a = 0, i, q;
    for (i = 0; i < poly.length; i++) {
      q = poly[(i + 1) % poly.length];
      a += poly[i][0] * q[1] - q[0] * poly[i][1];
    }
    return a < 0 ? poly.slice().reverse() : poly;
  }

  /* Each vertex pulled toward the centroid — the penthouse level sits back
     from the floors below on both wings, whatever shape they are. */
  function inset(poly, k) {
    var cx = 0, cy = 0;
    poly.forEach(function (p) { cx += p[0]; cy += p[1]; });
    cx /= poly.length; cy /= poly.length;
    return poly.map(function (p) { return [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]; });
  }

  function ground(poly, cls) {
    return '<path class="' + cls + '" d="' +
           facePath(poly.map(function (p) { return iso(p[0], p[1], 0); })) + '"/>';
  }

  /* One extruded footprint of any shape. Walls are back-face culled, and
     take the lighter shade when they turn toward the right of the screen. */
  function prism(poly, z, h, cls, floor) {
    var p = ccw(poly), i, a, b, dx, dy, s = '';
    var attr = floor ? ' data-floor="' + floor + '" tabindex="0" role="button" aria-label="Floor ' + floor + '"' : '';
    for (i = 0; i < p.length; i++) {
      a = p[i]; b = p[(i + 1) % p.length];
      dx = b[0] - a[0]; dy = b[1] - a[1];
      if (dx - dy <= 0) continue;                 // wall turned away from us
      s += '<path class="' + (dx + dy > 0 ? 'dm-left' : 'dm-right') + '" d="' +
           facePath([iso(a[0], a[1], z + h), iso(b[0], b[1], z + h),
                     iso(b[0], b[1], z), iso(a[0], a[1], z)]) + '"/>';
    }
    s += '<path class="dm-top" d="' +
         facePath(p.map(function (q) { return iso(q[0], q[1], z + h); })) + '"/>';
    return '<g class="' + cls + '"' + attr + '>' + s + '</g>';
  }

  function renderBuilding() {
    var svg = $('#dipBuilding');
    if (!svg) return;

    var FH = 20;              // drawn height of one residential floor
    var POD = 28;             // ground + mezzanine commercial podium
    var s = '';

    // The plot, then what sits on it: the landscaped court between the
    // wings, the pool deck, and the parking bay along the east boundary.
    s += ground(SITE, 'dm-ground');
    s += ground(COURT, 'dm-court');
    s += ground(PARK, 'dm-park');
    s += ground(POOL, 'dm-pool');

    // Podium — ground and mezzanine are commercial (retail, restaurants,
    // pharmacy), which is why the residential count starts at floor 1.
    s += prism(SLAB, 0, POD, 'dm-pod', null);
    s += prism(LINK, 0, POD, 'dm-pod', null);
    s += prism(WEDGE, 0, POD, 'dm-pod', null);

    // Bottom-up, and slab before wedge, so nearer masses paint over farther.
    for (var f = 1; f <= PENT_FLOOR - 1; f++) {
      var z0 = POD + (f - 1) * FH;
      var cls = (f === state.floor) ? 'dm-slab is-on' : 'dm-slab';
      s += prism(SLAB, z0, FH - 3, cls, f);
      s += prism(LINK, z0, FH - 3, cls, f);
      s += prism(WEDGE, z0, FH - 3, cls, f);
    }

    // Floor 9 — the penthouse level, set back from the floors below.
    var zp = POD + (PENT_FLOOR - 1) * FH;
    var pc = (state.floor === PENT_FLOOR) ? 'dm-pent is-on' : 'dm-pent';
    s += prism(inset(SLAB, 0.9), zp, FH + 2, pc, PENT_FLOOR);
    s += prism(inset(WEDGE, 0.86), zp, FH + 2, pc, PENT_FLOOR);

    svg.innerHTML = s;
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

    /* The penthouse pages publish areas but not room-by-room sizes, so the
       whole block goes rather than leaving an empty heading behind. */
    var hasRooms = t.rooms.length > 0;
    $('#dipUnitRooms').innerHTML = hasRooms
      ? t.rooms.map(function (r) { return '<li><span>' + r[0] + '</span><b>' + r[1] + '</b></li>'; }).join('')
      : '';
    $('#dipUnitRooms').hidden = !hasRooms;
    var rt = $('#dipRoomsTitle');
    if (rt) rt.hidden = !hasRooms;

    /* Plan drawing + price gate — shared with The Horizon. */
    var label = 'Residence ' + num;
    if (w.SwamiSheet) {
      /* Prefer the brochure's own plate; fall back to the drawn schematic
         for any type that has no published plan. */
      $('#dipPlanBox').innerHTML = t.img
        ? w.SwamiSheet.plate('assets/img/diplomat/' + t.img + '.jpg',
                             t.name + (t.variant ? ' ' + t.variant : ''))
        : w.SwamiSheet.plan(t.rooms, label);
      var gate = $('#dipPrice');
      /* Locked on every opening — the visitor fills the form for each home
         they look at, and closing the popup resets it. */
      var unit = { label: label, price: PRICES[u.t] || null };
      var opened = false;
      var paint = function () {
        gate.innerHTML = w.SwamiSheet.priceBlock(unit, opened);
        if (!opened) w.SwamiSheet.bindGate(gate, unit, function () { opened = true; paint(); });
      };
      paint();
    }

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
})(window);
