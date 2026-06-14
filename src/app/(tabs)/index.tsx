import React from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function ProgressArc({ percent = 78 }) {
  const radius = 90;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (circumference * percent) / 100;

  return (
    <View style={styles.arcContainer}>
      <Svg width={220} height={120}>
        {/* Background Track */}
        <Path
          d="M 20,110 A 90,90 0 0,1 200,110"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        {/* Active Progress Track */}
        <Path
          d="M 20,110 A 90,90 0 0,1 200,110"
          stroke="#f3f7f6"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </Svg>

      <View style={styles.arcTextAbsoluteWrapper}>
        <Text style={styles.arcPercentage}>{percent}%</Text>
        <Text style={styles.arcInnerLabel}>COMPLETED</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

  // Financial Metric Calculations
  const totalCollected = 39000;
  const targetGoal = 50000;
  const estimatedPayout = totalCollected * 0.12; // 12% commission tier

  return (
    <LinearGradient
      colors={["#456da5", "#073474", "#5C8CE8"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 60,
        }}
      >
        {/* 1. PROFESSIONAL WELCOME HEADER */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>Moni, Agent</Text>
            <Text style={styles.dateSubtitle}>Monday, 15 June 2026</Text>
          </View>
          <View style={styles.profileBadge}>
            <Ionicons name="person-circle" size={36} color="#FFFFFF" />
          </View>
        </View>

        {/* 2. LIVE SHIFT PAYOUT GLASS CARD */}
        <BlurView intensity={30} tint="light" style={styles.payoutCard}>
          <View style={styles.payoutTopMeta}>
            <View>
              <Text style={styles.payoutContextLabel}>YOUR ESTIMATED PAYOUT</Text>
              <Text style={styles.payoutValue}>MWK {estimatedPayout.toLocaleString()}</Text>
            </View>
            <View style={styles.walletIconContainer}>
              <Ionicons name="wallet" size={24} color="#073474" />
            </View>
          </View>
          
          <View style={styles.dividerDashed} />
          
          <View style={styles.payoutBottomMeta}>
            <Text style={styles.metaSubText}>Shift Tier Bonus Accumulator</Text>
            <Text style={styles.metaHighlightValue}>+12% Base Rate</Text>
          </View>
        </BlurView>

        {/* 3. TARGET STATUS MATRIX CENTER */}
        <BlurView intensity={20} tint="light" style={styles.targetCard}>
          <Text style={styles.cardSectionLabel}>SHIFT MILESTONE BENCHMARK</Text>
          
          <ProgressArc percent={Math.round((totalCollected / targetGoal) * 100)} />

          <View style={styles.targetLegendGrid}>
            <View style={styles.legendNode}>
              <Text style={styles.legendLabel}>COLLECTED YIELD</Text>
              <Text style={styles.legendValue}>K{totalCollected.toLocaleString()}</Text>
            </View>
            <View style={[styles.legendNode, styles.legendNodeBorderLeft]}>
              <Text style={styles.legendLabel}>SHIFT TARGET</Text>
              <Text style={styles.legendValueNormal}>K{targetGoal.toLocaleString()}</Text>
            </View>
          </View>
        </BlurView>

        {/* 4. PRIMARY ACCESSIBILITY ACTION TRIGGER */}
        <TouchableOpacity activeOpacity={0.85} style={styles.actionHeroButton}>
          <View style={styles.actionButtonLayoutAlignment}>
            <Ionicons name="add-circle" size={22} color="#073474" />
            <Text style={styles.actionHeroButtonText}>Launch New Collection</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  dateSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
    fontWeight: "500",
  },
  profileBadge: {
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 100,
  },
  payoutCard: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  payoutTopMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payoutContextLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#073474",
    letterSpacing: 1.2,
  },
  payoutValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#000000",
    marginTop: 4,
    letterSpacing: -0.5,
  },
  walletIconContainer: {
    backgroundColor: "rgba(7, 52, 116, 0.08)",
    padding: 12,
    borderRadius: 16,
  },
  dividerDashed: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(7, 52, 116, 0.15)",
    marginVertical: 14,
  },
  payoutBottomMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaSubText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555555",
  },
  metaHighlightValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#27AE60",
  },
  targetCard: {
    marginHorizontal: 16,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    padding: 20,
    overflow: "hidden",
    marginBottom: 20,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 16,
  },
  arcContainer: {
    alignItems: "center",
    position: "relative",
    height: 120,
  },
  arcTextAbsoluteWrapper: {
    position: "absolute",
    bottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  arcPercentage: {
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1,
  },
  arcInnerLabel: {
    color: "#f5f8f7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: -2,
  },
  targetLegendGrid: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    marginTop: 12,
    paddingTop: 16,
  },
  legendNode: {
    flex: 1,
    alignItems: "center",
  },
  legendNodeBorderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.12)",
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
  },
  legendValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ebf3f1",
    marginTop: 4,
  },
  legendValueNormal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  actionHeroButton: {
    marginHorizontal: 16,
    backgroundColor: "#eff3f2",
    borderRadius: 18,
    marginBottom: 28,
    shadowColor: "#00FFCC",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  actionButtonLayoutAlignment: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  actionHeroButtonText: {
    color: "#073474",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginHorizontal: 18,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    justifyContent: "flex-start",
  },
  hubMetricsGridItem: {
    width: (SCREEN_WIDTH - 40) / 2,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  hubHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  colorIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hubTitleText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
  },
  hubYieldAmount: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  hubFooterMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
  hubCountText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
  },
});