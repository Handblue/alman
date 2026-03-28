export type Word = {
  id: number;
  categoryId: number;
  unitId: number;
  german: string;
  turkish: string;
  example: string;
  exampleTranslation: string;
  synonyms?: string[];
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
};

export const WORDS: Word[] = [
  // Kategori 1, Ünite 1 — A1 Temel Kelimeler
  { id: 1, categoryId: 1, unitId: 1, german: 'der Hund', turkish: 'köpek', example: 'Der Hund ist groß.', exampleTranslation: 'Köpek büyük.', synonyms: ['der Vierbeiner'], level: 'A1' },
  { id: 2, categoryId: 1, unitId: 1, german: 'die Katze', turkish: 'kedi', example: 'Die Katze schläft.', exampleTranslation: 'Kedi uyuyor.', synonyms: [], level: 'A1' },
  { id: 3, categoryId: 1, unitId: 1, german: 'das Haus', turkish: 'ev', example: 'Das Haus ist alt.', exampleTranslation: 'Ev eski.', synonyms: ['das Gebäude'], level: 'A1' },
  { id: 4, categoryId: 1, unitId: 1, german: 'die Schule', turkish: 'okul', example: 'Ich gehe zur Schule.', exampleTranslation: 'Okula gidiyorum.', synonyms: [], level: 'A1' },
  { id: 5, categoryId: 1, unitId: 1, german: 'das Buch', turkish: 'kitap', example: 'Das Buch ist interessant.', exampleTranslation: 'Kitap ilginç.', synonyms: ['der Band'], level: 'A1' },
  { id: 6, categoryId: 1, unitId: 1, german: 'die Arbeit', turkish: 'iş / çalışma', example: 'Die Arbeit macht Spaß.', exampleTranslation: 'İş eğlenceli.', synonyms: ['der Job', 'die Stelle'], level: 'A1' },
  { id: 7, categoryId: 1, unitId: 1, german: 'das Wasser', turkish: 'su', example: 'Ich trinke Wasser.', exampleTranslation: 'Su içiyorum.', synonyms: [], level: 'A1' },
  { id: 8, categoryId: 1, unitId: 1, german: 'die Zeit', turkish: 'zaman / saat', example: 'Ich habe keine Zeit.', exampleTranslation: 'Zamanım yok.', synonyms: [], level: 'A1' },
  { id: 9, categoryId: 1, unitId: 1, german: 'der Freund', turkish: 'erkek arkadaş / dost', example: 'Mein Freund heißt Mehmet.', exampleTranslation: 'Arkadaşımın adı Mehmet.', synonyms: ['der Kumpel'], level: 'A1' },
  { id: 10, categoryId: 1, unitId: 1, german: 'die Straße', turkish: 'sokak / cadde', example: 'Die Straße ist lang.', exampleTranslation: 'Sokak uzun.', synonyms: ['die Gasse'], level: 'A1' },
  { id: 11, categoryId: 1, unitId: 1, german: 'groß', turkish: 'büyük', example: 'Das ist ein großes Haus.', exampleTranslation: 'Bu büyük bir ev.', synonyms: ['riesig'], level: 'A1' },
  { id: 12, categoryId: 1, unitId: 1, german: 'klein', turkish: 'küçük', example: 'Das Kind ist klein.', exampleTranslation: 'Çocuk küçük.', synonyms: ['winzig'], level: 'A1' },
  { id: 13, categoryId: 1, unitId: 1, german: 'gut', turkish: 'iyi', example: 'Das Essen ist gut.', exampleTranslation: 'Yemek iyi.', synonyms: ['prima', 'toll'], level: 'A1' },
  { id: 14, categoryId: 1, unitId: 1, german: 'schnell', turkish: 'hızlı', example: 'Das Auto ist schnell.', exampleTranslation: 'Araba hızlı.', synonyms: ['rasch', 'flott'], level: 'A1' },
  { id: 15, categoryId: 1, unitId: 1, german: 'gehen', turkish: 'gitmek', example: 'Ich gehe nach Hause.', exampleTranslation: 'Eve gidiyorum.', synonyms: ['laufen', 'wandern'], level: 'A1' },
];
