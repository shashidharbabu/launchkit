# Components

Base layer: shadcn/ui on the Base UI backend (`stack.md`). Everything below
is either a themed shadcn component or a Launch Kit composite built from
them. All components consume tokens only. Interactive targets ≥ 40px tall
(44px on touch); every control keyboard-reachable with the cobalt focus
ring; every icon from Lucide at `strokeWidth={1.5}`, labeled or
`aria-label`ed — no icon-only mystery buttons, no emoji as icons.

## App shell & stage rail

The workspace frame: project header (name, live-site link, run-history
button) above a horizontal **stage rail** — the six-stage procedure line.

- Stage item: meta label (`01 PROFILE`), Plex Mono 11 uppercase.
  Active: ink text + 2px ember underline. Inactive: faint, hover wash via
  `AnimatedBackground` (`motion.md`). Locked (pre-Gate-1): faint at 50%,
  lock icon, tooltip **"Approve the profile to unlock"** — visible, never
  hidden; gates that 409 server-side must look locked client-side.
- Stage state dot on each item: go/hold/nogo/faint per stage status.
- Each tab is a route (`/p/[id]/assets`) — deep-linkable, back-button safe.
- The rail is the app's only navigation; nothing nests deeper than a stage.

## Button

Sharp corners (`rounded-sm` = 0), height 36px (32px compact in tables),
padding-x 14px, body 14/500.

| Variant | Recipe | Use |
| --- | --- | --- |
| Primary | `bg-primary text-primary-foreground hover:bg-primary-hover` | The one ember verb per view |
| Secondary | `bg-secondary text-secondary-foreground hover:bg-muted border border-border` | Everything else (Copy, Regenerate) |
| Ghost | `hover:bg-accent text-foreground` | Table row actions, icon+label pairs |
| Destructive | `bg-nogo text-nogo-foreground` | Dismiss project, delete — always confirmed |

States: hover 120ms wash; active translate-y-[0.5px]; disabled 50% +
`cursor-not-allowed`; **loading** = spinner replaces icon, label switches
to the progressive verb ("Approving…"), width locked to prevent reflow.

## Gate Slip — the signature

A `bg-card border border-border` sheet, sharp corners, no shadow (it lies
on the desk, it doesn't float).

```
┌─────────────────────────────────────────────┐
│ GATE 01 — PROFILE                    [HOLD] │  ← meta row: label + stamp
│ ─────────────────────────────────────────── │  ← hairline
│ One-liner, ICP, differentiators, proof…     │  ← the thing being approved
│ drafted from repo + site · aug 11           │  ← provenance line
│ ─────────────────────────────────────────── │
│ [Approve profile]   [Regenerate with notes] │  ← ember verb + secondary
└─────────────────────────────────────────────┘
```

- Header: `text-meta` mono label left, `StatusStamp` right.
- Approving fires the **stamp**: a `GO` stamp lands on the slip
  (scale 1.15 → 1.0 + fade-in, `--duration-stamp`, spec in `motion.md`),
  then the slip collapses (180ms height) to a signed row:
  `GO — profile approved · aug 11 · [View] [Re-open]`.
- "Regenerate with notes" opens an inline textarea (Disclosure), label
  **"What should change?"**, submit = secondary "Regenerate". Feedback
  threads to `BUILDER_FEEDBACK`.
- Gate 1 editing: profile fields render as editable cards (field label =
  meta type, value = Reading type); per-field edits save as a new draft
  version; JSON view is a toggle, never the default.

## StatusStamp

Mono uppercase chip: `text-meta`, 1px solid border, sharp, px-1.5 py-0.5,
tinted fill at 10% + full-strength border and text.

| Stamp | Border/text | Fill | Extra |
| --- | --- | --- | --- |
| `GO` | `go` | go/10% | |
| `HOLD` | `hold` | hold/10% | |
| `NO-GO` | `nogo` | nogo/10% | |
| `UNVERIFIED` | `unverified` | none | dashed border |
| `RUNNING` | `link` (cobalt) | link/10% | TextShimmer on the word |

Text is always present. Optional 12px Lucide icon before the word
(check / clock / x / help-circle / loader).

## ProvenanceLine

`text-meta` lowercase (the one lowercase mono use), `text-muted-foreground`,
dot-separated: `drafted from repo + site · aug 11` ·
`verified against thread · algolia` · `re-scored · passed`. Sits directly
under the content it describes, 8px gap. Every AI artifact has one; an
artifact without provenance is a spec violation.

## SignalCard (reply queue)

`bg-card border border-border`, 16px padding, stacked:

1. **Source row** — venue icon + linked thread title (cobalt, external-link
   icon), age in Data mono right-aligned, stamp (`GO`-verified /
   `UNVERIFIED`).
2. **The ask** — quoted thread excerpt, Reading 16/26, 2px left rule in
   `border`.
3. **Drafted reply** — inset `bg-muted` well, Body 14, provenance line
   under it.
4. **Actions** — Copy reply (secondary) · Mark replied (ghost, go check on
   done) · Dismiss (ghost).

Mark replied / Dismiss animate the card out (collapse, 180ms `--ease-exit`)
— the queue's only motion. Queue header shows honest counts:
`7 verified · 2 unverified` in Data mono.

## AssetCard

Header: asset-type meta label (`SHOW HN`, `X POST`…) + stamp. Body: the
draft, Reading type, in a `bg-muted` well (platform-native formatting
preserved, mono for anything the user will paste as code). Provenance line.
Actions: Approve (primary while it's this view's verb) · Copy · Regenerate
with feedback (same Disclosure pattern as the Gate Slip). Approved assets
show the `GO` stamp and demote Approve.

## Table (Targets, Attribution, Run history)

TanStack Table v9 headless + these visuals:

- Header: `text-meta` mono uppercase, faint, `border-b` hairline, sortable
  columns get a chevron + `aria-sort`.
- Rows: 40px, horizontal hairlines only — **no vertical rules, no zebra**
  (the datasheet look is ruled paper, not a spreadsheet grid).
- Numbers: right-aligned, `.tabular`, Data mono for counts/refs.
- Hover: `bg-accent` wash. Selection (Targets): left checkbox column,
  selected rows get a 2px ember left rule.
- Ranked venues: rank in Data mono, score as a thin inline bar
  (`chart-2` cobalt, 4px) + value label — never color-only.
- Empty/loading: skeleton rows ≥300ms; honest-empty rows per `voice.md`.
- >50 rows: paginate or virtualize (TanStack Virtual, `useFlushSync: false`).

## RefChip (tracked links)

The attribution ref rendered as a copyable chip: Data mono, ember text,
`bg-primary/10` fill, sharp. `lk_reddit_ossinsight` + copy icon; click
copies the full URL, icon swaps to a go check for 1.5s, toast "Link
copied". The plan table pairs each selected venue with its RefChip —
this is the payoff row: *"OSSInsight — 3 signups."*

## Forms

- Labels: visible, above, Body 14/500 — never placeholder-as-label.
- Inputs: `bg-card border border-input` sharp, height 36px, focus = cobalt
  ring. Helper text faint below; errors replace helper in `nogo` with an
  alert-circle icon, field border goes `nogo`. Errors sit at the field,
  not just a top summary.
- Textareas (feedback, notes): min 3 rows, autogrow to 8.
- Submit follows Button loading spec; success confirms via toast +
  in-place state change, never silence.

## Dialogs, drawers, menus, toasts (floating layer)

Floating = `rounded-lg` (4px) + `shadow-float` — the only rounded, shadowed
things in the system. shadcn Dialog/Sheet/DropdownMenu/Command on Base UI;
enter/exit via tw-animate-css `data-[state]` classes at `--duration-base`.
Toasts: sonner, bottom-right, 4s, verb-echo copy ("Approved", "Copied",
"3 venues added to plan") with an undo action where reversible. Command
palette (`Cmd+K`): shadcn Command — projects, stages, "copy ref link",
"restart pipe" (dev).

## Empty states & running states

- **Honest-empty** (a Launch Kit signature — the product refuses fake
  value): state the fact, the reason, the next act. Copy patterns in
  `voice.md`. Layout: Heading + Body faint + one secondary action,
  left-aligned in the content column — never a centered illustration.
- **Running:** pipeline jobs show a `RUNNING` stamp + TextShimmer status
  line ("Analyzing repo…", "Search pass 2 of 4…") + elapsed in Data mono.
  Jobs >30s add "usually ~2 min". Failures show the real error and a Retry
  secondary — the backend already retries; say so.

## Run history panel

Side sheet (floating layer): reverse-chron rows — stamp, stage name (Body),
duration + timestamp (Data mono, right). Auto-refresh while any job runs;
a failed run's row expands (Disclosure) to the error text in a mono well.
