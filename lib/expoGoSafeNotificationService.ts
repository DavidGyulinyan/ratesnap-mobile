// Expo Go Compatible Notification Service
// This version NEVER imports expo-notifications directly to prevent SDK 53 errors

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

export interface RateAlert {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  targetRate: number;
  direction: 'above' | 'below' | 'equals';
  isActive: boolean;
  lastChecked?: number;
  triggered?: boolean;
  message?: string;
}

export interface NotificationSchedule {
  id: string;
  rateId: string;
  triggerTime: number;
}

class ExpoGoSafeNotificationService {
  private static instance: ExpoGoSafeNotificationService;
  private alerts: {[key: string]: RateAlert} = {};
  private isInitialized = false;
  private expoPushToken?: string;

  static getInstance(): ExpoGoSafeNotificationService {
    if (!ExpoGoSafeNotificationService.instance) {
      ExpoGoSafeNotificationService.instance = new ExpoGoSafeNotificationService();
    }
    return ExpoGoSafeNotificationService.instance;
  }

  // EXP GO COMPATIBLE - No expo-notifications imports at all
  async requestPermissions(): Promise<boolean> {
    try {
      // Always return true for Expo Go - we'll use in-app notifications
      console.log('📱 Expo Go detected - using in-app notifications');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Error in requestPermissions:', error);
      return false;
    }
  }

  // EXP GO COMPATIBLE - No push token attempts
  async getPushToken(): Promise<string | undefined> {
    try {
      console.log('📱 Expo Go detected - push tokens not available, using in-app notifications');
      return undefined; // No push tokens in Expo Go SDK 53+
    } catch (error) {
      console.error('❌ Error in getPushToken:', error);
      return undefined;
    }
  }

  // Local notifications that work perfectly in Expo Go
  async scheduleRateAlert(alert: RateAlert): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.requestPermissions();
      }

      // Store the alert locally
      this.alerts[alert.id] = alert;
      await this.saveAlertsToStorage();

      console.log(`🔔 Scheduled local alert: ${alert.fromCurrency} → ${alert.toCurrency} (target: ${alert.targetRate})`);
      
      // Return a mock notification ID
      return `mock_${alert.id}_${Date.now()}`;
    } catch (error) {
      console.error('❌ Error scheduling rate alert:', error);
      return null;
    }
  }

  // Remove local alert
  async cancelRateAlert(alertId: string): Promise<void> {
    try {
      delete this.alerts[alertId];
      await this.saveAlertsToStorage();
      console.log(`🚫 Cancelled local rate alert: ${alertId}`);
    } catch (error) {
      console.error('❌ Error cancelling rate alert:', error);
    }
  }

  // Send in-app notification (works in Expo Go)
  async sendImmediateAlert(alert: RateAlert): Promise<void> {
    try {
      // Check current rates
      const currentRate = await this.getCurrentRate(alert.fromCurrency, alert.toCurrency);
      const shouldTrigger = this.evaluateAlertTrigger(alert, currentRate);

      if (shouldTrigger) {
        const message = `🎯 ${alert.fromCurrency} → ${alert.toCurrency} is now ${currentRate.toFixed(4)}!`;
        
        // Show in-app alert (works in Expo Go)
        Alert.alert(
          '💰 Rate Alert Triggered!',
          message,
          [
            { text: 'View Details', onPress: () => console.log('View rate details') },
            { text: 'Dismiss', style: 'cancel' }
          ]
        );

        console.log(`🚨 In-app alert sent: ${message}`);
        
        // Mark as triggered
        this.alerts[alert.id] = { ...alert, triggered: true, message };
        await this.saveAlertsToStorage();
      }
    } catch (error) {
      console.error('❌ Error sending immediate alert:', error);
    }
  }

  // Expo Go compatible - no listeners setup needed
  async setupNotificationListeners(): Promise<void> {
    try {
      console.log('📱 Expo Go - in-app notifications will handle all alerts');
      // No notification listeners needed - we use Alert.show()
    } catch (error) {
      console.error('❌ Error setting up notification listeners:', error);
    }
  }

  // Get current rate from local storage
  private async getCurrentRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      const cachedData = await AsyncStorage.getItem('cachedExchangeRates');
      if (cachedData) {
        const data = JSON.parse(cachedData);
        const fromRate = data.conversion_rates[fromCurrency];
        const toRate = data.conversion_rates[toCurrency];
        
        if (fromRate && toRate) {
          return toRate / fromRate;
        }
      }
      throw new Error('No cached rates available');
    } catch (error) {
      console.error('❌ Error getting current rate:', error);
      throw error;
    }
  }

  // Evaluate alert trigger conditions
  private evaluateAlertTrigger(alert: RateAlert, currentRate: number): boolean {
    const threshold = alert.targetRate;
    const tolerance = 0.0001;

    switch (alert.direction) {
      case 'above':
        return currentRate > threshold + tolerance;
      case 'below':
        return currentRate < threshold - tolerance;
      case 'equals':
        return Math.abs(currentRate - threshold) <= tolerance;
      default:
        return false;
    }
  }

  // Save alerts to local storage
  private async saveAlertsToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem('expoGoRateAlerts', JSON.stringify(this.alerts));
    } catch (error) {
      console.error('❌ Error saving alerts to storage:', error);
    }
  }

  // Load alerts from local storage
  async loadAlertsFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('expoGoRateAlerts');
      if (stored) {
        this.alerts = JSON.parse(stored);
        console.log(`📱 Loaded ${Object.keys(this.alerts).length} Expo Go alerts`);
      }
    } catch (error) {
      console.error('❌ Error loading alerts from storage:', error);
    }
  }

  // Get all saved alerts
  getSavedAlerts(): {[key: string]: RateAlert} {
    return { ...this.alerts };
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    scheduledCount: number;
    activeAlerts: number;
    triggeredAlerts: number;
  }> {
    const alertValues = Object.values(this.alerts);
    
    return {
      scheduledCount: alertValues.length,
      activeAlerts: alertValues.filter(alert => alert.isActive).length,
      triggeredAlerts: alertValues.filter(alert => alert.triggered).length,
    };
  }

  // Test method for the test suite
  testEvaluateAlertTrigger(alert: RateAlert, currentRate: number): boolean {
    return this.evaluateAlertTrigger(alert, currentRate);
  }

  async testSaveAlert(alert: RateAlert): Promise<void> {
    this.alerts[alert.id] = alert;
    await this.saveAlertsToStorage();
  }

  async testGetSavedAlerts(): Promise<{[key: string]: RateAlert}> {
    return this.getSavedAlerts();
  }

  // Initialize on first call
  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      await this.loadAlertsFromStorage();
      this.isInitialized = true;
    }
  }
}

export default ExpoGoSafeNotificationService.getInstance();