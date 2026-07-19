// ============================================================
// lib/database-business.ts — Business Database Operations
// Lomis Field Terminal — with is_deleted soft-delete
// ============================================================

import { db } from "./database";

// ─── Types ─────────────────────────────────────────────────

export interface BusinessType {
  id: number;
  name: string;
  description: string | null;
  amount_charge: number;
  is_deleted: number;
  is_synced: number;
  created_at: string;
}

export interface BusinessOwner {
  id: number;
  full_name: string;
  national_id: string | null;
  location: string | null;
  date_of_birth: string | null;
  allow_multiple_businesses: number;
  max_businesses_count: number;
  is_deleted: number;
  is_synced: number;
  created_at: string;
}

export interface Business {
  id: number;
  business_name: string;
  registration_number: string | null;
  business_type_id: number;
  owner_id: number;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_number: string | null;
  is_active: number;
  is_deleted: number;
  is_synced: number;
  created_at: string;
  business_type_name?: string;
  owner_name?: string;
  owner_national_id?: string;
}

// ─── Initialize Business Tables ──────────────────────────────

export function initializeBusinessTables() {
  // Business Types Table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS business_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      amount_charge REAL DEFAULT 0,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      is_synced INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Business Owners Table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS business_owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      national_id TEXT UNIQUE,
      location TEXT,
      date_of_birth TEXT,
      allow_multiple_businesses INTEGER DEFAULT 0,
      max_businesses_count INTEGER DEFAULT 1,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      is_synced INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Businesses Table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL,
      registration_number TEXT UNIQUE,
      business_type_id INTEGER NOT NULL,
      owner_id INTEGER NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      tax_number TEXT,
      is_active INTEGER DEFAULT 1,
      is_deleted INTEGER NOT NULL DEFAULT 0,
      is_synced INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_type_id) REFERENCES business_types(id),
      FOREIGN KEY (owner_id) REFERENCES business_owners(id)
    );
  `);

  // Insert default business types if empty
  const count = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM business_types WHERE is_deleted = 0;"
  );
  if (!count || count.count === 0) {
    const defaults = [
      { name: "Retail Shop", description: "General retail store", amount_charge: 50 },
      { name: "Restaurant", description: "Food and beverage service", amount_charge: 100 },
      { name: "Pharmacy", description: "Medical and drug store", amount_charge: 150 },
      { name: "Supermarket", description: "Large grocery store", amount_charge: 200 },
      { name: "Wholesale", description: "Bulk goods distributor", amount_charge: 250 },
      { name: "Service Provider", description: "General service business", amount_charge: 75 },
    ];
    for (const type of defaults) {
      db.runSync(
        "INSERT INTO business_types (name, description, amount_charge, is_deleted, is_synced) VALUES (?, ?, ?, 0, 0);",
        [type.name, type.description, type.amount_charge]
      );
    }
  }
}

// ─── Migration: Add is_deleted if upgrading ─────────────────

export function migrateBusinessTables(): void {
  const tables = ["business_types", "business_owners", "businesses"];
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

// ─── Business Types CRUD — with soft-delete ────────────────

export function getAllBusinessTypes(): BusinessType[] {
  return db.getAllSync<BusinessType>(
    "SELECT * FROM business_types WHERE is_deleted = 0 ORDER BY name;"
  ) || [];
}

export function getAllBusinessTypesIncludingDeleted(): BusinessType[] {
  return db.getAllSync<BusinessType>(
    "SELECT * FROM business_types ORDER BY name;"
  ) || [];
}

export function addBusinessType(name: string, description: string | null, amountCharge: number = 0): { success: boolean; message: string } {
  try {
    if (!name.trim()) return { success: false, message: "Business type name is required." };
    db.runSync(
      "INSERT INTO business_types (name, description, amount_charge, is_deleted, is_synced) VALUES (?, ?, ?, 0, 0);",
      [name.trim(), description || null, amountCharge]
    );
    return { success: true, message: "Business type added successfully." };
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      return { success: false, message: "Business type already exists." };
    }
    return { success: false, message: "Failed to add business type." };
  }
}

export function updateBusinessType(id: number, name: string, description: string | null, amountCharge: number = 0): { success: boolean; message: string } {
  try {
    if (!name.trim()) return { success: false, message: "Business type name is required." };
    db.runSync(
      "UPDATE business_types SET name = ?, description = ?, amount_charge = ?, is_synced = 0 WHERE id = ? AND is_deleted = 0;",
      [name.trim(), description || null, amountCharge, id]
    );
    return { success: true, message: "Business type updated successfully." };
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      return { success: false, message: "Business type name already exists." };
    }
    return { success: false, message: "Failed to update business type." };
  }
}

/** Soft-delete a business type */
export function deleteBusinessType(id: number): { success: boolean; message: string } {
  try {
    const inUse = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM businesses WHERE business_type_id = ? AND is_deleted = 0;",
      [id]
    );
    if (inUse && inUse.count > 0) {
      return { success: false, message: "Cannot delete: type is assigned to active businesses." };
    }
    db.runSync("UPDATE business_types SET is_deleted = 1, is_synced = 0 WHERE id = ?;", [id]);
    return { success: true, message: "Business type deleted successfully." };
  } catch {
    return { success: false, message: "Failed to delete business type." };
  }
}

/** Hard-delete a business type (admin only) */
export function hardDeleteBusinessType(id: number): void {
  db.runSync("DELETE FROM business_types WHERE id = ?;", [id]);
}

/** Restore a soft-deleted business type */
export function restoreBusinessType(id: number): void {
  db.runSync("UPDATE business_types SET is_deleted = 0, is_synced = 0 WHERE id = ?;", [id]);
}

// ─── Business Owners CRUD — with soft-delete ───────────────

export function getAllBusinessOwners(): BusinessOwner[] {
  return db.getAllSync<BusinessOwner>(
    "SELECT * FROM business_owners WHERE is_deleted = 0 ORDER BY full_name;"
  ) || [];
}

export function getAllBusinessOwnersIncludingDeleted(): BusinessOwner[] {
  return db.getAllSync<BusinessOwner>(
    "SELECT * FROM business_owners ORDER BY full_name;"
  ) || [];
}

export function searchBusinessOwners(query: string): BusinessOwner[] {
  const likeQuery = `%${query.toLowerCase()}%`;
  return db.getAllSync<BusinessOwner>(`
    SELECT * FROM business_owners 
    WHERE is_deleted = 0 AND (LOWER(full_name) LIKE ? OR LOWER(national_id) LIKE ? OR LOWER(location) LIKE ?)
    ORDER BY full_name;
  `, [likeQuery, likeQuery, likeQuery]) || [];
}

export function getBusinessOwnerById(id: number): BusinessOwner | null {
  return db.getFirstSync<BusinessOwner>(
    "SELECT * FROM business_owners WHERE id = ? AND is_deleted = 0;",
    [id]
  ) || null;
}

export function getBusinessOwnerByNationalId(nationalId: string): BusinessOwner | null {
  return db.getFirstSync<BusinessOwner>(
    "SELECT * FROM business_owners WHERE national_id = ? AND is_deleted = 0;",
    [nationalId]
  ) || null;
}

export function addBusinessOwner(
  fullName: string,
  nationalId: string | null,
  location: string | null,
  dateOfBirth: string | null,
  allowMultiple: number = 0,
  maxBusinesses: number = 1
): { success: boolean; message: string; id?: number } {
  try {
    if (!fullName.trim()) return { success: false, message: "Full name is required." };
    const result = db.runSync(
      "INSERT INTO business_owners (full_name, national_id, location, date_of_birth, allow_multiple_businesses, max_businesses_count, is_deleted, is_synced) VALUES (?, ?, ?, ?, ?, ?, 0, 0);",
      [fullName.trim(), nationalId || null, location || null, dateOfBirth || null, allowMultiple, maxBusinesses]
    );
    return { success: true, message: "Business owner added successfully.", id: result.lastInsertRowId };
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      return { success: false, message: "National ID already exists." };
    }
    return { success: false, message: "Failed to add business owner." };
  }
}

export function updateBusinessOwner(
  id: number,
  fullName: string,
  nationalId: string | null,
  location: string | null,
  dateOfBirth: string | null,
  allowMultiple: number = 0,
  maxBusinesses: number = 1
): { success: boolean; message: string } {
  try {
    if (!fullName.trim()) return { success: false, message: "Full name is required." };
    db.runSync(
      "UPDATE business_owners SET full_name = ?, national_id = ?, location = ?, date_of_birth = ?, allow_multiple_businesses = ?, max_businesses_count = ?, is_synced = 0 WHERE id = ? AND is_deleted = 0;",
      [fullName.trim(), nationalId || null, location || null, dateOfBirth || null, allowMultiple, maxBusinesses, id]
    );
    return { success: true, message: "Business owner updated successfully." };
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      return { success: false, message: "National ID already exists." };
    }
    return { success: false, message: "Failed to update business owner." };
  }
}

/** Soft-delete a business owner */
export function deleteBusinessOwner(id: number): { success: boolean; message: string } {
  try {
    const inUse = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM businesses WHERE owner_id = ? AND is_deleted = 0;",
      [id]
    );
    if (inUse && inUse.count > 0) {
      return { success: false, message: "Cannot delete: owner has active businesses." };
    }
    db.runSync("UPDATE business_owners SET is_deleted = 1, is_synced = 0 WHERE id = ?;", [id]);
    return { success: true, message: "Business owner deleted successfully." };
  } catch {
    return { success: false, message: "Failed to delete business owner." };
  }
}

/** Hard-delete a business owner (admin only) */
export function hardDeleteBusinessOwner(id: number): void {
  db.runSync("DELETE FROM business_owners WHERE id = ?;", [id]);
}

/** Restore a soft-deleted business owner */
export function restoreBusinessOwner(id: number): void {
  db.runSync("UPDATE business_owners SET is_deleted = 0, is_synced = 0 WHERE id = ?;", [id]);
}

// ─── Helper: Get next business number for same type + owner ──

function getNextBusinessNumber(ownerId: number, typeId: number): number {
  const result = db.getFirstSync<{ count: number }>(`
    SELECT COUNT(*) as count FROM businesses 
    WHERE owner_id = ? AND business_type_id = ? AND is_deleted = 0;
  `, [ownerId, typeId]);
  return (result?.count || 0) + 1;
}

// ─── Businesses CRUD — with soft-delete ────────────────────

export function getAllBusinesses(): Business[] {
  return db.getAllSync<Business>(`
    SELECT b.*, bt.name as business_type_name, bo.full_name as owner_name, bo.national_id as owner_national_id
    FROM businesses b
    LEFT JOIN business_types bt ON b.business_type_id = bt.id
    LEFT JOIN business_owners bo ON b.owner_id = bo.id
    WHERE b.is_deleted = 0
    ORDER BY b.created_at DESC;
  `) || [];
}

export function getAllBusinessesIncludingDeleted(): Business[] {
  return db.getAllSync<Business>(`
    SELECT b.*, bt.name as business_type_name, bo.full_name as owner_name, bo.national_id as owner_national_id
    FROM businesses b
    LEFT JOIN business_types bt ON b.business_type_id = bt.id
    LEFT JOIN business_owners bo ON b.owner_id = bo.id
    ORDER BY b.created_at DESC;
  `) || [];
}

export function getBusinessesByOwner(ownerId: number): Business[] {
  return db.getAllSync<Business>(`
    SELECT b.*, bt.name as business_type_name, bo.full_name as owner_name, bo.national_id as owner_national_id
    FROM businesses b
    LEFT JOIN business_types bt ON b.business_type_id = bt.id
    LEFT JOIN business_owners bo ON b.owner_id = bo.id
    WHERE b.owner_id = ? AND b.is_deleted = 0
    ORDER BY b.created_at DESC;
  `, [ownerId]) || [];
}

export function getBusinessById(id: number): Business | null {
  return db.getFirstSync<Business>(`
    SELECT b.*, bt.name as business_type_name, bo.full_name as owner_name, bo.national_id as owner_national_id
    FROM businesses b
    LEFT JOIN business_types bt ON b.business_type_id = bt.id
    LEFT JOIN business_owners bo ON b.owner_id = bo.id
    WHERE b.id = ? AND b.is_deleted = 0;
  `, [id]) || null;
}

export function addBusiness(
  businessName: string,
  registrationNumber: string | null,
  businessTypeId: number,
  ownerId: number,
  address: string | null,
  phone: string | null,
  email: string | null,
  taxNumber: string | null
): { success: boolean; message: string } {
  try {
    if (!businessName.trim()) return { success: false, message: "Business name is required." };
    if (!businessTypeId) return { success: false, message: "Business type is required." };
    if (!ownerId) return { success: false, message: "Business owner is required." };

    const nextNumber = getNextBusinessNumber(ownerId, businessTypeId);
    let finalName = businessName.trim();
    if (nextNumber > 1) finalName = `${businessName.trim()} ${nextNumber}`;

    db.runSync(
      `INSERT INTO businesses (business_name, registration_number, business_type_id, owner_id, address, phone, email, tax_number, is_deleted, is_synced) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0);`,
      [finalName, registrationNumber || null, businessTypeId, ownerId, address || null, phone || null, email || null, taxNumber || null]
    );
    return { success: true, message: `Business "${finalName}" created successfully.` };
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      if (error.message?.includes("registration_number")) {
        return { success: false, message: "Registration number already exists." };
      }
      return { success: false, message: "Duplicate entry found." };
    }
    return { success: false, message: "Failed to create business." };
  }
}

export function updateBusiness(
  id: number,
  businessName: string,
  registrationNumber: string | null,
  businessTypeId: number,
  ownerId: number,
  address: string | null,
  phone: string | null,
  email: string | null,
  taxNumber: string | null,
  isActive: number
): { success: boolean; message: string } {
  try {
    if (!businessName.trim()) return { success: false, message: "Business name is required." };
    db.runSync(
      `UPDATE businesses SET business_name = ?, registration_number = ?, business_type_id = ?, owner_id = ?, address = ?, phone = ?, email = ?, tax_number = ?, is_active = ?, is_synced = 0 WHERE id = ? AND is_deleted = 0;`,
      [businessName.trim(), registrationNumber || null, businessTypeId, ownerId, address || null, phone || null, email || null, taxNumber || null, isActive, id]
    );
    return { success: true, message: "Business updated successfully." };
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed")) {
      return { success: false, message: "Registration number already exists." };
    }
    return { success: false, message: "Failed to update business." };
  }
}

/** Soft-delete a business */
export function deleteBusiness(id: number): { success: boolean; message: string } {
  try {
    db.runSync("UPDATE businesses SET is_deleted = 1, is_active = 0, is_synced = 0 WHERE id = ?;", [id]);
    return { success: true, message: "Business deleted successfully." };
  } catch {
    return { success: false, message: "Failed to delete business." };
  }
}

/** Hard-delete a business (admin only) */
export function hardDeleteBusiness(id: number): void {
  db.runSync("DELETE FROM businesses WHERE id = ?;", [id]);
}

/** Restore a soft-deleted business */
export function restoreBusiness(id: number): void {
  db.runSync("UPDATE businesses SET is_deleted = 0, is_synced = 0 WHERE id = ?;", [id]);
}

export function toggleBusinessStatus(id: number, isActive: number): { success: boolean; message: string } {
  try {
    db.runSync(
      "UPDATE businesses SET is_active = ?, is_synced = 0 WHERE id = ? AND is_deleted = 0;",
      [isActive ? 0 : 1, id]
    );
    return { success: true, message: isActive ? "Business deactivated." : "Business activated." };
  } catch {
    return { success: false, message: "Failed to update status." };
  }
}

// ─── Stats ─────────────────────────────────────────────────

export function getBusinessStats() {
  const total = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM businesses WHERE is_deleted = 0;"
  );
  const active = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM businesses WHERE is_active = 1 AND is_deleted = 0;"
  );
  const owners = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM business_owners WHERE is_deleted = 0;"
  );
  const types = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM business_types WHERE is_deleted = 0;"
  );
  return {
    total: total?.count || 0,
    active: active?.count || 0,
    owners: owners?.count || 0,
    types: types?.count || 0,
  };
}