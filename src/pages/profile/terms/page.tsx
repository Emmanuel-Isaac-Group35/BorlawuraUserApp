import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation } from '../../../components/feature/Navigation';
import { BottomNavigation } from '../../../components/feature/BottomNavigation';
import { RemixIcon } from '../../../utils/icons';
import { useNavigation } from '@react-navigation/native';

const TermsPage: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('terms');

  const termsContent = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing and using Borla Wura\'s services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our services.'
    },
    {
      title: '2. Service Description',
      content: 'Borla Wura provides on-demand waste collection and disposal services. We connect users with verified waste collection riders who pick up and properly dispose of household and commercial waste.'
    },
    {
      title: '3. User Responsibilities',
      content: 'Users are responsible for:\n• Providing accurate pickup location information\n• Ensuring waste is properly bagged and ready for collection\n• Not including hazardous or prohibited materials\n• Making timely payments for services rendered'
    },
    {
      title: '4. Payment Terms',
      content: 'All payments are processed securely through our platform. Prices are displayed before booking confirmation. Cancellation fees may apply for late cancellations.'
    },
    {
      title: '5. Prohibited Items',
      content: 'We do not collect:\n• Hazardous materials and chemicals\n• Medical and biohazard waste\n• Electronic waste (e-waste)\n• Construction debris'
    },
    {
      title: '6. Limitation of Liability',
      content: 'Borla Wura is not liable for any indirect, incidental, or consequential damages arising from the use of our services. Our liability is limited to the amount paid for the specific service.'
    },
    {
      title: '7. Changes to Terms',
      content: 'We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or app notification.'
    }
  ];

  const privacyContent = [
    {
      title: '1. Information We Collect',
      content: 'We collect the following information:\n• Personal information (name, email, phone number)\n• Location data for service delivery\n• Payment information\n• Service usage data'
    },
    {
      title: '2. How We Use Your Information',
      content: 'Your information is used to:\n• Provide and improve our services\n• Process payments and transactions\n• Send service updates and notifications\n• Communicate promotional offers (with consent)'
    },
    {
      title: '3. Data Security',
      content: 'We implement industry-standard security measures to protect your personal information. All payment data is encrypted and processed through secure payment gateways.'
    },
    {
      title: '4. Information Sharing',
      content: 'We do not sell your personal information. We may share data with service providers necessary for operations (payment processors, delivery partners) under strict confidentiality agreements.'
    },
    {
      title: '5. Your Rights',
      content: 'You have the right to:\n• Access your personal data\n• Request data correction or deletion\n• Opt-out of marketing communications\n• Withdraw consent for data processing'
    },
    {
      title: '6. Cookies and Tracking',
      content: 'We use cookies and similar technologies to enhance user experience, analyze usage patterns, and deliver personalized content. You can manage cookie preferences in your browser settings.'
    },
    {
      title: '7. Contact Us',
      content: 'For privacy-related questions or to exercise your rights, contact us at privacy@borlawura.com or call +233 30 123 4567.'
    }
  ];

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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <RemixIcon name="ri-arrow-left-line" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Legal Information</Text>
            <Text style={styles.subtitle}>Terms of service and privacy policy</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('terms')}
            style={[
              styles.tab,
              activeTab === 'terms' && styles.tabActive
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'terms' && styles.tabTextActive
            ]}>
              Terms of Service
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('privacy')}
            style={[
              styles.tab,
              activeTab === 'privacy' && styles.tabActive
            ]}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'privacy' && styles.tabTextActive
            ]}>
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contentCard}>
          <View style={styles.contentHeader}>
            <Text style={styles.contentTitle}>
              {activeTab === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
            </Text>
            <Text style={styles.contentDate}>
              Last updated: January 15, 2024
            </Text>
          </View>

          <View style={styles.contentList}>
            {(activeTab === 'terms' ? termsContent : privacyContent).map((item, index) => (
              <View key={index} style={styles.contentItem}>
                <Text style={styles.contentItemTitle}>{item.title}</Text>
                <Text style={styles.contentItemText}>{item.content}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsPage;

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
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
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contentHeader: {
    marginBottom: 24,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  contentDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  contentList: {
    gap: 24,
  },
  contentItem: {
    gap: 8,
  },
  contentItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  contentItemText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});
