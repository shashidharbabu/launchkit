import { LandingHero, Reveal } from '../components/launchkit/landing-motion';
import { AnimatedGroup } from '@launchkit/design-system/motion/animated-group';
import { BrandMark } from '../components/launchkit/app-nav';
import { ProcedureFlow } from '../components/launchkit/procedure-flow';
import { Button } from '@launchkit/design-system/components/button';
import { FAQ } from '../lib/seo';
import { useNav } from '../nav';
// Bundled with the app like BRAND (assets.ts) so they resolve from the MF
// remote's own origin; neither is exported from BRAND yet.
import heroLaunchPad from '../brand/hero-launch-pad.jpg';
import visorLaunch from '../brand/visor-launch.jpg';

const HEADLINE = 'You built the app. Launch Kit turns the launch into paperwork you can sign.';
const SUBHEAD =
  'Profile, pricing, listing, venues, native posts, and live demand, drafted from your repo and site, verified where possible, and nothing ships without your approval.';

export default function HomePage() {
  const { go, href } = useNav();

  return (
    <main className="min-h-screen bg-background text-foreground">

      {/* hero: full-bleed launch-pad artwork with a slow drift */}
      <section className="relative flex min-h-[82vh] items-center overflow-hidden">
        {/* Next Image fill → plain img reproducing its inline fill styles */}
        <img
          src={heroLaunchPad}
          alt="A crew in flight suits walking toward a rocket on its launch pad"
          className="hero-drift object-cover object-[65%_30%]"
          style={{ position: 'absolute', height: '100%', width: '100%', left: 0, top: 0 }}
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
        <div className="relative z-10 mx-auto w-full max-w-landing px-5 sm:px-8 pb-16 pt-28">
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
            <a
              href={href({ view: 'new-launch' })}
              onClick={(e) => {
                e.preventDefault();
                go({ view: 'new-launch' });
              }}
            >
              <Button variant="primary">Start your launch</Button>
            </a>
            {/* in-page anchor: scroll without touching the shell-owned URL */}
            <a
              href="#procedure"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('procedure')?.scrollIntoView();
              }}
            >
              <Button variant="secondary">Read the procedure</Button>
            </a>
          </AnimatedGroup>
        </div>
      </section>

      {/* the seven-stage procedure, drawn as the flow it is (01-direction.md) */}
      <section id="procedure" className="mx-auto w-full max-w-landing px-5 sm:px-8 py-14">
        <Reveal>
          <h2 className="text-display-lg text-balance">
            Seven stages. Three gates. Your signature on every one.
          </h2>
          <p className="mt-3 max-w-xl text-read text-muted-foreground">
            Two links in. A signed launch plan out.
          </p>
        </Reveal>
        <ProcedureFlow />
      </section>

      {/* telemetry band: the visor artwork beside the honest pitch */}
      <section className="border-t border-border">
        <div className="mx-auto grid w-full max-w-landing items-center gap-10 px-5 sm:px-8 py-16 lg:grid-cols-[2fr_3fr]">
          <Reveal>
            <div className="relative aspect-[3/4] overflow-hidden rounded-frame">
              {/* Next Image fill → plain img reproducing its inline fill styles */}
              <img
                src={visorLaunch}
                alt="A rocket launch reflected in an astronaut's visor"
                loading="lazy"
                className="object-cover"
                style={{ position: 'absolute', height: '100%', width: '100%', left: 0, top: 0 }}
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <h2 className="text-display-lg text-balance">Assisted, never autonomous.</h2>
              <p className="mt-4 max-w-xl text-read text-muted-foreground">
                Every draft states where it came from and whether it was verified. Every count says
                what it counts. When nobody is asking for what you built yet, Launch Kit says so
                and after you post, tracked links attribute every signup to the venue that produced
                it.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={href({ view: 'new-launch' })}
                  onClick={(e) => {
                    e.preventDefault();
                    go({ view: 'new-launch' });
                  }}
                >
                  <Button variant="secondary">Start your launch</Button>
                </a>
                <a
                  href={href({ view: 'dashboard' })}
                  onClick={(e) => {
                    e.preventDefault();
                    go({ view: 'dashboard' });
                  }}
                >
                  <Button variant="ghost">Open the console</Button>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* answers, stated plainly: the questions builders actually type */}
      <section id="questions" className="mx-auto w-full max-w-reading px-5 sm:px-8 py-14">
        <Reveal>
          <h2 className="text-display-lg">Questions, answered</h2>
        </Reveal>
        <div className="mt-5">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={(i % 3) * 0.05}>
              <div className="border-t border-border py-4 first:border-t-0 first:pt-0">
                <h3 className="text-heading">{item.q}</h3>
                <p className="mt-1.5 max-w-2xl text-body text-muted-foreground">
                  {item.a}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-landing items-center gap-2.5 px-5 sm:px-8 py-4">
          <BrandMark size={16} />
          <p className="text-small text-muted-foreground">
            Launch Kit, GTM-in-a-box for RocketRide App Store publishers. Assisted, never autonomous.
          </p>
        </div>
      </footer>
    </main>
  );
}
