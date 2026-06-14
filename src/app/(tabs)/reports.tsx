import React from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 32;

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();

  // Agent Specific Hard Numbers
  const totalCollected = 39000;
  const targetGoal = 50000;
  const targetAccomplishmentRate = Math.round((totalCollected / targetGoal) * 100);
  
  // Commission calculation (e.g., 10% on collected volume)
  const agentPayoutAmount = totalCollected * 0.10; 

  // Glassmorphism translucent chart parameters
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

  // 1. Line Data: Agent performance over the week against a constant target line
  const weeklyPerformanceData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      { 
        data: [12000, 19000, 32000, 25000, 39000, 45000],
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // Actual collections
      }
    ],
  };

  // 2. Bar Data: Target vs Actual Accomplishment across active Zones
  const zoneTargetComparisonData = {
    labels: ["Zone A", "Zone B", "Zone C", "Zone D"],
    datasets: [{ data: [targetAccomplishmentRate, 85, 40, 95] }], // Percentage of target met
  };

  // 3. Pie Data: Accomplished target split visual representation
  const accomplishmentPieData = [
    { name: "Collected", population: totalCollected, color: "#FFFFFF", legendFontColor: "#FFFFFF", legendFontSize: 12 },
    { name: "Remaining Target", population: targetGoal - totalCollected, color: "rgba(255, 255, 255, 0.3)", legendFontColor: "rgba(255, 255, 255, 0.7)", legendFontSize: 12 },
  ];

  // 4. Bar Data: Payout volume weight contribution per tariff
  const payoutByTariffData = {
    labels: ["Stall", "Hawker", "Minibus"],
    datasets: [{ data: [1500, 900, 2100] }], // MWK earned per branch loop
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
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>My Accomplishments</Text>
          <Text style={styles.subtitle}>
            Track your milestones, goals, and payouts
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

        {/* ===================== 1. PIE CHART (Target Accomplished Split) ===================== */}
        <BlurView intensity={20} tint="light" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="ribbon-sharp" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.chartTitle}>Daily Target Progress ({targetAccomplishmentRate}%)</Text>
          </View>
          <PieChart
            data={accomplishmentPieData}
            width={CHART_WIDTH - 32}
            height={140}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"10"}
            absolute
          />
        </BlurView>

        {/* ===================== 2. LINE CHART (Weekly Progress) ===================== */}
        <BlurView intensity={20} tint="light" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="trending-up-sharp" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.chartTitle}>My Weekly Yield History (MWK)</Text>
          </View>
          <LineChart
            data={weeklyPerformanceData}
            width={CHART_WIDTH - 32}
            height={180}
            chartConfig={chartConfig}
            bezier
            withInnerLines={false}
            style={styles.chartNativeStyle}
          />
        </BlurView>

        {/* ===================== 3. BAR CHART (Zone Accomplishments) ===================== */}
        <BlurView intensity={20} tint="light" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="checkmark-done-circle" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.chartTitle}>Target Achievement By Zone</Text>
          </View>
          <BarChart
            data={zoneTargetComparisonData}
            width={CHART_WIDTH - 32}
            height={200}
            yAxisLabel=""
            yAxisSuffix="%"
            chartConfig={chartConfig}
            withInnerLines={false}
            style={styles.chartNativeStyle}
          />
        </BlurView>

        {/* ===================== 4. BAR CHART (Payout Share By Tariff) ===================== */}
        <BlurView intensity={20} tint="light" style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="gift-sharp" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.chartTitle}>Payout Reward Weight By Fee Type</Text>
          </View>
          <BarChart
            data={payoutByTariffData}
            width={CHART_WIDTH - 32}
            height={200}
            yAxisLabel="K"
            yAxisSuffix=""
            chartConfig={chartConfig}
            withInnerLines={false}
            style={styles.chartNativeStyle}
          />
        </BlurView>
        
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  header: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 15,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  payoutHighlightCard: {
    backgroundColor: "rgba(255,255,255,0.95)", // Pops distinctly from the layout mix
    borderColor: "#FFFFFF",
  },
  payoutLabel: {
    color: "#073474",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  payoutValue: {
    color: "#000000",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 2,
  },
  payoutBadge: {
    backgroundColor: "rgba(7, 52, 116, 0.1)",
    padding: 12,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cardFooterText: {
    color: "#555555",
    fontSize: 13,
    fontWeight: "600",
  },
  cardFooterValue: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "700",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  chartNativeStyle: {
    marginLeft: -16,
    borderRadius: 20,
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(7, 52, 116, 0.2)",
    marginVertical: 12,
  },
});