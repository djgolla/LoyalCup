// About screen
// universal-coffee-shop/app/about.js
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {
      console.error('Failed to open URL');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ABOUT</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>☕</Text>
            <Text style={styles.appName}>LOYAL CUP</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OUR MISSION</Text>
            <Text style={styles.description}>
              LoyalCup connects coffee lovers with their favorite local coffee shops. 
              We believe in supporting local businesses and making it easy for you to 
              discover, order, and stay loyal to the shops you love.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FEATURES</Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={20} color="#000" />
                <Text style={styles.featureText}>Order ahead for pickup</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={20} color="#000" />
                <Text style={styles.featureText}>Earn loyalty points with every purchase</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={20} color="#000" />
                <Text style={styles.featureText}>Discover local coffee shops near you</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={20} color="#000" />
                <Text style={styles.featureText}>Save your favorite shops</Text>
              </View>
              <View style={styles.featureItem}>
                <Feather name="check-circle" size={20} color="#000" />
                <Text style={styles.featureText}>Track your order history</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>COMPANY</Text>
            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => openLink('https://loyalcup.com')}>
              <Text style={styles.linkText}>Website</Text>
              <Feather name="external-link" size={18} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => openLink('https://loyalcup.com/privacy')}>
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Feather name="external-link" size={18} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.linkItem}
              onPress={() => openLink('https://loyalcup.com/terms')}>
              <Text style={styles.linkText}>Terms of Service</Text>
              <Feather name="external-link" size={18} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FOLLOW US</Text>
            <View style={styles.socialLinks}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => openLink('https://twitter.com/loyalcup')}>
                <Feather name="twitter" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => openLink('https://instagram.com/loyalcup')}>
                <Feather name="instagram" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={() => openLink('https://facebook.com/loyalcup')}>
                <Feather name="facebook" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © 2024 LoyalCup. All rights reserved.
            </Text>
            <Text style={styles.footerText}>
              Made with ❤️ for coffee lovers everywhere
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Anton-Regular',
  },
  content: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  logo: {
    fontSize: 64,
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'Anton-Regular',
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Anton-Regular',
    color: '#666',
    marginBottom: 15,
    letterSpacing: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  linkText: {
    fontSize: 16,
    fontFamily: 'Anton-Regular',
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 15,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#000',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 5,
  },
});
