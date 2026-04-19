// Mock for firebase/storage
module.exports = {
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn().mockResolvedValue({}),
  getDownloadURL: jest.fn().mockResolvedValue('https://mock.url/file'),
  deleteObject: jest.fn().mockResolvedValue(undefined),
};
