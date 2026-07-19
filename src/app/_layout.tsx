// ============================================================
// app/_layout.tsx — Root Layout with AuthProvider & DB DevTools
// Lomis Field Terminal
// ============================================================

import { AuthProvider } from "@/contexts/AuthContext";
import { db, initializeDatabase } from "@/lib/database";
import { initializeBusinessTables } from "@/lib/database-business";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

export default function RootLayout() {
useEffect(() => {
    async function setupDatabase() {
        try {
            initializeDatabase(); // Sync: creates tables + roles
            await initializeBusinessTables(); // Async: creates business-specific tables
            // const seedResult = await seedAdminUser();
            //     if (seedResult.success) {
            //         console.log("🌱", seedResult.message);
            //     }

        } catch (error) {
            console.error("❌ Failed to initialize database:", error);
        }
    }
    setupDatabase();
}, []);

    // Pass your raw expo-sqlite instance directly into the dev tool
    useDrizzleStudio(db);

    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(adminTabs)" />
                <Stack.Screen name="(tabs)" />
            </Stack>
            <StatusBar style="light" />
        </AuthProvider>
    );
}