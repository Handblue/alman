import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, ChevronLeft, CheckCircle2 } from '@/constants/icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { WKText } from '@/components/ui/WKText';
import { WKButton } from '@/components/ui/WKButton';
import { authService } from '@/services/authService';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('E-posta gerekli', 'E-posta adresini gir.');
      return;
    }
    setLoading(true);
    try {
      await authService.sendPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girildiğinden emin ol.');
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
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={Colors.text.primaryDark} />
          </TouchableOpacity>

          {sent ? (
            <View style={styles.successContainer}>
              <CheckCircle2 size={64} color={Colors.status.success} />
              <WKText variant="heading1" style={styles.successTitle}>Mail gönderildi!</WKText>
              <WKText variant="body" color={Colors.text.secondary} style={styles.successDesc}>
                {email} adresine şifre sıfırlama bağlantısı gönderildi. Gelen kutunu kontrol et.
              </WKText>
              <WKButton
                label="Giriş ekranına dön"
                variant="secondary"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.backToLoginBtn}
              />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <WKText variant="heading1" style={styles.title}>Şifreni sıfırla</WKText>
                <WKText variant="body" color={Colors.text.secondary} style={styles.desc}>
                  E-posta adresini gir, sana sıfırlama bağlantısı gönderelim.
                </WKText>
              </View>

              <View style={styles.inputGroup}>
                <WKText variant="bodySm" color={Colors.text.secondary} style={styles.label}>
                  E-posta
                </WKText>
                <View style={styles.inputRow}>
                  <Mail size={18} color={Colors.text.secondary} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="ornek@gmail.com"
                    placeholderTextColor={Colors.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSend}
                  />
                </View>
              </View>

              <WKButton
                label={loading ? 'Gönderiliyor...' : 'Sıfırlama Maili Gönder'}
                onPress={handleSend}
                disabled={loading}
                style={styles.sendBtn}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primaryDark },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: Spacing.s20 },
  backBtn: { marginTop: Spacing.s8, marginBottom: Spacing.s8, width: 44, height: 44, justifyContent: 'center' },
  header: { marginTop: Spacing.s32, marginBottom: Spacing.s32, gap: Spacing.s12 },
  title: { color: Colors.text.primaryDark },
  desc: { lineHeight: 22 },
  inputGroup: { gap: Spacing.s8, marginBottom: Spacing.s8 },
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
  input: { flex: 1, color: Colors.text.primaryDark, fontFamily: 'Inter_400Regular', fontSize: 15, paddingVertical: 0 },
  sendBtn: { marginTop: Spacing.s24, width: '100%' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.s16, paddingHorizontal: Spacing.s20 },
  successTitle: { color: Colors.text.primaryDark },
  successDesc: { textAlign: 'center', lineHeight: 22 },
  backToLoginBtn: { marginTop: Spacing.s8, width: '100%' },
});
