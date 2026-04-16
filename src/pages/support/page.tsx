import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { BottomNavigation } from '../../components/feature/BottomNavigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';

import { typography } from '../../utils/typography';

const SupportPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: 'How quickly can I get my waste picked up?',
      answer: 'Our Instant Pickup service guarantees collection within 30 minutes during business hours (6 AM - 10 PM).',
    },
    {
      id: 2,
      question: 'What types of waste do you collect?',
      answer: 'We collect general household waste and bulk items. We do not collect hazardous materials or electronics.',
    },
    {
      id: 3,
      question: 'How is pricing calculated?',
      answer: 'Pricing is based on service type, bag size, and waste category. Check the Services section for details.',
    },
    {
      id: 4,
      question: 'What payment methods do you accept?',
      answer: 'We accept Mobile Money (MTN, Vodafone, AirtelTigo), debit/credit cards, and in-app wallet payments.',
    },
  ];

  const contactMethods = [
    {
      icon: 'ri-phone-fill',
      title: 'Voice Call',
      subtitle: '+233 30 123 4567',
      description: 'Available 24/7 for support',
      color: '#10b981',
      action: async () => {
        try { await Linking.openURL('tel:+233301234567'); } catch (e) { Alert.alert('Error', 'Unable to place call.'); }
      },
    },
    {
      icon: 'ri-whatsapp-fill',
      title: 'WhatsApp Chat',
      subtitle: '+233 24 567 8901',
      description: 'Quick responses on WhatsApp',
      color: '#25d366',
      action: async () => {
        try { await Linking.openURL('https://wa.me/233245678901'); } catch (e) { Alert.alert('Error', 'Unable to open WhatsApp.'); }
      },
    },
    {
      icon: 'ri-mail-fill',
      title: 'Email Support',
      subtitle: 'support@borlawura.com',
      description: 'For detailed inquiries',
      color: '#3b82f6',
      action: async () => {
        try { await Linking.openURL('mailto:support@borlawura.com'); } catch (e) { Alert.alert('Error', 'Unable to open email.'); }
      },
    },
  ];

  const handleFaqToggle = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      <BottomNavigation />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { 
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + 130 // Increased to ensure clear separation from BottomNav
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>Find answers or get in touch with our team</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('faq')}
            style={[styles.tab, activeTab === 'faq' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>FAQs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('contact')}
            style={[styles.tab, activeTab === 'contact' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'contact' && styles.tabTextActive]}>Contact Us</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'faq' ? (
          <View style={styles.faqList}>
            {faqs.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                onPress={() => handleFaqToggle(faq.id)}
                activeOpacity={0.8}
                style={[styles.faqCard, expandedFaq === faq.id && styles.faqCardExpanded]}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <RemixIcon
                    name={expandedFaq === faq.id ? 'ri-subtract-line' : 'ri-add-line'}
                    size={20}
                    color="#64748b"
                  />
                </View>
                {expandedFaq === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.contactList}>
            {contactMethods.map((method, index) => (
              <TouchableOpacity
                key={index}
                onPress={method.action}
                style={styles.contactCard}
                activeOpacity={0.8}
              >
                <View style={[styles.contactIcon, { backgroundColor: method.color + '15' }]}>
                  <RemixIcon name={method.icon} size={24} color={method.color} />
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactTitle}>{method.title}</Text>
                  <Text style={styles.contactValue}>{method.subtitle}</Text>
                  <Text style={styles.contactDesc}>{method.description}</Text>
                </View>
                <RemixIcon name="ri-arrow-right-s-line" size={24} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.liveChatBanner}>
          <View style={styles.liveChatInfo}>
            <Text style={styles.liveChatTitle}>Need Instant Help?</Text>
            <Text style={styles.liveChatSub}>Chat live with our support team</Text>
          </View>
          <TouchableOpacity style={styles.liveChatBtn} onPress={() => navigateTo('/support-chat')}>
            <Text style={styles.liveChatBtnText}>Chat Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: typography.bold,
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: typography.medium,
    color: '#64748b',
    lineHeight: 22,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontFamily: typography.semiBold,
    color: '#64748b',
  },
  tabTextActive: {
    color: '#10b981',
  },
  faqList: {
    gap: 16,
  },
  faqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
  },
  faqCardExpanded: {
    borderColor: '#10b98120',
    backgroundColor: '#f0fdf450',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontFamily: typography.semiBold,
    color: '#1e293b',
    paddingRight: 10,
  },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  faqAnswerText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#475569',
    lineHeight: 22,
  },
  contactList: {
    gap: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 12,
    fontFamily: typography.semiBold,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  contactValue: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#1e293b',
    marginTop: 2,
  },
  contactDesc: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: '#94a3b8',
    marginTop: 4,
  },
  liveChatBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveChatInfo: {
    flex: 1,
  },
  liveChatTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
  liveChatSub: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: '#94a3b8',
    marginTop: 4,
  },
  liveChatBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  liveChatBtnText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
});

export default SupportPage;
