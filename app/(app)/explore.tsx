import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { CATEGORIES } from '@/data/categories';
import { UNITS } from '@/data/units';
import { WORDS } from '@/data/words';

// ─── Featured Playlists (curated) ─────────────────────────────────────────────
const PLAYLISTS = [
  {
    id: 'goethe-b1',
    title: 'Goethe B1 Paketi',
    description: 'Sınava 30 gün kaldı? Bu paket zorunlu.',
    emoji: '🎓',
    gradient: Colors.gradient.leaderboard as any,
    categoryId: 3,
  },
  {
    id: 'daily-life',
    title: 'Günlük Almanca',
    description: 'Market, doktor, ulaşım — hemen kullan.',
    emoji: '🏪',
    gradient: Colors.gradient.cta as any,
    categoryId: 5,
  },
  {
    id: 'idioms',
    title: 'Deyimler Kitaplığı',
    description: 'Almanlar gibi konuş — Redewendungen.',
    emoji: '💬',
    gradient: Colors.gradient.exploreHero as any,
    categoryId: 8,
  },
  {
    id: 'grammar-master',
    title: 'Gramer Ustası',
    description: 'A1\'den C1\'e bağlaçlar ve yapılar.',
    emoji: '📚',
    gradient: Colors.gradient.battle as any,
    categoryId: 2,
  },
];

// ─── Word Search result row ────────────────────────────────────────────────────
function WordRow({ german, turkish, level, unitId }: {
  german: string; turkish: string; level: string; unitId: number;
}) {
  return (
    <Pressable
      style={styles.wordRow}
      onPress={() => router.push({ pathname: '/(app)/unit/[id]', params: { id: unitId } })}
    >
      <View style={styles.wordRowLeft}>
        <WKText style={styles.wordGerman}>{german}</WKText>
        <WKText style={styles.wordTurkish}>{turkish}</WKText>
      </View>
      <View style={[styles.levelChip, { borderColor: getLevelColor(level) }]}>
        <WKText style={[styles.levelText, { color: getLevelColor(level) }]}>{level}</WKText>
      </View>
    </Pressable>
  );
}

function getLevelColor(level: string): string {
  const map: Record<string, string> = {
    A1: Colors.status.success,
    A2: Colors.word.green,
    B1: Colors.brand.primary,
    B2: Colors.battle.purple,
    C1: Colors.accent.orange,
  };
  return map[level] ?? Colors.text.secondary;
}

// ─── Category card ─────────────────────────────────────────────────────────────
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
        <WKText style={styles.categoryEmoji}>{icon}</WKText>
      </View>
      <View style={styles.categoryInfo}>
        <WKText style={styles.categoryName}>{name}</WKText>
        <WKText style={styles.categoryDesc}>{description}</WKText>
        <WKText style={styles.categoryMeta}>{wordCount} kelime • {units.length} ünite</WKText>
      </View>
      <WKText style={styles.categoryArrow}>›</WKText>
    </Pressable>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const [query, setQuery] = useState('');

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
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <WKText style={styles.searchIcon}>🔍</WKText>
          <TextInput
            style={styles.searchInput}
            placeholder="Kelime ara… (Almanca veya Türkçe)"
            placeholderTextColor={Colors.text.secondary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <WKText style={styles.clearBtn}>✕</WKText>
            </Pressable>
          )}
        </View>

        {/* Search results */}
        {showSearch ? (
          <View style={styles.section}>
            <WKText style={styles.sectionTitle}>
              {searchResults.length > 0
                ? `${searchResults.length} sonuç`
                : 'Sonuç bulunamadı'}
            </WKText>
            {searchResults.map(w => (
              <WordRow
                key={w.id}
                german={w.german}
                turkish={w.turkish}
                level={w.level}
                unitId={w.unitId}
              />
            ))}
          </View>
        ) : (
          <>
            {/* Featured playlists */}
            <View style={styles.section}>
              <WKText style={styles.sectionTitle}>✨ Öne Çıkanlar</WKText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.playlistScroll}
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
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <WKText style={styles.playlistEmoji}>{p.emoji}</WKText>
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
                colors={Colors.gradient.battle as any}
                style={styles.battlePromoGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.battlePromoLeft}>
                  <WKText style={styles.battlePromoTitle}>⚔️ WortKampf</WKText>
                  <WKText style={styles.battlePromoSub}>Canlı 1v1 savaşa katıl — ELO kazan!</WKText>
                </View>
                <WKText style={styles.battlePromoArrow}>›</WKText>
              </LinearGradient>
            </Pressable>

            {/* Study Groups promo */}
            <Pressable
              style={styles.groupPromo}
              onPress={() => router.push('/(app)/study-groups')}
            >
              <WKText style={styles.groupPromoEmoji}>👥</WKText>
              <View style={styles.groupPromoInfo}>
                <WKText style={styles.groupPromoTitle}>Çalışma Grupları</WKText>
                <WKText style={styles.groupPromoSub}>Birlikte öğren, birlikte kazan</WKText>
              </View>
              <WKText style={styles.categoryArrow}>›</WKText>
            </Pressable>

            {/* All categories */}
            <View style={styles.section}>
              <WKText style={styles.sectionTitle}>📂 Tüm Kategoriler</WKText>
              {CATEGORIES.map(c => (
                <CategoryCard key={c.id} {...c} />
              ))}
            </View>

            {/* Quick stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <WKText style={styles.statNum}>{WORDS.length}</WKText>
                <WKText style={styles.statLbl}>Kelime</WKText>
              </View>
              <View style={styles.statBox}>
                <WKText style={styles.statNum}>{UNITS.length}</WKText>
                <WKText style={styles.statLbl}>Ünite</WKText>
              </View>
              <View style={styles.statBox}>
                <WKText style={styles.statNum}>{CATEGORIES.length}</WKText>
                <WKText style={styles.statLbl}>Kategori</WKText>
              </View>
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
    backgroundColor: Colors.bg.primaryDark,
  },
  header: {
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s16,
    paddingBottom: Spacing.s8,
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 14,
    marginHorizontal: Spacing.s20,
    marginVertical: Spacing.s12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.bg.cardDark,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    padding: 0,
  },
  clearBtn: {
    color: Colors.text.secondary,
    fontSize: 14,
    padding: 4,
  },
  section: {
    paddingHorizontal: Spacing.s20,
    marginBottom: Spacing.s24,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 12,
  },
  playlistScroll: {
    gap: 12,
    paddingRight: 8,
  },
  playlistCard: {
    width: 200,
    borderRadius: 18,
    padding: 18,
    gap: 6,
  },
  playlistEmoji: {
    fontSize: 28,
  },
  playlistTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  playlistDesc: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    lineHeight: 16,
  },
  battlePromo: {
    marginHorizontal: Spacing.s20,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: Spacing.s12,
  },
  battlePromoGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  battlePromoLeft: {
    flex: 1,
    gap: 4,
  },
  battlePromoTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },
  battlePromoSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
  },
  battlePromoArrow: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
  groupPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 16,
    marginHorizontal: Spacing.s20,
    marginBottom: Spacing.s20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.brand.primary + '44',
  },
  groupPromoEmoji: {
    fontSize: 28,
  },
  groupPromoInfo: {
    flex: 1,
  },
  groupPromoTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  groupPromoSub: {
    color: Colors.text.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
  },
  categoryName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  categoryDesc: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  categoryMeta: {
    color: Colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  categoryArrow: {
    color: Colors.text.secondary,
    fontSize: 22,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  wordRowLeft: {
    flex: 1,
    gap: 2,
  },
  wordGerman: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  wordTurkish: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
  levelChip: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.s20,
    gap: 12,
    marginBottom: Spacing.s8,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    color: Colors.accent.gold,
    fontSize: 22,
    fontWeight: '900',
  },
  statLbl: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
});
