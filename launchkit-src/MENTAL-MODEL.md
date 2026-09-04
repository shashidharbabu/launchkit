# Launch Kit — the whole thing in plain English

## The one-sentence version

You give Launch Kit a **repo URL + a live site URL**. It reads them, then drafts
everything you'd need to launch the app — and you sign off on each piece.

## The spine: 6 stages, 3 gates

```
01 Profile → [GATE 1: you approve] → 02 Commercial
                                     03 Assets  → [GATE 2: you approve each]
                                     04 Targets → [GATE 3: you pick venues]
                                     05 Signals
                                                → 06 Plan
```

Gate 1 is the important one: **nothing downstream runs until the profile is
approved**, because every other stage takes the profile as its input. If the
profile is wrong, everything built on it is wrong. That's the whole reason the
gate exists.

## What each stage actually does

| # | Stage | Reads | Does | You get |
|---|-------|-------|------|---------|
| 01 | **Profile** | your repo (GitHub) + your site (Firecrawl) | Figures out what the app is, who it's for, your writing voice, what's missing | One JSON "app profile" + a list of every source it read |
| 02 | **Commercial** | the profile | Two separate jobs: **pricing** (finds 5–8 competitors, scrapes their pricing pages, recommends tiers) and **listing** (rewrites your App Store copy) | Price tiers with competitor evidence; title/tagline/description/keywords/FAQ |
| 03 | **Assets** | the profile (+ a target's rules) | Writes ONE post at a time in your voice: X, LinkedIn, Reddit, Product Hunt, Show HN, newsletter pitch, video script | Draft copy + warnings if it'd break the venue's rules |
| 04 | **Targets** | the profile | Ranks 12–20 places to launch — by *fit*, not size. Mixes a curated pool with venues it discovers via search | Ranked venue list + submission links + self-promo rules + launch order |
| 05 | **Signals** | the profile | Hunts for people *publicly asking for your app right now* across Reddit, HN, GitHub issues, StackOverflow — then drafts a helpful reply for each | 5–12 live threads you can go reply to today |
| 06 | **Plan** | everything above | Assembles the approved pieces into a sequenced launch checklist | The thing you actually execute |

## The pipelines (`pipelines/*.pipe`)

These are RocketRide pipeline files. Five of the six are the **same shape**:

```
Chat (input) → RocketRide Wave Agent → Return Answers (output)
                      ↑
        wired underneath as "control":
        an LLM  +  Memory  +  1–2 tools
```

- **LLM** for all of them: Qwen3-235B via GMI.
- **Tools differ per pipeline** — that's really the only difference:
  - `lk_understand` → GitHub + Firecrawl
  - `lk_commercial` → Exa Search + Firecrawl
  - `lk_targets` → Exa Search + Firecrawl
  - `lk_brand` → Firecrawl only (TASK=dna scrapes the site into a Business DNA; TASK=campaigns writes on-brand campaign concepts from it)
  - `lk_assets` → Firecrawl only (it's writing, not researching; honors BRAND_DNA voice when present)
  - `lk_signals` → Exa Search + HTTP (hits HN Algolia, GitHub, StackOverflow APIs directly)
- **`lk_rescore` is the odd one out**: no agent, no tools — just a raw LLM call.
  It's the **judge** for stage 05. Signals is told to over-collect (favour
  recall); rescore then re-reads each thread and throws out the irrelevant ones.

The long `instructions` array in each `.pipe` is the entire prompt. Every one of
them ends with the same two demands: **return strict JSON only**, and **never
invent a fact you didn't read from a tool result**.

## The frameworks, and why each is there

| Layer | What | Why |
|---|---|---|
| Pipelines | RocketRide `.pipe` files | The AI work. Agent + LLM + tools, one file per stage |
| Backend | FastAPI + SQLModel + SQLite (`backend/app/main.py`) | Kicks off pipelines as **jobs**, stores results, enforces the gates |
| Frontend | Next.js App Router | `/` = marketing, `(app)/` = the console, `p/[id]/[stage]` = the workspace |
| State | `project-provider.tsx` | One React context holds all cross-stage data — rail status dots, retry, palette |
| UI | Hand-built primitives on `@base-ui/react` + tokens from the Flight Paperwork design system | No shadcn CLI; tokens are byte-identical to the design system |
| Motion | motion-primitives (copied in) | Landing reveals, count-up stats, gliding nav underline |

## Why it feels overwhelming (and it's not just you)

There are **6 stages × ~4 actions each**, and the UI currently surfaces all of
them at once, flat. A user landing on a stage sees the full JSON surface area
before they see the one thing they're supposed to do next.

The fix isn't fewer features — it's **one obvious next action per screen**.
