'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useReducedMotion } from 'motion/react';
import { TransitionPanel } from '@/components/motion-primitives/transition-panel';
import { ProfileStage } from '@/components/launchkit/stages/profile-stage';
import { BrandStage } from '@/components/launchkit/stages/brand-stage';
import { CommercialStage } from '@/components/launchkit/stages/commercial-stage';
import { AssetsStage } from '@/components/launchkit/stages/assets-stage';
import { TargetsStage } from '@/components/launchkit/stages/targets-stage';
import { SignalsStage } from '@/components/launchkit/stages/signals-stage';
import { PlanStage } from '@/components/launchkit/stages/plan-stage';
import { stageIndex } from '@/lib/stages';
import { DUR, EASE_STANDARD, EASE_EXIT } from '@/lib/motion';

export default function StagePage() {
  const { id, stage } = useParams<{ id: string; stage: string }>();
  const idx = stageIndex(stage);
  const reduced = useReducedMotion();

  if (idx === -1) {
    return (
      <div>
        <p className="text-heading font-semibold">No such stage.</p>
        <p className="mt-1 text-body text-muted-foreground">
          The launch runs through seven stages, starting with the profile.
        </p>
        <Link
          href={`/p/${id}/profile`}
          className="mt-3 inline-block text-body text-link hover:text-link-hover"
        >
          Go to Profile
        </Link>
      </div>
    );
  }

  return (
    <TransitionPanel
      activeIndex={idx}
      transition={{ duration: DUR.base, ease: EASE_STANDARD }}
      variants={
        reduced
          ? undefined
          : {
              enter: { opacity: 0, y: 4 },
              center: { opacity: 1, y: 0 },
              exit: {
                opacity: 0,
                y: -4,
                transition: { duration: DUR.base, ease: EASE_EXIT },
              },
            }
      }
    >
      <ProfileStage />
      <BrandStage />
      <CommercialStage />
      <AssetsStage />
      <TargetsStage />
      <SignalsStage />
      <PlanStage />
    </TransitionPanel>
  );
}
