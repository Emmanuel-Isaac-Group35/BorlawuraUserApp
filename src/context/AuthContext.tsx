import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, Alert, Modal, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../utils/typography';
import RNAsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '../lib/supabase';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigate } from '../utils/navigation';

WebBrowser.maybeCompleteAuthSession();

// Context type definition
interface AuthContextType {
  isLoggedIn: boolean;
  isSuspended: boolean;
  user: any;
  login: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  isLoading: boolean;
  isInitialLoading: boolean;
  needsProfileCompletion: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);
  const processingRef = React.useRef(false);

  useEffect(() => {
    // 1. Manual Deep Link Interceptor (for OAuth & Password Reset)
    const handleDeepLink = async (event: { url: string }) => {
      console.log('🔗 Deep Link Detected:', event.url);
      
      const getParamsFromUrl = (url: string) => {
        const params: { [key: string]: string } = {};
        const hashIndex = url.indexOf('#');
        const queryIndex = url.indexOf('?');
        
        let searchPart = '';
        if (hashIndex !== -1) {
          searchPart = url.substring(hashIndex + 1);
        } else if (queryIndex !== -1) {
          searchPart = url.substring(queryIndex + 1);
        }
        
        if (searchPart) {
          const pairs = searchPart.split('&');
          for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key && value) {
              params[decodeURIComponent(key)] = decodeURIComponent(value);
            }
          }
        }
        return params;
      };

      const params = getParamsFromUrl(event.url);
      const accessToken = params.access_token;
      const refreshToken = params.refresh_token;
      const code = params.code;

      let isResetting = event.url.includes('reset-password') || params.type === 'recovery';
      try {
        const isResetFlag = await RNAsyncStorage.getItem('isResettingPassword');
        if (isResetFlag === 'true') {
          isResetting = true;
          await RNAsyncStorage.removeItem('isResettingPassword');
        }
      } catch (storageErr) {
        console.error('Failed to read reset flag:', storageErr);
      }

      if (accessToken && refreshToken) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) throw error;
          
          if (data?.user) {
            await handleSupabaseSession(data.user);
            
            // Redirect to ResetPassword page if resetting password
            if (isResetting) {
              setTimeout(() => {
                navigate('ResetPassword');
              }, 500);
            }
          }
        } catch (err: any) {
          console.error('Deep link session recovery error:', err);
          Alert.alert('Auth Error', 'Failed to recover session from link: ' + err.message);
        } finally {
          setIsLoading(false);
          setIsInitialLoading(false);
        }
      } else if (code) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) throw error;
          
          if (data?.user) {
            await handleSupabaseSession(data.user);
            
            // Redirect to ResetPassword page if resetting password
            if (isResetting) {
              setTimeout(() => {
                navigate('ResetPassword');
              }, 500);
            }
          }
        } catch (err: any) {
          console.error('Deep link code exchange error:', err);
          Alert.alert('Auth Error', 'Failed to exchange verification code: ' + err.message);
        } finally {
          setIsLoading(false);
          setIsInitialLoading(false);
        }
      } else {
        setIsInitialLoading(false);
      }
    };

    const linkSubscription = Linking.addEventListener('url', handleDeepLink);

    // Initial check for a deep link if the app was opened via one
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      } else {
        setIsInitialLoading(false);
      }
    }).catch(() => {
      setIsInitialLoading(false);
    });

    // 2. Listen for Supabase Auth state changes
    const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth State Event:', event, session?.user?.email);
      
      if (session?.user) {
        if (!processingRef.current) {
          handleSupabaseSession(session.user);
        }
      } else if (event === 'SIGNED_OUT' || (event as any) === 'USER_DELETED') {
        // Clear local state only - do NOT call logout() as it triggers another signOut()
        await RNAsyncStorage.removeItem('user');
        setUser(null);
        setIsLoggedIn(false);
        setIsSuspended(false);
        setIsLoading(false);
      }
    });

    // 2. Check for persisted login state on app open
    const checkAuth = async () => {
      try {
        const initialUrl = await Linking.getInitialURL().catch(() => null);
        const isResetLink = initialUrl && (initialUrl.includes('access_token=') || initialUrl.includes('reset-password') || initialUrl.includes('recovery'));

        if (!isResetLink) {
          const storedUserJSON = await RNAsyncStorage.getItem('user');
          if (storedUserJSON) {
            try {
              const userData = JSON.parse(storedUserJSON);
              if (userData && (userData.id || userData.supabase_id)) {
                setUser(userData);
                setIsLoggedIn(true);
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
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        const initialUrl = await Linking.getInitialURL().catch(() => null);
        const isResetLink = initialUrl && (initialUrl.includes('access_token=') || initialUrl.includes('reset-password') || initialUrl.includes('recovery'));
        if (!isResetLink) {
          setIsInitialLoading(false);
        }
      }
    };

    checkAuth();
    return () => {
      if (authListener?.data?.subscription) {
        authListener.data.subscription.unsubscribe();
      }
      linkSubscription.remove();
    };
  }, []);

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
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'New User',
            phone_number: supabaseUser.user_metadata?.phone || supabaseUser.user_metadata?.phone_number || '',
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

  // Update push tokens in background
  useEffect(() => {
    const userId = user?.supabase_id || user?.id;
    if (userId && isLoggedIn && !String(userId).startsWith('user_')) {
      // SDK 53+ Check: executionEnvironment for Expo Go
      const executionEnv = (Constants as any).executionEnvironment || '';
      const isExpoGo = executionEnv === 'storeClient';

      // Android push notifications are removed from Expo Go in SDK 53
      const shouldRegister = !isExpoGo || Platform.OS === 'ios';

      if (shouldRegister) {
        (async () => {
          try {
            const pref = await AsyncStorage.getItem('pushEnabled');
            if (pref === null || pref === 'true') {
              registerForPushNotificationsAsync().then(token => {
                if (token) {
                  supabase.from('users').update({ push_token: token }).eq('id', userId).then();
                }
              }).catch(err => console.log('Push Token background error:', err));
            }
          } catch (e) {
            // fallback: allow registration
            registerForPushNotificationsAsync().then(token => {
              if (token) {
                supabase.from('users').update({ push_token: token }).eq('id', userId).then();
              }
            }).catch(err => console.log('Push Token background error:', err));
          }
        })();
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
        let { data: authData, error: authError } = await supabase.auth.signUp({
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
          // If user already exists in Auth, they might be stuck in "partial registration"
          if (authError.message.includes('already registered')) {
             console.log("User exists in Auth. Attempting profile recovery...");
             const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: userData.email,
                password: userData.password
             });
             if (retryError) throw new Error("This email is already registered. If you forgot your password, please reset it.");
             authData = retryData;
          } else {
             throw authError;
          }
        }
        
        authUserId = authData.user?.id || null;
        const isEmailConfRequired = authData.user && !authData.session;

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

        if (isEmailConfRequired) {
          setIsLoading(false);
          return { emailVerificationRequired: true };
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
        supabase_id: dbUser?.id || authUserId || userData.id,
        phone_number: dbUser?.phone_number || userData.phone_number || userData.phoneNumber,
        phoneNumber: dbUser?.phone_number || userData.phone_number || userData.phoneNumber
      };

      await RNAsyncStorage.setItem('user', JSON.stringify(storageUser));
      setUser(storageUser);
      setIsLoggedIn(true);
      setIsSuspended(['suspended', 'flagged', 'rejected', 'pending'].includes(storageUser.status));
      setIsLoading(false);
    } catch (e: any) {
      setIsLoading(false);
      Alert.alert('Auth Error', e.message);
      throw e;
    }
  };

  // ── Helper: extract query/hash params from any URL ─────────────────────
  const parseUrlParams = (url: string): Record<string, string> => {
    const params: Record<string, string> = {};
    const hashIdx = url.indexOf('#');
    const queryIdx = url.indexOf('?');
    let searchPart = '';
    if (hashIdx !== -1) {
      searchPart = url.substring(hashIdx + 1);
    } else if (queryIdx !== -1) {
      searchPart = url.substring(queryIdx + 1);
    }
    if (searchPart) {
      searchPart.split('&').forEach(pair => {
        const eqIdx = pair.indexOf('=');
        if (eqIdx > 0) {
          const k = decodeURIComponent(pair.substring(0, eqIdx));
          const v = decodeURIComponent(pair.substring(eqIdx + 1).replace(/\+/g, ' '));
          params[k] = v;
        }
      });
    }
    return params;
  };

  const signInWithGoogle = async () => {
    const redirectUrl = Linking.createURL('auth-callback');
    console.log('🔗 OAuth redirect URL:', redirectUrl);

    try {
      if (Platform.OS !== 'web') await WebBrowser.warmUpAsync();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
      });
      if (error) throw error;

      if (!data?.url) {
        throw new Error('Could not generate Google sign-in URL. Please try again.');
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        if (Platform.OS === 'ios') WebBrowser.dismissBrowser();

        // ── Directly process the callback URL ─────────────────────────
        const params = parseUrlParams(result.url);
        setIsLoading(true);

        try {
          if (params.access_token && params.refresh_token) {
            // Implicit flow — tokens are in the URL fragment
            const { data: sd, error: se } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            if (se) throw se;
            if (sd?.user) await handleSupabaseSession(sd.user);

          } else if (params.code) {
            // PKCE flow — exchange code for session
            const { data: cd, error: ce } = await supabase.auth.exchangeCodeForSession(params.code);
            if (ce) throw ce;
            if (cd?.user) await handleSupabaseSession(cd.user);

          } else {
            // Fallback: check if a session already exists (sometimes tokens
            // arrive via the deep-link listener before we get here)
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user) {
              await handleSupabaseSession(sessionData.session.user);
            } else {
              throw new Error('Google sign-in completed but no session was returned. Please try again.');
            }
          }
        } catch (sessionErr: any) {
          console.error('OAuth session error:', sessionErr);
          // Last-resort fallback after a short delay
          setTimeout(async () => {
            const { data: fallback } = await supabase.auth.getSession();
            if (fallback?.session?.user && !isLoggedIn) {
              handleSupabaseSession(fallback.session.user);
            }
          }, 1000);
          throw sessionErr;
        } finally {
          setIsLoading(false);
        }

      } else if (result.type === 'cancel' || (result as any).type === 'dismiss') {
        // User closed the browser — silently do nothing
        console.log('Google sign-in cancelled by user');
      } else {
        // Unexpected state — try a session poll as last resort
        setTimeout(async () => {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.user && !isLoggedIn) {
            handleSupabaseSession(sessionData.session.user);
          }
        }, 800);
      }

    } catch (err: any) {
      Alert.alert(
        'Google Sign-In Failed',
        err.message || 'Unable to connect with Google. Please check your internet connection and try again.'
      );
    } finally {
      if (Platform.OS !== 'web') {
        try { await WebBrowser.coolDownAsync(); } catch { /* ignore */ }
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

  const needsProfileCompletion = isLoggedIn && user && !user.phone_number;

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      isSuspended, 
      user, 
      login, 
      logout, 
      refreshUser, 
      signInWithGoogle, 
      isLoading,
      isInitialLoading,
      needsProfileCompletion
    }}>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#fff', borderRadius: 32, padding: 32, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  iconContainer: { marginBottom: 24, backgroundColor: '#fef2f2', width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 24, fontFamily: typography.bold, color: '#0f172a', marginBottom: 16, textAlign: 'center' },
  modalSubtitle: { fontSize: 16, fontFamily: typography.medium, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  logoutButton: { backgroundColor: '#ef4444', paddingVertical: 16, borderRadius: 16, width: '100%', alignItems: 'center', shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  logoutButtonText: { color: '#fff', fontSize: 16, fontFamily: typography.bold },
});
