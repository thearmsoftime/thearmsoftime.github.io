# The Arms of Time — how to build with this design system

**This is a styling-only design system. There are no importable components.**
`window.ArmOfTime` is deliberately empty: the app's own components are written in
Solid, so they cannot ship here. Build UI from plain elements and the classes
below — that is the whole system, and it is complete.

## Setup: the theme attribute is mandatory

Every colour token is defined per theme, so an element outside a `[data-theme]`
subtree gets **no palette at all**. Put the attribute on the root and paint the
shell:

```html
<html data-theme="dark">
  <body class="bg-base-100 text-base-content">…</body>
</html>
```

Three themes, all first-class: **`dark`** (default, warm near-black),
**`black`** (true-black for OLED, cyan accent), **`light`** (warm paper, rust
accent). A design should look right in all three — switch the attribute to check.
Never hard-code a colour; use the semantic names.

## The idiom: Tailwind v4 utilities + daisyUI 5 components

| Family | Real names |
|---|---|
| Surfaces | `bg-base-100` (page), `bg-base-200` (panel), `bg-base-300` (edge/rail) |
| Text | `text-base-content`, and `/5` … `/90` opacity steps: `text-base-content/60` for secondary copy, `/35` for faint notes |
| Brand | `bg-primary` `text-primary-content`, same shape for `secondary`, `accent`, `neutral` |
| State | `info` `success` `warning` `error`, each with a `-content` pair |
| Radii | `rounded-box` (cards/panels), `rounded-field` (inputs/buttons), `rounded-selector` (pills, fully round here) |
| Type | `font-display` for headings (a serif stack: Iowan Old Style → Palatino → Georgia), default sans for body |
| Components | `btn` (+ `btn-primary` `btn-secondary` `btn-accent` `btn-soft` `btn-outline` `btn-ghost` `btn-xs`…`btn-xl`), `join` + `join-item` (segmented pills — the app's own control), `card` + `card-body` `card-title` `card-border`, `badge`, `alert` + `alert-info`…, `input` `select` `checkbox` `toggle` `range` `kbd`, `tabs` + `tab`, `menu`, `table`, `stat`, `divider`, `tooltip`, `modal`, `drawer`, `navbar`, `footer`, `link`, `progress`, `loading` |

The whole daisyUI 5 component set is shipped, not only the parts the app uses.

## This system's own tokens

- `--band-1` … `--band-8` — the timeline band colours, per theme (pale on dark, deep on light). Use `style="background: var(--band-3)"`; pair with `box-shadow: var(--band-shadow)` so a band stays readable on its background.
- `.figure-ink` — for the Vitruvian scan artwork: applies the per-theme blend, filter and opacity so the same image reads on dark and on paper.
- `.zone-fade` — the 0.5s fade used when a timeline zone changes.
- `.no-select` — for anything being dragged or scrubbed.
- `--radius-box` / `--radius-field` / `--radius-selector`, `--font-display` — the raw variables behind the utilities, for inline styles.

Motion is restrained: no shadows by default (`--depth: 0`), no noise, and every
transition is disabled under `prefers-reduced-motion`.

## Where the truth lives

`styles.css` → it `@import`s `_ds_bundle.css`, which holds every theme block,
token and component class. Read it before inventing a name.

## An idiomatic snippet

```jsx
<section data-theme="dark" className="bg-base-100 text-base-content p-6">
  <h1 className="font-display text-3xl">Deep time, on your arms</h1>
  <p className="text-base-content/60 text-sm">538 Myr ago — a fingertip from the wrist.</p>

  <div className="join mt-4">
    <button className="btn join-item btn-active">Life</button>
    <button className="btn join-item">Earth</button>
    <button className="btn join-item">Cosmos</button>
  </div>

  <div className="card bg-base-200 card-border border-base-300 mt-6 max-w-sm">
    <div className="card-body">
      <h2 className="card-title text-base">Cambrian explosion</h2>
      <p className="text-sm text-base-content/70">Scale: 1 cm ≈ 4.2 Myr</p>
      <div className="card-actions"><button className="btn btn-sm btn-primary">Open</button></div>
    </div>
  </div>
</section>
```
