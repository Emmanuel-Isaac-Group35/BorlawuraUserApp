import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { BottomNavigation } from '../../components/feature/BottomNavigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { useSettings } from '../../context/SettingsContext';
import { typography } from '../../utils/typography';

const SupportPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const { settings } = useSettings();

  const contact = settings?.contact || {
    phone: '+233 30 000 0000',
    whatsapp: '+233 24 000 0000',
    email: 'support@borlawura.com'
  };

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
      subtitle: contact.phone,
      description: 'Available 24/7 for support',
      color: '#10b981',
      action: async () => {
        try { await Linking.openURL(`tel:${contact.phone.replace(/\s+/g, '')}`); } catch (e) { Alert.alert('Error', 'Unable to place call.'); }
      },
    },
    {
      icon: 'ri-whatsapp-fill',
      title: 'WhatsApp Chat',
      subtitle: contact.whatsapp,
      description: 'Quick responses on WhatsApp',
      color: '#25d366',
      action: async () => {
        try { 
          const cleanWa = contact.whatsapp.replace(/\D/g, '');
          await Linking.openURL(`https://wa.me/${cleanWa}`); 
        } catch (e) { Alert.alert('Error', 'Unable to open WhatsApp.'); }
      },
    },
    {
      icon: 'ri-mail-fill',
      title: 'Email Support',
      subtitle: contact.email,
      description: 'For detailed inquiries',
      color: '#3b82f6',
      action: async () => {
        try { await Linking.openURL(`mailto:${contact.email}`); } catch (e) { Alert.alert('Error', 'Unable to open email.'); }
      },
    },
  ];

  const handleFaqToggle = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content, 
          { 
            paddingTop: insets.top + 70, 
            paddingBottom: insets.bottom + 100 
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>Find answers or get in touch with our team</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <RemixIcon name="ri-search-2-line" size={20} color="#94a3b8" />
            <TextInput 
              placeholder="Search for help..."
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab('faq')} style={[styles.tab, activeTab === 'faq' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>FAQs</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('contact')} style={[styles.tab, activeTab === 'contact' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'contact' && styles.tabTextActive]}>Contact Us</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'faq' ? (
          <View style={styles.faqList}>
            {faqs.map((faq) => (
              <TouchableOpacity 
                key={faq.id} 
                onPress={() => handleFaqToggle(faq.id)} 
                activeOpacity={0.7}
                style={[styles.faqCard, expandedFaq === faq.id && styles.faqCardExpanded]}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <View style={[styles.faqIconBox, expandedFaq === faq.id && { backgroundColor: '#10b98110' }]}>
                    <RemixIcon name={expandedFaq === faq.id ? 'ri-subtract-line' : 'ri-add-line'} size={18} color="#10b981" />
                  </View>
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
          <View style={styles.contactContainer}>
            <View style={styles.contactList}>
              {contactMethods.map((method, index) => (
                <TouchableOpacity key={index} onPress={method.action} style={styles.contactCard} activeOpacity={0.8}>
                  <View style={[styles.contactIcon, { backgroundColor: method.color + '15' }]}>
                    <RemixIcon name={method.icon} size={28} color={method.color} />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactTitle}>{method.title}</Text>
                    <Text style={styles.contactValue}>{method.subtitle}</Text>
                  </View>
                  <RemixIcon name="ri-arrow-right-s-line" size={20} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formHeader}>Quick Message</Text>
              <View style={styles.formCard}>
                <TextInput 
                  placeholder="How can we help you?"
                  placeholderTextColor="#94a3b8"
                  multiline
                  style={styles.formInput}
                />
                <TouchableOpacity style={styles.formSubmit}>
                  <Text style={styles.formSubmitText}>Send Message</Text>
                  <RemixIcon name="ri-send-plane-fill" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.liveChatBanner} 
          activeOpacity={0.9}
          onPress={() => navigateTo('/support-chat')}
        >
          <View style={styles.liveChatInfo}>
            <Text style={styles.liveChatTitle}>Need Instant Help?</Text>
            <Text style={styles.liveChatSub}>Chat live with our support team</Text>
          </View>
          <View style={styles.liveChatBtn}>
            <Text style={styles.liveChatBtnText}>Chat Now</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 20 },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
  },
  header: { marginBottom: 28 },
  title: { 
    fontSize: 28, 
    fontFamily: typography.bold, 
    color: '#0f172a',
    letterSpacing: -0.8,
  },
  subtitle: { 
    fontSize: 15, 
    fontFamily: typography.medium, 
    color: '#64748b', 
    lineHeight: 22,
    marginTop: 4,
  },
  tabs: { 
    flexDirection: 'row', 
    backgroundColor: '#f1f5f9', 
    borderRadius: 18, 
    padding: 6, 
    marginBottom: 32 
  },
  tab: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 14, 
    alignItems: 'center' 
  },
  tabActive: { 
    backgroundColor: '#ffffff', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  tabText: { fontSize: 14, fontFamily: typography.semiBold, color: '#64748b' },
  tabTextActive: { color: '#10b981' },
  faqList: { gap: 16 },
  faqCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 30, 
    borderWidth: 1, 
    borderColor: '#f1f5f9', 
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  faqCardExpanded: { borderColor: '#10b98140' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQuestion: { 
    flex: 1, 
    fontSize: 16, 
    fontFamily: typography.semiBold, 
    color: '#1e293b', 
    lineHeight: 22,
    paddingRight: 12,
  },
  faqIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqAnswer: { 
    marginTop: 16, 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9' 
  },
  faqAnswerText: { fontSize: 14, fontFamily: typography.medium, color: '#64748b', lineHeight: 22 },
  contactContainer: { gap: 32 },
  contactList: { gap: 16 },
  contactCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    padding: 18, 
    borderRadius: 30, 
    borderWidth: 1, 
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  contactIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 10, fontFamily: typography.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  contactValue: { fontSize: 16, fontFamily: typography.bold, color: '#1e293b', marginTop: 2 },
  formSection: { gap: 12 },
  formHeader: { fontSize: 13, fontFamily: typography.bold, color: '#64748b', textTransform: 'uppercase', paddingLeft: 8 },
  formCard: { 
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  formInput: {
    minHeight: 100,
    fontSize: 15,
    fontFamily: typography.medium,
    color: '#0f172a',
    textAlignVertical: 'top',
    padding: 8,
  },
  formSubmit: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 20,
    marginTop: 12,
  },
  formSubmitText: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
  liveChatBanner: { 
    backgroundColor: '#0f172a', 
    borderRadius: 30, 
    padding: 24, 
    marginTop: 32, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  liveChatInfo: { flex: 1 },
  liveChatTitle: { fontSize: 20, fontFamily: typography.bold, color: '#ffffff', letterSpacing: -0.4 },
  liveChatSub: { fontSize: 13, fontFamily: typography.medium, color: '#94a3b8', marginTop: 4 },
  liveChatBtn: { backgroundColor: '#10b981', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  liveChatBtnText: { fontSize: 14, fontFamily: typography.bold, color: '#ffffff' },
});

export default SupportPage;
