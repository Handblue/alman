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
import { Mail, Lock, Eye, EyeOff, User, ChevronLeft } from '@/constants/icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { WKText } from '@/components/ui/WKText';
import { WKButton } from '@/components/ui/WKButton';
import { authService } from '@/services/authService';
import { useUserStore } from '@/store/useUserStore';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const initializeAuth = useUserStore((s) => s.initializeAuth);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'Tüm alanları doldurun.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Şifre çok kısa', 'Şifreniz en az 6 karakter olmalı.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('Şifreler uyuşmuyor', 'Şifrelerin eşleştiğinden emin ol.');
      return;
    }

    setLoading(true);
    try {
      await authService.registerWithEmail(
        email.trim().toLowerCase(),
        password,
        displayName.trim(),
      );
      await initializeAuth();
      router.replace('/(onboarding)/level-test');
    } catch (err: any) {
      const msg = err?.code === 'auth/email-already-in-use'
        ? 'Bu e-posta zaten kullanımda.'
        : err?.code === 'auth/invalid-email'
          ? 'Geçersiz e-posta adresi.'
          : 'Kayıt olunamadı. Lütfen tekrar deneyin.';
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
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={Colors.text.primaryDark} />
          </TouchableOpacity>

          <View style={styles.header}>
            <LinearGradient
              colors={Colors.gradient.cta as [string, string]}
              style={styles.logoCircle}
            >
              <WKText style={styles.logoText}>W</WKText>
            </LinearGradient>
            <WKText variant="heading1" style={styles.title}>Hesap oluştur</WKText>
            <WKText variant="bodySmall" color={Colors.text.secondary} style={styles.subtitle}>
              Almancayı savaş alanında öğrenmeye başla
            </WKText>
          </View>

          <View style={styles.form}>
            <Field
              label="Ad Soyad"
              icon={<User size={18} color={Colors.text.secondary} />}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Adın Soyadın"
              autoCapitalize="words"
            />
            <Field
              label="E-posta"
              icon={<Mail size={18} color={Colors.text.secondary} />}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Şifre"
              icon={<Lock size={18} color={Colors.text.secondary} />}
              value={password}
              onChangeText={setPassword}
              placeholder="En az 6 karakter"
              secureTextEntry={!showPassword}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  {showPassword
                    ? <EyeOff size={18} color={Colors.text.secondary} />
                    : <Eye size={18} color={Colors.text.secondary} />}
                </TouchableOpacity>
              }
            />
            <Field
              label="Şifre Tekrar"
              icon={<Lock size={18} color={Colors.text.secondary} />}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="Şifreni tekrar gir"
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>

          <WKButton
            label={loading ? 'Kayıt olunuyor...' : 'Kayıt Ol'}
            onPress={handleRegister}
            disabled={loading}
            style={styles.registerBtn}
          />

          <View style={styles.loginRow}>
            <WKText variant="bodySmall" color={Colors.text.secondary}>
              Zaten hesabın var mı?{' '}
            </WKText>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <WKText variant="bodySmall" color={Colors.brand.primary} style={styles.loginLink}>
                Giriş yap
              </WKText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Küçük yardımcı bileşen ───────────────────────────────────────────────
interface FieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  returnKeyType?: TextInput['props']['returnKeyType'];
  onSubmitEditing?: () => void;
  rightElement?: React.ReactNode;
}

function Field({
  label, icon, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize, returnKeyType, onSubmitEditing, rightElement,
}: FieldProps) {
  return (
    <View style={styles.inputGroup}>
      <WKText variant="bodySmall" color={Colors.text.secondary} style={styles.inputLabel}>
        {label}
      </WKText>
      <View style={styles.inputRow}>
        {icon}
        <TextInput
          style={[styles.input, styles.inputFlex]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
        {rightElement}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primaryDark },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.s20, paddingBottom: Spacing.s32 },
  backBtn: { marginTop: Spacing.s8, marginBottom: Spacing.s8, width: 44, height: 44, justifyContent: 'center' },
  header: { alignItems: 'center', marginTop: Spacing.s16, marginBottom: Spacing.s28 ?? Spacing.s24, gap: Spacing.s12 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 36, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF' },
  title: { color: Colors.text.primaryDark },
  subtitle: { textAlign: 'center', lineHeight: 20 },
  form: { gap: Spacing.s14 ?? Spacing.s12 },
  inputGroup: { gap: Spacing.s8 },
  inputLabel: { paddingLeft: Spacing.s4 },
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
  input: { color: Colors.text.primaryDark, fontFamily: 'Inter_400Regular', fontSize: 15, paddingVertical: 0 },
  inputFlex: { flex: 1 },
  registerBtn: { marginTop: Spacing.s24, width: '100%' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.s20, alignItems: 'center' },
  loginLink: { fontFamily: 'Inter_600SemiBold' },
});
