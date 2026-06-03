import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { firebaseApp, auth, db, storage, validateFirebaseConfig } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

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
  useEffect(() => {
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
  }, []);
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
    </GestureHandlerRootView>
  );
}
