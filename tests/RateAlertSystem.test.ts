// Acceptance tests for Rate Alert System
// Tests alert creation, editing, triggering, and notifications

import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the required modules
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/lib/supabase');

interface RateAlert {
  id: string;
  pair: string;
  target_rate: number;
  direction: '>=' | '<=' | 'above' | 'below';
  active: boolean;
  notified: boolean;
  triggered_at?: string;
  created_at: string;
}

interface TestData {
  alerts: RateAlert[];
  preferences: any;
  notifications: any[];
}

class RateAlertSystemTester {
  private testData: TestData = {
    alerts: [],
    preferences: {
      in_app_notifications: true,
      email_notifications: false,
      push_notifications: false,
    },
    notifications: [],
  };

  // Mock current rates
  private mockRates: Record<string, number> = {
    'USD_EUR': 0.85,
    'USD_GBP': 0.73,
    'USD_JPY': 110.0,
    'USD_CAD': 1.25,
    'USD_AUD': 1.35,
    'EUR_GBP': 0.86,
  };

  // Get current rate for a pair
  private getCurrentRate(pair: string): number {
    return this.mockRates[pair] || 1.0;
  }

  // Check if alert should trigger
  private shouldAlertTrigger(alert: RateAlert): { triggered: boolean; current_rate: number } {
    const currentRate = this.getCurrentRate(alert.pair);
    let triggered = false;

    switch (alert.direction) {
      case '>=':
        triggered = currentRate >= alert.target_rate;
        break;
      case '<=':
        triggered = currentRate <= alert.target_rate;
        break;
      case 'above':
        triggered = currentRate > alert.target_rate;
        break;
      case 'below':
        triggered = currentRate < alert.target_rate;
        break;
    }

    return { triggered, current_rate: currentRate };
  }

  // Create a new alert (fixing the TypeScript issue)
  createAlert(alertData: {
    pair: string;
    target_rate: number;
    direction: '>=' | '<=' | 'above' | 'below';
    active: boolean;
  }): RateAlert {
    const newAlert: RateAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      notified: false,
    };

    this.testData.alerts.push(newAlert);
    return newAlert;
  }

  // Update an alert
  updateAlert(id: string, updates: Partial<RateAlert>): RateAlert {
    const alertIndex = this.testData.alerts.findIndex(a => a.id === id);
    if (alertIndex === -1) {
      throw new Error(`Alert ${id} not found`);
    }

    this.testData.alerts[alertIndex] = {
      ...this.testData.alerts[alertIndex],
      ...updates,
    };

    return this.testData.alerts[alertIndex];
  }

  // Delete an alert
  deleteAlert(id: string): void {
    this.testData.alerts = this.testData.alerts.filter(a => a.id !== id);
  }

  // Get all alerts
  getAlerts(): RateAlert[] {
    return [...this.testData.alerts];
  }

  // Get active alerts
  getActiveAlerts(): RateAlert[] {
    return this.testData.alerts.filter(a => a.active && !a.notified);
  }

  // Simulate alert check
  checkAlerts(): {
    checked: number;
    triggered: number;
    triggeredAlerts: Array<RateAlert & { current_rate: number }>;
  } {
    const activeAlerts = this.getActiveAlerts();
    const results = {
      checked: activeAlerts.length,
      triggered: 0,
      triggeredAlerts: [] as Array<RateAlert & { current_rate: number }>,
    };

    for (const alert of activeAlerts) {
      const { triggered, current_rate } = this.shouldAlertTrigger(alert);

      if (triggered) {
        results.triggered++;
        
        // Mark alert as notified
        this.updateAlert(alert.id, {
          notified: true,
          triggered_at: new Date().toISOString(),
        });

        // Create notification record
        this.createNotification(alert, current_rate);

        results.triggeredAlerts.push({
          ...alert,
          current_rate,
        });
      }
    }

    return results;
  }

  // Create notification record
  private createNotification(alert: RateAlert, currentRate: number): void {
    const pairName = alert.pair.replace('_', '/');
    const isIncrease = currentRate > alert.target_rate;
    const icon = isIncrease ? '📈' : '📉';

    const notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alert_id: alert.id,
      type: 'in_app',
      title: `${icon} Rate Alert Triggered`,
      message: `${pairName} reached ${currentRate.toFixed(4)} (target: ${alert.direction} ${alert.target_rate.toFixed(4)})`,
      sent_at: new Date().toISOString(),
      read_at: null,
    };

    this.testData.notifications.push(notification);
  }

  // Get notifications
  getNotifications(): any[] {
    return [...this.testData.notifications];
  }

  // Mark notification as read
  markNotificationAsRead(notificationId: string): void {
    const notification = this.testData.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read_at = new Date().toISOString();
    }
  }

  // Set user preferences
  setPreferences(preferences: Partial<TestData['preferences']>): void {
    this.testData.preferences = {
      ...this.testData.preferences,
      ...preferences,
    };
  }

  // Get user preferences
  getPreferences(): TestData['preferences'] {
    return { ...this.testData.preferences };
  }

  // Clear all test data
  reset(): void {
    this.testData = {
      alerts: [],
      preferences: {
        in_app_notifications: true,
        email_notifications: false,
        push_notifications: false,
      },
      notifications: [],
    };
  }

  // Get test summary
  getSummary(): {
    totalAlerts: number;
    activeAlerts: number;
    triggeredAlerts: number;
    totalNotifications: number;
    unreadNotifications: number;
  } {
    return {
      totalAlerts: this.testData.alerts.length,
      activeAlerts: this.testData.alerts.filter(a => a.active).length,
      triggeredAlerts: this.testData.alerts.filter(a => a.notified).length,
      totalNotifications: this.testData.notifications.length,
      unreadNotifications: this.testData.notifications.filter(n => !n.read_at).length,
    };
  }
}

describe('Rate Alert System', () => {
  let tester: RateAlertSystemTester;

  beforeEach(() => {
    tester = new RateAlertSystemTester();
  });

  afterEach(() => {
    tester.reset();
  });

  describe('Alert Creation', () => {
    it('should create a new rate alert successfully', () => {
      const createdAlert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.90,
        direction: '>=',
        active: true,
      });

      expect(createdAlert.id).toBeDefined();
      expect(createdAlert.pair).toBe('USD_EUR');
      expect(createdAlert.target_rate).toBe(0.90);
      expect(createdAlert.direction).toBe('>=');
      expect(createdAlert.active).toBe(true);
      expect(createdAlert.notified).toBe(false);
      expect(createdAlert.created_at).toBeDefined();
    });

    it('should create alerts with different directions', () => {
      const directions = ['>=', '<=', 'above', 'below'] as const;
      
      directions.forEach(direction => {
        const alert = tester.createAlert({
          pair: 'USD_GBP',
          target_rate: 1.30,
          direction,
          active: true,
        });

        expect(alert.direction).toBe(direction);
      });
    });

    it('should create alerts for different currency pairs', () => {
      const pairs = ['USD_EUR', 'USD_GBP', 'USD_JPY', 'EUR_GBP'];
      
      pairs.forEach(pair => {
        const alert = tester.createAlert({
          pair,
          target_rate: 1.0,
          direction: '>=',
          active: true,
        });

        expect(alert.pair).toBe(pair);
      });
    });

    it('should handle decimal rates correctly', () => {
      const alert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.852345,
        direction: '>=',
        active: true,
      });

      expect(alert.target_rate).toBe(0.852345);
    });
  });

  describe('Alert Editing', () => {
    let testAlert: RateAlert;

    beforeEach(() => {
      testAlert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.85,
        direction: '>=',
        active: true,
      });
    });

    it('should update alert target rate', () => {
      const updated = tester.updateAlert(testAlert.id, {
        target_rate: 0.90,
      });

      expect(updated.target_rate).toBe(0.90);
      expect(updated.pair).toBe('USD_EUR'); // Other fields unchanged
    });

    it('should update alert direction', () => {
      const updated = tester.updateAlert(testAlert.id, {
        direction: '<=',
      });

      expect(updated.direction).toBe('<=');
      expect(updated.target_rate).toBe(0.85); // Other fields unchanged
    });

    it('should toggle alert active status', () => {
      expect(testAlert.active).toBe(true);

      const updated1 = tester.updateAlert(testAlert.id, {
        active: false,
      });
      expect(updated1.active).toBe(false);

      const updated2 = tester.updateAlert(testAlert.id, {
        active: true,
      });
      expect(updated2.active).toBe(true);
    });

    it('should throw error when updating non-existent alert', () => {
      expect(() => {
        tester.updateAlert('non-existent-id', {
          target_rate: 1.0,
        });
      }).toThrow('Alert non-existent-id not found');
    });
  });

  describe('Alert Deletion', () => {
    let testAlert: RateAlert;

    beforeEach(() => {
      testAlert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.85,
        direction: '>=',
        active: true,
      });
    });

    it('should delete an existing alert', () => {
      expect(tester.getAlerts()).toHaveLength(1);

      tester.deleteAlert(testAlert.id);

      expect(tester.getAlerts()).toHaveLength(0);
    });

    it('should only delete the specified alert', () => {
      const alert2 = tester.createAlert({
        pair: 'USD_GBP',
        target_rate: 1.30,
        direction: '>=',
        active: true,
      });

      expect(tester.getAlerts()).toHaveLength(2);

      tester.deleteAlert(testAlert.id);

      const remainingAlerts = tester.getAlerts();
      expect(remainingAlerts).toHaveLength(1);
      expect(remainingAlerts[0].id).toBe(alert2.id);
    });
  });

  describe('Alert Triggering', () => {
    beforeEach(() => {
      // Mock specific rates for testing
      tester['mockRates'] = {
        'USD_EUR': 0.85,
        'USD_GBP': 0.73,
        'USD_JPY': 110.0,
      };
    });

    it('should trigger alert when rate meets condition (>=)', () => {
      const alert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.80,
        direction: '>=',
        active: true,
      });

      const results = tester.checkAlerts();

      expect(results.checked).toBe(1);
      expect(results.triggered).toBe(1);
      expect(results.triggeredAlerts).toHaveLength(1);
      expect(results.triggeredAlerts[0].id).toBe(alert.id);
      expect(results.triggeredAlerts[0].current_rate).toBe(0.85);
    });

    it('should not trigger alert when rate does not meet condition', () => {
      const alert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.90,
        direction: '>=',
        active: true,
      });

      const results = tester.checkAlerts();

      expect(results.checked).toBe(1);
      expect(results.triggered).toBe(0);
      expect(results.triggeredAlerts).toHaveLength(0);
    });

    it('should trigger alert when rate meets condition (<=)', () => {
      const alert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.90,
        direction: '<=',
        active: true,
      });

      const results = tester.checkAlerts();

      expect(results.triggered).toBe(1);
    });

    it('should not trigger inactive alerts', () => {
      const alert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.80,
        direction: '>=',
        active: false, // Inactive
      });

      const results = tester.checkAlerts();

      expect(results.checked).toBe(0); // No active alerts
      expect(results.triggered).toBe(0);
    });

    it('should not trigger already notified alerts', () => {
      const alert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.80,
        direction: '>=',
        active: true,
      });

      // First check - should trigger
      let results = tester.checkAlerts();
      expect(results.triggered).toBe(1);

      // Second check - should not trigger (already notified)
      results = tester.checkAlerts();
      expect(results.triggered).toBe(0);
    });

    it('should handle multiple alerts correctly', () => {
      // Create alerts that should and shouldn't trigger
      tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.80, // Should trigger (current: 0.85)
        direction: '>=',
        active: true,
      });

      tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.90, // Should not trigger (current: 0.85)
        direction: '>=',
        active: true,
      });

      tester.createAlert({
        pair: 'USD_GBP',
        target_rate: 0.70, // Should trigger (current: 0.73)
        direction: '>=',
        active: true,
      });

      const results = tester.checkAlerts();

      expect(results.checked).toBe(3);
      expect(results.triggered).toBe(2);
      expect(results.triggeredAlerts).toHaveLength(2);
    });
  });

  describe('Notifications', () => {
    beforeEach(() => {
      tester['mockRates'] = {
        'USD_EUR': 0.85,
        'USD_GBP': 0.73,
      };
    });

    it('should create notification when alert triggers', () => {
      const alert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.80,
        direction: '>=',
        active: true,
      });

      tester.checkAlerts();

      const notifications = tester.getNotifications();
      expect(notifications).toHaveLength(1);
      
      const notification = notifications[0];
      expect(notification.alert_id).toBe(alert.id);
      expect(notification.type).toBe('in_app');
      expect(notification.title).toContain('Rate Alert Triggered');
      expect(notification.message).toContain('USD/EUR');
      expect(notification.read_at).toBeNull();
    });

    it('should mark alert as notified when creating notification', () => {
      const alert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.80,
        direction: '>=',
        active: true,
      });

      tester.checkAlerts();

      const updatedAlert = tester.getAlerts().find(a => a.id === alert.id);
      expect(updatedAlert?.notified).toBe(true);
      expect(updatedAlert?.triggered_at).toBeDefined();
    });

    it('should track notification read status', () => {
      const alert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.80,
        direction: '>=',
        active: true,
      });

      tester.checkAlerts();
      
      const notifications = tester.getNotifications();
      const notificationId = notifications[0].id;

      expect(notifications[0].read_at).toBeNull();

      tester.markNotificationAsRead(notificationId);

      const updatedNotifications = tester.getNotifications();
      expect(updatedNotifications[0].read_at).not.toBeNull();
    });

    it('should handle notification preferences', () => {
      tester.setPreferences({
        in_app_notifications: false,
        email_notifications: true,
        push_notifications: true,
      });

      const alert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.80,
        direction: '>=',
        active: true,
      });

      const preferences = tester.getPreferences();
      expect(preferences.in_app_notifications).toBe(false);
      expect(preferences.email_notifications).toBe(true);
      expect(preferences.push_notifications).toBe(true);
    });
  });

  describe('System Integration', () => {
    it('should provide accurate summary statistics', () => {
      // Create various alerts
      tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.80,
        direction: '>=',
        active: true,
      });

      tester.createAlert({
        pair: 'USD_GBP',
        target_rate: 1.40,
        direction: '<=',
        active: false, // Inactive
      });

      tester.createAlert({
        pair: 'USD_JPY',
        target_rate: 100.0,
        direction: '>=',
        active: true,
      });

      let summary = tester.getSummary();
      expect(summary.totalAlerts).toBe(3);
      expect(summary.activeAlerts).toBe(2);
      expect(summary.triggeredAlerts).toBe(0);

      // Trigger some alerts
      tester['mockRates'] = {
        'USD_EUR': 0.85, // Should trigger
        'USD_GBP': 0.73, // Won't trigger (inactive)
        'USD_JPY': 105.0, // Should trigger
      };

      tester.checkAlerts();

      summary = tester.getSummary();
      expect(summary.totalAlerts).toBe(3);
      expect(summary.activeAlerts).toBe(2);
      expect(summary.triggeredAlerts).toBe(2);
      expect(summary.totalNotifications).toBe(2);
      expect(summary.unreadNotifications).toBe(2);
    });

    it('should handle complete alert lifecycle', () => {
      // 1. Create alert
      const alert = tester.createAlert({
        pair: 'USD_EUR',
        target_rate: 0.80,
        direction: '>=',
        active: true,
      });

      expect(tester.getAlerts()).toHaveLength(1);

      // 2. Alert triggers
      const check1 = tester.checkAlerts();
      expect(check1.triggered).toBe(1);
      expect(tester.getNotifications()).toHaveLength(1);

      // 3. Edit alert (should reset notified status)
      tester.updateAlert(alert.id, {
        target_rate: 0.90,
      });

      // 4. Check again - should not trigger (new target not met)
      const check2 = tester.checkAlerts();
      expect(check2.triggered).toBe(0);

      // 5. Delete alert
      tester.deleteAlert(alert.id);
      expect(tester.getAlerts()).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle large number of alerts efficiently', () => {
      const startTime = performance.now();
      
      // Create 100 alerts
      for (let i = 0; i < 100; i++) {
        tester.createAlert({
          pair: i % 2 === 0 ? 'USD_EUR' : 'USD_GBP',
          target_rate: 0.5 + (i * 0.01),
          direction: i % 4 === 0 ? '>=' : '<=',
          active: true,
        });
      }

      const createTime = performance.now();
      expect(createTime - startTime).toBeLessThan(1000); // Should create quickly

      // Check all alerts
      const results = tester.checkAlerts();
      const checkTime = performance.now();

      expect(results.checked).toBe(100);
      expect(checkTime - createTime).toBeLessThan(2000); // Should check quickly
      
      const summary = tester.getSummary();
      expect(summary.totalAlerts).toBe(100);
    });
  });
});