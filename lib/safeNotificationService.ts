// Safe notification service wrapper that ensures app never crashes
// This provides fallback behavior when notifications fail

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

class SafeNotificationService {
  private static instance: SafeNotificationService;
  private realService: any = null;
  private isLoaded = false;
  private isError = false;

  constructor() {
    this.initializeService();
  }

  static getInstance(): SafeNotificationService {
    if (!SafeNotificationService.instance) {
      SafeNotificationService.instance = new SafeNotificationService();
    }
    return SafeNotificationService.instance;
  }

  private async initializeService() {
    try {
      // Import the real notification service dynamically
      const notificationModule = await import('@/lib/notificationService');
      this.realService = notificationModule.default;
      this.isLoaded = true;
      console.log('✅ Real notification service loaded successfully');
    } catch (error) {
      console.log('⚠️ Notification service failed to load, using safe mode:', error);
      this.isError = true;
      this.isLoaded = true;
    }
  }

  // All methods are safe - they won't crash the app
  async requestPermissions(): Promise<boolean> {
    if (this.isError || !this.realService) {
      console.log('🛡️ Safe mode: notification permissions request skipped');
      return true; // Return true to prevent app from breaking
    }
    
    try {
      return await this.realService.requestPermissions();
    } catch (error) {
      console.log('⚠️ Notification permission error, using safe mode:', error);
      return true; // Safe fallback
    }
  }

  async getPushToken(): Promise<string | undefined> {
    if (this.isError || !this.realService) {
      console.log('🛡️ Safe mode: push token request skipped');
      return undefined; // Safe fallback
    }
    
    try {
      return await this.realService.getPushToken();
    } catch (error) {
      console.log('⚠️ Push token error, using safe mode:', error);
      return undefined;
    }
  }

  async scheduleRateAlert(alert: any): Promise<string | null> {
    if (this.isError || !this.realService) {
      console.log('🛡️ Safe mode: rate alert scheduling skipped');
      return null;
    }
    
    try {
      // Use local notifications only (works in Expo Go)
      return await this.realService.scheduleRateAlert(alert);
    } catch (error) {
      console.log('⚠️ Rate alert scheduling error - using in-app alerts instead:', error);
      return null;
    }
  }

  async cancelRateAlert(alertId: string): Promise<void> {
    if (this.isError || !this.realService) {
      console.log('🛡️ Safe mode: rate alert cancellation skipped');
      return;
    }
    
    try {
      await this.realService.cancelRateAlert(alertId);
    } catch (error) {
      console.log('⚠️ Rate alert cancellation error:', error);
    }
  }

  async sendImmediateAlert(alert: any): Promise<void> {
    if (this.isError || !this.realService) {
      console.log('🛡️ Safe mode: immediate alert skipped');
      return;
    }
    
    try {
      await this.realService.sendImmediateAlert(alert);
    } catch (error) {
      console.log('⚠️ Immediate alert error:', error);
    }
  }

  setupNotificationListeners(): void {
    if (this.isError || !this.realService) {
      console.log('🛡️ Safe mode: notification listeners skipped');
      return;
    }
    
    try {
      this.realService.setupNotificationListeners();
    } catch (error) {
      console.log('⚠️ Notification listeners error:', error);
    }
  }

  async loadScheduledNotifications(): Promise<void> {
    if (this.isError || !this.realService) {
      console.log('🛡️ Safe mode: scheduled notifications loading skipped');
      return;
    }
    
    try {
      await this.realService.loadScheduledNotifications();
    } catch (error) {
      console.log('⚠️ Scheduled notifications loading error:', error);
    }
  }

  async cleanup(): Promise<void> {
    if (this.isError || !this.realService) {
      console.log('🛡️ Safe mode: cleanup skipped');
      return;
    }
    
    try {
      await this.realService.cleanup();
    } catch (error) {
      console.log('⚠️ Cleanup error:', error);
    }
  }

  // Get the real service if available (for testing/debugging)
  getRealService(): any {
    return this.realService;
  }

  // Check if service is working
  isServiceReady(): boolean {
    return this.isLoaded && !this.isError;
  }

  // Force reload if needed
  async reload(): Promise<void> {
    this.isLoaded = false;
    this.isError = false;
    this.realService = null;
    await this.initializeService();
  }
}

// Export the safe service as default
export default SafeNotificationService.getInstance();

// Also export the safe service class for advanced use
export { SafeNotificationService };