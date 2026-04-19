# Store Yayın Kontrol Listesi

## EAS Build Kurulumu
- [ ] `npx eas login` — Expo hesabıyla giriş yap
- [ ] `npx eas build:configure` — proje ID'sini al, `app.json` extra.eas.projectId'yi güncelle
- [ ] `eas.json` içindeki `appleId`, `ascAppId`, `appleTeamId` değerlerini doldur

## iOS — App Store Connect
- [ ] App Store Connect'te uygulama oluştur (Bundle ID: `com.wortkrieg.app`)
- [ ] Sertifika ve Provisioning Profile oluştur
- [ ] `npx eas build --platform ios --profile production`
- [ ] `npx eas submit --platform ios`
- [ ] Ekran görüntüleri yükle (`metadata/screenshots/GUIDE.md`)
- [ ] Açıklama: `metadata/ios/tr/description.txt`
- [ ] Anahtar kelimeler: `metadata/ios/tr/keywords.txt` (100 karakter limit!)
- [ ] Kategori: Education
- [ ] Age Rating: 4+
- [ ] Privacy Policy URL ekle (gizlilik politikası zorunlu)
- [ ] TestFlight ile beta test

## Android — Google Play Console
- [ ] Google Play Console'da uygulama oluştur (Package: `com.wortkrieg.app`)
- [ ] Google Hizmet Hesabı JSON'u oluştur, `google-service-account.json` olarak kaydet
- [ ] `npx eas build --platform android --profile production`
- [ ] `npx eas submit --platform android`
- [ ] Store listing: `metadata/android/tr/full_description.txt`
- [ ] Kısa açıklama: `metadata/android/tr/short_description.txt`
- [ ] Kategori: Education
- [ ] Content rating anketi doldur
- [ ] Feature Graphic yükle (1024×500 px)
- [ ] Privacy Policy URL ekle

## Her İki Platform
- [ ] `app.json` version/buildNumber/versionCode güncellendi mi?
- [ ] Firebase `google-services.json` (Android) ve `GoogleService-Info.plist` (iOS) eklendi mi?
- [ ] Release build'de debug logları kapalı mı?
- [ ] Tüm ekran görüntüleri hazır mı? (`metadata/screenshots/GUIDE.md`)

## Hızlı Build Komutları
```bash
# Development build (Expo Go olmadan test)
npx eas build --platform all --profile development

# İç test için (TestFlight / Internal Track)
npx eas build --platform all --profile preview

# Production
npx eas build --platform all --profile production
npx eas submit --platform all
```
