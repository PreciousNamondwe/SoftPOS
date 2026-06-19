import {StyleSheet } from "react-native";
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  SCANNER_SIZE,
} from "@/constants/dimensions";


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

export default styles;