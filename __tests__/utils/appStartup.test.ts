import { resolveInitialRoute } from '@/utils/appStartup';

describe('resolveInitialRoute', () => {
  it('routes new users to welcome', () => {
    expect(resolveInitialRoute(false)).toBe('/(onboarding)/welcome');
  });

  it('routes onboarded users to dashboard', () => {
    expect(resolveInitialRoute(true)).toBe('/(app)/dashboard');
  });
});
