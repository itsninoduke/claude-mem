# Viral carousels — "Fórmula 100K / noevarner.ai" style

Swipeable Instagram carousels (1080×1350, 4:5) built to match the dark-topographic
+ coral-spark reference: scroll-stopping cover, one idea per swipe, mid-CTA and
final-CTA as their own slides.

Two decks, one per winning video formula:

| Deck | Slug | Slides | Topic | Final CTA |
|------|------|--------|-------|-----------|
| MARKIT  (1.1M video) | `markit/` | 9 | Stop wasting tokens on PDFs → MarkItDown | comment **MARKIT** |
| LEGAL   (646K video) | `legal/`  | 8 | Legal agents inside Claude (educational) | comment **LEGAL** |

Each deck folder holds `slide-NN.html` (standalone) and `slide-NN.png` (post-ready).

## Regenerate

```bash
node carousels/build.mjs      # rebuild all slide HTML + manifest.json
npm i puppeteer               # one-time: downloads Chromium
node carousels/render.mjs     # HTML -> PNG (1080x1350 @2x)
```

## Customize

All knobs live in the `BRAND` object at the top of `build.mjs`:

- `accent` — `#ED7A4E` (coral, matches the reference). Swap to `#3B82F6` for the
  electric-blue *Fórmula 100K* variant; everything (spark, highlights, keyword
  pill, card accents) follows the one variable.
- `handle` — currently `@formula100k`. Change to your real IG handle.
- `avatarInitials` — letter shown in the profile chip (drop in a real photo by
  editing the `.avatar` block in `build.mjs` if you prefer).

Copy lives in the `decks` object — edit text there, `<span class="hl">…</span>`
marks the orange highlight, `<br>` controls line breaks on big type.

## Copy notes (kept honest)

- Every verified claim from the scripts is preserved; nothing flagged as oversell
  was added.
- The legal deck keeps the **"uso educativo — no es consejo legal"** disclaimer on
  slide 1.
- MARKIT slide 1 uses the prohibition hook ("NO le subas PDFs"), the angle that hit
  1.1M — not the feature name.
