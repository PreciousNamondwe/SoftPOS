import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // Imports native navigation routing engines

export default function CollectScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter(); // Instantiates your routing engine block

  const [modalVisible, setModalVisible] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [phone, setPhone] = useState("");

  const collections = [
    { name: "Mary Chirwa", amount: "K500", location: "Lunzu Market" },
    { name: "John Banda", amount: "K700", location: "Limbe Market" },
    { name: "Peter Mbewe", amount: "K1000", location: "City Center" },
  ];

  const handleSave = () => {
    if (!vendorName.trim()) return; // Form input validation guardrails

    console.log("Vendor:", vendorName, "Phone:", phone);

    // Context States Reset Logic
    setVendorName("");
    setPhone("");
    setModalVisible(false);

    // HCI Target redirection: Drops back directly onto your local receipts tracking terminal screen
    // If using absolute tabs configurations change path mapping to: router.push("/receipts");
    router.push("/receipts");
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

        {/* HIGH-ACCESSIBILITY HERO ACTION ACTION SWITCH */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.actionButton}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.innerButtonContainer}>
            <Ionicons name="add-circle" size={24} color="#073474" />
            <Text style={styles.actionText}>New Collection Entry</Text>
          </View>
        </TouchableOpacity>

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

      {/* ================= MODAL INTERACTION SHEET ================= */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          {/* Backplate masking layer */}
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>New Collection</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeModalCross}
              >
                <Ionicons name="close" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputContextLabel}>VENDOR FULL NAME</Text>
            <TextInput
              placeholder="e.g. Mary Chirwa"
              placeholderTextColor="#999999"
              value={vendorName}
              onChangeText={setVendorName}
              style={styles.input}
            />

            <Text style={styles.inputContextLabel}>CONTACT PHONE NUMBER</Text>
            <TextInput
              placeholder="e.g. 0999000000"
              placeholderTextColor="#999999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />

            {/* FORM OPERATIONS ROW */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.cancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Discard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.saveBtn, 
                  { backgroundColor: vendorName.trim() ? "#073474" : "#CCCCCC" }
                ]}
                disabled={!vendorName.trim()}
                activeOpacity={0.8}
              >
                <Text style={styles.saveText}>Save & Issue</Text>
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
  actionButton: {
    marginHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  innerButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16, // Clean structural padding mapping (48+ vertical hit target size)
    paddingHorizontal: 20,
  },
  actionText: {
    color: "#073474",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
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
    color: "#f9fafa", // Contrast-optimized status highlight
    fontSize: 18,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    padding: 24,
    borderRadius: 28,
    backgroundColor: "#FFFFFF", // Bright light white canvas provides crisp contrast for inputs outdoors
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    color: "#000000",
    fontSize: 15,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 12,
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
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: "#666666",
    fontWeight: "700",
    fontSize: 14,
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
});