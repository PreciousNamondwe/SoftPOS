import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

export default function AnimatedCpuNetwork() {
  const rotationValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotationValue, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spinClockwise = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const spinCounterClockwise = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  const pulseScale = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.3],
  });

  const pulseOpacity = pulseValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  return (
    <View style={styles.syncContainer}>
      <View style={styles.visualWrapper}>
        <Animated.View 
          style={[
            styles.pulseRing, 
            { 
              transform: [{ scale: pulseScale }], 
              opacity: pulseOpacity 
            }
          ]} 
        />

        <Animated.View style={[styles.outerTracker, { transform: [{ rotate: spinClockwise }] }]}>
          <View style={styles.orbitNodeGreen} />
        </Animated.View>

        <Animated.View style={[styles.innerTracker, { transform: [{ rotate: spinCounterClockwise }] }]}>
          <View style={styles.orbitNodeWhite} />
        </Animated.View>

        <View style={styles.coreBadge}>
          <Ionicons name="sync" size={26} color="#f8f7f4" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  syncContainer: {
    width: "100%",
    paddingVertical: 4,
    marginTop: 4,
    marginBottom: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  visualWrapper: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  coreBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#073474",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#f5fcfa",
    zIndex: 10,
    position: "absolute",
  },
  outerTracker: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderTopColor: "#eff1f1",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  innerTracker: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderBottomColor: "rgba(255, 255, 255, 0.7)", 
    justifyContent: "flex-end",
    alignItems: "center",
  },
  orbitNodeGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e6ebea",
    marginTop: -5,
  },
  orbitNodeWhite: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginBottom: -4,
  },
  pulseRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(0, 255, 204, 0.4)",
    backgroundColor: "rgba(0, 255, 204, 0.03)",
  },
});