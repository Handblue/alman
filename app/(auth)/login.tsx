import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, ChevronLeft } from '@/constants/icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { WKText } from '@/components/ui/WKText';
import { WKButton } from '@/components/ui/WKButton';
import { authService } from '@/services/authService';
import { useUserStore } from '@/store/useUserStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const initializeAuth = useUserStore((s) => s.initializeAuth);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'E-posta ve şifre alanlarını doldurun.');
      return;
    }
    setLoading(true);
    try {
      await authService.signInWithEmail(email.trim().toLowerCase(), password);
      await initializeAuth();
      router.replace('/(app)/dashboard');
    } catch (err: any) {
      const msg = err?.code === 'auth/invalid-credential'
        ? 'E-posta veya şifre hatalı.'
        : 'Giriş yapılamadı. Lütfen tekrar deneyin.';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Geri butonu */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={Colors.text.primaryDark} />
          </TouchableOpacity>

          {/* Başlık */}
          <View style={styles.header}>
            <LinearGradient
              colors={Colors.gradient.cta as [string, string]}
              style={styles.logoCircle}
            >
              <WKText style={styles.logoText}>W</WKText>
            </LinearGradient>
            <WKText variant="heading1" style={styles.title}>Tekrar hoş geldin</WKText>
            <WKText variant="bodySmall" color={Colors.text.secondary} style={styles.subtitle}>
              Hesabına giriş yap ve öğrenmeye devam et
            </WKText>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <WKText variant="bodySmall" color={Colors.text.secondary} style={styles.label}>
                E-posta
              </WKText>
              <View style={styles.inputRow}>
                <Mail size={18} color={Colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@gmail.com"
                  placeholderTextColor={Colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <WKText variant="bodySmall" color={Colors.text.secondary} style={styles.label}>
                Şifre
              </WKText>
              <View style={styles.inputRow}>
                <Lock size={18} color={Colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.text.muted}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {showPassword
                    ? <EyeOff size={18} color={Colors.text.secondary} />
                    : <Eye size={18} color={Colors.text.secondary} />
                  }
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <WKText variant="bodySmall" color={Colors.brand.primary}>
                Şifremi unuttum
              </WKText>
            </TouchableOpacity>
          </View>

          {/* Giriş butonu */}
          <WKButton
            label={loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            onPress={handleLogin}
            disabled={loading}
            style={styles.loginBtn}
          />

          {/* Kayıt ol linki */}
          <View style={styles.registerRow}>
            <WKText variant="bodySmall" color={Colors.text.secondary}>
              Hesabın yok mu?{' '}
            </WKText>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <WKText variant="bodySmall" color={Colors.brand.primary} style={styles.registerLink}>
                Kayıt ol
              </WKText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primaryDark },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.s20, paddingBottom: Spacing.s32 },
  backBtn: { marginTop: Spacing.s8, marginBottom: Spacing.s8, width: 44, height: 44, justifyContent: 'center' },
  header: { alignItems: 'center', marginTop: Spacing.s24, marginBottom: Spacing.s32, gap: Spacing.s12 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 36, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF' },
  title: { color: Colors.text.primaryDark },
  subtitle: { textAlign: 'center', lineHeight: 20 },
  form: { gap: Spacing.s16, marginBottom: Spacing.s8 },
  inputGroup: { gap: Spacing.s8 },
  label: { paddingLeft: Spacing.s4 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    paddingHorizontal: Spacing.s12,
    minHeight: 52,
    gap: Spacing.s8,
  },
  inputIcon: { flexShrink: 0 },
  input: {
    flex: 1,
    color: Colors.text.primaryDark,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    paddingVertical: 0,
  },
  inputFlex: { flex: 1 },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: Spacing.s4 },
  loginBtn: { marginTop: Spacing.s24, width: '100%' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.s20, alignItems: 'center' },
  registerLink: { fontFamily: 'Inter_600SemiBold' },
});
