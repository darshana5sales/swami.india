/* ==========================================================================
   THE HORIZON, BIJILO — TOWER & FLOOR-PLATE EXPLORER
   horizon.js — every figure transcribed from "THE HORIZON_BROCHURE.pdf".

   The brochure names homes by TYPOLOGY (1A/1B … 5A/5B), not by tower.
   There is one tower and one repeating plate; the key diagram printed on
   each typology page is what fixes where each home sits. B variants are
   the mirror of their A pair, which is why they share an area.

   No prices and no stock list are published in the brochure, so this
   module states neither.
   ========================================================================== */

(function (w) {
  'use strict';

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn, false); }

  /* ======================================================================
     ►►► PRICE LIST — PLACEHOLDER FIGURES. REPLACE BEFORE LAUNCH. ◄◄◄

     The brochure publishes NO prices. These are derived from the only
     published figure — "The Horizon from US$57,000" — spread across the
     brochure's areas at a flat US$1,230/m². INDICATIVE ONLY; overwrite
     with the real price list. Set a value to null and that home falls
     back to "our sales team will be in touch".
     ====================================================================== */
  var PRICES = {
    '1': 'US$132,200',   // 3 BHK            · 107.5 m²
    '2': 'US$98,600',    // 2 BHK            ·  80.2 m²
    '3': 'US$98,900',    // 2 BHK            ·  80.4 m²
    '4': 'US$67,900',    // 1 BHK Premium    ·  55.2 m²
    '5': 'US$57,000'     // 1 BHK Executive  ·  46.3 m²
  };

  /* ---- Typologies, from the brochure's plan pages --------------------- */
  var TYPES = {
    '1': { name: '3 Bedroom', bhk: 3, bath: 3, area: 107.5, grade: '', tint: 't-A3', img: 'typ-1a', iw: 899, ih: 1400,
           view: 'Sea view · Bijilo National Park',
           rooms: [['Living', '5.10 × 3.43 m'], ['Dining', '2.65 × 2.30 m'], ['Kitchen', '2.55 × 5.28 m'],
                   ['Master bedroom', '4.10 × 3.45 m'], ['Bedroom 1', '3.40 × 3.20 m'], ['Bedroom 2', '3.15 × 3.45 m'],
                   ['Deck', '1.80 × 3.38 m'], ['Juliet balcony', '0.60 × 3.55 m'], ['Laundry', '1.60 × 1.30 m']] },
    '2': { name: '2 Bedroom', bhk: 2, bath: 2, area: 80.2, grade: '', tint: 't-A2', img: 'typ-2a', iw: 938, ih: 1400,
           view: 'Bijilo National Park & Conference Centre',
           rooms: [['Living', '3.15 × 5.10 m'], ['Dining', '1.95 × 2.65 m'], ['Kitchen', '5.10 × 2.55 m'],
                   ['Master bedroom', '3.48 × 4.10 m'], ['Bedroom 1', '3.13 × 3.40 m'],
                   ['Deck', '3.10 × 1.80 m'], ['Laundry', '1.40 × 1.35 m']] },
    '3': { name: '2 Bedroom', bhk: 2, bath: 2, area: 80.4, grade: '', tint: 't-A2', img: 'typ-3a', iw: 938, ih: 1400,
           view: 'Pool deck · city · Bijilo National Park',
           rooms: [['Living', '3.20 × 6.75 m'], ['Kitchen', '2.55 × 4.30 m'],
                   ['Master bedroom', '3.45 × 4.20 m'], ['Bedroom 1', '3.45 × 3.20 m'],
                   ['Deck', '3.40 × 1.80 m'], ['Laundry', '1.55 × 1.35 m']] },
    '4': { name: '1 Bedroom', bhk: 1, bath: 1, area: 55.2, grade: 'Premium', tint: 't-P1A', img: 'typ-4a', iw: 938, ih: 1400,
           view: 'Bijilo National Park & Conference Centre',
           rooms: [['Living', '3.15 × 5.10 m'], ['Kitchen', '3.15 × 2.55 m'],
                   ['Master bedroom', '3.40 × 4.10 m'], ['Deck', '2.75 × 1.80 m'],
                   ['Laundry', '1.75 × 1.55 m'], ['Bathroom', '1.50 × 2.70 m']] },
    '5': { name: '1 Bedroom', bhk: 1, bath: 1, area: 46.3, grade: 'Executive', tint: 't-E1A', img: 'typ-5a', iw: 938, ih: 1400,
           view: 'Pool deck & city view',
           rooms: [['Living', '3.63 × 3.90 m'], ['Kitchen', '3.63 × 2.50 m'],
                   ['Bedroom', '3.15 × 3.45 m'], ['Deck', '1.93 × 1.80 m'],
                   ['Utility', '1.50 × 1.75 m'], ['Bathroom', '1.50 × 2.45 m']] }
  };

  /* THE TYPICAL PLATE — sixteen homes, transcribed unit by unit from the
     brochure's "TYPICAL FLOOR" drawing, reading left to right as it is
     printed. The plan is a C: homes wrap the north, west and east sides
     and the south side opens onto the void over the pool deck. */
  var PLATE = [
    { id: '1A', t: '1', x: 60,  y: 40,  w: 190, h: 130 },
    { id: '2A', t: '2', x: 258, y: 40,  w: 175, h: 130 },
    { id: '2B', t: '2', x: 441, y: 40,  w: 175, h: 130 },
    { id: '1B', t: '1', x: 624, y: 40,  w: 190, h: 130 },

    { id: '2B', t: '2', x: 60,  y: 178, w: 190, h: 118, k: 'l2' },
    { id: '2A', t: '2', x: 624, y: 178, w: 190, h: 118, k: 'r2' },

    { id: '2A', t: '2', x: 60,  y: 304, w: 190, h: 118, k: 'l3' },
    { id: '5B', t: '5', x: 262, y: 304, w: 86,  h: 118 },
    { id: '5A', t: '5', x: 352, y: 304, w: 86,  h: 118 },
    { id: '5B', t: '5', x: 442, y: 304, w: 86,  h: 118, k: 'c2' },
    { id: '5A', t: '5', x: 532, y: 304, w: 86,  h: 118, k: 'c3' },
    { id: '2B', t: '2', x: 624, y: 304, w: 190, h: 118, k: 'r3' },

    { id: '4B', t: '4', x: 60,  y: 430, w: 190, h: 118 },
    { id: '4A', t: '4', x: 624, y: 430, w: 190, h: 118 },

    { id: '3B', t: '3', x: 60,  y: 556, w: 190, h: 130 },
    { id: '3A', t: '3', x: 624, y: 556, w: 190, h: 130 }
  ];

  /* THE FIRST FLOOR IS NOT A TYPICAL FLOOR. Its own drawing carries just
     six homes along the north side and the two flanking the core — and its
     legend prints only Typology 1 and Typology 2, which is exactly what
     those six are. Everything south of the corridor is the amenity deck:
     pool, pool deck, gym, mini spa, indoor games, café and kids' play area.
     Six here plus sixteen on each of the eleven typical floors is the 182
     apartments the brochure advertises. */
  var FIRST = [
    { id: '1A', t: '1', x: 60,  y: 40,  w: 190, h: 130 },
    { id: '2A', t: '2', x: 258, y: 40,  w: 175, h: 130 },
    { id: '2B', t: '2', x: 441, y: 40,  w: 175, h: 130 },
    { id: '1B', t: '1', x: 624, y: 40,  w: 190, h: 130 },

    { id: '2B', t: '2', x: 60,  y: 178, w: 190, h: 118, k: 'l2' },
    { id: '2A', t: '2', x: 624, y: 178, w: 190, h: 118, k: 'r2' }
  ];

  /* The amenities that take the rest of the first floor, drawn where the
     brochure's numbered legend puts them. */
  var AMEN = [
    // west side
    { x: 60,  y: 304, w: 190, h: 130, n: 'GYM' },
    { x: 60,  y: 442, w: 190, h: 110, n: 'MINI SPA' },
    { x: 60,  y: 560, w: 190, h: 126, n: 'LADIES &amp; GENTS' },
    // centre — the deck, with the pool at its foot
    { x: 262, y: 304, w: 356, h: 196, n: 'POOL DECK' },
    { x: 262, y: 508, w: 356, h: 178, n: 'SWIMMING POOL', pool: 1 },
    // east side
    { x: 630, y: 304, w: 184, h: 92,  n: "KIDS' PLAY" },
    { x: 630, y: 404, w: 184, h: 84,  n: 'INDOOR GAMES' },
    { x: 630, y: 496, w: 184, h: 84,  n: 'KITCHEN' },
    { x: 630, y: 588, w: 184, h: 98,  n: 'CAFÉ' }
  ];

  /* Thirteen storeys: the ground floor is lobby, restaurant and parking,
     the first floor is the amenity level, and floors 2–12 repeat. */
  var FLOORS = 12;
  var FIRST_FLOOR = 1;
  function plateFor(f) { return f === FIRST_FLOOR ? FIRST : PLATE; }
  function floorLabel(f) { return f === FIRST_FLOOR ? 'First floor' : 'Floor ' + f; }

  var state = { floor: 1, unit: null };

  /* ---- Tower massing ---------------------------------------------------
     "13 Storeyed towers placed in C shape" — so the floors are drawn as a
     C, open on the south side over the pool deck, not as a solid block.
     ---------------------------------------------------------------------- */
  var ISO = { ox: 292, oy: 566, s: 1 };
  function iso(x, y, z) {
    return [ISO.ox + (x - y) * 0.866 * ISO.s, ISO.oy - (x + y) * 0.5 * ISO.s - z * ISO.s];
  }
  function facePath(p) { return 'M' + p.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + 'Z'; }

  /* The C, in plan. The notch is the void the homes look into. */
  var RING = [[0, 0], [64, 0], [64, 150], [180, 150], [180, 0], [244, 0], [244, 236], [0, 236]];
  var GROUND = [[-16, -16], [260, -16], [260, 252], [-16, 252]];

  function ccw(poly) {
    var a = 0, i, q;
    for (i = 0; i < poly.length; i++) { q = poly[(i + 1) % poly.length]; a += poly[i][0] * q[1] - q[0] * poly[i][1]; }
    return a < 0 ? poly.slice().reverse() : poly;
  }
  function inset(poly, k) {
    var cx = 0, cy = 0;
    poly.forEach(function (p) { cx += p[0]; cy += p[1]; });
    cx /= poly.length; cy /= poly.length;
    return poly.map(function (p) { return [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]; });
  }

  /* Extrudes any footprint. Walls facing away are dropped, and the rest are
     painted far to near so the arms of the C overlap in the right order. */
  function prism(poly, z, h, cls, floor) {
    var p = ccw(poly), i, a, b, dx, dy, faces = [];
    var at = floor ? ' data-floor="' + floor + '" tabindex="0" role="button" aria-label="Floor ' + floor + '"' : '';
    for (i = 0; i < p.length; i++) {
      a = p[i]; b = p[(i + 1) % p.length];
      dx = b[0] - a[0]; dy = b[1] - a[1];
      if (dx - dy <= 0) continue;
      faces.push({
        depth: a[0] + a[1] + b[0] + b[1],
        cls: (dx + dy > 0) ? 'dm-left' : 'dm-right',
        d: facePath([iso(a[0], a[1], z + h), iso(b[0], b[1], z + h),
                     iso(b[0], b[1], z), iso(a[0], a[1], z)])
      });
    }
    faces.sort(function (m, n) { return n.depth - m.depth; });
    var s = faces.map(function (f) { return '<path class="' + f.cls + '" d="' + f.d + '"/>'; }).join('');
    s += '<path class="dm-top" d="' + facePath(p.map(function (q) { return iso(q[0], q[1], z + h); })) + '"/>';
    return '<g class="' + cls + '"' + at + '>' + s + '</g>';
  }

  function renderTower() {
    var svg = $('#horTower');
    if (!svg) return;
    var FH = 26, POD = 40, s = '';
    s += '<path class="dm-ground" d="' +
         facePath([iso(-80, -80, 0), iso(324, -80, 0), iso(324, 320, 0), iso(-80, 320, 0)]) + '"/>';

    // Ground floor: lobby, restaurant, sales office and parking — no homes,
    // so it is drawn as the base and is not selectable.
    s += prism(GROUND, 0, POD, 'dm-pod', null);

    for (var f = 1; f <= FLOORS; f++) {
      var z0 = POD + (f - 1) * FH;
      var cls = (f === state.floor) ? 'dm-slab is-on' : 'dm-slab';
      // The first floor is the amenity level and carries only six homes,
      // so it reads as its own band rather than one of the repeats.
      // Eleven floors stand over the mouth of the C, so a deck drawn down
      // there is all but invisible from this angle — the band's own colour
      // is what says "amenity floor", and the plate shows what is on it.
      if (f === FIRST_FLOOR) cls += ' dm-amen';
      s += prism(RING, z0, FH - 4, cls, f);
    }

    // roof / sky deck
    s += prism(inset(RING, 0.9), POD + FLOORS * FH, 14, 'dm-pent', null);
    svg.innerHTML = s;
  }

  /* ---- Floor plate ----------------------------------------------------- */
  function renderPlate() {
    var svg = $('#horPlate');
    if (!svg) return;
    var first = state.floor === FIRST_FLOOR;
    var s = '';
    s += '<rect class="pl-shell" x="40" y="24" width="794" height="678" rx="26"/>';
    s += '<rect class="pl-corr" x="266" y="178" width="342" height="112" rx="10"/>';
    s += '<text class="pl-lbl" x="437" y="240">LIFT &amp; STAIR CORE</text>';

    if (first) {
      /* The amenity deck, which is what the first floor has instead of the
         5-series homes and the two lower rows of the typical plate. */
      AMEN.forEach(function (a) {
        s += '<rect class="pl-amen' + (a.pool ? ' pl-amen--pool' : '') + '" x="' + a.x + '" y="' + a.y +
             '" width="' + a.w + '" height="' + a.h + '" rx="8"/>';
        s += '<text class="pl-lbl" x="' + (a.x + a.w / 2) + '" y="' + (a.y + a.h / 2 + 4) + '">' + a.n + '</text>';
      });
    } else {
      /* On a typical floor the same ground is the void over the deck — the
         open side of the C. */
      s += '<rect class="pl-void" x="262" y="430" width="356" height="256" rx="10"/>';
      s += '<text class="pl-lbl" x="440" y="562">OPEN TO POOL DECK BELOW</text>';
    }

    plateFor(state.floor).forEach(function (u) {
      var t = TYPES[u.t];
      // The brochure names homes by typology, not by a floor-prefixed
      // number — "1" + "1B" would read as unit 11B, which is wrong.
      var num = String(u.id);
      s += '<g class="pl-unit ' + t.tint + '" data-id="' + u.id + '" data-t="' + u.t + '" tabindex="0" role="button" ' +
           'aria-label="Home ' + num + ' — typology ' + u.id + ', ' + t.name + ', ' + t.area + ' square metres">';
      s += '<rect class="pl-fill" x="' + u.x + '" y="' + u.y + '" width="' + u.w + '" height="' + u.h + '" rx="5"/>';
      s += '<text class="pl-no" x="' + (u.x + u.w / 2) + '" y="' + (u.y + u.h / 2 - 4) + '">' + num + '</text>';
      // The four 5-series cells are half the width of the rest, so they take
      // the area alone rather than spilling the configuration into next door.
      s += '<text class="pl-ty" x="' + (u.x + u.w / 2) + '" y="' + (u.y + u.h / 2 + 18) + '">' +
           (u.w < 110 ? '' : t.bhk + ' BHK · ') + t.area.toFixed(1) + ' m²</text>';
      s += '</g>';
    });
    svg.innerHTML = s;
    var tag = $('#horFloorTag');
    if (tag) tag.textContent = first ? 'First floor · 6 homes + amenities'
                                     : 'Floor ' + state.floor + ' · 16 homes';

    /* The first floor's legend prints only Typology 1 and 2, because those
       are the only two that appear on it. */
    var key = $('#horKey');
    if (key) {
      key.innerHTML = first
        ? '<li><i class="k-2"></i>2 BHK</li><li><i class="k-3"></i>3 BHK</li>' +
          '<li><i class="k-am"></i>Amenities</li>'
        : '<li><i class="k-e"></i>1 BHK Executive</li><li><i class="k-p"></i>1 BHK Premium</li>' +
          '<li><i class="k-2"></i>2 BHK</li><li><i class="k-3"></i>3 BHK</li>';
    }
  }

  /* ---- Home sheet ------------------------------------------------------ */
  function openUnit(id, key) {
    var t = TYPES[key];
    if (!t) return;
    $('#horUnitNo').textContent = id;
    $('#horUnitType').textContent = floorLabel(state.floor) + ' · ' + t.name + (t.grade ? ' ' + t.grade : '');
    $('#horUnitFacts').innerHTML =
      row('Carpet area', '<b>' + t.area.toFixed(1) + ' m²</b>') +
      row('Configuration', t.bhk + ' BHK') +
      row('Bathrooms', t.bath) +
      row('Outlook', t.view) +
      row('Floor', state.floor === FIRST_FLOOR
                     ? 'First floor · amenity level'
                     : state.floor + ' of ' + FLOORS);
    var hasRooms = t.rooms.length > 0;
    $('#horUnitRooms').innerHTML = hasRooms ? t.rooms.map(function (r) {
      return '<li><span>' + r[0] + '</span><b>' + r[1] + '</b></li>';
    }).join('') : '';
    $('#horUnitRooms').hidden = !hasRooms;
    var rt = $('#horRoomsTitle');
    if (rt) rt.hidden = !hasRooms;

    /* Drawn plan + price gate — shared with The Diplomat. */
    var label = 'Home ' + id + ', floor ' + state.floor;
    if (w.SwamiSheet) {
      /* The brochure's own plate when we have one, else the drawn schematic.
         Only the A variant is drawn in the brochure; B is its mirror, so we
         show the same plate and say so rather than pretend it is B's own. */
      var mirrored = /B$/.test(id);
      $('#horPlanBox').innerHTML = t.img
        ? w.SwamiSheet.plate('assets/img/horizon/' + t.img + '.jpg',
                             'Typology ' + id + (mirrored ? ' (mirror of ' + id.replace(/B$/, 'A') + ')' : ''),
                             t.iw, t.ih)
        : w.SwamiSheet.plan(t.rooms, label);
      var gate = $('#horPrice');
      /* Locked on every opening — see diplomat.js. */
      var unit = { label: label, price: PRICES[key] || null };
      var opened = false;
      var paint = function () {
        gate.innerHTML = w.SwamiSheet.priceBlock(unit, opened);
        if (!opened) w.SwamiSheet.bindGate(gate, unit, function () { opened = true; paint(); });
      };
      paint();
    }

    var sh = $('#horSheet');
    sh.hidden = false;
    requestAnimationFrame(function () { sh.classList.add('is-open'); });
    document.body.classList.add('is-locked');
    $('#horSheetClose').focus({ preventScroll: true });
  }
  function row(k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; }
  function closeUnit() {
    var sh = $('#horSheet');
    if (!sh || sh.hidden) return;
    sh.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(function () { sh.hidden = true; }, 320);
  }

  /* ---- Boot ------------------------------------------------------------ */
  function selectFloor(f) {
    state.floor = Math.min(FLOORS, Math.max(1, f));
    renderTower(); renderPlate();
    $$('.dm-fbtn').forEach(function (b) {
      var onb = +b.getAttribute('data-f') === state.floor;
      b.classList.toggle('is-on', onb);
      b.setAttribute('aria-pressed', onb ? 'true' : 'false');
    });
  }

  function boot() {
    if (!$('#horTower')) return;
    var rail = $('#horFloors');
    if (rail) {
      var h = '';
      for (var f = FLOORS; f >= 1; f--) h += '<button class="dm-fbtn" type="button" data-f="' + f + '" aria-pressed="false">' + f + '</button>';
      rail.innerHTML = h;
    }
    selectFloor(1);

    on($('#horTower'), 'click', function (e) {
      var g = e.target.closest('[data-floor]'); if (g) selectFloor(+g.getAttribute('data-floor'));
    });
    on(rail, 'click', function (e) {
      var b = e.target.closest('.dm-fbtn'); if (b) selectFloor(+b.getAttribute('data-f'));
    });
    on($('#horPlate'), 'click', function (e) {
      var g = e.target.closest('[data-id]'); if (g) openUnit(g.getAttribute('data-id'), g.getAttribute('data-t'));
    });
    on($('#horPlate'), 'keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var g = e.target.closest('[data-id]'); if (g) { e.preventDefault(); openUnit(g.getAttribute('data-id'), g.getAttribute('data-t')); }
    });
    on($('#horSheetClose'), 'click', closeUnit);
    on($('#horSheet'), 'click', function (e) { if (e.target === $('#horSheet')) closeUnit(); });
    on(document, 'keydown', function (e) { if (e.key === 'Escape') closeUnit(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
