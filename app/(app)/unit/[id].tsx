import { ScrollView, Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WKText, WKCard, WKChip, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { UNITS } from '@/data/units';
import { useProgressStore } from '@/store/useProgressStore';

type StudyModeKey = 'flashcard' | 'multiple-choice' | 'writing' | 'sentence' | 'synonym' | 'pronunciation';

type StudyMode = {
  key: StudyModeKey;
  label: string;
  icon: string;
  route: string;
};

const STUDY_MODES: StudyMode[] = [
  { key: 'flashcard', label: 'Flashcard', icon: '🃏', route: '/(app)/study/flashcard' },
  { key: 'multiple-choice', label: 'Çoktan Seçmeli', icon: '✅', route: '/(app)/study/multiple-choice' },
  { key: 'writing', label: 'Yazı Testi', icon: '✏️', route: '/(app)/study/writing' },
  { key: 'sentence', label: 'Cümle İçinde', icon: '📖', route: '/(app)/study/sentence' },
  { key: 'synonym', label: 'Eş Anlamlı', icon: '🔄', route: '/(app)/study/synonym' },
  { key: 'pronunciation', label: 'Sesli Alıştırma', icon: '🎙️', route: '/(app)/study/pronunciation' },
];

export default function UnitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const unitId = Number(id);
  const unit = UNITS.find((u) => u.id === unitId);
  const progress = useProgressStore((s) => s.unitProgress[unitId]);

  if (!unit) {
    return (
      <SafeAreaView style={styles.container}>
        <WKText variant="body">Ünite bulunamadı.</WKText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <WKText variant="hero" style={{ marginBottom: Spacing.s8 }}>
          {unit.title}
        </WKText>
        <WKText
          variant="body"
          color={Colors.text.secondary}
          style={{ marginBottom: Spacing.s24 }}
        >
          {unit.wordCount} kelime
        </WKText>

        <WKText variant="heading2" style={{ marginBottom: Spacing.s12 }}>
          Çalışma Modları
        </WKText>

        {STUDY_MODES.map((mode) => {
          const done = progress?.completedModes.includes(mode.key) ?? false;
          return (
            <Pressable
              key={mode.key}
              accessibilityRole="button"
              accessibilityLabel={`${mode.label} modu${done ? ', tamamlandı' : ''}`}
              onPress={() =>
                router.push({
                  pathname: mode.route,
                  params: { unitId },
                })
              }
              android_ripple={null}
              style={({ pressed }) => ({ marginBottom: Spacing.s12, opacity: pressed ? 0.82 : 1 })}
            >
              <WKCard style={[styles.modeCard, done && styles.modeDone]}>
                <WKText style={{ fontSize: 24 }}>{mode.icon}</WKText>
                <WKText variant="heading2" style={{ flex: 1 }}>
                  {mode.label}
                </WKText>
                {done ? (
                  <WKChip
                    label="✓"
                    color={Colors.status.success + '30'}
                    textColor={Colors.status.success}
                  />
                ) : (
                  <WKChip
                    label="Başla"
                    color={Colors.brand.primary + '20'}
                    textColor={Colors.brand.primary}
                  />
                )}
              </WKCard>
            </Pressable>
          );
        })}

        <WKButton
          label="Kelimeleri Gör"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/(app)/word-list/[unitId]',
              params: { unitId },
            })
          }
          style={{ marginTop: Spacing.s8, marginBottom: Spacing.s32 }}
        />
      </ScrollView>
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
  modeCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.s16 },
  modeDone: {
    borderWidth: 1,
    borderColor: Colors.status.success + '40',
  },
});
