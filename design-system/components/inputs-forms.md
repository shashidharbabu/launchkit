# Inputs and forms

Source: `design-system/src/components/field.tsx`. Specimen: `/design#forms`.

## Anatomy of a field

```
Label                                   Optional   <- text-small 500 / text-label muted
┌──────────────────────────────────────────────┐
│ control, 40px, 16px text                     │   <- rounded-control, raised white
└──────────────────────────────────────────────┘
Helper in muted 14px. Or, replacing it:
(!) Error in failure text, 14px, at the field
```

`Field` takes `label`, `htmlFor`, `helper`, `error`, `trailing`. An error replaces the
helper; it never stacks under it. A summary banner above the form holds only errors that
belong to no single field.

## Controls

| Component | Notes |
| --- | --- |
| `Input` | 40px, `px-3`, 16px text. `invalid` sets `aria-invalid` and the failure border. `inputMode="url"` on URL fields. |
| `Textarea` | Starts at 3 rows (88px), grows to `maxRows` (10), then scrolls. `resize-y`. |
| `Select` | Native `<select>` with the same skin and a chevron; no custom listbox. |
| `Checkbox` | A native input with a drawn 18px box (5px radius). Checked fills flare with a white check. Works without JavaScript. |
| `Switch` | Base UI switch, 40 by 24, flare when on. |
| `Label` | 14px medium, above the control, always visible. |

Shared control styling is exported as `CONTROL` so any custom control (the search box on
Launches, the palette input) matches.

## States

- **Rest:** `border-input` (strong border) on `bg-surface-raised`.
- **Hover:** `border-border-strong` darkens slightly.
- **Focus:** border turns flare, plus a 3px flare ring at 25%. Outline is removed only
  because the ring replaces it.
- **Invalid:** failure border; focus ring turns failure-tinted.
- **Disabled:** 60% opacity, not-allowed cursor.
- **Placeholder:** `--muted-foreground` at full opacity (6:1). A placeholder is an
  example ("myapp.com"), never the label.

## Rules

- Label above, never floating, never placeholder-as-label.
- Helper text is one sentence that tells the person what the field is for or what
  happens next: "The site people sign up on."
- Optional fields say so with `trailing="Optional"`; required is the default and unmarked.
- Errors say what is wrong and what to do, at the field, in the field's own words:
  "Site URL does not look like a URL: 'pingdeck'."
- The submit is `Button variant="primary" size="lg" type="submit"` with a loading label.
  Cancel is a `LinkButton variant="ghost"`.
- Forms live in a `Card` with `p-6` and `grid gap-6`.
- Inline edits (the profile's review rows) toggle between a `text-read` paragraph and a
  `Textarea` with the same content; the Edit button is ghost, small, with a pencil.
