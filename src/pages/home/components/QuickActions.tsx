import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { navigateTo } from '../../../utils/navigation';
import { typography } from '../../../utils/typography';
import { RemixIcon } from '../../../utils/icons';

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
      title: 'Fast Pickup',
      subtitle: 'Trash out in 30m',
      color: '#fb923c',
      gradient: ['#fb923c', '#f97316'],
      path: '/booking'
    },
    {
      icon: 'calendar-heart',
      iconLib: 'MCI',
      title: 'Monthly Plan',
      subtitle: 'Save 20% yearly',
      color: '#3b82f6',
      gradient: ['#60a5fa', '#3b82f6'],
      path: '/booking'
    },
    {
      icon: 'map-marker-path',
      iconLib: 'MCI',
      title: 'Track Rider',
      subtitle: 'Real-time GPS',
      color: '#8b5cf6',
      gradient: ['#a78bfa', '#8b5cf6'],
      path: '/orders'
    },
    {
      icon: 'headset',
      iconLib: 'Ionicons',
      title: 'Support',
      subtitle: 'Always online',
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
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleActionClick(action.path)}
            activeOpacity={0.8}
            style={styles.actionCard}
          >
            <View style={[styles.iconBox, { backgroundColor: action.color + '10' }]}>
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
            <View style={[styles.arrowBox, { borderColor: action.color + '20' }]}>
               <RemixIcon name="ri-arrow-right-line" size={12} color={action.color} />
            </View>
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
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '46%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#f8fafc',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
    position: 'relative',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  textContainer: {
    width: '100%',
  },
  actionTitle: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: '#0f172a',
    letterSpacing: -0.5
  },
  actionSubtitle: {
    fontSize: 11,
    fontFamily: typography.medium,
    color: '#64748b',
    marginTop: 2,
  },
  arrowBox: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
