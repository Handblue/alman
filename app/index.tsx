import { Redirect } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';

export default function Index() {
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  return <Redirect href={hasOnboarded ? '/(app)/dashboard' : '/(onboarding)/welcome'} />;
}
