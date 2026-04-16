import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { navigateTo } from '../../../utils/navigation';
import { typography } from '../../../utils/typography';

interface Action {
  icon: any;
  title: string;
  subtitle: string;
  color: string;
  path: string;
  gradient: [string, string];
  iconLib: 'MCI' | 'Ionicons';
}

export const QuickActions: React.FC = () => {
  const actions: Action[] = [
    {
      icon: 'lightning-bolt',
      iconLib: 'MCI',
      title: 'Rapid Pickup',
      subtitle: 'Trash out in 30m',
      color: '#f97316',
      gradient: ['#fb923c', '#f97316'],
      path: '/booking'
    },
    {
      icon: 'calendar-clock',
      iconLib: 'MCI',
      title: 'Subscription',
      subtitle: 'Scheduled plans',
      color: '#3b82f6',
      gradient: ['#60a5fa', '#3b82f6'],
      path: '/booking'
    },
    {
      icon: 'map-marker-path',
      iconLib: 'MCI',
      title: 'Live Tracking',
      subtitle: 'Watch your rider',
      color: '#8b5cf6',
      gradient: ['#a78bfa', '#8b5cf6'],
      path: '/orders'
    },
    {
      icon: 'headset',
      iconLib: 'Ionicons',
      title: 'Help Center',
      subtitle: '24/7 Support',
      color: '#10b981',
      gradient: ['#34d399', '#10b981'],
      path: '/support'
    }
  ];

  const handleActionClick = (path: string) => {
    navigateTo(path);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Premium Services</Text>
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleActionClick(action.path)}
            activeOpacity={0.8}
            style={styles.actionCard}
          >
            <View style={[styles.iconBox, { backgroundColor: action.gradient[0] + '20' }]}>
               {action.iconLib === 'MCI' ? (
                 <MaterialCommunityIcons name={action.icon} size={28} color={action.color} />
               ) : (
                 <Ionicons name={action.icon} size={26} color={action.color} />
               )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle} numberOfLines={1}>{action.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 19,
    fontFamily: typography.bold,
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: -0.5
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  textContainer: {
    width: '100%',
  },
  actionTitle: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: '#1e293b',
    letterSpacing: -0.3
  },
  actionSubtitle: {
    fontSize: 11,
    fontFamily: typography.medium,
    color: '#64748b',
    marginTop: 4,
    opacity: 0.8
  },
});
