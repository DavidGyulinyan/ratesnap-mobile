import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

interface GoogleAdsBannerProps {
  type?: 'banner' | 'rectangle' | 'interstitial';
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

export default function GoogleAdsBanner({
  type = 'banner',
  size = 'medium',
  style
}: GoogleAdsBannerProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const iconColor = useThemeColor({}, 'icon');

  const getAdDimensions = () => {
    switch (type) {
      case 'banner':
        return { width: Dimensions.get('window').width - 40, height: 50 };
      case 'rectangle':
        return { width: 250, height: 250 };
      case 'interstitial':
        return { width: Dimensions.get('window').width - 40, height: 400 };
      default:
        return { width: Dimensions.get('window').width - 40, height: 50 };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { transform: [{ scale: 0.8 }] };
      case 'large':
        return { transform: [{ scale: 1.2 }] };
      default:
        return {};
    }
  };

  const dimensions = getAdDimensions();

  return (
    <View
      style={[
        styles.adContainer,
        {
          backgroundColor: backgroundColor,
          borderColor: borderColor
        },
        getSizeStyle(),
        style
      ]}
    >
      <View style={styles.adContent}>
        <Text style={[
          styles.adLabel,
          { color: textColor }
        ]}>
          Advertisement
        </Text>
        <Text style={[
          styles.adText,
          { color: iconColor }
        ]}>
          Google Ads Placeholder
        </Text>
        <Text style={[
          styles.adSize,
          { color: textColor }
        ]}>
          {type.toUpperCase()} ({Math.round(dimensions.width)}x{Math.round(dimensions.height)})
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  adContent: {
    alignItems: 'center',
    padding: 16,
  },
  adLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  adText: {
    fontSize: 14,
    marginBottom: 2,
  },
  adSize: {
    fontSize: 10,
    opacity: 0.7,
  },
});