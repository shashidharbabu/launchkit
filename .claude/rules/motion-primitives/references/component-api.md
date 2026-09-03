# Component API reference

Extracted from `ibelick/motion-primitives` source (`components/core/*.tsx`),
August 2026. These are the real shipped prop signatures. `Transition`,
`Variants`, `Variant`, `SpringOptions` are the standard types from
`motion/react`. Props marked `?` are optional.

If a prop isn't listed here, it doesn't exist on the component — edit the
copied source rather than inventing a prop.

## Text effects

**TextEffect** — `children: string` · `per?: 'word' | 'char' | 'line'` ·
`as?: keyof JSX.IntrinsicElements` · `variants?: { container?, item? }` ·
`className?` · `preset?: 'blur' | 'scale' | 'fade' | 'slide'` · `delay?: number` ·
`speedReveal?: number` · `speedSegment?: number` · `trigger?: boolean` ·
`onAnimationComplete?` · `onAnimationStart?`
Also accepts `segmentWrapperClassName`, per-segment transition overrides via
variants. `trigger` gates start — set false and flip to true to fire on demand.

**TextLoop** — `children: React.ReactNode[]` (array — one node per rotation) ·
`className?` · `interval?: number` (seconds) · `transition?` · `variants?` ·
`onIndexChange?: (i: number) => void` · `trigger?: boolean` ·
`mode?: AnimatePresence mode`

**TextMorph** — `children: string` · `as?` · `className?` · `style?` ·
`variants?` · `transition?`. Animates per-character between successive string
values of `children`.

**TextRoll** — `children: string` · `duration?: number` ·
`getEnterDelay?: (index) => number` · `getExitDelay?: (index) => number` ·
`className?` · `transition?` · `variants?: { enter, exit }`

**TextScramble** — `children: string` · `duration?: number` · `speed?: number` ·
`characterSet?: string` · `as?` · `className?` · `trigger?: boolean` ·
`onScrambleComplete?: () => void`

**TextShimmer** — `children: string` · `as?` · `className?` ·
`duration?: number` · `spread?: number`

**TextShimmerWave** — `children: string` · `as?` · `className?` · `duration?` ·
`zDistance?` · `xDistance?` · `yDistance?` · `spread?` · `scaleDistance?` ·
`rotateYDistance?` · `transition?`

## Number effects

**AnimatedNumber** — `value: number` · `className?` ·
`springOptions?: SpringOptions` · `as?: React.ElementType`
Spring-interpolates to each new `value`. For values updating faster than the
spring settles (~1/sec+), don't use — render plain text.

**SlidingNumber** — `value: number` · `padStart?: boolean` ·
`decimalSeparator?: string`
Odometer-style per-digit roll. No className on the wrapper — style the parent.

## Core containers

**Accordion** (compound: `Accordion`, `AccordionItem`, `AccordionTrigger`,
`AccordionContent`) — Accordion: `children` · `className?` · `transition?` ·
`variants?: { expanded, collapsed }` · `expandedValue?` · `onValueChange?`.
AccordionItem takes `value`.

**AnimatedBackground** — `children: ReactElement<{ 'data-id': string }>[]` ·
`className?` · `transition?` · `defaultValue?: string` ·
`onValueChange?: (id: string | null) => void` · `enableHover?: boolean`
Children **must** carry unique `data-id` attributes; the animated highlight
tracks the active/hovered one. This is the shared-layout tab/segment highlight.

**AnimatedGroup** — `children` · `className?` ·
`variants?: { container?: Variants; item?: Variants }` ·
`preset?: 'fade' | 'slide' | 'scale' | 'blur' | 'blur-slide' | 'zoom' | 'flip' | 'bounce' | 'rotate' | 'swing'` ·
`as?` · `asChild?`. Staggers items; each direct child becomes a motion item.

**Carousel** (compound: `Carousel`, `CarouselContent`, `CarouselItem`,
`CarouselNavigation`, `CarouselIndicator`; hook `useCarousel`) — Carousel:
`children` · `className?` · `initialIndex?` · `index?` (controlled) ·
`onIndexChange?` · `disableDrag?: boolean`

**Dialog** (compound: `Dialog`, `DialogTrigger`, `DialogContent`,
`DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogClose`) — Dialog:
`children` · `variants?` · `transition?` · `className?` · `defaultOpen?` ·
`open?` (controlled) · `onOpenChange?`. Handles Escape + outside click.

**Disclosure** (compound: `Disclosure`, `DisclosureTrigger`,
`DisclosureContent`) — `open?` · `onOpenChange?` · `className?` ·
`variants?: { expanded, collapsed }` · `transition?`

**InView** — `children` · `variants?: { hidden, visible }` · `transition?` ·
`viewOptions?` (IntersectionObserver options, e.g. `{ once: true, margin: '0px 0px -100px 0px' }`) ·
`as?: React.ElementType`. Animates hidden→visible when scrolled into view.

**InfiniteSlider** — `children` · `gap?: number` · `speed?: number` ·
`speedOnHover?: number` (slow-on-hover) · `direction?: 'horizontal' | 'vertical'` ·
`reverse?: boolean` · `className?`

**TransitionPanel** — `children: React.ReactNode[]` · `activeIndex: number`
(required, controlled) · `className?` · `transition?` ·
`variants?: { enter, center, exit }`. AnimatePresence between indexed panels.

## Interactive elements

**Dock** (compound: `Dock`, `DockItem`, `DockLabel`, `DockIcon`) — Dock:
`children` · `className?` · `distance?: number` · `panelHeight?: number` ·
`magnification?: number` · `spring?: SpringOptions`

**GlowEffect** — `className?` · `style?` · `colors?: string[]` ·
`mode?: 'rotate' | 'pulse' | 'breathe' | 'colorShift' | 'flowHorizontal' | 'static'` ·
`blur?: number | 'softest' | 'soft' | 'medium' | 'strong' | 'stronger' | 'strongest' | 'none'` ·
`transition?` · `scale?: number` · `duration?: number`
Renders as absolutely-positioned layer — parent needs `relative`, and put
content above it (`relative z-10`) or it will glow over your content.

**ImageComparison** (compound: `ImageComparison`, `ImageComparisonImage`,
`ImageComparisonSlider`) — `children` · `className?` · `enableHover?: boolean` ·
`springOptions?`. ImageComparisonImage takes `position: 'left' | 'right'`.

**ScrollProgress** — `className?` · `springOptions?` ·
`containerRef?: RefObject<HTMLDivElement>` (omit for window scroll)

**SpinningText** — `children: string` · `style?` · `duration?: number` ·
`className?` · `reverse?: boolean` · `fontSize?: number` · `radius?: number` ·
`transition?` · `variants?: { container?, item? }`

**Spotlight** — `className?` · `size?: number` · `springOptions?`
Absolutely positioned; parent needs `relative` and `overflow-hidden`; usually
`group`-gated visibility (`opacity-0 group-hover:opacity-100` pattern on it).

**Tilt** — `children` · `className?` · `style?: MotionStyle` ·
`rotationFactor?: number` · `isRevese?: boolean` · `springOptions?`
⚠️ The reverse prop is spelled **`isRevese`** in the shipped source (upstream
typo). `isReverse` will not compile. If it offends you, rename it in your copy —
but then your copy diverges from upstream docs.

## Advanced effects

**BorderTrail** — `className?` · `size?: number` · `transition?` ·
`onAnimationComplete?` · `style?`
A dot/segment that travels the parent's border radius. Parent needs `relative`
and a border/rounded shape for it to read correctly.

**Cursor** — `children` · `className?` · `springConfig?: SpringOptions` ·
`attachToParent?: boolean` · `transition?` ·
`variants?: { initial, animate, exit }` · `onPositionChange?: (x, y) => void`
Replaces/augments the cursor. `attachToParent` scopes it to the parent element.

**Magnetic** — `children` · `intensity?: number` · `range?: number` ·
`actionArea?: 'self' | 'parent' | 'global'` · `springOptions?`

**MorphingDialog** (compound: `MorphingDialog`, `MorphingDialogTrigger`,
`MorphingDialogContainer`, `MorphingDialogContent`, `MorphingDialogClose`,
`MorphingDialogTitle`, `MorphingDialogSubtitle`, `MorphingDialogDescription`,
`MorphingDialogImage`) — MorphingDialog: `children` · `transition?`
Shared-layout morph from trigger to dialog. Structure requirement:
`MorphingDialogContent` must live inside `MorphingDialogContainer` (the portal
+ backdrop); Trigger and Content are the two ends of the morph — matching
visual structure between them is what makes the morph read as continuous.
`MorphingDialogImage` takes `src`/`alt` and participates in the morph.

**MorphingPopover** (compound: `MorphingPopover`, `MorphingPopoverTrigger`,
`MorphingPopoverContent`) — `children` · `transition?` · `defaultOpen?` ·
`open?` · `onOpenChange?` · `variants?` · `className?`. Trigger supports
`asChild`.

**ProgressiveBlur** — `direction?: 'top' | 'right' | 'bottom' | 'left'` ·
`blurLayers?: number` (min 2) · `className?` · `blurIntensity?: number`
Stacked backdrop-blur gradient layers; position absolutely over the scroll edge.

## Toolbars (reference implementations, not primitives)

`toolbar-dynamic` and `toolbar-expandable` export a default page-level demo
with hard-coded buttons and content, using `useClickOutside` from the repo's
`hooks/`. Adapt the source; don't try to import and configure them.
