/**
 * voice.md error style: what happened, then the fix, no apology, no
 * vagueness. Wraps raw fetch/API failures at the surface where the user
 * sees them.
 */
export function actionError(action: string, e: unknown): string {
  const detail = String(e instanceof Error ? e.message : e);
  if (/failed to fetch|networkerror|econnrefused|load failed/i.test(detail)) {
    return `Couldn't ${action}, couldn't reach RocketRide, retry in a moment.`;
  }
  return `Couldn't ${action}, ${detail}.`;
}
