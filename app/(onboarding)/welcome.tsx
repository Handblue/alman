import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useUserStore } from '@/store/useUserStore';

export default function WelcomeScreen() {
  const setOnboarded = useUserStore((s) => s.setOnboarded);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <WKText variant="hero" style={styles.logo}>WortKrieg</WKText>
        <WKText variant="heading2" color={Colors.text.secondary} style={styles.tagline}>
          Almancayı savaş alanında öğren
        </WKText>
      </View>

      <View style={styles.actions}>
        <WKButton
          label="Başla"
          onPress={() => router.push('/(onboarding)/level-test')}
          style={styles.btn}
        />
        <WKButton
          label="Zaten hesabım var"
          variant="ghost"
          onPress={() => {
            setOnboarded(true);
            router.replace('/(app)/dashboard');
          }}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primaryDark, paddingHorizontal: Spacing.s20 },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.s16 },
  logo: { color: Colors.text.primaryDark, letterSpacing: -1 },
  tagline: { textAlign: 'center' },
  actions: { paddingBottom: Spacing.s32, gap: Spacing.s12 },
  btn: { width: '100%' },
});
