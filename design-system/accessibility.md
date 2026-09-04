# Accessibility

The quality floor, built in rather than announced.

## Contrast

- Body and secondary text: AA or better against every surface they sit on (see the table
  in `foundations/color.md`; secondary text is 6:1 or better).
- Button text: white on flare is 4.7:1, off-white on graphite is 16:1, and both are
  re-checked whenever a token moves.
- Status: text on tints is 5.8:1 or better; the word always accompanies the color.
- Placeholders are full-opacity muted text, 6:1.
- Focus rings are 2px flare with a 2px offset, visible on every surface including the
  rail and dark mode.

## Keyboard

- Everything interactive is a native `button`, `a`, `input`, `select`, or a Base UI
  primitive with correct roles. Cards that navigate are links; cards are never `onClick`
  divs.
- Tab order follows reading order. The rail comes before the content.
- ⌘K opens the palette; Escape closes any overlay; Enter sends a chat turn; Shift+Enter
  breaks a line.
- Sortable headers are buttons with `aria-sort`. Expanders carry `aria-expanded`.
  Row checkboxes carry an `aria-label` naming the row.
- Base UI dialogs, sheets, menus and tooltips trap and restore focus.

## Semantics

- One `h1` per page (the page title or the stage name). Card titles are `h3`; section
  titles on the landing page are `h2`.
- Navigation regions are `nav` with `aria-label` ("Main", "Stages", "Page", "Footer").
- The running indicator is `role="status"`; error banners are `role="alert"`, other
  banners `role="status"`.
- Decorative icons and images are `aria-hidden` or have empty `alt`; meaningful
  photographs have descriptive `alt`.
- The gate's release overlay is `aria-hidden`; the state change is announced by the
  stamp's text changing from "Needs review" to "Approved".
- Tables use real `table`, `th`, `td`. Lists use `ul`, `ol`, `dl`.

## Motion

Every animation honours `prefers-reduced-motion`: the base layer zeroes CSS durations
and each Motion component checks `useReducedMotion()` and renders its finished state.
Nothing flashes more than three times a second; the dot pulse and shimmer are slow and
low-contrast.

## Text and zoom

16px UI text, 17px reading text, no text below 12px, and layouts built on grid so 200%
zoom reflows to one column without horizontal scroll. Wide content scrolls inside its
own frame.

## Forms

Labels are visible and bound with `htmlFor`. Errors are associated at the field, marked
`aria-invalid`, and announced with `role="alert"`. Helper text is never the only place a
requirement is stated.

## Theme

Both themes are designed, not derived. `color-scheme` follows the theme so scrollbars,
form controls and selection match.
