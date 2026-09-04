# Feedback states

Source: `design-system/src/components/banner.tsx`, `design-system/src/components/empty-state.tsx`,
`design-system/src/components/skeleton.tsx`, the sonner toaster in `app/layout.tsx`.
Specimen: `/design#feedback`.

Every screen designs four states before it designs the success state: loading, empty,
error, running. The previous system had them; this system makes them look like they
belong.

## Loading

- Work under 300ms shows nothing. Work over 300ms shows a `DelayedSkeleton` shaped like
  the layout it replaces: a title bar, a card, a table. Never a spinner in the middle of
  the page.
- Skeletons shimmer slowly (1.8s) in the sunken color.
- Buttons that trigger work show their own `loading` state; the page does not also
  skeleton.

## Empty

`EmptyState`: a dashed 12px frame on a faint surface, an icon tile, a title that states
the fact, a description that gives the reason and what happens next, one action.

- The title is a fact in sentence case with a period: "No launches yet." "No venues
  ranked yet." "Queue clear."
- The description is honest. If nobody is asking for the app yet, say so: "Nobody is
  publicly asking for what your app does right now. That is common before launch."
- One action, `primary` if it is the obvious next step, `secondary` if it is optional.
- `align="start"` inside a stage (left-aligned, reads as content); `align="center"` on a
  list page (reads as a state).
- `HonestEmpty` in `stage-common.tsx` keeps the older `fact / reason` prop names.

## Error

`Banner tone="nogo"`: an inline, contextual message with an icon, a bold first sentence
that says what happened, a second sentence that says what to do, and a Retry action when
one applies. It sits where the person is looking: under the workspace header, above a
form, in the card whose job failed. Errors do not apologise, do not blame, and are never
vague ("Something went wrong" is banned).

The one recurring error, the unreachable backend, is `BackendDownBanner`: the URL it
expected and the command that starts it.

Toasts (sonner) are for transient confirmations only: "Approved", "Link copied", "Saved as
v3". They echo the verb on the button. Never an error in a toast.

## Warning

`Banner tone="hold"`: something to read carefully but not a failure. "Partial analysis.
Read this one more carefully." "3 warnings from the draft check." Lists inside a banner
are `list-disc pl-5`.

## Success

`Banner tone="go"` is rare. Approval feedback is the gate release, not a banner. Use the
green banner only when a state change needs a sentence of consequence ("Every later stage
now reads this profile").

## Info

`Banner tone="info"`: a neutral note with an action inside it, like the duplicate-launch
hint on the new launch form.

## Running

See `status.md`. A stage whose job is running shows the shimmering line in place of the
content, plus the workspace header's running indicator with elapsed time. Leaving the
page is allowed and the copy says so: "You can leave this page and come back; the run
continues."
