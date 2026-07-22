import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { DarkTheme, DefaultTheme, Tabs, ThemeProvider } from "expo-router";
import { useColorScheme, View } from "react-native";

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
          borderRadius: 20,
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
            borderRadius: 20,
            backgroundColor: "rgba(87, 122, 218, 0.94)",
            borderTopWidth: 0,
            overflow: "hidden",
          },
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="users"
          options={{
            title: "Users",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="add-roles"
          options={{
            title: "Roles",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="businesses"
          options={{
            title: "Businesses",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="briefcase-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}