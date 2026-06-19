import AnimatedCpuNetwork from "@/components/AnimatedCpuNetwork";
import styles from "@/styles/indexStyle";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function ProgressArc({ percent = 78 }) {
  const radius = 90;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (circumference * percent) / 100;

  return (
    <View style={styles.arcContainer}>
      <Svg width={220} height={120}>
        {/* Background Track */}
        <Path
          d="M 20,110 A 90,90 0 0,1 200,110"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
        />
        {/* Active Progress Track */}
        <Path
          d="M 20,110 A 90,90 0 0,1 200,110"
          stroke="#f3f7f6"
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </Svg>

      <View style={styles.arcTextAbsoluteWrapper}>
        <Text style={styles.arcPercentage}>{percent}%</Text>
        <Text style={styles.arcInnerLabel}>COMPLETED</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();

  // Custom Agent Config States
  const [notificationCount, setNotificationCount] = useState<number>(3);
  const [agentId, setAgentId] = useState<string>("AGT-9082");

  // Financial Metric Calculations
  const totalCollected = 39000;
  const targetGoal = 50000;

  return (
    <LinearGradient
      colors={["#456da5", "#073474", "#5C8CE8"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: 60,
        }}
      >
        {/* 1. TOP APP BAR BLOCK (PROFILE CIRCLE + SPAN AGENT ID & NOTIFICATION ICON) */}
        <View style={styles.headerRow}>
          
          {/* PROFILE COMPONENT GRID WITH ATTACHED AGENT ID STRIP */}
          <View style={styles.profileMetaBoxRow}>
            <TouchableOpacity 
              style={styles.profileBadge}
              activeOpacity={0.8}
              onPress={() => console.log("Profile Tapped")}
            >
              <Ionicons name="person-circle" size={38} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.idContextSpan}>
              <Text style={styles.idLabelHint}>OFFICIAL ID</Text>
              <Text style={styles.idNumberText}>{agentId}</Text>
            </View>
          </View>

          {/* RIGHT NOTIFICATION ACTION LAYER */}
          <TouchableOpacity 
            style={styles.notificationBadge}
            activeOpacity={0.8}
            onPress={() => console.log("Notifications Tapped")}
          >
            <Ionicons name="notifications" size={24} color="#FFFFFF" />
            {notificationCount > 0 && (
              <View style={styles.redIndicatorDot}>
                <Text style={styles.notificationCounterText}>
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. LOGO ON LEFT, GREETING ON CENTER, BALANCED RIGHT SPACE */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          marginTop: 20,
          marginBottom: 20,
          width: "100%",
        }}>
          {/* Logo on the far left */}
          <Image 
            source={require("@/assets/images/malawi-government-logo.png")}
            style={{
              width: 90,
              height: 90,
              resizeMode: "contain"
            }}
          />
          
          {/* Centered Greeting Text Block */}
          <View style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 50, // Matches logo width to guarantee perfect geometric centering
          }}>
            <Text style={[styles.greetingText, { textAlign: "center" }]}>Welcome !!</Text>
            <Text style={[styles.dateSubtitle, { textAlign: "center" }]}>Friday, 19 June 2026</Text>
          </View>
        </View>

        {/* 3. TARGET STATUS MATRIX CENTER */}
        <BlurView intensity={20} tint="light" style={styles.targetCard}>
          <Text style={styles.cardSectionLabel}>SHIFT MILESTONE BENCHMARK</Text>
          
          <ProgressArc percent={Math.round((totalCollected / targetGoal) * 100)} />

          <View style={styles.targetLegendGrid}>
            <View style={styles.legendNode}>
              <Text style={styles.legendLabel}>COLLECTED YIELD</Text>
              <Text style={styles.legendValue}>K{totalCollected.toLocaleString()}</Text>
            </View>
            <View style={[styles.legendNode, styles.legendNodeBorderLeft]}>
              <Text style={styles.legendLabel}>SHIFT TARGET</Text>
              <Text style={styles.legendValueNormal}>K{targetGoal.toLocaleString()}</Text>
            </View>
          </View>
        </BlurView>

        <AnimatedCpuNetwork/>

      </ScrollView>
    </LinearGradient>
  );
}