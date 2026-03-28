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
];
