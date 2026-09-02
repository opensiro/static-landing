# ARCTIC-0 animated training examples

These assets reproduce exact public training pairs of three tasks from
[opensiro/arctic-0](https://github.com/opensiro/arctic-0), archive version 0.6.2,
commit `3d1b854ee89535ce84ef5963f01abf8ce9bc2e40`.

Source: [dataset/arctic-0-85-0.6.2.json](https://github.com/opensiro/arctic-0/blob/3d1b854ee89535ce84ef5963f01abf8ce9bc2e40/dataset/arctic-0-85-0.6.2.json).

| Asset | Original task | Task ID | Pair |
| --- | --- | --- | --- |
| `stack.svg` | Stack, push/pop | 1767028625967 | train[0] |
| `pills.svg` | Pills consuming by diff groups | 1767105401430 | train[1] |
| `tic-tac-toe.svg` | Tic-tac-toe catching | 1767106585316 | train[0] |

Each asset also has a `-pair.svg` version that shows the unchanged input beside
the animated reference answer. `samples.json` contains only these public
training pairs and the original palette from the repository's task editor.

The animation is an adaptation for presentation. It is not a model run or a
record of model reasoning. The final grids match the supplied answers cell for
cell. Intermediate motion and timing are illustrative. The stack transfers six
elements in pop/push order. Pills consumes twelve supply cells and updates two
groups. Tic-tac-toe reveals the supplied marks and final line on the tilted board.
Animation runs once, takes at most 4.8 seconds, and falls
back to the complete answer with reduced motion. Page controls allow replay.

## Attribution and license

Dataset: **CC BY 4.0**, as declared in the
[upstream README](https://github.com/opensiro/arctic-0/blob/3d1b854ee89535ce84ef5963f01abf8ce9bc2e40/README.md#license).
License: https://creativecommons.org/licenses/by/4.0/

ARCTIC authors credited upstream: Alex Zhdanov, Artem-Darius Weber, Egor
Kolychev, Artem Ligostaev, Veronika Rastorgueva, and Alekseii Sergeevich Prutskii.
Source dataset and attribution remain under CC BY 4.0. The site's MIT license
does not replace those terms. Changes: selected public training pairs, short
English display titles, SVG rendering, and animation timing.

## Regenerate

```sh
python scripts/build-arctic-assets.py
```

The generator uses the checked-in subset, requires only the Python standard
library, and makes no network requests. It emits six SVG assets and updates the
gallery in `research.html` automatically. The paired versions are embedded in the
page so it can replay them without loading a framework.

## Research workflow

`workflow.drawio.svg` is the original diagram supplied by the project owner
from `ARC-TIC-0/neurips_2026/assets`. It is preserved unchanged for reference.
The responsive HTML/CSS adaptation lives in `research.html` and `globals.css`;
it is independent of the training-example generator above. The diagram describes
the proposed evaluation protocol, with small language models as the evaluated
students. It is not a report of completed evaluation runs.
