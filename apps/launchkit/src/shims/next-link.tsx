/**
 * Resolution shim for `next/link`, imported at module top by the design
 * system's button.tsx for its LinkButton. This app has no router and never
 * renders LinkButton (ADOPT-SHELL-APP.md step 4), so the module only has to
 * resolve; it is mapped here through tsconfig `paths`, which rsbuild honours.
 * If it ever rendered it would be a plain anchor.
 */
import * as React from 'react';
type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean };
export default function Link({ href, prefetch: _prefetch, ...props }: LinkProps) {
  return <a href={href} {...props} />;
}
