import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Alert, Modal, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RNAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '../lib/supabase';
import { registerForPushNotificationsAsync } from '../utils/notifications';

WebBrowser.maybeCompleteAuthSession();

// Context type definition
interface AuthContextType {
  isLoggedIn: boolean;
  isSuspended: boolean;
  user: any;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  isLoading: boolean;
  needsProfileCompletion: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  const processingRef = React.useRef(false);

  useEffect(() => {
    // 1. Manual Deep Link Interceptor (for OAuth)
    const handleDeepLink = async (event: { url: string }) => {
      console.log('🔗 Deep Link Detected:', event.url);
      if (event.url.includes('access_token=') || event.url.includes('refresh_token=')) {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();
        if (data?.session?.user) {
           handleSupabaseSession(data.session.user);
        } else if (error) {
           console.error('Deep link session error:', error);
           setIsLoading(false);
        }
      }
    };

    const linkSubscription = Linking.addEventListener('url', handleDeepLink);

    // Initial check for a deep link if the app was opened via one
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // 2. Listen for Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth State Event:', event, session?.user?.email);
      if (session?.user && !processingRef.current) {
        handleSupabaseSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    const handleSupabaseSession = async (supabaseUser: any) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setIsLoading(true);
      try {
        const { data: dbUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', supabaseUser.email)
          .maybeSingle();

        let finalUser = dbUser;
        if (!dbUser && !error) {
          // Auto-create user if they don't exist yet (First time Google Login)
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{
              email: supabaseUser.email,
              full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'New User',
              avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
              status: 'active',
              registration_status: 'approved'
            }])
            .select()
            .single();
            
          if (insertError) throw insertError;
          finalUser = newUser;
        }

        if (finalUser) {
          const storageUser = { 
            ...finalUser, 
            supabase_id: finalUser.id 
          };
          await RNAsyncStorage.setItem('user', JSON.stringify(storageUser));
          setUser(storageUser);
          
          // Check if profile is complete (needs address and phone)
          const isComplete = storageUser.location && storageUser.phone_number;
          setNeedsProfileCompletion(!isComplete);
          
          setIsLoggedIn(true);
          const isRestricted = ['suspended', 'flagged', 'rejected', 'pending'].includes(finalUser.status);
          setIsSuspended(isRestricted);
        }
      } catch (err) {
        console.error('OAuth sync error:', err);
      } finally {
        setIsLoading(false);
        processingRef.current = false;
      }
    };

    // 2. Check for persisted login state on app open
    const checkAuth = async () => {
      try {
        const storedUserJSON = await RNAsyncStorage.getItem('user');
        if (storedUserJSON) {
          try {
            const userData = JSON.parse(storedUserJSON);
            if (userData && (userData.id || userData.supabase_id)) {
              setUser(userData);
              setIsLoggedIn(true);
              
              // Re-check profile completion on startup
              const isComplete = userData.location && userData.phone_number;
              setNeedsProfileCompletion(!isComplete);

              const isRestricted = ['suspended', 'flagged', 'rejected', 'pending'].includes(userData.status);
              setIsSuspended(isRestricted);
            } else {
               // Corrupted data structure, clean it up
               await RNAsyncStorage.removeItem('user');
            }
          } catch (parseErr) {
            console.error('Invalid storage data, clearing...');
            await RNAsyncStorage.removeItem('user');
          }
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    return () => {
      subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  // Update push tokens in background
  useEffect(() => {
    const userId = user?.supabase_id || user?.id;
    if (userId && isLoggedIn && !String(userId).startsWith('user_')) {
      const isExpoGo = Constants.appOwnership === 'expo';
      if (!isExpoGo || Platform.OS === 'ios') {
        registerForPushNotificationsAsync().then(token => {
          if (token) {
            supabase.from('users').update({ push_token: token }).eq('id', userId).then();
          }
        });
      }
    }
  }, [user?.id, user?.supabase_id, isLoggedIn]);

  const login = async (userData: any) => {
    setIsLoading(true);
    try {
      const finalPhone = userData.phoneNumber || userData.phone_number;
      let dbUser: any = null;
      let authUserId: string | null = null;
      
      // CASE 1: Profile Completion (already have an auth user, just updating DB)
      if (userData.isProfileCompletion && (user?.supabase_id || user?.id)) {
        authUserId = user.supabase_id || user.id;
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              phone_number: finalPhone,
              location: userData.location || ''
            })
            .eq('id', authUserId)
            .select()
            .single();
        
        if (updateError) throw updateError;
        dbUser = updatedUser;
      } 
      // CASE 2: New Signup (Need to create Auth User AND DB User)
      else if (userData.isSignup) {
        // 1. Create the Auth Account in the Security Vault
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              full_name: userData.name,
              phone: finalPhone,
            }
          }
        });

        if (authError) {
          // If user already exists in Auth, try to just login or error
          if (authError.message.includes('already registered')) {
            throw new Error("This email is already registered. Please login instead.");
          }
          throw authError;
        }
        
        authUserId = authData.user?.id || null;

        // 2. Create or Update the Public Profile linked to that Auth ID
        if (authUserId) {
          // Check if a 'ghost' record already exists for this email or phone
          const { data: ghostRecord } = await supabase
            .from('users')
            .select('id')
            .or(`email.eq.${userData.email},phone_number.eq.${finalPhone}`)
            .maybeSingle();

          let insertedOrUpdatedUser: any = null;

          if (ghostRecord) {
            // Repair the ghost account by updating its ID to the new Auth ID
            const { data: repairedUser, error: repairError } = await supabase
              .from('users')
              .update({ 
                id: authUserId,
                phone_number: finalPhone,
                full_name: userData.name || '',
                location: userData.location || '',
                status: 'active'
              })
              .eq('id', ghostRecord.id)
              .select()
              .single();
            
            if (repairError) {
              // If update by ID fails (perhaps due to primary key constraints), try to just fetch what's there
              const { data: fallback } = await supabase.from('users').select('*').eq('id', authUserId).single();
              insertedOrUpdatedUser = fallback;
            } else {
              insertedOrUpdatedUser = repairedUser;
            }
          } else {
            // No ghost record, normal insert
            const { data: newUser, error: dbError } = await supabase
              .from('users')
              .insert([{ 
                  id: authUserId,
                  phone_number: finalPhone,
                  full_name: userData.name || '',
                  email: userData.email || '',
                  location: userData.location || '',
                  status: 'active',
                  registration_status: 'approved'
              }])
              .select()
              .single();
            if (!dbError) insertedOrUpdatedUser = newUser;
          }
          
          dbUser = insertedOrUpdatedUser || { id: authUserId, email: userData.email }; 
        }
      }
      // CASE 3: Standard Login State Update (Auth already happened in AuthPage)
      else if (finalPhone || userData.id) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .or(`id.eq.${userData.id},phone_number.eq.${finalPhone}`)
          .maybeSingle();
        dbUser = data;

        if (!dbUser) {
          throw new Error("User record not found in database.");
        }
      }

      const storageUser = { 
        ...(dbUser || userData), 
        supabase_id: dbUser?.id || authUserId || userData.id
      };

      await RNAsyncStorage.setItem('user', JSON.stringify(storageUser));
      setUser(storageUser);
      setNeedsProfileCompletion(false);
      setIsLoggedIn(true);
      setIsSuspended(['suspended', 'flagged', 'rejected', 'pending'].includes(storageUser.status));
      setIsLoading(false);
    } catch (e: any) {
      setIsLoading(false);
      Alert.alert('Auth Error', e.message);
      throw e;
    }
  };

  const signInWithGoogle = async () => {
    const redirectUrl = Linking.createURL('auth-callback');
    try {
      if (Platform.OS !== 'web') {
        await WebBrowser.warmUpAsync();
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        // Fail-safe: If the browser closed successfully, force-check for the session
        if (result.type === 'success') {
          if (Platform.OS === 'ios') WebBrowser.dismissBrowser();
          
          // Small delay to allow deep link processing, then force sync
          setTimeout(async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user && !isLoggedIn) {
              handleSupabaseSession(sessionData.session.user);
            }
          }, 500);
        }
      }
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message);
    } finally {
      if (Platform.OS !== 'web') {
        await WebBrowser.coolDownAsync();
      }
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      await RNAsyncStorage.removeItem('user');
      setUser(null);
      setIsLoggedIn(false);
      setIsSuspended(false);
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const refreshUser = async () => {
    const id = user?.supabase_id || user?.id;
    if (!id || String(id).startsWith('user_')) return;
    try {
      const { data } = await supabase.from('users').select('*').eq('id', id).single();
      if (data) {
        const updated = { ...user, ...data };
        setUser(updated);
        await RNAsyncStorage.setItem('user', JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Refresh error', e);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isSuspended, user, login, logout, refreshUser, signInWithGoogle, isLoading, needsProfileCompletion }}>
      {children}
      <Modal visible={isSuspended} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={user?.status === 'pending' ? "time" : "warning"} 
                size={60} 
                color={user?.status === 'pending' ? "#d97706" : "#dc2626"} 
              />
            </View>
            <Text style={styles.modalTitle}>
              {user?.status === 'pending' ? "Account Pending" : "Account Restricted"}
            </Text>
            <Text style={styles.modalSubtitle}>Your access has been restricted. Please contact support.</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 30, alignItems: 'center', width: '100%' },
  iconContainer: { marginBottom: 20, backgroundColor: '#fee2e2', padding: 20, borderRadius: 50 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 16, textAlign: 'center' },
  modalSubtitle: { fontSize: 16, color: '#4b5563', textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  logoutButton: { backgroundColor: '#dc2626', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 12, marginTop: 24, width: '100%', alignItems: 'center' },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
