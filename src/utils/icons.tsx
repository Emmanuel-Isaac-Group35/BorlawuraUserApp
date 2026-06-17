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
  'ri-edit-2-fill': { lib: 'Ionicons', name: 'create' },
  'ri-camera-fill': { lib: 'Ionicons', name: 'camera' },
  
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
  'ri-lock-line': { lib: 'Ionicons', name: 'lock-closed-outline' },
  
  // Status & Objects
  'ri-recycle-line': { lib: 'MCI', name: 'recycle' },
  'ri-truck-line': { lib: 'MCI', name: 'truck-outline' },
  'ri-time-line': { lib: 'Ionicons', name: 'time-outline' },
  'ri-history-line': { lib: 'Ionicons', name: 'time-outline' },
  'ri-history-fill': { lib: 'Ionicons', name: 'time' },
  'ri-calendar-line': { lib: 'Ionicons', name: 'calendar-outline' },
  'ri-calendar-check-line': { lib: 'Ionicons', name: 'calendar-outline' },
  'ri-map-pin-line': { lib: 'MCI', name: 'map-marker-outline' },
  'ri-map-pin-2-line': { lib: 'MCI', name: 'map-marker-outline' },
  'ri-map-pin-fill': { lib: 'MCI', name: 'map-marker' },
  'ri-map-pin-2-fill': { lib: 'MCI', name: 'map-marker' },
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
  'ri-truck-fill': { lib: 'MCI', name: 'truck' },
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

  // Additional icons for Notifications & Rider pages
  'ri-walk-line':             { lib: 'Ionicons', name: 'walk-outline' },
  'ri-gift-line':             { lib: 'Ionicons', name: 'gift-outline' },
  'ri-coupon-3-line':         { lib: 'Ionicons', name: 'pricetag-outline' },
  'ri-volume-up-line':        { lib: 'Ionicons', name: 'volume-high-outline' },
  'ri-smartphone-line':       { lib: 'Ionicons', name: 'phone-portrait-outline' },
  'ri-mail-send-line':        { lib: 'Ionicons', name: 'send-outline' },
  'ri-map-pin-user-line':     { lib: 'MCI',      name: 'map-marker-account-outline' },
  'ri-phone-fill':            { lib: 'Ionicons', name: 'call' },
  'ri-message-3-fill':        { lib: 'Ionicons', name: 'chatbubbles' },
  'ri-edit-2-line':           { lib: 'Ionicons', name: 'create-outline' },
  'ri-user-follow-line':      { lib: 'Ionicons', name: 'person-add-outline' },
  'ri-lightbulb-flash-line':  { lib: 'Ionicons', name: 'bulb-outline' },
  'ri-seedling-fill':         { lib: 'MCI',      name: 'sprout' },
  'ri-medal-fill':            { lib: 'Ionicons', name: 'medal-outline' },
  'ri-wifi-line':             { lib: 'Ionicons', name: 'wifi-outline' },
  'ri-wifi-off-line':         { lib: 'Ionicons', name: 'wifi-outline' },
  'ri-radar-line':            { lib: 'MCI',      name: 'radar' },
  'ri-collapse-diagonal-line':{ lib: 'Ionicons', name: 'contract-outline' },
  'ri-expand-diagonal-line':  { lib: 'Ionicons', name: 'expand-outline' },
  'ri-shopping-bag-line':     { lib: 'Ionicons', name: 'bag-outline' },
  'ri-settings-4-fill':       { lib: 'Ionicons', name: 'settings' },
  'ri-logout-box-r-line':     { lib: 'Ionicons', name: 'log-out-outline' },

  // ── Notifications ──────────────────────────────────────────────────────────
  'ri-notification-3-fill':   { lib: 'Ionicons', name: 'notifications' },
  'ri-notification-off-line': { lib: 'Ionicons', name: 'notifications-off-outline' },

  // ── Status / feedback ──────────────────────────────────────────────────────
  'ri-close-circle-fill':     { lib: 'Ionicons', name: 'close-circle' },
  'ri-time-fill':             { lib: 'Ionicons', name: 'time' },
  'ri-loader-4-line':         { lib: 'Ionicons', name: 'sync-outline' },
  'ri-check-double-line':     { lib: 'Ionicons', name: 'checkmark-done-outline' },
  'ri-shield-check-fill':     { lib: 'Ionicons', name: 'shield-checkmark' },
  'ri-shield-check-line':     { lib: 'Ionicons', name: 'shield-checkmark-outline' },
  'ri-subtract-line':         { lib: 'Ionicons', name: 'remove-outline' },

  // ── Waste / recycling ──────────────────────────────────────────────────────
  'ri-delete-bin-6-fill':     { lib: 'MCI',      name: 'delete' },
  'ri-delete-bin-6-line':     { lib: 'Ionicons', name: 'trash-outline' },
  'ri-delete-bin-5-line':     { lib: 'Ionicons', name: 'trash-outline' },
  'ri-recycle-fill':          { lib: 'MCI',      name: 'recycle' },

  // ── Messaging / communication ──────────────────────────────────────────────
  'ri-send-plane-fill':       { lib: 'Ionicons', name: 'send' },
  'ri-send-plane-2-fill':     { lib: 'Ionicons', name: 'send' },
  'ri-attachment-2':          { lib: 'Ionicons', name: 'attach-outline' },

  // ── Map / location ─────────────────────────────────────────────────────────
  'ri-map-pin-5-fill':        { lib: 'MCI',      name: 'map-marker' },
  'ri-map-pin-user-fill':     { lib: 'MCI',      name: 'map-marker-account' },
  'ri-map-fill':              { lib: 'Ionicons', name: 'map' },
  'ri-map-line':              { lib: 'Ionicons', name: 'map-outline' },

  // ── Users ──────────────────────────────────────────────────────────────────
  'ri-user-3-fill':           { lib: 'Ionicons', name: 'person' },
  'ri-user-smile-fill':       { lib: 'Ionicons', name: 'happy' },
  'ri-user-settings-fill':    { lib: 'Ionicons', name: 'person-circle' },

  // ── Documents / orders ────────────────────────────────────────────────────
  'ri-file-list-3-line':      { lib: 'Ionicons', name: 'document-text-outline' },
  'ri-archive-line':          { lib: 'Ionicons', name: 'archive-outline' },
  'ri-archive-fill':          { lib: 'Ionicons', name: 'archive' },

  // ── Finance / rewards ─────────────────────────────────────────────────────
  'ri-copper-coin-fill':      { lib: 'Ionicons', name: 'cash' },
  'ri-award-fill':            { lib: 'Ionicons', name: 'trophy' },
  'ri-wallet-3-line':         { lib: 'Ionicons', name: 'wallet-outline' },

  // ── Transport ─────────────────────────────────────────────────────────────
  'ri-moped-fill':            { lib: 'MCI',      name: 'moped' },
  'ri-moped-line':            { lib: 'MCI',      name: 'moped' },
  'ri-tricycle-fill':         { lib: 'MCI',      name: 'rickshaw' },
  'ri-tricycle-line':         { lib: 'MCI',      name: 'rickshaw-electric' },
  'ri-radar-fill':            { lib: 'Ionicons', name: 'radio' },

  // ── System / settings ─────────────────────────────────────────────────────
  'ri-tools-fill':            { lib: 'Ionicons', name: 'construct' },
  'ri-database-2-fill':       { lib: 'Ionicons', name: 'server' },
  'ri-translate':             { lib: 'Ionicons', name: 'language-outline' },
  'ri-volume-up-fill':        { lib: 'Ionicons', name: 'volume-high' },
  'ri-search-eye-line':       { lib: 'Ionicons', name: 'search-outline' },
  'ri-calendar-event-line':   { lib: 'Ionicons', name: 'calendar-outline' },

  // Missing User App icon mappings
  'ri-shopping-bag-3-fill':   { lib: 'Ionicons', name: 'bag' },
  'ri-handbag-fill':          { lib: 'Ionicons', name: 'basket' },
  'ri-grid-fill':             { lib: 'Ionicons', name: 'grid' },
  'ri-whatsapp-fill':         { lib: 'Ionicons', name: 'logo-whatsapp' },
  'ri-mail-fill':             { lib: 'Ionicons', name: 'mail' },
  'ri-shield-user-fill':      { lib: 'MCI',      name: 'account-shield' },
  'ri-wallet-3-fill':         { lib: 'Ionicons', name: 'wallet' },
  'ri-file-shield-fill':      { lib: 'MCI',      name: 'file-shield' },
  'ri-credit-card-line':      { lib: 'Ionicons', name: 'card-outline' },
  'ri-user-unfollow-line':    { lib: 'Ionicons', name: 'person-remove-outline' },
  'ri-bill-fill':             { lib: 'MCI',      name: 'receipt-text' },
  'ri-broadcast-line':        { lib: 'MCI',      name: 'broadcast' },
  'ri-sound-module-line':     { lib: 'Ionicons', name: 'options-outline' },
  'ri-briefcase-line':        { lib: 'Ionicons', name: 'briefcase-outline' },
  'ri-home-line':             { lib: 'Ionicons', name: 'home-outline' },
  'ri-map-2-line':            { lib: 'Ionicons', name: 'map-outline' },
  'ri-home-4-fill':           { lib: 'Ionicons', name: 'home' },
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
