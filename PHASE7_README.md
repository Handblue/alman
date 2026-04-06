# Faz 7 — Test Altyapısı & Sosyal Özellikler

> Tarih: Nisan 2026 | Durum: Tamamlandı

---

## Bu Fazda Yapılanlar

### 1. Test Altyapısı Düzeltmeleri (80/80 Test Geçiyor)

**Sorun:** 15 test dosyasında toplam 80 test başarısız oluyordu.

**Kök Nedenler ve Çözümler:**

| Sorun | Çözüm |
|-------|-------|
| Firebase ESM modülleri Jest'te çalışmıyor | `__mocks__/firebase-firestore.js`, `firebase-auth.js`, `firebase-app.js` dosyaları oluşturuldu |
| `moduleNameMapper` sıralaması yanlış | Spesifik `@/firebase`, `@/hooks/useTheme` eşlemeleri catch-all `^@/(.*)$`'dan ÖNCE sıralandı |
| Jest hoisting TDZ hatası | `jest.fn()` factory closure içine taşındı; mock'lar import'tan SONRA tanımlandı |
| `useDailyChallengeStore`'da dinamik `await import()` | Tüm dinamik importlar dosya başına static import olarak taşındı |
| `expo-av` mock yapısı eksik | `Audio.Sound` hem top-level hem `Audio` namespace altında export edildi |
| `expo-file-system` — `EncodingType` eksik | `EncodingType: { Base64: 'base64', UTF8: 'utf8' }` eklendi |
| `ThemeContext` testi global mock tarafından engellendi | Test başına `jest.unmock()` eklendi |
| `analyticsService` yanlış metod/argüman adları | Test dosyaları gerçek implementasyona göre güncellendi |
| `useAnalyticsStore` test import yolları hatalı | `'../services/'` → `'../../services/'` düzeltildi |

**Oluşturulan Mock Dosyaları:**
- `__mocks__/firebase-firestore.js` — Tam Firestore mock (CRUD + onSnapshot)
- `__mocks__/firebase-auth.js` — Auth mock
- `__mocks__/firebase-app.js` — App mock
- `__mocks__/firebase-config.js` — `{ db, auth, app }` mock
- `__mocks__/expo-av.js` — `Audio.Sound` ile tam mock
- `__mocks__/expo-vector-icons.js` — Tüm icon familyaları
- `__mocks__/use-theme.js` — `{ isDark, colors, toggleTheme }` mock
- `__mocks__/notification-service.js` — Singleton servis mock
- `__mocks__/offline-queue-service.js` — Singleton servis mock

---

### 2. Study Groups (Çalışma Grupları) Özelliği

**Yeni Dosyalar:**

| Dosya | Açıklama |
|-------|---------|
| `services/studyGroupService.ts` | Firebase Firestore CRUD + realtime subscription |
| `store/useStudyGroupStore.ts` | Zustand store — myGroups, publicGroups, loading, error |
| `components/social/StudyGroupCard.tsx` | Grup listesi kartı — level chip, XP, üye sayısı |
| `components/social/GroupLeaderboard.tsx` | Realtime haftalık XP sıralaması (1. altın, 2. gümüş, 3. bronz) |
| `app/(app)/study-groups.tsx` | Ana ekran — Gruplarım + Keşfet + Grup Oluştur + Kodla Katıl |
| `app/(app)/study-group/[id].tsx` | Grup detay + realtime leaderboard + davet kodu + ayrıl |

**Desteklenen İşlemler:**
- Grup oluşturma (isim, açıklama, seviye, gizli/herkese açık)
- Davet kodu ile gruba katılma
- Grubu doğrudan "Keşfet" sekmesinden katılma
- Gruptan ayrılma (creator ayrılamaz)
- Grup paylaşma (native Share API)
- Realtime haftalık XP sıralaması (onSnapshot)

---

### 3. İlerleme Paylaşma (Progress Sharing)

**`studyGroupService.shareProgress()`** — Firestore `progressShares` koleksiyonuna yazar:
- `weeklyXP`, `wordsLearned`, `streakDays`, `topCategory`, `isPublic`
- Belirli bir arkadaşa (`toUid`) veya herkese açık paylaşım

**`friends.tsx` güncellemesi:**
- "İlerlemeyi Paylaş" butonu eklendi (arkadaşlar sekmesinde)
- "Çalışma Grupları →" navigasyon butonu eklendi
- `useUserStore`'dan `xp` ve `streak` alınarak progress paylaşılıyor

---

### 4. Skill Dosyaları

`~/.claude/skills/` altında 11 ajan skill dosyası oluşturuldu:
- `product-owner`, `ui-guardian`, `battle-architect`, `qa-sentinel`
- `gamification-balancer`, `speech-ai-engineer`, `offline-sync-guardian`
- `monetization-strategist`, `social-features-architect`, `content-producer`
- `performance-optimizer`

---

## Sonraki Aşamada Yapılacaklar (Faz 8)

### Öncelikli

1. **Battle Sistemi (WebSocket)**
   - `services/battleService.ts` — Socket.io bağlantısı
   - `store/useBattleStore.ts` — ELO, matchmaking, canlı skor
   - `app/(app)/battle/` — Lobby, VS ekranı, soru, sonuç ekranları
   - AI Bot fallback (kullanıcı havuzu < 200)

2. **Sesli Telaffuz (Premium)**
   - Google STT entegrasyonu
   - `services/pronunciationService.ts`
   - Flashcard ekranına mikrofon ikonu ekleme
   - 1-5 yıldız fonemik puanlama

3. **Keşfet Ekranı**
   - `app/(app)/explore.tsx`
   - Topluluk listeleri, sınav hazırlık vitrini
   - Arama

### İkincil

4. **WebRTC Konuşma Pratiği**
5. **Offline Mod + Widget**
6. **Push Bildirim Entegrasyonu**

---

## Teknik Notlar

- Firebase ESM → Jest uyumsuzluğu `moduleNameMapper` ile çözüldü; her yeni Firebase modülü için mock eklenmeli
- Zustand store'larda dinamik `await import()` kullanma; test ortamında ESM VM hatası verir
- `moduleNameMapper` sıralaması kritik: spesifik → catch-all
- Study Groups realtime leaderboard `onSnapshot` ile çalışıyor; unsubscribe cleanup şart

---

*WortKrieg v3.0 — Faz 7 Tamamlandı*
