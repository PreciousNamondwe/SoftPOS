import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Strict Type Declaration Mapping for TypeScript Safety
interface BusinessType {
  id: string;
  label: string;
  fee: number;
}

interface CollectionItem {
  name: string;
  amount: string;
  location: string;
}

const BUSINESS_TYPES: BusinessType[] = [
  { id: "1", label: "Perishable Foods / Vegetables", fee: 500 },
  { id: "2", label: "Dry Goods / Clothing Stall", fee: 1000 },
  { id: "3", label: "Mobile Money Booth (Airtel/TNM)", fee: 800 },
  { id: "4", label: "Wholesale / Storage Unit", fee: 2500 },
  { id: "5", label: "Hardware & Construction Retail", fee: 3000 },
  { id: "6", label: "Tailoring / Artisanal Workshop", fee: 750 },
];

export default function CollectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter(); 

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  
  // Day 1 Onboarding Form States
  const [nationalId, setNationalId] = useState<string>("");
  const [vendorName, setVendorName] = useState<string>("");
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const collections: CollectionItem[] = [
    { name: "Mary Chirwa", amount: "K500", location: "Lunzu Market" },
    { name: "John Banda", amount: "K700", location: "Limbe Market" },
    { name: "Peter Mbewe", amount: "K1000", location: "City Center" },
  ];

  const handleOnboardAndCollect = () => {
    // Structural Field Validation Rules Checklist
    if (!nationalId.trim() || !vendorName.trim() || !selectedBusiness) return; 

    console.log("DAY 1 PAYLOAD MINTED:", {
      nationalId: nationalId.toUpperCase().trim(),
      vendorName: vendorName.trim(),
      businessType: selectedBusiness.label,
      feeLogged: selectedBusiness.fee,
      paymentMethod: "CASH_IMMEDIATE"
    });

    // Reset Form Input Context States
    setNationalId("");
    setVendorName("");
    setSelectedBusiness(null);
    setShowDropdown(false);
    setModalVisible(false);

    // Route over to real-time receipts summary tracking terminal ledger
    router.push("/scan");
  };

  return (
    <LinearGradient
      colors={["#456da5", "#073474", "#5C8CE8"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: 120,
        }}
      >
        {/* HEADER */}
        <BlurView intensity={25} tint="light" style={styles.headerCard}>
          <Text style={styles.title}>Collections</Text>
          <Text style={styles.subtitle}>
            Track all payments in real time
          </Text>
        </BlurView>

        {/* HIGH-ACCESSIBILITY HERO ACTION SYSTEM SWITCHES */}
        <View style={styles.actionRowContainer}>
          {/* 1. ONBOARD NEW VENDOR BUTTON */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.actionButtonSplit}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="person-add-outline" size={20} color="#073474" />
            <Text style={styles.actionText}>Onboard Vendor</Text>
          </TouchableOpacity>

          {/* 2. LIVE FIELD SCAN BUTTON */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionButtonSplit, styles.actionButtonScanVariant]}
            onPress={() => router.push("/scan")}
          >
            <Ionicons name="scan-circle-outline" size={24} color="#FFFFFF" />
            <Text style={[styles.actionText, styles.actionTextScanVariant]}>Scan QR</Text>
          </TouchableOpacity>
        </View>

        {/* LIST */}
        <Text style={styles.sectionTitle}>Recent Collections</Text>

        {collections.map((item, index) => (
          <BlurView
            key={index}
            intensity={18}
            tint="light"
            style={styles.card}
          >
            <View style={styles.cardInfoGroup}>
              <View style={styles.avatarIconPlaceholder}>
                <Ionicons name="person-outline" size={16} color="#fff" />
              </View>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.location}>{item.location}</Text>
              </View>
            </View>

            <Text style={styles.amount}>{item.amount}</Text>
          </BlurView>
        ))}
      </ScrollView>

      {/* ================= MODAL ONBOARDING SHEET ================= */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowDropdown(false);
          setModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Onboard New Vendor</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowDropdown(false);
                  setModalVisible(false);
                }}
                style={styles.closeModalCross}
              >
                <Ionicons name="close" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            {/* 1. NATIONAL ID FIELD */}
            <Text style={styles.inputContextLabel}>1. NATIONAL ID NUMBER</Text>
            <TextInput
              placeholder="e.g. BR76HJK9"
              placeholderTextColor="#999999"
              value={nationalId}
              onChangeText={setNationalId}
              autoCapitalize="characters"
              style={styles.input}
            />

            {/* 2. VENDOR NAME FIELD */}
            <Text style={styles.inputContextLabel}>2. VENDOR FULL NAME</Text>
            <TextInput
              placeholder="e.g. Mary Chirwa"
              placeholderTextColor="#999999"
              value={vendorName}
              onChangeText={setVendorName}
              style={styles.input}
            />

            {/* 3. BUSINESS TYPE / SERVICE SCROLLABLE SELECTOR */}
            <Text style={styles.inputContextLabel}>3. BUSINESS TYPE / SERVICE</Text>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.dropdownSelectorTrigger,
                showDropdown && styles.dropdownSelectorTriggerActive
              ]}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text 
                numberOfLines={1} 
                style={[styles.dropdownTriggerText, selectedBusiness && styles.dropdownTriggerTextActive]}
              >
                {selectedBusiness ? `${selectedBusiness.label} (K${selectedBusiness.fee})` : "Choose Business Category"}
              </Text>
              <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={18} color="#073474" />
            </TouchableOpacity>

            {/* HIGH-ACCESSIBILITY SCROLLABLE INLINE DROPDOWN BOX */}
            {showDropdown && (
              <View style={styles.dropdownScrollContainer}>
                <ScrollView 
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  style={styles.dropdownInnerScroll}
                >
                  {BUSINESS_TYPES.map((type) => {
                    const isSelected = selectedBusiness?.id === type.id;
                    return (
                      <TouchableOpacity
                        key={type.id}
                        activeOpacity={0.7}
                        style={[
                          styles.dropdownInlineOption,
                          isSelected && styles.dropdownInlineOptionSelected
                        ]}
                        onPress={() => {
                          setSelectedBusiness(type);
                          setShowDropdown(false);
                        }}
                      >
                        <View style={styles.optionTextBlock}>
                          <Text style={[styles.optionLabelText, isSelected && styles.optionLabelTextSelected]}>
                            {type.label}
                          </Text>
                          <Text style={styles.optionFeeText}>K{type.fee}</Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={18} color="#073474" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* IMMUTABLE SERVER-DEFINED FEES NOTIFICATION BANNER */}
            {selectedBusiness && !showDropdown && (
              <View style={styles.cashDueNotificationBanner}>
                <Text style={styles.cashBannerLabel}>FIXED DAILY CASH DUE:</Text>
                <Text style={styles.cashBannerValue}>K{selectedBusiness.fee}</Text>
              </View>
            )}

            {/* 4. FORM ACTIONS ACCESSIBILITY BUTTON PANEL */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowDropdown(false);
                  setModalVisible(false);
                }}
                style={styles.cancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Discard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOnboardAndCollect}
                style={[
                  styles.saveBtn, 
                  { backgroundColor: (nationalId.trim() && vendorName.trim() && selectedBusiness) ? "#00FFCC" : "#CCCCCC" }
                ]}
                disabled={!nationalId.trim() || !vendorName.trim() || !selectedBusiness}
                activeOpacity={0.8}
              >
                <Text style={styles.saveText}>Create QR &amp; Collect</Text>
                <Ionicons name="qr-code-outline" size={16} color="#073474" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
  },
  actionRowContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  actionButtonSplit: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonScanVariant: {
    backgroundColor: "#073474", 
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  actionText: {
    color: "#073474",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  actionTextScanVariant: {
    color: "#FFFFFF",
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  cardInfoGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarIconPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  location: {
    color: "rgba(255,255,255,0.65)",
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
  },
  amount: {
    color: "#f9fafa", 
    fontSize: 18,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    padding: 22,
    borderRadius: 28,
    backgroundColor: "#FFFFFF", 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#111111",
    letterSpacing: -0.5,
  },
  closeModalCross: {
    padding: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  inputContextLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#666666",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dropdownSelectorTrigger: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
  },
  dropdownSelectorTriggerActive: {
    borderColor: "#073474",
    borderWidth: 1.5,
  },
  dropdownTriggerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999999",
    flex: 1,
    paddingRight: 8,
  },
  dropdownTriggerTextActive: {
    color: "#073474",
    fontWeight: "700",
  },
  dropdownScrollContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownInnerScroll: {
    maxHeight: 150, // Locks container to support crisp scrolling behaviors inside the modal sheet layout
  },
  dropdownInlineOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownInlineOptionSelected: {
    backgroundColor: "rgba(7, 52, 116, 0.04)",
  },
  optionTextBlock: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 10,
  },
  optionLabelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444444",
    flex: 1,
    paddingRight: 8,
  },
  optionLabelTextSelected: {
    color: "#073474",
    fontWeight: "700",
  },
  optionFeeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555555",
  },
  cashDueNotificationBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(7, 52, 116, 0.05)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(7, 52, 116, 0.1)",
  },
  cashBannerLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#073474",
  },
  cashBannerValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#073474",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelText: {
    color: "#666666",
    fontWeight: "700",
    fontSize: 14,
  },
  saveText: {
    color: "#073474",
    fontWeight: "900",
    fontSize: 14,
  },
});