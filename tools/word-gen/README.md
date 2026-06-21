# WortKrieg — Çok-Ajanlı Kelime Üretim Hattı (word-gen)

Bu klasör, uygulamanın kelime hazinesini (`data/words.ts`, `data/units.ts`) **çok-ajanlı**
(multi-agent) bir süreçle üreten, doğrulayan ve derleyen yeniden çalıştırılabilir araç setidir.

## Mimari: Tek doğruluk kaynağı = `units/*.json`

```
                    ┌─────────────────────────────────────────────┐
   data/*.ts  ──►   extract.mjs   ──►  units/*.json  ◄── (üretim)  │
   (mevcut 600)                          ▲                         │
                                         │  Workflow (ajan filosu) │
   curriculum.json  ◄── extract +  ──────┘  Faz 2: müfredat        │
   (160 ünite plan)    Faz 2 planlama       Faz 3: üretim+doğrulama│
                                         │                         │
   repairs.json  ◄── audit.mjs  ─────────┘  (tekrar eden slotlar)  │
                                                                   │
   units/*.json  ──►  validate.mjs  ──►  compile.mjs  ──►  data/*.ts
                      (kalite kapısı)     (deterministik derleme)   │
                    └─────────────────────────────────────────────┘
```

**Her şeyin kaynağı `units/*.json` dosyalarıdır.** `compile.mjs` bunlardan `data/words.ts`
ve `data/units.ts`'i deterministik olarak yeniden üretir. Uygulama yalnızca `data/*.ts`'i
import eder; üretim ayrıntılarını bilmez.

## Dosyalar

| Dosya | Görev |
|---|---|
| `lib/schema.mjs` | `Word` şeması, seviye/artikel sabitleri, `validateWord`, `validateCorpus`, `findDuplicates` |
| `lib/load.mjs` | Tüm `units/*.json`'u çözümlenmiş `{ words, units }` korpusa yükler (id/categoryId/unitId damgalar) |
| `extract.mjs` | Mevcut `data/*.ts` → `units/*.json` (seed) + `curriculum.json` (160 ünite plan, 120 stub) |
| `curriculum.json` | Tüm 160 ünitenin master planı: kategori, ünite no, başlık, tema, alt-konular, seviye profili |
| `audit.mjs` | Korpusu denetler, onarılacak slotları (tekrar eden başsözcükler) `repairs.json`'a yazar |
| `validate.mjs` | Kalite kapısı: şema + tekil id/başsözcük + ünite başı 15 kelime (`--complete` ile 160/20) |
| `compile.mjs` | Korpusu doğrular ve `data/words.ts` + `data/units.ts`'e derler (`--complete` ile tam korpus) |
| `units/seed-*.json` | Mevcut 600 kelimenin ünite dosyaları (id'ler korunur) |
| `units/gen-*.json` | Üretilen yeni kelimelerin ünite dosyaları (id'ler `firstWordId`'den damgalanır) |

## Çok-ajanlı süreç (Workflow)

1. **Faz 2 — Müfredat tasarımı:** Kategori başına bir planlayıcı ajan, `curriculum.json`'daki
   stub üniteler için `title` + `theme` + `subtopics` üretir; mevcut ünitelerle ve birbiriyle
   tema çakışmasını önler. Çıktı şema-doğrulamalı; `curriculum.json` güncellenir.
2. **Faz 3 — Üretim + doğrulama:** Ünite başına bir üretici ajan, `levelProfile`'a ve **kullanılmış
   tüm Almanca başsözcük blocklist'ine** göre 15 kelimeyi şema-doğrulamalı JSON üretir. Bağımsız bir
   doğrulayıcı ajan (native öğretmen merceği) artikel/çeviri/seviye/gramer/tekrar denetler ve düzeltir.
   `repairs.json`'daki tekrar eden seed slotları da burada benzersiz kelimelerle yenilenir.
3. **Global dedup** → `units/*.json` yazılır.

## Yeniden çalıştırma

```bash
# 0) Mevcut veriyi yapılandırılmış forma çıkar (bir kez):
node tools/word-gen/extract.mjs

# 1) Onarılacak (tekrar eden) slotları tespit et:
node tools/word-gen/audit.mjs

# 2) (Workflow) Müfredat + kelime üretimi — units/gen-*.json üretir.

# 3) Her an kaliteyi doğrula:
node tools/word-gen/validate.mjs            # mevcut hali
node tools/word-gen/validate.mjs --complete # tam 160 ünite / 20 kategori beklenir

# 4) Uygulamaya derle:
node tools/word-gen/compile.mjs --complete  # data/words.ts + data/units.ts
```

## Kalite kapıları (hard invariants)

- Her kelime: dolu `german/turkish/example/exampleTranslation`, geçerli `level` (A1–C1).
- "der/die/das X" başsözcüğünde isim büyük harf.
- `synonyms`: başsözcüğün kendisi olamaz, tekrar olamaz, boş olamaz.
- Örnek cümle: gerçek cümle (noktalama ile biter), ≥5 karakter.
- **Global tekil id** ve **global tekil başsözcük** (aynı kelime iki kez öğretilmez).
- Her ünite tam **15 kelime**; `--complete` ile her kategori tam **20 ünite** (toplam 2400 kelime).

`validate` / `compile` herhangi bir ihlalde sıfırdan farklı çıkış kodu döndürür ve derlemeyi reddeder.
