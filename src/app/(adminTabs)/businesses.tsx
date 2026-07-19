// ============================================================
// app/(adminTabs)/businesses.tsx — Business Management
// Lomis Field Terminal
// ============================================================

import {
  addBusiness,
  addBusinessOwner,
  addBusinessType,
  Business,
  BusinessOwner,
  BusinessType,
  deleteBusiness,
  deleteBusinessOwner,
  deleteBusinessType,
  getAllBusinesses,
  getAllBusinessOwners,
  getAllBusinessTypes,
  getBusinessStats,
  searchBusinessOwners,
  toggleBusinessStatus,
  updateBusiness,
  updateBusinessOwner,
  updateBusinessType,
} from "@/lib/database-business";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Stats {
  total: number;
  active: number;
  owners: number;
  types: number;
}

// Auto-generate registration number
function generateRegNumber(): string {
  const prefix = "BRN";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}-${random}`;
}

export default function BusinessesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"businesses" | "owners" | "types">("businesses");

  // Data states
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [owners, setOwners] = useState<BusinessOwner[]>([]);
  const [types, setTypes] = useState<BusinessType[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, owners: 0, types: 0 });

  // Search states
  const [businessSearchQuery, setBusinessSearchQuery] = useState("");
  const [ownerSearchQueryTab, setOwnerSearchQueryTab] = useState("");
  const [typeSearchQuery, setTypeSearchQuery] = useState("");

  // Expanded card actions
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null);

  // Modal states
  const [businessModalVisible, setBusinessModalVisible] = useState(false);
  const [ownerModalVisible, setOwnerModalVisible] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editingOwner, setEditingOwner] = useState<BusinessOwner | null>(null);
  const [editingType, setEditingType] = useState<BusinessType | null>(null);

  // Form states — Business
  const [businessName, setBusinessName] = useState("");
  const [businessTypeId, setBusinessTypeId] = useState<number | null>(null);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Business type dropdown
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedTypeName, setSelectedTypeName] = useState("");

  // Owner search states (modal)
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("");
  const [ownerSearchResults, setOwnerSearchResults] = useState<BusinessOwner[]>([]);
  const [showOwnerSearch, setShowOwnerSearch] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<BusinessOwner | null>(null);

  // Form states — Owner
  const [ownerName, setOwnerName] = useState("");
  const [ownerNationalId, setOwnerNationalId] = useState("");
  const [ownerLocation, setOwnerLocation] = useState("");
  const [ownerDateOfBirth, setOwnerDateOfBirth] = useState("");
  const [ownerAllowMultiple, setOwnerAllowMultiple] = useState(false);
  const [ownerMaxBusinesses, setOwnerMaxBusinesses] = useState("1");

  // Form states — Type
  const [typeName, setTypeName] = useState("");
  const [typeDescription, setTypeDescription] = useState("");
  const [typeAmountCharge, setTypeAmountCharge] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const onChange = (event, selectedDate) => {
    // Android dismisses the picker immediately on backdrop press/cancel
    if (Platform.OS === 'android') {
      setShowCalendar(false);
    }
    
    if (selectedDate) {
      setDate(selectedDate);
      // keep owner DOB in YYYY-MM-DD format for storage
      try {
        const iso = selectedDate.toISOString().split('T')[0];
        setOwnerDateOfBirth(iso);
      } catch (e) {
        // fallback formatting
        const y = selectedDate.getFullYear();
        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedDate.getDate()).padStart(2, '0');
        setOwnerDateOfBirth(`${y}-${m}-${d}`);
      }
    }
  };

  const showPicker = () => {
    setShowCalendar(true);
  };

  // Helper to format the date display neatly
  const formatDate = (currentDate) => {
    return currentDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  function loadAllData() {
    setBusinesses(getAllBusinesses());
    setOwners(getAllBusinessOwners());
    setTypes(getAllBusinessTypes());
    setStats(getBusinessStats());
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAllData();
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  // ─── Filtered Data ───────────────────────────────────────
  const filteredBusinesses = useMemo(() => {
    if (!businessSearchQuery.trim()) return businesses;
    const q = businessSearchQuery.toLowerCase();
    return businesses.filter(b =>
      b.business_name?.toLowerCase().includes(q) ||
      b.business_type_name?.toLowerCase().includes(q) ||
      b.owner_name?.toLowerCase().includes(q) ||
      b.registration_number?.toLowerCase().includes(q) ||
      b.phone?.toLowerCase().includes(q) ||
      b.address?.toLowerCase().includes(q)
    );
  }, [businesses, businessSearchQuery]);

  const filteredOwners = useMemo(() => {
    if (!ownerSearchQueryTab.trim()) return owners;
    const q = ownerSearchQueryTab.toLowerCase();
    return owners.filter(o =>
      o.full_name?.toLowerCase().includes(q) ||
      o.national_id?.toLowerCase().includes(q) ||
      o.location?.toLowerCase().includes(q)
    );
  }, [owners, ownerSearchQueryTab]);

  const filteredTypes = useMemo(() => {
    if (!typeSearchQuery.trim()) return types;
    const q = typeSearchQuery.toLowerCase();
    return types.filter(t =>
      t.name?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  }, [types, typeSearchQuery]);

  // ─── Owner Search (Modal) ────────────────────────────────
  function handleOwnerSearch(query: string) {
    setOwnerSearchQuery(query);
    if (query.trim().length > 0) {
      const results = searchBusinessOwners(query);
      setOwnerSearchResults(results);
      setShowOwnerSearch(true);
    } else {
      setOwnerSearchResults([]);
      setShowOwnerSearch(false);
    }
  }

  function selectOwnerForBusiness(owner: BusinessOwner) {
    setOwnerId(owner.id);
    setSelectedOwner(owner);
    setOwnerSearchQuery(owner.full_name);
    setShowOwnerSearch(false);
    setOwnerSearchResults([]);
  }

  function clearSelectedOwner() {
    setOwnerId(null);
    setSelectedOwner(null);
    setOwnerSearchQuery("");
    setShowOwnerSearch(false);
  }

  // ─── Business Type Dropdown ─────────────────────────────
  function selectBusinessType(type: BusinessType) {
    setBusinessTypeId(type.id);
    setSelectedTypeName(type.name);
    setShowTypeDropdown(false);
  }

  function clearBusinessType() {
    setBusinessTypeId(null);
    setSelectedTypeName("");
  }

  // ─── Business Modal ─────────────────────────────────────
  function openBusinessModal(business?: Business) {
    if (business) {
      setEditingBusiness(business);
      setBusinessName(business.business_name);
      setBusinessTypeId(business.business_type_id);
      setOwnerId(business.owner_id);
      setAddress(business.address || "");
      setBusinessPhone(business.phone || "");
      setBusinessEmail(business.email || "");
      setIsActive(business.is_active === 1);

      const type = types.find(t => t.id === business.business_type_id);
      if (type) setSelectedTypeName(type.name);

      const owner = owners.find(o => o.id === business.owner_id);
      if (owner) {
        setSelectedOwner(owner);
        setOwnerSearchQuery(owner.full_name);
      }
    } else {
      setEditingBusiness(null);
      resetBusinessForm();
    }
    setBusinessModalVisible(true);
  }

  function resetBusinessForm() {
    setBusinessName("");
    setBusinessTypeId(null);
    setSelectedTypeName("");
    setShowTypeDropdown(false);
    setOwnerId(null);
    setSelectedOwner(null);
    setOwnerSearchQuery("");
    setOwnerSearchResults([]);
    setShowOwnerSearch(false);
    setAddress("");
    setBusinessPhone("");
    setBusinessEmail("");
    setIsActive(true);
  }

  function closeBusinessModal() {
    setBusinessModalVisible(false);
    setTimeout(() => {
      resetBusinessForm();
    }, 300);
  }

  function handleSaveBusiness() {
    if (!businessName.trim()) {
      Alert.alert("Error", "Business name is required.");
      return;
    }
    if (!businessTypeId) {
      Alert.alert("Error", "Please select a business type.");
      return;
    }
    if (!ownerId) {
      Alert.alert("Error", "Please select a business owner.");
      return;
    }

    const regNumber = editingBusiness ? editingBusiness.registration_number : generateRegNumber();

    let result;
    if (editingBusiness) {
      result = updateBusiness(
        editingBusiness.id, businessName, regNumber, businessTypeId,
        ownerId, address || null, businessPhone || null, businessEmail || null,
        null, isActive ? 1 : 0
      );
    } else {
      result = addBusiness(
        businessName, regNumber, businessTypeId, ownerId,
        address || null, businessPhone || null, businessEmail || null, null
      );
    }
    if (result.success) {
      closeBusinessModal();
      loadAllData();
    }
    Alert.alert(result.success ? "Success" : "Error", result.message);
  }

  function handleDeleteBusiness(id: number) {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this business?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => {
          const result = deleteBusiness(id);
          if (result.success) loadAllData();
          Alert.alert(result.success ? "Success" : "Error", result.message);
        },
      },
    ]);
  }

  // ─── Owner Modal ─────────────────────────────────────────
  function openOwnerModal(owner?: BusinessOwner) {
    if (owner) {
      setEditingOwner(owner);
      setOwnerName(owner.full_name);
      setOwnerNationalId(owner.national_id || "");
      setOwnerLocation(owner.location || "");
      setOwnerDateOfBirth(owner.date_of_birth || "");
      setOwnerAllowMultiple(owner.allow_multiple_businesses === 1);
      setOwnerMaxBusinesses(owner.max_businesses_count?.toString() || "1");
    } else {
      setEditingOwner(null);
      setOwnerName("");
      setOwnerNationalId("");
      setOwnerLocation("");
      setOwnerDateOfBirth("");
      setOwnerAllowMultiple(false);
      setOwnerMaxBusinesses("1");
    }
    setOwnerModalVisible(true);
  }

  function closeOwnerModal() {
    setOwnerModalVisible(false);
    setTimeout(() => {
      setOwnerName("");
      setOwnerNationalId("");
      setOwnerLocation("");
      setOwnerDateOfBirth("");
      setOwnerAllowMultiple(false);
      setOwnerMaxBusinesses("1");
    }, 300);
  }

  function handleSaveOwner() {
    if (!ownerName.trim()) {
      Alert.alert("Error", "Full name is required.");
      return;
    }
    const allowMultiple = ownerAllowMultiple ? 1 : 0;
    const maxBusinesses = parseInt(ownerMaxBusinesses) || 1;
    let result;
    if (editingOwner) {
      result = updateBusinessOwner(editingOwner.id, ownerName, ownerNationalId || null, ownerLocation || null, ownerDateOfBirth || null, allowMultiple, maxBusinesses);
    } else {
      result = addBusinessOwner(ownerName, ownerNationalId || null, ownerLocation || null, ownerDateOfBirth || null, allowMultiple, maxBusinesses);
    }
    if (result.success) {
      closeOwnerModal();
      loadAllData();
    }
    Alert.alert(result.success ? "Success" : "Error", result.message);
  }

  function handleDeleteOwner(id: number) {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this owner?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => {
          const result = deleteBusinessOwner(id);
          if (result.success) loadAllData();
          Alert.alert(result.success ? "Success" : "Error", result.message);
        },
      },
    ]);
  }

  // ─── Type Modal ──────────────────────────────────────────
  function openTypeModal(type?: BusinessType) {
    if (type) {
      setEditingType(type);
      setTypeName(type.name);
      setTypeDescription(type.description || "");
      setTypeAmountCharge(type.amount_charge?.toString() || "");
    } else {
      setEditingType(null);
      setTypeName("");
      setTypeDescription("");
      setTypeAmountCharge("");
    }
    setTypeModalVisible(true);
  }

  function closeTypeModal() {
    setTypeModalVisible(false);
    setTimeout(() => {
      setTypeName("");
      setTypeDescription("");
      setTypeAmountCharge("");
    }, 300);
  }

  function handleSaveType() {
    if (!typeName.trim()) {
      Alert.alert("Error", "Type name is required.");
      return;
    }
    const amountCharge = parseFloat(typeAmountCharge) || 0;
    let result;
    if (editingType) {
      result = updateBusinessType(editingType.id, typeName, typeDescription || null, amountCharge);
    } else {
      result = addBusinessType(typeName, typeDescription || null, amountCharge);
    }
    if (result.success) {
      closeTypeModal();
      loadAllData();
    }
    Alert.alert(result.success ? "Success" : "Error", result.message);
  }

  function handleDeleteType(id: number) {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this type?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => {
          const result = deleteBusinessType(id);
          if (result.success) loadAllData();
          Alert.alert(result.success ? "Success" : "Error", result.message);
        },
      },
    ]);
  }

  // ─── Render ────────────────────────────────────────────────
  const statCards = [
    { label: "Businesses", value: stats.total, icon: "business-outline" },
    { label: "Active", value: stats.active, icon: "checkmark-circle-outline" },
    { label: "Owners", value: stats.owners, icon: "people-outline" },
    { label: "Types", value: stats.types, icon: "list-outline" },
  ];

  const isBusinessFormValid = businessName.trim() && businessTypeId && ownerId;
  const isOwnerFormValid = ownerName.trim();
  const isTypeFormValid = typeName.trim();

  return (
    <LinearGradient colors={["#456da5", "#073474", "#5C8CE8"]} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Businesses</Text>
          <Text style={styles.headerSubtitle}>Manage your business registry</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={() => {
              if (activeTab === "businesses") openBusinessModal();
              else if (activeTab === "owners") openOwnerModal();
              else openTypeModal();
            }}
          >
            <Ionicons name="add-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="rgba(255,255,255,0.6)"
            colors={["#5C8CE8"]}
            progressBackgroundColor="rgba(255,255,255,0.1)"
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          {(["businesses", "owners", "types"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Input */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === "businesses"
                ? "Search businesses..."
                : activeTab === "owners"
                ? "Search owners..."
                : "Search types..."
            }
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={
              activeTab === "businesses"
                ? businessSearchQuery
                : activeTab === "owners"
                ? ownerSearchQueryTab
                : typeSearchQuery
            }
            onChangeText={
              activeTab === "businesses"
                ? setBusinessSearchQuery
                : activeTab === "owners"
                ? setOwnerSearchQueryTab
                : setTypeSearchQuery
            }
          />
          {((activeTab === "businesses" && businessSearchQuery) ||
            (activeTab === "owners" && ownerSearchQueryTab) ||
            (activeTab === "types" && typeSearchQuery)) && (
            <TouchableOpacity
              onPress={() => {
                if (activeTab === "businesses") setBusinessSearchQuery("");
                else if (activeTab === "owners") setOwnerSearchQueryTab("");
                else setTypeSearchQuery("");
              }}
            >
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>

        {/* List Content */}
        {activeTab === "businesses" && (
          <View style={styles.listSection}>
            {filteredBusinesses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={48} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyText}>
                  {businessSearchQuery.trim()
                    ? "No businesses match your search"
                    : "No businesses registered yet"}
                </Text>
              </View>
            ) : (
              filteredBusinesses.map((biz) => (
                <View key={biz.id} style={styles.listCard}>
                  <View style={styles.listCardHeader}>
                    <View style={styles.listCardLeft}>
                      <View style={styles.bizIconWrap}>
                        <Ionicons name="business-outline" size={20} color="rgba(255,255,255,0.7)" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listCardTitle}>{biz.business_name}</Text>
                        <Text style={styles.listCardMeta}>{biz.business_type_name} · {biz.owner_name}</Text>
                        {biz.owner_national_id && (
                          <Text style={styles.listCardSubMeta}>ID: {biz.owner_national_id}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.listCardRight}>
                      <TouchableOpacity
                        style={styles.moreBtn}
                        onPress={() => setExpandedCardId(expandedCardId === biz.id ? null : biz.id)}
                      >
                        <Ionicons
                          name={expandedCardId === biz.id ? "ellipsis-horizontal" : "ellipsis-horizontal-outline"}
                          size={20}
                          color="rgba(255,255,255,0.5)"
                        />
                      </TouchableOpacity>
                      <Switch
                        value={biz.is_active === 1}
                        onValueChange={() => {
                          toggleBusinessStatus(biz.id, biz.is_active);
                          loadAllData();
                        }}
                        trackColor={{ false: "rgba(255,255,255,0.15)", true: "rgba(92,140,232,0.5)" }}
                        thumbColor={biz.is_active === 1 ? "#5C8CE8" : "rgba(255,255,255,0.5)"}
                      />
                    </View>
                  </View>
                  <View style={styles.listCardDetails}>
                    {biz.registration_number && (
                      <Text style={styles.detailText}>Reg: {biz.registration_number}</Text>
                    )}
                    {biz.phone && <Text style={styles.detailText}>Phone: {biz.phone}</Text>}
                    {biz.address && <Text style={styles.detailText}>Address: {biz.address}</Text>}
                  </View>
                  {expandedCardId === biz.id && (
                    <View style={styles.listCardActions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => { openBusinessModal(biz); setExpandedCardId(null); }}>
                        <Ionicons name="create-outline" size={16} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.actionBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => { handleDeleteBusiness(biz.id); setExpandedCardId(null); }}>
                        <Ionicons name="trash-outline" size={16} color="rgba(255,100,100,0.8)" />
                        <Text style={[styles.actionBtnText, { color: "rgba(255,100,100,0.8)" }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "owners" && (
          <View style={styles.listSection}>
            {filteredOwners.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyText}>
                  {ownerSearchQueryTab.trim()
                    ? "No owners match your search"
                    : "No business owners registered yet"}
                </Text>
              </View>
            ) : (
              filteredOwners.map((owner) => (
                <View key={owner.id} style={styles.listCard}>
                  <View style={styles.listCardHeader}>
                    <View style={styles.listCardLeft}>
                      <View style={[styles.bizIconWrap, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
                        <Text style={styles.avatarInitial}>
                          {owner.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listCardTitle}>{owner.full_name}</Text>
                        {owner.national_id && (
                          <Text style={styles.listCardMeta}>ID: {owner.national_id}</Text>
                        )}
                        {owner.location && (
                          <Text style={styles.listCardSubMeta}>Location: {owner.location}</Text>
                        )}
                        {owner.date_of_birth && (
                          <Text style={styles.listCardSubMeta}>DOB: {owner.date_of_birth}</Text>
                        )}
                        <Text style={styles.listCardSubMeta}>
                          {owner.allow_multiple_businesses === 1
                            ? `Multi-Business: Yes (Max ${owner.max_businesses_count})`
                            : "Multi-Business: No"}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.moreBtn}
                      onPress={() => setExpandedCardId(expandedCardId === owner.id ? null : owner.id)}
                    >
                      <Ionicons
                        name={expandedCardId === owner.id ? "ellipsis-horizontal" : "ellipsis-horizontal-outline"}
                        size={20}
                        color="rgba(255,255,255,0.5)"
                      />
                    </TouchableOpacity>
                  </View>
                  {expandedCardId === owner.id && (
                    <View style={styles.listCardActions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => { openOwnerModal(owner); setExpandedCardId(null); }}>
                        <Ionicons name="create-outline" size={16} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.actionBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => { handleDeleteOwner(owner.id); setExpandedCardId(null); }}>
                        <Ionicons name="trash-outline" size={16} color="rgba(255,100,100,0.8)" />
                        <Text style={[styles.actionBtnText, { color: "rgba(255,100,100,0.8)" }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "types" && (
          <View style={styles.listSection}>
            {filteredTypes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="list-outline" size={48} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyText}>
                  {typeSearchQuery.trim()
                    ? "No types match your search"
                    : "No business types defined yet"}
                </Text>
              </View>
            ) : (
              filteredTypes.map((type) => (
                <View key={type.id} style={styles.listCard}>
                  <View style={styles.listCardHeader}>
                    <View style={styles.listCardLeft}>
                      <View style={[styles.bizIconWrap, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
                        <Ionicons name="pricetag-outline" size={18} color="rgba(255,255,255,0.6)" />
                      </View>
                      <View>
                        <Text style={styles.listCardTitle}>{type.name}</Text>
                        {type.description && <Text style={styles.listCardMeta}>{type.description}</Text>}
                        <Text style={styles.listCardSubMeta}>Charge: MKW{type.amount_charge?.toFixed(2) || "0.00"}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.moreBtn}
                      onPress={() => setExpandedCardId(expandedCardId === type.id ? null : type.id)}
                    >
                      <Ionicons
                        name={expandedCardId === type.id ? "ellipsis-horizontal" : "ellipsis-horizontal-outline"}
                        size={20}
                        color="rgba(255,255,255,0.5)"
                      />
                    </TouchableOpacity>
                  </View>
                  {expandedCardId === type.id && (
                    <View style={styles.listCardActions}>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => { openTypeModal(type); setExpandedCardId(null); }}>
                        <Ionicons name="create-outline" size={16} color="rgba(255,255,255,0.6)" />
                        <Text style={styles.actionBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => { handleDeleteType(type.id); setExpandedCardId(null); }}>
                        <Ionicons name="trash-outline" size={16} color="rgba(255,100,100,0.8)" />
                        <Text style={[styles.actionBtnText, { color: "rgba(255,100,100,0.8)" }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* WHITE MODAL — Business                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Modal
        visible={businessModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeBusinessModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.whiteModalOverlay}
        >
          <TouchableOpacity style={styles.whiteModalBackdrop} onPress={closeBusinessModal} activeOpacity={1} />

          <View style={styles.whiteModalCard}>
            {/* Header */}
            <View style={styles.whiteModalHeader}>
              <Text style={styles.whiteModalTitle}>
                {editingBusiness ? "Edit Business" : "Add Business"}
              </Text>
              <TouchableOpacity onPress={closeBusinessModal} style={styles.whiteModalClose}>
                <Ionicons name="close" size={22} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.whiteModalScrollContent}
            >
              {/* Business Name */}
              <Text style={styles.whiteModalLabel}>BUSINESS NAME *</Text>
              <View style={styles.whiteInputWrap}>
                <Ionicons name="business" size={16} color="#999999" style={styles.whiteInputIcon} />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="Enter business name"
                  placeholderTextColor="#999999"
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoCapitalize="words"
                />
              </View>

              {/* Business Type Dropdown */}
              <Text style={styles.whiteModalLabel}>BUSINESS TYPE *</Text>
              <TouchableOpacity
                style={[styles.whiteSelector, showTypeDropdown && styles.whiteSelectorActive]}
                onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                activeOpacity={0.8}
              >
                {selectedTypeName ? (
                  <Text style={styles.whiteSelectorText}>{selectedTypeName}</Text>
                ) : (
                  <Text style={styles.whiteSelectorPlaceholder}>Select business type...</Text>
                )}
                <Ionicons name={showTypeDropdown ? "chevron-up" : "chevron-down"} size={18} color="#073474" />
              </TouchableOpacity>

              {/* Type Dropdown */}
              {showTypeDropdown && (
                <View style={styles.whiteDropdownContainer}>
                  <ScrollView style={styles.whiteDropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator>
                    {types.length === 0 ? (
                      <Text style={styles.whiteDropdownEmpty}>No types defined. Go to Types tab first.</Text>
                    ) : (
                      types.map((type) => (
                        <TouchableOpacity
                          key={type.id}
                          style={[styles.whiteDropdownItem, businessTypeId === type.id && styles.whiteDropdownItemSelected]}
                          onPress={() => selectBusinessType(type)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.whiteDropdownItemText}>
                            <Text style={styles.whiteDropdownLabel}>{type.name}</Text>
                            {type.description && <Text style={styles.whiteDropdownDesc}>{type.description}</Text>}
                          </View>
                          {businessTypeId === type.id && (
                            <Ionicons name="checkmark" size={18} color="#073474" />
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Owner Search */}
              <Text style={styles.whiteModalLabel}>BUSINESS OWNER *</Text>
              <View style={styles.whiteInputWrap}>
                <Ionicons name="search" size={16} color="#999999" style={styles.whiteInputIcon} />
                <TextInput
                  style={styles.whiteInput}
                  value={ownerSearchQuery}
                  onChangeText={handleOwnerSearch}
                  placeholder="Search by name, national ID, or location..."
                  placeholderTextColor="#999999"
                  editable={!selectedOwner}
                />
                {selectedOwner && (
                  <TouchableOpacity onPress={clearSelectedOwner}>
                    <Ionicons name="close-circle" size={18} color="#999999" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Search Results */}
              {showOwnerSearch && ownerSearchResults.length > 0 && (
                <View style={styles.whiteDropdownContainer}>
                  {ownerSearchResults.map((owner) => (
                    <TouchableOpacity
                      key={owner.id}
                      style={styles.whiteDropdownItem}
                      onPress={() => selectOwnerForBusiness(owner)}
                    >
                      <Text style={styles.whiteDropdownLabel}>{owner.full_name}</Text>
                      <View style={styles.whiteDropdownMetaRow}>
                        {owner.national_id && <Text style={styles.whiteDropdownMeta}>ID: {owner.national_id}</Text>}
                        {owner.location && <Text style={styles.whiteDropdownMeta}>📍 {owner.location}</Text>}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {showOwnerSearch && ownerSearchQuery.trim().length > 0 && ownerSearchResults.length === 0 && (
                <View style={styles.whiteDropdownContainer}>
                  <Text style={styles.whiteDropdownEmpty}>No owners found. Add one in the Owners tab.</Text>
                </View>
              )}

              {selectedOwner && (
                <View style={styles.whiteSelectedBadge}>
                  <Ionicons name="person" size={14} color="#5C8CE8" />
                  <Text style={styles.whiteSelectedText}>{selectedOwner.full_name}</Text>
                  {selectedOwner.national_id && (
                    <Text style={styles.whiteSelectedSubText}>({selectedOwner.national_id})</Text>
                  )}
                </View>
              )}

              {/* Address */}
              <Text style={styles.whiteModalLabel}>ADDRESS</Text>
              <View style={styles.whiteInputWrap}>
                <Ionicons name="location" size={16} color="#999999" style={styles.whiteInputIcon} />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="Business address"
                  placeholderTextColor="#999999"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              {/* Phone */}
              <Text style={styles.whiteModalLabel}>PHONE</Text>
              <View style={styles.whiteInputWrap}>
                <Ionicons name="call" size={16} color="#999999" style={styles.whiteInputIcon} />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="Contact phone"
                  placeholderTextColor="#999999"
                  value={businessPhone}
                  onChangeText={setBusinessPhone}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email (Optional) */}
              <Text style={styles.whiteModalLabel}>EMAIL (OPTIONAL)</Text>
              <View style={styles.whiteInputWrap}>
                <Ionicons name="mail" size={16} color="#999999" style={styles.whiteInputIcon} />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="business@email.com"
                  placeholderTextColor="#999999"
                  value={businessEmail}
                  onChangeText={setBusinessEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Active Status (Edit only) */}
              {editingBusiness && (
                <View style={styles.whiteSwitchRow}>
                  <Text style={styles.whiteModalLabel}>ACTIVE STATUS</Text>
                  <Switch
                    value={isActive}
                    onValueChange={setIsActive}
                    trackColor={{ false: "#e5e7eb", true: "rgba(92,140,232,0.5)" }}
                    thumbColor={isActive ? "#5C8CE8" : "#9ca3af"}
                  />
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Actions */}
            <View style={styles.whiteModalActions}>
              <TouchableOpacity style={styles.whiteCancelBtn} onPress={closeBusinessModal} activeOpacity={0.7}>
                <Text style={styles.whiteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.whiteSaveBtn, !isBusinessFormValid && styles.whiteSaveBtnDisabled]}
                onPress={handleSaveBusiness}
                disabled={!isBusinessFormValid}
                activeOpacity={0.8}
              >
                <Text style={styles.whiteSaveText}>
                  {editingBusiness ? "Update Business" : "Create Business"}
                </Text>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* WHITE MODAL — Owner                                   */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Modal
        visible={ownerModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeOwnerModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.whiteModalOverlay}
        >
          <TouchableOpacity style={styles.whiteModalBackdrop} onPress={closeOwnerModal} activeOpacity={1} />

          <View style={styles.whiteModalCard}>
            <View style={styles.whiteModalHeader}>
              <Text style={styles.whiteModalTitle}>
                {editingOwner ? "Edit Owner" : "Add Business Owner"}
              </Text>
              <TouchableOpacity onPress={closeOwnerModal} style={styles.whiteModalClose}>
                <Ionicons name="close" size={22} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.whiteModalScrollContent}
            >
              <Text style={styles.whiteModalLabel}>FULL NAME *</Text>
              <View style={styles.whiteInputWrap}>
                <Ionicons name="person" size={16} color="#999999" style={styles.whiteInputIcon} />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="Enter full name"
                  placeholderTextColor="#999999"
                  value={ownerName}
                  onChangeText={setOwnerName}
                  autoCapitalize="words"
                />
              </View>

              <Text style={styles.whiteModalLabel}>NATIONAL ID</Text>
              <View style={styles.whiteInputWrap}>
                <Ionicons name="card" size={16} color="#999999" style={styles.whiteInputIcon} />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="National ID number"
                  placeholderTextColor="#999999"
                  value={ownerNationalId}
                  onChangeText={setOwnerNationalId}
                  autoCapitalize="words"
                />
              </View>

              <Text style={styles.whiteModalLabel}>LOCATION</Text>
              <View style={styles.whiteInputWrap}>
                <Ionicons name="location" size={16} color="#999999" style={styles.whiteInputIcon} />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="City / District / Area"
                  placeholderTextColor="#999999"
                  value={ownerLocation}
                  onChangeText={setOwnerLocation}
                />
              </View>

              <Text style={styles.whiteModalLabel}>DATE OF BIRTH</Text>
              <TouchableOpacity
                style={styles.whiteInputWrap}
                onPress={() => {
                  // if a DOB is already set, sync the picker date to it
                  if (ownerDateOfBirth) {
                    const parsed = new Date(ownerDateOfBirth);
                    if (!isNaN(parsed.getTime())) setDate(parsed);
                  }
                  setShowCalendar(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar" size={16} color="#999999" style={styles.whiteInputIcon} />
                <Text style={[styles.whiteInput, { color: ownerDateOfBirth ? '#111827' : '#999999' }]}> 
                  {ownerDateOfBirth || 'YYYY-MM-DD'}
                </Text>
              </TouchableOpacity>

              <View style={styles.whiteSwitchRow}>
                <Text style={styles.whiteModalLabel}>ALLOW MULTIPLE BUSINESSES</Text>
                <Switch
                  value={ownerAllowMultiple}
                  onValueChange={setOwnerAllowMultiple}
                  trackColor={{ false: "#e5e7eb", true: "rgba(92,140,232,0.5)" }}
                  thumbColor={ownerAllowMultiple ? "#5C8CE8" : "#9ca3af"}
                />
              </View>

              {ownerAllowMultiple && (
                <>
                  <Text style={styles.whiteModalLabel}>MAX BUSINESSES ALLOWED</Text>
                  <View style={styles.whiteInputWrap}>
                    <Ionicons name="business-outline" size={16} color="#999999" style={styles.whiteInputIcon} />
                    <TextInput
                      style={styles.whiteInput}
                      placeholder="Enter max number"
                      placeholderTextColor="#999999"
                      value={ownerMaxBusinesses}
                      onChangeText={setOwnerMaxBusinesses}
                      keyboardType="number-pad"
                    />
                  </View>
                </>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.whiteModalActions}>
              <TouchableOpacity style={styles.whiteCancelBtn} onPress={closeOwnerModal} activeOpacity={0.7}>
                <Text style={styles.whiteCancelText}>Cancel</Text>
              </TouchableOpacity>
              {showCalendar && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  onChange={onChange}
                  maximumDate={new Date()}
                />
              )}
              <TouchableOpacity
                style={[styles.whiteSaveBtn, !isOwnerFormValid && styles.whiteSaveBtnDisabled]}
                onPress={handleSaveOwner}
                disabled={!isOwnerFormValid}
                activeOpacity={0.8}
              >
                <Text style={styles.whiteSaveText}>
                  {editingOwner ? "Update Owner" : "Add Owner"}
                </Text>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* WHITE MODAL — Type                                    */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Modal
        visible={typeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeTypeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.whiteModalOverlay}
        >
          <TouchableOpacity style={styles.whiteModalBackdrop} onPress={closeTypeModal} activeOpacity={1} />

          <View style={styles.whiteModalCard}>
            <View style={styles.whiteModalHeader}>
              <Text style={styles.whiteModalTitle}>
                {editingType ? "Edit Type" : "Add Business Type"}
              </Text>
              <TouchableOpacity onPress={closeTypeModal} style={styles.whiteModalClose}>
                <Ionicons name="close" size={22} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.whiteModalScrollContent}
            >
              <Text style={styles.whiteModalLabel}>TYPE NAME *</Text>
              <View style={styles.whiteInputWrap}>
                <Ionicons name="pricetag" size={16} color="#999999" style={styles.whiteInputIcon} />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="e.g. Retail Shop"
                  placeholderTextColor="#999999"
                  value={typeName}
                  onChangeText={setTypeName}
                />
              </View>

              <Text style={styles.whiteModalLabel}>DESCRIPTION</Text>
              <View style={[styles.whiteInputWrap, { height: 100, alignItems: "flex-start", paddingTop: 12 }]}>
                <Ionicons name="document-text" size={16} color="#999999" style={[styles.whiteInputIcon, { marginTop: 2 }]} />
                <TextInput
                  style={[styles.whiteInput, { height: 80, textAlignVertical: "top" }]}
                  placeholder="Brief description of this business type"
                  placeholderTextColor="#999999"
                  value={typeDescription}
                  onChangeText={setTypeDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <Text style={styles.whiteModalLabel}>AMOUNT CHARGE</Text>
              <View style={styles.whiteInputWrap}>
                <Ionicons name="cash-outline" size={16} color="#999999" style={styles.whiteInputIcon} />
                <TextInput
                  style={styles.whiteInput}
                  placeholder="0.00"
                  placeholderTextColor="#999999"
                  value={typeAmountCharge}
                  onChangeText={setTypeAmountCharge}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.whiteModalActions}>
              <TouchableOpacity style={styles.whiteCancelBtn} onPress={closeTypeModal} activeOpacity={0.7}>
                <Text style={styles.whiteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.whiteSaveBtn, !isTypeFormValid && styles.whiteSaveBtnDisabled]}
                onPress={handleSaveType}
                disabled={!isTypeFormValid}
                activeOpacity={0.8}
              >
                <Text style={styles.whiteSaveText}>
                  {editingType ? "Update Type" : "Add Type"}
                </Text>
                <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
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

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: { flex: 1 },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  addHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(92,140,232,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(92,140,232,0.5)",
  },

  // Tabs
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "rgba(92,140,232,0.25)",
    borderColor: "rgba(92,140,232,0.4)",
  },
  tabText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },

  // Search
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },

  // List
  listSection: {
    paddingHorizontal: 20,
    gap: 10,
  },
  listCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  listCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  listCardLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  listCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  bizIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  listCardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  listCardMeta: {
    color: "hsl(0, 0%, 100%)",
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
  listCardSubMeta: {
    color: "hsla(0, 0%, 100%, 0.99)",
    fontSize: 11,
    fontWeight: "400",
    marginTop: 1,
  },
  listCardDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgb(255, 255, 255)",
    gap: 4,
  },
  detailText: {
    color: "rgb(255, 255, 255)",
    fontSize: 12,
    fontWeight: "400",
  },
  listCardActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "500",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 16,
  },

  // ═══════════════════════════════════════════════════════════
  // WHITE MODAL STYLES (matching add-user.tsx)
  // ═══════════════════════════════════════════════════════════
  whiteModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  whiteModalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  whiteModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: Platform.OS === "ios" ? 0 : 24,
    borderBottomRightRadius: Platform.OS === "ios" ? 0 : 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    maxHeight: "90%",
    marginBottom: Platform.OS === "ios" ? 30 : 45,
  },
  whiteModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  whiteModalTitle: {
    color: "#073474",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  whiteModalClose: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  whiteModalScrollContent: {
    paddingBottom: 10,
  },
  whiteModalLabel: {
    color: "#6b7280",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 2,
    textTransform: "uppercase",
  },
  whiteInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  whiteInputIcon: {
    marginRight: 10,
  },
  whiteInput: {
    flex: 1,
    color: "#111827",
    fontSize: 15,
    fontWeight: "600",
  },
  whiteSelector: {
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
  whiteSelectorActive: {
    borderColor: "#5C8CE8",
    backgroundColor: "rgba(92, 140, 232, 0.05)",
  },
  whiteSelectorText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  whiteSelectorPlaceholder: {
    color: "#9ca3af",
    fontSize: 15,
    fontWeight: "500",
  },
  whiteDropdownContainer: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 14,
    maxHeight: 180,
    overflow: "hidden",
  },
  whiteDropdownScroll: {
    maxHeight: 180,
  },
  whiteDropdownEmpty: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    padding: 16,
  },
  whiteDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  whiteDropdownItemSelected: {
    backgroundColor: "rgba(92, 140, 232, 0.1)",
  },
  whiteDropdownItemText: {
    flex: 1,
  },
  whiteDropdownLabel: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
  whiteDropdownDesc: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  whiteDropdownMetaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  whiteDropdownMeta: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "500",
  },
  whiteSelectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(92,140,232,0.1)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(92,140,232,0.2)",
  },
  whiteSelectedText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  whiteSelectedSubText: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "500",
  },
  whiteSwitchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  whiteModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  whiteCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  whiteCancelText: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "700",
  },
  whiteSaveBtn: {
    flex: 1.5,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#073474",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  whiteSaveBtnDisabled: {
    backgroundColor: "#d1d5db",
  },
  whiteSaveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});