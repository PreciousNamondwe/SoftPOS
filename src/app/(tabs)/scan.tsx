import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SCANNER_SIZE = SCREEN_WIDTH * 0.7;

export default function ScanQRScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // 1. Hardware Permissions Engine Setup
  const [permission, requestPermission] = useCameraPermissions();

  // 2. Scan & Modal States
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // 3. Laser Animation Loop Configuration
  const animationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // Clean looping animation configuration
  useEffect(() => {
    const startLaserLoop = () => {
      animationValue.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(animationValue, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animationValue, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startLaserLoop();
  }, [animationValue]);

  // Micro-constrained within the viewport boundaries
  const translateY = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [6, SCANNER_SIZE - 10],
  });

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (isProcessing || modalVisible) return;
    
    if (result.data) {
      setScannedPayload(result.data);
      setModalVisible(true); 
    }
  };

  const handleVerifyAndProceed = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setModalVisible(false);
      setScannedPayload(null);
      Alert.alert("Verified", "Transaction mapped and secured successfully.", [
        { text: "OK", onPress: () => router.push("/scan") }
      ]);
    }, 1000);
  };

  if (!permission || !permission.granted) {
    return (
      <View style={styles.fallbackContainer}>
        <ActivityIndicator size="large" color="#073474" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. THE LIVE CAMERA LAYER (Occupies 100% of the screen background) */}
      <CameraView
        style={styles.cameraPreviewView}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* 2. THE HUD OVERLAY LAYER (Kept totally see-through) */}
      <View style={[styles.transparentUiOverlay, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 40 }]}>
        
        {/* TOP NAVIGATION BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#073474" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Field QR Scanner</Text>
          <View style={styles.rightLayoutSpacer} />
        </View>

        {/* SCANNING BOX (Centered perfectly over the camera stream) */}
        <View style={styles.viewportCenterContainer}>
          <View style={styles.viewfinderFrame}>
            {/* Blue Corner Brackets */}
            <View style={[styles.cornerBracket, styles.topLeftCorner]} />
            <View style={[styles.cornerBracket, styles.topRightCorner]} />
            <View style={[styles.cornerBracket, styles.bottomLeftCorner]} />
            <View style={[styles.cornerBracket, styles.bottomRightCorner]} />
            
            {/* ANIMATED RED SCANNING LINE */}
            <Animated.View style={[styles.laserLine, { transform: [{ translateY }] }]} />
          </View>

          {/* LOWER LABELS (Positioned cleanly below the scanning square) */}
          <Text style={styles.hintInstructionsOutside}>Align vendor QR code within frame</Text>
          <Text style={styles.statusTextBelow}>Awaiting Scan Event...</Text>
        </View>

        {/* Bottom Symmetry Layout Buffer */}
        <View style={{ height: 10 }} />
      </View>

      {/* ================= VERIFICATION MODAL SHEET ================= */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
          
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.successIconBadge}>
                <Ionicons name="checkmark-circle" size={28} color="#05FFC4" />
              </View>
              <Text style={styles.modalTitle}>QR Code Identified</Text>
            </View>

            <View style={styles.payloadContextBox}>
              <Text style={styles.contextLabel}>VENDOR SYSTEM DATA:</Text>
              <Text style={styles.payloadValueText}>{scannedPayload}</Text>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity 
                style={styles.discardBtn}
                onPress={() => {
                  setModalVisible(false);
                  setScannedPayload(null);
                }}
              >
                <Text style={styles.discardText}>Scan Again</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.proceedBtn}
                onPress={handleVerifyAndProceed}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#073474" />
                ) : (
                  <>
                    <Text style={styles.proceedText}>Verify &amp; Proceed</Text>
                    <Ionicons name="arrow-forward" size={16} color="#073474" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cameraPreviewView: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 1, // Stays firmly behind the user interface graphics
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  transparentUiOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "space-between",
    backgroundColor: "transparent", // Ensures zero background blocking the camera view
    zIndex: 2,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    width: "100%",
  },
  backBtn: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  rightLayoutSpacer: {
    width: 42,
    height: 42,
  },
  viewportCenterContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  viewfinderFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    backgroundColor: "transparent", // Fully clear center so you can see your QR codes
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    position: "relative",
    overflow: "hidden", 
  },
  cornerBracket: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#073474", // Blue Corners
    zIndex: 6,
  },
  topLeftCorner: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRightCorner: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeftCorner: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRightCorner: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  laserLine: {
    position: "absolute",
    left: "4%",
    right: "4%",
    height: 2.5,
    backgroundColor: "#FF3B30", // Red Scanning Laser Line
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  hintInstructionsOutside: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 20,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statusTextBelow: {
    color: "rgba(255,255,255,0.7)", // White text tone below the image square box boundary
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  successIconBadge: {
    padding: 4,
    backgroundColor: "rgba(5, 255, 196, 0.1)",
    borderRadius: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
  },
  payloadContextBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 24,
  },
  contextLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.4)",
    marginBottom: 6,
  },
  payloadValueText: {
    color: "#05FFC4",
    fontSize: 15,
    fontWeight: "700",
  },
  modalActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  discardBtn: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  discardText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  proceedBtn: {
    flex: 2,
    backgroundColor: "#05FFC4",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  proceedText: {
    color: "#073474",
    fontSize: 14,
    fontWeight: "900",
  },
});