# Pattern: the app shell

Files: `app/(app)/layout.tsx`, `app/p/[id]/layout.tsx`, `components/launchkit/app-shell.tsx`,
`app-sidebar.tsx`, `workspace-shell.tsx`, `design-system/src/components/page-container.tsx`.

## Structure

```
AppShell
├── <aside> rail (lg and up)         AppSidebar
├── <header> top bar (below lg)      menu button + logo, opens AppSidebar in a left sheet
├── children                         a page (list pages) or WorkspaceShell (a launch)
└── CommandPalette
```

Two route groups share it:

- `(app)`: Home, Launches, New launch, Runs, Settings, Design. `layout.tsx` is just
  `<AppShell>{children}</AppShell>`; each page wraps itself in `PageContainer`.
- `p/[id]`: the workspace. `layout.tsx` provides `ProjectProvider` and renders
  `WorkspaceShell`, which contains `AppShell` and the workspace header; the stage page
  renders the body.

The rail reads `useProjectMaybe()` so it shows the gantry inside a launch and recent
launches outside one, with no props from the layouts.

## Widths and heights

Rail 264px sticky at `h-dvh`. Content column fluid. `PageContainer` centres `max-w-content`
with 40px padding at `lg`. The chat home is the only page that owns its height (see
`patterns/chat.md`).

## Responsive

| Width | Rail | Stage nav | Content padding |
| --- | --- | --- | --- |
| < 640 | Sheet behind the 56px top bar | Horizontal strip | 20px |
| 640 to 1023 | Sheet | Horizontal strip | 32px |
| >= 1024 | Fixed column | Gantry in the rail | 40px |

## Command palette

Mounted once in `AppShell`. Opens with ⌘K / Ctrl+K or the Search row. It offers pages,
the current launch's stages, tracked links, and all launches; it is the only place the
Design page is linked from the console besides Settings.

## Theme

`next-themes` on the root layout with `attribute="class"`, system default. The toggle in
the rail flips light and dark; Settings offers the three-way control. `color-scheme` on
both roots keeps native controls in step.

## Don't

- No second navigation in the content area (tabs, breadcrumbs beyond the workspace's
  one line, "back" buttons).
- No page that skips `PageContainer` except the chat home.
- No fixed-position elements other than the rail and the overlay layers.
