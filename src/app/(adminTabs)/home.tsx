// ============================================================
// app/(adminTabs)/dashboard.tsx — Admin Dashboard Overview
// Lomis Field Terminal • Republic of Malawi
// ============================================================

import AnimatedCpuNetwork from "@/components/AnimatedCpuNetwork";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import {
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

function ProgressArc({ percent = 78 }) {
    const radius = 90;
    const circumference = Math.PI * radius;
    const dashOffset = circumference - (circumference * percent) / 100;

    return (
        <View style={arcStyles.arcContainer}>
            <Svg width={220} height={120}>
                <Path
                    d="M 20,110 A 90,90 0 0,1 200,110"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth={14}
                    fill="none"
                    strokeLinecap="round"
                />
                <Path
                    d="M 20,110 A 90,90 0 0,1 200,110"
                    stroke="#f3f7f6"
                    strokeWidth={14}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                />
            </Svg>
            <View style={arcStyles.arcTextAbsoluteWrapper}>
                <Text style={arcStyles.arcPercentage}>{percent}%</Text>
                <Text style={arcStyles.arcInnerLabel}>YEAR END</Text>
            </View>
        </View>
    );
}

export default function AdminDashboard() {
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [revenuePercent] = useState(65); // Dummy

    const YEAR_END_TARGET = 5000000;
    const collectedRevenue = Math.round((revenuePercent / 100) * YEAR_END_TARGET);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    const formatDate = () => {
        const now = new Date();
        return now.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <LinearGradient colors={["#456da5", "#073474", "#5C8CE8"]} style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: insets.top + 16,
                    paddingBottom: 60,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#FFFFFF"
                        colors={["#5C8CE8"]}
                        progressBackgroundColor="#ffffff"
                    />
                }
            >
                {/* ═══ 1. TOP APP BAR ═══ */}
                <View style={styles.headerRow}>
                    <View style={styles.profileMetaBoxRow}>
                        {/* Profile icon circle */}
                        <View style={styles.profileBadge}>
                            <Ionicons name="person-circle" size={38} color="#FFFFFF" />
                        </View>
                        
                        {/* Name + Admin ID stacked span */}
                        <View style={styles.idContextSpan}>
                            <Text style={styles.nameText}>{user?.full_name || "Administrator"}</Text>
                            <Text style={styles.idLabelHint}>ID: {user?.user_id || "ADM-001"}</Text>
                        </View>
                    </View>

                    {/* LOGOUT */}
                    <TouchableOpacity
                        style={styles.logoutBadge}
                        activeOpacity={0.8}
                        onPress={logout}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* ═══ 2. LOGO + GREETING ═══ */}
                <View style={styles.logoGreetingRow}>
                    <Image
                        source={require("@/assets/images/malawi-government-logo.png")}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                    <View style={styles.greetingBlock}>
                        <Text style={styles.greetingText}>Welcome !!</Text>
                        <Text style={styles.dateSubtitle}>{formatDate()}</Text>
                    </View>
                </View>

                {/* ═══ 3. REVENUE ARC ═══ */}
                <BlurView intensity={20} tint="light" style={styles.targetCard}>
                    <Text style={styles.cardSectionLabel}>FISCAL YEAR END TARGET</Text>
                    <ProgressArc percent={revenuePercent} />
                    <View style={styles.targetLegendGrid}>
                        <View style={styles.legendNode}>
                            <Text style={styles.legendLabel}>REVENUE COLLECTED</Text>
                            <Text style={styles.legendValue}>K{collectedRevenue.toLocaleString()}</Text>
                        </View>
                        <View style={[styles.legendNode, styles.legendNodeBorderLeft]}>
                            <Text style={styles.legendLabel}>YEAR END TARGET</Text>
                            <Text style={styles.legendValueNormal}>K{YEAR_END_TARGET.toLocaleString()}</Text>
                        </View>
                    </View>
                </BlurView>

                {/* ═══ 4. ANIMATED SYNC NETWORK ═══ */}
                <AnimatedCpuNetwork />

            </ScrollView>
        </LinearGradient>
    );
}

const arcStyles = StyleSheet.create({
    arcContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 10,
    },
    arcTextAbsoluteWrapper: {
        position: "absolute",
        top: 55,
        alignItems: "center",
    },
    arcPercentage: {
        fontSize: 32,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    arcInnerLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "rgba(255,255,255,0.5)",
        letterSpacing: 2,
        marginTop: 2,
    },
});

const styles = StyleSheet.create({
    container: { flex: 1 },

    // ─── Top App Bar ───
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    profileMetaBoxRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    profileBadge: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    idContextSpan: {
        justifyContent: "center",
    },
    nameText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#FFFFFF",
        marginBottom: 2,
    },
    idLabelHint: {
        fontSize: 10,
        fontWeight: "600",
        color: "rgba(255,255,255,0.4)",
        letterSpacing: 0.5,
    },
    logoutBadge: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        justifyContent: "center",
        alignItems: "center",
    },

    // ─── Logo + Greeting ───
    logoGreetingRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginTop: 16,
        marginBottom: 20,
    },
    logoImage: {
        width: 90,
        height: 90,
        resizeMode: "contain",
    },
    greetingBlock: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 50,
    },
    greetingText: {
        fontSize: 24,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    dateSubtitle: {
        fontSize: 13,
        fontWeight: "500",
        color: "rgba(255,255,255,0.45)",
        marginTop: 4,
    },

    // ─── Target Card ───
    targetCard: {
        marginHorizontal: 16,
        borderRadius: 24,
        padding: 20,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    cardSectionLabel: {
        fontSize: 10,
        fontWeight: "800",
        color: "rgba(255,255,255,0.35)",
        letterSpacing: 2,
        textAlign: "center",
        marginBottom: 8,
    },
    targetLegendGrid: {
        flexDirection: "row",
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.08)",
    },
    legendNode: {
        flex: 1,
        alignItems: "center",
    },
    legendNodeBorderLeft: {
        borderLeftWidth: 1,
        borderLeftColor: "rgba(255,255,255,0.08)",
    },
    legendLabel: {
        fontSize: 9,
        fontWeight: "700",
        color: "rgba(255,255,255,0.35)",
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    legendValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    legendValueNormal: {
        fontSize: 20,
        fontWeight: "700",
        color: "rgba(255,255,255,0.6)",
    },
});