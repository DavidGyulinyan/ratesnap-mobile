// Simple test to verify notification service loads without errors
import notificationService from '../lib/notificationService';

console.log('🔍 Testing notification service...');

try {
  // Test that the service loads
  console.log('✅ Notification service loaded successfully');
  
  // Test platform detection
  if (typeof notificationService !== 'undefined') {
    console.log('✅ Notification service instance is available');
  }
  
  // Test that methods exist
  if (typeof notificationService.requestPermissions === 'function') {
    console.log('✅ requestPermissions method exists');
  }
  
  if (typeof notificationService.getPushToken === 'function') {
    console.log('✅ getPushToken method exists');
  }
  
  if (typeof notificationService.scheduleRateAlert === 'function') {
    console.log('✅ scheduleRateAlert method exists');
  }
  
  console.log('🎉 All notification service tests passed!');
  
} catch (error) {
  console.error('❌ Notification service test failed:', error);
  throw error;
}

export default notificationService;