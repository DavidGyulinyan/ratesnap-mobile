import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
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
  onClose?: () => void;
  style?: any;
}

type TimePeriod = "7D" | "30D" | "90D" | "1Y";

export default function RateChart({
  baseCurrency,
  targetCurrency,
  onClose,
  style,
}: RateChartProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalRateData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("30D");
  const [error, setError] = useState<string | null>(null);

  const { t } = useLanguage();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  // Theme colors
  const backgroundColor = useThemeColor({}, "background");
  const surfaceColor = useThemeColor({}, "surface");
  const primaryColor = useThemeColor({}, "primary");
  const textColor = useThemeColor({}, "text");
  const textSecondaryColor = useThemeColor({}, "textSecondary");
  const borderColor = useThemeColor({}, "border");

  const timePeriods: { key: TimePeriod; label: string; days: number }[] = [
    { key: "7D", label: "7D", days: 7 },
    { key: "30D", label: "30D", days: 30 },
    { key: "90D", label: "90D", days: 90 },
    { key: "1Y", label: "1Y", days: 365 },
  ];

  const fetchHistoricalData = useCallback(
    async (days: number) => {
      try {
        setLoading(true);
        setError(null);

        console.log(
          `📊 Fetching chart data: ${baseCurrency}/${targetCurrency} for ${days} days`
        );
        const data = await exchangeRateService.getHistoricalRates(
          baseCurrency,
          targetCurrency,
          days
        );

        if (data.rates && data.rates.length > 0) {
          setHistoricalData(data.rates);
          console.log(`✅ Loaded ${data.rates.length} data points for chart`);
        } else {
          setError("No historical data available");
        }
      } catch (err) {
        console.error("❌ Error fetching historical data:", err);
        setError("Failed to load chart data");
      } finally {
        setLoading(false);
      }
    },
    [baseCurrency, targetCurrency]
  );

  useEffect(() => {
    const period = timePeriods.find((p) => p.key === selectedPeriod);
    if (period) {
      fetchHistoricalData(period.days).catch((error) => {
        console.error("Failed to fetch historical data:", error);
        setError("Failed to load chart data");
        setLoading(false);
      });
    }
  }, [selectedPeriod, fetchHistoricalData]);

  const formatChartData = () => {
    if (!historicalData || historicalData.length === 0) {
      return { labels: [], data: [] };
    }

    // Responsive label count based on screen width
    const maxLabels = screenWidth < 400 ? 4 : screenWidth < 600 ? 5 : 7;
    const step = Math.max(1, Math.floor(historicalData.length / maxLabels));

    const labels = historicalData
      .filter((_, index) => index % step === 0)
      .map((item) => {
        const date = new Date(item.date);
        if (selectedPeriod === "7D") {
          return screenWidth < 400
            ? date.toLocaleDateString("en-US", { weekday: "narrow" })
            : date.toLocaleDateString("en-US", { weekday: "short" });
        } else {
          return screenWidth < 400
            ? date.toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
              })
            : date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
        }
      });

    const data = historicalData
      .filter((_, index) => index % step === 0)
      .map((item) => item.rate);

    return { labels, data };
  };

  const chartData = formatChartData();

  // Simple line chart component
  const SimpleLineChart = ({
    data,
    labels,
    width,
    height,
  }: {
    data: number[];
    labels: string[];
    width: number;
    height: number;
  }) => {
    // Safety checks
    if (!data || data.length === 0 || !Array.isArray(data)) {
      return (
        <View
          style={{
            width,
            height,
            backgroundColor: surfaceColor,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedText style={{ fontSize: 12, color: textSecondaryColor }}>
            No data to display
          </ThemedText>
        </View>
      );
    }

    // Filter out invalid values
    const validData = data.filter(
      (val) => typeof val === "number" && !isNaN(val) && isFinite(val)
    );
    if (validData.length === 0) {
      return (
        <View
          style={{
            width,
            height,
            backgroundColor: surfaceColor,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedText style={{ fontSize: 12, color: textSecondaryColor }}>
            Invalid data
          </ThemedText>
        </View>
      );
    }

    const minValue = Math.min(...validData);
    const maxValue = Math.max(...validData);
    const range = maxValue - minValue || 1;
    const padding = 20;
    const chartWidth = Math.max(width - padding * 2, 100);
    const chartHeight = Math.max(height - padding * 2, 100);

    const points = validData
      .map((value, index) => {
        const x = padding + (index / (validData.length - 1)) * chartWidth;
        const y = padding + ((maxValue - value) / range) * chartHeight;
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
        <View
          style={{
            flex: 1,
            justifyContent: "space-between",
            paddingHorizontal: padding,
            paddingVertical: padding,
          }}
        >
          {/* Y-axis labels */}
          <ThemedText
            style={{
              fontSize: 10,
              color: textSecondaryColor,
              position: "absolute",
              left: 5,
              top: padding,
            }}
          >
            {maxValue.toFixed(4)}
          </ThemedText>
          <ThemedText
            style={{
              fontSize: 10,
              color: textSecondaryColor,
              position: "absolute",
              left: 5,
              bottom: padding,
            }}
          >
            {minValue.toFixed(4)}
          </ThemedText>

          {/* Chart area */}
          <View style={{ flex: 1, marginLeft: 30 }}>
            <Svg
              width={chartWidth}
              height={chartHeight}
              style={{ position: "absolute" }}
            >
              {/* Grid lines */}
              <Line
                x1="0"
                y1="0"
                x2={chartWidth}
                y2="0"
                stroke={borderColor}
                strokeWidth="1"
                opacity="0.3"
              />
              <Line
                x1="0"
                y1={chartHeight / 2}
                x2={chartWidth}
                y2={chartHeight / 2}
                stroke={borderColor}
                strokeWidth="1"
                opacity="0.3"
              />
              <Line
                x1="0"
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke={borderColor}
                strokeWidth="1"
                opacity="0.3"
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

          {/* X-axis labels */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 5,
              marginLeft: 30,
            }}
          >
            {labels.slice(0, 5).map((label, index) => (
              <ThemedText
                key={index}
                style={{ fontSize: 8, color: textSecondaryColor }}
              >
                {label}
              </ThemedText>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const getCurrentRate = () => {
    if (historicalData.length === 0) return null;
    return historicalData[historicalData.length - 1]?.rate;
  };

  const getRateChange = () => {
    if (historicalData.length < 2) return null;

    const current = historicalData[historicalData.length - 1]?.rate;
    const previous = historicalData[historicalData.length - 2]?.rate;

    if (!current || !previous) return null;

    const change = ((current - previous) / previous) * 100;
    return {
      value: change,
      isPositive: change >= 0,
    };
  };

  const rateChange = getRateChange();

  if (loading) {
    return (
      <ThemedView style={[styles.container, style]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            {baseCurrency}/{targetCurrency} Chart
          </ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText>{t("common.loading")}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={[styles.container, style]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            {baseCurrency}/{targetCurrency} Chart
          </ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: primaryColor }]}
            onPress={() => {
              const period = timePeriods.find((p) => p.key === selectedPeriod);
              if (period) fetchHistoricalData(period.days);
            }}
          >
            <ThemedText style={styles.retryButtonText}>
              {t("chart.retry")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  try {
    return (
      <ThemedView style={[styles.container, style]}>
        <View style={styles.header}>
          <ThemedText
            style={[styles.title, { fontSize: screenWidth < 400 ? 14 : 16 }]}
          >
            {baseCurrency}/{targetCurrency} Chart
          </ThemedText>
        </View>

        {/* Current Rate Display */}
        <View style={styles.rateDisplay}>
          <View
            style={[
              styles.rateInfo,
              {
                flexDirection: screenWidth < 400 ? "column" : "row",
                alignItems: screenWidth < 400 ? "flex-start" : "center",
              },
            ]}
          >
            <ThemedText
              style={[
                styles.currentRate,
                { fontSize: screenWidth < 400 ? 18 : 20 },
              ]}
            >
              {getCurrentRate()?.toFixed(4)} {targetCurrency}
            </ThemedText>
            {rateChange && (
              <ThemedText
                style={[
                  styles.rateChange,
                  {
                    color: rateChange.isPositive ? "#10b981" : "#ef4444",
                    fontSize: screenWidth < 400 ? 11 : 12,
                    marginTop: screenWidth < 400 ? 4 : 0,
                    marginLeft: screenWidth < 400 ? 0 : 8,
                  },
                ]}
              >
                {rateChange.isPositive ? "↗" : "↘"}{" "}
                {rateChange.value.toFixed(2)}%
              </ThemedText>
            )}
          </View>
          <ThemedText
            style={[
              styles.rateLabel,
              { fontSize: screenWidth < 400 ? 11 : 12 },
            ]}
          >
            1 {baseCurrency} = {getCurrentRate()?.toFixed(4)} {targetCurrency}
          </ThemedText>
        </View>

        {/* Time Period Selector */}
        <View style={[styles.periodSelector, { flexDirection: "row" }]}>
          {timePeriods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                {
                  backgroundColor:
                    selectedPeriod === period.key ? primaryColor : surfaceColor,
                  borderColor: borderColor,
                  flex: 1,
                  minWidth: 50,
                  marginVertical: 0,
                  marginHorizontal: 1,
                },
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <ThemedText
                style={[
                  styles.periodButtonText,
                  {
                    color:
                      selectedPeriod === period.key ? "#ffffff" : textColor,
                    fontSize: screenWidth < 400 ? 11 : 12,
                  },
                ]}
              >
                {period.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={[styles.chartContainer, { width: screenWidth - 60 }]}>
          {chartData.labels.length > 0 ? (
            <SimpleLineChart
              data={chartData.data}
              labels={chartData.labels}
              width={screenWidth - 60}
              height={Math.min(screenHeight * 0.25, 240)}
            />
          ) : (
            <View
              style={[
                styles.noDataContainer,
                { height: Math.min(screenHeight * 0.25, 240) },
              ]}
            >
              <ThemedText style={styles.noDataText}>
                {t("chart.noData")}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Chart Info */}
        <View style={styles.chartInfo}>
          <ThemedText
            style={[
              styles.chartInfoText,
              { fontSize: screenWidth < 400 ? 9 : 10 },
            ]}
          >
            {t("chart.showingDataFor")} {selectedPeriod.toLowerCase()} •{" "}
            {historicalData.length} {t("chart.dataPoints")}
          </ThemedText>
        </View>
      </ThemedView>
    );
  } catch (error) {
    console.error("RateChart render error:", error);
    return (
      <ThemedView style={[styles.container, style]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            {baseCurrency}/{targetCurrency} Chart
          </ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>
            Failed to load chart. Please try again.
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: primaryColor }]}
            onPress={() => {
              const period = timePeriods.find((p) => p.key === selectedPeriod);
              if (period) fetchHistoricalData(period.days);
            }}
          >
            <ThemedText style={styles.retryButtonText}>
              {t("chart.retry")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    margin: 6,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    maxWidth: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    flexWrap: "wrap",
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    height: 360, // Fixed height to match loaded chart + other content (240px chart + 120px for rate display, period selector, etc.)
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    height: 360, // Same height as loading container for consistency
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    marginBottom: 12,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  rateDisplay: {
    marginBottom: 12,
  },
  rateInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  currentRate: {
    fontSize: 20,
    fontWeight: "700",
    marginRight: 8,
  },
  rateChange: {
    fontSize: 12,
    fontWeight: "600",
  },
  rateLabel: {
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 16,
  },
  periodSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 4,
  },
  periodButton: {
    flex: 1,
    minWidth: 50,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 1,
    alignItems: "center",
  },
  periodButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 12,
    alignSelf: "center",
  },
  chart: {
    borderRadius: 12,
    marginVertical: 4,
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
    width: "100%",
  },
  noDataText: {
    fontSize: 14,
    opacity: 0.6,
  },
  chartInfo: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  chartInfoText: {
    fontSize: 10,
    opacity: 0.6,
    textAlign: "center",
    lineHeight: 14,
  },
});
