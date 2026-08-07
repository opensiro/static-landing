# opensiro-web

Static multi-page site for **opensiro** — the company building the toolchain for
organizations that compile, and the ARCTIC reasoning benchmark.

The design language is monochrome monospace: a single typeface
(DepartureMono), warm off-white background, sharp corners, 1px hairline
borders, invert-on-hover, centered sparse compositions. Built as plain
html/css/js now; structured to migrate cleanly to a framework later.

## Stack

Plain static site — **no build step, no dependencies, no framework.** All fonts and mascot artwork are bundled locally and served from `assets/`.

Runtime remains dependency-free. Regenerating the stabilized mascot GIF requires Pillow:
`uv run --no-project --with pillow python scripts/stabilize-mascot-gif.py`.

```
opensiro-web/
├── index.html       # landing — hero, mission, products & research previews
├── products.html    # vsmlite + opensiro detail
├── research.html    # ARCTIC detail
├── globals.css      # tokens, @font-face, components (monochrome monospace)
├── app.js           # active-nav highlight + mobile nav drawer
├── assets/
│   ├── DepartureMono-Regular.woff2
│   ├── DepartureMono-Regular.woff
│   ├── DepartureMono-OFL.txt    # Departure Mono license (OFL-1.1)
│   ├── mascot-logo.gif        # stabilized animated hero mascot
│   ├── mascot-logo.png        # reduced-motion fallback + nav mascot
│   ├── mascot-favicon.png     # alternate square mascot icon
│   └── favicon-64x64.png      # wider browser + touch icon
├── scripts/
│   └── stabilize-mascot-gif.py
└── README.md
```

## Design language

| Token        | Value                              | Notes                          |
|--------------|------------------------------------|--------------------------------|
| `--bg`       | `#faf9f6`                          | warm off-white, NOT pure white |
| `--ink`      | `#18181b`                          | zinc-900 text                  |
| `--hairline` | `rgba(0,0,0,.10)`                  | section/button dividers        |
| `--tint`     | `rgba(0,0,0,.04)`                  | 4% section wash                |
| `--accent`   | `#2f6df6`                          | micro-accent: status dots only |
| `--font`     | `'DepartureMono', monospace`       | one typeface, everywhere       |
| `--maxw`     | `1280px`                           | content width                  |

**Signature rules:**
- **Sharp corners** — `border-radius:0` everywhere except 6px status dots.
- **1px hairline borders** that fully invert on hover (fill ↔ outline swap).
- **Uppercase + wide tracking** — nav `.05em`, section labels `.3em`, product names `.15em`.
- **Centered, sparse composition** — generous whitespace (`py:96px` sections),
  modest type sizes; hierarchy by tracking/weight, not size.
- **Dividers, not cards** — products separated by hairline lines, no boxed backgrounds.

## Pages

| Route             | File            | Content                                   |
|-------------------|-----------------|-------------------------------------------|
| `/`               | `index.html`    | Hero, mission, products & research previews |
| `/products.html`  | `products.html` | vsmlite + opensiro detail blocks            |
| `/research.html`  | `research.html` | ARCTIC detail + stats + CTA               |

Each page shares the same sticky header (logo + Products/Research nav), footer
(copyright + social icon-buttons), and mobile drawer. The active nav item is
marked with `.active` in markup and re-asserted by `app.js` from
`location.pathname`.

## Links

Inter-page links are relative. External product links point at GitHub:

- `https://github.com/opensiro/terminal-bench-vsm` — vsmlite repo
- `https://siroarctic.com` — ARCTIC benchmark site (external)

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

Two licenses apply to this repository:

| Component | License | Owner |
|-----------|---------|-------|
| Landing source (HTML, CSS, JS) + mascot artwork | **MIT** | © 2026 opensiro |
| `Departure Mono` typeface (`assets/DepartureMono-Regular.*`) | **SIL Open Font License 1.1 (OFL-1.1)** | © 2022–2024 Helena Zhang |

- The MIT license covers the landing code and the opensiro mascot. Full text:
  [`LICENSE`](LICENSE).
- **Departure Mono** by Helena Zhang ([departuremono.com](https://departuremono.com))
  is licensed under the OFL-1.1. Full text:
  [`assets/DepartureMono-OFL.txt`](assets/DepartureMono-OFL.txt).

**Required when copying or modifying this repository:** if you keep or adapt
the Departure Mono font, you must (a) credit "Departure Mono by Helena Zhang",
and (b) retain the OFL-1.1 text in `assets/DepartureMono-OFL.txt`. The font
cannot be relicensed under MIT or any other license.
