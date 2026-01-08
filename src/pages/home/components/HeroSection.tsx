import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Button } from '../../../components/base/Button';
import { RemixIcon } from '../../../utils/icons';
import { navigateTo } from '../../../utils/navigation';

export const HeroSection: React.FC = () => {
  const handleBookingClick = () => {
    navigateTo('/booking');
  };

  const handleScheduleClick = () => {
    navigateTo('/booking');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>A Cleaner Home, A Cleaner City</Text>
          <Text style={styles.subtitle}>We Handle Your Trash, So You Don't Have To</Text>
        </View>
        
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://readdy.ai/api/search-image?query=Professional%20waste%20collection%20service%20with%20modern%20tricycle%2C%20clean%20urban%20environment%2C%20eco-friendly%20waste%20management%2C%20professional%20uniformed%20worker%20collecting%20household%20waste%20bags%2C%20bright%20daylight%2C%20clean%20city%20street%20background%2C%20sustainable%20waste%20disposal%20concept%2C%20high-quality%20realistic%20photography&width=350&height=200&seq=hero1&orientation=landscape' }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button variant="primary" size="lg" fullWidth onPress={handleBookingClick}>
            <View style={styles.buttonContent}>
              <RemixIcon name="ri-truck-line" size={20} color="#fff" />
              <Text style={styles.buttonText}>Book Pickup Now</Text>
            </View>
          </Button>
          <Button variant="outline" size="md" fullWidth onPress={handleScheduleClick}>
            <View style={styles.buttonContent}>
              <RemixIcon name="ri-calendar-line" size={18} color="#10b981" />
              <Text style={[styles.buttonText, styles.buttonTextOutline]}>Schedule Regular Pickup</Text>
            </View>
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  content: {
    zIndex: 10,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  imageContainer: {
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: 192,
    borderRadius: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  buttonTextOutline: {
    color: '#10b981',
  },
});
