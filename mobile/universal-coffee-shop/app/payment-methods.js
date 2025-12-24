// Payment methods screen
// universal-coffee-shop/app/payment-methods.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState([
    { id: '1', type: 'visa', last4: '4242', expiryMonth: '12', expiryYear: '25', isDefault: true },
    { id: '2', type: 'mastercard', last4: '8888', expiryMonth: '09', expiryYear: '26', isDefault: false },
  ]);

  const getCardIcon = (type) => {
    switch (type) {
      case 'visa':
        return 'credit-card';
      case 'mastercard':
        return 'credit-card';
      case 'amex':
        return 'credit-card';
      default:
        return 'credit-card';
    }
  };

  const getCardName = (type) => {
    switch (type) {
      case 'visa':
        return 'Visa';
      case 'mastercard':
        return 'Mastercard';
      case 'amex':
        return 'American Express';
      default:
        return 'Card';
    }
  };

  const handleSetDefault = (id) => {
    setPaymentMethods(paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id
    })));
  };

  const handleRemoveCard = (id) => {
    Alert.alert(
      'Remove Card',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(paymentMethods.filter(method => method.id !== id));
          }
        }
      ]
    );
  };

  const handleAddCard = () => {
    Alert.alert(
      'Add Payment Method',
      'Payment processing will be available in the next update. For now, this is a preview of the payment methods screen.'
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
          <Text style={styles.headerTitle}>PAYMENT METHODS</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.cardContainer}>
              <View style={styles.cardIconContainer}>
                <Feather name={getCardIcon(method.type)} size={32} color="#000" />
              </View>
              
              <View style={styles.cardInfo}>
                <Text style={styles.cardType}>{getCardName(method.type)}</Text>
                <Text style={styles.cardNumber}>•••• {method.last4}</Text>
                <Text style={styles.cardExpiry}>Expires {method.expiryMonth}/{method.expiryYear}</Text>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardActions}>
                {!method.isDefault && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleSetDefault(method.id)}>
                    <Text style={styles.actionButtonText}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveCard(method.id)}>
                  <Feather name="trash-2" size={20} color="#FF0000" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddCard}>
            <Feather name="plus" size={24} color="#FFF" />
            <Text style={styles.addButtonText}>ADD NEW CARD</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Feather name="info" size={20} color="#666" />
            <Text style={styles.infoText}>
              Your payment information is securely stored and encrypted. We never store your full card number.
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
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 15,
  },
  cardType: {
    fontSize: 18,
    fontFamily: 'Anton-Regular',
    marginBottom: 3,
  },
  cardNumber: {
    fontSize: 16,
    color: '#666',
    marginBottom: 3,
  },
  cardExpiry: {
    fontSize: 12,
    color: '#999',
  },
  defaultBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  defaultBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Anton-Regular',
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 15,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Anton-Regular',
  },
  removeButton: {
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
