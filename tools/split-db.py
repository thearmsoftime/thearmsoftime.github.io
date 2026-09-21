#!/usr/bin/env python3
"""
One-shot migration: the old research/timelines.json -> the split tree in data/.

Run once, on 2026-09-12. The source file is gone; the tree below is
the database. Kept in the repo so the shape change stays readable.

    data/meta.json                 the few global numbers
    data/timelines/<id>.json       one timeline (was "zone")
    data/bands/<id>.json           bands grouped by the timeline they start on
    data/events/<group>/<id>.json  one file per event

An event knows which timelines it is on, and carries its settings per
timeline. That replaces `keyEvents` on the timeline and the single global
`landmark` flag.
"""
import json
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'research' / 'timelines.json'
OUT = ROOT / 'data'

# Which folder an event or band file lands in, from the letter its id starts
# with. There is no `life` folder: every life event starts as an earth one.
GROUP = {'u': 'universe', 'e': 'earth', 'h': 'humans', 'm': 'modern'}

# Field order in the written files, so a hand edit sits where you expect it.
EVENT_ORDER = [
    'id', 'label', 'description', 'yearsAgo', 'endYearsAgo', 'uncertaintyYears',
    'generationsAgo', 'certainty', 'wikipedia', 'source', 'sourceTitle',
    'watch', 'watchTitle', 'timelines',
]
BAND_ORDER = [
    'id', 'label', 'kind', 'fromYearsAgo', 'toYearsAgo',
    'wikipedia', 'source', 'sourceTitle', 'timelines',
]
TIMELINE_ORDER = [
    'id', 'label', 'spanYears', 'spanUncertaintyYears', 'spanGenerations',
    'startLabel', 'endLabel', 'note', 'wikipedia', 'source', 'sourceTitle',
]


def ordered(obj, order):
    """Known keys first in `order`, anything unexpected kept after them."""
    out = {k: obj[k] for k in order if k in obj and obj[k] is not None}
    out.update({k: v for k, v in obj.items() if k not in order})
    return out


def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def group_of(id_):
    return GROUP.get(id_.split('-')[0], 'other')


def main():
    db = json.loads(SRC.read_text(encoding='utf-8'))

    for folder in ('timelines', 'bands', 'events'):
        shutil.rmtree(OUT / folder, ignore_errors=True)

    write(OUT / 'meta.json', db['meta'])

    # The short list moves off the timeline and onto each event, so look up
    # which timelines called an event key before dropping `keyEvents`.
    key_on = {}
    for tl in db['zones']:
        for event_id in tl.get('keyEvents', []):
            key_on.setdefault(event_id, set()).add(tl['id'])

    for tl in db['zones']:
        tl = {k: v for k, v in tl.items() if k != 'keyEvents'}
        write(OUT / 'timelines' / f"{tl['id']}.json", ordered(tl, TIMELINE_ORDER))

    # Bands stay grouped: there are sixty of them and nothing to set per
    # timeline, so a file each would be sixty files of four lines.
    grouped = {}
    for band in db['bands']:
        band['timelines'] = band.pop('zones')
        grouped.setdefault(group_of(band['id']), []).append(ordered(band, BAND_ORDER))
    for name, bands in grouped.items():
        write(OUT / 'bands' / f'{name}.json', bands)

    for event in db['events']:
        on = event.pop('zones')
        landmark = event.pop('landmark', False)
        keys = key_on.get(event['id'], set())
        event['timelines'] = {
            tl: ({'simple': tl in keys, 'landmark': True} if landmark else {'simple': tl in keys})
            for tl in on
        }
        write(OUT / 'events' / group_of(event['id']) / f"{event['id']}.json",
              ordered(event, EVENT_ORDER))

    print(f"meta 1, timelines {len(db['zones'])}, bands {len(db['bands'])} "
          f"in {len(grouped)} files, events {len(db['events'])}")


if __name__ == '__main__':
    main()
