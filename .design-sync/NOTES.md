# design-sync notes — The Arms of Time

## What is synced, and why it is styling only

- This repo is a **Solid** app, not a React component library. claude.ai/design
  builds with React, so the components cannot ship. The sync therefore runs the
  converter's **tokens-only** path: `styles.css` carries the whole system, and
  `_ds_bundle.js` is an empty bundle by design.
- `.design-sync/ds-entry.mjs` is that empty bundle entry (`export {}`). It only
  exists so the converter has an entry to build; do not delete it.
- Zero PascalCase exports + `cfg.cssEntry` set is what makes the converter print
  `[ZERO_MATCH] ... treating as tokens-only DS`. That line is expected, not a fault.
- If the app is ever ported to React, this becomes a normal component sync: drop
  the stub entry, point `--entry` at a library build, and re-run.

## The shipped stylesheet

- `.design-sync/ds-source.css` (committed) is the source. It imports `src/index.css`
  for the three themes and repo tokens, then safelists — via `@source inline(...)` —
  the **entire daisyUI 5 component set** plus the semantic palette, opacity steps,
  radii, and a broad layout/type utility set.
- Why safelist: Tailwind v4 only emits what it sees used. The design agent writes
  its own markup, so anything not baked in would silently render unstyled. The
  daisyUI class list was extracted from `node_modules/daisyui/components/*.css`
  and `utilities/*.css`.
- Compile step (this is `cfg.buildCmd`, run it **before** the converter):
  `./.ds-sync/node_modules/.bin/tailwindcss -i .design-sync/ds-source.css -o .design-sync/.cache/ds-styles.css --minify`
- Output is ~1.2 MB. About 1 MB of that is daisyUI itself — expected, not bloat.
- After a daisyUI major upgrade, re-extract the class list (the safelist is a
  snapshot of 5.7.32) or new components ship unstyled.

## Build invocation

- `--node-modules ./.ds-sync/node_modules`, not the repo's. The repo has no React;
  the converter needs one to vendor `_vendor/react*.js` for preview cards. React
  lives only in the isolated converter dir, so the app's deps stay untouched.
- Full command:
  `node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./.ds-sync/node_modules --entry ./.design-sync/ds-entry.mjs --out ./ds-bundle --no-render-check`

## Known warns (expected — not new findings)

- `[RENDER_SKIPPED]` — there are no preview cards to render, so playwright was
  never installed. Nothing is lost; visual checking is done by hand instead (see
  below).
- `[FONT_MISSING]` was resolved with `cfg.runtimeFontPrefixes`. `--font-display`
  is a deliberate **system** serif stack (Iowan Old Style → Palatino → Book
  Antiqua → Cambria → Georgia → ui-serif). There is no webfont to ship.
- `[DTS_REACT]` — irrelevant at zero components.

## Hand verification

- `ds-bundle/.theme-check.html` (written by hand, dot-prefixed so it never
  uploads) renders all three themes, the palette, opacity steps, band colours and
  the daisyUI parts from the real shipped CSS. Serve with
  `node .ds-sync/storybook/http-serve.mjs ./ds-bundle` and open it.
- Regenerate it if the theme set changes; it is the only visual gate this shape has.

## Re-sync risks

- **The safelist is a snapshot.** New daisyUI components, new tokens in
  `src/index.css`, or new utility families used by future designs are only in the
  shipped CSS if `ds-source.css` names them. Re-check after a daisyUI or Tailwind
  upgrade.
- **`conventions.md` names real class and token names.** Every one was verified
  against `ds-bundle/_ds_bundle.css` at sync time. Re-validate them after a
  daisyUI upgrade — a stale name makes the design agent write markup that
  resolves to nothing.
- **No render check ever runs on this shape.** If the CSS breaks, only the
  hand-served theme-check page will show it.
- **`.design-sync/.cache/ds-styles.css` is gitignored.** A fresh clone must run
  `cfg.buildCmd` (and the `.ds-sync` install) before the converter, or `cssEntry`
  will not exist.
- This repo was **not a git repository** at sync time, so nothing was committed.
  If it becomes one, commit `.design-sync/config.json`, `NOTES.md`,
  `conventions.md` and `ds-source.css`.
