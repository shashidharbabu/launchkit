---
name: brand-check
description: RocketRide brand and messaging compliance gate. Run on any app or App Store submission once before it moves forward, and on any draft before it goes public: store listings, landing pages, READMEs, docs, UI copy, LinkedIn/X posts, blog posts, announcements. Triggers: "brand check", "is this on-brand", "does this pass brand", "review this copy / post / listing / announcement", "check the messaging", "app store submission review", "app store intake". Checks banned vocabulary (ship, universal API key, em-dashes), product framing (RocketRide never provides model inference), tone, competitor and partner mention policy, pricing and confidentiality traps. A review gate that flags, never approves or publishes: final approval is always Joe's. Not for creating brand assets (that is brandkit).
---

# RocketRide Brand Check

One pass over every user-facing word of an app or content draft, judged against
the brand rulebook, producing a verdict: PASS, PASS WITH FLAGS, or BLOCKED.
Any app entering the RocketRide App Store goes through this once before moving
forward. Any public content goes through it before it is posted.

## Non-negotiables

1. **This skill flags. It never approves, publishes, or posts.** The approval
   workflow is fixed: Steve drafts, Dana reviews adversarially, Joe approves,
   Joe posts. Nothing goes live without Joe's explicit review and approval.
2. **The em-dash ban applies to your own output.** Write the report, and any
   suggested rewrites, without em-dashes. Use commas, colons, semicolons, or a
   new sentence.
3. **When uncertain, flag.** Never resolve an ambiguous claim yourself. If a
   capability, event, partnership, or number cannot be verified, it goes in the
   Flags for Joe section, framed around architecture and philosophy rather than
   features.

## Step 1: Read the rulebook

Read `references/rulebook.md` in this skill directory, in full, before judging
anything. It is the single source of truth: banned vocabulary, approved
positioning, tone with real on-brand and off-brand examples, competitor and
partner policy, and the factual traps. Every finding in your report must cite a
rulebook section.

## Step 2: Enumerate the surfaces

For an **app / App Store submission**, sweep all of:

- Store listing: app name, tagline, description, category, screenshot captions
- README, docs, changelogs, release notes
- Landing or marketing pages bundled with the app
- In-app UI strings: onboarding, empty states, tooltips, CTAs, error messages,
  settings copy, notification text
- Any announcement or social copy accompanying the submission

For a **single draft** (post, blog, email, DM), the draft is the surface, plus
anything it links to or quotes. Note which account it will publish from, since
tone rules differ per account (rulebook section 3.5).

## Step 3: Mechanical sweep

Grep the text surfaces first. Every hit needs a human-quality judgment in
context; only the hard-banned terms are automatic blockers.

```bash
grep -rinE '\bship(s|ped|ping)?\b' <target>       # BLOCKER: banned word, no exceptions
grep -rn '—' <target>                              # BLOCKER: em-dash, banned in all writing
grep -rin 'universal api key' <target>             # BLOCKER: deprecated framing
grep -rinE 'game.?chang|groundbreaking|revolutionar' <target>   # hype, off-brand
grep -rinE 'keep (thinking about|coming back to)|pattern I keep seeing' <target>  # AI tells
grep -rinE '\b2 ?a\.?m\.?\b' <target>              # tired startup cliche
grep -rinE '\$ ?[0-9][0-9,.]*' <target>            # verify against approved pricing; revenue/ARR = confidential, BLOCKER
grep -rinE 'openai|anthropic|google|meta' <target> # comparative or adversarial context: FLAG FOR JOE
grep -rinE 'inference|serv(e|es|ing) weights' <target>  # framing check: RocketRide never provides model inference
grep -rinE 'developer day|beyond build' <target>   # known hallucinated events
grep -rinE 'microsoft|n8n|daytona|ai camp|ai collective|bond ai|ai la' <target>  # in-discussion partners: must not read as confirmed
```

## Step 4: Read the marketing surfaces in full

Greps catch words. Framing, tone, and positioning need reading. Judge against
the rulebook:

- **Framing:** Does anything imply RocketRide runs or serves foundation model
  inference, or serves weights? Does MaaS integration match the approved
  framing (one account with a MaaS provider, not one RocketRide key)?
- **Positioning:** Is the moat line intact where used ("the only platform that
  is simultaneously IDE-native + MIT-licensed + self-hostable")? Are the two
  entities (rocketride.org open source vs rocketride.ai commercial) kept
  distinct?
- **Competitors:** Any "better than X" positioning is a blocker. Factual
  feature comparisons in the approved table format are fine.
- **Partners:** Does any in-discussion partnership read as confirmed?
- **Product names:** Is App Builder referred to by a specific public name? It
  has none yet: flag.
- **Claims:** Is every capability claim verifiable in DATA.md or SOUL.md? If
  not, flag.
- **Tone:** Punchy, direct, community-first, genuine, show-don't-tell. Compare
  against the on-brand and off-brand examples in rulebook section 3. Check
  capitalization rules for the publishing account.

## Step 5: Verdict and report

### Severity tiers

- **BLOCKER**: a hard rule is broken; the submission does not move forward
  until fixed. Banned words, em-dashes, inference or weights claims, financial
  figures, wrong pricing, unconfirmed partnership stated as fact, unverifiable
  event, org/commercial conflation, "better than X" positioning.
- **FLAG FOR JOE**: policy requires Joe's call, or policy is not yet settled.
  Foundation model providers named in comparative context; App Builder given a
  name; Cloud feature claims not verifiable; anything you are uncertain about.
- **STYLE**: off-voice but not a violation. AI-tell phrasing, staccato fragment
  punchlines, hype adjectives, wrong capitalization for the account, telling
  instead of showing.

### Report format

```markdown
## Brand Check: <app or draft name>

**Verdict:** PASS | PASS WITH FLAGS | BLOCKED
**Surfaces swept:** <list>

### Blockers (fix before moving forward)
1. "<exact quote>" (<file:line or location>)
   Rule: <rulebook section>. Rewrite: <suggested fix using approved framing>

### Flags for Joe (route for review, do not self-resolve)
1. "<exact quote>" (<location>)
   Why flagged: <reason>. Source URL: <url, or "URL not captured">

### Style notes (recommended)
1. "<exact quote>" (<location>): <what reads off-voice and why>
```

Every flagged item that references an external source must include the direct
source URL. Noting "URL not captured" is acceptable; sourcing from memory alone
is not.

### Suggested rewrites

When you propose a fix, build it from approved language in the rulebook: the
one-line pitch, the moat line, the MaaS framing, the three-part problem
structure. Never invent new positioning in a rewrite.
