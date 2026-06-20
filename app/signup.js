import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import StatusModal from './components/StatusModal';
import { registerUser, uploadProfileImage } from '../firebase/user';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('error');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalButton, setModalButton] = useState('OK');

  const pickProfileImage = () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Camera', onPress: async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!result.canceled) setProfileImage(result.assets[0].uri);
      }},
      { text: 'Gallery', onPress: async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!result.canceled) setProfileImage(result.assets[0].uri);
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword || !age || !gender) {
      setModalType('error');
      setModalTitle('Incomplete Details');
      setModalMessage('Please fill all fields, including age and gender.');
      setModalButton('OK');
      setModalVisible(true);
      return;
    }
    if (!email.includes('@')) {
      setModalType('error');
      setModalTitle('Invalid Email');
      setModalMessage('Enter a valid email address.');
      setModalButton('Try Again');
      setModalVisible(true);
      return;
    }
    if (password.length < 6) {
      setModalType('error');
      setModalTitle('Weak Password');
      setModalMessage('Password must be at least 6 characters.');
      setModalButton('Try Again');
      setModalVisible(true);
      return;
    }
    if (password !== confirmPassword) {
      setModalType('error');
      setModalTitle('Passwords Do Not Match');
      setModalMessage('Confirm password must match the password.');
      setModalButton('Try Again');
      setModalVisible(true);
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      setModalType('error');
      setModalTitle('Invalid Age');
      setModalMessage('Enter a valid age.');
      setModalButton('OK');
      setModalVisible(true);
      return;
    }
    try {
      setUploading(true);
      await registerUser({ name, email, password, age: ageNum, gender });
      if (profileImage) {
        await uploadProfileImage(profileImage).catch(() => {});
      }
      setModalType('success');
      setModalTitle('Account Created');
      setModalMessage('Welcome to Skinalyst.');
      setModalButton('Continue');
      setModalVisible(true);
    } catch (e) {
      const code = e?.code || 'unknown';
      let msg = 'Unable to create account.';
      if (code === 'auth/email-already-in-use') msg = 'Email is already in use.';
      else if (code === 'auth/invalid-email') msg = 'Email address is invalid.';
      else if (code === 'auth/weak-password') msg = 'Password is too weak.';
      else if (code === 'firebase_not_initialized') msg = 'Firebase not initialized.';
      setModalType('error');
      setModalTitle('Signup Failed');
      setModalMessage(msg);
      setModalButton('OK');
      setModalVisible(true);
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{flex: 1}}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* LOGO SECTION */}
        <View style={styles.logoWrapper}>
          <Image source={require('../assets/images/logo3.png')} style={styles.logo} />
        </View>

        <Text style={styles.title}>Join Skinalyst ✨</Text>
        <Text style={styles.subtitle}>Unlock your best skin ever</Text>

        {/* PROFILE PHOTO PICKER */}
        <TouchableOpacity style={styles.avatarPicker} onPress={pickProfileImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarPreview} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={38} color="#E75480" />
            </View>
          )}
          <View style={styles.avatarCamBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Add profile photo (optional)</Text>

        <View style={styles.inputContainer}>
          {/* Full Name Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#E75480" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Full Name" 
              placeholderTextColor="#999"
              selectionColor="#E75480"
              value={name} 
              onChangeText={setName} 
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#E75480" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Email Address" 
              placeholderTextColor="#999"
              selectionColor="#E75480"
              keyboardType="email-address" 
              value={email} 
              onChangeText={setEmail} 
            />
          </View>
          <View style={styles.inputWrapper}>
            <Ionicons name="calendar-outline" size={20} color="#E75480" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Age" 
              placeholderTextColor="#999"
              selectionColor="#E75480"
              keyboardType="numeric" 
              value={age} 
              onChangeText={setAge} 
            />
          </View>
          <View style={styles.genderContainer}>
            {['Male', 'Female', 'Other'].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderOption, gender === g && styles.genderSelected]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#E75480" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Password" 
              placeholderTextColor="#999"
              selectionColor="#E75480"
              secureTextEntry 
              value={password} 
              onChangeText={setPassword} 
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputWrapper}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#E75480" style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Confirm Password" 
              placeholderTextColor="#999"
              selectionColor="#E75480"
              secureTextEntry 
              value={confirmPassword} 
              onChangeText={setConfirmPassword} 
            />
          </View>
        </View>

        {/* Register Button */}
        <TouchableOpacity style={[styles.button, uploading && { opacity: 0.7 }]} onPress={handleSignup} disabled={uploading}>
          {uploading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Register Now</Text>}
        </TouchableOpacity>

        {/* Footer Links */}
        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.footerLink}>
          <Text style={styles.footerText}>Already a member? <Text style={styles.linkText}>Sign In</Text></Text>
        </TouchableOpacity>

        {/* Guest Button */}
        <TouchableOpacity style={styles.guestButton} onPress={() => router.replace('/guest')}>
          <Text style={styles.guestButtonText}>Try as Guest</Text>
        </TouchableOpacity>

      </ScrollView>
      <StatusModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        primaryLabel={modalButton}
        onPrimary={() => {
          if (modalType === 'success') {
            setModalVisible(false);
            router.replace('/allergyprofile');
          } else {
            setModalVisible(false);
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    backgroundColor: '#FFF9F6', 
    alignItems: 'center', 
    justifyContent: 'flex-start', 
    paddingVertical: 30, 
    paddingHorizontal: 25 
  },
  logoWrapper: {
    elevation: 4,
    shadowColor: '#E75480',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 25
  },
  logo: { width: 90, height: 90, resizeMode: 'contain' },

  title: { fontSize: 30, color: '#333', marginBottom: 6, fontFamily: 'Nunito-ExtraBold' },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 25, fontFamily: 'Nunito-Regular' },

  inputContainer: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDEEF4',
    height: 55,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333', fontFamily: 'Nunito-Regular' },
  genderContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  genderOption: { paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#FDEEF4', borderRadius: 20, backgroundColor: '#fff' },
  genderSelected: { borderColor: '#E75480', backgroundColor: '#FFE3ED' },
  genderText: { fontSize: 14, fontFamily: 'Nunito-SemiBold', color: '#333' },
  genderTextSelected: { color: '#E75480' },

  button: { 
    backgroundColor: '#E75480', 
    paddingVertical: 16, 
    width: '100%', 
    borderRadius: 20, 
    alignItems: 'center', 
    marginTop: 20,
    elevation: 5,
    shadowColor: '#E75480',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  buttonText: { color: '#fff', fontSize: 18, letterSpacing: 0.5, fontFamily: 'Nunito-Bold' },
  
  footerLink: { marginTop: 22 },
  footerText: { fontSize: 16, color: '#666', fontFamily: 'Nunito-Regular' },
  linkText: { color: '#E75480', fontFamily: 'Nunito-Bold' },
  
  guestButton: { marginTop: 18, paddingVertical: 10 },
  guestButtonText: { color: '#072360', fontSize: 16, textDecorationLine: 'underline', fontFamily: 'Nunito-SemiBold' },

  avatarPicker: { position: 'relative', marginBottom: 6 },
  avatarPreview: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#E75480' },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#FFE3ED', borderWidth: 2, borderColor: '#E75480',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarCamBadge: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: '#E75480', width: 26, height: 26,
    borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFF9F6',
  },
  avatarHint: { fontSize: 12, color: '#aaa', fontFamily: 'Nunito-Regular', marginBottom: 18 },
});
