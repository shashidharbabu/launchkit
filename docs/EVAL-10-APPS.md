# Launch Kit: ten-app evaluation

Ten open-source apps (one cold-start alpha, nine launched products with 12,928 to 131,595 GitHub stars) ran through all eight stages on the real pipelines on 2026-09-11 between 00:32 and 02:56 local, two apps at a time; every stage completed on every app, and one judge agent per app filed 211 issues, 168 of them marked systemic.
Average score per stage (1 to 5): profile 3.8, brand 3.6, commercial 2.6, social 2.9, assets 2.9, targets 3.1, signals 1.7, plan 3.1; all stages together 3.0. Posts: X 3.6, LinkedIn 3.3, Reddit 2.7, Product Hunt 3.0, Show HN 2.8, newsletter 3.5.
Finding 1: the gates fired on every Show HN body (241 to 307 words against a 200-word cap) and on three banned-verb drafts, and every one of those drafts was approved into the plan; the same gates also put a false dash warning on every post because their regex had been reduced to a comma class.
Finding 2: wherever a rulebook asks for something the profile does not hold (a maker's name, an origin story, a limitation, a prior tool, a contrast), the model invents it: three named people who are in no profile, an origin story on all ten apps, and a whole rubric product for hack-judge, whose site returned 503.
Finding 3: the later stages assume a new SaaS and nine of these apps are established: pricing was rewritten against public prices (dub, hoppscotch) or contradicts the approved listing (plausible, formbricks, continue, khoj), Show HN ranks first for products that have already been on Hacker News, and Signals returned nothing for four apps and zero verified threads for the other six.
What a founder gets today: an accurate profile and brand DNA on a documented site, an X post and a newsletter pitch that need one edit, a Product Hunt listing on three apps (formbricks, dub, khoj) that needs none; the Show HN, the Reddit post, the pricing, the reel and the signal queue need a rewrite or a discard, and nothing in the plan should be posted as it stands.

## Scores

Stage scores, 1 to 5, one judge per app.

| App | profile | brand | commercial | social | assets | targets | signals | plan | avg |
|---|---|---|---|---|---|---|---|---|---|
| hack-judge | 2 | 2 | 2 | 2 | 3 | 3 | 2 | 3 | 2.4 |
| excalidraw | 4 | 4 | 3 | 3 | 3 | 3 | 2 | 3 | 3.1 |
| cal-com | 4 | 4 | 3 | 3 | 3 | 3 | 1 | 3 | 3.0 |
| plausible | 5 | 4 | 3 | 3 | 3 | 3 | 1 | 3 | 3.1 |
| formbricks | 4 | 4 | 3 | 3 | 3 | 3 | 1 | 3 | 3.0 |
| documenso | 4 | 4 | 3 | 3 | 3 | 3 | 2 | 4 | 3.3 |
| dub | 4 | 3 | 2 | 3 | 2 | 3 | 2 | 3 | 2.8 |
| hoppscotch | 3 | 3 | 2 | 3 | 2 | 3 | 3 | 3 | 2.8 |
| continue | 4 | 4 | 2 | 3 | 3 | 4 | 2 | 3 | 3.1 |
| khoj | 4 | 4 | 3 | 3 | 4 | 3 | 1 | 3 | 3.1 |
| **stage avg** | **3.8** | **3.6** | **2.6** | **2.9** | **2.9** | **3.1** | **1.7** | **3.1** | **3.0** |

Post scores, 1 to 5; 0 means the draft was not produced.

| App | x | linkedin | reddit | producthunt | show_hn | newsletter |
|---|---|---|---|---|---|---|
| hack-judge | 2 | 3 | 2 | 1 | 2 | 3 |
| excalidraw | 4 | 4 | 0 | 3 | 3 | 3 |
| cal-com | 0 | 3 | 3 | 3 | 3 | 3 |
| plausible | 4 | 3 | 2 | 3 | 2 | 4 |
| formbricks | 3 | 3 | 3 | 4 | 3 | 4 |
| documenso | 4 | 4 | 3 | 2 | 3 | 4 |
| dub | 4 | 3 | 2 | 4 | 3 | 3 |
| hoppscotch | 4 | 3 | 3 | 3 | 3 | 4 |
| continue | 3 | 4 | 3 | 3 | 3 | 3 |
| khoj | 4 | 3 | 3 | 4 | 3 | 4 |
| **avg (produced)** | **3.6** | **3.3** | **2.7** | **3.0** | **2.8** | **3.5** |

Two posts were never produced (excalidraw Reddit, cal-com X); both were re-drafted after the parser fix (see Re-run results).

## Systemic issues, ranked

Ranked by severity times spread (blocker 5, high 4, medium 3, low 2; spread is the number of apps hit; hoppscotch's judge filed critical, major and minor, counted here as blocker, high and low). Clusters 17 to 20 were added on review and sit after the ranked sixteen. Source paths are relative to the repo root; the Launch Kit app sources live under `apps/launchkit/`. Fixes marked uncommitted were made after the run on branch `short-video-audio` and were not yet committed when this report was written; the commit follows the report. Quoted strings inside a Fix paragraph (a banner, a warning line, a placeholder, an instruction) are from the patched sources, not from the run data. Inside quotes, the banned launch verb is written as [verb].

### 1. Approval over gate failures

Apps hit: 10 of 10. Every Show HN body over the cap, the hack-judge and excalidraw Product Hunt drafts with the banned verb, the cal-com Product Hunt tagline and description over their limits, the formbricks Reddit body (313 words against 300), the dub Reddit title (109 characters against 100), and the reel on five apps (cal-com, plausible, documenso, continue, khoj) with a spoken line that does not fit its window and `all_fit: false`.

Example, hoppscotch: "show_hn: words 278; warning "body: Upper bound of the body budget"; blockers: []. Rule: "Body order, 100 to 200 words, 3 to 5 paragraphs"". Example, hack-judge Product Hunt: "Gate lines: "first_comment: Forbidden wording for this platform.", "description: Short description limit on the listing." Status: approved." Example, plausible reel: "Drop: "Plausible. One page, clear stats." 1.98 s spoken in a 1.6 s window, page text "Still over its window even 15% faster: shorten it and speak again"; voice all_fit: false; reel status approved."

Root cause: `apps/launchkit/src/domain/gates.ts` filed every check hit, hard or soft, into `data.warnings` and never into a blockers field; `launchkit-src/frontend/drive.full.mjs` approved any draft that existed; `studio-stage.tsx` allowed Approve reel while `all_fit` was false.

Fix (done, uncommitted): `gates.ts` `gateAsset` writes `data.blockers` (caps, required shapes, the banned verb, links where none are allowed, vote asks) apart from warnings. `apps/launchkit/src/data/api.ts` `runAsset` runs one repair ask with the failures named (PREVIOUS_DRAFT plus REPAIR instructions) and keeps the second draft only when it fails fewer hard checks, recording `data.repaired`. `assets-stage.tsx` shows a red "N hard-rule failures: fix before posting" banner apart from the warnings and the Approve button carries `data-blockers`; the footer counts what the second pass repaired. `studio-stage.tsx` disables Approve reel while a spoken line runs past its window. `drive.full.mjs` approves only drafts with zero blockers and records the blocked ones. Re-run, from the re-run log: the hack-judge Product Hunt description came back at 280 characters and the repair pass cut it to 252 (`data.repaired` records it); the stored snapshot `docs/eval-10/hack-judge/appstate.rerun.json` and the 03:11 screenshot were both taken while that redraft was still running, so they hold the original 306-character draft.

Expected effect: the show_hn row (2.8) and the producthunt row (3.0) move to the 3.5 range on length and verb alone; social 2.9 toward 3.4; no post enters the plan with a hard failure.

### 2. Over-length Show HN and Product Hunt, and warnings that report the opposite

Apps hit: 10 of 10 on Show HN. Body word counts: hack-judge 252, excalidraw 246, cal-com 266, plausible 301, formbricks 241, documenso 278, dub 300, hoppscotch 278, continue 307, khoj 306 (mean 278 against a cap of 200). Two titles over 80 characters: excalidraw 84, cal-com 82. Product Hunt on 3 of 10: hack-judge description 306 characters (limit 260), cal-com tagline 64 (limit 60) and description 318, documenso first comment 300 words (cap 250).

The model's own counts assert the opposite every time. cal-com: "Description is 318 chars (limit 260); warning says "The description is 258 characters, within the 260-character limit"". hack-judge: "Model warning: "The body currently sits at the lower end of the 100 to 200 word range"" on a 252-word body. excalidraw: "Warning claims "The title is 79 characters including the 'Show HN: ' prefix"" on an 84-character title.

The false self-reports go beyond counts on 6 apps: plausible's X warning says the duplicate link was removed and it is still there; dub's X alt warning describes a revision that never applied; documenso's Show HN warning misreports the proof it used; formbricks' X warning says no comparison was used; continue's Product Hunt warnings are false and self-praising and its LinkedIn warning misclassifies the alt hook; excalidraw's Product Hunt warning admits to naming Figma when the draft names Figma, Miro and Lucidchart.

Root cause: the draft question in `apps/launchkit/src/domain/questions.ts` states the caps but the model's self-count is wrong whenever it is over; the gate counted correctly and nothing acted on the count (cluster 1). The warnings field is the model's account of its own draft, and nothing checked it against the draft.

Fix (done, uncommitted): cluster 1's repair pass with the count named in the failure ("body: Body over 200 words (246 words, cap 200)") and the instruction "Count the words and characters yourself before answering; over-length text is cut by deleting whole sentences, never excused in a warning." Re-run: cal-com X at 243 characters and excalidraw Reddit at 264 words, zero blockers on both. The gate's evidence lines (cluster 9) now name the count and the text, so a false self-count sits beside the real one. Proposed: the model's warnings shown as its notes, apart from the gate's findings, and never read as a check.

Expected effect: the Show HN row is the one most likely to gain a full point; the Product Hunt row loses its three length failures.

### 3. Invented people, origin stories, limitations and mechanisms

Apps hit: 10 of 10. Named people who are in no profile on 3 apps: plausible "Hi, I'm Marko, one of the co-founders of Plausible."; documenso "Hi, I'm Philipp, one of the co-founders of Documenso." (the co-founders are Timur Ercan and Lucas Smith); khoj "Hi, I'm Saba, one of the builders behind Khoj."; cal-com's newsletter signed "Pete". An origin story on every app: plausible Reddit "When Google Analytics 4 rolled out, I had to rebuild every report from scratch... I built Plausible Analytics to answer the basic traffic questions" for a company "running since 2018"; khoj Reddit "For a long time I used Obsidian Copilot to query my notes with an LLM."; dub Reddit "Bitly carried us fine until we launched an affiliate program"; formbricks Reddit "We ran it for a while and the renewal conversation was the final push."; hack-judge Show HN "I built it after co-judging a university hackathon where five judges used a shared spreadsheet."; hoppscotch on four posts, e.g. LinkedIn "I built it because API development tooling kept drifting toward cloud lock-in and sign-in walls."; continue Reddit "A few years ago we wanted AI coding assistance that lived inside our existing IDEs"; cal-com Reddit "So I built Cal.com." for a v6.8 product with a $28 seat tier. A limitation manufactured on 7 apps: hoppscotch "The honest gap right now is the Enterprise Edition pricing page, it returns a 404 and we haven't published public numbers yet." (the marketing site publishes pricing); formbricks "the analytics dashboard is basic compared to dedicated BI tools ... and there is no Windows-native installer"; cal-com Show HN with three limitations that "appears nowhere in the profile"; excalidraw "the npm package API changes between minor versions without a formal deprecation window"; documenso "The self-hosted path also has fewer guardrails than the hosted version right now"; continue "The JetBrains plugin lags the VS Code extension in feature parity"; khoj "the WhatsApp integration depends on a Meta Business account". Mechanisms not in the profile: dub Show HN "Click events are written to Upstash (Redis) for real-time counts and to Tinybird for analytics queries"; khoj "setup takes about ten minutes and requires no account"; continue's signal replies "a config-driven model selector that works in both VS Code and JetBrains". Two more on LinkedIn: dub presents a rewritten testimonial as a verbatim quote; plausible's hook is logically garbled once the competitor name is stripped from it.

Root cause: the platform rulebooks in `apps/launchkit/src/lib/rulebooks.ts` demand a name-and-role line, "a personal, concrete story", an honest limitation and an existing alternative, and the GLOBAL_RULES had no rule covering people, origins or limitations; the Reddit hook templates ("<Existing tool> carried us until <specific limit>") were filled literally.

Fix (done, uncommitted): `rulebooks.ts` RULEBOOK_VERSION 3 adds four GLOBAL_RULES: never invent a person (placeholder [Builder first name] / [role]); never invent an origin story, prior job, tool you used, or a limitation (use the profile's honest gap or "Limitation: [builder to add one]"); a competitor only as a neutral fact, never a negative word attached to its name; with a thin profile stay general and add no mechanism. Re-run: excalidraw Reddit reads "I work on Excalidraw" with no invented story (verified in its stored snapshot, `docs/eval-10/excalidraw/appstate.rerun.json`); the hack-judge Product Hunt maker comment, per the re-run log, opens with the placeholder "[Builder first name]" instead of an invented name. The honest gap can itself be a read failure: plausible's Show HN publishes "The /pricing page currently returns a 404; pricing is only reachable via the homepage anchor.", which is Launch Kit's own scrape artifact and not a product gap, and the rule as written would republish it. Proposed: a read failure (a 404, an unreachable page) never enters the profile's gap, so it cannot reach a draft.

Expected effect: Reddit 2.7 toward 3.3 and Product Hunt maker comments stop failing on the first line; the remaining Reddit loss is the venue (cluster 12).

### 4. Signals: run failures, stale threads, promotional noise

Apps hit: 10 of 10. Nothing returned on 4: plausible after 902 s, formbricks after 550 s, khoj after 771 s, and cal-com after a run error at 541 s that the page rendered as the empty state: "appstate run kind signals status error: "no JSON object in answer: Failed to get valid JSON response after 4 attempts" (541 s). The page reads "No signals yet. Nobody is publicly asking for what your app does right now; that's common before launch."" On the other 6, 38 threads in total and 0 verified, every browser fetch "blocked by CORS policy". documenso: 5 of 7 promotional ("A 16k-star open-source tool is quietly eating DocuSign's lunch", "OpenSign: free open-source alternative to DocuSign"). dub: 5 of 7 from affiliates, "the wrong side of Dub's marketplace". excalidraw: dated "may 4, may 4, may 17, mar 31" with a duplicate and a rival's launch post. hoppscotch: eight threads from March to May 2026. continue: URLs stored truncated ("https://dev.to/jarynagent/tabby-vs-github-copilot-i-ran-both-for-30-days-one-cos..."), so five of six cannot be opened. hack-judge: one thread is a hackathon's own rubric announcement, and every reply ends "Disclosure: I'm the builder." after promising features the app lacks. Replies carry the banned verb (documenso, hoppscotch), a number not in the profile (documenso "the repo includes a compose file that gets you running in under 10 minutes") and the raw "{APP_URL}" placeholder (excalidraw).

Root cause: `apps/launchkit/pipelines/lk_signals.pipe` had no search budget or compile deadline (cal-com and formbricks ran out of waves, plausible timed out), no rule excluding promotional, launch or vendor posts and no date preference; verification runs in the browser from `signals-stage.tsx` and is blocked by CORS; a failed run was rendered by the empty-state copy; replies do not pass the post gate.

Fix: commit f40dc23 (mid-run, 02:01): at most 8 searches, a compile deadline, 36 waves. After the run (uncommitted): `lk_signals.pipe` treats promotional posts, launch announcements and vendor or rival product posts as never signals, prefers the last 60 days and fills the date; `signals-stage.tsx` renders a failed search as "The search failed." with the error and a Search again button; `api.jobs` / `api.job` settle a run still marked running with no live job after 30 minutes as an error (an interrupted run had kept plausible's Signals stage disabled). After f40dc23 the four later apps took 319 to 771 s; khoj still returned nothing at 771 s. Re-runs for plausible, formbricks and khoj are pending (see Re-run results). Proposed: verification through the forge instead of the browser; replies through the same gate as posts.

Expected effect: signals 1.7 toward 3 if the re-runs return dated asks; the stage cannot score above 3 while verification is blocked in the browser.

### 5. Pricing: invented ladders and listings that contradict the decision

Apps hit: 10 of 10 (commercial averages 2.6). The approved listing and the chosen pricing contradict each other inside the plan on 4 apps: plausible listing "After 30 days you choose a plan, Starter at $9/mo, Growth at $14/mo, or Business at $19/mo" beside a chosen $9/$19/$49; formbricks listing "Pro plans start at $74/month for 2,000 responses and unlimited seats. Scale plans at $325/month" beside a chosen $79/$299 whose Scale tier reads "10,000 responses/mo" against the live 5,000; continue "Pro $15: Hosted model access (GPT-4, Claude, Gemini), Priority completions, Telemetry-free guarantee, Email support" for an archived repo beside a FAQ "There are no paid tiers"; khoj "Managed Cloud, $12, Hosted Khoj instance, data in your region" beside "No. Khoj Cloud was sunset in April 2026." Invented against public prices on 2: dub "Pro" 39 and "Business" 129 with "changes_from_current": [] where dub.co reads "Pro $30 per month", "Business $90 per month", "Advanced $300 per month"; hoppscotch "Undercuts Postman Basic ($9) and matches Bruno Pro ($6); $7 is defensible midpoint" with "Up to 25 seats" for a product whose live page sells "Organization $6 per user/month, billed annually" with no cap, anchored on a Postman tier that does not exist. Elsewhere: excalidraw's Team tier sells "Shared team workspace" when the profile says "Plus adds cloud workspace, team management, live presentations"; hack-judge tiers list "Custom rubrics", "API access", "Dedicated onboarding" (none on the site); two of cal-com's three options drop the free tier; documenso's revenue at 50 customers reads "1575" on the option card and "$5,250 per month" on the check panel; formbricks' discount option raises revenue; Hotjar, Pendo, Tabnine, Doodle and HackerRank labelled "emerging".

Root cause: `apps/launchkit/pipelines/lk_commercial.pipe` recommended tiers with no chosen or current pricing as a baseline and wrote the listing from the profile's `pricing_current`, not the chosen option; `revenue_at` was computed on a different basis per option (`commercial-stage.tsx`); dub's prices render through JavaScript and hoppscotch's live on hoppscotch.com while the profile read hoppscotch.io; notability came from mention counts.

Fix (done, uncommitted): `questions.ts` pricing options INCLUDED rule (a tier's includes never change a quota without saying so) and `buildCommercialQuestion` takes CHOSEN_PRICING; `lk_commercial.pipe`: the listing names no competitor and quotes only the chosen or current tiers; `commercial-stage.tsx` computes revenue at 10/50/200 from the paid tiers. Proposed: read /pricing through the studio forge's Playwright probe (dub); read the marketing domain when the site is an app shell (hoppscotch); a notability source other than mention count.

Expected effect: commercial 2.6 toward 3.3 and the plan stops carrying two prices; dub and hoppscotch need the rendered read to go higher.

### 6. Competitor negativity

Apps hit: 9 of 10 (khoj clear). In posts: excalidraw Product Hunt "The tools that survive the meeting, Figma, Miro, Lucidchart, ask you to sign up, pick a template, and care about alignment before you have even finished the thought."; cal-com Show HN "the only real options were Calendly (closed, branded, no API worth building on)"; plausible Product Hunt "GA4 means cookie banners, complex reports, and data sent to Google servers. Plausible tracks traffic with a script 54 times smaller than Google Analytics"; formbricks X thread "The core problem: Qualtrics and SurveyMonkey lock your response data in their infrastructure."; dub Reddit "Bitly doesn't touch it"; hoppscotch Reddit "Postman was fine until it started requiring a cloud account just to open saved collections, and the free tier kept shrinking." In the store listing, which is public copy, on 5 apps: cal-com "Calendly charges for features Cal.com gives away, and Calendly cannot be embedded or white-labeled via an API."; documenso "Why teams switch from DocuSign:"; hoppscotch "No other lightweight client matches this breadth out of the box"; formbricks "features neither Typeform nor SurveyMonkey offer"; dub "Can Dub replace our existing affiliate platform like Impact or PartnerStack? For most scaling SaaS and e-commerce teams, yes." In the chosen angle: plausible "Ditch GA4 Already", which every post dropped and the reel kept ("DITCH GA4. START FREE."); hack-judge's angle "Devpost handles submissions. It doesn't handle judging. There's a difference." In the profile: formbricks icp.pain "Qualtrics and SurveyMonkey are expensive, lock data in vendor clouds, and lack in-product targeting; Typeform is pretty but has no self-hosting or segmentation", which the X thread, Reddit body and listing FAQ then copied.

Root cause: brand rule 4.1 lived in the post rulebooks only; the listing prompt (`lk_commercial.pipe`), the angle prompt (`lk_brand.pipe`), the profile prompt (`lk_understand.pipe`) and the reel script had no such rule.

Fix (done, uncommitted): the GLOBAL_RULES neutral-competitor rule (posts, script, replies); `lk_commercial.pipe`: the listing names no competitor. Proposed: the same rule in `lk_brand.pipe` for angles and in `lk_understand.pipe` for icp.pain; a competitor-framed angle should not be selectable as the campaign angle.

Expected effect: removes the listing failures on five apps (commercial up half a point); plausible's angle needs the brand-stage rule.

### 7. Reel: template beats and spoken scenario numbers

Apps hit: 10 of 10. The step 3 "caught" beat on every app: formbricks "THE DATA LEAK, CAUGHT." with marker "GDPR BOUNDARY" (Formbricks does not detect data leaks); documenso "THE DEADLINE, CAUGHT."; dub "THE DROP-OFF, CAUGHT." (not a Dub feature); hoppscotch "THE FAILURE, CAUGHT. STATUS CODE 5XX FLAGGED"; continue "THE LOCK-IN, CAUGHT."; excalidraw "NO ACCOUNT. CAUGHT.". Pile lines about manual work the product does not replace: excalidraw "EVERY SKETCH. BY HAND." for a whiteboard sold on its hand-drawn style; dub "EVERY CLICK. HAND-TRACKED."; continue "EVERY FILE. BY HAND."; plausible "Every single one done by hand." Scenario numbers spoken as fact: hack-judge "Judging day. Forty-seven submissions, three judges, four hours."; plausible "Monday. GA4. Forty-seven reports, three people, two hours. Every single one done by hand."; hoppscotch "12 ENDPOINTS / 3 DEVS ON CALL / 45 MINUTES LEFT"; khoj "Late night, eight hundred forty-seven notes, three tools open, zero answers." A payoff timer with no meaning for the product ("00:30", "00:20", "00:45"). Length repairs that produced wrong words: cal-com "GET GOING" (the site anchor is "Get started") and "YOUR CAL. YOUR RULES."; continue "AI AGENT. YOUR IDE. RULES."; formbricks "GET GOING". hoppscotch's script puts the banned verb on screen three times and in the voice once ("SEND. DEBUG. [verb]."). Voice lines over their window on five apps with the reel approved on all five.

Root cause: `services/studio-forge/templates/verdict/concept.mjs` is one concept (a review queue, a commit timeline, a penalty chip, a countdown) whose slot hints named commits and penalties; `questions.ts` had no rule against scenario numbers in the voice or against naming another product; the verb swap does not run on script slots.

Fix (done, uncommitted): `concept.mjs` step 3 beat and slot hints are product-agnostic (no commits, no penalty), `payoff_timer` optional and hidden when empty; `questions.ts` reel script rules 10 and 11 (name no other product; step 3 and the payoff come from the product's own states, optional slots left empty) and voice rule 4 (scenario numbers are illustration, never spoken as fact); `studio-stage.tsx` disables Approve reel while a line overruns. Proposed: a second concept for tools without a review queue; the verb swap on script slots.

Expected effect: assets 2.9 toward 3.5 together with cluster 9; the film stays a review-queue story until the second concept exists.

### 8. Cards print error text, the slug, a customer's logo, or the wrong colour

Apps hit: 6 of 10 with a card, icon or poster fault a founder would notice. hack-judge: the card body on the Open Graph, square, story and README cards is "Hackathon Judge Aid, an app to assist with judging hackathon submissions (details unavailable; site was unreachable)." and the name everywhere is the slug: "HACK-JUDGE" above "HACKATHON-JUDGE-AID.ONRENDER.COM" on the poster, "hack-judge judges every submission." in the voice, while the DNA brand_name is "Hackathon Judge Aid". cal-com: the site read picked the "All Systems Operational" status pill as the logo, so the 512x512 icon card and the poster carry it instead of the Cal mark. dub: "HUBERMAN LAB" (a customer's mark, `assets.dub.co/companies/hubermanlab.svg`) on the lockup and the icon, with the accent "#00aef4" sourced from it. formbricks: "primary #e2e8f0 most common button background", so every card is white and grey with no brand teal. continue: a "NOW LIVE" pill on every card for an archived repo. Headline truncation on the platform cards: hack-judge X image ("applies the criteria..."), dub LinkedIn and Reddit images, khoj LinkedIn card ("an AI over their own..."). Poster legibility: formbricks' navy wordmark and continue's mark are near invisible on the black frame.

Root cause: `apps/launchkit/src/domain/studio.ts` `kitCopy` took `profile.one_liner` verbatim and `displayName` took the launch slug; `services/studio-forge/lib/probe.mjs` ranked any header image or logo-classed image as a logo candidate and chose the most common button background as primary; `services/studio-forge/lib/cards.mjs` does not fit the headline.

Fix (done, uncommitted): `studio.ts` `kitCopy` prefers the listing's tagline and short description and strips bracketed profile caveats; `displayName` uses the DNA brand name when the launch was created under a kebab slug (hack-judge becomes Hackathon Judge Aid) for cards, script, voice and images. `probe.mjs`: header images and inline SVGs that are status pills, badges, sponsor logos, avatars or flags are not logo candidates; a logo-classed image outside the header, nav or home link ranks after the site's own icons; the primary colour needs chroma >= 0.12. Proposed: headline fitting in `cards.mjs`; no "NOW LIVE" pill when maturity is archived.

Expected effect: removes the two blocker-grade card faults and both wrong logos; assets rises as far as the reel and the photographs allow.

### 9. Gate regex noise and ranges mangled by the sanitizer

Apps hit: 10 of 10, on every post. cal-com: "src/lib/rulebook-checks.ts lines 21, 41, 55, 79, 100: value: '[,,]' (xxd shows 5b 2c 2c 5d). Every post here has dashes: 0 yet shows "post: Em or en dash; sanitizeDraft already replaces these, this is the belt", "tagline: Em dash and en dash.", "body: Forbidden wording for this platform."". excalidraw: "gates.ts line 156: new RegExp(c.value, "i")" so "post: Three consecutive words of four or more capitals" fires on a LinkedIn post with no capitals run ("Excalidraw skips that" matches under i). Check descriptions leak as warnings: "duplicates the gates.ts check so this rulebook is complete on its own"; "body: Forbidden wording for this platform." names no word on seven apps; hoppscotch's Reddit title in the exact "<Name> - <short description>" format the rulebook mandates is flagged by the dash check. Per post, 4 to 12 warnings, most of them these. The same sanitizer ran over the outputs: excalidraw's commercial stage has price ranges turned into comma lists, and documenso's profile has a range mangled the same way.

Root cause: the dash sanitizer had run over `apps/launchkit/src/lib/rulebook-checks.ts` and replaced the dash characters inside the five dash regexes with commas; `forbidden_regex` compiled case-insensitively in `gates.ts`; the check description was used as the warning text with no evidence; the same sanitizer replaced the unspaced en dash inside a range with a comma in the outputs it cleaned.

Fix (done, uncommitted): `rulebook-checks.ts`: the five dash checks and the Show HN dash checks are `[\u2014\u2013]` again, written as unicode escapes so the sanitizer cannot alter them; the two capitals checks are case-sensitive through a new optional `flags` field; all 134 descriptions rewritten as founder-facing sentences. `gates.ts` `runRulebookCheckHits` returns id, field, description, evidence and hard, so a warning names the field, the count and the offending text ("body: Body over 200 words (246 words, cap 200)"). `apps/launchkit/src/domain/sanitize.ts`: an unspaced en dash inside a range, as in $8 to $10 or A to C, becomes a hyphen instead of a comma.

Expected effect: no direct score change; the warning lists shrink to the real hits, so cal-com's 64-character tagline and the invented limitations become visible instead of buried; price ranges read as ranges.

### 10. Targets ignore that the product is established

Apps hit: 10 of 10. Nine launched products ranked as first launches; hack-judge, the one alpha, was offered G2, Capterra and AppSumo. plausible: "#1 Show HN (see above); #5 r/privacy, which removes self-promotion; #10 AlternativeTo, #11 SaaSHub, #12 G2, #13 awesome-privacy-friendly-web-analytics, #14 awesome-selfhosted all already carry Plausible." while the Show HN draft's own warning says "Plausible is an established, commercially launched product with 21,000 paying subscribers. HN Show HN posts are intended for projects being shown for the first time". documenso: "Product Hunt is absent from all 14 venues although a PH post was drafted and approved." hoppscotch: AlternativeTo, StackShare, SaaSHub and awesome-selfhosted already list it and Product Hunt is absent. formbricks: awesome-selfhosted already lists it and rank 6 "ParticipantKit ResearchOps Newsletter" is a vendor's own list. cal-com: "the auto-selection took ranks 1 to 3 and left the two high-impact venues unticked" (r/selfhosted, Product Hunt). dub: every selected venue has `"rules_summary": "not verified"`. continue: "textbook Show HN candidate" for an archived repo. khoj: Show HN first with no prior-launch check for a 2021 project.

Root cause: `apps/launchkit/pipelines/lk_targets.pipe` ranked on stars and repo type with no prior-launch check, no already-listed check and no link to the Show HN draft's warning; the drive ticks ranks 1 to 3.

Fix (done, uncommitted): `lk_targets.pipe` ESTABLISHED CHECK (launched over a year ago, over 5,000 stars, paying customers, prior Show HN or Product Hunt): Show HN and Product Hunt rank below niche communities with a repeat-launch note; directories already listing the app are excluded. Proposed: the Show HN draft's prior-launch warning feeds Targets; selection by impact rather than rank.

Expected effect: targets 3.1 toward 4; the plan stops carrying a Show HN venue where the draft says not to post one.

### 11. Generic photographs

Apps hit: 10 of 10; the vision judge scored all 40 chosen plates 8 or 9. formbricks: "No survey, NPS widget, in-app prompt or response feed is legible anywhere; the subject brief places a product manager beside a server rack. The vision judge scored 8, 9, 9, 9 on fidelity to the brief, not on whether a stranger would recognise Formbricks." documenso: "No signature, contract, sign-here tab or signing screen in any frame; the domain list is 9 of 11 generic". excalidraw: the arrival monitor shows "an isometric CAD-style building" and the judge rewarded "the brief's architectural workspace world". hack-judge's four plates are on-world for the wrong product ("clipboards dense with handwritten rubric marks"). The hero plate breaks subject continuity on excalidraw, cal-com, documenso and khoj ("a white man in a dark sweater seated in hero" after two plates of "a Black researcher with short natural hair").

Root cause: the image brief (`questions.ts` `buildStudioImagesQuestion` through `lk_studio.pipe`) returns generic world lists ("a terminal window open beside a browser tab"); `services/studio-forge/lib/images.mjs` judges takes on fidelity to the brief, not on recognisability; the shot list (dark office, seated woman, coffee mug, three colleagues at a screen) is the same on every app.

Fix: proposed only. One identifying prop from the product's world per plate, required in the brief and scored by the judge; a continuity check on the hero plate.

Expected effect: with cluster 7, assets toward 3.5; without it the cards and the film stay anonymous.

### 12. Plan venues and posts do not match

Apps hit: 10 of 10. The Reddit post was drafted for r/SideProject on 7 apps whose plan venue is another subreddit: cal-com, plausible, formbricks, documenso, dub (venue r/AffiliateMarketing), hoppscotch, continue (venues r/LocalLLaMA and r/vscode). khoj was drafted for the r/selfhosted "New Project Megathread" for a project created in 2021. excalidraw carries r/softwarearchitecture with no Reddit draft. hack-judge carries approved Show HN and Reddit drafts with no venue. Product Hunt was drafted and approved with no venue on excalidraw, cal-com, documenso and hoppscotch. Approved LinkedIn, X and newsletter posts have no tracked link on any app. hoppscotch: "Reddit warning: "No TARGET subreddit was specified; this draft is written for r/SideProject at mention level 2"; targets selected: Show HN, DevHunt, r/selfhosted; plan tracked link: lk_subreddit_r_selfhosted."

Root cause: Social runs before Targets, so `runAsset` in `api.ts` had no target and the Reddit rulebook defaulted to r/SideProject; `apps/launchkit/src/domain/plan.ts` issued tracked links per selected venue only.

Fix (done, uncommitted): `api.ts` writes the Reddit draft for the selected subreddit target; `plan.ts` gives an approved post whose platform has no chosen venue its own tracked-link row. Re-run: excalidraw Reddit drafted for r/softwarearchitecture, the venue chosen in Targets. Proposed: run Targets before Social, or redraft Reddit when the venue changes.

Expected effect: plan 3.1 toward 4; Reddit 2.7 rises with cluster 3.

### 13. The banned verb outside the post gate

Apps hit: 5 of 10. Approved posts: hack-judge Product Hunt first comment "Those are on the list but not [verb]."; excalidraw X thread "It [verb]s as an npm package too (@excalidraw/excalidraw)." and Product Hunt first comment. Outside posts: continue's profile "Final 2.0.0 release [verb] for VS Code, CLI, and JetBrains" and listing FAQ "No new features or bug fixes will be [verb]."; hoppscotch's reel script on screen three times and spoken once; documenso's and hoppscotch's signal replies; documenso's angle big_idea; excalidraw's profile description, which is where its two drafts got the word.

Root cause: `sanitizeDraft` ran on posts only; the profile (`lk_understand.pipe`), listing (`lk_commercial.pipe`), angles (`lk_brand.pipe`), script slots (`lk_studio.pipe`) and replies (`lk_signals.pipe`) had no swap.

Fix: commit 798b00d (mid-run, 01:02): `apps/launchkit/src/domain/sanitize.ts` `sanitizeVerbs` swaps the verb for release in every draft field except warnings, counted on the card; `gates.ts` now files it as a blocker. hoppscotch and continue ran after 798b00d and the verb still appears in the reel script, the profile and the listing, so the swap covers post drafts only. Proposed: run `sanitizeVerbs` on the profile, listing, angles, script slots and replies.

Expected effect: no approved post carries the verb; the reel and listing need the extension.

### 14. Visual DNA empty while Assets reads the palette

Apps hit: 7 of 10 with an empty or meta-tag-only visual block (excalidraw, cal-com, plausible, documenso, dub, hoppscotch, khoj); formbricks found the teal but no typography. khoj: "brand.dna.visual: colors [], typography headings "", body "", logo_url "", notes: "All three scrapes returned markdown without HTML/CSS styling"" while the Assets site read of the same site found "primary #fecb09, accent #fed60a, icon 203x203 lantern Picked". plausible: "Scrape returned markdown without CSS" against Assets' "#909cf7". excalidraw: colours only from the meta theme-color tag while Assets read "#6965db".

Root cause: `lk_brand.pipe` reads the site through the markdown scrape, which drops CSS and images; the forge's `probe.mjs` reads the rendered page. Two reads of one site.

Fix: proposed only. One site read shared by Brand and Assets: the probe's palette, fonts and logo fed into the DNA.

Expected effect: brand 3.6 toward 4; no card change, since Assets already has the palette.

### 15. The parser dropped two drafts and the drive reported them as done

Apps hit: 2 of 10 (excalidraw Reddit, cal-com X), plus cal-com's summary, which "hides two stage failures". excalidraw: "appstate run kind asset:reddit_post status error: "EOL inside string literal at position 388 in Python literal"". cal-com: "appstate run kind asset:x_post status error: "EOL inside string literal at position 229 in Python literal" (54 s). The Social page shows "No draft yet. Press Draft for X and it appears here." summary.json says X drafted: true and approved: 5."

Root cause: `apps/launchkit/src/domain/parse.ts` gave up on a raw newline inside a JSON string; `drive.full.mjs` counted a draft as drafted when the run returned.

Fix: commit 97a90b9 (mid-run, 00:59): `parse.ts` `escapeControlsInStrings` repairs raw newlines inside JSON strings. Re-runs: excalidraw Reddit in 33 s, cal-com X in 38 s, zero blockers on both. Proposed: the drive summary reads the run status, not the click.

Expected effect: the two 0 cells in the post table become drafts; the Reddit and X averages cover ten apps.

### 16. Thin-profile invention (hack-judge)

Apps hit: 1 of 10, and it took every stage of that run to 2 or 3. The profile "an app to assist with judging hackathon submissions (details unavailable; site was unreachable)" at confidence 0.1 was approved and locked. Product Hunt then wrote "Organizers set up an event, define a scoring rubric, and invite judges... exports results to CSV"; the live site, read eight minutes later by the Assets probe, says "Each repo is fetched locally (A), then classified on RocketRide Cloud (B). Projects with git commits older than the hackathon date (±2 days) get flagged as pre-event work and lose the penalty points you set". The listing FAQ states "Yes, multi-judge scoring and score aggregation is the core use case the app is built around."

Root cause: `drive.full.mjs` approved a profile with `analysis_degraded` true and no retry; `questions.ts` gave the drafter the same question at confidence 0.1 as at 0.9, and the hook patterns demand a mechanism.

Fix (done, uncommitted): `profile-stage.tsx` shows a red banner "The site could not be read in full: analyze again before approving." with an Analyze again button; `drive.full.mjs` re-analyzes once when the read was partial; `questions.ts` adds a THIN_PROFILE section to the draft question when `analysis_degraded` or confidence under 0.5 (describe only the one-liner, no mechanism, a "[Builder: two sentences on why you built it]" placeholder). Re-run: the Product Hunt redraft under the new global rules still invented the rubric mechanism, which is why the THIN_PROFILE section was added afterwards; its re-run is pending.

Expected effect: hack-judge becomes either a truthful thin launch (profile and social at 3) or a stopped run; no effect on the other nine.

### 17. Proof standards differ by stage

Apps hit: 4 of 10. dub (commercial): the listing keeps the unproven 30% claim that every post dropped and adds features and policies not in the profile. khoj (commercial): the listing's call to action asks for a star, states a setup time nobody verified and cites the unreachable enterprise page as fact. formbricks (brand): different proof standards for the same client logos. hoppscotch (commercial): the research summary contradicts itself on how many competitors are established.

Root cause: the proof rules (every claim traces to the profile; no vote or star ask) live in the post rulebooks; the listing prompt in `lk_commercial.pipe` and the DNA prompt in `lk_brand.pipe` have none, and cluster 5's listing fix removes competitors only.

Fix: proposed only. The post rulebooks' proof standard applied to the listing and the DNA, and one competitor count carried through the commercial research.

Expected effect: the listing stops carrying claims the posts dropped; small on the commercial score, since pricing (cluster 5) dominates it.

### 18. Angles shaped as channels, not stories

Apps hit: 4 of 10. formbricks (brand): the chosen angle is a channel, not a story, and it contaminates every platform's post. dub (brand): the angle set is one angle per channel, by formula. khoj and hack-judge (targets): the channels the angles name do not match the venues Targets selected.

Root cause: not traced in this run; the angles come out of `lk_brand.pipe` and the venues out of `lk_targets.pipe`, and neither reads the other.

Fix: proposed only. `lk_brand.pipe`: an angle is a story about the product, never a channel; `lk_targets.pipe` reads the chosen angle so the venues and the angle agree.

Expected effect: brand and targets each gain where the angle was a channel; with cluster 12, the plan's venues and posts tell one story.

### 19. Profile and DNA facts read from the wrong page

Apps hit: 4 of 10. cal-com (profile): the repo fetch failure is reported as a fact about a public repo, and the headline differentiator is taken from the cal.diy fork's README. documenso (brand): a DNA proof point misreads the open metrics page and records the wrong funding total. hoppscotch (profile): the open issue count is dressed as engagement. khoj (profile): the differentiator is a restated proof point.

Root cause: `lk_understand.pipe` records a failed repo read as a finding and takes the first README it gets; the DNA proof points in `lk_brand.pipe` are not checked against the page they cite.

Fix: proposed only. A failed read is a gap, never a fact (the cluster 16 banner covers the site read, not the repo read); a numeric proof point is checked against its source page before it enters the DNA.

Expected effect: one wrong fact fewer in the profile or DNA on each app named; small on the scores.

### 20. Rulebook shapes broken in approved posts

Apps hit: 6 of 10. The LinkedIn shape the rulebook bans, an It's not X, it's Y contrast, approved on formbricks (line 2) and hoppscotch. Two proof points where the rule allows one, alt variants that are reworded copies of the main draft, and the same phrase recurring across platforms on dub and continue. The Reddit title format for r/SideProject ignored on hack-judge and dub (cluster 1 lists only dub's title length). The cal-com newsletter subject over its length.

Root cause: none of these fired as a gate hit in the run, so either `rulebook-checks.ts` has no check for the rule or the hit was buried under the noise of cluster 9; not traced per rule.

Fix: proposed only. A check per rule in `rulebook-checks.ts` (the LinkedIn contrast shape, the proof-point count, the Reddit title format, the newsletter subject length), filed as hard where the rulebook bans the shape, so the cluster 1 repair pass acts on it.

Expected effect: LinkedIn 3.3 and Reddit 2.7 gain where the shape was the judge's lead issue; the gate stops passing what the rulebook says not to post.

## Per app

### hack-judge (Hackathon Judge Aid)

- What it is: an alpha on a Render free tier at hackathon-judge-aid.onrender.com with no repo; the profile read got HTTP 503 twice, and the live page, read later by the Assets probe, classifies GitHub repos and flags pre-event commits.
- Strongest: "Paste your repos and run. Every repo gets classified. Pre-event commits get caught." (the reel's spoken How line, the only output grounded in the live site)
- Weakest: "Hackathon Judge Aid, an app to assist with judging hackathon submissions (details unavailable; site was unreachable)." printed as the product description on the Open Graph, square, story and README cards.
- Verdict changer: a profile that refuses approval at confidence 0.1 and retries the cold host; every later stage was written for a rubric-scoring tool the site does not describe.
- Timing: 19.2 min, the fastest run (lane 1, 00:32 to 00:51); signals 316 s, social 235 s; average 2.4, the lowest in the set.

### Excalidraw

- What it is: open-source virtual whiteboard with hand-drawn style, 131,595 stars, free tier plus Plus at $6; profile confidence 0.92.
- Strongest: "131,595 GitHub stars, and you still don't need an account to use it. That's the whole point of Excalidraw." (LinkedIn line 1)
- Weakest: the Reddit post, which does not exist: "EOL inside string literal at position 388 in Python literal" while the plan carries r/softwarearchitecture. Re-run after 97a90b9: 264 words, zero blockers, 33 s.
- Verdict changer: the banned verb approved twice, and a Team tier at $10 that sells "Shared team workspace" when the profile says "Plus adds cloud workspace, team management, live presentations".
- Timing: 25.2 min (lane 2, 00:33 to 00:57); signals 427 s for four stale threads; average 3.1.

### Cal.com

- What it is: scheduling platform, v6.8, Teams $12 and Organizations $28 per seat yearly; profile confidence 0.78 because the repo read came from the cal.diy fork.
- Strongest: "Cal.com is a scheduling platform that takes a person's availability rules and calendar connections and produces shareable booking links, embeddable booking flows, and a full API your own product can call." (Show HN body, first sentence)
- Weakest: "Calendly charges for features Cal.com gives away, and Calendly cannot be embedded or white-labeled via an API." (store listing FAQ)
- Verdict changer: the X post and the Signals search both errored and were reported as fine, and the icon and poster carry "All Systems Operational" instead of the Cal mark. X re-run after 97a90b9: 243 characters, zero blockers, 38 s.
- Timing: 28.1 min (lane 1, 00:52 to 01:19); signals 544 s to a parse error; average 3.0.

### Plausible

- What it is: cookie-free web analytics, running since 2018, 21,000 paying subscribers, 29,020 stars; profile confidence 0.78 (pricing page 404, recovered from the homepage anchor) and the only profile rated 5.
- Strongest: "One honest limitation: the Community Edition does not include funnels, revenue attribution, or SSO. Those are cloud-only for now, and we know that is a gap for teams who want full features on self-hosted infrastructure." (Product Hunt first comment)
- Weakest: "Plausible Analytics - cookie-free analytics I built after the GA4 migration broke my setup" (Reddit title, for a company that predates GA4), with the Show HN body's "The /pricing page currently returns a 404; pricing is only reachable via the homepage anchor." close behind.
- Verdict changer: the chosen angle "Ditch GA4 Already" is one every platform rule forbids, so the posts contort it, drop it or fabricate around it while the reel shouts it; a competitor-framed angle should not be selectable.
- Timing: 34.3 min, the longest run (lane 2, 00:58 to 01:31); signals 902 s and empty; average 3.1.

### Formbricks

- What it is: open-source experience management platform (in-app, website, link and email surveys), 12,928 stars, Pro $74 and Scale $325; profile confidence 0.9.
- Strongest: "Feedback data in a vendor cloud is a compliance risk and a lock-in. Formbricks runs in-app, website, link, and email surveys from your own infrastructure under AGPLv3. Connects to Slack, Zapier, n8n, and Notion with a full API included." (Product Hunt description, 236 characters)
- Weakest: "THE DATA LEAK, CAUGHT." with marker "GDPR BOUNDARY" and chip "SELF-HOST" (reel step 3, rendered in the launch film; Formbricks does not detect data leaks)
- Verdict changer: the listing says "$74/month" and "$325/month" beside a chosen decision of $79/$299 that also doubles the Scale quota to "10,000 responses/mo"; the plan carries both.
- Timing: 28.5 min (lane 1, 01:20 to 01:47); signals 550 s and empty; average 3.0.

### Documenso

- What it is: open-source e-signatures, self-hostable and embeddable, 14,980 stars, Free to Platform $250; profile confidence 0.9.
- Strongest: "14,980 developers starred Documenso on GitHub. They didn't do it for the UI." (LinkedIn line 1)
- Weakest: "Hi, I'm Philipp, one of the co-founders of Documenso." (Product Hunt first comment; the co-founders are Timur Ercan and Lucas Smith and the profile holds no name)
- Verdict changer: the invented co-founder, and a signals queue that is five parts promotion ("A 16k-star open-source tool is quietly eating DocuSign's lunch"); the Show HN redraft under the new rules is pending.
- Timing: 26.8 min (lane 2, 01:33 to 01:58); signals 499 s; average 3.3, the highest in the set, with the only plan rated 4.

### Dub

- What it is: link attribution (short links, conversion tracking, affiliate programs), 24,719 stars, public prices Free $0, Pro $30, Business $90, Advanced $300; profile confidence 0.82 because the prices render through JavaScript and were not captured.
- Strongest: "Link attribution that tracks revenue, not just clicks" / "Link shorteners give you click counts but cannot tell you which clicks became customers. Dub connects short links, conversion analytics, and affiliate management so the full funnel is visible in one place. Open-source under AGPLv3 and self-hostable." (Product Hunt tagline and description)
- Weakest: the reel's closing lockup: a boxed "HUBERMAN LAB" mark above "FOR GROWTH AND MARKETING TEAMS / DUB / TURN CLICKS INTO REVENUE. / DUB.CO" (a customer's logo picked as Dub's)
- Verdict changer: a pricing decision of "Pro" 39 and "Business" 129 for a company whose $30/$90/$300 are public; the profile needs the rendered pricing page.
- Timing: 25.8 min (lane 1, 01:49 to 02:13); signals 373 s for seven affiliate-side threads; average 2.8.

### Hoppscotch

- What it is: open-source API client (REST, GraphQL, WebSocket, MQTT) as a PWA, 80,280 stars; profile confidence 0.78 because hoppscotch.io is the app shell while pricing and testimonials live on hoppscotch.com, which was never read.
- Strongest: "Hoppscotch: TypeScript, MIT, 80,280 GitHub stars. REST, GraphQL, WebSocket, MQTT in one PWA. Self-host in minutes. {APP_URL}" (X post; a founder would cut "in minutes")
- Weakest: "Undercuts Postman Basic ($9) and matches Bruno Pro ($6); $7 is defensible midpoint" with "Up to 25 seats" (pricing rationale; Organization already sells at $6 with no cap, Postman has no Basic tier, Insomnia Pro is $12)
- Verdict changer: read the marketing domain; that one miss produced the invented tier, the false limitation "the Enterprise Edition pricing is not publicly listed" on three posts and the listing FAQ "contact the team for pricing". The reel also carries the banned verb on screen three times.
- Timing: 25.4 min (lane 2, 01:59 to 02:24); signals 400 s for eight unverified threads from March to May; average 2.8.

### Continue

- What it is: open-source AI coding agent for VS Code, JetBrains and CLI, 35,870 stars, archived after the Cursor acquisition; profile confidence 0.78 (the site is an acquisition notice).
- Strongest: "35,870 developers starred this. The repo is archived. The code is yours." (the chosen angle's hook, carried into the X post and adapted for LinkedIn)
- Weakest: "Pro $15/month: Hosted model access (GPT-4, Claude, Gemini), Priority completions, Telemetry-free guarantee, Email support" (a paid tier for an archived project, carried into the plan beside a listing that says "There are no paid tiers")
- Verdict changer: an archived-product branch through the later stages: no pricing options, no "NOW LIVE" pill, no "Install the extension." voice line, no signup attribution.
- Timing: 21.3 min (lane 1, 02:14 to 02:35); signals 319 s, six URLs truncated with an ellipsis; average 3.1, with the only targets rated 4.

### Khoj

- What it is: self-hostable AI second brain over notes and the web, 37,266 stars, a project since 2021, cloud sunset April 2026; profile confidence 0.72 (pricing 404, enterprise page unread).
- Strongest: "we store the semantic index in Postgres with pgvector, which makes queries fast but ties you to a running database. Would you rather we supported a flat-file index (something like SQLite-vec) for single-user installs where portability matters more than query speed?" (Show HN closing question)
- Weakest: "For a long time I used Obsidian Copilot to query my notes with an LLM. It worked fine until I realized every query was going through a third-party API with my actual note content attached. That was the moment I stopped and started building something different." (Reddit opening; Khoj predates Obsidian Copilot)
- Verdict changer: the signals search returned nothing after 771 s, after the budget fix, in a category with daily r/selfhosted and r/LocalLLaMA asks; the re-run is pending. The listing says no cloud exists beside a "Managed Cloud $12/mo" decision.
- Timing: 32.0 min (lane 2, 02:25 to 02:56), the last app to finish; signals 771 s; average 3.1, with the only assets rated 4 (the yellow lantern icon and palette on every card).

## What works

Outputs the judges rated 4 or 5, with the evidence that earned the score.

- Profile, 5 on plausible and 4 on excalidraw, cal-com, formbricks, documenso, dub, continue and khoj (average 3.8, the highest stage). plausible: "every claim traces to the homepage or README, the voice is Plausible's own, and confidence is honestly capped for the 404 pricing page". excalidraw: "Proof points are verbatim plus.excalidraw.com testimonials (Karpathy, Theo, Orosz) and README integrators; confidence 0.92 with the pricing redirect noted." formbricks: "Everything else in the profile checks out against the live site: h1 "The Open Source Experience Management Platform", Hobby free with 250 responses, Pro $74, Scale $325, hosted in Frankfurt". dub: "Verified true: "100M+ clicks and 2M+ links processed monthly (README.md)", customer list, "255 HN points badge", "Turn clicks into revenue", the Ian Mackey quote." documenso: "Pricing (Free $0, Individual $25, Teams $40, Platform $250) checks out against documenso.com/pricing; confidence note honestly flags the unscraped self-hosted page." cal-com: "pricing_current ($12 Teams, $28 Orgs yearly, monthly unverified) is accurate". continue: "it read the acquisition notice, chose an angle that fits an archived repo, and every post says the repo is read-only". khoj: "The other three (AGPL self-host, multi-client, LLM-agnostic) match the README."
- Brand DNA and angles, 4 on excalidraw, cal-com, plausible, formbricks, documenso, continue and khoj. excalidraw: "DNA voice and quotes are faithful and the six angles are distinct". cal-com: "Evidence quotes ("We're building the infrastructure for time", "Connecting a billion people by 2031") are real site copy and the six angles are distinct." formbricks: "colour #00C4B8 is the real brand teal, typography is honestly left empty at confidence 0.72". documenso's chosen angle "Document signing is infrastructure. Infrastructure should be open." matches the site's own "Join the Open Signing Movement". continue's chosen angle Fork the Foundation, with "the DNA quotes are real site copy".
- X posts, 4 on excalidraw, plausible, documenso, dub, hoppscotch and khoj (average 3.6, the highest post). hoppscotch: the full post quoted above, "Every noun and number traces to the repo (80.3k stars verified live)". documenso: "Otherwise compliant: under 280, URL last, no hashtags, question at thread end, two distinct alt hooks." plausible: the X drafter dropped the 54x multiplier and the GA4 hook citing the platform rules.
- LinkedIn, 4 on excalidraw, documenso and continue. excalidraw: "131,595 GitHub stars, and you still don't need an account to use it. That's the whole point of Excalidraw." documenso: "14,980 developers starred Documenso on GitHub. They didn't do it for the UI." continue: "The post itself reads well: 149 words, line one 122 chars, link in first comment, three hashtags last."
- Product Hunt listing copy, 4 on formbricks, dub and khoj. formbricks: "236 chars, opens on the concrete thing, every claim traces to the site, no hype, no vote ask". dub: "Every clause traces to the README or the site, it is 53 and 249 characters, no vote ask, no competitor, and the maker comment names a real rough edge ("there is no self-serve interactive sandbox")." plausible's maker comment (post rated 3) carries the one limitation in the set that is both true and specific: "the Community Edition does not include funnels, revenue attribution, or SSO."
- Newsletter pitch, 4 on plausible, formbricks, documenso, hoppscotch and khoj. formbricks: "Subject (58 chars), 112 words, bare link on its own line, "Happy to send screenshots or answer anything your readers ask." and honest placeholders for addressee and first name are all correct." khoj: the pitch signs "[Your first name]" where the Product Hunt comment in the same run invented a name.
- Targets, 4 on continue: "The 14 venues are all real and the top three (Show HN, r/LocalLLaMA, r/vscode) fit a self-hostable IDE extension."
- Plan, 4 on documenso: "Decisions panel: Angle "Open Signing Movement Drop", Pricing "Freemium Ladder, free plus paid tiers: Free $0/mo, Individual $25/mo, Teams $40/mo, Platform $250/mo", Listing "Documenso, Open-Source E-Signatures" all match the earlier stages."
- Assets, 4 on khoj: the site read found "primary #fecb09, accent #fed60a, icon 203x203 lantern Picked", and "the on-brand cards and poster are close to postable".
- The mechanical layer where it is not noise: the gate did count hack-judge's 306-character description and its banned verb, and dub's draft warnings about the unproven 30% claim and the prior Show HN "show real judgment"; excalidraw's Show HN warning concedes "HN accepts a repeat Show HN only for a major overhaul." The failure was in acting on these, not in finding them.

## Run facts

- Pipelines: Launch Kit pipes on RocketRide, in `apps/launchkit/pipelines/`: `lk_understand` (profile), `lk_brand` (DNA and angles), `lk_commercial` (competitors, pricing options, listing), `lk_assets` (the six posts through `runAsset`), `lk_studio` (pricing option drafts, the reel script, the voice lines, the image briefs and their repairs), `lk_targets`, `lk_signals`, `lk_navigator`, `lk_rescore`; all on `claude-sonnet-4-6` through the Anthropic API. `lk_store` and `lk_store.external` (the launch store) name `Qwen/Qwen3-235B-A22B-Instruct-2507-FP8`.
- Studio forge (`services/studio-forge/`): four photographs per app from `gpt-image-2`, each take scored 1 to 10 by a vision judge (`gpt-5-mini`, with `gpt-4.1-mini` as the fallback when the first model refuses; excalidraw's plates were judged by the fallback); voice from Chatterbox (Resemble AI, MIT); the film is the Verdict concept in `services/studio-forge/templates/verdict/concept.mjs`, 24 seconds, five spoken lines with per-line windows.
- Runner: `launchkit-src/frontend/run-eval.mjs` drives `drive.full.mjs` over the ten apps in two lanes, one app at a time per lane, and the drive approves every stage to walk the whole launch. Lane 1: hack-judge (00:32 to 00:51), cal-com (00:52 to 01:19), formbricks (01:20 to 01:47), dub (01:49 to 02:13), continue (02:14 to 02:35). Lane 2: excalidraw (00:33 to 00:57), plausible (00:58 to 01:31), documenso (01:33 to 01:58), hoppscotch (01:59 to 02:24), khoj (02:25 to 02:56). Times are local on 2026-09-11.
- Wall-clock: 2 h 24 min (00:32 to 02:56) for 266.6 app-minutes; mean 26.7 min per app, minimum 19.2 (hack-judge), maximum 34.3 (plausible). Per stage the mean was signals 510 s, social 288 s, assets 252 s, commercial 204 s, brand 139 s, targets 107 s, profile 78 s, plan 4 s. Signals was the slowest stage on every app (316 to 902 s).
- Judging: one judge agent per app, scoring every stage and every post 1 to 5 with quoted evidence, in two batches (`judged-batch-1.json`: excalidraw, plausible, hack-judge, documenso, cal-com, formbricks; then dub, hoppscotch, continue, khoj), merged into `judged.json`. Mechanical facts per app are in `matrix.json`; timings in `index.json`; each app folder holds `extract.json`, `appstate.json`, `summary.json`, `drive.log`, the eight stage screenshots, `plates.jpg` and `poster.jpg`.
- Mid-run fixes, all three on branch `short-video-audio`: 97a90b9 at 00:59 (`parse.ts`: raw newlines inside JSON strings no longer lose a draft; excalidraw Reddit and cal-com X were the casualties), 798b00d at 01:02 (`sanitize.ts`: the banned verb swapped for release in every draft field except warnings, counted on the card), f40dc23 at 02:01 (`lk_signals.pipe`: at most 8 searches, a compile deadline, 36 waves; cal-com and formbricks had run out of waves, plausible timed out). hack-judge and excalidraw finished before any fix; cal-com and plausible were in flight when the first two landed (cal-com's X draft failed at 00:53, before the parser fix). By file times formbricks and documenso started after the parser and verb commits and their signals searches ran before the signals commit; whether the running dev server had reloaded the first two by then is not recorded. dub, hoppscotch, continue and khoj ran with all three in place.
- Effect of the mid-run fixes on the later four: no parser loss (24 of 24 posts drafted); no banned verb in an approved post, although it survived in hoppscotch's reel script, continue's profile and listing, and two signal replies; signals took 319 to 771 s against 316 to 902 s before, with khoj still empty at 771 s.
- After-run fixes (uncommitted when this report was written; the commit follows the report): `apps/launchkit/src/lib/rulebook-checks.ts`, `src/domain/gates.ts`, `src/data/api.ts`, `src/lib/rulebooks.ts` (RULEBOOK_VERSION 3), `src/domain/questions.ts`, `src/domain/studio.ts`, `src/domain/sanitize.ts` (an unspaced en dash inside a range, as in $8 to $10 or A to C, becomes a hyphen instead of a comma), `src/domain/plan.ts`, the five stage components (`assets-stage.tsx`, `commercial-stage.tsx`, `profile-stage.tsx`, `signals-stage.tsx`, `studio-stage.tsx`), `pipelines/lk_targets.pipe`, `pipelines/lk_signals.pipe`, `pipelines/lk_commercial.pipe`, `services/studio-forge/lib/probe.mjs`, `services/studio-forge/templates/verdict/concept.mjs`, `launchkit-src/frontend/drive.full.mjs`, and the new `launchkit-src/frontend/drive.rerun.mjs`, which re-runs one action from a saved store into `appstate.rerun.json`.

### Re-run results (after the fixes, same saved stores)

Each re-run seeds the app's original store (`docs/eval-10/<slug>/appstate.json`) into the preview, presses one button against the patched code, and saves the result beside it as `appstate.rerun.json`. Times are wall-clock with two to four runs sharing the pipeline.

| App, action | Before | After |
| --- | --- | --- |
| excalidraw, Draft for Reddit | lost to "EOL inside string literal" (no post) | drafted in 33 s for r/softwarearchitecture, the venue chosen in Targets, 264 words, zero hard failures, "I work on Excalidraw" with no invented story |
| cal-com, Draft for X | lost to "EOL inside string literal" (no post) | drafted in 38 s, 243 characters, zero hard failures |
| hack-judge, Redraft Product Hunt | description 306 characters and the banned verb in the maker comment, approved | first pass 280 characters, the repair pass cut it to 252 (recorded in `repaired`); the maker comment opens "Hi, I'm [Builder first name]" instead of an invented name; no banned verb. The first pass still described a rubric mechanism from the thin profile, so the THIN_PROFILE section was added afterwards; its own re-run did not finish inside seven minutes with four runs sharing the pipeline and is not counted |
| documenso, Redraft Show HN | 278 words, approved over the cap | with the cap-only repair ask: 267 words, then 234 (the model cut too little). With the repair ask that names the cut ("delete at least 64 words, whole sentences at a time"): first pass 249 words and seven paragraphs, repair pass 196 words and five paragraphs, zero hard failures, 123 s for both asks, recorded in `repaired` |
| formbricks, Search for demand | 0 signals after 550 s (out of waves) | 3 signals in 537 s (three LinkedIn posts by people living the problem) |
| plausible, Search for demand | 0 signals after 902 s (timed out) | 4 signals in 976 s (two Indie Hackers posts including "I got tired of GA4's complexity so I...", a dev.to thread, a LinkedIn post); the first attempt could not start because the original run was still "running" in the saved store, which is the interrupted-run bug fixed in api.jobs |
| khoj, Search for demand | 0 signals (non-JSON final answer) | still 0 after 1158 s: the agent's final message was again a plan ("I'll work through all four passes systematically") and the pipeline's four JSON retries all got the same prose. Open: the compile deadline rule does not reach this case; the fix is a per-pass wave budget and an answer-format-first system prompt in lk_signals.pipe |

## Next

Remaining fixes in order, with the file each lives in.

1. Read pricing through the rendered site: `services/studio-forge/lib/probe.mjs` reads /pricing with Playwright for the Commercial stage (dub's $30/$90/$300 were not captured because the page renders through JavaScript).
2. Read the marketing domain when the site is an app shell: `apps/launchkit/pipelines/lk_understand.pipe` (hoppscotch.io is the app, hoppscotch.com carries pricing and testimonials).
3. A second reel concept for tools without a review queue: a new template beside `services/studio-forge/templates/verdict/concept.mjs`, selected in `apps/launchkit/src/domain/studio.ts`.
4. One site read shared by Brand and Assets: `apps/launchkit/pipelines/lk_brand.pipe` fed from the probe's palette, fonts and logo so visual DNA is no longer empty.
5. One identifying prop from the product's world per plate, and a recognisability score alongside brief fidelity: `apps/launchkit/src/domain/questions.ts` (`buildStudioImagesQuestion`) and `services/studio-forge/lib/images.mjs`; a continuity check on the hero plate in the same judge.
6. Signals verification through the forge instead of the browser (CORS): `apps/launchkit/src/components/launchkit/stages/signals-stage.tsx` and `services/studio-forge/server.mjs`.
7. The Show HN draft's prior-launch warning feeds Targets: `apps/launchkit/pipelines/lk_targets.pipe` and `apps/launchkit/src/data/api.ts`.
8. The banned-verb swap on the profile, listing, angles, script slots and signal replies: the `sanitizeVerbs` call sites in `apps/launchkit/src/data/api.ts`.
9. Signal replies through the post gate: `apps/launchkit/src/domain/gates.ts`.
10. The neutral-competitor rule for angles and icp.pain, and no competitor-framed angle as the campaign angle: `apps/launchkit/pipelines/lk_brand.pipe` and `lk_understand.pipe`.
11. Targets before Social, or a Reddit redraft when the venue changes: `launchkit-src/frontend/drive.full.mjs` and `apps/launchkit/src/data/api.ts`.
12. An archived-product branch (no pricing options, no "NOW LIVE" pill, no install line in the voice, no signup metric in the plan): `apps/launchkit/pipelines/lk_commercial.pipe`, `services/studio-forge/lib/cards.mjs`, `apps/launchkit/src/domain/questions.ts`, `apps/launchkit/src/domain/plan.ts`.
13. Done in this commit: headline fitting on the platform cards (`services/studio-forge/lib/cards.mjs` puts a whole sentence or the tagline on the image, never a cut with an ellipsis).
14. The drive summary reads the run status rather than the click, so a failed draft or search is not reported as done: `launchkit-src/frontend/drive.full.mjs`.
15. Venue selection by impact rather than rank 1 to 3: `launchkit-src/frontend/drive.full.mjs` and the Targets stage.
16. Competitor notability from a source other than mention count: `apps/launchkit/pipelines/lk_commercial.pipe`.
17. Done in this commit: the eval extract records blockers and repaired per post (`launchkit-src/frontend/eval-extract.py`); the empty reply and title fields for signals on documenso, dub, hoppscotch and continue remain to be read from the store's field names.
18. The post rulebooks' proof standard on the listing and the DNA (every claim traces to the profile; no vote or star ask): `apps/launchkit/pipelines/lk_commercial.pipe` and `lk_brand.pipe`.
19. An angle is a story, never a channel, and Targets reads the chosen angle: `apps/launchkit/pipelines/lk_brand.pipe` and `lk_targets.pipe`.
20. A failed repo read is a gap, never a fact, and a numeric proof point is checked against its page before it enters the DNA: `apps/launchkit/pipelines/lk_understand.pipe` and `lk_brand.pipe`.
21. A check per rulebook shape (the LinkedIn contrast, the proof-point count, the Reddit title format, the newsletter subject length): `apps/launchkit/src/lib/rulebook-checks.ts`.
22. The model's warnings shown as its notes, apart from the gate's findings: `apps/launchkit/src/components/launchkit/stages/assets-stage.tsx`.
23. A read failure (a 404, an unreachable page) never enters the profile's gap, so it cannot reach a draft: `apps/launchkit/pipelines/lk_understand.pipe`.
