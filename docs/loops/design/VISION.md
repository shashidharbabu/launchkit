# Launch Kit design loop: vision

Written 2026-09-30, before turn 1. The owner's feedback, across every screen: **too much text; a builder should understand a feature from a picture, not from paragraphs.** Launch Kit is a go-to-market app for developers launching a product. Its screens are a console where builders review what the pipelines produced and make decisions, not a landing page.

## What we are fixing (measured, 09-29 screenshots)

- **Commercial is 7.6 screens tall.** It explains itself three times (page subtitle, a two-paragraph orientation, the card description) before the first decision. Then it shows a paragraph of research reasoning, and every pricing tier is a paragraph.
- **Every stage opens with an "Orient" block:** a lead sentence, a detail sentence and an estimated duration. The page header then says the same thing again.
- **The decisions sit under the prose.** The answer to "what did it find?" (a price, a ranked venue, a post's status) is below the explanation of how it was found.
- **Numbers are sentences.** Revenue at 10, 50 and 200 customers is text in three boxes, competitor prices are a paragraph, and venue fit is a sentence per row.

## Direction

**Show, then say.** Every screen leads with its answer as a picture, and the words come after, only where a picture cannot carry them.

1. **One answer visual per stage, above the fold.**
   - Profile: a fact grid, with verified, unverified and gap chips.
   - Brand: colour swatches, a type specimen, the logo and angle cards.
   - Commercial: a price ladder, your tiers against the competitors' anchor prices on one scale.
   - Social: a post preview per platform with its status stamp.
   - Assets: thumbnails and the player.
   - Targets: ranked bars for fit, with a rules-read mark.
   - Signals: a funnel of found, dropped, rejected and kept.
   - Plan: a timeline.
2. **One sentence of orientation per stage, at most.** The page header carries it. The Orient block becomes a one-line step indicator (step 1 of 2, and the estimated time as a chip). There is no repeated description in card headers.
3. **Numbers as figures.**
   - A price is a large figure with its billing period as a label.
   - Revenue is a small bar chart.
   - Counts are stat tiles.
   - Confidence is a meter.
4. **Rationale behind a disclosure.** "How this was researched", "Also considered" and "why it fits" are one line plus "Show the reasoning". The builder opens them when they doubt the answer.
5. **Honesty stays visible, as stamps.**
   - A warning, a gap, an unverified claim or a failed run is a stamp or chip with a one-line reason, never removed.
   - The evals bought this honesty. Brevity must not hide it.
6. **Density: a console, not a brochure.**
   - Tight spacing on the existing Gantry scale, tables and tiles over cards of prose.
   - Nothing decorative.
   - Pipeline progress is shown per stage, not as a spinner.
7. **Keep the design system.** Gantry tokens, type and components as they are, with no new colours. The accent keeps its one job, the next action.

## What it must not look like

- A marketing page: a hero, a subhead and two buttons, or feature cards with icons and paragraphs.
- A chat transcript of the model's reasoning.
- Text walls with one bold phrase each.
- Charts for their own sake. A picture that does not answer the screen's question is decoration and scores down.

## Budget (the machine checks, per stage, measured by `tools/evalkit/words.mjs`)

| Check | Budget |
|---|---|
| Words above the fold (1440 x 900) | 60 or fewer |
| Total visible words | at most half of the 09-30 baseline |
| Paragraphs of 25+ words visible without opening anything | at most 1 |
| Answer visual above the fold | at least 1 |
| Page height | at most 3 screens |

The existing checks still apply: build, typecheck, the 99 domain tests, the read-only walk (16 of 16), no console errors, WCAG AA contrast, no horizontal scroll at 390, 768 and 1440, visible focus, reduced motion honoured.

## Surface weighting (rubric)

Dashboard or console plus creative review. The critic requires at least 5 on **information density, typographic hierarchy and craft details**. Motion and distinctiveness are relaxed to at least 3. A ninth dimension is added for this loop: **show over tell**, meaning the screen's question is answered by a picture before any sentence.

## Cap

Full design pass, 15 turns. Every turn changes one thing across the stage it targets, following the critic's single named fix. A turn that regresses a dimension is reverted.
