// Alert Checker Server Function
// This function checks active rate alerts against current rates and triggers notifications

import { createClient } from '@supabase/supabase-js';

interface AlertResult {
  id: string;
  user_id: string;
  pair: string;
  target_rate: number;
  direction: string;
  triggered: boolean;
  current_rate: number;
  triggered_at?: string;
}

interface NotificationData {
  user_id: string;
  alert_id: string;
  title: string;
  message: string;
  type: 'in_app' | 'email' | 'push';
}

// Initialize Supabase client (server-side)
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mock function to get current rates (in production, this would call your rates API)
function getMockCurrentRate(pair: string): number {
  const rates: Record<string, number> = {
    'USD_EUR': 0.85,
    'USD_GBP': 0.73,
    'USD_JPY': 110.0,
    'USD_CAD': 1.25,
    'USD_AUD': 1.35,
    'EUR_GBP': 0.86,
  };
  return rates[pair] || 1.0;
}

// Check all active alerts
export async function checkAllAlerts(): Promise<{
  checked: number;
  triggered: number;
  errors: string[];
}> {
  const results = {
    checked: 0,
    triggered: 0,
    errors: [] as string[],
  };

  try {
    console.log('🔍 Starting alert check...');

    // Get all active, unnotified alerts
    const { data: alerts, error: fetchError } = await supabase
      .from('rate_alerts')
      .select('*')
      .eq('active', true)
      .eq('notified', false);

    if (fetchError) {
      throw new Error(`Failed to fetch alerts: ${fetchError.message}`);
    }

    if (!alerts || alerts.length === 0) {
      console.log('📭 No active alerts to check');
      return results;
    }

    console.log(`📊 Checking ${alerts.length} active alerts`);

    for (const alert of alerts) {
      try {
        results.checked++;
        const shouldTrigger = await shouldAlertTrigger(alert);

        if (shouldTrigger.triggered) {
          results.triggered++;
          
          // Update alert as triggered
          await triggerAlert(alert, shouldTrigger.current_rate);
          
          // Send notifications
          await sendNotifications(alert, shouldTrigger.current_rate);
          
          console.log(`🔔 Alert triggered: ${alert.pair} ${alert.direction} ${alert.target_rate} (current: ${shouldTrigger.current_rate})`);
        }
      } catch (error) {
        const errorMessage = `Failed to check alert ${alert.id}: ${error}`;
        console.error(errorMessage);
        results.errors.push(errorMessage);
      }
    }

    console.log(`✅ Alert check completed: ${results.checked} checked, ${results.triggered} triggered`);
  } catch (error) {
    const errorMessage = `Alert check failed: ${error}`;
    console.error(errorMessage);
    results.errors.push(errorMessage);
  }

  return results;
}

// Determine if an alert should trigger
async function shouldAlertTrigger(alert: any): Promise<{
  triggered: boolean;
  current_rate: number;
}> {
  try {
    // Get current rate for the pair
    // Get current rate for the pair (inline implementation)
    const currentRate = getMockCurrentRate(alert.pair);
    
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
      default:
        console.warn(`Unknown direction: ${alert.direction}`);
        triggered = false;
    }

    return {
      triggered,
      current_rate: currentRate,
    };
  } catch (error) {
    console.error(`Failed to get current rate for ${alert.pair}:`, error);
    return {
      triggered: false,
      current_rate: 0,
    };
  }
}

// Mark alert as triggered
async function triggerAlert(alert: any, currentRate: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('rate_alerts')
      .update({
        notified: true,
        triggered_at: new Date().toISOString(),
      })
      .eq('id', alert.id);

    if (error) {
      throw error;
    }

    // Record the notification in history
    const { error: historyError } = await supabase
      .from('alert_notifications')
      .insert({
        alert_id: alert.id,
        triggered_rate: currentRate,
        notification_types: ['in_app'], // Will be updated if other types are sent
      });

    if (historyError) {
      console.warn('Failed to record alert notification history:', historyError);
    }
  } catch (error) {
    console.error(`Failed to trigger alert ${alert.id}:`, error);
    throw error;
  }
}

// Send notifications based on user preferences
async function sendNotifications(alert: any, currentRate: number): Promise<void> {
  try {
    // Get user's notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', alert.user_id)
      .single();

    const defaultPreferences = {
      in_app_notifications: true,
      email_notifications: false,
      push_notifications: false,
    };

    const prefs = preferences || defaultPreferences;

    // Create notification content
    const notificationData = createNotificationContent(alert, currentRate);

    // Send in-app notification
    if (prefs.in_app_notifications) {
      await sendInAppNotification(notificationData);
    }

    // Send email notification
    if (prefs.email_notifications) {
      await sendEmailNotification(notificationData);
    }

    // Send push notification
    if (prefs.push_notifications) {
      await sendPushNotification(notificationData);
    }
  } catch (error) {
    console.error(`Failed to send notifications for alert ${alert.id}:`, error);
    // Don't throw - notifications are not critical
  }
}

// Create notification content
function createNotificationContent(alert: any, currentRate: number): NotificationData {
  const pairName = alert.pair.replace('_', '/');
  const isIncrease = currentRate > alert.target_rate;
  const icon = isIncrease ? '📈' : '📉';
  
  return {
    user_id: alert.user_id,
    alert_id: alert.id,
    title: `${icon} Rate Alert Triggered`,
    message: `${pairName} reached ${currentRate.toFixed(4)} (target: ${alert.direction} ${alert.target_rate.toFixed(4)})`,
    type: 'in_app', // Default, will be overridden by actual type
  };
}

// Send in-app notification
async function sendInAppNotification(data: NotificationData): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: data.user_id,
        alert_id: data.alert_id,
        type: 'in_app',
        title: data.title,
        message: data.message,
        data: {
          current_rate: true,
          triggered_at: new Date().toISOString(),
        },
      });

    if (error) {
      throw error;
    }

    console.log(`📱 In-app notification sent to user ${data.user_id}`);
  } catch (error) {
    console.error('Failed to send in-app notification:', error);
  }
}

// Send email notification (placeholder - integrate with SendGrid)
async function sendEmailNotification(data: NotificationData): Promise<void> {
  try {
    // This would integrate with SendGrid, Mailgun, or similar service
    console.log(`📧 Email notification would be sent to user ${data.user_id}: ${data.title}`);
    
    // Example SendGrid integration (commented out):
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    await sgMail.send({
      to: user.email, // You'd need to fetch user email
      from: 'alerts@yourapp.com',
      subject: data.title,
      text: data.message,
      html: `<p>${data.message}</p>`,
    });
    */
    
    // Record the email notification attempt
    await supabase
      .from('notifications')
      .insert({
        user_id: data.user_id,
        alert_id: data.alert_id,
        type: 'email',
        title: data.title,
        message: data.message,
      });

  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}

// Send push notification (placeholder - integrate with FCM)
async function sendPushNotification(data: NotificationData): Promise<void> {
  try {
    // This would integrate with Firebase Cloud Messaging (FCM)
    console.log(`📲 Push notification would be sent to user ${data.user_id}: ${data.title}`);
    
    // Example FCM integration (commented out):
    /*
    const admin = require('firebase-admin');
    
    // You'd need to fetch user's FCM token from database
    const { data: userDevice } = await supabase
      .from('user_devices')
      .select('fcm_token')
      .eq('user_id', data.user_id)
      .single();
    
    if (userDevice?.fcm_token) {
      await admin.messaging().send({
        token: userDevice.fcm_token,
        notification: {
          title: data.title,
          body: data.message,
        },
        data: {
          alert_id: data.alert_id,
          type: 'rate_alert',
        },
      });
    }
    */
    
    // Record the push notification attempt
    await supabase
      .from('notifications')
      .insert({
        user_id: data.user_id,
        alert_id: data.alert_id,
        type: 'push',
        title: data.title,
        message: data.message,
      });

  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

// HTTP handler for scheduled execution (Supabase Edge Function)
export async function handler(req: Request): Promise<Response> {
  try {
    // Allow manual triggering via POST request
    if (req.method === 'POST') {
      const results = await checkAllAlerts();
      
      return new Response(JSON.stringify({
        success: true,
        ...results,
        timestamp: new Date().toISOString(),
      }), {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // For scheduled execution (GET)
    const results = await checkAllAlerts();
    
    return new Response(JSON.stringify({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
  } catch (error) {
    console.error('Alert checker error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// Export for use in other parts of the application
export default handler;

// Utility function to check a single user's alerts
export async function checkUserAlerts(userId: string): Promise<{
  checked: number;
  triggered: number;
  alerts: any[];
}> {
  try {
    const { data: alerts, error } = await supabase
      .from('rate_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .eq('notified', false);

    if (error) {
      throw error;
    }

    const results = {
      checked: 0,
      triggered: 0,
      alerts: [] as any[],
    };

    for (const alert of alerts || []) {
      results.checked++;
      const shouldTrigger = await shouldAlertTrigger(alert);

      if (shouldTrigger.triggered) {
        results.triggered++;
        results.alerts.push({
          ...alert,
          current_rate: shouldTrigger.current_rate,
          triggered_at: new Date().toISOString(),
        });
        
        await triggerAlert(alert, shouldTrigger.current_rate);
        await sendNotifications(alert, shouldTrigger.current_rate);
      }
    }

    return results;
  } catch (error) {
    console.error(`Failed to check alerts for user ${userId}:`, error);
    throw error;
  }
}