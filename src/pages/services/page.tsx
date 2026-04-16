import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { typography } from '../../utils/typography';
import { useSettings } from '../../context/SettingsContext';

const ServicesPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { settings } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const defaultServices: Array<{
    id: number;
    title: string;
    description: string;
    icon: string;
    category: string;
    features: string[];
    priceBadge?: string;
  }> = [
    {
      id: 1,
      title: 'Instant Pickup',
      description: 'Get your waste collected within 30 minutes',
      icon: 'ri-flashlight-fill',
      category: 'pickup',
      features: ['30-minute response', 'Real-time tracking', 'Professional handling'],
      priceBadge: 'Popular'
    },
    {
      id: 2,
      title: 'Scheduled Pickup',
      description: 'Plan your waste collection in advance',
      icon: 'ri-calendar-event-fill',
      category: 'pickup',
      features: ['Flexible timing', 'Recurring options', 'Cost effective']
    },
    {
      id: 5,
      title: 'Bulk Collection',
      description: 'Large volume waste collection service',
      icon: 'ri-truck-fill',
      category: 'bulk',
      features: ['Large capacity', 'Multiple bags', 'Special handling']
    }
  ];

  const services = (settings?.mobileApp?.services?.length > 0)
    ? settings.mobileApp.services
    : defaultServices;

  const categories = [
    { id: 'all', label: 'All Services', icon: 'ri-grid-fill' },
    { id: 'pickup', label: 'Pickup', icon: 'ri-truck-fill' },
    { id: 'bulk', label: 'Bulk', icon: 'ri-stack-fill' }
  ];

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  const handleBookService = (serviceId: number) => {
    navigateTo('/booking');
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
          <Text style={styles.subtitle}>Choose the perfect waste collection service for your needs</Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              activeOpacity={0.7}
            >
              <View style={styles.categoryIcon}>
                <RemixIcon 
                  name={category.icon} 
                  size={18} 
                  color={selectedCategory === category.id ? '#ffffff' : '#6b7280'} 
                />
              </View>
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.servicesList}>
          {filteredServices.map((service) => (
            <TouchableOpacity 
              key={service.id} 
              style={styles.serviceCard}
              onPress={() => handleBookService(service.id)}
              activeOpacity={0.9}
            >
              <View style={styles.serviceHeader}>
                <View style={styles.serviceIconContainer}>
                  <RemixIcon name={service.icon} size={28} color="#10b981" />
                </View>
                
                <View style={styles.serviceInfo}>
                  <View style={styles.serviceTitleRow}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    {service.priceBadge && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>{service.priceBadge}</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                  
                  <View style={styles.featuresContainer}>
                    {service.features.map((feature, index) => (
                      <View key={index} style={styles.featureTag}>
                        <RemixIcon name="ri-checkbox-circle-fill" size={14} color="#10b981" />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.actionRow}>
                    <View style={styles.bookButton}>
                      <Text style={styles.bookButtonText}>Book Now</Text>
                      <RemixIcon name="ri-arrow-right-line" size={16} color="#ffffff" />
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.serviceAreas}>
          <Text style={styles.serviceAreasTitle}>Service Areas</Text>
          <View style={styles.serviceAreasGrid}>
            {['Accra Central', 'East Legon', 'Tema', 'Kumasi', 'Takoradi', 'Cape Coast'].map((area) => (
              <View key={area} style={styles.serviceAreaItem}>
                <RemixIcon name="ri-map-pin-2-fill" size={14} color="#10b981" />
                <Text style={styles.serviceAreaText}>{area}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ServicesPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  subtitle: {
    fontSize: 15,
    fontFamily: typography.regular,
    color: '#64748b',
    lineHeight: 22,
  },
  categoriesScroll: {
    marginBottom: 28,
  },
  categoriesContainer: {
    gap: 12,
    paddingRight: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  categoryIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: typography.semiBold,
    color: '#64748b',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  servicesList: {
    gap: 20,
    marginBottom: 32,
  },
  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#f0fdf4',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  serviceTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#1e293b',
    flex: 1,
  },
  popularBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularText: {
    fontSize: 10,
    fontFamily: typography.bold,
    color: '#d97706',
    textTransform: 'uppercase',
  },
  serviceDescription: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresContainer: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 20,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  featureText: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: '#475569',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
  serviceAreas: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceAreasTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#1e293b',
    marginBottom: 16,
  },
  serviceAreasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceAreaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    flex: 1,
    minWidth: '46%',
  },
  serviceAreaDot: {
    width: 6,
    height: 6,
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  serviceAreaText: {
    fontSize: 13,
    fontFamily: typography.semiBold,
    color: '#475569',
  },
});
