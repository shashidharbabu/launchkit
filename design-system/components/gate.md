# The Gate

Source: `design-system/src/components/gate.tsx` (`GateSlip`, `GateGlyph`).
Specimen: `/design#gate` (interactive) and the landing page preview.

The signature element. A gate is where a human decides, and it is drawn to feel like a
decision: a panel, one verb, a release.

## Anatomy, unsigned

```
┌──────────────────────────────────────────────────────┐
│ [1] Gate 1                             Needs review  │  glyph (flare outline), label, stamp
│                                                      │
│ Profile                                              │  text-title
│ Launch Kit read your repo and site and wrote down    │  text-body muted, max-w-reading
│ what it thinks your app is. Check the four things    │
│ below, fix anything wrong, then approve.             │
│                                                      │
│ ...the thing being approved (children)...            │  px-5 py-5
│ drafted from repo and site | v2                      │  provenance line
├──────────────────────────────────────────────────────┤
│ [This is right. Approve] [Save my edits] [Redo it]   │  CardFooter on sunken/40
│                                        [View raw]    │
└──────────────────────────────────────────────────────┘
```

Props: `gate` (1, 2 or 3), `title`, `description`, `stamp` (default `hold`), `signed`,
`signedLine`, `provenance`, `actions`, `reopenActions`, `children`.

## The verb

The approve button is `variant="flare"`, the only flare button on the screen, and its
label states the decision in the person's words: "This is right. Approve". When edits are
unsaved it reads "Save your edits first", is disabled, and carries a `title` explaining
why. Secondary actions sit beside it; tertiary ones are pushed right.

## The release

When `signed` flips from false to true (and motion is not reduced):

1. A 2px go-colored line sweeps across the top edge, origin left, 480ms standard ease.
2. A translucent veil fades over the panel (200ms) and an "Approved" seal springs in
   at its centre (spring 420 / 34, 140ms delay): a go pill with a check, `text-body`
   semibold.
3. 980ms after the flip, the panel exits (height and opacity, 200ms exit ease) and the
   signed row enters (fade and 4px rise).

While the release plays nothing else on the screen moves, and the change is detected
during render (not in an effect) so it starts the same frame the state changes. Under
reduced motion the panel goes straight to the signed row.

## Anatomy, signed

A single 56px card row: the glyph filled go with a check, the Approved stamp, the title
in medium with the signed line in muted ("approved on 11 Aug, v2"), then ghost **View**
and secondary **Re-open**. View expands the panel read-only with a Collapse action;
Re-open expands it with `reopenActions` (edit, regenerate; never Approve again).

## The glyph

`GateGlyph`: a 24px rounded square (7px radius) with the gate number in mono. Tones:
`muted` outline, `flare` outline (an open gate), `go` filled with a check (a signed
gate). The same glyph appears on the landing timeline and in the rail's gantry nodes at
32px.

## Where gates appear

| Gate | Stage | What is approved |
| --- | --- | --- |
| 1 | Profile | The app profile. Locks every later stage until signed. |
| 2 | Assets | Each launch post, one gate row per asset card (the first pending card's Approve is flare; the rest are secondary). |
| 3 | Targets | Venue selection, expressed as checkboxes in the table rather than a panel. |

Only Gate 1 uses the full panel. Gates 2 and 3 borrow the vocabulary (the stamp, the
verb, the provenance) inside their own components.

## Don't

- No second flare element on a gate screen.
- No confetti, no sound, no toast on approval: the release is the feedback (a short
  "Approved" toast is acceptable when the panel is off-screen).
- No gate without a provenance line.
- No approve without a way to say what is wrong (the redo or regenerate action).
