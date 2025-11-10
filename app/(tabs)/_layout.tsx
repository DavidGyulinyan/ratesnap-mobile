import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as AuthSession from 'expo-auth-session';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Debug redirect URI
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "ratesnap-mobile",
    path: "auth"
  });
  console.log("Tab Layout Redirect URI:", redirectUri);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: { display: 'none' }, // Hide the tab bar since this is a single screen app
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'RateSnap Dashboard',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'About',
        }}
      />
    </Tabs>
  );
}
