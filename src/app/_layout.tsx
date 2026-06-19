// /workspaces/SoftPOS/src/app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Defines the initial entry index screen */}
      <Stack.Screen name="index" />
      {/* Defines the tab navigation structure layout group */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}