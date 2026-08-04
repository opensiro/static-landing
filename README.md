# opensiro-web

Static multi-page site for **opensiro** — the company building the toolchain for
organizations that compile, and the ARCTIC reasoning benchmark.

The design language is a faithful, monochrome adaptation of the our
aesthetic: a single monospace typeface (DepartureMono), warm off-white
background, sharp corners, 1px hairline borders, invert-on-hover, centered
sparse compositions. Built as plain html/css/js now; structured to migrate
cleanly to a framework later.

## Stack

Plain static site — **no build step, no dependencies, no framework.** All fonts and mascot artwork are bundled locally and served from `assets/`.

```
opensiro-web/
├── index.html       # landing — hero, mission, products & research previews
├── products.html    # foundry + vsmforge detail
├── research.html    # ARCTIC detail
├── globals.css      # tokens, @font-face, components (monochrome monochrome)
├── app.js           # active-nav highlight + mobile nav drawer
├── assets/
│   ├── DepartureMono-Regular.woff2
│   ├── DepartureMono-Regular.woff
│   ├── mascot-logo.gif      # legacy animated source (not used in hero)
│   ├── mascot-logo.png      # stable hero + nav mascot
│   ├── mascot-favicon.png   # alternate square mascot icon
│   └── favicon-64x64.png    # wider browser + touch icon
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

**Signature rules :**
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
| `/products.html`  | `products.html` | foundry + vsmforge detail blocks          |
| `/research.html`  | `research.html` | ARCTIC detail + stats + CTA               |

Each page shares the same sticky header (logo + Products/Research nav), footer
(copyright + social icon-buttons), and mobile drawer. The active nav item is
marked with `.active` in markup and re-asserted by `app.js` from
`location.pathname`.

## Links

Relative links point at sibling repos within `Opensiro Collections/` (work
locally; swap for GitHub URLs on deploy):

- `../../foundry` — foundry repo (discovery layer)
- `../../vsmforge` — vsmforge repo (compiler)
- `../../opensiro-arctic` — ARCTIC collection
- `../concept-site` — UI concept prototypes
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
