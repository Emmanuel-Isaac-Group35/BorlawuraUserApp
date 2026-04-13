import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, TextInput, Alert, Image, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { BottomNavigation } from '../../components/feature/BottomNavigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import RNAsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const ProfilePage: React.FC = () => {
  const { logout, refreshUser, user: authUser } = useAuth();
  const [user, setUser] = useState({
    name: authUser?.full_name || authUser?.name || 'Valued User',
    email: authUser?.email || 'No email provided',
    phone: authUser?.phone_number || authUser?.phoneNumber || 'No phone number',
    avatar: authUser?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // Generic avatar
    joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    totalOrders: 0
  });

  const [isLoading, setIsLoading] = useState(false);

  const fetchUserData = async () => {
    // Background update from DB for fresh stats
    if (authUser?.supabase_id || authUser?.id) {
      const searchId = authUser.supabase_id || authUser.id;
      if (!searchId || String(searchId).startsWith('user_')) return;
      
      setIsLoading(true);
      try {
        // Fetch real stats from DB
        const { data: dbUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', searchId)
          .single();

        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', searchId)
          .eq('status', 'completed');

        if (dbUser) {
          setUser(prev => ({
            ...prev,
            name: dbUser.full_name || prev.name,
            email: dbUser.email || prev.email,
            phone: dbUser.phone_number || prev.phone,
            avatar: dbUser.avatar_url || prev.avatar,
            totalOrders: count || 0
          }));
        }
      } catch (e) {
        console.error("Failed to fetch fresh user data:", e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (authUser) {
      // Sync local state when authUser changes
      setUser(prev => ({
        ...prev,
        name: authUser.full_name || authUser.name || 'Valued User',
        email: authUser.email || 'No email provided',
        phone: authUser.phone_number || authUser.phoneNumber || 'No phone number'
      }));
      fetchUserData();

      // Listen for real-time changes
      const searchId = authUser.supabase_id || authUser.id;
      if (searchId && !String(searchId).startsWith('user_')) {
        const channel = supabase
          .channel('profile-stats-updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `user_id=eq.${searchId}`,
            },
            (payload) => {
              console.log('Profile stats update received:', payload);
              fetchUserData(); 
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [authUser]);



  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    const loadStoredAddresses = async () => {
      try {
        const stored = await RNAsyncStorage.getItem('user_addresses');
        if (stored) {
          setAddresses(JSON.parse(stored));
        } else {
          // Initialize with register location if nothing stored
          setAddresses([
            {
              id: 1,
              label: 'Register Location',
              address: authUser?.location || 'No location set',
              isDefault: true
            }
          ]);
        }
      } catch (e) {
        console.error("Failed to load addresses", e);
      }
    };
    loadStoredAddresses();
  }, [authUser?.location]);

  useEffect(() => {
    const saveAddresses = async () => {
      try {
        await RNAsyncStorage.setItem('user_addresses', JSON.stringify(addresses));
      } catch (e) {
        console.error("Failed to save addresses", e);
      }
    };
    if (addresses.length > 0) {
      saveAddresses();
    }
  }, [addresses]);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [showAddressMenu, setShowAddressMenu] = useState<number | null>(null);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setEditAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You've refused to allow this app to access your camera!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setEditAvatar(result.assets[0].uri);
    }
  };

  const menuItems = [
    {
      icon: 'ri-map-pin-line',
      title: 'Saved Addresses',
      subtitle: `${addresses.length} addresses`,
      action: () => setShowAddAddress(true)
    },
    {
      icon: 'ri-notification-3-line',
      title: 'Notifications',
      subtitle: 'Customize your alerts',
      action: () => navigateTo('/profile/notifications')
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

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const searchId = authUser?.supabase_id || authUser?.id;
      if (searchId && !String(searchId).startsWith('user_')) {
        const { error } = await supabase
          .from('users')
          .update({
            full_name: editName,
            email: editEmail,
            phone_number: editPhone
          })
          .eq('id', searchId);
        
        if (error) throw error;
      }

      setUser({
        ...user,
        name: editName,
        email: editEmail,
        phone: editPhone,
      });
      setShowEditProfile(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (e) {
      console.error("Error saving profile:", e);
      Alert.alert("Error", "Failed to save profile changes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAvatar = async () => {
    if (!editAvatar) return;
    
    setIsLoading(true);
    try {
      const searchId = authUser?.supabase_id || authUser?.id;
      if (searchId && !String(searchId).startsWith('user_')) {
        const { error } = await supabase
          .from('users')
          .update({
            avatar_url: editAvatar
          })
          .eq('id', searchId);
        
        if (error) throw error;
      }

      setUser(prev => ({
        ...prev,
        avatar: editAvatar
      }));
      await refreshUser();
      setShowAvatarModal(false);
      Alert.alert("Success", "Profile picture updated successfully");
    } catch (e) {
      console.error("Error updating avatar:", e);
      Alert.alert("Error", "Failed to update profile picture");
    } finally {
      setIsLoading(false);
    }
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
          onPress: async () => {
            await logout();
          }
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
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={fetchUserData} 
            colors={['#10b981']}
            tintColor={'#10b981'}
          />
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity 
              onPress={() => {
                setEditAvatar(user.avatar);
                setShowAvatarModal(true);
              }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: user.avatar }}
                style={styles.avatar}
              />
              <View style={styles.avatarEditBadge}>
                <RemixIcon name="ri-camera-line" size={12} color="#fff" />
              </View>
            </TouchableOpacity>
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

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
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
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      {/* Avatar Modal */}
      <Modal
        visible={showAvatarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Profile Picture</Text>
            <Text style={styles.modalSubtitle}>Upload a photo from your device</Text>
            
            <View style={styles.avatarPreviewContainer}>
              <Image source={{ uri: editAvatar }} style={styles.avatarPreview} />
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24, width: '100%', justifyContent: 'center' }}>
              <TouchableOpacity onPress={takePhoto} style={styles.imagePickerBtn}>
                <RemixIcon name="ri-camera-fill" size={24} color="#10b981" />
                <Text style={styles.imagePickerText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={pickImage} style={styles.imagePickerBtn}>
                <RemixIcon name="ri-image-add-fill" size={24} color="#10b981" />
                <Text style={styles.imagePickerText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShowAvatarModal(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateAvatar}
                style={styles.modalSubmitButton}
              >
                <Text style={styles.modalSubmitButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#f3f4f6',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    backgroundColor: '#10b981',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
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
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  imagePickerBtn: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  imagePickerText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  suggestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  suggestedItem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 2,
  },
  suggestedItemActive: {
    borderColor: '#10b981',
  },
  suggestedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
});
