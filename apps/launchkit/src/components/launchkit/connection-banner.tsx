import { Banner } from '@launchkit/design-system/components/banner';

/** The backend-unreachable state (feedback-states.md): what happened, what to do, the raw error for support. */
export function ConnectionBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <Banner tone="nogo" title="The RocketRide store is not reachable.">
      This is the app’s data layer, not a local server; nothing to start. Retry in a moment; if
      it persists, the store needs attention.
      <span className="mt-2 block break-words font-mono text-data text-muted-foreground">{error}</span>
    </Banner>
  );
}
