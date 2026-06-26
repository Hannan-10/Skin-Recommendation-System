import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { firebaseApp, auth, db, storage, validateFirebaseConfig } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

// Show notifications even when app is in foreground (global handler)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [loaded] = useFonts({
    'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    'Nunito-SemiBold': require('../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-ExtraBold': require('../assets/fonts/Nunito-ExtraBold.ttf'),
    'Nunito-Italic': require('../assets/fonts/Nunito-Italic.ttf'),
    'Nunito-BoldItalic': require('../assets/fonts/Nunito-BoldItalic.ttf'),
    'GreatVibes-Regular': require('../assets/fonts/GreatVibes-Regular.ttf'),
    'AlexBrush-Regular': require('../assets/fonts/AlexBrush-Regular.ttf'),
  });

  const [showPermModal, setShowPermModal] = useState(false);

  useEffect(() => {
    // Firebase health check
    const status = validateFirebaseConfig();
    console.log('[firebase] config ready:', status.ready, 'missing:', status.missing);
    if (firebaseApp) {
      console.log('[firebase] project:', firebaseApp.options?.projectId);
      console.log('[firebase] services:', { auth: !!auth, db: !!db, storage: !!storage });
      (async () => {
        if (db) {
          try {
            const snap = await getDoc(doc(db, '__health__', 'ping'));
            console.log('[firebase] firestore reachable:', true, 'exists:', snap.exists());
          } catch (e: any) {
            const code = e?.code ?? 'unknown';
            const reachable = code !== 'network-request-failed' && code !== 'unavailable';
            console.log('[firebase] firestore reachable:', reachable, 'error:', code);
          }
        }
      })();
    } else {
      console.log('[firebase] app not initialized');
    }

    // Ask for notification permission on first launch
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'undetermined') {
        // Small delay so the app finishes rendering before showing the modal
        setTimeout(() => setShowPermModal(true), 1200);
      }
    })();
  }, []);

  const handleEnable = async () => {
    setShowPermModal(false);
    await Notifications.requestPermissionsAsync();
  };

  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />

      {/* First-launch notification permission modal */}
      <Modal visible={showPermModal} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="notifications" size={38} color="#E75480" />
            </View>
            <Text style={styles.title}>Stay on Track</Text>
            <Text style={styles.desc}>
              Skinalyst would like to send you daily reminders to help you stay consistent with your skincare routine.
            </Text>
            <TouchableOpacity style={styles.enableBtn} onPress={handleEnable}>
              <Ionicons name="notifications-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.enableText}>Allow Notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.laterBtn} onPress={() => setShowPermModal(false)}>
              <Text style={styles.laterText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  card: {
    width: '84%', backgroundColor: '#fff', borderRadius: 28,
    padding: 30, alignItems: 'center',
  },
  iconWrap: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#FFE3ED', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 21, fontFamily: 'Nunito-ExtraBold', color: '#330033',
    marginBottom: 12, textAlign: 'center',
  },
  desc: {
    fontSize: 14, fontFamily: 'Nunito-Regular', color: '#666',
    textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  enableBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E75480', paddingVertical: 15, paddingHorizontal: 28,
    borderRadius: 18, width: '100%', marginBottom: 14,
  },
  enableText: { color: '#fff', fontFamily: 'Nunito-Bold', fontSize: 15 },
  laterBtn: { paddingVertical: 8 },
  laterText: { color: '#aaa', fontFamily: 'Nunito-SemiBold', fontSize: 14 },
});
