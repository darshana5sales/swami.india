/* ==========================================================================
   SWAMI — AVAILABILITY EXPLORER
   explorer.js — unit data, masterplan/elevation/villa rendering, hover
   tooltip, residence sheet, and the price gate. No dependencies.

   PRICE GATE
   Prices are never printed until the visitor submits the enquiry form once.
   After one submission the whole session unlocks (the lead is already
   captured — re-asking on every unit would only cause drop-off).

   WORDPRESS
   The demo stores the lead in sessionStorage. In production, POST it from
   submitLead() to admin-ajax.php / a CF7 endpoint, and return the price
   from the server so it never ships in page source. Everything else works
   unchanged.
   ========================================================================== */

(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var UNLOCK_KEY = 'swamiPriceUnlocked';

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function on(el, ev, fn, o) { if (el) el.addEventListener(ev, fn, o || false); }
  function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* ======================================================================
     DATA — unit types from the published price lists
     ====================================================================== */

  /* Types and sizes from the published Diplomat price list. */
  var TTYPES = {
    '1E': { code: '1E', name: 'One-Bedroom Executive', bed: 1, bath: 1, area: 65, out: 8, base: 78500 },
    '1P': { code: '1P', name: 'One-Bedroom Premium', bed: 1, bath: 1, area: 81, out: 10, base: 98700 },
    '2B': { code: '2B', name: 'Two-Bedroom Residence', bed: 2, bath: 2, area: 117, out: 12, base: 140500 },
    '3B': { code: '3B', name: 'Three-Bedroom Residence', bed: 3, bath: 3, area: 164, out: 16, base: 214500 },
    'PA': { code: 'PH·A', name: 'Penthouse Type A', bed: 3, bath: 4, area: 186, out: 34, base: null },
    'PB': { code: 'PH·B', name: 'Penthouse Type B', bed: 3, bath: 4, area: 258, out: 46, base: null },
    'P4': { code: 'PH·4', name: 'Four-Bedroom Penthouse', bed: 4, bath: 5, area: 264, out: 52, base: null }
  };
  var FLOOR_PREMIUM = 1200;   // per residential floor above the first

  /* The real configuration: 7 + 10 floors, ground levels commercial
     ("Live. Work. Relax"), and exactly 92 residential apartments:
     Tower A — 5 floors × 6 + 2 penthouses = 32
     Tower B — 8 floors × 7 + 4 penthouses = 60           32 + 60 = 92 ✓ */
  var TOWERS = {
    A: {
      key: 'A', label: 'Tower A', floors: 7, resStart: 2,
      cols: ['2B', '1E', '1P', '1P', '1E', '2B'],
      pents: ['PA', 'PA']
    },
    B: {
      key: 'B', label: 'Tower B', floors: 10, resStart: 2,
      cols: ['3B', '2B', '1E', '1P', '1E', '2B', '3B'],
      pents: ['PB', 'P4', 'P4', 'PB']
    }
  };

  var VTYPES = {
    KAB: { code: 'KAB', name: 'Kaba Duplex', bed: 2, bath: 2, area: 129, out: 14, base: 79500 },
    ASK: { code: 'ASK', name: 'Asky Duplex', bed: 3, bath: 3, area: 126, out: 15, base: 87450 },
    DEL: { code: 'DEL', name: 'Delta Villa', bed: 3, bath: 3, area: 164, out: 18, base: 111825 },
    BRU: { code: 'BRU', name: 'Brussels Villa', bed: 3, bath: 3, area: 178, out: 20, base: 114500 },
    DPR: { code: 'DPR', name: 'Delta Premium Villa', bed: 4, bath: 4, area: 184, out: 22, base: 132825 },
    EMI: { code: 'EMI', name: 'Emirates Villa', bed: 4, bath: 4, area: 237, out: 28, base: 166425 }
  };
  /* Cheaper homes near the gate, premium rows deep in the community. */
  var VROW_TYPES = [['DPR', 'EMI'], ['DEL', 'BRU'], ['BRU', 'DEL'], ['KAB', 'ASK']];

  /* Deterministic status so the plan is stable between visits.
     Knuth multiplicative hash → ~55% available, ~22% reserved, ~23% sold. */
  function statusOf(seed) {
    var h = (seed * 2654435761 >>> 0) % 100;
    return h < 55 ? 'av' : h < 77 ? 'rs' : 'sd';
  }
  var STATUS_NAME = { av: 'Available', rs: 'Reserved', sd: 'Sold' };

  /* ---- build the unit index ------------------------------------------ */
  var UNITS = {};

  Object.keys(TOWERS).forEach(function (k) {
    var t = TOWERS[k];
    for (var f = t.resStart; f <= t.floors; f++) {
      var pent = f === t.floors;
      var n = pent ? t.pents.length : t.cols.length;
      for (var c = 0; c < n; c++) {
        var type = pent ? TTYPES[t.pents[c]] : TTYPES[t.cols[c]];
        var st = statusOf(f * 31 + c * 7 + k.charCodeAt(0) * 3);
        if (pent && st === 'sd') st = 'rs';   // penthouses read reserved, not sold
        var id = k + '-' + (f * 100 + c + 1);
        UNITS[id] = {
          id: id, tower: k, floor: f, col: c, type: type, status: st,
          pent: pent,
          proj: 'The Diplomat · Fajara',
          where: t.label + ' · Level ' + f,
          outLabel: pent ? 'Terrace' : 'Balcony',
          price: type.base === null ? null : type.base + (f - t.resStart) * FLOOR_PREMIUM
        };
      }
    }
  });

  /* All 82 Phase 1 villas, laid out on the illustrated society plan
     (viewBox 1480×900). Rows are listed bottom-up so numbering starts at
     the main gate, exactly like the reference site: V1 is the first plot
     a visitor reaches. The bottom row leaves two slots for the gate drive.
     Cheaper duplexes sit near the gate; premium villas face the gardens. */
  var VILLA_ROWS = [
    { y: 774, n: 12, gapAt: 6, types: ['KAB', 'ASK'] },
    { y: 652, n: 14, types: ['KAB', 'ASK'] },
    { y: 530, n: 14, types: ['DEL', 'BRU'] },
    { y: 308, n: 14, types: ['BRU', 'DEL'] },
    { y: 186, n: 14, types: ['DPR', 'EMI'] },
    { y: 64, n: 14, types: ['EMI', 'DPR'] }
  ];
  var VSLOT = { x0: 76, w: 64, h: 66, step: 97 };

  (function () {
    var num = 0;
    VILLA_ROWS.forEach(function (row, r) {
      var placed = 0, slot = 0;
      row.slots = [];
      while (placed < row.n) {
        if (row.gapAt !== undefined && (slot === row.gapAt || slot === row.gapAt + 1)) { slot++; continue; }
        num++;
        placed++;
        row.slots.push({ num: num, slot: slot });
        var type = VTYPES[row.types[placed % 2]];
        UNITS['V' + num] = {
          id: 'V' + num, row: r, type: type,
          status: statusOf(num * 13 + r * 5),
          proj: 'Airport Residency · Old Yundum',
          where: 'Plot ' + num + ' · Phase 1',
          outLabel: 'Terrace',
          villa: true,
          price: type.base
        };
        slot++;
      }
    });
  })();

  function countAvail(pred) {
    return Object.keys(UNITS).reduce(function (n, id) {
      var u = UNITS[id];
      return n + (pred(u) && u.status === 'av' ? 1 : 0);
    }, 0);
  }
  function countAll(pred) {
    return Object.keys(UNITS).filter(function (id) { return pred(UNITS[id]); }).length;
  }

  var fmt = function (n) { return 'US$' + n.toLocaleString('en-US'); };

  /* ======================================================================
     FLOOR PLAN DRAWINGS — blueprint-style placeholders, one per size
     ====================================================================== */

  function fpDefs() {
    return '<defs><pattern id="fpHatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<line x1="0" y1="0" x2="0" y2="8" stroke="#B09020" stroke-opacity=".3" stroke-width="1.4"/></pattern></defs>';
  }
  function room(x, y, w, h, label, cls) {
    var lines = label.split('\n');
    var ty = y + h / 2 + 3 - (lines.length - 1) * 6;
    var text = lines.map(function (l, i) {
      return '<text class="fp-label" x="' + (x + w / 2) + '" y="' + (ty + i * 12) + '">' + l + '</text>';
    }).join('');
    return '<rect class="' + (cls || 'fp-part') + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>' + text;
  }

  function plan1(outdoor) {
    return '<svg viewBox="0 0 420 300" role="img" aria-label="Representative one-bedroom floor plan">' + fpDefs() +
      room(300, 22, 94, 98, outdoor.toUpperCase(), 'fp-out') +
      room(26, 22, 104, 70, 'ENTRY') +
      room(26, 92, 104, 90, 'KITCHEN') +
      room(130, 22, 170, 160, 'LIVING · DINING') +
      room(300, 120, 94, 62, 'UTILITY') +
      room(26, 182, 76, 96, 'BATH') +
      room(102, 182, 190, 96, 'BEDROOM') +
      room(292, 182, 102, 96, 'WARDROBE') +
      '<rect class="fp-wall" x="26" y="22" width="368" height="256"/>' +
      '<path class="fp-door" d="M64 22a22 22 0 0 1 22 22"/></svg>';
  }
  function plan2(outdoor) {
    return '<svg viewBox="0 0 460 300" role="img" aria-label="Representative two-bedroom floor plan">' + fpDefs() +
      room(26, 22, 90, 256, outdoor.toUpperCase(), 'fp-out') +
      room(116, 22, 182, 150, 'LIVING · DINING') +
      room(116, 172, 92, 106, 'KITCHEN') +
      room(208, 172, 90, 52, 'LAUNDRY') +
      room(208, 224, 90, 54, 'BATH') +
      room(298, 22, 136, 128, 'MASTER\nBEDROOM') +
      room(298, 150, 136, 76, 'BEDROOM 2') +
      room(298, 226, 66, 52, 'EN-SUITE') +
      room(364, 226, 70, 52, 'WARDROBE') +
      '<rect class="fp-wall" x="26" y="22" width="408" height="256"/>' +
      '<path class="fp-door" d="M150 172a22 22 0 0 1 22 22"/></svg>';
  }
  function plan3(outdoor, title) {
    return '<svg viewBox="0 0 460 320" role="img" aria-label="Representative ' + title + ' floor plan">' + fpDefs() +
      room(26, 22, 100, 276, outdoor.toUpperCase(), 'fp-out') +
      room(126, 22, 180, 140, 'LIVING') +
      room(126, 162, 90, 80, 'DINING') +
      room(216, 162, 90, 80, 'KITCHEN') +
      room(126, 242, 90, 56, 'STORE') +
      room(216, 242, 90, 56, 'BATH') +
      room(306, 22, 128, 110, 'MASTER\nBEDROOM') +
      room(306, 132, 60, 54, 'EN-SUITE') +
      room(366, 132, 68, 54, 'WARDROBE') +
      room(306, 186, 128, 60, 'BEDROOM 2') +
      room(306, 246, 128, 52, 'BEDROOM 3') +
      '<rect class="fp-wall" x="26" y="22" width="408" height="276"/>' +
      '<path class="fp-door" d="M160 162a20 20 0 0 1 20 20"/></svg>';
  }
  function planFor(u) {
    var out = u.outLabel;
    if (u.type.bed === 1) return plan1(out);
    if (u.type.bed === 2) return plan2(out);
    return plan3(out, u.type.name.toLowerCase());
  }

  /* ======================================================================
     MASTERPLAN + CHIPS
     ====================================================================== */

  function towerStats(k) {
    var total = countAll(function (u) { return u.tower === k; });
    var av = countAvail(function (u) { return u.tower === k; });
    return { total: total, av: av };
  }

  /* Evenly spaced floor bands across a building face — the "how many
     floors" read at a glance. */
  function floorLines(x1, x2, yTop, h, n) {
    var s = '', step = h / n;
    for (var i = 1; i < n; i++) {
      var y = (yTop + i * step).toFixed(1);
      s += '<line class="mk-floorline" x1="' + (x1 + 8) + '" y1="' + y + '" x2="' + (x2 - 8) + '" y2="' + y + '"/>';
    }
    return s;
  }

  function renderMasterplan() {
    var svg = $('#mpStage svg');
    if (!svg) return;
    var a = towerStats('A'), b = towerStats('B');

    var s = '<defs><filter id="mkSh" x="-30%" y="-30%" width="160%" height="160%">' +
      '<feDropShadow dx="0" dy="7" stdDeviation="9" flood-color="#000000" flood-opacity="0.38"/></filter></defs>';

    /* site plot */
    s += '<rect class="mk-site mk-item" style="--md:0ms" x="24" y="24" width="1232" height="546" rx="26"/>';

    /* avenue */
    s += '<g class="mk-item" style="--md:90ms">' +
      '<rect class="mk-road" x="24" y="584" width="1232" height="42" rx="10"/>' +
      '<line class="mk-dash" x1="48" y1="605" x2="880" y2="605"/>' +
      '<text class="mk-s" x="908" y="609">KANIFING INSTITUTIONAL AREA · FAJARA</text></g>';

    /* internal drive + entrance */
    s += '<g class="mk-item" style="--md:180ms">' +
      '<path class="mk-drive" d="M640 584 L640 470 M240 470 L1120 470"/>' +
      '<path class="mk-drivedash" d="M640 574 L640 480 M262 470 L1098 470"/>' +
      '<rect class="mk-gate" x="606" y="566" width="68" height="20" rx="6"/>' +
      '<text class="mk-s mk-c" x="640" y="650">MAIN ENTRANCE</text></g>';

    /* TOWER A — small isometric block: roof plane, side, glass face with
       7 floor bands, big letter like the reference blocks */
    s += '<g class="blk mk-item" data-tower="A" style="--md:300ms" tabindex="0" role="button" ' +
      'aria-label="Tower A — 7 floors, 32 residences. View floor plate.">' +
      '<polygon class="mk-bld" filter="url(#mkSh)" points="150,200 430,200 452,180 172,180"/>' +
      '<polygon class="mk-sidef" points="430,200 452,180 452,320 430,340"/>' +
      '<rect class="mk-face" x="150" y="200" width="280" height="140" rx="10"/>' +
      floorLines(150, 430, 200, 140, 7) +
      '<rect class="mk-plinth" x="140" y="340" width="312" height="22" rx="6"/>' +
      '<text class="mk-letter" x="290" y="298">A</text>' +
      '<text class="mk-t" x="150" y="404">TOWER A</text>' +
      '<text class="mk-s" x="150" y="426">7 FLOORS · 32 RESIDENCES</text>' +
      '<text class="mk-a" x="150" y="447">' + a.av + ' AVAILABLE NOW</text></g>';

    /* TOWER B — long ten-floor slab over the retail podium */
    s += '<g class="blk mk-item" data-tower="B" style="--md:410ms" tabindex="0" role="button" ' +
      'aria-label="Tower B — 10 floors, 60 residences. View floor plate.">' +
      '<polygon class="mk-bld" filter="url(#mkSh)" points="620,140 1090,140 1114,118 644,118"/>' +
      '<polygon class="mk-sidef" points="1090,140 1114,118 1114,278 1090,300"/>' +
      '<rect class="mk-face" x="620" y="140" width="470" height="160" rx="12"/>' +
      floorLines(620, 1090, 140, 160, 10) +
      '<rect class="mk-plinth" x="600" y="300" width="514" height="44" rx="8"/>' +
      '<text class="mk-s mk-c" x="857" y="327">RETAIL · RESTAURANTS · PHARMACY</text>' +
      '<text class="mk-letter" x="855" y="248">B</text>' +
      '<text class="mk-t" x="620" y="392">TOWER B</text>' +
      '<text class="mk-s" x="620" y="414">10 FLOORS · 60 RESIDENCES</text>' +
      '<text class="mk-a" x="620" y="435">' + b.av + ' AVAILABLE NOW</text></g>';

    /* amenities */
    s += '<g class="mk-item" style="--md:520ms">' +
      '<rect class="mk-am" x="180" y="490" width="130" height="64" rx="12"/>' +
      '<text class="mk-s mk-c" x="245" y="527">LOBBY</text>' +
      '<rect class="mk-am" x="330" y="490" width="130" height="64" rx="12"/>' +
      '<text class="mk-s mk-c" x="395" y="527">GYMNASIUM</text>' +
      '<rect class="mk-pool" x="490" y="486" width="170" height="72" rx="36"><title>Swimming pool</title></rect>' +
      '<path class="mk-wave" d="M515 514 q12 -8 24 0 t24 0 t24 0 t24 0"/>' +
      '<path class="mk-wave" d="M515 532 q12 -8 24 0 t24 0 t24 0 t24 0"/>' +
      '<rect class="mk-am" x="690" y="490" width="190" height="64" rx="12"/>' +
      '<text class="mk-s mk-c" x="785" y="527">KIDS PLAY AREA</text>' +
      '<g class="mk-park">' +
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) {
        return '<rect x="' + (940 + i * 28) + '" y="496" width="20" height="36" rx="3"/>';
      }).join('') +
      '</g>' +
      '<text class="mk-s" x="940" y="550">UNDERGROUND + SURFACE PARKING</text></g>';

    /* greenery */
    s += '<g class="mk-trees mk-item" style="--md:620ms">' +
      '<circle cx="480" cy="90" r="14"/><circle cx="510" cy="72" r="10"/><circle cx="502" cy="108" r="8"/>' +
      '<circle cx="1160" cy="100" r="13"/><circle cx="1188" cy="126" r="9"/>' +
      '<circle cx="80" cy="470" r="12"/><circle cx="104" cy="446" r="8"/>' +
      '<circle cx="1200" cy="380" r="11"/><circle cx="1222" cy="410" r="8"/>' +
      '<circle cx="90" cy="90" r="11"/><circle cx="118" cy="72" r="8"/></g>';

    s += '<text class="mk-s" x="1176" y="62">N ↑</text>';

    svg.innerHTML = s;
  }

  function renderChips() {
    var box = $('#mpChips');
    if (!box) return;
    box.innerHTML = Object.keys(TOWERS).map(function (k) {
      var t = TOWERS[k], s = towerStats(k);
      return '<button class="chip-t" type="button" data-tower="' + k + '">' +
        '<span><span class="chip-t__name">' + t.label + '</span>' +
        '<span class="chip-t__meta">' + t.floors + ' floors · ' + s.total + ' residences</span></span>' +
        '<span class="chip-t__av">' + s.av + ' available</span></button>';
    }).join('');
  }

  /* ======================================================================
     ELEVATION — straight-on schematic, gemwaterfront's Block-A pattern

     A drawn front view of the tower in the Diplomat's own architectural
     language (ivory ribbon slabs, glass between). Every residence is one
     box that snaps to its floor exactly, so the drawing always agrees
     with the data: floor chips left, commercial podium below, penthouse
     row and roof cap on top. Floors build bottom-up on render.
     ====================================================================== */

  var currentTower = 'A';

  var SK = {
    W: 980, PADL: 96, PADR: 104, TOP: 26,
    ROOF: 26, PENT: 84, ROW: 68, POD: 92, GROUND: 30, GAP: 10
  };

  /* A drawn palm — trunk curve + five fronds, anchored at ground level. */
  function palm(x, gy, sc) {
    var t = gy - 92 * sc;
    var tip = function (dx1, dy1, dx2, dy2) {
      return '<path class="sk-leaf" d="M' + (x + 2 * sc) + ' ' + t + ' q ' +
        (dx1 * sc) + ' ' + (dy1 * sc) + ' ' + (dx2 * sc) + ' ' + (dy2 * sc) + '"/>';
    };
    return '<path class="sk-palmT" d="M' + x + ' ' + gy + ' C ' + (x - 4 * sc) + ' ' + (gy - 30 * sc) +
      ' ' + (x + 6 * sc) + ' ' + (gy - 60 * sc) + ' ' + (x + 2 * sc) + ' ' + t + '"/>' +
      tip(-30, -4, -54, 12) + tip(-24, -18, -44, -12) +
      tip(22, -16, 46, -6) + tip(26, -2, 50, 14) + tip(-4, -24, -8, -42);
  }

  function hedgeRow(x1, x2, cy) {
    var s = '';
    for (var x = x1; x <= x2; x += 30) {
      s += '<circle class="sk-hedge" cx="' + x + '" cy="' + cy + '" r="7"/>';
    }
    return s;
  }

  function renderTower(k) {
    var t = TOWERS[k];
    var svg = $('#elevSvg');
    if (!t || !svg) return;
    currentTower = k;

    var s = towerStats(k);
    var title = $('#elevTitle'), meta = $('#elevMeta');
    if (title) title.textContent = t.label + ' — floor by floor';
    if (meta) meta.innerHTML = s.total + ' residences · <b>' + s.av + ' available now</b> · hover a home, click for price &amp; floor plan';

    var res = t.floors - t.resStart;                 // regular residential floors
    var H = SK.TOP + SK.ROOF + SK.PENT + res * SK.ROW + SK.POD + SK.GROUND;
    var bodyX = SK.PADL, bodyW = SK.W - SK.PADL - SK.PADR;
    var out = '';

    function slab(y) {
      return '<rect class="sk-slab" x="' + (bodyX - 16) + '" y="' + y + '" width="' + (bodyW + 32) + '" height="13" rx="6.5"/>';
    }
    function chip(cy, label) {
      return '<rect class="sk-chip" x="8" y="' + (cy - 13) + '" width="72" height="26" rx="13"/>' +
        '<text class="sk-chipt" x="44" y="' + (cy + 4) + '">' + label + '</text>';
    }
    function cells(k, f, types, y, h, x0, w) {
      var n = types.length;
      var cw = (w - (n - 1) * SK.GAP) / n;
      var row = '';
      for (var c = 0; c < n; c++) {
        var id = k + '-' + (f * 100 + c + 1);
        var u = UNITS[id];
        var x = x0 + c * (cw + SK.GAP);
        row += '<g>' + '<rect class="q q-' + u.status + '" data-uid="' + id + '" x="' + x + '" y="' + y +
          '" width="' + cw + '" height="' + h + '" rx="7"' +
          ' aria-label="' + esc(u.id + ' — ' + u.type.name + ', ' + STATUS_NAME[u.status]) + '"/>' +
          /* window mullions + balcony rail — the "glass" read */
          '<line class="sk-mull" x1="' + (x + cw * 0.25) + '" y1="' + (y + 6) + '" x2="' + (x + cw * 0.25) + '" y2="' + (y + h - 6) + '"/>' +
          '<line class="sk-mull" x1="' + (x + cw * 0.75) + '" y1="' + (y + 6) + '" x2="' + (x + cw * 0.75) + '" y2="' + (y + h - 6) + '"/>' +
          '<line class="sk-rail" x1="' + (x + 7) + '" y1="' + (y + h - 10) + '" x2="' + (x + cw - 7) + '" y2="' + (y + h - 10) + '"/>' +
          '<text class="sk-num" x="' + (x + cw / 2) + '" y="' + (y + h / 2 - 1) + '">' + (f * 100 + c + 1) + '</text>' +
          '<text class="sk-code" x="' + (x + cw / 2) + '" y="' + (y + h / 2 + 14) + '">' + u.type.code + '</text>' +
          '</g>';
      }
      return row;
    }

    /* soft sky behind the building */
    out += '<defs><linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="rgba(140,170,200,0.08)"/>' +
      '<stop offset="1" stop-color="rgba(140,170,200,0)"/></linearGradient></defs>' +
      '<rect x="' + (bodyX - 40) + '" y="' + (SK.TOP - 8) + '" width="' + (SK.W - bodyX + 20) +
      '" height="' + (H - SK.TOP - SK.GROUND) + '" rx="16" fill="url(#skyG)"/>';

    /* glass body behind everything */
    out += '<rect class="sk-body" x="' + (bodyX - 10) + '" y="' + (SK.TOP + 8) + '" width="' + (bodyW + 20) +
      '" height="' + (H - SK.TOP - SK.GROUND - 12) + '" rx="14"/>';

    var step = 90;   // build-up stagger between floors

    /* podium — commercial levels, not for sale */
    var podY = H - SK.GROUND - SK.POD;
    out += '<g class="fl" style="--fd:0ms">' +
      '<rect class="sk-pod" x="' + (bodyX - 16) + '" y="' + podY + '" width="' + (bodyW + 32) + '" height="' + SK.POD + '" rx="10"/>' +
      '<rect class="sk-door" x="' + (bodyX + bodyW / 2 - 34) + '" y="' + (podY + SK.POD - 42) + '" width="68" height="42" rx="6"/>' +
      '<text class="sk-podt" x="' + (bodyX + bodyW / 2) + '" y="' + (podY + 34) + '">GROUND &amp; MEZZANINE — COMMERCIAL</text>' +
      '<text class="sk-podt" x="' + (bodyX + bodyW / 2) + '" y="' + (podY + 52) + '">RETAIL · RESTAURANTS · LOBBY · PARKING</text>' +
      chip(podY + SK.POD / 2, 'G–M') +
      '</g>';

    /* residential floors, bottom-up */
    for (var j = 0; j < res; j++) {
      var f = t.resStart + j;
      var rowTop = SK.TOP + SK.ROOF + SK.PENT + (res - 1 - j) * SK.ROW;
      out += '<g class="fl" data-floor="' + f + '" style="--fd:' + ((j + 1) * step) + 'ms">' +
        cells(k, f, t.cols, rowTop + 8, SK.ROW - 24, bodyX, bodyW) +
        slab(rowTop + SK.ROW - 14) +
        chip(rowTop + SK.ROW / 2 - 3, 'L' + f) +
        '</g>';
    }

    /* penthouse row — set back from the facade with roof terraces */
    var pentY = SK.TOP + SK.ROOF;
    var pIx = 66;
    out += '<g class="fl" data-floor="' + t.floors + '" style="--fd:' + ((res + 1) * step) + 'ms">' +
      '<rect class="sk-terr" x="' + (bodyX + 4) + '" y="' + (pentY + SK.PENT - 24) + '" width="' + (pIx - 16) + '" height="10" rx="5"/>' +
      '<rect class="sk-terr" x="' + (bodyX + bodyW - pIx + 12) + '" y="' + (pentY + SK.PENT - 24) + '" width="' + (pIx - 16) + '" height="10" rx="5"/>' +
      cells(k, t.floors, t.pents, pentY + 8, SK.PENT - 24, bodyX + pIx, bodyW - 2 * pIx) +
      slab(pentY + SK.PENT - 14) +
      chip(pentY + SK.PENT / 2 - 3, 'PH') +
      '</g>';

    /* roof cap over the set-back penthouse level */
    out += '<g class="fl" style="--fd:' + ((res + 2) * step) + 'ms">' +
      '<rect class="sk-roof" x="' + (bodyX + pIx - 22) + '" y="' + SK.TOP + '" width="' + (bodyW - 2 * pIx + 44) + '" height="14" rx="7"/>' +
      '</g>';

    /* landscaping — hedge, grass, palms land last */
    out += '<g class="fl" style="--fd:' + ((res + 3) * step) + 'ms">' +
      hedgeRow(bodyX - 20, bodyX + bodyW + 20, H - SK.GROUND + 2) +
      '<rect class="sk-grass" x="0" y="' + (H - SK.GROUND + 10) + '" width="' + SK.W + '" height="8" rx="4"/>' +
      palm(SK.W - 58, H - SK.GROUND + 8, 1) +
      palm(SK.W - 22, H - SK.GROUND + 8, 0.75) +
      '</g>';

    /* ground line */
    out += '<line class="sk-ground" x1="0" y1="' + (H - SK.GROUND + 8) + '" x2="' + SK.W + '" y2="' + (H - SK.GROUND + 8) + '"/>';

    svg.setAttribute('viewBox', '0 0 ' + SK.W + ' ' + H);
    svg.innerHTML = out;

    /* sync selected states */
    $$('#mpStage .blk').forEach(function (g) { g.classList.toggle('is-current', g.getAttribute('data-tower') === k); });
    $$('.chip-t').forEach(function (ch) { ch.classList.toggle('is-current', ch.getAttribute('data-tower') === k); });
    $$('.elev__switch button').forEach(function (b) {
      var onB = b.getAttribute('data-tower') === k;
      b.classList.toggle('is-on', onB);
      b.setAttribute('aria-selected', onB ? 'true' : 'false');
    });
  }

  function selectTower(k, scroll) {
    renderTower(k);
    if (scroll) {
      var el = $('#elevation');
      if (el) {
        var y = el.getBoundingClientRect().top + window.pageYOffset - 110;
        window.scrollTo({ top: y, behavior: REDUCED ? 'auto' : 'smooth' });
      }
    }
  }

  /* ======================================================================
     VILLAS — plot polygons over the bird-view render
     ====================================================================== */

  /* A small isometric house — walls, gable, terracotta roof planes and a
     door — sitting on its plot pad. Matches the reference site's villa
     map where every plot is a tiny drawn house. */
  function houseSVG(px, py, d) {
    var x = px + 10, y = py + 14;
    return '<g class="vh" pointer-events="none" style="--vd:' + d + 'ms">' +
      '<polygon class="vh-side" points="' + (x + 28) + ',' + (y + 14) + ' ' + (x + 40) + ',' + (y + 7) + ' ' + (x + 40) + ',' + (y + 25) + ' ' + (x + 28) + ',' + (y + 32) + '"/>' +
      '<rect class="vh-wall" x="' + x + '" y="' + (y + 14) + '" width="28" height="18"/>' +
      '<polygon class="vh-gable" points="' + (x - 2) + ',' + (y + 14) + ' ' + (x + 14) + ',' + (y + 2) + ' ' + (x + 30) + ',' + (y + 14) + '"/>' +
      '<polygon class="vh-roof2" points="' + (x - 2) + ',' + (y + 14) + ' ' + (x + 14) + ',' + (y + 2) + ' ' + (x + 26) + ',' + (y - 4) + ' ' + (x + 10) + ',' + (y + 8) + '"/>' +
      '<polygon class="vh-roof" points="' + (x + 14) + ',' + (y + 2) + ' ' + (x + 26) + ',' + (y - 4) + ' ' + (x + 42) + ',' + (y + 7) + ' ' + (x + 30) + ',' + (y + 14) + '"/>' +
      '<rect class="vh-door" x="' + (x + 11) + '" y="' + (y + 22) + '" width="6" height="10"/>' +
      '</g>';
  }

  function renderVillas() {
    var box = $('#vHomes');
    if (!box) return;

    var out = '';
    var total = 0;
    VILLA_ROWS.forEach(function (row) {
      row.slots.forEach(function (p) {
        total++;
        var u = UNITS['V' + p.num];
        var x = VSLOT.x0 + p.slot * VSLOT.step;
        var y = row.y;
        var d = p.num * 22;   // draw-in sweep, plot by plot from the gate
        out += '<g class="vg">' +
          '<rect class="q q-v q-' + u.status + '" data-uid="V' + p.num + '" pathLength="1"' +
          ' style="--vd:' + d + 'ms" x="' + x + '" y="' + y + '" width="' + VSLOT.w + '" height="' + VSLOT.h + '" rx="10"' +
          ' aria-label="' + esc('Villa ' + p.num + ' — ' + u.type.name + ', ' + STATUS_NAME[u.status]) + '"/>' +
          houseSVG(x, y, d) +
          '<text class="q-tag" style="--vd:' + d + 'ms" x="' + (x + VSLOT.w / 2) + '" y="' + (y + VSLOT.h - 8) + '">V' + p.num + '</text>' +
          '</g>';
      });
    });
    box.innerHTML = out;

    var vc = $('#vCount'), sv = $('#statVillas');
    if (vc) vc.textContent = total;
    if (sv) sv.textContent = total;
  }

  /* ======================================================================
     TOOLTIP
     ====================================================================== */

  var tip = $('#tip');
  var tipOn = false;

  function tipHTML(u) {
    var name = u.villa ? 'Villa ' + u.id.slice(1) : u.id;
    return '<div class="tip__head"><b>' + esc(name) + '</b>' +
      '<span class="badge b-' + u.status + '">' + STATUS_NAME[u.status] + '</span></div>' +
      '<p class="tip__type">' + esc(u.type.name) + '</p>' +
      '<div class="tip__rows">' +
      '<span>Bedrooms <b>' + u.type.bed + '</b></span>' +
      '<span>Floor area <b>' + u.type.area + ' m²</b></span>' +
      '<span>' + u.outLabel + ' <b>' + u.type.out + ' m²</b></span>' +
      '<span>Total <b>' + (u.type.area + u.type.out) + ' m²</b></span>' +
      '</div>' +
      '<p class="tip__cta">Price &amp; floor plan — click to open</p>';
  }

  function showTip(u) {
    if (!FINE || !tip) return;
    tip.innerHTML = tipHTML(u);
    tip.hidden = false;
    requestAnimationFrame(function () { tip.classList.add('is-on'); });
    tipOn = true;
  }
  function moveTip(e) {
    if (!tipOn || !tip) return;
    /* Position via left/top — transform stays free for the pop animation. */
    var w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = clamp(e.clientX + 22, 10, window.innerWidth - w - 10) + 'px';
    tip.style.top = clamp(e.clientY - h / 2, 10, window.innerHeight - h - 10) + 'px';
  }
  function hideTip() {
    if (!tip || !tipOn) return;
    tipOn = false;
    tip.classList.remove('is-on');
    tip.hidden = true;
  }

  function bindHover(container) {
    if (!container) return;
    on(container, 'mouseover', function (e) {
      var t = e.target.closest('[data-uid]');
      if (t && container.contains(t)) showTip(UNITS[t.getAttribute('data-uid')]);
      else hideTip();
    });
    on(container, 'mousemove', moveTip, { passive: true });
    on(container, 'mouseleave', hideTip);
  }

  /* ======================================================================
     RESIDENCE SHEET
     ====================================================================== */

  var sheet = $('#usheet');
  var lastFocus = null;
  var currentUnit = null;

  /* One enquiry unlocks pricing everywhere: localStorage carries the flag
     across pages, tabs and return visits (sessionStorage read for
     back-compat with earlier sessions). */
  function unlocked() {
    try {
      return localStorage.getItem(UNLOCK_KEY) === '1' ||
        sessionStorage.getItem(UNLOCK_KEY) === '1';
    } catch (e) { return false; }
  }

  function lockIcon() {
    return '<span class="lock" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none">' +
      '<rect x="3" y="7" width="10" height="7" rx="1.6" stroke="currentColor" stroke-width="1.3"/>' +
      '<path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" stroke-width="1.3"/></svg></span>';
  }

  function priceHTML(u) {
    if (u.status === 'sd') {
      return '<p class="price-sold">Sold</p>' +
        '<p class="price-note">This residence has found its owner. The plan above shows live availability — green homes are open today.</p>';
    }

    var isPOA = u.price === null;

    if (unlocked()) {
      var val = isPOA ? 'On application' : fmt(u.price);
      return '<div class="price-in"><p class="price-tag"><b id="uPriceVal">' + val + '</b></p>' +
        '<p class="price-note">' + (u.status === 'rs'
          ? 'A reservation is in progress on this home. We will contact you the moment it frees — or suggest its nearest twin.'
          : 'A member of our sales team will confirm availability within one business day.') + '</p>' +
        '<div class="price-cta">' +
        '<a class="btn btn--solid btn--sm" href="index.html#cta"><span>Book a site visit</span></a>' +
        '<a class="btn btn--ghost btn--ghost-light btn--sm" href="tel:+2202082828"><span>+220 208 2828</span></a>' +
        '</div></div>';
    }

    return '<p class="price-tag is-locked"><b aria-hidden="true">US$ 000,000</b>' + lockIcon() + '</p>' +
      '<p class="price-note">' + (u.status === 'rs'
        ? 'Reservation in progress — leave your details to join the waitlist and see the price.'
        : 'Pricing is shared privately. Leave your details once — the exact price appears instantly, for every home.') + '</p>' +
      '<form class="price-form" data-native novalidate>' +
      '<div class="field"><input type="text" id="pf-name" name="name" placeholder=" " required autocomplete="name">' +
      '<label for="pf-name">Full name</label><span class="field__line"></span></div>' +
      '<div class="field"><input type="email" id="pf-email" name="email" placeholder=" " required autocomplete="email">' +
      '<label for="pf-email">Email address</label><span class="field__line"></span></div>' +
      '<div class="field field--full"><input type="tel" id="pf-tel" name="phone" placeholder=" " autocomplete="tel">' +
      '<label for="pf-tel">Phone / WhatsApp (optional)</label><span class="field__line"></span></div>' +
      '<button class="btn btn--solid btn--sm" type="submit"><span>Reveal the price</span></button>' +
      '</form>';
  }

  function openSheet(uid) {
    var u = UNITS[uid];
    if (!u || !sheet) return;
    currentUnit = u;
    hideTip();

    $('#planBox').innerHTML = planFor(u);
    $('#uCrumb').textContent = u.proj;
    $('#uTitle').textContent = u.villa ? 'Villa ' + u.id.slice(1) : 'Residence ' + u.id;
    $('#uTypeName').textContent = u.type.name + (u.villa ? ' · Duplex over two floors' : '');
    var badge = $('#uBadge');
    badge.className = 'badge b-' + u.status;
    badge.textContent = STATUS_NAME[u.status];

    $('#uFacts').innerHTML =
      '<div><dt>Location</dt><dd>' + esc(u.where) + '</dd></div>' +
      '<div><dt>Bedrooms</dt><dd>' + u.type.bed + '</dd></div>' +
      '<div><dt>Bathrooms</dt><dd>' + u.type.bath + '</dd></div>' +
      '<div><dt>Floor area</dt><dd>' + u.type.area + ' m²</dd></div>' +
      '<div><dt>' + u.outLabel + '</dt><dd>' + u.type.out + ' m²</dd></div>' +
      '<div><dt>Total area</dt><dd>' + (u.type.area + u.type.out) + ' m²</dd></div>';

    $('#uPrice').innerHTML = priceHTML(u);

    lastFocus = document.activeElement;
    sheet.hidden = false;
    requestAnimationFrame(function () { sheet.classList.add('is-open'); });
    document.body.classList.add('is-locked');
    $('#usheetClose').focus({ preventScroll: true });
  }

  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    setTimeout(function () { sheet.hidden = true; }, 380);
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  /* ---- price reveal --------------------------------------------------- */

  function animatePrice(el, val) {
    if (REDUCED) { el.textContent = fmt(val); return; }
    var start = performance.now(), dur = 900, from = Math.round(val * 0.82);
    (function step(now) {
      var t = clamp((now - start) / dur, 0, 1);
      var eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = fmt(Math.round(from + (val - from) * eased));
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  function submitLead(form) {
    var name = $('#pf-name', form), email = $('#pf-email', form), tel = $('#pf-tel', form);
    var ok = true;

    [name, email].forEach(function (inp) { inp.parentElement.classList.remove('is-error'); });
    if (!name.value.trim()) { name.parentElement.classList.add('is-error'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { email.parentElement.classList.add('is-error'); ok = false; }
    if (!ok) return;

    /* Demo persistence. In WordPress, POST here instead:
       fetch(ajaxurl, {method:'POST', body: new FormData(form)}) → server
       stores the lead and returns the price for currentUnit.id.        */
    try {
      var leads = JSON.parse(localStorage.getItem('swamiLeads') || '[]');
      leads.push({ unit: currentUnit.id, name: name.value.trim(), email: email.value.trim(), phone: (tel.value || '').trim() });
      localStorage.setItem('swamiLeads', JSON.stringify(leads));
      localStorage.setItem(UNLOCK_KEY, '1');
    } catch (e) {
      try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (e2) { /* private mode */ }
    }

    var btn = $('button[type="submit"]', form);
    btn.disabled = true;
    btn.innerHTML = '<span>Unlocking…</span>';

    setTimeout(function () {
      $('#uPrice').innerHTML = priceHTML(currentUnit);
      var v = $('#uPriceVal');
      if (v && currentUnit.price !== null) animatePrice(v, currentUnit.price);
    }, 650);
  }

  /* ======================================================================
     TABS
     ====================================================================== */

  /* Each development now has its own page, so a page carries at most one
     panel. The tab switch is kept for any page that still ships both. */
  function selectTab(name) {
    var towers = name !== 'villas';
    var pt = $('#panelTowers'), pv = $('#panelVillas');
    if (!pt || !pv) return;
    pt.hidden = !towers;
    pv.hidden = towers;
    $$('.xtab').forEach(function (b) {
      var onTab = b.getAttribute('data-tab') === (towers ? 'towers' : 'villas');
      b.classList.toggle('is-on', onTab);
      b.setAttribute('aria-selected', onTab ? 'true' : 'false');
    });
    if (history.replaceState) history.replaceState(null, '', towers ? '#towers' : '#villas');
  }

  /* ======================================================================
     BOOT
     ====================================================================== */

  /* Arm a stage for its build-up: floors/villas stay parked until the
     stage scrolls into view, then the construction sequence plays. Tower
     switches replay it automatically — the nodes are recreated while the
     stage keeps its .go flag. */
  function armStage(sel) {
    var st = $(sel);
    if (!st) return;
    st.classList.add('stage--anim');
    if (REDUCED || !('IntersectionObserver' in window)) {
      st.classList.add('go');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { st.classList.add('go'); io.disconnect(); }
      });
    }, { threshold: 0.2 });
    io.observe(st);
  }

  function boot() {
    /* Either explorer page will do — The Diplomat ships the tower stage,
       Airport Residency ships the villa stage. */
    if (!$('#elevSvg') && !$('#vSvg')) return;

    renderMasterplan();
    renderChips();
    renderTower('A');
    renderVillas();
    armStage('#elevStage');
    armStage('#vStage');

    /* Header stats count only the development this page is about, so the
       villa page never reports apartment numbers and vice versa. */
    var villaPage = !$('#elevSvg');
    var inScope = villaPage
      ? function (u) { return !!u.villa; }
      : function (u) { return !!u.tower; };
    var sh = $('#statHomes'), sa = $('#statAvail');
    if (sh) sh.textContent = countAll(inScope);
    if (sa) sa.textContent = countAvail(inScope);

    /* tower switch buttons in the elevation header */
    $$('.elev__switch button').forEach(function (b) {
      on(b, 'click', function () { selectTower(b.getAttribute('data-tower'), false); });
    });

    /* masterplan tower blocks and chips → tower select */
    on($('#mpStage'), 'click', function (e) {
      var t = e.target.closest('[data-tower]');
      if (t) selectTower(t.getAttribute('data-tower'), true);
    });
    on($('#mpStage'), 'keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target.closest('[data-tower]');
      if (t) { e.preventDefault(); selectTower(t.getAttribute('data-tower'), true); }
    });
    on($('#mpChips'), 'click', function (e) {
      var ch = e.target.closest('.chip-t');
      if (ch) selectTower(ch.getAttribute('data-tower'), true);
    });

    /* unit interactions — delegated on the stages so re-renders keep working */
    var estage = $('#elevStage'), vstage = $('#vStage');
    bindHover(estage);
    bindHover(vstage);
    on(estage, 'click', function (e) {
      var sw = e.target.closest('[data-switch]');
      if (sw) { selectTower(sw.getAttribute('data-switch'), false); return; }
      var u = e.target.closest('[data-uid]');
      if (u) openSheet(u.getAttribute('data-uid'));
    });
    on(vstage, 'click', function (e) {
      var u = e.target.closest('[data-uid]');
      if (u) openSheet(u.getAttribute('data-uid'));
    });

    /* sheet */
    on($('#usheetClose'), 'click', closeSheet);
    on(sheet, 'click', function (e) { if (e.target === sheet) closeSheet(); });
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && sheet && !sheet.hidden) closeSheet();
    });
    on(sheet, 'submit', function (e) {
      e.preventDefault();
      var form = e.target.closest('.price-form');
      if (form) submitLead(form);
    });
    /* clear field errors as the visitor types */
    on(sheet, 'input', function (e) {
      var f = e.target.closest('.field');
      if (f) f.classList.remove('is-error');
    });
    /* focus trap */
    on(sheet, 'keydown', function (e) {
      if (e.key !== 'Tab' || sheet.hidden) return;
      var f = $$('button, a, input, select', sheet).filter(function (n) { return n.offsetParent !== null && !n.disabled; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* tabs + deep link */
    $$('.xtab').forEach(function (b) {
      on(b, 'click', function () { selectTab(b.getAttribute('data-tab')); });
    });
    if (location.hash === '#villas') selectTab('villas');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
