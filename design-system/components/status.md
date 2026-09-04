# Status

Source: `design-system/src/components/status-stamp.tsx`, `design-system/src/components/provenance-line.tsx`,
`components/launchkit/running-indicator.tsx`. Specimen: `/design#status`.

## Status stamp

A pill with a soft tint, an icon, and a word. The word is fixed vocabulary; the color is
never the only carrier.

| Kind | Word | Tint | Icon | Meaning |
| --- | --- | --- | --- | --- |
| `go` | Approved | go-soft / go-text | check | A human signed it |
| `hold` | Needs review | hold-soft / hold-text | clock | Drafted, waiting for a human |
| `nogo` | Failed | nogo-soft / nogo-text | x | A run failed |
| `unverified` | Unverified | outline | help circle | Could not be checked against its source |
| `running` | Running | flare-soft / flare-text | spinner | Work in progress |
| `queued` | Queued | neutral | clock | Waiting to run |
| `none` | Not started | neutral | | Nothing yet |

`label` overrides the word when a stage has a more specific one: "Verified", "Read",
"Failed", "Connected", "Unreachable", "Profile approved", "Ready". The kind still sets
the tint, so meaning stays consistent.

Height 24px, `text-label` (13px, 500), `rounded-full`, `px-2.5`. Icons 12px at stroke 2.5.

## Badge

The same pill without fixed vocabulary, for counts and kinds: "12 signals", "2 running",
"established", "1 of 4". Tones: `neutral`, `flare`, `go`, `hold`, `nogo`, `outline`.
Counts in the page header are badges; status on an object is a stamp.

## Where status appears

- Table cells (Profile, Plan, Status columns).
- Card headers, on the right, beside the actions.
- The gate header.
- The rail's gantry nodes (fill by state) and the mobile stage strip (check when
  approved).
- Never floating in a paragraph; never two stamps for one object.

## Running indicator

A pill with a flare spinner, a shimmering line naming the work in the person's words
("Reading your live site", "Ranking launch venues"), and the elapsed time in mono. Over
30 seconds it adds the usual duration ("of ~2m"). It sits in the workspace header on the
right; a stage may also show the shimmering line alone inside a card while its own job
runs.

## Provenance line

Every AI-drafted artifact carries one, directly under the content: where it came from and
whether it was verified. `font-mono text-data text-muted-foreground`, sentence case, parts
separated by a 1px hairline rather than dots.

Examples: "drafted from repo and site | v2", "drafted from approved profile | verified
against thread", "ranked from approved profile | venue rules summarized, verify before
posting". A provenance line is never omitted from a draft and never promoted to a
heading.
