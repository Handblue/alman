# WortKrieg — UI Yenileme & Eksik Özellikler Planı

> **Tarih:** Nisan 2026  
> **Sorumlu:** ChatGPT 4.5 (implementasyon) + Claude (planlama/review)  
> **Öncelik Sırası:** Kritik → Yüksek → Orta

---

## ÖZET: Ne Yapılacak?

| # | Alan | Durum | Öncelik |
|---|------|-------|---------|
| 1 | İkon kütüphanesi değişimi | Emoji → Lucide icons | Kritik |
| 2 | Kullanıcı kayıt / giriş ekranları | Yok → Firebase Auth | Kritik |
| 3 | Alt navigasyon safe area sorunu | Kırık → Düzeltildi | Kritik |
| 4 | UI genel yenileme | Kötü → İnsancıl & modern | Yüksek |
| 5 | Yazı taşma / container sorunları | Var → Düzeltildi | Yüksek |
| 6 | Firebase bağlantısı & .env kurulumu | Eksik → Tamamlandı | Yüksek |
| 7 | Onboarding akışına Auth entegrasyonu | Eksik → Tamamlandı | Yüksek |
| 8 | Splash / loading ekranı | Yok → Eklendi | Orta |
| 9 | Dark/Light mod toggle | Kod var, UI yok → Düzeltildi | Orta |
| 10 | Görsel placeholder sistemi | Emoji → İllustrasyon | Orta |

---

## 1. İKON KÜTÜPHANESİ

### Mevcut durum
- Tüm ikonlar emoji kullanıyor (`🏠`, `🔍`, `📚` vs.)
- Emojiler platformdan platforma farklı görünür (Samsung'da çirkin)
- Font boyutu ile hizalama sorunları var

### Seçilen kütüphane: **Lucide React Native**

**Neden Lucide?**
- Tamamen ücretsiz ve açık kaynak (ISC lisansı)
- 1500+ ikon, tutarlı tasarım dili
- React Native için özel paket mevcut
- Boyut, renk, kalınlık ayarı kolay
- Figma plugin'i var (tasarımla sync)
- Çok insancıl ve modern görünüm

```bash
npm install lucide-react-native
```

### Değiştirilecek ikonlar

| Konum | Eski (emoji) | Yeni (Lucide) |
|-------|-------------|---------------|
| Tab: Ana Sayfa | 🏠 | `<Home />` |
| Tab: Keşfet | 🔍 | `<Compass />` |
| Tab: Kategoriler | 📚 | `<BookOpen />` |
| Tab: Defterim | ❤️ | `<Heart />` |
| Tab: Profil | 👤 | `<User />` |
| Streak | 🔥 | `<Flame />` |
| XP | ⭐ | `<Zap />` |
| Battle | ⚔️ | `<Swords />` |
| Premium | 👑 | `<Crown />` |
| Ayarlar | ⚙️ | `<Settings />` |
| Bildirim | 🔔 | `<Bell />` |
| Başarım | 🏆 | `<Trophy />` |
| Kelime defteri | 📖 | `<BookMarked />` |
| Arkadaş ekle | ➕ | `<UserPlus />` |
| Paylaş | 📤 | `<Share2 />` |
| Mikrofon | 🎤 | `<Mic />` |
| Ses çal | 🔊 | `<Volume2 />` |
| Kilit | 🔒 | `<Lock />` |
| Geri | ← | `<ChevronLeft />` |
| Kapat | ✕ | `<X />` |

---

## 2. KULLANICI KAYIT / GİRİŞ

### Mevcut durum
- `firebase.ts` var ama `.env` boş — Firebase bağlı değil
- `authService.ts` var ama ekrana bağlı değil
- Welcome ekranında "Başla" → Level testi, "Hesabım var" → direkt dashboard giriyor (auth yok)
- Kullanıcı verisi sadece MMKV'de (local), server'da kaydedilmiyor

### Yapılacaklar

#### 2a. Firebase Projesi Kurulumu
1. Firebase Console'da proje oluştur
2. iOS + Android app ekle
3. Authentication → Email/Password + Google Sign-In aç
4. Firestore Database oluştur
5. `.env` dosyasını doldur:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

#### 2b. Yeni Ekranlar

**`app/(auth)/login.tsx`** — Giriş ekranı
- E-posta + şifre alanları
- "Şifremi unuttum" linki
- Google ile giriş butonu
- "Hesap yok? Kayıt ol" linki
- Lucide ikonlar: `<Mail />`, `<Lock />`, `<Eye />` / `<EyeOff />`

**`app/(auth)/register.tsx`** — Kayıt ekranı
- Ad Soyad, E-posta, Şifre, Şifre tekrar
- Kullanım koşulları onay kutusu
- Google ile kayıt butonu
- "Hesabın var mı? Giriş yap" linki

**`app/(auth)/forgot-password.tsx`** — Şifre sıfırlama
- E-posta alanı
- "Sıfırlama maili gönder" butonu

#### 2c. Auth Guard
`app/_layout.tsx` içine auth kontrolü:
- Giriş yapılmışsa → `/(app)/dashboard`
- Giriş yapılmamışsa → `/(auth)/login`
- İlk kez açılıyorsa → `/(onboarding)/welcome`

#### 2d. Firestore Kullanıcı Dokümanı
```
users/{uid}
  ├── displayName: string
  ├── email: string
  ├── level: "A1" | "A2" | "B1" | "B2" | "C1"
  ├── xp: number
  ├── streak: number
  ├── lastActiveDate: timestamp
  ├── isPremium: boolean
  ├── onboarded: boolean
  ├── createdAt: timestamp
  └── preferences: { theme, notifications, ... }
```

---

## 3. ALT NAVİGASYON SAFE AREA SORUNU

### Mevcut sorun
```tsx
// _layout.tsx — YANLIŞ
tabBarStyle: {
  height: 60,
  paddingBottom: 8,  // ← sabit değer, Android gesture bar'ı yok sayıyor
}
```
Samsung Galaxy serileri, Pixel vs. cihazlarda gesture navigation bar (alt çubuk) tab bar'ın üzerine biniyor.

### Düzeltme

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Layout içinde:
const insets = useSafeAreaInsets();

tabBarStyle: {
  height: 60 + insets.bottom,   // ← dinamik yükseklik
  paddingBottom: insets.bottom + 4,
}
```

**Ek olarak:** `react-native-safe-area-context`'in `SafeAreaProvider` sarması `app/_layout.tsx`'te doğru yapılmalı.

---

## 4. UI GENEL YENİLEME

### Referans stil
Gönderilen görseldeki uygulama: pastel renkler, yuvarlatılmış köşeler, illustrasyon arka planlar, bol beyaz alan (whitespace), gradient kartlar.

### Renk paleti güncelleme (mevcut korunur, yeniler eklenir)

```ts
// constants/colors.ts'e eklenecekler:
surface: {
  subtle: '#F0F4FF',    // çok hafif mavi-gri, card arka planı (light)
  warm: '#FFF8F0',      // sıcak krem, öğrenme ekranları
},
text: {
  muted: '#9CA3AF',     // placeholder, yardımcı metin
  onColor: '#FFFFFF',   // renkli buton üzerindeki metin
},
```

### Yazı tipi & boyut sistemi

`@expo-google-fonts/inter` zaten kurulu. Kullanımı standartlaştır:

| Kullanım | Size | Weight |
|---------|------|--------|
| Ekran başlığı | 28px | 800 |
| Bölüm başlığı | 20px | 700 |
| Kart başlığı | 17px | 600 |
| Gövde metni | 15px | 400 |
| Yardımcı metin | 13px | 400 |
| Etiket/badge | 11px | 500 |

### Bileşen güncellemeleri

#### WKButton
```
Mevcut: düz renkli, köşeli
Hedef:
- Primary: gradient (#1A73E8 → #00BCD4), border-radius 14px, shadow
- Secondary: outline, şeffaf arka plan
- Ghost: sadece metin + ikon
- Danger: kırmızı gradient
- Min height: 52px (iOS 44px + extra padding)
```

#### WKCard
```
Mevcut: düz koyu kart
Hedef:
- Light mode: beyaz + hafif gölge
- Dark mode: #243447 + subtle border
- Border radius: 20px
- İçerik padding: 16px
- Hover/press state: hafif scale(0.98) animasyonu
```

#### WKText taşma sorunu
Tüm metin bileşenlerine `numberOfLines` ve `flexShrink: 1` ekle. `Text` wrapper'larında `flex: 1` eksik olan yerler var.

---

## 5. EKRAN BAZLI SORUNLAR

### Dashboard
- [ ] Karşılama metni ("Merhaba, [ad]!") auth'dan gelmeli
- [ ] Günlük hedef progress bar taşıyor (dar ekranlarda)
- [ ] Streak sayacı emoji yerine Lucide `<Flame />` + animasyon
- [ ] "Arkadaş aktivitesi" feed'i auth olmadan anlamsız — gizle veya placeholder koy

### Onboarding / Welcome
- [ ] "Zaten hesabım var" butonu → direkt dashboard değil, login ekranına gitmeli
- [ ] Görsel illustrasyon ekle (ücretsiz: undraw.co veya storyset.com)
- [ ] Animasyonlu giriş (Reanimated ile fade+slide)

### Kategori / Ünite ekranları
- [ ] Kart başlıkları uzun Almanca kelimelerde taşıyor → `numberOfLines={2}` + `ellipsizeMode="tail"`
- [ ] Kilitli ünite karşımıza çıkıyor ama kilit ikonu emoji, Lucide `<Lock />` olmalı

### Battle Lobby
- [ ] "Rakip bul" butonu auth gerektiriyor — kontrol yok
- [ ] Matchmaking spinner sırasında tab bar gizlenmeli

### Profil
- [ ] Avatar upload yok, placeholder harf avatar (ad baş harfi + renkli daire)
- [ ] Auth'tan gelen display name gösterilmiyor

---

## 6. ÜCRETSİZ İLLÜSTRASYON & GÖRSEL KAYNAKLAR

Emoji yerine insan figürlü illustrasyon kullanılacak. Tamamen ücretsiz kaynaklar:

| Kaynak | URL | Lisans | Format |
|--------|-----|--------|--------|
| **Storyset** | storyset.com | Ücretsiz (atıf ile) | SVG/PNG |
| **unDraw** | undraw.co | Tamamen ücretsiz | SVG |
| **Humaaans** | humaaans.com | CC0 | SVG |
| **Open Peeps** | openpeeps.com | CC0 | SVG |
| **Lucide Icons** | lucide.dev | ISC | SVG/RN |

### Önerilen illustrasyon konumları

| Ekran | İllüstrasyon |
|-------|--------------|
| Welcome | Kitap okuyan insan figürü (Storyset "Learning") |
| Level testi | Quiz yapan karakter |
| Boş notebook | "Henüz kelime yok" boş durum |
| Battle bekleme | "Rakip aranıyor" loading |
| Başarı sonrası | Kutlama figürü |
| Login | Dil öğrenen karakter |

---

## 7. DOSYA / KLASÖR DEĞİŞİKLİKLERİ

```
app/
├── (auth)/           ← YENİ KLASÖR
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
├── (onboarding)/     ← MEVCUT (güncellenir)
├── (app)/            ← MEVCUT (güncellenir)
└── _layout.tsx       ← Auth guard eklenir

constants/
├── colors.ts         ← Güncellenir
├── typography.ts     ← Güncellenir
└── icons.ts          ← YENİ: merkezi ikon export

components/
├── ui/
│   ├── WKButton.tsx  ← Yeniden yazılır
│   ├── WKCard.tsx    ← Yeniden yazılır
│   ├── WKIcon.tsx    ← YENİ: Lucide wrapper
│   └── Avatar.tsx    ← YENİ: harf avatar
├── auth/             ← YENİ KLASÖR
│   ├── AuthForm.tsx
│   └── GoogleSignInButton.tsx
└── layout/           ← YENİ KLASÖR
    └── ScreenWrapper.tsx  ← SafeArea + scroll wrapper
```

---

## 8. KURULUM SIRALAMA (ChatGPT 4.5 İçin)

### Faz A — Temel altyapı (önce bunlar)
1. `npm install lucide-react-native` → ikon sistemi kur
2. `constants/icons.ts` → merkezi ikon dosyası oluştur
3. `app/_layout.tsx` → SafeAreaProvider + auth guard
4. Tab bar safe area düzeltmesi

### Faz B — Auth sistemi
5. Firebase `.env` doldur ve bağlantıyı test et
6. `app/(auth)/` klasörü ve 3 ekran
7. `authService.ts`'i gerçek Firebase Auth'a bağla
8. `useUserStore` → Firestore sync ekle

### Faz C — UI yenileme
9. `WKButton` yeniden yaz (gradient, animasyon)
10. `WKCard` yeniden yaz (shadow, light/dark)
11. `WKText` taşma düzeltmeleri
12. Dashboard ekranı yenile
13. Welcome / Onboarding ekranları yenile
14. Kategori & ünite kartları düzelt

### Faz D — Görsel iyileştirmeler
15. İllüstrasyonları indir ve ekle (SVG → PNG export)
16. Profil avatar bileşeni
17. Animasyonlar (Reanimated ile giriş animasyonları)
18. Boş durum (empty state) ekranları

---

## 9. TEKNİK NOTLAR (ChatGPT 4.5'e)

- Proje **Expo Router v3** kullanıyor — `app/` klasörü file-based routing
- State management: **Zustand** (`store/` klasörü)
- Tema: `context/ThemeContext.tsx` var ama ekranlara tam bağlı değil
- `react-native-safe-area-context` kurulu (`~5.6.2`) — kullan!
- `expo-linear-gradient` kurulu — gradient için import et
- `react-native-reanimated` kurulu (`^4.2.1`) — animasyonlar için
- `expo-haptics` kurulu — dokunma geri bildirimi için
- TypeScript strict mode aktif — tüm tipler yazılmalı
- Her dosya max 300 satır, daha uzunsa böl

---

## 10. REFERANS UI KALİTE ÖLÇÜTLERİ

Bir ekran "tamamlandı" sayılmadan önce:
- [ ] iPhone 14 Pro ve Samsung Galaxy S22'de görüntü alındı
- [ ] Hiçbir metin container dışına taşmıyor
- [ ] Alt navigasyon gesture bar'ın altında kalmıyor
- [ ] Dark mode ve light mode ikisi de test edildi
- [ ] Tüm butonlar min 52px yükseklikte
- [ ] Lucide ikonlar emoji yerine kullanılıyor
- [ ] Yükleme (loading) durumu var (skeleton veya spinner)
- [ ] Boş durum (empty state) var

---

*Son güncelleme: Nisan 2026*
