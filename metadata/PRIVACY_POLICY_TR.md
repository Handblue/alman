# Gizlilik Politikası — WortKrieg

**Yürürlük tarihi:** [DOLDUR: ör. 2026-07-01]
**Geliştirici:** [DOLDUR: geliştirici / şirket yasal adı]
**İletişim:** [DOLDUR: destek e-postası, ör. privacy@wortkrieg.app]

> ⚠️ Geliştirici notu (yayından önce kaldır): Köşeli parantezli alanları doldur. Aşağıdaki
> "aktarım sırasında şifreli" ifadesi backend'in **HTTPS** üzerinden sunulduğunu varsayar.
> Uygulama şu an `http://45.143.11.97/api` (şifresiz) çağırıyor. Yayından önce backend'i
> HTTPS'e taşı; aksi halde bu bölümü ve Play Veri Güvenliği formunu buna göre düzelt.

WortKrieg ("uygulama", "biz") bir Almanca öğrenme uygulamasıdır. Bu politika hangi verileri,
neden topladığımızı ve seçeneklerinizi açıklar. Kişisel verilerinizi **satmayız** ve
üçüncü taraf **reklam** kullanmayız.

## 1. Topladığımız veriler

**Hesap bilgileri (hesap oluşturursanız veya giriş yaparsanız).**
- E-posta, kullanıcı adı ve görünen ad.
- Kimlik doğrulama bilgileri (şifre) — sizi oturum açtırmak için backend'imize iletilir.
- İsteğe bağlı: "Google ile giriş" seçerseniz Google hesabı e-postanızı ve temel profil
  bilgilerinizi OAuth ile alırız. Google şifrenizi almayız.

**Öğrenme etkinliği.**
- İlerlemeniz, puanlar, XP, seriler, çalışma geçmişi, başarımlar ve WortKampf sonuçları.
  Temel özellikleri, aralıklı tekrar planlamasını, sıralamaları sağlamak ve ilerlemenizi
  senkronize etmek için kullanılır.

**Cihaz ve teknik veriler.**
- Çalışma hatırlatıcıları ve savaş davetleri gönderebilmemiz için bir push bildirim jetonu
  (Expo). Bildirimleri cihaz ayarlarınızdan kapatabilirsiniz.
- Gerçek zamanlı özellikler için gereken temel cihaz bilgileri.

**Mikrofon / ses (yalnızca telaffuz alıştırmasında).**
- Bir telaffuz alıştırması kullandığınızda ve mikrofon izni verdiğinizde, konuşmanız
  telaffuzunuzu değerlendirmek için cihazın konuşma tanıma servisi tarafından işlenir.
  Android'de bu, Google'ın konuşma tanımasını kullanır; ses Google sunucularında işlenebilir.
  Ses kayıtlarınızı sunucularımızda saklamayız. Telaffuz özelliklerini hiç kullanmazsanız,
  hiç ses toplanmaz.

**Cihazınızda yerel olarak saklananlar.**
- Ayarlar, önbelleğe alınmış kelimeler ve çevrimdışı ilerleme cihazınızda (MMKV / AsyncStorage)
  saklanır; böylece uygulama çevrimdışı çalışır.

Rehberinize, takviminize, fotoğraflarınıza veya kesin konumunuza **erişmeyiz**. Uygulama
rehber ve takvim izinlerini açıkça engeller.

## 2. Verileri nasıl kullanırız
- Öğrenme deneyimini sağlamak ve geliştirmek (çalışma modları, SRS, istatistikler).
- Sosyal ve rekabetçi özellikler (arkadaşlar, çalışma grupları, sıralamalar, savaşlar).
- Onay verdiğiniz bildirimleri göndermek (hatırlatıcılar, meydan okumalar).
- Hesap güvenliğini sağlamak ve kötüye kullanımı önlemek.

## 3. Paylaşım ve üçüncü taraflar
Verileri yalnızca uygulamayı çalıştırmamıza yardımcı olan servis sağlayıcılarla paylaşırız:
- **Backend barındırma** — hesap ve ilerleme verilerinizi saklar.
- **Expo push servisi** — bildirimleri iletir.
- **Google konuşma tanıma** — telaffuz sesini işler (yalnızca kullandığınızda).
- **Google ile Giriş** — yalnızca seçerseniz.

Veri satmayız ve reklam için paylaşmayız.

## 4. Veri saklama ve silme
Hesap ve ilerleme verilerini hesabınız etkin olduğu sürece saklarız. Hesabınızın ve ilgili
verilerin silinmesini [DOLDUR: destek e-postası] ile talep edebilirsiniz. Yerel veriler,
uygulamayı kaldırdığınızda veya verilerini temizlediğinizde silinir.

## 5. Çocuklar
WortKrieg genel kitleye yöneliktir (3+/Herkes). 13 yaş altı çocuklara yönelik değildir ve
bilerek onların kişisel verilerini toplamayız.

## 6. Güvenlik
Verilerinizi korumak için endüstri standardı önlemler kullanırız. Hesap ve ilerleme
verileri backend'imize [HTTPS — geliştirici notuna bakın] üzerinden iletilir. Hiçbir iletim
veya saklama yöntemi %100 güvenli değildir.

## 7. Haklarınız
Bölgenize göre (ör. KVKK/GDPR) verilerinize erişme, düzeltme, silme veya dışa aktarma ve
onayı geri çekme haklarınız olabilir. Bize [DOLDUR: destek e-postası] adresinden ulaşın.

## 8. Değişiklikler
Bu politikayı güncelleyebiliriz. Önemli değişiklikler güncel yürürlük tarihiyle belirtilir.

## 9. İletişim
[DOLDUR: geliştirici adı] — [DOLDUR: destek e-postası]
