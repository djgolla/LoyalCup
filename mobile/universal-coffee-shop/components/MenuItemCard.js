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
          <Feather name="coffee" size={32} color="#64748B" />
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 15,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#E5E7EB',
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
    fontWeight: '900',
    color: '#101828',
    marginBottom: 5,
  },
  itemDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F97316',
  },
  addButton: {
    width: 44,
    height: 44,
    backgroundColor: '#101828',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
