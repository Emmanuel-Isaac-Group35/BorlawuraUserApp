import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { navigateTo } from '../../../utils/navigation';
import { typography } from '../../../utils/typography';
import { RemixIcon } from '../../../utils/icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Action {
  icon: any;
  title: string;
  subtitle: string;
  color: string;
  path: string;
  gradient: [string, string];
  bgGradient: [string, string];
  iconLib: 'MCI' | 'Ionicons';
}

export const QuickActions: React.FC = () => {
  const actions: Action[] = [
    {
      icon: 'lightning-bolt',
      iconLib: 'MCI',
      title: 'Fast Pickup',
      subtitle: 'Trash out in 30m',
      color: '#ffffff',
      gradient: ['#34d399', '#059669'],
      bgGradient: ['#34d399', '#059669'],
      path: '/booking'
    },
    {
      icon: 'calendar-heart',
      iconLib: 'MCI',
      title: 'Monthly Plan',
      subtitle: 'Save 20% yearly',
      color: '#ffffff',
      gradient: ['#059669', '#064e3b'],
      bgGradient: ['#059669', '#064e3b'],
      path: '/booking'
    },
    {
      icon: 'map-marker-path',
      iconLib: 'MCI',
      title: 'Track Rider',
      subtitle: 'Real-time GPS',
      color: '#ffffff',
      gradient: ['#a3e635', '#65a30d'],
      bgGradient: ['#a3e635', '#65a30d'],
      path: '/orders'
    },
    {
      icon: 'headset',
      iconLib: 'Ionicons',
      title: 'Support',
      subtitle: 'Always online',
      color: '#ffffff',
      gradient: ['#2dd4bf', '#0d9488'],
      bgGradient: ['#2dd4bf', '#0d9488'],
      path: '/support'
    }
  ];

  const handleActionClick = (path: string) => {
    navigateTo(path);
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleActionClick(action.path)}
            activeOpacity={0.85}
            style={styles.cardWrapper}
          >
            <LinearGradient
              colors={action.bgGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCard}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.22)' }]}>
                 {action.iconLib === 'MCI' ? (
                   <MaterialCommunityIcons name={action.icon} size={28} color={action.color} />
                 ) : (
                   <Ionicons name={action.icon} size={26} color={action.color} />
                 )}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.actionTitle} numberOfLines={1} adjustsFontSizeToFit>{action.title}</Text>
                <Text style={styles.actionSubtitle} numberOfLines={1}>{action.subtitle}</Text>
              </View>
              <View style={[styles.arrowBox, { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255,255,255,0.25)' }]}>
                 <RemixIcon name="ri-arrow-right-line" size={12} color="#ffffff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardWrapper: {
    width: '47%',
    borderRadius: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  actionCard: {
    flex: 1,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    position: 'relative',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  textContainer: {
    width: '100%',
  },
  actionTitle: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: '#ffffff',
    letterSpacing: -0.4
  },
  actionSubtitle: {
    fontSize: 10,
    fontFamily: typography.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  arrowBox: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
});
