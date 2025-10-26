import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          About RateSnap
        </ThemedText>
      </ThemedView>
      <ThemedText>RateSnap is a mobile currency converter app that provides real-time exchange rates.</ThemedText>
      <Collapsible title="Features">
        <ThemedText>
          • Real-time currency conversion using ExchangeRate-API
        </ThemedText>
        <ThemedText>
          • Save favorite exchange rates for quick access
        </ThemedText>
        <ThemedText>
          • Conversion history tracking
        </ThemedText>
        <ThemedText>
          • Support for 160+ currencies
        </ThemedText>
      </Collapsible>
      <Collapsible title="How to Use">
        <ThemedText>
          1. Enter the amount you want to convert
        </ThemedText>
        <ThemedText>
          2. Select the 'From' and 'To' currencies
        </ThemedText>
        <ThemedText>
          3. View the converted amount instantly
        </ThemedText>
        <ThemedText>
          4. Save rates you use frequently
        </ThemedText>
      </Collapsible>
      <Collapsible title="Data Source">
        <ThemedText>
          Exchange rates are provided by ExchangeRate-API, updated hourly.
        </ThemedText>
        <ThemedText>
          Rates are for informational purposes only and may not reflect real-time market conditions.
        </ThemedText>
        <ExternalLink href="https://www.exchangerate-api.com/">
          <ThemedText type="link">Visit ExchangeRate-API</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Privacy & Storage">
        <ThemedText>
          This template has light and dark mode support. The{' '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect
          what the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
