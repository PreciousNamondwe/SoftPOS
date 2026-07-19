// ============================================================
// contexts/AuthContext.tsx — Global Auth State & Auto-Init (FIXED)
// Lomis Field Terminal — with is_deleted soft-delete migration
// ============================================================

import { comparePassword } from "@/lib/bcrypt";
import {
  createSession,
  getUserById,
  initializeDatabase,
  logAudit,
  migrateAddIsDeleted,
  updateLastLogin,
} from "@/lib/database";
import { initializeBusinessTables, migrateBusinessTables } from "@/lib/database-business";
import { seedAdminUser } from "@/lib/seed-admin";
import { getSyncStatus, performFullSync, startAutoSync } from "@/lib/sync-engine";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────

interface User {
  id: number;
  user_id: string;
  full_name: string;
  role: string;
  is_active: number;
  last_login: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  isOffline: boolean;
  biometricEnabled: boolean;
  isSyncing: boolean;
  syncStatus: { pending: number; failed: number; lastSync: string | null } | null;
}

interface AuthContextType extends AuthState {
  login: (userId: string, pin: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  biometricLogin: () => Promise<{ success: boolean; message: string }>;
  toggleBiometric: (enabled: boolean) => Promise<void>;
  checkNetwork: () => Promise<boolean>;
  syncNow: () => Promise<{ success: boolean; message: string }>;
  getCurrentSyncStatus: () => { pending: number; failed: number; lastSync: string | null };
}

// ─── Context ───────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    isOffline: true,
    biometricEnabled: false,
    isSyncing: false,
    syncStatus: null,
  });

  // ─── 1. AUTO-INITIALIZE DATABASE ON APP START ───────────
  useEffect(() => {
    async function init() {
      try {
        console.log("🔄 [AuthContext] Initializing database...");
        initializeDatabase();
        initializeBusinessTables();

        // ✅ Migrate is_deleted columns for existing databases
        migrateAddIsDeleted();
        migrateBusinessTables();
        console.log("✅ [AuthContext] is_deleted migration complete.");

        const seedResult = await seedAdminUser();
        if (seedResult.success) {
          console.log("🌱 [AuthContext]", seedResult.message);
        }

        const sessionToken = await AsyncStorage.getItem("@lomis:session_token");
        const savedUserId = await AsyncStorage.getItem("@lomis:last_user_id");
        const biometricFlag = await AsyncStorage.getItem("@lomis:biometric_enabled");

        if (sessionToken && savedUserId) {
          const user = getUserById(savedUserId);
          if (user) {
            setState(prev => ({
              ...prev,
              isAuthenticated: true,
              user: user as User,
              biometricEnabled: biometricFlag === "true",
            }));
            console.log("✅ [AuthContext] Restored session for", savedUserId);
          }
        }

        const networkAvailable = await checkNetworkStatus();
        setState(prev => ({ ...prev, isOffline: !networkAvailable }));

        const syncStatus = getSyncStatus();
        setState(prev => ({ ...prev, syncStatus }));

      } catch (error) {
        console.error("❌ [AuthContext] Init error:", error);
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }

    init();
  }, []);

  // ─── 2. NETWORK LISTENER ────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      const available = await checkNetworkStatus();
      setState(prev => {
        if (prev.isOffline !== !available) {
          console.log(available ? "🌐 Online" : "📴 Offline");
        }
        return { ...prev, isOffline: !available };
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  async function checkNetworkStatus(): Promise<boolean> {
    try {
      const response = await fetch("https://www.google.com/generate_204", {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
      });
      return response.status === 204;
    } catch {
      return false;
    }
  }

  // ─── 3. LOGIN ───────────────────────────────────────────
  const login = useCallback(async (userId: string, pin: string) => {
    if (!userId.trim() || !pin.trim()) {
      return { success: false, message: "Please enter both User ID and PIN." };
    }

    try {
      const normalizedId = userId.trim().toUpperCase();
      const user = getUserById(normalizedId);

      if (!user) {
        logAudit(normalizedId, "login_failed", { reason: "user_not_found" });
        return { success: false, message: "User ID not found." };
      }

      if (user.is_active !== 1) {
        return { success: false, message: "Account deactivated." };
      }

      const isValid = await verifyPin(pin, user.pin_hash);
      if (!isValid) {
        logAudit(user.user_id, "login_failed", { reason: "invalid_pin" });
        return { success: false, message: "Invalid PIN." };
      }

      updateLastLogin(user.user_id);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      createSession(user.user_id, null, expiresAt.toISOString(), true);

      // ✅ FIXED: Use a consistent token format
      const token = `lomis_${user.user_id}_${Date.now()}`;
      await AsyncStorage.setItem("@lomis:last_user_id", user.user_id);
      await AsyncStorage.setItem("@lomis:session_token", token);

      logAudit(user.user_id, "login_success", { method: "pin", offline: true });

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: user as User,
      }));

      // ✅ FIXED: Start auto-sync with correct API URL
      const apiUrl = await AsyncStorage.getItem("@lomis:api_url") || "https://go-revenue-pos.vercel.app";
      console.log("🔄 [AuthContext] Starting auto-sync to:", apiUrl);
      startAutoSync({
        apiBaseUrl: apiUrl,
        authToken: token,
        batchSize: 100,
      }, 5);

      console.log("✅ [AuthContext] Login success:", user.user_id);
      return { success: true, message: "Login successful." };

    } catch (error) {
      console.error("❌ [AuthContext] Login error:", error);
      return { success: false, message: "An error occurred. Please try again." };
    }
  }, []);

  // ─── 4. BIOMETRIC LOGIN ─────────────────────────────────
  const biometricLogin = useCallback(async () => {
    try {
      const savedUserId = await AsyncStorage.getItem("@lomis:last_user_id");
      if (!savedUserId) {
        return { success: false, message: "No saved credentials. Login with PIN first." };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access Lomis Terminal",
        fallbackLabel: "Use PIN",
      });

      if (!result.success) {
        return { success: false, message: "Biometric authentication failed." };
      }

      const user = getUserById(savedUserId);
      if (!user || user.is_active !== 1) {
        return { success: false, message: "Account not found or deactivated." };
      }

      updateLastLogin(user.user_id);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      createSession(user.user_id, null, expiresAt.toISOString(), true);

      const token = `lomis_${user.user_id}_${Date.now()}`;
      await AsyncStorage.setItem("@lomis:session_token", token);
      logAudit(user.user_id, "login_success", { method: "biometric", offline: true });

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: user as User,
      }));

      // ✅ FIXED: Start auto-sync with correct API URL
      const apiUrl = await AsyncStorage.getItem("@lomis:api_url") || "https://go-revenue-pos.vercel.app";
      console.log("🔄 [AuthContext] Starting auto-sync to:", apiUrl);
      startAutoSync({
        apiBaseUrl: apiUrl,
        authToken: token,
        batchSize: 100,
      }, 5);

      return { success: true, message: "Biometric login successful." };

    } catch (error) {
      console.error("❌ [AuthContext] Biometric error:", error);
      return { success: false, message: "Biometric error." };
    }
  }, []);

  // ─── 5. LOGOUT ──────────────────────────────────────────
  const logout = useCallback(async () => {
    if (state.user) {
      logAudit(state.user.user_id, "logout", {});
    }
    await AsyncStorage.multiRemove([
      "@lomis:session_token",
      "@lomis:last_user_id",
      "@lomis:biometric_enabled",
    ]);
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      biometricEnabled: false,
    }));
    console.log("👋 [AuthContext] Logged out");
    router.replace("/");
  }, [state.user, router]);

  // ─── 6. TOGGLE BIOMETRIC ────────────────────────────────
  const toggleBiometric = useCallback(async (enabled: boolean) => {
    await AsyncStorage.setItem("@lomis:biometric_enabled", enabled ? "true" : "false");
    setState(prev => ({ ...prev, biometricEnabled: enabled }));
    console.log("🔐 [AuthContext] Biometric", enabled ? "enabled" : "disabled");
  }, []);

  // ─── 7. CHECK NETWORK ───────────────────────────────────
  const checkNetwork = useCallback(async () => {
    const available = await checkNetworkStatus();
    setState(prev => ({ ...prev, isOffline: !available }));
    return available;
  }, []);

  // ─── 8. MANUAL SYNC ─────────────────────────────────────
  const syncNow = useCallback(async () => {
    if (state.isSyncing) {
      return { success: false, message: "Sync already in progress." };
    }

    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      const token = await AsyncStorage.getItem("@lomis:session_token");
      if (!token) {
        return { success: false, message: "Not authenticated. Please log in." };
      }

      const apiUrl = await AsyncStorage.getItem("@lomis:api_url") || "https://go-revenue-pos.vercel.app";
      console.log("🔄 [AuthContext] Manual sync to:", apiUrl);

      const results = await performFullSync({
        apiBaseUrl: apiUrl,
        authToken: token,
        batchSize: 100,
      });

      const totalPushed = results.reduce((sum, r) => sum + r.pushed, 0);
      const totalPulled = results.reduce((sum, r) => sum + r.pulled, 0);
      const errors = results.flatMap(r => r.errors);

      const syncStatus = getSyncStatus();
      setState(prev => ({ ...prev, syncStatus }));

      if (errors.length > 0) {
        console.warn("⚠️ [AuthContext] Sync completed with errors:", errors);
      }

      console.log(`✅ [AuthContext] Sync done: ↑${totalPushed} ↓${totalPulled}`);

      return {
        success: true,
        message: `Synced: ${totalPushed} pushed, ${totalPulled} pulled${errors.length > 0 ? ` (${errors.length} errors)` : ""}`,
      };
    } catch (error: any) {
      console.error("❌ [AuthContext] Sync failed:", error.message);
      return { success: false, message: `Sync failed: ${error.message}` };
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [state.isSyncing]);

  // ─── 9. GET SYNC STATUS ─────────────────────────────────
  const getCurrentSyncStatus = useCallback(() => {
    return getSyncStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        biometricLogin,
        toggleBiometric,
        checkNetwork,
        syncNow,
        getCurrentSyncStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ─── PIN Verification ──────────────────────────────────────

async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return comparePassword(pin, hash);
}