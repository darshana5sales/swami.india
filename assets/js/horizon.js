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
    '1': { name: '3 Bedroom', bhk: 3, bath: 3, area: 107.5, grade: '', tint: 't-A3',
           view: 'Sea view · Bijilo National Park',
           rooms: [['Living', '5.10 × 3.43 m'], ['Dining', '2.65 × 2.30 m'], ['Kitchen', '2.55 × 5.28 m'],
                   ['Master bedroom', '4.10 × 3.45 m'], ['Bedroom 1', '3.40 × 3.20 m'], ['Bedroom 2', '3.15 × 3.45 m'],
                   ['Deck', '1.80 × 3.38 m'], ['Juliet balcony', '0.60 × 3.55 m'], ['Laundry', '1.60 × 1.30 m']] },
    '2': { name: '2 Bedroom', bhk: 2, bath: 2, area: 80.2, grade: '', tint: 't-A2',
           view: 'Bijilo National Park & Conference Centre',
           rooms: [['Living', '3.15 × 5.10 m'], ['Dining', '1.95 × 2.65 m'], ['Kitchen', '5.10 × 2.55 m'],
                   ['Master bedroom', '3.48 × 4.10 m'], ['Bedroom 1', '3.13 × 3.40 m'],
                   ['Deck', '3.10 × 1.80 m'], ['Laundry', '1.40 × 1.35 m']] },
    '3': { name: '2 Bedroom', bhk: 2, bath: 2, area: 80.4, grade: '', tint: 't-A2',
           view: 'Podium pool · city · Bijilo National Park',
           rooms: [['Living', '3.20 × 6.75 m'], ['Kitchen', '2.55 × 4.30 m'],
                   ['Master bedroom', '3.45 × 4.20 m'], ['Bedroom 1', '3.45 × 3.20 m'],
                   ['Deck', '3.40 × 1.80 m'], ['Laundry', '1.55 × 1.35 m']] },
    '4': { name: '1 Bedroom', bhk: 1, bath: 1, area: 55.2, grade: 'Premium', tint: 't-P1A',
           view: 'Bijilo National Park & Conference Centre',
           rooms: [['Living', '3.15 × 5.10 m'], ['Kitchen', '3.15 × 2.55 m'],
                   ['Master bedroom', '3.40 × 4.10 m'], ['Deck', '2.75 × 1.80 m'],
                   ['Laundry', '1.75 × 1.55 m'], ['Bathroom', '1.50 × 2.70 m']] },
    '5': { name: '1 Bedroom', bhk: 1, bath: 1, area: 46.3, grade: 'Executive', tint: 't-E1A',
           view: 'Podium-top pool & city view',
           rooms: [['Living', '3.63 × 3.90 m'], ['Kitchen', '3.63 × 2.50 m'],
                   ['Bedroom', '3.15 × 3.45 m'], ['Deck', '1.93 × 1.80 m'],
                   ['Utility', '1.50 × 1.75 m'], ['Bathroom', '1.50 × 2.45 m']] }
  };

  /* The plate, laid out as the brochure's key diagram draws it: a ring of
     homes around a central bank of the compact 5A/5B typologies. */
  var PLATE = [
    { id: '1B', t: '1', x: 60,  y: 40,  w: 190, h: 130 },
    { id: '2A', t: '2', x: 258, y: 40,  w: 175, h: 130 },
    { id: '2B', t: '2', x: 441, y: 40,  w: 175, h: 130 },
    { id: '1A', t: '1', x: 624, y: 40,  w: 190, h: 130 },

    { id: '2B', t: '2', x: 60,  y: 178, w: 190, h: 118, k: 'l2' },
    { id: '2A', t: '2', x: 624, y: 178, w: 190, h: 118, k: 'r2' },

    { id: '2A', t: '2', x: 60,  y: 304, w: 190, h: 118, k: 'l3' },
    { id: '5B', t: '5', x: 292, y: 304, w: 118, h: 118 },
    { id: '5A', t: '5', x: 418, y: 304, w: 118, h: 118 },
    { id: '5B', t: '5', x: 544, y: 304, w: 118, h: 118, k: 'c2' },
    { id: '2B', t: '2', x: 624, y: 304, w: 190, h: 118, k: 'r3' },

    { id: '4B', t: '4', x: 60,  y: 430, w: 190, h: 118 },
    { id: '4A', t: '4', x: 624, y: 430, w: 190, h: 118 },

    { id: '3B', t: '3', x: 60,  y: 556, w: 190, h: 130 },
    { id: '3A', t: '3', x: 624, y: 556, w: 190, h: 130 }
  ];

  var FLOORS = 14;                 // 14 floors above the podium
  var state = { floor: 1, unit: null };

  /* ---- Tower massing --------------------------------------------------- */
  var ISO = { ox: 300, oy: 560, s: 1 };
  function iso(x, y, z) {
    return [ISO.ox + (x - y) * 0.866 * ISO.s, ISO.oy - (x + y) * 0.5 * ISO.s - z * ISO.s];
  }
  function facePath(p) { return 'M' + p.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + 'Z'; }

  function box(x, y, w, d, z, h, cls, floor) {
    var a = iso(x, y, z + h), b = iso(x + w, y, z + h), c = iso(x + w, y + d, z + h), e = iso(x, y + d, z + h);
    var a0 = iso(x, y, z), b0 = iso(x + w, y, z), c0 = iso(x + w, y + d, z);
    var at = floor ? ' data-floor="' + floor + '" tabindex="0" role="button" aria-label="Floor ' + floor + '"' : '';
    return '<g class="' + cls + '"' + at + '>' +
      '<path class="dm-top" d="' + facePath([a, b, c, e]) + '"/>' +
      '<path class="dm-left" d="' + facePath([a, a0, b0, b]) + '"/>' +
      '<path class="dm-right" d="' + facePath([b, b0, c0, c]) + '"/></g>';
  }

  function renderTower() {
    var svg = $('#horTower');
    if (!svg) return;
    var FH = 21, POD = 46, s = '';
    s += '<path class="dm-ground" d="' + facePath([iso(-90, -90, 0), iso(330, -90, 0), iso(330, 330, 0), iso(-90, 330, 0)]) + '"/>';
    // podium: parking, amenities and the pool deck the 5-series looks onto
    s += box(0, 0, 260, 250, 0, POD, 'dm-pod', null);
    for (var f = 1; f <= FLOORS; f++) {
      s += box(28, 24, 200, 196, POD + (f - 1) * FH, FH - 3,
               (f === state.floor) ? 'dm-slab is-on' : 'dm-slab', f);
    }
    // roof / sky deck
    s += box(46, 42, 164, 160, POD + FLOORS * FH, 14, 'dm-pent', null);
    svg.innerHTML = s;
  }

  /* ---- Floor plate ----------------------------------------------------- */
  function renderPlate() {
    var svg = $('#horPlate');
    if (!svg) return;
    var s = '';
    s += '<rect class="pl-shell" x="40" y="24" width="794" height="678" rx="26"/>';
    s += '<rect class="pl-corr" x="266" y="178" width="342" height="244" rx="10"/>';
    s += '<text class="pl-lbl" x="437" y="214">LIFT &amp; STAIR CORE</text>';

    PLATE.forEach(function (u) {
      var t = TYPES[u.t];
      // The brochure names homes by typology, not by a floor-prefixed
      // number — "1" + "1B" would read as unit 11B, which is wrong.
      var num = String(u.id);
      s += '<g class="pl-unit ' + t.tint + '" data-id="' + u.id + '" data-t="' + u.t + '" tabindex="0" role="button" ' +
           'aria-label="Home ' + num + ' — typology ' + u.id + ', ' + t.name + ', ' + t.area + ' square metres">';
      s += '<rect class="pl-fill" x="' + u.x + '" y="' + u.y + '" width="' + u.w + '" height="' + u.h + '" rx="5"/>';
      s += '<text class="pl-no" x="' + (u.x + u.w / 2) + '" y="' + (u.y + u.h / 2 - 4) + '">' + num + '</text>';
      s += '<text class="pl-ty" x="' + (u.x + u.w / 2) + '" y="' + (u.y + u.h / 2 + 18) + '">' +
           t.bhk + ' BHK · ' + t.area.toFixed(1) + ' m²</text>';
      s += '</g>';
    });
    svg.innerHTML = s;
    var tag = $('#horFloorTag');
    if (tag) tag.textContent = 'Floor ' + state.floor;
  }

  /* ---- Home sheet ------------------------------------------------------ */
  function openUnit(id, key) {
    var t = TYPES[key];
    if (!t) return;
    $('#horUnitNo').textContent = id;
    $('#horUnitType').textContent = 'Floor ' + state.floor + ' · ' + t.name + (t.grade ? ' ' + t.grade : '');
    $('#horUnitFacts').innerHTML =
      row('Carpet area', '<b>' + t.area.toFixed(1) + ' m²</b>') +
      row('Configuration', t.bhk + ' BHK') +
      row('Bathrooms', t.bath) +
      row('Outlook', t.view) +
      row('Floor', state.floor + ' of ' + FLOORS);
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
      $('#horPlanBox').innerHTML = w.SwamiSheet.plan(t.rooms, label);
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
