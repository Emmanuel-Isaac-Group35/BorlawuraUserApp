import React from 'react';
import { View, Text, StyleSheet, Modal, Image } from 'react-native';
import { useSettings } from '../../context/SettingsContext';
import { typography } from '../../utils/typography';
import { RemixIcon } from '../../utils/icons';

export const MaintenanceOverlay: React.FC = () => {
  const { settings } = useSettings();
  
  const isMaintenance = settings?.maintenanceMode || false;

  return (
    <Modal
      visible={isMaintenance}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.iconBox}>
           <RemixIcon name="ri-tools-fill" size={48} color="#10b981" />
        </View>
        
        <Text style={styles.title}>System Upgrade</Text>
        <Text style={styles.subtitle}>
          Borla Wura is currently undergoing scheduled maintenance to improve our eco-friendly services. 
        </Text>
        
        <View style={styles.card}>
           <RemixIcon name="ri-time-line" size={20} color="#64748b" />
           <Text style={styles.cardText}>We'll be back online shortly</Text>
        </View>

        <View style={styles.footer}>
           <Text style={styles.footerText}>Thank you for your patience!</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontFamily: typography.bold,
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardText: {
    fontSize: 14,
    fontFamily: typography.semiBold,
    color: '#475569',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
  },
  footerText: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: '#94a3b8',
  }
});
