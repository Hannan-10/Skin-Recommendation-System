import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusModal from './components/StatusModal';
import { getCurrentUserProfile, updateUserProfile } from '../firebase/user';

export default function ProfileSetup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('error');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalButton, setModalButton] = useState('OK');

  useEffect(() => {
    (async () => {
      const p = await getCurrentUserProfile();
      if (p) {
        setName(p.name || '');
        setEmail(p.email || '');
        setAge(String(p.age || ''));
        setGender(p.gender || null);
      }
    })();
  }, []);

  const handleContinue = async () => {
    if (!name.trim()) {
      setModalType('error');
      setModalTitle('Missing Name');
      setModalMessage('Please enter your name.');
      setModalButton('OK');
      setModalVisible(true);
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setModalType('error');
      setModalTitle('Invalid Email');
      setModalMessage('Enter a valid email address.');
      setModalButton('OK');
      setModalVisible(true);
      return;
    }
    if (!age.trim()) {
      setModalType('error');
      setModalTitle('Missing Age');
      setModalMessage('Please enter your age.');
      setModalButton('OK');
      setModalVisible(true);
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      setModalType('error');
      setModalTitle('Invalid Age');
      setModalMessage('Enter a valid age.');
      setModalButton('Try Again');
      setModalVisible(true);
      return;
    }
    try {
      await updateUserProfile({ name, email, age: ageNum, gender: gender || undefined });
      setModalType('success');
      setModalTitle('Profile Updated');
      setModalMessage('Your profile has been updated successfully.');
      setModalButton('OK');
      setModalVisible(true);
    } catch (e) {
      setModalType('error');
      setModalTitle('Update Failed');
      setModalMessage('Unable to update profile.');
      setModalButton('OK');
      setModalVisible(true);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* --- LOGO --- */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/logo3.png')} 
          style={styles.logo} 
        />
        <Text style={styles.welcomeText}>Setup Your Profile</Text>
        <Text style={styles.subtitleText}>A few details to personalize your experience</Text>
      </View>

      {/* NAME */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput 
        placeholder="e.g., John Doe" 
        style={styles.input} 
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />

      {/* EMAIL */}
      <Text style={styles.label}>Email</Text>
      <TextInput 
        placeholder="e.g., john@example.com" 
        style={styles.input} 
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* AGE */}
      <Text style={styles.label}>Age</Text>
      <TextInput 
        placeholder="e.g., 25" 
        style={styles.input} 
        keyboardType="numeric" 
        placeholderTextColor="#aaa"
        value={age}
        onChangeText={setAge}
      />

      {/* GENDER */}
      <Text style={styles.label}>Gender (Optional)</Text>
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


      {/* CONTINUE BUTTON */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleContinue} 
      >
        <Text style={styles.buttonText}>Continue</Text>
        <Ionicons name="arrow-forward-outline" size={22} color="#fff" style={{ marginLeft: 8 }} />
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
            router.replace('/profile');
          } else {
            setModalVisible(false);
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    backgroundColor: '#FFF9F6', 
    flexGrow: 1 
  },

  // LOGO
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: '#E75480',
    marginTop: 12,
  },
  subtitleText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#555',
    marginTop: 4,
    textAlign: 'center'
  },

  // LABELS
  label: { 
    fontWeight: '700', 
    marginBottom: 8, 
    color: '#333', 
    fontFamily: 'Nunito-Bold'
  },

  // INPUTS
  input: { 
    backgroundColor: '#fff', 
    padding: 14, 
    borderRadius: 16, 
    marginBottom: 18, 
    borderWidth: 1, 
    borderColor: '#FDE2E8',
    fontFamily: 'Nunito-Regular',
    fontSize: 16,
    color: '#333',
    shadowColor: '#E75480',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3
  },

  // GENDER
  genderContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 10, 
    marginBottom: 20 
  },
  genderOption: { 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderWidth: 1, 
    borderColor: '#FDE2E8', 
    borderRadius: 25, 
    backgroundColor: '#fff',
    shadowColor: '#E75480',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2
  },
  genderSelected: { 
    borderColor: '#E75480', 
    backgroundColor: '#FFE3ED' 
  },
  genderText: { 
    fontSize: 15, 
    fontFamily: 'Nunito-SemiBold', 
    color: '#333' 
  },
  genderTextSelected: { color: '#E75480' },

  // BUTTON
  button: { 
    backgroundColor: '#E75480', 
    paddingVertical: 16, 
    borderRadius: 10, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#E75480',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5
  },
  buttonText: { 
    fontSize: 18, 
    color: '#fff', 
    fontFamily: 'Nunito-Bold' 
  }
});
