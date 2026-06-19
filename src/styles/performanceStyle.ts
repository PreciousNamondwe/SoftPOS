import { StyleSheet } from "react-native";

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
    backgroundColor: "rgba(255,255,255,0.95)",
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
  cardHeaderRowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  inlineHeaderTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  filterDropdownContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 3,
    borderRadius: 10,
  },
  filterPill: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  filterPillActive: {
    backgroundColor: "#FFFFFF",
  },
  filterPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.6)",
  },
  filterPillTextActive: {
    color: "#073474",
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

export default styles;