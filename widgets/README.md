# WortKrieg Widget Dokümantasyonu

Bu klasör, WortKrieg için hazırlanan örnek widget implementasyonlarını içerir. Amaç; uygulama ana ekranına günlük ilerleme, streak veya hızlı erişim gibi bilgileri taşıyacak native widget yapısı için başlangıç referansı sunmaktır.

## İçerik

### 🍎 iOS
- `ios/WortKriegWidget.swift`
  WidgetKit tabanlı küçük, orta ve büyük boyut widget örneği içerir. Veri akışı, paylaşılan bir JSON snapshot üzerinden beslenir.

### 🤖 Android
- `android/WortKriegWidget.kt`
  Android tarafında Glance tabanlı örnek widget yapısını içerir.

## Kullanım Notları

- Bu dosyalar başlangıç seviyesi referans implementasyonlardır.
- Native hedefler tam olarak aktif edildiğinde ilgili `ios/` ve `android/` proje yapıları içine taşınmaları beklenir.
- Widget verisi, uygulama içindeki offline senkronizasyon ve günlük ilerleme akışlarıyla entegre edilmelidir.
