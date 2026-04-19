import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Map RemixIcon class names to Ionicons or MaterialCommunityIcons
const iconMap: { [key: string]: { lib: 'Ionicons' | 'MCI', name: any } } = {
  // Navigation
  'ri-home-5-line': { lib: 'Ionicons', name: 'home-outline' },
  'ri-home-4-line': { lib: 'Ionicons', name: 'home-outline' },
  'ri-menu-line': { lib: 'Ionicons', name: 'menu-outline' },
  'ri-close-line': { lib: 'Ionicons', name: 'close-outline' },
  'ri-arrow-left-line': { lib: 'Ionicons', name: 'arrow-back-outline' },
  'ri-arrow-right-line': { lib: 'Ionicons', name: 'arrow-forward-outline' },
  'ri-arrow-left-s-line': { lib: 'Ionicons', name: 'chevron-back-outline' },
  'ri-arrow-right-s-line': { lib: 'Ionicons', name: 'chevron-forward-outline' },
  'ri-arrow-right-up-line': { lib: 'Ionicons', name: 'arrow-redo-outline' },
  
  // Actions & Feedback
  'ri-check-line': { lib: 'Ionicons', name: 'checkmark-outline' },
  'ri-checkbox-circle-fill': { lib: 'Ionicons', name: 'checkmark-circle' },
  'ri-checkbox-circle-line': { lib: 'Ionicons', name: 'checkmark-circle-outline' },
  'ri-error-warning-fill': { lib: 'Ionicons', name: 'alert-circle' },
  'ri-error-warning-line': { lib: 'Ionicons', name: 'warning-outline' },
  'ri-alert-fill': { lib: 'Ionicons', name: 'warning' },
  'ri-alert-line': { lib: 'Ionicons', name: 'alert-circle-outline' },
  'ri-information-fill': { lib: 'Ionicons', name: 'information-circle' },
  'ri-information-line': { lib: 'Ionicons', name: 'information-circle-outline' },
  'ri-delete-bin-line': { lib: 'Ionicons', name: 'trash-outline' },
  'ri-refresh-line': { lib: 'Ionicons', name: 'refresh-outline' },
  'ri-search-line': { lib: 'Ionicons', name: 'search-outline' },
  'ri-search-2-line': { lib: 'Ionicons', name: 'search-outline' },
  'ri-add-line': { lib: 'Ionicons', name: 'add-outline' },
  'ri-add-circle-line': { lib: 'Ionicons', name: 'add-circle-outline' },
  'ri-close-circle-line': { lib: 'Ionicons', name: 'close-circle-outline' },
  
  // Status & Objects
  'ri-recycle-line': { lib: 'Ionicons', name: 'sync-outline' },
  'ri-truck-line': { lib: 'Ionicons', name: 'car-outline' },
  'ri-time-line': { lib: 'Ionicons', name: 'time-outline' },
  'ri-history-line': { lib: 'Ionicons', name: 'time-outline' },
  'ri-calendar-line': { lib: 'Ionicons', name: 'calendar-outline' },
  'ri-calendar-check-line': { lib: 'Ionicons', name: 'calendar-outline' },
  'ri-map-pin-line': { lib: 'Ionicons', name: 'location-outline' },
  'ri-map-pin-2-line': { lib: 'Ionicons', name: 'location-outline' },
  'ri-map-pin-fill': { lib: 'Ionicons', name: 'location' },
  'ri-map-pin-2-fill': { lib: 'Ionicons', name: 'location' },
  'ri-flashlight-line': { lib: 'Ionicons', name: 'flash-outline' },
  'ri-mist-line': { lib: 'Ionicons', name: 'cloud-outline' },
  
  // User & Communication
  'ri-user-line': { lib: 'Ionicons', name: 'person-outline' },
  'ri-user-3-line': { lib: 'Ionicons', name: 'person-outline' },
  'ri-user-add-line': { lib: 'Ionicons', name: 'person-add-outline' },
  'ri-customer-service-2-line': { lib: 'Ionicons', name: 'headset-outline' },
  'ri-customer-service-2-fill': { lib: 'Ionicons', name: 'headset' },
  'ri-phone-line': { lib: 'Ionicons', name: 'call-outline' },
  'ri-mail-line': { lib: 'Ionicons', name: 'mail-outline' },
  'ri-chat-3-line': { lib: 'Ionicons', name: 'chatbubble-outline' },
  'ri-chat-3-fill': { lib: 'Ionicons', name: 'chatbubble-ellipses' },
  'ri-chat-smile-3-fill': { lib: 'Ionicons', name: 'chatbubble-ellipses' },
  'ri-message-3-line': { lib: 'Ionicons', name: 'chatbubbles-outline' },
  'ri-notification-3-line': { lib: 'Ionicons', name: 'notifications-outline' },
  'ri-whatsapp-line': { lib: 'Ionicons', name: 'logo-whatsapp' },
  
  // UI Elements
  'ri-flashlight-fill': { lib: 'Ionicons', name: 'flash' },
  'ri-calendar-event-fill': { lib: 'Ionicons', name: 'calendar' },
  'ri-arrow-down-s-line': { lib: 'Ionicons', name: 'chevron-down-outline' },
  'ri-check-fill': { lib: 'Ionicons', name: 'checkmark-circle' },
  'ri-star-fill': { lib: 'Ionicons', name: 'star' },
  'ri-flashlight-line': { lib: 'Ionicons', name: 'flash-outline' },
  'ri-truck-fill': { lib: 'Ionicons', name: 'car' },
  'ri-customer-service-fill': { lib: 'Ionicons', name: 'headset' },
  'ri-chat-smile-fill': { lib: 'Ionicons', name: 'chatbubble-ellipses' },
  'ri-share-forward-line': { lib: 'Ionicons', name: 'share-outline' },
  'ri-share-line': { lib: 'Ionicons', name: 'share-outline' },
  'ri-heart-line': { lib: 'Ionicons', name: 'heart-outline' },
  'ri-heart-fill': { lib: 'Ionicons', name: 'heart' },
  'ri-focus-3-fill': { lib: 'Ionicons', name: 'locate' },
  'ri-focus-3-line': { lib: 'Ionicons', name: 'locate-outline' },
  'ri-gps-fill': { lib: 'Ionicons', name: 'navigate' },
  'ri-home-6-fill': { lib: 'Ionicons', name: 'home' },
  'ri-briefcase-4-fill': { lib: 'Ionicons', name: 'briefcase' },
  'ri-briefcase-fill': { lib: 'Ionicons', name: 'briefcase' },
  'ri-home-fill': { lib: 'Ionicons', name: 'home' },
};

export const RemixIcon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  const iconConfig = iconMap[name];
  
  if (!iconConfig) {
    // Fallback if icon not found in map
    return <Ionicons name="help-circle-outline" size={size} color={color} style={style} />;
  }

  if (iconConfig.lib === 'MCI') {
    return <MaterialCommunityIcons name={iconConfig.name} size={size} color={color} style={style} />;
  }
  
  return <Ionicons name={iconConfig.name} size={size} color={color} style={style} />;
};
