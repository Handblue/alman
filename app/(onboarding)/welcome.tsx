import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { WKText, WKButton } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Logo alanı */}
      <View style={styles.hero}>
        <LinearGradient
          colors={Colors.gradient.cta as [string, string]}
          style={styles.logoCircle}
        >
          <WKText style={styles.logoLetter}>W</WKText>
        </LinearGradient>
        <WKText variant="hero" style={styles.appName}>WortKrieg</WKText>
        <WKText variant="heading2" color={Colors.text.secondary} style={styles.tagline}>
          Almancayı savaş alanında öğren
        </WKText>
        <WKText variant="body" color={Colors.text.tertiary} style={styles.description}>
          Günlük meydan okumalar, battle modu ve yapay zeka destekli telaffuz ile Almancanda rakip tanıma.
        </WKText>
      </View>

      {/* Aksiyonlar */}
      <View style={styles.actions}>
        <WKButton
          label="Başla — Hesap Oluştur"
          onPress={() => router.push('/(auth)/register')}
          style={styles.btn}
        />
        <WKButton
          label="Zaten hesabım var — Giriş Yap"
          variant="secondary"
          onPress={() => router.push('/(auth)/login')}
          style={styles.btn}
        />
        <WKButton
          label="Şimdilik atla"
          variant="ghost"
          onPress={() => router.push('/(onboarding)/level-test')}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primaryDark,
    paddingHorizontal: Spacing.s20,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.s16,
    paddingHorizontal: Spacing.s8,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.s8,
  },
  logoLetter: {
    fontSize: 48,
    fontFamily: 'Inter_800ExtraBold',
    color: '#FFFFFF',
  },
  appName: {
    color: Colors.text.primaryDark,
    letterSpacing: -1,
  },
  tagline: {
    textAlign: 'center',
    color: Colors.text.secondary,
  },
  description: {
    textAlign: 'center',
    color: Colors.text.tertiary,
    lineHeight: 22,
    paddingHorizontal: Spacing.s8,
  },
  actions: {
    paddingBottom: Spacing.s32,
    gap: Spacing.s12,
  },
  btn: { width: '100%' },
});
