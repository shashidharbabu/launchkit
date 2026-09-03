"""Seed the venue knowledge base from the launch-channel market research
(../launchkit-launch-channels.md). Idempotent — upserts by URL.

Run (from launchkit/):
    .venv/bin/python backend/seed_venues.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from app.db import SessionLocal, Venue, init_db  # noqa: E402

V = [
    # --- launch platforms ---
    ("Product Hunt", "launch_platform", "https://www.producthunt.com", "https://www.producthunt.com/posts/new", "Biggest single-day audience; spike fades next morning. Prepare first comment + reply presence.", "large", "general,saas,ai"),
    ("Uneed", "launch_platform", "https://www.uneed.best", "https://www.uneed.best/submit-a-tool", "Curated daily launches — team selects, fairer for good products.", "medium", "indie,saas"),
    ("Fazier", "launch_platform", "https://fazier.com", "https://fazier.com/submit", "Daily launch platform, growing indie audience.", "medium", "indie,saas"),
    ("Smol Launch", "launch_platform", "https://smollaunch.com", "https://smollaunch.com/submit", "7-day visibility window — forgiving for first launches.", "small", "indie"),
    ("StartupBase", "launch_platform", "https://startupbase.io", "https://startupbase.io/submit", "Launch + directory hybrid.", "medium", "startup"),
    ("BetaList", "launch_platform", "https://betalist.com", "https://betalist.com/submit", "Pre-launch/beta only — waitlist building audience.", "medium", "prelaunch,beta"),
    ("Peerlist Launchpad", "launch_platform", "https://peerlist.io/launchpad", "https://peerlist.io/launchpad", "Weekly launches, dev-heavy audience.", "medium", "dev"),
    ("DevHunt", "launch_platform", "https://devhunt.org", "https://devhunt.org", "Dev tools specifically — high fit for developer products.", "medium", "dev,tools"),
    ("Show HN", "launch_platform", "https://news.ycombinator.com/show", "https://news.ycombinator.com/submit", "Title must start 'Show HN:'. Hostile to marketing — technical, honest, limitations included.", "large", "dev,technical"),
    ("Indie Hackers", "launch_platform", "https://www.indiehackers.com", "https://www.indiehackers.com/new-post", "Launch post + build-in-public threads. Community-first tone.", "large", "indie,bootstrapped"),
    # --- evergreen directories ---
    ("AlternativeTo", "directory", "https://alternativeto.net", "https://alternativeto.net/manage-item/", "Rides 'X alternative' search traffic. List against your named competitors.", "large", "seo,evergreen"),
    ("SaaSHub", "directory", "https://www.saashub.com", "https://www.saashub.com/submit", "SaaS directory with compare pages; compounds via SEO.", "medium", "saas,seo"),
    ("StackShare", "directory", "https://stackshare.io", "https://stackshare.io/submit", "Dev-tool stacks; good for infrastructure/API products.", "medium", "dev,tools"),
    ("There's An AI For That", "directory", "https://theresanaiforthat.com", "https://theresanaiforthat.com/get-featured/", "Largest AI tool directory; paid featuring available.", "large", "ai,seo"),
    ("Futurepedia", "directory", "https://www.futurepedia.io", "https://www.futurepedia.io/submit-tool", "AI tools directory, strong SEO.", "large", "ai,seo"),
    ("Toolify", "directory", "https://www.toolify.ai", "https://www.toolify.ai/submit", "AI apps directory.", "medium", "ai"),
    ("G2", "directory", "https://www.g2.com", "https://sell.g2.com/list-your-product", "B2B software reviews — needs real reviews to matter. B2B apps only.", "large", "b2b,reviews"),
    ("Capterra", "directory", "https://www.capterra.com", "https://www.capterra.com/vendors/sign-up", "B2B software directory (Gartner).", "large", "b2b"),
    # --- promo-tolerant subreddits ---
    ("r/SideProject", "subreddit", "https://www.reddit.com/r/SideProject/", "https://www.reddit.com/r/SideProject/submit", "Self-promo allowed for original projects; disclose you're the creator; feedback framing.", "large", "indie,showcase"),
    ("r/IMadeThis", "subreddit", "https://www.reddit.com/r/IMadeThis/", "https://www.reddit.com/r/IMadeThis/submit", "Show what you made; original work only.", "medium", "showcase"),
    ("r/AlphaAndBetaUsers", "subreddit", "https://www.reddit.com/r/alphaandbetausers/", "https://www.reddit.com/r/alphaandbetausers/submit", "Explicitly for finding early users/testers.", "small", "beta,earlyusers"),
    ("r/RoastMyStartup", "subreddit", "https://www.reddit.com/r/roastmystartup/", "https://www.reddit.com/r/roastmystartup/submit", "Feedback-first framing; thick skin required.", "small", "feedback"),
    ("r/EntrepreneurRideAlong", "subreddit", "https://www.reddit.com/r/EntrepreneurRideAlong/", "https://www.reddit.com/r/EntrepreneurRideAlong/submit", "Journey/build-in-public posts convert better than announcements.", "large", "indie,journey"),
    ("r/Entrepreneur", "subreddit", "https://www.reddit.com/r/Entrepreneur/", "https://www.reddit.com/r/Entrepreneur/submit", "Value-first posts only; explicit promo gets removed.", "large", "business"),
    ("r/startups", "subreddit", "https://www.reddit.com/r/startups/", "https://www.reddit.com/r/startups/submit", "Strict self-promo rules — Share Your Startup thread.", "large", "startup"),
    ("r/GrowthHacking", "subreddit", "https://www.reddit.com/r/GrowthHacking/", "https://www.reddit.com/r/GrowthHacking/submit", "Marketing/growth audience.", "medium", "marketing"),
    ("r/SmallBusiness", "subreddit", "https://www.reddit.com/r/smallbusiness/", "https://www.reddit.com/r/smallbusiness/submit", "B2B-for-SMB fit; no bare promo.", "large", "smb"),
    ("r/InternetIsBeautiful", "subreddit", "https://www.reddit.com/r/InternetIsBeautiful/", "https://www.reddit.com/r/InternetIsBeautiful/submit", "Free web tools only; one-shot; strict novelty bar.", "large", "consumer,web"),
    # --- dev communities ---
    ("Dev.to", "community", "https://dev.to", "https://dev.to/new", "Dev blogging — technical writeups with the tool inside outperform announcements.", "large", "dev,content"),
    ("Hashnode", "community", "https://hashnode.com", "https://hashnode.com", "Dev blogging platform.", "medium", "dev,content"),
    ("Lobsters", "community", "https://lobste.rs", "https://lobste.rs", "Invite-only HN-like; very technical; no marketing.", "small", "dev,technical"),
    ("Hacker News (Ask/Tell)", "community", "https://news.ycombinator.com/ask", "https://news.ycombinator.com/submit", "Tell HN / comments — only when genuinely contributing.", "large", "dev"),
    # --- newsletters ---
    ("TLDR Newsletter", "newsletter", "https://tldr.tech", "https://advertise.tldr.tech", "1.25M+ daily devs (AI vertical). Paid placements; free mention only if genuinely newsworthy.", "large", "dev,ai,paid"),
    ("The Rundown AI", "newsletter", "https://www.therundown.ai", "https://www.therundown.ai", "2M+ subscribers, AI news. Sponsorship-driven.", "large", "ai,paid"),
    ("Ben's Bites", "newsletter", "https://bensbites.co", "https://bensbites.co", "166K+, indie-maker lens on AI — best free-mention odds for indie AI apps.", "large", "ai,indie"),
    ("The Neuron", "newsletter", "https://www.theneurondaily.com", "https://www.theneurondaily.com", "AI daily; sponsorship model.", "large", "ai,paid"),
    # --- deal platforms ---
    ("AppSumo", "directory", "https://appsumo.com", "https://sell.appsumo.com", "Lifetime-deal marketplace — real revenue, brutal margins; list only deliberately.", "large", "deals,revenue"),
]


def main() -> None:
    init_db()
    db = SessionLocal()
    added = updated = 0
    for name, kind, url, sub, rules, audience, tags in V:
        row = db.query(Venue).filter_by(url=url).first()
        if row:
            row.name, row.kind, row.submission_url = name, kind, sub
            row.rules_summary, row.audience_signal, row.tags = rules, audience, tags
            updated += 1
        else:
            db.add(Venue(name=name, kind=kind, url=url, submission_url=sub,
                         rules_summary=rules, audience_signal=audience,
                         tags=tags, source="curated"))
            added += 1
    db.commit()
    total = db.query(Venue).count()
    print(f"venues seeded: +{added} added, {updated} updated, {total} total")
    db.close()


if __name__ == "__main__":
    main()
