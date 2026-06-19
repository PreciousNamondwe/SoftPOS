import {
  SCANNER_SIZE
} from "@/constants/dimensions";
import styles from "@/styles/scanStyle";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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