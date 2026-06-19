import { StyleSheet } from "react-native";

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

export default styles;