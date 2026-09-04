# Pre-flight checklist

Run this on every screen before it ships. Every box is a yes, or the screen is not done.

## Tokens

- [ ] No raw palette class (`bg-orange-*`, `text-zinc-*`, `rounded-lg`, `shadow-md`);
      only semantic utilities from `tokens.css`.
- [ ] No hardcoded color, radius, shadow, font, duration or easing in a component.
- [ ] Checked in light and dark.

## Type

- [ ] Only the eleven type roles; no ad hoc `text-[13px]` for readable text.
- [ ] No uppercase tracked labels; no mono for labels or headings.
- [ ] Nothing a person must read is below 14px or below 4.5:1.
- [ ] Sentence case everywhere.

## Shape and surface

- [ ] Controls 8, cards 12, panels 16, frames 24, pills for chips. Nothing square.
- [ ] Cards only around objects with their own status or actions. No card around a
      paragraph.
- [ ] Header and body share padding; only footers draw a rule.

## Color budget

- [ ] At most one flare element per view: the gate verb, or the primary when there is
      no gate.
- [ ] Status appears only in stamps, badges, banners, gantry nodes, the gate glyph.
- [ ] Status is never color alone.

## Atmosphere

- [ ] The ambient field appears only behind a front door (landing hero, closing band,
      empty chat home, the design specimen), never behind a work surface, and at most
      once per viewport.
- [ ] Copy over the field sits on a scrim in the canvas color (or on an opaque
      surface); buttons on it keep AA contrast in both themes.
- [ ] Switch the theme with the page open: the field repaints with it. Light chrome
      over a night field, or the reverse, is the failure to look for.
- [ ] The field is masked into the canvas, never cut with a hard edge.
- [ ] Under reduced motion it holds a still frame; without WebGL the gradient shows.

## Buttons and copy

- [ ] One primary per view. Flare only on Approve.
- [ ] Labels are verbs in sentence case, three words for a primary, no ellipsis in
      loading labels, no exclamation marks.
- [ ] Zero em-dashes, zero en-dashes, zero middle dots in any visible string.
- [ ] No "AI", "model", "pipeline", "job", or platform names on screen.
- [ ] Numbers say what they count.

## States

- [ ] Loading (delayed skeleton shaped like the layout), empty (fact, reason, act),
      error (what happened, what to do, retry when possible), running (named work with
      elapsed time) all designed.
- [ ] Backend-unreachable state renders and reads correctly.

## Layout

- [ ] Uses `PageContainer` (or is the chat home) and `PageHeader`.
- [ ] Collapses to one column below `lg`; the page never scrolls sideways.
- [ ] Tables scroll inside `TableFrame`.

## Motion

- [ ] Every animation can be justified in one sentence (orientation, reward, state,
      feedback).
- [ ] Reads `useReducedMotion()` and renders the finished state under it.
- [ ] No scroll listeners, no infinite loops on informational content, no second
      animation runtime.
- [ ] Timers and intervals are cleaned up.

## Accessibility

- [ ] Real elements with real roles; links for navigation, buttons for actions.
- [ ] Icon-only controls have `aria-label`; decorative icons are `aria-hidden`.
- [ ] Focus is visible on every interactive element, in both themes.
- [ ] One `h1`; headings in order; regions labelled.

## Code

- [ ] `npx tsc --noEmit` passes.
- [ ] `npx eslint .` passes with zero problems.
- [ ] Motion and state live in client leaves; pages and layouts stay static where they
      can.
- [ ] The component appears on `/design` if it is new or its look changed.

## Landing page only

- [ ] Hero: headline two lines at lg, subtext 20 words or fewer, CTAs visible without
      scrolling, top padding under 96px.
- [ ] No eyebrows beyond one per three sections (this page uses none).
- [ ] At least four layout families across the page; no two adjacent sections share one.
- [ ] Real images; a real component preview; no fake screenshots.
- [ ] One CTA label per intent across nav, hero and footer.
- [ ] No marquee, no scroll cue, no version label, no logo wall without real logos.
