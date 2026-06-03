
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Guest() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔙 Back Arrow - Top Left */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.replace('/signup')}
      >
        <Ionicons name="arrow-back" size={26} color="#f8f4f5" />
      </TouchableOpacity>

      {/* 🌸 Top Illustration */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../assets/images/on2.jpg')} 
          style={styles.illustration}
        />
      </View>

      {/* 📦 Info Card */}
      <View style={styles.card}>
        <Image
          source={require('../assets/images/logo3.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome, Guest!</Text>
        <Text style={styles.subtitle}>
          Explore our AI skin analysis and personalized routines. Some features might require an account for saving progress.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/home')} // Guest ko direct home ya dashboard bhejein
        >
          <Text style={styles.buttonText}>Continue Exploring</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/login')}>
          <Text style={styles.loginLink}>Already have an account? <Text style={styles.loginLinkBold}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF9F6', 
    alignItems: 'center', 
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  imageContainer: {
    width: '100%',
    height: '40%',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#FDE2E8',
  },
  illustration: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  card: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 25,
    marginTop: -50, // Image ke upar overlay effect
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  logo: { 
    width: 60, 
    height: 60, 
    resizeMode: 'contain', 
    marginBottom: 15 
  },
  title: { 
    fontSize: 24, 
    fontFamily: 'Nunito-ExtraBold', 
    color: '#330033', 
    marginBottom: 10 
  },
  subtitle: { 
    fontSize: 15, 
    color: '#666', 
    textAlign: 'center', 
    lineHeight: 22,
    marginBottom: 25,
    fontFamily: 'Nunito-Regular' 
  },
  button: { 
    backgroundColor: '#E75480', 
    flexDirection: 'row',
    paddingVertical: 15, 
    width: '100%', 
    borderRadius: 15, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 6,
    shadowColor: '#E75480',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }
  },
  buttonText: { 
    color: '#fff', 
    fontFamily: 'Nunito-Bold', 
    fontSize: 16,
    marginRight: 10
  },
  loginLink: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
    fontFamily: 'Nunito-Regular'
  },
  loginLinkBold: {
    color: '#E75480',
    fontFamily: 'Nunito-Bold'
  }
});
