---
name: prototype
description: Add or change a tab in the dev-only prototype panel — the floating box of live knobs for numbers that ship as constants (figure crop, sizes, thresholds). Use when Sander asks to tune a number by hand, wants sliders for something, pastes a Copy block back from the panel, or says /prototype.
---

# The prototype panel

Dev only, behind `?dev=1`. It opens from **Settings → Dev → Prototype** and
floats over the page; drag the knobs until the screen looks right, press
**Copy**, paste the block back into the chat. The block names the source file
and the lines to change.

Open state, active tab, box position and every tab's values live in
localStorage, so a Vite reload lands back where he was.

Everything behind `?dev=1` wears purple — `var(--dev)` and `var(--dev-content)`,
set per theme in `src/index.css`. Nothing a visitor can reach is that colour, so
a purple thing on screen is a thing that does not ship. Keep new dev UI in it.

## Files

| File | Job |
| --- | --- |
| `src/prototype/Prototype.tsx` | The frame: drag, tab strip, Copy, Reset. Never holds a knob. Mounted all session; `open` comes from `App`. |
| `src/prototype/tabs.ts` | The list of tabs, left to right. |
| `src/prototype/types.ts` | `ProtoTab` — what a tab must export. |
| `src/prototype/FigureTab.tsx` | The Vitruvian window: top cut, bottom cut, fade, size. |

## Adding a tab

One new file next to `FigureTab.tsx`, one line in `tabs.ts`. The strip only
draws when there are two or more tabs.

A tab exports a `ProtoTab`:

- `id` — kebab case, also its storage key.
- `label` — one short word.
- `Body` — the knobs. DaisyUI `range range-xs`, name left, value right.
- `copy()` — source file on the first line, then the lines to change.
- `reset()` — put the shipped constants back.
- `restore?()` — read localStorage and apply it. Called once for every tab when
  the panel mounts.

Store with `readStored` / `writeStored` from `src/prefs.ts`. Validate what
comes back: anything out of range is dropped and the defaults win.

## Making a constant tunable

This is the part that is easy to get wrong. A knob is worth nothing if the
screen does not move under it.

1. Keep the shipped constant where it is. It stays the default and the thing
   that ships.
2. Put the live value in a Solid signal next to it, seeded from that constant
   (`tune` / `setTune` in `src/figure.ts` is the pattern).
3. Turn everything derived from it into a **function**, not a module constant —
   `cropTop()`, `cropHeight()`, `cropAspect()`, `fadeRange()`.
4. Call those functions **inside JSX**. A style object built at module level is
   computed once and never moves. That is the whole trick.

Without `?dev=1` nothing calls the setter, so a visitor gets the constants.

## When he pastes a Copy block back

Write the numbers into the file the block names, as plain constants. Keep the
comments around them true — they explain *why* the number is what it is, so a
changed number usually means a changed sentence. Then `npm run typecheck`.

Leave the panel's defaults in step: `TUNE_DEFAULT` reads from the constants, so
editing the constants moves Reset with them.
