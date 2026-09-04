# Navigation

Source: `components/launchkit/app-sidebar.tsx`, `components/launchkit/stage-rail.tsx`,
`components/launchkit/app-shell.tsx`, `components/launchkit/landing-nav.tsx`.
Pattern: `patterns/app-shell.md`.

## The rail

One 264px column on `bg-sidebar` with a right hairline. Top to bottom:

1. **Header** (56px): the logo, linking to Home.
2. **New launch**: a full-width `primary` `LinkButton` with a plus. The only filled
   button in the rail.
3. **Destinations**: Home, Launches, Runs, Settings. 36px rows, 8px radius, 16px icons
   at stroke 1.75, `text-small` 500. Active: raised white with a card shadow and ink
   text. Inactive: muted, hover wash. `aria-current="page"` on the active row.
4. **Context**: inside a launch, the launch's name and host over the **gantry** (below).
   Outside a launch, "Your launches": up to eight names as 32px rows, then "All
   launches".
5. **Footer**: Search with `⌘ K` keys, and the theme toggle.

Below `lg` the rail is a left sheet opened by a menu button in a 56px top bar that also
carries the logo. `onNavigate` closes the sheet.

## The gantry

The seven stages as 40px rows on a single vertical track (`.gantry-track`, a 1px line at
x = 16px). Each row: a 32px node, the name, a "Gate n" label when the stage ends in one,
a lock when the stage is locked.

Node fills by real state (from `stageDots` in the project provider):

| State | Node |
| --- | --- |
| approved | Filled go with a white check |
| in review | hold tint, hold text, the number |
| failed | nogo tint, nogo text, the number |
| not started | Outline on the sidebar color, muted number; ink outline when active |

The active row is raised white; its "Gate n" label turns flare text. Locked rows sit at
60% opacity with a tooltip: "Approve the profile to unlock". Each row has an `aria-label`
naming the stage, its state, and whether it is locked.

Below `lg` the gantry becomes a horizontal strip of pills above the stage title, with a
check on approved stages and a lock on locked ones.

## The landing nav

64px, sticky. Over the hero's ambient field it is transparent; after 24px of scroll it
gains `bg-background/85` with blur and a hairline (via `useScroll`). Logo left; "How it
works" and "Questions" in a floating pill at the centre from `md` (a raised surface at 80%
with blur, hover wash on each link); theme toggle and one `primary` CTA ("Open the
console") right. One line at every width.

## Breadcrumb

The workspace header carries "Launches / Launch name / host" in 14px muted, the name in
ink. It is the only breadcrumb in the product.

## Tabs

There are no tabs. Segmented controls (`Segmented`) handle exclusive views of one thing
(theme); destinations are rows in the rail; stages are the gantry.
