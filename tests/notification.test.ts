// Rate Alert Notification Test Suite
// This test verifies the complete notification functionality for rate alerts

import notificationService, { RateAlert } from '../lib/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare global {
  var mockedNotificationPermissions: {
    granted: boolean;
    status: string;
  };
}

describe('Rate Alert Notification System', () => {
  beforeEach(async () => {
    // Clean up any existing data
    await AsyncStorage.clear();
    
    // Initialize global mock
    global.mockedNotificationPermissions = {
      granted: true,
      status: 'granted'
    };
  });

  describe('Notification Service Initialization', () => {
    test('should request notification permissions successfully', async () => {
      // Test permission request
      const hasPermissions = await notificationService.requestPermissions();
      expect(hasPermissions).toBe(true);
      
      // Verify permissions were checked
      expect(global.mockedNotificationPermissions).toBeDefined();
    });

    test('should handle permission denial gracefully', async () => {
      // Mock permission denial
      global.mockedNotificationPermissions = {
        granted: false,
        status: 'denied'
      };
      
      const hasPermissions = await notificationService.requestPermissions();
      expect(hasPermissions).toBe(false);
    });

    test('should get Expo push token', async () => {
      const token = await notificationService.getPushToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('Rate Alert Scheduling', () => {
    const sampleAlert: RateAlert = {
      id: 'test-alert-1',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      targetRate: 0.85,
      direction: 'below',
      isActive: true,
      lastChecked: Date.now(),
      triggered: false
    };

    test('should schedule rate alerts successfully', async () => {
      const notificationId = await notificationService.scheduleRateAlert(sampleAlert);
      expect(notificationId).toBeDefined();
      expect(typeof notificationId).toBe('string');
    });

    test('should save scheduled notifications to storage', async () => {
      await notificationService.scheduleRateAlert(sampleAlert);
      
      const scheduledData = await AsyncStorage.getItem('scheduledRateAlerts');
      const parsedData = scheduledData ? JSON.parse(scheduledData) : {};
      
      expect(Object.keys(parsedData)).toContain('test-alert-1');
      expect(parsedData['test-alert-1']).toHaveProperty('id');
      expect(parsedData['test-alert-1']).toHaveProperty('rateId');
      expect(parsedData['test-alert-1']).toHaveProperty('triggerTime');
    });

    test('should cancel rate alerts successfully', async () => {
      const notificationId = await notificationService.scheduleRateAlert(sampleAlert);
      expect(notificationId).toBeDefined();
      
      await notificationService.cancelRateAlert('test-alert-1');
      
      // Verify notification was removed from storage
      const scheduledData = await AsyncStorage.getItem('scheduledRateAlerts');
      const parsedData = scheduledData ? JSON.parse(scheduledData) : {};
      
      expect(parsedData['test-alert-1']).toBeUndefined();
    });
  });

  describe('Alert Trigger Evaluation', () => {
    test('should trigger alert when rate goes above target', async () => {
      // Test "above" direction
      const currentRate = 0.90;
      const targetRate = 0.85;
      
      const shouldTrigger = notificationService.testEvaluateAlertTrigger(
        { direction: 'above', targetRate } as RateAlert,
        currentRate
      );
      
      expect(shouldTrigger).toBe(true);
    });

    test('should trigger alert when rate goes below target', async () => {
      // Test "below" direction
      const currentRate = 0.80;
      const targetRate = 0.85;
      
      const shouldTrigger = notificationService.testEvaluateAlertTrigger(
        { direction: 'below', targetRate } as RateAlert,
        currentRate
      );
      
      expect(shouldTrigger).toBe(true);
    });

    test('should trigger alert when rate equals target', async () => {
      // Test "equals" direction
      const currentRate = 0.85;
      const targetRate = 0.85;
      
      const shouldTrigger = notificationService.testEvaluateAlertTrigger(
        { direction: 'equals', targetRate } as RateAlert,
        currentRate
      );
      
      expect(shouldTrigger).toBe(true);
    });

    test('should not trigger alert when conditions not met', async () => {
      const currentRate = 0.88;
      const targetRate = 0.85;
      
      // For "above" direction, currentRate should be > targetRate
      const shouldNotTrigger = notificationService.testEvaluateAlertTrigger(
        { direction: 'above', targetRate } as RateAlert,
        currentRate
      );
      
      expect(shouldNotTrigger).toBe(false);
    });
  });

  describe('Alert Storage and Persistence', () => {
    test('should save alerts to storage', async () => {
      const alert: RateAlert = {
        id: 'test-save-alert',
        fromCurrency: 'USD',
        toCurrency: 'GBP',
        targetRate: 0.75,
        direction: 'above',
        isActive: true
      };

      await notificationService.testSaveAlert(alert);
      
      const savedAlerts = await AsyncStorage.getItem('rateAlerts');
      const parsedAlerts = savedAlerts ? JSON.parse(savedAlerts) : {};
      
      expect(parsedAlerts['test-save-alert']).toBeDefined();
      expect(parsedAlerts['test-save-alert'].fromCurrency).toBe('USD');
      expect(parsedAlerts['test-save-alert'].toCurrency).toBe('GBP');
    });

    test('should retrieve saved alerts from storage', async () => {
      const alert: RateAlert = {
        id: 'test-retrieve-alert',
        fromCurrency: 'EUR',
        toCurrency: 'JPY',
        targetRate: 145.0,
        direction: 'below',
        isActive: false
      };

      await notificationService.testSaveAlert(alert);
      const savedAlerts = await notificationService.testGetSavedAlerts();
      
      expect(savedAlerts['test-retrieve-alert']).toBeDefined();
      expect(savedAlerts['test-retrieve-alert'].fromCurrency).toBe('EUR');
    });
  });

  describe('Notification Statistics', () => {
    beforeEach(async () => {
      // Set up test alerts
      const alert1: RateAlert = {
        id: 'stats-alert-1',
        fromCurrency: 'USD',
        toCurrency: 'CAD',
        targetRate: 1.25,
        direction: 'above',
        isActive: true,
        triggered: false
      };

      const alert2: RateAlert = {
        id: 'stats-alert-2',
        fromCurrency: 'EUR',
        toCurrency: 'CHF',
        targetRate: 1.05,
        direction: 'below',
        isActive: true,
        triggered: true
      };

      await notificationService.testSaveAlert(alert1);
      await notificationService.testSaveAlert(alert2);
      
      // Schedule one notification
      await notificationService.scheduleRateAlert(alert1);
    });

    test('should provide accurate notification statistics', async () => {
      const stats = await notificationService.getNotificationStats();
      
      expect(stats.scheduledCount).toBe(1); // Only alert1 is scheduled
      expect(stats.activeAlerts).toBe(2);   // Both alerts are active
      expect(stats.triggeredAlerts).toBe(1); // Only alert2 has been triggered
    });
  });

  describe('Background Monitoring Simulation', () => {
    test('should simulate rate change and trigger alerts', async () => {
      // Create an alert that should trigger
      const triggerAlert: RateAlert = {
        id: 'trigger-test',
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        targetRate: 0.90, // Target: USD should go below 0.90
        direction: 'below',
        isActive: true,
        triggered: false
      };

      await notificationService.testSaveAlert(triggerAlert);

      // Simulate current rate being below target
      const currentRate = 0.88; // Below 0.90, should trigger
      
      const shouldTrigger = notificationService.testEvaluateAlertTrigger(triggerAlert, currentRate);
      expect(shouldTrigger).toBe(true);

      // Test immediate alert sending
      await notificationService.sendImmediateAlert(triggerAlert);
      
      // Verify alert was updated to triggered state
      const updatedAlerts = await notificationService.testGetSavedAlerts();
      expect(updatedAlerts['trigger-test'].triggered).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete alert lifecycle', async () => {
      // 1. Create alert
      const alert: RateAlert = {
        id: 'lifecycle-test',
        fromCurrency: 'GBP',
        toCurrency: 'USD',
        targetRate: 1.30,
        direction: 'above',
        isActive: true
      };

      // 2. Schedule notification
      const notificationId = await notificationService.scheduleRateAlert(alert);
      expect(notificationId).toBeDefined();

      // 3. Verify in storage
      const scheduledData = await AsyncStorage.getItem('scheduledRateAlerts');
      expect(scheduledData).toContain('lifecycle-test');

      // 4. Update alert
      alert.targetRate = 1.35;
      alert.isActive = false;
      await notificationService.testSaveAlert(alert);

      // 5. Cancel notification
      await notificationService.cancelRateAlert('lifecycle-test');

      // 6. Verify cleanup
      const updatedScheduled = await AsyncStorage.getItem('scheduledRateAlerts');
      const parsedUpdated = updatedScheduled ? JSON.parse(updatedScheduled) : {};
      expect(parsedUpdated['lifecycle-test']).toBeUndefined();

      // 7. Verify final state
      const finalAlerts = await notificationService.testGetSavedAlerts();
      expect(finalAlerts['lifecycle-test'].isActive).toBe(false);
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await notificationService.cleanup();
    await AsyncStorage.clear();
  });
});

// Mock AsyncStorage methods
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage').default
);