// ============================================================
// contexts/AuthContext.tsx — API-First Login + SQLite Seeding
// Lomis Field Terminal — Seeds API user data to local SQLite
// + Background Sync (expo-background-task + expo-background-fetch)
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
// 🔧 BACKGROUND SYNC IMPORTS
import {
  registerBackgroundSync,
  unregisterBackgroundSync
} from "@/lib/background-sync";
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

interface ApiLoginResponse {
  success: boolean;
  user?: {
    id: number;
    user_id: string;
    full_name: string;
    role: string;
    is_active: number;
  };
  token?: string;
  message: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  isOffline: boolean;
  biometricEnabled: boolean;
  isSyncing: boolean;
  syncStatus: { pending: number; failed: number; lastSync: string | null } | null;
  authMode: "api" | "local" | null;
  isBackgroundSyncActive: boolean;
}

interface AuthContextType extends AuthState {
  login: (userId: string, pin: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  biometricLogin: () => Promise<{ success: boolean; message: string }>;
  toggleBiometric: (enabled: boolean) => Promise<void>;
  checkNetwork: () => Promise<boolean>;
  syncNow: () => Promise<{ success: boolean; message: string }>;
  getCurrentSyncStatus: () => { pending: number; failed: number; lastSync: string | null };
  toggleBackgroundSync: (enabled: boolean) => Promise<void>;
}

// ─── Context ───────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── API Config ──────────────────────────────────────────────

const API_BASE_URL = "https://go-revenue-pos.vercel.app";
const API_TIMEOUT = 8000;

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
    authMode: null,
    isBackgroundSyncActive: false,
  });

  // ─── 1. AUTO-INITIALIZE DATABASE + BACKGROUND SYNC ──────
  useEffect(() => {
    async function init() {
      try {
        console.log("🔄 [AuthContext] Initializing database...");
        initializeDatabase();
        initializeBusinessTables();
        migrateAddIsDeleted();
        migrateBusinessTables();
        console.log("✅ [AuthContext] Database ready.");

        const seedResult = await seedAdminUser();
        if (seedResult.success) {
          console.log("🌱 [AuthContext]", seedResult.message);
        }

        const networkAvailable = await checkNetworkStatus();
        setState(prev => ({ ...prev, isOffline: !networkAvailable }));

        // 🔧 REGISTER BACKGROUND SYNC — runs even if user is logged out
        const bgActive = await registerBackgroundSync();
        setState(prev => ({ ...prev, isBackgroundSyncActive: bgActive }));
        if (bgActive) {
          console.log("✅ [AuthContext] Background sync registered");
        }

        // Try API session restoration first
        const apiToken = await AsyncStorage.getItem("@lomis:api_token");
        const savedUserId = await AsyncStorage.getItem("@lomis:last_user_id");
        const biometricFlag = await AsyncStorage.getItem("@lomis:biometric_enabled");

        if (apiToken && networkAvailable) {
          const apiUser = await validateApiToken(apiToken);
          if (apiUser) {
            setState(prev => ({
              ...prev,
              isAuthenticated: true,
              user: apiUser,
              authMode: "api",
              biometricEnabled: biometricFlag === "true",
            }));
            console.log("✅ [AuthContext] API session restored for", apiUser.user_id);
            startAutoSync({
              apiBaseUrl: API_BASE_URL,
              authToken: apiToken,
              batchSize: 100,
            }, 5);
          } else {
            await tryLocalFallback(savedUserId, biometricFlag);
          }
        } else if (savedUserId) {
          await tryLocalFallback(savedUserId, biometricFlag);
        }

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
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  async function checkNetworkStatus(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response.ok;
    } catch {
      return false;
    }
  }

  async function validateApiToken(token: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.success || !data.user) return null;

      return {
        id: data.user.id,
        user_id: data.user.user_id,
        full_name: data.user.full_name,
        role: data.user.role,
        is_active: data.user.is_active,
        last_login: null,
      };
    } catch {
      return null;
    }
  }

  async function tryLocalFallback(savedUserId: string | null, biometricFlag: string | null) {
    if (!savedUserId) return;

    const localToken = await AsyncStorage.getItem("@lomis:session_token");
    if (!localToken) return;

    const user = getUserById(savedUserId);
    if (user && user.is_active === 1) {
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: user as User,
        authMode: "local",
        biometricEnabled: biometricFlag === "true",
      }));
      console.log("✅ [AuthContext] Local session restored for", savedUserId);
    }
  }

  // ─── 3. LOGIN — API FIRST, SEED TO SQLITE, LOCAL FALLBACK ─
  const login = useCallback(async (userId: string, pin: string) => {
    if (!userId.trim() || !pin.trim()) {
      return { success: false, message: "Please enter both User ID and PIN." };
    }

    const normalizedId = userId.trim().toUpperCase();

    try {
      const networkAvailable = await checkNetworkStatus();

      if (networkAvailable) {
        console.log("🌐 [AuthContext] Trying API login...");

        const apiResult = await attemptApiLogin(normalizedId, pin);

        if (apiResult.success && apiResult.token && apiResult.user) {
          console.log("🌐 [AuthContext] API login OK. Seeding to SQLite...");

          const seedResult = await seedApiUserToLocal({
            user_id: apiResult.user.user_id,
            full_name: apiResult.user.full_name,
            role: apiResult.user.role,
            pin: pin.trim(),
            is_active: apiResult.user.is_active,
          });

          if (!seedResult.success) {
            console.warn("⚠️ [AuthContext] Failed to seed user locally:", seedResult.message);
          } else {
            console.log("✅ [AuthContext] User seeded to SQLite:", apiResult.user.user_id);
          }

          // Store tokens
          await AsyncStorage.setItem("@lomis:api_token", apiResult.token);
          await AsyncStorage.setItem("@lomis:last_user_id", apiResult.user.user_id);

          const localToken = `lomis_${apiResult.user.user_id}_${Date.now()}`;
          await AsyncStorage.setItem("@lomis:session_token", localToken);

          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: apiResult.user as User,
            authMode: "api",
            isOffline: false,
          }));

          logAudit(apiResult.user.user_id, "login_success", { method: "api", offline: false });
          console.log("✅ [AuthContext] API login success:", apiResult.user.user_id);

          console.log("🔄 [AuthContext] Starting post-login sync...");
          const syncResult = await runPostLoginSync(apiResult.token);

          if (syncResult.success) {
            console.log("✅ [AuthContext] Post-login sync complete.");
          } else {
            console.warn("⚠️ [AuthContext] Sync issues:", syncResult.message);
          }

          startAutoSync({
            apiBaseUrl: API_BASE_URL,
            authToken: apiResult.token,
            batchSize: 100,
          }, 5);

          return { success: true, message: "Login successful." };
        }

        if (apiResult.message && !apiResult.message.includes("offline")) {
          logAudit(normalizedId, "login_failed", { reason: "api_rejected", message: apiResult.message });
          return { success: false, message: apiResult.message };
        }
      }

      // Offline fallback
      console.log("📴 [AuthContext] Offline. Trying local login...");
      return await attemptLocalLogin(normalizedId, pin);

    } catch (error) {
      console.error("❌ [AuthContext] Login error:", error);
      return await attemptLocalLogin(normalizedId, pin);
    }
  }, []);

  async function attemptApiLogin(userId: string, pin: string): Promise<ApiLoginResponse> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, pin }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || "Invalid credentials." };
      }

      return {
        success: true,
        user: data.user,
        token: data.token || data.user?.user_id,
        message: data.message || "Login successful.",
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        return { success: false, message: "API timeout. Trying offline..." };
      }
      return { success: false, message: "API unreachable. Trying offline..." };
    }
  }

  async function attemptLocalLogin(userId: string, pin: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = getUserById(userId);

      if (!user) {
        logAudit(userId, "login_failed", { reason: "user_not_found", mode: "local" });
        return { success: false, message: "User ID not found." };
      }

      if (user.is_active !== 1) {
        return { success: false, message: "Account deactivated." };
      }

      const isValid = await verifyPin(pin, user.pin_hash);
      if (!isValid) {
        logAudit(user.user_id, "login_failed", { reason: "invalid_pin", mode: "local" });
        return { success: false, message: "Invalid PIN." };
      }

      updateLastLogin(user.user_id);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      createSession(user.user_id, null, expiresAt.toISOString(), true);

      const localToken = `lomis_${user.user_id}_${Date.now()}`;
      await AsyncStorage.setItem("@lomis:last_user_id", user.user_id);
      await AsyncStorage.setItem("@lomis:session_token", localToken);

      logAudit(user.user_id, "login_success", { method: "pin", mode: "local", offline: true });

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: user as User,
        authMode: "local",
        isOffline: true,
      }));

      console.log("✅ [AuthContext] Local login success:", user.user_id);
      return { success: true, message: "Offline login successful." };

    } catch (error) {
      console.error("❌ [AuthContext] Local login error:", error);
      return { success: false, message: "Login failed. Please try again." };
    }
  }

  /**
   * 🔑 Seed API user data into local SQLite for offline login
   */
  async function seedApiUserToLocal(apiUser: {
    user_id: string;
    full_name: string;
    role: string;
    pin: string;
    is_active: number;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const { db } = require("@/lib/database") as typeof import("@/lib/database");
      const { hashPassword } = require("@/lib/bcrypt") as typeof import("@/lib/bcrypt");

      // 1. Ensure the user's role exists in roles table
      const roleExists = db.getFirstSync<{ count: number }>(
        "SELECT COUNT(*) as count FROM roles WHERE role_key = ?;",
        [apiUser.role]
      );

      if (!roleExists || roleExists.count === 0) {
        db.runSync(
          `INSERT INTO roles (role_key, role_label, color, is_synced)
           VALUES (?, ?, ?, 1)
           ON CONFLICT(role_key) DO NOTHING;`,
          [apiUser.role, apiUser.role.charAt(0).toUpperCase() + apiUser.role.slice(1), "#5C8CE8"]
        );
        console.log("🌱 [AuthContext] Seeded role:", apiUser.role);
      }

      // 2. Hash the PIN for local storage
      const pinHash = await hashPassword(apiUser.pin);

      // 3. Upsert user into local SQLite
      const existingUser = db.getFirstSync<{ id: number }>(
        "SELECT id FROM user WHERE user_id = ?;",
        [apiUser.user_id.toUpperCase()]
      );

      if (existingUser) {
        db.runSync(
          `UPDATE user 
           SET full_name = ?, role = ?, pin_hash = ?, is_active = ?, 
               is_synced = 1, updated_at = datetime('now')
           WHERE user_id = ?;`,
          [
            apiUser.full_name,
            apiUser.role,
            pinHash,
            apiUser.is_active,
            apiUser.user_id.toUpperCase(),
          ]
        );
        console.log("🔄 [AuthContext] Updated local user:", apiUser.user_id);
      } else {
        db.runSync(
          `INSERT INTO user (user_id, full_name, role, pin_hash, is_active, is_synced, created_at)
           VALUES (?, ?, ?, ?, ?, 1, datetime('now'));`,
          [
            apiUser.user_id.toUpperCase(),
            apiUser.full_name,
            apiUser.role,
            pinHash,
            apiUser.is_active,
          ]
        );
        console.log("✅ [AuthContext] Inserted local user:", apiUser.user_id);
      }

      return { success: true, message: `User "${apiUser.user_id}" seeded to local DB.` };
    } catch (error: any) {
      console.error("❌ [AuthContext] Seed user error:", error.message);
      return { success: false, message: `Seed failed: ${error.message}` };
    }
  }

  async function runPostLoginSync(token: string): Promise<{ success: boolean; message: string }> {
    try {
      setState(prev => ({ ...prev, isSyncing: true }));

      const results = await performFullSync({
        apiBaseUrl: API_BASE_URL,
        authToken: token,
        batchSize: 100,
      });

      const totalPushed = results.reduce((sum, r) => sum + r.pushed, 0);
      const totalPulled = results.reduce((sum, r) => sum + r.pulled, 0);
      const errors = results.flatMap(r => r.errors);

      const syncStatus = getSyncStatus();
      setState(prev => ({ ...prev, syncStatus, isSyncing: false }));

      if (errors.length > 0) {
        console.warn("⚠️ [AuthContext] Sync completed with errors:", errors);
      }

      console.log(`✅ [AuthContext] Post-login sync: ↑${totalPushed} ↓${totalPulled}`);

      return {
        success: true,
        message: `Synced: ${totalPushed} pushed, ${totalPulled} pulled`,
      };
    } catch (error: any) {
      setState(prev => ({ ...prev, isSyncing: false }));
      console.error("❌ [AuthContext] Post-login sync failed:", error.message);
      return { success: false, message: `Sync failed: ${error.message}` };
    }
  }

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

      const apiToken = await AsyncStorage.getItem("@lomis:api_token");
      const networkAvailable = await checkNetworkStatus();

      if (apiToken && networkAvailable) {
        const apiUser = await validateApiToken(apiToken);
        if (apiUser) {
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: apiUser,
            authMode: "api",
            isOffline: false,
          }));
          logAudit(apiUser.user_id, "login_success", { method: "biometric", mode: "api" });
          return { success: true, message: "Biometric login successful." };
        }
      }

      const user = getUserById(savedUserId);
      if (!user || user.is_active !== 1) {
        return { success: false, message: "Account not found or deactivated." };
      }

      updateLastLogin(user.user_id);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      createSession(user.user_id, null, expiresAt.toISOString(), true);

      const localToken = `lomis_${user.user_id}_${Date.now()}`;
      await AsyncStorage.setItem("@lomis:session_token", localToken);
      logAudit(user.user_id, "login_success", { method: "biometric", mode: "local", offline: true });

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: user as User,
        authMode: "local",
      }));

      return { success: true, message: "Biometric login successful (offline)." };

    } catch (error) {
      console.error("❌ [AuthContext] Biometric error:", error);
      return { success: false, message: "Biometric error." };
    }
  }, []);

  // ─── 5. LOGOUT — PRESERVES API TOKEN FOR BACKGROUND SYNC ─
  const logout = useCallback(async () => {
    if (state.user) {
      logAudit(state.user.user_id, "logout", { mode: state.authMode });
    }

    if (state.authMode === "api") {
      try {
        const apiToken = await AsyncStorage.getItem("@lomis:api_token");
        if (apiToken) {
          await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiToken}` },
          });
        }
      } catch (e) {
        console.warn("⚠️ [AuthContext] API logout failed:", e);
      }
    }

    // 🔧 PRESERVE api_token so background sync can still run after logout
    await AsyncStorage.multiRemove([
      "@lomis:session_token",
      "@lomis:last_user_id",
      "@lomis:biometric_enabled",
    ]);

    // NOTE: @lomis:api_token is NOT removed — background sync needs it

    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      authMode: null,
      biometricEnabled: false,
    }));

    console.log("👋 [AuthContext] Logged out (API token preserved for background sync)");
    router.replace("/");
  }, [state.user, state.authMode, router]);

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

      const token = await AsyncStorage.getItem("@lomis:api_token");
      if (!token) {
        setState(prev => ({ ...prev, isSyncing: false }));
        return { success: false, message: "Not authenticated with API. Login online first." };
      }

      console.log("🔄 [AuthContext] Manual sync to:", API_BASE_URL);

      const results = await performFullSync({
        apiBaseUrl: API_BASE_URL,
        authToken: token,
        batchSize: 100,
      });

      const totalPushed = results.reduce((sum, r) => sum + r.pushed, 0);
      const totalPulled = results.reduce((sum, r) => sum + r.pulled, 0);
      const errors = results.flatMap(r => r.errors);

      const syncStatus = getSyncStatus();
      setState(prev => ({ ...prev, syncStatus, isSyncing: false }));

      if (errors.length > 0) {
        console.warn("⚠️ [AuthContext] Sync completed with errors:", errors);
      }

      console.log(`✅ [AuthContext] Sync done: ↑${totalPushed} ↓${totalPulled}`);

      return {
        success: true,
        message: `Synced: ${totalPushed} pushed, ${totalPulled} pulled${errors.length > 0 ? ` (${errors.length} errors)` : ""}`,
      };
    } catch (error: any) {
      setState(prev => ({ ...prev, isSyncing: false }));
      console.error("❌ [AuthContext] Sync failed:", error.message);
      return { success: false, message: `Sync failed: ${error.message}` };
    }
  }, [state.isSyncing]);

  // ─── 9. GET SYNC STATUS ─────────────────────────────────
  const getCurrentSyncStatus = useCallback(() => {
    return getSyncStatus();
  }, []);

  // ─── 10. TOGGLE BACKGROUND SYNC ─────────────────────────
  const toggleBackgroundSync = useCallback(async (enabled: boolean) => {
    try {
      if (enabled) {
        const registered = await registerBackgroundSync();
        setState(prev => ({ ...prev, isBackgroundSyncActive: registered }));
        console.log("✅ [AuthContext] Background sync enabled");
      } else {
        await unregisterBackgroundSync();
        setState(prev => ({ ...prev, isBackgroundSyncActive: false }));
        console.log("🛑 [AuthContext] Background sync disabled");
      }
    } catch (error: any) {
      console.error("❌ [AuthContext] Toggle background sync failed:", error.message);
    }
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
        toggleBackgroundSync,
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