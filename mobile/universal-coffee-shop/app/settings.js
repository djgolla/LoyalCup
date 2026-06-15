import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Switch, Alert, Modal, TextInput, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { apiClient } from '../services/apiClient';

const DELETE_ACCOUNT_URL = 'https://loyalcupapp.com/delete-account';
const PRIVACY_URL = 'https://loyalcupapp.com/privacy';

export default function SettingsScreen() {
  const router       = useRouter();
  const { user }     = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pushEnabled,          setPushEnabled]          = useState(true);
  const [emailEnabled,         setEmailEnabled]         = useState(true);

  // Edit Profile Modal
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [profileName,        setProfileName]        = useState('');
  const [profileEmail,       setProfileEmail]       = useState('');
  const [savingProfile,      setSavingProfile]      = useState(false);

  // Change Password Modal
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [newPassword,           setNewPassword]           = useState('');
  const [confirmPassword,       setConfirmPassword]       = useState('');
  const [changingPassword,      setChangingPassword]      = useState(false);

  useEffect(() => {
    loadSettings();
    loadProfile();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('userSettings');
      if (saved) {
        const s = JSON.parse(saved);
        setNotificationsEnabled(s.notifications ?? true);
        setPushEnabled(s.push ?? true);
        setEmailEnabled(s.email ?? true);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const loadProfile = async () => {
    try {
      if (user?.id) {
        const data = await apiClient.get('/api/v1/users/profile');
        if (data) setProfileName(data.full_name || '');
      }
      if (user?.email) setProfileEmail(user.email);
    } catch (e) {
      console.error('Failed to load profile:', e);
    }
  };

  const saveSetting = async (key, value) => {
    try {
      const saved = await AsyncStorage.getItem('userSettings');
      const s     = saved ? JSON.parse(saved) : {};
      s[key]      = value;
      await AsyncStorage.setItem('userSettings', JSON.stringify(s));
    } catch (e) {
      console.error('Failed to save setting:', e);
    }
  };

  const handleToggleNotifications = (value) => {
    setNotificationsEnabled(value);
    saveSetting('notifications', value);
  };

  const handleTogglePush = (value) => {
    setPushEnabled(value);
    saveSetting('push', value);
  };

  const handleToggleEmail = (value) => {
    setEmailEnabled(value);
    saveSetting('email', value);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSavingProfile(true);
    try {
      await apiClient.put('/api/v1/users/profile', { full_name: profileName });
      Alert.alert('Success', 'Profile updated successfully');
      setEditProfileVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Alert.alert('Success', 'Password changed successfully');
      setChangePasswordVisible(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleOpenPrivacy = () => {
    Linking.openURL(PRIVACY_URL).catch(() => {
      Alert.alert('Privacy Policy', 'Visit loyalcupapp.com/privacy for our full privacy policy.');
    });
  };

  const handleDeleteAccountRequest = () => {
    Alert.alert(
      'Delete Account',
      'You can request deletion of your LoyalCup account and associated personal data on our secure account deletion page. This will open loyalcupapp.com/delete-account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Linking.openURL(DELETE_ACCOUNT_URL).catch(() => {
              Alert.alert(
                'Could Not Open Link',
                'Please visit loyalcupapp.com/delete-account to request account deletion.'
              );
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ── Notifications ── */}
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}><Feather name="bell" size={20} color="#00704A" /></View>
            <Text style={styles.settingLabel}>All Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#E0E0E0', true: '#00704A' }}
            thumbColor="#FFF"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}><Feather name="smartphone" size={20} color="#00704A" /></View>
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={handleTogglePush}
            trackColor={{ false: '#E0E0E0', true: '#00704A' }}
            thumbColor="#FFF"
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}><Feather name="mail" size={20} color="#00704A" /></View>
            <Text style={styles.settingLabel}>Email Notifications</Text>
          </View>
          <Switch
            value={emailEnabled}
            onValueChange={handleToggleEmail}
            trackColor={{ false: '#E0E0E0', true: '#00704A' }}
            thumbColor="#FFF"
            disabled={!notificationsEnabled}
          />
        </View>

        {/* ── Account ── */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Account</Text>

        <TouchableOpacity style={styles.settingItem} onPress={() => setEditProfileVisible(true)}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}><Feather name="user" size={20} color="#00704A" /></View>
            <Text style={styles.settingLabel}>Edit Profile</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setChangePasswordVisible(true)}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}><Feather name="lock" size={20} color="#00704A" /></View>
            <Text style={styles.settingLabel}>Change Password</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleOpenPrivacy}
        >
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}><Feather name="shield" size={20} color="#00704A" /></View>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#CCC" />
        </TouchableOpacity>

        {/* ── Support ── */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Support</Text>

        <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/help')}>
          <View style={styles.settingLeft}>
            <View style={styles.iconContainer}><Feather name="help-circle" size={20} color="#00704A" /></View>
            <Text style={styles.settingLabel}>Help & Support</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccountRequest}>
          <View style={styles.settingLeft}>
            <View style={[styles.iconContainer, styles.dangerIconContainer]}>
              <Feather name="trash-2" size={20} color="#B91C1C" />
            </View>
            <View>
              <Text style={[styles.settingLabel, styles.dangerLabel]}>Delete Account</Text>
              <Text style={styles.settingSubLabel}>Request account and data deletion</Text>
            </View>
          </View>
          <Feather name="external-link" size={18} color="#CCC" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={editProfileVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={profileName}
                onChangeText={setProfileName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profileEmail}
                editable={false}
              />
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditProfileVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                <Text style={styles.saveButtonText}>{savingProfile ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Change Password Modal ── */}
      <Modal
        visible={changePasswordVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setChangePasswordVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setChangePasswordVisible(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                <Text style={styles.saveButtonText}>{changingPassword ? 'Changing...' : 'Change'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#FAFAFA' },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerSide:        { width: 40, padding: 8 },
  headerTitle:       { fontSize: 20, fontWeight: '700', color: '#000' },
  scrollView:        { flex: 1, paddingHorizontal: 16 },
  sectionTitle:      { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 8 },
  settingItem:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#FFF', borderRadius: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  settingLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconContainer:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  dangerIconContainer: { backgroundColor: '#FEE2E2' },
  settingLabel:      { fontSize: 15, fontWeight: '600', color: '#000' },
  settingSubLabel:   { fontSize: 12, color: '#777', marginTop: 2 },
  dangerLabel:       { color: '#B91C1C' },
  modalOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent:      { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '88%', maxWidth: 400 },
  modalTitle:        { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 20, textAlign: 'center' },
  inputGroup:        { marginBottom: 16 },
  inputLabel:        { fontSize: 13, fontWeight: '600', marginBottom: 6, color: '#555' },
  input:             { borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 15, backgroundColor: '#FFF', color: '#000' },
  inputDisabled:     { backgroundColor: '#F5F5F5', color: '#999' },
  helperText:        { fontSize: 11, color: '#999', marginTop: 4 },
  modalButtons:      { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalButton:       { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelButton:      { backgroundColor: '#F5F5F5' },
  saveButton:        { backgroundColor: '#00704A' },
  cancelButtonText:  { fontSize: 15, fontWeight: '600', color: '#000' },
  saveButtonText:    { fontSize: 15, fontWeight: '600', color: '#FFF' },
});