// menu item card component
// universal-coffee-shop/components/MenuItemCard.js
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function MenuItemCard({ item, onAddToCart }) {
  return (
    <View style={styles.card}>
      {item.image_url ? (
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.itemImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Feather name="coffee" size={32} color="#666" />
        </View>
      )}
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description && item.description.trim() && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={styles.itemPrice}>${item.price?.toFixed(2) || '0.00'}</Text>
      </View>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => onAddToCart(item)}>
        <Feather name="plus" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 15,
    backgroundColor: '#FFF',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 15,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
    marginRight: 15,
  },
  itemName: {
    fontSize: 18,
    fontFamily: 'Anton-Regular',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: 'Anton-Regular',
    color: '#000',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#000',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
