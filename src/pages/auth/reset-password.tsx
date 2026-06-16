import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { typography } from '../../utils/typography';
import { supabase } from '../../lib/supabase';

const ResetPasswordPage = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const fromSettings = route.params?.fromSettings || false;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Required", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      if (fromSettings) {
        Alert.alert("Success", "Your password has been changed successfully.", [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
            }
          }
        ]);
      } else {
        Alert.alert("Success", "Your password has been reset successfully. Please login with your new password.", [
          {
            text: "Log In",
            onPress: async () => {
              try {
                await supabase.auth.signOut();
              } catch (signOutErr) {
                console.error('Sign out error on password reset:', signOutErr);
              }
              navigation.navigate('Auth');
            }
          }
        ]);
      }
    } catch (error: any) {
      Alert.alert("Reset Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={async () => {
              if (fromSettings) {
                navigation.goBack();
              } else {
                try {
                  await supabase.auth.signOut();
                } catch (signOutErr) {
                  console.error('Sign out error on password reset back button:', signOutErr);
                }
                navigation.navigate('Auth');
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed-outline" size={40} color="#10b981" />
          </View>

          <Text style={styles.title}>{fromSettings ? "Change Password" : "New Password"}</Text>
          <Text style={styles.subtitle}>
            Please enter your new password below. Ensure it is secure and easy for you to remember.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.resetBtn, (!password || !confirmPassword || isLoading) && styles.resetBtnDisabled]}
            onPress={handleUpdatePassword}
            disabled={!password || !confirmPassword || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.resetBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { paddingHorizontal: 20 },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 30, paddingTop: 20, alignItems: 'center' },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: { fontSize: 28, fontFamily: typography.bold, color: '#0f172a', textAlign: 'center' },
  subtitle: { 
    fontSize: 15, 
    fontFamily: typography.medium, 
    color: '#64748b', 
    marginTop: 12, 
    marginBottom: 40, 
    textAlign: 'center',
    lineHeight: 24
  },
  inputGroup: { width: '100%', marginBottom: 20 },
  label: { fontSize: 13, fontFamily: typography.bold, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
  },
  eyeIcon: { paddingHorizontal: 15 },
  resetBtn: {
    marginTop: 20,
    height: 56,
    backgroundColor: '#10b981',
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  resetBtnDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
  resetBtnText: { fontSize: 16, fontFamily: typography.bold, color: '#ffffff' },
});

export default ResetPasswordPage;
