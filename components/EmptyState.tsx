import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { 
  DashboardPresets, 
  EmptyStateConfig, 
  getTheme,
  ThemeName,
} from '@/styles/theme';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface EmptyStateProps {
  onPresetSelect?: (presetId: string) => void;
  onGetStarted?: () => void;
}

export function EmptyState({ onPresetSelect, onGetStarted }: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const themeName: ThemeName = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = getTheme(themeName);
  const { addWidget } = useDashboardStore();

  const handlePresetSelect = (preset: any) => {
    // Add widgets from preset to dashboard
    preset.widgets.forEach((widgetConfig: any) => {
      addWidget({
        type: widgetConfig.type,
        x: widgetConfig.position.x,
        y: widgetConfig.position.y,
        w: widgetConfig.position.w,
        h: widgetConfig.position.h,
        props: widgetConfig.props || {},
      });
    });

    onPresetSelect?.(preset.id);
  };

  const handleGetStarted = () => {
    // Open widget library
    onGetStarted?.();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Empty State */}
        <View style={styles.mainContent}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
            <Text style={styles.icon}>🎯</Text>
          </View>

          {/* Title */}
          <ThemedText style={[styles.title, { color: colors.text }]}>
            {EmptyStateConfig.title}
          </ThemedText>

          {/* Subtitle */}
          <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
            {EmptyStateConfig.subtitle}
          </ThemedText>

          {/* CTA Button */}
          <TouchableOpacity 
            style={[styles.ctaButton, { backgroundColor: colors.primary }]}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={[styles.ctaButtonText, { color: colors.textOnPrimary }]}>
              {EmptyStateConfig.ctaText}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Presets Section */}
        <View style={styles.presetsSection}>
          <ThemedText style={[styles.presetsTitle, { color: colors.text }]}>
            {EmptyStateConfig.presetsTitle}
          </ThemedText>
          
          <ThemedText style={[styles.presetsSubtitle, { color: colors.textSecondary }]}>
            {EmptyStateConfig.presetsSubtitle}
          </ThemedText>

          <View style={styles.presetsGrid}>
            {DashboardPresets.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetCard,
                  { 
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => handlePresetSelect(preset)}
                activeOpacity={0.7}
              >
                {/* Preset Icon */}
                <View style={[styles.presetIconContainer, { backgroundColor: colors.surface }]}>
                  <Text style={styles.presetIcon}>{preset.icon}</Text>
                </View>

                {/* Preset Info */}
                <View style={styles.presetInfo}>
                  <ThemedText style={[styles.presetTitle, { color: colors.text }]}>
                    {preset.name}
                  </ThemedText>
                  <ThemedText style={[styles.presetDescription, { color: colors.textSecondary }]}>
                    {preset.description}
                  </ThemedText>
                </View>

                {/* Widget Count */}
                <View style={[styles.widgetCount, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.widgetCountText, { color: colors.textOnPrimary }]}>
                    {preset.widgets.length} widgets
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Tips */}
        <View style={[styles.tipsSection, { backgroundColor: colors.surface }]}>
          <ThemedText style={[styles.tipsTitle, { color: colors.text }]}>💡 Quick Tips</ThemedText>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🔧</Text>
              <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
                Click any widget in the library to add it to your dashboard
              </ThemedText>
            </View>
            
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>📱</Text>
              <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
                Drag and resize widgets to customize your layout
              </ThemedText>
            </View>
            
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🎨</Text>
              <ThemedText style={[styles.tipText, { color: colors.textSecondary }]}>
                Use the theme toggle to switch between light and dark modes
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  mainContent: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  ctaButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 160,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  presetsSection: {
    marginBottom: 48,
  },
  presetsTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  presetsSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  presetsGrid: {
    gap: 16,
  },
  presetCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  presetIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  presetIcon: {
    fontSize: 24,
  },
  presetInfo: {
    flex: 1,
  },
  presetTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  widgetCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  widgetCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tipsSection: {
    borderRadius: 12,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});