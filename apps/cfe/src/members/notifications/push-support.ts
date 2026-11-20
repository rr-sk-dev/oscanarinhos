export interface InstallEnvironment {
  userAgent: string;
  maxTouchPoints: number;
  isStandalone: boolean;
}

function isIosDevice({ userAgent, maxTouchPoints }: InstallEnvironment): boolean {
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return true;
  }
  // iPadOS reports a Mac user agent; only touch support tells it apart from a real Mac.
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1;
}

/** iOS only allows web push for an app added to the home screen, not in a Safari tab. */
export function needsInstall(environment: InstallEnvironment): boolean {
  return isIosDevice(environment) && !environment.isStandalone;
}
