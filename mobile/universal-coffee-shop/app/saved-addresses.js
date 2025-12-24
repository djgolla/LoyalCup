// Saved addresses screen
// universal-coffee-shop/app/saved-addresses.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SavedAddressesScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState([
    {
      id: '1',
      label: 'Home',
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      isDefault: true,
    },
    {
      id: '2',
      label: 'Work',
      street: '456 Market Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94103',
      isDefault: false,
    },
  ]);

  const handleSetDefault = (id) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  const handleRemoveAddress = (id) => {
    Alert.alert(
      'Remove Address',
      'Are you sure you want to remove this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setAddresses(addresses.filter(addr => addr.id !== id));
          }
        }
      ]
    );
  };

  const handleAddAddress = () => {
    Alert.alert(
      'Add Address',
      'Address management will be fully functional in the next update. For now, this is a preview of the saved addresses screen.'
    );
  };

  const handleEditAddress = (address) => {
    Alert.alert(
      'Edit Address',
      'Address editing will be available in the next update.'
    );
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
          <Text style={styles.headerTitle}>SAVED ADDRESSES</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          {addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressIconContainer}>
                <Feather 
                  name={address.label === 'Home' ? 'home' : address.label === 'Work' ? 'briefcase' : 'map-pin'} 
                  size={24} 
                  color="#000" 
                />
              </View>
              
              <View style={styles.addressInfo}>
                <View style={styles.addressLabelRow}>
                  <Text style={styles.addressLabel}>{address.label}</Text>
                  {address.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressStreet}>{address.street}</Text>
                <Text style={styles.addressCity}>
                  {address.city}, {address.state} {address.zip}
                </Text>
              </View>

              <View style={styles.addressActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditAddress(address)}>
                  <Feather name="edit-2" size={18} color="#000" />
                </TouchableOpacity>
                {!address.isDefault && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(address.id)}>
                    <Feather name="star" size={18} color="#000" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRemoveAddress(address.id)}>
                  <Feather name="trash-2" size={18} color="#FF0000" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddAddress}>
            <Feather name="plus" size={24} color="#FFF" />
            <Text style={styles.addButtonText}>ADD NEW ADDRESS</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Feather name="info" size={20} color="#666" />
            <Text style={styles.infoText}>
              Save your frequently used addresses for faster checkout and delivery.
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
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'flex-start',
  },
  addressIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  addressInfo: {
    flex: 1,
    marginLeft: 15,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 5,
  },
  addressLabel: {
    fontSize: 18,
    fontFamily: 'Anton-Regular',
  },
  defaultBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Anton-Regular',
  },
  addressStreet: {
    fontSize: 16,
    color: '#333',
    marginBottom: 3,
  },
  addressCity: {
    fontSize: 14,
    color: '#666',
  },
  addressActions: {
    flexDirection: 'column',
    gap: 10,
  },
  actionButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#000',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
  },
  addButtonText: {
    color: '#FFF',
    fontFamily: 'Anton-Regular',
    fontSize: 16,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
