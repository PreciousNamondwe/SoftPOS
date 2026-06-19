import styles from "@/styles/collectionStyle";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
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

// 1. IMPORT NATIVE EXPO SQLITE ENGINE
import * as SQLite from "expo-sqlite";

// Open or initialize the target database file on device storage instantly
const db = SQLite.openDatabaseSync("lomis.db");

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

const MOCK_AGENT_ID = "AGENT-TEMP-001";

export default function CollectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter(); 

  const [onboardModalVisible, setOnboardModalVisible] = useState<boolean>(false);
  const [createQrModalVisible, setCreateQrModalVisible] = useState<boolean>(false);
  
  // Shared Form Input Context States
  const [nationalId, setNationalId] = useState<string>("");
  const [vendorName, setVendorName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>(""); 
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessType | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // 2. RUN AUTO-MIGRATION SCHEMAS ON SCREEN MOUNT
  useEffect(() => {
    try {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS Vendor (
          id TEXT PRIMARY KEY NOT NULL,
          businessName TEXT NOT NULL,
          tradingName TEXT,
          tpin TEXT UNIQUE NOT NULL,
          nationalId TEXT UNIQUE NOT NULL,
          mobileNumber TEXT NOT NULL,
          physicalAddress TEXT,
          district TEXT,
          businessType TEXT,
          agentId TEXT NOT NULL
        );
      `);
      console.log("SQLite Engine tables verified successfully.");
    } catch (error) {
      console.error("Failed to run native SQLite initializations:", error);
    }
  }, []);

  const collections: CollectionItem[] = [
    { name: "Mary Chirwa", amount: "K500", location: "Lunzu Market" },
    { name: "John Banda", amount: "K700", location: "Limbe Market" },
    { name: "Peter Mbewe", amount: "K1000", location: "City Center" },
  ];

  // 3. PERSIST RECORD USING EXPO-SQLITE RUNTIME
  const handleOnboardAndCollect = () => {
    // Structural Field Validation Rules Checklist
    if (!nationalId.trim() || !vendorName.trim() || !phoneNumber.trim() || !selectedBusiness) return; 

    const cleanNationalId = nationalId.toUpperCase().trim();
    const cleanVendorName = vendorName.trim();
    const cleanPhone = phoneNumber.trim();
    const runtimeUniqueId = Math.random().toString(36).substring(2, 15);

    try {
      // Execute the record insertion using parameterized inputs to prevent SQL errors
      db.runSync(
        `INSERT INTO Vendor (id, businessName, tradingName, tpin, nationalId, mobileNumber, physicalAddress, district, businessType, agentId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          runtimeUniqueId,
          cleanVendorName,
          cleanVendorName,
          `TPIN-${cleanNationalId}`,
          cleanNationalId,
          cleanPhone,
          "Field Offline Capture",
          "Blantyre",
          selectedBusiness.label,
          MOCK_AGENT_ID,
        ]
      );

      console.log("VENDOR DATA SUCCESSFULLY SAVED TO SQLITE INTERNALLY");
      Alert.alert("Success", `${cleanVendorName} has been saved to local memory successfully.`);

      // Reset Form Input Context States
      setNationalId("");
      setVendorName("");
      setPhoneNumber("");
      setSelectedBusiness(null);
      setShowDropdown(false);
      setOnboardModalVisible(false);

      // Route over to real-time receipts summary tracking terminal ledger
      router.push("/scan");
    } catch (error: any) {
      console.error("SQLite storage operational crash:", error);
      Alert.alert("Storage Error", error.message.includes("UNIQUE") 
        ? "A vendor with this National ID already exists locally." 
        : "Failed to write record to internal device storage."
      );
    }
  };

  const handleCreateQrOnly = () => {
    if (!nationalId.trim() || !vendorName.trim()) return;

    console.log("QR GENERATION DATA MINED:", {
      nationalId: nationalId.toUpperCase().trim(),
      vendorName: vendorName.trim(),
    });

    setNationalId("");
    setVendorName("");
    setCreateQrModalVisible(false);

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
            onPress={() => setOnboardModalVisible(true)}
          >
            <Ionicons name="person-add-outline" size={20} color="#073474" />
            <Text style={styles.actionText}>Onboard Vendor</Text>
          </TouchableOpacity>

          {/* 2. CREATE QR BUTTON */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionButtonSplit, styles.actionButtonScanVariant]}
            onPress={() => setCreateQrModalVisible(true)}
          >
            <Ionicons name="qr-code-outline" size={22} color="#FFFFFF" />
            <Text style={[styles.actionText, styles.actionTextScanVariant]}>Create QR</Text>
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
        visible={onboardModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => {
          setShowDropdown(false);
          setOnboardModalVisible(false);
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
                  setOnboardModalVisible(false);
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

            {/* 3. PHONE NUMBER FIELD */}
            <Text style={styles.inputContextLabel}>3. PHONE NUMBER</Text>
            <TextInput
              placeholder="e.g. +265 888 12 34 56"
              placeholderTextColor="#999999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={styles.input}
            />

            {/* 4. BUSINESS TYPE / SERVICE SELECTOR */}
            <Text style={styles.inputContextLabel}>4. BUSINESS TYPE / SERVICE</Text>
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

            {selectedBusiness && !showDropdown && (
              <View style={styles.cashDueNotificationBanner}>
                <Text style={styles.cashBannerLabel}>FIXED DAILY CASH DUE:</Text>
                <Text style={styles.cashBannerValue}>K{selectedBusiness.fee}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowDropdown(false);
                  setOnboardModalVisible(false);
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
                  { backgroundColor: (nationalId.trim() && vendorName.trim() && phoneNumber.trim() && selectedBusiness) ? "#00FFCC" : "#CCCCCC" }
                ]}
                disabled={!nationalId.trim() || !vendorName.trim() || !phoneNumber.trim() || !selectedBusiness}
                activeOpacity={0.8}
              >
                <Text style={styles.saveText}>Create QR &amp; Collect</Text>
                <Ionicons name="qr-code-outline" size={16} color="#073474" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL CREATE QR ONLY SHEET ================= */}
      <Modal
        visible={createQrModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setCreateQrModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Create Vendor QR</Text>
              <TouchableOpacity 
                onPress={() => setCreateQrModalVisible(false)}
                style={styles.closeModalCross}
              >
                <Ionicons name="close" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            {/* 1. NATIONAL ID FIELD */}
            <Text style={styles.inputContextLabel}>1. VENDOR NATIONAL ID NUMBER</Text>
            <TextInput
              placeholder="e.g. BR76HJK9"
              placeholderTextColor="#999999"
              value={nationalId}
              onChangeText={setNationalId}
              autoCapitalize="characters"
              style={styles.input}
            />

            {/* 2. VENDOR NAME FIELD */}
            <Text style={styles.inputContextLabel}>2. VENDOR USERNAME / FULL NAME</Text>
            <TextInput
              placeholder="e.g. Mary Chirwa"
              placeholderTextColor="#999999"
              value={vendorName}
              onChangeText={setVendorName}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setCreateQrModalVisible(false)}
                style={styles.cancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateQrOnly}
                style={[
                  styles.saveBtn, 
                  { backgroundColor: (nationalId.trim() && vendorName.trim()) ? "#00FFCC" : "#CCCCCC" }
                ]}
                disabled={!nationalId.trim() || !vendorName.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.saveText}>Generate QR</Text>
                <Ionicons name="qr-code-outline" size={16} color="#073474" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </LinearGradient>
  );
}