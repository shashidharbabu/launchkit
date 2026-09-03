import * as React from 'react';
import {
  ArrowRight,
  BadgeDollarSign,
  Fingerprint,
  Globe,
  IdCard,
  PenLine,
  Radar,
  Rocket,
  Stamp,
  Target,
} from 'lucide-react';
import { Reveal } from './landing-motion';
import { FloatingPlatforms } from './floating-platforms';
import { PlatformIcon } from '../ui/platform-icons';
import { cn } from '../../lib/utils';

/**
 * How the product works, drawn as what it is: one continuous procedure. Three
 * typographic moves up top (give → drafted → signed), then the seven stages
 * as a single flight sequence down a rail — no card grid. Gates read as
 * stamped moments on the line (01-direction.md: approval is a physical act).
 */

const STAGES = [
  {
    name: 'Profile',
    Icon: IdCard,
    line: 'Who your app is for, and what you can prove.',
    gate: 'Gate 1',
  },
  {
    name: 'Brand',
    Icon: Fingerprint,
    line: 'Your site’s voice, colors, and messages — extracted, not invented.',
  },
  {
    name: 'Commercial',
    Icon: BadgeDollarSign,
    line: 'Tiers set against real competitor prices. Listing rewritten.',
  },
  {
    name: 'Assets',
    Icon: PenLine,
    line: 'One post per platform, in that platform’s voice.',
    gate: 'Gate 2',
  },
  {
    name: 'Targets',
    Icon: Target,
    line: 'Where to launch, ranked — with each venue’s rules.',
    gate: 'Gate 3',
  },
  {
    name: 'Signals',
    Icon: Radar,
    line: 'People already asking for what you built.',
  },
  {
    name: 'Plan',
    Icon: Rocket,
    line: 'What to post where, in order, with tracked links.',
  },
] as const;

/** The rubber stamp, worn as a chip. Slight rotation = hand-applied. */
function GateChip({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit -rotate-1 items-center gap-1 border border-primary px-1.5 py-0.5 font-mono text-meta font-medium uppercase tracking-[0.08em] text-primary">
      <Stamp size={12} strokeWidth={1.5} aria-hidden />
      {label} · you sign
    </span>
  );
}

function Move({
  step,
  headline,
  line,
  accent,
  children,
}: {
  step: string;
  headline: string;
  line: string;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="grid content-start gap-2.5">
      <p
        className={cn(
          'font-mono text-meta font-medium uppercase tracking-[0.08em]',
          accent ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {step}
      </p>
      <p className="text-heading font-semibold">{headline}</p>
      {children}
      <p className="max-w-xs text-body text-muted-foreground">{line}</p>
    </div>
  );
}

function Arrow() {
  return (
    <div aria-hidden className="flex items-center justify-center py-1 sm:py-6">
      <ArrowRight
        size={18}
        strokeWidth={1.5}
        className="rotate-90 text-muted-foreground/70 sm:rotate-0"
      />
    </div>
  );
}

export function ProcedureFlow() {
  return (
    <>
      {/* the whole product in three moves — typographic, no cards */}
      <Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-[1fr_auto_1.15fr_auto_1fr] sm:gap-8">
          <Move
            step="You give"
            headline="Two links."
            line="Your repo and your live site. Nothing else."
          >
            <div className="flex items-center gap-3 py-1 text-muted-foreground">
              <PlatformIcon name="github" size={20} />
              <Globe size={20} strokeWidth={1.5} />
            </div>
          </Move>

          <Arrow />

          <Move
            step="Launch Kit drafts"
            headline="The whole launch."
            line="Profile, pricing, listing, venues — and a post written for each platform."
          >
            <FloatingPlatforms />
          </Move>

          <Arrow />

          <Move
            accent
            step="You sign, then post"
            headline="Nothing ships unsigned."
            line="Three approvals. Tracked links show which venue produced each signup."
          >
            <div className="flex items-center gap-3 py-1 text-primary">
              <Stamp size={20} strokeWidth={1.5} />
            </div>
          </Move>
        </div>
      </Reveal>

      {/* the seven stages, one flight sequence down a rail — the ledger keeps
          the honest arithmetic beside it */}
      <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative max-w-2xl">
          <div aria-hidden className="absolute inset-y-2 left-[13px] w-px bg-border" />
          <ol className="grid gap-7">
            {STAGES.map((s, i) => (
              <li key={s.name} className="relative">
                <Reveal delay={Math.min(i * 0.04, 0.2)}>
                  <div className="grid grid-cols-[28px_1fr] gap-x-4">
                    <span
                      className={cn(
                        'relative z-10 flex h-7 w-7 items-center justify-center rounded-sm border bg-background font-mono text-data font-medium tabular-nums',
                        'gate' in s && s.gate
                          ? 'border-primary text-primary'
                          : 'border-border text-muted-foreground',
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="grid gap-1 pt-0.5">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                        <s.Icon
                          size={16}
                          strokeWidth={1.5}
                          aria-hidden
                          className="text-muted-foreground"
                        />
                        <p className="text-heading font-semibold">{s.name}</p>
                        {'gate' in s && s.gate && <GateChip label={s.gate} />}
                      </div>
                      <p className="max-w-lg text-body text-muted-foreground">{s.line}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        <Reveal delay={0.15}>
          <aside className="self-start lg:sticky lg:top-24">
            <p className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
              The arithmetic
            </p>
            <dl className="mt-3">
              {LEDGER.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline gap-3 border-t border-border py-3 first:border-t-0 first:pt-0"
                >
                  <dd
                    className={cn(
                      'text-title font-semibold tabular-nums',
                      row.accent && 'text-primary',
                    )}
                  >
                    {row.n}
                  </dd>
                  <dt className="text-body text-muted-foreground">{row.label}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-4 max-w-[26ch] text-body text-muted-foreground">
              Out the other side: a launch plan you signed, with a tracked link
              for every venue.
            </p>
          </aside>
        </Reveal>
      </div>
    </>
  );
}

const LEDGER: { n: string; label: string; accent?: boolean }[] = [
  { n: '2', label: 'links you paste in' },
  { n: '7', label: 'stages drafted for you' },
  { n: '3', label: 'signatures — all yours', accent: true },
  { n: '0', label: 'posts sent without you' },
  { n: '1', label: 'signed launch plan out' },
];
