import React from 'react';
import { Image, View, StyleSheet, Text } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface LogoProps {
  size?: number;
  showText?: boolean;
  textSize?: number;
}

export default function Logo({ size = 24, showText = true, textSize = 18 }: LogoProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.logoContainer}>
      <Image
        source={require('../assets/images/icon.png')}
        style={[
          styles.logoImage,
          {
            width: size,
            height: size,
          },
        ]}
        resizeMode="contain"
      />
      {showText && (
        <Text
          style={[
            styles.logoText,
            {
              color: colors.text,
              fontSize: textSize,
            },
          ]}
        >
          RateSnap
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  logoImage: {
    borderRadius: 2,
  },
  logoText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 2,
  },
});