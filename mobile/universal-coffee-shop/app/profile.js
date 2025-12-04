// profile screen
// universal-coffee-shop/app/profile.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { loyaltyService } from '../services/loyaltyService';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [profileData, pointsData] = await Promise.all([
        userService.getProfile().catch(() => null),
        loyaltyService.getPoints().catch(() => ({ points: 0 })),
      ]);
      
      setProfile(profileData);
      setLoyaltyPoints(pointsData.points || 0);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
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
              router.replace('/launch');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PROFILE</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Feather name="user" size={48} color="#000" />
          </View>
          <Text style={styles.userName}>{profile?.name || user?.email || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        <View style={styles.loyaltyCard}>
          <Text style={styles.loyaltyTitle}>LOYALTY POINTS</Text>
          <Text style={styles.loyaltyPoints}>{loyaltyPoints}</Text>
          <TouchableOpacity 
            style={styles.rewardsButton}
            onPress={() => router.push('/rewards')}>
            <Text style={styles.rewardsButtonText}>VIEW REWARDS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/order-history')}>
            <Feather name="list" size={24} color="black" />
            <Text style={styles.menuItemText}>Order History</Text>
            <Feather name="chevron-right" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/favorites')}>
            <Feather name="heart" size={24} color="black" />
            <Text style={styles.menuItemText}>Favorite Shops</Text>
            <Feather name="chevron-right" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings')}>
            <Feather name="settings" size={24} color="black" />
            <Text style={styles.menuItemText}>Settings</Text>
            <Feather name="chevron-right" size={24} color="black" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, styles.logoutButton]}
            onPress={handleLogout}>
            <Feather name="log-out" size={24} color="red" />
            <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
            <View style={{ width: 24 }} />
          </TouchableOpacity>
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Anton-Regular',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  loyaltyCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#000',
    borderRadius: 15,
    alignItems: 'center',
  },
  loyaltyTitle: {
    fontSize: 16,
    color: '#FFF',
    fontFamily: 'Anton-Regular',
    marginBottom: 10,
  },
  loyaltyPoints: {
    fontSize: 48,
    color: '#FFF',
    fontFamily: 'Anton-Regular',
    marginBottom: 15,
  },
  rewardsButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 20,
  },
  rewardsButtonText: {
    color: '#000',
    fontFamily: 'Anton-Regular',
    fontSize: 14,
  },
  menuSection: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Anton-Regular',
    marginLeft: 15,
  },
  logoutButton: {
    marginTop: 20,
    borderBottomWidth: 0,
  },
  logoutText: {
    color: 'red',
  },
});
