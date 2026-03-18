import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation } from '../../../components/feature/Navigation';
import { BottomNavigation } from '../../../components/feature/BottomNavigation';
import { RemixIcon } from '../../../utils/icons';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';

const ReferralPage: React.FC = () => {
  const navigation = useNavigation();
  const [referralCode] = useState('AKOSUA2024');
  const [referralStats] = useState({
    totalReferrals: 12,
    successfulReferrals: 8,
    pendingReferrals: 4,
    totalEarnings: '₵96.00',
    availableBalance: '₵72.00'
  });

  const [showShareModal, setShowShareModal] = useState(false);

  const referralHistory = [
    {
      id: 1,
      name: 'Kwame Osei',
      date: '2024-01-10',
      status: 'completed',
      reward: '₵12.00'
    },
    {
      id: 2,
      name: 'Ama Serwaa',
      date: '2024-01-08',
      status: 'completed',
      reward: '₵12.00'
    },
    {
      id: 3,
      name: 'Kofi Mensah',
      date: '2024-01-15',
      status: 'pending',
      reward: '₵12.00'
    }
  ];

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(referralCode);
      Alert.alert('Success', 'Referral code copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code');
    }
  };

  const handleShare = async (platform: string) => {
    const message = `Join Borla Wura and get ₵10 off your first pickup! Use my code: ${referralCode}`;
    const url = `https://borlawura.com/ref/${referralCode}`;
    
    try {
      switch (platform) {
        case 'whatsapp':
          await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`);
          break;
        case 'facebook':
          await Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
          break;
        case 'twitter':
          await Linking.openURL(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`);
          break;
        case 'sms':
          await Linking.openURL(`sms:?body=${encodeURIComponent(message + ' ' + url)}`);
          break;
      }
      setShowShareModal(false);
    } catch (error) {
      Alert.alert('Error', 'Unable to share');
    }
  };

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
            <Text style={styles.title}>Referral Program</Text>
            <Text style={styles.subtitle}>Invite friends and earn rewards</Text>
          </View>
        </View>

        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <RemixIcon name="ri-gift-line" size={32} color="#ffffff" />
          </View>
          <Text style={styles.bannerTitle}>Earn ₵12 per Referral</Text>
          <Text style={styles.bannerSubtitle}>
            Share your code and earn rewards when friends complete their first pickup
          </Text>

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Your Referral Code</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeValue}>{referralCode}</Text>
              <TouchableOpacity
                onPress={handleCopyCode}
                style={styles.copyButton}
              >
                <RemixIcon name="ri-file-copy-line" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowShareModal(true)}
            style={styles.shareButton}
          >
            <Text style={styles.shareButtonText}>Share with Friends</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{referralStats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statValueSuccess]}>{referralStats.successfulReferrals}</Text>
            <Text style={styles.statLabel}>Successful</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{referralStats.totalEarnings}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statValueBlue]}>{referralStats.availableBalance}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        <View style={styles.howItWorksCard}>
          <Text style={styles.howItWorksTitle}>How It Works</Text>
          <View style={styles.stepsList}>
            {[
              { icon: 'ri-share-line', title: 'Share Your Code', desc: 'Send your referral code to friends' },
              { icon: 'ri-user-add-line', title: 'Friend Signs Up', desc: 'They create an account using your code' },
              { icon: 'ri-truck-line', title: 'First Pickup', desc: 'They complete their first waste pickup' },
              { icon: 'ri-coin-line', title: 'Earn Rewards', desc: 'You both get ₵12 credited' }
            ].map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepIcon}>
                  <RemixIcon name={step.icon} size={20} color="#10b981" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Referral History</Text>
          <View style={styles.historyList}>
            {referralHistory.map((referral) => (
              <View key={referral.id} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyIcon}>
                    <RemixIcon name="ri-user-line" size={20} color="#10b981" />
                  </View>
                  <View>
                    <Text style={styles.historyName}>{referral.name}</Text>
                    <Text style={styles.historyDate}>{referral.date}</Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={[
                    styles.historyReward,
                    referral.status === 'completed' ? styles.historyRewardSuccess : styles.historyRewardPending
                  ]}>
                    {referral.reward}
                  </Text>
                  <Text style={[
                    styles.historyStatus,
                    referral.status === 'completed' ? styles.historyStatusSuccess : styles.historyStatusPending
                  ]}>
                    {referral.status === 'completed' ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Share Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBottomContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share via</Text>
              <TouchableOpacity
                onPress={() => setShowShareModal(false)}
                style={styles.closeButton}
              >
                <RemixIcon name="ri-close-line" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.shareGrid}>
              {[
                { platform: 'whatsapp', icon: 'ri-whatsapp-line', label: 'WhatsApp', color: '#22c55e' },
                { platform: 'facebook', icon: 'ri-facebook-fill', label: 'Facebook', color: '#3b82f6' },
                { platform: 'twitter', icon: 'ri-twitter-fill', label: 'Twitter', color: '#60a5fa' },
                { platform: 'sms', icon: 'ri-message-3-line', label: 'SMS', color: '#6b7280' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.platform}
                  onPress={() => handleShare(option.platform)}
                  style={styles.shareOption}
                >
                  <View style={[styles.shareIconContainer, { backgroundColor: option.color }]}>
                    <RemixIcon name={option.icon} size={24} color="#ffffff" />
                  </View>
                  <Text style={styles.shareLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ReferralPage;

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
  banner: {
    backgroundColor: '#10b981',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  bannerIcon: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#d1fae5',
    textAlign: 'center',
    marginBottom: 24,
  },
  codeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 12,
    color: '#d1fae5',
    marginBottom: 8,
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  codeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 2,
  },
  copyButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
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
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statValueSuccess: {
    color: '#10b981',
  },
  statValueBlue: {
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  howItWorksCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  howItWorksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#4b5563',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyReward: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  historyRewardSuccess: {
    color: '#10b981',
  },
  historyRewardPending: {
    color: '#f97316',
  },
  historyStatus: {
    fontSize: 12,
  },
  historyStatusSuccess: {
    color: '#10b981',
  },
  historyStatusPending: {
    color: '#f97316',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBottomContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-around',
  },
  shareOption: {
    alignItems: 'center',
    width: '22%',
  },
  shareIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shareLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
