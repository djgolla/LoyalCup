// loading skeleton component
// universal-coffee-shop/components/LoadingSkeleton.js
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function LoadingSkeleton({ width = '100%', height = 50, style }) {
  return (
    <View style={[styles.skeleton, { width, height }, style]} />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
});
