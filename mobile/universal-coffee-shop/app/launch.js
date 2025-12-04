import React from "react";
import { StyleSheet, Text, View, PanResponder } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LaunchScreen() {
  const router = useRouter();

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
      <View style={styles.textContainer}>
        <Text style={styles.title}>THE</Text>
        <Text style={styles.title}>WORLD</Text>
        <Text style={styles.title}>RUNS ON</Text>
        <Text style={styles.stylizedTitle}>COFFEE</Text>
        <Text style={styles.stylizedTitle}>SHOPS</Text>
      </View>
      <Text style={styles.swipeUpText}>SWIPE UP</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  textContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 64,
    color: "#000000",
    fontFamily: "Anton-Regular",
    lineHeight: 70,
    textTransform: "uppercase",
  },
  stylizedTitle: {
    fontSize: 72,
    fontFamily: "Canopee",
  },
  swipeUpText: {
    fontSize: 14,
    color: "#000000",
    letterSpacing: 2,
    fontFamily: "Anton-Regular",
  },
});
