import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RemixIcon } from '../../../utils/icons';
import { navigateTo } from '../../../utils/navigation';

interface Action {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  path: string;
}

export const QuickActions: React.FC = () => {
  const actions: Action[] = [
    {
      icon: 'ri-flashlight-line',
      title: 'Instant Pickup',
      subtitle: 'Ready in 30 mins',
      color: '#f97316',
      path: '/booking'
    },
    {
      icon: 'ri-calendar-line',
      title: 'Schedule Pickup',
      subtitle: 'Plan ahead',
      color: '#3b82f6',
      path: '/booking'
    },
    {
      icon: 'ri-truck-line',
      title: 'Track Order',
      subtitle: 'Live updates',
      color: '#a855f7',
      path: '/orders'
    }
  ];

  const handleActionClick = (path: string) => {
    navigateTo(path);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.grid}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleActionClick(action.path)}
            style={styles.actionCard}
            activeOpacity={0.8}
          >
            <View style={styles.actionContent}>
              <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
                <RemixIcon name={action.icon} size={24} color="#fff" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  actionCard: {
    width: '47%',
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
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
});
