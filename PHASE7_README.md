# WortKrieg

## Faz 7: Test Altyapısı ve Sosyal Özellikler

> Tarih: Nisan 2026  
> Durum: Tamamlandı

## Bu Fazda Yapılanlar

### 1. Test Altyapısı Düzeltmeleri

15 test dosyasında toplam 80 başarısız test üreten altyapı problemleri temizlendi ve sonuçta tüm testlerin geçtiği bir yapı elde edildi.

#### Kök Nedenler ve Çözümler

| Sorun | Çözüm |
| --- | --- |
| Firebase ESM modülleri Jest içinde çalışmıyordu | `__mocks__/firebase-firestore.js`, `firebase-auth.js`, `firebase-app.js` dosyaları eklendi |
| `moduleNameMapper` sıralaması yanlıştı | Spesifik eşlemeler catch-all `^@/(.*)$` kuralından önce taşındı |
| Jest hoisting kaynaklı TDZ hatası vardı | `jest.fn()` kullanımları factory closure içine taşındı, mock sırası düzenlendi |
| `useDailyChallengeStore` içinde dinamik `await import()` kullanılıyordu | Tüm dinamik importlar static import yapısına çevrildi |
| `expo-av` mock yapısı eksikti | `Audio.Sound` hem top-level hem `Audio` namespace altında export edildi |
| `expo-file-system` içinde `EncodingType` eksikti | `Base64` ve `UTF8` alanları eklendi |
| `ThemeContext` testi global mock tarafından gölgeleniyordu | Test bazında `jest.unmock()` kullanıldı |
| `analyticsService` testleri yanlış metod ve argüman isimleri kullanıyordu | Testler gerçek implementasyona göre güncellendi |
| `useAnalyticsStore` içinde import yolları yanlıştı | Servis import yolları düzeltildi |

#### Oluşturulan Mock Dosyaları
- `__mocks__/firebase-firestore.js`
- `__mocks__/firebase-auth.js`
- `__mocks__/firebase-app.js`
- `__mocks__/firebase-config.js`
- `__mocks__/expo-av.js`
- `__mocks__/expo-vector-icons.js`
- `__mocks__/use-theme.js`
- `__mocks__/notification-service.js`
- `__mocks__/offline-queue-service.js`

### 2. Çalışma Grupları Özelliği

#### Eklenen Dosyalar

| Dosya | Açıklama |
| --- | --- |
| `services/studyGroupService.ts` | Firestore CRUD ve gerçek zamanlı abonelikler |
| `store/useStudyGroupStore.ts` | `myGroups`, `publicGroups`, `loading`, `error` alanlarını yöneten Zustand store |
| `components/social/StudyGroupCard.tsx` | Seviye etiketi, XP ve üye sayısı gösteren grup kartı |
| `components/social/GroupLeaderboard.tsx` | Haftalık XP bazlı gerçek zamanlı grup sıralaması |
| `app/(app)/study-groups.tsx` | Gruplarım, keşfet, grup oluştur ve kodla katıl akışı |
| `app/(app)/study-group/[id].tsx` | Grup detay, leaderboard, davet kodu ve ayrılma akışı |

#### Desteklenen Kullanımlar
- İsim, açıklama, seviye ve görünürlük ile grup oluşturma
- Davet kodu ile gruba katılma
- Keşfet sekmesinden herkese açık gruplara doğrudan giriş
- Kurucu hariç kullanıcılar için gruptan ayrılma
- Native Share API ile grup paylaşımı
- `onSnapshot` tabanlı haftalık XP leaderboard

### 3. İlerleme Paylaşımı

`studyGroupService.shareProgress()` çağrısı, Firestore içindeki `progressShares` koleksiyonuna aşağıdaki alanları yazar:

- `weeklyXP`
- `wordsLearned`
- `streakDays`
- `topCategory`
- `isPublic`

Paylaşım belirli bir kullanıcıya (`toUid`) veya herkese açık olacak şekilde yapılabilir.

#### `friends.tsx` Güncellemesi
- Arkadaşlar ekranına "İlerlemeyi Paylaş" aksiyonu eklendi
- Çalışma gruplarına geçiş için yeni navigation butonu eklendi
- `useUserStore` içindeki `xp` ve `streak` verileri paylaşım akışına bağlandı

### 4. Skill Dosyaları

`~/.claude/skills/` altında 11 ajan skill dosyası tanımlandı:

- `product-owner`
- `ui-guardian`
- `battle-architect`
- `qa-sentinel`
- `gamification-balancer`
- `speech-ai-engineer`
- `offline-sync-guardian`
- `monetization-strategist`
- `social-features-architect`
- `content-producer`
- `performance-optimizer`

## Sonraki Aşama: Faz 8

### Öncelikli Başlıklar

1. Battle sistemi
   `services/battleService.ts`, `store/useBattleStore.ts` ve `app/(app)/battle/` akışları üzerinden Socket.io, ELO ve canlı skor yapısı.
2. Sesli telaffuz
   Google STT entegrasyonu, `services/pronunciationService.ts` ve flashcard ekranında mikrofon tabanlı puanlama.
3. Keşfet ekranı
   `app/(app)/explore.tsx` üzerinde topluluk listeleri, sınav vitrini ve arama deneyimi.

### İkincil Başlıklar
- WebRTC konuşma pratiği
- Offline mod ve widget desteği
- Push bildirim entegrasyonu

## Teknik Notlar

- Firebase ESM ve Jest uyumsuzluğu `moduleNameMapper` ve özel mock'larla çözüldü
- Zustand store'larda dinamik `await import()` kullanımı test ortamında kırılganlık oluşturur
- `moduleNameMapper` kural sırası kritik: spesifik eşlemeler önce gelmeli
- Çalışma grubu leaderboard aboneliklerinde `unsubscribe` temizliği zorunludur

*WortKrieg v3.0 - Faz 7 tamamlandı*
