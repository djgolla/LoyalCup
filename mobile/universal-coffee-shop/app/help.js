// Help & Support screen
// universal-coffee-shop/app/help.js
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [contactMessage, setContactMessage] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);

  const faqs = [
    {
      id: '1',
      question: 'How do I earn loyalty points?',
      answer: 'You earn loyalty points with every purchase at participating coffee shops. The amount of points varies by shop, but typically you earn 1 point per dollar spent.',
    },
    {
      id: '2',
      question: 'How do I redeem my rewards?',
      answer: 'Go to the Rewards section in your profile to view available rewards. When you have enough points, tap on a reward to redeem it. You can then use it at checkout.',
    },
    {
      id: '3',
      question: 'Can I order ahead for pickup?',
      answer: 'Yes! Browse a shop\'s menu, add items to your cart, and select "Pickup" at checkout. You\'ll receive a notification when your order is ready.',
    },
    {
      id: '4',
      question: 'How do I change my payment method?',
      answer: 'Go to Profile > Settings > Payment Methods to add, remove, or set a default payment method.',
    },
    {
      id: '5',
      question: 'What if there\'s an issue with my order?',
      answer: 'Contact the shop directly through the app, or use the contact form below to reach our support team. We\'ll help resolve any issues quickly.',
    },
    {
      id: '6',
      question: 'How do I find nearby coffee shops?',
      answer: 'The home screen shows nearby shops based on your location. You can also search for specific shops or browse by distance.',
    },
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleSendMessage = () => {
    if (!contactMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    Alert.alert(
      'Message Sent',
      'Thank you for contacting us! We\'ll get back to you within 24 hours.',
      [
        {
          text: 'OK',
          onPress: () => {
            setContactMessage('');
            setShowContactForm(false);
          }
        }
      ]
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
          <Text style={styles.headerTitle}>HELP & SUPPORT</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>

          {faqs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqItem}
              onPress={() => toggleFaq(faq.id)}>
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Feather 
                  name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color="black" 
                />
              </View>
              {expandedFaq === faq.id && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>CONTACT US</Text>

          <View style={styles.contactOptions}>
            <TouchableOpacity style={styles.contactOption}>
              <View style={styles.contactIconContainer}>
                <Feather name="mail" size={24} color="#000" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>support@loyalcup.com</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactOption}>
              <View style={styles.contactIconContainer}>
                <Feather name="phone" size={24} color="#000" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>1-800-LOYAL-CUP</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactOption}>
              <View style={styles.contactIconContainer}>
                <Feather name="clock" size={24} color="#000" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Hours</Text>
                <Text style={styles.contactValue}>Mon-Fri: 9am - 6pm PST</Text>
              </View>
            </TouchableOpacity>
          </View>

          {!showContactForm ? (
            <TouchableOpacity 
              style={styles.contactFormButton}
              onPress={() => setShowContactForm(true)}>
              <Feather name="message-circle" size={20} color="#FFF" />
              <Text style={styles.contactFormButtonText}>SEND US A MESSAGE</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.contactForm}>
              <Text style={styles.formLabel}>Your Message</Text>
              <TextInput
                style={styles.messageInput}
                placeholder="Describe your issue or question..."
                multiline
                numberOfLines={6}
                value={contactMessage}
                onChangeText={setContactMessage}
                textAlignVertical="top"
              />
              <View style={styles.formButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowContactForm(false);
                    setContactMessage('');
                  }}>
                  <Text style={styles.cancelButtonText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.sendButton}
                  onPress={handleSendMessage}>
                  <Text style={styles.sendButtonText}>SEND MESSAGE</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Anton-Regular',
    color: '#666',
    marginBottom: 15,
    letterSpacing: 1,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 15,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Anton-Regular',
    marginRight: 10,
  },
  faqAnswer: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  divider: {
    height: 2,
    backgroundColor: '#000',
    marginVertical: 30,
  },
  contactOptions: {
    marginBottom: 20,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  contactIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  contactInfo: {
    marginLeft: 15,
  },
  contactLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  contactValue: {
    fontSize: 16,
    fontFamily: 'Anton-Regular',
  },
  contactFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#000',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
  },
  contactFormButtonText: {
    color: '#FFF',
    fontFamily: 'Anton-Regular',
    fontSize: 16,
  },
  contactForm: {
    marginTop: 10,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: 'Anton-Regular',
    marginBottom: 10,
  },
  messageInput: {
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 150,
    marginBottom: 15,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Anton-Regular',
    fontSize: 14,
  },
  sendButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#000',
    borderRadius: 10,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFF',
    fontFamily: 'Anton-Regular',
    fontSize: 14,
  },
});
