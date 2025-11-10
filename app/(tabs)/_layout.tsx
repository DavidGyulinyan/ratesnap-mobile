import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Linking from "expo-linking";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
console.log(Linking.createURL("/auth/callback"));

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
