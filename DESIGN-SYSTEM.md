# Swami India International — "Atlantic Line"

Homepage design system and build specification.
Every token below is live in `assets/css/tokens.css`; this document explains
the reasoning so the system can be extended to inner pages without drift.

---

## 1. The concept

**Atlantic Line** — the horizon where the Gambian coast meets the ocean, used
as the organising motif.

Three ideas carry it:

| Idea | Where it shows up |
|---|---|
| **The horizon line** | The preloader logo wipes in along it, then the panels split along it. Every eyebrow is prefixed by a 34px rule. Section boundaries are hairlines, never heavy dividers. |
| **Brand gold** | `#B09020`, sampled straight from the company logo. Every accent in the system is built on that one fixed point, so the logo never looks like a foreign object dropped onto the page. |
| **Warm neutrals** | Nothing is pure grey. Every neutral carries a trace of earth so photography of concrete, sand and laterite sits on it naturally. |

### On the reference sites

`gemwaterfront.com` is not a neutral reference — it is a **direct competitor**
selling the same product (coastal apartments in Bijilo and Brufut) to the same
buyer. Nothing has been copied from it. The deliberate points of difference:

- Gem leads with carousels and floor-plate tables. This leads with **narrative
  and portfolio depth** — twenty-two years of delivered buildings is Swami's
  strongest asset and Gem cannot claim it.
- Gem's palette is ocean blue-teal. This is **earth and gold** — warmer,
  more established, less obviously "coastal developer".
- Gem's product index is a table. This is a **hover-revealed editorial index**,
  which reads as a curated portfolio rather than a stock list.

---

## 2. Colour

### Neutral ramp

| Token | Hex | Use |
|---|---|---|
| `--c-ink` | `#0A0B0D` | Dark sections, footer, hero scrim |
| `--c-onyx` | `#101216` | Secondary dark base |
| `--c-graphite` | `#191C21` | Raised dark surfaces, cards |
| `--c-slate` | `#2B2F36` | Dark borders |
| `--c-ash` | `#6B6F77` | Secondary text **on light** (4.6:1) |
| `--c-stone` | `#9E9A92` | Secondary text **on dark** (6.9:1) |
| `--c-mist` | `#D8D2C7` | Hairlines on light |
| `--c-linen` | `#E8E2D7` | Soft filled surface |
| `--c-ivory` | `#F7F4EF` | Page background — warm paper |

> **The one rule that matters:** `--c-ash` on light, `--c-stone` on dark.
> They are *not* interchangeable. Ash on ink measures 3.8:1 and fails AA;
> stone on ivory measures 2.6:1 and fails harder.

### Accent — Swami brand gold

Anchored on **`#B09020`, sampled from `assets/img/logo.png`**. The ramp is
constructed around that single fixed point rather than chosen freely: a
warmer bronze accent sitting next to this yellow-gold logo reads as two
different metals on the same page.

| Token | Hex | Use |
|---|---|---|
| `--c-gold-200` | `#E7D49B` | Gradient highlight, cursor fill |
| `--c-gold-300` | `#D9C070` | Eyebrows and small text **on dark** (10.8:1) |
| `--c-gold-500` | `#B09020` | **Brand gold.** Primary accent, fills, indicators |
| `--c-gold-700` | `#776114` | Eyebrows and small text **on light** (5.5:1) |

`500` is the logo colour exactly — don't change it. `300` and `700` exist
because `500` alone can't carry small text: it measures **2.8:1 on ivory**
(fails) and 6.3:1 on ink. Use `700` on light, `300` on dark.

`--grad-gold` — `linear-gradient(118deg, #E7D49B, #B09020 46%, #776114)`.
Reserved for: statistic numerals, the hero's final line, avatars, progress
fills, and the button hover wash. Used anywhere else it stops being special.

### The logo

The supplied file is **214×53, gold + dark grey on transparency**, and it
already contains the full wordmark — so no typeset company name sits beside
it anywhere.

Two variants ship, because the grey half ("INTERNATIONAL LIMITED" and part of
the S mark) falls to roughly 1.5:1 on the ink hero and footer:

| File | For | How |
|---|---|---|
| `logo.png` | Light backgrounds — the frosted nav | The original, untouched |
| `logo-light.png` | Dark backgrounds — hero, footer, menu, preloader | Grey ramp inverted to warm light (7.5:1); **gold left exactly as supplied** |

The nav renders both stacked in one grid cell and cross-fades them as the bar
goes from transparent-over-photograph to frosted-over-ivory — and back to the
light mark whenever the dark menu overlay is open.

> **Ask the client for an SVG.** At 214px wide the PNG is held at 152px in the
> nav — about 1.4× density, so it will look slightly soft on a retina screen.
> An SVG solves it permanently and would also let the mark be recoloured in
> CSS instead of shipping a second file.

### Dark sections

Add `.on-dark` to any section. It re-aliases the semantic tokens **and
re-applies `color`** — that second part is essential, because `body`'s
`color: var(--c-text)` has already resolved to ink and descendants inherit
the computed value, not the variable. Without it, a bare `.h2` renders
ink-on-ink and disappears.

### Contrast

All body and UI text meets **WCAG 2.1 AA** (4.5:1 small, 3:1 large ≥24px).
Verified with a scripted audit that resolves each element's real backdrop.
Text over photography is protected by the `--grad-scrim-b` / `--grad-scrim-t`
double scrim rather than by colour alone.

---

## 3. Typography

**Sora** (display) — geometric and architectural; at 200–300 weight in very
large sizes it reads engineered rather than decorative, which suits a builder.
**Manrope** (text) — humanist warmth and excellent small-size legibility.

Loaded as one Google Fonts request, four Sora weights and five Manrope
weights, `display=swap`, with `preconnect` to both hosts.

### Scale — fluid, no breakpoints needed

| Token | Range | Use |
|---|---|---|
| `--fs-display` | 52 → 144px | Hero only |
| `--fs-h1` | 40 → 84px | Lifestyle quote, CTA title |
| `--fs-h2` | 32 → 60px | Section headings |
| `--fs-h3` | 24 → 36px | Development names |
| `--fs-h4` | 19 → 24px | Card titles |
| `--fs-lead` | 17 → 21px | Standfirst paragraphs |
| `--fs-body` | 16px | Body |
| `--fs-sm` / `--fs-xs` | 15 / 13px | UI, meta |
| `--fs-eyebrow` | 11px | Micro-labels |

The hero additionally clamps against viewport **height**
(`min(var(--fs-display), 12.5vh)`). Three lines of 144px type will push the
CTAs off a 768px laptop screen otherwise — verified at 1366×768.

### Tracking

Negative tracking on large type, wide tracking on small caps. This pairing is
most of what separates "premium" from "default".

- `--ls-display: -0.035em` — display
- `--ls-heading: -0.022em` — headings
- `--ls-eyebrow: 0.26em` — uppercase micro-labels ← the signature

### Measure

Body copy is capped at `--max-w-text: 62ch`. Headings at 18–22ch so they break
into deliberate lines.

---

## 4. Spacing

4px base. Named tokens `--sp-1` (4px) through `--sp-13` (160px).

Section rhythm is the single most important spacing decision on a long luxury
page — generous and fluid:

```
--section-y:    clamp(5rem, 3rem + 8vw, 10.5rem)   /*  80 → 168px */
--section-y-sm: clamp(3.5rem, 2.5rem + 4vw, 6rem)  /*  56 →  96px */
--gutter:       clamp(1.25rem, 0.6rem + 3vw, 4.5rem)
--grid-gap:     clamp(1.25rem, 0.8rem + 1.6vw, 2.5rem)
```

Layout widths: `--max-w: 1440px` shell, `--max-w-content: 1180px`,
`--max-w-text: 62ch`.

---

## 5. Elevation, radii, glass

**Shadows** are always multi-layer, low-opacity and warm-tinted
(`rgba(10,11,13,…)`, never pure black). `--sh-xs` → `--sh-xl`, plus
`--sh-accent` for the gold glow on primary hover.

**Radii**: `--r-sm` 8px (chips) · `--r-md` 14px (images, cards) ·
`--r-lg` 22px (feature cards) · `--r-pill` (buttons, status).

**Glass** is used in exactly four places — sticky nav, testimonial cards, the
"22 years" badge, and feature cards. `backdrop-filter: blur(18px) saturate(140%)`
with a 1px light border. Overused, glassmorphism reads cheap.

---

## 6. Motion

One easing family. `--e-out: cubic-bezier(0.22, 1, 0.36, 1)` is the house
curve — a fast start that settles gently. That deceleration profile is what
makes motion feel expensive.

| Token | Value |
|---|---|
| `--d-fast` | 260ms — hovers, micro-interactions |
| `--d-base` | 520ms — state changes |
| `--d-slow` | 820ms — staggered children |
| `--d-reveal` | 1100ms — scroll reveals |
| `--stagger` | 90ms — delay between siblings |

### Animation inventory

| Effect | Mechanism |
|---|---|
| **Preloader** | Monogram stroke-draw → letter stagger → progress to real `load` event → panels split along the horizon |
| **Text reveal** | `data-split="lines\|words"` wraps each unit in an overflow mask; inner span slides from `translateY(115%)` |
| **Scroll reveal** | `data-reveal="fade\|up\|scale\|mask\|stagger"` + IntersectionObserver |
| **Image reveal** | `clip-path: inset(0 0 100% 0)` → `inset(0)` while easing out of `scale(1.08)` |
| **Parallax** | `data-parallax="0.18"` — transform-only, on a shared rAF scroll loop |
| **Counters** | `data-count` with easeOutExpo, fires at 50% visibility |
| **Hero** | Crossfade + 9s Ken Burns; index bars fill over the 6s slide duration |
| **Marquee** | Content cloned to 2× width, animated `-50%` for a seamless loop |
| **Dev index** | Cursor-tracked preview at `lerp 0.12`; siblings dim to 38% |
| **Cursor** | Dot at `lerp 0.55`, ring at `0.16` — the lag is what gives it weight |
| **Magnetic** | Buttons translate 28% toward the pointer within 90px |
| **Aurora / ring** | Slow drift + 44s conic rotation behind the CTA |

### Reduced motion

`prefers-reduced-motion: reduce` collapses every duration to 1ms rather than
removing animations, so **final states still apply**. Decorative loops (Ken
Burns, float, drift, spin, marquee) are switched off entirely, the custom
cursor is disabled, parallax and magnetic buttons never initialise, and the
preloader exits immediately. Verified: hero text renders at `opacity: 1`.

### Performance

Only `transform` and `opacity` are animated. The three blurred/conic
decorative layers carry `will-change: transform` and a `translateZ(0)`
promotion — without it their surfaces re-rasterise every frame, and the
resulting main-thread starvation was measurably delaying IntersectionObserver
callbacks across the whole page.

---

## 7. Components

All custom-built. No framework, no plugin styles.

- **Button** — `.btn` with `--solid` / `--ghost` / `--ghost-light`, sizes
  `--sm` / `--lg`. Gold gradient wash sweeps up from the bottom edge on
  hover; the arrow translates 4px. On dark sections the solid variant
  inverts to ivory (`.on-dark .btn--solid`) — an ink pill on an ink
  background is invisible.
- **Eyebrow** — 34px rule + 11px uppercase at `0.26em` tracking.
- **Arrow link** — underline scales from right→left on hover.
- **Feature card** — glass, hover lift 6px, icon tile fills with the gold
  gradient, SVG icons stroke-draw on reveal via `stroke-dashoffset`.
- **Development row** — desktop: a 6-column grid that expands its description
  and slides 24px right on hover. Mobile: the *same markup* becomes an image
  card. No duplicate DOM.
- **Field** — floating label, gold underline drawing from the left on focus.
- **Status pill**, **chips**, **slider buttons**, **lightbox**, **masonry**,
  **marquee**, **footer watermark**.

---

## 8. Responsive

Mobile-first. Base rules are the phone layout; `min-width` queries enhance up.

| Breakpoint | Change |
|---|---|
| **base** (≤639) | Single column. Dev rows are image cards. Testimonials 1-up. Masonry 1 column. |
| **640** | Cards 2-up, masonry 2 columns with wide/tall spans, nav "Enquire" appears |
| **700** | CTA form 2 columns, footer 2 columns |
| **768** | Testimonials 2-up |
| **900** | About splits image/content, statistics 4-up |
| **1024** | Cards 3-up, masonry 4 columns, **dev index switches to editorial rows with cursor preview**, footer 4 columns |
| **1080** | Full nav links, scroll cue and social rail appear |
| **1200** | Testimonials 3-up |
| **≤880px height** | Hero spacing compresses so CTAs stay above the fold |

Verified with no horizontal overflow at 1512, 1366, 834 and 390px.

---

## 9. Accessibility

- Skip link, landmarks, one `h1`, ordered heading levels
- Focus-visible rings on every interactive element (2px gold, 3px offset)
- Menu overlay: `role="dialog"`, `aria-modal`, focus trap, Escape to close,
  focus restored to the trigger. The bar is raised above the overlay so the
  close button is reachable.
- Lightbox: keyboard open (Enter/Space), arrow navigation, Escape, backdrop
  click, focus management
- Split text keeps an `aria-label` with the full string; the visual fragments
  are `aria-hidden`
- Slider: `role="tab"` dots, arrow keys, pauses on hover and focus
- `.no-js` fallback keeps all content visible without JavaScript
- A 6-second failsafe force-reveals anything still hidden

---

## 10. Content that must be replaced before launch

| Item | Status |
|---|---|
| **Testimonials** | ⚠️ **Placeholder.** The four quotes are written for layout only and are marked `[placeholder]` in the markup. Replace with real, permissioned resident testimonials — publishing invented reviews as genuine is both a legal and a trust problem. |
| **Partner logos** | Text lozenges standing in for real SVG logos. Only list organisations that have agreed to be named. |
| **Photography** | Unsplash placeholders throughout. Swap for Swami's own project photography — see `wordpress/README-WORDPRESS.md`. |
| **Statistics** | `2004`, `9 developments` and `5 divisions` are drawn from published company pages. `484 homes` is the sum of the three current projects (92 + 182 + 210) and is labelled "homes in delivery". Confirm all four with the company. |
| **"Watch the film"** | Currently inert — needs a video URL or removal. |
| **Social URLs** | Placeholder `#` hrefs in the hero rail, menu and footer. |

---

## 11. Availability explorer (`availability.html`)

An interactive unit selector in the flow of gemwaterfront.com's floor-plans
page, rebuilt in this design language with one strategic change: **prices are
never printed until the visitor submits the enquiry form once** — the page is
a lead-capture engine, not a price list. After one submission the whole
session unlocks (`sessionStorage`), because the lead is already captured.

Everything is **illustrated SVG in the theme** (per client direction — no
photo renders; imagery arrives later):

1. **Site plan** — architect's-model illustration of The Diplomat: ivory
   tower roof-plans on the dark plot, podium retail, pool, amenities,
   parking, avenue and gate. The plan draws itself in element by element;
   each tower is a clickable block that opens its floor view.
2. **Floor plate** — straight-on schematic per tower in the building's
   ribbon-slab language: floor chips (G–M / L2… / PH), one box per
   residence, commercial podium, roof cap; floors build bottom-up on every
   render. Hover → tooltip (price hidden) → click → sheet (floor plan +
   facts + gated price) → form → animated price reveal.
3. **Society plan** — illustrated villa map with all **82 Phase 1 villas**
   as numbered house blocks in rows along roads, the amenity spine
   (clubhouse, pool, tennis, gardens, mosque) through the centre and the
   gate drive splitting the front row. Villas draw in plot by plot from
   the gate. Same hover/sheet/price-gate flow.

**Totals are the real project's**: 92 Diplomat residences exactly
(Tower A 5×6+2 = 32, Tower B 8×7+4 = 60); 82 Phase 1 villas plotted with
210 total stated. Only availability statuses are placeholder. When the
client supplies real straight-on renders, any illustrated stage can swap to
an image with the same one-box-per-unit overlay.

Status language everywhere: **green = available, gold = reserved, dimmed =
sold**. Unit data lives at the top of `assets/js/explorer.js`; statuses are
a deterministic hash so the plan is stable between visits. In WordPress,
POST the lead from `submitLead()` and return the price server-side so it
never ships in page source.

⚠ Unit mix, statuses and floor plans are **representative placeholders** —
replace with the real availability schedule before launch. Real prices from
the published lists are used as bases (+US$1,200/floor premium on towers).

---

## 12. Files

```
index.html                 Complete homepage
assets/css/tokens.css      Design tokens — the single source of truth
assets/css/main.css        Reset, components, sections, responsive
assets/js/main.js          All interactions (~1000 lines, zero dependencies)
wordpress/                 Theme template, functions, integration guide
DESIGN-SYSTEM.md           This document
```

Total page weight excluding images: **164KB uncompressed, 37KB gzipped**
(measured: HTML 11.3KB · CSS 18.2KB · JS 8.8KB gzipped).
No jQuery, GSAP, Swiper, AOS or Lenis. Everything is hand-built, which is why
it loads fast and why nothing will break when a plugin updates.
