import { Redirect } from 'expo-router';
import { useUserStore } from '@/store/useUserStore';
import { auth } from '@/firebase';

export default function Index() {
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  const isLoggedIn = !!auth?.currentUser;

  if (!hasOnboarded) return <Redirect href="/(onboarding)/welcome" />;
  if (!isLoggedIn) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(app)/dashboard" />;
}
