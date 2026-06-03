// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';

// export default function Chat() {
//   const router = useRouter();

//   return (
//     <View style={styles.container}>
//       {/* ⬅️ Back Arrow */}
//       <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
//         <Ionicons name="arrow-back" size={28} color="#E75480" />
//       </TouchableOpacity>

//       <Ionicons name="chatbubbles-outline" size={80} color="#E75480" />
      
//       <Text style={styles.title}>AI Skin Expert</Text>
      
//       <View style={styles.badge}>
//         <Text style={styles.badgeText}>COMING SOON</Text>
//       </View>

//       <Text style={styles.subtitle}>
//         Our AI bot will be here shortly to answer all your skincare questions 24/7.
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#FFF9F6', justifyContent: 'center', alignItems: 'center', padding: 30 },
//   backArrow: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
//   title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 15 },
//   badge: { backgroundColor: '#E75480', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginVertical: 15 },
//   badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
//   subtitle: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22 }
// });
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

export default function Chat() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#E75480" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Ionicons name="chatbubbles-outline" size={80} color="#E75480" />
        
        <Text style={styles.title}>AI Skin Expert</Text>
        
        <View style={styles.badge}>
          <Text style={styles.badgeText}>COMING SOON</Text>
        </View>

        <Text style={styles.subtitle}>
          Our AI bot will be here shortly to answer all your skincare questions 24/7.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F6' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  backArrow: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    zIndex: 10,
    padding: 10, 
  },
  title: { fontSize: 24, color: '#333', marginTop: 15, fontFamily: 'Nunito-ExtraBold' },
  badge: { backgroundColor: '#E75480', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginVertical: 15 },
  badgeText: { color: '#fff', fontSize: 12, fontFamily: 'Nunito-Bold' },
  subtitle: { fontSize: 15, color: '#888', textAlign: 'center', lineHeight: 22, fontFamily: 'Nunito-Regular' }
});
