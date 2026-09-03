/**
 * Brand assets, bundled with the app so they resolve from the MF remote's own
 * origin (a bare "/brand/…" path would 404 against the shell origin). rsbuild
 * emits hashed asset URLs for these imports, platform-canonical, no custom
 * loader involved.
 */
import iconColor from './rocketride-icon-color.svg';
import iconWhite from './rocketride-icon-white.svg';
import logoColor from './rocketride-logo-color.svg';
import logoWhite from './rocketride-logo-white.svg';
import preLaunch from './pre-launch.jpg';

export const BRAND = {
  iconColor,
  iconWhite,
  logoColor,
  logoWhite,
  preLaunch,
} as const;
