import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { useSettings } from '../../context/SettingsContext';
import { typography } from '../../utils/typography';
import { LinearGradient } from 'expo-linear-gradient';

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
          <Text style={styles.title}>System Support</Text>
          <Text style={styles.subtitle}>Dispatch center for FAQs and immediate logistics support</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <RemixIcon name="ri-search-eye-line" size={18} color="#94a3b8" />
            <TextInput 
              placeholder="Search support articles..."
              placeholderTextColor="#cbd5e1"
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab('faq')} style={[styles.tab, activeTab === 'faq' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>Knowledge</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('contact')} style={[styles.tab, activeTab === 'contact' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'contact' && styles.tabTextActive]}>Dispatch</Text>
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
                  <View style={[styles.faqIconBox, expandedFaq === faq.id && { backgroundColor: '#059669' }]}>
                    <RemixIcon name={expandedFaq === faq.id ? 'ri-subtract-line' : 'ri-add-line'} size={18} color={expandedFaq === faq.id ? '#fff' : '#059669'} />
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
                  <View style={[styles.contactIcon, { backgroundColor: method.color + '10' }]}>
                    <RemixIcon name={method.icon} size={24} color={method.color} />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactTitle}>{method.title}</Text>
                    <Text style={styles.contactValue}>{method.subtitle}</Text>
                  </View>
                  <RemixIcon name="ri-arrow-right-line" size={16} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formHeader}>Direct Message</Text>
              <View style={styles.formCard}>
                <TextInput 
                  placeholder="Inquiry or issue details..."
                  placeholderTextColor="#cbd5e1"
                  multiline
                  style={styles.formInput}
                />
                <TouchableOpacity style={styles.formSubmit}>
                  <Text style={styles.formSubmitText}>Dispatch Inquiry</Text>
                  <RemixIcon name="ri-send-plane-fill" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.liveChatBanner}
        >
          <View style={styles.liveChatInfo}>
            <Text style={styles.liveChatTitle}>Support Line Live</Text>
            <Text style={styles.liveChatSub}>Connect with a human dispatcher instantly</Text>
          </View>
          <TouchableOpacity 
            style={styles.liveChatBtn}
            onPress={() => navigateTo('/support-chat')}
          >
            <Text style={styles.liveChatBtnText}>Chat Live</Text>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
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
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2 
  },
  tabText: { fontSize: 13, fontFamily: typography.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabTextActive: { color: '#059669' },
  faqList: { gap: 16 },
  faqCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#f1f5f9', 
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  faqCardExpanded: { borderColor: '#05966930' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQuestion: { 
    flex: 1, 
    fontSize: 16, 
    fontFamily: typography.bold, 
    color: '#1e293b', 
    lineHeight: 24,
    paddingRight: 12,
  },
  faqIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqAnswer: { 
    marginTop: 20, 
    paddingTop: 20, 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9' 
  },
  faqAnswerText: { fontSize: 14, fontFamily: typography.medium, color: '#64748b', lineHeight: 24 },
  contactContainer: { gap: 32 },
  contactList: { gap: 16 },
  contactCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    padding: 20, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  contactIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 10, fontFamily: typography.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  contactValue: { fontSize: 15, fontFamily: typography.bold, color: '#1e293b', marginTop: 2 },
  formSection: { gap: 16 },
  formHeader: { fontSize: 13, fontFamily: typography.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, paddingLeft: 8 },
  formCard: { 
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  formInput: {
    minHeight: 120,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
    textAlignVertical: 'top',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  formSubmit: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 16,
    marginTop: 20,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  formSubmitText: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
  liveChatBanner: { 
    borderRadius: 28, 
    padding: 28, 
    marginTop: 40, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  liveChatInfo: { flex: 1 },
  liveChatTitle: { fontSize: 20, fontFamily: typography.bold, color: '#ffffff', letterSpacing: -0.5 },
  liveChatSub: { fontSize: 13, fontFamily: typography.medium, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  liveChatBtn: { backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  liveChatBtnText: { fontSize: 14, fontFamily: typography.bold, color: '#0f172a' },
});

export default SupportPage;
