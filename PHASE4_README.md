# WortKrieg

## Faz 4: Backend Entegrasyonu ve Bulut Özellikleri

### Genel Bakış

Bu fazda WortKrieg'in yerel çalışan öğrenme akışı, Firebase tabanlı bulut senkronizasyonu ile genişletildi. Hedef; kullanıcı profili, ilerleme verileri ve sıralama sistemini cihazlar arasında tutarlı hale getirirken offline-first mimariyi korumaktı.

## Tamamlanan İşler

### Firebase Entegrasyonu
- `services/authService.ts`: Anonim kimlik doğrulama akışı
- `services/userService.ts`: Profil, XP ve ilerleme senkronizasyonu
- `services/progressService.ts`: kelime ilerlemesi, ünite tamamlama ve bookmark senkronizasyonu
- `services/folderService.ts`: özel klasörlerin buluta taşınması
- `services/leaderboardService.ts`: gerçek zamanlı haftalık ve tüm zamanlar sıralaması
- `firebase.ts`: merkezi Firebase yapılandırması

### Bulut Destekli Store Güncellemeleri
- `User Store`: kullanıcı verisi için gerçek zamanlı senkronizasyon
- `Progress Store`: kelime ilerlemesi, ünite durumu ve bookmark eşitleme
- `Folder Store`: özel klasörlerin cihazlar arası paylaşımı
- Yerel depolamanın ana kaynak olarak kaldığı offline-first yaklaşım

### Güncellenen Ürün Özellikleri
- Mock veriler kaldırılarak leaderboard gerçek Firebase akışına taşındı
- Kullanıcı ilerlemesi, klasörler ve bookmark verileri cihazlar arasında eşitlendi
- Bulut işlemleri için yüklenme ve durum yönetimi iyileştirildi

## Kurulum Notları

### 1. Firebase Projesi
1. [Firebase Console](https://console.firebase.google.com/) üzerinden yeni proje oluşturun.
2. Anonim giriş destekli Authentication özelliğini aktif edin.
3. Firestore Database'i açın.
4. Proje ayarlarından uygulama yapılandırma değerlerini alın.

### 2. Ortam Değişkenleri

`.env` dosyasını aşağıdaki örnek yapıya göre güncelleyin:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 3. Firestore Güvenlik Kuralları

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /leaderboards/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## Sonraki Adımlar

### Yüksek Öncelik
- [x] Firebase projesi ve ortam değişkenleri kuruldu
- [x] Anonim giriş akışı test edildi
- [x] İlerleme store'ları için bulut senkronizasyonu eklendi
- [x] Avatar ve görünen ad desteği sağlandı
- [x] Gerçek zamanlı leaderboard abonelikleri eklendi

### Orta Öncelik
- [ ] Offline işlem kuyruğu ekleme
- [ ] Mevcut kullanıcılar için veri migrasyonu
- [ ] Senkronizasyon durumu için kullanıcı geri bildirimi
- [ ] Günlük meydan okuma verisinin buluta taşınması
- [ ] Leaderboard değişimleri için push bildirimleri

### İleri Aşama
- [ ] Sosyal özellikler: arkadaş istekleri ve meydan okumalar
- [ ] Gelişmiş analytics ve ilerleme içgörüleri
- [ ] Tam çoklu cihaz senkronizasyonu
- [ ] Yedekleme ve geri yükleme

## Test ve Geliştirme

Testleri çalıştırmak için:

```bash
npx jest
```

Geliştirme sunucusunu başlatmak için:

```bash
npx expo start
```

Not: Expo modüllerine bağlı bazı testlerde ek mock ihtiyacı oluşabilir; çekirdek mantık testleri öncelikli olarak korunmuştur.

## Mimari Özeti

```text
Yerel Depolama (MMKV) <-> Bulut Senkronizasyonu <-> Firebase Firestore
        |                         |                         |
        |                         |                         |
   Kullanıcı verisi         Gerçek zamanlı eşitleme     Kullanıcı koleksiyonu
   İlerleme verisi          Çakışma yönetimi            İlerleme koleksiyonu
   Cache ve ayarlar         Offline stratejileri        Leaderboard / analytics
```
