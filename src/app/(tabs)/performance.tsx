import styles from "@/styles/performanceStyle";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 32;

type FilterTimeframe = "week" | "month" | "year";

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  
  // Active Timeframe Filter State
  const [timeframe, setTimeframe] = useState<FilterTimeframe>("week");

  // Agent Specific Hard Numbers
  const totalCollected = 39000;
  const targetGoal = 50000;
  const targetAccomplishmentRate = Math.round((totalCollected / targetGoal) * 100);
  const agentPayoutAmount = totalCollected * 0.10; 

  // Translucent chart style definitions
  const chartConfig = {
    backgroundColor: "transparent",
    backgroundGradientFrom: "#073474",
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: "#456da5",
    backgroundGradientToOpacity: 0,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, 0.75)`,
    style: { borderRadius: 20 },
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: "#5C8CE8",
    },
  };

  // Pie Chart Dataset Split Configuration
  const accomplishmentPieData = [
    { name: "Collected", population: totalCollected, color: "#FFFFFF", legendFontColor: "#FFFFFF", legendFontSize: 12 },
    { name: "Remaining", population: targetGoal - totalCollected, color: "rgba(255, 255, 255, 0.3)", legendFontColor: "rgba(255, 255, 255, 0.7)", legendFontSize: 12 },
  ];

  // Performance datasets based on chosen filtering node state
  const performanceDatasets = {
    week: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      datasets: [{ data: [12000, 19000, 32000, 25000, 39000, 45000] }],
    },
    month: {
      labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
      datasets: [{ data: [95000, 120000, 145000, 139000] }],
    },
    year: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [{ data: [410000, 520000, 490000, 610000] }],
    },
  };

  return (
    <LinearGradient
      colors={["#456da5", "#073474", "#5C8CE8"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: 120,
        }}
      >
        {/* HEADER SECTION */}
        <View style={styles.header}>
          <Text style={styles.title}>My Performance</Text>
          <Text style={styles.subtitle}>
            Track your milestones, goals, and payouts history
          </Text>
        </View>

        {/* Real-time Agent Earnings Widget */}
        <BlurView intensity={35} tint="light" style={[styles.card, styles.payoutHighlightCard]}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.payoutLabel}>ESTIMATED PAYOUT</Text>
              <Text style={styles.payoutValue}>K{agentPayoutAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.payoutBadge}>
              <Ionicons name="wallet-sharp" size={24} color="#073474" />
            </View>
          </View>
          <View style={styles.dashedLine} />
          <View style={styles.rowBetween}>
            <Text style={styles.cardFooterText}>Current Shift Collection</Text>
            <Text style={styles.cardFooterValue}>K{totalCollected.toLocaleString()}</Text>
          </View>
        </BlurView>

        {/* ===================== 1. PIE CHART CARD ===================== */}
        <BlurView intensity={20} tint="light" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="ribbon-sharp" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.chartTitle}>Daily Target Progress ({targetAccomplishmentRate}%)</Text>
          </View>
          <PieChart
            data={accomplishmentPieData}
            width={CHART_WIDTH - 32}
            height={130}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"10"}
            absolute
          />
        </BlurView>

        {/* ===================== 2. LINE CHART CARD + TIMEFRAME DROPDOWN ===================== */}
        <BlurView intensity={20} tint="light" style={styles.card}>
          <View style={styles.cardHeaderRowBetween}>
            <View style={styles.inlineHeaderTitleGroup}>
              <Ionicons name="trending-up-sharp" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.chartTitle}>Yield History (MWK)</Text>
            </View>

            {/* SELECTION FILTER DROPDOWN SEGMENT BUTTONS */}
            <View style={styles.filterDropdownContainer}>
              {(["week", "month", "year"] as FilterTimeframe[]).map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setTimeframe(item)}
                  style={[
                    styles.filterPill,
                    timeframe === item && styles.filterPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      timeframe === item && styles.filterPillTextActive,
                    ]}
                  >
                    {item.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <LineChart
            data={performanceDatasets[timeframe]}
            width={CHART_WIDTH - 32}
            height={180}
            chartConfig={chartConfig}
            bezier
            withInnerLines={false}
            style={styles.chartNativeStyle}
          />
        </BlurView>
        
      </ScrollView>
    </LinearGradient>
  );
}