import { motion, useReducedMotion } from 'motion/react';
import { PlatformIcon, platformTitle, LAUNCH_PLATFORMS } from '../ui/platform-icons';

/**
 * The platforms Launch Kit writes for, bobbing gently — the one piece of
 * ambient motion on the page. Static under prefers-reduced-motion
 * (motion.md), and the tiles read the same either way.
 */
export function FloatingPlatforms() {
  const reduced = useReducedMotion();

  return (
    <ul className="flex flex-wrap gap-2">
      {LAUNCH_PLATFORMS.map((name, i) => (
        <motion.li
          key={name}
          title={platformTitle(name)}
          className="flex h-9 w-9 items-center justify-center text-muted-foreground"
          animate={reduced ? undefined : { y: [0, -4, 0] }}
          transition={
            reduced
              ? undefined
              : {
                  duration: 3.2 + i * 0.35,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.28,
                }
          }
        >
          <PlatformIcon name={name} size={18} />
        </motion.li>
      ))}
    </ul>
  );
}
