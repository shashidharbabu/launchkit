# Dialogs, sheets, menus, tooltips

Source: `design-system/src/components/dialog.tsx`, `design-system/src/components/dropdown-menu.tsx`,
`design-system/src/components/tooltip.tsx`, `components/launchkit/command-palette.tsx`.
Specimen: `/design#overlays`.

All floating layers share one look: `bg-surface-raised`, hairline border, 16px radius,
`shadow-overlay` (dialogs, sheets) or `shadow-raised` (menus, tooltips), entering with a
scale from 0.96 and a fade. All are Base UI primitives, so focus trapping, escape,
outside-click and `aria` come for free.

## Dialog

Centered, `max-w-lg`, `p-6`. Title in `text-title`, description in `text-body` muted, a
`DialogFooter` with actions right-aligned: the safe action as `secondary`, the committing
action as `primary` or `destructive`. A close button sits top-right unless the footer's
actions make it redundant (`showClose={false}`).

Use a dialog for a decision that must be confirmed (Dismiss this signal?) or for a short
reading view. Never for a form with more than three fields.

## Sheet

Slides in from the right (or left for the mobile rail), floating 12px inside the viewport
edge, `max-w-md`, scrolls internally. Used for run history and the mobile navigation.
Title and description at the top, content below, close top-right.

## Morphing dialog

The asset reading view uses the vendored `MorphingDialog`: the draft well expands into a
`max-w-2xl` panel with the same radius and overlay shadow. The morph is the only shared
layout animation in the product.

## Dropdown menu

`min-w-48`, `p-1.5`, items are 36px rows with an 8px radius and the hover wash,
`text-small`. Icons 16px muted. Destructive items in failure text. Labels in
`text-label` muted. Separators are hairlines with 6px margins.

## Tooltip

Dark: `bg-foreground text-background`, `text-small`, 8px radius, 300ms delay, 120ms fade.
Tooltips explain (why a stage is locked); they never carry required information and never
appear on elements that have visible labels.

## Command palette

⌘K or the Search row in the rail. A dialog pinned at 12% from the top, `max-w-xl`, no
padding: a 52px input with a bottom hairline, groups labelled in `text-label`, items with
icons, and a footer of keyboard hints (`Kbd`). Groups: Go to, Stages of the current
launch, Tracked links, Your launches, and Developer when enabled.

## Scrim and z-index

Scrim: foreground at 25% with a 2px blur, `z-(--z-overlay)`. Popups: `z-(--z-dialog)`.
Toasts: `z-(--z-toast)`. Nothing else is ever positioned above content.
