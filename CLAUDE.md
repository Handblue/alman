# CLAUDE.md — WortKrieg Proje Rehberi

> **Sürüm:** 1.0 | **Tarih:** Mart 2026
> **Kaynak Dokümanlar:** Product Guide v3.0, UI Design Guide v2.0, QA & Test Araştırması
> **Platform:** iOS + Android (React Native / Flutter)
> **Gizlilik:** İç Kullanım

---

## 1. Proje Özeti

WortKrieg, Almanca öğrenimini gamification + sosyal topluluk odaklı bir savaş alanına dönüştüren mobil dil öğrenme uygulamasıdır. v3.0 ile birlikte arkadaş sistemi, keşfet ekranı, günlük meydan okuma, sesli telaffuz, kelime defteri, widget desteği ve offline mod eklenerek ürün kapsamlı bir öğrenme ekosistemine dönüştürülmüştür.

### 1.1 Hedef Kitle

| Segment | Tanım | v3 Odak Özelliği |
|---------|-------|-------------------|
| Almanca öğrencileri (TR) | A1-C1, üniversite/kurs | Günlük Meydan Okuma + Battle |
| Goethe/telc adayları | Sınav hazırlığı | Keşfet – sınav özel içerik vitrini |
| Almanya diaspora (TR) | Günlük Almanca | Widget + Offline + Sesli telaffuz |
| Sosyal öğreniciler | Grup/arkadaşla öğrenme | Arkadaş sistemi + liste paylaşımı |
| Akademik/Felsefe | Derinlemesine öğrenme | Kelime defteri + özel listeler |

### 1.2 Teknoloji Yığını

- **Frontend:** React Native / Flutter (iOS + Android)
- **Backend:** Node.js (NestJS) + Python (FastAPI)
- **Real-time Battle:** WebSocket (Socket.io)
- **Konuşma P2P:** WebRTC
- **Telaffuz Değerlendirme:** Google Speech-to-Text / AWS Transcribe
- **TTS:** Google Cloud TTS (Almanca)
- **Offline Storage:** React Native MMKV / SQLite
- **Widget:** iOS WidgetKit / Android Glance
- **Monetizasyon:** Freemium + AdMob + App Store/Google Play Subscriptions
- **Analytics:** Firebase Analytics

---

## 2. İçerik Mimarisi

### 2.1 Sistem Kategorileri (8 Kategori)

| # | Kategori | Açıklama | Ünite | Kelime/Ünite |
|---|----------|----------|-------|--------------|
| 1 | A1 Kelimeler | Temel A1 sözcük bilgisi (isim+sıfat+zarf+fiil) | 20 | 15 |
| 2 | A1–C1 Gramer & Kelime | Seviye seviye kapsamlı içerik | 20 | 15 |
| 3 | Goethe Sınav Hazırlık | Goethe çıkmış soru formatı | 20 | 15 |
| 4 | telc Sınav Hazırlık | telc çıkmış soru formatı | 20 | 15 |
| 5 | Günlük Hayat Almancası | Market, doktor, banka, ulaşım | 20 | 15 |
| 6 | Akademik Almanca | Üniversite, tez, makale terminolojisi | 20 | 15 |
| 7 | Felsefe Almancası | Felsefi kavramlar, terminoloji | 20 | 15 |
| 8 | Deyimler & İfadeler | Redewendungen, konuşma kalıpları | 20 | 15 |

**Toplam:** 160 ünite × 15 kelime = 2.400 kelime + 2.400 görsel + 2.400 ses dosyası

### 2.2 Çalışma Modları (6 Mod)

| # | Mod | Açıklama | Geçme Eşiği | Premium? |
|---|-----|----------|-------------|----------|
| 1 | Flashcard (Start Studying) | Kelime kartı + öz değerlendirme | Tüm kelimeler ≥ Biraz | Hayır |
| 2 | Multiple Choice | Çoktan seçmeli, 15 soru | 15'te 12 doğru | Hayır |
| 3 | Writing Test | Klavyeyle yazma, Levenshtein toleransı | 15'te 10 doğru | Hayır |
| 4 | Word in Sentence | Boşluk doldurma, bağlam öğrenimi | 15'te 10 doğru | Hayır |
| 5 | Synonym Study | Eş anlamlı bulma | 15'te 8 doğru | Hayır |
| 6 | Sesli Telaffuz (YENİ) | AI değerlendirmeli telaffuz, 1-5 yıldız | Ort. 3+ yıldız | PREMİUM |

### 2.3 Spaced Repetition

| Öz Değerlendirme | Anlamı | Tekrar Aralığı |
|-------------------|--------|----------------|
| Bilmiyorum | Hiç bilmiyorum | 1 gün |
| Biraz | Tanıdık ama emin değilim | 3 gün |
| Öğrendim | İyi biliyorum | 7 → 14 → 30 gün (katlanan) |

### 2.4 Kelime Defteri (Vocabulary Notebook)

- Herhangi bir ekranda kalp/yıldız ikonuyla kelime defterine ekleme
- Filtreleme: Seviye (A1-C1) | Kategori | Öğrenme durumu | Tarih
- "Sadece defterimdeki kelimelerle quiz" — tek tıkla çalışma başlatma
- Defter kelimeleri spaced repetition havuzuna girer
- Defterdeki kelimeler özel klasöre dönüştürülebilir

---

## 3. Gamification Sistemi

### 3.1 XP Puan Sistemi

| Aktivite | XP | Not |
|----------|-----|-----|
| Flashcard tamamlama | +50 | Per ünite |
| Quiz soru doğru | +10 | Her doğru |
| Quiz streak bonusu (5 ardışık) | +25 | Bonus |
| Ünite tamamlama (5 mod) | +200 | Seviye çarpanıyla |
| Sesli Telaffuz (5 kelime) | +40 | Premium |
| Battle kazanma | +200 | ELO çarpanıyla |
| Battle kaybetme | +50 | Katılım |
| Günlük Meydan Okuma | +75 | Her gün |
| Günlük giriş | +20 | Streak ile artar |
| Konuşma pratiği (7 dk) | +300 | Tamamlama bonusu |
| Kelime defterine ekleme (10+) | +20 | Defter teşviki |
| Özel liste paylaşma | +50 | Sosyal teşvik |
| Arkadaş kazanma (referral) | +100 | Referral ödülü |

### 3.2 Günlük Meydan Okuma (Daily Challenge)

- Her gün 00:00'da 5 yeni soru yayınlanır (karışık seviye)
- Süre sınırı: 24 saat
- Tamamlama ödülü: +75 XP + günlük rozet + streak korunur
- Kıyaslama: "Bugünkü challengeyi %67 kullanıcı tamamladı"
- Arkadaş kıyaslaması: "Arkadaşın 5/5 yaptı, sen?"
- Widget'ta görünür

### 3.3 Streak Sistemi

- Günlük giriş + en az 1 aktivite streak'i devam ettirir
- 7 gün: 1.2x XP çarpanı | 30 gün: 1.5x XP çarpanı
- Streak freeze: Premium'a ayda 1 ücretsiz

### 3.4 Başarım Rozetleri

| Rozet | Koşul | XP |
|-------|-------|-----|
| İlk Adım | İlk ünite tamamla | +50 |
| Kelime Avcısı | 100 kelime öğren | +200 |
| Liste Ustası | 3 özel klasör + paylaş | +150 |
| Sosyal Savaşçı | 5 arkadaş ekle | +100 |
| Challenge Şampiyonu | 7 gün üst üste Günlük Meydan Okuma | +400 |
| Hafta Savaşçısı | 7 gün ard arda giriş | +300 |
| Battle Master | 10 battle kazan | +500 |
| Telaffuz Ustası | 50 kelime 4+ yıldız telaffuz | +350 |
| Poliglot | Tüm A1 ünitelerini tamamla | +1000 |
| Konuşma Ustası | 10 konuşma pratiği | +750 |
| Efsane | Tüm kategoriler tamamlandı | +5000 |

---

## 4. Sosyal Sistem & Topluluk

### 4.1 Arkadaş Sistemi

- Kullanıcı adı veya QR kod ile arkadaş ekleme
- Follow / Unfollow sistemi (tek yönlü veya karşılıklı)
- Arkadaşın günlük XP, streak ve battle istatistiklerini görme
- Direkt Battle Daveti
- Arkadaşlar arası mini leaderboard

**Gizlilik Kontrolü:**
- Profil görünürlüğü: Herkese açık / Sadece arkadaşlar / Gizli
- Arkadaş ekleme izni: Herkesten / Sadece ortak arkadaşlardan
- Battle daveti engelleme seçeneği

### 4.2 Klasör Paylaşımı

- Deep link sistemi: `wortkrieg.app/list/abc123`
- WhatsApp, Telegram, sosyal medya paylaşımı
- "Bu listeyi klasörlerime ekle" butonu ile tek tıkla kopyalama
- Kopyalanma sayısı takibi

### 4.3 Keşfet (Explore) Ekranı

- **Bölüm 1:** Öne Çıkan Kategoriler — Yatay kaydırılır büyük renkli kartlar
- **Bölüm 2:** Sınav Hazırlık Vitrini — Goethe / telc özel içerik
- **Bölüm 3:** Popüler Topluluk Listeleri — En çok kopyalanan listeler
- **Bölüm 4:** Haftanın Öğretmeni — Top XP kullanıcının tavsiye listesi
- **Bölüm 5:** Yeni Eklenenler — Son içerik güncellemeleri
- Arama: Kategori, klasör adı, kelime

### 4.4 Referral Programı

- Arkadaş kayıt olup ilk üniteyi tamamlarınca: +100 XP + 1 hafta Premium
- 3 arkadaşı dahil eden: 1 ay Premium + özel rozet
- Davet linki: `wortkrieg.app/invite/[user-code]`

---

## 5. Battle Sistemi

### 5.1 Battle Akışı

1. Battle tab'a tıkla
2. Seviye seç (A1/A2/B1/B2/C1 veya "Benim Seviyem")
3. "Rakip Bul" (veya arkadaşa direkt davet)
4. Matchmaking: Aynı ELO ±2 seviye, maks 30 sn
5. 3-2-1 geri sayım
6. 10 soru, 10 sn/soru, canlı skor
7. Sonuç: XP + konuşma hakkı bildirimi

### 5.2 Battle Modları

| Mod | Açıklama | Erişim |
|-----|----------|--------|
| Ranked Battle | ELO sistemi, sıralama etkiler | Herkese açık (1/gün ücretsiz) |
| Arkadaş Battle | Direkt davet, ELO etkilemez | Herkese açık |
| Practice Battle | Sıralamayı etkilemez, pratik | Premium |

### 5.3 Cold Start: AI Bot Rakipler

- Kullanıcı havuzu < 200 aktif ise: AI bot rakip eşleştirilir
- Bot profil ismi + avatarla sunulur, profilde "[Pratik]" etiketi
- Bot zorluğu: Son 10 battle ortalamasına göre ayarlanır
- Bot battle'lar ELO'yu etkilemez ama XP verir

### 5.4 ELO Matchmaking

- Orijinal satranç ELO sistemi adapte edilmiş
- K-Faktörü: Yeni oyuncular için yüksek, tecrübeli oyuncular için düşük
- Asimetrik K-Faktörü analizi gerekli (uzun vadeli puan enflasyonu riski)
- Monte Carlo simülasyonları ile doğrulama (100.000+ simüle maç)
- Smurfing ve ELO Hell algısına karşı davranışsal veri analizi

---

## 6. Konuşma Pratiği Sistemi

### 6.1 Hak Kazanma

| Kaynak | Kazanılan Hak | Not |
|--------|---------------|-----|
| Battle KAZANMA (Ranked) | +3 dakika | Her kazanışta |
| Günlük Meydan Okuma (5/5) | +1 dakika | Her gün |
| Premium bonus | +3 dakika/gün | Premium pasif gelir |
| 7 dakika birikince | Eşleşme hazır | Sistem bildirim gönderir |

### 6.2 WebRTC P2P Akışı

1. 7 dk birikti → Push bildirimi
2. "Başlat" butonu
3. Seviye eşleşme (signaling server)
4. STUN/TURN ile NAT traversal
5. P2P ses bağlantısı + 7 dk timer + konu önerisi
6. Süre dolunca bağlantı kapatılır
7. Karşılıklı değerlendirme (1-5 yıldız) → +300 XP

### 6.3 Sesli Telaffuz Kontrolü (Premium)

- Flashcard'da mikrofon ikonuyla aktive edilir
- 3 saniye kayıt penceresi
- STT ile fonemik benzerlik skoru: 1-5 yıldız
- 3 yıldız altı: "Tekrar dene" + referans TTS sesi
- Freemium'da: İkon gözükür ama tıklayınca premium upsell

---

## 7. Monetizasyon Stratejisi

### 7.1 Freemium vs Premium

| Özellik | Ücretsiz | Premium |
|---------|----------|---------|
| Sistem Kategorileri | Tümü | Tümü |
| Özel Klasör | 3 klasör, 50 kelime/klasör | Sınırsız |
| Çalışma Modu | 5 mod | 6 mod (Sesli Telaffuz dahil) |
| Kelime Defteri | Maks 30 kelime | Sınırsız |
| Günlük Meydan Okuma | Evet | Evet + ekstra XP |
| Ranked Battle | 1/gün | Sınırsız |
| Practice Battle | Hayır | Evet |
| Liste Paylaşma | Hayır | Evet |
| Offline Mod | Hayır | Evet |
| Widget | Temel | Gelişmiş |
| Reklamlar | Banner + Interstitial | Tamamen reklamsız |
| Streak Freeze | Hayır | Ayda 1 |

### 7.2 Fiyatlandırma

| Bölge | Aylık | Yıllık |
|-------|-------|--------|
| Türkiye | 79 TL/ay | 499 TL/yıl |
| Almanya / AB | €4.99/ay | €29.99/yıl |
| ABD | $4.99/ay | $29.99/yıl |

- 7 günlük ücretsiz deneme süresi
- Öğrenci indirimi: %30 (edu e-posta doğrulaması)

### 7.3 Reklam Stratejisi (Sadece Ücretsiz)

| Reklam Tipi | Konum | Frekans | YOK Olduğu Yerler |
|-------------|-------|---------|---------------------|
| Banner | Dashboard altı, kategori listesi | Her zaman | Quiz, battle, flashcard, konuşma |
| Interstitial | Ünite/battle SONRASI | Maks 1/5 dk | Soru arasında, onboarding |
| Rewarded | Battle hakkı bittiğinde (gönüllü) | Maks 3/gün | Zorla gösterilmez |

---

## 8. UI Design System

### 8.1 Renk Paleti

| Token | HEX | Kullanım |
|-------|-----|----------|
| color-brand-primary | #1A73E8 | CTA buton, aktif eleman, link |
| color-brand-dark | #0D47A1 | Header, logo, başlık vurgu |
| color-battle-purple | #7C4DFF | Battle, VS ekranı, leaderboard |
| color-accent-orange | #FF6D00 | XP, streak, dikkat çeken CTA |
| color-accent-gold | #FFD700 | Premium badge, taç, 1. sıra |
| color-success | #2E7D32 | Doğru cevap, tamamlama |
| color-error | #FF5252 | Yanlış cevap, silme, hata |
| color-warning | #FFB300 | İlerleme barı, devam eden durum |
| color-info | #00BCD4 | Tooltip, öneri, bilgi |
| color-bg-primary (dark) | #0D1B2A | Ana arka plan (dark) |
| color-bg-primary (light) | #FAFAFA | Ana arka plan (light) |
| color-bg-card (dark) | #243447 | Kart arka planı (dark) |
| color-bg-card (light) | #FFFFFF | Kart arka planı (light) |
| color-text-primary (dark) | #FFFFFF | Ana metin (dark) |
| color-text-primary (light) | #212121 | Ana metin (light) |
| color-text-secondary | #B0BEC5 / #757575 | Yardımcı metin |
| color-word-green | #4CAF50 | Almanca kelime vurgusu |

### 8.2 Gradientler

| Gradient | Başlangıç | Bitiş | Kullanım |
|----------|-----------|-------|----------|
| battle-gradient | #7C4DFF | #00BCD4 | VS ekranı çapraz split |
| leaderboard-gradient | #512DA8 | #7C4DFF | Leaderboard header |
| quiz-result-gradient | #7C4DFF | #448AFF | Quiz/battle sonuç |
| cta-gradient | #1A73E8 | #00BCD4 | Ana CTA buton |
| daily-challenge-gradient | #2E7D32 | #00BCD4 | Günlük hedef bannerı |
| explore-hero-gradient | #FF6D00 | #FFCA28 | Keşfet öne çıkan kart |
| premium-gradient | #FFD700 | #FFC107 | Premium badge, taç |

### 8.3 Tipografi

| Stil | Font | Weight | Size | Kullanım |
|------|------|--------|------|----------|
| text-hero | Inter | 800 | 32-40px | Ekran başlığı |
| text-heading-1 | Inter | 700 | 24-28px | Bölüm başlıkları |
| text-heading-2 | Inter | 600 | 20-22px | Kart başlığı, klasör adı |
| text-body-lg | Inter | 400 | 18px | Kelime anlamı, açıklama |
| text-body | Inter | 400 | 16px | Standart metin |
| text-body-sm | Inter | 400 | 14px | Yardımcı metin, tarih |
| text-caption | Inter | 500 | 12px | Etiket, badge, chip |
| text-word | Inter | 700 | 20-22px | Almanca kelime (#4CAF50) |
| text-score | Inter | 800 | 36-48px | Skor, XP sayısı |
| text-timer | Inter | 800 | 28px | Battle timer |

### 8.4 Component Tokens

| Component | Border Radius | Shadow | Min. Dokunma Alanı |
|-----------|--------------|--------|---------------------|
| Kart | 16px | Level 1 | – |
| CTA Buton | 12px | Level 2 | 44x44px (iOS) / 48dp (And.) |
| Chip/Badge | 20px (pill) | None | 32x32px min |
| Avatar | 50% (daire) | Level 1 | 44x44px |
| Input | 12px | None (outline focus) | 48px yükseklik |
| Bottom Sheet | 24px (üst köşeler) | Level 3 | – |
| Modal | 20px | Level 4 | – |
| Tab Bar | 0 | Level 3 + blur | 56px yükseklik |

### 8.5 Spacing Tokens

| Token | Değer | Kullanım |
|-------|-------|----------|
| space-2 | 2px | İnce çizgi, minimal offset |
| space-4 | 4px | İkon-metin arası, chip içi |
| space-8 | 8px | Satır arası, küçük padding |
| space-12 | 12px | Kart içi kompakt padding |
| space-16 | 16px | Standart kart padding |
| space-20 | 20px | Ekran kenar boşluğu |
| space-24 | 24px | Bölüm arası, header padding |
| space-32 | 32px | Büyük bölüm ayrıcı |
| space-48 | 48px | Hero alanı padding |
| space-64 | 64px | Tam sayfa yatay ortalama |

---

## 9. Ekran Spesifikasyonları

### 9.1 Ana Ekranlar Listesi (38 Ekran)

**Onboarding (4 ekran):** Splash, Welcome, Seviye Testi, Kategori Seçimi
**Dashboard & Lists:** Dashboard, Kategori Detay, Ünite Detay, Kelime Listesi
**Word Cards:** Bottom Sheet detay, Flashcard, Çoktan Seçmeli, Yazı Testi, Cümle, Eş Anlamlı
**Voice & Notebook:** Sesli Telaffuz, Kelime Defteri, Bookmark akışı
**Battle:** Lobby, VS ekranı, Soru, Sonuç, Geçmiş
**Social & Explore:** Keşfet, Arkadaş sistemi, Profil, Arkadaş leaderboard
**Leaderboard & Profile:** Podyum, Profil detay, İstatistik, Başarımlar
**Speaking:** Konuşma hakkı, Partner arama, Konuşma ekranı, Değerlendirme
**Settings & Subscription:** Ayarlar, Abonelik, Bildirim tercihleri, Offline İndirme
**Widgets:** Small, Medium, Large widget (iOS + Android)
**Daily Challenge:** Challenge kartı, soru ekranı, sonuç
**Notifications & Ads:** Bildirim örnekleri, Banner/Interstitial/Rewarded yerleşim

### 9.2 Dashboard Yapısı

- Profil avatarı + seviye bilgisi (üst sol)
- Günlük Hedef Kartı (progress bar)
- "Bugünün Savaşı" (Daily Challenge mini kartı)
- Son çalışılan ünite kartları (yatay scroll)
- Keşfet butonu (üst sağ, pusula ikonu)
- Kelime Defteri hızlı erişim (kalp ikonlu kart)
- Arkadaş aktivitesi feed'i (scroll'da görünür)

### 9.3 Widget Tasarımı

| Widget | İçerik | Premium? |
|--------|--------|----------|
| Small (2x2) | Bugünün kelimesi + 🔥 streak | Hayır |
| Medium (2x4) | Kelime + anlam + günlük hedef progress + streak + XP | Hayır |
| Large (4x4) | Orta widget + win rate + haftalık sıra + Daily Challenge | PREMİUM |

---

## 10. Erişilebilirlik (Accessibility)

### 10.1 WCAG 2.1 AA Uyumu

- Renk kontrastı: 4.5:1 (metin), 3:1 (büyük metin)
- Dokunmatik hedef: Min 44x44px (iOS) / 48x48dp (Android)
- Dynamic Type desteği (sistem font ayarına saygı)
- Reduced Motion: Sistem ayarı takip edilir
- VoiceOver (iOS) ve TalkBack (Android) tam uyum
- Tüm butonlar için accessibility label

### 10.2 Renk Bağımlılığı Kontrolü

| Durum | Renk | Ek Gösterge (Zorunlu) |
|-------|------|-----------------------|
| Doğru cevap | Yeşil (#2E7D32) | ✓ Çek ikonu + "Doğru!" metni |
| Yanlış cevap | Kırmızı (#FF5252) | ✗ Çarpı ikonu + "Yanlış, doğru cevap: [x]" |
| Tamamlanan ünite | Yeşil daire | Çek ikonu + "Tamamlandı" etiketi |
| Kilitli ünite | Gri | Kilit ikonu + "Kilitli" etiketi |
| Premium özellik | Amber/gold | Taç ikonu + "Premium" chip |

### 10.3 Kontrast Kontrol Tablosu

| Eleman | Arka Plan | Metin/İkon | Kontrast | WCAG |
|--------|-----------|------------|----------|------|
| Body (dark) | #0D1B2A | #FFFFFF | 15.8:1 | AAA ✓ |
| Body (light) | #FAFAFA | #212121 | 16.1:1 | AAA ✓ |
| Almanca kelime (dark) | #243447 | #4CAF50 | 4.9:1 | AA ✓ |
| CTA buton | #1A73E8 | #FFFFFF | 4.6:1 | AA ✓ |
| Hata kırmızısı | #FF5252 | #FFFFFF | 4.1:1 | AA ✓ (büyük) |
| Battle purple | #7C4DFF | #FFFFFF | 5.2:1 | AA ✓ |

---

## 11. Animasyonlar & Mikro Etkileşimler

| Durum | Animasyon | Süre | Detay |
|-------|-----------|------|-------|
| Doğru cevap | Yeşil flash + ✓ scale-up | 400ms | Haptic (medium) |
| Yanlış cevap | Kırmızı flash + ✗ shake | 400ms | Haptic (error) |
| XP kazanma | Sayı yukarı count + pulse | 600ms | Ses efekti |
| Ünite tamamlama | Konfeti + kupa bounce | 1200ms | Lottie |
| Bookmark ekleme | Kalp ikonu dolum + pulse | 400ms | Haptic (light) |
| Daily challenge tamamlama | Mini konfeti + badge zıplayış | 800ms | – |
| Telaffuz başarılı | Yıldızlar birer birer dolar | 600ms | Ses + haptic |
| Arkadaş bağlantı kabulü | İki avatar yakınlaşır | 600ms | Lottie |
| Offline mod devreye girişi | Wifi ikonu → kapalı | 500ms | Amber banner |

### Reduced Motion Alternatifleri

| Normal | Reduced Motion |
|--------|----------------|
| Konfeti yağmuru | Ani renk değişimi + tebrik mesajı |
| Kupa bounce | Statik kupa + fade-in tebrik |
| Battle VS şimşek | Statik VS dairesi + renk flash |
| XP sayı artışı | Anında son sayıyı göster |
| Skeleton shimmer | Statik gri placeholder |

---

## 12. Bildirim Stratejisi

**Temel Kural:** Günde maks 1 push (acil battle daveti hariç). Az ama etkili.

| Bildirim | Tetik | Zaman | Kopya Örneği |
|----------|-------|-------|-------------|
| Streak Hatırlatma | Bugün giriş yok + streak ≥4 | 19:00 | "Savaşçı, 8 günlük serini kaybetme!" |
| Daily Challenge | Tamamlanmadı + streak ≥3 | 12:00 | "Bugünün savaşı seni bekliyor!" |
| Konuşma Hakkı | 7 dk doldu | Anında | "7 dakikan doldu! Konuşma zamanı." |
| Battle Daveti | Arkadaş davet etti | Anında | "[Ad] seni battle'a çağırıyor!" |
| Haftalık Özet | Pazar | 10:00 | "Bu hafta 47 kelime! Raporun hazır." |

**Akıllı Kurallar:**
- Sessiz saatler: 22:00–08:00
- 3 gün tepki yoksa frekans yarıya, 7 günde durdur
- Yeni kullanıcı: İlk 3 gün hiç push yok
- Her bildirim türü ayrı ayrı kapatılabilir

---

## 13. Kalite Güvence & Test Mimarisi

### 13.1 Test Uzmanı Yetkinlik Alanları

| Yetkinlik | Araçlar | Uygulama Alanı |
|-----------|---------|----------------|
| Gerçek Zamanlı Ağ Testleri | Charles Proxy, Wireshark, NetSim | WebSocket battle + WebRTC ses testleri |
| AI & Ses İşleme Analizi | Python, WER/PER/PESQ metrikleri | Sesli Telaffuz doğruluk testleri |
| Çevrimdışı Veri Yönetimi | SQLite, MMKV debug | Offline sync çakışma testleri |
| Mobil Güvenlik | Burp Suite, Frida, OWASP MASVS | Premium içerik koruması, API güvenliği |
| UI Otomasyon | Appium, Maestro, React Native Profiler | 60 FPS doğrulama, SUS anketi |
| Erişilebilirlik (a11y) | VoiceOver, TalkBack, axe DevTools | WCAG AA uyumluluk testleri |

### 13.2 Battle Sistemi Test Senaryoları

| Senaryo | Simülasyon | Başarı Kriteri |
|---------|------------|----------------|
| Mesaj Sıralaması | Paket sırasının bozulması | Geçersiz paketleri tespit, yeniden senkronize |
| Kopma & Yeniden Bağlanma | Wi-Fi → hücresel geçiş | Timeout süresi, kaldığı yerden devam |
| Eşzamanlılık Stresi | 00:00 Daily Challenge spike | Asenkron işleme, kaynak eşikleri |
| Hatalı Yük / Güvenlik | Sahte WebSocket paketleri | Server-authoritative filtreleme |
| XP & Streak Çakışması | Offline cihaz saati vs sunucu | Sunucu zaman damgası kullanımı |

### 13.3 SUS (System Usability Scale) Hedefi

**Hedef: 80+ ("Excellent" kategorisi)**

| SUS Skor | Kategori | Yorum |
|----------|----------|-------|
| 90-100 | Best Imaginable | Mükemmel — nadir |
| 80-90 | Excellent | Hedefimiz |
| 70-80 | Good | Kabul edilebilir |
| 60-70 | Okay | Revizyon şart |
| < 60 | Poor | Baştan planlama |

### 13.4 Usability Test Senaryoları

1. "Uygulamaya ilk kez girdiniz. Ne yaparsınız?"
2. "A1 kategorisinde ilk üniteyi tamamlayın."
3. "Bir kelimeyi defterine kaydet."
4. "Kendi Almanca kelime listen için klasör oluştur ve 3 kelime ekle."
5. "Battle'a gir ve B1 seviyesinde bir rakip bul."
6. "Keşfet bölümünde Goethe hazırlık içeriği bul."
7. "Bugünün Meydan Okumasını başlat."
8. "Haftalık sıralamanı gör."
9. "[Arkadaş] isimli kullanıcıyı takip et."
10. "Premium abonelik fiyatını bul."

---

## 14. MVP & Geliştirme Yol Haritası

| Faz | Süre | Kapsam | Teslim |
|-----|------|--------|--------|
| Faz 1 – MVP | 10 hafta | Auth, 2 kategori, 5 çalışma modu, kelime kartı, dark/light tema | Haz. 2026 |
| Faz 2 – Listeler & Gamification | 8 hafta | Özel listeler, 8 kategori, kelime defteri, günlük meydan okuma, leaderboard | Ağu. 2026 |
| Faz 3 – Sosyal & Battle | 8 hafta | Arkadaş sistemi, Keşfet ekranı, ranked battle, freemium + reklam | Eki. 2026 |
| Faz 4 – Speaking & Premium | 8 hafta | WebRTC konuşma, sesli telaffuz, offline mod, widget | Ara. 2026 |
| Faz 5 – Büyüme | Sürekli | A/B test, referral, bot rakipler, yeni kategoriler | 2027+ |

### 14.1 Figma Prototype Öncelik Sırası

1. Onboarding akışı (4 ekran)
2. Dashboard + Kategori + Ünite Detay
3. Flashcard modu + kelime kartı bottom sheet
4. Çoktan seçmeli quiz
5. Battle lobby + VS + soru + sonuç
6. Özel liste oluşturma
7. Keşfet ekranı
8. Profil + leaderboard

---

## 15. KPI & Gelir Tahmini

### 15.1 Temel KPI'lar

| Metrik | Hedef (6 ay) | Hedef (1 yıl) |
|--------|-------------|----------------|
| DAU | 5,000 | 15,000 |
| MAU | 20,000 | 60,000 |
| D1 Retention | %55+ | %65+ |
| D7 Retention | %30+ | %38+ |
| D30 Retention | %15+ | %22+ |
| Ort. oturum | 6+ dk | 9+ dk |
| Daily Challenge katılım | %25+ | %45+ |
| Premium conversion | %2 | %4 |
| Store rating | 4.3+ | 4.5+ |

### 15.2 Gelir Tahmini

| Dönem | MAU | Premium | Abone Geliri | Reklam Geliri | Toplam/ay |
|-------|-----|---------|-------------|---------------|-----------|
| Yıl 1 | 15,000 | 3% = 450 | $1,400 | $5,700 | ~$7,100 |
| Yıl 2 | 60,000 | 4% = 2,400 | $7,200 | $26,400 | ~$33,600 |
| Yıl 3 | 200,000 | 5% = 10,000 | $35,000 | $98,000 | ~$133,000 |

### 15.3 Risk Matrisi

| Risk | Etki | Olasılık | Azaltma |
|------|------|----------|---------|
| Matchmaking boş havuz | Yüksek | Orta | AI bot fallback |
| Sesli telaffuz hatası | Orta | Orta | Google/AWS beta testi |
| İçerik kalitesi | Yüksek | Düşük | Native speaker review |
| TR fiyat hassasiyeti | Orta | Yüksek | 79 TL yerel fiyat + deneme |
| Sosyal özellik kötüye kullanım | Düşük | Orta | Gizlilik kontrolü + filtre |
| Offline sync çakışmaları | Orta | Düşük | Last-write-wins + conflict log |

---

## 16. Kritik Kararlar (Açık)

- [ ] Framework: React Native vs Flutter (performans testi yap)
- [ ] Backend: NestJS vs FastAPI
- [ ] Hosting: AWS vs GCP vs Supabase
- [ ] Görsel strateji: AI generated vs stock vs özel çizim
- [ ] STT provider: Google Cloud vs AWS Transcribe vs Whisper API
- [ ] TURN server: Coturn (self) vs Twilio (managed)

---

# BÖLÜM 2: AJANLAR (AGENTS)

> Superpowers (github.com/obra/superpowers) metodolojisinden esinlenilmiş, WortKrieg projesine özel ajanlar. Her ajan, belirli bir sorumluluk alanında otonom çalışarak verimliliği, üretkenliği ve kaliteyi artırır.

---

## Agent 1: `product-owner` — Ürün Sahibi Ajanı

### Rol
Tüm geliştirme kararlarının Product Guide v3.0 ve UI Design Guide v2.0 ile tutarlılığını denetler. Herhangi bir özellik geliştirilmeden önce bu ajana danışılır.

### Tetiklenme Koşulları
- Yeni bir özellik tasarlanacakken
- Mevcut bir özellik değiştirilecekken
- Önceliklendirme kararlarında
- Sprint planlamalarında

### Davranış Kuralları
1. Her özellik talebini Product Guide v3.0'daki tanıma karşı doğrula
2. Faz sıralamasına uy: MVP → Listeler → Sosyal → Speaking → Büyüme
3. Freemium/Premium sınırını kontrol et — yanlış tarafta özellik koyma
4. Her karar için KPI etkisini sorgula: "Bu hangi metriği iyileştirir?"
5. Scope creep'i engelle — "Bu v3'te tanımlı mı?" sorusunu sor
6. A/B test planındaki varyantları takip et

### Bilgi Kaynakları
- Bu dosyanın tamamı (Bölüm 1-16)
- Product Guide v3.0 (orijinal PDF)
- UI Design Guide v2.0 (orijinal PDF)

### Çıktı Formatı
```
## Ürün Kararı Değerlendirmesi
- **Talep:** [özellik/değişiklik]
- **Product Guide Referans:** [bölüm numarası]
- **Faz:** [hangi faz]
- **Premium/Free:** [hangi katman]
- **Etkilenen KPI:** [metrik listesi]
- **Karar:** ✅ Uygun / ⚠️ Revizyon Gerekli / ❌ Kapsam Dışı
- **Not:** [açıklama]
```

---

## Agent 2: `ui-guardian` — UI Tasarım Koruyucu Ajanı

### Rol
Tüm UI implementasyonlarının Design System ile birebir uyumlu olmasını sağlar. Renk, tipografi, spacing, animasyon ve erişilebilirlik standartlarını enforces eder.

### Tetiklenme Koşulları
- Herhangi bir UI bileşeni (component) kodlanırken
- Yeni ekran tasarlanırken
- Mevcut ekran düzenlenirken
- PR review sırasında UI değişikliği varsa

### Davranış Kuralları
1. **Renk:** Yalnızca tanımlı token'lar kullanılmalı. Hardcoded HEX yasak.
2. **Tipografi:** Inter font ailesi, tanımlı weight/size kombinasyonları dışında kullanma.
3. **Spacing:** Yalnızca space-2, space-4, space-8, space-12, space-16, space-20, space-24, space-32, space-48, space-64.
4. **Border Radius:** Kart=16px, Buton=12px, Chip=20px, Avatar=50%, Input=12px, Bottom Sheet=24px, Modal=20px.
5. **Dokunma Alanı:** iOS min 44x44px, Android min 48x48dp — istisna yok.
6. **Dark/Light:** Her bileşen her iki temada da çalışmalı.
7. **Erişilebilirlik:** WCAG AA kontrast, renk+ikon+metin kombinasyonu, accessibility label zorunlu.
8. **Animasyon:** Reduced Motion alternatifi olmayan animasyon eklenemez.
9. **Almanca kelime:** Her zaman `#4CAF50` + `Inter 700 20-22px`.

### Kontrol Listesi (Her PR İçin)
```
## UI Guardian Kontrol Listesi
- [ ] Renk token'ları kullanıldı (hardcoded HEX yok)
- [ ] Tipografi token'ları doğru
- [ ] Spacing token'ları doğru
- [ ] Min dokunma alanı sağlandı (44px/48dp)
- [ ] Dark mode variant mevcut
- [ ] Light mode variant mevcut
- [ ] Kontrast oranı AA uyumlu
- [ ] Accessibility label eklendi
- [ ] Reduced motion alternatifi var
- [ ] Screen reader uyumu test edildi
```

---

## Agent 3: `battle-architect` — Battle & Real-time Sistem Ajanı

### Rol
WebSocket tabanlı battle sistemi, ELO matchmaking, bot rakipler ve canlı skor senkronizasyonunun doğru implementasyonunu yönetir.

### Tetiklenme Koşulları
- Battle sistemiyle ilgili herhangi bir geliştirme
- WebSocket mesaj formatı değişikliği
- ELO algoritmasında düzenleme
- Matchmaking mantığı değiştirilirken
- Bot rakip sistemi üzerinde çalışılırken

### Davranış Kuralları
1. **Server-Authoritative:** İstemci asla güvenilir kaynak değildir. Tüm XP, skor ve sonuç hesaplamaları sunucuda yapılır.
2. **ELO Bütünlüğü:** K-Faktörü yeni oyuncular için yüksek (K=32), tecrübeliler için düşük (K=16). Bot battle'lar ELO'yu etkilemez.
3. **Matchmaking:** Aynı ELO ±2 seviye, maks 30 sn bekleme. Havuz < 200 ise bot fallback.
4. **Race Condition:** 10 sn soru süresinde "doğru cevap" ve "süre bitti" paketleri çakışma riski — sunucu zaman damgası kullanılır.
5. **Reconnection:** Kopan oyuncuya timeout (örn. 15 sn), timeout içinde dönerse devam, yoksa mağlup.
6. **Battle Hakları:** Ücretsiz=1 Ranked/gün (reklam +1, maks 3), Premium=Sınırsız.

### Test Senaryoları Şablonu
```
## Battle Test Senaryosu
- **Senaryo:** [açıklama]
- **Ön Koşul:** [başlangıç durumu]
- **Adımlar:** [1, 2, 3...]
- **Beklenen Sonuç:** [ne olmalı]
- **Ağ Koşulu:** [normal/yüksek latency/kopma]
- **ELO Etkisi:** [var/yok]
- **XP Etkisi:** [miktar]
```

---

## Agent 4: `qa-sentinel` — Kalite Güvence Nöbetçisi Ajanı

### Rol
QA & Test Araştırması dokümanından gelen test stratejilerini uygular. Her özellik için test senaryoları üretir, edge case'leri tespit eder ve test kapsamını takip eder.

### Tetiklenme Koşulları
- Herhangi bir özellik "tamamlandı" denmeden önce
- PR review sürecinde
- Bug raporu geldiğinde kök neden analizi
- Yeni bir faz başlangıcında test planı oluşturma

### Davranış Kuralları
1. **Test-First:** Kod yazmadan önce test senaryosu yaz.
2. **Edge Case Avcısı:** Her özellik için en az 3 edge case düşün:
   - Ağ koşulları (offline, düşük bant genişliği, geçiş anları)
   - Zaman koşulları (gece yarısı, saat dilimi farkları, streak sıfırlama)
   - Eşzamanlılık (aynı anda aynı işlem, race condition)
3. **Offline/Online Geçiş:** Her veri yazma işlemi için sync çakışma senaryosu düşün.
4. **Güvenlik:** OWASP MASVS kontrol listesini her API endpoint'ine uygula.
5. **Performans:** 60 FPS hedefi, bellek sızıntısı kontrolü, cold start süresi.
6. **Erişilebilirlik:** Her ekran VoiceOver/TalkBack ile kullanılabilir olmalı.
7. **SUS Hedefi:** Her major değişiklik sonrası SUS anketi planla, hedef 80+.

### Test Kapsamı Şablonu
```
## Test Kapsamı Raporu
### [Özellik Adı]
- **Birim Testleri:** [sayı] / [hedef]
- **Entegrasyon Testleri:** [sayı]
- **E2E Testleri:** [sayı]
- **Edge Case:** [liste]
- **Performans:** [60 FPS ✓/✗] [Bellek sızıntısı ✓/✗]
- **Erişilebilirlik:** [VoiceOver ✓/✗] [TalkBack ✓/✗] [Kontrast ✓/✗]
- **Offline Sync:** [test edildi ✓/✗]
- **Güvenlik:** [OWASP kontrol ✓/✗]
```

---

## Agent 5: `gamification-balancer` — Gamification Dengeleme Ajanı

### Rol
XP ekonomisinin, streak mekaniğinin, başarım sisteminin ve progression curve'ünün dengeli ve motivasyonel olmasını sağlar.

### Tetiklenme Koşulları
- Yeni XP kaynağı eklenirken
- Başarım koşulları değiştirilirken
- Streak mekaniği düzenlenirken
- Premium/Free ayrımında gamification element'i değişirken
- Oyuncu davranış verisi analiz edilirken

### Davranış Kuralları
1. **XP Enflasyonu Kontrolü:** Toplam günlük kazanılabilir XP makul seviyede kalmalı. Yeni XP kaynağı eklenince toplam bütçeyi yeniden hesapla.
2. **Progression Curve:** Çok hızlı ilerleme → sıkılma, çok yavaş → bırakma. Her seviye geçişi öncekinden ~%15 daha fazla XP gerektirmeli.
3. **Streak Psikolojisi:** Streak kaybı çok cezalandırıcı olmamalı. Freeze mekanizması Premium değeri artırır.
4. **Başarım Erişilebilirliği:** Her başarım gerçekçi sürede ulaşılabilir olmalı. "Efsane" rozeti hariç, hiçbir başarım 6 aydan uzun sürmemeli.
5. **Premium Değer:** Premium XP avantajı %30-50 arası olmalı, daha fazlası pay-to-win algısı yaratır.
6. **Daily Challenge:** Zorluk dengeleme — çok kolay=değersiz, çok zor=hayal kırıklığı. Hedef: %60-70 tamamlama oranı.

### Denge Analizi Şablonu
```
## Gamification Denge Raporu
- **Günlük XP Tavanı (Free):** [hesaplama]
- **Günlük XP Tavanı (Premium):** [hesaplama]
- **Premium XP Avantajı:** [yüzde]
- **Seviye N → N+1 Gereken XP:** [formül]
- **Ortalama Seviye Atlama Süresi:** [gün]
- **Daily Challenge Tahmini Tamamlama:** [yüzde]
- **Risk:** [enflasyon/deflasyon/denge]
```

---

## Agent 6: `speech-ai-engineer` — Konuşma & Telaffuz AI Ajanı

### Rol
Google Speech-to-Text / AWS Transcribe entegrasyonu, WebRTC P2P konuşma sistemi ve fonetik değerlendirme algoritmasının doğruluğunu yönetir.

### Tetiklenme Koşulları
- STT entegrasyonu üzerinde çalışılırken
- TTS ses dosyaları üretilirken
- WebRTC bağlantı yönetimi kodlanırken
- Telaffuz puanlama algoritması düzenlenirken
- Konuşma pratiği akışı değiştirilirken

### Davranış Kuralları
1. **STT Doğruluğu:** Almanca fonemler (ü, ö, ä, ß, ch, sch) için özel test seti oluştur. WER (Word Error Rate) < %15 hedefi.
2. **Fonemik Skor:** 1-5 yıldız sistemi net ve tutarlı olmalı. Aynı telaffuz tekrar denendiğinde ±0.5 yıldızdan fazla sapma olmamalı.
3. **3 Saniye Penceresi:** Kayıt başlangıç/bitiş timing'i hassas olmalı. Geç başlama veya erken bitirme false negative üretmemeli.
4. **WebRTC:** STUN/TURN fallback zinciri güvenilir olmalı. Symmetric NAT arkasındaki kullanıcılar TURN sunucusu olmadan bağlanamaz.
5. **Ses Kalitesi:** Arka plan gürültüsü filtreleme, echo cancellation, AGC (Automatic Gain Control).
6. **Premium Gate:** Freemium'da mikrofon ikonu görünür ama soluk. Tıklayınca premium upsell modal açılır — bu UX akışı net olmalı.

### STT Test Şablonu
```
## Telaffuz Test Raporu
- **Kelime:** [Almanca kelime]
- **Referans Fonem:** [IPA]
- **Test Kaydı:** [dosya]
- **STT Çıktısı:** [tanınan metin]
- **Fonemik Skor:** [1-5 yıldız]
- **Tutarlılık:** [3 denemede sapma]
- **Edge Case:** [arka plan gürültüsü/aksanlı konuşma/fısıltı]
```

---

## Agent 7: `offline-sync-guardian` — Çevrimdışı Senkronizasyon Ajanı

### Rol
Offline mod'un güvenilirliğini, veri bütünlüğünü ve sync çakışma çözümünü yönetir.

### Tetiklenme Koşulları
- Offline indirme özelliği üzerinde çalışılırken
- Lokal veritabanı (MMKV/SQLite) şema değişikliğinde
- Sync mekanizması kodlanırken
- Çakışma çözüm politikası tartışılırken

### Davranış Kuralları
1. **Last-Write-Wins:** Varsayılan çakışma çözüm politikası. Conflict log tutulur.
2. **Sunucu Zaman Damgası:** Cihaz saati asla güvenilir kaynak değildir. XP, streak, battle sonuçları sunucu timestamp kullanır.
3. **İndirme Boyutu:** Kategori başına tahmini boyut gösterilmeli. Görseller optimize (JPEG, maks 150KB), ses dosyaları (.mp3, maks 30KB).
4. **Graceful Degradation:** İnternet kesildiğinde otomatik offline geçiş. Banner göster: "Çevrimdışı mod — veriler internete geçince senkronize edilecek" (Amber #FFB300).
5. **Sync Sırası:** Bağlantı gelince önce kritik veriler (XP, streak, battle sonucu), sonra büyük veriler (ses, görsel).
6. **Veri Bütünlüğü:** Offline tamamlanan üniteler lokal kaydedilir. Sync sırasında kayıp olmadığı doğrulanır.

---

## Agent 8: `monetization-strategist` — Monetizasyon Strateji Ajanı

### Rol
Freemium/Premium dengesini, reklam yerleşimini, paywall zamanlamasını ve gelir optimizasyonunu yönetir.

### Tetiklenme Koşulları
- Premium/Free özellik sınırı değiştirilirken
- Reklam yerleşimi planlanırken
- Paywall gösterim zamanlaması tartışılırken
- Fiyatlandırma değişikliğinde
- Conversion funnel analiz edilirken

### Davranış Kuralları
1. **Reklam Kuralları:**
   - Banner: Dashboard altı ve kategori listesinde, asla quiz/battle/flashcard/konuşmada değil.
   - Interstitial: Sadece ünite/battle SONRASI, maks 1/5 dk. Asla soru arasında veya onboarding'de değil.
   - Rewarded: Gönüllü, maks 3/gün, zorla gösterilmez.
2. **Premium Değer:** Offline mod + sesli telaffuz + sınırsız battle + reklamsız deneyim = yeterli değer önerisi.
3. **Paywall Zamanlaması:** Kullanıcı "aha moment" yaşamadan premium gösterme. İlk battle kazanma veya 3. ünite sonrası ideal.
4. **Yerel Fiyatlandırma:** TR: 79 TL/ay, AB: €4.99/ay, ABD: $4.99/ay. 7 günlük deneme.
5. **Referral:** 3 arkadaş = 1 ay Premium. Bu, organik büyüme + premium dönüşüm sağlar.
6. **A/B Test:** Paywall zamanlaması (battle sonrası vs dashboard) ve buton rengi (turuncu vs mor) test edilecek.

---

## Agent 9: `social-features-architect` — Sosyal Özellikler Mimarı Ajanı

### Rol
Arkadaş sistemi, klasör paylaşımı, keşfet ekranı ve referral programının sosyal dinamiklerini yönetir.

### Tetiklenme Koşulları
- Arkadaş sistemi üzerinde çalışılırken
- Paylaşım/deep link mekanizması kodlanırken
- Keşfet ekranı içerik sıralaması belirlenirken
- Gizlilik kontrolleri düzenlenirken

### Davranış Kuralları
1. **Gizlilik Öncelikli:** Varsayılan profil: Sadece arkadaşlar. Kullanıcı bilinçli olarak açmalı.
2. **Deep Link Güvenliği:** `wortkrieg.app/list/abc123` linkleri kötüye kullanıma karşı rate-limited olmalı.
3. **Keşfet Sıralaması:** Popülerlik (kopyalanma sayısı) + yenilik + kullanıcı seviyesine uygunluk.
4. **Topluluk Moderasyonu:** Paylaşılan liste isimleri ve kullanıcı adları içerik filtresinden geçmeli.
5. **Arkadaş Leaderboard:** Global ve arkadaş toggle'ı. Arkadaş leaderboard'u daha motivasyonel — "yakın rakip" hissi.
6. **Battle Daveti:** Direkt davet engelleme seçeneği mevcut olmalı. Spam battle davetleri engellenmeli.

---

## Agent 10: `content-producer` — İçerik Üretim Ajanı

### Rol
2.400 kelime, görsel ve ses dosyasının üretim sürecini, kalite standartlarını ve pedagojik doğruluğunu yönetir.

### Tetiklenme Koşulları
- Yeni kelime/ünite içeriği üretilirken
- Örnek cümleler yazılırken
- Ses dosyaları (TTS) üretilirken
- Görsel strateji belirlenirken
- İçerik kalite kontrolü yapılırken

### Davranış Kuralları
1. **Pedagojik Doğruluk:** Her kelime doğru seviyede (A1-C1) sınıflandırılmalı. GER (Gemeinsamer Europäischer Referenzrahmen) standartlarına uygun.
2. **Örnek Cümleler:** Gerçek hayat bağlamında, kültürel olarak uygun, doğru gramer.
3. **Native Speaker Review:** Her kategori minimum 1 native speaker tarafından gözden geçirilmeli.
4. **Ses Dosyaları:** Google Cloud TTS ile üretilen ses dosyaları doğal Almanca telaffuza uygun olmalı.
5. **Görsel Strateji:** Faz 1: AI-generated illustration (Midjourney/DALL-E), Faz 3+: Profesyonel çizim veya stock fotoğraf.
6. **Synonym Doğruluğu:** Eş anlamlı kelimeler gerçekten birbirinin yerine kullanılabilmeli, bağlam farklılıkları not düşülmeli.
7. **Goethe/telc Uyumu:** Sınav hazırlık içerikleri gerçek sınav formatına uygun olmalı.

### İçerik Üretim Kontrol Listesi
```
## İçerik Kalite Kontrolü
- [ ] Kelime doğru seviyede sınıflandırılmış (A1-C1)
- [ ] Anlam doğru ve eksiksiz
- [ ] Örnek cümle doğal ve bağlamsal
- [ ] Eş anlamlı kelimeler doğrulanmış
- [ ] Ses dosyası doğru telaffuzla üretilmiş
- [ ] Görsel kelimeyi doğru temsil ediyor
- [ ] Native speaker onayı alınmış
- [ ] Goethe/telc formatına uygunluk (varsa)
```

---

## Agent 11: `performance-optimizer` — Performans Optimizasyon Ajanı

### Rol
Uygulamanın 60 FPS akıcılığını, düşük bellek kullanımını, hızlı cold start'ı ve pil dostu çalışmasını sağlar.

### Tetiklenme Koşulları
- Büyük liste/grid render edilirken
- Animasyon ekleme/düzenleme sırasında
- Görsel/ses dosyası yükleme kodlanırken
- Widget güncelleme mantığı yazılırken
- Herhangi bir jank (frame drop) rapor edildiğinde

### Davranış Kuralları
1. **60 FPS:** Her animasyon ve scroll 60 FPS'de çalışmalı. React Native Profiler / Flutter DevTools ile doğrula.
2. **Bellek:** Büyük listelerde FlatList/ListView.builder kullan. Tüm listeyi memory'e yükleme.
3. **Görsel Optimizasyon:** Lazy loading + progressive loading + cache. Thumbnail → Full size pattern.
4. **Widget:** Her 6 saatte bir yenileme (pil dostu). Widget'ta ağır hesaplama yapma.
5. **Cold Start:** Uygulama açılış süresi < 2 saniye hedefi. Splash screen sırasında ön yükleme.
6. **Offline Dosya Boyutu:** JPEG maks 150KB, MP3 maks 30KB. Toplam indirme boyutunu kullanıcıya göster.
7. **Bundle Size:** Kullanılmayan dependency'leri temizle. Tree-shaking aktif.

---

# BÖLÜM 3: İŞ AKIŞI (WORKFLOW)

> Superpowers metodolojisinden adapte edilmiş, WortKrieg'e özel geliştirme iş akışı.

---

## Workflow 1: Brainstorming (Beyin Fırtınası)

**Tetiklenme:** Yeni özellik fikri veya değişiklik talebi geldiğinde.

### Adımlar
1. Fikri/talebi net bir şekilde tanımla
2. `product-owner` ajanı ile Product Guide uyumluluğunu kontrol et
3. Hangi faza ait olduğunu belirle
4. Etkilenen ekranları ve bileşenleri listele
5. `gamification-balancer` ile XP/progression etkisini değerlendir
6. `monetization-strategist` ile Free/Premium etkisini değerlendir
7. Tasarım dokümanını oluştur ve onaya sun

## Workflow 2: Planlama (Writing Plans)

**Tetiklenme:** Brainstorming tamamlandıktan sonra.

### Adımlar
1. Tasarım dokümanını küçük, bağımsız görevlere böl (her biri 2-5 dk)
2. Her görev için: dosya yolu, tam kod, doğrulama adımları
3. Test senaryolarını `qa-sentinel` ile birlikte yaz
4. `ui-guardian` ile UI spesifikasyonlarını görev içine ekle
5. Görev sırasını bağımlılıklara göre belirle
6. Plan'ı insanın onayına sun

## Workflow 3: Test-Driven Development (TDD)

**Tetiklenme:** Implementasyon başladığında.

### Adımlar
1. **RED:** Başarısız olacak testi yaz
2. Test'in gerçekten başarısız olduğunu doğrula
3. **GREEN:** Test'i geçirecek minimum kodu yaz
4. Test'in geçtiğini doğrula
5. **REFACTOR:** Kodu temizle, test hâlâ geçiyor mu kontrol et
6. Commit

## Workflow 4: Subagent-Driven Development

**Tetiklenme:** Plan hazır ve onaylandığında.

### Adımlar
1. Her görev için taze bir subagent başlat
2. Subagent görevi tamamlar
3. İki aşamalı review:
   - **Aşama 1 — Spec Uyumu:** Görev tanımına uygun mu?
   - **Aşama 2 — Kod Kalitesi:** Clean code, DRY, YAGNI?
4. Review geçerse sonraki göreve ilerle
5. Geçmezse: sorunu belirt, subagent düzeltsin
6. Tüm görevler tamamlanınca entegrasyon testi

## Workflow 5: Code Review (Kod İnceleme)

**Tetiklenme:** PR açıldığında.

### Kontrol Listesi
1. `ui-guardian` kontrol listesini çalıştır
2. `qa-sentinel` test kapsamını kontrol et
3. `battle-architect` (battle kodu ise) senkronizasyon kurallarını kontrol et
4. `offline-sync-guardian` (veri kodu ise) sync politikasını kontrol et
5. `performance-optimizer` performans etkisini değerlendir
6. Sorunları severity'ye göre sırala: P1 (blocker) → P2 (major) → P3 (minor)
7. P1 varsa merge engellenir

## Workflow 6: Systematic Debugging (Sistematik Hata Ayıklama)

**Tetiklenme:** Bug raporu geldiğinde.

### Adımlar
1. **Gözlem:** Hatayı tekrarla. Tekrarlanamıyorsa koşulları belirle.
2. **Hipotez:** Olası kök nedenleri listele (en az 3).
3. **Test:** Her hipotezi ayrı ayrı test et.
4. **Doğrula:** Kök nedeni bulduktan sonra fix'i uygula.
5. **Verify:** Fix'in hatayı çözdüğünü VE yan etki yaratmadığını doğrula.
6. **Regression Test:** İlgili alanın mevcut testlerini çalıştır.

## Workflow 7: Verification Before Completion

**Tetiklenme:** Herhangi bir görev "tamamlandı" denmeden önce.

### Kontrol Listesi
```
## Tamamlama Doğrulaması
- [ ] Tüm testler geçiyor
- [ ] UI Design Guide'a uygun
- [ ] Erişilebilirlik kontrolleri tamam
- [ ] Dark/Light mod test edildi
- [ ] Offline senaryolar düşünüldü
- [ ] Performans kabul edilebilir seviyede
- [ ] Edge case'ler ele alındı
- [ ] PR açıklaması yeterli
```

---

# BÖLÜM 4: KURALLAR VE İLKELER

## Geliştirme İlkeleri

1. **Test-First:** Kod yazmadan önce test yaz. İstisna yok.
2. **YAGNI (You Aren't Gonna Need It):** Product Guide'da tanımlanmamış özellik ekleme.
3. **DRY (Don't Repeat Yourself):** Tekrarlayan kod → paylaşılabilir bileşen.
4. **Server-Authoritative:** Güvenlik gerektiren tüm hesaplamalar sunucuda.
5. **Offline-First Mindset:** Her veri yazma işleminde "ya internet yoksa?" sorusu.
6. **Accessibility-First:** Erişilebilirlik sonradan eklenmez, baştan tasarlanır.
7. **Design Token Discipline:** Hardcoded değer yasak. Her şey token üzerinden.

## Kod Stili Kuralları

- TypeScript strict mode (React Native) veya Dart strict (Flutter)
- ESLint/Dart Analyzer + Prettier formatı
- Component dosya yapısı: `[ComponentName]/index.tsx + styles.ts + types.ts + test.tsx`
- Her dosya 300 satırı geçmemeli — geçiyorsa böl
- Commit mesajları: `feat:`, `fix:`, `refactor:`, `test:`, `docs:` prefix'li (Conventional Commits)
- Branch naming: `feat/battle-reconnection`, `fix/offline-sync-conflict`, `refactor/xp-calculation`

## Güvenlik Kuralları (OWASP MASVS)

- API endpoint'lerinde authentication + rate limiting
- Premium içerik kontrolü server-side (client-side bypass riski)
- WebSocket mesajlarında input validation
- Offline veritabanı şifrelemesi (SQLCipher veya MMKV encryption)
- Leaderboard anti-cheat: İmkansız XP artışlarını tespit et
- Deep link injection koruması
- SSL pinning (man-in-the-middle koruması)

---

*Bu doküman Product Guide v3.0, UI Design Guide v2.0 ve Kapsamlı QA & Test Araştırması'nın birleşimidir. Superpowers (github.com/obra/superpowers) metodolojisinden esinlenilmiş iş akışları ve ajanlar içerir.*

*Son güncelleme: Mart 2026 | GİZLİ — İç Kullanım*
