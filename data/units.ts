export type Unit = {
  id: number;
  categoryId: number;
  number: number;
  title: string;
  wordCount: number;
};

export const UNITS: Unit[] = [
  { id: 1, categoryId: 1, number: 1, title: 'Temel Sözcükler', wordCount: 15 },
  { id: 2, categoryId: 1, number: 2, title: 'Ev ve Aile', wordCount: 0 },
  { id: 3, categoryId: 2, number: 1, title: 'Bağlaçlar ve Gramer Yapıları', wordCount: 15 },
  { id: 4, categoryId: 3, number: 1, title: 'Goethe B1/B2 Temel Kelimeler', wordCount: 15 },
  { id: 5, categoryId: 4, number: 1, title: 'telc Resmi Dil ve Kurumsal Kelimeler', wordCount: 15 },
  { id: 6, categoryId: 5, number: 1, title: 'Market, Sağlık ve Ulaşım', wordCount: 15 },
  { id: 7, categoryId: 6, number: 1, title: 'Araştırma ve Akademik Terimler', wordCount: 15 },
  { id: 8, categoryId: 7, number: 1, title: 'Felsefi Kavramlar ve Terimler', wordCount: 15 },
  { id: 9, categoryId: 8, number: 1, title: 'Yaygın Deyimler (Redewendungen)', wordCount: 15 },
];
