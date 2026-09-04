import { PageTransition } from '@launchkit/design-system/components/page-transition';
import { ProjectProvider } from '../components/launchkit/project-provider';
import { WorkspaceShell } from '../components/launchkit/workspace-shell';
import { TooltipProvider } from '@launchkit/design-system/components/tooltip';
import { ProfileStage } from '../components/launchkit/stages/profile-stage';
import { BrandStage } from '../components/launchkit/stages/brand-stage';
import { CommercialStage } from '../components/launchkit/stages/commercial-stage';
import { AssetsStage } from '../components/launchkit/stages/assets-stage';
import { TargetsStage } from '../components/launchkit/stages/targets-stage';
import { SignalsStage } from '../components/launchkit/stages/signals-stage';
import { PlanStage } from '../components/launchkit/stages/plan-stage';
import { stageIndex } from '../lib/stages';
import { useNav } from '../nav';

/** The [stage]/page.tsx port: one PageTransition per stage, keyed by stage index. */
function StagePanel({ id, stage }: { id: string; stage: string }) {
  const { go, href } = useNav();
  const idx = stageIndex(stage);

  if (idx === -1) {
    return (
      <div>
        <p className="text-heading font-semibold">No such stage.</p>
        <p className="mt-1 text-body text-muted-foreground">
          The launch runs through seven stages, starting with the profile.
        </p>
        <a
          href={href({ view: 'workspace', projectId: id, stage: 'profile' })}
          onClick={(e) => {
            e.preventDefault();
            go({ view: 'workspace', projectId: id, stage: 'profile' });
          }}
          className="mt-3 inline-block text-body text-link hover:text-link-hover"
        >
          Go to Profile
        </a>
      </div>
    );
  }

  const stages = [
    <ProfileStage key="profile" />,
    <BrandStage key="brand" />,
    <CommercialStage key="commercial" />,
    <AssetsStage key="assets" />,
    <TargetsStage key="targets" />,
    <SignalsStage key="signals" />,
    <PlanStage key="plan" />,
  ];
  // one enter per stage change: the same 200ms rise every page uses
  return <PageTransition key={idx}>{stages[idx]}</PageTransition>;
}

/** The p/[id]/layout.tsx port: provider + shell around the active stage. */
export default function WorkspacePage() {
  const { nav } = useNav();
  const id = nav.projectId;
  const stage = nav.stage ?? 'profile';
  if (!id) return null;
  return (
    <ProjectProvider key={id} id={id}>
      <TooltipProvider>
        <WorkspaceShell>
          <StagePanel id={id} stage={stage} />
        </WorkspaceShell>
      </TooltipProvider>
    </ProjectProvider>
  );
}
