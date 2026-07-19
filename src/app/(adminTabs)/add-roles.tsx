// ============================================================
// app/(adminTabs)/roles.tsx — Role Management (Auto Key, No Description)
// Lomis Field Terminal
// ============================================================

import { useAuth } from "@/contexts/AuthContext";
import { db, deleteRole, logAudit } from "@/lib/database";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Role {
    id: number;
    role_key: string;
    role_label: string;
    color: string;
    created_at: string;
}

const DEFAULT_COLORS = ["#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff", "#ffffff"];

export default function RolesScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [roles, setRoles] = useState<Role[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [modalVisible, setModalVisible] = useState(false);
    const [roleLabel, setRoleLabel] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── Load roles ─────────────────────────────────────────
    function loadRoles() {
        try {
            ensureRolesTable();
            // In roles.tsx — add WHERE is_deleted = 0
const results = db.getAllSync<Role>(
    "SELECT * FROM roles WHERE is_deleted = 0 ORDER BY created_at DESC;"
);
            setRoles(results);
        } catch (error) {
            console.error("Load roles error:", error);
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadRoles();
        }, [])
    );

    function onRefresh() {
        setRefreshing(true);
        loadRoles();
        setRefreshing(false);
    }

    function ensureRolesTable() {
        db.execSync(`
            CREATE TABLE IF NOT EXISTS roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role_key TEXT NOT NULL UNIQUE,
                role_label TEXT NOT NULL,
                color TEXT DEFAULT '#5C8CE8',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        `);
    }

    // ─── Generate unique role key ───────────────────────────
    function generateRoleKey(): string {
        const prefix = "RL";
        const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
        const random = Math.floor(100 + Math.random() * 900);
        return `${prefix}${timestamp}${random}`;
    }

    // ─── Open/Close Modal ───────────────────────────────────
    function openModal() {
        setRoleLabel("");
        setModalVisible(true);
    }

    function closeModal() {
        setModalVisible(false);
    }

    // ─── Add Role ─────────────────────────────────────────────
    function handleAddRole() {
        const cleanLabel = roleLabel.trim();

        if (!cleanLabel) {
            Alert.alert("Missing Field", "Please enter a role name.");
            return;
        }

        if (cleanLabel.length < 2) {
            Alert.alert("Too Short", "Role name must be at least 2 characters.");
            return;
        }

        setIsSubmitting(true);

        try {
            const roleKey = generateRoleKey();

            // Check for duplicate label
            const existing = db.getFirstSync<{ id: number }>(
                "SELECT id FROM roles WHERE role_label = ? COLLATE NOCASE;",
                [cleanLabel]
            );

            if (existing) {
                Alert.alert("Duplicate", `Role "${cleanLabel}" already exists.`);
                setIsSubmitting(false);
                return;
            }

            const colorIndex = roles.length % DEFAULT_COLORS.length;
            const color = DEFAULT_COLORS[colorIndex];

            db.runSync(
                `INSERT INTO roles (role_key, role_label, color)
                 VALUES (?, ?, ?);`,
                [roleKey, cleanLabel, color]
            );

            if (user) {
                logAudit(user.user_id, "role_created", {
                    role_key: roleKey,
                    role_label: cleanLabel,
                });
            }

            loadRoles();
            closeModal();
            Alert.alert("Success", `Role "${cleanLabel}" created.\nKey: ${roleKey}`);

        } catch (error: any) {
            console.error("Add role error:", error);
            Alert.alert("Error", error.message || "Failed to create role.");
        } finally {
            setIsSubmitting(false);
        }
    }

   function handleDeleteRole(role: Role) {
    Alert.alert(
        "Delete Role",
        `Delete "${role.role_label}" (${role.role_key})?\n\nThis cannot be undone.`,
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    const result = deleteRole(role.id);
                    if (result.success) {
                        if (user) {
                            logAudit(user.user_id, "role_deleted", {
                                role_key: role.role_key,
                                role_label: role.role_label,
                            });
                        }
                        loadRoles();
                    } else {
                        Alert.alert("Cannot Delete", result.message);
                    }
                },
            },
        ]
    );
}

    // ─── Filter ─────────────────────────────────────────────
    const filteredRoles = searchQuery.trim()
        ? roles.filter(
              (r) =>
                  r.role_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  r.role_label.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : roles;

    const renderRoleItem = ({ item }: { item: Role }) => (
        <View style={styles.roleCard}>
            <View style={styles.roleLeft}>
                <View style={styles.roleInfo}>
                    <Text style={styles.roleLabel}>{item.role_label}</Text>
                    <Text style={styles.roleKey}>{item.role_key}</Text>
                </View>
            </View>
            <TouchableOpacity
                onPress={() => handleDeleteRole(item)}
                activeOpacity={0.7}
            >
                <Ionicons name="trash-outline" size={18} color="rgb(255, 253, 253)" />
            </TouchableOpacity>
        </View>
    );

    return (
        <LinearGradient colors={["#456da5", "#073474", "#5C8CE8"]} style={styles.container}>
            <View style={{ flex: 1, paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerTitle}>Roles</Text>
                        <Text style={styles.headerCount}>{roles.length} roles defined</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.addHeaderBtn}
                        onPress={openModal}
                    >
                        <Ionicons name="add-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* SEARCH */}
                <View style={styles.searchWrap}>
                    <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search roles..."
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* ROLES LIST */}
                <FlatList
                    data={filteredRoles}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderRoleItem}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#FFFFFF"
                            colors={["#5C8CE8"]}
                        />
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="layers-outline" size={48} color="rgba(255,255,255,0.2)" />
                            <Text style={styles.emptyText}>No roles yet</Text>
                            <Text style={styles.emptySubtext}>Tap + to add your first role</Text>
                        </View>
                    }
                />
            </View>

            {/* ─── MODAL FORM ─── */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <TouchableOpacity style={styles.modalBackdrop} onPress={closeModal} activeOpacity={1} />

                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New Role</Text>
                            <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
                                <Ionicons name="close" size={22} color="#666666" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>ROLE NAME</Text>
                        <View style={styles.modalInputWrap}>
                            <Ionicons name="pricetag" size={16} color="#999999" style={styles.modalInputIcon} />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="e.g. Cashier, Auditor, Field Officer"
                                placeholderTextColor="#999999"
                                value={roleLabel}
                                onChangeText={setRoleLabel}
                                autoCapitalize="words"
                                autoFocus
                            />
                        </View>

                        <Text style={styles.modalHint}>
                            Role key will be auto-generated (e.g. RL-A7B3-204)
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={closeModal}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.saveBtn,
                                    (!roleLabel.trim() || isSubmitting) && styles.saveBtnDisabled,
                                ]}
                                onPress={handleAddRole}
                                disabled={!roleLabel.trim() || isSubmitting}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.saveText}>
                                    {isSubmitting ? "Adding..." : "Add Role"}
                                </Text>
                                <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    headerLeft: { flex: 1 },
    headerTitle: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "900",
        letterSpacing: 0.5,
    },
    headerCount: {
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: 14,
        fontWeight: "600",
        marginTop: 4,
    },
    addHeaderBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.23)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.23)",
    },
    searchWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.23)",
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "500",
    },
    roleCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(255, 255, 255, 0.23)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
    },
    roleLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        flex: 1,
    },
    roleInfo: {
        flex: 1,
    },
    roleLabel: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },
    roleKey: {
        color: "rgba(255, 255, 255, 0.4)",
        fontSize: 12,
        fontWeight: "600",
        marginTop: 2,
        letterSpacing: 0.3,
    },
    deleteBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    emptyState: {
        alignItems: "center",
        marginTop: 80,
        gap: 12,
    },
    emptyText: {
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: 16,
        fontWeight: "700",
    },
    emptySubtext: {
        color: "rgba(255, 255, 255, 0.3)",
        fontSize: 14,
        fontWeight: "500",
    },
    // ─── MODAL ───
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalCard: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    modalTitle: {
        color: "#073474",
        fontSize: 20,
        fontWeight: "900",
        letterSpacing: 0.3,
    },
    modalClose: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
    },
    modalLabel: {
        color: "#6b7280",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1.2,
        marginBottom: 8,
        marginLeft: 2,
        textTransform: "uppercase",
    },
    modalInputWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        marginBottom: 10,
    },
    modalInputIcon: {
        marginRight: 10,
    },
    modalInput: {
        flex: 1,
        color: "#111827",
        fontSize: 15,
        fontWeight: "600",
    },
    modalHint: {
        color: "#9ca3af",
        fontSize: 12,
        fontWeight: "500",
        marginBottom: 20,
        marginLeft: 2,
    },
    modalActions: {
        flexDirection: "row",
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
    },
    cancelText: {
        color: "#6b7280",
        fontSize: 15,
        fontWeight: "700",
    },
    saveBtn: {
        flex: 1.5,
        height: 52,
        borderRadius: 14,
        backgroundColor: "#073474",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        gap: 8,
    },
    saveBtnDisabled: {
        backgroundColor: "#d1d5db",
    },
    saveText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
    },
});