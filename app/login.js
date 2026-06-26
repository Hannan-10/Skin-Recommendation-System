import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import StatusModal from './components/StatusModal';
import { loginUser } from '../firebase/user';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('error');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalButton, setModalButton] = useState('OK');

  const handleLogin = async () => {
    const validEmail = !!email && email.includes('@');
    const validPassword = !!password && password.length >= 6;
    if (!validEmail || !validPassword) {
      setModalType('error');
      setModalTitle('Login Failed');
      setModalMessage('Enter a valid email and a password of at least 6 characters.');
      setModalButton('Try Again');
      setModalVisible(true);
      return;
    }
    setLoading(true);
    try {
      await loginUser({ email, password });
      setModalType('success');
      setModalTitle('Welcome');
      setModalMessage('Logged in successfully.');
      setModalButton('Continue');
      setModalVisible(true);
    } catch (e) {
      setModalType('error');
      setModalTitle('Login Failed');
      setModalMessage('Incorrect email or password.');
      setModalButton('Try Again');
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* 🔙 Back Arrow */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/signup')}>
            <Ionicons name="arrow-back" size={26} color="#E75480" />
          </TouchableOpacity>

          {/* 🧴 Header Image */}
          <View style={styles.imageWrapper}>
            <Image 
              // source={require('../assets/images/main.webp')}
                source={require('../assets/images/login.jpg')} 
 
              style={styles.mainImage} 
            />
            {/* ⚪ Circular Logo Overlay (Optimized Size) */}
            <View style={styles.logoCircle}>
              <Image 
                source={require('../assets/images/logo3.png')} 
                style={styles.logo} 
                resizeMode="contain" 
              />
            </View>
          </View>

          {/* 📝 Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.welcomeTitle}>Welcome Back!</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#000" style={styles.icon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Email Address" 
                  placeholderTextColor="#999"
                  selectionColor="#E75480"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#000" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  selectionColor="#E75480"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#aaa" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => router.push('/forgetpassword')}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotTextBlue}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/signup')} style={styles.footer}>
              <Text style={styles.footerText}>New here? <Text style={styles.signUpLink}>Sign Up</Text></Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      <StatusModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        primaryLabel={modalButton}
        onPrimary={() => {
          if (modalType === 'success') {
            setModalVisible(false);
            router.replace('/home');
          } else {
            setModalVisible(false);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF9F6' },
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, alignItems: 'center' },
  
  backButton: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 10 : 40, 
    left: 20, 
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 6
  },

  imageWrapper: { width: '100%', height: 260, position: 'relative' },
  mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  // ✨ Fixed Circular Logo Styling
  logoCircle: {
    position: 'absolute',
    bottom: -35, // Size ke mutabiq adjustment
    alignSelf: 'center',
    width: 75,   // Size chota kar diya (80-90 se kam)
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  logo: { 
    width: '80%', // Circle ke andar fit rahay ga
    height: '80%', 
  },

  formCard: { 
    width: '100%', 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    marginTop: -20, 
    paddingTop: 55, // Extra space taake Welcome Back text aur logo mein gap ho
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  
  welcomeTitle: { 
    fontSize: 24, 
    fontFamily: 'Nunito-ExtraBold', 
    color: '#330033', 
    marginTop: 10, // Logo se mazeed door karne ke liye
    marginBottom: 25 
  },

  inputGroup: { width: '100%' },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9F9F9', 
    borderRadius: 15, 
    marginBottom: 15, 
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#eee',
    height: 55
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333', fontFamily: 'Nunito-Regular' },
  eyeBtn: { paddingLeft: 8 },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotTextBlue: { 
    color: '#007AFF', 
    fontFamily: 'Nunito-SemiBold', 
    textDecorationLine: 'underline' 
  },

  loginBtn: { 
    backgroundColor: '#E75480', 
    width: '100%', 
    padding: 16, 
    borderRadius: 15, 
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#E75480',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }
  },
  loginBtnText: { color: '#fff', fontSize: 18, fontFamily: 'Nunito-Bold' },

  footer: { marginTop: 25 },
  footerText: { color: '#666', fontSize: 16, fontFamily: 'Nunito-Regular' },
  signUpLink: { color: '#E75480', fontFamily: 'Nunito-Bold' }
});
