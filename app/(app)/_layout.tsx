import { Tabs } from 'expo-router';
import { Colors } from '@/constants/colors';
import { WKText } from '@/components/ui';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <WKText style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </WKText>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg.primaryDark,
          borderTopColor: Colors.bg.cardDark,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          tabBarAccessibilityLabel: 'Ana Sayfa',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
          tabBarAccessibilityLabel: 'Keşfet',
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Kategoriler',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
          tabBarAccessibilityLabel: 'Kategoriler',
        }}
      />
      <Tabs.Screen
        name="notebook"
        options={{
          title: 'Defterim',
          tabBarIcon: ({ focused }) => <TabIcon emoji="❤️" focused={focused} />,
          tabBarAccessibilityLabel: 'Kelime Defterim',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analitik',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
          tabBarAccessibilityLabel: 'Öğrenme Analitiği',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          tabBarAccessibilityLabel: 'Profil',
        }}
      />
      <Tabs.Screen
        name="study-groups"
        options={{ href: null, headerShown: false }}
      />
      <Tabs.Screen
        name="study-group/[id]"
        options={{ href: null, headerShown: false }}
      />
      <Tabs.Screen
        name="battle"
        options={{ href: null, headerShown: false }}
      />
    </Tabs>
  );
}
