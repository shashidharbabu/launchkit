'use client';

import { useParams } from 'next/navigation';
import { ProjectProvider } from '@/components/launchkit/project-provider';
import { WorkspaceShell } from '@/components/launchkit/workspace-shell';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  return (
    <ProjectProvider id={id}>
      <TooltipProvider>
        <WorkspaceShell>{children}</WorkspaceShell>
      </TooltipProvider>
    </ProjectProvider>
  );
}
