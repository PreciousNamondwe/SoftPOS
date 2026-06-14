import React from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  // Mocked Field Agent Deployment Profile Data
  const agentProfile = {
    fullName: "Chikondi Phiri",
    agentId: "AGT-2026-8841",
    role: "Senior Revenue Collector",
    assignedDistrict: "Blantyre District Council",
    primaryHub: "Limbe Market Hub",
    terminalId: "MPOS-MALAWI-992A",
    appVersion: "v4.2.1-prod",
  };

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
        {/* 1. TOP BAR ACTION BUTTONS */}
        <View style={styles.topBarRow}>
          <Text style={styles.screenHeaderTitle}>Terminal Profile</Text>
          <TouchableOpacity style={styles.settingsIconBtn} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* 2. AVATAR & PRIMARY IDENTITY IDENTITY CARD */}
        <View style={styles.identityCenteredGroup}>
          <View style={styles.avatarContainerFrame}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
              }}
              style={styles.avatarImage}
            />
            <View style={styles.activeStatusPillIndicator} />
          </View>
          
          <Text style={styles.agentDisplayName}>{agentProfile.fullName}</Text>
          <Text style={styles.agentDisplayRole}>{agentProfile.role}</Text>
          
          <View style={styles.badgeIdContainerPill}>
            <Text style={styles.badgeIdText}>{agentProfile.agentId}</Text>
          </View>
        </View>

        {/* 3. DEPLOYMENT JURISDICTION DATA CLUSTER */}
        <Text style={styles.sectionLabelTitle}>Deployment Matrix</Text>
        <BlurView intensity={20} tint="light" style={styles.glassProfileCard}>
          <View style={styles.metricDataRow}>
            <View style={styles.iconMetadataLabelGroup}>
              <Ionicons name="business" size={18} color="#fafdfd" />
              <Text style={styles.clusterFieldLabel}>Jurisdiction</Text>
            </View>
            <Text style={styles.clusterFieldValue}>{agentProfile.assignedDistrict}</Text>
          </View>

          <View style={styles.horizontalRowDivider} />

          <View style={styles.metricDataRow}>
            <View style={styles.iconMetadataLabelGroup}>
              <Ionicons name="location" size={18} color="#f6faf9" />
              <Text style={styles.clusterFieldLabel}>Assigned Sector</Text>
            </View>
            <Text style={styles.clusterFieldValue}>{agentProfile.primaryHub}</Text>
          </View>
        </BlurView>

        {/* 4. HARDWARE DIAGNOSTICS & SYSTEM STATUS */}
        <Text style={styles.sectionLabelTitle}>Hardware & System Health</Text>
        <BlurView intensity={20} tint="light" style={styles.glassProfileCard}>
          <View style={styles.metricDataRow}>
            <View style={styles.iconMetadataLabelGroup}>
              <Ionicons name="phone-portrait" size={18} color="rgba(255,255,255,0.6)" />
              <Text style={styles.clusterFieldLabel}>Terminal ID</Text>
            </View>
            <Text style={styles.clusterFieldValueMonospace}>{agentProfile.terminalId}</Text>
          </View>

          <View style={styles.horizontalRowDivider} />

          <View style={styles.metricDataRow}>
            <View style={styles.iconMetadataLabelGroup}>
              <Ionicons name="print" size={18} color="rgba(255,255,255,0.6)" />
              <Text style={styles.clusterFieldLabel}>Printer Module</Text>
            </View>
            <View style={styles.statusPillBadgeRow}>
              <View style={styles.greenDotIndicator} />
              <Text style={styles.statusPillBadgeTextText}>CONNECTED</Text>
            </View>
          </View>

          <View style={styles.horizontalRowDivider} />

          <View style={styles.metricDataRow}>
            <View style={styles.iconMetadataLabelGroup}>
              <Ionicons name="git-branch" size={18} color="rgba(255,255,255,0.6)" />
              <Text style={styles.clusterFieldLabel}>Core System Version</Text>
            </View>
            <Text style={styles.clusterFieldValueMonospace}>{agentProfile.appVersion}</Text>
          </View>
        </BlurView>

        {/* 5. DANGER ZONE OUTBYE DE-AUTHENTICATION ACTIONS */}
        <TouchableOpacity activeOpacity={0.8} style={styles.logoutActionDangerButton}>
          <View style={styles.logoutButtonLayoutRowAlignment}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={styles.logoutActionButtonLabelText}>End Fiscal Shift Session</Text>
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
  topBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 24,
  },
  screenHeaderTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  settingsIconBtn: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  identityCenteredGroup: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatarContainerFrame: {
    position: "relative",
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#f2f5f4",
  },
  activeStatusPillIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#eff7f2",
    borderWidth: 3,
    borderColor: "#073474",
  },
  agentDisplayName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  agentDisplayRole: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
  },
  badgeIdContainerPill: {
    marginTop: 12,
    backgroundColor: "rgba(0, 255, 220, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 220, 0.25)",
  },
  badgeIdText: {
    color: "#f8faf9",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  sectionLabelTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginHorizontal: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  glassProfileCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 18,
    paddingVertical: 4,
    overflow: "hidden",
    marginBottom: 24,
  },
  metricDataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  iconMetadataLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  clusterFieldLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "600",
  },
  clusterFieldValue: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  clusterFieldValueMonospace: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  horizontalRowDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statusPillBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(39, 174, 96, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  greenDotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4fd190",
  },
  statusPillBadgeTextText: {
    color: "#f0f7f3",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  logoutActionDangerButton: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255, 107, 107, 0.08)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.25)",
    marginTop: 12,
    marginBottom: 60,
  },
  logoutButtonLayoutRowAlignment: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  logoutActionButtonLabelText: {
    color: "#FF6B6B",
    fontSize: 15,
    fontWeight: "800",
  },
});