import * as SQLite from "expo-sqlite";

const DB_NAME = "lormis.db";

// Open or create the database
export const db = SQLite.openDatabaseSync(DB_NAME);

// ============================================================
// SCHEMA DEFINITIONS — with is_deleted soft-delete on ALL tables
// ============================================================

const CREATE_ROLES_TABLE = `
CREATE TABLE IF NOT EXISTS roles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    role_key    TEXT NOT NULL UNIQUE,
    role_label  TEXT NOT NULL,
    description TEXT,
    color       TEXT DEFAULT '#5C8CE8',
    is_deleted  INTEGER NOT NULL DEFAULT 0,
    is_synced   INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

const CREATE_USER_TABLE = `
CREATE TABLE IF NOT EXISTS user (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL UNIQUE,
    full_name       TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'agent',
    pin_hash        TEXT NOT NULL,
    biometric_key   TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    is_deleted      INTEGER NOT NULL DEFAULT 0,
    is_synced       INTEGER NOT NULL DEFAULT 0,
    last_login      TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (role) REFERENCES roles(role_key) ON DELETE RESTRICT
);
`;

const CREATE_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL,
    jwt_token       TEXT,
    refresh_token   TEXT,
    expires_at      TEXT NOT NULL,
    is_offline      INTEGER NOT NULL DEFAULT 0,
    is_deleted      INTEGER NOT NULL DEFAULT 0,
    is_synced       INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);
`;

const CREATE_AUDIT_LOGS_TABLE = `
CREATE TABLE IF NOT EXISTS audit_logs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         TEXT NOT NULL,
    action          TEXT NOT NULL,
    details         TEXT,
    is_deleted      INTEGER NOT NULL DEFAULT 0,
    is_synced       INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

const CREATE_SYNC_QUEUE_TABLE = `
CREATE TABLE IF NOT EXISTS sync_queue (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name      TEXT NOT NULL,
    operation       TEXT NOT NULL,
    payload         TEXT NOT NULL,
    retry_count     INTEGER NOT NULL DEFAULT 0,
    is_deleted      INTEGER NOT NULL DEFAULT 0,
    is_synced       INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

// ============================================================
// DEFAULT DATA
// ============================================================

const DEFAULT_ROLES = [
    { role_key: "admin", role_label: "Administrator", description: "Full system access", color: "#ffffff" },
    { role_key: "manager", role_label: "Manager", description: "Team and operations management", color: "#ffffff" },
    { role_key: "agent", role_label: "Field Agent", description: "Field data collection", color: "#ffffff" },
    { role_key: "viewer", role_label: "Viewer", description: "Read-only access", color: "#ffffff" },
];

// ============================================================
// INDEXES
// ============================================================

const CREATE_INDEXES = [
    `CREATE INDEX IF NOT EXISTS idx_user_user_id ON user(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_user_role ON user(role);`,
    `CREATE INDEX IF NOT EXISTS idx_roles_role_key ON roles(role_key);`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);`,
];

// ============================================================
// INITIALIZATION
// ============================================================

export function initializeDatabase(): void {
    const allSchema = `
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        ${CREATE_ROLES_TABLE}
        ${CREATE_USER_TABLE}
        ${CREATE_SESSIONS_TABLE}
        ${CREATE_AUDIT_LOGS_TABLE}
        ${CREATE_SYNC_QUEUE_TABLE}

        ${CREATE_INDEXES.join('\n')}
    `;

    db.execSync(allSchema);

    // Seed default roles (IGNORE if already exist)
    for (const role of DEFAULT_ROLES) {
        db.runSync(
            `INSERT OR IGNORE INTO roles (role_key, role_label, description, color) VALUES (?, ?, ?, ?);`,
            [role.role_key, role.role_label, role.description, role.color]
        );
    }

    console.log("✅ Database initialized with roles (is_deleted soft-delete enabled).");
}

// ============================================================
// MIGRATION: Add is_deleted if upgrading from old schema
// ============================================================

export function migrateAddIsDeleted(): void {
    const tables = ["roles", "user", "sessions", "audit_logs", "sync_queue"];
    for (const table of tables) {
        try {
            db.runSync(`ALTER TABLE ${table} ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0;`);
            console.log(`✅ Added is_deleted to ${table}`);
        } catch (e: any) {
            if (!e.message?.includes("duplicate column")) {
                console.warn(`⚠️ Migration ${table}:`, e.message);
            }
        }
    }
}

// ============================================================
// ROLES CRUD — with soft-delete
// ============================================================

export interface Role {
    id: number;
    role_key: string;
    role_label: string;
    description: string | null;
    color: string;
    is_deleted: number;
    is_synced: number;
    created_at: string;
}

/** Get all roles (excluding soft-deleted) ordered by label */
export function getAllRoles(): Role[] {
    return db.getAllSync<Role>("SELECT * FROM roles WHERE is_deleted = 0 ORDER BY role_label ASC;");
}

/** Get all roles including soft-deleted (for sync) */
export function getAllRolesIncludingDeleted(): Role[] {
    return db.getAllSync<Role>("SELECT * FROM roles ORDER BY role_label ASC;");
}

/** Get a single role by its primary key (id) */
export function getRoleById(id: number): Role | null {
    return db.getFirstSync<Role>("SELECT * FROM roles WHERE id = ? AND is_deleted = 0;", [id]);
}

/** Get a single role by its natural key (role_key) */
export function getRoleByKey(roleKey: string): Role | null {
    return db.getFirstSync<Role>("SELECT * FROM roles WHERE role_key = ? AND is_deleted = 0;", [roleKey]);
}

/** Create a new role */
export function createRole(roleKey: string, roleLabel: string, description?: string, color?: string): number {
    const result = db.runSync(
        `INSERT INTO roles (role_key, role_label, description, color, is_deleted, is_synced) VALUES (?, ?, ?, ?, 0, 0);`,
        [roleKey.trim().toLowerCase(), roleLabel.trim(), description || null, color || "#5C8CE8"]
    );
    return result.lastInsertRowId;
}

/** Update an existing role */
export function updateRole(id: number, updates: Partial<Pick<Role, "role_label" | "description" | "color">>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.role_label !== undefined) { fields.push("role_label = ?"); values.push(updates.role_label); }
    if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
    if (updates.color !== undefined) { fields.push("color = ?"); values.push(updates.color); }

    if (fields.length === 0) return;

    fields.push("is_synced = 0");
    values.push(id);
    db.runSync(`UPDATE roles SET ${fields.join(", ")} WHERE id = ?;`, values);
}

/** Soft-delete a role (sets is_deleted = 1, does NOT remove row) */
export function deleteRole(id: number): { success: boolean; message: string } {
    try {
        const inUse = db.getFirstSync<{ count: number }>(
            "SELECT COUNT(*) as count FROM user WHERE role = (SELECT role_key FROM roles WHERE id = ?) AND is_deleted = 0;",
            [id]
        );
        if (inUse && inUse.count > 0) {
            return { success: false, message: "Cannot delete: role is assigned to active users." };
        }
        db.runSync("UPDATE roles SET is_deleted = 1, is_synced = 0 WHERE id = ?;", [id]);
        return { success: true, message: "Role deleted successfully." };
    } catch (e: any) {
        return { success: false, message: "Failed to delete role." };
    }
}

/** Hard-delete a role (use with caution — for admin/reset only) */
export function hardDeleteRole(id: number): void {
    db.runSync("DELETE FROM roles WHERE id = ?;", [id]);
}

/** Restore a soft-deleted role */
export function restoreRole(id: number): void {
    db.runSync("UPDATE roles SET is_deleted = 0, is_synced = 0 WHERE id = ?;", [id]);
}

/** Check if a role key exists (among non-deleted) */
export function roleExists(roleKey: string): boolean {
    const result = db.getFirstSync<{ count: number }>(
        "SELECT COUNT(*) as count FROM roles WHERE role_key = ? AND is_deleted = 0;",
        [roleKey]
    );
    return (result?.count ?? 0) > 0;
}

// ============================================================
// USER CRUD — with soft-delete
// ============================================================

export interface UserRecord {
    id: number;
    user_id: string;
    full_name: string;
    role: string;
    pin_hash: string;
    biometric_key: string | null;
    is_active: number;
    is_deleted: number;
    is_synced: number;
    last_login: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserWithRole extends UserRecord {
    role_label: string;
    role_color: string;
    role_description: string | null;
}

/** Get all active users with their role details */
export function getAllUsers(): UserWithRole[] {
    return db.getAllSync<UserWithRole>(`
        SELECT u.*, r.role_label, r.color as role_color, r.description as role_description
        FROM user u
        LEFT JOIN roles r ON u.role = r.role_key
        WHERE u.is_deleted = 0
        ORDER BY u.created_at DESC;
    `);
}

/** Get all users including soft-deleted (for sync) */
export function getAllUsersIncludingDeleted(): UserWithRole[] {
    return db.getAllSync<UserWithRole>(`
        SELECT u.*, r.role_label, r.color as role_color, r.description as role_description
        FROM user u
        LEFT JOIN roles r ON u.role = r.role_key
        ORDER BY u.created_at DESC;
    `);
}

/** Get user by user_id with role details */
export function getUserById(userId: string): UserWithRole | null {
    return db.getFirstSync<UserWithRole>(`
        SELECT u.*, r.role_label, r.color as role_color, r.description as role_description
        FROM user u
        LEFT JOIN roles r ON u.role = r.role_key
        WHERE u.user_id = ? AND u.is_active = 1 AND u.is_deleted = 0;
    `, [userId]);
}

/** Get user by user_id (including inactive, excluding deleted) */
export function getUserByIdIncludingInactive(userId: string): UserWithRole | null {
    return db.getFirstSync<UserWithRole>(`
        SELECT u.*, r.role_label, r.color as role_color, r.description as role_description
        FROM user u
        LEFT JOIN roles r ON u.role = r.role_key
        WHERE u.user_id = ? AND u.is_deleted = 0;
    `, [userId]);
}

/** Check if user_id already exists (among non-deleted) */
export function userIdExists(userId: string): boolean {
    const result = db.getFirstSync<{ count: number }>(
        "SELECT COUNT(*) as count FROM user WHERE user_id = ? AND is_deleted = 0;",
        [userId.toUpperCase()]
    );
    return (result?.count ?? 0) > 0;
}

/** Create a new user */
export function createUser(userId: string, fullName: string, roleKey: string, pinHash: string): number {
    const result = db.runSync(
        `INSERT INTO user (user_id, full_name, role, pin_hash, is_active, is_deleted, is_synced)
         VALUES (?, ?, ?, ?, 1, 0, 0);`,
        [userId.trim().toUpperCase(), fullName.trim(), roleKey, pinHash]
    );
    return result.lastInsertRowId;
}

/** Update user fields */
export function updateUser(userId: string, updates: Partial<Pick<UserRecord, "full_name" | "role" | "is_active">>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.full_name !== undefined) { fields.push("full_name = ?"); values.push(updates.full_name); }
    if (updates.role !== undefined) { fields.push("role = ?"); values.push(updates.role); }
    if (updates.is_active !== undefined) { fields.push("is_active = ?"); values.push(updates.is_active); }

    if (fields.length === 0) return;

    fields.push("is_synced = 0");
    fields.push("updated_at = datetime('now')");
    values.push(userId);
    db.runSync(`UPDATE user SET ${fields.join(", ")} WHERE user_id = ? AND is_deleted = 0;`, values);
}

/** Update user's PIN hash */
export function updateUserPin(userId: string, newPinHash: string): void {
    db.runSync(
        "UPDATE user SET pin_hash = ?, is_synced = 0, updated_at = datetime('now') WHERE user_id = ? AND is_deleted = 0;",
        [newPinHash, userId]
    );
}

/** Toggle user active status */
export function toggleUserStatus(userId: string): number {
    db.runSync(
        "UPDATE user SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, is_synced = 0, updated_at = datetime('now') WHERE user_id = ? AND is_deleted = 0;",
        [userId]
    );
    const result = db.getFirstSync<{ is_active: number }>(
        "SELECT is_active FROM user WHERE user_id = ?;",
        [userId]
    );
    return result?.is_active ?? -1;
}

/** Soft-delete a user */
export function deleteUser(userId: string): { success: boolean; message: string } {
    try {
        db.runSync(
            "UPDATE user SET is_deleted = 1, is_active = 0, is_synced = 0, updated_at = datetime('now') WHERE user_id = ?;",
            [userId]
        );
        // Also soft-delete their sessions
        db.runSync("UPDATE sessions SET is_deleted = 1, is_synced = 0 WHERE user_id = ?;", [userId]);
        return { success: true, message: "User deleted successfully." };
    } catch (e: any) {
        return { success: false, message: "Failed to delete user." };
    }
}

/** Hard-delete a user (admin/reset only) */
export function hardDeleteUser(userId: string): void {
    db.runSync("DELETE FROM sessions WHERE user_id = ?;", [userId]);
    db.runSync("DELETE FROM user WHERE user_id = ?;", [userId]);
}

/** Restore a soft-deleted user */
export function restoreUser(userId: string): void {
    db.runSync(
        "UPDATE user SET is_deleted = 0, is_synced = 0, updated_at = datetime('now') WHERE user_id = ?;",
        [userId]
    );
}

/** Search users by ID or name (excluding deleted) */
export function searchUsers(query: string): UserWithRole[] {
    const likeQuery = `%${query.toLowerCase()}%`;
    return db.getAllSync<UserWithRole>(`
        SELECT u.*, r.role_label, r.color as role_color, r.description as role_description
        FROM user u
        LEFT JOIN roles r ON u.role = r.role_key
        WHERE u.is_deleted = 0 AND (LOWER(u.user_id) LIKE ? OR LOWER(u.full_name) LIKE ?)
        ORDER BY u.created_at DESC;
    `, [likeQuery, likeQuery]);
}

/** Get users by role (excluding deleted) */
export function getUsersByRole(roleKey: string): UserWithRole[] {
    return db.getAllSync<UserWithRole>(`
        SELECT u.*, r.role_label, r.color as role_color, r.description as role_description
        FROM user u
        LEFT JOIN roles r ON u.role = r.role_key
        WHERE u.role = ? AND u.is_deleted = 0
        ORDER BY u.created_at DESC;
    `, [roleKey]);
}

/** Count total non-deleted users */
export function countUsers(): number {
    const result = db.getFirstSync<{ count: number }>("SELECT COUNT(*) as count FROM user WHERE is_deleted = 0;");
    return result?.count ?? 0;
}

/** Count users by role (excluding deleted) */
export function countUsersByRole(roleKey: string): number {
    const result = db.getFirstSync<{ count: number }>(
        "SELECT COUNT(*) as count FROM user WHERE role = ? AND is_deleted = 0;",
        [roleKey]
    );
    return result?.count ?? 0;
}

// ============================================================
// AUTH & SESSIONS — with soft-delete
// ============================================================

export function updateLastLogin(userId: string): void {
    db.runSync(
        "UPDATE user SET last_login = datetime('now'), is_synced = 0, updated_at = datetime('now') WHERE user_id = ? AND is_deleted = 0;",
        [userId]
    );
}

export function createSession(userId: string, jwtToken: string | null, expiresAt: string, isOffline: boolean = false): number {
    const result = db.runSync(
        "INSERT INTO sessions (user_id, jwt_token, expires_at, is_offline, is_deleted, is_synced) VALUES (?, ?, ?, ?, 0, 0);",
        [userId, jwtToken, expiresAt, isOffline ? 1 : 0]
    );
    return result.lastInsertRowId;
}

export function getActiveSession(userId: string): any {
    return db.getFirstSync(
        "SELECT * FROM sessions WHERE user_id = ? AND is_deleted = 0 ORDER BY created_at DESC LIMIT 1;",
        [userId]
    );
}

export function getAllSessions(): any[] {
    return db.getAllSync("SELECT * FROM sessions WHERE is_deleted = 0 ORDER BY created_at DESC;");
}

export function getAllSessionsIncludingDeleted(): any[] {
    return db.getAllSync("SELECT * FROM sessions ORDER BY created_at DESC;");
}

/** Soft-delete all sessions for a user */
export function invalidateUserSessions(userId: string): void {
    db.runSync("UPDATE sessions SET is_deleted = 1, is_synced = 0 WHERE user_id = ?;", [userId]);
}

/** Hard-delete sessions (admin only) */
export function hardDeleteSessions(userId: string): void {
    db.runSync("DELETE FROM sessions WHERE user_id = ?;", [userId]);
}

/** Restore soft-deleted sessions */
export function restoreSessions(userId: string): void {
    db.runSync("UPDATE sessions SET is_deleted = 0, is_synced = 0 WHERE user_id = ?;", [userId]);
}

// ============================================================
// AUDIT LOGS — with soft-delete
// ============================================================

export function logAudit(userId: string, action: string, details?: object): void {
    db.runSync(
        "INSERT INTO audit_logs (user_id, action, details, is_deleted, is_synced) VALUES (?, ?, ?, 0, 0);",
        [userId, action, details ? JSON.stringify(details) : null]
    );
}

export function getAuditLogs(userId?: string, limit: number = 100): any[] {
    if (userId) {
        return db.getAllSync(
            "SELECT * FROM audit_logs WHERE user_id = ? AND is_deleted = 0 ORDER BY created_at DESC LIMIT ?;",
            [userId, limit]
        );
    }
    return db.getAllSync(
        "SELECT * FROM audit_logs WHERE is_deleted = 0 ORDER BY created_at DESC LIMIT ?;",
        [limit]
    );
}

export function getAuditLogsIncludingDeleted(userId?: string, limit: number = 100): any[] {
    if (userId) {
        return db.getAllSync(
            "SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?;",
            [userId, limit]
        );
    }
    return db.getAllSync(
        "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?;",
        [limit]
    );
}

/** Soft-delete an audit log */
export function deleteAuditLog(id: number): void {
    db.runSync("UPDATE audit_logs SET is_deleted = 1, is_synced = 0 WHERE id = ?;", [id]);
}

/** Hard-delete audit log (admin only) */
export function hardDeleteAuditLog(id: number): void {
    db.runSync("DELETE FROM audit_logs WHERE id = ?;", [id]);
}

/** Restore soft-deleted audit log */
export function restoreAuditLog(id: number): void {
    db.runSync("UPDATE audit_logs SET is_deleted = 0, is_synced = 0 WHERE id = ?;", [id]);
}

// ============================================================
// SYNC QUEUE — with soft-delete
// ============================================================

export function enqueueSync(tableName: string, operation: string, payload: object): number {
    const result = db.runSync(
        "INSERT INTO sync_queue (table_name, operation, payload, is_deleted, is_synced) VALUES (?, ?, ?, 0, 0);",
        [tableName, operation, JSON.stringify(payload)]
    );
    return result.lastInsertRowId;
}

export function getPendingSyncItems(): any[] {
    return db.getAllSync("SELECT * FROM sync_queue WHERE is_deleted = 0 ORDER BY created_at ASC;");
}

export function getPendingSyncItemsIncludingDeleted(): any[] {
    return db.getAllSync("SELECT * FROM sync_queue ORDER BY created_at ASC;");
}

export function markSyncItemSynced(id: number): void {
    db.runSync("UPDATE sync_queue SET is_synced = 1 WHERE id = ?;", [id]);
}

export function incrementRetryCount(id: number): void {
    db.runSync("UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?;", [id]);
}

/** Soft-delete a sync queue item */
export function deleteSyncItem(id: number): void {
    db.runSync("UPDATE sync_queue SET is_deleted = 1 WHERE id = ?;", [id]);
}

/** Hard-delete sync item (admin only) */
export function hardDeleteSyncItem(id: number): void {
    db.runSync("DELETE FROM sync_queue WHERE id = ?;", [id]);
}

/** Restore soft-deleted sync item */
export function restoreSyncItem(id: number): void {
    db.runSync("UPDATE sync_queue SET is_deleted = 0 WHERE id = ?;", [id]);
}

// ============================================================
// RESET (for development/testing)
// ============================================================

export function resetDatabase(): void {
    db.execSync(`
        DROP TABLE IF EXISTS sync_queue;
        DROP TABLE IF EXISTS audit_logs;
        DROP TABLE IF EXISTS sessions;
        DROP TABLE IF EXISTS user;
        DROP TABLE IF EXISTS roles;
    `);
    initializeDatabase();
    console.log("🔄 Database reset complete.");
}