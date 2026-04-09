import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { BottomNavigation } from '../../components/feature/BottomNavigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';

const SupportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: 'How quickly can I get my waste picked up?',
      answer: 'Our Instant Pickup service guarantees collection within 30 minutes during business hours (6 AM - 10 PM). For Scheduled Pickup, you can book up to 7 days in advance.',
    },
    {
      id: 2,
      question: 'What types of waste do you collect?',
      answer: 'We collect general household waste and bulk items. We do not collect hazardous materials, electronics, or medical waste.',
    },
    {
      id: 3,
      question: 'How is pricing calculated?',
      answer: 'Pricing is based on service type (Instant vs Scheduled), bag size, and waste category. Detailed service descriptions are available in the Services section.',
    },
    {
      id: 4,
      question: 'What payment methods do you accept?',
      answer: 'We accept Mobile Money (MTN, Vodafone, AirtelTigo), debit/credit cards, and in-app wallet payments. Payment is processed securely after successful pickup.',
    },
    {
      id: 5,
      question: 'Can I track my rider in real-time?',
      answer: "Yes! Once a rider is assigned, you can track their location in real-time through our app. You'll also receive notifications about pickup status updates.",
    },
    {
      id: 6,
      question: 'What if I need to cancel my pickup?',
      answer: 'You can cancel your pickup up to 15 minutes before the scheduled time without any charges. Cancellations after this period may incur a small fee.',
    },
    {
      id: 7,
      question: 'How do I become a Wura Rider?',
      answer: "To become a rider, you need a registered tricycle, valid driver's license, and insurance. Apply through our rider app and complete our verification process.",
    },
    {
      id: 8,
      question: 'What areas do you serve?',
      answer: "We currently serve Accra, Tema, Kumasi, Takoradi, and Cape Coast. We're expanding to more cities soon. Check our app for service availability in your area.",
    },
  ];

  const contactMethods = [
    {
      icon: 'ri-phone-line',
      title: 'Call Us',
      subtitle: '+233 30 123 4567',
      description: 'Available 24/7 for urgent issues',
      action: async () => {
        try {
          await Linking.openURL('tel:+233301234567');
        } catch (e) {
          Alert.alert('Error', 'Unable to place the call. Please try again later.');
        }
      },
    },
    {
      icon: 'ri-whatsapp-line',
      title: 'WhatsApp',
      subtitle: '+233 24 567 8901',
      description: 'Quick responses during business hours',
      action: async () => {
        try {
          await Linking.openURL('https://wa.me/233245678901');
        } catch (e) {
          Alert.alert('Error', 'Unable to open WhatsApp. Please try again later.');
        }
      },
    },
    {
      icon: 'ri-mail-line',
      title: 'Email Support',
      subtitle: 'borlawuraapp@gmail.com',
      description: 'Detailed inquiries and feedback',
      action: async () => {
        try {
          await Linking.openURL('mailto:borlawuraapp@gmail.com');
        } catch (e) {
          Alert.alert('Error', 'Unable to open email client. Please try again later.');
        }
      },
    },
    {
      icon: 'ri-chat-3-line',
      title: 'Live Chat',
      subtitle: 'Customer Support Personnel', // Updated subtitle
      description: 'Instant help with order issues',
      action: () => {
        navigateTo('/support-chat');
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Help & Support</Text>
          <Text style={styles.subtitle}>We're here to help you with any questions or issues</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('faq')}
            style={[
              styles.tab,
              activeTab === 'faq' && styles.tabActive
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'faq' && styles.tabTextActive
            ]}>
              FAQ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('contact')}
            style={[
              styles.tab,
              activeTab === 'contact' && styles.tabActive
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'contact' && styles.tabTextActive
            ]}>
              Contact Us
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'faq' && (
          <View style={styles.faqContainer}>
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <RemixIcon name="ri-question-line" size={24} color="#10b981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Frequently Asked Questions</Text>
                <Text style={styles.infoSubtitle}>Find quick answers to common questions</Text>
              </View>
            </View>

            <View style={styles.faqList}>
              {faqs.map((faq) => (
                <View key={faq.id} style={styles.faqCard}>
                  <TouchableOpacity
                    onPress={() => handleFaqToggle(faq.id)}
                    style={styles.faqHeader}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <View style={styles.faqIcon}>
                      <RemixIcon
                        name={expandedFaq === faq.id ? 'ri-subtract-line' : 'ri-add-line'}
                        size={24}
                        color="#9ca3af"
                      />
                    </View>
                  </TouchableOpacity>

                  {expandedFaq === faq.id && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.helpCard}>
              <View style={styles.helpIcon}>
                <RemixIcon name="ri-lightbulb-line" size={20} color="#ffffff" />
              </View>
              <Text style={styles.helpTitle}>Still need help?</Text>
              <Text style={styles.helpText}>
                Can't find what you're looking for? Our support team is ready to assist you.
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTab('contact')}
                style={styles.helpButton}
              >
                <Text style={styles.helpButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'contact' && (
          <View style={styles.contactContainer}>
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <RemixIcon name="ri-customer-service-2-line" size={24} color="#3b82f6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Get in Touch</Text>
                <Text style={styles.infoSubtitle}>Choose your preferred way to reach us</Text>
              </View>
            </View>

            <View style={styles.contactMethods}>
              {contactMethods.map((method, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={method.action}
                  style={styles.contactCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.contactIconContainer}>
                    <RemixIcon name={method.icon} size={24} color="#4b5563" />
                  </View>

                  <View style={styles.contactInfo}>
                    <Text style={styles.contactTitle}>{method.title}</Text>
                    <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
                    <Text style={styles.contactDescription}>{method.description}</Text>
                  </View>

                  <RemixIcon name="ri-arrow-right-s-line" size={24} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.emergencyCard}>
              <View style={styles.emergencyIcon}>
                <RemixIcon name="ri-alarm-warning-line" size={20} color="#ffffff" />
              </View>
              <Text style={styles.emergencyTitle}>Emergency Support</Text>
              <Text style={styles.emergencyText}>
                For urgent issues or safety concerns during pickup
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await Linking.openURL('tel:+233301234567');
                  } catch (e) {
                    Alert.alert('Error', 'Unable to place the call. Please try again later.');
                  }
                }}
                style={styles.emergencyButton}
              >
                <RemixIcon name="ri-phone-line" size={20} color="#ffffff" />
                <Text style={styles.emergencyButtonText}>Call Emergency Line</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hoursCard}>
              <Text style={styles.hoursTitle}>Business Hours</Text>
              <View style={styles.hoursList}>
                <View style={styles.hoursRow}>
                  <Text style={styles.hoursLabel}>Monday - Friday</Text>
                  <Text style={styles.hoursValue}>6:00 AM - 10:00 PM</Text>
                </View>
                <View style={styles.hoursRow}>
                  <Text style={styles.hoursLabel}>Saturday</Text>
                  <Text style={styles.hoursValue}>7:00 AM - 9:00 PM</Text>
                </View>
                <View style={styles.hoursRow}>
                  <Text style={styles.hoursLabel}>Sunday</Text>
                  <Text style={styles.hoursValue}>8:00 AM - 8:00 PM</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SupportPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 80,
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  tabTextActive: {
    color: '#10b981',
  },
  faqContainer: {
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  faqList: {
    gap: 16,
    marginBottom: 24,
  },
  faqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
    paddingRight: 16,
  },
  faqIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    paddingTop: 12,
  },
  helpCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  helpIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#065f46',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 12,
  },
  helpButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  contactContainer: {
    gap: 16,
  },
  contactMethods: {
    gap: 16,
    marginBottom: 24,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  emergencyCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  emergencyIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#991b1b',
    marginBottom: 8,
  },
  emergencyText: {
    fontSize: 14,
    color: '#b91c1c',
    marginBottom: 12,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 8,
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  hoursCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  hoursTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 12,
  },
  hoursList: {
    gap: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursLabel: {
    fontSize: 14,
    color: '#4b5563',
  },
  hoursValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
});
