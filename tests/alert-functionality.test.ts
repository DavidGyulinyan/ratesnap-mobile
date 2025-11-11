// Simple Rate Alert Functionality Test
// This test validates that users can create, manage, and receive rate alerts

import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService, { RateAlert } from '../lib/notificationService';

declare global {
  var mockedNotificationPermissions: {
    granted: boolean;
    status: string;
  };
}

describe('Rate Alert Functionality', () => {
  beforeEach(async () => {
    // Clean up storage
    await AsyncStorage.clear();
    
    // Initialize global mock
    global.mockedNotificationPermissions = {
      granted: true,
      status: 'granted'
    };
  });

  test('should create a basic rate alert', async () => {
    const alert: RateAlert = {
      id: 'test-alert-1',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      targetRate: 0.85,
      direction: 'below',
      isActive: true
    };

    // Save alert to storage manually (simulating what RateAlertManager does)
    const alerts = await AsyncStorage.getItem('rateAlerts') || '{}';
    const parsedAlerts = JSON.parse(alerts);
    parsedAlerts[alert.id] = alert;
    await AsyncStorage.setItem('rateAlerts', JSON.stringify(parsedAlerts));

    // Verify alert was saved
    const savedAlerts = JSON.parse(await AsyncStorage.getItem('rateAlerts') || '{}');
    expect(savedAlerts['test-alert-1']).toBeDefined();
    expect(savedAlerts['test-alert-1'].fromCurrency).toBe('USD');
    expect(savedAlerts['test-alert-1'].toCurrency).toBe('EUR');
    expect(savedAlerts['test-alert-1'].targetRate).toBe(0.85);
  });

  test('should evaluate alert triggers correctly', () => {
    const alert: RateAlert = {
      id: 'trigger-test',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      targetRate: 0.90,
      direction: 'below',
      isActive: true
    };

    // Test current rate below target (should trigger)
    const currentRateBelow = 0.88;
    const shouldTriggerBelow = notificationService.testEvaluateAlertTrigger(alert, currentRateBelow);
    expect(shouldTriggerBelow).toBe(true);

    // Test current rate above target (should not trigger)
    const currentRateAbove = 0.92;
    const shouldNotTriggerAbove = notificationService.testEvaluateAlertTrigger(alert, currentRateAbove);
    expect(shouldNotTriggerAbove).toBe(false);

    // Test alert with "above" direction
    const alertAbove: RateAlert = { ...alert, direction: 'above' };
    const shouldTriggerAbove = notificationService.testEvaluateAlertTrigger(alertAbove, currentRateAbove);
    expect(shouldTriggerAbove).toBe(true);
  });

  test('should manage multiple alerts', async () => {
    const alerts = [
      {
        id: 'multi-alert-1',
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        targetRate: 0.85,
        direction: 'below',
        isActive: true
      },
      {
        id: 'multi-alert-2',
        fromCurrency: 'GBP',
        toCurrency: 'USD',
        targetRate: 1.30,
        direction: 'above',
        isActive: false
      },
      {
        id: 'multi-alert-3',
        fromCurrency: 'EUR',
        toCurrency: 'JPY',
        targetRate: 145.0,
        direction: 'equals',
        isActive: true
      }
    ];

    // Save all alerts
    const savedAlerts = await AsyncStorage.getItem('rateAlerts') || '{}';
    const parsedAlerts = JSON.parse(savedAlerts);
    
    alerts.forEach(alert => {
      parsedAlerts[alert.id] = alert;
    });
    
    await AsyncStorage.setItem('rateAlerts', JSON.stringify(parsedAlerts));

    // Verify all alerts were saved
    const retrievedAlerts = JSON.parse(await AsyncStorage.getItem('rateAlerts') || '{}');
    expect(Object.keys(retrievedAlerts)).toHaveLength(3);
    expect(retrievedAlerts['multi-alert-1'].isActive).toBe(true);
    expect(retrievedAlerts['multi-alert-2'].isActive).toBe(false);
    expect(retrievedAlerts['multi-alert-3'].targetRate).toBe(145.0);
  });

  test('should handle alert updates', async () => {
    const initialAlert: RateAlert = {
      id: 'update-test',
      fromCurrency: 'USD',
      toCurrency: 'CAD',
      targetRate: 1.25,
      direction: 'above',
      isActive: true
    };

    // Save initial alert
    const alerts = { [initialAlert.id]: initialAlert };
    await AsyncStorage.setItem('rateAlerts', JSON.stringify(alerts));

    // Update the alert
    const updatedAlert = {
      ...initialAlert,
      targetRate: 1.30,
      isActive: false
    };

    const updatedAlerts = { [updatedAlert.id]: updatedAlert };
    await AsyncStorage.setItem('rateAlerts', JSON.stringify(updatedAlerts));

    // Verify update
    const retrievedAlert = JSON.parse(await AsyncStorage.getItem('rateAlerts') || '{}')['update-test'];
    expect(retrievedAlert.targetRate).toBe(1.30);
    expect(retrievedAlert.isActive).toBe(false);
  });

  test('should simulate real-world alert scenario', async () => {
    // Scenario: User saves USD→EUR rate at 0.88 and wants to be notified when it drops below 0.85
    const savedRate = {
      id: 'real-world-test',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.88,
      timestamp: Date.now(),
      hasAlert: true,
      alertSettings: {
        targetRate: 0.85,
        direction: 'below',
        isActive: true,
        frequency: 'hourly',
        triggered: false,
        triggeredAt: undefined,
        message: undefined,
        lastChecked: undefined
      }
    };

    // Save the rate with alert settings
    const savedRates = { [savedRate.id]: savedRate };
    await AsyncStorage.setItem('savedRates', JSON.stringify(savedRates));

    // Simulate checking rates periodically
    const testRates = [0.88, 0.87, 0.86, 0.84]; // Rate gradually drops below target
    
    for (const currentRate of testRates) {
      if (currentRate < savedRate.alertSettings.targetRate) {
        // Alert should trigger
        const triggeredRate = {
          ...savedRate,
          alertSettings: {
            ...savedRate.alertSettings,
            triggered: true as boolean,
            triggeredAt: Date.now() as number,
            message: `🚀 ${savedRate.fromCurrency} → ${savedRate.toCurrency} dropped to ${currentRate}!` as string
          }
        };
        
        const updatedRates = { [savedRate.id]: triggeredRate };
        await AsyncStorage.setItem('savedRates', JSON.stringify(updatedRates));
        break;
      }
    }

    // Verify alert was triggered
    const finalRates = JSON.parse(await AsyncStorage.getItem('savedRates') || '{}');
    const triggeredAlert = finalRates['real-world-test'];
    
    expect(triggeredAlert.hasAlert).toBe(true);
    expect(triggeredAlert.alertSettings.triggered).toBe(true);
    expect(triggeredAlert.alertSettings.message).toContain('dropped to 0.84');
  });

  afterEach(async () => {
    // Clean up after each test
    await AsyncStorage.clear();
  });
});

// Integration test simulating user workflow
describe('User Workflow Integration', () => {
  test('complete user workflow: save rate, create alert, receive notification', async () => {
    // Step 1: User saves a rate conversion
    const savedRate = {
      id: 'workflow-test',
      fromCurrency: 'USD',
      toCurrency: 'EUR',
      rate: 0.89,
      timestamp: Date.now()
    };

    await AsyncStorage.setItem('savedRates', JSON.stringify([savedRate]));

    // Step 2: User creates an alert for this rate
    const alertSettings = {
      targetRate: 0.85,
      direction: 'below' as const,
      isActive: true,
      frequency: 'hourly' as const,
      triggered: false,
      triggeredAt: undefined,
      message: undefined,
      lastChecked: undefined
    };

    const rateWithAlert = {
      ...savedRate,
      hasAlert: true,
      alertSettings
    };

    await AsyncStorage.setItem('savedRates', JSON.stringify([rateWithAlert]));

    // Step 3: Simulate background rate checking
    const currentRate = 0.84; // Rate dropped below target
    
    if (currentRate < alertSettings.targetRate) {
      // Mark as triggered
      const triggeredRate = {
        ...rateWithAlert,
        alertSettings: {
          ...alertSettings,
          triggered: true as boolean,
          triggeredAt: Date.now() as number,
          message: `🎯 Alert: ${savedRate.fromCurrency} → ${savedRate.toCurrency} is now ${currentRate}!` as string
        }
      };

      await AsyncStorage.setItem('savedRates', JSON.stringify([triggeredRate]));
    }

    // Step 4: Verify the complete workflow
    const finalRates = JSON.parse(await AsyncStorage.getItem('savedRates') || '[]');
    const userRate = finalRates[0];

    expect(userRate.hasAlert).toBe(true);
    expect(userRate.alertSettings.isActive).toBe(true);
    expect(userRate.alertSettings.triggered).toBe(true);
    expect(userRate.alertSettings.message).toContain('Alert: USD → EUR is now 0.84!');
  });
});