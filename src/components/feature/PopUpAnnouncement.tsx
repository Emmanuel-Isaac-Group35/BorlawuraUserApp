import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { RemixIcon } from '../../utils/icons';
import { typography } from '../../utils/typography';
import { useSettings } from '../../context/SettingsContext';

export const PopUpAnnouncement: React.FC = () => {
  const { width } = useWindowDimensions();
  const { settings } = useSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (settings?.mobileApp?.popupActive) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [settings]);

  if (!settings?.mobileApp) return null;

  const { 
    popupActive = false, 
    popupTitle = 'Announcement', 
    popupMessage = '', 
    popupImage = null 
  } = settings.mobileApp;

  // Final gate: Must be active
  if (!popupActive) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { width: width * 0.85 }]}>
          <TouchableOpacity 
            style={styles.closeBtn}
            onPress={() => setVisible(false)}
          >
            <RemixIcon name="ri-close-line" size={24} color="#64748b" />
          </TouchableOpacity>

          {popupImage && (
            <Image 
              source={{ uri: popupImage }} 
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <View style={styles.content}>
            <Text style={styles.title}>{popupTitle || 'Announcement'}</Text>
            <Text style={styles.message}>{popupMessage}</Text>
            
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.actionBtnText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // Sleek dark overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 25,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 28,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontFamily: typography.bold,
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    fontFamily: typography.medium,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  actionBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: typography.bold,
  },
});
