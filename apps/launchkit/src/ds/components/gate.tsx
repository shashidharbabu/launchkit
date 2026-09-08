'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { Card, CardFooter } from './card';
import { StatusStamp, type StampKind } from './status-stamp';
import { ProvenanceLine } from './provenance-line';
import { Button } from './button';
import { DUR, EASE_STANDARD, EASE_EXIT, SPRING } from '../lib/motion';
import { cn } from '../lib/cn';

/**
 * The Gate (components/gate.md): the signature element.
 *
 * A gate is where a human decides. It is drawn as a panel with a numbered
 * glyph, a status, the thing being approved, and one flare verb. Approving
 * fires the release: a line sweeps across the top of the panel, an
 * "Approved" seal springs in, then the panel settles into a single signed
 * row. While the release plays nothing else moves.
 */
export function GateGlyph({
  n,
  tone = 'muted',
  className,
}: {
  n: number | string;
  tone?: 'muted' | 'flare' | 'go';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded-[7px] border font-mono text-[11px] font-medium tabular',
        tone === 'go' && 'border-go bg-go text-background',
        tone === 'flare' && 'border-flare text-flare-text',
        tone === 'muted' && 'border-border-strong text-muted-foreground',
        className,
      )}
    >
      {tone === 'go' ? <Check size={12} strokeWidth={3} aria-hidden /> : n}
    </span>
  );
}

export function GateSlip({
  gate,
  title,
  description,
  stamp = 'hold',
  signed,
  signedLine,
  provenance,
  actions,
  reopenActions,
  initiallyExpanded,
  children,
}: {
  gate: 1 | 2 | 3;
  title: string;
  description?: React.ReactNode;
  stamp?: StampKind;
  signed: boolean;
  /** "Approved on 11 Aug, v2" */
  signedLine: string;
  provenance: Array<string | null | undefined | false>;
  /** Action row while unsigned: the flare verb + secondaries. */
  actions: React.ReactNode;
  /** Action row when a signed gate is re-opened (edit / regenerate, no Approve). */
  reopenActions?: React.ReactNode;
  /** Open a signed gate in this mode on first render (the Profile stage has nothing else to show). */
  initiallyExpanded?: 'view' | 'reopen';
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const [releasing, setReleasing] = React.useState(false);
  const [expanded, setExpanded] = React.useState<null | 'view' | 'reopen'>(
    signed ? (initiallyExpanded ?? null) : null,
  );

  // React's documented pattern for reacting to a prop change during render:
  // the release starts the moment `signed` flips to true, never a frame late.
  const [prevSigned, setPrevSigned] = React.useState(signed);
  if (signed !== prevSigned) {
    setPrevSigned(signed);
    if (signed && !reduced) setReleasing(true);
    if (!signed) setExpanded(null);
  }

  React.useEffect(() => {
    if (!releasing) return;
    const t = setTimeout(() => setReleasing(false), DUR.gate * 1000 + 500);
    return () => clearTimeout(t);
  }, [releasing]);

  const showSlip = !signed || releasing || expanded !== null;

  return (
    <div>
      <AnimatePresence initial={false} mode="wait">
        {showSlip ? (
          <motion.div
            key="slip"
            exit={
              reduced
                ? undefined
                : { height: 0, opacity: 0, transition: { duration: DUR.base, ease: EASE_EXIT } }
            }
            style={{ overflow: 'hidden' }}
          >
            <Card className={cn('relative overflow-hidden', releasing && 'border-go/60')}>
              <div className="flex flex-wrap items-center gap-3 px-5 pt-4">
                <GateGlyph n={gate} tone={signed ? 'go' : 'flare'} />
                <span className="text-small font-medium text-muted-foreground">Gate {gate}</span>
                <span className="ml-auto">
                  <StatusStamp kind={signed ? 'go' : stamp} />
                </span>
              </div>
              <div className="px-5 pt-3">
                <h2 className="text-title">{title}</h2>
                {description && <p className="mt-1 max-w-reading text-body text-muted-foreground">{description}</p>}
              </div>
              <div className="px-5 py-5">
                {children}
                <ProvenanceLine parts={provenance} />
              </div>
              {!signed && <CardFooter className="bg-sunken/40">{actions}</CardFooter>}
              {signed && expanded !== null && (
                <CardFooter className="bg-sunken/40">
                  {expanded === 'reopen' && reopenActions}
                  <Button variant="ghost" className="ml-auto" onClick={() => setExpanded(null)}>
                    Collapse
                  </Button>
                </CardFooter>
              )}

              {/* the release */}
              <AnimatePresence>
                {releasing && (
                  <React.Fragment key="release">
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left bg-go"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: DUR.gate, ease: EASE_STANDARD }}
                    />
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 flex items-center justify-center bg-surface/70 backdrop-blur-[1px]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: DUR.base } }}
                      transition={{ duration: DUR.base }}
                    >
                      <motion.span
                        className="flex items-center gap-2 rounded-full bg-go px-4 py-2 text-body font-semibold text-background shadow-raised"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ ...SPRING, delay: 0.14 }}
                      >
                        <Check size={18} strokeWidth={3} />
                        Approved
                      </motion.span>
                    </motion.div>
                  </React.Fragment>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="signed"
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.base, ease: EASE_STANDARD }}
          >
            <Card className="flex flex-wrap items-center gap-3 px-5 py-3">
              <GateGlyph n={gate} tone="go" />
              <StatusStamp kind="go" />
              <span className="min-w-0 flex-1 truncate text-body">
                <span className="font-medium">{title}</span>
                <span className="text-muted-foreground"> {signedLine}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => setExpanded('view')}>
                View
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setExpanded('reopen')}>
                Re-open
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
