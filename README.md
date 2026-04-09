# WortKrieg

WortKrieg, Almanca öğrenimini klasik dil uygulaması kalıplarının dışına taşıyan; savaş, rekabet, sosyal etkileşim ve günlük ilerleme motivasyonunu bir araya getiren React Native / Expo tabanlı bir mobil öğrenme uygulamasıdır. iOS ve Android için tasarlanan ürün; bireysel çalışma akışlarını, canlı rekabeti ve freemium gelir modelini tek bir deneyimde toplar.

## Özellikler

### 🧠 Öğrenme Deneyimi
- Flashcard, çoktan seçmeli, yazma, cümle ve telaffuz odaklı çalışma modları
- Günlük meydan okuma, kelime listeleri ve kişisel kelime defteri
- Seviyeye ve kategoriye göre içerik akışı
- Sesli telaffuz desteği ve konuşma pratiği için özel akışlar

### ⚔️ Sosyal ve Rekabetçi Yapı
- ELO tabanlı battle sistemi, maç geçmişi ve sonuç ekranları
- Arkadaş sistemi, sosyal meydan okumalar ve çalışma grupları
- Keşfet ekranı ile topluluk ve içerik keşfi
- Leaderboard ile haftalık ve genel sıralama takibi

### 🎮 Gamification Katmanı
- XP, streak, rozet ve başarı sistemi
- Günlük hedefler ve geri dönüş motivasyonu
- Seviye ilerlemesi, kişisel istatistikler ve analytics ekranları

### 💎 Premium ve Teknik Yetenekler
- Freemium yapı: ücretsiz kullanım + premium özellikler
- Offline kullanım akışları ve widget desteği
- Firebase tabanlı senkronizasyon ve gerçek zamanlı veri güncellemesi
- WebSocket ve WebRTC ile canlı etkileşim senaryolarına hazır mimari

## Teknoloji Yığını

| Katman | Teknoloji |
| --- | --- |
| Mobil uygulama | React Native, Expo |
| Routing | Expo Router |
| Dil | TypeScript |
| Durum yönetimi | Zustand |
| Yerel depolama | MMKV, AsyncStorage |
| Backend servisleri | NestJS, Firebase |
| Gerçek zamanlı iletişim | WebSocket, WebRTC |
| Kimlik ve veri | Firebase Auth, Firestore |
| Medya ve cihaz özellikleri | Expo Speech, Notifications, File System, Haptics |

## Kurulum

### Gereksinimler
- Node.js 20+
- npm 10+
- Expo CLI kullanımı için `npx expo`
- Android geliştirme için Android Studio / SDK
- iOS geliştirme için macOS + Xcode

### Yerel geliştirme
1. Bağımlılıkları kurun:

```bash
npm install
```

2. Geliştirme sunucusunu başlatın:

```bash
npx expo start
```

3. Android derlemesini veya cihaz çalıştırmasını başlatın:

```bash
npm run android
```

İhtiyaç halinde doğrudan Expo komutunu da kullanabilirsiniz:

```bash
npx expo run:android
```

Firebase ve benzeri servisler için gereken ortam değişkenlerini proje yapılandırmasına göre `.env` dosyasında tanımlayın.

## Ekran Yapısı

`app/` klasörü Expo Router tabanlı ekran organizasyonunu içerir:

| Yol | Açıklama |
| --- | --- |
| `app/index.tsx` | Uygulama giriş yönlendirmesi |
| `app/_layout.tsx` | Kök layout, global provider ve navigation sarmalayıcıları |
| `app/(onboarding)/` | Karşılama, kategori seçimi ve seviye testi akışları |
| `app/(app)/dashboard.tsx` | Ana panel ve hızlı erişim kartları |
| `app/(app)/study/` | Flashcard, review, writing, pronunciation ve diğer çalışma modları |
| `app/(app)/battle/` | Lobby, VS, soru, sonuç ve geçmiş ekranları |
| `app/(app)/study-group/` ve `app/(app)/study-groups.tsx` | Çalışma grupları ve grup detay akışları |
| `app/(app)/friends.tsx`, `app/(app)/leaderboard.tsx`, `app/(app)/challenges.tsx` | Sosyal özellikler ve rekabet ekranları |
| `app/(app)/explore.tsx`, `app/(app)/notebook.tsx`, `app/(app)/premium.tsx` | Keşfet, kişisel içerik ve premium sayfaları |
| `app/(app)/settings.tsx`, `app/(app)/profile.tsx`, `app/(app)/statistics.tsx`, `app/(app)/analytics.tsx` | Hesap, ayarlar ve performans ekranları |

## Katkıda Bulunma

Katkı göndermek için aşağıdaki akış izlenebilir:

1. Repo'yu fork edin ve yeni bir branch açın.
2. Değişikliklerinizi küçük ve anlaşılır commit'lerle hazırlayın.
3. Dokümantasyon veya kod değişikliklerinde ilgili ekran, servis ve store etkilerini kontrol edin.
4. Pull request içinde kapsamı, test durumunu ve olası riskleri açıkça belirtin.

## Lisans

Bu proje MIT lisansı ile sunulmaktadır.
