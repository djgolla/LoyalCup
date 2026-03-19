/**
 * ReviewModal — tap a star, optionally write a note, submit
 * Props: visible, orderId, shopId, shopName, onClose, onSubmitted
 */
import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function ReviewModal({ visible, orderId, shopId, shopName, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setRating(0); setBody(''); setError(''); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please pick a star rating'); return; }
    setSubmitting(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { error: dbErr } = await supabase.from('reviews').upsert({
        shop_id: shopId,
        user_id: user.id,
        order_id: orderId,
        rating,
        body: body.trim() || null,
      }, { onConflict: 'user_id,order_id' });

      if (dbErr) throw dbErr;
      reset();
      onSubmitted?.();
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Rate your order</Text>
              {shopName ? <Text style={styles.subtitle}>{shopName}</Text> : null}
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Stars */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)} style={styles.starBtn} activeOpacity={0.7}>
                <Feather
                  name="star"
                  size={40}
                  color={n <= rating ? '#F59E0B' : '#E5E7EB'}
                  style={{ fill: n <= rating ? '#F59E0B' : 'none' }}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {['', 'Terrible', 'Poor', 'Okay', 'Good', 'Excellent!'][rating] || 'Tap to rate'}
          </Text>

          {/* Text */}
          <TextInput
            style={styles.input}
            placeholder="Leave a comment (optional)"
            placeholderTextColor="#9CA3AF"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, (submitting || rating === 0) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
            activeOpacity={0.8}
          >
            {submitting
              ? <ActivityIndicator color="#FFF" />
              : <Text style={styles.submitText}>Submit Review</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 20, fontWeight: '700', color: '#000' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 2 },
  closeBtn: { padding: 4, marginTop: 2 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 24, paddingBottom: 4 },
  starBtn: { padding: 4 },
  ratingLabel: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#F59E0B', minHeight: 24, marginBottom: 16 },
  input: { marginHorizontal: 20, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 15, color: '#000', textAlignVertical: 'top', minHeight: 80, marginBottom: 12 },
  error: { marginHorizontal: 20, color: '#EF4444', fontSize: 13, marginBottom: 8 },
  submitBtn: { marginHorizontal: 20, backgroundColor: '#000', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});