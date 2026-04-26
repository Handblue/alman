import { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { CATEGORIES, Category } from '@/data/categories';
import { useUserStore } from '@/store/useUserStore';

export default function CategorySelectScreen() {
  const [selected, setSelected] = useState<number[]>([]);
  const { setCategories, setOnboarded } = useUserStore();

  function toggle(id: number) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  function handleContinue() {
    const finalSelection = selected.length === 0 ? CATEGORIES.map(c => c.id) : selected;
    setCategories(finalSelection);
    setOnboarded(true);
    router.replace('/(app)/dashboard');
  }

  return (
    <SafeAreaView style={styles.container}>
      <WKText variant="heading1" style={{ marginBottom: Spacing.s8 }}>Kategoriler</WKText>
      <WKText variant="body" color={Colors.text.secondary} style={{ marginBottom: Spacing.s24 }}>
        Çalışmak istediğin konuları seç
      </WKText>
      <FlatList<Category>
        data={CATEGORIES}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        columnWrapperStyle={{ gap: Spacing.s12 }}
        contentContainerStyle={{ gap: Spacing.s12, paddingBottom: Spacing.s24 }}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.id);
          return (
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityLabel={item.name}
              accessibilityState={{ checked: isSelected }}
              onPress={() => toggle(item.id)}
              style={[styles.card, {
                borderColor: isSelected ? item.color : Colors.bg.cardDark,
                backgroundColor: isSelected ? item.color + '20' : Colors.bg.cardDark,
              }]}
            >
              <WKText style={{ fontSize: 28 }}>{item.icon}</WKText>
              <WKText variant="caption" style={{ marginTop: Spacing.s4, fontWeight: '700', textAlign: 'center' }}>{item.name}</WKText>
            </TouchableOpacity>
          );
        }}
      />
      <WKButton
        label={selected.length === 0 ? 'Tümünü Seç ve Başla' : `${selected.length} Kategori — Başla`}
        onPress={handleContinue}
        style={{ marginBottom: Spacing.s16 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.light, paddingHorizontal: Spacing.s20, paddingTop: Spacing.s32 },
  card: { flex: 1, borderRadius: 16, borderWidth: 2, padding: Spacing.s16, minHeight: 100, justifyContent: 'center', alignItems: 'center' },
});
