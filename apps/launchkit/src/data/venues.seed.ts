// GENERATED from launchkit/backend/seed_venues.py, then extended by hand for
// rulebook v4 (2026-09-12) with the eleven developer subreddits the Reddit
// rulebook names; each carries its verified rules snapshot and that snapshot's
// source in rules_summary. Keep it in sync with apps/launchkit/rulebooks/reddit_post.md
// section 8 and with launchkit-src/backend/seed_venues.py.
// Config-as-data: these are SEED DEFAULTS; the live set lives in the
// venues table and is editable in Settings.
export const VENUE_SEED = [
 {
  "name": "Product Hunt",
  "kind": "launch_platform",
  "url": "https://www.producthunt.com",
  "submission_url": "https://www.producthunt.com/posts/new",
  "rules_summary": "Biggest single-day audience; spike fades next morning. Prepare first comment + reply presence.",
  "audience_signal": "large",
  "tags": "general,saas,ai"
 },
 {
  "name": "Uneed",
  "kind": "launch_platform",
  "url": "https://www.uneed.best",
  "submission_url": "https://www.uneed.best/submit-a-tool",
  "rules_summary": "Curated daily launches: team selects, fairer for good products.",
  "audience_signal": "medium",
  "tags": "indie,saas"
 },
 {
  "name": "Fazier",
  "kind": "launch_platform",
  "url": "https://fazier.com",
  "submission_url": "https://fazier.com/submit",
  "rules_summary": "Daily launch platform, growing indie audience.",
  "audience_signal": "medium",
  "tags": "indie,saas"
 },
 {
  "name": "Smol Launch",
  "kind": "launch_platform",
  "url": "https://smollaunch.com",
  "submission_url": "https://smollaunch.com/submit",
  "rules_summary": "7-day visibility window, forgiving for first launches.",
  "audience_signal": "small",
  "tags": "indie"
 },
 {
  "name": "StartupBase",
  "kind": "launch_platform",
  "url": "https://startupbase.io",
  "submission_url": "https://startupbase.io/submit",
  "rules_summary": "Launch + directory hybrid.",
  "audience_signal": "medium",
  "tags": "startup"
 },
 {
  "name": "BetaList",
  "kind": "launch_platform",
  "url": "https://betalist.com",
  "submission_url": "https://betalist.com/submit",
  "rules_summary": "Pre-launch/beta only, waitlist building audience.",
  "audience_signal": "medium",
  "tags": "prelaunch,beta"
 },
 {
  "name": "Peerlist Launchpad",
  "kind": "launch_platform",
  "url": "https://peerlist.io/launchpad",
  "submission_url": "https://peerlist.io/launchpad",
  "rules_summary": "Weekly launches, dev-heavy audience.",
  "audience_signal": "medium",
  "tags": "dev"
 },
 {
  "name": "DevHunt",
  "kind": "launch_platform",
  "url": "https://devhunt.org",
  "submission_url": "https://devhunt.org",
  "rules_summary": "Dev tools specifically: high fit for developer products.",
  "audience_signal": "medium",
  "tags": "dev,tools"
 },
 {
  "name": "Show HN",
  "kind": "launch_platform",
  "url": "https://news.ycombinator.com/show",
  "submission_url": "https://news.ycombinator.com/submit",
  "rules_summary": "Title must start 'Show HN:'. Hostile to marketing: technical, honest, limitations included.",
  "audience_signal": "large",
  "tags": "dev,technical"
 },
 {
  "name": "Indie Hackers",
  "kind": "launch_platform",
  "url": "https://www.indiehackers.com",
  "submission_url": "https://www.indiehackers.com/new-post",
  "rules_summary": "Launch post + build-in-public threads. Community-first tone.",
  "audience_signal": "large",
  "tags": "indie,bootstrapped"
 },
 {
  "name": "AlternativeTo",
  "kind": "directory",
  "url": "https://alternativeto.net",
  "submission_url": "https://alternativeto.net/manage-item/",
  "rules_summary": "Rides 'X alternative' search traffic. List against your named competitors.",
  "audience_signal": "large",
  "tags": "seo,evergreen"
 },
 {
  "name": "SaaSHub",
  "kind": "directory",
  "url": "https://www.saashub.com",
  "submission_url": "https://www.saashub.com/submit",
  "rules_summary": "SaaS directory with compare pages; compounds via SEO.",
  "audience_signal": "medium",
  "tags": "saas,seo"
 },
 {
  "name": "StackShare",
  "kind": "directory",
  "url": "https://stackshare.io",
  "submission_url": "https://stackshare.io/submit",
  "rules_summary": "Dev-tool stacks; good for infrastructure/API products.",
  "audience_signal": "medium",
  "tags": "dev,tools"
 },
 {
  "name": "There's An AI For That",
  "kind": "directory",
  "url": "https://theresanaiforthat.com",
  "submission_url": "https://theresanaiforthat.com/get-featured/",
  "rules_summary": "Largest AI tool directory; paid featuring available.",
  "audience_signal": "large",
  "tags": "ai,seo"
 },
 {
  "name": "Futurepedia",
  "kind": "directory",
  "url": "https://www.futurepedia.io",
  "submission_url": "https://www.futurepedia.io/submit-tool",
  "rules_summary": "AI tools directory, strong SEO.",
  "audience_signal": "large",
  "tags": "ai,seo"
 },
 {
  "name": "Toolify",
  "kind": "directory",
  "url": "https://www.toolify.ai",
  "submission_url": "https://www.toolify.ai/submit",
  "rules_summary": "AI apps directory.",
  "audience_signal": "medium",
  "tags": "ai"
 },
 {
  "name": "G2",
  "kind": "directory",
  "url": "https://www.g2.com",
  "submission_url": "https://sell.g2.com/list-your-product",
  "rules_summary": "B2B software reviews: needs real reviews to matter. B2B apps only.",
  "audience_signal": "large",
  "tags": "b2b,reviews"
 },
 {
  "name": "Capterra",
  "kind": "directory",
  "url": "https://www.capterra.com",
  "submission_url": "https://www.capterra.com/vendors/sign-up",
  "rules_summary": "B2B software directory (Gartner).",
  "audience_signal": "large",
  "tags": "b2b"
 },
 {
  "name": "r/SideProject",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/SideProject/",
  "submission_url": "https://www.reddit.com/r/SideProject/submit",
  "rules_summary": "Self-promo allowed for original projects; disclose you're the creator; feedback framing.",
  "audience_signal": "large",
  "tags": "indie,showcase",
  "rules_source": "Wayback rules page (empty) plus sidebar, 2026-08-28: https://old.reddit.com/r/SideProject/about/rules/"
 },
 {
  "name": "r/IMadeThis",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/IMadeThis/",
  "submission_url": "https://www.reddit.com/r/IMadeThis/submit",
  "rules_summary": "Show what you made; original work only.",
  "audience_signal": "medium",
  "tags": "showcase"
 },
 {
  "name": "r/AlphaAndBetaUsers",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/alphaandbetausers/",
  "submission_url": "https://www.reddit.com/r/alphaandbetausers/submit",
  "rules_summary": "Explicitly for finding early users/testers.",
  "audience_signal": "small",
  "tags": "beta,earlyusers"
 },
 {
  "name": "r/RoastMyStartup",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/roastmystartup/",
  "submission_url": "https://www.reddit.com/r/roastmystartup/submit",
  "rules_summary": "Feedback-first framing; thick skin required.",
  "audience_signal": "small",
  "tags": "feedback"
 },
 {
  "name": "r/EntrepreneurRideAlong",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/EntrepreneurRideAlong/",
  "submission_url": "https://www.reddit.com/r/EntrepreneurRideAlong/submit",
  "rules_summary": "Journey/build-in-public posts convert better than announcements.",
  "audience_signal": "large",
  "tags": "indie,journey"
 },
 {
  "name": "r/Entrepreneur",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/Entrepreneur/",
  "submission_url": "https://www.reddit.com/r/Entrepreneur/submit",
  "rules_summary": "Value-first posts only; explicit promo gets removed.",
  "audience_signal": "large",
  "tags": "business"
 },
 {
  "name": "r/startups",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/startups/",
  "submission_url": "https://www.reddit.com/r/startups/submit",
  "rules_summary": "Strict self-promo rules, Share Your Startup thread.",
  "audience_signal": "large",
  "tags": "startup",
  "rules_source": "Wayback rules page plus live quarterly thread, 2026-08-23 (snapshot), 2026-07-11 (thread): https://old.reddit.com/r/startups/about/rules/"
 },
 {
  "name": "r/GrowthHacking",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/GrowthHacking/",
  "submission_url": "https://www.reddit.com/r/GrowthHacking/submit",
  "rules_summary": "Marketing/growth audience.",
  "audience_signal": "medium",
  "tags": "marketing"
 },
 {
  "name": "r/SmallBusiness",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/smallbusiness/",
  "submission_url": "https://www.reddit.com/r/smallbusiness/submit",
  "rules_summary": "B2B-for-SMB fit; no bare promo.",
  "audience_signal": "large",
  "tags": "smb"
 },
 {
  "name": "r/InternetIsBeautiful",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/InternetIsBeautiful/",
  "submission_url": "https://www.reddit.com/r/InternetIsBeautiful/submit",
  "rules_summary": "Free web tools only; one-shot; strict novelty bar.",
  "audience_signal": "large",
  "tags": "consumer,web"
 },
 {
  "name": "Dev.to",
  "kind": "community",
  "url": "https://dev.to",
  "submission_url": "https://dev.to/new",
  "rules_summary": "Dev blogging: technical writeups with the tool inside outperform announcements.",
  "audience_signal": "large",
  "tags": "dev,content"
 },
 {
  "name": "Hashnode",
  "kind": "community",
  "url": "https://hashnode.com",
  "submission_url": "https://hashnode.com",
  "rules_summary": "Dev blogging platform.",
  "audience_signal": "medium",
  "tags": "dev,content"
 },
 {
  "name": "Lobsters",
  "kind": "community",
  "url": "https://lobste.rs",
  "submission_url": "https://lobste.rs",
  "rules_summary": "Invite-only HN-like; very technical; no marketing.",
  "audience_signal": "small",
  "tags": "dev,technical"
 },
 {
  "name": "Hacker News (Ask/Tell)",
  "kind": "community",
  "url": "https://news.ycombinator.com/ask",
  "submission_url": "https://news.ycombinator.com/submit",
  "rules_summary": "Tell HN / comments: only when genuinely contributing.",
  "audience_signal": "large",
  "tags": "dev"
 },
 {
  "name": "TLDR Newsletter",
  "kind": "newsletter",
  "url": "https://tldr.tech",
  "submission_url": "https://advertise.tldr.tech",
  "rules_summary": "1.25M+ daily devs (AI vertical). Paid placements; free mention only if genuinely newsworthy.",
  "audience_signal": "large",
  "tags": "dev,ai,paid"
 },
 {
  "name": "The Rundown AI",
  "kind": "newsletter",
  "url": "https://www.therundown.ai",
  "submission_url": "https://www.therundown.ai",
  "rules_summary": "2M+ subscribers, AI news. Sponsorship-driven.",
  "audience_signal": "large",
  "tags": "ai,paid"
 },
 {
  "name": "Ben's Bites",
  "kind": "newsletter",
  "url": "https://bensbites.co",
  "submission_url": "https://bensbites.co",
  "rules_summary": "166K+, indie-maker lens on AI, best free-mention odds for indie AI apps.",
  "audience_signal": "large",
  "tags": "ai,indie"
 },
 {
  "name": "The Neuron",
  "kind": "newsletter",
  "url": "https://www.theneurondaily.com",
  "submission_url": "https://www.theneurondaily.com",
  "rules_summary": "AI daily; sponsorship model.",
  "audience_signal": "large",
  "tags": "ai,paid"
 },
 {
  "name": "AppSumo",
  "kind": "directory",
  "url": "https://appsumo.com",
  "submission_url": "https://sell.appsumo.com",
  "rules_summary": "Lifetime-deal marketplace: real revenue, brutal margins; list only deliberately.",
  "audience_signal": "large",
  "tags": "deals,revenue"
 },
 {
  "name": "r/programming",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/programming/",
  "submission_url": "https://www.reddit.com/r/programming/submit",
  "rules_summary": "Rule 5: no product promotion or 'I made this' demo posts; a technical write-up on what made the project hard is allowed, a repo link or feature list as the point is not. Rule 1: no LLM-written content. AI policy (2026-05-23): AI and LLM topics off-topic except deeply technical implementation write-ups; tool reviews and launches removed. Level 0 only.",
  "audience_signal": "large",
  "tags": "dev,technical,writeup",
  "rules_source": "Mirror sidebar (live) plus Wayback rules page plus wiki, 2026-09-11 (mirror), 2026-08-11 (snapshot), policy dated 2026-05-23: https://old.reddit.com/r/programming/about/rules/ and https://www.reddit.com/r/programming/wiki/ai-policy"
 },
 {
  "name": "r/LocalLLaMA",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/LocalLLaMA/",
  "submission_url": "https://www.reddit.com/r/LocalLLaMA/submit",
  "rules_summary": "Rule 4: self-promotion under 10% of your history, affiliation disclosed, no 'I found this', no engagement farming. Rule 3: mostly LLM-generated text or code removed. Rule 2: must relate to LLMs. Level 2 with Resources or Discussion flair; name the model size, hardware or quantization.",
  "audience_signal": "large",
  "tags": "ai,llm,selfhosted,opensource",
  "rules_source": "Wayback rules page, 2026-08-07: https://old.reddit.com/r/LocalLLaMA/about/rules/"
 },
 {
  "name": "r/MachineLearning",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/MachineLearning/",
  "submission_url": "https://www.reddit.com/r/MachineLearning/submit",
  "rules_summary": "Rule 2: no promotion of paid products where the intent is to promote; links acceptable only when the post offers value and invites feedback. Rule 3: marketing campaigns get a permanent ban. Main feed needs the [P] title prefix and method plus evaluation; the plain launch goes in the [D] Self-Promotion Thread with the price stated if paid. Level 2.",
  "audience_signal": "large",
  "tags": "ml,ai,research",
  "rules_source": "Wayback rules page plus live thread on mirror, 2026-07-16 (snapshot), 2026-09-11 (thread): https://old.reddit.com/r/MachineLearning/about/rules/"
 },
 {
  "name": "r/devops",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/devops/",
  "submission_url": "https://www.reddit.com/r/devops/submit",
  "rules_summary": "No vendor spam ('buy an ad from reddit instead'). Articles need a 3 to 5 sentence submission statement; use the article title unedited. Launches go in the Weekly Self Promotion Thread (no flair); the main feed takes a Level 1 discussion about running pipelines in production.",
  "audience_signal": "large",
  "tags": "devops,infra,production",
  "rules_source": "Mirror sidebar plus live weekly thread, 2026-09-11: https://old.reddit.com/r/devops/about/rules/"
 },
 {
  "name": "r/selfhosted",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/selfhosted/",
  "submission_url": "https://www.reddit.com/r/selfhosted/submit",
  "rules_summary": "Rule 2: no excessive self-promotion; promoted apps must be production ready with docs. Rule 6: projects under 3 months old (first public presence) only in the current New Project Megathread. Rule 4: blog links need a why-it-matters line. AI-compliance bot removes new posts until OP states how AI was involved. Level 2; Docker or bare install, docs, host requirements.",
  "audience_signal": "large",
  "tags": "selfhosted,docker,opensource",
  "rules_source": "Wayback rules page plus live megathread and mods' post, 2026-08-11 (snapshot), 2026-09-10 (megathread), 2026-04-07 (mods' post): https://old.reddit.com/r/selfhosted/about/rules/"
 },
 {
  "name": "r/opensource",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/opensource/",
  "submission_url": "https://www.reddit.com/r/opensource/submit",
  "rules_summary": "Rule 2: under-10% self-promotion ('a redditor with a website, not a website with a reddit account'). Rule 4: linked repos must carry an OSI-listed LICENSE file. Rule 3: AI-generated content is ban-worthy. Rule 6: drive-by accounts removed. Rule 8: Promotional flair for sharing a project. Level 2, license in the title.",
  "audience_signal": "medium",
  "tags": "opensource,license,dev",
  "rules_source": "Wayback rules page, 2026-07-26: https://old.reddit.com/r/opensource/about/rules/"
 },
 {
  "name": "r/ExperiencedDevs",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/ExperiencedDevs/",
  "submission_url": "https://www.reddit.com/r/ExperiencedDevs/submit",
  "rules_summary": "Rule 8: no advertisements without mod approval. Rule 10: AI topics only on Wednesdays and Saturdays. Rule 11 (modbot): user flair, karma in the sub, AI-use disclosure to the sticky, OP comments within 2 hours. Rule 9: no low effort, venting or bragging. Level 0 discussion only, no product.",
  "audience_signal": "medium",
  "tags": "dev,senior,discussion",
  "rules_source": "Wayback rules page, 2026-07-28: https://old.reddit.com/r/ExperiencedDevs/about/rules/"
 },
 {
  "name": "r/commandline",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/commandline/",
  "submission_url": "https://www.reddit.com/r/commandline/submit",
  "rules_summary": "Rule 4: no projects newer than 30 days or with few commits; must be a little unique. Rule 5 (AI Code Policy): AI-generated post text or titles strictly prohibited; largely AI-generated projects prohibited; partially AI-written code needs the note 'This software's code is partially AI-generated'. Rule 6: no projects that interact with generative AI or LLMs (popular ones like Ollama excepted). Rule 7: list similar and",
  "audience_signal": "medium",
  "tags": "cli,tui,terminal,dev",
  "rules_source": "Wayback rules page (seven rules) plus live mirror sidebar, flairs and member count, 2026-08-11 (snapshot 20260811152913), 2026-09-11 (mirror): https://old.reddit.com/r/commandline/about/rules/"
 },
 {
  "name": "r/vscode",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/vscode/",
  "submission_url": "https://www.reddit.com/r/vscode/submit",
  "rules_summary": "not verified: every fetch route failed on 2026-09-11 (old.reddit blocked, Wayback 2024, 2025 and 2026 captures absent for old and www, mirror shows no rules list). Mirror sidebar: 'A subreddit for working with Microsoft's Visual Studio Code', 224.0k members; a Weekly theme sharing thread says new theme posts are removed and creators must not repost weekly. Treat as unlisted: Level 1 until verified; read the rules in",
  "audience_signal": "medium",
  "tags": "ide,vscode,extensions,dev",
  "rules_source": "Not verified. old.reddit.com answered the \"Welcome to Reddit\" shell; the mirror showed the sidebar, the member count and the weekly theme thread but no rules list; web.archive.org holds no capture of the old or www rules page for 2024, 2025 or 2026; the mirror wiki is a settings guide, 2026-09-11 (mirror only): https://www.reddit.com/r/vscode/about/rules/"
 },
 {
  "name": "r/webdev",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/webdev/",
  "submission_url": "https://www.reddit.com/r/webdev/submit",
  "rules_summary": "Rule 3: reddiquette and the 9:1 rule, no excessive self-promotion. Rule 4: no commercial promotion or solicitation, ban possible. Rule 5: showing a project or asking for feedback only on Showoff Saturday; any other day it is removed. Level 3 on Saturday with the Showoff Saturday flair; stack, what was hard in the browser, the honest alternative.",
  "audience_signal": "large",
  "tags": "webdev,frontend,showoff",
  "rules_source": "Mirror sidebar Posting Guidelines, 2026-09-11: https://old.reddit.com/r/webdev/about/rules/"
 },
 {
  "name": "r/artificial",
  "kind": "subreddit",
  "url": "https://www.reddit.com/r/artificial/",
  "submission_url": "https://www.reddit.com/r/artificial/submit",
  "rules_summary": "Rule 2: first post or comment cannot carry promo; 10% rule; 'no self-inserting your product'; modmail first if in doubt. Rule 4: no selling. Rule 3: no clickbait, generic or sensational titles. Rule 10: no 'best tool' requests. Level 1 discussion from an account with history there; no name, no link; the link goes in a first comment only if the sub allows it.",
  "audience_signal": "large",
  "tags": "ai,discussion",
  "rules_source": "Wayback rules page, 2026-08-28: https://old.reddit.com/r/artificial/about/rules/"
 }
];
