---
name: motionsites
description: Use MotionSites (motionsites.ai) — a paid library of "premium AI website prompts" with free-to-browse animated previews of motion-heavy hero sections, landing pages, footers, CTAs, backgrounds, and gradients — as motion-direction reference, and translate what its previews show (timing, easing, choreography patterns — patterns, not pixels) into concrete motion v13 (`motion/react`) implementations in Next.js 14 + Tailwind 3.4. Use this whenever a task involves motionsites.ai in any form, someone wants motion-design inspiration for a landing page ("make the hero move like the good AI-built sites", "find animated section references"), a MotionSites prompt has been purchased and its output needs adapting to our stack, an AI-builder prompt (Lovable/v0/Bolt-style) needs converting into maintainable Next.js code, or when naming and implementing a motion choreography pattern observed in any animated site preview. The observation-to-framer-motion translation workflow lives in references/integration.md.
---

# MotionSites

Resolved (Aug 2026): motionsites.ai is **not** a curated gallery of external
websites. It is a **commercial prompt library** — "Official Premium AI Website
Prompts". Each entry is an animated preview (GIF/WebP/video) of a
motion-designed website section, and the product you buy is **the text prompt**
that reproduces it in AI site builders. Their own workflow: "Browse a design,
copy the prompt, paste it into AI builders like Lovable, Cursor, Bolt, Claude,
v0, or Replit, then customize."

**What's free:** browsing every animated preview. **What's paywalled:** the
prompts. Pricing (Aug 2026, `motionsites.ai/unlimited`): $129/3-months (fair
use: 3 prompt copies/day), $279/year unlimited, $399 lifetime (list $759),
prompt packs from $49 (2–10 prompts). Paid plans state "for personal & client
work" — commercial use is allowed **for license holders**; the site publishes
no separate license text, so treat rights as tied to an active purchase.

There is no API and no export. So this skill owns two things:

1. **Selection** — where to browse for which kind of reference.
2. **Translation** — turning what a preview *shows* (or purchased prompt
   output) into maintainable motion v13 (`motion/react`) + Tailwind code. Workflow in
   `references/integration.md`.

## Browse map (direct URLs)

| Need | URL |
|---|---|
| Full section library — heroes, footers, CTAs, pricing, features, landing pages | `https://motionsites.ai/sections` |
| Animated background treatments | `https://motionsites.ai/backgrounds` |
| Animated gradient treatments | `https://motionsites.ai/gradients` |
| Full app-level designs | `https://motionsites.ai/apps` |
| Pricing / plans | `https://motionsites.ai/unlimited` |

Previews skew dark, cinematic, WebGL-flavored: space/finance/security/SaaS
aesthetics with heavy hero choreography.

## The two legitimate workflows

**A. Reference mining (free, no purchase).** Treat previews exactly like any
motion reference: extract the *pattern* — entrance choreography, stagger
order, easing character, scroll behavior — and implement it originally in our
stack. Patterns (staggered reveals, parallax, marquees) are not protectable;
a pixel-faithful clone of one specific paid design is a different thing — don't.

**B. Prompt adaptation (user owns a license).** The purchased prompt targets
AI site builders and will emit builder-flavored code (often Lovable/React with
arbitrary libraries). Never paste its output in verbatim. Run it through the
adaptation checklist in `references/integration.md`: our stack only
(motion v13 (`motion/react`), Tailwind 3.4 tokens, App Router server/client split), our
design tokens, reduced-motion coverage, and delete the dead weight AI builders
generate.

## When NOT to use MotionSites

- **You need components, not direction.** Installable animated components →
  **componentry** skill; animation primitives → **motion-primitives** skill.
  Both are free and land as maintainable code — a prompt subscription is the
  wrong tool when a component library already has the pattern.
- **Hero *layout* inspiration** (structure, copy placement, above-fold
  economy) → **supahero** skill. **General visual direction / moodboarding**
  → **cosmos** skill. **Trend freshness checks** → **recent-design** skill.
  MotionSites is specifically for *motion* direction.
- **The brand direction is quiet.** MotionSites previews are maximalist by
  design; on a restrained B2B page that energy reads as noise (see
  taste-skill).
- **Anything data-driven or app-internal.** These are marketing-surface
  patterns only.

## Non-negotiables

- **Never present MotionSites prompt output as production-ready.** AI-builder
  output ships without reduced-motion handling, with inline styles and random
  dependencies. It's raw material.
- **Extract patterns, not pixels.** Name the pattern, spec the timing, write
  original code. Do not reproduce a specific paid design 1:1 for a client.
- **No purchase, no prompt.** If the user hasn't bought access, work from the
  visible preview only — never fabricate what a paywalled prompt "probably
  says".
- Everything decorative that results (background canvases, gradient loops)
  still follows house rules: `aria-hidden`, `pointer-events-none`,
  `prefers-reduced-motion` fallback, bundle-size check.
