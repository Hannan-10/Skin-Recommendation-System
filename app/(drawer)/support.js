import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import StatusModal from '../components/StatusModal';
import ScreenHeader from '../components/ScreenHeader';

export default function SupportScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [openIndex, setOpenIndex] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalButton, setModalButton] = useState('OK');

  const handleSubmit = () => {
    if (!name.trim()) {
      setModalType('error');
      setModalTitle('Missing Name');
      setModalMessage('Please enter your name.');
      setModalButton('OK');
      setModalVisible(true);
      return;
    }
    if (!email.trim()) {
      setModalType('error');
      setModalTitle('Missing Email');
      setModalMessage('Please enter your email address.');
      setModalButton('OK');
      setModalVisible(true);
      return;
    }
    if (!message.trim()) {
      setModalType('error');
      setModalTitle('Missing Message');
      setModalMessage('Please enter your message.');
      setModalButton('OK');
      setModalVisible(true);
      return;
    }
    setModalType('success');
    setModalTitle('Message Sent');
    setModalMessage('Your message has been sent successfully.');
    setModalButton('OK');
    setModalVisible(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  const faqs = [
    {
      question: "How to track my skin analysis?",
      answer: "Go to the Scan tab → check your analysis history for all previous scans."
    },
    {
      question: "How to edit my profile?",
      answer: "Click on the Profile tab → tap Edit button to update your information."
    },
    {
      question: "How to view my history?",
      answer: "All past routines and scans are in Home Dashboard → History section."
    },
    {
      question: "How to set skincare reminders?",
      answer: "Go to Home → tap Reminders → set your preferred time for routines."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <ScreenHeader title="Support" onBack={() => router.replace('/(drawer)/(tabs)/home')} />
      <Text style={styles.sectionTitle}>FAQs</Text>
      {faqs.map((item, index) => (
        <View key={index} style={styles.faqBox}>
          <TouchableOpacity style={styles.faqHeader} onPress={() => toggleFAQ(index)}>
            <Text style={styles.faqText}>{item.question}</Text>
            <Ionicons
              name={openIndex === index ? 'remove-circle-outline' : 'add-circle-outline'}
              size={22}
              color="#E75480"
            />
          </TouchableOpacity>
          {openIndex === index && (
            <Text style={styles.answer}>{item.answer}</Text>
          )}
        </View>
      ))}

      {/* Contact Form */}
      <Text style={styles.sectionTitle}>Contact Us</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="Your Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Message"
          value={message}
          onChangeText={setMessage}
          multiline
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Send Message</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Info Cards */}
      <Text style={styles.sectionTitle}>Contact Information</Text>
      <View style={styles.contactCard}>
        <Ionicons name="mail-outline" size={24} color="#E75480" />
        <Text style={styles.contactText}>support@skinalyst.com</Text>
      </View>
      <View style={styles.contactCard}>
        <Ionicons name="call-outline" size={24} color="#E75480" />
        <Text style={styles.contactText}>+92-XXX-XXXXXXX</Text>
      </View>
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F6',
    padding: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backBtn: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#E75480',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  headerTitle: {
    fontSize: 20,
    color: '#333',
    fontFamily: 'Nunito-ExtraBold'
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Nunito-ExtraBold',
    color: '#000',
    marginVertical: 15,
  },
  faqBox: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqText: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    color: '#333',
    flex: 1,
    paddingRight: 10,
  },
  answer: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
    color: '#555',
    lineHeight: 20,
  },
  form: {
    marginBottom: 25,
  },
  input: {
    borderWidth: 1,
    borderColor: '#FFD1E1',
    padding: 12,
    borderRadius: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontFamily: 'Nunito-Regular',
    color: '#333',
  },
  button: {
    backgroundColor: '#E75480',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#E75480',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE3ED',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    elevation: 2,
  },
  contactText: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#333',
  },
});
