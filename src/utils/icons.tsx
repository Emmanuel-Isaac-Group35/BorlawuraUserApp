import { Ionicons } from '@expo/vector-icons';
import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Map RemixIcon class names to Ionicons names
const iconMap: { [key: string]: string } = {
  'ri-recycle-line': 'sync-outline',
  'ri-home-5-line': 'home-outline',
  'ri-calendar-check-line': 'calendar-outline',
  'ri-file-list-3-line': 'document-text-outline',
  'ri-customer-service-2-line': 'headset-outline',
  'ri-user-3-line': 'person-outline',
  'ri-menu-line': 'menu-outline',
  'ri-close-line': 'close-outline',
  'ri-map-pin-line': 'location-outline',
  'ri-calendar-line': 'calendar-outline',
  'ri-flashlight-line': 'flash-outline',
  'ri-truck-line': 'car-outline',
  'ri-arrow-left-line': 'arrow-back-outline',
  'ri-arrow-right-line': 'arrow-forward-outline',
  'ri-arrow-left-s-line': 'chevron-back-outline',
  'ri-arrow-right-s-line': 'chevron-forward-outline',
  'ri-check-line': 'checkmark-outline',
  'ri-delete-bin-line': 'trash-outline',
  'ri-time-line': 'time-outline',
  'ri-phone-line': 'call-outline',
  'ri-star-line': 'star-outline',
  'ri-star-fill': 'star',
  'ri-edit-line': 'create-outline',
  'ri-add-line': 'add-outline',
  'ri-subtract-line': 'remove-outline',
  'ri-more-2-line': 'ellipsis-horizontal-outline',
  'ri-printer-line': 'print-outline',
  'ri-search-line': 'search-outline',
  'ri-home-4-line': 'home-outline',
  'ri-smartphone-line': 'phone-portrait-outline',
  'ri-file-download-line': 'download-outline',
  'ri-error-warning-line': 'warning-outline',
  'ri-logout-box-line': 'log-out-outline',
  'ri-information-line': 'information-circle-outline',
  'ri-leaf-line': 'leaf-outline',
  'ri-coin-line': 'cash-outline',
  'ri-shield-check-line': 'shield-checkmark-outline',
  'ri-question-line': 'help-circle-outline',
  'ri-lightbulb-line': 'bulb-outline',
  'ri-mail-line': 'mail-outline',
  'ri-chat-3-line': 'chatbubble-outline',
  'ri-whatsapp-line': 'logo-whatsapp',
  'ri-alarm-warning-line': 'alert-circle-outline',
  'ri-pause-line': 'pause-outline',
  'ri-play-line': 'play-outline',
  'ri-share-line': 'share-outline',
  'ri-credit-card-line': 'card-outline',
  'ri-notification-3-line': 'notifications-outline',
  'ri-gift-line': 'gift-outline',
  'ri-file-text-line': 'document-text-outline',
  'ri-stack-line': 'layers-outline',
  'ri-building-line': 'business-outline',
  'ri-apps-line': 'apps-outline',
  'ri-calendar-schedule-line': 'calendar-outline',
  'ri-file-copy-line': 'copy-outline',
  'ri-facebook-fill': 'logo-facebook',
  'ri-twitter-fill': 'logo-twitter',
  'ri-instagram-line': 'logo-instagram',
  'ri-linkedin-fill': 'logo-linkedin',
  'ri-shopping-bag-line': 'bag-outline',
  'ri-map-pin-user-line': 'person-outline',
  'ri-mail-send-line': 'send-outline',
  'ri-message-3-line': 'chatbubbles-outline',
  'ri-volume-up-line': 'volume-high-outline',
  'ri-user-add-line': 'person-add-outline',
  'ri-user-line': 'person-outline',
  'ri-money-dollar-circle-line': 'cash-outline',
  'ri-bank-card-line': 'card-outline',
  'ri-chat-smile-3-fill': 'chatbubble-ellipses',
};

export const RemixIcon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  try {
    const mappedIconName = iconMap[name] || 'help-circle-outline';
    const iconName = mappedIconName as keyof typeof Ionicons.glyphMap;
    return <Ionicons name={iconName} size={size} color={color} style={style} />;
  } catch (error) {
    // Fallback to a safe icon if something goes wrong
    return <Ionicons name="help-circle-outline" size={size} color={color} style={style} />;
  }
};
