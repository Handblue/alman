const NotificationService = {
  getInstance: jest.fn(() => ({
    scheduleDailyReminder: jest.fn().mockResolvedValue(undefined),
    cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
    sendLocalNotification: jest.fn().mockResolvedValue(undefined),
  })),
};
module.exports = { NotificationService };
