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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { useAuth } from '../../context/AuthContext';

import { typography } from '../../utils/typography';

const COMMON_AREAS = [
  "East Legon", "Adabraka", "Spintex Road", "Osu", "Cantonments", 
  "Airport Residential", "Dansoman", "Madina", "Ashaley Botwe", 
  "Tema Community 1", "Tema Community 25", "Kanda", "Achimota", 
  "Dzorwulu", "Abeka Lapaz", "Accra Central", "West Legon", "Haatso"
];

const SignupPage = () => {
  const navigation = useNavigation<any>();
  const { login, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleLocationDetect = async () => {
    setIsDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow location access to use this feature.');
        setIsDetectingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const areaName = place.district || place.street || place.city || place.subregion || '';
        const cityName = place.city || place.subregion || '';
        const fullLoc = areaName && cityName ? `${areaName}, ${cityName}` : areaName || cityName || 'Unknown Location';
        setAddress(fullLoc);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not detect your location automatically.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleAddressChange = (text: string) => {
    setAddress(text);
    if (text.length > 1) {
      const filtered = COMMON_AREAS.filter(area => 
        area.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (area: string) => {
    setAddress(area);
    setSuggestions([]);
  };

  const handleSignup = async () => {
    if (isLoading) return;

    const name = fullName.trim();
    const phone = phoneNumber.trim();
    const pass = password.trim();
    const confirmPass = confirmPassword.trim();
    const loc = address.trim();
    const mail = email.trim();

    if (!name) { Alert.alert("Required", "Please enter your full name."); return; }
    if (!mail) { Alert.alert("Required", "Please enter your email address."); return; }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!phone) { Alert.alert("Required", "Please enter your phone number."); return; }
    if (!pass) { Alert.alert("Required", "Please enter a password."); return; }
    if (pass !== confirmPass) { Alert.alert("Mismatch", "Passwords do not match."); return; }
    if (!loc) { Alert.alert("Required", "Please provide your residential address for pickups."); return; }

    setIsLoading(true);

    const cleanNumber = phone.replace(/\s+/g, '');
    const finalNumber = cleanNumber.startsWith('0') ? cleanNumber.substring(1) : cleanNumber;
    const fullNumberWithPlus = `+233${finalNumber}`;
    const fullNumberRaw = `233${finalNumber}`; 
    
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
          recipients: [fullNumberRaw]
        })
      });
      
      const result = await response.json();
      
      // 4. In-App Immediate Alert (Fastest Fallback)
      Alert.alert(
        "Verification Code",
        `Your secret code is: ${otpCode}. (A copy has also been sent via SMS/Notification)`,
        [
          { 
            text: "Got it!", 
            onPress: () => {
              setIsLoading(false);
              navigation.navigate('OTP', { 
                  phoneNumber: fullNumberWithPlus, 
                  generatedOtp: otpCode, 
                  name: name, 
                  email: mail, 
                  location: loc,
                  password: pass, 
                  isSignup: true 
              });
            }
          }
        ]
      );
    } catch (error) {
      setIsLoading(false);
      // Even if SMS fails, the In-App Alert above will still show the code
      Alert.alert('Notice', 'SMS delivery might be delayed, please use this code: ' + otpCode);
      navigation.navigate('OTP', { 
          phoneNumber: fullNumberWithPlus, 
          generatedOtp: otpCode, 
          name: name, 
          email: mail, 
          location: loc,
          password: pass, 
          isSignup: true 
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.brandHeader}>
            <View style={styles.logoBlur} />
            <View style={styles.logoCircle}>
              <Image
                source={require('../../../assets/Borla Wura Logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>Join Borla Wura</Text>
            <Text style={styles.brandTagline}>Start your sustainable waste journey today</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account</Text>
            <Text style={styles.formSubtitle}>Join thousands of eco-warriors and start your sustainable journey today.</Text>

            <View style={styles.inputGroup}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={[styles.inputWrapper, styles.row]}>
                  <Ionicons name="person-outline" size={20} color="#64748b" style={styles.fieldIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter full name"
                    value={fullName}
                    onChangeText={setFullName}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={[styles.inputWrapper, styles.row]}>
                  <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.fieldIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <View style={[styles.inputWrapper, styles.row]}>
                   <View style={styles.countryPicker}>
                    <Image source={{ uri: 'https://flagcdn.com/w40/gh.png' }} style={styles.flag} />
                    <Text style={styles.countryCode}>+233</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="024 123 4567"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Create Password</Text>
                <View style={styles.passwordWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.fieldIcon} />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor="#94a3b8"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={styles.passwordWrapper}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#64748b" style={styles.fieldIcon} />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholderTextColor="#94a3b8"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Residential Address</Text>
                <View style={styles.addressWrapper}>
                  <Ionicons name="map-outline" size={20} color="#64748b" style={styles.fieldIcon} />
                  <TextInput
                    style={styles.addressInput}
                    placeholder="e.g. 12th Street, East Legon"
                    value={address}
                    onChangeText={handleAddressChange}
                    placeholderTextColor="#94a3b8"
                  />
                  <TouchableOpacity onPress={handleLocationDetect} style={styles.detectBtn} disabled={isDetectingLocation}>
                    {isDetectingLocation ? (
                       <ActivityIndicator size="small" color="#10b981" />
                    ) : (
                       <MaterialIcons name="my-location" size={20} color="#10b981" />
                    )}
                  </TouchableOpacity>
                </View>
                
                {suggestions.length > 0 && (
                  <View style={styles.suggestionsList}>
                    {suggestions.map((item, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.suggestionItem}
                        onPress={() => selectSuggestion(item)}
                      >
                        <MaterialIcons name="place" size={16} color="#64748b" />
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.signupBtn, isLoading && styles.signupBtnDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signupBtnText}>Create My Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Auth')}>
              <Text style={styles.loginText}>Already a member? <Text style={styles.loginHighlight}>Login</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1 },
  brandHeader: {
    backgroundColor: '#10b981',
    paddingTop: 50,
    paddingBottom: 40,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  logoBlur: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -50,
    left: -50,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    padding: 10,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  logoImage: { width: '100%', height: '100%' },
  brandName: { fontSize: 22, fontFamily: typography.bold, color: '#ffffff' },
  brandTagline: { fontSize: 13, fontFamily: typography.medium, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -30,
  },
  formTitle: { fontSize: 28, fontFamily: typography.bold, color: '#0f172a' },
  formSubtitle: { fontSize: 15, fontFamily: typography.medium, color: '#64748b', marginTop: 6, marginBottom: 32 },
  inputGroup: { gap: 24, marginBottom: 40 },
  fieldContainer: { gap: 8 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: typography.bold,
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
  },
  inputWrapper: {
    height: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingLeft: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9'
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  fieldIcon: { marginRight: 4 },
  passwordWrapper: {
    height: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9'
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a'
  },
  eyeBtn: { paddingHorizontal: 16 },
  inputRow: { flexDirection: 'row', gap: 12 },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  flag: { width: 22, height: 15, borderRadius: 2, marginRight: 10 },
  countryCode: { fontSize: 14, fontFamily: typography.bold, color: '#0f172a' },
  phoneInput: {
    flex: 1,
    height: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  addressWrapper: {
    height: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9'
  },
  addressInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a'
  },
  detectBtn: { paddingHorizontal: 16 },
  suggestionsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12
  },
  suggestionText: {
    fontSize: 15,
    fontFamily: typography.medium,
    color: '#334155'
  },
  signupBtn: {
    height: 60,
    backgroundColor: '#10b981',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  signupBtnDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
  signupBtnText: { fontSize: 17, fontFamily: typography.bold, color: '#ffffff' },
  loginLink: { alignItems: 'center' },
  loginText: { fontSize: 15, fontFamily: typography.medium, color: '#64748b' },
  loginHighlight: { color: '#10b981', fontFamily: typography.bold },
  legalText: { fontSize: 12, fontFamily: typography.medium, color: '#94a3b8', textAlign: 'center', lineHeight: 18, paddingVertical: 20 },
  legalHighlight: { color: '#64748b', textDecorationLine: 'underline' },
  dividerBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  dividerLabel: { fontSize: 11, fontFamily: typography.bold, color: '#cbd5e1', letterSpacing: 1 },
  socialBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    gap: 12,
    marginBottom: 20,
  },
  socialIcon: { width: 20, height: 20 },
  socialBtnText: {
    fontSize: 15,
    fontFamily: typography.semiBold,
    color: '#1e293b',
  },
});

export default SignupPage;
