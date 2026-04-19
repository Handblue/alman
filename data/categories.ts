export type Category = {
  id: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  totalUnits: number;
};

export const CATEGORIES: Category[] = [
  { id: 1, name: 'A1 Kelimeler', description: 'Temel sözcük bilgisi', color: '#1A73E8', icon: '🔤', totalUnits: 20 },
  { id: 2, name: 'A1–C1 Gramer', description: 'Seviye seviye kapsamlı', color: '#7C4DFF', icon: '📚', totalUnits: 20 },
  { id: 3, name: 'Goethe Sınav', description: 'Sınav hazırlığı', color: '#FF6D00', icon: '🎓', totalUnits: 20 },
  { id: 4, name: 'telc Sınav', description: 'telc formatı', color: '#2E7D32', icon: '📝', totalUnits: 20 },
  { id: 5, name: 'Günlük Hayat', description: 'Market, doktor, banka', color: '#00BCD4', icon: '🏪', totalUnits: 20 },
  { id: 6, name: 'Akademik', description: 'Üniversite terminolojisi', color: '#E91E63', icon: '🔬', totalUnits: 20 },
  { id: 7, name: 'Felsefe', description: 'Felsefi kavramlar', color: '#9C27B0', icon: '💭', totalUnits: 20 },
  { id: 8, name: 'Deyimler', description: 'Redewendungen', color: '#FF9800', icon: '💬', totalUnits: 20 },
];
