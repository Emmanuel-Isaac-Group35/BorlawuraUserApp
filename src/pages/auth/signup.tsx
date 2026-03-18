import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../context/AuthContext';

const SignupPage = () => {
  const navigation = useNavigation<any>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (fullName && phoneNumber && password && !isLoading) {
      setIsLoading(true);
      const cleanNumber = phoneNumber.replace(/\s+/g, '');
      const finalNumber = cleanNumber.startsWith('0') ? cleanNumber.substring(1) : cleanNumber;
      const fullNumber = `+233${finalNumber}`;
      
      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      
      try {
        const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
          method: 'POST',
          headers: {
            'api-key': 'UEJrVktDRnBqeWZpdmxXSG1WbHk',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: 'BorlaWura',
            message: `Your BorlaWura verification code is: ${otpCode}`,
            recipients: [fullNumber]
          })
        });
        
        await response.json();
        
        // Trigger a local push notification with the OTP
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "BorlaWura Verification",
              body: `Your verification code is: ${otpCode}`,
              sound: true,
            },
            trigger: null,
          });
        }
        
        setIsLoading(false);
        navigation.navigate('OTP', { 
          phoneNumber: fullNumber,
          generatedOtp: otpCode,
          name: fullName.trim(),
          email: email.trim(),
          password: password,
          isSignup: true
        });
      } catch (error) {
        // Fallback
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "BorlaWura Verification",
              body: `Your verification code is: ${otpCode} (Fallback)`,
              sound: true,
            },
            trigger: null,
          });
        }

        setIsLoading(false);
        Alert.alert('Notice', 'Failed to send SMS, but we generated a code offline for testing.');
        navigation.navigate('OTP', { 
          phoneNumber: fullNumber,
          generatedOtp: otpCode,
          name: fullName.trim(),
          email: email.trim(),
          password: password,
          isSignup: true
        });
      }
    } else if (!fullName) {
      Alert.alert("Required", "Please enter your full name");
    } else if (!phoneNumber) {
      Alert.alert("Required", "Please enter your phone number");
    } else if (!password) {
      Alert.alert("Required", "Please create a password");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Section */}
          <View style={styles.topSection}>
            <View style={styles.illustrationContainer}>
              <Image
                source={require('../../../assets/gift_illustration.png')}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoText}>
                Create an account
              </Text>
            </View>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <Text style={styles.title}>Sign Up</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Email (Optional)"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#999"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={[styles.textInput, { flexDirection: 'row', alignItems: 'center', paddingVertical: 0 }]}>
                <TextInput
                  style={{ flex: 1, height: 50, color: '#000', fontSize: 16 }}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.countryPicker}>
                <Image
                  source={{ uri: 'https://flagcdn.com/w40/gh.png' }}
                  style={styles.flag}
                />
                <Text style={styles.countryCode}>+233</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>

              <TextInput
                style={styles.phoneInput}
                placeholder="Phone number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity 
              style={[styles.nextButton, (!phoneNumber || !fullName || isLoading) && styles.nextButtonDisabled]}
              onPress={handleSignup}
              disabled={!phoneNumber || !fullName || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.nextButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Auth')}>
              <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkBold}>Login</Text></Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    backgroundColor: '#32BA7C',
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  illustrationContainer: {
    height: 180,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    height: '100%',
    width: '100%',
  },
  promoTextContainer: {
    paddingHorizontal: 40,
    marginTop: 20,
  },
  promoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 30,
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    marginBottom: 15,
  },
  textInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  countryPicker: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 10,
  },
  flag: {
    width: 24,
    height: 16,
    marginRight: 8,
    borderRadius: 2,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
  },
  nextButton: {
    backgroundColor: '#32BA7C',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
    height: 56,
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#A0DDC0',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    padding: 10,
  },
  loginLinkText: {
    color: '#666',
    fontSize: 16,
  },
  loginLinkBold: {
    color: '#32BA7C',
    fontWeight: 'bold',
  },
});

export default SignupPage;
