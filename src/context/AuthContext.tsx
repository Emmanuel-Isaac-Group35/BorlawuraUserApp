import React, { createContext, useContext, useState, useEffect } from 'react';


import { View, Alert, Modal, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RNAsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../lib/supabase';

// Context type definition
interface AuthContextType {
  isLoggedIn: boolean;
  isSuspended: boolean;
  user: any;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);

  useEffect(() => {
    // Check for persisted login state
    const checkAuth = async () => {
      try {
        const storedUserJSON = await RNAsyncStorage.getItem('user');
        if (storedUserJSON) {
          let userData = JSON.parse(storedUserJSON);
          
          // 1. Initial Data Sync: Ensure we have the latest record from DB
          // This is critical for catching suspensions that happened while the app was closed
          if (userData.id) {
             const { data: dbUser, error: checkError } = await supabase
               .from('users')
               .select('*')
               .eq('id', userData.id)
               .maybeSingle();
             
             if (dbUser) {
               userData = {
                 ...userData,
                 ...dbUser,
                 supabase_id: dbUser.id
               };
               // Persist the freshest data
               await RNAsyncStorage.setItem('user', JSON.stringify(userData));
             }
          }

          // 2. Re-sync logic for temporary IDs (Legacy fallback)
          if (userData.id && userData.id.toString().startsWith('user_')) {
            let searchPhone = (userData.phone_number || userData.phoneNumber || '').replace(/\s+/g, '');
            if (searchPhone.startsWith('0')) {
              searchPhone = '+233' + searchPhone.substring(1);
            } else if (searchPhone && !searchPhone.startsWith('+')) {
              searchPhone = '+233' + searchPhone;
            }
            
            const searchEmail = userData.email && userData.email.includes('@') ? userData.email : null;
            
            if (searchPhone || searchEmail) {
              let query = supabase.from('users').select('*');
              if (searchPhone && searchEmail) {
                query = query.or(`phone_number.eq.${searchPhone},email.eq.${searchEmail}`);
              } else if (searchPhone) {
                query = query.eq('phone_number', searchPhone);
              } else {
                query = query.eq('email', searchEmail);
              }
              
              const { data: dbUser } = await query.single();
              if (dbUser) {
                userData = {
                   ...userData,
                   ...dbUser,
                   supabase_id: dbUser.id,
                   id: dbUser.id // Overwrite temporary ID with real one
                };
                // Persist the fixed data
                await RNAsyncStorage.setItem('user', JSON.stringify(userData));
              }
            }
          }
          
          setUser(userData);
          setIsLoggedIn(true);

          // Update check for all restricted statuses
          const isRestricted = (
            ['suspended', 'flagged', 'pending'].includes(userData.status) || 
            ['rejected', 'pending'].includes(userData.registration_status)
          );
          setIsSuspended(isRestricted);
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Set up real-time monitoring when user is logged in
  useEffect(() => {
    let userChannel: any = null;
    const userId = user?.supabase_id || user?.id;

    if (userId && isLoggedIn) {
      console.log('Setting up real-time listener for user:', userId);
      userChannel = supabase
        .channel(`user-status-${userId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
          (payload) => {
            const newStatus = payload.new.status;
            const regStatus = payload.new.registration_status;
            
            console.log('Real-time status update received:', newStatus, regStatus);

            const shouldBlock = (
              ['suspended', 'flagged', 'pending'].includes(newStatus) || 
              ['rejected', 'pending'].includes(regStatus)
            );
            
            setIsSuspended(shouldBlock);
            setUser((prev: any) => prev ? { ...prev, status: newStatus, registration_status: regStatus } : null);
          }
        )
        .subscribe();
    }

    return () => {
      if (userChannel) {
        console.log('Removing real-time listener for user:', userId);
        supabase.removeChannel(userChannel);
      }
    };
  }, [user?.id, user?.supabase_id, isLoggedIn]);

  const login = async (userData: any) => {
    let existingUser: any = null;
    try {
      // Normalize phone number to used format
      const finalPhone = userData.phoneNumber || userData.phone_number;
      
      if (finalPhone) {
        try {
          const { data, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('phone_number', finalPhone)
            .maybeSingle();
          
          existingUser = data;

          if (!existingUser) {
            // User not found
            if (userData.isSignup) {
              // Only insert a new user if they used the Signup flow
              const { data: insertedUser, error: insertError } = await supabase
                .from('users')
                .insert([{ 
                    phone_number: finalPhone,
                    full_name: userData.name || '',
                    email: userData.email || '',
                    status: 'active',
                    registration_status: 'approved'
                }])
                .select()
                .single();
                
              if (insertError) {
                console.error('Supabase User Insert Error:', insertError);
                throw new Error(`Failed to create user in DB: ${insertError.message}`);
              }
              
              if (insertedUser) {
                existingUser = insertedUser;
              }
            } else {
               throw new Error("Account not found. Please sign up first.");
            }
          } else if (existingUser) {
            // If they are signing up again with the same number, but providing a new name/email
            if (userData.isSignup) {
               const { data: updatedUser } = await supabase
                  .from('users')
                  .update({ 
                     full_name: userData.name || existingUser.full_name,
                     email: userData.email || existingUser.email
                  })
                  .eq('id', existingUser.id)
                  .select()
                  .single();
 
               if (updatedUser) {
                 existingUser = updatedUser;
               }
            }
          }
        } catch (dbError: any) {
          console.error("Failed to sync user with DB:", dbError);
          throw new Error(dbError.message || "Failed to sync account in database.");
        }
      }

      const storageUser = { 
        ...userData, 
        ...existingUser, 
        phoneNumber: finalPhone, 
        phone_number: finalPhone,
        name: userData.name || existingUser?.full_name || '',
        full_name: userData.name || existingUser?.full_name || '',
        email: userData.email || existingUser?.email || '',
        supabase_id: existingUser?.id || userData.id
      };

      // CRITICAL SECURITY CHECK
      const restrictedStatuses = ['suspended', 'flagged', 'rejected'];
      const isActuallyRestricted = (
        restrictedStatuses.includes(storageUser.status) || 
        restrictedStatuses.includes(storageUser.registration_status)
      );
      
      if (isActuallyRestricted) {
         let message = "This account has been restricted by the administrator.";
         if (storageUser.status === 'suspended') message = "Your account has been suspended for violating terms of service.";
         else if (storageUser.status === 'flagged') message = "Your account is under review for security reasons.";
         else if (storageUser.registration_status === 'rejected') message = "Your account registration was not approved.";
         
         setIsSuspended(true);
         setUser(storageUser);
         setIsLoggedIn(false); // ENSURE THIS IS FALSE
         throw new Error(message);
      }

      // If pending, they can log in but will be blocked by the modal in the background
      const isPending = storageUser.status === 'pending' || storageUser.registration_status === 'pending';
      
      await RNAsyncStorage.setItem('user', JSON.stringify(storageUser));
      setUser(storageUser);
      setIsSuspended(isPending);
      setIsLoggedIn(true);
    } catch (e: any) {
      console.error('Login error', e);
      setIsLoggedIn(false);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await RNAsyncStorage.removeItem('user');
      setUser(null);
      setIsLoggedIn(false);
      setIsSuspended(false);
    } catch (e) {
      console.error('Failed to clear auth state', e);
    }
  };

  const refreshUser = async () => {
    if (!user?.id && !user?.supabase_id) return;
    try {
      const searchId = user.supabase_id || user.id;
      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', searchId)
        .single();
      
      if (dbUser) {
        const updatedUser = { ...user, ...dbUser, supabase_id: dbUser.id };
        setUser(updatedUser);
        await RNAsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (e) {
      console.error('Failed to refresh user', e);
    }
  };

  const getSuspendedMessage = () => {
     if (!user) return "Your account has been restricted.";
     const s = (user.status || '').toLowerCase();
     const rs = (user.registration_status || '').toLowerCase();

     if (s === 'suspended') return "Your account has been suspended by the administrator for violating terms of service.";
     if (s === 'flagged') return "Your account has been flagged for security review.";
     if (rs === 'rejected') return "Your account registration has been rejected.";
     if (rs === 'pending' || s === 'pending') return "Your account is currently pending administrative approval.";
     
     return "Your access to this application has been restricted.";
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isSuspended, user, login, logout, refreshUser, isLoading }}>
      {children}
      
      <Modal
        visible={isSuspended}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={(user?.status === 'pending' || user?.registration_status === 'pending') ? "time" : "warning"} 
                size={60} 
                color={(user?.status === 'pending' || user?.registration_status === 'pending') ? "#d97706" : "#dc2626"} 
              />
            </View>
            <Text style={styles.modalTitle}>
              {(user?.status === 'pending' || user?.registration_status === 'pending') ? "Account Pending" : "Account Restricted"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {getSuspendedMessage()}
            </Text>
            <Text style={styles.modalSubtitle}>
              Please contact support if you believe this is a mistake.
            </Text>
            <TouchableOpacity 
              style={[styles.logoutButton, (user?.status === 'pending' || user?.registration_status === 'pending') && { backgroundColor: '#d97706' }]}
              onPress={logout}
            >
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: '#fee2e2',
    padding: 20,
    borderRadius: 50,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
