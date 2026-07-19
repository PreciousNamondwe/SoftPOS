// ============================================================
// app/(adminTabs)/add-user.tsx — Create New User (Auto-Generated User ID)
// Lomis Field Terminal
// ============================================================

import { useAuth } from "@/contexts/AuthContext";
import { hashPassword } from "@/lib/bcrypt";
import {
    createUser,
    deleteUser,
    getAllRoles,
    getAllUsers,
    getRoleByKey,
    logAudit,
    Role,
    searchUsers,
    toggleUserStatus,
    userIdExists,
    UserWithRole,
} from "@/lib/database";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddUserScreen() {
    const insets = useSafeAreaInsets();
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [modalVisible, setModalVisible] = useState(false);
    const [userId, setUserId] = useState("");
    const [fullName, setFullName] = useState("");
    const [pin, setPin] = useState("");
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── Load data ──────────────────────────────────────────
    function loadData() {
        try {
            setUsers(getAllUsers());
            setRoles(getAllRoles());
        } catch (error) {
            console.error("Load data error:", error);
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    function onRefresh() {
        setRefreshing(true);
        loadData();
        setRefreshing(false);
    }

    // ─── Auto-generate User ID when role changes ────────────
    useEffect(() => {
        if (selectedRole && !userId.trim()) {
            // Only auto-generate if user hasn't manually entered an ID
            setUserId(generateUserId());
        }
    }, [selectedRole]);

    // ─── Open/Close Modal ───────────────────────────────────
    function openModal() {
        setUserId("");
        setFullName("");
        setPin("");
        setSelectedRole(null);
        setShowRoleDropdown(false);
        setIsSubmitting(false);
        setModalVisible(true);
    }

    function closeModal() {
        setModalVisible(false);
        setTimeout(() => {
            setUserId("");
            setFullName("");
            setPin("");
            setSelectedRole(null);
            setShowRoleDropdown(false);
            setIsSubmitting(false);
        }, 300);
    }

    // ─── Generate User ID ───────────────────────────────────
    function generateUserId(): string {
        const prefix = selectedRole ? selectedRole.role_key.slice(0, 3).toUpperCase() : "USR";
        const random = Math.floor(100 + Math.random() * 900);
        return `${prefix}${random}`;
    }

    function handleAutoGenerateId() {
        setUserId(generateUserId());
    }

    // ─── Create User ────────────────────────────────────────
    async function handleCreateUser() {
        if (!userId.trim() || !fullName.trim() || !pin.trim() || !selectedRole) {
            Alert.alert("Missing Fields", "Please fill in all fields and select a role.");
            return;
        }

        if (pin.length < 4) {
            Alert.alert("PIN Too Short", "PIN must be at least 4 digits.");
            return;
        }

        const normalizedId = userId.trim().toUpperCase();

        if (userIdExists(normalizedId)) {
            Alert.alert("Duplicate ID", `User ID "${normalizedId}" already exists.`);
            return;
        }

        const roleExists = getRoleByKey(selectedRole.role_key);
        if (!roleExists) {
            Alert.alert("Invalid Role", "Selected role no longer exists. Please refresh and try again.");
            loadData();
            return;
        }

        setIsSubmitting(true);

        try {
            const pinHash = await hashPassword(pin.trim());

            createUser(normalizedId, fullName.trim(), selectedRole.role_key, pinHash);

            if (currentUser) {
                logAudit(currentUser.user_id, "user_created", {
                    created_user_id: normalizedId,
                    role_id: selectedRole.id,
                    role_key: selectedRole.role_key,
                    role_label: selectedRole.role_label,
                });
            }

            loadData();
            closeModal();
            Alert.alert("Success", `User "${normalizedId}" created with role "${selectedRole.role_label}".`);

        } catch (error: any) {
            console.error("Create user error:", error);
            Alert.alert("Error", "Failed to create user.");
        } finally {
            setIsSubmitting(false);
        }
    }

    // ─── Toggle user active status (activate/deactivate) ──────
function handleToggleUserStatus(targetUserId: string) {
    const targetUser = users.find((u) => u.user_id === targetUserId);
    if (!targetUser) return;

    const currentStatus = targetUser.is_active;
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? "activate" : "deactivate";

    Alert.alert(
        `${action === "activate" ? "Activate" : "Deactivate"} User`,
        `Are you sure you want to ${action} user "${targetUserId}"?`,
        [
            { text: "Cancel", style: "cancel" },
            {
                text: action === "activate" ? "Activate" : "Deactivate",
                style: action === "activate" ? "default" : "destructive",
                onPress: () => {
                    try {
                        toggleUserStatus(targetUserId);

                        if (currentUser) {
                            logAudit(currentUser.user_id, `user_${action}d`, {
                                target_user_id: targetUserId,
                                new_status: newStatus,
                            });
                        }

                        loadData();
                    } catch (error) {
                        Alert.alert("Error", "Failed to update user status.");
                    }
                },
            },
        ]
    );
}

// ─── Soft-delete user ─────────────────────────────────────
function handleDeleteUser(targetUser: UserWithRole) {
    Alert.alert(
        "Delete User",
        `Delete "${targetUser.full_name}" (${targetUser.user_id})?\n\nThis will soft-delete the user and their sessions. They can be restored later.`,
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                    const result = deleteUser(targetUser.user_id);
                    if (result.success) {
                        if (currentUser) {
                            logAudit(currentUser.user_id, "user_deleted", {
                                target_user_id: targetUser.user_id,
                                target_user_name: targetUser.full_name,
                            });
                        }
                        loadData();
                    } else {
                        Alert.alert("Error", result.message);
                    }
                },
            },
        ]
    );
}
    // ─── Filter users ───────────────────────────────────────
    const filteredUsers = searchQuery.trim()
        ? searchUsers(searchQuery.trim())
        : users;

    function getRoleColor(roleKey: string): string {
        const role = getRoleByKey(roleKey);
        return role?.color || "#5C8CE8";
    }

    function getRoleLabel(roleKey: string): string {
        const role = getRoleByKey(roleKey);
        return role?.role_label || roleKey;
    }

   const renderUserItem = ({ item }: { item: UserWithRole }) => {
    const roleColor = getRoleColor(item.role);
    const roleLabel = getRoleLabel(item.role);

    return (
        <View style={styles.userCard}>
            <View style={styles.userRow}>
                <View style={[styles.avatar, { backgroundColor: roleColor + "25" }]}>
                    <Ionicons name="person" size={20} color={roleColor} />
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.full_name}</Text>
                    <Text style={styles.userId}>{item.user_id}</Text>
                    <View style={styles.userMeta}>
                        <View style={[styles.roleBadge, { backgroundColor: roleColor + "20" }]}>
                            <Text style={[styles.roleText, { color: roleColor }]}>
                                {roleLabel.toUpperCase()}
                            </Text>
                        </View>
                        {item.is_active === 1 ? (
                            <View style={styles.statusBadgeActive}>
                                <Text style={styles.statusTextActive}>ACTIVE</Text>
                            </View>
                        ) : (
                            <View style={styles.statusBadgeInactive}>
                                <Text style={styles.statusTextInactive}>INACTIVE</Text>
                            </View>
                        )}
                    </View>
                </View>
                
                {/* Action buttons row */}
                <View style={styles.actionButtons}>
                    {/* Toggle active/inactive */}
                    <TouchableOpacity
                        onPress={() => handleToggleUserStatus(item.user_id)}
                        style={styles.actionBtn}
                    >
                        <Ionicons
                            name={item.is_active === 1 ? "close-circle" : "checkmark-circle"}
                            size={22}
                            color={item.is_active === 1 ? "#ebe9e6" : "#10b981"}
                        />
                    </TouchableOpacity>

                    {/* Soft-delete (trash) */}
                    <TouchableOpacity
                        onPress={() => handleDeleteUser(item)}
                        style={styles.actionBtn}
                    >
                        <Ionicons name="trash-outline" size={20} color="#f8f8f8" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
    const isFormValid = userId.trim() && fullName.trim() && pin.trim() && selectedRole && !isSubmitting;

    return (
        <LinearGradient colors={["#456da5", "#073474", "#5C8CE8"]} style={styles.container}>
            <View style={{ flex: 1, paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.headerTitle}>Users</Text>
                        <Text style={styles.headerCount}>{filteredUsers.length} users</Text>
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
                        placeholder="Search by ID or name..."
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

                {/* USER LIST */}
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item.user_id}
                    renderItem={renderUserItem}
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
                            <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.2)" />
                            <Text style={styles.emptyText}>No users found</Text>
                            <Text style={styles.emptySubtext}>Tap + to add your first user</Text>
                        </View>
                    }
                />
            </View>

            {/* ─── ADD USER MODAL ─── */}
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
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add New User</Text>
                            <TouchableOpacity onPress={closeModal} style={styles.modalClose} disabled={isSubmitting}>
                                <Ionicons name="close" size={22} color="#666666" />
                            </TouchableOpacity>
                        </View>

                        {/* Scrollable Form Content */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={styles.modalScrollContent}
                        >
                            {/* ROLE SELECTOR — MOVED TO TOP for auto-ID generation */}
                            <Text style={styles.modalLabel}>ROLE</Text>
                            <TouchableOpacity
                                style={[
                                    styles.roleSelector,
                                    showRoleDropdown && styles.roleSelectorActive,
                                    isSubmitting && styles.roleSelectorDisabled,
                                ]}
                                onPress={() => !isSubmitting && setShowRoleDropdown(!showRoleDropdown)}
                                activeOpacity={0.8}
                                disabled={isSubmitting}
                            >
                                {selectedRole ? (
                                    <View style={styles.selectedRoleDisplay}>
                                        <View style={[styles.selectedRoleDot, { backgroundColor: selectedRole.color }]} />
                                        <Text style={styles.selectedRoleText}>{selectedRole.role_label}</Text>
                                        <Text style={styles.selectedRoleKey}>({selectedRole.role_key})</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.rolePlaceholder}>Select a role first...</Text>
                                )}
                                <Ionicons
                                    name={showRoleDropdown ? "chevron-up" : "chevron-down"}
                                    size={18}
                                    color={isSubmitting ? "#9ca3af" : "#073474"}
                                />
                            </TouchableOpacity>

                            {/* ROLE DROPDOWN */}
                            {showRoleDropdown && (
                                <View style={styles.dropdownContainer}>
                                    <ScrollView
                                        style={styles.dropdownScroll}
                                        showsVerticalScrollIndicator={true}
                                        nestedScrollEnabled={true}
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        {roles.length === 0 ? (
                                            <Text style={styles.dropdownEmpty}>No roles defined. Go to Roles tab first.</Text>
                                        ) : (
                                            roles.map((role) => (
                                                <TouchableOpacity
                                                    key={role.id}
                                                    style={[
                                                        styles.dropdownItem,
                                                        selectedRole?.id === role.id && styles.dropdownItemSelected,
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedRole(role);
                                                        setShowRoleDropdown(false);
                                                    }}
                                                    activeOpacity={0.7}
                                                >
                                                    <View style={[styles.dropdownDot, { backgroundColor: role.color }]} />
                                                    <View style={styles.dropdownItemText}>
                                                        <Text style={styles.dropdownLabel}>{role.role_label}</Text>
                                                        <Text style={styles.dropdownKey}>{role.role_key}</Text>
                                                    </View>
                                                    {selectedRole?.id === role.id && (
                                                        <Ionicons name="checkmark" size={18} color="#073474" />
                                                    )}
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </ScrollView>
                                </View>
                            )}

                            

                            {/* FULL NAME */}
                            <Text style={styles.modalLabel}>FULL NAME</Text>
                            <View style={styles.modalInputWrap}>
                                <Ionicons name="person" size={16} color="#999999" style={styles.modalInputIcon} />
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Enter full name"
                                    placeholderTextColor="#999999"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    autoCapitalize="words"
                                    editable={!isSubmitting}
                                />
                            </View>
                            
                            {/* USER ID — Auto-filled when role is selected */}
                            <Text style={styles.modalLabel}>USER ID</Text>
                            <View style={styles.modalInputRow}>
                                <View style={[styles.modalInputWrap, { flex: 1 }]}>
                                    <Ionicons name="id-card" size={16} color="#999999" style={styles.modalInputIcon} />
                                    <TextInput
                                        style={styles.modalInput}
                                        placeholder={selectedRole ? "Auto-generated or edit..." : "Select a role first"}
                                        placeholderTextColor="#999999"
                                        value={userId}
                                        onChangeText={setUserId}
                                        autoCapitalize="characters"
                                        autoCorrect={false}
                                        editable={!isSubmitting}
                                    />
                                </View>
                                <TouchableOpacity style={styles.autoGenBtn} onPress={handleAutoGenerateId} disabled={isSubmitting || !selectedRole}>
                                    <Ionicons name="shuffle" size={16} color={selectedRole ? "#5C8CE8" : "#d1d5db"} />
                                </TouchableOpacity>
                            </View>

                            {/* PIN */}
                            <Text style={styles.modalLabel}>PIN (min 4 digits)</Text>
                            <View style={styles.modalInputWrap}>
                                <Ionicons name="lock-closed" size={16} color="#999999" style={styles.modalInputIcon} />
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Enter PIN"
                                    placeholderTextColor="#999999"
                                    value={pin}
                                    onChangeText={setPin}
                                    secureTextEntry
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!isSubmitting}
                                />
                            </View>

                            {/* Spacer */}
                            <View style={{ height: 20 }} />
                        </ScrollView>

                        {/* ACTIONS */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.cancelBtn, isSubmitting && styles.cancelBtnDisabled]}
                                onPress={closeModal}
                                activeOpacity={0.7}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.saveBtn,
                                    !isFormValid && styles.saveBtnDisabled,
                                ]}
                                onPress={handleCreateUser}
                                disabled={!isFormValid}
                                activeOpacity={0.8}
                            >
                                {isSubmitting ? (
                                    <>
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                        <Text style={styles.saveText}>Creating...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.saveText}>Create User</Text>
                                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                                    </>
                                )}
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
        backgroundColor: "rgba(255,255,255,0.06)",
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
    userCard: {
        backgroundColor: "rgba(255, 255, 255, 0.23)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
    userId: {
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: 12,
        fontWeight: "600",
        marginTop: 1,
    },
    userMeta: {
        flexDirection: "row",
        gap: 8,
        marginTop: 6,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    roleText: {
        fontSize: 9,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    statusBadgeActive: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: "rgba(16, 185, 129, 0.15)",
    },
    statusTextActive: {
        color: "#10b981",
        fontSize: 9,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    statusBadgeInactive: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: "rgba(239, 68, 68, 0.15)",
    },
    statusTextInactive: {
        color: "#ef4444",
        fontSize: 9,
        fontWeight: "800",
        letterSpacing: 0.5,
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
    actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
},
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    justifyContent: "center",
    alignItems: "center",
},
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFill,
        backgroundColor: "hsla(0, 0%, 0%, 0.00)",
    },
    modalCard: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderBottomLeftRadius: Platform.OS === "ios" ? 0 : 24,
        borderBottomRightRadius: Platform.OS === "ios" ? 0 : 24,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: Platform.OS === "ios" ? 34 : 24,
        maxHeight: "85%",
        marginBottom: Platform.OS === "ios" ? 30: 45,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
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
    modalScrollContent: {
        paddingBottom: 10,
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
    modalInputRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 14,
    },
    modalInputWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
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
    autoGenBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
    },
    roleSelector: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        marginBottom: 14,
    },
    roleSelectorActive: {
        borderColor: "#5C8CE8",
        backgroundColor: "rgba(92, 140, 232, 0.05)",
    },
    roleSelectorDisabled: {
        opacity: 0.5,
    },
    selectedRoleDisplay: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    selectedRoleDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    selectedRoleText: {
        color: "#111827",
        fontSize: 15,
        fontWeight: "700",
    },
    selectedRoleKey: {
        color: "#9ca3af",
        fontSize: 13,
        fontWeight: "500",
    },
    rolePlaceholder: {
        color: "#9ca3af",
        fontSize: 15,
        fontWeight: "500",
    },
    dropdownContainer: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        marginBottom: 14,
        maxHeight: 180,
        overflow: "hidden",
    },
    dropdownScroll: {
        maxHeight: 180,
    },
    dropdownEmpty: {
        color: "#9ca3af",
        fontSize: 14,
        fontWeight: "500",
        textAlign: "center",
        padding: 16,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    dropdownItemSelected: {
        backgroundColor: "rgba(92, 140, 232, 0.1)",
    },
    dropdownDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    dropdownItemText: {
        flex: 1,
    },
    dropdownLabel: {
        color: "#111827",
        fontSize: 14,
        fontWeight: "700",
    },
    dropdownKey: {
        color: "#9ca3af",
        fontSize: 12,
        fontWeight: "500",
        marginTop: 1,
    },
    modalActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
    },
    cancelBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
    },
    cancelBtnDisabled: {
        opacity: 0.5,
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