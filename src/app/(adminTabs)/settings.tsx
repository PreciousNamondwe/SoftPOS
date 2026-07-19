import { SCREEN_WIDTH } from "@/constants/dimensions";
import styles from "@/styles/settingsStyle";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
    ScrollView,
    Text,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getSyncStatus, isAutoSyncRunning } from "@/lib/sync-engine";
import NetInfo from "@react-native-community/netinfo";

const width = SCREEN_WIDTH;

type SyncStatus = "active" | "low-network" | "down";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("active");
  const [networkDiagnostics, setNetworkDiagnostics] = useState({
    configuredState: "Yes",
    terminalId: "MPOS-MALAWI-992A",
    appVersion: "v4.2.1-prod",
  });

  // Monitor sync and network status
  useEffect(() => {
    const checkStatus = async () => {
      const netInfo = await NetInfo.fetch();
      const syncState = getSyncStatus();
      const isRunning = isAutoSyncRunning();

      // Priority: sync engine down > low network > active
      if (!isRunning || syncState.failed > 10) {
        setSyncStatus("down");
      } else if (!netInfo.isConnected || (netInfo as any).isConnectionExpensive || (netInfo.details as any)?.strength < 2) {
        setSyncStatus("low-network");
      } else {
        setSyncStatus("active");
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000); // Check every 3s
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = (status: SyncStatus) => {
    switch (status) {
      case "active":
        return {
          dotColor: "#22c55e", // Green
          text: "ACTIVE",
          subText: "Background sync healthy",
          icon: "checkmark-circle",
        };
      case "low-network":
        return {
          dotColor: "#eab308", // Yellow
          text: "LOW NETWORK",
          subText: "Sync delayed — weak connection",
          icon: "warning",
        };
      case "down":
        return {
          dotColor: "#ef4444", // Red
          text: "SYNC DOWN",
          subText: "Background sync stopped",
          icon: "close-circle",
        };
    }
  };

  const statusConfig = getStatusConfig(syncStatus);

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
          
          {/* System Connection — Dynamic Sync Status */}
          <View style={styles.metricDataRow}>
            <View style={styles.iconMetadataLabelGroup}>
              <Ionicons name="server" size={18} color="#fafdfd" />
              <View>
                <Text style={styles.clusterFieldLabel}>System Connection</Text>
                <Text style={[styles.statusSubText, { color: statusConfig.dotColor }]}>
                  {statusConfig.subText}
                </Text>
              </View>
            </View>
            <View style={[styles.statusPillBadgeRow, { backgroundColor: `${statusConfig.dotColor}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.dotColor }]} />
              <Text style={[styles.statusPillBadgeText, { color: statusConfig.dotColor }]}>
                {statusConfig.text}
              </Text>
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