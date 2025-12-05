// error message component
// universal-coffee-shop/components/ErrorMessage.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function ErrorMessage({ message = 'Something went wrong' }) {
  return (
    <View style={styles.container}>
      <Feather name="alert-circle" size={48} color="#F44336" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
