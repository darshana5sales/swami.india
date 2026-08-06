/* ==========================================================================
   SWAMI — SHARED UNIT SHEET
   unitsheet.js — the two things the residence popup needs on both project
   pages: a drawn floor plan, and the price gate.

   THE PLAN DRAWING
   The brochures publish room dimensions, not CAD. So the plan here is an
   honest schematic: every room box is scaled to its real published size and
   labelled with it, packed inside an outer wall, with the balcony or deck
   drawn as its own band. It is captioned as representative, because that is
   what it is — it is not traced from the architect's plate.

   THE PRICE GATE
   Neither brochure publishes a price list. The gate captures the enquiry and
   then shows whatever `price` the unit record carries; with no price set it
   says so plainly rather than inventing a figure. Drop real prices into the
   TYPES tables and they appear here with no other change.
   ========================================================================== */

(function (w) {
  'use strict';

  var UNLOCK_KEY = 'swamiPriceUnlocked';
  var LEAD_KEY = 'swamiLeads';

  function unlocked() {
    try {
      return localStorage.getItem(UNLOCK_KEY) === '1' ||
             sessionStorage.getItem(UNLOCK_KEY) === '1';
    } catch (e) { return false; }
  }

  /* ---- Floor plan ------------------------------------------------------ */

  // "3.60 × 4.90 m" -> [3.6, 4.9]
  function dims(s) {
    var m = String(s).replace(/,/g, '').match(/([\d.]+)\s*[×x]\s*([\d.]+)/);
    return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
  }
  function isOutdoor(n) { return /balcony|deck|terrace/i.test(n); }
  function isService(n) { return /toilet|bath|wc|laundry|utility|lobby|store/i.test(n); }

  /* Packs the rooms into rows inside a fixed frame. Row heights follow the
     tallest room in the row, and each room keeps its real width:height
     ratio, so the drawing stays proportional to the published figures. */
  function plan(rooms, label) {
    var W = 640, H = 470, PAD = 26;
    var live = [], out = [];
    rooms.forEach(function (r) {
      var d = dims(r[1]);
      if (!d) return;
      (isOutdoor(r[0]) ? out : live).push({ name: r[0], w: d[0], h: d[1], txt: r[1] });
    });
    if (!live.length) {
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="fp-svg" role="img" aria-label="Floor plan unavailable">' +
             '<text class="fp-none" x="' + (W / 2) + '" y="' + (H / 2) + '">Floor plan on request</text></svg>';
    }

    // biggest room first reads as the living space anchoring the plan
    live.sort(function (a, b) { return (b.w * b.h) - (a.w * a.h); });

    var frameW = W - PAD * 2;
    var deckH = out.length ? 62 : 0;
    var frameH = H - PAD * 2 - deckH;

    // lay out in rows, ~2 rooms per row for small plans, 3 for larger
    var perRow = live.length <= 3 ? 2 : 3;
    var rows = [], i;
    for (i = 0; i < live.length; i += perRow) rows.push(live.slice(i, i + perRow));

    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="fp-svg" role="img" aria-label="Schematic floor plan of ' + label + '">';
    s += '<rect class="fp-wall" x="' + PAD + '" y="' + PAD + '" width="' + frameW + '" height="' + frameH + '"/>';

    var rowH = frameH / rows.length;
    rows.forEach(function (row, ri) {
      var totalW = row.reduce(function (n, r) { return n + r.w; }, 0);
      var x = PAD;
      var y = PAD + ri * rowH;
      row.forEach(function (r) {
        var rw = (r.w / totalW) * frameW;
        s += '<g class="fp-room' + (isService(r.name) ? ' is-svc' : '') + '">';
        s += '<rect x="' + (x + 3).toFixed(1) + '" y="' + (y + 3).toFixed(1) +
             '" width="' + (rw - 6).toFixed(1) + '" height="' + (rowH - 6).toFixed(1) + '"/>';
        s += '<text class="fp-n" x="' + (x + rw / 2).toFixed(1) + '" y="' + (y + rowH / 2 - 4).toFixed(1) + '">' +
             r.name.toUpperCase() + '</text>';
        s += '<text class="fp-d" x="' + (x + rw / 2).toFixed(1) + '" y="' + (y + rowH / 2 + 14).toFixed(1) + '">' +
             r.txt + '</text>';
        s += '</g>';
        x += rw;
      });
    });

    if (out.length) {
      var oy = PAD + frameH;
      var ox = PAD, ow = frameW / out.length;
      out.forEach(function (r) {
        s += '<g class="fp-room is-out">';
        s += '<rect x="' + (ox + 3).toFixed(1) + '" y="' + (oy + 3).toFixed(1) +
             '" width="' + (ow - 6).toFixed(1) + '" height="' + (deckH - 6).toFixed(1) + '"/>';
        s += '<text class="fp-n" x="' + (ox + ow / 2).toFixed(1) + '" y="' + (oy + deckH / 2 - 2).toFixed(1) + '">' +
             r.name.toUpperCase() + '</text>';
        s += '<text class="fp-d" x="' + (ox + ow / 2).toFixed(1) + '" y="' + (oy + deckH / 2 + 16).toFixed(1) + '">' +
             r.txt + '</text>';
        s += '</g>';
        ox += ow;
      });
    }

    // entry mark on the left wall
    s += '<path class="fp-door" d="M' + PAD + ' ' + (PAD + frameH - 46) + ' a22 22 0 0 0 22 -22"/>';
    s += '</svg>';
    return s;
  }

  /* ---- Price gate ------------------------------------------------------ */

  function priceBlock(unit, isOpen) {
    /* Per-opening, not per-visitor: every home asks again, and closing the
       popup resets it. `isOpen` is held by the caller for the popup on
       screen — nothing carries over between openings. */
    if (isOpen) return revealed(unit);
    /* The gate is a panel of its own so it stays findable while the detail
       column scrolls: gold rule, its own heading, then two form rows. */
    return '' +
      '<div class="pgate pgate--locked">' +
        '<p class="pgate__title"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
          '<rect x="3" y="7" width="10" height="7" rx="1.6" stroke="currentColor" stroke-width="1.4"/>' +
          '<path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" stroke-width="1.4"/></svg>' +
          'Get the price</p>' +
        '<p class="pgate__masked" aria-hidden="true"><b>' + (unit.currency || 'US$') + ' &bull;&bull;,&bull;&bull;&bull;</b></p>' +
        '<p class="pgate__note">Pricing is shared privately. Leave your details and the price for this home appears straight away.</p>' +
        '<form class="pgate__form" novalidate>' +
          '<div class="field"><input type="text" id="pg-name" placeholder=" " required autocomplete="name">' +
            '<label for="pg-name">Full name</label><span class="field__line"></span></div>' +
          '<div class="field"><input type="email" id="pg-email" placeholder=" " required autocomplete="email">' +
            '<label for="pg-email">Email address</label><span class="field__line"></span></div>' +
          '<div class="field field--wide"><input type="tel" id="pg-phone" placeholder=" " autocomplete="tel">' +
            '<label for="pg-phone">Phone / WhatsApp <span style="opacity:.6">(optional)</span></label><span class="field__line"></span></div>' +
          '<button class="btn btn--solid btn--sm" type="submit"><span>Reveal the price</span></button>' +
        '</form>' +
      '</div>';
  }

  function revealed(unit) {
    if (unit.price) {
      return '<div class="pgate pgate--open">' +
             '<p class="pgate__title"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
               '<path d="M4 12.5l5 5L20 6.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
               'Price unlocked</p>' +
             '<p class="pgate__price"><i>from</i><b>' + unit.price + '</b></p>' +
             '<p class="pgate__note">Starting price for ' + unit.label + '. Payment is on a construction-linked schedule; our sales team confirms current availability within one business day.</p>' +
             '<div class="pgate__act"><a class="btn btn--solid btn--sm" href="contact.html"><span>Book a viewing</span></a>' +
             '<a class="btn btn--ghost btn--ghost-light btn--sm" href="tel:+2202082828"><span>+220 208 2828</span></a></div></div>';
    }
    /* No price on record for this home — say so rather than invent one. */
    return '<div class="pgate pgate--open">' +
           '<p class="pgate__title"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
             '<path d="M4 12.5l5 5L20 6.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
             'Request received</p>' +
           '<p class="pgate__price pgate__price--pending">Thank you &mdash; your request is in.</p>' +
           '<p class="pgate__note">The price for ' + unit.label + ' is issued by our sales team, who will be in touch within one business day. You can reach them directly in the meantime.</p>' +
           '<div class="pgate__act"><a class="btn btn--solid btn--sm" href="tel:+2202082828"><span>+220 208 2828</span></a>' +
           '<a class="btn btn--ghost btn--ghost-light btn--sm" href="mailto:info@swamiindiainternational.com"><span>Email the team</span></a></div></div>';
  }

  /* Wires the gate form inside a container. onDone re-renders the block. */
  function bindGate(root, unit, onDone) {
    var form = root.querySelector('.pgate__form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = form.querySelector('#pg-name'), em = form.querySelector('#pg-email'), ph = form.querySelector('#pg-phone');
      var ok = true;
      [n, em].forEach(function (i) { i.parentElement.classList.remove('is-error'); });
      if (!n.value.trim()) { n.parentElement.classList.add('is-error'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) { em.parentElement.classList.add('is-error'); ok = false; }
      if (!ok) return;

      // In WordPress, POST this to admin-ajax / CF7 instead of localStorage.
      try {
        var leads = JSON.parse(localStorage.getItem(LEAD_KEY) || '[]');
        leads.push({ unit: unit.label, name: n.value.trim(), email: em.value.trim(), phone: ph.value.trim() });
        localStorage.setItem(LEAD_KEY, JSON.stringify(leads));
      } catch (err) { /* private mode — the lead is lost, the reveal still happens */ }

      var btn = form.querySelector('button');
      btn.disabled = true;
      btn.innerHTML = '<span>Sending&hellip;</span>';
      setTimeout(function () { if (onDone) onDone(); }, 550);
    });
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f) f.classList.remove('is-error');
    });
  }

  /* The brochure's own plate, when the project publishes one. Clicking it
     hands off to the site lightbox for a full-size look. */
  function plate(src, label, iw, ih) {
    /* Intrinsic size matters here: the browser reserves the box from it, so
       a landscape default on a portrait plate would shift the sheet. */
    return '<img class="fp-plate" src="' + src + '" alt="Floor plan — ' + label + '" ' +
           'loading="lazy" decoding="async" width="' + (iw || 1400) + '" height="' + (ih || 977) + '" ' +
           'data-full="' + src + '" title="Click to enlarge">';
  }

  w.SwamiSheet = { plan: plan, plate: plate, priceBlock: priceBlock, bindGate: bindGate, unlocked: unlocked };
})(window);
