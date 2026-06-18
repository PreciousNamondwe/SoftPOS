import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  // Network & Device Diagnostics Parameters
  const networkDiagnostics = {
    configuredState: "Yes",
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
          paddingTop: insets.top + 24,
          paddingBottom: 60,
        }}
      >
        {/* 1. TOP BAR ACTION TITLE */}
        <View style={styles.topBarRow}>
          <Text style={styles.screenHeaderTitle}>Settings</Text>
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
        </View>

        {/* 2. SERVER CONNECTION MATRIX */}
        <Text style={styles.sectionLabelTitle}>Server Infrastructure Matrix</Text>
        <BlurView intensity={20} tint="light" style={styles.glassProfileCard}>
          <View style={styles.metricDataRow}>
            <View style={styles.iconMetadataLabelGroup}>
              <Ionicons name="server" size={18} color="#fafdfd" />
              <Text style={styles.clusterFieldLabel}>System Connection</Text>
            </View>
            <View style={styles.statusPillBadgeRow}>
              <View style={styles.greenDotIndicator} />
              <Text style={styles.statusPillBadgeText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.horizontalRowDivider} />

          <View style={styles.metricDataRow}>
            <View style={styles.iconMetadataLabelGroup}>
              <Ionicons name="options-outline" size={18} color="#f6faf9" />
              <Text style={styles.clusterFieldLabel}>Configured</Text>
            </View>
            <Text style={styles.clusterFieldValue}>{networkDiagnostics.configuredState}</Text>
          </View>

          <View style={styles.horizontalRowDivider} />
        </BlurView>

        {/* 3. PERIPHERAL HARDWARE DIAGNOSTICS */}
        <Text style={styles.sectionLabelTitle}>Peripheral Device Health</Text>
        <BlurView intensity={20} tint="light" style={styles.glassProfileCard}>
          <View style={styles.metricDataRow}>
            <View style={styles.iconMetadataLabelGroup}>
              <Ionicons name="print" size={18} color="rgba(255,255,255,0.7)" />
              <Text style={styles.clusterFieldLabel}>QR Code Printer</Text>
            </View>
            <View style={styles.statusPillBadgeRow}>
              <View style={styles.greenDotIndicator} />
              <Text style={styles.statusPillBadgeText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.horizontalRowDivider} />

          <View style={styles.metricDataRow}>
            <View style={styles.iconMetadataLabelGroup}>
              <Ionicons name="phone-portrait" size={18} color="rgba(255,255,255,0.6)" />
              <Text style={styles.clusterFieldLabel}>Terminal ID</Text>
            </View>
            <Text style={styles.clusterFieldValueMonospace}>{networkDiagnostics.terminalId}</Text>
          </View>

          <View style={styles.horizontalRowDivider} />

          <View style={styles.metricDataRow}>
            <View style={styles.iconMetadataLabelGroup}>
              <Ionicons name="git-branch" size={18} color="rgba(255,255,255,0.6)" />
              <Text style={styles.clusterFieldLabel}>System Version</Text>
            </View>
            <Text style={styles.clusterFieldValueMonospace}>{networkDiagnostics.appVersion}</Text>
          </View>
        </BlurView>

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
    marginBottom: 32,
  },
  screenHeaderTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
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
    paddingVertical: 16,
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
  statusPillBadgeText: {
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
    marginTop: 16,
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