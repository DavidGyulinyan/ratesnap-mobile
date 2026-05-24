import { ThemedText } from "@/components/themed-text";
import { hexToRgba } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type DashboardWidgetPickerItem<T extends string> = {
  id: T;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type DashboardWidgetPickerModalProps<T extends string> = {
  visible: boolean;
  title: string;
  items: DashboardWidgetPickerItem<T>[];
  onClose: () => void;
  onAdd: (id: T) => void;
};

export default function DashboardWidgetPickerModal<T extends string>({
  visible,
  title,
  items,
  onClose,
  onAdd,
}: DashboardWidgetPickerModalProps<T>) {
  const { t, tWithParams } = useLanguage();
  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");
  const primaryColor = useThemeColor({}, "primary");

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={["top", "bottom"]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Ionicons name="close" size={26} color={textSecondaryColor} />
          </Pressable>
          <ThemedText type="defaultSemiBold" style={[styles.title, { color: textColor }]}>
            {title}
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            <ThemedText style={{ color: textSecondaryColor, textAlign: "center" }}>
              {t("dashboard.widgets.allAdded")}
            </ThemedText>
          ) : (
            items.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => {
                  onAdd(item.id);
                  onClose();
                }}
                style={[
                  styles.row,
                  {
                    backgroundColor: surfaceColor,
                    borderColor,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={tWithParams("dashboard.widgets.addItem", {
                  name: t(item.labelKey),
                })}
              >
                <View
                  style={[
                    styles.iconWrap,
                    {
                      borderColor: hexToRgba(borderColor, 0.65),
                      backgroundColor: hexToRgba(primaryColor, 0.1),
                    },
                  ]}
                >
                  <Ionicons name={item.icon} size={22} color={primaryColor} />
                </View>
                <ThemedText
                  type="defaultSemiBold"
                  style={[styles.rowLabel, { color: textColor }]}
                  numberOfLines={2}
                >
                  {t(item.labelKey)}
                </ThemedText>
                <Ionicons name="add-circle" size={28} color={primaryColor} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  title: { flex: 1, textAlign: "center", fontSize: 17 },
  headerSpacer: { width: 26 },
  scroll: { padding: 16, paddingBottom: 32, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1 },
});
