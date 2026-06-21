# WortKrieg — Tam Müfredat + Yayına Hazırlık (Tasarım)

**Tarih:** 2026-06-21
**Branch:** `feature/full-curriculum-and-store-prep`
**Durum:** Onaylandı

## 1. Amaç

WortKrieg (Almanca→Türkçe kelime öğrenme uygulaması) için:
1. Kelime hazinesini **600 → 2400 kelime** (40 → 160 ünite) çıkarmak; üretimi **çok-ajanlı (multi-agent)** bir hatla yapmak.
2. Üretim hattını (pipeline) repoya kalıcı araç olarak işlemek.
3. Mevcut hataları düzeltmek, kalite kapıları eklemek.
4. UI/UX + erişilebilirlik denetimi yapmak.
5. Google Play **tam yayın-öncesi hazırlık paketi** (build hariç).

## 2. Mevcut durum (baseline)

- React Native 0.83 / Expo 55 (canary), TypeScript, Zustand, Expo Router.
- `data/words.ts`: 600 kelime, 8 kategori, 40 ünite (her biri tam 15 kelime).
- `data/units.ts`: 40 ünite tanımlı. `data/categories.ts`: her kategori `totalUnits: 20` (→ 160 ünite vaat ediyor; **tutarsızlık**).
- Sağlık: `tsc` temiz; jest 80/82 (ThemeContext testinde 2 kırık).
- `Word` şeması: `{ id, categoryId, unitId, german, turkish, example, exampleTranslation, synonyms?, level, audioUrl? }`, `level ∈ A1|A2|B1|B2|C1`.

## 3. Hedef yapı

| Kategori | Mevcut ünite | Hedef ünite | Yeni ünite | Seviye teması |
|---|---|---|---|---|
| 1 A1 Kelimeler | 12 | 20 | 8  | ağırlıklı A1, biraz A2 |
| 2 A1–C1 Gramer | 5  | 20 | 15 | A1→C1 yayılı |
| 3 Goethe Sınav | 4  | 20 | 16 | B1–C1 |
| 4 telc Sınav   | 3  | 20 | 17 | B1–C1 |
| 5 Günlük Hayat | 5  | 20 | 15 | A1–B1 |
| 6 Akademik     | 4  | 20 | 16 | B2–C1 |
| 7 Felsefe      | 3  | 20 | 17 | B2–C1 |
| 8 Deyimler     | 4  | 20 | 16 | B1–C1 |
| **Toplam**     | 40 | 160| **120** | — |

120 yeni ünite × 15 = **1800 yeni kelime**. Mevcut 600 korunur (hafif denetim + bugfix sonrası). Yeni `unitId`'ler 41–160; her kategorinin ünite `number`'ı 1..20 olacak şekilde devam eder.

## 4. Çok-ajanlı üretim mimarisi

Orkestrasyon: `Workflow` aracı (deterministik fan-out + şema-doğrulamalı ajan çıktısı).

Kalıcı araç: `tools/word-gen/`
```
curriculum.json          # 160 ünitenin planı (kategori, no, başlık, seviye karışımı, alt-konular, blocklist ipuçları)
schema.ts                # Word tipi + JSON-şema sabiti
validate.ts              # Doğrulama kapısı: tekil id; tekil almanca başsözcük; geçerli artikel; geçerli level;
                         #   boş example/translation yok; categoryId/unitId tutarlı; ünite başı tam 15 kelime
compile.ts               # units/*.json → data/words.ts + data/units.ts deterministik derleme
units/<cat>-<unitNo>.json# Üretilen "kelime dosyaları" (her biri 15 kelime)
README.md                # Pipeline'ı yeniden çalıştırma talimatı
```

**Akış (Workflow fazları):**
1. **Müfredat tasarımı** — kategori başına planlayıcı ajan; eksik ünitelerin başlık + tema + seviye karışımı + alt-konularını üretir; mevcut 40 üniteyle ve birbiriyle tema çakışmasını önler → `curriculum.json`.
2. **Üretim** — ünite başına bir ajan, 15 kelimeyi şema-doğrulamalı JSON üretir. Girdi: kategori/ünite teması, seviye karışımı, **kullanılmış tüm Almanca başsözcük blocklist'i** (önce mevcut 600). Kategori kategori dalgalar; her dalga sonrası blocklist büyür.
3. **Düşmanca doğrulama** — ünite başına bağımsız doğrulayıcı ajan (native Almanca öğretmeni merceği): artikel/cinsiyet (der/die/das), Türkçe çeviri doğruluğu, seviye uygunluğu, örnek cümle gramerliği, başsözcük tekrarı. Hatalıları düzeltir/yeniden üretir.
4. **Global dedup + derleme** — 2400 kelime genelinde başsözcük çakışması temizliği; `compile.ts` ile `data/`'ya yazma.

**Kalite kapıları:** her kelime şemadan geçer → adversarial doğrulayıcı → `validate.ts` → `tsc` → jest. Hepsi yeşil olmadan entegrasyon yok.

## 5. Hata düzeltme

- Veri: `das Aposterori`→`Aposteriori`; tekrar eden synonym(ler); `categories.ts.totalUnits` ile gerçek ünite sayısını tutarlı kıl.
- jest: ThemeContext'teki 2 kırık testi düzelt.
- Kelime verisi için kalıcı doğrulama testi (`__tests__/data/words.test.ts`).
- UX denetiminden çıkan UI hatalarını düzelt.

## 6. UI/UX & human-eye test

- `expo start --web` ile ayağa kaldır; anahtar ekranların ekran görüntüsünü al, görsel/UX denetimi yap.
- Risk: MMKV/reanimated-worklets/nitro-modules/speech-recognition web'de tam çalışmayabilir. Web kırılırsa: bileşen-seviyesi inceleme + `German App/` HTML prototipi referansı; durum şeffaf bildirilir.
- Çok-ajanlı denetim: kontrast (WCAG), dokunma hedefi (≥44px), tutarlılık, i18n, erişilebilirlik etiketleri.

## 7. Play Store hazırlık (`store/play/`)

- Store listing metinleri: **TR / EN / DE** (başlık, kısa+uzun açıklama, anahtar kelimeler).
- Gizlilik politikası (markdown + barındırma talimatı).
- İçerik derecelendirme (IARC) anket cevapları; Veri Güvenliği (Data Safety) formu cevapları.
- EAS **production AAB** yapılandırması (`eas.json` profili), sürüm/`versionCode` düzeni.
- Ekran görüntüsü üretimi (telefon + 7"/10" tablet boyut notları).
- **Yayın kontrol listesi** (imza anahtarı, Play Console adımları — kullanıcı tarafında yapılacaklar dokümante).

## 8. Fazlar

0. Sağlık & veri bugfix → 1. `tools/word-gen/` iskelesi → 2. Müfredat (Workflow) → 3. Üretim+doğrulama (Workflow) → 4. Derleme & entegrasyon → 5. UI/UX → 6. Play Store → 7. Son doğrulama & rapor.

## 9. Riskler

- 1800 kelimenin kalitesi: adversarial doğrulama + otomatik artikel/şema kontrolü hata oranını düşürür; %100 native gözden geçirme yerini tutmaz.
- Web preview native modüllerde kırılabilir (telafi planı §6).
- Gerçek Play yükleme kullanıcının Google hesabı + imza anahtarı gerektirir (kapsam dışı; dokümante edilir).

## 10. Başarı ölçütü

- `data/words.ts` 2400 kelime, 160 ünite; `validate.ts` + `tsc` + jest yeşil.
- `tools/word-gen/` yeniden çalıştırılabilir + dokümante.
- `store/play/` tam paket hazır.
- UX denetimi raporu + uygulanan düzeltmeler.
