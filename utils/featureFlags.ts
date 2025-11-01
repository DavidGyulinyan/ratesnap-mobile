import Constants from 'expo-constants';

export const isCustomDashboardEnabled = (): boolean => {
  const flag = Constants.expoConfig?.extra?.enableCustomDashboard || 
               process.env.EXPO_PUBLIC_ENABLE_CUSTOM_DASHBOARD;
  
  return flag === 'true' || flag === true;
};