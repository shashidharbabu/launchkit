# Pattern: the landing page

Files: `app/page.tsx`, `components/launchkit/landing-nav.tsx`, `landing-motion.tsx`,
`how-it-works.tsx`, `landing-preview.tsx`, `lib/seo.ts`, `lib/structured-data.ts`.

Design read: B2B SaaS landing for technical founders, calm and confident, dials 6 / 5 / 3.
It is the same design system as the app (same tokens, type, radius, buttons, gate,
composer), stretched to editorial widths (`max-w-landing`, 76rem).

## Sections, in order (five layout families)

| # | Section | Family | Content |
| --- | --- | --- | --- |
| 1 | Hero | Full-bleed ambient field, copy left on a scrim, one viewport | Platform proof row, headline (6 words, two lines at lg, one italic emphasis in the same family), 19-word subtext, primary "Start your launch" + secondary "See how it works", and the four product facts along the bottom edge |
| 2 | How it works | Sticky heading + timeline | "Seven stages. Three approvals.", one paragraph, three real facts (2 links, 3 approvals, 0 posts sent without you), the seven stages on the gantry track with gate markers |
| 3 | Approval is a physical act | Full-width sunken band with a real component preview | The Gate on sample data (its Approve plays the real release; Re-open resets), the navigator thread and composer beside it, a one-line "Sample data" note |
| 4 | Built to be honest | Bento, 4 cells for 4 pieces of content | Two text cells, the visor photograph spanning two rows, one flare-tinted cell ("Empty means empty.") |
| 5 | Questions, answered | Accordion | The six FAQ items as native `details` with a rotating chevron |
| 6 | Closing band | Full-bleed ambient field at 0.85 | "Two links in. A launch plan out.", one sentence, "Start your launch" |
| 7 | Footer | | Logo, three links, "Assisted, never autonomous." |

The field bookends the page (hero and closing band); between them the canvas is calm. The
nav is one line at 64px: the logo, the two in-page links in a floating pill, the theme
toggle, and one CTA ("Open the console"). Over the hero it is transparent; after 24px of
scroll it gains the canvas and a hairline.

## The two proof rows (`components/launchkit/hero-proof.tsx`)

The hero borrows a shape that marketing pages use well: a trust row above the headline
and a row of numbers along the bottom edge. Both are filled with things that are true,
because the page faces clients who can check.

- **Platform proof**, above the headline: the five platform marks Launch Kit actually
  writes posts for, overlapping in 40px circles on the raised surface, then a pill
  reading "A post written for each one". It replaces the reference pattern's
  "Trusted by 2000+ enterprises", which we would have had to invent.
- **Product facts**, along the bottom edge above a hairline: 2 links you paste in,
  7 stages drafted, 3 approvals all yours, 0 posts sent without you. Each is a fact
  about the product, each label says what the number counts, and no number is a
  performance metric we cannot stand behind. Latency, uptime and customer counts stay
  off the page until they are real and measured.

These four numbers live here and nowhere else; the How it works section carries the
stages, not a second copy of them.

## Rules this page keeps

- No eyebrows. Section titles stand alone in `text-display-lg`.
- One accent. Flare appears on gate markers, the demo's Approve, and the tinted bento
  cell; nowhere else.
- Real images only, from `public/brand/`. No illustration, no fake screenshots: the
  product preview is the product's own components.
- Hero fits the first viewport at lg: `lg:min-h-[calc(100dvh-4rem)]`, top padding 48px.
- Zero em-dashes, zero middle dots, zero version labels, zero scroll cues, zero social
  proof logo walls (none exist to show), zero marquees.
- Motion: a staggered rise on the hero, one rise per section as it enters, the hero
  drift. Nothing loops. All of it collapses under reduced motion.
- CTA intents are unique: "Start your launch" (hero) and "Open the console" (nav and
  footer) are different intents with one label each.

## SEO surfaces

`lib/seo.ts` holds the title, tagline, description, keywords and FAQ. `structured-data.ts`
emits SoftwareApplication, Organization (Launch Kit itself), HowTo (the seven stages) and
FAQPage. `robots.ts` keeps the console private and welcomes answer engines to the
landing page; `llms.txt` and `llms-full.txt` in `public/` restate the same claims.
`NEXT_PUBLIC_SITE_URL` sets the canonical origin in production.
