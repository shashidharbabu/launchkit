'use client';

import * as React from 'react';

/**
 * Where portalled surfaces (dialogs, sheets, tooltips, menus, the morphing
 * dialog) mount.
 *
 * By default they mount on `document.body`, which is right for an app that
 * owns the page. An app that renders inside someone else's page, with its
 * stylesheet scoped under one root and its theme class on that root (a Module
 * Federation remote, an embedded widget), must portal INSIDE that root, or the
 * surface escapes both the styles and the theme and renders unstyled. Such an
 * app wraps its tree once:
 *
 *   <PortalContainerProvider container={rootRef}>…</PortalContainerProvider>
 *
 * The companion of `AmbientField`'s `themeRoot` (ADOPT.md, section 6a). Plain
 * `.ts` on purpose: the `lib/*` export resolves to `.ts` files.
 */
export type PortalContainer = HTMLElement | React.RefObject<HTMLElement | null> | null | undefined;

const PortalContainerContext = React.createContext<PortalContainer>(undefined);

export function PortalContainerProvider({
  container,
  children,
}: {
  container: PortalContainer;
  children: React.ReactNode;
}) {
  return React.createElement(PortalContainerContext.Provider, { value: container }, children);
}

/** The container in the shape Base UI portals accept (an element or a ref). */
export function usePortalContainer(): PortalContainer {
  return React.useContext(PortalContainerContext);
}

/** The container resolved to an element, for `createPortal`. */
export function usePortalContainerElement(): HTMLElement | null {
  const c = React.useContext(PortalContainerContext);
  if (!c) return null;
  return c instanceof HTMLElement ? c : c.current;
}
