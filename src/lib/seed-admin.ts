// ============================================================
// lib/seed-admin.ts — Seed Admin User
// Lomis Field Terminal
// ============================================================

import { db } from "./database";
import { hashPassword } from "./bcrypt";

const DEFAULT_ADMIN = {
  user_id: "ADMIN001",
  full_name: "System Administrator",
  role: "admin",
  pin: "123456", // Change this in production!
};

/** Check if admin already exists */
function adminExists(userId: string): boolean {
  const result = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM user WHERE user_id = ?;",
    [userId.toUpperCase()]
  );
  return (result?.count ?? 0) > 0;
}

/** Seed the default admin user */
export async function seedAdminUser(): Promise<{ success: boolean; message: string }> {
  try {
    // First ensure the admin role exists
    const adminRole = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM roles WHERE role_key = ?;",
      ["admin"]
    );

    if (!adminRole || adminRole.count === 0) {
      return {
        success: false,
        message: "Admin role not found. Run initializeDatabase() first.",
      };
    }

    // Check if admin already exists
    if (adminExists(DEFAULT_ADMIN.user_id)) {
      return {
        success: false,
        message: `Admin user "${DEFAULT_ADMIN.user_id}" already exists.`,
      };
    }

    // Hash the PIN using bcrypt
    const pinHash = await hashPassword(DEFAULT_ADMIN.pin);

    // Create admin user
    db.runSync(
      `INSERT INTO user (user_id, full_name, role, pin_hash, is_active, is_synced)
       VALUES (?, ?, ?, ?, 1, 0);`,
      [
        DEFAULT_ADMIN.user_id.toUpperCase(),
        DEFAULT_ADMIN.full_name,
        DEFAULT_ADMIN.role,
        pinHash,
      ]
    );

    console.log("✅ Admin user seeded successfully.");
    console.log(`   User ID: ${DEFAULT_ADMIN.user_id}`);
    console.log(`   Name: ${DEFAULT_ADMIN.full_name}`);
    console.log(`   PIN: ${DEFAULT_ADMIN.pin}`);

    return {
      success: true,
      message: `Admin user "${DEFAULT_ADMIN.user_id}" created with PIN: ${DEFAULT_ADMIN.pin}`,
    };
  } catch (error: any) {
    console.error("❌ Failed to seed admin:", error.message);
    return {
      success: false,
      message: `Failed to seed admin: ${error.message}`,
    };
  }
}

/** Update admin PIN */
export async function updateAdminPin(userId: string, newPin: string): Promise<{ success: boolean; message: string }> {
  try {
    const pinHash = await hashPassword(newPin);
    db.runSync(
      "UPDATE user SET pin_hash = ?, updated_at = datetime('now') WHERE user_id = ?;",
      [pinHash, userId.toUpperCase()]
    );
    return {
      success: true,
      message: `PIN updated for user "${userId}".`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to update PIN: ${error.message}`,
    };
  }
}