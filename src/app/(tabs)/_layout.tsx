import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ThemeProvider, DarkTheme, DefaultTheme } from "expo-router";
import { useColorScheme, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatedSplashOverlay } from "@/components/animated-icon";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      {/* GLASS + GRADIENT BACKGROUND */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          height: 80,
          borderRadius: 40,
          overflow: "hidden",
        }}
      >
        <LinearGradient
          colors={[
            "rgba(69,109,165,0.35)",
            "rgba(7,52,116,0.20)",
            "rgba(92,140,232,0.25)",
          ]}
          style={{ flex: 1 }}
        />
      </View>

      {/* TABS (STABLE API) */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            height: 80,
            borderRadius: 40,
            backgroundColor: "rgba(255,255,255,0.08)",
            borderTopWidth: 0,
            overflow: "hidden",
          },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="collect"
          options={{
            title: "Collect",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="card-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="receipts"
          options={{
            title: "Receipts",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="reports"
          options={{
            title: "Reports",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}