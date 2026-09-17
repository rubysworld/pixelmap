# Pixel Map Tracker

Tiny Minecraft stream helper for [`pixelmap.chaoscat.win`](https://pixelmap.chaoscat.win).

It shows one preloaded world map. Click where the player appears on the stream map and it gives an estimated Minecraft `X, Z` coordinate.

No backend. No accounts. No uploads. Just browser-local state and one very opinionated map.

## How it works

- `0,0` is the center of the map.
- Horizontal movement changes `X`.
- Vertical movement changes `Z`.
- Top edge is negative `Z`; bottom edge is positive `Z`.
- Default span is `4096 × 4096` blocks, editable in the UI.
- The selected marker and scale survive refresh through `localStorage`.
- Arrow keys nudge the marker by one source-map pixel; Shift+arrow nudges by ten.

## Use

1. Open [`pixelmap.chaoscat.win`](https://pixelmap.chaoscat.win).
2. Set the map width/height in blocks if the default span is wrong.
3. Click the player location on the map.
4. Fine-tune with arrow keys if needed.
5. Copy the estimated `X, Z` coordinates.

## Dev

```bash
bun install
bun run dev
bun run build
```

Deploys are currently pushed manually to Cloudflare Pages with Wrangler:

```bash
bunx wrangler pages deploy dist --project-name pixelmap --branch main
```
