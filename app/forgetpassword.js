// import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';

// export default function ForgotPassword() {
//   const router = useRouter();

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
//         <Ionicons name="arrow-back" size={24} color="#E75480" />
//       </TouchableOpacity>

//       <Text style={styles.title}>Reset Password</Text>
//       <Text style={styles.subtitle}>Enter your email to receive a reset link.</Text>

//       <TextInput style={styles.input} placeholder="Enter your email" keyboardType="email-address" />

//       <TouchableOpacity style={styles.button} onPress={() => alert('Reset link sent!')}>
//         <Text style={styles.buttonText}>Send Link</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 25, backgroundColor: '#FFF9F6', justifyContent: 'center' },
//   backButton: { position: 'absolute', top: 50, left: 20 },
//   title: { fontSize: 24, fontWeight: 'bold', color: '#330033', marginBottom: 10, textAlign: 'center' },
//   subtitle: { fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center' },
//   input: { backgroundColor: '#fff', padding: 15, borderRadius: 25, elevation: 2, marginBottom: 20 },
//   button: { backgroundColor: '#72284b', padding: 10, borderRadius: 5, alignItems: 'center' },
//   buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
// });


import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import StatusModal from './components/StatusModal';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('error');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalButton, setModalButton] = useState('OK');

  const handleResetRequest = () => {
    if (!email.trim()) {
      setModalType('error');
      setModalTitle('Missing Email');
      setModalMessage('Please enter your email address to receive a reset link.');
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
    setModalType('success');
    setModalTitle('Link Sent');
    setModalMessage(`A password reset link has been sent to: ${email}`);
    setModalButton('OK');
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#E75480" />
      </TouchableOpacity>

      <View style={styles.iconContainer}>
         <Ionicons name="lock-open-outline" size={80} color="#E75480" />
      </View>

      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your email to receive a reset link.</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Enter your email" 
        placeholderTextColor="#999"
        selectionColor="#E75480"
        keyboardType="email-address" 
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleResetRequest}>
        <Text style={styles.buttonText}>Send Link</Text>
      </TouchableOpacity>
      <StatusModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        primaryLabel={modalButton}
        onPrimary={() => {
          if (modalType === 'success') {
            setModalVisible(false);
            router.back();
          } else {
            setModalVisible(false);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, backgroundColor: '#FFF9F6', justifyContent: 'center' },
  backButton: { position: 'absolute', top: 50, left: 20 },
  iconContainer: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, color: '#333', marginBottom: 10, textAlign: 'center', fontFamily: 'Nunito-ExtraBold' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 30, textAlign: 'center', paddingHorizontal: 10, fontFamily: 'Nunito-Regular' },
  input: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 25, 
    elevation: 2, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDEEF4',
    fontFamily: 'Nunito-Regular'
  },
  button: { 
    backgroundColor: '#E75480',
    padding: 15, 
    borderRadius: 30, 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#E75480',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  buttonText: { color: '#fff', fontSize: 18, fontFamily: 'Nunito-Bold' }
});
