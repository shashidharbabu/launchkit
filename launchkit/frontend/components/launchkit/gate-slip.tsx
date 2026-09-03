'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { StatusStamp, type StampKind } from '@/components/ui/status-stamp';
import { ProvenanceLine } from '@/components/ui/provenance-line';
import { Button } from '@/components/ui/button';
import { DUR, EASE_STANDARD, EASE_EXIT } from '@/lib/motion';

/**
 * The Gate Slip — the signature element (01-direction.md). A bordered sheet
 * on the desk (no shadow). Approving fires the stamp: GO lands with
 * scale 1.15 → 1.0 over --duration-stamp, then the slip collapses to a
 * signed row. While the stamp plays, nothing else moves.
 */
export function GateSlip({
  gateLabel,
  stamp,
  signed,
  signedLine,
  provenance,
  actions,
  reopenActions,
  children,
}: {
  gateLabel: string; // "GATE 01 — PROFILE"
  stamp: StampKind;
  signed: boolean;
  signedLine: string; // "profile approved · aug 11"
  provenance: Array<string | null | undefined | false>;
  /** Action row while unsigned: the ember verb + secondaries. */
  actions: React.ReactNode;
  /** Action row when a signed slip is re-opened (edit/regenerate — no Approve). */
  reopenActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  // signed slip: collapsed row by default; View = read it, Re-open = act on it.
  const [stamping, setStamping] = React.useState(false);
  const [expanded, setExpanded] = React.useState<null | 'view' | 'reopen'>(null);
  const wasSigned = React.useRef(signed);

  React.useEffect(() => {
    if (signed && !wasSigned.current && !reduced) {
      setStamping(true);
      const t = setTimeout(() => setStamping(false), DUR.stamp * 1000 + 500);
      return () => clearTimeout(t);
    }
    wasSigned.current = signed;
    if (!signed) setExpanded(null);
  }, [signed, reduced]);

  const showSlip = !signed || stamping || expanded !== null;

  return (
    <div>
      <AnimatePresence initial={false} mode="wait">
        {showSlip ? (
          <motion.div
            key="slip"
            exit={
              reduced
                ? undefined
                : {
                    height: 0,
                    opacity: 0,
                    transition: { duration: DUR.base, ease: EASE_EXIT },
                  }
            }
            style={{ overflow: 'hidden' }}
          >
            <div className="relative rounded-sm border border-border bg-card">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-mono text-meta font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {gateLabel}
                </span>
                <StatusStamp kind={signed ? 'go' : stamp} />
              </div>
              <div className="border-t border-border px-4 py-4">
                {children}
                <ProvenanceLine parts={provenance} />
              </div>
              {!signed && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
                  {actions}
                </div>
              )}
              {signed && expanded !== null && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
                  {expanded === 'reopen' && reopenActions}
                  <Button variant="ghost" onClick={() => setExpanded(null)}>
                    Collapse
                  </Button>
                </div>
              )}

              {/* the stamp lands — meta stamp treatment, sized by transform */}
              <AnimatePresence>
                {stamping && (
                  <motion.div
                    key="stamp"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 2.3, opacity: 0 }}
                    animate={{ scale: 2, opacity: 1 }}
                    transition={{ duration: DUR.stamp, ease: EASE_STANDARD }}
                  >
                    <span className="border-2 border-go bg-card px-2 py-0.5 font-mono text-meta font-medium uppercase tracking-[0.08em] text-go">
                      GO
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="signed"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DUR.base, ease: EASE_STANDARD }}
            className="flex flex-wrap items-center gap-3 rounded-sm border border-border bg-card px-4 py-2.5"
          >
            <StatusStamp kind="go" />
            <span className="min-w-0 flex-1 truncate text-body">{signedLine}</span>
            <Button variant="ghost" onClick={() => setExpanded('view')}>
              View
            </Button>
            <Button variant="ghost" onClick={() => setExpanded('reopen')}>
              Re-open
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
