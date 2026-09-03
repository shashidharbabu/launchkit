# Recipes

Verified compositions for the situations that come up most. Each was
typechecked against the real component sources. Adjust content, keep structure.

## 1. Landing/hero reveal (App Store listing, product page)

Headline reveals per-word with blur, subhead follows, CTA group staggers in.
One `delay` chain, no competing effects.

```tsx
'use client';
import { TextEffect } from '@/components/motion-primitives/text-effect';
import { AnimatedGroup } from '@/components/motion-primitives/animated-group';

export function Hero() {
  return (
    <section className='flex flex-col items-center gap-6 py-24 text-center'>
      <TextEffect per='word' preset='blur' as='h1'
        className='text-5xl font-semibold tracking-tight'>
        Ship AI pipelines that survive production
      </TextEffect>
      <TextEffect per='line' preset='fade' delay={0.5} as='p'
        className='max-w-xl text-lg text-neutral-500'>
        A multithreaded C++ runtime with a visual builder.
      </TextEffect>
      <AnimatedGroup preset='blur-slide' className='flex gap-3'
        variants={{ container: { visible: { transition: { staggerChildren: 0.08, delayChildren: 0.9 } } } }}>
        <button className='rounded-lg bg-black px-5 py-2.5 text-white'>Get started</button>
        <button className='rounded-lg border px-5 py-2.5'>View docs</button>
      </AnimatedGroup>
    </section>
  );
}
```

## 2. KPI tile with animated value (dashboards)

`AnimatedNumber` for continuous metrics; `SlidingNumber` for counters where the
odometer read is the point. Format outside the component — it animates the raw
number.

```tsx
'use client';
import { AnimatedNumber } from '@/components/motion-primitives/animated-number';

export function KpiTile({ label, value }: { label: string; value: number }) {
  return (
    <div className='rounded-xl border p-4'>
      <p className='text-sm text-neutral-500'>{label}</p>
      <AnimatedNumber
        value={value}
        springOptions={{ bounce: 0, duration: 1200 }}
        className='text-3xl font-semibold tabular-nums'
      />
    </div>
  );
}
```

Rules: `tabular-nums` always, or the tile jitters. If the metric refreshes
faster than the spring settles, drop the animation — a spring chasing a moving
target reads as broken. Prefix/suffix ($, %) go as siblings, not in `value`.

**⚠️ AnimatedNumber does not animate on mount.** Its spring is initialized
*at* `value` (`useSpring(value, ...)`), so a static value renders instantly with
no count-up. It only animates when `value` subsequently changes. On dashboards
fed by live data this is correct. On a landing page or launch hero where you
want stats to count up on load, drive the value yourself:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { AnimatedNumber } from '@/components/motion-primitives/animated-number';

export function CountUp({ to, delay = 0 }: { to: number; delay?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setValue(to), delay);
    return () => clearTimeout(t);
  }, [to, delay]);
  return <AnimatedNumber value={value} springOptions={{ bounce: 0, duration: 1600 }} />;
}
```

Set `delay` to land after the headline reveal (~1s) so the page reads as one
sequence rather than everything firing at once. `SlidingNumber` has the same
mount behavior — same fix applies.

## 3. Grid thumbnail → fullscreen morph (asset review, galleries)

The morph reads as continuous only when Trigger and Content share visual
structure (same image, same rounding).

```tsx
'use client';
import {
  MorphingDialog, MorphingDialogTrigger, MorphingDialogContainer,
  MorphingDialogContent, MorphingDialogClose, MorphingDialogImage,
  MorphingDialogTitle,
} from '@/components/motion-primitives/morphing-dialog';

export function AssetCard({ src, title }: { src: string; title: string }) {
  return (
    <MorphingDialog transition={{ type: 'spring', bounce: 0.05, duration: 0.3 }}>
      <MorphingDialogTrigger className='overflow-hidden rounded-lg'>
        <MorphingDialogImage src={src} alt={title} className='aspect-square w-full object-cover' />
      </MorphingDialogTrigger>
      <MorphingDialogContainer>
        <MorphingDialogContent className='relative max-w-3xl overflow-hidden rounded-xl bg-white'>
          <MorphingDialogImage src={src} alt={title} className='w-full object-contain' />
          <MorphingDialogTitle className='p-4 text-lg font-medium'>{title}</MorphingDialogTitle>
          <MorphingDialogClose className='absolute right-4 top-4' />
        </MorphingDialogContent>
      </MorphingDialogContainer>
    </MorphingDialog>
  );
}
```

In a review queue: keep approve/reject *outside* the morph (in the grid cell or
via keyboard) so throughput doesn't route through an open/close cycle.

## 4. Logo marquee (social proof, integrations wall)

```tsx
'use client';
import { InfiniteSlider } from '@/components/motion-primitives/infinite-slider';

export function LogoWall({ logos }: { logos: { src: string; alt: string }[] }) {
  return (
    <InfiniteSlider gap={48} speed={40} speedOnHover={12} className='py-8'>
      {logos.map((l) => (
        <img key={l.alt} src={l.src} alt={l.alt} className='h-8 opacity-60 grayscale' />
      ))}
    </InfiniteSlider>
  );
}
```

`speedOnHover` slower than `speed` = slow-on-hover, which is what people expect.

**Edge treatment:** `ProgressiveBlur` blurs, it does not fade to your background
colour — on a solid background a blur alone often reads as smeared rather than
clean. Default `blurIntensity` is `0.25`; going much above that gets muddy fast.
For a crisp dissolve on a solid background, use a plain gradient mask instead,
or layer one over the blur:

```tsx
<div className='pointer-events-none absolute inset-y-0 left-0 w-24
                bg-gradient-to-r from-white to-transparent' />
```

Use ProgressiveBlur when the marquee sits over an image or gradient, where a
colour-matched fade isn't possible.

## 5. Streaming / "agent thinking" text state

```tsx
'use client';
import { TextShimmer } from '@/components/motion-primitives/text-shimmer';
import { TextLoop } from '@/components/motion-primitives/text-loop';

export function ThinkingState({ stage }: { stage?: string }) {
  if (stage) return <TextShimmer duration={1.2} className='text-sm'>{stage}</TextShimmer>;
  return (
    <TextLoop interval={2.5} className='text-sm text-neutral-500'>
      <span>Reading the document…</span>
      <span>Extracting fields…</span>
      <span>Scoring confidence…</span>
    </TextLoop>
  );
}
```

When real stage names are available (e.g. from a pipeline execution stream),
shimmer the actual stage name — invented rotating messages are a fallback, not
the goal.

## 6. Scroll-in reveal for content sections

```tsx
'use client';
import { InView } from '@/components/motion-primitives/in-view';

export function RevealSection({ children }: { children: React.ReactNode }) {
  return (
    <InView
      variants={{ hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
                  visible: { opacity: 1, y: 0, filter: 'blur(0px)' } }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      viewOptions={{ once: true, margin: '0px 0px -80px 0px' }}
    >
      {children}
    </InView>
  );
}
```

`once: true` almost always — re-triggering on every scroll pass is noise.
Negative bottom margin starts the animation before the element fully enters,
which reads as responsive rather than laggy.

## 7. Tab/segment highlight that glides (AnimatedBackground)

```tsx
'use client';
import { AnimatedBackground } from '@/components/motion-primitives/animated-background';

const TABS = ['Overview', 'Runs', 'Logs'];

export function Segments({ onChange }: { onChange: (t: string | null) => void }) {
  return (
    <div className='flex rounded-lg bg-neutral-100 p-1'>
      <AnimatedBackground
        defaultValue={TABS[0]}
        onValueChange={onChange}
        className='rounded-md bg-white shadow-sm'
        transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
      >
        {TABS.map((tab) => (
          <button key={tab} data-id={tab} type='button'
            className='px-4 py-1.5 text-sm data-[checked=true]:text-black text-neutral-500'>
            {tab}
          </button>
        ))}
      </AnimatedBackground>
    </div>
  );
}
```

The `data-id` on every child is mandatory — it's how the highlight tracks.

## Global rules

- One hero effect per viewport. Reveals elsewhere on the page should be quieter
  than the hero's.
- Decorative motion respects `prefers-reduced-motion`; gate with the
  `motion-reduce:` Tailwind variant or `useReducedMotion` from `motion/react`.
- Durations: text reveals 0.3–0.6s, layout morphs 0.25–0.35s, ambient loops
  (shimmer, marquee) slow and subtle. Anything over ~0.7s on an interactive
  element feels like the app is slow, not polished.
- These components are yours after copy-in. When a recipe needs a variation the
  props don't support, edit the source — that's the intended model.
