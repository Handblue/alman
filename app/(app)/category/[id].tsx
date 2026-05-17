import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WKText, WKCard, WKChip } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { CATEGORIES } from '@/data/categories';
import { UNITS } from '@/data/units';
import { useProgressStore } from '@/store/useProgressStore';

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = Number(id);
  const category = CATEGORIES.find(c => c.id === categoryId);
  const units = UNITS.filter(u => u.categoryId === categoryId);
  const unitProgress = useProgressStore(s => s.unitProgress);

  if (!category) {
    return (
      <SafeAreaView style={styles.container}>
        <WKText variant="body" color={Colors.text.secondary}>Kategori bulunamadı.</WKText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <WKText style={styles.icon}>{category.icon}</WKText>
        <View style={{ flex: 1 }}>
          <WKText variant="heading1">{category.name}</WKText>
          <WKText variant="bodySm" color={Colors.text.secondary}>
            {category.description} · {units.length} ünite
          </WKText>
        </View>
      </View>

      <FlatList
        data={units}
        keyExtractor={item => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.s32 }}
        renderItem={({ item }) => {
          const progress = unitProgress[item.id];
          const completedCount = progress?.completedModes.length ?? 0;
          const isCompleted = progress?.isCompleted ?? false;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.title} ünitesi${isCompleted ? ', tamamlandı' : ''}`}
              onPress={() =>
                router.push({
                  pathname: '/(app)/unit/[id]',
                  params: { id: item.id },
                })
              }
              android_ripple={null}
              style={({ pressed }) => ({ marginBottom: Spacing.s12, opacity: pressed ? 0.82 : 1 })}
            >
              <WKCard style={[styles.unitCard, isCompleted && styles.unitCardDone]}>
                <View style={[styles.numberBadge, { backgroundColor: category.color + '30' }]}>
                  <WKText variant="caption" color={category.color}>
                    {item.number}
                  </WKText>
                </View>
                <View style={{ flex: 1 }}>
                  <WKText variant="heading2">{item.title}</WKText>
                  <WKText variant="caption" color={Colors.text.secondary}>
                    {item.wordCount} kelime
                  </WKText>
                </View>
                {isCompleted ? (
                  <WKChip label="✓" color={Colors.status.success + '30'} textColor={Colors.status.success} />
                ) : completedCount > 0 ? (
                  <WKChip
                    label={`${completedCount}/6`}
                    color={Colors.brand.primary + '20'}
                    textColor={Colors.brand.primary}
                  />
                ) : (
                  <WKChip label="Başla" color={Colors.bg.cardDark} textColor={Colors.text.secondary} />
                )}
              </WKCard>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.light,
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s16,
    marginBottom: Spacing.s24,
  },
  icon: { fontSize: 40 },
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s12,
  },
  unitCardDone: {
    borderWidth: 1,
    borderColor: Colors.status.success + '40',
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
