import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../context/AuthContext';

const OTPPage = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { login } = useAuth();
  const { phoneNumber, generatedOtp: initialOtp, name, email, password, isSignup } = route.params || { phoneNumber: '024 123 4567', generatedOtp: '1234' };
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [currentOtp, setCurrentOtp] = useState(initialOtp);
  const [timer, setTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const inputs = useRef<any>([]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }

    if (newOtp.every(digit => digit !== '')) {
      // Auto verify if all digits are entered
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const finalCode = code || otp.join('');
    if (finalCode.length === 4) {
      if (finalCode === currentOtp) {
        // Verification and login
        try {
          await login({ phoneNumber, id: 'user_' + Date.now(), name, email, password, isSignup });
          // Navigation is handled automatically by AuthNavigator in App.tsx
        } catch (error: any) {
          Alert.alert("Auth Error", error.message || "Failed to log in.");
          navigation.navigate('Auth');
        }
      } else {
        Alert.alert('Invalid Code', 'The verification code you entered is incorrect.');
        setOtp(['', '', '', '']);
        inputs.current[0]?.focus();
      }
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    
    const newOtpCode = Math.floor(1000 + Math.random() * 9000).toString();
    setCurrentOtp(newOtpCode);
    
    try {
      const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
        method: 'POST',
        headers: {
          'api-key': 'UEJrVktDRnBqeWZpdmxXSG1WbHk',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: 'BorlaWura',
          message: `Your BorlaWura verification code is: ${newOtpCode}`,
          recipients: [phoneNumber]
        })
      });
      
      const data = await response.json();
      console.log('Resend SMS Response:', data);
      
      // Trigger a local push notification with the OTP
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "BorlaWura Verification",
            body: `Your new verification code is: ${newOtpCode}`,
            sound: true,
          },
          trigger: null, // Send immediately
        });
      }
      
      setIsResending(false);
      setTimer(30);
      Alert.alert('Success', 'A new verification code has been sent to your phone.');
    } catch (error) {
      console.error('Failed to resend OTP:', error);

      // Still try to show the notification as a fallback
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "BorlaWura Verification",
            body: `Your new verification code is: ${newOtpCode} (Fallback)`,
            sound: true,
          },
          trigger: null,
        });
      }

      setIsResending(false);
      setTimer(30);
      Alert.alert('Notice', 'Failed to send SMS code, but a fallback code was generated.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Enter the code</Text>
          <Text style={styles.subtitle}>
            A 4-digit code was sent to <Text style={styles.bold}>{phoneNumber}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputs.current[index] = ref; }}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <View style={styles.footer}>
            {timer > 0 ? (
              <Text style={styles.resendText}>Resend code in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={isResending}>
                {isResending ? (
                  <ActivityIndicator color="#32BA7C" style={{ marginBottom: 20 }} />
                ) : (
                  <Text style={styles.resendLink}>Resend code</Text>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.helpButton}>
              <Text style={styles.helpText}>I didn't receive a code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 40,
  },
  bold: {
    fontWeight: 'bold',
    color: '#000',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  otpInput: {
    width: 60,
    height: 70,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  footer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  resendLink: {
    fontSize: 14,
    color: '#32BA7C',
    fontWeight: '600',
    marginBottom: 20,
  },
  helpButton: {
    marginTop: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
});

export default OTPPage;
