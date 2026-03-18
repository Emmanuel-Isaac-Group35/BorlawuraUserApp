import React, { createContext, useContext, useState, useEffect } from 'react';


import { View, Alert, Modal, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RNAsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '../lib/supabase';

// Context type definition
interface AuthContextType {
  isLoggedIn: boolean;
  user: any;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
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
          
          // Re-sync logic: If the stored ID is a temporary string, 
          // try to recover the real UUID from Supabase
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

          if (userData.status === 'suspended') {
            setIsSuspended(true);
          }

          // Real-time account status monitoring
          const userChannel = supabase
            .channel(`user-status-${userData.id}`)
            .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userData.id}` },
              (payload) => {
                const newStatus = payload.new.status;
                if (newStatus === 'suspended') {
                  setIsSuspended(true);
                } else if (newStatus === 'active') {
                  setIsSuspended(false);
                }
              }
            )
            .subscribe();

          return () => {
             supabase.removeChannel(userChannel);
          };
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (userData: any) => {
    try {
      // Normalize phone number to used format
      const finalPhone = userData.phoneNumber || userData.phone_number;
      
      if (finalPhone) {
        try {
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('phone_number', finalPhone)
            .single();

          if (!existingUser && fetchError?.code === 'PGRST116') {
            // User not found
            if (userData.isSignup) {
              // Only insert a new user if they used the Signup flow
              const { data: insertedUser, error: insertError } = await supabase
                .from('users')
                .insert([{ 
                    phone_number: finalPhone,
                    full_name: userData.name || '',
                    email: userData.email || '',
                    password: userData.password || '', 
                    status: 'active'
                }])
                .select()
                .single();
                
              if (insertError) {
                console.error('Supabase User Insert Error:', insertError);
                throw new Error(`Failed to create user in DB: ${insertError.message}`);
              }
              
              if (insertedUser) {
                userData.id = insertedUser.id;
                userData.name = insertedUser.full_name;
                userData.email = insertedUser.email;
                userData.phone_number = insertedUser.phone_number;
              }
            } else {
               throw new Error("Account not found. Please sign up first.");
            }
          } else if (existingUser) {
            // If they are signing up again with the same number, but providing a new name/email
            if (userData.isSignup) {
               const { data: updatedUser, error: updateError } = await supabase
                  .from('users')
                  .update({ 
                     full_name: userData.name || existingUser.full_name,
                     email: userData.email || existingUser.email,
                     password: userData.password || existingUser.password
                  })
                  .eq('id', existingUser.id)
                  .select()
                  .single();

               if (updatedUser) {
                 userData.name = updatedUser.full_name;
                 userData.email = updatedUser.email;
               }
            }

            // Found existing user, copy their database ID and other fields
            userData.id = existingUser.id;
            userData.name = userData.name || existingUser.full_name;
            userData.email = userData.email || existingUser.email || userData.email_address;
            userData.phone_number = existingUser.phone_number;
            userData.location = existingUser.location;
          }
        } catch (dbError: any) {
          console.error("Failed to sync user with DB:", dbError);
          throw new Error(dbError.message || "Failed to sync account in database.");
        }
      }

      const storageUser = { 
        ...userData, 
        phoneNumber: finalPhone, 
        phone_number: finalPhone,
        name: userData.name || userData.full_name || '',
        full_name: userData.name || userData.full_name || '',
        email: userData.email || userData.email_address || '', // Ensure email is not lost
        supabase_id: userData.id // Explicitly track the real DB id
      };
      
      await RNAsyncStorage.setItem('user', JSON.stringify(storageUser));
      setUser(storageUser);
      setIsLoggedIn(true);
      
      if (storageUser.status === 'suspended') {
        setIsSuspended(true);
      } else {
        setIsSuspended(false);
      }
    } catch (e) {
      console.error('Failed to save auth state', e);
    }
  };

  const logout = async () => {
    try {
      await RNAsyncStorage.removeItem('user');
      setUser(null);
      setIsLoggedIn(false);
    } catch (e) {
      console.error('Failed to clear auth state', e);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, isLoading }}>
      {children}
      
      <Modal
        visible={isSuspended}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={60} color="#dc2626" />
            </View>
            <Text style={styles.modalTitle}>Account Suspended</Text>
            <Text style={styles.modalSubtitle}>
              Your account has been suspended by the administrator for violating terms of service.
            </Text>
            <Text style={styles.modalSubtitle}>
              Please contact support if you believe this is a mistake.
            </Text>
            <TouchableOpacity 
              style={styles.logoutButton}
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
