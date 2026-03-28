export type LevelQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
};

export const levelTestQuestions: LevelQuestion[] = [
  { id: 1, question: '"Hund" ne anlama gelir?', options: ['Kedi', 'Köpek', 'Kuş', 'Balık'], correctIndex: 1, level: 'A1' },
  { id: 2, question: '"Ich ___ müde." (sein)', options: ['bist', 'bin', 'ist', 'sind'], correctIndex: 1, level: 'A1' },
  { id: 3, question: '"Morgen" ne anlama gelir?', options: ['Dün', 'Bugün', 'Yarın', 'Hafta'], correctIndex: 2, level: 'A2' },
  { id: 4, question: '"Weil" hangi bağlaç türüdür?', options: ['Koordinatif', 'Subordinatif', 'Adversatif', 'Disjunktif'], correctIndex: 1, level: 'B1' },
  { id: 5, question: '"Konjunktiv II" ne için kullanılır?', options: ['Geçmiş', 'Şimdiki', 'Olasılık/dilek', 'Emir'], correctIndex: 2, level: 'B2' },
];
