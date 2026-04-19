import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { WKText } from '@/components/ui';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { createStorage } from '@/utils/storage';

const storage = createStorage('premium');

// ─── Feature list ─────────────────────────────────────────────────────────────

const FREE_FEATURES = [
  '✅ Sınırsız flashcard',
  '✅ Günlük challenge (5 soru)',
  '✅ Battle modu (5 soru)',
  '✅ Arkadaşlar ve çalışma grupları',
  '✅ Temel analitik',
  '✅ Offline kelime listesi',
];

const PREMIUM_FEATURES = [
  { emoji: '🎙️', title: 'Sesli Telaffuz Puanlama', desc: 'Mikrofona konuş, AI puanlasın' },
  { emoji: '🤖', title: 'AI Öğrenme Yolu', desc: 'Sana özel kişiselleştirilmiş müfredat' },
  { emoji: '⚔️', title: 'Sınırsız Battle', desc: 'ELO limiti yok, istediğin kadar oyna' },
  { emoji: '📊', title: 'Gelişmiş Analitik', desc: 'Detaylı kelime tahminleri ve grafik' },
  { emoji: '📥', title: 'Tam Offline', desc: 'Tüm içerik internet olmadan', },
  { emoji: '🎨', title: 'Özel Temalar', desc: 'Uygulama görünümünü kişiselleştir' },
  { emoji: '🔔', title: 'Akıllı Bildirimler', desc: 'En iyi öğrenme saatinde hatırlat' },
  { emoji: '👑', title: 'Premium Rozet', desc: 'Profilinde özel Premium rozeti' },
];

const PLANS = [
  {
    id: 'monthly',
    label: 'Aylık',
    price: '₺79,99',
    period: '/ay',
    badge: null,
    highlight: false,
  },
  {
    id: 'yearly',
    label: 'Yıllık',
    price: '₺499,99',
    period: '/yıl',
    badge: '🔥 %48 İndirim',
    highlight: true,
    pricePerMonth: '₺41,67/ay',
  },
  {
    id: 'lifetime',
    label: 'Ömür Boyu',
    price: '₺1.299,99',
    period: ' tek seferlik',
    badge: '💎 En İyi Değer',
    highlight: false,
  },
];

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function PremiumScreen() {
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [purchasing, setPurchasing] = useState(false);
  const isPremium = storage.getBoolean('isPremium') ?? false;

  const handlePurchase = async () => {
    if (purchasing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(true);

    // TODO: Gerçek IAP — expo-in-app-purchases veya RevenueCat
    // Şimdilik mock: 1.5s gecikme sonra premium aktif
    await new Promise(r => setTimeout(r, 1500));
    storage.set('isPremium', true);
    setPurchasing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // TODO: expo-in-app-purchases restore
  };

  if (isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.alreadyPremium}>
          <WKText style={styles.premiumEmoji}>👑</WKText>
          <WKText style={styles.premiumTitle}>Premium Aktif!</WKText>
          <WKText style={styles.premiumSub}>Tüm özellikler kullanımında. Teşekkürler!</WKText>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <WKText style={styles.backBtnText}>Geri Dön</WKText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Close */}
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <WKText style={styles.closeBtnText}>✕</WKText>
        </Pressable>

        {/* Hero */}
        <LinearGradient
          colors={Colors.gradient.premium as any}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <WKText style={styles.heroEmoji}>👑</WKText>
          <WKText style={styles.heroTitle}>WortKrieg Premium</WKText>
          <WKText style={styles.heroSub}>Öğrenmenin tüm gücünü aç</WKText>
        </LinearGradient>

        {/* Premium features */}
        <View style={styles.section}>
          <WKText style={styles.sectionTitle}>Premium ile Neler Kazanırsın?</WKText>
          {PREMIUM_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <WKText style={styles.featureEmoji}>{f.emoji}</WKText>
              <View style={styles.featureInfo}>
                <WKText style={styles.featureTitle}>{f.title}</WKText>
                <WKText style={styles.featureDesc}>{f.desc}</WKText>
              </View>
            </View>
          ))}
        </View>

        {/* Free vs Premium compare */}
        <View style={styles.section}>
          <WKText style={styles.sectionTitle}>Ücretsiz Plan</WKText>
          {FREE_FEATURES.map((f, i) => (
            <WKText key={i} style={styles.freeFeature}>{f}</WKText>
          ))}
        </View>

        {/* Plans */}
        <View style={styles.section}>
          <WKText style={styles.sectionTitle}>Plan Seç</WKText>
          {PLANS.map((plan) => (
            <Pressable
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.highlight && styles.planCardHighlight,
              ]}
              onPress={() => {
                setSelectedPlan(plan.id);
                Haptics.selectionAsync();
              }}
            >
              {plan.badge && (
                <View style={styles.planBadge}>
                  <WKText style={styles.planBadgeText}>{plan.badge}</WKText>
                </View>
              )}
              <View style={styles.planLeft}>
                <WKText style={[styles.planLabel, plan.highlight && styles.planLabelHighlight]}>
                  {plan.label}
                </WKText>
                {'pricePerMonth' in plan && plan.pricePerMonth && (
                  <WKText style={styles.planPerMonth}>{plan.pricePerMonth}</WKText>
                )}
              </View>
              <View style={styles.planRight}>
                <WKText style={[styles.planPrice, plan.highlight && styles.planPriceHighlight]}>
                  {plan.price}
                </WKText>
                <WKText style={styles.planPeriod}>{plan.period}</WKText>
              </View>
              {selectedPlan === plan.id && (
                <View style={styles.selectedDot} />
              )}
            </Pressable>
          ))}
        </View>

        {/* CTA */}
        <Pressable
          style={[styles.ctaBtn, purchasing && styles.ctaBtnLoading]}
          onPress={handlePurchase}
          disabled={purchasing}
        >
          <LinearGradient
            colors={Colors.gradient.premium as any}
            style={styles.ctaGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <WKText style={styles.ctaText}>
              {purchasing ? '⏳ İşleniyor…' : '👑 Premium\'a Geç'}
            </WKText>
          </LinearGradient>
        </Pressable>

        {/* Restore + legal */}
        <Pressable onPress={handleRestore} style={styles.restoreBtn}>
          <WKText style={styles.restoreText}>Satın alımları geri yükle</WKText>
        </Pressable>

        <WKText style={styles.legal}>
          Abonelik otomatik yenilenir. İstediğin zaman iptal edebilirsin.
          Fiyatlar Türkiye fiyatlandırmasına göredir.
        </WKText>

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
  scroll: {
    paddingBottom: 48,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  closeBtnText: {
    color: Colors.text.secondary,
    fontSize: 18,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  heroEmoji: {
    fontSize: 56,
  },
  heroTitle: {
    color: Colors.bg.primaryDark,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroSub: {
    color: Colors.bg.primaryDark + 'cc',
    fontSize: 15,
  },
  section: {
    paddingHorizontal: Spacing.s20,
    paddingTop: Spacing.s24,
    gap: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  featureEmoji: {
    fontSize: 26,
    width: 32,
    textAlign: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  featureDesc: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  freeFeature: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.cardDark,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  planCardSelected: {
    borderColor: Colors.accent.gold,
  },
  planCardHighlight: {
    borderColor: Colors.accent.gold + '66',
    backgroundColor: Colors.accent.gold + '11',
  },
  planBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.accent.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  planBadgeText: {
    color: Colors.bg.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  planLeft: {
    flex: 1,
    gap: 2,
  },
  planLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  planLabelHighlight: {
    color: Colors.accent.gold,
  },
  planPerMonth: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  planRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  planPrice: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  planPriceHighlight: {
    color: Colors.accent.gold,
  },
  planPeriod: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  selectedDot: {
    position: 'absolute',
    left: 10,
    top: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent.gold,
    marginTop: -4,
  },
  ctaBtn: {
    marginHorizontal: Spacing.s20,
    marginTop: Spacing.s24,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: Colors.accent.gold,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  ctaBtnLoading: {
    opacity: 0.7,
  },
  ctaGrad: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: {
    color: Colors.bg.primaryDark,
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  restoreBtn: {
    alignItems: 'center',
    marginTop: Spacing.s16,
    padding: 8,
  },
  restoreText: {
    color: Colors.text.secondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  legal: {
    color: Colors.text.secondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.s12,
    paddingHorizontal: Spacing.s24,
    lineHeight: 16,
  },
  alreadyPremium: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  premiumEmoji: {
    fontSize: 72,
  },
  premiumTitle: {
    color: Colors.accent.gold,
    fontSize: 28,
    fontWeight: '900',
  },
  premiumSub: {
    color: Colors.text.secondary,
    fontSize: 15,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 24,
    backgroundColor: Colors.bg.cardDark,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
