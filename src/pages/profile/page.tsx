import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Modal, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { Navigation } from '../../components/feature/Navigation';
import { BottomNavigation } from '../../components/feature/BottomNavigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState({
    name: 'Akosua Mensah',
    email: 'akosua.mensah@email.com',
    phone: '+233 24 567 8901',
    avatar: 'https://readdy.ai/api/search-image?query=Professional%20African%20woman%20portrait%2C%20friendly%20smile%2C%20business%20casual%20attire%2C%20clean%20background%2C%20high-quality%20headshot%20photography%2C%20natural%20lighting%2C%20confident%20expression&width=100&height=100&seq=avatar1&orientation=squarish',
    joinDate: 'January 2024',
    totalOrders: 24,
    savedAmount: '₵180'
  });

  const [addresses, setAddresses] = useState([
    {
      id: 1,
      label: 'Home',
      address: '123 Osu Street, Accra',
      isDefault: true
    },
    {
      id: 2,
      label: 'Office',
      address: '456 East Legon, Accra',
      isDefault: false
    }
  ]);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showAddressMenu, setShowAddressMenu] = useState<number | null>(null);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const menuItems = [
    {
      icon: 'ri-map-pin-line',
      title: 'Saved Addresses',
      subtitle: `${addresses.length} addresses`,
      action: () => setShowAddAddress(true)
    },
    {
      icon: 'ri-credit-card-line',
      title: 'Payment Methods',
      subtitle: 'Manage your payment options',
      action: () => navigateTo('/profile/payment-methods')
    },
    {
      icon: 'ri-notification-3-line',
      title: 'Notifications',
      subtitle: 'Customize your alerts',
      action: () => navigateTo('/profile/notifications')
    },
    {
      icon: 'ri-gift-line',
      title: 'Referral Program',
      subtitle: 'Invite friends and earn rewards',
      action: () => navigateTo('/profile/referral')
    },
    {
      icon: 'ri-customer-service-2-line',
      title: 'Help & Support',
      subtitle: 'Get help when you need it',
      action: () => navigateTo('/support')
    },
    {
      icon: 'ri-file-text-line',
      title: 'Terms & Privacy',
      subtitle: 'Legal information',
      action: () => navigateTo('/profile/terms')
    },
    {
      icon: 'ri-information-line',
      title: 'About Borla Wura',
      subtitle: 'Version 1.0.0',
      action: () => navigateTo('/profile/about')
    }
  ];

  const handleEditProfile = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setShowEditProfile(true);
  };

  const handleSaveProfile = () => {
    setUser({
      ...user,
      name: editName,
      email: editEmail,
      phone: editPhone,
    });
    setShowEditProfile(false);
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setNewAddressLabel('');
    setNewAddress('');
    setShowAddAddress(true);
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setNewAddressLabel(address.label);
    setNewAddress(address.address);
    setShowAddAddress(true);
    setShowAddressMenu(null);
  };

  const handleDeleteAddress = (id: number) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAddresses(addresses.filter(addr => addr.id !== id));
            setShowAddressMenu(null);
          }
        }
      ]
    );
  };

  const handleSetDefaultAddress = (id: number) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
    setShowAddressMenu(null);
  };

  const handleSaveAddress = () => {
    if (!newAddressLabel || !newAddress) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newAddr = {
      id: editingAddress?.id || Date.now(),
      label: newAddressLabel,
      address: newAddress,
      isDefault: editingAddress?.isDefault || addresses.length === 0
    };

    if (editingAddress) {
      setAddresses(addresses.map(addr => addr.id === editingAddress.id ? newAddr : addr));
    } else {
      setAddresses([...addresses, newAddr]);
    }
    setShowAddAddress(false);
    setEditingAddress(null);
    setNewAddressLabel('');
    setNewAddress('');
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => Alert.alert('Success', 'Logged out successfully')
        }
      ]
    );
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
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <Text style={styles.profileJoinDate}>Member since {user.joinDate}</Text>
            </View>
            <TouchableOpacity
              onPress={handleEditProfile}
              style={styles.editButton}
            >
              <RemixIcon name="ri-edit-line" size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={[styles.statCard, styles.statCardBlue]}>
              <Text style={[styles.statValue, styles.statValueBlue]}>{user.savedAmount}</Text>
              <Text style={[styles.statLabel, styles.statLabelBlue]}>Money Saved</Text>
            </View>
          </View>
        </View>

        <View style={styles.addressesCard}>
          <View style={styles.addressesHeader}>
            <Text style={styles.addressesTitle}>Saved Addresses</Text>
            <TouchableOpacity onPress={handleAddAddress}>
              <Text style={styles.addButton}>Add New</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.addressesList}>
            {addresses.map((address) => (
              <View key={address.id} style={styles.addressCard}>
                <View style={styles.addressContent}>
                  <View style={styles.addressIcon}>
                    <RemixIcon name="ri-map-pin-line" size={20} color="#10b981" />
                  </View>
                  <View style={styles.addressInfo}>
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressLabel}>{address.label}</Text>
                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressText}>{address.address}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setShowAddressMenu(showAddressMenu === address.id ? null : address.id)}
                    style={styles.moreButton}
                  >
                    <RemixIcon name="ri-more-2-line" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>

                {showAddressMenu === address.id && (
                  <View style={styles.addressMenu}>
                    <TouchableOpacity
                      onPress={() => handleEditAddress(address)}
                      style={styles.menuItem}
                    >
                      <RemixIcon name="ri-edit-line" size={16} color="#374151" />
                      <Text style={styles.menuItemText}>Edit</Text>
                    </TouchableOpacity>
                    {!address.isDefault && (
                      <TouchableOpacity
                        onPress={() => handleSetDefaultAddress(address.id)}
                        style={styles.menuItem}
                      >
                        <RemixIcon name="ri-star-line" size={16} color="#374151" />
                        <Text style={styles.menuItemText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => handleDeleteAddress(address.id)}
                      style={styles.menuItem}
                    >
                      <RemixIcon name="ri-delete-bin-line" size={16} color="#dc2626" />
                      <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.action}
              style={[
                styles.menuItemCard,
                index !== menuItems.length - 1 && styles.menuItemBorder
              ]}
              activeOpacity={0.8}
            >
              <View style={styles.menuIcon}>
                <RemixIcon name={item.icon} size={20} color="#4b5563" />
              </View>
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
              <RemixIcon name="ri-arrow-right-s-line" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <RemixIcon name="ri-logout-box-line" size={20} color="#dc2626" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.versionText}>
          <Text style={styles.versionTextStyle}>Borla Wura v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBottomContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setShowEditProfile(false)}
                style={styles.closeButton}
              >
                <RemixIcon name="ri-close-line" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  style={styles.formInput}
                  placeholder="Enter your full name"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  value={editEmail}
                  onChangeText={setEditEmail}
                  style={styles.formInput}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  style={styles.formInput}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveProfile}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Address Modal */}
      <Modal
        visible={showAddAddress}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddAddress(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBottomContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddAddress(false);
                  setEditingAddress(null);
                }}
                style={styles.closeButton}
              >
                <RemixIcon name="ri-close-line" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Label</Text>
                <TextInput
                  value={newAddressLabel}
                  onChangeText={setNewAddressLabel}
                  style={styles.formInput}
                  placeholder="e.g., Home, Office, Gym"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address</Text>
                <TextInput
                  value={newAddress}
                  onChangeText={setNewAddress}
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Enter full address"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveAddress}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                {editingAddress ? 'Update Address' : 'Add Address'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfilePage;

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
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  profileJoinDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  editButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statCardBlue: {
    backgroundColor: '#eff6ff',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  statValueBlue: {
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#065f46',
  },
  statLabelBlue: {
    color: '#1e40af',
  },
  addressesCard: {
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
  addressesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addressesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  addButton: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
  },
  addressesList: {
    gap: 12,
  },
  addressCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    position: 'relative',
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#d1fae5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  addressText: {
    fontSize: 14,
    color: '#4b5563',
  },
  moreButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressMenu: {
    position: 'absolute',
    right: 16,
    top: 56,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
    minWidth: 160,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 14,
    color: '#374151',
  },
  menuItemTextDanger: {
    color: '#dc2626',
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#dc2626',
  },
  versionText: {
    alignItems: 'center',
    marginBottom: 24,
  },
  versionTextStyle: {
    fontSize: 12,
    color: '#9ca3af',
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
    maxHeight: '90%',
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
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  formGroup: {
    gap: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  formInput: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
});
