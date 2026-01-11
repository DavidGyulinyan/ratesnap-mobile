import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import Svg, { Polyline, Line } from "react-native-svg";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useLanguage } from "@/contexts/LanguageContext";
import exchangeRateService, {
  HistoricalRateData,
} from "@/lib/exchangeRateService";

interface RateChartProps {
  baseCurrency: string;
  targetCurrency: string;
  style?: any;
}

type TimePeriod = "7D" | "30D" | "90D" | "1Y";

const timePeriods: { key: TimePeriod; label: string; days: number }[] = [
  { key: "7D", label: "7D", days: 7 },
  { key: "30D", label: "30D", days: 30 },
  { key: "90D", label: "90D", days: 90 },
  { key: "1Y", label: "1Y", days: 365 },
];

export default function RateChart({
  baseCurrency,
  targetCurrency,
  style,
}: RateChartProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [historicalData, setHistoricalData] = useState<HistoricalRateData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("30D");
  const [error, setError] = useState<string | null>(null);

  const { t } = useLanguage();

  const surfaceColor = useThemeColor({}, "surface");
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");

  const fetchHistoricalData = useCallback(
    async (days: number) => {
      try {
        setLoading(true);
        setError(null);
        const data = await exchangeRateService.getHistoricalRates(
          baseCurrency,
          targetCurrency,
          days
        );
        setHistoricalData(data?.rates ?? []);
      } catch {
        setError("Failed to load chart data");
      } finally {
        setLoading(false);
      }
    },
    [baseCurrency, targetCurrency]
  );

  useEffect(() => {
    const period = timePeriods.find((p) => p.key === selectedPeriod);
    if (period) fetchHistoricalData(period.days);
  }, [selectedPeriod, fetchHistoricalData]);

  // 🚫 NEVER render chart without real dimensions
  if (!screenWidth || screenWidth < 100) {
    return null;
  }

  /* ================= SAFE SVG CHART ================= */

  const Chart = () => {
    const data = historicalData
      .map((d) => Number(d.rate))
      .filter((n) => Number.isFinite(n));

    // 🚫 SVG MUST NEVER RENDER WITH < 2 POINTS
    if (data.length < 2) {
      return (
        <View style={[styles.empty, { backgroundColor: surfaceColor }]}>
          <ThemedText style={{ color: textSecondaryColor }}>
            Not enough data to draw chart
          </ThemedText>
        </View>
      );
    }

    const padding = 20;
    const width = screenWidth - 60;
    const height = Math.min(screenHeight * 0.25, 240);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data
      .map((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + ((max - value) / range) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <View
        style={{
          width,
          height,
          backgroundColor: surfaceColor,
          borderRadius: 12,
        }}
      >
        <Svg width={width} height={height}>
          {/* Grid */}
          <Line
            x1="0"
            y1={padding}
            x2={width}
            y2={padding}
            stroke={borderColor}
            opacity={0.3}
          />
          <Line
            x1="0"
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke={borderColor}
            opacity={0.3}
          />
          <Line
            x1="0"
            y1={height - padding}
            x2={width}
            y2={height - padding}
            stroke={borderColor}
            opacity={0.3}
          />

          {/* Line */}
          <Polyline
            points={points}
            fill="none"
            stroke={primaryColor}
            strokeWidth="2"
          />
        </Svg>
      </View>
    );
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <ThemedView style={[styles.container, style]}>
        <ThemedText>{t("common.loading")}</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, style]}>
        <ThemedText style={{ color: "#ef4444" }}>{error}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, style]}>
      <ThemedText style={styles.title}>
        {baseCurrency}/{targetCurrency}
      </ThemedText>

      {/* Periods */}
      <View style={styles.periods}>
        {timePeriods.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[
              styles.period,
              {
                backgroundColor:
                  selectedPeriod === p.key ? primaryColor : surfaceColor,
              },
            ]}
            onPress={() => setSelectedPeriod(p.key)}
          >
            <ThemedText
              style={{ color: selectedPeriod === p.key ? "#fff" : textColor }}
            >
              {p.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart */}
      <Chart />
    </ThemedView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    margin: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  periods: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  period: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  empty: {
    height: 200,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
