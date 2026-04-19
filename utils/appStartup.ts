export type AppEntryRoute = '/(onboarding)/welcome' | '/(app)/dashboard';

export function resolveInitialRoute(hasOnboarded: boolean): AppEntryRoute {
  return hasOnboarded ? '/(app)/dashboard' : '/(onboarding)/welcome';
}
