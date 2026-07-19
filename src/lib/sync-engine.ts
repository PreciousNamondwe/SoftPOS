// ============================================================
// lib/sync-engine.ts — Bidirectional Sync Engine
// Handles ALL tables, soft-delete sync, no rebase on delete
// ============================================================

import { db } from "./database";

// ─── Types ─────────────────────────────────────────────────

export interface SyncConfig {
  apiBaseUrl: string;
  authToken: string;
  batchSize: number;
}

export interface SyncResult {
  table: string;
  pushed: number;
  pulled: number;
  errors: string[];
}

export interface SyncRecord {
  id: number;
  table_name: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  payload: string;
  retry_count: number;
  is_deleted: number;
  is_synced: number;
  created_at: string;
}

// ─── Sync Queue ────────────────────────────────────────────

export function queueSync(
  tableName: string,
  operation: "INSERT" | "UPDATE" | "DELETE",
  payload: object
): number {
  const result = db.runSync(
    "INSERT INTO sync_queue (table_name, operation, payload, is_deleted, is_synced) VALUES (?, ?, ?, 0, 0);",
    [tableName, operation, JSON.stringify(payload)]
  );
  return result.lastInsertRowId;
}

export function getUnsyncedItems(): SyncRecord[] {
  return db.getAllSync<SyncRecord>(`
    SELECT * FROM sync_queue 
    WHERE is_deleted = 0 AND is_synced = 0 AND retry_count < 5
    ORDER BY created_at ASC;
  `) || [];
}

export function markAsSynced(id: number): void {
  db.runSync("UPDATE sync_queue SET is_synced = 1 WHERE id = ?;", [id]);
}

export function incrementRetry(id: number): void {
  db.runSync("UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?;", [id]);
}

export function clearSyncedItems(daysOld: number = 7): void {
  db.runSync(
    "DELETE FROM sync_queue WHERE is_deleted = 0 AND is_synced = 1 AND created_at < datetime('now', ?);",
    [`-${daysOld} days`]
  );
}

// ─── Dirty/Clean ───────────────────────────────────────────

export function markDirty(tableName: string, recordId: number): void {
  db.runSync(`UPDATE ${tableName} SET is_synced = 0 WHERE id = ?;`, [recordId]);
}

export function markClean(tableName: string, recordId: number): void {
  db.runSync(`UPDATE ${tableName} SET is_synced = 1 WHERE id = ?;`, [recordId]);
}

// ─── Get Dirty Records — includes is_deleted so deletions sync ─

export function getDirtyRoles() {
  return db.getAllSync(`SELECT id, role_key, role_label, description, color, is_deleted, created_at FROM roles WHERE is_synced = 0;`) || [];
}

export function getDirtyUsers() {
  return db.getAllSync(`SELECT id, user_id, full_name, role, pin_hash, biometric_key, is_active, is_deleted, last_login, created_at, updated_at FROM user WHERE is_synced = 0;`) || [];
}

export function getDirtySessions() {
  return db.getAllSync(`SELECT id, user_id, jwt_token, refresh_token, expires_at, is_offline, is_deleted, created_at FROM sessions WHERE is_synced = 0;`) || [];
}

export function getDirtyAuditLogs() {
  return db.getAllSync(`SELECT id, user_id, action, details, is_deleted, created_at FROM audit_logs WHERE is_synced = 0;`) || [];
}

export function getDirtyBusinessTypes() {
  return db.getAllSync(`SELECT id, name, description, amount_charge, is_deleted, created_at FROM business_types WHERE is_synced = 0;`) || [];
}

export function getDirtyBusinessOwners() {
  return db.getAllSync(`SELECT id, full_name, national_id, location, date_of_birth, allow_multiple_businesses, max_businesses_count, is_deleted, created_at FROM business_owners WHERE is_synced = 0;`) || [];
}

export function getDirtyBusinesses() {
  return db.getAllSync(`SELECT id, business_name, registration_number, business_type_id, owner_id, address, phone, email, tax_number, is_active, is_deleted, created_at FROM businesses WHERE is_synced = 0;`) || [];
}

// ─── Apply Server Record (PULL) — with is_deleted handling ──
export function applyServerRecord(tableName: string, record: Record<string, any>): void {
  try {
    // 1. camelCase → snake_case
    const mapped: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      mapped[key.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`)] = value;
    }

    // 2. Type conversions
    if (mapped.id != null) mapped.id = Number(mapped.id);
    if (mapped.business_type_id != null) mapped.business_type_id = Number(mapped.business_type_id);
    if (mapped.owner_id != null) mapped.owner_id = Number(mapped.owner_id);
    if (mapped.allow_multiple_businesses != null) mapped.allow_multiple_businesses = Number(mapped.allow_multiple_businesses);
    if (mapped.max_businesses_count != null) mapped.max_businesses_count = Number(mapped.max_businesses_count);
    if (mapped.is_active != null) mapped.is_active = Number(mapped.is_active);
    if (mapped.is_deleted != null) mapped.is_deleted = Number(mapped.is_deleted);
    if (mapped.is_synced != null) mapped.is_synced = Number(mapped.is_synced);
    if (mapped.is_offline != null) mapped.is_offline = Number(mapped.is_offline);
    if (mapped.amount_charge != null) mapped.amount_charge = parseFloat(mapped.amount_charge);

    const columns = Object.keys(mapped);
    const values = Object.values(mapped);
    const placeholders = columns.map(() => "?").join(", ");

    // 3. Try INSERT first
    try {
      db.runSync(`INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`, values);
      return;
    } catch {
      // INSERT failed — row exists with same unique key
    }

    // 4. UPDATE using the table's unique key column
    const uniqueCol = getUniqueColumn(tableName);
    const uniqueVal = mapped[uniqueCol];
    if (uniqueVal == null) return;

    const setCols = columns.filter(c => c !== "id" && c !== uniqueCol);
    if (setCols.length === 0) return;

    const setClause = setCols.map(c => `${c} = ?`).join(", ");
    const updateValues = setCols.map(c => mapped[c]);

    db.runSync(
      `UPDATE ${tableName} SET ${setClause} WHERE ${uniqueCol} = ?`,
      [...updateValues, uniqueVal]
    );

  } catch (error: any) {
    console.error(`❌ applyServerRecord ${tableName}:`, error.message);
  }
}

function getUniqueColumn(tableName: string): string {
  switch (tableName) {
    case "user": return "user_id";
    case "roles": return "role_key";
    case "business_types": return "name";
    default: return "id";
  }
}

// ─── Full Sync — ALL TABLES ────────────────────────────────

export async function performFullSync(config: SyncConfig): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  try {
    console.log("\n📤 === PUSH PHASE ===");
    results.push(await pushToServer(config, "roles", getDirtyRoles()));
    results.push(await pushToServer(config, "user", getDirtyUsers()));
    results.push(await pushToServer(config, "sessions", getDirtySessions()));
    results.push(await pushToServer(config, "audit_logs", getDirtyAuditLogs()));
    results.push(await pushToServer(config, "business_types", getDirtyBusinessTypes()));
    results.push(await pushToServer(config, "business_owners", getDirtyBusinessOwners()));
    results.push(await pushToServer(config, "businesses", getDirtyBusinesses()));

    console.log("\n📥 === PULL PHASE ===");
    results.push(await pullFromServer(config, "roles"));
    results.push(await pullFromServer(config, "business_types"));
    results.push(await pullFromServer(config, "business_owners"));
    results.push(await pullFromServer(config, "user"));
    results.push(await pullFromServer(config, "businesses"));
    results.push(await pullFromServer(config, "sessions"));
    results.push(await pullFromServer(config, "audit_logs"));

    clearSyncedItems();

    const totalPushed = results.reduce((s, r) => s + r.pushed, 0);
    const totalPulled = results.reduce((s, r) => s + r.pulled, 0);
    const errors = results.flatMap(r => r.errors);
    console.log(`\n✅ SYNC COMPLETE ↑${totalPushed} ↓${totalPulled} ⚠️${errors.length}`);
    if (errors.length > 0) console.warn("Errors:", errors.slice(0, 5));

    return results;
  } catch (error: any) {
    console.error("❌ Sync failed:", error.message);
    throw error;
  }
}

// ─── Push ──────────────────────────────────────────────────
async function pushToServer(config: SyncConfig, tableName: string, records: any[]): Promise<SyncResult> {
  const result: SyncResult = { table: tableName, pushed: 0, pulled: 0, errors: [] };
  if (records.length === 0) { console.log(`📤 ${tableName}: nothing to push`); return result; }

  const url = `${config.apiBaseUrl}/api/sync/push`;
  try {
    console.log(`📤 Pushing ${records.length} ${tableName}`);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.authToken}` },
      body: JSON.stringify({ table: tableName, records }),
    });
    const text = await response.text();
    if (!response.ok) { 
      result.errors.push(`HTTP ${response.status}: ${text.slice(0, 200)}`); 
      return result; 
    }

    const data = JSON.parse(text);

    for (const r of records) {
      if (data.syncedIds?.includes(r.id)) { 
        markClean(tableName, r.id); 
        result.pushed++; 
      }
    }

    for (const fd of data.failedDetails || []) {
      result.errors.push(`${tableName} #${fd.id}: ${fd.error}`);
    }

    console.log(`✅ Push ${tableName}: ${result.pushed} synced, ${(data.failedDetails||[]).length} failed`);
  } catch (e: any) { 
    result.errors.push(e.message); 
  }
  return result;
}

// ─── Pull ──────────────────────────────────────────────────

async function pullFromServer(config: SyncConfig, tableName: string): Promise<SyncResult> {
  const result: SyncResult = { table: tableName, pushed: 0, pulled: 0, errors: [] };
  try {
    const lastSync = db.getFirstSync<{ max_created: string }>(`SELECT MAX(created_at) as max_created FROM ${tableName};`);
    const since = lastSync?.max_created || "1970-01-01T00:00:00.000Z";
    const url = `${config.apiBaseUrl}/api/sync/pull?table=${tableName}&since=${encodeURIComponent(since)}`;

    console.log(`📥 Pulling ${tableName}`);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${config.authToken}` } });
    const text = await response.text();
    if (!response.ok) { result.errors.push(`HTTP ${response.status}: ${text.slice(0, 200)}`); return result; }

    const data = JSON.parse(text);
    for (const r of data.records || []) { applyServerRecord(tableName, r); result.pulled++; }
    console.log(`✅ Pull ${tableName}: ${result.pulled} received`);
  } catch (e: any) { result.errors.push(e.message); }
  return result;
}

// ─── Endless Auto Sync ─────────────────────────────────────

let syncInterval: ReturnType<typeof setInterval> | null = null;
let isSyncing = false;

export function startAutoSync(config: SyncConfig, intervalSeconds: number = 5): void {
  if (syncInterval) clearInterval(syncInterval);
  console.log(`🔄 Auto-sync every ${intervalSeconds}s`);
  runSyncLoop(config);
  syncInterval = setInterval(() => runSyncLoop(config), intervalSeconds * 1000);
}

async function runSyncLoop(config: SyncConfig): Promise<void> {
  if (isSyncing) { console.log("⏳ Skip: already syncing"); return; }
  isSyncing = true;
  const start = Date.now();
  try {
    console.log(`\n🔄 LOOP START ${new Date().toISOString()}`);
    await performFullSync(config);
  } catch (e: any) { console.error("❌ Loop error:", e.message); }
  finally {
    console.log(`⏱️ Took ${Date.now() - start}ms\n`);
    isSyncing = false;
  }
}

export function stopAutoSync(): void {
  if (syncInterval) { clearInterval(syncInterval); syncInterval = null; console.log("🛑 Stopped"); }
}

export function isAutoSyncRunning(): boolean { return syncInterval !== null; }

// ─── Sync Status ───────────────────────────────────────────

export function getSyncStatus() {
  const pending = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM sync_queue WHERE is_deleted = 0 AND is_synced = 0;");
  const failed = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM sync_queue WHERE is_deleted = 0 AND is_synced = 0 AND retry_count >= 5;");
  const lastSync = db.getFirstSync<{ created_at: string }>("SELECT created_at FROM sync_queue WHERE is_deleted = 0 AND is_synced = 1 ORDER BY created_at DESC LIMIT 1;");
  return { pending: pending?.count || 0, failed: failed?.count || 0, lastSync: lastSync?.created_at || null, isRunning: isAutoSyncRunning() };
}