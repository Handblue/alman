import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/navigation/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard"  options={{ title: 'Ana Sayfa' }} />
      <Tabs.Screen name="categories" options={{ title: 'Kategoriler' }} />
      <Tabs.Screen name="explore"    options={{ title: 'Keşfet' }} />
      <Tabs.Screen name="profile"    options={{ title: 'Profil' }} />
    </Tabs>
  );
}
