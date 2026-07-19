import { SCREEN_WIDTH } from "@/constants/dimensions";
import styles from "@/styles/settingsStyle";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
    ScrollView,
    Text,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
 const width = SCREEN_WIDTH

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
