// ============================================================
// app/login.tsx — Login Screen (routes admin to adminTabs)
// LORMIS-POS
// ============================================================

import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
    const { login, biometricLogin, isLoading: authLoading, isAuthenticated, user } = useAuth();

    const [userId, setUserId] = useState("");
    const [pin, setPin] = useState("");
    const [isPinVisible, setIsPinVisible] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);

    useEffect(() => {
        async function checkBiometric() {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setBiometricAvailable(compatible && enrolled);
        }
        checkBiometric();
    }, []);

    // Redirect based on role when authenticated
    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === "admin") {
                router.replace("/(adminTabs)/home");
            } else {
                router.replace("/(tabs)");
            }
        }
    }, [isAuthenticated, user]);

    const handleLogin = async () => {
        if (!userId.trim() || !pin.trim()) {
            Alert.alert("Missing Fields", "Please enter both User ID and PIN.");
            return;
        }

        setIsLoggingIn(true);
        const result = await login(userId, pin);
        setIsLoggingIn(false);

        if (!result.success) {
            Alert.alert("Login Failed", result.message);
        }
    };

    const handleBiometric = async () => {
        setIsLoggingIn(true);
        const result = await biometricLogin();
        setIsLoggingIn(false);

        if (!result.success) {
            Alert.alert("Biometric Failed", result.message);
        }
    };

    if (authLoading) {
        return (
            <LinearGradient colors={["#456da5", "#073474", "#5C8CE8"]} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.loadingText}>Initializing Terminal...</Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={["#456da5", "#073474", "#5C8CE8"]} style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
                    ]}
                >
                    {/* HEADER */}
                    <View style={styles.headerContainer}>
                        <Image source={require("@/assets/images/malawi-government-logo.png")} style={styles.crestLogo} />
                        <Text style={styles.govTitle}>GOVERNMENT OF MALAWI</Text>
                        <Text style={styles.subTitle}>LORMIS-POS</Text>
                    </View>

                    {/* FORM */}
                    <View style={styles.formContainer}>
                        {biometricAvailable && (
                            <TouchableOpacity style={styles.biometricButton} onPress={handleBiometric} activeOpacity={0.8} disabled={isLoggingIn}>
                                <Ionicons name="finger-print" size={24} color="#073474" />
                                <Text style={styles.biometricText}>Login with Fingerprint</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={styles.inputLabel}>USER ID</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person" size={20} color="#f9fbfc" style={styles.inputIcon} />
                            <TextInput
                                style={styles.inputField}
                                placeholder="Enter User ID"
                                placeholderTextColor="rgba(255, 255, 255, 0.35)"
                                value={userId}
                                onChangeText={setUserId}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                editable={!isLoggingIn}
                            />
                        </View>

                        <Text style={styles.inputLabel}>PIN</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed" size={20} color="#f6f9fa" style={styles.inputIcon} />
                            <TextInput
                                style={styles.inputField}
                                placeholder="Enter PIN"
                                placeholderTextColor="rgba(255, 255, 255, 0.35)"
                                value={pin}
                                onChangeText={setPin}
                                secureTextEntry={!isPinVisible}
                                keyboardType="number-pad"
                                maxLength={6}
                                editable={!isLoggingIn}
                            />
                            <TouchableOpacity onPress={() => setIsPinVisible(!isPinVisible)} style={styles.visibilityButton} disabled={isLoggingIn}>
                                <Ionicons name={isPinVisible ? "eye-off" : "eye"} size={20} color="rgba(255, 255, 255, 0.6)" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.whiteLoginButton, isLoggingIn && styles.whiteLoginButtonDisabled]}
                            activeOpacity={0.9}
                            onPress={handleLogin}
                            disabled={isLoggingIn}
                        >
                            {isLoggingIn ? (
                                <ActivityIndicator color="#073474" />
                            ) : (
                                <>
                                    <Text style={styles.loginButtonText}>Login</Text>
                                    <Ionicons name="chevron-forward" size={18} color="#073474" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
    loadingText: { color: "rgba(255, 255, 255, 0.8)", fontSize: 14, fontWeight: "600", letterSpacing: 0.5 },
    scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 32 },
    headerContainer: { alignItems: "center", marginBottom: 44 },
    crestLogo: { width: 100, height: 100, resizeMode: "contain", marginBottom: 20 },
    govTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", letterSpacing: 2, textAlign: "center" },
    subTitle: { color: "rgba(255, 255, 255, 0.6)", fontSize: 13, fontWeight: "600", marginTop: 6, letterSpacing: 0.5, textAlign: "center" },
    formContainer: { width: "100%" },
    biometricButton: { flexDirection: "row", backgroundColor: "rgba(255, 255, 255, 0.15)", height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 24, gap: 8, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.2)" },
    biometricText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
    inputLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 10, marginLeft: 2 },
    inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.06)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.12)", borderRadius: 14, marginBottom: 26, paddingHorizontal: 16, height: 56 },
    inputIcon: { marginRight: 12 },
    inputField: { flex: 1, color: "#FFFFFF", fontSize: 15, fontWeight: "600", letterSpacing: 0.5 },
    visibilityButton: { padding: 4 },
    whiteLoginButton: { flexDirection: "row", backgroundColor: "#FFFFFF", height: 56, borderRadius: 14, justifyContent: "center", alignItems: "center", marginTop: 12, gap: 6, shadowColor: "#000000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    whiteLoginButtonDisabled: { opacity: 0.7 },
    loginButtonText: { color: "#073474", fontSize: 14, fontWeight: "900", letterSpacing: 1 },
});