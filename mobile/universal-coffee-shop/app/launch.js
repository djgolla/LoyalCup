// Launch screen - Enhanced with better typography and animations
// universal-coffee-shop/app/launch.js
import React from "react";
import { StyleSheet, Text, View, PanResponder, Animated } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LaunchScreen() {
  const router = useRouter();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Pulse animation for swipe up indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Simple RN gesture detector (no Reanimated)
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // start responding only if finger moves vertically
        return Math.abs(gestureState.dy) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -20) {
          // negative = swipe up
          router.push("/login");
        }
      },
    })
  ).current;

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.gradientOverlay} />
      
      <View style={styles.textContainer}>
        <View style={styles.titleWrapper}>
          <Text style={styles.title}>DISCOVER</Text>
          <Text style={[styles.title, styles.localTitle]}>LOCAL</Text>
          <Text style={styles.title}>STAY</Text>
          <Text style={styles.title}>LOYAL</Text>
        </View>
        
        <Text style={styles.subtitle}>Your favorite coffee, one tap away</Text>
      </View>
      
      <View style={styles.swipeContainer}>
        <Animated.View style={[styles.swipeIndicator, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.swipeArrow}>↑</Text>
        </Animated.View>
        <Text style={styles.swipeUpText}>SWIPE UP TO START</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 60,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(139, 69, 19, 0.03)',
  },
  textContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  titleWrapper: {
    alignItems: "center",
  },
  title: {
    fontSize: 68,
    color: "#1A1A1A",
    fontFamily: "Anton-Regular",
    lineHeight: 72,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  localTitle: {
    fontSize: 88,
    color: "#2C1810",
    fontFamily: "Canopee",
    textShadowColor: 'rgba(139, 69, 19, 0.3)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
    lineHeight: 92,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 30,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  swipeContainer: {
    alignItems: "center",
    gap: 15,
  },
  swipeIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  swipeArrow: {
    fontSize: 32,
    color: "#FFF",
    fontWeight: "bold",
  },
  swipeUpText: {
    fontSize: 13,
    color: "#000000",
    letterSpacing: 3,
    fontFamily: "Anton-Regular",
    opacity: 0.7,
  },
});
