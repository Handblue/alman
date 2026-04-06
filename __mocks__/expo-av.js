// Manual mock for expo-av
const mockSound = {
  setOnPlaybackStatusUpdate: jest.fn(),
  unloadAsync: jest.fn().mockResolvedValue(undefined),
  stopAsync: jest.fn().mockResolvedValue(undefined),
  pauseAsync: jest.fn().mockResolvedValue(undefined),
  playAsync: jest.fn().mockResolvedValue(undefined),
};

const Sound = {
  createAsync: jest.fn().mockResolvedValue({ sound: mockSound, status: { isLoaded: true } }),
};

const Audio = {
  Sound,
  setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  RecordingOptionsPresets: {},
  Recording: jest.fn().mockImplementation(() => ({
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    startAsync: jest.fn().mockResolvedValue(undefined),
    stopAndUnloadAsync: jest.fn().mockResolvedValue(undefined),
    getURI: jest.fn().mockReturnValue('file:///mock/recording.m4a'),
  })),
};

module.exports = {
  Audio,
  Sound,
  Video: {},
};
