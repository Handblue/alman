// Design tokens — WortKrieg v3 (aligned with hi-fi prototype)
export const Colors = {
  // Light surfaces
  bg: {
    light:        '#F6F7FB',
    card:         '#FFFFFF',
    tint:         '#EEF2FF',
    primaryDark:  '#0D1B2A',
    primaryLight: '#F6F7FB',
    cardDark:     '#1A2A3A',
    cardDark2:    '#243447',
    cardLight:    '#FFFFFF',
    secondary:    '#162534',
  },
  border: {
    primary:  '#D9E1EC',
    dark:     'rgba(255,255,255,0.08)',
  },
  text: {
    primary:       '#101828',
    muted:         '#5B6577',
    primaryDark:   '#F8FAFC',
    primaryLight:  '#101828',
    mutedDark:     '#7A93A8',
    secondary:     '#7A93A8',
    secondaryLight:'#5B6577',
    tertiary:      '#9AACB8',
  },
  // Brand
  brand: {
    violet:      '#7C6CFF',
    violetDeep:  '#5A4BCC',
    violetSoft:  '#E9E2FF',
    primary:     '#7C6CFF',
    dark:        '#5A4BCC',
  },
  // Accent palette
  accent: {
    mint:     '#BFEFD8',
    mintDark: '#0E3A26',
    mintMid:  '#2F6B4F',
    sky:      '#B8D8FF',
    butter:   '#E7F28B',
    peach:    '#FFC7AE',
    blush:    '#F7CDD9',
    gold:     '#FFD700',
    orange:   '#FF6D00',
    primary:  '#7C6CFF',
    secondary:'#00BCD4',
    success:  '#22C55E',
  },
  status: {
    success: '#22C55E',
    error:   '#EF4444',
    warning: '#FFB300',
    info:    '#00BCD4',
  },
  word: {
    green: '#4CAF50',
  },
  // Legacy battle alias
  battle: {
    purple: '#7C6CFF',
  },
  gradient: {
    primary:        ['#7C6CFF', '#00BCD4'] as const,
    secondary:      ['#5A4BCC', '#7C6CFF'] as const,
    battle:         ['#7C6CFF', '#00BCD4'] as const,
    leaderboard:    ['#512DA8', '#7C6CFF'] as const,
    quizResult:     ['#7C6CFF', '#448AFF'] as const,
    cta:            ['#7C6CFF', '#00BCD4'] as const,
    dailyChallenge: ['#0E3A26', '#1A4A30'] as const,
    exploreHero:    ['#FF6D00', '#FFCA28'] as const,
    premium:        ['#FFD700', '#FFC107'] as const,
    heroCard:       ['#7C6CFF', '#9A8FFF'] as const,
  },
} as const;
