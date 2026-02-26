// profile screen
// universal-coffee-shop/app/profile.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getGlobalPoints, getAllShopPoints } from '../services/loyaltyService';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [globalPoints, setGlobalPoints] = useState(null);
  const [shopPoints, setShopPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      if (!user?.id) return;

      // Load profile from Supabase
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url')
        .eq('id', user.id)
        .single();

      // Load loyalty points
      const [global, shops] = await Promise.all([
        getGlobalPoints(user.id),
        getAllShopPoints(user.id)
      ]);

      setProfile(profileData);
      setGlobalPoints(global);
      setShopPoints(shops);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalPoints = () => {
    const global = globalPoints?.current_balance || 0;
    const shopTotal = shopPoints.reduce((sum, sp) => sum + (sp.current_balance || 0), 0);
    return global + shopTotal;
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.backButton} />
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Feather name="user" size={48} color="#000" />
          </View>
          <Text style={styles.userName}>{profile?.full_name || user?.email || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {profile?.phone && (
            <Text style={styles.userPhone}>{profile.phone}</Text>
          )}
        </View>

        {/* Loyalty Card */}
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyHeader}>
            <Feather name="award" size={24} color="#FFF" />
            <Text style={styles.loyaltyTitle}>LOYALTY POINTS</Text>
          </View>
          <Text style={styles.loyaltyPoints}>{getTotalPoints()}</Text>
          
          {/* Points Breakdown */}
          {(globalPoints?.current_balance > 0 || shopPoints.length > 0) && (
            <View style={styles.pointsBreakdown}>
              {globalPoints?.current_balance > 0 && (
                <Text style={styles.pointsDetail}>
                  Global: {globalPoints.current_balance} pts
                </Text>
              )}
              {shopPoints.length > 0 && (
                <Text style={styles.pointsDetail}>
                  Shop: {shopPoints.reduce((sum, sp) => sum + sp.current_balance, 0)} pts
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity 
            style={styles.rewardsButton}
            onPress={() => router.push('/rewards')}>
            <Text style={styles.rewardsButtonText}>VIEW REWARDS</Text>
            <Feather name="arrow-right" size={16} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/order-history')}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Feather name="list" size={20} color="#00704A" />
              </View>
              <Text style={styles.menuItemText}>Order History</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/favorites')}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Feather name="heart" size={20} color="#00704A" />
              </View>
              <Text style={styles.menuItemText}>Favorite Shops</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings')}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Feather name="settings" size={20} color="#00704A" />
              </View>
              <Text style={styles.menuItemText}>Settings</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/support')}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Feather name="help-circle" size={20} color="#00704A" />
              </View>
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, styles.logoutIconContainer]}>
                <Feather name="log-out" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>LoyalCup v1.0.0</Text>
          <Text style={styles.footerSubtext}>© 2026 All rights reserved</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    borderWidth: 3,
    borderColor: '#00704A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  userPhone: {
    fontSize: 14,
    color: '#999',
  },
  loyaltyCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#00704A',
    borderRadius: 20,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  loyaltyTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  loyaltyPoints: {
    color: '#FFF',
    fontSize: 56,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pointsBreakdown: {
    marginBottom: 16,
  },
  pointsDetail: {
    color: '#E0E0E0',
    fontSize: 13,
    marginBottom: 2,
  },
  rewardsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 25,
    gap: 8,
  },
  rewardsButtonText: {
    color: '#00704A',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  menuSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  logoutItem: {
    backgroundColor: '#FEE2E2',
    marginTop: 10,
  },
  logoutIconContainer: {
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#CCC',
  },
});