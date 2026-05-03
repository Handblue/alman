import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText, WKCard } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { CATEGORIES } from '@/data/categories';
import { UNITS } from '@/data/units';
import { WORDS } from '@/data/words';

const PLAYLISTS = [
  {
    id: 'goethe-b1',
    title: 'Goethe B1 Paketi',
    description: 'Sınava 30 gün kaldı? Bu paket zorunlu.',
    emoji: '🎓',
    gradient: ['#512DA8', '#7C6CFF'] as const,
    categoryId: 3,
  },
  {
    id: 'daily-life',
    title: 'Günlük Almanca',
    description: 'Market, doktor, ulaşım — hemen kullan.',
    emoji: '🏪',
    gradient: ['#7C6CFF', '#00BCD4'] as const,
    categoryId: 5,
  },
  {
    id: 'idioms',
    title: 'Deyimler Kitaplığı',
    description: 'Almanlar gibi konuş — Redewendungen.',
    emoji: '💬',
    gradient: ['#FF6D00', '#FFCA28'] as const,
    categoryId: 8,
  },
  {
    id: 'grammar-master',
    title: 'Gramer Ustası',
    description: 'A1\'den C1\'e bağlaçlar ve yapılar.',
    emoji: '📚',
    gradient: ['#7C6CFF', '#00BCD4'] as const,
    categoryId: 2,
  },
];

const FILTERS = ['Tümü', 'A1-A2', 'B1-B2', 'Gramer', 'Konuşma'];

const LEVEL_COLORS: Record<string, string> = {
  A1: Colors.status.success,
  A2: Colors.word.green,
  B1: Colors.brand.violet,
  B2: Colors.accent.orange,
  C1: Colors.status.error,
};

function WordRow({ german, turkish, level, unitId }: {
  german: string; turkish: string; level: string; unitId: number;
}) {
  return (
    <Pressable
      style={styles.wordRow}
      onPress={() => router.push({ pathname: '/(app)/unit/[id]', params: { id: unitId } })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <WKText style={styles.wordGerman}>{german}</WKText>
        <WKText style={styles.wordTurkish}>{turkish}</WKText>
      </View>
      <View style={[styles.levelChip, { borderColor: LEVEL_COLORS[level] ?? Colors.text.muted }]}>
        <WKText style={[styles.levelText, { color: LEVEL_COLORS[level] ?? Colors.text.muted }]}>
          {level}
        </WKText>
      </View>
    </Pressable>
  );
}

function CategoryCard({ id, name, icon, color, description }: {
  id: number; name: string; icon: string; color: string; description: string;
}) {
  const units = UNITS.filter(u => u.categoryId === id);
  const wordCount = WORDS.filter(w => units.some(u => u.id === w.unitId)).length;
  return (
    <Pressable
      style={styles.categoryCard}
      onPress={() => router.push({ pathname: '/(app)/categories' })}
    >
      <View style={[styles.categoryIcon, { backgroundColor: color + '22' }]}>
        <WKText style={{ fontSize: 22 }}>{icon}</WKText>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <WKText style={styles.categoryName}>{name}</WKText>
        <WKText style={styles.categoryDesc}>{description}</WKText>
        <WKText style={styles.categoryMeta}>{wordCount} kelime · {units.length} ünite</WKText>
      </View>
      <WKText style={styles.chevron}>›</WKText>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const [query, setQuery]           = useState('');
  const [activeFilter, setFilter]   = useState('Tümü');

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return WORDS.filter(
      w =>
        w.german.toLowerCase().includes(q) ||
        w.turkish.toLowerCase().includes(q) ||
        w.example?.toLowerCase().includes(q),
    ).slice(0, 30);
  }, [query]);

  const showSearch = query.trim().length >= 2;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <WKText style={styles.title}>Keşfet</WKText>
          <WKText style={styles.subtitle}>Öğrenmek istediğin her şey burada</WKText>

          {/* Search */}
          <View style={styles.searchBar}>
            <WKText style={{ fontSize: 15, color: Colors.text.muted }}>🔍</WKText>
            <TextInput
              style={styles.searchInput}
              placeholder="Kelime ara… (Almanca veya Türkçe)"
              placeholderTextColor={Colors.text.muted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <WKText style={{ fontSize: 13, color: Colors.text.muted, padding: 4 }}>✕</WKText>
              </Pressable>
            )}
          </View>

          {/* Filter chips */}
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {FILTERS.map(f => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              >
                <WKText style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                  {f}
                </WKText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Search results */}
        {showSearch ? (
          <View style={styles.section}>
            <WKText style={styles.sectionTitle}>
              {searchResults.length > 0 ? `${searchResults.length} sonuç` : 'Sonuç bulunamadı'}
            </WKText>
            {searchResults.map(w => (
              <WordRow key={w.id} german={w.german} turkish={w.turkish} level={w.level} unitId={w.unitId} />
            ))}
          </View>
        ) : (
          <>
            {/* Featured playlists */}
            <View style={styles.section}>
              <WKText style={styles.sectionTitle}>✨ Öne Çıkanlar</WKText>
              <ScrollView
                horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingRight: 8 }}
              >
                {PLAYLISTS.map(p => {
                  const units = UNITS.filter(u => u.categoryId === p.categoryId);
                  const firstUnit = units[0];
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() =>
                        firstUnit &&
                        router.push({ pathname: '/(app)/unit/[id]', params: { id: firstUnit.id } })
                      }
                    >
                      <LinearGradient
                        colors={p.gradient}
                        style={styles.playlistCard}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      >
                        <WKText style={{ fontSize: 26 }}>{p.emoji}</WKText>
                        <WKText style={styles.playlistTitle}>{p.title}</WKText>
                        <WKText style={styles.playlistDesc}>{p.description}</WKText>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Battle promo */}
            <Pressable
              style={styles.battlePromo}
              onPress={() => router.push('/(app)/battle/lobby')}
            >
              <LinearGradient
                colors={Colors.gradient.battle}
                style={styles.battlePromoGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <WKText style={styles.battlePromoTitle}>⚔️ WortKampf</WKText>
                  <WKText style={styles.battlePromoSub}>Canlı 1v1 savaşa katıl — ELO kazan!</WKText>
                </View>
                <WKText style={{ color: '#fff', fontSize: 26 }}>›</WKText>
              </LinearGradient>
            </Pressable>

            {/* Study groups */}
            <Pressable
              onPress={() => router.push('/(app)/study-groups')}
              style={styles.groupPromo}
            >
              <WKCard style={styles.groupCard}>
                <WKText style={{ fontSize: 26 }}>👥</WKText>
                <View style={{ flex: 1 }}>
                  <WKText style={styles.groupTitle}>Çalışma Grupları</WKText>
                  <WKText style={styles.groupSub}>Birlikte öğren, birlikte kazan</WKText>
                </View>
                <WKText style={styles.chevron}>›</WKText>
              </WKCard>
            </Pressable>

            {/* All categories */}
            <View style={styles.section}>
              <WKText style={styles.sectionTitle}>📂 Tüm Kategoriler</WKText>
              {CATEGORIES.map(c => (
                <CategoryCard key={c.id} {...c} />
              ))}
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              {[
                [WORDS.length.toLocaleString(),    'Kelime'],
                [UNITS.length.toString(),          'Ünite'],
                [CATEGORIES.length.toString(),     'Kategori'],
              ].map(([n, l]) => (
                <WKCard key={l} style={styles.statBox}>
                  <WKText style={styles.statNum}>{n}</WKText>
                  <WKText style={styles.statLbl}>{l}</WKText>
                </WKCard>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.light,
  },

  header: {
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s20,
    paddingBottom: Spacing.s8,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 28,
    color: Colors.text.primary,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.muted,
    marginTop: 2,
    marginBottom: 14,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 14,
    padding: 0,
    fontFamily: 'Inter_400Regular',
  },

  filters: { gap: 8, paddingBottom: 8, paddingRight: 4 },
  filterChip: {
    borderRadius: Radius.chip,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  filterChipActive: {
    backgroundColor: Colors.brand.violet,
    borderColor: Colors.brand.violet,
  },
  filterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.text.muted,
  },
  filterTextActive: { color: '#fff' },

  section: {
    paddingHorizontal: Spacing.s20,
    marginBottom: Spacing.s24,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.text.primary,
    marginBottom: 12,
  },

  playlistCard: {
    width: 190,
    borderRadius: Radius.card + 8,
    padding: 18,
    gap: 6,
  },
  playlistTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 14,
    color: '#fff',
  },
  playlistDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 16,
  },

  battlePromo: {
    marginHorizontal: Spacing.s20,
    borderRadius: Radius.card,
    overflow: 'hidden',
    marginBottom: Spacing.s12,
  },
  battlePromoGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  battlePromoTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: '#fff',
  },
  battlePromoSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },

  groupPromo: {
    marginHorizontal: Spacing.s20,
    marginBottom: Spacing.s20,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderColor: Colors.brand.violet + '44',
  },
  groupTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text.primary,
  },
  groupSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.muted,
    marginTop: 2,
  },

  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  categoryIcon: {
    width: 44, height: 44,
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text.primary,
  },
  categoryDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.text.muted,
  },
  categoryMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.text.muted,
    marginTop: 2,
  },
  chevron: {
    fontFamily: 'Inter_400Regular',
    fontSize: 22,
    color: Colors.text.muted,
  },

  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  wordGerman: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.word.green,
  },
  wordTurkish: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.text.muted,
  },
  levelChip: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.s20,
    gap: 10,
    marginBottom: Spacing.s8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 14,
  },
  statNum: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 22,
    color: Colors.brand.violet,
  },
  statLbl: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.text.muted,
  },
});
