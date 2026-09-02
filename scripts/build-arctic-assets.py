"""Generate exact, animated grid diagrams from three public ARCTIC-0 pairs.

Default input is the checked-in subset. To refresh it from the upstream archive:
python scripts/build-arctic-assets.py --archive path/to/arctic-0-85-0.6.2.json
"""
import argparse
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets' / 'arctic'
COMMIT = '3d1b854ee89535ce84ef5963f01abf8ce9bc2e40'
SOURCE = f'https://github.com/opensiro/arctic-0/blob/{COMMIT}/dataset/arctic-0-85-0.6.2.json'
COLORS = ['#000000', '#0074D9', '#FF4136', '#2ECC40', '#FFDC00', '#AAAAAA', '#F012BE', '#FF851B', '#7FDBCA', '#870C25']
SELECTION = [
    ('1767028625967', 0, 'stack', 'Follow the stack operations', 'Pop elements into the middle stack, then push the incoming elements onto the left stack.'),
    ('1767105401430', 1, 'pills', 'Track the remaining supply', 'Process two group requests in order. Watch the supply shrink and the group states change.'),
    ('1767106585316', 0, 'tic-tac-toe', 'Read the game across views', 'Map the game state into the tilted board, then reveal the resulting line.'),
]

def cell(row, col, value, extra=''):
    return f'<rect x="{col * 16 + 1}" y="{row * 16 + 1}" width="15" height="15" fill="{COLORS[value]}" {extra}/>'

def grid(values):
    return ''.join(cell(r, c, v) for r, row in enumerate(values) for c, v in enumerate(row))

def output_diagram(sample):
    inp, out, slug = sample['input'], sample['output'], sample['slug']
    # Inline SVG styles share the page namespace, so every selector is scoped.
    css = [f'@keyframes {slug}-appear{{from{{opacity:0}}to{{opacity:1}}}}']
    if slug == 'stack':
        moves = [(2, 1, 8, 3), (3, 1, 7, 3), (4, 1, 6, 3),
                 (6, 5, 4, 1), (7, 5, 3, 1), (8, 5, 2, 1)]
        base = [row[:] for row in inp]
        for sr, sc, _, _ in moves:
            base[sr][sc] = 0
        final = [row[:] for row in base]
        groups = []
        for i, (sr, sc, dr, dc) in enumerate(moves):
            value = inp[sr][sc]
            assert value and out[dr][dc] == value
            final[dr][dc] = value
            dx, dy, lift = (sc - dc) * 16, (sr - dr) * 16, -dr * 16
            start = 12 + i * 10
            name = f'stack-transfer-{i}'
            css.append(f'@keyframes {name}{{0%,{start}%{{transform:translate({dx}px,{dy}px)}}'
                       f'{start + 3}%{{transform:translate({dx}px,{lift}px)}}'
                       f'{start + 6}%{{transform:translate(0,{lift}px)}}'
                       f'{start + 10}%,100%{{transform:translate(0,0)}}}}')
            css.append(f'.{name}{{animation:{name} 4.8s steps(3,end) both}}')
            groups.append(f'<g class="sample-motion {name}" data-origin="{sr},{sc}">{cell(dr, dc, value)}</g>')
        assert final == out, 'Stack moves must reproduce the reference answer.'
        return grid(base) + '\n' + '\n'.join(groups), css
    changed = [(r, c, v) for r, row in enumerate(out) for c, v in enumerate(row) if v != inp[r][c]]
    stages = []
    if slug == 'pills':
        consumed = sorted((r, c, v) for r, c, v in changed if c < 9)
        first_group = [(r, c, v) for r, c, v in changed if c > 10 and r <= 2]
        second_group = [(r, c, v) for r, c, v in changed if c > 10 and 4 <= r <= 6]
        assert len(consumed) == 12 and len(first_group) == 5 and len(second_group) == 4
        # The first request's three consumed cells also match train[0].
        stages += [(pos, .8 + i * .18) for i, pos in enumerate(consumed[:3])]
        stages += [(pos, 1.4) for pos in first_group]
        stages += [(pos, 1.9 + i * .18) for i, pos in enumerate(consumed[3:])]
        stages += [(pos, 3.5) for pos in second_group]
    elif slug == 'tic-tac-toe':
        # Reveal supplied marks first, then the supplied final line.
        for value, start in [(3, .8), (2, 1.8), (6, 3.2)]:
            group = [(r, c, v) for r, c, v in changed if v == value]
            stages += [(pos, start + i * .04) for i, pos in enumerate(group)]
    else:
        raise ValueError(f'Unknown sample: {slug}')
    assert {pos for pos, _ in stages} == set(changed) and len(stages) == len(changed)
    assert all(delay + .01 < 4.8 for _, delay in stages)
    css.append(f'.{slug}-change{{animation:{slug}-appear .01s steps(1,end) both}}')
    overlays = [cell(r, c, v, f'class="sample-motion {slug}-change" style="animation-delay:{delay:.2f}s"')
                for (r, c, v), delay in stages]
    return grid(inp) + '\n' + '\n'.join(overlays), css

def svg(sample, pair=False):
    cols, rows = len(sample['input'][0]), len(sample['input'])
    width, height = cols * 16 + 1, rows * 16 + 1
    assert len(sample['output']) == rows and all(len(row) == cols for row in sample['input'] + sample['output'])
    title = escape(sample['title'])
    output, css = output_diagram(sample)
    css.append('@media(prefers-reduced-motion:reduce){.sample-motion{animation:none!important;opacity:1;transform:none}}')
    style = '<style>\n' + '\n'.join(css) + '\n</style>'
    background = f'<rect width="{width}" height="{height}" fill="#272727"/>'
    diagram = background + output
    if pair:
        gap, pad = 48, 10
        mid, y = pad + width + gap // 2, pad + height / 2
        body = f'<g data-grid="input" transform="translate({pad} {pad})">{background}{grid(sample["input"])}</g>'
        body += f'<path d="M{mid - 8} {y}h16m-5-5 5 5-5 5" fill="none" stroke="#6e6e68" stroke-width="1.5"/>'
        body += f'<g data-grid="output" transform="translate({pad + width + gap} {pad})">{diagram}</g>'
        viewbox = f'0 0 {width * 2 + gap + pad * 2} {height + pad * 2}'
    else:
        body, viewbox = f'<g data-grid="output">{diagram}</g>', f'0 0 {width} {height}'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" role="img" aria-label="{title}: input to supplied reference answer" shape-rendering="crispEdges">
<title>{title}</title><desc>ARCTIC-0 training example {sample['train_index'] + 1}. Animated presentation of the supplied answer, not a model run. Task {sample['id']}. Dataset CC BY 4.0. {escape(SOURCE)}</desc>
{style}{body}
</svg>'''

def gallery(samples):
    cards = []
    labels = ['Stack / push + pop', 'Groups / resource state', 'Game / perspective']
    for i, sample in enumerate(samples):
        diagram = svg(sample, pair=True).replace('role="img"', 'class="sample-diagram" role="img"')
        wide = ' sample-card-wide' if sample['slug'] == 'tic-tac-toe' else ''
        cards.append(f'''      <figure class="sample-card{wide}" data-sample="{sample['slug']}">
        <div class="sample-topline"><span>0{i + 1} / {labels[i]}</span><span>ARCTIC-0</span></div>
        <div class="sample-grid-labels" aria-hidden="true"><span>Input</span><span>Reference answer</span></div>
        {diagram}
        <figcaption><p class="sample-task-name">{escape(sample['name'])}</p><h3>{escape(sample['title'])}</h3><p>{escape(sample['caption'])}</p></figcaption>
        <button class="sample-replay text-link" type="button" hidden aria-label="Replay animation: {escape(sample['title'].lower())}"><span aria-hidden="true">↻</span> Replay</button>
      </figure>''')
    return '    <div class="sample-grid">\n' + '\n'.join(cards) + '\n    </div>\n'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--archive', type=Path)
    args = parser.parse_args()
    DEST.mkdir(parents=True, exist_ok=True)
    if args.archive:
        archive = json.loads(args.archive.read_text(encoding='utf-8'))
        selected = []
        for task_id, index, slug, title, caption in SELECTION:
            task = next(t for t in archive['tasks'] if t['id'] == task_id)
            pair = task['examples']['train'][index]
            selected.append(dict(id=task_id, slug=slug, title=title, caption=caption, name=task['name'], tags=task['tags'], train_index=index, **pair))
        data = dict(repository='opensiro/arctic-0', commit=COMMIT, source=SOURCE, archive_version='0.6.2', license='CC BY 4.0', palette=COLORS, samples=selected)
        (DEST / 'samples.json').write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
    else:
        data = json.loads((DEST / 'samples.json').read_text(encoding='utf-8'))
    for sample in data['samples']:
        for pair, suffix in [(False, ''), (True, '-pair')]:
            (DEST / f'{sample["slug"]}{suffix}.svg').write_text(svg(sample, pair), encoding='utf-8')
    page = ROOT / 'research.html'
    html, count = re.subn(r'    <div class="sample-grid">.*?(?=    <p class="sample-credit">)',
                         lambda _: gallery(data['samples']), page.read_text(encoding='utf-8'), flags=re.S)
    assert count == 1, 'Expected one research gallery.'
    page.write_text(html, encoding='utf-8')
    print('Generated six SVG assets and updated the research gallery.')

if __name__ == '__main__':
    main()
