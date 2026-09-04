# Pattern: page anatomy

Every list page in the console reads the same way, so a person learns the product once.

```
PageContainer (max-w-content, gap-8)
├── PageHeader
│   ├── eyebrow (optional, 14px muted)
│   ├── title (text-display)
│   ├── description (one sentence, 16px muted, max 2xl)
│   └── actions (right: one primary, or a row of badges)
├── Banner (only when something needs saying: backend down, a warning)
├── the page's first block (stats, a form, a table)
└── the page's remaining blocks, gap-8
```

## Titles and descriptions

| Page | Title | Description |
| --- | --- | --- |
| Launches | Launches | Every app you are taking to market, and how far each one has come. |
| New launch | Start a launch | Launch Kit reads your live site, and your repo if it is public, then drafts your app profile. Analysis starts the moment the launch is created and takes one to three minutes. |
| Runs | Runs | Every pipeline run across your launches, newest first. |
| Settings | Settings | (none) |
| Design | Design system | Every token and component, rendered by the real code in the current theme. |

Descriptions are one or two plain sentences, no exclamation marks, no dashes.

## Actions

The header's right side holds one `primary` action ("New launch") or a row of badges
(Runs shows "2 running", "1 failed"). Never both. Secondary page actions live in the
first block, not the header.

## The four states

Each page implements, in this order in the code:

1. Backend unreachable: `BackendDownBanner`, and the rest of the page in its empty form.
2. Loading: `DelayedSkeleton`s shaped like the final layout.
3. Empty: `EmptyState` with the fact, the reason, and one action.
4. Populated: the real content.

## One width for every page

Every page uses `PageContainer`: a 68rem column, centred, padded 40px at desktop. There
are no narrow or wide pages. Content that wants less room (a form, a settings group)
lays itself out inside the column with a grid (two cards side by side, a form beside a
photograph); it never shrinks the page, so the app keeps one shape and size from screen
to screen. The chat home is the one exception: it owns its height and centres a 46rem
reading column inside the same page width. A page never exceeds its container and never
scrolls sideways; tables scroll inside their frame.

## Rhythm

Blocks are 32px apart. Inside a block, related elements are 12px apart (a filter above a
table). A caption under a table is 12px below the frame.
