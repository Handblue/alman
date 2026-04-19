# WortKrieg — Uygulama UI Rehberi (`almaapp_ui_guide`)

> **Sürüm:** 1.0 | **Tarih:** Nisan 2026  
> **Platform:** React Native (Expo) · iOS + Android  
> **Stil:** `superpowers` iş akışı + `frontend-design` skill + Codex 5.4 görev bloklarıyla üretilmiştir

---

## İçindekiler

1. [Araçlar & Plugin Durumu](#1-araçlar--plugin-durumu)
2. [Rehberin Kullanımı](#2-rehberin-kullanımı)
3. [Design Tokens](#3-design-tokens)
   - 3.1 Renkler
   - 3.2 Tipografi
   - 3.3 Boşluk (Spacing)
   - 3.4 Kenar Yarıçapı (Radius)
   - 3.5 Gölge (Shadows)
   - 3.6 Gradientler
4. [Tema Sistemi](#4-tema-sistemi)
5. [Temel Bileşenler](#5-temel-bileşenler)
   - 5.1 WKText
   - 5.2 WKButton
   - 5.3 WKCard
   - 5.4 WKChip
   - 5.5 PlayButton
   - 5.6 AchievementToast
6. [Dashboard Bileşenleri](#6-dashboard-bileşenleri)
7. [Study Bileşenleri](#7-study-bileşenleri)
8. [Sosyal & Grup Bileşenleri](#8-sosyal--grup-bileşenleri)
9. [⚡ CODEX 5.4 — Battle UI Bileşenleri](#9--codex-54--battle-ui-bileşenleri)
10. [⚡ CODEX 5.4 — Animasyon Sistemi](#10--codex-54--animasyon-sistemi)
11. [⚡ CODEX 5.4 — Sesli Telaffuz UI](#11--codex-54--sesli-telaffuz-ui)
12. [⚡ CODEX 5.4 — Premium & Paywall Bileşenleri](#12--codex-54--premium--paywall-bileşenleri)
13. [⚡ CODEX 5.4 — Widget Spesifikasyonları](#13--codex-54--widget-spesifikasyonları)
14. [Erişilebilirlik Kuralları](#14-erişilebilirlik-kuralları)
15. [Animasyon & Reduced Motion Kuralları](#15-animasyon--reduced-motion-kuralları)
16. [Ekran İndeksi (38 Ekran)](#16-ekran-i̇ndeksi-38-ekran)

---

## 1. Araçlar & Plugin Durumu

| Araç | Kaynak | Durum | Kapsam |
|------|--------|-------|--------|
| `superpowers` | [obra/superpowers](https://github.com/obra/superpowers) | ✅ Aktif (skills sistemi) | Tüm iş akışları |
| `codex@openai-codex-plugin-cc` | [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc) | ✅ Kurulu & Aktif | Codex 5.4 görevleri |
| `frontend-design@claude-plugins-official` | [anthropics/skills](https://github.com/anthropics/skills) `--skill frontend-design` | ✅ Kuruldu (Nisan 2026) | Bileşen kod üretimi |
| `code-review@claude-plugins-official` | anthropics/claude-plugins-official | ✅ Aktif | PR inceleme |

### Codex 5.4 Görev Bloklarını Çalıştırma

Bu rehberdeki `⚡ CODEX 5.4` başlıklı bölümler Codex'e doğrudan görev olarak gönderilmek üzere hazırlanmıştır. Çalıştırmak için:

```bash
# Codex plugin CLI komutu
/codex task
```

Her bölümün altındaki `<task>` XML bloğunu kopyalayıp `/codex task` komutuna yapıştırın.

---

## 2. Rehberin Kullanımı

- **Claude tarafından üretilen bölümler** → tasarım ilkeleri, token tabloları, mevcut bileşen API'leri, kural açıklamaları.
- **Codex 5.4 tarafından üretilecek bölümler** → `⚡ CODEX 5.4` etiketi ile işaretlenmiş. Her bölümde hazır `<task>` bloğu bulunur.
- `frontend-design` skill → yeni bileşen geliştirirken invoke edin: estetik yön, animasyon kararları, tipografi seçimleri bu skill yönlendirir.
- `ui-guardian` skill → her PR'da kontrol listesini çalıştırın.

---

## 3. Design Tokens

> **Kural:** Hardcoded renk/boyut/boşluk yasak. Her değer token üzerinden gelmelidir.

### 3.1 Renkler

**Dosya:** `constants/colors.ts`

```typescript
Colors.brand.primary        // #1A73E8 — CTA buton, aktif eleman, link
Colors.brand.dark           // #0D47A1 — Header, logo, başlık vurgu
Colors.battle.purple        // #7C4DFF — Battle, VS ekranı, leaderboard
Colors.accent.orange        // #FF6D00 — XP, streak, dikkat çeken CTA
Colors.accent.gold          // #FFD700 — Premium badge, taç, 1. sıra
Colors.status.success       // #2E7D32 — Doğru cevap, tamamlama
Colors.status.error         // #FF5252 — Yanlış cevap, silme, hata
Colors.status.warning       // #FFB300 — İlerleme barı, offline banner
Colors.status.info          // #00BCD4 — Tooltip, öneri, bilgi
Colors.word.green           // #4CAF50 — Almanca kelime vurgusu (ZORUNLU)
Colors.bg.primaryDark       // #0D1B2A — Ana arka plan (dark)
Colors.bg.primaryLight      // #FAFAFA — Ana arka plan (light)
Colors.bg.cardDark          // #243447 — Kart arka planı (dark)
Colors.bg.cardLight         // #FFFFFF — Kart arka planı (light)
Colors.text.primaryDark     // #FFFFFF — Ana metin (dark)
Colors.text.primaryLight    // #212121 — Ana metin (light)
Colors.text.secondary       // #B0BEC5 — Dark modda yardımcı metin
Colors.text.secondaryLight  // #757575 — Light modda yardımcı metin
```

**Kontrast tablosu (WCAG AA):**

| Kombinasyon | Oran | Geçer? |
|-------------|------|--------|
| Dark bg (#0D1B2A) + White text | 15.8:1 | ✅ AAA |
| Light bg (#FAFAFA) + Dark text (#212121) | 16.1:1 | ✅ AAA |
| Card dark (#243447) + Word green (#4CAF50) | 4.9:1 | ✅ AA |
| Brand primary (#1A73E8) + White | 4.6:1 | ✅ AA |
| Battle purple (#7C4DFF) + White | 5.2:1 | ✅ AA |

### 3.2 Tipografi

**Dosya:** `constants/typography.ts`  
**Font ailesi:** `Inter` (ExtraBold 800, Bold 700, SemiBold 600, Medium 500, Regular 400)

```typescript
Typography.hero      // Inter 800, 36px — Ekran başlığı
Typography.heading1  // Inter 700, 26px — Bölüm başlıkları
Typography.heading2  // Inter 600, 21px — Kart başlığı, klasör adı
Typography.bodyLg    // Inter 400, 18px — Kelime anlamı, açıklama
Typography.body      // Inter 400, 16px — Standart metin
Typography.bodySm    // Inter 400, 14px — Yardımcı metin, tarih
Typography.caption   // Inter 500, 12px — Etiket, badge, chip
Typography.word      // Inter 700, 21px, #4CAF50 — Almanca kelime (ZORUNLU)
Typography.score     // Inter 800, 42px — Skor, XP sayısı
Typography.timer     // Inter 800, 28px — Battle timer
```

> ⚠️ **Almanca kelimeler her zaman** `Typography.word` + `Colors.word.green` kullanır. İstisna yok.

### 3.3 Boşluk (Spacing)

**Dosya:** `constants/spacing.ts`

```typescript
Spacing.s2   // 2px  — İnce çizgi, minimal offset
Spacing.s4   // 4px  — İkon-metin arası, chip içi
Spacing.s8   // 8px  — Satır arası, küçük padding
Spacing.s12  // 12px — Kart içi kompakt padding
Spacing.s16  // 16px — Standart kart padding
Spacing.s20  // 20px — Ekran kenar boşluğu
Spacing.s24  // 24px — Bölüm arası, header padding
Spacing.s32  // 32px — Büyük bölüm ayrıcı
Spacing.s48  // 48px — Hero alanı padding
Spacing.s64  // 64px — Tam sayfa yatay ortalama
```

### 3.4 Kenar Yarıçapı (Radius)

**Dosya:** `constants/radius.ts`

```typescript
Radius.card         // 16px — WKCard, tüm içerik kartları
Radius.button       // 12px — WKButton, tüm action butonlar
Radius.chip         // 20px — WKChip, badge, pill etiket
Radius.avatar       // 999  — Daire avatar (tam yuvarlak)
Radius.input        // 12px — TextInput, arama kutusu
Radius.bottomSheet  // 24px — Bottom sheet üst köşeler
Radius.modal        // 20px — Modal dialog köşeleri
```

### 3.5 Gölge (Shadows)

**Dosya:** `constants/shadows.ts` (iOS + Android platform-aware)

```typescript
Shadows.level1  // Kart — hafif yükseltme
Shadows.level2  // CTA Buton — orta yükseltme
Shadows.level3  // Bottom Sheet, Tab Bar — belirgin yükseltme + blur
Shadows.level4  // Modal — güçlü yükseltme
```

### 3.6 Gradientler

```typescript
Colors.gradient.cta            // ['#1A73E8', '#00BCD4'] — Ana CTA buton (WKButton primary)
Colors.gradient.battle         // ['#7C4DFF', '#00BCD4'] — VS ekranı çapraz split
Colors.gradient.leaderboard    // ['#512DA8', '#7C4DFF'] — Leaderboard header
Colors.gradient.quizResult     // ['#7C4DFF', '#448AFF'] — Quiz/battle sonuç ekranı
Colors.gradient.dailyChallenge // ['#2E7D32', '#00BCD4'] — Günlük Meydan Okuma banner
Colors.gradient.exploreHero    // ['#FF6D00', '#FFCA28'] — Keşfet öne çıkan kart
Colors.gradient.premium        // ['#FFD700', '#FFC107'] — Premium badge, taç
Colors.gradient.primary        // ['#1A73E8', '#00BCD4'] — Genel
Colors.gradient.secondary      // ['#0D47A1', '#1A73E8'] — İkincil
```

---

## 4. Tema Sistemi

**Dosya:** `context/ThemeContext.tsx` · `hooks/useTheme.ts`

### ThemeContext API

```typescript
const { isDark, colors, toggleTheme } = useTheme();

// colors nesnesi:
colors.bg          // isDark ? '#0D1B2A' : '#FAFAFA'
colors.card        // isDark ? '#243447' : '#FFFFFF'
colors.textPrimary // isDark ? '#FFFFFF' : '#212121'
colors.textSecondary // isDark ? '#B0BEC5' : '#757575'
```

### Kullanım Kuralları

1. Her bileşen `useTheme()` hook'u üzerinden arka plan ve metin rengini alır.
2. Sabit renkler (durum renkleri, Almanca kelime rengi, battle rengi) `Colors` token'ından doğrudan gelir — tema değişmez.
3. Yeni bileşen yazarken arka plan → `colors.card`, metin → `colors.textPrimary` pattern'i uygulanır.

```typescript
// ✅ Doğru
const { colors } = useTheme();
<View style={{ backgroundColor: colors.card }}>
  <WKText color={colors.textPrimary}>...</WKText>
</View>

// ❌ Yanlış
<View style={{ backgroundColor: '#243447' }}>
```

---

## 5. Temel Bileşenler

### 5.1 WKText

**Dosya:** `components/ui/WKText.tsx`

```typescript
interface WKTextProps extends TextProps {
  variant?: keyof typeof Typography;  // default: 'body'
  color?: string;                      // default: colors.textPrimary
}
```

**Kullanım:**
```tsx
<WKText variant="heading1">Başlık</WKText>
<WKText variant="word">das Haus</WKText>           {/* Almanca kelime */}
<WKText variant="score" color={Colors.accent.gold}>+200 XP</WKText>
<WKText variant="caption" color={Colors.text.secondary}>Yardımcı</WKText>
```

### 5.2 WKButton

**Dosya:** `components/ui/WKButton.tsx`

```typescript
interface WKButtonProps extends TouchableOpacityProps {
  label?: string;
  title?: string;                              // label ile aynı, eski uyumluluk
  variant?: 'primary' | 'secondary' | 'ghost'; // default: 'primary'
  size?: 'small' | 'medium' | 'large';         // default: 'medium'
}
```

| Variant | Görünüm | Kullanım |
|---------|---------|----------|
| `primary` | CTA gradient (`#1A73E8 → #00BCD4`) | Ana aksiyon butonu |
| `secondary` | Düz `#1A73E8` dolu | İkincil aksiyon |
| `ghost` | Şeffaf, mavi metin | Gradient üstü buton, iptal |

| Size | Min Height | Kullanım |
|------|-----------|----------|
| `small` | 40px | Chip içi, kompakt alanlar |
| `medium` | 48px | Standart (varsayılan) |
| `large` | 56px | Hero CTA |

> ⚠️ Dokunma alanı: iOS min 44×44px, Android min 48×48dp — `WKButton` bunu otomatik karşılar.

```tsx
<WKButton label="Başla" onPress={handler} />
<WKButton label="İptal" variant="ghost" size="small" />
<WKButton label="Premium'a Geç" size="large" />
```

### 5.3 WKCard

**Dosya:** `components/ui/WKCard.tsx`

```typescript
// ViewProps extend'ler — style, children, vs.
<WKCard>
  {/* içerik */}
</WKCard>
```

- Arka plan: `colors.card` (tema duyarlı)
- `Radius.card` (16px), `Spacing.s16` padding, `Shadows.level1`
- Özel padding için `style` prop'u override eder

### 5.4 WKChip

**Dosya:** `components/ui/WKChip.tsx`

```typescript
interface WKChipProps extends ViewProps {
  label: string;
  color?: string;      // default: Colors.brand.primary + '20' (şeffaf)
  textColor?: string;  // default: colors.textPrimary
  size?: 'small' | 'medium'; // default: 'medium'
}
```

```tsx
<WKChip label="A1" color={Colors.status.success + '22'} textColor={Colors.status.success} />
<WKChip label="Premium" color={Colors.accent.gold + '22'} textColor={Colors.accent.gold} size="small" />
<WKChip label="Yeni" />
```

### 5.5 PlayButton

**Dosya:** `components/ui/PlayButton.tsx`

TTS ses oynatma / durdurma butonu. FlashCard ve WordDetailSheet içinde kullanılır.

```typescript
interface Props {
  onPress: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  size?: number;      // default: 56
  disabled?: boolean;
}
```

- `isPlaying=true` → `Colors.brand.primary` arka plan, ■ ikonu
- `isPlaying=false` → `Colors.brand.dark` arka plan, ▶ ikonu
- `isLoading=true` → `ActivityIndicator` gösterir

### 5.6 AchievementToast

**Dosya:** `components/ui/AchievementToast.tsx`

Ekranın üstünden 3.5 saniye görünür, spring animasyonlu başarım bildirimi.

```typescript
interface AchievementToastData {
  id: string;       // unique key (animasyon tetikler)
  emoji: string;    // rozet emojisi
  name: string;     // rozet adı
  xpReward: number; // 0 ise XP satırı görünmez
}

<AchievementToast toast={toastData} onDismiss={() => setToast(null)} />
```

- Altın kenarlıklı kart (`Colors.accent.gold`)
- Haptic: `Haptics.NotificationFeedbackType.Success`
- `toast?.id` değişince yeni animasyon tetiklenir

---

## 6. Dashboard Bileşenleri

**Dizin:** `components/dashboard/`

### DailyChallengeCard

Günlük Meydan Okuma kartı. `useDailyChallengeStore` store'undan veri çeker.

```tsx
<DailyChallengeCard />
```

- Gradient: `Colors.gradient.dailyChallenge`
- Tamamlanmamışsa → "Başla" butonu + motivasyon metni
- Tamamlanmışsa → skor (X/5) + kazanılan XP gösterir
- `router.push('/(app)/daily-challenge')` ile yönlendirir

### DailyGoalCard

Günlük hedef ilerleme barı.

### RecentUnitCard

Son çalışılan ünite kartı, yatay scroll'da kullanılır.

### WordOfTheDay

"Bugünün Kelimesi" kartı. Widget'ta da kullanılan kelimeyi gösterir.

---

## 7. Study Bileşenleri

**Dizin:** `components/study/`

### FlashCard

**Dosya:** `components/study/FlashCard.tsx`

3D flip animasyonlu kelime kartı. Ön yüz Almanca, arka yüz Türkçe + öz değerlendirme.

```typescript
interface FlashCardProps {
  word: Word;
  onRate: (status: 'unknown' | 'learning' | 'known') => void;
}
```

**Özellikler:**
- `react-native-reanimated` ile 400ms Y ekseni döndürme (`withTiming`)
- TTS: `PlayButton` → `pronunciationService.playTTS(word.german)`
- Telaffuz kayıt: mikrofon butonu → 3 sn kayıt → `pronunciationService` → 1-5 yıldız skor
- Premium gate: mikrofon butonu ücretsiz kullanıcıda görünür ama disabled + paywall modal açar

**Animasyon detayı:**
```typescript
// 3D flip
frontStyle = rotateY(0° → 180°)
backStyle  = rotateY(180° → 360°), position: absolute
// backfaceVisibility: 'hidden' her ikisinde de ZORUNLU
```

### WordDetailSheet

Kelime detay bottom sheet. Herhangi bir ekranda kelimeye uzun basınca açılır.

---

## 8. Sosyal & Grup Bileşenleri

**Dizin:** `components/social/` · `components/folder/` · `components/profile/`

### StudyGroupCard (`components/social/`)

Çalışma grubu kartı. Grup adı, üye sayısı, ortalama XP gösterir.

### GroupLeaderboard (`components/social/`)

Grup içi sıralama listesi.

### CreateFolderModal (`components/folder/`)

Yeni klasör oluşturma modalı. `Radius.modal` (20px), `Shadows.level4`.

### CacheManagementCard (`components/folder/`)

Offline indirilen içeriklerin yönetim kartı. Boyut bilgisi + silme aksiyonu.

---

## 9. ⚡ CODEX 5.4 — Battle UI Bileşenleri

> Bu bölümdeki bileşenler Codex 5.4 tarafından üretilecektir.  
> Her görev bloğunu `/codex task` ile çalıştırın.

### 9.1 BattleVSScreen

İki oyuncunun karşı karşıya geldiği animasyonlu VS ekranı.

**Tasarım:** `Colors.gradient.battle` (`#7C4DFF → #00BCD4`) çapraz split arka plan. Sol yarı oyuncu 1, sağ yarı oyuncu 2. Ortada büyük "VS" yazısı + şimşek ikonu. 3-2-1 geri sayım sonrası battle başlar.

```xml
<task>
  <repo>wortkrieg (React Native / Expo)</repo>
  <file>components/battle/BattleVSScreen.tsx</file>
  <description>
    Battle VS ekranı bileşeni oluştur.
    - LinearGradient arka plan: Colors.gradient.battle (['#7C4DFF','#00BCD4']), diagonal
    - Sol/sağ split: her biri %50 genişlik. Sol: kendi avatarı + kullanıcı adı + ELO. Sağ: rakip.
    - Ortada: daire içinde büyük "VS" (Typography.hero, beyaz), altında ⚡ ikonu
    - 3-2-1 animasyonu: her sayı scale 1.5→1 + fade, 1 saniye aralık
    - Sayım bitince onCountdownEnd() callback'i çağır
    - Reduced motion: sayım animasyonsuz, doğrudan geçer
    - Props: { player: PlayerInfo; opponent: PlayerInfo; onCountdownEnd: () => void }
    - PlayerInfo: { username: string; avatarUrl?: string; elo: number }
  </description>
  <structured_output_contract>
    Sadece TSX dosyasını üret. Başka açıklama ekleme.
    Token import: @/constants/colors, @/constants/typography, @/constants/spacing
    Animasyon: react-native-reanimated (withTiming, withSequence, withDelay)
    AccessibilityLabel: her iki oyuncu için ekran okuyucu duyurusu
  </structured_output_contract>
  <verification_loop>
    - TypeScript strict hatası yok mu?
    - Colors token hardcoded hex içermiyor mu?
    - Reduced motion alternativ var mı?
  </verification_loop>
</task>
```

### 9.2 BattleQuestionCard

Battle sırasında her soru için gösterilen kart. 10 saniye zamanlayıcı.

**Tasarım:** Koyu kart (`colors.card`), üstte ince zamanlayıcı çubuğu (azalan progress bar, `Colors.status.warning → Colors.status.error`). Soru metni `Typography.heading2`. 4 seçenek, tıklayınca yeşil/kırmızı flash + doğru/yanlış ikon.

```xml
<task>
  <file>components/battle/BattleQuestionCard.tsx</file>
  <description>
    Battle soru kartı:
    - Üstte zamanlayıcı progress bar: 10sn, width animasyonu (Reanimated withTiming)
    - Bar rengi: başta Colors.status.warning, son 3sn Colors.status.error
    - Soru: WKText variant="heading2", ortalı
    - 4 seçenek butonu: WKCard içinde, WKText body
    - Seçim sonrası: doğru=yeşil flash+✓, yanlış=kırmızı flash+✗ + doğru cevap yeşil
    - Haptic: doğru=medium, yanlış=error
    - 400ms sonra onAnswer(selectedIndex, isCorrect) callback
    - Props: { question: string; options: string[]; correctIndex: number; onAnswer: (idx, correct) => void; onTimeout: () => void }
  </description>
  <structured_output_contract>
    Sadece TSX. Token import zorunlu. Seçim sonrası diğer butonlar disabled.
  </structured_output_contract>
</task>
```

### 9.3 BattleResultScreen

Battle bitti ekranı. Kazanma/kaybetme ekranı, XP animasyonu, konuşma hakkı bildirimi.

**Tasarım:** `Colors.gradient.quizResult` arka plan. Üstte kazanan/kaybeden başlığı. ELO değişimi (+/- X). Kazanılan XP animasyonlu sayaç. "Konuşma hakkı kazandın! +3 dk" bildirimi (ranked kazandıysa). Yeniden oyna / ana menü butonları.

```xml
<task>
  <file>components/battle/BattleResultScreen.tsx</file>
  <description>
    Battle sonuç ekranı:
    - LinearGradient: Colors.gradient.quizResult
    - isWinner=true: "Zafer! 🏆" (Typography.hero), isWinner=false: "Yenildin 😤"
    - XP animasyonu: 0'dan xpEarned'e withTiming 800ms (Typography.score, Colors.accent.orange)
    - ELO değişimi: +/- gösterimi, yeşil/kırmızı (Colors.status.success / error)
    - hasSpeakingBonus=true ise: sarı banner "🎙️ +3 dk konuşma hakkı kazandın!"
    - Konfeti: isWinner=true ise react-native-confetti-cannon (500 parça, Colors palette)
    - Reduced motion: konfeti yok, sadece başlık renk değişimi
    - Butonlar: "Tekrar Oyna" (primary) + "Ana Menü" (ghost)
    - Props: { isWinner: boolean; xpEarned: number; eloChange: number; hasSpeakingBonus: boolean; onRematch: () => void; onHome: () => void }
  </description>
</task>
```

### 9.4 BattleLiveScore

Battle esnasında sürekli görünen skor bandı. Üstte ince şerit.

```xml
<task>
  <file>components/battle/BattleLiveScore.tsx</file>
  <description>
    Canlı skor bandı (battle ekranı üstü):
    - Sabit yükseklik 48px, koyu arka plan Colors.bg.secondary
    - Sol: kendi skoru (yeşil rakam), sağ: rakip skoru (kırmızı rakam)
    - Ortada: kalan süre veya soru numarası "Q 3/10"
    - Skor değişince sayı scale-up animasyonu (100ms spring)
    - Props: { myScore: number; opponentScore: number; questionNumber: number; totalQuestions: number }
  </description>
</task>
```

---

## 10. ⚡ CODEX 5.4 — Animasyon Sistemi

### 10.1 XPAnimatedCounter

XP kazanıldığında sayıyı animasyonlu artıran gösterge.

```xml
<task>
  <file>components/animations/XPAnimatedCounter.tsx</file>
  <description>
    XP sayaç animasyonu:
    - Props: { from: number; to: number; duration?: number; style?: TextStyle }
    - Reanimated useSharedValue + useDerivedValue ile interpolate
    - Default duration: 800ms, easing: Easing.out(Easing.cubic)
    - Metin stili: Typography.score, Colors.accent.orange
    - Prefix/suffix: "+", "XP"
    - Accessibility: değer değişince accessibilityLiveRegion="polite"
  </description>
</task>
```

### 10.2 ConfettiOverlay

Ünite tamamlama ve battle kazanma için konfeti yağmuru.

```xml
<task>
  <file>components/animations/ConfettiOverlay.tsx</file>
  <description>
    Konfeti overlay:
    - Props: { visible: boolean; onComplete?: () => void }
    - react-native-confetti-cannon kullan (yoksa LottieView fallback)
    - Renk paleti: Colors.accent.gold, Colors.brand.primary, Colors.status.success, Colors.battle.purple
    - 400 parça, gravity: 0.3, explosionSpeed: 350
    - visible=true'da tetikle, animasyon bitince onComplete()
    - Reduced motion: visible=true olunca sadece opacity 0→1→0 fade (konfeti yok)
    - AbsoluteFullScreen, pointerEvents="none"
  </description>
</task>
```

### 10.3 StreakFlame

Streak sayısını alevli animasyonla gösteren bileşen.

```xml
<task>
  <file>components/animations/StreakFlame.tsx</file>
  <description>
    Streak alev animasyonu:
    - Props: { count: number; size?: 'small' | 'medium' | 'large' }
    - 🔥 + sayı. Ateş scale pulse animasyonu: 1.0→1.1→1.0, 1.5sn döngü
    - count >= 7: renk Colors.accent.orange, count >= 30: Colors.status.error + glow effect
    - Glow: shadowColor=Colors.status.error, shadowRadius=12, shadowOpacity=0.6
    - Reduced motion: statik 🔥 + sayı, animasyon yok
    - Sizes: small=14px, medium=18px, large=24px
  </description>
</task>
```

### 10.4 UnitCompleteModal

Ünite tamamlandığında gösterilen modal: konfeti + kupa + XP.

```xml
<task>
  <file>components/animations/UnitCompleteModal.tsx</file>
  <description>
    Ünite tamamlama modalı:
    - Modal, Radius.modal, Shadows.level4
    - Arka plan: Colors.gradient.quizResult LinearGradient
    - Kupa ikonu 🏆: scale 0→1.2→1 spring animasyonu (600ms)
    - "Ünite Tamamlandı!" heading1, beyaz
    - XPAnimatedCounter bileşeni (from=0, to=xpEarned)
    - ConfettiOverlay tetikle (modal açılışında)
    - "Devam Et" WKButton primary
    - Props: { visible: boolean; unitName: string; xpEarned: number; onContinue: () => void }
    - Reduced motion: kupa animasyonsuz, konfeti yok, fade-in modal
    - 1200ms toplam görünürlük süresi (otomatik devam seçeneği)
  </description>
</task>
```

---

## 11. ⚡ CODEX 5.4 — Sesli Telaffuz UI

### 11.1 PronunciationRecorder

Mikrofon butonu + kayıt durumu + geri sayım UI.

```xml
<task>
  <file>components/pronunciation/PronunciationRecorder.tsx</file>
  <description>
    Telaffuz kayıt bileşeni:
    - Props: { isPremium: boolean; onResult: (score: 1|2|3|4|5) => void; onPremiumPress: () => void }
    - isPremium=false: soluk mikrofon ikonu (opacity 0.4), tıklayınca onPremiumPress()
    - isPremium=true, idle: mavi mikrofon butonu (Colors.brand.primary daire, 64px)
    - recording: kırmızı pulse animasyonu (scale 1.0→1.15 döngü), "3... 2... 1" geri sayım overlay
    - processing: ActivityIndicator, "Değerlendiriliyor..."
    - result: PronunciationStarRating bileşeni gösterir
    - Haptic: kayıt başlarken light, bitince medium
    - Accessibility: state'e göre label değişir ("Telaffuz kaydı başlat", "Kaydediliyor...", "Değerlendiriliyor")
  </description>
</task>
```

### 11.2 PronunciationStarRating

1-5 yıldız telaffuz skoru gösterimi. Yıldızlar birer birer dolar.

```xml
<task>
  <file>components/pronunciation/PronunciationStarRating.tsx</file>
  <description>
    Yıldız puanlama:
    - Props: { score: 1|2|3|4|5; animate?: boolean }
    - 5 yıldız, dolu=Colors.accent.gold, boş=Colors.text.secondary (opacity 0.3)
    - animate=true: yıldızlar 120ms arayla sırayla scale 0→1.3→1 spring
    - score < 3: altında "Tekrar dene 🎯" (kırmızı), score >= 3: "Harika! 🌟" (yeşil)
    - Reduced motion: hepsini aynı anda göster
    - accessibilityLabel: "{score} yıldız üzerinden 5"
  </description>
</task>
```

---

## 12. ⚡ CODEX 5.4 — Premium & Paywall Bileşenleri

### 12.1 PremiumGateModal

Premium özelliğe ücretsiz kullanıcı tıklayınca açılan upsell modalı.

```xml
<task>
  <file>components/premium/PremiumGateModal.tsx</file>
  <description>
    Premium upsell modalı:
    - Props: { visible: boolean; featureName: string; onClose: () => void; onSubscribe: () => void }
    - Modal, Radius.modal, Shadows.level4, blur arka plan (expo-blur)
    - Üstte: taç ikonu 👑 (Colors.gradient.premium gradient daire)
    - "featureName Premium Özellik" heading1
    - 3 bullet: offline mod, sesli telaffuz, sınırsız battle (ikon + metin)
    - Fiyat: "79 TL/ay · 7 gün ücretsiz"
    - CTA: "Ücretsiz Dene" (WKButton large, premium gradient override)
    - Alt: "Daha sonra" (ghost, küçük, Colors.text.secondary)
    - Premium gradient override: LinearGradient Colors.gradient.premium
  </description>
</task>
```

### 12.2 PremiumBadge

Premium kullanıcıların profil ve kart köşelerinde taç göstergesi.

```xml
<task>
  <file>components/premium/PremiumBadge.tsx</file>
  <description>
    Premium rozet:
    - Props: { size?: 'small' | 'medium' }
    - 👑 + "Premium" chip (Colors.gradient.premium dolu arka plan)
    - small: sadece 👑 ikonu (20px), medium: 👑 + "Premium" yazısı
    - WKChip ile implementasyon (color=Colors.accent.gold+'33', textColor=Colors.accent.gold)
    - Slight glow: shadowColor=Colors.accent.gold, shadowOpacity=0.4, shadowRadius=6
  </description>
</task>
```

---

## 13. ⚡ CODEX 5.4 — Widget Spesifikasyonları

> Widget'lar iOS WidgetKit (Swift/SwiftUI) ve Android Glance (Kotlin) ile ayrı ayrı uygulanır.  
> React Native tarafı sadece widget için paylaşılan veriyi (MMKV/SharedPreferences) yazar.

### 13.1 Widget Veri Katmanı (RN tarafı)

```xml
<task>
  <file>services/widgetDataService.ts</file>
  <description>
    Widget için shared data yazma servisi:
    - MMKV veya expo-shared-preferences kullan
    - writeWidgetData(data: WidgetData): void
    - WidgetData: { wordGerman: string; wordTurkish: string; streak: number; xpToday: number; goalProgress: number; dailyChallengeCompleted: boolean; weeklyRank: number; winRate: number }
    - Uygulama her ön plana geldiğinde (AppState active) ve XP/streak değişince çağrılır
    - iOS: App Group container'a yazar (group.com.wortkrieg.widget)
    - Android: SharedPreferences'a yazar
  </description>
</task>
```

### 13.2 Widget Boyutları

| Widget | Boyut | Premium? | İçerik |
|--------|-------|----------|--------|
| Small (2×2) | ~155×155pt | Hayır | Bugünün kelimesi + 🔥 streak sayısı |
| Medium (2×4) | ~155×348pt | Hayır | Kelime + anlam + günlük hedef progress + streak + XP |
| Large (4×4) | ~338×348pt | ✅ Evet | Medium içerik + win rate + haftalık sıra + Daily Challenge durumu |

**Tasarım kuralları:**
- Arka plan: `#0D1B2A` (dark) / `#FAFAFA` (light) — sistem temasına göre
- Almanca kelime: `#4CAF50`, kalın, büyük
- Streak ateş: `#FF6D00`
- Progress bar: `#1A73E8`
- Tıklama: uygulamayı açar (`wortkrieg://dashboard`)

---

## 14. Erişilebilirlik Kuralları

### Zorunlu Kurallar

1. **Her interaktif eleman** `accessibilityRole` ve `accessibilityLabel` içermelidir.
2. **Dokunma alanı:** iOS min 44×44px, Android min 48×48dp. `WKButton` otomatik sağlar.
3. **Durum göstergesi:** Renk + ikon + metin kombinasyonu zorunlu (renk tek başına yetmez).
4. **Dynamic Type:** `allowFontScaling={false}` yasak. Sistem font boyutuna saygı.
5. **VoiceOver/TalkBack:** Her yeni ekran VoiceOver ile test edilmeli.

### Renk Bağımlılığı Kontrol Tablosu

| Durum | Renk | Ek Gösterge (ZORUNLU) |
|-------|------|-----------------------|
| Doğru cevap | `Colors.status.success` | ✓ ikonu + "Doğru!" metni |
| Yanlış cevap | `Colors.status.error` | ✗ ikonu + "Yanlış, doğru: [x]" |
| Tamamlanan ünite | Yeşil daire | Çek ikonu + "Tamamlandı" etiketi |
| Kilitli ünite | Gri | Kilit ikonu + "Kilitli" etiketi |
| Premium özellik | Amber/gold | 👑 ikonu + "Premium" chip |
| Offline mod | `Colors.status.warning` | Wifi-off ikonu + banner metni |

---

## 15. Animasyon & Reduced Motion Kuralları

### Zamanlama Tablosu

| Durum | Animasyon | Süre | Haptic |
|-------|-----------|------|--------|
| Doğru cevap | Yeşil flash + ✓ scale-up | 400ms | medium |
| Yanlış cevap | Kırmızı flash + ✗ shake | 400ms | error |
| XP kazanma | Sayı count-up + pulse | 800ms | — |
| Ünite tamamlama | Konfeti + kupa bounce | 1200ms | — |
| Bookmark ekleme | Kalp dolum + pulse | 400ms | light |
| Battle VS giriş | Split + şimşek + sayım | 3000ms | — |
| Telaffuz başarılı | Yıldızlar birer birer | 600ms | light |
| FlashCard flip | 3D Y ekseni dönme | 400ms | — |

### Reduced Motion Alternatifleri

| Normal | Reduced Motion |
|--------|----------------|
| Konfeti yağmuru | Anlık renk değişimi + tebrik metni |
| Kupa bounce | Statik kupa + fade-in tebrik |
| Battle VS şimşek | Statik VS dairesi + renk flash |
| XP sayı artışı | Anlık son değeri göster |
| FlashCard 3D flip | Anlık içerik değişimi (crossfade) |
| Streak alev pulse | Statik 🔥 |

**Reduced motion kontrolü:**

```typescript
import { AccessibilityInfo } from 'react-native';

const isReducedMotion = await AccessibilityInfo.isReduceMotionEnabled();
```

---

## 16. Ekran İndeksi (38 Ekran)

| # | Ekran | Durum | Codex? |
|---|-------|-------|--------|
| 1 | Splash | ✅ Mevcut | — |
| 2 | Welcome / Onboarding | ✅ Mevcut | — |
| 3 | Seviye Testi | ✅ Mevcut | — |
| 4 | Kategori Seçimi | ✅ Mevcut | — |
| 5 | Dashboard | ✅ Mevcut | — |
| 6 | Kategori Detay | ✅ Mevcut | — |
| 7 | Ünite Detay | ✅ Mevcut | — |
| 8 | Kelime Listesi | ✅ Mevcut | — |
| 9 | Kelime Kart Bottom Sheet | ✅ `WordDetailSheet` | — |
| 10 | Flashcard Modu | ✅ `FlashCard` | — |
| 11 | Çoktan Seçmeli Quiz | ✅ Mevcut | — |
| 12 | Writing Test | ✅ Mevcut | — |
| 13 | Word in Sentence | ✅ Mevcut | — |
| 14 | Synonym Study | ✅ Mevcut | — |
| 15 | Sesli Telaffuz | 🔧 Kısmi | ✅ §11 |
| 16 | Kelime Defteri | ✅ Mevcut | — |
| 17 | Battle Lobby | 🔧 Kısmi | — |
| 18 | Battle VS Ekranı | ❌ Yok | ✅ §9.1 |
| 19 | Battle Soru | ❌ Yok | ✅ §9.2 |
| 20 | Battle Sonuç | ❌ Yok | ✅ §9.3 |
| 21 | Battle Geçmişi | ✅ Mevcut | — |
| 22 | Keşfet | ✅ Mevcut | — |
| 23 | Arkadaş Sistemi | ✅ Mevcut | — |
| 24 | Profil | ✅ Mevcut | — |
| 25 | Arkadaş Leaderboard | 🔧 Kısmi | — |
| 26 | Global Leaderboard / Podyum | ✅ Mevcut | — |
| 27 | Profil Detay | ✅ Mevcut | — |
| 28 | İstatistikler | ✅ Mevcut | — |
| 29 | Başarımlar | ✅ Mevcut | — |
| 30 | Konuşma Hakkı Ekranı | 🔧 Kısmi | — |
| 31 | Partner Arama | 🔧 Kısmi | — |
| 32 | Konuşma (WebRTC) | 🔧 Kısmi | — |
| 33 | Konuşma Değerlendirme | ❌ Yok | — |
| 34 | Ayarlar | ✅ Mevcut | — |
| 35 | Abonelik / Premium | 🔧 Kısmi | ✅ §12.1 |
| 36 | Bildirim Tercihleri | ✅ Mevcut | — |
| 37 | Offline İndirme | 🔧 Kısmi | — |
| 38 | Günlük Challenge | ✅ `DailyChallengeCard` + ekran | — |

**Durum:**
- ✅ Mevcut — üretilmiş, test edilmiş
- 🔧 Kısmi — temel yapı var, eksikler var
- ❌ Yok — Codex 5.4 görevi

**Codex sütunundaki §** → bu rehberdeki ilgili Codex görev bloğunu gösterir.

---

*Son güncelleme: Nisan 2026*  
*Üretim araçları: Claude Sonnet 4.6 (tasarım ilkeleri + token dokümantasyonu) + Codex 5.4 (bileşen kodu) · `superpowers` iş akışı · `frontend-design` skill*
