import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.circle),
      useNativeDriver: true,
    }).start(() => {
      router.push('/introVideo');
      scaleAnim.setValue(0);
    });
  };

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
  });

  return (
    <View style={styles.container}>
      {/* ANIMATED CIRCLE */}
      <Animated.View
        style={[styles.circle, { transform: [{ scale }] }]}
      />

      {/* LOGO */}
      <Image
        source={require('../assets/images/logo3.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* APP NAME */}
      <Text style={styles.appName}>Skin Alyst</Text>

      {/* TAGLINE */}
      <Text style={styles.subtitle}>
        Your Personalized Skin Care Companion
      </Text>

      {/* BUTTON */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={handlePress}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0', // light pink background
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 120,
    paddingHorizontal: 20,
  },

  logo: {
    width: 180,
    height: 100,
    marginBottom: 16,
  },

 appName: {
  fontSize: 44, // slightly bigger for emphasis
  color: '#F7C6D0', // pastel pink base
  fontFamily: 'AlexBrush-Regular',
  letterSpacing: 2, // more elegant spacing
  marginBottom: 12,
  fontWeight: 'bold',
  textShadowColor: '#F28BA8', // darker pink for border effect
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 1,
},
  subtitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
    paddingHorizontal: 10,
  },

  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 50, // space from bottom
    width: '100%',
    alignItems: 'center',
  },

  button: {
    backgroundColor: '#F28BA8',
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 10,
    shadowColor: '#F28BA8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    letterSpacing: 0.5,
  },

  circle: {
    position: 'absolute',
    width: 150,
    height: 150,
    backgroundColor: 'rgba(242,139,168,0.3)',
    borderRadius: 75,
    top: '50%',
    left: '50%',
    marginLeft: -75,
    marginTop: -75,
    zIndex: 1,
  },
});