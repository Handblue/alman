# WortKrieg — UI/UX Master Guide

> **Bu dokümanı nasıl kullanacaksın:**
> - `[CODEX]` etiketli bölümler → Codex 5.4'e delege edilecek implementasyon görevleri
> - `[HUMAN]` etiketli bölümler → Tasarım kararları, mimari seçimler, ürün mantığı
> - `[DESIGN]` etiketli bölümler → frontend-design skill prensiplerine göre implement edilecek UI
> - Superpowers ve Codex plugin'leri kurulu değil. Kurulum: `npm i -g superpowers` / `npm i -g @openai/codex-plugin-cc`

---

## Giriş

Bu doküman WortKrieg için doğrudan uygulanabilir bir UI/UX master guide'dır. İki girdiyi birleştiriyor:

- **APK yapısı:** Ürün tek bir pronunciation screen değil; onboarding, seviye testi, kategori/ünite yapısı, çoklu study mode, speaking session, daily challenge, battle, leaderboard, notebook, analytics, profile, offline ve premium katmanı olan tam bir öğrenme ürünü.
- **Referans görseller:** Modern, editorial, kart tabanlı, oyunlaştırılmış ama kullanılabilirliği yüksek bir mobil ürün dili.

**Hedef:** "Güzel ekran" değil — aynı anda yüksek estetik, yüksek görev netliği, düşük bilişsel yük ve iyi teknik performans.

---

## 1. Ürün Tanımı ve Tasarım Hedefi

**Konum:** Pronunciation-first learning ecosystem

Kullanıcı uygulamaya şunları yapmak için geliyor:
- Hızlı günlük pratik başlatmak
- Telaffuzunu kaydedip geri bildirim almak
- Zayıf noktalarını görmek
- İlerleme, streak, XP ve rank ile motive olmak
- Challenge, battle, leaderboard ve arkadaş katmanını kullanmak
- Tekrar, review ve notebook ile öğrenmeyi kalıcı hale getirmek

**Her ekranın ana görevi:** "Şimdi ne yapmalıyım?" sorusunu sıfıra yakın maliyetle cevaplamak.

**Hedef estetik:** Editorial + Premium + Gamified Utility
- Başlıklar güçlü ve karakterli
- Kartlar yumuşak, modern ve premium
- Oyunlaştırma var ama çocukça değil
- Fonksiyonellik hiçbir zaman dekorun arkasında kalmıyor

---

## 2. Başarı Kriterleri

| Metrik | Hedef |
|--------|-------|
| SUS | 82+ |
| NASA-TLX (core speaking flow) | 35/100 ve altı |
| Frustration alt skoru | 20/100 ve altı |
| İlk görev tamamlama oranı | %85+ |
| Pratikten sonuç ekranına geçiş | Yüksek netlik, tek ana CTA |
| Telaffuz sonucu görünme süresi | 1.2 saniye altı |
| Core ekranlarda scroll akıcılığı | 60 fps hedef |

---

## 3. Estetik DNA — Referans Görsellerden Alınacaklar

### 3.1 Büyük ve net başlıklar `[DESIGN]`
Dashboard, Unit detail, Result, Leaderboard, Profile, Daily challenge ekranlarında büyük, güçlü tipografi. Küçük ve çekingen başlık yok.

### 3.2 Kart tabanlı yapı `[DESIGN]`
Ekranlar liste değil, kart kompozisyonu hissi vermeli. Bilgi kümelerini sindirilebilir hale getirir.

### 3.3 Pastel-aksanlı premium renk `[DESIGN]`
Karanlık gövde + açık yüzey + renkli kart kombinasyonu. Renk rastgele dağılmayacak — her renk bir role bağlı.

### 3.4 Oyunlaştırma = bilgi mimarisi `[HUMAN]`
Leaderboard, streak, XP, completion, progress ring → yalnızca süs değil; motivasyon ve yönlendirme aracı.

### 3.5 Havadar boşluk `[DESIGN]`
Yoğunluk düşük, nefes alan bloklar. NASA-TLX için kritik.

### 3.6 Yumuşak köşeler `[DESIGN]`
Keskin/kurumsal dil yerine çağdaş, sıcak, güven veren mobil dil.

---

## 4. Referanslardan Alınmayacaklar

- Her ekranda fazla dekoratif çizim
- Her kartta farklı renk patlaması
- Aşırı büyük görseller yüzünden görev bilgisinin ikinci plana düşmesi
- Çoklu CTA
- Sadece ikonla anlatılan belirsiz aksiyonlar
- Koyu arka plan üstüne düşük kontrast gri metinler
- Gamification'ın öğrenme akışını bastırması

---

## 5. Bilgi Mimarisi `[HUMAN]`

| Katman | İçerik |
|--------|--------|
| Learn | Dashboard, explore, categories, units, word list, study modes |
| Speak | Pronunciation, speaking session, matching, speaking review |
| Community | Daily challenge, challenges, battle, leaderboard, friends, study groups |
| Personal | Notebook, achievements, analytics, statistics, profile, settings, notifications, offline, premium |

**Ana navigasyon:** Home / Learn / Speak / Community / Profile

Kritik kararlar:
- **Speak** ürünün kalbidir — alt nav'da ortadaki baskın sekme veya görsel olarak güçlü olmalı
- **Community** ayrı bir dünya olarak konumlanmalı; battle ve leaderboard core learning flow'un üstüne binmemeli
- **Notebook** ayrı sekme olmak zorunda değil; Learn ve sonuç ekranlarından erişilebilen yardımcı alan olabilir

### 5.1 Progressive Disclosure `[HUMAN]`
- Gün 1: Onboarding, level test, first unit, speaking demo, dashboard
- Gün 2–3: Daily challenge
- Erken başarı sonrası: Notebook ve weak words
- Battle / leaderboard / study groups: belirli bir eşikten sonra görünür hale gelsin

---

## 6. Tema Stratejisi `[DESIGN]`

**Yaklaşım:** Hybrid theme architecture (homojen koyu tema yok)

### 6.1 Dark shell — nerede kullanılmalı
- Splash
- Onboarding hero
- Speaking active state
- Battle / versus
- Premium
- Kutlama ve completion anları

### 6.2 Light surfaces — nerede kullanılmalı
- Dashboard
- Explore
- Category / unit browsing
- Notebook
- Analytics
- Profile
- Settings

---

## 7. Renk Sistemi `[CODEX]`

> **Codex görevi:** Token sistemini `colors.ts` veya `theme.ts` dosyasına implement et. Sabit hex değer kullanma, her zaman token üzerinden referans ver.

### 7.1 Çekirdek renkler

| Rol | Değer |
|-----|-------|
| Brand Ink | `#0D1B2A` |
| Ink Secondary | `#16263D` |
| Surface Dark | `#243447` |
| Surface Light | `#F7F9FC` |
| Card White | `#FFFFFF` |
| Border Soft | `#DCE3EC` |
| Text Primary Dark | `#101828` |
| Text Secondary | `#475467` |
| Text On Dark | `#F8FAFC` |

### 7.2 Accent palette `[CODEX]`

| Kullanım | Token | Öneri |
|----------|-------|-------|
| Learn / Explore | `accent.sky` | `#82B6FF` |
| Speaking | `accent.mint` | `#7EE0C3` |
| Progress / Rank | `accent.violet` | `#6C63FF` |
| Reward / XP | `accent.yellow` | `#F4D96C` |
| Challenge / Battle | `accent.purple` | `#6C63FF` variant |
| Warning | `accent.amber` | `#F59E0B` |
| Error | `accent.coral` | `#EF4444` |
| Success | `accent.green` | `#22C55E` |

### 7.3 Kullanım kuralları
- Bir ekranda en fazla 1 dominant + 1 secondary accent
- Above the fold'da 3'ten fazla doygun renk görünmesin
- Dekoratif line-art elemanlar `%8–12` opacity aralığında
- Başarı/hata/uyarı renkleri yalnızca kritik geri bildirimlerde

---

## 8. Tipografi Sistemi `[CODEX]`

> **Codex görevi:** Type scale'i `typography.ts` veya global stylesheet'e tanımla. Tabular figures için `font-variant-numeric: tabular-nums` ekle.

Modern grotesk ailesi. Inter benzeri sistem iyi çalışır.

### 8.1 Type scale

| Stil | Boyut / satır yüksekliği | Kullanım |
|------|--------------------------|----------|
| Display | 36 / 40 | Hero score, streak, rank, completion |
| H1 | 28 / 34 | Dashboard, unit title, leaderboard header |
| H2 | 22 / 28 | Section heading |
| Title | 18 / 24 | Card titles, modal titles |
| Body | 16 / 24 | Ana metin |
| Body Small | 14 / 20 | Supporting text |
| Meta | 13 / 18 | Chips, labels, helper text |
| Caption | 12 / 16 | Tertiary info |

### 8.2 Weight
Üç ağırlık yeterli: Regular, Medium, Bold. Daha fazlası görsel karmaşa üretir.

### 8.3 Kurallar
- Rakam ağırlıklı ekranlarda tabular figures
- Bir kart içinde 3'ten fazla metin hiyerarşisi açma
- Uzun açıklamaları 2–3 satırla sınırla
- Almanca uzun kelime yapıları için satır kırılmalarını önceden düşün

---

## 9. Grid, Spacing ve Geometri `[CODEX]`

> **Codex görevi:** Spacing token'larını `spacing.ts`'e yaz. Tüm bileşenler sabit px değil, bu token'lardan beslensin.

### 9.1 Grid
8pt sistemi.

Ölçekler: `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40`

### 9.2 Ekran yapısı
- Yatay dış boşluk: `16`
- Section arası: `24–32`
- Kart iç padding: `16–20`
- İç item arası: `12–16`

### 9.3 Radius sistemi

| Eleman | Radius |
|--------|--------|
| Small element | `12` |
| Standard cards | `16` |
| Hero cards | `20–24` |
| Pills / chips / CTA capsule | `999` |

### 9.4 Elevation
- Light surfaces: tek katmanlı yumuşak shadow
- Dark surfaces: shadow yerine border + tonal separation
- Android performansı için blur-heavy yaklaşım yok

---

## 10. Bileşen Kütüphanesi `[CODEX + DESIGN]`

> **Codex görevi:** Aşağıdaki her bileşen için default, loading, empty, error, disabled ve offline state'leri implement et. Hiçbir bileşen yalnızca happy path ile tamamlanmış sayılmaz.

### 10.1 Hero Card `[CODEX]`
**Kullanım:** Dashboard continue card, featured course, daily challenge, premium highlight, recommended speaking path

İçerik:
- Büyük başlık
- Kısa açıklama
- Progress / time / difficulty
- Tek ana CTA
- Gerekirse çok hafif line-art motif

### 10.2 Content Card `[CODEX]`
**Kullanım:** Ünite kartı, lesson kartı, notebook item, friend / study group, achievement

### 10.3 Stat Card `[CODEX]`
**Kullanım:** Streak, XP, accuracy, rank, completed sessions

Görsel kural:
- Büyük rakam
- Kısa label
- Mümkünse trend işareti

### 10.4 Progress Components `[CODEX]`
Üç tip:
- `LinearProgress` → Browse ekranları
- `CircularProgress` → Result ve profile ekranları
- `StepProgress` → Session üst barı

### 10.5 Buttons `[CODEX]`

**Primary**
- Yükseklik: `52–56`
- Güçlü kontrast
- Ekran başına bir adet

**Secondary**
- Outline veya tonal

**Ghost**
- Düşük öncelikli yardımcı aksiyon

> Kural: Above the fold'da birden fazla eşit önemde CTA görünmesin.

### 10.6 Chips ve Segmented Controls `[CODEX]`
**Kullanım:** Mode filter, category tags, difficulty, ongoing/completed, weekly/all-time

Kural:
- Chip metni her zaman tam okunur
- Sadece renkle aktif/pasif ayrımı yapılmasın (ikon veya label eşlik etsin)

### 10.7 Bottom Navigation `[CODEX]`
- 5 item
- Ortadaki Speak görsel olarak baskın
- İkon + label birlikte
- Aktif durumda: pill veya tonal highlight

### 10.8 Bottom Sheets `[CODEX]`
Filtre, quick action, lesson options ve lightweight settings için kullan. Tam ekran modal yalnızca gerçekten gerekiyorsa.

### 10.9 States — Zorunlu `[CODEX]`
Her ana bileşen ailesinde şunlar şart:
`default / loading / empty / error / disabled / offline`

---

## 11. Speaking Experience — Özel Kurallar `[DESIGN + CODEX]`

Bu ürünün kaderini speaking akışı belirler.

### 11.1 State Machine `[CODEX]`

```
Ready → Listening → Processing → Result → Retry or Continue
```

Her state'in farklı görsel durumu, mikro kopyası ve aksiyon seti olacak.

### 11.2 Ready State `[DESIGN]`
Göster: prompt, model audio, kısa ipucu, büyük mic CTA  
Gösterme: başarı rozetleri, uzun açıklamalar, çoklu secondary aksiyon

### 11.3 Listening State `[DESIGN + CODEX]`
- Aktif mikrofon durumu
- Waveform veya soft input pulse
- Zamanlayıcı veya kayıt göstergesi
- İptal / durdurma aksiyonu

> Kullanıcı "sistem beni şu an dinliyor" bilgisini tek bakışta anlamalı.

### 11.4 Processing State `[DESIGN + CODEX]`
Spinner tek başına yetmez.

Öneri:
- Waveform donar
- Net durum mesajı: "Analyzing your pronunciation"
- 1–2 aşamalı görsel ilerleme

Hedef: kullanıcı gecikmeyi "bug" değil "anlamlı sistem işi" olarak algılamalı.

### 11.5 Result State `[DESIGN]`
Üç seviye: Excellent / Close / Needs work

Sonuç yalnızca skor değil, aksiyonel geri bildirim:
- Hangi kısım iyiydi
- Tek kritik iyileştirme noktası
- Şimdi ne yapmalı

Doğru yaklaşım:
- İlk katmanda tek temel içgörü
- Gelişmiş detay için secondary reveal

Örnek:
- "Başlangıç sesi doğru."
- "Son heceyi daha kısa söyle."
- "Tekrar dene."

### 11.6 Retry Mantığı `[CODEX]`
İki başarısız deneme sonrası sistem destek vermeli:
- Slowed audio
- Hece ayrımı
- Mouth hint / stress hint
- Bir örnek tekrar

---

## 12. Ekran Bazlı UX Rehberi

### 12.1 Onboarding `[DESIGN]`
Akış: ürün değeri → kategori / hedef seçimi → seviye testi → mic izin açıklaması → ilk pratik

Kurallar:
- 3–4 ekrandan fazla sürmesin
- Her ekranda tek karar
- Mic permission OS prompt'tan önce gerekçeli pre-permission ekranı gelsin

### 12.2 Dashboard `[DESIGN + CODEX]`
İçerik sırası:
1. Greeting + streak + avatar
2. Continue where you left off
3. Daily challenge
4. Weak words / recommended practice
5. Community snapshot
6. Achievements / recent gains

İlk ekranın görevi "başlatmak", "keşfettirmek" değil.

### 12.3 Explore / Learn `[DESIGN + CODEX]`
Yapı:
- Featured path hero card
- Category chips
- Featured units
- Short horizontal rails
- Filter/sort bottom sheet

Her kartta: başlık, skill type, süre, difficulty, progress, offline availability

### 12.4 Category / Unit Detail `[CODEX]`
Üst bölüm: ünite teması, kapsadığı beceriler, tahmini süre, tamamlanma yüzdesi, "Start session" CTA  
Alt bölüm: study mode seçimi, word list, notebook shortcut, download for offline

### 12.5 Study Modes `[DESIGN]`
Mode seçimini teknik isimlerle değil, kullanıcı değerine göre anlat:
- Quick review / Pronunciation / Writing / Sentence / Synonym / Mixed

Her mode kartında: ne çalıştırır, ne kadar sürer, hangi zorluk, bugün öneriliyor mu

### 12.6 Speaking Session `[DESIGN]`
- Top bar: progress + close
- Prompt area: büyük ve temiz
- Optional translation / hint
- Audio replay
- Center mic CTA
- Alt alan: helper text veya feedback

**Bu ekranda scroll olmamalı.**

### 12.7 Result / Review `[DESIGN]`
- Büyük başarı göstergesi
- XP veya reward
- İyi yaptığın şey
- Geliştirmen gereken tek şey
- Next best action
- Save to notebook
- Share opsiyonu (ana CTA değil)

### 12.8 Daily Challenge `[DESIGN]`
- Challenge headline
- Time-left chip
- Reward
- Tek ana CTA
- İlerleme durumu

Challenge ekranı öğrenme hedefini gölgelememeli.

### 12.9 Battle / Community `[DESIGN]`
Görsel dil: daha dramatik gradient, avatar ve rank blokları, daha yüksek enerji

Ama yine de:
- Eşleşme bilgisi net
- Skor mantığı anlaşılır
- "Play again" ve "Review mistakes" ayrı aksiyonlar

### 12.10 Leaderboard `[CODEX]`
Üst: benim rank kartım, haftalık / tüm zamanlar toggle, net kazanım mantığı  
Alt: listelenmiş kullanıcılar, friends only filtresi, local / global ayrımı

### 12.11 Notebook `[CODEX]`
Zorunlu:
- Search
- Filter: due / weak / saved / mastered
- Tek tap ile audio replay
- Hızlı review başlatma
- Save/remove state netliği

### 12.12 Profile / Analytics / Statistics `[CODEX]`
- Üstte kimlik + ana metrikler
- Altta: progress / badges / stats segment
- Grafik sayısı sınırlı — her grafik tek soru cevaplasın
- Veriyle etkilemek değil, yönlendirmek

### 12.13 Settings / Offline / Notifications `[CODEX]`
Zorunlu konular:
- Audio permissions
- Speech recognition
- Notification preferences
- Storage / downloads
- Data usage
- Privacy explanation

### 12.14 Premium `[DESIGN]`
En iyi an: doğal bir değeri gördükten sonra (aktif oturum ortasında değil)

Fayda blokları:
- Offline packs
- Advanced insights
- Unlimited speaking credits
- Faster review tools
- Competitive perks

---

## 13. Mikro Kopya ve Ton

Ses: **Net, destekleyici, teknik ama yargılayıcı olmayan**

| Kötü | İyi |
|------|-----|
| "Wrong" | "Yaklaştın" |
| "Failed" | "Başlangıç iyi, son heceyi kısalt" |
| "You said it incorrectly" | "Bir kez daha deneyelim" |

Kurallar:
- Her hata mesajı: "ne oldu + neden olabilir + şimdi ne yapmalı" formatı
- Başarı mesajları kısa ve enerjik
- Aşırı şirin veya çocukça gamification copy'sinden kaçın

---

## 14. Motion ve Haptics `[CODEX]`

### 14.1 Timing değerleri

| Aksiyon | Süre |
|---------|------|
| Screen transition | 220–320 ms |
| Button press | 100–140 ms |
| Success bounce | 180–220 ms |
| Error shake | Kısa ve düşük genlikli |
| Recording pulse | Sürekli ama rahatsız etmeyen ritim |

### 14.2 Motion kullanılacak yerler
- Mic active state
- Completion state
- XP gain
- Card press
- Bottom nav active transition

### 14.3 Motion kullanılmayacak yerler
- Uzun listelerde sürekli hareket
- Analytics ekranlarında dekoratif animasyon
- Birden fazla öğenin eşzamanlı yarışan hareketi

### 14.4 Haptic plan `[CODEX]`
- Recording start: soft impact
- Correct result: light success haptic
- Perfect session: stronger positive haptic
- Error: dikkat çekici ama agresif olmayan uyarı

---

## 15. Erişilebilirlik `[CODEX]`

### 15.1 Kontrast
- Body text: minimum 4.5:1
- Büyük text: minimum 3:1
- Pastel kartlarda siyah veya çok koyu metin
- Dark background üzerinde orta gri metin yok

### 15.2 Dokunma hedefleri
- Minimum: 44×44 pt
- İdeal: 48×48 pt
- Mic button: 72–88 pt

### 15.3 Renk tek sinyal olmasın
Doğru/yanlış/uyarı yalnızca renkle ayrılmasın — ikon, label veya metin eşlik etmeli.

### 15.4 Dynamic type
- Tipografi %130–150 büyütmeye kadar dayanıklı olmalı
- Chip ve segmented controls sabit genişlik yüzünden kırılmamalı

### 15.5 Screen reader `[CODEX]`
Mic durumu, progress, leaderboard rank, result feedback, download durumu ekran okuyucu tarafından doğru okunmalı.

### 15.6 Localization
- Fixed-width text pill'lerden kaçın
- İki satırlık başlık toleransı ver
- Kısaltmaları zorunlu bırakma

---

## 16. Performans Tasarım Rehberi `[CODEX]`

### 16.1 Görsel performans
- Hero card başına tek ana illüstrasyon katmanı
- Raster yerine mümkünse SVG
- Blur-heavy ve çok katmanlı shadow yok
- Gradient sayısı ekran başına kontrollü
- Avatar ve görselleri cache et

### 16.2 Liste performansı `[CODEX]`
Explore, leaderboard, notebook, friends ekranlarında:
- Virtualized list kullan
- Kart bileşenleri memoized olsun
- Aynı kartta gereksiz nested animation yok
- Above/below fold içerik ayrı yüklenebilsin

### 16.3 Veri yükleme stratejisi `[CODEX]`
- Above-the-fold içerik önce
- Secondary rails lazy
- Skeleton kullan
- Kritik CTA loading yüzünden kaymasın

### 16.4 Speaking performansı `[CODEX]`
- Record tap sonrası aktif görsel geri bildirim anlık görünmeli
- Ses kaydı başladı mı sorusu belirsiz kalmamalı
- Analiz sürecinde boş bekleme hissi oluşmamalı
- Skor gecikirse bile kullanıcı state değiştirdiğini görmeli

### 16.5 Offline stratejisi `[CODEX]`
Tasarım gereksinimleri:
- İndirildi badge'i
- Download size göstergesi
- Storage management
- Offline availability indicator
- Sync state

### 16.6 Animasyon performansı `[CODEX]`
- Sürekli çalışan animasyon sayısını sınırla
- Reward anları dışında ağır motion kullanma
- JS thread'e yük bindiren state churn azaltılmalı

---

## 17. Nielsen Heuristics — Zorunlu Kurallar

### 17.1 Visibility of system status `[CODEX]`
Her zaman görünür: recording başladı mı, analyzing sürüyor mu, download tamamlandı mı, streak arttı mı, battle sonucu ne oldu

### 17.2 Match between system and real world
Teknik sistem dili değil, görev dili:
- Dinle / Tekrar et / Yaklaştın / Bu sesi uzat / Şimdi devam et

### 17.3 User control and freedom `[CODEX]`
Mutlaka mevcut olacak: retry, skip, exit and resume later, save or dismiss, undo for notebook save/remove

### 17.4 Consistency `[CODEX]`
Aynı bileşen aynı davranmalı: tüm result card'lar, progress göstergeleri, chips, nav davranışı, empty/error state kurgusu

### 17.5 Error prevention `[CODEX]`
- Mic izni yoksa record CTA aktif görünmesin
- Offline değilken online-only flow'lar önceden işaretlensin
- Premium gate sürpriz yaratmasın
- Destructive aksiyonlar confirm gerektirsin

### 17.6 Recognition rather than recall
- Prompt görünür kalmalı
- Önceki deneme sonucu gerektiğinde görünmeli
- Weak words ve due items açık etiketlenmeli

### 17.7 Aesthetic and minimalist design
Minimalizm bilgi saklamak değildir. Ekranda az şey olmalı ama olan şeyler tam anlamlı olmalı.

---

## 18. NASA-TLX Optimizasyon Stratejisi

Workload en çok şu noktalarda yükselir: level test, speaking session, result interpretation, battle flow.

### 18.1 Mental demand düşürmek `[DESIGN]`
- Bir ekranda bir ana görev
- Helper text tek cümle
- Aynı anda tek önemli geri bildirim
- Gelişmiş detaylar katmanlı açılımda

### 18.2 Effort düşürmek `[DESIGN]`
- One-thumb reach
- Alt nav netliği
- Büyük CTA
- Otomatik devam önerileri

### 18.3 Frustration düşürmek
- Hızlı sistem geri bildirimi
- Retry sonrası destekleyici yardım
- Belirsiz loading durumlarının kaldırılması
- Çok erken battle veya karmaşık stats göstermeme

### 18.4 Performance algısını yükseltmek `[DESIGN]`
- Sonucu yalnızca puan olarak değil, anlamlı içgörü olarak ver
- Kullanıcıya "ilerlediğini" açıkça göster
- Küçük kazanımları görünür kıl

---

## 19. SUS'i Yükseltecek Prensipler

Temel kararlar:
- Home ekranında tek baskın devam aksiyonu
- Speak akışında scroll olmaması
- Ayarlar ve yardımcı özelliklerin sade gruplanması
- Tüm state'lerin açık temsili
- Aynı etkileşim deseninin ürün geneline yayılması

---

## 20. Ölçüm ve Test Planı `[HUMAN]`

### 20.1 NASA-TLX test senaryoları
1. İlk onboarding + ilk speaking denemesi
2. Günlük practice session
3. Daily challenge veya battle katılımı

### 20.2 SUS test planı
Kullanıcıya 3–5 görev: bir dersi başlat → bir telaffuz denemesi tamamla → sonucu yorumla → notebook'a ekle → leaderboard'a bak. Sonrasında SUS uygula.

### 20.3 Heuristic audit checklist `[HUMAN]`
Her release öncesi:
- [ ] Sistem durumu görünür mü
- [ ] Sıradaki adım net mi
- [ ] Hata toparlama mümkün mü
- [ ] Navigasyon tahmin edilebilir mi
- [ ] Ekran yükü fazla mı
- [ ] Birincil ve ikincil aksiyon ayrımı net mi

### 20.4 Event instrumentation `[CODEX]`
Takip edilecek olaylar:
```
onboarding_started / completed
mic_permission_granted / denied
recording_started / stopped
pronunciation_scored
retry_used
session_completed
notebook_saved
challenge_joined
battle_started / finished
leaderboard_opened
premium_viewed / subscribed
```

---

## 21. Uygulama Yol Haritası

### Faz 1 — Foundation `[CODEX + DESIGN]`
Önce bunlar tamamlanmadan üst düzey polish yapılmasın:
- Bilgi mimarisi netliği
- Theme architecture
- Token sistemi
- Bottom nav
- Speaking state machine
- Result card
- Empty/error/loading halleri
- Permission flow

### Faz 2 — Retention ve Community `[CODEX]`
- Notebook güçlendirme
- Daily challenge
- Battle onboarding
- Leaderboard
- Streak ve reward tasarımı
- Analytics basitleştirme

### Faz 3 — Premium polish `[DESIGN]`
- Motion refinement
- Personalization
- Smarter recommendations
- Premium upsell optimization
- Share flows
- Visual illustration layer refinement

---

## 22. Definition of Done

1. Hiçbir ekran yalnızca happy path ile tasarlanmış olmayacak.
2. Her ekranda: default, loading, empty, error ve gerekiyorsa offline state olacak.
3. Above the fold'da tek ana CTA olacak.
4. Speaking akışı scroll içermeyecek.
5. Her sonuç ekranı kullanıcıya bir sonraki doğru hareketi söyleyecek.
6. Hiçbir kritik bilgi yalnızca renkle anlatılmayacak.
7. Tüm kart bileşenleri küçük ekran ve uzun lokalize metinlerle test edilecek.
8. Light browse + dark immersive dengesi korunacak.
9. Community özellikleri core learning flow'u boğmayacak.
10. Görsel kalite performans bütçesini aşmayacak.

---

## 23. Net Tasarım Kararı `[HUMAN]`

| Alan | Görsel Dil |
|------|------------|
| Browse / Learn | Açık yüzey, büyük tipografi, pastel-aksanlı kartlar, bol boşluk |
| Speak / Battle | Koyu, odaklı, sinematik, güçlü geri bildirim |
| Result / Progress | Güçlü numerik hiyerarşi, circular progress, XP, tek cümlelik aksiyon önerisi |
| Community | Purple/indigo eksenli, daha enerjik görsel dil |
| Sistem geneli | Tekdüze değil ama aynı aileden gelen tasarım dili |

---

## Ek: Plugin Kontrol Durumu

| Plugin | Durum |
|--------|-------|
| [superpowers](https://github.com/obra/superpowers) | ❌ Kurulu değil — `npm i -g superpowers` |
| [codex-plugin-cc](https://github.com/openai/codex-plugin-cc) | ❌ Kurulu değil — `npm i -g @openai/codex-plugin-cc` |

Kurulum yapılmadan Codex görevlerini çalıştıramazsın.

---

*Sonraki adım: Bu guide'a göre her route'u tek tek revize etmek — dashboard, explore, unit detail, speaking session, result, leaderboard, profile, notebook, premium.*
