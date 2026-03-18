import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation } from '../../../components/feature/Navigation';
import { BottomNavigation } from '../../../components/feature/BottomNavigation';
import { RemixIcon } from '../../../utils/icons';
import { useNavigation } from '@react-navigation/native';

const AboutPage: React.FC = () => {
  const navigation = useNavigation();

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

  const team = [
    {
      name: 'Kwame Asante',
      role: 'Founder & CEO',
      image: 'https://readdy.ai/api/search-image?query=Professional%20African%20businessman%20portrait%2C%20confident%20smile%2C%20business%20suit%2C%20clean%20background%2C%20high-quality%20headshot%20photography%2C%20natural%20lighting&width=100&height=100&seq=team1&orientation=squarish'
    },
    {
      name: 'Ama Serwaa',
      role: 'Operations Director',
      image: 'https://readdy.ai/api/search-image?query=Professional%20African%20businesswoman%20portrait%2C%20friendly%20smile%2C%20business%20attire%2C%20clean%20background%2C%20high-quality%20headshot%20photography%2C%20natural%20lighting&width=100&height=100&seq=team2&orientation=squarish'
    },
    {
      name: 'Kofi Mensah',
      role: 'Technology Lead',
      image: 'https://readdy.ai/api/search-image?query=Professional%20African%20tech%20professional%20portrait%2C%20confident%20expression%2C%20casual%20business%20attire%2C%20clean%20background%2C%20high-quality%20headshot%20photography&width=100&height=100&seq=team3&orientation=squarish'
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
            <Text style={styles.title}>About Borla Wura</Text>
            <Text style={styles.subtitle}>Making waste management easy</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <RemixIcon name="ri-recycle-line" size={40} color="#ffffff" />
          </View>
          <Text style={styles.heroTitle}>Borla Wura</Text>
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

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>50K+</Text>
            <Text style={styles.statLabel}>Happy Users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>200+</Text>
            <Text style={styles.statLabel}>Riders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Cities</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Meet Our Team</Text>
          <View style={styles.teamList}>
            {team.map((member, index) => (
              <View key={index} style={styles.teamMember}>
                <Image
                  source={{ uri: member.image }}
                  style={styles.teamImage}
                />
                <View style={styles.teamInfo}>
                  <Text style={styles.teamName}>{member.name}</Text>
                  <Text style={styles.teamRole}>{member.role}</Text>
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
            >
              <RemixIcon name="ri-phone-line" size={20} color="#4b5563" />
              <Text style={styles.contactText}>+233 30 123 4567</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => Linking.openURL('mailto:info@borlawura.com')}
              style={styles.contactItem}
            >
              <RemixIcon name="ri-mail-line" size={20} color="#4b5563" />
              <Text style={styles.contactText}>info@borlawura.com</Text>
            </TouchableOpacity>
            <View style={styles.contactItem}>
              <RemixIcon name="ri-map-pin-line" size={20} color="#4b5563" />
              <Text style={styles.contactText}>Accra, Ghana</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Follow Us</Text>
          <View style={styles.socialGrid}>
            {[
              { icon: 'ri-facebook-fill', color: '#3b82f6' },
              { icon: 'ri-twitter-fill', color: '#60a5fa' },
              { icon: 'ri-instagram-line', color: '#ec4899' },
              { icon: 'ri-linkedin-fill', color: '#2563eb' }
            ].map((social, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.socialButton, { backgroundColor: social.color }]}
              >
                <RemixIcon name={social.icon} size={24} color="#ffffff" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.copyright}>
          <Text style={styles.copyrightText}>© 2024 Borla Wura. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutPage;

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
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
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
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionText: {
    fontSize: 14,
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
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#4b5563',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  teamList: {
    gap: 16,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  teamImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  teamRole: {
    fontSize: 14,
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
    color: '#4b5563',
  },
  socialGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyright: {
    alignItems: 'center',
    marginBottom: 24,
  },
  copyrightText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
