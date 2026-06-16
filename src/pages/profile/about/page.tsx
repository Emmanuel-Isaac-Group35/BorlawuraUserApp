import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../../components/feature/Navigation';
import { RemixIcon } from '../../../utils/icons';
import { typography } from '../../../utils/typography';

const AboutPage: React.FC = () => {
  const insets = useSafeAreaInsets();

  const features = [
    {
      icon: 'ri-flashlight-line',
      title: 'Instant Pickup',
      description: '30-minute response time for urgent waste collection'
    },
    {
      icon: 'ri-map-pin-user-line',
      title: 'Real-time Tracking',
      description: 'Track your rider in real-time on the map'
    },
    {
      icon: 'ri-recycle-line',
      title: 'Eco-Friendly',
      description: 'Proper waste sorting and recycling practices'
    },
    {
      icon: 'ri-shield-check-line',
      title: 'Verified Riders',
      description: 'All riders are background-checked and trained'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>About Borlawura</Text>
          <Text style={styles.subtitle}>Making waste management easy</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <RemixIcon name="ri-recycle-line" size={40} color="#ffffff" />
          </View>
          <Text style={styles.heroTitle}>Borlawura</Text>
          <Text style={styles.heroSubtitle}>
            Ghana's leading on-demand waste collection service
          </Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            To revolutionize waste management in Ghana by providing convenient, reliable, and eco-friendly waste collection services. We believe everyone deserves a clean environment and easy access to proper waste disposal.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <RemixIcon name={feature.icon} size={20} color="#10b981" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <View style={styles.contactList}>
            <TouchableOpacity
              onPress={() => Linking.openURL('tel:+233301234567')}
              style={styles.contactItem}
              activeOpacity={0.7}
            >
              <RemixIcon name="ri-phone-line" size={20} color="#4b5563" />
              <Text style={styles.contactText}>+233 30 123 4567</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:borlawuraapp@gmail.com')}
              style={styles.contactItem}
              activeOpacity={0.7}
            >
              <RemixIcon name="ri-mail-line" size={20} color="#4b5563" />
              <Text style={styles.contactText}>borlawuraapp@gmail.com</Text>
            </TouchableOpacity>
            <View style={styles.contactItem}>
              <RemixIcon name="ri-map-pin-line" size={20} color="#4b5563" />
              <Text style={styles.contactText}>Accra, Ghana</Text>
            </View>
          </View>
        </View>

        <View style={styles.copyright}>
          <Text style={styles.copyrightText}>© 2024 Borlawura. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.bold,
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#64748b',
  },
  hero: {
    backgroundColor: '#10b981',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: typography.bold,
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#d1fae5',
    marginBottom: 16,
    textAlign: 'center',
  },
  versionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  versionText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#ffffff',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: '#4b5563',
    lineHeight: 20,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: typography.semiBold,
    color: '#1f2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: '#4b5563',
  },
  contactList: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#4b5563',
  },
  copyright: {
    alignItems: 'center',
    marginBottom: 24,
  },
  copyrightText: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: '#9ca3af',
  },
});
