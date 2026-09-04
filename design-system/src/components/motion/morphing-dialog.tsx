'use client';

/**
 * Vendored motion-primitives MorphingDialog (compact copy — we own the
 * source). Trigger and Content are the two ends of a shared-layout morph;
 * Content must sit inside Container (portal + backdrop).
 */
import * as React from 'react';
import { createPortal } from 'react-dom';
import { useMounted } from '../../lib/use-mounted';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

type Ctx = {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  uniqueId: string;
};
const MorphingDialogContext = React.createContext<Ctx | null>(null);

function useMorphingDialog() {
  const ctx = React.useContext(MorphingDialogContext);
  if (!ctx) throw new Error('useMorphingDialog must be used within MorphingDialog');
  return ctx;
}

export function MorphingDialog({
  children,
  transition,
}: {
  children: React.ReactNode;
  transition?: Transition;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const uniqueId = React.useId();
  return (
    <MorphingDialogContext.Provider value={{ isOpen, setIsOpen, uniqueId }}>
      <MotionConfig transition={transition}>{children}</MotionConfig>
    </MorphingDialogContext.Provider>
  );
}

export function MorphingDialogTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { setIsOpen, uniqueId } = useMorphingDialog();
  return (
    <motion.button
      type="button"
      layoutId={`dialog-${uniqueId}`}
      className={cn('cursor-pointer text-left', className)}
      onClick={() => setIsOpen(true)}
    >
      {children}
    </motion.button>
  );
}

export function MorphingDialogContainer({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useMorphingDialog();
  const mounted = useMounted();
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setIsOpen]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence initial={false}>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-foreground/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 [&>*]:pointer-events-auto pointer-events-none">
            {children}
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function MorphingDialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { uniqueId } = useMorphingDialog();
  const reduced = useReducedMotion();
  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      layoutId={reduced ? undefined : `dialog-${uniqueId}`}
      className={cn('overflow-hidden', className)}
    >
      {children}
    </motion.div>
  );
}

export function MorphingDialogClose({ className }: { className?: string }) {
  const { setIsOpen } = useMorphingDialog();
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={() => setIsOpen(false)}
      className={cn('p-1 text-muted-foreground hover:text-foreground', className)}
    >
      <X size={16} strokeWidth={1.5} />
    </button>
  );
}

export function MorphingDialogTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('text-title font-semibold', className)}>{children}</div>;
}
