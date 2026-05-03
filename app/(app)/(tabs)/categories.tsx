import { FlatList, TouchableOpacity, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WKText, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { CATEGORIES } from '@/data/categories';

export default function CategoriesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <WKText variant="heading1" style={{ marginBottom: Spacing.s24 }}>
        Kategoriler
      </WKText>
      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`${item.name} kategorisi, ${item.description}`}
            activeOpacity={0.92}
            onPress={() =>
              router.push({
                pathname: '/(app)/category/[id]',
                params: { id: item.id },
              })
            }
            style={{ marginBottom: Spacing.s12 }}
          >
            <WKCard style={styles.cardRow}>
              <WKText style={{ fontSize: 32 }}>{item.icon}</WKText>
              <View style={{ flex: 1 }}>
                <WKText variant="heading2">{item.name}</WKText>
                <WKText variant="bodySm" color={Colors.text.secondary}>
                  {item.description}
                </WKText>
                <WKText variant="caption" color={item.color}>
                  {item.totalUnits} ünite · {item.totalUnits * 15} kelime
                </WKText>
              </View>
            </WKCard>
          </TouchableOpacity>
        )}
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
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s16 },
});
