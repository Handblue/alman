export type Unit = {
  id: number;
  categoryId: number;
  number: number;
  title: string;
  wordCount: number;
};

export const UNITS: Unit[] = [
  // Kategori 1 — A1 Temel Kelimeler (unitId 1–12)
  { id: 1,  categoryId: 1, number: 1,  title: 'Temel Sözcükler',        wordCount: 15 },
  { id: 2,  categoryId: 1, number: 2,  title: 'Aile ve İlişkiler',      wordCount: 15 },
  { id: 10, categoryId: 1, number: 3,  title: 'Vücut ve Sağlık',        wordCount: 15 },
  { id: 11, categoryId: 1, number: 4,  title: 'Yemek ve İçecek',        wordCount: 15 },
  { id: 12, categoryId: 1, number: 5,  title: 'Giysi ve Moda',          wordCount: 15 },
  { id: 13, categoryId: 1, number: 6,  title: 'Ev ve Mobilya',          wordCount: 15 },
  { id: 14, categoryId: 1, number: 7,  title: 'Zaman ve Sayılar',       wordCount: 15 },
  { id: 15, categoryId: 1, number: 8,  title: 'Ulaşım ve Seyahat',      wordCount: 15 },
  { id: 16, categoryId: 1, number: 9,  title: 'Hava Durumu ve Doğa',    wordCount: 15 },
  { id: 17, categoryId: 1, number: 10, title: 'Okul ve Ders',           wordCount: 15 },
  { id: 18, categoryId: 1, number: 11, title: 'Renkler ve Şekiller',    wordCount: 15 },
  { id: 19, categoryId: 1, number: 12, title: 'Alışveriş ve Para',      wordCount: 15 },

  // Kategori 2 — A1–C1 Gramer (unitId 3, 20–23)
  { id: 3,  categoryId: 2, number: 1, title: 'Bağlaçlar ve Gramer Yapıları', wordCount: 15 },
  { id: 20, categoryId: 2, number: 2, title: 'Temel Eylemler',               wordCount: 15 },
  { id: 21, categoryId: 2, number: 3, title: 'Geçmiş Zaman Fiilleri',        wordCount: 15 },
  { id: 22, categoryId: 2, number: 4, title: 'Modal ve Gelecek',             wordCount: 15 },
  { id: 23, categoryId: 2, number: 5, title: 'Edatlar ve Zarflar',           wordCount: 15 },

  // Kategori 3 — Goethe Sınav (unitId 4, 24–26)
  { id: 4,  categoryId: 3, number: 1, title: 'Goethe B1/B2 Temel Kelimeler', wordCount: 15 },
  { id: 24, categoryId: 3, number: 2, title: 'Goethe B1 — Sosyal Hayat',     wordCount: 15 },
  { id: 25, categoryId: 3, number: 3, title: 'Goethe B2 — İş ve Kariyer',    wordCount: 15 },
  { id: 26, categoryId: 3, number: 4, title: 'Goethe C1 — Yazılı Dil',       wordCount: 15 },

  // Kategori 4 — telc Sınav (unitId 5, 27–28)
  { id: 5,  categoryId: 4, number: 1, title: 'telc Resmi Dil ve Kurumsal Kelimeler', wordCount: 15 },
  { id: 27, categoryId: 4, number: 2, title: 'telc B2 — Akademik ve Toplumsal',      wordCount: 15 },
  { id: 28, categoryId: 4, number: 3, title: 'telc C1 — Üst Düzey İfadeler',         wordCount: 15 },

  // Kategori 5 — Günlük Hayat (unitId 6, 29–32)
  { id: 6,  categoryId: 5, number: 1, title: 'Market, Sağlık ve Ulaşım',  wordCount: 15 },
  { id: 29, categoryId: 5, number: 2, title: 'Restoran ve Yemek Siparişi', wordCount: 15 },
  { id: 30, categoryId: 5, number: 3, title: 'Seyahat ve Otel',            wordCount: 15 },
  { id: 31, categoryId: 5, number: 4, title: 'Banka ve Finans',            wordCount: 15 },
  { id: 32, categoryId: 5, number: 5, title: 'Teknoloji ve Dijital Hayat', wordCount: 15 },

  // Kategori 6 — Akademik (unitId 7, 33–35)
  { id: 7,  categoryId: 6, number: 1, title: 'Araştırma ve Akademik Terimler', wordCount: 15 },
  { id: 33, categoryId: 6, number: 2, title: 'Fen Bilimleri ve Matematik',     wordCount: 15 },
  { id: 34, categoryId: 6, number: 3, title: 'Ekonomi ve İşletme',             wordCount: 15 },
  { id: 35, categoryId: 6, number: 4, title: 'Hukuk ve Siyaset',               wordCount: 15 },

  // Kategori 7 — Felsefe (unitId 8, 36–37)
  { id: 8,  categoryId: 7, number: 1, title: 'Felsefi Kavramlar ve Terimler', wordCount: 15 },
  { id: 36, categoryId: 7, number: 2, title: 'Etik ve Değerler',              wordCount: 15 },
  { id: 37, categoryId: 7, number: 3, title: 'Epistemoloji ve Mantık',        wordCount: 15 },

  // Kategori 8 — Deyimler (unitId 9, 38–40)
  { id: 9,  categoryId: 8, number: 1, title: 'Yaygın Deyimler (Redewendungen)', wordCount: 15 },
  { id: 38, categoryId: 8, number: 2, title: 'Duygusal Deyimler',               wordCount: 15 },
  { id: 39, categoryId: 8, number: 3, title: 'İş Hayatı Deyimleri',             wordCount: 15 },
  { id: 40, categoryId: 8, number: 4, title: 'Günlük Konuşma İfadeleri',        wordCount: 15 },
];
