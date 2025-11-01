// Jest setup file
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        enableCustomDashboard: false,
      },
    },
  },
}));