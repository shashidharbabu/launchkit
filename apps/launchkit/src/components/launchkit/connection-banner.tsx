/**
 * Shown when a store/pipeline call fails. Unlike the old Next.js version, the
 * shell app has NO localhost backend, the failure is the RocketRide store
 * connection, and the banner shows the real error so it can be diagnosed
 * rather than a misleading "start the backend" instruction.
 */
export function ConnectionBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="border border-nogo bg-nogo/10 p-3">
      <p className="text-body font-medium">Couldn’t reach the RocketRide store.</p>
      <p className="mt-1 text-body text-muted-foreground">
        This is the app’s data layer, not a local server; nothing to start. Retry in a moment;
        if it persists, the store pipeline may need attention.
      </p>
      <p className="mt-2 break-words font-mono text-data text-muted-foreground">{error}</p>
    </div>
  );
}
