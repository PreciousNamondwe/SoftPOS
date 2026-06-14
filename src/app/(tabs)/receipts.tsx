import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Enable LayoutAnimation for smooth expanding/collapsing transitions on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ReceiptsScreen() {
  const insets = useSafeAreaInsets();

  // Track expanded state by storing an array of opened receipt IDs
  const [expandedReceipts, setExpandedReceipts] = useState<string[]>([]);

  const receipts = [
    {
      id: "SPX-9942-0182",
      vendor: "Mary Chirwa",
      amount: "K500",
      date: "14 Jun 2026 14:32",
      location: "Lunzu Market (Zone A)",
      tariffType: "Stall Daily Fee",
      paymentMethod: "CASH",
    },
    {
      id: "SPX-9942-0183",
      vendor: "John Banda",
      amount: "K700",
      date: "14 Jun 2026 14:45",
      location: "Limbe Market (Hub B)",
      tariffType: "Hawker Run Fee",
      paymentMethod: "CASH",
    },
  ];

  // Smoothly toggle show/hide details
  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedReceipts.includes(id)) {
      setExpandedReceipts(expandedReceipts.filter((item) => item !== id));
    } else {
      setExpandedReceipts([...expandedReceipts, id]);
    }
  };

  return (
    <LinearGradient
      colors={["#456da5", "#073474", "#5C8CE8"]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER ACTION BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="print-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Receipt Ledger</Text>

          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="bluetooth-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* RECEIPT LIST */}
        {receipts.map((r) => {
          const isExpanded = expandedReceipts.includes(r.id);

          return (
            <BlurView key={r.id} intensity={25} tint="light" style={styles.card}>
              
              {/* INTERACTIVE TAP TARGET FOR COLLAPSE/EXPAND */}
              <TouchableOpacity 
                onPress={() => toggleExpand(r.id)} 
                activeOpacity={0.9}
                style={styles.cardHeaderPressable}
              >
                {isExpanded ? (
                  /* FULL FISCAL HEADER (VISIBLE WHEN EXPANDED) */
                  <View style={styles.receiptHeader}>
                    <Image
                      source={{
                        uri: "https://upload.wikimedia.org/wikipedia/commons/d/d1/Coat_of_arms_of_Malawi.svg",
                      }}
                      style={styles.logo}
                    />
                    <View style={styles.headerTextGroup}>
                      <Text style={styles.govText}>GOVERNMENT OF MALAWI</Text>
                      <Text style={styles.subText}>LOCAL REVENUE COLLECTION SYSTEM</Text>
                      <Text style={styles.terminalText}>M-POS OFFICIAL FISCAL RECEIPT</Text>
                    </View>
                    <Ionicons 
                      name="chevron-up-circle" 
                      size={20} 
                      color="rgba(255,255,255,0.7)" 
                      style={styles.absoluteChevron}
                    />
                  </View>
                ) : (
                  /* MINI OVERVIEW HEADER (VISIBLE WHEN COLLAPSED) */
                  <View style={styles.collapsedHeader}>
                    <View style={styles.collapsedLeftGroup}>
                      <View style={styles.miniAvatarPlaceholder}>
                        <Ionicons name="document-text" size={16} color="#fff" />
                      </View>
                      <View>
                        <Text style={styles.collapsedVendorName}>{r.vendor}</Text>
                        <Text style={styles.collapsedSubDetail}>{r.location}</Text>
                      </View>
                    </View>
                    <View style={styles.collapsedRightGroup}>
                      <Text style={styles.collapsedAmount}>{r.amount}</Text>
                      <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* EVERYTHING BELOW IS CONDITIONAL BASED ON EXTENDED STATE */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.solidLine} />

                  {/* METRIC MATRIX BODY */}
                  <View style={styles.body}>
                    <View style={styles.receiptRow}>
                      <Text style={styles.propertyLabel}>RECEIPT ID</Text>
                      <Text style={styles.propertyValue}>{r.id}</Text>
                    </View>

                    <View style={styles.receiptRow}>
                      <Text style={styles.propertyLabel}>DATE/TIME</Text>
                      <Text style={styles.propertyValue}>{r.date}</Text>
                    </View>

                    <View style={styles.receiptRow}>
                      <Text style={styles.propertyLabel}>LOCATION</Text>
                      <Text style={styles.propertyValue}>{r.location}</Text>
                    </View>

                    <View style={styles.dashedLine} />

                    <View style={styles.receiptRow}>
                      <Text style={styles.propertyLabel}>VENDOR NAME</Text>
                      <Text style={styles.propertyValue}>{r.vendor}</Text>
                    </View>

                    <View style={styles.receiptRow}>
                      <Text style={styles.propertyLabel}>TARIFF TYPE</Text>
                      <Text style={styles.propertyValue}>{r.tariffType}</Text>
                    </View>

                    <View style={styles.receiptRow}>
                      <Text style={styles.propertyLabel}>MODE OF PAY</Text>
                      <Text style={styles.propertyValue}>{r.paymentMethod}</Text>
                    </View>

                    <View style={styles.dashedLine} />

                    {/* TOTAL FOCUS POINT */}
                    <View style={styles.amountContainer}>
                      <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                      <Text style={styles.amountText}>{r.amount}</Text>
                    </View>
                    
                    <Text style={styles.statusStamp}>✓ TRANSACTION VERIFIED & SECURED</Text>

                    {/* FISCAL BARCODE */}
                    <View style={styles.barcodeWrapper}>
                      <View style={styles.barcodePattern}>
                        {[...Array(24)].map((_, idx) => (
                          <View 
                            key={idx} 
                            style={[
                              styles.barcodeBar, 
                              { width: idx % 3 === 0 ? 3 : idx % 2 === 0 ? 1 : 2, marginRight: 2 }
                            ]} 
                          />
                        ))}
                      </View>
                      <Text style={styles.secureHash}>SECURE HASH CODE: *{r.id.split('-')[1]}*</Text>
                    </View>
                  </View>

                  {/* ACTION TRIGGERS */}
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                      <Ionicons name="print-sharp" size={16} color="#fff" />
                      <Text style={styles.actionText}>Thermal Print</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
                      <Ionicons name="share-social" size={16} color="#fff" />
                      <Text style={styles.actionText}>Share Slip</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </BlurView>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 20,
  },
  iconBtn: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  cardHeaderPressable: {
    padding: 16,
    width: "100%",
  },
  receiptHeader: {
    alignItems: "center",
    position: "relative",
    width: "100%",
    paddingTop: 8,
  },
  absoluteChevron: {
    position: "absolute",
    right: 0,
    top: 0,
  },
  logo: {
    width: 50,
    height: 50,
    resizeMode: "contain",
    marginBottom: 8,
  },
  headerTextGroup: {
    alignItems: "center",
  },
  govText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.8,
  },
  subText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 2,
  },
  terminalText: {
    color: "#05FFC4",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  /* COLLAPSED STRUCTURAL UI STYLES */
  collapsedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  collapsedLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  miniAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  collapsedVendorName: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  collapsedSubDetail: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
  },
  collapsedRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  collapsedAmount: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  solidLine: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 4,
  },
  body: {
    marginTop: 12,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  propertyLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  propertyValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.3)",
    marginVertical: 12,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  totalLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  amountText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statusStamp: {
    color: "#05FFC4",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 12,
    letterSpacing: 0.5,
  },
  barcodeWrapper: {
    alignItems: "center",
    marginTop: 18,
    opacity: 0.75,
  },
  barcodePattern: {
    flexDirection: "row",
    height: 28,
    alignItems: "stretch",
    backgroundColor: "transparent",
  },
  barcodeBar: {
    backgroundColor: "#fff",
  },
  secureHash: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 6,
    letterSpacing: 1,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});