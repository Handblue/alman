import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Home, Compass, BookOpen, Heart, User, BarChart2 } from '@/constants/icons';

type TabIconProps = {
  Icon: React.ComponentType<{ size: number; color: string }>;
  focused: boolean;
};

function TabIcon({ Icon, focused }: TabIconProps) {
  return (
    <Icon
      size={22}
      color={focused ? Colors.brand.primary : Colors.text.secondary}
    />
  );
}

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bg.primaryDark,
          borderTopColor: Colors.bg.cardDark,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.brand.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_500Medium',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => <TabIcon Icon={Home} focused={focused} />,
          tabBarAccessibilityLabel: 'Ana Sayfa',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ focused }) => <TabIcon Icon={Compass} focused={focused} />,
          tabBarAccessibilityLabel: 'Keşfet',
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Kategoriler',
          tabBarIcon: ({ focused }) => <TabIcon Icon={BookOpen} focused={focused} />,
          tabBarAccessibilityLabel: 'Kategoriler',
        }}
      />
      <Tabs.Screen
        name="notebook"
        options={{
          title: 'Defterim',
          tabBarIcon: ({ focused }) => <TabIcon Icon={Heart} focused={focused} />,
          tabBarAccessibilityLabel: 'Kelime Defterim',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analitik',
          tabBarIcon: ({ focused }) => <TabIcon Icon={BarChart2} focused={focused} />,
          tabBarAccessibilityLabel: 'Öğrenme Analitiği',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon Icon={User} focused={focused} />,
          tabBarAccessibilityLabel: 'Profil',
        }}
      />
      <Tabs.Screen name="study-groups" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="study-group/[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="battle" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="premium" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="settings" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="notification-preferences" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="offline-download" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="statistics" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="achievements" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="speaking" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
