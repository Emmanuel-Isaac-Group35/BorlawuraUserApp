import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { BottomNavigation } from '../../components/feature/BottomNavigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';

const ServicesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const services: Array<{
    id: number;
    title: string;
    description: string;
    price: string;
    icon: string;
    category: string;
    features: string[];
  }> = [
    {
      id: 1,
      title: 'Instant Pickup',
      description: 'Get your waste collected within 30 minutes',
      price: '₵15',
      icon: 'ri-flashlight-line',
      category: 'pickup',
      features: ['30-minute response', 'Real-time tracking', 'Professional handling']
    },
    {
      id: 2,
      title: 'Scheduled Pickup',
      description: 'Plan your waste collection in advance',
      price: '₵12',
      icon: 'ri-calendar-schedule-line',
      category: 'pickup',
      features: ['Flexible timing', 'Recurring options', 'Cost effective']
    },
    {
      id: 5,
      title: 'Bulk Collection',
      description: 'Large volume waste collection service',
      price: '₵25',
      icon: 'ri-truck-line',
      category: 'bulk',
      features: ['Large capacity', 'Multiple bags', 'Special handling']
    }
  ];

  const categories = [
    { id: 'all', label: 'All Services', icon: 'ri-apps-line' },
    { id: 'pickup', label: 'Pickup', icon: 'ri-truck-line' },
    { id: 'bulk', label: 'Bulk', icon: 'ri-stack-line' }
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
      <BottomNavigation />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Our Services</Text>
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
            >
              <View style={styles.categoryIcon}>
                <RemixIcon 
                  name={category.icon} 
                  size={16} 
                  color={selectedCategory === category.id ? '#ffffff' : '#4b5563'} 
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
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceIconContainer}>
                  <RemixIcon name={service.icon} size={24} color="#10b981" />
                </View>
                
                <View style={styles.serviceInfo}>
                  <View style={styles.serviceTitleRow}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.servicePrice}>{service.price}</Text>
                  </View>
                  
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                  
                  <View style={styles.featuresContainer}>
                    {service.features.map((feature, index) => (
                      <View key={index} style={styles.featureTag}>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <TouchableOpacity
                    onPress={() => handleBookService(service.id)}
                    style={styles.bookButton}
                  >
                    <Text style={styles.bookButtonText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.serviceAreas}>
          <Text style={styles.serviceAreasTitle}>Service Areas</Text>
          <View style={styles.serviceAreasGrid}>
            {['Accra Central', 'East Legon', 'Tema', 'Kumasi', 'Takoradi', 'Cape Coast'].map((area) => (
              <View key={area} style={styles.serviceAreaItem}>
                <View style={styles.serviceAreaDot} />
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
  categoriesScroll: {
    marginBottom: 24,
  },
  categoriesContainer: {
    gap: 12,
    paddingRight: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  servicesList: {
    gap: 16,
    marginBottom: 24,
  },
  serviceCard: {
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
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  featureTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#4b5563',
  },
  bookButton: {
    width: '100%',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  serviceAreas: {
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
  },
  serviceAreasTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
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
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    flex: 1,
    minWidth: '47%',
  },
  serviceAreaDot: {
    width: 8,
    height: 8,
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  serviceAreaText: {
    fontSize: 14,
    color: '#374151',
  },
});
