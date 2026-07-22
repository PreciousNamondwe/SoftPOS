// ============================================================
// lib/background-sync.ts — Background Sync Service
// Integrates expo-background-task + expo-background-fetch
// Runs sync even when app is closed / user is logged out
// ============================================================

import * as BackgroundTask from "expo-background-task";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { performFullSync, getSyncStatus } from "./sync-engine";

const BG_SYNC_TASK = "lomis-background-sync";
const BG_FETCH_TASK = "lomis-background-fetch";
const LAST_SYNC_KEY = "@lomis:last_background_sync";
const API_BASE_URL = "https://go-revenue-pos.vercel.app";

// ─── 1. DEFINE BACKGROUND TASK (expo-background-task) ─────
// This runs via WorkManager on Android & BGTaskScheduler on iOS
// It survives app termination and device reboot

TaskManager.defineTask(BG_SYNC_TASK, async () => {
  console.log("🔄 [BackgroundTask] Sync triggered");

  try {
    const token = await AsyncStorage.getItem("@lomis:api_token");

    // Even if user is "logged out" in UI, we may still have a token
    // or pending local data that needs to sync
    if (!token) {
      console.log("⚠️ [BackgroundTask] No API token, skipping server sync");
      const status = getSyncStatus();
      if (status.pending === 0) {
        return BackgroundTask.BackgroundTaskResult.Success;
      }
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    const results = await performFullSync({
      apiBaseUrl: API_BASE_URL,
      authToken: token,
      batchSize: 50, // smaller batch for background
    });

    const totalPushed = results.reduce((s, r) => s + r.pushed, 0);
    const totalPulled = results.reduce((s, r) => s + r.pulled, 0);
    const errors = results.flatMap((r) => r.errors);

    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

    console.log(
      `✅ [BackgroundTask] Sync done ↑${totalPushed} ↓${totalPulled} ⚠️${errors.length}`
    );

    return errors.length > 0 && totalPushed + totalPulled === 0
      ? BackgroundTask.BackgroundTaskResult.Failed
      : BackgroundTask.BackgroundTaskResult.Success;
  } catch (error: any) {
    console.error("❌ [BackgroundTask] Sync error:", error.message);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// ─── 2. DEFINE BACKGROUND FETCH (expo-background-fetch) ───
// Additional periodic fetch for more frequent checks

TaskManager.defineTask(BG_FETCH_TASK, async () => {
  console.log("🔄 [BackgroundFetch] Fetch triggered");

  try {
    const token = await AsyncStorage.getItem("@lomis:api_token");
    if (!token) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const results = await performFullSync({
      apiBaseUrl: API_BASE_URL,
      authToken: token,
      batchSize: 50,
    });

    const totalPushed = results.reduce((s, r) => s + r.pushed, 0);
    const totalPulled = results.reduce((s, r) => s + r.pulled, 0);

    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

    console.log(
      `✅ [BackgroundFetch] Done ↑${totalPushed} ↓${totalPulled}`
    );

    return totalPulled > 0 || totalPushed > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error: any) {
    console.error("❌ [BackgroundFetch] Error:", error.message);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── 3. REGISTER BACKGROUND TASKS ─────────────────────────

export async function registerBackgroundSync(): Promise<boolean> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) {
      console.warn("⚠️ Background tasks restricted on this device");
      return false;
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BG_SYNC_TASK);
    if (!isRegistered) {
      await BackgroundTask.registerTaskAsync(BG_SYNC_TASK, {
        minimumInterval: 15,
      });
      console.log("✅ Background task registered");
    }

    const fetchStatus = await BackgroundFetch.getStatusAsync();
    if (fetchStatus === BackgroundFetch.BackgroundFetchStatus.Available) {
      const isFetchRegistered = await TaskManager.isTaskRegisteredAsync(BG_FETCH_TASK);
      if (!isFetchRegistered) {
        await BackgroundFetch.registerTaskAsync(BG_FETCH_TASK, {
          minimumInterval: 60 * 15,
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log("✅ Background fetch registered");
      }
    }

    return true;
  } catch (error: any) {
    console.error("❌ Failed to register background sync:", error.message);
    return false;
  }
}

// ─── 4. UNREGISTER BACKGROUND TASKS ───────────────────────

export async function unregisterBackgroundSync(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BG_SYNC_TASK);
    if (isRegistered) {
      await BackgroundTask.unregisterTaskAsync(BG_SYNC_TASK);
    }

    const isFetchRegistered = await TaskManager.isTaskRegisteredAsync(BG_FETCH_TASK);
    if (isFetchRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BG_FETCH_TASK);
    }

    console.log("🛑 Background sync unregistered");
  } catch (error: any) {
    console.error("❌ Failed to unregister:", error.message);
  }
}

// ─── 5. GET LAST BACKGROUND SYNC TIME ─────────────────────

export async function getLastBackgroundSync(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
}

// ─── 6. CHECK IF BACKGROUND SYNC IS ACTIVE ────────────────

export async function isBackgroundSyncActive(): Promise<boolean> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BG_SYNC_TASK);
  return isRegistered;
}