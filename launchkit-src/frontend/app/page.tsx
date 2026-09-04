import Image from 'next/image';
import Link from 'next/link';
import { LandingHero, Reveal } from '@/components/launchkit/landing-motion';
import { AnimatedGroup } from '@/components/motion-primitives/animated-group';
import { BrandMark } from '@/components/launchkit/app-nav';
import { ProcedureFlow } from '@/components/launchkit/procedure-flow';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { jsonLd } from '@/lib/structured-data';
import { FAQ } from '@/lib/seo';

const HEADLINE = 'You built the app. Launch Kit turns the launch into paperwork you can sign.';
const SUBHEAD =
  'Profile, pricing, listing, venues, native posts, and live demand — drafted from your repo and site, verified where possible, and nothing ships without your approval.';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            aria-label="Launch Kit home"
            className="flex items-center gap-2 hover:opacity-80"
          >
            <BrandMark />
            <p className="font-mono text-meta font-medium uppercase tracking-[0.08em]">
              Launch Kit · RocketRide
            </p>
          </Link>
          <span className="flex items-center gap-3">
            <Link href="/dashboard" className="text-body text-link hover:text-link-hover">
              Open the console
            </Link>
            <ThemeToggle />
          </span>
        </div>
      </header>

      {/* hero — full-bleed launch-pad artwork with a slow drift */}
      <section className="relative flex min-h-[82vh] items-center overflow-hidden">
        <Image
          src="/brand/hero-launch-pad.jpg"
          alt="A crew in flight suits walking toward a rocket on its launch pad"
          fill
          priority
          sizes="100vw"
          className="hero-drift object-cover object-[65%_30%]"
        />
        {/* paper wash keeps the paperwork readable over the artwork */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, oklch(from var(--background) l c h / 0.97) 0%, oklch(from var(--background) l c h / 0.88) 42%, oklch(from var(--background) l c h / 0.35) 72%, oklch(from var(--background) l c h / 0.05) 100%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-40"
          style={{
            background: 'linear-gradient(180deg, transparent, var(--background))',
          }}
        />
        <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 pt-28">
          <p className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Launch paperwork for shipped apps
          </p>
          <LandingHero headline={HEADLINE} subhead={SUBHEAD} />
          <AnimatedGroup
            preset="blur-slide"
            className="mt-8 flex flex-wrap gap-3"
            variants={{
              container: {
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.9 } },
              },
            }}
          >
            <Link href="/launches/new">
              <Button variant="primary">Start your launch</Button>
            </Link>
            <a href="#procedure">
              <Button variant="secondary">Read the procedure</Button>
            </a>
          </AnimatedGroup>
        </div>
      </section>

      {/* the seven-stage procedure, drawn as the flow it is (01-direction.md) */}
      <section id="procedure" className="mx-auto w-full max-w-5xl px-4 py-14">
        <Reveal>
          <h2 className="text-title font-semibold tracking-[-0.005em]">
            Six stages. Three gates. Your signature on every one.
          </h2>
          <p className="mt-2 max-w-xl text-read leading-[1.625rem] text-muted-foreground">
            Two links in. A signed launch plan out.
          </p>
        </Reveal>
        <ProcedureFlow />
      </section>

      {/* telemetry band — the visor artwork beside the honest pitch */}
      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 py-16 lg:grid-cols-[2fr_3fr]">
          <Reveal>
            <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
              <Image
                src="/brand/visor-launch.jpg"
                alt="A rocket launch reflected in an astronaut's visor"
                fill
                sizes="(min-width: 1024px) 380px, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <p className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Telemetry after liftoff
              </p>
              <h2 className="mt-2 text-title font-semibold tracking-[-0.005em]">
                Assisted, never autonomous.
              </h2>
              <p className="mt-3 max-w-xl text-read leading-[1.625rem] text-muted-foreground">
                Every draft states where it came from and whether it was verified. Every count says
                what it counts. When nobody is asking for what you built yet, Launch Kit says so —
                and after you post, tracked links attribute every signup to the venue that produced
                it.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/launches/new">
                  <Button variant="secondary">Start your launch</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost">Open the console</Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* answers, stated plainly — the questions builders actually type */}
      <section id="questions" className="mx-auto w-full max-w-3xl px-4 py-14">
        <Reveal>
          <h2 className="text-title font-semibold tracking-[-0.005em]">Questions, answered</h2>
        </Reveal>
        <div className="mt-5">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={(i % 3) * 0.05}>
              <div className="border-t border-border py-4 first:border-t-0 first:pt-0">
                <h3 className="text-heading font-medium">{item.q}</h3>
                <p className="mt-1.5 max-w-2xl text-body leading-[1.375rem] text-muted-foreground">
                  {item.a}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* machine-readable copy of the same claims (SoftwareApplication · HowTo · FAQPage) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-4">
          <BrandMark size={16} />
          <p className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Launch Kit · GTM-in-a-box for RocketRide App Store publishers · assisted, never
            autonomous
          </p>
        </div>
      </footer>
    </main>
  );
}
