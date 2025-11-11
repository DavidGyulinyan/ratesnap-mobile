# Rate Alert Notification System Documentation

## Overview
The RateSnap mobile app now includes a comprehensive notification system that alerts users when their saved exchange rates reach target values. Users can create, manage, and receive notifications for multiple currency pairs with different alert conditions.

## Features Implemented

### 1. Notification Service (`lib/notificationService.ts`)
- **Permission Management**: Handles notification permissions for iOS and Android
- **Push Token Management**: Manages Expo push tokens for remote notifications
- **Scheduled Notifications**: Supports both immediate and scheduled notifications
- **Background Monitoring**: Periodic rate checking with configurable intervals
- **Alert Storage**: Persistent storage of alert configurations and status

### 2. Rate Alert Manager (`components/RateAlertManager.tsx`)
- **Alert Creation**: Users can create alerts for any saved rate
- **Alert Configuration**:
  - Target rate threshold
  - Direction: Above, Below, or Equals target
  - Frequency: Hourly or Daily checks
  - Active/Inactive status toggle
- **Alert Management**: Edit, delete, and toggle alert status
- **Real-time Status**: Shows last checked time and trigger status

### 3. Background Rate Monitoring
- **Periodic Checks**: Monitors all active alerts every 5 minutes when app is active
- **Trigger Evaluation**: Compares current rates with alert thresholds
- **Immediate Notifications**: Sends notifications when conditions are met
- **State Management**: Tracks triggered alerts and prevents duplicate notifications

### 4. Extended Data Models
```typescript
interface AlertSettings {
  targetRate: number;
  direction: 'above' | 'below' | 'equals';
  isActive: boolean;
  frequency: 'hourly' | 'daily';
  lastChecked?: number;
  triggered?: boolean;
  triggeredAt?: number;
  message?: string;
}

interface SavedRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: number;
  hasAlert?: boolean;
  alertSettings?: AlertSettings;
}
```

## User Experience

### How Notifications Work

1. **Save a Rate**: Users save exchange rates they want to monitor
2. **Create Alert**: Users click "Create Alert" on any saved rate
3. **Set Conditions**: Users define target rate, direction, and frequency
4. **Activate Monitoring**: System begins checking rates automatically
5. **Receive Notifications**: Users get notified when conditions are met

### Notification Types

#### 1. Background Scheduled Notifications
- **Purpose**: Regular rate monitoring checks
- **Timing**: Every hour for active alerts
- **Content**: Brief status updates or monitoring reminders

#### 2. Immediate Trigger Notifications
- **Purpose**: Alert when target rate is reached
- **Timing**: Immediately when conditions are met
- **Content**: Detailed alert with current rate and target comparison

### Example Alert Scenarios

#### Scenario 1: Currency Drop Alert
- **Saved Rate**: USD → EUR at 0.88
- **Alert**: Notify when rate drops below 0.85
- **Notification**: "🎯 USD → EUR dropped to 0.84! Target was 0.85"

#### Scenario 2: Currency Rise Alert
- **Saved Rate**: GBP → USD at 1.28
- **Alert**: Notify when rate rises above 1.30
- **Notification**: "🚀 GBP → USD rose to 1.31! Target was 1.30"

#### Scenario 3: Exact Rate Match
- **Saved Rate**: EUR → JPY at 144.5
- **Alert**: Notify when rate equals 145.0
- **Notification**: "⚡ EUR → JPY reached exactly 145.0!"

## Technical Implementation

### App Configuration

#### iOS (`app.json`)
```json
"ios": {
  "infoPlist": {
    "NSUserNotificationsUsageDescription": "RateSnap needs notification access to send you alerts when your saved exchange rates reach your target values.",
    "UNUserNotificationCenterDelegate": true
  }
}
```

#### Android (`app.json`)
```json
"android": {
  "permissions": [
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.VIBRATE",
    "android.permission.RECEIVE_BOOT_COMPLETED"
  ]
}
```

### Notification Scheduling
- **Permission Flow**: Automatic permission request on first use
- **Token Management**: Automatic Expo push token generation
- **Background Tasks**: Scheduled using Expo's notification system
- **Persistence**: Alert configurations saved to AsyncStorage

### Rate Monitoring Logic
```typescript
// Background monitoring in CurrencyConverter.tsx
useEffect(() => {
  const checkRateAlerts = async () => {
    for (const rate of activeAlerts) {
      const currentRate = getCurrentRate(rate.fromCurrency, rate.toCurrency);
      
      if (shouldTriggerAlert(rate, currentRate)) {
        await sendNotification(rate, currentRate);
        await markAsTriggered(rate);
      }
    }
  };

  // Check every 5 minutes when alerts exist
  if (hasActiveAlerts) {
    const interval = setInterval(checkRateAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }
}, [savedRates, currenciesData]);
```

## User Interface

### Rate Alert Manager Features
- **Visual Status Indicators**: Color-coded alert status (active, inactive, triggered)
- **One-tap Controls**: Toggle, edit, and delete buttons
- **Detailed Information**: Shows target rate, direction, frequency, and last check time
- **Modal Configuration**: Easy-to-use form for creating/editing alerts

### Integration with Main App
- **Feature Toggle**: "🔔 Rate Alerts" button in main converter
- **Seamless Integration**: Alert manager integrated into existing UI
- **Real-time Updates**: Interface updates immediately when alert status changes

## Testing

### Test Coverage (`tests/alert-functionality.test.ts`)
- **Alert Creation**: Tests creating and saving alerts
- **Trigger Evaluation**: Tests alert condition logic
- **Multi-alert Management**: Tests handling multiple alerts
- **Alert Updates**: Tests editing and modifying alerts
- **Real-world Scenarios**: Tests complete user workflows

### Manual Testing Checklist
1. **Permission Request**: Verify notification permission request appears
2. **Alert Creation**: Create alerts with different configurations
3. **Alert Management**: Edit, toggle, and delete alerts
4. **Background Monitoring**: Verify periodic rate checking
5. **Notification Delivery**: Confirm notifications are received
6. **State Persistence**: Verify alert states persist across app restarts

## Limitations and Considerations

### Current Limitations
1. **Background App Restrictions**: iOS limits background execution
2. **Network Dependency**: Requires internet connection for rate checking
3. **Battery Impact**: Background monitoring may affect battery life
4. **Notification Scheduling**: Expo's notification limitations

### Future Enhancements
1. **Push Notifications**: Server-side rate monitoring for background execution
2. **Advanced Conditions**: Multiple thresholds, percentage changes, time-based alerts
3. **Alert Analytics**: Track alert performance and success rates
4. **Smart Suggestions**: AI-powered alert recommendations

## User Instructions

### Getting Started
1. **Enable Notifications**: Grant notification permissions when prompted
2. **Save Rates**: Save currency conversion rates you want to monitor
3. **Create Alerts**: Tap "Create Alert" on any saved rate
4. **Set Conditions**: Choose target rate and direction (above/below/equals)
5. **Monitor Status**: Check alert status and trigger history

### Best Practices
- **Realistic Targets**: Set achievable rate targets
- **Multiple Alerts**: Create alerts for different scenarios
- **Regular Checks**: Review and update alert settings periodically
- **Notification Settings**: Manage notification preferences in device settings

## Troubleshooting

### Common Issues
1. **No Notifications**: Check device notification settings
2. **Alerts Not Triggering**: Verify alert is active and network connection
3. **Permission Denied**: Manually enable notifications in device settings
4. **High Battery Usage**: Consider reducing alert frequency

### Debug Information
- **Alert Status**: Check "Rate Alerts" section in app
- **Notification History**: View triggered alerts and timestamps
- **Console Logs**: Enable developer mode for detailed logging

## Conclusion

The rate alert notification system provides users with proactive monitoring of exchange rates, helping them make informed currency conversion decisions. The implementation balances functionality with performance, providing reliable notifications while respecting device limitations and user privacy.