// Mock for firebase/auth
module.exports = {
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'test-user-id', email: 'test@test.com' },
  })),
  signInAnonymously: jest.fn().mockResolvedValue({
    user: { uid: 'test-user-id' },
  }),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({ uid: 'test-user-id' });
    return jest.fn();
  }),
  signOut: jest.fn().mockResolvedValue(undefined),
  initializeAuth: jest.fn(),
  getReactNativePersistence: jest.fn(),
};
