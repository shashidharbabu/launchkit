# Typography

## The faces

**IBM Plex Sans** (UI + display) and **IBM Plex Mono** (procedure labels,
data, provenance). Two families, one voice.

Why Plex and not the 2026 defaults (Geist, Inter): RocketRide's brand
language is the engineering document, and Plex *is* IBM's engineering voice
— the datasheet heritage is literal, down to IBM running Apollo's computers
while mission control polled go/no-go. Launch Kit inherits the family for
brand continuity and because the flight-paperwork direction demands a face
with technical lineage, not the current dev-tool default. Both are OFL,
free, on Google Fonts.

Documented alternative: Geist Sans/Mono (`geist` npm pkg) if the org ever
rebrands toward the Vercel-adjacent vernacular. Do not mix the two systems.

## Loading (Next.js 16)

```tsx
// app/fonts.ts
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

export const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

export const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

// app/layout.tsx — attach to <html>
// <html lang="en" suppressHydrationWarning
//   className={`${plexSans.variable} ${plexMono.variable}`}>
```

`tokens.css` maps these into `--font-sans` / `--font-mono`. `next/font`
generates size-adjusted fallbacks, so CLS is handled. Load exactly these
weights — every extra weight is ~25KB you don't need.

## Roles

| Role | Face / weight | Size / leading | Tracking | Used for |
| --- | --- | --- | --- | --- |
| Display | Plex Sans 600 | 28 / 34 (`text-display`) | −0.01em | Page titles ("Assets"), project name |
| Title | Plex Sans 600 | 20 / 28 (`text-title`) | −0.005em | Gate Slip titles, dialog titles |
| Heading | Plex Sans 600 | 16 / 24 (`text-heading`) | 0 | Card headings, table group heads |
| Body (UI) | Plex Sans 400/500 | 14 / 20 (`text-body`) | 0 | Default workspace text, controls, table cells |
| Reading | Plex Sans 400 | 16 / 26 (`text-read`) | 0 | Long-form: asset drafts, thread quotes, profile fields |
| Data | Plex Mono 400 | 13 / 20 (`text-data`) | 0 | Ref codes, URLs, counts, timestamps, `.pipe` names |
| Meta / procedure | Plex Mono 500, UPPERCASE | 11 / 16 (`text-meta`) | +0.08em | Stage labels (`01 PROFILE`), stamps, table headers, provenance lines |

## Rules

- **Two contexts, two body sizes.** Controls and tables read at 14px;
  anything a human reads as prose (an asset draft, a quoted thread) gets
  Reading 16/26. Never set long-form text at 14.
- **Meta is the only uppercase.** If it's uppercase, it's Plex Mono 500 at
  11px with +0.08em tracking — stage labels, stamps, column headers,
  provenance. Uppercase Plex Sans does not exist in this system.
- **Numbers align.** Any column or KPI of numbers sets
  `font-variant-numeric: tabular-nums` (the `.tabular` / `[data-numeric]`
  hook in tokens.css). Attribution counts that wiggle as they update are a
  bug.
- **Weight, not size, for in-context emphasis.** Within body text, emphasis
  is 500, never bold-700 (Plex 700 isn't loaded) and never a size bump.
- **Minimum sizes.** Nothing below 11px, and 11px is mono-uppercase meta
  only. Body text never below 14px.
