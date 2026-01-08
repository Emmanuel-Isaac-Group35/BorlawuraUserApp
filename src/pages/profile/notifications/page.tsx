import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { Navigation } from '../../../components/feature/Navigation';
import { BottomNavigation } from '../../../components/feature/BottomNavigation';
import { RemixIcon } from '../../../utils/icons';
import { useNavigation } from '@react-navigation/native';

const NotificationsPage: React.FC = () => {
  const navigation = useNavigation();
  const [settings, setSettings] = useState({
    orderUpdates: true,
    riderArrival: true,
    promotions: false,
    newsletter: true,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    soundEnabled: true,
    vibrationEnabled: true
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({
      ...settings,
      [key]: !settings[key]
    });
  };

  const notificationGroups = [
    {
      title: 'Order Notifications',
      items: [
        {
          key: 'orderUpdates',
          label: 'Order Updates',
          description: 'Get notified about order status changes',
          icon: 'ri-shopping-bag-line'
        },
        {
          key: 'riderArrival',
          label: 'Rider Arrival',
          description: 'Alert when rider is nearby',
          icon: 'ri-map-pin-user-line'
        }
      ]
    },
    {
      title: 'Marketing',
      items: [
        {
          key: 'promotions',
          label: 'Promotions & Offers',
          description: 'Receive special deals and discounts',
          icon: 'ri-gift-line'
        },
        {
          key: 'newsletter',
          label: 'Newsletter',
          description: 'Weekly updates and tips',
          icon: 'ri-mail-line'
        }
      ]
    },
    {
      title: 'Notification Channels',
      items: [
        {
          key: 'pushNotifications',
          label: 'Push Notifications',
          description: 'Receive notifications on this device',
          icon: 'ri-notification-3-line'
        },
        {
          key: 'emailNotifications',
          label: 'Email Notifications',
          description: 'Receive updates via email',
          icon: 'ri-mail-send-line'
        },
        {
          key: 'smsNotifications',
          label: 'SMS Notifications',
          description: 'Receive text messages',
          icon: 'ri-message-3-line'
        }
      ]
    },
    {
      title: 'Sound & Vibration',
      items: [
        {
          key: 'soundEnabled',
          label: 'Sound',
          description: 'Play sound for notifications',
          icon: 'ri-volume-up-line'
        },
        {
          key: 'vibrationEnabled',
          label: 'Vibration',
          description: 'Vibrate for notifications',
          icon: 'ri-smartphone-line'
        }
      ]
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
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Customize your notification preferences</Text>
          </View>
        </View>

        <View style={styles.notificationGroups}>
          {notificationGroups.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.groupCard}>
                {group.items.map((item, itemIndex) => (
                  <View
                    key={item.key}
                    style={[
                      styles.notificationItem,
                      itemIndex !== group.items.length - 1 && styles.notificationItemBorder
                    ]}
                  >
                    <View style={styles.notificationIcon}>
                      <RemixIcon name={item.icon} size={20} color="#4b5563" />
                    </View>
                    
                    <View style={styles.notificationInfo}>
                      <Text style={styles.notificationLabel}>{item.label}</Text>
                      <Text style={styles.notificationDescription}>{item.description}</Text>
                    </View>

                    <Switch
                      value={settings[item.key as keyof typeof settings]}
                      onValueChange={() => handleToggle(item.key as keyof typeof settings)}
                      trackColor={{ false: '#d1d5db', true: '#10b981' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <RemixIcon name="ri-information-line" size={20} color="#ffffff" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>About Notifications</Text>
            <Text style={styles.infoText}>
              You can change these settings anytime. Some notifications are required for service delivery and cannot be disabled.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotificationsPage;

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
  notificationGroups: {
    gap: 24,
    marginBottom: 24,
  },
  group: {
    gap: 12,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  notificationItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e3a8a',
    lineHeight: 20,
  },
});
