import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [agentId, setAgentId] = useState("");
  const [pin, setPin] = useState("");
  const [isPinVisible, setIsPinVisible] = useState(false);

  const handleLogin = () => {
    console.log("Terminal authorized:", agentId);
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={["#456da5", "#073474", "#5C8CE8"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
        >
          {/* 1. TOP ARMS LOGO HEADER PANEL */}
          <View style={styles.headerContainer}>
            <Image
              source={require("@/assets/images/malawi-government-logo.png")}
              style={styles.crestLogo}
            />
            <Text style={styles.govTitle}>GOVERNMENT OF MALAWI</Text>
            <Text style={styles.subTitle}>Field Terminal</Text>
          </View>

          {/* 2. FORM ELEMENTS CONTAINER */}
          <View style={styles.formContainer}>
            
            {/* AGENT ID FIELD */}
            <Text style={styles.inputLabel}>AGENT ID</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={20} color="#f9fbfc" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                placeholder="Enter Agent ID"
                placeholderTextColor="rgba(255, 255, 255, 0.35)"
                value={agentId}
                onChangeText={setAgentId}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            {/* SECURE PASSCODE FIELD */}
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed" size={20} color="#f6f9fa" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                placeholder="Enter Password"
                placeholderTextColor="rgba(255, 255, 255, 0.35)"
                value={pin}
                onChangeText={setPin}
                secureTextEntry={!isPinVisible}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setIsPinVisible(!isPinVisible)}
                style={styles.visibilityButton}
              >
                <Ionicons
                  name={isPinVisible ? "eye-off" : "eye"}
                  size={20}
                  color="rgba(255, 255, 255, 0.6)"
                />
              </TouchableOpacity>
            </View>

            {/* 3. SOLID WHITE MAIN BUTTON */}
            <TouchableOpacity
              style={styles.whiteLoginButton}
              activeOpacity={0.9}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Login</Text>
              <Ionicons name="chevron-forward" size={18} color="#073474" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 44,
  },
  crestLogo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: 20,
  },
  govTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  subTitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  inputLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 10,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    marginBottom: 26,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputField: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  visibilityButton: {
    padding: 4,
  },
  whiteLoginButton: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  loginButtonText: {
    color: "#073474",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  footerNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 6,
  },
  footerNoticeText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
});