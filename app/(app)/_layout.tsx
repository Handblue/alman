import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* ── Visible main tabs ── */}
      <Tabs.Screen name="dashboard"   options={{ title: 'Ana Sayfa' }} />
      <Tabs.Screen name="categories"  options={{ title: 'Kategoriler' }} />
      <Tabs.Screen name="explore"     options={{ title: 'Keşfet' }} />
      <Tabs.Screen name="profile"     options={{ title: 'Profil' }} />

      {/* ── Navigable but hidden from tab bar ── */}
      <Tabs.Screen name="notebook"               options={{ href: null }} />
      <Tabs.Screen name="analytics"              options={{ href: null }} />
      <Tabs.Screen name="friends"                options={{ href: null }} />
      <Tabs.Screen name="leaderboard"            options={{ href: null }} />
      <Tabs.Screen name="daily-challenge"        options={{ href: null }} />
      <Tabs.Screen name="settings"               options={{ href: null }} />
      <Tabs.Screen name="challenges"             options={{ href: null }} />
      <Tabs.Screen name="study-groups"           options={{ href: null }} />
      <Tabs.Screen name="battle"                 options={{ href: null }} />
      <Tabs.Screen name="premium"                options={{ href: null }} />
      <Tabs.Screen name="notification-preferences" options={{ href: null }} />
      <Tabs.Screen name="offline-download"       options={{ href: null }} />
      <Tabs.Screen name="statistics"             options={{ href: null }} />
      <Tabs.Screen name="achievements"           options={{ href: null }} />
    </Tabs>
  );
}
