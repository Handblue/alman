import React, { useContext, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter, usePathname } from 'expo-router';
import { Colors } from '@/constants/colors';
import { ThemeContext } from '@/context/ThemeContext';
import { WKText } from '@/components/ui';

const MAIN_TABS = [
  { name: 'dashboard',   label: 'Ana Sayfa',   emoji: '⌂'  },
  { name: 'categories',  label: 'Kategoriler',  emoji: '📚' },
  { name: 'explore',     label: 'Keşfet',       emoji: '◎'  },
  { name: 'profile',     label: 'Profil',        emoji: '◉'  },
] as const;

const MORE_ITEMS = [
  { route: '/notebook',        label: 'Kelime Defteri', emoji: '❤️' },
  { route: '/analytics',       label: 'Analitik',       emoji: '📊' },
  { route: '/friends',         label: 'Arkadaşlar',     emoji: '👥' },
  { route: '/leaderboard',     label: 'Sıralama',       emoji: '🏆' },
  { route: '/daily-challenge', label: 'Günlük Görev',   emoji: '🎯' },
  { route: '/settings',        label: 'Ayarlar',        emoji: '⚙️' },
] as const;

const MORE_NAMES = MORE_ITEMS.map(i => i.route.slice(1));

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets     = useSafeAreaInsets();
  const theme      = useContext(ThemeContext);
  const [open, setOpen] = useState(false);
  const router     = useRouter();
  const pathname   = usePathname();

  const isDark      = theme?.isDark ?? false;
  const barBg       = isDark ? Colors.bg.cardDark  : Colors.bg.card;
  const borderColor = isDark ? Colors.border.dark   : Colors.border.primary;
  const sheetBg     = isDark ? Colors.bg.cardDark   : Colors.bg.card;
  const iconBg      = isDark ? Colors.bg.cardDark2  : Colors.bg.light;
  const titleColor  = isDark ? Colors.text.primaryDark : Colors.text.primary;

  // Bottom safe area — respects Android gesture/button bar
  const bottomPad = Math.max(insets.bottom, 8);

  const currentName  = pathname.split('/').pop() ?? '';
  const isMoreActive = MORE_NAMES.includes(currentName);

  return (
    <>
      {/* ── Tab Bar ── */}
      <View
        style={[
          styles.bar,
          { backgroundColor: barBg, borderTopColor: borderColor, paddingBottom: bottomPad },
        ]}
      >
        {MAIN_TABS.map((tab) => {
          const idx     = state.routes.findIndex(r => r.name === tab.name);
          const focused = state.index === idx;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => navigation.navigate(tab.name)}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: focused }}
            >
              <WKText style={[styles.emoji, !focused && styles.dim]}>{tab.emoji}</WKText>
              <WKText
                style={[
                  styles.label,
                  { color: focused ? Colors.brand.violet : Colors.text.muted },
                ]}
              >
                {tab.label}
              </WKText>
            </TouchableOpacity>
          );
        })}

        {/* More button */}
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Daha fazla seçenek"
          accessibilityState={{ selected: isMoreActive || open }}
        >
          <WKText style={[styles.emoji, !isMoreActive && !open && styles.dim]}>⋯</WKText>
          <WKText
            style={[
              styles.label,
              {
                color:
                  isMoreActive || open ? Colors.brand.violet : Colors.text.muted,
              },
            ]}
          >
            Daha
          </WKText>
        </TouchableOpacity>
      </View>

      {/* ── More Bottom Sheet ── */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalWrap}>
          <Pressable style={styles.overlay} onPress={() => setOpen(false)} />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: sheetBg,
                paddingBottom: Math.max(insets.bottom, 20),
                borderTopColor: borderColor,
              },
            ]}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: borderColor }]} />

            <WKText style={[styles.sheetTitle, { color: titleColor }]}>
              Diğer Seçenekler
            </WKText>

            {/* 3 × 2 grid */}
            <View style={styles.row}>
              {MORE_ITEMS.slice(0, 3).map(item => (
                <GridItem
                  key={item.route}
                  item={item}
                  iconBg={iconBg}
                  onPress={() => {
                    setOpen(false);
                    router.push(item.route as Parameters<typeof router.push>[0]);
                  }}
                />
              ))}
            </View>
            <View style={styles.row}>
              {MORE_ITEMS.slice(3).map(item => (
                <GridItem
                  key={item.route}
                  item={item}
                  iconBg={iconBg}
                  onPress={() => {
                    setOpen(false);
                    router.push(item.route as Parameters<typeof router.push>[0]);
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function GridItem({
  item,
  iconBg,
  onPress,
}: {
  item: { emoji: string; label: string };
  iconBg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <View style={[styles.gridIcon, { backgroundColor: iconBg }]}>
        <WKText style={styles.gridEmoji}>{item.emoji}</WKText>
      </View>
      <WKText style={styles.gridLabel}>{item.label}</WKText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection:  'row',
    borderTopWidth: 1,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: -2 },
    shadowOpacity:  0.07,
    shadowRadius:   8,
    elevation:      10,
  },
  tab: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    paddingTop:      10,
    paddingBottom:   4,
    minHeight:       56,
  },
  emoji: { fontSize: 22 },
  dim:   { opacity: 0.38 },
  label: {
    fontSize:    10,
    fontFamily:  'Inter_500Medium',
    marginTop:   3,
  },

  // Modal
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  sheet: {
    borderTopWidth:       1,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingHorizontal:    20,
    paddingTop:           12,
  },
  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
    alignSelf:    'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize:     16,
    fontFamily:   'Inter_600SemiBold',
    textAlign:    'center',
    marginBottom: 20,
  },
  row: {
    flexDirection:  'row',
    justifyContent: 'space-evenly',
    marginBottom:   16,
  },
  gridItem: {
    width:      90,
    alignItems: 'center',
  },
  gridIcon: {
    width:         58,
    height:        58,
    borderRadius:  16,
    alignItems:    'center',
    justifyContent:'center',
    marginBottom:  6,
  },
  gridEmoji: { fontSize: 26 },
  gridLabel: {
    fontSize:   11,
    fontFamily: 'Inter_500Medium',
    color:      Colors.text.muted,
    textAlign:  'center',
  },
});
