import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, 
  Alert, RefreshControl, Modal, TextInput, ActivityIndicator, Platform 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import RNAsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Navigation } from '../../components/feature/Navigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { typography } from '../../utils/typography';
import { decode } from 'base64-arraybuffer';

const ProfilePage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { logout, refreshUser, user: authUser } = useAuth();
  const [user, setUser] = useState({
    name: authUser?.full_name || authUser?.name || 'Valued User',
    email: authUser?.email || 'No email provided',
    phone: (authUser?.phone_number === '0000000000' || authUser?.phone_number === '00000000000') ? 'No phone number' : (authUser?.phone_number || authUser?.phoneNumber || 'No phone number'),
    avatar: authUser?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    joinDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    totalOrders: 0,
    rewards: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUserData = async () => {
    if (authUser?.supabase_id || authUser?.id) {
      const searchId = authUser.supabase_id || authUser.id;
      if (!searchId || String(searchId).startsWith('user_')) return;
      
      setIsLoading(true);
      try {
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
          const avatarUrl = dbUser.avatar_url 
            ? `${dbUser.avatar_url.split('?')[0]}?t=${new Date().getTime()}`
            : user.avatar;

          setUser(prev => ({
            ...prev,
            name: dbUser.full_name || prev.name,
            email: dbUser.email || prev.email,
            phone: (dbUser.phone_number === '0000000000' || dbUser.phone_number === '00000000000') ? 'No phone number' : (dbUser.phone_number || prev.phone),
            avatar: avatarUrl,
            totalOrders: count || 0,
            rewards: dbUser.reward_points || 0
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
      setUser(prev => ({
        ...prev,
        name: authUser.full_name || authUser.name || 'Valued User',
        email: authUser.email || 'No email provided',
        phone: authUser.phone_number || authUser.phoneNumber || 'No phone number'
      }));
      fetchUserData();

      const searchId = authUser.supabase_id || authUser.id;
      if (searchId && !String(searchId).startsWith('user_')) {
        const channel = supabase
          .channel('profile-stats-updates')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${searchId}` },
            () => fetchUserData()
          )
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      }
    }
  }, [authUser]);


  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const pickImage = async () => {
    // 1. Request Permissions
    const { status: libStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (libStatus !== 'granted' || camStatus !== 'granted') {
      Alert.alert('Permissions Required', 'We need access to your camera and gallery to update your profile picture.');
      return;
    }

    // 2. Choice Alert
    Alert.alert(
      'Update Photo',
      'Choose a source for your new profile picture',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) setEditAvatar(result.assets[0].uri);
          }
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled) setEditAvatar(result.assets[0].uri);
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const uploadAvatar = async (uri: string) => {
    try {
      const searchId = authUser?.supabase_id || authUser?.id;
      if (!searchId) return null;

      // 1. Determine file extension and MIME type
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const isPng = ext === 'png';
      const contentType = isPng ? 'image/png' : 'image/jpeg';
      
      // 2. Simplify path (direct in bucket)
      const fileName = `${searchId}-${Date.now()}.${ext}`;
      const filePath = fileName;

      // 3. Robust Conversion: URI -> Base64 -> ArrayBuffer
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
      const binaryData = decode(base64);

      // 4. Tactical Upload
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, binaryData, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.warn('[Avatar Upload Failure]:', error);
        
        // Context-aware errors
        if (error.message.includes('bucket not found')) {
           throw new Error("Storage bucket 'avatars' does not exist. Please ensure it is created in Supabase.");
        }
        if (error.message.includes('Permission denied')) {
           throw new Error("Access Denied: The storage bucket needs 'Public' access or RLS policies configured.");
        }
        throw error;
      }

      // 5. Resolution
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert("Upload Sync Failed", error.message || "An unexpected error occurred during binary data transfer.");
      return null;
    }
  };

  const handleEditProfile = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setEditAvatar(user.avatar);
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Required", "Full Name is required.");
      return;
    }
    
    setIsSaving(true);
    try {
      const searchId = authUser?.supabase_id || authUser?.id;
      if (searchId && !String(searchId).startsWith('user_')) {
        let finalAvatarUrl = editAvatar;

        // If avatar changed and it's a local file, upload it
        if (editAvatar !== user.avatar && !editAvatar.startsWith('http')) {
          const uploadedUrl = await uploadAvatar(editAvatar);
          if (uploadedUrl) {
            finalAvatarUrl = uploadedUrl;
          } else {
            throw new Error("Failed to upload avatar");
          }
        }

        const updates: any = { 
          full_name: editName, 
          email: editEmail, 
          phone_number: editPhone,
          avatar_url: finalAvatarUrl
        };
        
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', searchId);
        
        if (error) throw error;

        const bustedUrl = `${finalAvatarUrl}${finalAvatarUrl.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
        setUser(prev => ({ 
          ...prev, 
          name: editName, 
          email: editEmail, 
          phone: editPhone,
          avatar: bustedUrl
        }));
        
        setShowEditProfile(false);
        Alert.alert("Success", "Profile updated successfully");
        await refreshUser();
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save profile changes");
    } finally {
      setIsSaving(false);
    }
  };


  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the terminal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 70,
            paddingBottom: insets.bottom + 100
          }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchUserData} colors={['#10b981']} />}
      >
        <LinearGradient
          colors={['#10b981', '#065f46', '#022c22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHero}
        >
            <View style={styles.avatarWrapper}>
               <Image source={{ uri: user.avatar }} style={styles.avatar} />
               <View style={styles.verifiedBadgeAbsolute}>
                  <RemixIcon name="ri-checkbox-circle-fill" size={16} color="#10b981" />
               </View>
            </View>
            
            <View style={styles.nameRow}>
               <Text style={styles.nameText}>{user.name}</Text>
            </View>
            
            <View style={styles.heroContactRow}>
               <View style={styles.heroContactItem}>
                  <RemixIcon name="ri-mail-line" size={12} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.heroContactText}>{user.email}</Text>
               </View>
               <View style={styles.heroContactDivider} />
               <View style={styles.heroContactItem}>
                  <RemixIcon name="ri-phone-line" size={12} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.heroContactText}>{user.phone}</Text>
               </View>
            </View>

            <TouchableOpacity onPress={handleEditProfile} style={styles.unifiedEditBtn} activeOpacity={0.8}>
               <RemixIcon name="ri-edit-2-fill" size={14} color="#fff" />
               <Text style={styles.unifiedEditBtnText}>Edit Account</Text>
            </TouchableOpacity>
           
           <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.totalOrders}</Text>
                <Text style={styles.statLabel}>Pickups</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.rewards}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#34d399' }]} numberOfLines={1}>
                  {user.totalOrders >= 10 ? 'Master 🌿' : user.totalOrders >= 5 ? 'Hero 🌱' : 'Seedling 🍃'}
                </Text>
                <Text style={styles.statLabel}>Eco Badge</Text>
              </View>
           </View>
        </LinearGradient>


        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
           <RemixIcon name="ri-logout-box-r-line" size={18} color="#ef4444" />
           <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>


      {/* Unified Edit Profile Modal */}
      <Modal visible={showEditProfile} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBottomContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
               <View style={styles.editAvatarSection}>
                  <TouchableOpacity onPress={pickImage} style={styles.editAvatarWrapper}>
                     <Image source={{ uri: editAvatar || user.avatar }} style={styles.editAvatar} />
                     <View style={styles.editAvatarBadge}>
                        <RemixIcon name="ri-camera-fill" size={16} color="#fff" />
                     </View>
                  </TouchableOpacity>
                  <Text style={styles.editAvatarLabel}>Change Profile Photo</Text>
               </View>

               <View style={styles.formContainer}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Full Name</Text>
                    <TextInput 
                      style={styles.formInput} 
                      value={editName} 
                      onChangeText={setEditName} 
                      placeholder="Full Name" 
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Email</Text>
                    <TextInput 
                      style={styles.formInput} 
                      value={editEmail} 
                      onChangeText={setEditEmail} 
                      keyboardType="email-address" 
                      placeholder="Email Address" 
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Phone Number</Text>
                    <TextInput 
                      style={styles.formInput} 
                      value={editPhone} 
                      onChangeText={setEditPhone} 
                      keyboardType="phone-pad" 
                      placeholder="Phone Number" 
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
               </View>

               <TouchableOpacity 
                 style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
                 onPress={handleSaveProfile} 
                 disabled={isSaving}
               >
                  {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save All Changes</Text>}
               </TouchableOpacity>
               <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollView: { flex: 1 },
  content: { },
  profileHero: { 
    alignItems: 'center', 
    paddingVertical: 40, 
    borderBottomLeftRadius: 40, 
    borderBottomRightRadius: 40, 
    marginBottom: 32,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarWrapper: { 
    position: 'relative', 
    marginBottom: 16,
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 32, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderWidth: 3, 
    borderColor: 'rgba(255,255,255,0.2)' 
  },
  verifiedBadgeAbsolute: { 
    position: 'absolute', 
    bottom: -6, 
    right: -6, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#ffffff', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  nameText: { 
    fontSize: 24, 
    fontFamily: typography.bold, 
    color: '#ffffff',
    letterSpacing: -0.5
  },
  heroContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  heroContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroContactText: { 
    fontSize: 13, 
    fontFamily: typography.medium, 
    color: 'rgba(255,255,255,0.6)', 
  },
  heroContactDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  unifiedEditBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 14, 
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  unifiedEditBtnText: { 
    fontSize: 13, 
    fontFamily: typography.bold, 
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  statsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 32, 
    backgroundColor: 'rgba(255,255,255,0.08)', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { 
    fontSize: 15, 
    fontFamily: typography.bold, 
    color: '#ffffff' 
  },
  statLabel: { 
    fontSize: 9, 
    fontFamily: typography.bold, 
    color: 'rgba(255,255,255,0.4)', 
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  statDivider: { 
    width: 1, 
    height: 32, 
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  sectionContainer: { paddingHorizontal: 24, marginBottom: 32 },
  sectionTitle: { 
    fontSize: 13, 
    fontFamily: typography.bold, 
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 20,
    paddingLeft: 4,
  },
  menuList: { gap: 12 },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    padding: 16, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  menuIconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 16 
  },
  menuText: { flex: 1 },
  menuTitle: { 
    fontSize: 15, 
    fontFamily: typography.bold, 
    color: '#1e293b' 
  },
  menuSubtitle: { 
    fontSize: 12, 
    fontFamily: typography.medium, 
    color: '#94a3b8', 
    marginTop: 2 
  },
  logoutBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginHorizontal: 24, 
    paddingVertical: 18, 
    borderRadius: 20, 
    backgroundColor: '#ffffff', 
    borderWidth: 1,
    borderColor: '#fee2e2',
    gap: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  logoutBtnText: { 
    fontSize: 15, 
    fontFamily: typography.bold, 
    color: '#ef4444' 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.75)', 
    justifyContent: 'flex-end' 
  },
  modalBottomContent: { 
    backgroundColor: '#ffffff', 
    borderTopLeftRadius: 36, 
    borderTopRightRadius: 36, 
    padding: 24, 
    paddingBottom: 40, 
    maxHeight: '90%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 32 
  },
  modalTitle: { 
    fontSize: 22, 
    fontFamily: typography.bold, 
    color: '#0f172a',
    letterSpacing: -0.5
  },
  closeButton: { 
    width: 40, 
    height: 40, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  editAvatarSection: { alignItems: 'center', marginBottom: 32 },
  editAvatarWrapper: { position: 'relative' },
  editAvatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 32, 
    backgroundColor: '#f1f5f9' 
  },
  editAvatarBadge: { 
    position: 'absolute', 
    bottom: -4, 
    right: -4, 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: '#10b981', 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 3, 
    borderColor: '#fff' 
  },
  editAvatarLabel: { 
    fontSize: 14, 
    fontFamily: typography.bold, 
    color: '#10b981', 
    marginTop: 16 
  },
  formContainer: { gap: 20, marginBottom: 32 },
  formGroup: { gap: 8 },
  formLabel: { 
    fontSize: 13, 
    fontFamily: typography.bold, 
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  formInput: { 
    padding: 18, 
    backgroundColor: '#f8fafc', 
    borderWidth: 1, 
    borderColor: '#f1f5f9', 
    borderRadius: 18, 
    fontSize: 16, 
    fontFamily: typography.medium, 
    color: '#0f172a' 
  },
  saveButton: { 
    width: '100%', 
    backgroundColor: '#059669', 
    paddingVertical: 18, 
    borderRadius: 18, 
    alignItems: 'center', 
    shadowColor: '#059669', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 12,
    elevation: 4
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0
  },
  saveButtonText: { 
    fontSize: 16, 
    fontFamily: typography.bold, 
    color: '#ffffff' 
  },
});

export default ProfilePage;
