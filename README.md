# opensiro-web

Static multi-page site for **opensiro** — the company building the toolchain for
organizations that compile, and the ARCTIC reasoning benchmark.

The design uses Departure Mono, warm off-white backgrounds, sharp corners,
hairline dividers, and blue interactive accents. The home page explains the
work in plain language; each product has its own animated pixel mark.
Built as plain HTML/CSS/JS, with no runtime dependencies.

## Stack

Plain static site — **no build step, no dependencies, no framework.** All fonts and mascot artwork are bundled locally and served from `assets/`.

Runtime remains dependency-free. Regenerating the stabilized mascot GIF requires Pillow:
`uv run --no-project --with pillow python scripts/stabilize-mascot-gif.py`.

```
opensiro-web/
├── index.html       # landing — hero, mission, products & research previews
├── products.html    # vsmlite + opensiro detail
├── research.html    # ARCTIC detail + animated public training examples
├── research.js      # play on entry, pause offscreen, replay, reduced motion
├── globals.css      # tokens, @font-face, components (monochrome monospace)
├── app.js           # active nav, accessible mobile drawer
├── vines.js         # continuous central vine growth and viewport tracking
├── assets/
│   ├── DepartureMono-Regular.woff2
│   ├── DepartureMono-Regular.woff
│   ├── DepartureMono-OFL.txt    # Departure Mono license (OFL-1.1)
│   ├── mascot-logo.gif        # stabilized animated hero mascot
│   ├── mascot-logo.png        # reduced-motion fallback + nav mascot
│   ├── mascot-favicon.png     # alternate square mascot icon
│   ├── favicon-64x64.png      # wider browser + touch icon
│   ├── vsmlite-mark.svg      # animated parent/child mark
│   ├── opensiro-mark.svg     # animated benchmark mark
│   ├── arctic-mark.svg       # animated reasoning-core mark
│   ├── pixel-vine.png        # transparent climbing-vine sprite
│   ├── arctic-mountains.png  # transparent mountain silhouette
│   ├── social-preview.png   # shared Open Graph / X preview
│   └── ARTWORK.md            # generated-asset prompts and behavior
├── scripts/
│   ├── stabilize-mascot-gif.py
│   └── build-arctic-assets.py # exact grid diagrams from public ARCTIC-0 pairs
└── README.md
```

## Design language

| Token        | Value                              | Notes                          |
|--------------|------------------------------------|--------------------------------|
| `--bg`       | `#faf9f6`                          | warm off-white, NOT pure white |
| `--ink`      | `#18181b`                          | zinc-900 text                  |
| `--hairline` | `rgba(0,0,0,.10)`                  | section/button dividers        |
| `--tint`     | `rgba(0,0,0,.04)`                  | 4% section wash                |
| `--accent`   | `#2f6df6`                          | marks, focus, ARCTIC hover     |
| `--font`     | `'DepartureMono', monospace`       | one typeface, everywhere       |
| `--maxw`     | `1200px`                           | content width                  |

**Signature rules:**
- **Sharp corners** — `border-radius:0` everywhere except 6px status dots.
- **1px hairline borders** that fully invert on hover (fill ↔ outline swap).
- **Plain body copy** — sentence case, readable line lengths, uppercase reserved
  for small labels and navigation.
- **Clear hierarchy** — centered hero compositions, larger headings, and
  left-aligned product descriptions.
- **Dividers, not cards** — products separated by hairline lines, no boxed backgrounds.

## Motion and interactions

- `.vine-static` preserves the original bitmap vines along the home and product
  heroes. A smaller, muted `.vine-center` garden grows continuously behind the
  home copy. Tendrils gently explore before curling; sweeping, spring-like,
  and short flowering growth alternate. Stems keep their own direction with
  smooth joins. New randomized bends and flowers attach to existing stems; the
  viewport moves at a constant speed after the initial growth, letting older
  sections leave the bottom edge. Flowering does not change the camera speed.
  There is no fade, reset, or accumulating tangle. Offscreen sections
  are removed to keep the document bounded. Pause/Resume controls the garden;
  it also pauses offscreen and in hidden tabs. Reduced motion shows a completed
  still ornament; without JavaScript only the original static vines remain.
- The ARCTIC preview and research hero end in a black mountain silhouette.
  Hovering the section or focusing a link inside it turns the mountains blue.
- Each product has a separate locally served SVG mark with a small animation.
- Research includes Stack push/pop, Pills, and Tic-tac-toe training pairs, animated once with replay
  controls, and two task-derived hero assets. The diagrams use the source grids
  and palette. See `assets/arctic/README.md` for source, attribution, and rebuilding.
- `prefers-reduced-motion` shows the full vines and static product marks and
  keeps the existing still-image fallback for the mascot.
- The mobile drawer supports Escape, Tab focus containment, focus return,
  and an inert background. Links and buttons have visible keyboard focus.

## Pages

| Route             | File            | Content                                   |
|-------------------|-----------------|-------------------------------------------|
| `/`               | `index.html`    | Hero, introduction, three-step approach, products & ARCTIC |
| `/products.html`  | `products.html` | vsmlite + opensiro detail blocks            |
| `/research.html`  | `research.html` | ARCTIC detail + stats + CTA               |

Each page shares the same sticky header (logo + Products/Research nav), footer
(copyright + social icon-buttons), and mobile drawer. The active nav item is
marked with `.active` in markup and re-asserted by `app.js` from
`location.pathname`.

## Links

Inter-page links are relative. External product links point at GitHub:

- `https://github.com/opensiro/terminal-bench-vsm` — vsmlite repo
- `https://github.com/opensiro/arctic-0` — ARCTIC-0 public archive

Social links are placeholders: `twitter.com/opensiro`, `youtube.com/@opensiro`,
`discord.gg/opensiro`.

## Run

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
# → http://localhost:8000/
# → http://localhost:8000/products.html
# → http://localhost:8000/research.html
```

## Deploy

Push to any static host (GitHub Pages, Netlify, etc.). No build, no
`npm install`. When migrating to a framework, the shared header/footer/nav are
the natural extraction points into a layout component.

## License & attribution

The following licenses apply to this repository:

| Component | License | Owner |
|-----------|---------|-------|
| Landing source (HTML, CSS, JS) + mascot artwork | **MIT** | © 2026 opensiro |
| `Departure Mono` typeface (`assets/DepartureMono-Regular.*`) | **SIL Open Font License 1.1 (OFL-1.1)** | © 2022–2024 Helena Zhang |
| ARCTIC-0 training pairs and derived grid diagrams (`assets/arctic/`, embedded in `research.html`) | **CC BY 4.0** | ARCTIC authors; see `assets/arctic/README.md` |

- The MIT license covers the landing code and the opensiro mascot. Full text:
  [`LICENSE`](LICENSE).
- **Departure Mono** by Helena Zhang ([departuremono.com](https://departuremono.com))
  is licensed under the OFL-1.1. Full text:
  [`assets/DepartureMono-OFL.txt`](assets/DepartureMono-OFL.txt).

**Required when copying or modifying this repository:** if you keep or adapt
the Departure Mono font, you must (a) credit "Departure Mono by Helena Zhang",
and (b) retain the OFL-1.1 text in `assets/DepartureMono-OFL.txt`. The font
cannot be relicensed under MIT or any other license.
