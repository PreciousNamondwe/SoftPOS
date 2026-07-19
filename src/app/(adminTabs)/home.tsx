// ============================================================
// app/(adminTabs)/dashboard.tsx — Admin Dashboard Overview
// Lomis Field Terminal
// ============================================================

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/database";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Stats {
    totalUsers: number;
    activeUsers: number;
    adminCount: number;
    agentCount: number;
    supervisorCount: number;
    lastLogin: string | null;
}

export default function AdminDashboard() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        activeUsers: 0,
        adminCount: 0,
        agentCount: 0,
        supervisorCount: 0,
        lastLogin: null,
    });

    useEffect(() => {
        loadStats();
    }, []);

    function loadStats() {
        try {
            const total = db.getFirstSync<{ count: number }>(
                "SELECT COUNT(*) as count FROM user;"
            );
            const active = db.getFirstSync<{ count: number }>(
                "SELECT COUNT(*) as count FROM user WHERE is_active = 1;"
            );
            const admins = db.getFirstSync<{ count: number }>(
                "SELECT COUNT(*) as count FROM user WHERE role = 'admin';"
            );
            const agents = db.getFirstSync<{ count: number }>(
                "SELECT COUNT(*) as count FROM user WHERE role = 'agent';"
            );
            const supervisors = db.getFirstSync<{ count: number }>(
                "SELECT COUNT(*) as count FROM user WHERE role = 'supervisor';"
            );
            const lastLogin = db.getFirstSync<{ last_login: string }>(
                "SELECT MAX(last_login) as last_login FROM user WHERE last_login IS NOT NULL;"
            );

            setStats({
                totalUsers: total?.count || 0,
                activeUsers: active?.count || 0,
                adminCount: admins?.count || 0,
                agentCount: agents?.count || 0,
                supervisorCount: supervisors?.count || 0,
                lastLogin: lastLogin?.last_login || null,
            });
        } catch (error) {
            console.error("Stats error:", error);
        }
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadStats();
        // Simulate a brief delay so the refresh indicator is visible
        setTimeout(() => {
            setRefreshing(false);
        }, 800);
    }, []);

    const statCards = [
        { label: "Total Users", value: stats.totalUsers, icon: "people-outline" },
        { label: "Active", value: stats.activeUsers, icon: "checkmark-circle-outline" },
        { label: "Admins", value: stats.adminCount, icon: "shield-outline" },
        { label: "Agents", value: stats.agentCount, icon: "person-outline" },
    ];

    // Get initials for avatar
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <LinearGradient colors={["#456da5", "#073474", "#5C8CE8"]} style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: insets.top + 20,
                    paddingBottom: insets.bottom + 40,
                    paddingHorizontal: 20,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="rgba(255,255,255,0.6)"
                        colors={["#5C8CE8"]}
                        progressBackgroundColor="rgb(255, 255, 255)"
                    />
                }
            >
                {/* TOP BAR: Profile + Logout */}
                <View style={styles.topBar}>
                    <View style={styles.profileSection}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>
                                {getInitials(user?.full_name || "Admin")}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{user?.full_name || "Administrator"}</Text>
                            <Text style={styles.profileRole}>{user?.role?.toUpperCase()}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
                        <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
                    </TouchableOpacity>
                </View>

                {/* STATS GRID - 2x2 Cards */}
                <View style={styles.statsSection}>
                    <View style={styles.statsGrid}>
                        {statCards.map((card, index) => (
                            <View key={index} style={styles.statCard}>
                                <View style={styles.statTopRow}>
                                    <View style={styles.statIconWrap}>
                                        <Ionicons name={card.icon as any} size={18} color="rgba(255,255,255,0.6)" />
                                    </View>
                                </View>
                                <Text style={styles.statValue}>{card.value}</Text>
                                <Text style={styles.statLabel}>{card.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* QUICK ACTIONS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsWrap}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push("/(adminTabs)/add-roles")}
                            activeOpacity={0.7}
                        >
                            <View style={styles.actionLeft}>
                                <View style={styles.actionIcon}>
                                    <Ionicons name="person-add-outline" size={20} color="rgba(255,255,255,0.8)" />
                                </View>
                                <View>
                                    <Text style={styles.actionTitle}>Add New Role</Text>
                                    <Text style={styles.actionDesc}>Create agent or admin accounts</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push("/(adminTabs)/users")}
                            activeOpacity={0.7}
                        >
                            <View style={styles.actionLeft}>
                                <View style={styles.actionIcon}>
                                    <Ionicons name="people-outline" size={20} color="rgba(255,255,255,0.8)" />
                                </View>
                                <View>
                                    <Text style={styles.actionTitle}>Manage Users</Text>
                                    <Text style={styles.actionDesc}>View, edit or deactivate users</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Top Bar
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 28,
    },
    profileSection: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    profileInfo: {
        justifyContent: "center",
    },
    profileName: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: 0.2,
    },
    profileRole: {
        color: "rgba(255, 255, 255, 0.45)",
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 1,
        marginTop: 2,
    },
    logoutBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },

    // Stats Section
    statsSection: {
        marginBottom: 28,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    statCard: {
        width: "48%",
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
    },
    statTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    statIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        justifyContent: "center",
        alignItems: "center",
    },
    statValue: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "700",
    },
    statLabel: {
        color: "rgba(255, 255, 255, 0.4)",
        fontSize: 12,
        fontWeight: "500",
        marginTop: 4,
        letterSpacing: 0.3,
    },

    // Section
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 0.5,
        marginBottom: 14,
    },

    // Actions
    actionsWrap: {
        gap: 10,
    },
    actionCard: {
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    actionLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        justifyContent: "center",
        alignItems: "center",
    },
    actionTitle: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
        letterSpacing: 0.2,
    },
    actionDesc: {
        color: "rgba(255, 255, 255, 0.4)",
        fontSize: 12,
        fontWeight: "400",
        marginTop: 2,
    },

    // Info Card
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.06)",
    },
    infoText: {
        color: "rgba(255, 255, 255, 0.3)",
        fontSize: 12,
        fontWeight: "400",
    },
});