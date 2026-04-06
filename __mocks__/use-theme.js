const mockColors = {
  background: '#FAFAFA',
  card: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  primary: '#1A73E8',
  accent: '#FF6D00',
  success: '#2E7D32',
  error: '#FF5252',
  warning: '#FFB300',
  info: '#00BCD4',
  gold: '#FFD700',
  purple: '#7C4DFF',
  green: '#4CAF50',
};

module.exports = {
  useTheme: () => ({
    isDark: false,
    colors: mockColors,
    toggleTheme: jest.fn(),
  }),
};
