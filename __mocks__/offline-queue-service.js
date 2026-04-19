const OfflineQueueService = {
  getInstance: jest.fn(() => ({
    enqueue: jest.fn().mockResolvedValue(undefined),
    processQueue: jest.fn().mockResolvedValue(undefined),
    getQueue: jest.fn().mockReturnValue([]),
  })),
};
module.exports = { OfflineQueueService };
