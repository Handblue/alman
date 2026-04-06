// Mock for firebase/firestore
const mockTimestamp = {
  fromDate: jest.fn((date) => ({ toDate: () => date, seconds: Math.floor(date.getTime() / 1000) })),
  now: jest.fn(() => ({ toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000) })),
};

module.exports = {
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => null }),
  getDocs: jest.fn().mockResolvedValue({ docs: [], empty: true }),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  addDoc: jest.fn().mockResolvedValue({ id: 'mock-id' }),
  query: jest.fn((...args) => args[0]),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn((ref, callback) => {
    if (typeof callback === 'function') callback({ docs: [], empty: true });
    return jest.fn(); // unsubscribe
  }),
  arrayUnion: jest.fn((...items) => items),
  arrayRemove: jest.fn((...items) => items),
  increment: jest.fn((n) => n),
  serverTimestamp: jest.fn(() => new Date().toISOString()),
  Timestamp: mockTimestamp,
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
  getFirestore: jest.fn(() => ({})),
  initializeFirestore: jest.fn(() => ({})),
  getStorage: jest.fn(() => ({})),
};
