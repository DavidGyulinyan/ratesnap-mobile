import { getSupabaseClient, SavedRate, RateAlert, User } from '@/lib/supabase-safe';
import { useAuth } from '@/contexts/AuthContext';
import { getAsyncStorage } from './storage';
import { useCallback } from 'react';

const LOCAL_SAVED_RATES_KEY = 'saved_rates';
const LOCAL_RATE_ALERTS_KEY = 'rate_alerts';

// Local storage types
export interface LocalSavedRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: number;
}

export interface LocalRateAlert {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  targetRate: number;
  condition: 'above' | 'below';
  isActive: boolean;
  timestamp: number;
}

// Cloud sync functions for saved rates
export class SavedRatesSync {
  static async uploadLocalToCloud(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { success: false, error: 'Supabase client not available' };
      }

      const localRates = await this.getLocalSavedRates();
      
      if (localRates.length === 0) {
        return { success: true };
      }

      // Clear existing cloud data
      await supabase
        .from('saved_rates')
        .delete()
        .eq('user_id', userId);

      // Upload local data to cloud
      const cloudRates = localRates.map(rate => ({
        user_id: userId,
        from_currency: rate.fromCurrency,
        to_currency: rate.toCurrency,
        rate: rate.rate,
      }));

      const { error } = await supabase
        .from('saved_rates')
        .insert(cloudRates);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async downloadCloudToLocal(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { success: false, error: 'Supabase client not available' };
      }

      const { data, error } = await supabase
        .from('saved_rates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        // Clear local data if no cloud data
        const AsyncStorage = getAsyncStorage();
        await AsyncStorage.removeItem(LOCAL_SAVED_RATES_KEY);
        return { success: true };
      }

      // Convert cloud data to local format
      const localRates: LocalSavedRate[] = data.map((rate: any) => ({
        id: rate.id,
        fromCurrency: rate.from_currency,
        toCurrency: rate.to_currency,
        rate: rate.rate,
        timestamp: new Date(rate.created_at).getTime(),
      }));

      // Save to local storage
      const AsyncStorage = getAsyncStorage();
      await AsyncStorage.setItem(LOCAL_SAVED_RATES_KEY, JSON.stringify(localRates));

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getLocalSavedRates(): Promise<LocalSavedRate[]> {
    try {
      const AsyncStorage = getAsyncStorage();
      const data = await AsyncStorage.getItem(LOCAL_SAVED_RATES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting local saved rates:', error);
      return [];
    }
  }

  static async saveLocalRate(rate: Omit<LocalSavedRate, 'id' | 'timestamp'>): Promise<void> {
    try {
      const AsyncStorage = getAsyncStorage();
      const rates = await this.getLocalSavedRates();
      const newRate: LocalSavedRate = {
        ...rate,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      
      rates.unshift(newRate);
      await AsyncStorage.setItem(LOCAL_SAVED_RATES_KEY, JSON.stringify(rates));
    } catch (error) {
      console.error('Error saving local rate:', error);
    }
  }

  static async deleteLocalRate(id: string): Promise<void> {
    try {
      const AsyncStorage = getAsyncStorage();
      const rates = await this.getLocalSavedRates();
      const filteredRates = rates.filter(rate => rate.id !== id);
      await AsyncStorage.setItem(LOCAL_SAVED_RATES_KEY, JSON.stringify(filteredRates));
    } catch (error) {
      console.error('Error deleting local rate:', error);
    }
  }

  static async clearLocalRates(): Promise<void> {
    try {
      const AsyncStorage = getAsyncStorage();
      await AsyncStorage.removeItem(LOCAL_SAVED_RATES_KEY);
    } catch (error) {
      console.error('Error clearing local rates:', error);
    }
  }
}

// Cloud sync functions for rate alerts
export class RateAlertsSync {
  static async uploadLocalToCloud(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { success: false, error: 'Supabase client not available' };
      }

      const localAlerts = await this.getLocalRateAlerts();
      
      if (localAlerts.length === 0) {
        return { success: true };
      }

      // Clear existing cloud data
      await supabase
        .from('rate_alerts')
        .delete()
        .eq('user_id', userId);

      // Upload local data to cloud
      const cloudAlerts = localAlerts.map(alert => ({
        user_id: userId,
        from_currency: alert.fromCurrency,
        to_currency: alert.toCurrency,
        target_rate: alert.targetRate,
        condition: alert.condition,
        is_active: alert.isActive,
      }));

      const { error } = await supabase
        .from('rate_alerts')
        .insert(cloudAlerts);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async downloadCloudToLocal(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return { success: false, error: 'Supabase client not available' };
      }

      const { data, error } = await supabase
        .from('rate_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        // Clear local data if no cloud data
        const AsyncStorage = getAsyncStorage();
        await AsyncStorage.removeItem(LOCAL_RATE_ALERTS_KEY);
        return { success: true };
      }

      // Convert cloud data to local format
      const localAlerts: LocalRateAlert[] = data.map((alert: any) => ({
        id: alert.id,
        fromCurrency: alert.from_currency,
        toCurrency: alert.to_currency,
        targetRate: alert.target_rate,
        condition: alert.condition,
        isActive: alert.is_active,
        timestamp: new Date(alert.created_at).getTime(),
      }));

      // Save to local storage
      const AsyncStorage = getAsyncStorage();
      await AsyncStorage.setItem(LOCAL_RATE_ALERTS_KEY, JSON.stringify(localAlerts));

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getLocalRateAlerts(): Promise<LocalRateAlert[]> {
    try {
      const AsyncStorage = getAsyncStorage();
      const data = await AsyncStorage.getItem(LOCAL_RATE_ALERTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting local rate alerts:', error);
      return [];
    }
  }

  static async saveLocalAlert(alert: Omit<LocalRateAlert, 'id' | 'timestamp'>): Promise<void> {
    try {
      const AsyncStorage = getAsyncStorage();
      const alerts = await this.getLocalRateAlerts();
      const newAlert: LocalRateAlert = {
        ...alert,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      
      alerts.unshift(newAlert);
      await AsyncStorage.setItem(LOCAL_RATE_ALERTS_KEY, JSON.stringify(alerts));
    } catch (error) {
      console.error('Error saving local alert:', error);
    }
  }

  static async deleteLocalAlert(id: string): Promise<void> {
    try {
      const AsyncStorage = getAsyncStorage();
      const alerts = await this.getLocalRateAlerts();
      const filteredAlerts = alerts.filter(alert => alert.id !== id);
      await AsyncStorage.setItem(LOCAL_RATE_ALERTS_KEY, JSON.stringify(filteredAlerts));
    } catch (error) {
      console.error('Error deleting local alert:', error);
    }
  }

  static async toggleLocalAlert(id: string): Promise<void> {
    try {
      const AsyncStorage = getAsyncStorage();
      const alerts = await this.getLocalRateAlerts();
      const updatedAlerts = alerts.map(alert =>
        alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
      );
      await AsyncStorage.setItem(LOCAL_RATE_ALERTS_KEY, JSON.stringify(updatedAlerts));
    } catch (error) {
      console.error('Error toggling local alert:', error);
    }
  }
}

// Hook for managing sync state
export const useCloudSync = () => {
  const { user } = useAuth();

  const syncSavedRates = useCallback(async (direction: 'upload' | 'download' | 'both'): Promise<boolean> => {
    if (!user) return false;

    try {
      if (direction === 'upload' || direction === 'both') {
        const uploadResult = await SavedRatesSync.uploadLocalToCloud(user.id);
        if (!uploadResult.success) {
          console.error('Upload failed:', uploadResult.error);
          return false;
        }
      }

      if (direction === 'download' || direction === 'both') {
        const downloadResult = await SavedRatesSync.downloadCloudToLocal(user.id);
        if (!downloadResult.success) {
          console.error('Download failed:', downloadResult.error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  }, [user]);

  const syncRateAlerts = useCallback(async (direction: 'upload' | 'download' | 'both'): Promise<boolean> => {
    if (!user) return false;

    try {
      if (direction === 'upload' || direction === 'both') {
        const uploadResult = await RateAlertsSync.uploadLocalToCloud(user.id);
        if (!uploadResult.success) {
          console.error('Alert upload failed:', uploadResult.error);
          return false;
        }
      }

      if (direction === 'download' || direction === 'both') {
        const downloadResult = await RateAlertsSync.downloadCloudToLocal(user.id);
        if (!downloadResult.success) {
          console.error('Alert download failed:', downloadResult.error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Alert sync error:', error);
      return false;
    }
  }, [user]);

  const syncAll = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const savedRatesSuccess = await syncSavedRates('both');
    const rateAlertsSuccess = await syncRateAlerts('both');

    return savedRatesSuccess && rateAlertsSuccess;
  }, [user, syncSavedRates, syncRateAlerts]);

  return {
    syncSavedRates,
    syncRateAlerts,
    syncAll,
  };
};