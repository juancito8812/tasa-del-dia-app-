---
name: interface-design
description: Craft-first interface design for dashboards, admin panels, SaaS apps, tools, settings pages, data interfaces, and interactive products. Use when designing, building, reviewing, auditing, or refining product UI where visual craft, layout hierarchy, tokens, states, visual direction, or design-system consistency matter. Not for marketing pages, landing pages, campaigns, or brand-only work.
---

# Interface Design

Build product interfaces with the craft of a top design team — Linear, Vercel, Stripe, Apple. The difference between those and generic output is not talent. It is that every decision was *decided*, the hierarchy is unmistakable, and a hundred small details are correct at once. This skill is how you get there.

## Scope

**Use for:** Dashboards, admin panels, SaaS apps, tools, settings pages, data interfaces.

**Not for:** Landing pages, marketing sites, campaigns, brand-only work. Use a marketing/frontend design skill for those.

This skill is self-contained: direction, visual hierarchy, design-system architecture, and the polish and motion essentials needed to ship production-grade UI all live here.

---

# The Problem

You will generate generic output. Your training has seen thousands of dashboards, and the patterns are strong. You can follow this entire process — explore the domain, name a signature, state your intent — and still produce a template: warm colors on cold structures, friendly fonts on generic layouts.

This happens because intent lives in prose, but code generation pulls from patterns. The gap between them is where defaults win. Process helps, but it doesn't guarantee craft. You have to catch yourself, and you have to know the concrete moves that defaults don't.

**The bar:** If another AI, given a similar prompt, would produce substantially the same output, you have failed. Not different for its own sake — different because the interface emerged from *this* user, *this* task, *this* world. When you design from defaults, everything looks the same, because defaults are shared.

---

# Where Defaults Hide

Defaults disguise themselves as infrastructure — the parts that feel like they just need to work, not be designed.

- **Typography feels like a container.** But type isn't holding your design, it *is* your design. The weight of a headline, the personality of a label, the texture of a paragraph shape how the product feels before anyone reads a word. Reaching for your usual font means you're not designing.
- **Navigation feels like scaffolding.** But navigation *is* the product — where you are, where you can go, what matters. A page floating in space is a component demo, not software.
- **Data feels like presentation.** But a number on screen is not design. What does it *mean* to the person looking? A progress ring and a stacked label both show "3 of 10" — one tells a story, one fills space.
- **Token names feel like implementation detail.** But `--ink` and `--parchment` evoke a world; `--gray-700` and `--surface-2` evoke a template. Someone reading only your tokens should guess what product this is.

There are no structural decisions. Everything is design. The moment you stop asking "why this?" is the moment defaults take over.

---

# Intent First

Before touching code, answer these. Keep it a compact working brief unless the direction needs user confirmation.

- **Who is this human?** Not "users." The actual person. Where are they when they open this? What did they do 5 minutes ago, what will they do 5 minutes after? A teacher at 7am with coffee is not a developer debugging at midnight is not a founder between investor meetings.
- **What must they accomplish?** The verb. Grade these submissions. Find the broken deployment. Approve the payment. The answer determines what leads, what follows, what hides.
- **What should this feel like?** In words that mean something. "Clean and modern" means nothing — every AI says that. Warm like a notebook? Cold like a terminal? Dense like a trading floor? Calm like a reading app? This shapes color, type, spacing, density — everything.

If the prompt is too vague to identify the human, task, and feel, ask one concise question. If context allows a responsible assumption, state it briefly and proceed.

**Intent must be systemic.** Saying "warm" then using cold colors is not following through. If the intent is warm: surfaces, text, borders, accents, semantic colors, type — all warm. If dense: spacing, type size, information architecture — all dense. Check every token against the stated intent. For every choice — layout, color temperature, typeface, spacing scale, hierarchy — you must be able to say *why*. "It's common" or "it works" means you defaulted.

---

# Product Domain Exploration

This is where defaults get caught — or don't. Generic path: Task type → visual template → theme. Crafted path: Task type → product domain → signature → structure + expression. The difference is time spent in the product's world before any visual thinking.

**Produce all four before proposing any direction:**

- **Domain** — concepts, metaphors, vocabulary from this product's world. Not features — territory. Minimum 5.
- **Color world** — what colors exist *naturally* here? Not "warm" or "cool" — go to the actual world. If this product were a physical space, what would you see? List 5+.
- **Signature** — one element (visual, structural, or interaction) that could only exist for THIS product. If you can't name one, keep exploring.
- **Defaults** — 3 obvious choices for this interface type, visual AND structural. You can't avoid patterns you haven't named.

**The test:** Read your proposal with the product name removed. Could someone identify what it's for? If not, explore deeper.

---

# Visual Hierarchy & Composition

The single biggest driver of "this looks designed" versus "this looks generated." Defaults produce *flatness* — everything the same size, weight, and spacing, so nothing leads and the eye has nowhere to go. Craft produces *hierarchy* — the eye knows instantly what matters. These are concrete moves, not vibes.

## One focal point per view

Every screen has one thing the user came to do. That thing dominates — through size, contrast, position, or the space around it. When everything competes equally, nothing wins and the interface reads like a parking lot. Before building, name the focal element out loud. Then make it win: bigger, higher-contrast, or ringed in whitespace. Demote everything else deliberately.

## Type scale is a ratio, and weight beats size

Don't pick sizes by feel. Pick a ratio and step it: ~1.2 (minor third) for dense/calm UI, ~1.25 for most product UI, ~1.333 for expressive. From a 14–16px body that yields a *visibly* distinct scale, not 15/16/17 mush. A 14px base at 1.25: `caption 11 · body 14 · h4 16 · h3 18 · h2 22 · h1 28 · display 44+`. Round to whole pixels and to your spacing grid.

The Apple/Linear move: **weight and color do more hierarchy work than size.** A single 14px size holds three tiers through weight + opacity alone — `value: 600 / primary`, `label: 500 / secondary`, `meta: 400 / muted` — separating more cleanly than two regular weights two points apart. Build from three levers together (size, weight, color/opacity), never size alone. If you squint and can't tell headline from body from label, the hierarchy is too weak.

## Density is a decision, expressed in px

Linear is tight; Stripe is airy. Neither is default — both are *chosen*, and the choice is the same number repeated everywhere. Decide the density up front and name the values: a tool panel at 12–16px padding feels workbench-tight; the same card at 24px feels like a brochure. Pick deliberately, then hold it.

## Spatial rhythm — breathe unevenly

Great interfaces don't space everything equally. Dense control zones give way to open content; heavy elements balance against light ones; the eye travels with purpose. Monotone layouts — same card size, same gap, same density everywhere — are the sound of no one deciding. Vary the rhythm on purpose: group tightly-related things, then put real air between groups.

## Proportions speak

A 280px sidebar next to full-width content says "navigation serves content." A 360px sidebar says "these are peers." The specific number declares what matters. If you can't articulate what a proportion is saying, it isn't saying anything.

## Distribution and restraint (the "expensive" look)

- **~60/30/10**: a dominant neutral surface, a secondary tone, and ~10% accent. Color is a scarce resource — most of the screen is structure.
- **One accent, used with intention**, beats five colors used without thought. Gray builds structure; color *communicates* (status, action, identity). Unmotivated color is noise.
- **Hierarchy through space and weight, not lines.** Reach for whitespace and tonal shift before borders and dividers. The most premium interfaces are mostly invisible structure.
- **Optical sizing on large type**: tighten letter-spacing as type gets bigger (headings slightly negative tracking); loosen line-height on body for readability (~1.5). Tight type reads as crafted; default tracking on a 32px heading reads as a document.

---

# Craft Foundations

## Subtle Layering (the backbone)

Regardless of direction, this applies to everything. You should *barely notice the system working* — when you look at Vercel's dashboard you don't think "nice borders," you just understand the structure. Invisible craft is working craft.

**Surface elevation.** Surfaces stack: a dropdown sits above a card sits above the page. Build a numbered system — base, then increasing levels. Each jump is only a few percentage points of lightness — e.g. dark mode base → +7% → +9% → +12%; light mode stays light and adds shadow instead. You can barely see one step in isolation, but stacked, the hierarchy emerges. Whisper-quiet shifts you feel rather than see.

- **Sidebars:** same background as canvas, not a different color. Different colors fragment the space into "sidebar world" and "content world." A subtle border is enough.
- **Dropdowns/popovers:** one level above their parent surface, or they blend in and layering is lost.
- **Inputs:** slightly *darker* than surroundings, not lighter. Inputs are inset — they receive content. A darker fill signals "type here" without heavy borders.

**Borders.** Should disappear when you're not looking for them, but be findable when you need structure. Low-opacity rgba blends with the background and defines an edge without demanding attention; solid hex borders look harsh by comparison.

**The squint test:** blur your eyes at the interface. You should still perceive hierarchy — what's above what, where sections divide — but nothing should jump out. No harsh lines, no jarring shifts. Just quiet structure. Get this wrong and nothing else matters.

## Infinite Expression

Every pattern has infinite expressions — **no two interfaces should look the same.** A metric display could be a hero number, inline stat, sparkline, gauge, progress bar, comparison delta, or trend badge. Same sidebar width, same card grid, same icon-left-number-big-label-small metric boxes every time *signals AI-generated immediately* and is forgettable. Before building, ask: what's the ONE thing users do here?

## Color Lives Somewhere

Every product exists in a world, and that world has colors. Before reaching for a palette, walk into the physical version of this space — what materials, what light, what objects? Your palette should feel like it came FROM somewhere, not applied TO something.

---

# Before Writing Each Component

**Every time** you write UI code — even small additions — state:

```
Intent:     [who is this human, what must they do, how should it feel]
Hierarchy:  [the focal element, and how it wins]
Palette:    [colors and WHY they fit]
Depth:      [borders / shadows / layered — and WHY]
Surfaces:   [elevation scale — and WHY]
Typography: [typeface + size/weight/color levers — and WHY]
Spacing:    [base unit + chosen density]
```

This checkpoint is mandatory. If you can't explain WHY for each, you're defaulting.

---

# Use What Exists

Before you build a control or style an element, look at what the project already gives you.

**Controls: native → primitive → hand-roll.** Native HTML first (`<button>`, `<a>`, `<input>`, `<dialog>`). Headless primitives second (Radix, React Aria, Ark, Headless UI, Vaul). Hand-roll only as last resort with full keyboard/ARIA/focus contract.

**Styling: system → component → token → utility.** If the project has a design system, use it. When an element repeats, extract a component. Bind to semantic tokens, not hardcoded literals.

---

# Design System Essentials

- **Token architecture.** Every color traces to a small set of primitives: foreground, background, border, brand, semantic. No random hex.
- **Text hierarchy — four levels.** Primary, secondary, tertiary, muted.
- **Spacing.** Pick a base unit (4 or 8px), use multiples only.
- **Depth — choose ONE:** borders-only · subtle shadows · layered shadows · surface-color shifts.
- **Border radius — a scale.** Small for inputs, medium for cards, large for modals.
- **Dark mode.** Shadows are weak on dark — lean on borders. Same hierarchy, inverted values.

---

# Polish & Motion Essentials

- **Concentric radius:** `outer = inner + padding`
- **Tabular numbers** on dynamic values (`font-variant-numeric: tabular-nums`)
- **States are not optional:** default, hover, active, focus, disabled, loading, empty, error
- **Hit areas:** 44×44px minimum (40 at minimum with pseudo-element)
- **Motion:** duration <300ms, custom ease-out, only `transform` + `opacity`, respect `prefers-reduced-motion`

---

# Workflow

1. Inspect existing app, tokens, components, and `.interface-design/system.md` if present
2. Domain exploration (domain, color world, signature, defaults)
3. Propose direction → confirm
4. Build → run checks (swap test, squint test, signature test, token test)
5. Offer to save to `.interface-design/system.md`
