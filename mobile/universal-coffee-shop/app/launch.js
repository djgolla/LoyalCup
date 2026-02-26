import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LaunchScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#00704A', '#004D33', '#003324']}
        style={styles.gradient}>
        
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Feather name="coffee" size={60} color="#FFF" />
            </View>
            <Text style={styles.appName}>LoyalCup</Text>
            <Text style={styles.tagline}>Your favorite coffee shops,{'\n'}all in one place</Text>
          </View>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="map-pin" size={24} color="#00704A" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Discover Local</Text>
                <Text style={styles.featureDescription}>Find amazing coffee shops nearby</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="award" size={24} color="#00704A" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Earn Rewards</Text>
                <Text style={styles.featureDescription}>Get points with every purchase</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name="zap" size={24} color="#00704A" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Order Ahead</Text>
                <Text style={styles.featureDescription}>Skip the line, save time</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => router.push('/signup')}
              activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <Feather name="arrow-right" size={20} color="#00704A" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  buttons: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00704A',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});