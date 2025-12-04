// universal-coffee-shop/components/CoffeeShopCard.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function CoffeeShopCard({ shop }) {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: shop.color }]}>
      {/* image here later*/}
      <View style={styles.logo} />
      
      <Text style={styles.shopName}>{shop.name}</Text>
      <TouchableOpacity style={styles.favoriteButton} onPress={() => setIsFavorited(!isFavorited)}>
        <Feather name="heart" size={24} color={isFavorited ? '#FFFFFF' : '#000000'} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 50,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#000',
  },
  // circle logo - later
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF', // White -fix with logos later
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#000',
  },
  shopName: {
    flex: 1,
    fontSize: 20,
    color: '#000',
    fontFamily: 'Anton-Regular',
    textTransform: 'uppercase',
  },
  favoriteButton: {
    padding: 5,
  },
});