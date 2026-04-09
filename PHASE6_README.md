# WortKrieg

## Faz 6: Gelişmiş Analytics ve AI Özellikleri

### Faz Hedefi

Bu faz, WortKrieg'i kullanıcı davranışını anlayan ve kişiye özel öneriler sunan akıllı bir öğrenme yardımcıya dönüştürmeyi hedefler. Veri toplama, ilerleme tahmini ve adaptif zorluk seviyesi bu katmanın temelidir.

## Yol Haritası

### Yüksek Öncelik
- [x] Öğrenme analytics altyapısı
- [x] Kişiselleştirilmiş kelime ve ünite önerileri
- [x] Makine öğrenmesi destekli ilerleme tahminleri
- [x] Dinamik zorluk ayarı
- [ ] Akıllı streak koruma ve geri kazanım mantığı

### Orta Öncelik
- [x] Detaylı performans içgörüleri
- [x] AI destekli zayıf alan tespiti
- [x] Çalışma oturumu zamanı ve süre optimizasyonu
- [x] Spaced repetition odaklı hafıza tutma modelleri
- [ ] Benzer kullanıcılarla karşılaştırmalı analytics

### Gelecek Geliştirmeler
- [ ] Yazma egzersizleri için gelişmiş NLP
- [ ] Telaffuz değerlendirmesi için konuşma tanıma
- [ ] AI ile kişisel içerik üretimi
- [ ] Tahmine dayalı bildirim zamanlaması
- [ ] Dinamik öğrenme yolu optimizasyonu

## Teknik Mimari

### Firebase Koleksiyonları

```text
analytics/{userId}/
  learning_sessions/    -> detaylı çalışma oturumu verisi
  performance_metrics/  -> KPI ve trend kayıtları
  predictions/          -> AI tahmin çıktıları
  recommendations/      -> kişisel öneriler

ai_models/
  user_profiles/        -> kullanıcı davranış modelleri
  content_embeddings/   -> içerik vektörleri
  prediction_models/    -> tahmin modelleri
```

### Servisler
- `AnalyticsService`: öğrenme verisini toplar ve analiz eder
- `AIService`: öneri ve tahmin mantığını taşır
- `PredictionService`: öğrenme eğrisi tahminleri üretir
- `RecommendationEngine`: kullanıcıya uygun içerik sıralar

## Analytics ve AI Yetkinlikleri

### Öğrenme Metrikleri
- retention rate analizi
- çalışma oturumu kalite puanı
- öğrenme hızı ve ivmesi
- düzenlilik endeksi
- uygun zorluk seviyesi takibi

### AI Destekli Özellikler
- sıradaki en uygun kelime veya ünite önerisi
- otomatik içerik zorluk ölçekleme
- akıllı tekrar planlaması
- tahmini tamamlanma tarihi ve seviye görünümü
- otomatik zayıflık alanı tespiti

## Arayüz Güncellemeleri

### Yeni Ekranlar
- Analytics dashboard
- AI önerileri ekranı
- İlerleme tahmin ekranı
- Performans raporları

### Güçlendirilen Ekranlar
- `Dashboard`: AI içgörüleri ve öneriler
- Çalışma modları: adaptif zorluk göstergeleri
- `Profile`: gelişmiş analytics ve başarı görünümü
- `Settings`: AI tercih ayarları

## Uygulama Planı

### Faz 6A: Analytics Temeli
- öğrenme verisi toplama sistemi
- temel analytics hesaplamaları
- performans metrikleri paneli

### Faz 6B: AI Önerileri
- kullanıcı davranış modelleme
- içerik öneri motoru
- adaptif zorluk sistemi

### Faz 6C: Tahmine Dayalı Analytics
- öğrenme eğrisi tahminleri
- ilerleme tahmin modelleri
- kişiselleştirilmiş öğrenme yolları

### Faz 6D: İleri AI
- doğal dil işleme entegrasyonu
- konuşma tanıma
- dinamik içerik üretimi

## Başarı Kriterleri

### Öğrenme Çıktıları
- uzun vadeli kelime retention'ında yüzde 25 artış
- yeni kelime ustalaşma süresinde yüzde 30 azalma
- günlük aktif öğrenme süresinde yüzde 40 artış
- kurs tamamlama oranında yüzde 35 iyileşme

### Teknik Hedefler
- öğrenme tahminlerinde yüzde 85 doğruluk
- AI önerilerinde yüzde 75 kabul oranı
- analytics sorgularında 500 ms altı yanıt süresi
- 10.000+ eşzamanlı kullanıcı için gerçek zamanlı veri işleme

## Durum

- Faz durumu: Faz 6B tamamlandı, AI önerileri uygulanmış durumda
- Tahmini toplam süre: 8 hafta
- Öncelik seviyesi: yüksek
