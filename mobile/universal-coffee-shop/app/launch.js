import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

export default function LaunchScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#09090B', '#111827', '#1F2937']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCard}>
              <Image
                source={require('../assets/images/LOGO.PNG')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.appName}>LoyalCup</Text>

            <Text style={styles.tagline}>
              Order ahead, earn rewards, and find better coffee nearby.
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="map-pin" size={22} color="#F97316" />
              </View>

              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Discover Local</Text>
                <Text style={styles.featureDescription}>
                  Find amazing coffee shops nearby
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="award" size={22} color="#F97316" />
              </View>

              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Earn Rewards</Text>
                <Text style={styles.featureDescription}>
                  Get points with every purchase
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="zap" size={22} color="#F97316" />
              </View>

              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Order Ahead</Text>
                <Text style={styles.featureDescription}>
                  Skip the line, save time
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/signup')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Feather name="arrow-right" size={20} color="#101828" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>
                I Already Have an Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => router.replace('/home')}
              activeOpacity={0.8}
            >
              <Feather name="compass" size={18} color="#FFFFFF" />
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  glowOne: {
    position: 'absolute',
    top: -140,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(249, 115, 22, 0.24)',
  },
  glowTwo: {
    position: 'absolute',
    bottom: 190,
    left: -150,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 14,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  logoCard: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    shadowColor: '#120703',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  logoImage: {
    width: 82,
    height: 82,
  },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.78)',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
    maxWidth: 310,
  },
  features: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 18,
    padding: 9,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.62)',
  },
  buttons: {
    gap: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 13,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#120703',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101828',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  guestButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 20,
    backgroundColor: '#F97316',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
